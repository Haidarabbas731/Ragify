from datetime import UTC, datetime

from sqlalchemy import Column, DateTime, Text
from sqlmodel import Field, SQLModel


class UserAISettings(SQLModel, table=True):
    """A user's own chat model choice: provider, model and their encrypted API key.

    A row exists only when the user saved their own key; without one, chat uses the server
    defaults. The key is Fernet-encrypted and never returned by the API (only the last 4
    characters, for display).
    """

    __tablename__ = "user_ai_settings"  # type:ignore

    user_id: str = Field(primary_key=True, foreign_key="users.user_id", ondelete="CASCADE")
    provider: str = Field(max_length=20)
    model: str = Field(max_length=200)
    encrypted_api_key: str = Field(sa_column=Column(Text, nullable=False))
    key_last4: str = Field(max_length=4)
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(UTC), sa_column=Column(DateTime(timezone=True))
    )  # type:ignore
