"""
Unit tests for embedding_service.py - Cohere embeddings.

Tests: query and batch embedding (validation, batching, ordering, dimension checks),
request parameters, error mapping, singleton.
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import cohere
import httpx
import pytest

from app.core.config import settings
from app.services.embedding_service import EmbeddingService, get_embedding_service
from app.services.providers.base import (
    ProviderAuthError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)

DIM = 8


def response(vectors: list[list[float]]) -> SimpleNamespace:
    """A mock embed response holding float vectors."""
    return SimpleNamespace(embeddings=SimpleNamespace(float_=vectors))


def echo_length(**kwargs) -> SimpleNamespace:
    """Mock embed that returns one vector per text; the first value is the text's length."""
    return response([[float(len(t))] * DIM for t in kwargs["texts"]])


@pytest.fixture
def service():
    """EmbeddingService with a mocked Cohere client and a small dimension."""
    with patch("app.services.embedding_service.cohere.AsyncClientV2") as client_cls:
        svc = EmbeddingService("test-key", "embed-test", DIM)
        svc._client = client_cls.return_value
        svc._client.embed = AsyncMock(side_effect=lambda **kw: echo_length(**kw))
        yield svc


def embed_calls(service) -> list[dict]:
    """Keyword arguments of every embed request made so far."""
    return [c.kwargs for c in service._client.embed.call_args_list]


@pytest.mark.asyncio
async def test_embed_query_uses_query_input_type_and_config(service):
    """Queries are embedded as search_query with the configured model and dimension."""
    vector = await service.embed_query("What is the policy?")

    assert vector == [19.0] * DIM
    (call,) = embed_calls(service)
    assert call["texts"] == ["What is the policy?"]
    assert call["model"] == "embed-test"
    assert call["input_type"] == "search_query"
    assert call["output_dimension"] == DIM
    assert call["embedding_types"] == ["float"]
    assert call["request_options"]["max_retries"] >= 1


@pytest.mark.asyncio
@pytest.mark.parametrize("query", ["", "   "])
async def test_embed_query_rejects_empty(service, query):
    """Empty queries are rejected before any API call."""
    with pytest.raises(ValueError, match="Query cannot be empty"):
        await service.embed_query(query)

    service._client.embed.assert_not_called()


@pytest.mark.asyncio
async def test_embed_batch_uses_document_input_type(service):
    """Documents are embedded as search_document."""
    await service.embed_batch(["a", "bb"])

    assert embed_calls(service)[0]["input_type"] == "search_document"


@pytest.mark.asyncio
@pytest.mark.parametrize(("count", "expected_requests"), [(1, 1), (96, 1), (97, 2), (200, 3)])
async def test_embed_batch_splits_into_requests_of_96(service, count, expected_requests):
    """Texts go out in batches of at most 96, and results keep the input order."""
    texts = ["x" * (i + 1) for i in range(count)]

    embeddings = await service.embed_batch(texts)

    calls = embed_calls(service)
    assert len(calls) == expected_requests
    assert all(len(c["texts"]) <= 96 for c in calls)
    assert [e[0] for e in embeddings] == [float(i + 1) for i in range(count)]


@pytest.mark.asyncio
async def test_embed_batch_skips_blank_texts(service):
    """Blank texts are dropped; only real texts are embedded."""
    embeddings = await service.embed_batch(["Text 1", "", "  ", "Text 2"])

    assert len(embeddings) == 2
    assert embed_calls(service)[0]["texts"] == ["Text 1", "Text 2"]


@pytest.mark.asyncio
async def test_embed_batch_rejects_empty_and_all_blank(service):
    """An empty list and a list of only blanks are both rejected."""
    with pytest.raises(ValueError, match="Texts list cannot be empty"):
        await service.embed_batch([])
    with pytest.raises(ValueError, match="All texts are empty"):
        await service.embed_batch(["", "  "])


@pytest.mark.asyncio
async def test_wrong_dimension_is_rejected(service):
    """A vector with the wrong dimension fails the call."""
    service._client.embed = AsyncMock(return_value=response([[0.1] * 3]))

    with pytest.raises(ValueError, match=f"Expected {DIM}-dim embedding"):
        await service.embed_query("test")


@pytest.mark.asyncio
async def test_missing_embeddings_are_rejected(service):
    """If the API returns fewer vectors than texts, the call fails."""
    service._client.embed = AsyncMock(return_value=response([[0.1] * DIM]))

    with pytest.raises(ValueError, match="Expected 2 embeddings, got 1"):
        await service.embed_batch(["a", "b"])


def cohere_error(cls) -> Exception:
    """Build a Cohere SDK error."""
    return cls(body={"message": "boom"})


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (cohere_error(cohere.TooManyRequestsError), ProviderRateLimitError),
        (cohere_error(cohere.UnauthorizedError), ProviderAuthError),
        (cohere_error(cohere.ForbiddenError), ProviderAuthError),
        (cohere_error(cohere.GatewayTimeoutError), ProviderTimeoutError),
        (httpx.ReadTimeout("slow"), ProviderTimeoutError),
        (cohere_error(cohere.ServiceUnavailableError), ProviderUnavailableError),
        (httpx.ConnectError("down"), ProviderUnavailableError),
    ],
)
async def test_errors_map_to_provider_errors(service, error, expected):
    """Cohere and network failures become the provider-neutral error types."""
    service._client.embed = AsyncMock(side_effect=error)

    with pytest.raises(expected) as exc:
        await service.embed_query("test")

    assert type(exc.value) is expected


@pytest.mark.asyncio
async def test_unknown_errors_propagate_unchanged(service):
    """Errors that are not provider failures are not disguised."""
    service._client.embed = AsyncMock(side_effect=RuntimeError("bug"))

    with pytest.raises(RuntimeError, match="bug"):
        await service.embed_query("test")


@pytest.mark.asyncio
async def test_get_embedding_service_is_a_configured_singleton():
    """get_embedding_service returns one shared instance built from settings."""
    import app.services.embedding_service as module

    module._embedding_service = None
    with patch("app.services.embedding_service.cohere.AsyncClientV2") as client_cls:
        first = await get_embedding_service()
        second = await get_embedding_service()

    assert first is second
    assert first.model_name == settings.EMBEDDING_MODEL
    assert first.embedding_dim == settings.EMBEDDING_DIMENSION
    client_cls.assert_called_once_with(api_key=settings.COHERE_API_KEY)
    module._embedding_service = None
