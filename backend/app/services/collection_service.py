from datetime import UTC, datetime

from sqlalchemy import func
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.collection import Collection
from app.models.document import Document


async def create_collection(
    session: AsyncSession, user_id: str, name: str, description: str | None = None
) -> Collection:
    """
    Create a new collection for a user.

    Args:
        session: Database session
        user_id: User ID
        name: Collection name
        description: Optional description

    Returns:
        Created collection instance

    Raises:
        ValueError: If collection with same name already exists for user
    """
    existing = await session.exec(
        select(Collection).where(
            Collection.user_id == user_id, Collection.name == name
        )
    )
    if existing.one_or_none():
        raise ValueError(f"Collection '{name}' already exists for user {user_id}")

    collection = Collection(user_id=user_id, name=name, description=description)
    session.add(collection)
    await session.commit()
    await session.refresh(collection)
    return collection


async def list_user_collections(
    session: AsyncSession, user_id: str
) -> list[Collection]:
    """
    List all collections for a user.

    Args:
        session: Database session
        user_id: User ID

    Returns:
        List of collections
    """
    result = await session.exec(
        select(Collection)
        .where(Collection.user_id == user_id)
        .order_by(col(Collection.created_at).desc())
    )
    return list(result.all())


async def get_collection_by_id(
    session: AsyncSession, collection_id: str
) -> Collection | None:
    """
    Get collection by ID.

    Args:
        session: Database session
        collection_id: Collection ID

    Returns:
        Collection instance or None if not found
    """
    result = await session.exec(
        select(Collection).where(Collection.collection_id == collection_id)
    )
    return result.one_or_none()


async def get_collection_document_count(
    session: AsyncSession, collection_id: str
) -> int:
    """
    Get the number of documents in a collection.

    Args:
        session: Database session
        collection_id: Collection ID

    Returns:
        Document count
    """
    result = await session.exec(
        select(func.count()).select_from(Document).where(
            Document.collection_id == collection_id
        )
    )
    count = result.one()
    return count if count else 0


async def update_collection(
    session: AsyncSession,
    collection_id: str,
    name: str | None = None,
    description: str | None = None,
) -> Collection:
    """
    Update collection details.

    Args:
        session: Database session
        collection_id: Collection ID
        name: Optional new name
        description: Optional new description

    Returns:
        Updated collection instance

    Raises:
        ValueError: If collection not found
    """
    collection = await get_collection_by_id(session, collection_id)
    if not collection:
        raise ValueError(f"Collection {collection_id} not found")

    if name is not None:
        collection.name = name
    if description is not None:
        collection.description = description

    collection.updated_at = datetime.now(UTC)
    session.add(collection)
    await session.commit()
    await session.refresh(collection)
    return collection


async def delete_collection(session: AsyncSession, collection_id: str) -> None:
    """
    Delete a collection.

    Args:
        session: Database session
        collection_id: Collection ID

    Raises:
        ValueError: If collection not found
    """
    collection = await get_collection_by_id(session, collection_id)
    if not collection:
        raise ValueError(f"Collection {collection_id} not found")

    await session.delete(collection)
    await session.commit()
