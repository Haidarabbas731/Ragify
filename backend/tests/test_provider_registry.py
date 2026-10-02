"""
Unit tests for the chat provider registry.
"""

from unittest.mock import patch

import pytest

from app.core.config import settings
from app.services.providers.base import ProviderAuthError
from app.services.providers.gemini import GeminiProvider
from app.services.providers.openai_compat import OpenAICompatProvider
from app.services.providers.registry import _build, get_chat_provider


@pytest.fixture(autouse=True)
def clear_cache():
    """The registry caches providers; start every test empty."""
    _build.cache_clear()
    yield
    _build.cache_clear()


def test_default_provider_comes_from_settings():
    """With no arguments the server default provider, model and key are used."""
    with (
        patch.object(settings, "LLM_PROVIDER", "gemini"),
        patch.object(settings, "GEMINI_MODEL", "gemini-x"),
        patch.object(settings, "GOOGLE_API_KEY", "server-key"),
    ):
        provider = get_chat_provider()

    assert isinstance(provider, GeminiProvider)
    assert provider.model == "gemini-x"


def test_openrouter_uses_openai_compatible_adapter_with_app_headers():
    """OpenRouter is built on the OpenAI-compatible adapter with attribution headers."""
    with (
        patch.object(settings, "OPENROUTER_API_KEY", "or-key"),
        patch("app.services.providers.registry.OpenAICompatProvider") as adapter,
    ):
        get_chat_provider("openrouter", model="vendor/model")

    adapter.assert_called_once_with(
        api_key="or-key",
        model="vendor/model",
        base_url=settings.OPENROUTER_BASE_URL,
        default_headers={"HTTP-Referer": settings.FRONTEND_URL, "X-Title": settings.APP_NAME},
    )
    assert adapter is not OpenAICompatProvider


def test_explicit_key_and_model_override_the_server_settings():
    """Per-user overrides win over the server's key and model."""
    with patch.object(settings, "OPENROUTER_API_KEY", "server-key"):
        provider = get_chat_provider("openrouter", model="user/model", api_key="user-key")

    assert isinstance(provider, OpenAICompatProvider)
    assert provider.model == "user/model"
    assert provider._client.api_key == "user-key"


def test_providers_are_cached_per_provider_model_and_key():
    """Same arguments reuse one instance; different arguments do not."""
    with patch.object(settings, "OPENROUTER_API_KEY", "k"):
        a = get_chat_provider("openrouter", "m1")
        b = get_chat_provider("openrouter", "m1")
        c = get_chat_provider("openrouter", "m2")

    assert a is b
    assert a is not c


@pytest.mark.parametrize("provider", ["gemini", "openrouter"])
def test_missing_key_raises_auth_error(provider):
    """A provider with no key configured fails clearly instead of at request time."""
    with (
        patch.object(settings, "GOOGLE_API_KEY", None),
        patch.object(settings, "OPENROUTER_API_KEY", None),
        pytest.raises(ProviderAuthError),
    ):
        get_chat_provider(provider)


def test_unknown_provider_is_rejected():
    """An unknown provider name is a ValueError."""
    with pytest.raises(ValueError, match="Unknown LLM provider"):
        get_chat_provider("nope")
