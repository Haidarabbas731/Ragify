"""
Unit tests for embedding_service.py - Google Gemini embeddings (google-genai SDK).

Tests:
- Client configuration
- Single text, batch and query embeddings (validation, dimension checks, task types)
- Singleton pattern
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.core.config import settings
from app.services.embedding_service import EmbeddingService, get_embedding_service

DIM = settings.EMBEDDING_DIMENSION


def embed_result(value: float = 0.1, dim: int = DIM) -> SimpleNamespace:
    """A mock embed_content response with one embedding."""
    return SimpleNamespace(embeddings=[SimpleNamespace(values=[value] * dim)])


@pytest.fixture
def embedding_service():
    """EmbeddingService with a mocked Gemini client."""
    service = EmbeddingService()
    service._client = MagicMock()
    service._client.aio.models.embed_content = AsyncMock(return_value=embed_result())
    return service


@pytest.mark.asyncio
async def test_configure_success():
    """Configuration creates the Gemini client with the API key."""
    with patch("app.services.embedding_service.genai.Client") as mock_client:
        service = EmbeddingService()

        assert await service.configure() is True

        assert service._configured is True
        mock_client.assert_called_once_with(api_key=settings.GOOGLE_API_KEY)


@pytest.mark.asyncio
async def test_configure_failure():
    """A client creation failure propagates and leaves the service unconfigured."""
    with patch(
        "app.services.embedding_service.genai.Client", side_effect=Exception("Invalid API key")
    ):
        service = EmbeddingService()

        with pytest.raises(Exception, match="Invalid API key"):
            await service.configure()

        assert service._configured is False


@pytest.mark.asyncio
async def test_embed_text_success(embedding_service):
    """embed_text returns the vector and requests a document embedding."""
    embedding = await embedding_service.embed_text("This is a test document")

    assert embedding == [0.1] * DIM
    kwargs = embedding_service._client.aio.models.embed_content.call_args.kwargs
    assert kwargs["model"] == settings.EMBEDDING_MODEL
    assert kwargs["contents"] == "This is a test document"
    assert kwargs["config"].task_type == "retrieval_document"
    assert kwargs["config"].output_dimensionality == DIM


@pytest.mark.asyncio
@pytest.mark.parametrize("text", ["", "   "])
async def test_embed_text_empty_string(embedding_service, text):
    """Empty text is rejected before any API call."""
    with pytest.raises(ValueError, match="Text cannot be empty"):
        await embedding_service.embed_text(text)

    embedding_service._client.aio.models.embed_content.assert_not_called()


@pytest.mark.asyncio
async def test_embed_text_not_configured():
    """Calling before configure() raises RuntimeError."""
    with pytest.raises(RuntimeError, match="not configured"):
        await EmbeddingService().embed_text("test")


@pytest.mark.asyncio
async def test_embed_text_wrong_dimension(embedding_service):
    """A vector with the wrong dimension is rejected."""
    embedding_service._client.aio.models.embed_content.return_value = embed_result(dim=100)

    with pytest.raises(ValueError, match="Expected .*-dim embedding"):
        await embedding_service.embed_text("test")


@pytest.mark.asyncio
async def test_embed_text_api_failure(embedding_service):
    """API errors propagate."""
    embedding_service._client.aio.models.embed_content.side_effect = Exception("API error")

    with pytest.raises(Exception, match="API error"):
        await embedding_service.embed_text("test")


@pytest.mark.asyncio
async def test_embed_batch_success_preserves_order(embedding_service):
    """Batch results come back in input order even though requests run concurrently."""

    async def fake_embed(**kwargs):
        return embed_result(value=float(len(kwargs["contents"])))

    embedding_service._client.aio.models.embed_content = fake_embed

    embeddings = await embedding_service.embed_batch(["a", "bb", "ccc"])

    assert [e[0] for e in embeddings] == [1.0, 2.0, 3.0]
    assert all(len(e) == DIM for e in embeddings)


@pytest.mark.asyncio
async def test_embed_batch_filters_empty_texts(embedding_service):
    """Blank texts are skipped; only real texts are embedded."""
    embeddings = await embedding_service.embed_batch(["Text 1", "", "  ", "Text 2"])

    assert len(embeddings) == 2
    assert embedding_service._client.aio.models.embed_content.await_count == 2


@pytest.mark.asyncio
async def test_embed_batch_empty_list(embedding_service):
    """An empty list is rejected."""
    with pytest.raises(ValueError, match="Texts list cannot be empty"):
        await embedding_service.embed_batch([])


@pytest.mark.asyncio
async def test_embed_batch_all_empty_texts(embedding_service):
    """A list of only blank texts is rejected."""
    with pytest.raises(ValueError, match="All texts are empty"):
        await embedding_service.embed_batch(["", "  "])


@pytest.mark.asyncio
async def test_embed_batch_not_configured():
    """Calling before configure() raises RuntimeError."""
    with pytest.raises(RuntimeError, match="not configured"):
        await EmbeddingService().embed_batch(["test"])


@pytest.mark.asyncio
async def test_embed_batch_dimension_validation(embedding_service):
    """Any wrong-dimension vector fails the whole batch."""
    embedding_service._client.aio.models.embed_content.side_effect = [
        embed_result(),
        embed_result(dim=100),
    ]

    with pytest.raises(ValueError, match="Expected .*-dim embedding"):
        await embedding_service.embed_batch(["Text 1", "Text 2"])


@pytest.mark.asyncio
async def test_embed_query_success(embedding_service):
    """embed_query returns the vector and requests a query embedding."""
    embedding = await embedding_service.embed_query("What is the policy?")

    assert embedding == [0.1] * DIM
    config = embedding_service._client.aio.models.embed_content.call_args.kwargs["config"]
    assert config.task_type == "retrieval_query"


@pytest.mark.asyncio
@pytest.mark.parametrize("query", ["", "   "])
async def test_embed_query_empty_string(embedding_service, query):
    """Empty queries are rejected."""
    with pytest.raises(ValueError, match="Query cannot be empty"):
        await embedding_service.embed_query(query)


@pytest.mark.asyncio
async def test_embed_query_not_configured():
    """Calling before configure() raises RuntimeError."""
    with pytest.raises(RuntimeError, match="not configured"):
        await EmbeddingService().embed_query("test")


@pytest.mark.asyncio
async def test_embed_query_wrong_dimension(embedding_service):
    """A vector with the wrong dimension is rejected."""
    embedding_service._client.aio.models.embed_content.return_value = embed_result(dim=100)

    with pytest.raises(ValueError, match="Expected .*-dim embedding"):
        await embedding_service.embed_query("test")


@pytest.mark.asyncio
async def test_embed_query_api_failure(embedding_service):
    """API errors propagate."""
    embedding_service._client.aio.models.embed_content.side_effect = Exception("API error")

    with pytest.raises(Exception, match="API error"):
        await embedding_service.embed_query("test")


@pytest.mark.asyncio
async def test_different_task_types(embedding_service):
    """Documents and queries use different task types."""
    await embedding_service.embed_text("doc")
    await embedding_service.embed_query("query")

    calls = embedding_service._client.aio.models.embed_content.call_args_list
    assert calls[0].kwargs["config"].task_type == "retrieval_document"
    assert calls[1].kwargs["config"].task_type == "retrieval_query"


@pytest.mark.asyncio
async def test_special_characters_embedding(embedding_service):
    """Unicode and special characters are passed through unchanged."""
    text = "Test with émojis 🚀 and special chars: @#$%^&*()"

    await embedding_service.embed_text(text)

    assert embedding_service._client.aio.models.embed_content.call_args.kwargs["contents"] == text


@pytest.mark.asyncio
async def test_get_embedding_service_singleton():
    """get_embedding_service returns one shared, configured instance."""
    import app.services.embedding_service as module

    module._embedding_service = None
    with patch("app.services.embedding_service.genai.Client"):
        first = await get_embedding_service()
        second = await get_embedding_service()

    assert first is second
    assert first._configured is True
    module._embedding_service = None
