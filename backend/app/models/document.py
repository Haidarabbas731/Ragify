import uuid
from datetime import UTC, datetime
from enum import Enum

from sqlalchemy import Column, DateTime
from sqlmodel import JSON, Field, SQLModel


class DocumentStatus(str, Enum):
    """Document processing status states."""

    PROCESSING = "processing"
    ACTIVE = "active"
    DELETED = "deleted"
    ERROR = "error"


class Document(SQLModel, table=True):
    """Document model for uploaded files with processing status tracking."""

    __tablename__ = "documents"  # type:ignore

    document_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True
    )
    user_id: str = Field(foreign_key="users.user_id", index=True)
    collection_id: str | None = Field(
        default=None, foreign_key="collections.collection_id", index=True
    )

    filename: str = Field(max_length=255)
    file_type: str = Field(max_length=100)
    size_bytes: int
    chunks_count: int = Field(default=0)

    # B2 storage reference
    storage_key: str = Field(unique=True, max_length=500)

    # Flexible metadata storage (category, tags, custom fields)
    doc_metadata: dict = Field(default_factory=dict, sa_column=Column(JSON))  # type:ignore

    # Processing status
    status: str = Field(
        default=DocumentStatus.PROCESSING.value, index=True, max_length=20
    )

    # Error tracking for failed processing
    error_message: str | None = Field(default=None)

    # Timestamps
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(UTC), sa_column=Column(DateTime(timezone=True), index=True))  # type:ignore
    processed_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))  # type:ignore
    deleted_at: datetime | None = Field(default=None, sa_column=Column(DateTime(timezone=True)))  # type:ignore
