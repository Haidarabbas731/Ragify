"""
Unit tests for collection_service.py - Collection CRUD operations.

Tests:
- Create collection
- List user collections
- Get collection by ID
- Get collection document count
- Update collection
- Delete collection
"""

import uuid

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.services.collection_service import (
    create_collection,
    delete_collection,
    get_collection_by_id,
    get_collection_document_count,
    list_user_collections,
    update_collection,
)
from app.services.document_service import create_document

# Test: create_collection


@pytest.mark.asyncio
async def test_create_collection_success(session: AsyncSession, sample_user):
    """Test creating a new collection."""

    collection = await create_collection(
        session,
        user_id=sample_user.user_id,
        name="My Documents",
        description="Personal documents collection",
    )

    assert collection.collection_id is not None
    assert collection.user_id == sample_user.user_id
    assert collection.name == "My Documents"
    assert collection.description == "Personal documents collection"
    assert collection.created_at is not None


@pytest.mark.asyncio
async def test_create_collection_without_description(session: AsyncSession, sample_user):
    """Test creating collection without description."""

    collection = await create_collection(
        session, user_id=sample_user.user_id, name="Work Docs"
    )

    assert collection.name == "Work Docs"
    assert collection.description is None


@pytest.mark.asyncio
async def test_create_collection_duplicate_name(session: AsyncSession, sample_user):
    """Test creating collection with duplicate name fails."""

    # Create first collection
    await create_collection(session, sample_user.user_id, "My Documents")

    # Try to create duplicate
    with pytest.raises(ValueError, match="already exists"):
        await create_collection(session, sample_user.user_id, "My Documents")


# Test: list_user_collections


@pytest.mark.asyncio
async def test_list_user_collections_empty(session: AsyncSession, sample_user):
    """Test listing collections when user has none."""

    collections = await list_user_collections(session, sample_user.user_id)

    assert collections == []


@pytest.mark.asyncio
async def test_list_user_collections_multiple(session: AsyncSession, sample_user):
    """Test listing multiple collections."""

    # Create 3 collections
    col1 = await create_collection(session, sample_user.user_id, "Collection 1")
    col2 = await create_collection(session, sample_user.user_id, "Collection 2")
    col3 = await create_collection(session, sample_user.user_id, "Collection 3")

    # List collections
    collections = await list_user_collections(session, sample_user.user_id)

    assert len(collections) == 3
    col_ids = [c.collection_id for c in collections]
    assert col1.collection_id in col_ids
    assert col2.collection_id in col_ids
    assert col3.collection_id in col_ids


@pytest.mark.asyncio
async def test_list_user_collections_ordered_by_created(
    session: AsyncSession, sample_user
):
    """Test collections are ordered by creation date (newest first)."""

    col1 = await create_collection(session, sample_user.user_id, "First")
    col2 = await create_collection(session, sample_user.user_id, "Second")
    col3 = await create_collection(session, sample_user.user_id, "Third")

    collections = await list_user_collections(session, sample_user.user_id)

    # Should be newest first
    assert collections[0].collection_id == col3.collection_id
    assert collections[1].collection_id == col2.collection_id
    assert collections[2].collection_id == col1.collection_id


# Test: get_collection_by_id


@pytest.mark.asyncio
async def test_get_collection_by_id_success(session: AsyncSession, sample_user):
    """Test getting collection by ID."""

    collection = await create_collection(session, sample_user.user_id, "Test Collection")

    # Get by ID
    retrieved = await get_collection_by_id(
        session, collection.collection_id, sample_user.user_id
    )

    assert retrieved is not None
    assert retrieved.collection_id == collection.collection_id
    assert retrieved.name == "Test Collection"


@pytest.mark.asyncio
async def test_get_collection_by_id_not_found(session: AsyncSession, sample_user):
    """Test getting non-existent collection returns None."""

    fake_id = str(uuid.uuid4())
    retrieved = await get_collection_by_id(session, fake_id, sample_user.user_id)

    assert retrieved is None


@pytest.mark.asyncio
async def test_get_collection_by_id_wrong_user(session: AsyncSession, sample_user):
    """Test getting collection with wrong user_id returns None."""

    collection = await create_collection(session, sample_user.user_id, "Test Collection")

    # Try to get with different user_id
    wrong_user_id = str(uuid.uuid4())
    retrieved = await get_collection_by_id(session, collection.collection_id, wrong_user_id)

    assert retrieved is None


# Test: get_collection_document_count


@pytest.mark.asyncio
async def test_get_collection_document_count_zero(session: AsyncSession, sample_user):
    """Test document count for empty collection."""

    collection = await create_collection(session, sample_user.user_id, "Empty Collection")

    count = await get_collection_document_count(session, collection.collection_id)

    assert count == 0


@pytest.mark.asyncio
async def test_get_collection_document_count_multiple(
    session: AsyncSession, sample_user
):
    """Test document count for collection with documents."""

    collection = await create_collection(session, sample_user.user_id, "Docs Collection")

    # Add 3 documents to collection
    await create_document(
        session,
        sample_user.user_id,
        "doc1.pdf",
        "pdf",
        1024,
        "key1",
        collection_id=collection.collection_id,
    )
    await create_document(
        session,
        sample_user.user_id,
        "doc2.pdf",
        "pdf",
        1024,
        "key2",
        collection_id=collection.collection_id,
    )
    await create_document(
        session,
        sample_user.user_id,
        "doc3.pdf",
        "pdf",
        1024,
        "key3",
        collection_id=collection.collection_id,
    )

    count = await get_collection_document_count(session, collection.collection_id)

    assert count == 3


# Test: update_collection


@pytest.mark.asyncio
async def test_update_collection_name(session: AsyncSession, sample_user):
    """Test updating collection name."""

    collection = await create_collection(
        session, sample_user.user_id, "Old Name", "Old description"
    )

    # Update name
    updated = await update_collection(
        session, collection.collection_id, sample_user.user_id, name="New Name"
    )

    assert updated.name == "New Name"
    assert updated.description == "Old description"  # Unchanged


@pytest.mark.asyncio
async def test_update_collection_description(session: AsyncSession, sample_user):
    """Test updating collection description."""

    collection = await create_collection(
        session, sample_user.user_id, "My Docs", "Old description"
    )

    # Update description
    updated = await update_collection(
        session,
        collection.collection_id,
        sample_user.user_id,
        description="New description",
    )

    assert updated.name == "My Docs"  # Unchanged
    assert updated.description == "New description"


@pytest.mark.asyncio
async def test_update_collection_both_fields(session: AsyncSession, sample_user):
    """Test updating both name and description."""

    collection = await create_collection(
        session, sample_user.user_id, "Old Name", "Old description"
    )

    # Update both
    updated = await update_collection(
        session,
        collection.collection_id,
        sample_user.user_id,
        name="New Name",
        description="New description",
    )

    assert updated.name == "New Name"
    assert updated.description == "New description"
    assert updated.updated_at is not None


@pytest.mark.asyncio
async def test_update_collection_not_found(session: AsyncSession, sample_user):
    """Test updating non-existent collection raises error."""

    fake_id = str(uuid.uuid4())

    with pytest.raises(ValueError, match="not found"):
        await update_collection(session, fake_id, sample_user.user_id, name="New Name")


@pytest.mark.asyncio
async def test_update_collection_wrong_user(session: AsyncSession, sample_user):
    """Test updating collection with wrong user_id raises error."""

    collection = await create_collection(session, sample_user.user_id, "My Collection")

    wrong_user_id = str(uuid.uuid4())

    with pytest.raises(ValueError, match="not found"):
        await update_collection(
            session, collection.collection_id, wrong_user_id, name="New Name"
        )


# Test: delete_collection


@pytest.mark.asyncio
async def test_delete_collection_success(session: AsyncSession, sample_user):
    """Test deleting a collection."""

    collection = await create_collection(session, sample_user.user_id, "To Delete")

    # Delete collection
    await delete_collection(session, collection.collection_id, sample_user.user_id)

    # Verify deletion
    retrieved = await get_collection_by_id(
        session, collection.collection_id, sample_user.user_id
    )
    assert retrieved is None


@pytest.mark.asyncio
async def test_delete_collection_not_found(session: AsyncSession, sample_user):
    """Test deleting non-existent collection raises error."""

    fake_id = str(uuid.uuid4())

    with pytest.raises(ValueError, match="not found"):
        await delete_collection(session, fake_id, sample_user.user_id)


@pytest.mark.asyncio
async def test_delete_collection_wrong_user(session: AsyncSession, sample_user):
    """Test deleting collection with wrong user_id raises error."""

    collection = await create_collection(session, sample_user.user_id, "My Collection")

    wrong_user_id = str(uuid.uuid4())

    with pytest.raises(ValueError, match="not found"):
        await delete_collection(session, collection.collection_id, wrong_user_id)


@pytest.mark.asyncio
async def test_delete_collection_with_documents(session: AsyncSession, sample_user):
    """Test deleting collection that contains documents raises error due to FK constraint."""

    collection = await create_collection(session, sample_user.user_id, "With Docs")

    # Add documents to collection
    await create_document(
        session,
        sample_user.user_id,
        "doc.pdf",
        "pdf",
        1024,
        "key",
        collection_id=collection.collection_id,
    )

    # Should raise error due to foreign key constraint
    # In production, documents should be deleted first or collection_id set to NULL
    from sqlalchemy.exc import IntegrityError

    with pytest.raises(IntegrityError):
        await delete_collection(session, collection.collection_id, sample_user.user_id)
