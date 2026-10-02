import logging
from datetime import UTC, datetime

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.crypto import (
    EncryptionUnavailableError,
    SecretDecryptionError,
    decrypt_secret,
    encrypt_secret,
)
from app.models.user_ai_settings import UserAISettings
from app.prompts.chat_prompt import SEARCH_TOOL_NAME
from app.services.chat_service import SEARCH_TOOL
from app.services.providers.base import ChatProvider, Message, ProviderAuthError
from app.services.providers.registry import get_chat_provider

logger = logging.getLogger(__name__)


async def get_ai_settings(db: AsyncSession, user_id: str) -> UserAISettings | None:
    """
    Get a user's saved AI settings.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        UserAISettings | None: The saved settings, or None if the user has none
    """
    result = await db.exec(select(UserAISettings).where(UserAISettings.user_id == user_id))
    return result.one_or_none()


async def save_ai_settings(
    db: AsyncSession, user_id: str, provider: str, model: str, api_key: str | None
) -> UserAISettings:
    """
    Create or update a user's AI settings.

    Args:
        db: Database session
        user_id: User ID
        provider: Provider name
        model: Model id
        api_key: New API key, or None to keep the stored one

    Returns:
        UserAISettings: The saved settings

    Raises:
        EncryptionUnavailableError: If the server has no APP_ENCRYPTION_KEY
        ValueError: If there is no stored key and none was provided
    """
    row = await get_ai_settings(db, user_id)

    if api_key is None and row is None:
        raise ValueError("An API key is required")

    if row is None:
        row = UserAISettings(user_id=user_id)
    row.provider = provider
    row.model = model
    if api_key is not None:
        row.encrypted_api_key = encrypt_secret(api_key)
        row.key_last4 = api_key[-4:]
    row.updated_at = datetime.now(UTC)

    db.add(row)
    await db.commit()
    await db.refresh(row)
    logger.info(f"Saved AI settings for user {user_id} ({provider}/{model})")
    return row


async def delete_ai_settings(db: AsyncSession, user_id: str) -> bool:
    """
    Remove a user's AI settings (chat falls back to the server defaults).

    Args:
        db: Database session
        user_id: User ID

    Returns:
        bool: True if settings existed and were removed
    """
    row = await get_ai_settings(db, user_id)
    if row is None:
        return False

    await db.delete(row)
    await db.commit()
    return True


def stored_api_key(row: UserAISettings) -> str:
    """
    Decrypt a user's stored API key.

    Raises:
        ProviderAuthError: If the key can no longer be read (the server key changed)
    """
    try:
        return decrypt_secret(row.encrypted_api_key)
    except (EncryptionUnavailableError, SecretDecryptionError) as e:
        raise ProviderAuthError(
            str(e),
            user_message="Your saved API key can no longer be read. Please save it again in your settings.",
        ) from e


async def resolve_chat_provider(db: AsyncSession, user_id: str) -> ChatProvider:
    """
    Pick the chat provider for a user's request.

    A user's own saved provider, model and key win. Otherwise the server defaults are used,
    unless ALLOW_SERVER_KEY_FALLBACK is off.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        ChatProvider: Provider to run the chat agent with

    Raises:
        ProviderAuthError: If the user has no usable key and the server fallback is off
    """
    row = await get_ai_settings(db, user_id)
    if row is not None:
        return get_chat_provider(row.provider, row.model, stored_api_key(row))

    if not settings.ALLOW_SERVER_KEY_FALLBACK:
        raise ProviderAuthError(
            "No user API key and server fallback disabled",
            user_message="Add your API key in Profile > Preferences to use chat.",
        )
    return get_chat_provider()


async def check_connection(provider: ChatProvider) -> None:
    """
    Send one tiny request to confirm the key, model and tool support work.

    Args:
        provider: Provider to test

    Raises:
        ProviderError: Whatever the provider reports (bad key, unknown model, no tool support)
    """
    async for _ in provider.stream_turn(
        [Message(role="user", text="Reply with OK.")],
        f"Connectivity check. Do not call {SEARCH_TOOL_NAME}.",
        tools=[SEARCH_TOOL],
        timeout=20,
    ):
        pass
