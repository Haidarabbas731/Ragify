"""
Unit tests for the chat provider registry.
"""

from unittest.mock import patch

import pytest

from app.core.config import settings
from app.services.providers.base import ProviderKeyMissingError
from app.services.providers.gemini import GeminiProvider
from app.services.providers.openai_compat import OpenAICompatProvider
from app.services.providers.registry import _build, default_model, get_chat_provider


@pytest.fixture(autouse=True)
def clear_cache():
    """The registry caches providers; start every test empty."""
    _build.cache_clear()
    yield
    _build.cache_clear()


def test_gemini_provider_uses_the_users_key_and_model():
    """The user's own key and model build the provider."""
    provider = get_chat_provider("gemini", "gemini-x", "user-key")

    assert isinstance(provider, GeminiProvider)
    assert provider.model == "gemini-x"


def test_model_defaults_to_the_suggested_model():
    """With no model chosen the configured suggestion is used."""
    with patch.object(settings, "GEMINI_MODEL", "gemini-suggested"):
        provider = get_chat_provider("gemini", None, "user-key")

    assert provider.model == "gemini-suggested"
    assert default_model("gemini") == settings.GEMINI_MODEL
    assert default_model("openrouter") == settings.OPENROUTER_MODEL


def test_openrouter_uses_openai_compatible_adapter_with_app_headers():
    """OpenRouter is built on the OpenAI-compatible adapter with attribution headers."""
    with patch("app.services.providers.registry.OpenAICompatProvider") as adapter:
        get_chat_provider("openrouter", "vendor/model", "or-key")

    adapter.assert_called_once_with(
        api_key="or-key",
        model="vendor/model",
        base_url=settings.OPENROUTER_BASE_URL,
        default_headers={"HTTP-Referer": settings.FRONTEND_URL, "X-Title": settings.APP_NAME},
    )
    assert adapter is not OpenAICompatProvider


def test_openrouter_provider_carries_the_users_key():
    """The built OpenRouter provider holds the user's own key and model."""
    provider = get_chat_provider("openrouter", "user/model", "user-key")

    assert isinstance(provider, OpenAICompatProvider)
    assert provider.model == "user/model"
    assert provider._client.api_key == "user-key"


def test_providers_are_cached_per_provider_model_and_key():
    """Same arguments reuse one instance; different arguments do not."""
    a = get_chat_provider("openrouter", "m1", "k")
    b = get_chat_provider("openrouter", "m1", "k")
    c = get_chat_provider("openrouter", "m2", "k")
    d = get_chat_provider("openrouter", "m1", "other-key")

    assert a is b
    assert a is not c
    assert a is not d


@pytest.mark.parametrize("provider", ["gemini", "openrouter"])
@pytest.mark.parametrize("missing", [None, ""])
def test_missing_key_tells_the_user_to_add_one(provider, missing):
    """Without the user's own key the call fails clearly; the server has no fallback."""
    with pytest.raises(ProviderKeyMissingError) as exc:
        get_chat_provider(provider, None, missing)

    assert "Profile > AI model" in exc.value.user_message


def test_unknown_provider_is_rejected():
    """An unknown provider name is a ValueError."""
    with pytest.raises(ValueError, match="Unknown LLM provider"):
        get_chat_provider("nope", None, "k")


def test_the_server_no_longer_has_chat_keys():
    """Chat keys are not server settings any more; only users bring them."""
    assert not hasattr(settings, "GOOGLE_API_KEY")
    assert not hasattr(settings, "OPENROUTER_API_KEY")
