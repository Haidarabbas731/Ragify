from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.utils.validators import validate_uuid


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


class DocumentResponseWithUser(DocumentResponse):
    """Schema for document with user email (admin view)."""

    user_email: str | None = None


class DocumentsListResponse(BaseModel):
    """Schema for paginated documents list response (alternative format)."""

    documents: list[DocumentResponse] | list[dict]  # dict for admin with user_email
    total: int
    page: int
    limit: int
    pages: int
    is_admin_view: bool = False


class BatchDeleteRequest(BaseModel):
    """Schema for batch document deletion request."""

    document_ids: list[str] = Field(..., min_length=1, description="List of document IDs to delete")

    @field_validator("document_ids")
    @classmethod
    def validate_document_ids(cls, v: list[str]) -> list[str]:
        """Validate that all document_ids are valid UUIDs."""
        for doc_id in v:
            validate_uuid(doc_id, "document_id")
        return v


class BatchDeleteResponse(BaseModel):
    """Schema for batch deletion response."""

    deleted_count: int
    failed_count: int
    errors: list[dict] | None = None


class BatchUpdateRequest(BaseModel):
    """Schema for batch document update request."""

    document_ids: list[str] = Field(..., min_length=1, max_length=100, description="List of document IDs to update (max 100)")
    collection_id: str | None = Field(None, description="New collection ID (set to empty string to remove from collection)")

    @field_validator("document_ids")
    @classmethod
    def validate_document_ids(cls, v: list[str]) -> list[str]:
        """Validate that all document_ids are valid UUIDs."""
        for doc_id in v:
            validate_uuid(doc_id, "document_id")
        return v

    @field_validator("collection_id")
    @classmethod
    def validate_collection_id(cls, v: str | None) -> str | None:
        """Validate collection_id if provided (allow empty string for removal)."""
        if v is not None and v != "":
            validate_uuid(v, "collection_id")
        return v


class BatchUpdateResponse(BaseModel):
    """Schema for batch update response."""

    updated_count: int
    failed_count: int
    errors: list[dict] | None = None


class DocumentListParams(BaseModel):
    """Query parameters for listing documents."""

    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    limit: int = Field(50, ge=1, le=100, description="Items per page")
    collection_id: str | None = Field(None, description="Filter by collection ID")
    status_filter: str | None = Field(None, description="Filter by status (processing, active, error)")
    sort_by: str = Field("uploaded_at", description="Sort field (uploaded_at, filename, size_bytes, processed_at)")
    order: str = Field("desc", description="Sort order (asc, desc)")

