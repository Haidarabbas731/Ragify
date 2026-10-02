from functools import lru_cache
from typing import Literal, get_args

from app.core.config import settings
from app.services.providers.base import ChatProvider, ProviderAuthError
from app.services.providers.gemini import GeminiProvider
from app.services.providers.openai_compat import OpenAICompatProvider

Provider = Literal["gemini", "openrouter"]
PROVIDERS: tuple[str, ...] = get_args(Provider)


def default_model(provider: str) -> str:
    """The server's configured model for a provider."""
    return settings.GEMINI_MODEL if provider == "gemini" else settings.OPENROUTER_MODEL


@lru_cache(maxsize=128)
def _build(provider: str, model: str | None, api_key: str | None) -> ChatProvider:
    """Create (and cache) a provider; explicit arguments override the server settings."""
    if provider == "gemini":
        key = api_key or settings.GOOGLE_API_KEY
        if not key:
            raise ProviderAuthError("No Gemini API key configured")
        return GeminiProvider(key, model or default_model(provider))

    if provider == "openrouter":
        key = api_key or settings.OPENROUTER_API_KEY
        if not key:
            raise ProviderAuthError("No OpenRouter API key configured")
        return OpenAICompatProvider(
            api_key=key,
            model=model or default_model(provider),
            base_url=settings.OPENROUTER_BASE_URL,
            # OpenRouter uses these to attribute traffic to the app
            default_headers={"HTTP-Referer": settings.FRONTEND_URL, "X-Title": settings.APP_NAME},
        )

    raise ValueError(f"Unknown LLM provider: {provider}")


def get_chat_provider(
    provider: str | None = None, model: str | None = None, api_key: str | None = None
) -> ChatProvider:
    """
    Get the chat provider for a request.

    With no arguments this is the server default (``LLM_PROVIDER`` and its model and key
    from settings). Per-user overrides pass their own provider, model and key.

    Args:
        provider: ``gemini`` or ``openrouter`` (default: ``settings.LLM_PROVIDER``)
        model: Model id (default: the provider's configured model)
        api_key: API key (default: the provider's configured key)

    Returns:
        ChatProvider: A cached provider instance

    Raises:
        ValueError: If the provider name is unknown
        ProviderAuthError: If no API key is available for the provider
    """
    return _build(provider or settings.LLM_PROVIDER, model, api_key)
