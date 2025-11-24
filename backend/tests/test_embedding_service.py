from unittest.mock import AsyncMock, Mock, patch

import pytest

from app.services.embedding_service import EmbeddingService, get_embedding_service


@pytest.fixture
def embedding_service():
    """Create an EmbeddingService instance with mocked configuration."""
    service = EmbeddingService()
    service._configured = True
    return service


@pytest.fixture
def mock_embedding_result():
    """Create a mock embedding result with 1024 dimensions."""
    return {"embedding": [0.1] * 1024}


@pytest.mark.asyncio
async def test_configure_success():
    """Test successful Gemini API configuration."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.configure = Mock()

        service = EmbeddingService()
        result = await service.configure()

        assert result is True
        assert service._configured is True
        mock_genai.configure.assert_called_once()


@pytest.mark.asyncio
async def test_configure_failure():
    """Test Gemini API configuration failure."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.configure.side_effect = Exception("Invalid API key")

        service = EmbeddingService()

        with pytest.raises(Exception, match="Invalid API key"):
            await service.configure()

        assert service._configured is False


@pytest.mark.asyncio
async def test_embed_text_success(embedding_service, mock_embedding_result):
    """Test successful text embedding generation."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value=mock_embedding_result)

        text = "This is a test document"
        embedding = await embedding_service.embed_text(text)

        assert len(embedding) == 1024
        assert embedding == mock_embedding_result["embedding"]
        mock_genai.embed_content.assert_called_once()

        call_args = mock_genai.embed_content.call_args
        assert call_args[1]["content"] == text
        assert call_args[1]["task_type"] == "retrieval_document"


@pytest.mark.asyncio
async def test_embed_text_empty_string(embedding_service):
    """Test embedding fails with empty text."""
    with pytest.raises(ValueError, match="Text cannot be empty"):
        await embedding_service.embed_text("")

    with pytest.raises(ValueError, match="Text cannot be empty"):
        await embedding_service.embed_text("   ")


@pytest.mark.asyncio
async def test_embed_text_not_configured():
    """Test embedding fails when not configured."""
    service = EmbeddingService()
    service._configured = False

    with pytest.raises(RuntimeError, match="Gemini API not configured"):
        await service.embed_text("test")


@pytest.mark.asyncio
async def test_embed_text_wrong_dimension(embedding_service):
    """Test embedding fails with wrong dimension."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value={"embedding": [0.1] * 768})

        with pytest.raises(ValueError, match="Expected 1024-dim embedding, got 768"):
            await embedding_service.embed_text("test")


@pytest.mark.asyncio
async def test_embed_text_api_failure(embedding_service):
    """Test embedding handles API errors."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content.side_effect = Exception("Rate limit exceeded")

        with pytest.raises(Exception, match="Rate limit exceeded"):
            await embedding_service.embed_text("test")


@pytest.mark.asyncio
async def test_embed_batch_success(embedding_service):
    """Test successful batch embedding generation."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value={"embedding": [0.1] * 1024})

        texts = ["Document 1", "Document 2", "Document 3"]
        embeddings = await embedding_service.embed_batch(texts)

        assert len(embeddings) == 3
        assert all(len(emb) == 1024 for emb in embeddings)
        assert mock_genai.embed_content.call_count == 3


@pytest.mark.asyncio
async def test_embed_batch_filters_empty_texts(embedding_service):
    """Test batch embedding filters out empty texts."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value={"embedding": [0.1] * 1024})

        texts = ["Document 1", "", "Document 2", "   ", "Document 3"]
        embeddings = await embedding_service.embed_batch(texts)

        assert len(embeddings) == 3
        assert mock_genai.embed_content.call_count == 3


@pytest.mark.asyncio
async def test_embed_batch_empty_list(embedding_service):
    """Test batch embedding fails with empty list."""
    with pytest.raises(ValueError, match="Texts list cannot be empty"):
        await embedding_service.embed_batch([])


@pytest.mark.asyncio
async def test_embed_batch_all_empty_texts(embedding_service):
    """Test batch embedding fails when all texts are empty."""
    with pytest.raises(ValueError, match="All texts are empty"):
        await embedding_service.embed_batch(["", "   ", "\n"])


@pytest.mark.asyncio
async def test_embed_batch_not_configured():
    """Test batch embedding fails when not configured."""
    service = EmbeddingService()
    service._configured = False

    with pytest.raises(RuntimeError, match="Gemini API not configured"):
        await service.embed_batch(["test"])


@pytest.mark.asyncio
async def test_embed_batch_dimension_validation(embedding_service):
    """Test batch embedding validates all dimensions."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        # First call returns correct dimension, second returns wrong dimension
        mock_genai.embed_content = Mock(side_effect=[
            {"embedding": [0.1] * 1024},
            {"embedding": [0.2] * 512},
        ])

        with pytest.raises(ValueError, match="Expected 1024-dim embedding, got 512"):
            await embedding_service.embed_batch(["Text 1", "Text 2"])


@pytest.mark.asyncio
async def test_embed_query_success(embedding_service, mock_embedding_result):
    """Test successful query embedding generation."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value=mock_embedding_result)

        query = "What is machine learning?"
        embedding = await embedding_service.embed_query(query)

        assert len(embedding) == 1024
        assert embedding == mock_embedding_result["embedding"]
        mock_genai.embed_content.assert_called_once()

        call_args = mock_genai.embed_content.call_args
        assert call_args[1]["content"] == query
        assert call_args[1]["task_type"] == "retrieval_query"


@pytest.mark.asyncio
async def test_embed_query_empty_string(embedding_service):
    """Test query embedding fails with empty query."""
    with pytest.raises(ValueError, match="Query cannot be empty"):
        await embedding_service.embed_query("")

    with pytest.raises(ValueError, match="Query cannot be empty"):
        await embedding_service.embed_query("   ")


@pytest.mark.asyncio
async def test_embed_query_not_configured():
    """Test query embedding fails when not configured."""
    service = EmbeddingService()
    service._configured = False

    with pytest.raises(RuntimeError, match="Gemini API not configured"):
        await service.embed_query("test query")


@pytest.mark.asyncio
async def test_embed_query_wrong_dimension(embedding_service):
    """Test query embedding fails with wrong dimension."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value={"embedding": [0.1] * 768})

        with pytest.raises(ValueError, match="Expected 1024-dim embedding, got 768"):
            await embedding_service.embed_query("test query")


@pytest.mark.asyncio
async def test_embed_query_api_failure(embedding_service):
    """Test query embedding handles API errors."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content.side_effect = Exception("Service unavailable")

        with pytest.raises(Exception, match="Service unavailable"):
            await embedding_service.embed_query("test query")


@pytest.mark.asyncio
async def test_different_task_types(embedding_service):
    """Test that document and query use different task types."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value={"embedding": [0.1] * 1024})

        # Embed document
        await embedding_service.embed_text("Document text")
        doc_call_args = mock_genai.embed_content.call_args
        assert doc_call_args[1]["task_type"] == "retrieval_document"

        # Embed query
        await embedding_service.embed_query("Query text")
        query_call_args = mock_genai.embed_content.call_args
        assert query_call_args[1]["task_type"] == "retrieval_query"


@pytest.mark.asyncio
async def test_embedding_dimension_from_config(embedding_service):
    """Test that embedding dimension is taken from config."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value={"embedding": [0.1] * 1024})

        await embedding_service.embed_text("test")

        call_args = mock_genai.embed_content.call_args
        assert call_args[1]["output_dimensionality"] == embedding_service.embedding_dim


@pytest.mark.asyncio
async def test_get_embedding_service_singleton():
    """Test embedding service singleton pattern."""
    with patch("app.services.embedding_service.EmbeddingService") as MockEmbeddingService:
        mock_instance = MockEmbeddingService.return_value
        mock_instance.configure = AsyncMock(return_value=True)

        service1 = await get_embedding_service()
        service2 = await get_embedding_service()

        assert service1 is service2
        MockEmbeddingService.assert_called_once()
        mock_instance.configure.assert_called_once()


@pytest.mark.asyncio
async def test_large_text_embedding(embedding_service):
    """Test embedding generation for large text."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value={"embedding": [0.1] * 1024})

        large_text = "A" * 10000  # 10,000 character text
        embedding = await embedding_service.embed_text(large_text)

        assert len(embedding) == 1024
        mock_genai.embed_content.assert_called_once()


@pytest.mark.asyncio
async def test_special_characters_embedding(embedding_service):
    """Test embedding generation with special characters."""
    with patch("app.services.embedding_service.genai") as mock_genai:
        mock_genai.embed_content = Mock(return_value={"embedding": [0.1] * 1024})

        special_text = "Hello! @#$%^&*() 你好 مرحبا 🚀"
        embedding = await embedding_service.embed_text(special_text)

        assert len(embedding) == 1024
        call_args = mock_genai.embed_content.call_args
        assert call_args[1]["content"] == special_text
