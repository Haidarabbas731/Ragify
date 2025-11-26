"""
Unit tests for llm_service.py - Google Gemini LLM integration.

Tests:
- LLM configuration
- Response generation (success, empty prompts, timeout, errors)
- Streaming response generation
- Singleton pattern
"""

from unittest.mock import MagicMock, patch

import pytest

from app.services.llm_service import LLMService, get_llm_service

# Test: configure - Success


@pytest.mark.asyncio
async def test_configure_success():
    """Test successful Gemini API configuration."""

    with patch("app.services.llm_service.genai.configure") as mock_configure:
        service = LLMService()

        result = await service.configure()

        assert result is True
        assert service._configured is True
        mock_configure.assert_called_once()


# Test: configure - Failure


@pytest.mark.asyncio
async def test_configure_failure():
    """Test Gemini API configuration failure."""

    with patch("app.services.llm_service.genai.configure") as mock_configure:
        mock_configure.side_effect = Exception("Invalid API key")

        service = LLMService()

        with pytest.raises(Exception, match="Invalid API key"):
            await service.configure()

        assert service._configured is False


# Test: generate_response - Success


@pytest.mark.asyncio
async def test_generate_response_success():
    """Test successful LLM response generation."""

    with patch("app.services.llm_service.genai.configure"), patch(
        "app.services.llm_service.genai.GenerativeModel"
    ) as mock_model_class:
        # Setup mocks
        mock_response = MagicMock()
        mock_response.text = "This is a generated response."

        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        # Create and configure service
        service = LLMService()
        await service.configure()

        # Generate response
        result = await service.generate_response(
            system_prompt="You are a helpful assistant.",
            user_prompt="What is the capital of France?",
        )

        assert result == "This is a generated response."
        mock_model.generate_content.assert_called_once()


# Test: generate_response - Not configured


@pytest.mark.asyncio
async def test_generate_response_not_configured():
    """Test that generating response fails if service not configured."""

    service = LLMService()

    with pytest.raises(RuntimeError, match="not configured"):
        await service.generate_response(
            system_prompt="You are a helpful assistant.",
            user_prompt="What is the capital of France?",
        )


# Test: generate_response - Empty system prompt


@pytest.mark.asyncio
async def test_generate_response_empty_system_prompt():
    """Test that empty system prompt raises ValueError."""

    with patch("app.services.llm_service.genai.configure"):
        service = LLMService()
        await service.configure()

        with pytest.raises(ValueError, match="System prompt cannot be empty"):
            await service.generate_response(
                system_prompt="",
                user_prompt="What is the capital of France?",
            )


# Test: generate_response - Empty user prompt


@pytest.mark.asyncio
async def test_generate_response_empty_user_prompt():
    """Test that empty user prompt raises ValueError."""

    with patch("app.services.llm_service.genai.configure"):
        service = LLMService()
        await service.configure()

        with pytest.raises(ValueError, match="User prompt cannot be empty"):
            await service.generate_response(
                system_prompt="You are a helpful assistant.",
                user_prompt="   ",
            )


# Test: generate_response - Empty response


@pytest.mark.asyncio
async def test_generate_response_empty_response():
    """Test that empty LLM response raises ValueError."""

    with patch("app.services.llm_service.genai.configure"), patch(
        "app.services.llm_service.genai.GenerativeModel"
    ) as mock_model_class:
        mock_response = MagicMock()
        mock_response.text = ""

        mock_model = MagicMock()
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model

        service = LLMService()
        await service.configure()

        with pytest.raises(ValueError, match="empty response"):
            await service.generate_response(
                system_prompt="You are a helpful assistant.",
                user_prompt="What is the capital of France?",
            )


# Test: generate_response - Timeout


@pytest.mark.asyncio
async def test_generate_response_timeout():
    """Test that LLM timeout is handled correctly."""

    with patch("app.services.llm_service.genai.configure"), patch(
        "app.services.llm_service.genai.GenerativeModel"
    ) as mock_model_class:
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = TimeoutError("Request timed out")
        mock_model_class.return_value = mock_model

        service = LLMService()
        await service.configure()

        with pytest.raises(TimeoutError, match="timed out"):
            await service.generate_response(
                system_prompt="You are a helpful assistant.",
                user_prompt="What is the capital of France?",
                timeout=5,
            )


# Test: generate_response - API failure


@pytest.mark.asyncio
async def test_generate_response_api_failure():
    """Test that LLM API failure is handled correctly."""

    with patch("app.services.llm_service.genai.configure"), patch(
        "app.services.llm_service.genai.GenerativeModel"
    ) as mock_model_class:
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("API quota exceeded")
        mock_model_class.return_value = mock_model

        service = LLMService()
        await service.configure()

        with pytest.raises(Exception, match="API quota exceeded"):
            await service.generate_response(
                system_prompt="You are a helpful assistant.",
                user_prompt="What is the capital of France?",
            )


# Test: generate_response_stream - Success


@pytest.mark.asyncio
async def test_generate_response_stream_success():
    """Test successful streaming LLM response generation."""

    with patch("app.services.llm_service.genai.configure"), patch(
        "app.services.llm_service.genai.GenerativeModel"
    ) as mock_model_class:
        # Mock streaming response chunks
        mock_chunk1 = MagicMock()
        mock_chunk1.text = "This is "

        mock_chunk2 = MagicMock()
        mock_chunk2.text = "a streaming "

        mock_chunk3 = MagicMock()
        mock_chunk3.text = "response."

        mock_model = MagicMock()
        mock_model.generate_content.return_value = [mock_chunk1, mock_chunk2, mock_chunk3]
        mock_model_class.return_value = mock_model

        service = LLMService()
        await service.configure()

        # Collect streamed chunks
        chunks = []
        async for chunk in service.generate_response_stream(
            system_prompt="You are a helpful assistant.",
            user_prompt="What is the capital of France?",
        ):
            chunks.append(chunk)

        assert "".join(chunks) == "This is a streaming response."


# Test: generate_response_stream - Not configured


@pytest.mark.asyncio
async def test_generate_response_stream_not_configured():
    """Test that streaming fails if service not configured."""

    service = LLMService()

    with pytest.raises(RuntimeError, match="not configured"):
        async for _ in service.generate_response_stream(
            system_prompt="You are a helpful assistant.",
            user_prompt="What is the capital of France?",
        ):
            pass


# Test: generate_response_stream - Empty system prompt


@pytest.mark.asyncio
async def test_generate_response_stream_empty_system_prompt():
    """Test that empty system prompt raises ValueError in streaming."""

    with patch("app.services.llm_service.genai.configure"):
        service = LLMService()
        await service.configure()

        with pytest.raises(ValueError, match="System prompt cannot be empty"):
            async for _ in service.generate_response_stream(
                system_prompt="  ",
                user_prompt="What is the capital of France?",
            ):
                pass


# Test: generate_response_stream - Empty user prompt


@pytest.mark.asyncio
async def test_generate_response_stream_empty_user_prompt():
    """Test that empty user prompt raises ValueError in streaming."""

    with patch("app.services.llm_service.genai.configure"):
        service = LLMService()
        await service.configure()

        with pytest.raises(ValueError, match="User prompt cannot be empty"):
            async for _ in service.generate_response_stream(
                system_prompt="You are a helpful assistant.",
                user_prompt="",
            ):
                pass


# Test: generate_response_stream - Timeout


@pytest.mark.asyncio
async def test_generate_response_stream_timeout():
    """Test that streaming timeout is handled correctly."""

    with patch("app.services.llm_service.genai.configure"), patch(
        "app.services.llm_service.genai.GenerativeModel"
    ) as mock_model_class:
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = TimeoutError("Streaming timed out")
        mock_model_class.return_value = mock_model

        service = LLMService()
        await service.configure()

        with pytest.raises(TimeoutError, match="timed out"):
            async for _ in service.generate_response_stream(
                system_prompt="You are a helpful assistant.",
                user_prompt="What is the capital of France?",
                timeout=5,
            ):
                pass


# Test: generate_response_stream - API failure


@pytest.mark.asyncio
async def test_generate_response_stream_api_failure():
    """Test that streaming API failure is handled correctly."""

    with patch("app.services.llm_service.genai.configure"), patch(
        "app.services.llm_service.genai.GenerativeModel"
    ) as mock_model_class:
        mock_model = MagicMock()
        mock_model.generate_content.side_effect = Exception("Streaming failed")
        mock_model_class.return_value = mock_model

        service = LLMService()
        await service.configure()

        with pytest.raises(Exception, match="Streaming failed"):
            async for _ in service.generate_response_stream(
                system_prompt="You are a helpful assistant.",
                user_prompt="What is the capital of France?",
            ):
                pass


# Test: generate_response_stream - Empty chunks


@pytest.mark.asyncio
async def test_generate_response_stream_empty_chunks():
    """Test streaming with empty chunks (should be skipped)."""

    with patch("app.services.llm_service.genai.configure"), patch(
        "app.services.llm_service.genai.GenerativeModel"
    ) as mock_model_class:
        # Mock chunks with some empty
        mock_chunk1 = MagicMock()
        mock_chunk1.text = "Hello "

        mock_chunk2 = MagicMock()
        mock_chunk2.text = ""  # Empty chunk

        mock_chunk3 = MagicMock()
        mock_chunk3.text = "world"

        mock_model = MagicMock()
        mock_model.generate_content.return_value = [mock_chunk1, mock_chunk2, mock_chunk3]
        mock_model_class.return_value = mock_model

        service = LLMService()
        await service.configure()

        chunks = []
        async for chunk in service.generate_response_stream(
            system_prompt="You are a helpful assistant.",
            user_prompt="Say hello",
        ):
            chunks.append(chunk)

        assert "".join(chunks) == "Hello world"


# Test: get_llm_service - Singleton


@pytest.mark.asyncio
async def test_get_llm_service_singleton():
    """Test that get_llm_service returns singleton instance."""

    with patch("app.services.llm_service.genai.configure"):
        # Reset singleton
        import app.services.llm_service

        app.services.llm_service._llm_service = None

        # Get service twice
        service1 = await get_llm_service()
        service2 = await get_llm_service()

        assert service1 is service2
        assert service1._configured is True
