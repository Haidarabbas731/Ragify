from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class Message(BaseModel):
    """Schema for a single message in a conversation."""

    role: str = Field(pattern=r"^(user|assistant)$")
    content: str
    timestamp: datetime
    sources: list[dict] = Field(default_factory=list)


class ConversationResponse(BaseModel):
    """Schema for full conversation data in API responses."""

    model_config = ConfigDict(from_attributes=True)

    conversation_id: str
    user_id: str
    title: str | None = None
    messages: list[Message]
    message_count: int
    created_at: datetime
    updated_at: datetime


class ConversationListItem(BaseModel):
    """Schema for lightweight conversation listing."""

    model_config = ConfigDict(from_attributes=True)

    conversation_id: str
    user_id: str
    title: str | None = None
    message_count: int
    created_at: datetime
    updated_at: datetime
    last_message: str | None = None


class ConversationListParams(BaseModel):
    """Query parameters for listing conversations."""

    limit: int = Field(50, ge=1, le=100, description="Number of conversations to return")
    offset: int = Field(0, ge=0, description="Number of conversations to skip")
