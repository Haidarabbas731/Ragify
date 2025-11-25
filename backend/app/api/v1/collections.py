import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.models.user import User
from app.schemas.collection import CollectionCreate, CollectionResponse, CollectionUpdate
from app.services.collection_service import (
    create_collection,
    delete_collection,
    get_collection_by_id,
    list_user_collections,
    update_collection,
)

logger = logging.getLogger(__name__)

router = APIRouter(tags=["collections"])


@router.post("/collections", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection_endpoint(
    collection_data: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Create a new collection for organizing documents.

    Collections allow users to group related documents together.
    """
    try:
        collection = await create_collection(
            db, current_user.user_id, collection_data.name, collection_data.description
        )
        logger.info(f"Collection {collection.collection_id} created by user {current_user.user_id}")
        return collection

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

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
    List all collections for the current user.
    """
    collections = await list_user_collections(db, current_user.user_id)
    return collections


@router.get("/collections/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get a specific collection by ID.
    """
    collection = await get_collection_by_id(db, collection_id, current_user.user_id)

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection {collection_id} not found",
        )

    return collection


@router.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection_endpoint(
    collection_id: str,
    collection_data: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Update collection name or description.
    """
    try:
        collection = await update_collection(
            db, collection_id, current_user.user_id, collection_data.name, collection_data.description
        )

        if not collection:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Collection {collection_id} not found",
            )

        logger.info(f"Collection {collection_id} updated by user {current_user.user_id}")
        return collection

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

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
    try:
        await delete_collection(db, collection_id, current_user.user_id)
        logger.info(f"Collection {collection_id} deleted by user {current_user.user_id}")
        return None

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e

    except Exception as e:
        logger.error(f"Collection deletion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete collection",
        ) from e
