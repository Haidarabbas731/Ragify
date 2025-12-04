from datetime import datetime

from pydantic import BaseModel, Field, field_validator

from app.utils.validators import validate_uuid


class ChatQuery(BaseModel):
    """Schema for chat query request."""

    query: str = Field(min_length=1, max_length=2000, description="User's question")
    conversation_id: str | None = Field(None, description="Optional conversation ID for multi-turn chat")
    collection_id: str | None = Field(None, description="Optional collection ID to filter search")
    top_k: int = Field(default=5, ge=1, le=20, description="Number of chunks to retrieve")
    stream: bool = Field(default=False, description="Enable streaming response (SSE)")

    @field_validator("conversation_id", "collection_id")
    @classmethod
    def validate_uuid_fields(cls, v: str | None) -> str | None:
        """Validate that conversation_id and collection_id are valid UUIDs if provided."""
        if v is not None:
            validate_uuid(v, "UUID field")
        return v


class SourceCitation(BaseModel):
    """Schema for source citation in chat response."""

    document_id: str
    document_name: str
    filename: str
    chunk_index: int
    chunk_text: str
    relevance_score: float


class ChatResponse(BaseModel):
    """Schema for chat response."""

    answer: str
    sources: list[SourceCitation]
    conversation_id: str
    timestamp: datetime
