"""
Unit tests for the OpenRouter model catalog.
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from google.genai import errors

import app.services.model_catalog as catalog
from app.services.providers.base import ProviderAuthError, ProviderUnavailableError


def model(id, name=None, tools=True, output=("text",), context=1000, pricing=None):
    """One entry of OpenRouter's /models response."""
    return {
        "pricing": pricing if pricing is not None else {"prompt": "0.000001", "completion": "0.000002"},
        "id": id,
        "name": name or id,
        "context_length": context,
        "supported_parameters": ["temperature", "tools"] if tools else ["temperature"],
        "architecture": {"output_modalities": list(output)},
    }


RAW = [
    model("zeta/model", "Zeta"),
    model("alpha/model:free", "alpha", pricing={"prompt": "0", "completion": "0"}),
    model("no-tools/model", tools=False),
    model("image/model", output=("image",)),
]


@pytest.fixture(autouse=True)
def reset_cache():
    """The catalog caches its result; start every test empty."""
    catalog._cache = None
    yield
    catalog._cache = None


def mock_http(*, data=None, error=None):
    """Patch httpx.AsyncClient so GET returns the given data (or raises the given error)."""
    response = MagicMock()
    response.json.return_value = {"data": data}
    response.raise_for_status = MagicMock(side_effect=error)
    client = MagicMock()
    client.get = AsyncMock(return_value=response)
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=client)
    cm.__aexit__ = AsyncMock(return_value=False)
    return patch("app.services.model_catalog.httpx.AsyncClient", return_value=cm), client


@pytest.mark.asyncio
async def test_only_tool_capable_text_models_are_listed_sorted_by_name():
    """The agent needs tools and text output; results are sorted case-insensitively."""
    patcher, _ = mock_http(data=RAW)
    with patcher:
        models = await catalog.list_openrouter_models()

    assert [m.id for m in models] == ["alpha/model:free", "zeta/model"]
    assert [m.free for m in models] == [True, False]
    assert models[0].context_length == 1000


@pytest.mark.asyncio
async def test_free_means_zero_priced_not_just_a_name_suffix():
    """Routers like openrouter/free are free without the :free suffix; paid ':free' lookalikes are not."""
    zero = {"prompt": "0", "completion": "0"}
    patcher, _ = mock_http(
        data=[
            model("openrouter/free", pricing=zero),
            model("half/free", pricing={"prompt": "0", "completion": "0.5"}),
            model("no-pricing/model", pricing={}),
        ]
    )
    with patcher:
        models = {m.id: m.free for m in await catalog.list_openrouter_models()}

    assert models == {"openrouter/free": True, "half/free": False, "no-pricing/model": False}


@pytest.mark.asyncio
async def test_result_is_cached():
    """A second call within the hour does not hit the network."""
    patcher, client = mock_http(data=RAW)
    with patcher:
        await catalog.list_openrouter_models()
        await catalog.list_openrouter_models()

    assert client.get.await_count == 1


@pytest.mark.asyncio
async def test_failures_raise_a_friendly_error_and_are_not_cached():
    """Network or format problems become ProviderUnavailableError and are retried next time."""
    patcher, _ = mock_http(error=httpx.ConnectError("down"))
    with patcher, pytest.raises(ProviderUnavailableError) as exc:
        await catalog.list_openrouter_models()

    assert "model list" in exc.value.user_message
    assert catalog._cache is None

    patcher, _ = mock_http(data=RAW)
    with patcher:
        assert len(await catalog.list_openrouter_models()) == 2


# Gemini


def gemini_model(name, display=None, actions=("generateContent",), limit=1_000_000):
    """One model as returned by Google's list call."""
    return SimpleNamespace(
        name=f"models/{name}",
        display_name=display,
        supported_actions=list(actions),
        input_token_limit=limit,
    )


GEMINI_RAW = [
    gemini_model("gemini-2.5-pro", "Gemini 2.5 Pro"),
    gemini_model("gemini-2.5-flash", "Gemini 2.5 Flash"),
    gemini_model("gemini-2.5-flash-preview-tts", "TTS"),
    gemini_model("gemini-2.5-flash-image", "Nano Banana"),
    gemini_model("gemini-2.5-computer-use-preview", "Computer Use"),
    gemini_model("gemini-embedding-001", "Embedding", actions=("embedContent",)),
    gemini_model("gemini-live-2.5-flash", "Live"),
    gemini_model("gemini-no-chat", "Counts only", actions=("countTokens",)),
    gemini_model("deep-research-pro", "Deep Research"),
    gemini_model("antigravity-preview", "Agent"),
]


def mock_gemini(models=None, error=None):
    """Patch the Gemini client so the model list is the given models (or raises the error)."""

    async def pager():
        for m in models or []:
            yield m

    client = MagicMock()
    client.aio.models.list = AsyncMock(side_effect=error, return_value=pager())
    return patch("app.services.model_catalog.genai.Client", return_value=client), client


@pytest.fixture(autouse=True)
def reset_gemini_cache():
    """The Gemini list is cached per key; start every test empty."""
    catalog._gemini_cache.clear()
    yield
    catalog._gemini_cache.clear()


@pytest.mark.asyncio
async def test_gemini_list_keeps_only_gemini_chat_models_sorted():
    """Speech, image, agent, embedding and non-generation models are left out."""
    patcher, _ = mock_gemini(GEMINI_RAW)
    with patcher:
        models = await catalog.list_gemini_models("key-aaaaaaaa")

    assert [m.id for m in models] == ["gemini-2.5-flash", "gemini-2.5-pro"]
    assert models[0].name == "Gemini 2.5 Flash"
    assert models[0].context_length == 1_000_000
    assert not any(m.free for m in models)


@pytest.mark.asyncio
async def test_gemini_list_is_cached_per_key_and_never_stores_the_raw_key():
    """The same key reuses the result, another key asks again, and only hashes are kept."""
    patcher, client = mock_gemini(GEMINI_RAW)
    with patcher:
        await catalog.list_gemini_models("key-aaaaaaaa")
        await catalog.list_gemini_models("key-aaaaaaaa")
        assert client.aio.models.list.await_count == 1

        client.aio.models.list.return_value = mock_gemini(GEMINI_RAW)[1].aio.models.list.return_value
        await catalog.list_gemini_models("key-bbbbbbbb")
        assert client.aio.models.list.await_count == 2

    assert len(catalog._gemini_cache) == 2
    assert all("key-" not in cached_key for cached_key in catalog._gemini_cache)


@pytest.mark.asyncio
async def test_gemini_cache_stays_bounded():
    """Old entries are dropped so many distinct keys cannot grow memory without limit."""
    patcher, _ = mock_gemini(GEMINI_RAW)
    with patcher, patch.object(catalog, "_GEMINI_CACHE_LIMIT", 2):
        for i in range(5):
            await catalog.list_gemini_models(f"key-{i}-xxxxxxxx")

    assert len(catalog._gemini_cache) <= 2


@pytest.mark.asyncio
async def test_a_rejected_gemini_key_raises_an_auth_error_and_is_not_cached():
    """An invalid key fails clearly, which doubles as early key validation."""
    error = errors.ClientError(400, {"error": {"message": "API key not valid. Please pass a valid API key."}})
    patcher, _ = mock_gemini(error=error)
    with patcher, pytest.raises(ProviderAuthError):
        await catalog.list_gemini_models("bad-key-xxxxxxxx")

    assert catalog._gemini_cache == {}
