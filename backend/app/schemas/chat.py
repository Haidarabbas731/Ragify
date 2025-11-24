from datetime import datetime

from pydantic import BaseModel, Field


class ChatQuery(BaseModel):
    """Schema for chat query request."""

    query: str = Field(min_length=1, max_length=2000, description="User's question")
    conversation_id: str | None = Field(None, description="Optional conversation ID for multi-turn chat")
    collection_id: str | None = Field(None, description="Optional collection ID to filter search")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of chunks to retrieve")


class SourceCitation(BaseModel):
    """Schema for source citation in chat response."""

    document_id: str
    document_name: str
    chunk_text: str
    score: float


class ChatResponse(BaseModel):
    """Schema for chat response."""

    answer: str
    sources: list[SourceCitation]
    conversation_id: str
    timestamp: datetime
