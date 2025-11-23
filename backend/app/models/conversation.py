import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime
from sqlmodel import JSON, Field, SQLModel


class Conversation(SQLModel, table=True):
    """Conversation model for storing chat history with messages in JSONB."""

    __tablename__ = "conversations"  # type:ignore

    conversation_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True
    )
    user_id: str = Field(foreign_key="users.user_id", index=True)

    # Messages stored as JSONB array
    # Format: [{"role": "user"|"assistant", "content": "...", "timestamp": "...", "sources": [...]}, ...]
    messages: list[dict] = Field(default_factory=list, sa_column=Column(JSON))

    # Denormalized for performance
    message_count: int = Field(default=0)

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True), index=True),
    )  # type:ignore
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), sa_column=Column(DateTime(timezone=True))
    )  # type:ignore
