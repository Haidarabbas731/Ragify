"""
Unit tests for document_service.py - Document CRUD operations.

Tests:
- Create document
- Get document by ID
- List user documents (with filters)
- Update document status
- Mark document as deleted
- Update document metadata
"""

import uuid

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.document import DocumentStatus
from app.services.document_service import (
    create_document,
    get_document_by_id,
    list_user_documents,
    mark_document_as_deleted,
    update_document_metadata,
    update_document_status,
)

# Test: create_document


@pytest.mark.asyncio
async def test_create_document(session: AsyncSession, sample_user):
    """Test creating a new document."""

    document = await create_document(
        session,
        user_id=sample_user.user_id,
        filename="test.pdf",
        file_type="pdf",
        size_bytes=1024,
        storage_key="b2://bucket/test.pdf",
        collection_id=None,
        metadata={"pages": 10},
    )

    assert document.document_id is not None
    assert document.user_id == sample_user.user_id
    assert document.filename == "test.pdf"
    assert document.file_type == "pdf"
    assert document.size_bytes == 1024
    assert document.storage_key == "b2://bucket/test.pdf"
    assert document.status == DocumentStatus.PROCESSING.value
    assert document.doc_metadata == {"pages": 10}


# Test: get_document_by_id


@pytest.mark.asyncio
async def test_get_document_by_id_success(session: AsyncSession, sample_user):
    """Test getting document by ID."""

    # Create document
    doc = await create_document(
        session,
        user_id=sample_user.user_id,
        filename="test.pdf",
        file_type="pdf",
        size_bytes=1024,
        storage_key="b2://bucket/test.pdf",
    )

    # Get by ID
    retrieved = await get_document_by_id(session, doc.document_id)

    assert retrieved is not None
    assert retrieved.document_id == doc.document_id
    assert retrieved.filename == "test.pdf"


@pytest.mark.asyncio
async def test_get_document_by_id_not_found(session: AsyncSession):
    """Test getting non-existent document returns None."""

    fake_id = str(uuid.uuid4())
    retrieved = await get_document_by_id(session, fake_id)

    assert retrieved is None


# Test: list_user_documents


@pytest.mark.asyncio
async def test_list_user_documents_empty(session: AsyncSession, sample_user):
    """Test listing documents when user has none."""

    documents = await list_user_documents(session, sample_user.user_id)

    assert documents == []


@pytest.mark.asyncio
async def test_list_user_documents_multiple(session: AsyncSession, sample_user):
    """Test listing multiple documents."""

    # Create 3 documents
    doc1 = await create_document(
        session, sample_user.user_id, "doc1.pdf", "pdf", 1024, "key1"
    )
    doc2 = await create_document(
        session, sample_user.user_id, "doc2.docx", "docx", 2048, "key2"
    )
    doc3 = await create_document(
        session, sample_user.user_id, "doc3.txt", "txt", 512, "key3"
    )

    # List documents
    documents = await list_user_documents(session, sample_user.user_id)

    assert len(documents) == 3
    doc_ids = [d.document_id for d in documents]
    assert doc1.document_id in doc_ids
    assert doc2.document_id in doc_ids
    assert doc3.document_id in doc_ids


@pytest.mark.asyncio
async def test_list_user_documents_with_status_filter(session: AsyncSession, sample_user):
    """Test listing documents filtered by status."""

    # Create documents with different statuses
    doc1 = await create_document(
        session, sample_user.user_id, "processing.pdf", "pdf", 1024, "key1"
    )
    doc2 = await create_document(
        session, sample_user.user_id, "active.pdf", "pdf", 1024, "key2"
    )
    await update_document_status(session, doc2.document_id, DocumentStatus.ACTIVE.value)

    # Filter by processing status
    processing_docs = await list_user_documents(
        session, sample_user.user_id, status=DocumentStatus.PROCESSING.value
    )

    assert len(processing_docs) == 1
    assert processing_docs[0].document_id == doc1.document_id

    # Filter by active status
    active_docs = await list_user_documents(
        session, sample_user.user_id, status=DocumentStatus.ACTIVE.value
    )

    assert len(active_docs) == 1
    assert active_docs[0].document_id == doc2.document_id


@pytest.mark.asyncio
async def test_list_user_documents_with_collection_filter(
    session: AsyncSession, sample_user
):
    """Test listing documents filtered by collection."""

    from app.services.collection_service import create_collection

    # Create a real collection first
    collection = await create_collection(session, sample_user.user_id, "Test Collection")

    # Create documents with and without collection
    doc1 = await create_document(
        session,
        sample_user.user_id,
        "in_collection.pdf",
        "pdf",
        1024,
        "key1",
        collection_id=collection.collection_id,
    )
    await create_document(
        session, sample_user.user_id, "no_collection.pdf", "pdf", 1024, "key2"
    )

    # Filter by collection
    collection_docs = await list_user_documents(
        session, sample_user.user_id, collection_id=collection.collection_id
    )

    assert len(collection_docs) == 1
    assert collection_docs[0].document_id == doc1.document_id


@pytest.mark.asyncio
async def test_list_user_documents_pagination(session: AsyncSession, sample_user):
    """Test document listing with pagination."""

    # Create 5 documents
    for i in range(5):
        await create_document(
            session, sample_user.user_id, f"doc{i}.pdf", "pdf", 1024, f"key{i}"
        )

    # Get first 2
    page1 = await list_user_documents(session, sample_user.user_id, limit=2, offset=0)
    assert len(page1) == 2

    # Get next 2
    page2 = await list_user_documents(session, sample_user.user_id, limit=2, offset=2)
    assert len(page2) == 2

    # Ensure different documents
    page1_ids = {d.document_id for d in page1}
    page2_ids = {d.document_id for d in page2}
    assert page1_ids.isdisjoint(page2_ids)


# Test: update_document_status


@pytest.mark.asyncio
async def test_update_document_status_success(session: AsyncSession, sample_user):
    """Test updating document status."""

    doc = await create_document(
        session, sample_user.user_id, "test.pdf", "pdf", 1024, "key"
    )

    # Update to active
    updated = await update_document_status(
        session, doc.document_id, DocumentStatus.ACTIVE.value, chunks_count=10
    )

    assert updated.status == DocumentStatus.ACTIVE.value
    assert updated.chunks_count == 10
    assert updated.processed_at is not None


@pytest.mark.asyncio
async def test_update_document_status_to_error(session: AsyncSession, sample_user):
    """Test updating document status to error with message."""

    doc = await create_document(
        session, sample_user.user_id, "test.pdf", "pdf", 1024, "key"
    )

    # Update to error
    updated = await update_document_status(
        session,
        doc.document_id,
        DocumentStatus.ERROR.value,
        error_message="Processing failed",
    )

    assert updated.status == DocumentStatus.ERROR.value
    assert updated.error_message == "Processing failed"


@pytest.mark.asyncio
async def test_update_document_status_not_found(session: AsyncSession):
    """Test updating non-existent document raises error."""

    fake_id = str(uuid.uuid4())

    with pytest.raises(ValueError, match="not found"):
        await update_document_status(session, fake_id, DocumentStatus.ACTIVE.value)


# Test: mark_document_as_deleted


@pytest.mark.asyncio
async def test_mark_document_as_deleted_success(session: AsyncSession, sample_user):
    """Test marking document as deleted."""

    doc = await create_document(
        session, sample_user.user_id, "test.pdf", "pdf", 1024, "key"
    )

    # Mark as deleted
    updated = await mark_document_as_deleted(session, doc.document_id)

    assert updated.status == DocumentStatus.DELETED.value
    assert updated.deleted_at is not None


@pytest.mark.asyncio
async def test_mark_document_as_deleted_not_found(session: AsyncSession):
    """Test marking non-existent document raises error."""

    fake_id = str(uuid.uuid4())

    with pytest.raises(ValueError, match="not found"):
        await mark_document_as_deleted(session, fake_id)


# Test: update_document_metadata


@pytest.mark.asyncio
async def test_update_document_metadata_success(session: AsyncSession, sample_user):
    """Test updating document metadata."""

    doc = await create_document(
        session,
        sample_user.user_id,
        "test.pdf",
        "pdf",
        1024,
        "key",
        metadata={"pages": 10},
    )

    # Update metadata
    updated = await update_document_metadata(
        session, doc.document_id, {"pages": 15, "author": "John Doe"}
    )

    assert updated.doc_metadata["pages"] == 15
    assert updated.doc_metadata["author"] == "John Doe"


@pytest.mark.asyncio
async def test_update_document_metadata_merge(session: AsyncSession, sample_user):
    """Test metadata update merges with existing data."""

    doc = await create_document(
        session,
        sample_user.user_id,
        "test.pdf",
        "pdf",
        1024,
        "key",
        metadata={"pages": 10, "title": "Original Title"},
    )

    # Update metadata (should merge)
    updated = await update_document_metadata(session, doc.document_id, {"pages": 15})

    assert updated.doc_metadata["pages"] == 15
    assert updated.doc_metadata["title"] == "Original Title"  # Original kept


@pytest.mark.asyncio
async def test_update_document_metadata_not_found(session: AsyncSession):
    """Test updating metadata for non-existent document raises error."""

    fake_id = str(uuid.uuid4())

    with pytest.raises(ValueError, match="not found"):
        await update_document_metadata(session, fake_id, {"key": "value"})
