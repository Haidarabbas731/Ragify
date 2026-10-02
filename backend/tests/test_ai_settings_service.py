"""
Unit tests for ai_settings_service.py - per-user provider, model and API key.
"""

from unittest.mock import patch

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.services.ai_settings_service import (
    check_connection,
    delete_ai_settings,
    get_ai_settings,
    resolve_chat_provider,
    save_ai_settings,
)
from app.services.providers.base import (
    ProviderAuthError,
    ProviderKeyMissingError,
    ProviderRateLimitError,
)
from app.services.providers.registry import _build
from tests.fakes import FakeProvider, text_turn


@pytest.mark.asyncio
async def test_save_encrypts_the_key_and_keeps_only_the_last_four(session: AsyncSession, sample_user):
    """The stored value is ciphertext; the plaintext key never reaches the table."""
    row = await save_ai_settings(
        session, sample_user.user_id, "openrouter", "vendor/model", "sk-or-v1-abcdWXYZ"
    )

    assert row.provider == "openrouter"
    assert row.model == "vendor/model"
    assert row.key_last4 == "WXYZ"
    assert "abcd" not in row.encrypted_api_key
    assert "sk-or" not in row.encrypted_api_key


@pytest.mark.asyncio
async def test_first_save_requires_a_key(session: AsyncSession, sample_user):
    """There is nothing to keep on a first save, so a key is mandatory."""
    with pytest.raises(ValueError, match="API key is required"):
        await save_ai_settings(session, sample_user.user_id, "gemini", "m", None)


@pytest.mark.asyncio
async def test_update_without_a_key_keeps_the_stored_one(session: AsyncSession, sample_user):
    """Changing only the model leaves the key untouched."""
    first = await save_ai_settings(session, sample_user.user_id, "gemini", "m1", "key-111111")
    stored = first.encrypted_api_key

    updated = await save_ai_settings(session, sample_user.user_id, "gemini", "m2", None)

    assert updated.model == "m2"
    assert updated.encrypted_api_key == stored
    assert updated.key_last4 == "1111"


@pytest.mark.asyncio
async def test_changing_provider_requires_a_new_key(session: AsyncSession, sample_user):
    """A key for one provider is never silently reused with another."""
    await save_ai_settings(session, sample_user.user_id, "gemini", "m", "key-111111")

    with pytest.raises(ValueError, match="new provider"):
        await save_ai_settings(session, sample_user.user_id, "openrouter", "vendor/m", None)

    row = await get_ai_settings(session, sample_user.user_id)
    assert (row.provider, row.model) == ("gemini", "m")

    switched = await save_ai_settings(
        session, sample_user.user_id, "openrouter", "vendor/m", "key-222222"
    )
    assert (switched.provider, switched.key_last4) == ("openrouter", "2222")


@pytest.mark.asyncio
async def test_update_with_a_key_replaces_it(session: AsyncSession, sample_user):
    """A new key replaces the old one and updates the displayed suffix."""
    await save_ai_settings(session, sample_user.user_id, "gemini", "m", "key-111111")

    row = await save_ai_settings(session, sample_user.user_id, "gemini", "m", "key-222222")

    assert row.key_last4 == "2222"


@pytest.mark.asyncio
async def test_delete_removes_the_settings(session: AsyncSession, sample_user):
    """Deleting returns True once, and the user is back on the server defaults."""
    await save_ai_settings(session, sample_user.user_id, "gemini", "m", "key-111111")

    assert await delete_ai_settings(session, sample_user.user_id) is True
    assert await get_ai_settings(session, sample_user.user_id) is None
    assert await delete_ai_settings(session, sample_user.user_id) is False


@pytest.mark.asyncio
async def test_settings_are_per_user(session: AsyncSession, sample_user, sample_admin):
    """One user's settings are invisible to another."""
    await save_ai_settings(session, sample_user.user_id, "gemini", "m", "key-111111")

    assert await get_ai_settings(session, sample_admin.user_id) is None


@pytest.mark.asyncio
async def test_resolve_uses_the_users_own_provider_model_and_decrypted_key(
    session: AsyncSession, sample_user
):
    """A saved user gets a provider built from their own choice and key."""
    await save_ai_settings(session, sample_user.user_id, "openrouter", "vendor/model", "key-111111")

    with patch("app.services.ai_settings_service.get_chat_provider") as build:
        provider = await resolve_chat_provider(session, sample_user.user_id)

    build.assert_called_once_with("openrouter", "vendor/model", "key-111111")
    assert provider is build.return_value


@pytest.mark.asyncio
async def test_resolve_without_settings_uses_the_server_defaults(session: AsyncSession, sample_user):
    """A user with no saved settings runs on the server's configured provider and key."""
    with patch("app.services.ai_settings_service.get_chat_provider") as build:
        provider = await resolve_chat_provider(session, sample_user.user_id)

    build.assert_called_once_with()
    assert provider is build.return_value


@pytest.mark.asyncio
async def test_resolve_without_user_or_server_key_asks_the_user_to_add_one(
    session: AsyncSession, sample_user
):
    """If the server has no key either, chat tells the user to add their own."""
    _build.cache_clear()  # a provider cached by another test would hide the missing key
    with (
        patch.object(settings, "LLM_PROVIDER", "gemini"),
        patch.object(settings, "GOOGLE_API_KEY", None),
        pytest.raises(ProviderKeyMissingError) as exc,
    ):
        await resolve_chat_provider(session, sample_user.user_id)

    assert "Profile > Preferences" in exc.value.user_message


@pytest.mark.asyncio
async def test_resolve_with_an_unreadable_key_asks_the_user_to_save_it_again(
    session: AsyncSession, sample_user
):
    """If the server encryption key changed, the user is told to re-enter their key."""
    await save_ai_settings(session, sample_user.user_id, "gemini", "m", "key-111111")

    with (
        patch.object(settings, "JWT_SECRET_KEY", "rotated-secret"),
        pytest.raises(ProviderAuthError) as exc,
    ):
        await resolve_chat_provider(session, sample_user.user_id)

    assert "save it again" in exc.value.user_message


@pytest.mark.asyncio
async def test_check_connection_sends_one_turn_with_the_search_tool():
    """The test request includes the agent's tool so models without tool support fail here."""
    provider = FakeProvider([text_turn("OK")])

    await check_connection(provider)

    (request,) = provider.requests
    assert request["tools"][0].name == "search_documents"


@pytest.mark.asyncio
async def test_check_connection_propagates_provider_errors():
    """A rejected key or exhausted quota surfaces unchanged for the caller to report."""
    provider = FakeProvider([[ProviderRateLimitError("quota")]])

    with pytest.raises(ProviderRateLimitError):
        await check_connection(provider)
