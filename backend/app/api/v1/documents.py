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
from app.models.collection import Collection
from app.models.document import Document, DocumentStatus
from app.models.user import User
from app.schemas.document import (
    BatchDeleteRequest,
    BatchDeleteResponse,
    DocumentListParams,
    DocumentResponse,
    DocumentsListResponse,
)
from app.services.b2_service import get_b2_service
from app.tasks.worker import get_arq_redis
from app.utils.validators import validate_uuid

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(..., description="Document file (PDF, DOCX, TXT, MD)"),
    collection_id: str | None = Form(
        None,
        description="Optional collection ID to organize document",
        openapi_examples={
            "none": {"summary": "No collection", "value": None},
            "with_collection": {
                "summary": "With collection",
                "value": "550e8400-e29b-41d4-a716-446655440000",
            },
        },
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
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename is required")

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

    # Validate collection_id if provided
    validated_collection_id = None
    if collection_id:
        validate_uuid(collection_id, "collection_id")
        # Check if collection exists and belongs to user
        result = await db.exec(
            select(Collection).where(
                Collection.collection_id == collection_id, Collection.user_id == current_user.user_id
            )
        )
        collection = result.first()
        if collection:
            validated_collection_id = collection_id
        # If collection doesn't exist, silently set to None (don't fail upload)

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
        collection_id=validated_collection_id,
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    return document


@router.get("", response_model=DocumentsListResponse)
async def list_documents(
    params: DocumentListParams = Depends(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    List user's documents with pagination and filters.

    Users can only see their own documents.

    Args:
        params: Query parameters (page, limit, collection_id, status_filter)
        current_user: Authenticated user
        db: Database session

    Returns:
        Paginated list of user's documents
    """
    # Build query - exclude deleted documents, filter by current user
    query = select(Document).where(
        Document.status != DocumentStatus.DELETED.value,
        Document.user_id == current_user.user_id,
    )

    if params.collection_id:
        validate_uuid(params.collection_id, "collection_id")
        query = query.where(Document.collection_id == params.collection_id)

    if params.status_filter:
        query = query.where(Document.status == params.status_filter)

    # Count total
    count_query = select(Document.document_id).where(
        Document.status != DocumentStatus.DELETED.value,
        Document.user_id == current_user.user_id,
    )

    if params.collection_id:
        count_query = count_query.where(Document.collection_id == params.collection_id)
    if params.status_filter:
        count_query = count_query.where(Document.status == params.status_filter)

    total_result = await db.exec(count_query)
    total = len(total_result.all())

    # Validate and apply sorting
    allowed_sort_fields = {"uploaded_at", "filename", "size_bytes", "processed_at"}
    sort_field = params.sort_by if params.sort_by in allowed_sort_fields else "uploaded_at"
    sort_order = params.order if params.order in {"asc", "desc"} else "desc"

    # Get sort column
    sort_column = getattr(Document, sort_field)

    # Paginate with dynamic sorting
    offset = (params.page - 1) * params.limit
    if sort_order == "asc":
        query = query.offset(offset).limit(params.limit).order_by(sort_column.asc())  # type:ignore
    else:
        query = query.offset(offset).limit(params.limit).order_by(sort_column.desc())  # type:ignore

    result = await db.exec(query)
    documents = result.all()

    return {
        "documents": list(documents),
        "total": total,
        "page": params.page,
        "limit": params.limit,
        "pages": (total + params.limit - 1) // params.limit,
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

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


@router.post("/batch-delete", response_model=BatchDeleteResponse)
async def batch_delete_documents(
    request: BatchDeleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    arq: ArqRedis = Depends(get_arq_redis),
) -> dict:
    """
    Soft delete multiple documents.

    Sets status=DELETED and enqueues cleanup jobs.
    Storage quota is freed immediately.

    Args:
        request: Batch delete request with document IDs
        current_user: Authenticated user
        db: Database session
        arq: ARQ Redis connection

    Returns:
        Deletion result with counts and errors
    """

    deleted_count = 0
    failed_count = 0
    errors = []
    total_size_freed = 0

    for document_id in request.document_ids:
        try:
            # Get document
            result = await db.exec(
                select(Document).where(
                    Document.document_id == document_id,
                    Document.user_id == current_user.user_id,
                )
            )
            document = result.one_or_none()

            if not document:
                failed_count += 1
                errors.append(
                    {
                        "document_id": document_id,
                        "error": "Document not found or not owned by user",
                    }
                )
                continue

            # Soft delete
            document.status = DocumentStatus.DELETED.value
            document.deleted_at = datetime.now(UTC)
            total_size_freed += document.size_bytes

            db.add(document)

            # Enqueue cleanup job
            try:
                await arq.enqueue_job("cleanup_deleted_document", document_id=document_id)
            except Exception as e:
                print(f"Warning: Failed to enqueue cleanup job for {document_id}: {e}")

            deleted_count += 1

        except Exception as e:
            failed_count += 1
            errors.append({"document_id": document_id, "error": str(e)})

    # Free storage quota
    current_user.storage_used_bytes -= total_size_freed
    if current_user.storage_used_bytes < 0:
        current_user.storage_used_bytes = 0

    db.add(current_user)
    await db.commit()

    return {
        "deleted_count": deleted_count,
        "failed_count": failed_count,
        "errors": errors if errors else None,
    }


@router.post("/delete-all-mine", response_model=BatchDeleteResponse)
async def delete_all_my_documents(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    arq: ArqRedis = Depends(get_arq_redis),
) -> dict:
    """
    Soft delete ALL documents owned by current user.

    Sets status=DELETED for all user's documents and enqueues cleanup jobs.
    Storage quota is freed immediately.

    Args:
        current_user: Authenticated user
        db: Database session
        arq: ARQ Redis connection

    Returns:
        Deletion result with counts
    """
    # Get all user's documents
    result = await db.exec(
        select(Document).where(
            Document.user_id == current_user.user_id,
            Document.status != DocumentStatus.DELETED.value,
        )
    )
    documents = result.all()

    if not documents:
        return {
            "deleted_count": 0,
            "failed_count": 0,
            "errors": None,
        }

    deleted_count = 0
    failed_count = 0
    errors = []
    total_size_freed = 0

    for document in documents:
        try:
            # Soft delete
            document.status = DocumentStatus.DELETED.value
            document.deleted_at = datetime.now(UTC)
            total_size_freed += document.size_bytes

            db.add(document)

            # Enqueue cleanup job
            try:
                await arq.enqueue_job("cleanup_deleted_document", document_id=document.document_id)
            except Exception as e:
                print(f"Warning: Failed to enqueue cleanup job for {document.document_id}: {e}")

            deleted_count += 1

        except Exception as e:
            failed_count += 1
            errors.append({"document_id": document.document_id, "error": str(e)})

    # Free storage quota
    current_user.storage_used_bytes -= total_size_freed
    if current_user.storage_used_bytes < 0:
        current_user.storage_used_bytes = 0

    db.add(current_user)
    await db.commit()

    return {
        "deleted_count": deleted_count,
        "failed_count": failed_count,
        "errors": errors if errors else None,
    }


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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Allow retry for ERROR or stuck PROCESSING documents (> 30 min)
    if document.status == DocumentStatus.ERROR.value:
        # Always allow retry for ERROR status
        pass
    elif document.status == DocumentStatus.PROCESSING.value:
        # Only allow retry if stuck for > 30 minutes
        time_since_upload = datetime.now(UTC) - document.uploaded_at
        if time_since_upload.total_seconds() < 1800:  # 30 minutes
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Document is still processing. Wait 30 minutes before retry.",
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only failed or stuck documents can be retried",
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
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")

    # Update fields
    if collection_id is not None:
        validate_uuid(collection_id, "collection_id")
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
