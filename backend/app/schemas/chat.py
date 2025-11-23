from datetime import datetime

from pydantic import BaseModel, Field


class ChatQuery(BaseModel):
    """Schema for chat query request."""

    query: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = None
    top_k: int = Field(default=5, ge=1, le=20)


class SourceCitation(BaseModel):
    """Schema for source citation in chat response."""

    document_id: str
    chunk_id: str
    text: str
    score: float
    filename: str | None = None


class ChatResponse(BaseModel):
    """Schema for chat response."""

    answer: str
    sources: list[SourceCitation]
    conversation_id: str
    timestamp: datetime
