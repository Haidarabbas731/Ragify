"""Document management API endpoints.

Handles document upload, processing status, listing, and management.
"""

from datetime import UTC, datetime

from arq import ArqRedis
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.core.config import settings
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.schemas.document import DocumentResponse, DocumentsListResponse
from app.services.b2_service import get_b2_service
from app.tasks.worker import get_arq_redis

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post(
    "/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED
)
async def upload_document(
    file: UploadFile = File(..., description="Document file (PDF, DOCX, TXT, MD)"),
    collection_id: str | None = Form(
        None, description="Optional collection ID to organize document"
    ),
    category: str | None = Form(None, description="Optional category tag"),
    tags: str | None = Form(None, description="Optional comma-separated tags"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    arq: ArqRedis = Depends(get_arq_redis),
) -> Document:
    """
    Upload a document for processing.

    Workflow:
    1. Validate file type and size
    2. Check user storage quota
    3. Upload file to B2 storage
    4. Create document record (status=PROCESSING)
    5. Enqueue background processing job
    6. Return document info immediately

    Args:
        file: Uploaded file
        collection_id: Optional collection to organize document
        category: Optional category tag
        tags: Optional comma-separated tags
        current_user: Authenticated user
        db: Database session
        arq: ARQ Redis connection

    Returns:
        Document record with status=PROCESSING

    Raises:
        HTTPException: 400 if validation fails, 413 if file too large or quota exceeded
    """
    # Validate file type
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required"
        )

    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in settings.allowed_file_types_list:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {settings.ALLOWED_FILE_TYPES}",
        )

    # Get file size without fully reading it
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    # Validate file size
    max_size_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    if file_size > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({file_size} bytes) exceeds maximum allowed size ({max_size_bytes} bytes)",
        )

    # Check user storage quota
    new_storage_used = current_user.storage_used_bytes + file_size
    if new_storage_used > current_user.storage_limit_bytes:
        remaining = current_user.storage_limit_bytes - current_user.storage_used_bytes
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Storage quota exceeded. Remaining: {remaining} bytes, Required: {file_size} bytes",
        )

    # Upload to B2 - B2Service generates the storage_key internally
    b2_service = await get_b2_service()
    try:
        storage_key = await b2_service.upload_file(file, current_user.user_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file to storage: {str(e)}",
        ) from e

    # Extract document_id from storage_key (format: documents/{user_id}/{uuid}-{filename})
    document_id = storage_key.split("/")[-1].split("-")[0]

    # Prepare metadata
    doc_metadata = {}
    if category:
        doc_metadata["category"] = category
    if tags:
        doc_metadata["tags"] = [tag.strip() for tag in tags.split(",")]

    # Create document record
    document = Document(
        document_id=document_id,
        user_id=current_user.user_id,
        collection_id=collection_id,
        filename=file.filename,
        file_type=file_extension,
        size_bytes=file_size,
        storage_key=storage_key,
        doc_metadata=doc_metadata,
        status=DocumentStatus.PROCESSING.value,
        uploaded_at=datetime.now(UTC),
    )

    db.add(document)

    # Update user storage
    current_user.storage_used_bytes = new_storage_used
    db.add(current_user)

    await db.commit()
    await db.refresh(document)

    # Enqueue background processing job
    try:
        await arq.enqueue_job(
            "process_document", document_id=document_id, user_id=current_user.user_id
        )
    except Exception as e:
        # If job enqueue fails, we still return the document
        # The orphaned job recovery will pick it up later
        print(f"Warning: Failed to enqueue processing job for {document_id}: {e}")

    return document


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Document:
    """
    Get document by ID.

    Args:
        document_id: Document ID
        current_user: Authenticated user
        db: Database session

    Returns:
        Document record

    Raises:
        HTTPException: 404 if document not found or not owned by user
    """
    result = await db.exec(
        select(Document).where(
            Document.document_id == document_id,
            Document.user_id == current_user.user_id,
        )
    )
    document = result.one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    return document


@router.get("", response_model=DocumentsListResponse)
async def list_documents(
    page: int = 1,
    limit: int = 50,
    collection_id: str | None = None,
    status_filter: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    List user documents with pagination and filters.

    Args:
        page: Page number (1-indexed)
        limit: Items per page (max 100)
        collection_id: Optional filter by collection
        status_filter: Optional filter by status (processing, active, error)
        current_user: Authenticated user
        db: Database session

    Returns:
        Paginated list of documents

    Raises:
        HTTPException: 400 if invalid parameters
    """
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Page must be >= 1"
        )

    if limit < 1 or limit > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Limit must be between 1 and 100",
        )

    # Build query
    query = select(Document).where(
        Document.user_id == current_user.user_id,
        Document.status != DocumentStatus.DELETED.value,  # Exclude deleted
    )

    if collection_id:
        query = query.where(Document.collection_id == collection_id)

    if status_filter:
        query = query.where(Document.status == status_filter)

    # Count total
    count_query = select(Document.document_id).where(
        Document.user_id == current_user.user_id,
        Document.status != DocumentStatus.DELETED.value,
    )
    if collection_id:
        count_query = count_query.where(Document.collection_id == collection_id)
    if status_filter:
        count_query = count_query.where(Document.status == status_filter)

    total_result = await db.exec(count_query)
    total = len(total_result.all())

    # Paginate
    offset = (page - 1) * limit
    query = (
        query.offset(offset)
        .limit(limit)
        .order_by(Document.uploaded_at.desc())  # type:ignore
    )  # type:ignore

    result = await db.exec(query)
    documents = result.all()

    return {
        "documents": list(documents),
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    arq: ArqRedis = Depends(get_arq_redis),
) -> None:
    """
    Soft delete a document.

    Sets status=DELETED and enqueues cleanup job.
    Storage quota is freed immediately.

    Args:
        document_id: Document ID
        current_user: Authenticated user
        db: Database session
        arq: ARQ Redis connection

    Raises:
        HTTPException: 404 if document not found
    """
    result = await db.exec(
        select(Document).where(
            Document.document_id == document_id,
            Document.user_id == current_user.user_id,
        )
    )
    document = result.one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    # Soft delete
    document.status = DocumentStatus.DELETED.value
    document.deleted_at = datetime.now(UTC)

    # Free storage quota immediately
    current_user.storage_used_bytes -= document.size_bytes
    if current_user.storage_used_bytes < 0:
        current_user.storage_used_bytes = 0

    db.add(document)
    db.add(current_user)
    await db.commit()

    # Enqueue cleanup job (will delete from B2 and Milvus)
    try:
        await arq.enqueue_job("cleanup_deleted_document", document_id=document_id)
    except Exception as e:
        print(f"Warning: Failed to enqueue cleanup job for {document_id}: {e}")


@router.post("/{document_id}/retry", response_model=DocumentResponse)
async def retry_failed_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    arq: ArqRedis = Depends(get_arq_redis),
) -> Document:
    """
    Retry processing a failed document.

    Args:
        document_id: Document ID
        current_user: Authenticated user
        db: Database session
        arq: ARQ Redis connection

    Returns:
        Updated document with status=PROCESSING

    Raises:
        HTTPException: 404 if document not found, 400 if not in ERROR status
    """
    result = await db.exec(
        select(Document).where(
            Document.document_id == document_id,
            Document.user_id == current_user.user_id,
        )
    )
    document = result.one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    if document.status != DocumentStatus.ERROR.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only failed documents can be retried",
        )

    # Reset status
    document.status = DocumentStatus.PROCESSING.value
    document.error_message = None

    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Re-enqueue processing job
    try:
        await arq.enqueue_job(
            "process_document", document_id=document_id, user_id=current_user.user_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to enqueue retry job: {str(e)}",
        ) from e

    return document


@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document_metadata(
    document_id: str,
    collection_id: str | None = Form(None),
    category: str | None = Form(None),
    tags: str | None = Form(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Document:
    """
    Update document metadata.

    Args:
        document_id: Document ID
        collection_id: New collection ID
        category: New category
        tags: New comma-separated tags
        current_user: Authenticated user
        db: Database session

    Returns:
        Updated document

    Raises:
        HTTPException: 404 if document not found
    """
    result = await db.exec(
        select(Document).where(
            Document.document_id == document_id,
            Document.user_id == current_user.user_id,
        )
    )
    document = result.one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Document not found"
        )

    # Update fields
    if collection_id is not None:
        document.collection_id = collection_id if collection_id else None

    # Update metadata
    if category is not None:
        document.doc_metadata["category"] = category
    if tags is not None:
        document.doc_metadata["tags"] = [tag.strip() for tag in tags.split(",")]

    db.add(document)
    await db.commit()
    await db.refresh(document)

    return document
