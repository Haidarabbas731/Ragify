"""
Tests for the /ai endpoints (called as functions, so no HTTP stack or Redis is needed).
"""

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from pydantic import ValidationError
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.v1 import ai_settings as api
from app.core.config import settings
from app.schemas.ai_settings import AIModel, AIModelsRequest, AISettingsUpdate
from app.services.providers.base import ProviderAuthError, ProviderUnavailableError
from tests.fakes import FakeProvider, text_turn

KEY = "sk-or-v1-TOPSECRETKEY1234"


@pytest.fixture(autouse=True)
def allow_rate_limit():
    """Redis is not available in unit tests; let the rate limiter allow everything."""
    with patch("app.api.v1.ai_settings.check_rate_limit", new=AsyncMock(return_value=True)):
        yield


def update(provider="openrouter", model="vendor/model", api_key=KEY) -> AISettingsUpdate:
    """A valid save/test request body."""
    return AISettingsUpdate(provider=provider, model=model, api_key=api_key)


@pytest.mark.asyncio
async def test_get_settings_for_a_user_without_saved_settings(session: AsyncSession, sample_user):
    """Shows the server defaults and what the server allows."""
    result = await api.get_settings(sample_user, session)

    assert result.has_key is False
    assert result.provider is None
    assert result.default_provider == settings.LLM_PROVIDER
    assert result.providers == ["gemini", "openrouter"]


@pytest.mark.asyncio
@pytest.mark.parametrize(("server_key", "expected"), [("server-key", True), (None, False)])
async def test_default_available_reflects_whether_the_server_has_a_key(
    session: AsyncSession, sample_user, server_key, expected
):
    """The UI uses this to tell users without a key of their own that they must add one."""
    with (
        patch.object(settings, "LLM_PROVIDER", "gemini"),
        patch.object(settings, "GOOGLE_API_KEY", server_key),
    ):
        result = await api.get_settings(sample_user, session)

    assert result.default_available is expected


@pytest.mark.asyncio
async def test_saving_works_without_any_encryption_setup(session: AsyncSession, sample_user):
    """No extra server configuration is needed to save a key."""
    with patch.object(settings, "APP_ENCRYPTION_KEY", None):
        result = await api.update_settings(update(), sample_user, session)

    assert result.has_key is True


@pytest.mark.asyncio
async def test_saved_settings_never_expose_the_key(session: AsyncSession, sample_user):
    """The response has the last 4 characters only; the key appears nowhere in it."""
    saved = await api.update_settings(update(), sample_user, session)
    fetched = await api.get_settings(sample_user, session)

    for response in (saved, fetched):
        assert response.has_key is True
        assert response.key_last4 == "1234"
        assert response.provider == "openrouter"
        assert "TOPSECRET" not in response.model_dump_json()


@pytest.mark.asyncio
async def test_update_without_a_key_keeps_the_stored_key(session: AsyncSession, sample_user):
    """Changing only the model does not require re-entering the key."""
    await api.update_settings(update(), sample_user, session)

    result = await api.update_settings(update(model="other/model", api_key=None), sample_user, session)

    assert result.model == "other/model"
    assert result.key_last4 == "1234"


@pytest.mark.asyncio
async def test_first_save_without_a_key_is_a_400(session: AsyncSession, sample_user):
    """The first save needs a key."""
    with pytest.raises(HTTPException) as exc:
        await api.update_settings(update(api_key=None), sample_user, session)

    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_reset_removes_the_settings(session: AsyncSession, sample_user):
    """Reset deletes the saved key and model."""
    await api.update_settings(update(), sample_user, session)

    first = await api.reset_settings(sample_user, session)
    second = await api.reset_settings(sample_user, session)

    assert first["message"] == "Settings removed"
    assert second["message"] == "No saved settings"
    assert (await api.get_settings(sample_user, session)).has_key is False


@pytest.mark.parametrize(
    "bad",
    [
        {"provider": "openai"},
        {"model": ""},
        {"model": "has spaces"},
        {"model": "semi;colon"},
        {"api_key": "short"},
    ],
)
def test_request_validation(bad):
    """Unknown providers, odd model ids and tiny keys are rejected before reaching the service."""
    values = {"provider": "openrouter", "model": "vendor/model", "api_key": KEY} | bad

    with pytest.raises(ValidationError):
        AISettingsUpdate(**values)


@pytest.mark.parametrize(
    "model",
    [
        "openai/gpt-4o-mini",
        "google/gemini-2.5-flash:free",
        "~anthropic/claude-haiku-latest",  # OpenRouter alias ids start with a tilde
        "gemini-2.5-flash",
    ],
)
def test_real_model_ids_are_accepted(model):
    """Every shape of model id providers use passes validation."""
    assert update(model=model).model == model


@pytest.mark.parametrize("model", ["~", "a~b", "~~x", "vendor/~x"])
def test_a_tilde_is_only_allowed_as_the_first_character_of_an_alias(model):
    """The tilde is OpenRouter's alias marker, nothing else."""
    with pytest.raises(ValidationError):
        update(model=model)


def test_pasted_keys_are_stripped():
    """Surrounding whitespace from copy and paste is removed."""
    assert update(api_key=f"  {KEY}\n").api_key == KEY


@pytest.mark.asyncio
async def test_test_connection_success(session: AsyncSession, sample_user):
    """A working key and model report success and name the model."""
    provider = FakeProvider([text_turn("OK")])
    with patch("app.api.v1.ai_settings.get_chat_provider", return_value=provider) as build:
        result = await api.test_settings(update(), sample_user, session)

    build.assert_called_once_with("openrouter", "vendor/model", KEY)
    assert result.ok is True
    assert "vendor/model" in result.message


@pytest.mark.asyncio
async def test_test_connection_failure_is_reported_not_raised(session: AsyncSession, sample_user):
    """Provider failures come back as ok=False with the user-facing message."""
    provider = FakeProvider([[ProviderAuthError("401")]])
    with patch("app.api.v1.ai_settings.get_chat_provider", return_value=provider):
        result = await api.test_settings(update(), sample_user, session)

    assert result.ok is False
    assert result.message == ProviderAuthError.user_message


@pytest.mark.asyncio
async def test_test_connection_uses_the_stored_key_when_none_is_sent(
    session: AsyncSession, sample_user
):
    """Omitting the key tests the one already saved for the same provider."""
    await api.update_settings(update(), sample_user, session)
    provider = FakeProvider([text_turn("OK")])

    with patch("app.api.v1.ai_settings.get_chat_provider", return_value=provider) as build:
        result = await api.test_settings(update(api_key=None), sample_user, session)

    build.assert_called_once_with("openrouter", "vendor/model", KEY)
    assert result.ok is True


@pytest.mark.asyncio
@pytest.mark.parametrize("saved_provider", [None, "gemini"])
async def test_test_connection_never_falls_back_to_the_server_key(
    session: AsyncSession, sample_user, saved_provider
):
    """With no usable stored key the user is asked for one; the server key is never used."""
    if saved_provider:
        await api.update_settings(update(provider=saved_provider, model="gemini-x"), sample_user, session)

    with patch("app.api.v1.ai_settings.get_chat_provider") as build:
        result = await api.test_settings(update(api_key=None), sample_user, session)

    build.assert_not_called()
    assert result.ok is False
    assert "API key" in result.message


@pytest.mark.asyncio
async def test_test_connection_is_rate_limited(session: AsyncSession, sample_user):
    """Too many tests in a minute are refused with 429."""
    with (
        patch("app.api.v1.ai_settings.check_rate_limit", new=AsyncMock(return_value=False)),
        pytest.raises(HTTPException) as exc,
    ):
        await api.test_settings(update(), sample_user, session)

    assert exc.value.status_code == 429


def models_request(provider="gemini", api_key=None) -> AIModelsRequest:
    """A valid model-list request body."""
    return AIModelsRequest(provider=provider, api_key=api_key)


@pytest.mark.asyncio
async def test_models_for_openrouter_come_from_the_catalog_without_any_key(
    session: AsyncSession, sample_user
):
    """OpenRouter's list is public: no key is needed and a typed key is ignored."""
    models = [AIModel(id="a/b", name="A B")]
    with patch("app.api.v1.ai_settings.list_openrouter_models", new=AsyncMock(return_value=models)):
        result = await api.list_models(models_request("openrouter", KEY), sample_user, session)

    assert result == models


@pytest.mark.asyncio
async def test_gemini_models_use_the_typed_key_first(session: AsyncSession, sample_user):
    """A key typed in the form wins, so users see their models before saving anything."""
    await api.update_settings(update(provider="gemini", model="gemini-x", api_key="stored-gemini-key"), sample_user, session)
    models = [AIModel(id="gemini-2.5-flash", name="Gemini 2.5 Flash")]

    with (
        patch.object(settings, "GOOGLE_API_KEY", "server-key"),
        patch("app.api.v1.ai_settings.list_gemini_models", new=AsyncMock(return_value=models)) as lister,
    ):
        result = await api.list_models(models_request(api_key="typed-gemini-key"), sample_user, session)

    lister.assert_awaited_once_with("typed-gemini-key")
    assert result == models


@pytest.mark.asyncio
async def test_gemini_models_fall_back_to_the_saved_key_then_the_server_key(
    session: AsyncSession, sample_user
):
    """With nothing typed, the user's saved Gemini key is used; without one, the server's."""
    lister = AsyncMock(return_value=[])
    with (
        patch.object(settings, "GOOGLE_API_KEY", "server-key"),
        patch("app.api.v1.ai_settings.list_gemini_models", new=lister),
    ):
        await api.list_models(models_request(), sample_user, session)
        lister.assert_awaited_with("server-key")

        await api.update_settings(update(provider="gemini", model="gemini-x", api_key="stored-gemini-key"), sample_user, session)
        await api.list_models(models_request(), sample_user, session)
        lister.assert_awaited_with("stored-gemini-key")


@pytest.mark.asyncio
async def test_an_openrouter_key_is_never_sent_to_google(session: AsyncSession, sample_user):
    """A saved key for another provider is not used for the Gemini list."""
    await api.update_settings(update(provider="openrouter", model="vendor/model"), sample_user, session)
    lister = AsyncMock(return_value=[])

    with (
        patch.object(settings, "GOOGLE_API_KEY", None),
        patch("app.api.v1.ai_settings.list_gemini_models", new=lister),
    ):
        result = await api.list_models(models_request(), sample_user, session)

    lister.assert_not_called()
    assert result == []


@pytest.mark.asyncio
async def test_gemini_models_are_empty_when_no_key_exists_anywhere(
    session: AsyncSession, sample_user
):
    """With no key to ask Google with, the list is empty and the user types a model name."""
    with (
        patch.object(settings, "GOOGLE_API_KEY", None),
        patch("app.api.v1.ai_settings.list_gemini_models", new=AsyncMock()) as lister,
    ):
        result = await api.list_models(models_request(), sample_user, session)

    assert result == []
    lister.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("error", "status"),
    [
        (ProviderAuthError("bad key"), 400),
        (ProviderUnavailableError("down", user_message="Try again."), 503),
    ],
)
async def test_model_list_failures_keep_their_status_and_safe_message(
    session: AsyncSession, sample_user, error, status
):
    """A rejected key surfaces immediately as a clear message instead of an empty list."""
    with (
        patch("app.api.v1.ai_settings.list_gemini_models", new=AsyncMock(side_effect=error)),
        pytest.raises(HTTPException) as exc,
    ):
        await api.list_models(models_request(api_key=KEY), sample_user, session)

    assert exc.value.status_code == status
    assert exc.value.detail == error.user_message


@pytest.mark.asyncio
async def test_model_listing_is_rate_limited(session: AsyncSession, sample_user):
    """Too many list requests in a minute are refused with 429."""
    with (
        patch("app.api.v1.ai_settings.check_rate_limit", new=AsyncMock(return_value=False)),
        pytest.raises(HTTPException) as exc,
    ):
        await api.list_models(models_request(), sample_user, session)

    assert exc.value.status_code == 429


def test_the_models_request_trims_and_validates_the_key():
    """The same key rules apply as when saving."""
    assert models_request(api_key=f"  {KEY}\n").api_key == KEY
    with pytest.raises(ValidationError):
        models_request(api_key="short")
    with pytest.raises(ValidationError):
        models_request(provider="openai")
