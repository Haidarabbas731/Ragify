import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.models.collection import Collection
from app.models.document import Document
from app.models.user import User
from app.schemas.collection import (
    CollectionCreate,
    CollectionResponse,
    CollectionUpdate,
)
from app.services.collection_service import (
    create_collection,
    delete_collection,
    update_collection,
)
from app.utils.validators import validate_uuid

logger = logging.getLogger(__name__)

router = APIRouter(tags=["collections"])


@router.post(
    "/collections",
    response_model=CollectionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_collection_endpoint(
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new collection for organizing documents.

    Collections allow users to group related documents together.
    New collections have document_count of 0.
    """
    try:
        collection = await create_collection(
            db, current_user.user_id, collection_data.name, collection_data.description
        )

        # New collections have 0 documents
        collection.document_count = 0

        logger.info(
            f"Collection {collection.collection_id} created by user {current_user.user_id}"
        )
        return collection

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e

    except Exception as e:
        logger.error(f"Collection creation failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create collection",
        ) from e


@router.get("/collections", response_model=list[CollectionResponse])
async def list_collections(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List all collections for the current user with document counts.

    Returns collections ordered by creation date (newest first) with
    accurate document counts excluding deleted documents.
    """
    # Single optimized query with LEFT JOIN to get collections + document counts
    query = (
        select(
            Collection,
            func.count(Document.document_id).label("doc_count"),  # type:ignore
        )
        .outerjoin(
            Document,
            (Collection.collection_id == Document.collection_id)  # type:ignore
            & (Document.status != "DELETED"),
        )
        .where(Collection.user_id == current_user.user_id)
        .group_by(Collection.collection_id)
        .order_by(col(Collection.created_at).desc())
    )

    result = await db.exec(query)
    rows = result.all()

    # Build response with document counts
    collections_with_counts = []
    for collection, doc_count in rows:
        collection.document_count = doc_count or 0
        collections_with_counts.append(collection)

    return collections_with_counts


@router.get("/collections/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get a specific collection by ID with document count.

    Returns collection details with accurate document count excluding deleted documents.
    """
    validate_uuid(collection_id, "collection_id")

    # Single query with LEFT JOIN to get collection + document count
    query = (
        select(
            Collection,
            func.count(Document.document_id).label("doc_count"),  # type:ignore
        )  # type:ignore
        .outerjoin(
            Document,
            (Collection.collection_id == Document.collection_id)  # type:ignore
            & (Document.status != "DELETED"),
        )
        .where(
            Collection.collection_id == collection_id,
            Collection.user_id == current_user.user_id,
        )
        .group_by(Collection.collection_id)
    )

    result = await db.exec(query)
    row = result.one_or_none()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection {collection_id} not found",
        )

    collection, doc_count = row
    collection.document_count = doc_count or 0

    return collection


@router.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection_endpoint(
    collection_id: str,
    collection_data: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update collection name or description with document count.

    Returns updated collection with accurate document count excluding deleted documents.
    """
    validate_uuid(collection_id, "collection_id")
    try:
        collection = await update_collection(
            db,
            collection_id,
            current_user.user_id,
            collection_data.name,
            collection_data.description,
        )

        if not collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Collection {collection_id} not found",
            )

        # Add document count using optimized query
        count_query = select(func.count(Document.document_id)).where(  # type:ignore
            Document.collection_id == collection_id, Document.status != "DELETED"
        )
        count_result = await db.exec(count_query)
        collection.document_count = count_result.one() or 0

        logger.info(
            f"Collection {collection_id} updated by user {current_user.user_id}"
        )
        return collection

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
        ) from e

    except Exception as e:
        logger.error(f"Collection update failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update collection",
        ) from e


@router.delete("/collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection_endpoint(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Delete a collection.

    Note: This only deletes the collection metadata. Documents in the collection
    will have their collection_id set to NULL but will not be deleted.
    """
    validate_uuid(collection_id, "collection_id")
    try:
        await delete_collection(db, collection_id, current_user.user_id)
        logger.info(
            f"Collection {collection_id} deleted by user {current_user.user_id}"
        )
        return None

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e

    except Exception as e:
        logger.error(f"Collection deletion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete collection",
        ) from e
