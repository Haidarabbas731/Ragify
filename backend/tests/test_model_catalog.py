"""
Unit tests for the OpenRouter model catalog.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest

import app.services.model_catalog as catalog
from app.services.providers.base import ProviderUnavailableError


def model(id, name=None, tools=True, output=("text",), context=1000):
    """One entry of OpenRouter's /models response."""
    return {
        "id": id,
        "name": name or id,
        "context_length": context,
        "supported_parameters": ["temperature", "tools"] if tools else ["temperature"],
        "architecture": {"output_modalities": list(output)},
    }


RAW = [
    model("zeta/model", "Zeta"),
    model("alpha/model:free", "alpha"),
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
