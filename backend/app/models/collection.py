import uuid
from datetime import UTC, datetime

from sqlmodel import Field, SQLModel


class Collection(SQLModel, table=True):
    """Collection model for organizing documents into named groups."""

    __tablename__ = "collections"  # type:ignore

    collection_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True
    )
    user_id: str = Field(foreign_key="users.user_id", index=True)

    name: str = Field(max_length=255)
    description: str | None = Field(default=None)

    # Timestamps
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), index=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
