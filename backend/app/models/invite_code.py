import uuid
from datetime import UTC, datetime
from enum import Enum

from sqlmodel import Field, SQLModel


class InviteCodeStatus(str, Enum):
    """Invite code status states."""

    ACTIVE = "active"
    EXPIRED = "expired"
    REVOKED = "revoked"


class InviteCode(SQLModel, table=True):
    """Invite code model for invite-only registration system."""

    __tablename__ = "invite_codes"  # type:ignore

    invite_code_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True
    )

    # KB-XXXX-XXXX-XXXX format
    code: str = Field(unique=True, index=True, max_length=24)

    # Admin who created this code (nullable for bootstrap codes)
    created_by: str | None = Field(default=None)

    # Expiration
    expires_at: datetime | None = Field(default=None)

    # Usage limits
    max_uses: int = Field(default=1)
    current_uses: int = Field(default=0)

    # Status
    status: str = Field(default=InviteCodeStatus.ACTIVE.value, max_length=20)

    # Metadata
    description: str | None = Field(default=None, max_length=255)

    # Timestamp
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
