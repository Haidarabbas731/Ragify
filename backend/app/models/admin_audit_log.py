import uuid
from datetime import UTC, datetime

from sqlmodel import JSON, Column, Field, SQLModel


class AdminAuditLog(SQLModel, table=True):
    """Admin audit log for tracking all administrative actions."""

    __tablename__ = "admin_audit_logs"  # type:ignore

    audit_id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)

    admin_user_id: str = Field(index=True)
    action: str = Field(max_length=100)  # delete_user, delete_document, etc.

    target_type: str = Field(max_length=50)  # user, document, etc.
    target_id: str | None = Field(default=None)

    # Additional context (JSONB)
    details: dict | None = Field(default=None, sa_column=Column(JSON))

    ip_address: str | None = Field(default=None, max_length=45)  # IPv4 or IPv6

    timestamp: datetime = Field(default_factory=lambda: datetime.now(UTC), index=True)
