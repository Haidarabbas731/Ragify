import uuid
from datetime import UTC, datetime

from sqlalchemy import Column, DateTime
from sqlmodel import Field, SQLModel


class DocumentChunk(SQLModel, table=True):
    """
    Document chunk model for tracking text chunks stored in Milvus vector database.

    This model maintains metadata about document chunks and their vector embeddings.
    Supports embedding model migration and re-indexing (PRD Section 14).
    """

    __tablename__ = "document_chunks"  # type:ignore

    chunk_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()), primary_key=True, index=True
    )

    document_id: str = Field(foreign_key="documents.document_id", index=True)
    user_id: str = Field(foreign_key="users.user_id", index=True)

    chunk_index: int = Field(description="Sequential index of chunk within document")
    text: str = Field(description="Text content of the chunk")

    milvus_id: str | None = Field(
        default=None,
        index=True,
        description="Reference to vector ID in Milvus database",
    )

    embedding_model: str = Field(
        default="text-embedding-004",
        max_length=100,
        description="Embedding model used (for migration support)",
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC),
        sa_column=Column(DateTime(timezone=True)),  # type:ignore
    )
