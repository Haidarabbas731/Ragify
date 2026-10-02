"""Per-user AI model settings: choose a provider and model, and bring your own API key."""

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.db.database import get_session
from app.models.user import User
from app.schemas.ai_settings import (
    AIModel,
    AIModelsRequest,
    AISettingsResponse,
    AISettingsUpdate,
    AITestResponse,
)
from app.schemas.common import MessageResponse
from app.services.ai_settings_service import (
    check_connection,
    delete_ai_settings,
    get_ai_settings,
    save_ai_settings,
    stored_api_key,
)
from app.services.model_catalog import list_gemini_models, list_openrouter_models
from app.services.providers.base import ProviderAuthError, ProviderError
from app.services.providers.registry import (
    PROVIDERS,
    default_model,
    get_chat_provider,
    server_key_available,
)
from app.services.redis_service import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.get("/settings", response_model=AISettingsResponse)
async def get_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> AISettingsResponse:
    """
    Get the user's AI settings and what chat uses when they have none.

    The API key is never returned, only whether one is saved and its last 4 characters.
    """
    row = await get_ai_settings(db, current_user.user_id)
    return AISettingsResponse(
        provider=row.provider if row else None,
        model=row.model if row else None,
        has_key=row is not None,
        key_last4=row.key_last4 if row else None,
        default_provider=settings.LLM_PROVIDER,
        default_model=default_model(settings.LLM_PROVIDER),
        default_available=server_key_available(settings.LLM_PROVIDER),
        providers=list(PROVIDERS),
    )


@router.put("/settings", response_model=AISettingsResponse)
async def update_settings(
    request: AISettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> AISettingsResponse:
    """
    Save the user's provider, model and API key.

    Leave `api_key` out to change only the provider or model and keep the stored key.
    """
    try:
        await save_ai_settings(
            db, current_user.user_id, request.provider, request.model, request.api_key
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    return await get_settings(current_user, db)


@router.delete("/settings", response_model=MessageResponse)
async def reset_settings(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> dict:
    """Remove the saved key and model; chat goes back to the server defaults."""
    removed = await delete_ai_settings(db, current_user.user_id)
    return {"message": "Settings removed" if removed else "No saved settings"}


@router.post("/settings/test", response_model=AITestResponse)
async def test_settings(
    request: AISettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> AITestResponse:
    """
    Check that a provider, model and key work and that the model supports tool calling.

    Uses the key in the request, or the stored one if it is left out. The server's own key
    is never used here, so this cannot be used as a free proxy.
    """
    if not await check_rate_limit(f"ai-test:{current_user.user_id}", max_requests=10, window_seconds=60):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many connection tests. Please wait a minute.",
        )

    try:
        api_key = request.api_key
        if api_key is None:
            row = await get_ai_settings(db, current_user.user_id)
            if row is None or row.provider != request.provider:
                raise ProviderAuthError(
                    "No key to test", user_message="Enter an API key to test the connection."
                )
            api_key = stored_api_key(row)

        await check_connection(get_chat_provider(request.provider, request.model, api_key))
    except ProviderError as e:
        logger.info(f"AI settings test failed for user {current_user.user_id}: {e}")
        return AITestResponse(ok=False, message=e.user_message)

    return AITestResponse(ok=True, message=f"Connected. {request.model} responded and supports tools.")


@router.post("/models", response_model=list[AIModel])
async def list_models(
    request: AIModelsRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
) -> list[AIModel]:
    """
    List models the user can pick for a provider.

    OpenRouter returns only models that support tool calling (no key needed). Gemini lists
    the chat models a key can use; the key is the one in the request, else the user's saved
    Gemini key, else the server's. With no key available the list is empty and the user types
    a model name. The key is used for this one call and never stored or logged.
    """
    if not await check_rate_limit(
        f"ai-models:{current_user.user_id}", max_requests=30, window_seconds=60
    ):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait a minute.",
        )

    try:
        if request.provider == "openrouter":
            return await list_openrouter_models()

        api_key = request.api_key
        if api_key is None:
            row = await get_ai_settings(db, current_user.user_id)
            if row is not None and row.provider == "gemini":
                api_key = stored_api_key(row)
        api_key = api_key or settings.GOOGLE_API_KEY
        return await list_gemini_models(api_key) if api_key else []
    except ProviderError as e:
        raise HTTPException(status_code=e.status_code, detail=e.user_message) from e
