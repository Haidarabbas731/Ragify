import logging
import time

import httpx

from app.core.config import settings
from app.schemas.ai_settings import AIModel
from app.services.providers.base import ProviderUnavailableError

logger = logging.getLogger(__name__)

_CACHE_SECONDS = 3600
_cache: tuple[float, list[AIModel]] | None = None


async def list_openrouter_models() -> list[AIModel]:
    """
    List OpenRouter models usable by the chat agent.

    The agent needs tool calling and text output, so other models are left out. The list
    is public (no key needed) and cached for an hour.

    Returns:
        list[AIModel]: Models sorted by name

    Raises:
        ProviderUnavailableError: If the list cannot be loaded
    """
    global _cache

    if _cache and time.monotonic() - _cache[0] < _CACHE_SECONDS:
        return _cache[1]

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(f"{settings.OPENROUTER_BASE_URL}/models")
            response.raise_for_status()
            raw = response.json()["data"]
    except (httpx.HTTPError, KeyError, ValueError) as e:
        logger.error(f"Could not load OpenRouter models: {e}")
        raise ProviderUnavailableError(
            str(e), user_message="Could not load the OpenRouter model list. Please try again."
        ) from e

    models = sorted(
        (
            AIModel(
                id=m["id"],
                name=m.get("name") or m["id"],
                context_length=m.get("context_length"),
                free=m["id"].endswith(":free"),
            )
            for m in raw
            if "tools" in (m.get("supported_parameters") or [])
            and "text" in ((m.get("architecture") or {}).get("output_modalities") or [])
        ),
        key=lambda m: m.name.lower(),
    )
    _cache = (time.monotonic(), models)
    return models
