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
