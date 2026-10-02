import hashlib
import logging
import time

import httpx
from google import genai

from app.core.config import settings
from app.schemas.ai_settings import AIModel
from app.services.providers.base import ProviderUnavailableError
from app.services.providers.gemini import map_gemini_error

logger = logging.getLogger(__name__)

_CACHE_SECONDS = 3600
_cache: tuple[float, list[AIModel]] | None = None

# Gemini lists every model a key can call, including speech, image and agent models. Keep
# the Gemini chat models: names starting with "gemini-" minus these kinds.
_GEMINI_EXCLUDED = ("tts", "image", "computer-use", "embedding", "live", "audio", "robotics")
_GEMINI_TIMEOUT_SECONDS = 15
_GEMINI_CACHE_LIMIT = 64
# sha256(api key) -> (fetched at, models). Keys are hashed so raw secrets are never held here.
_gemini_cache: dict[str, tuple[float, list[AIModel]]] = {}


def _is_free(model: dict) -> bool:
    """A model is free if OpenRouter prices both prompt and completion tokens at zero."""
    pricing = model.get("pricing") or {}
    try:
        return float(pricing["prompt"]) == 0 and float(pricing["completion"]) == 0
    except (KeyError, TypeError, ValueError):
        return False


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
                free=_is_free(m),
            )
            for m in raw
            if "tools" in (m.get("supported_parameters") or [])
            and "text" in ((m.get("architecture") or {}).get("output_modalities") or [])
        ),
        key=lambda m: m.name.lower(),
    )
    _cache = (time.monotonic(), models)
    return models


async def list_gemini_models(api_key: str) -> list[AIModel]:
    """
    List the Gemini chat models a key can use.

    Google's model list needs an API key (an invalid key fails here, which also validates
    it). Results are cached for an hour per key, keyed by the key's hash.

    Args:
        api_key: Gemini API key

    Returns:
        list[AIModel]: Chat-capable Gemini models sorted by id

    Raises:
        ProviderError: If the key is rejected or Google cannot be reached
    """
    key_hash = hashlib.sha256(api_key.encode()).hexdigest()
    cached = _gemini_cache.get(key_hash)
    if cached and time.monotonic() - cached[0] < _CACHE_SECONDS:
        return cached[1]

    try:
        client = genai.Client(api_key=api_key)
        pager = await client.aio.models.list(config={"page_size": 100})
        found = [m async for m in pager]
    except Exception as e:
        mapped = map_gemini_error(e, _GEMINI_TIMEOUT_SECONDS)
        logger.error(f"Could not load Gemini models: {mapped}")
        if mapped is e:
            raise
        raise mapped from e

    models = sorted(
        (
            AIModel(
                id=model_id,
                name=m.display_name or model_id,
                context_length=m.input_token_limit,
            )
            for m in found
            if "generateContent" in (m.supported_actions or [])
            and (model_id := (m.name or "").removeprefix("models/")).startswith("gemini-")
            and not any(word in model_id for word in _GEMINI_EXCLUDED)
        ),
        key=lambda m: m.id,
    )

    while len(_gemini_cache) >= _GEMINI_CACHE_LIMIT:
        _gemini_cache.pop(next(iter(_gemini_cache)))  # drop the oldest entry
    _gemini_cache[key_hash] = (time.monotonic(), models)
    return models
