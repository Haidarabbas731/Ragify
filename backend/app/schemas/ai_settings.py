from pydantic import BaseModel, Field, field_validator

from app.services.providers.registry import Provider

# Provider model ids look like "vendor/name:variant"
MODEL_PATTERN = r"^[A-Za-z0-9._:/\-]+$"


class AISettingsUpdate(BaseModel):
    """The user's own provider, model and API key (used to save them and to test them)."""

    provider: Provider
    model: str = Field(min_length=1, max_length=200, pattern=MODEL_PATTERN)
    # Optional once a key is stored: leaving it out keeps (or tests) the stored key
    api_key: str | None = Field(default=None, min_length=8, max_length=512)

    @field_validator("api_key")
    @classmethod
    def strip_key(cls, value: str | None) -> str | None:
        """Pasted keys often carry stray whitespace."""
        return value.strip() if value else value


class AISettingsResponse(BaseModel):
    """The user's saved settings plus what chat uses when they have none. Never contains the key."""

    provider: str | None
    model: str | None
    has_key: bool
    key_last4: str | None
    key_storage_enabled: bool
    fallback_enabled: bool
    default_provider: str
    default_model: str
    providers: list[str]


class AITestResponse(BaseModel):
    """Result of a connection test."""

    ok: bool
    message: str


class AIModel(BaseModel):
    """A model the user can pick."""

    id: str
    name: str
    context_length: int | None = None
    free: bool = False
