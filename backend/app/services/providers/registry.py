from functools import lru_cache
from typing import Literal, get_args

from app.core.config import settings
from app.services.providers.base import ChatProvider, ProviderKeyMissingError
from app.services.providers.gemini import GeminiProvider
from app.services.providers.openai_compat import OpenAICompatProvider

Provider = Literal["gemini", "openrouter"]
PROVIDERS: tuple[str, ...] = get_args(Provider)


def default_model(provider: str) -> str:
    """The suggested model for a provider (a name only; the server holds no chat key)."""
    return settings.GEMINI_MODEL if provider == "gemini" else settings.OPENROUTER_MODEL


@lru_cache(maxsize=128)
def _build(provider: str, model: str | None, api_key: str | None) -> ChatProvider:
    """Create (and cache) a provider with the user's own key. The server has no chat key."""
    if provider not in PROVIDERS:
        raise ValueError(f"Unknown LLM provider: {provider}")
    if not api_key:
        raise ProviderKeyMissingError(f"No {provider} API key provided")

    if provider == "gemini":
        return GeminiProvider(api_key, model or default_model(provider))

    if provider == "openrouter":
        return OpenAICompatProvider(
            api_key=api_key,
            model=model or default_model(provider),
            base_url=settings.OPENROUTER_BASE_URL,
            # OpenRouter uses these to attribute traffic to the app
            default_headers={"HTTP-Referer": settings.FRONTEND_URL, "X-Title": settings.APP_NAME},
        )

    raise ValueError(f"Unknown LLM provider: {provider}")


def get_chat_provider(provider: str, model: str | None, api_key: str | None) -> ChatProvider:
    """
    Get the chat provider for a request, using the user's own key.

    Args:
        provider: ``gemini`` or ``openrouter``
        model: Model id (default: the provider's suggested model)
        api_key: The user's API key

    Returns:
        ChatProvider: A cached provider instance

    Raises:
        ValueError: If the provider name is unknown
        ProviderKeyMissingError: If no API key was given
    """
    return _build(provider, model, api_key)
