import uuid
from datetime import datetime

from sqlmodel import JSON, Column, Field, SQLModel


class Conversation(SQLModel, table=True):
    """Conversation model for storing chat history with messages in JSONB."""

    __tablename__ = "conversations"

    conversation_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        primary_key=True,
        index=True
    )
    user_id: str = Field(foreign_key="users.user_id", index=True)

    # Messages stored as JSONB array
    # Format: [{"role": "user"|"assistant", "content": "...", "timestamp": "...", "sources": [...]}, ...]
    messages: list[dict] = Field(default_factory=list, sa_column=Column(JSON))

    # Denormalized for performance
    message_count: int = Field(default=0)

    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, index=True)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
