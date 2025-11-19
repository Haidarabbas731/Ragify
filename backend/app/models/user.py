import uuid
from datetime import UTC, datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class UserStatus(str, Enum):
    """User account status for type safety and validation."""

    ACTIVE = "active"
    SUSPENDED = "suspended"
    PENDING = "pending"


class User(SQLModel, table=True):
    """User model representing system users with authentication and storage management."""

    __tablename__ = "users"  # type:ignore

    user_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True
    )
    email: str = Field(unique=True, index=True, max_length=255)
    password_hash: str = Field(max_length=255)
    role: str = Field(default="user", max_length=20)

    # Storage quota management
    storage_used_bytes: int = Field(default=0)
    storage_limit_bytes: int = Field(default=1_073_741_824)  # 1GB default

    # Account status tracking
    status: str = Field(default=UserStatus.ACTIVE.value, max_length=20)

    # Login tracking for security & analytics
    last_login_at: datetime | None = Field(default=None)

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    # Soft delete flag
    is_active: bool = Field(default=True)

    # Invite tracking
    invited_by_code: str | None = Field(default=None, max_length=24)
    invited_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
