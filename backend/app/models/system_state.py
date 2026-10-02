from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Text
from sqlmodel import Field, SQLModel


class SystemState(SQLModel, table=True):
    """Small key-value store for facts about the running system (not user data).

    Used to remember which embedding model built the vector index, since not every Milvus
    flavor persists collection descriptions (Milvus Lite does not).
    """

    __tablename__ = "system_state"  # type:ignore

    key: str = Field(primary_key=True, max_length=100)
    value: str = Field(sa_column=Column(Text, nullable=False))
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), sa_column=Column(DateTime(timezone=True))
    )  # type:ignore
