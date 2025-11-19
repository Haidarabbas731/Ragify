from datetime import UTC, datetime

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.document import Document, DocumentStatus


async def create_document(
    session: AsyncSession,
    user_id: str,
    filename: str,
    file_type: str,
    size_bytes: int,
    storage_key: str,
    collection_id: str | None = None,
    metadata: dict | None = None,
) -> Document:
    """
    Create a new document record.

    Args:
        session: Database session
        user_id: User ID who owns the document
        filename: Original filename
        file_type: File extension (pdf, txt, docx, md)
        size_bytes: File size in bytes
        storage_key: B2 storage key
        collection_id: Optional collection ID
        metadata: Optional metadata dict

    Returns:
        Created document instance
    """
    document = Document(
        user_id=user_id,
        filename=filename,
        file_type=file_type,
        size_bytes=size_bytes,
        storage_key=storage_key,
        collection_id=collection_id,
        doc_metadata=metadata or {},
        status=DocumentStatus.PROCESSING.value,
    )
    session.add(document)
    await session.commit()
    await session.refresh(document)
    return document


async def get_document_by_id(
    session: AsyncSession, document_id: str
) -> Document | None:
    """
    Get document by ID.

    Args:
        session: Database session
        document_id: Document ID

    Returns:
        Document instance or None if not found
    """
    result = await session.execute(
        select(Document).where(Document.document_id == document_id)
    )
    return result.scalar_one_or_none()


async def list_user_documents(
    session: AsyncSession,
    user_id: str,
    collection_id: str | None = None,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[Document]:
    """
    List documents for a user with optional filters.

    Args:
        session: Database session
        user_id: User ID
        collection_id: Optional filter by collection
        status: Optional filter by status
        limit: Maximum number of results
        offset: Pagination offset

    Returns:
        List of documents
    """
    query = select(Document).where(Document.user_id == user_id)

    if collection_id:
        query = query.where(Document.collection_id == collection_id)
    if status:
        query = query.where(Document.status == status)

    query = query.order_by(Document.uploaded_at.desc()).limit(limit).offset(offset)

    result = await session.execute(query)
    return list(result.scalars().all())


async def update_document_status(
    session: AsyncSession,
    document_id: str,
    status: str,
    error_message: str | None = None,
    chunks_count: int | None = None,
) -> Document:
    """
    Update document processing status.

    Args:
        session: Database session
        document_id: Document ID
        status: New status (PROCESSING, ACTIVE, DELETED, ERROR)
        error_message: Optional error message if status is ERROR
        chunks_count: Optional chunks count when status is ACTIVE

    Returns:
        Updated document instance

    Raises:
        ValueError: If document not found
    """
    document = await get_document_by_id(session, document_id)
    if not document:
        raise ValueError(f"Document {document_id} not found")

    document.status = status
    if error_message:
        document.error_message = error_message
    if chunks_count is not None:
        document.chunks_count = chunks_count
    if status == DocumentStatus.ACTIVE.value:
        document.processed_at = datetime.now(UTC)

    session.add(document)
    await session.commit()
    await session.refresh(document)
    return document


async def mark_document_as_deleted(
    session: AsyncSession, document_id: str
) -> Document:
    """
    Mark document as deleted (soft delete).

    Args:
        session: Database session
        document_id: Document ID

    Returns:
        Updated document instance

    Raises:
        ValueError: If document not found
    """
    document = await get_document_by_id(session, document_id)
    if not document:
        raise ValueError(f"Document {document_id} not found")

    document.status = DocumentStatus.DELETED.value
    document.deleted_at = datetime.now(UTC)
    session.add(document)
    await session.commit()
    await session.refresh(document)
    return document


async def update_document_metadata(
    session: AsyncSession, document_id: str, metadata: dict
) -> Document:
    """
    Update document metadata.

    Args:
        session: Database session
        document_id: Document ID
        metadata: New metadata dict

    Returns:
        Updated document instance

    Raises:
        ValueError: If document not found
    """
    document = await get_document_by_id(session, document_id)
    if not document:
        raise ValueError(f"Document {document_id} not found")

    document.doc_metadata = {**document.doc_metadata, **metadata}
    session.add(document)
    await session.commit()
    await session.refresh(document)
    return document
