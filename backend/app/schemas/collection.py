from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CollectionCreate(BaseModel):
    """Schema for creating a new collection."""

    name: str = Field(min_length=1, max_length=255)
    description: str | None = None


class CollectionUpdate(BaseModel):
    """Schema for updating a collection."""

    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None


class CollectionResponse(BaseModel):
    """Schema for collection data in API responses."""

    model_config = ConfigDict(from_attributes=True)

    collection_id: str
    user_id: str
    name: str
    description: str | None
    document_count: int = 0
    created_at: datetime
    updated_at: datetime


class CollectionListResponse(BaseModel):
    """Schema for collections list with total document count."""

    collections: list[CollectionResponse]
    total_documents: int = Field(
        ...,
        description="Total count of all active documents (including unassigned)",
    )
