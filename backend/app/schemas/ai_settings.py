from typing import Annotated

from pydantic import AfterValidator, BaseModel, Field

from app.services.providers.registry import Provider

# Provider model ids look like "vendor/name:variant"; OpenRouter's "latest" aliases start
# with a tilde, e.g. "~anthropic/claude-haiku-latest"
MODEL_PATTERN = r"^~?[A-Za-z0-9._:/\-]+$"


def _strip(value: str | None) -> str | None:
    """Pasted keys often carry stray whitespace."""
    return value.strip() if value else value


# An optional provider API key, trimmed. Optional once a key is stored: leaving it out means
# "use the stored key".
OptionalApiKey = Annotated[
    str | None, Field(min_length=8, max_length=512), AfterValidator(_strip)
]


class AISettingsUpdate(BaseModel):
    """The user's own provider, model and API key (used to save them and to test them)."""

    provider: Provider
    model: str = Field(min_length=1, max_length=200, pattern=MODEL_PATTERN)
    api_key: OptionalApiKey = None


class AISettingsResponse(BaseModel):
    """The user's saved settings plus what chat uses when they have none. Never contains the key."""

    provider: str | None
    model: str | None
    has_key: bool
    key_last4: str | None
    default_provider: str
    default_model: str
    # Whether the server (.env) has a key for its default provider. If not, a user without
    # their own key cannot chat and must add one.
    default_available: bool
    providers: list[str]


class AIModelsRequest(BaseModel):
    """Ask for the models a provider offers. Gemini needs a key to list them."""

    provider: Provider
    api_key: OptionalApiKey = None


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
