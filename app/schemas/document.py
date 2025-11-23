from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentUpload(BaseModel):
    """Schema for document upload metadata."""

    collection_id: str | None = None
    category: str | None = None
    tags: list[str] = Field(default_factory=list)


class DocumentResponse(BaseModel):
    """Schema for document data in API responses."""

    model_config = ConfigDict(from_attributes=True)

    document_id: str
    user_id: str
    collection_id: str | None
    filename: str
    file_type: str
    size_bytes: int
    chunks_count: int
    storage_key: str
    doc_metadata: dict
    status: str
    error_message: str | None
    uploaded_at: datetime
    processed_at: datetime | None
    deleted_at: datetime | None


class DocumentUpdate(BaseModel):
    """Schema for updating document metadata."""

    collection_id: str | None = None
    category: str | None = None
    tags: list[str] | None = None


class DocumentListResponse(BaseModel):
    """Schema for paginated document list response."""

    documents: list[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DocumentsListResponse(BaseModel):
    """Schema for paginated documents list response (alternative format)."""

    documents: list[DocumentResponse]
    total: int
    page: int
    limit: int
    pages: int


class BatchDeleteRequest(BaseModel):
    """Schema for batch document deletion request."""

    document_ids: list[str] = Field(..., min_length=1, max_length=10, description="List of document IDs to delete (max 10)")


class BatchDeleteResponse(BaseModel):
    """Schema for batch deletion response."""

    deleted_count: int
    failed_count: int
    errors: list[dict] | None = None
