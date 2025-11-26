from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class InviteCodeCreate(BaseModel):
    """Schema for creating a new invite code."""

    max_uses: int = Field(default=1, ge=1, le=1000)
    expires_at: datetime | None = None
    description: str | None = None


class InviteCodeResponse(BaseModel):
    """Schema for invite code data in API responses."""

    model_config = ConfigDict(from_attributes=True)

    invite_code_id: str
    code: str
    created_by: str | None
    max_uses: int
    current_uses: int
    status: str
    expires_at: datetime | None
    description: str | None
    created_at: datetime


class AuditLogResponse(BaseModel):
    """Schema for admin audit log entries."""

    model_config = ConfigDict(from_attributes=True)

    audit_id: str
    admin_user_id: str
    action: str
    target_type: str
    target_id: str
    details: dict
    ip_address: str
    timestamp: datetime


class SystemStatsResponse(BaseModel):
    """Schema for system-wide statistics."""

    total_users: int
    active_users: int
    total_documents: int
    total_conversations: int
    total_storage_bytes: int
    total_storage_gb: float


class SuspendUserRequest(BaseModel):
    """Schema for suspending a user."""

    reason: str = Field(..., min_length=1, max_length=500, description="Reason for suspension")


# Response Schemas for Admin Endpoints


class UsersListResponse(BaseModel):
    """Response schema for admin user list endpoint."""

    users: list[dict]  # User model dicts
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")


class UserDetailsResponse(BaseModel):
    """Response schema for admin user details endpoint."""

    user_id: str
    email: str
    role: str
    status: str
    storage_used_bytes: int
    storage_limit_bytes: int
    document_count: int
    conversation_count: int
    collection_count: int
    created_at: datetime
    last_login_at: datetime | None


class SuspendUserResponse(BaseModel):
    """Response schema for user suspension endpoint."""

    message: str = Field(..., description="Success message")
    reason: str = Field(..., description="Reason for suspension")


class AdminDocumentsListResponse(BaseModel):
    """Response schema for admin documents list endpoint."""

    documents: list[dict]  # Each dict has document fields + user_email
    total: int = Field(..., description="Total number of documents")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")


class DeleteDocumentResponse(BaseModel):
    """Response schema for document deletion endpoint."""

    status: str = Field(..., description="Operation status (success/partial_success)")
    message: str = Field(..., description="Result message")
    document_id: str = Field(..., description="ID of deleted document")
    errors: list[str] | None = Field(default=None, description="Any errors encountered")


class CleanupDocumentsResponse(BaseModel):
    """Response schema for bulk document cleanup endpoint."""

    status: str = Field(..., description="Operation status")
    message: str = Field(..., description="Result message")
    deleted_count: int = Field(..., description="Number of documents deleted")
    total_documents: int = Field(..., description="Total documents processed")
    errors: list[str] | None = Field(default=None, description="Any errors encountered")


class CleanupAllResponse(BaseModel):
    """Response schema for nuclear cleanup endpoint."""

    status: str = Field(..., description="Operation status")
    message: str = Field(..., description="Result message")
    deleted_count: int = Field(..., description="Number of documents deleted from PostgreSQL")
    milvus_cleaned: bool = Field(..., description="Whether Milvus collection was reset")
    b2_files_deleted: int = Field(..., description="Number of files deleted from B2")
    errors: list[str] | None = Field(default=None, description="Any errors encountered")


class AuditLogsListResponse(BaseModel):
    """Response schema for audit logs list endpoint."""

    logs: list[AuditLogResponse] = Field(..., description="List of audit log entries")
    total: int = Field(..., description="Total number of logs")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Items per page")
    pages: int = Field(..., description="Total number of pages")
