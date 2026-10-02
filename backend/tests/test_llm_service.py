"""
Unit tests for llm_service.py - Google Gemini integration (google-genai SDK).

Tests:
- Client configuration
- Non-streamed generation (success, validation, timeout, errors)
- Streamed turns with tool calls
- Thinking-level fallback when a model rejects it
- Singleton pattern
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from google.genai import errors, types

from app.core.config import settings
from app.services.llm_service import LLMService, get_llm_service


def make_chunk(*parts: types.Part) -> types.GenerateContentResponse:
    """Build a streamed response chunk with the given parts."""
    return types.GenerateContentResponse(
        candidates=[types.Candidate(content=types.Content(role="model", parts=list(parts)))]
    )


def text_part(text: str, thought: bool = False) -> types.Part:
    """A text part, optionally marked as model thought."""
    return types.Part(text=text, thought=thought or None)


async def agen(*items):
    """Async iterator over the given items (stands in for a streamed response)."""
    for item in items:
        yield item


def thinking_error() -> errors.ClientError:
    """The 400 the API returns when a thinking level is unsupported."""
    return errors.ClientError(
        400,
        {"error": {"code": 400, "message": "Thinking level MINIMAL is not supported", "status": "INVALID_ARGUMENT"}},
    )


@pytest.fixture
def service():
    """LLMService with a mocked Gemini client."""
    svc = LLMService()
    svc._client = MagicMock()
    return svc


# Test: configure


@pytest.mark.asyncio
async def test_configure_success():
    """Configuration creates the Gemini client with the API key."""
    with patch("app.services.llm_service.genai.Client") as mock_client:
        svc = LLMService()

        assert await svc.configure() is True

        assert svc._configured is True
        mock_client.assert_called_once_with(api_key=settings.GOOGLE_API_KEY)


@pytest.mark.asyncio
async def test_configure_failure():
    """A client creation failure propagates and leaves the service unconfigured."""
    with patch("app.services.llm_service.genai.Client", side_effect=Exception("Invalid API key")):
        svc = LLMService()

        with pytest.raises(Exception, match="Invalid API key"):
            await svc.configure()

        assert svc._configured is False


# Test: generate_response


@pytest.mark.asyncio
async def test_generate_response_success(service):
    """Returns the model text and passes system prompt, limits and timeout through."""
    service._client.aio.models.generate_content = AsyncMock(
        return_value=SimpleNamespace(text="Hello there")
    )

    result = await service.generate_response(
        "Be brief.", "Say hi", timeout=7, max_tokens=20, temperature=0.0
    )

    assert result == "Hello there"
    kwargs = service._client.aio.models.generate_content.call_args.kwargs
    assert kwargs["contents"] == "Say hi"
    config = kwargs["config"]
    assert config.system_instruction == "Be brief."
    assert config.max_output_tokens == 20
    assert config.temperature == 0.0
    assert config.http_options.timeout == 7000
    assert config.http_options.retry_options.attempts == 3
    assert 503 in config.http_options.retry_options.http_status_codes
    assert 429 not in config.http_options.retry_options.http_status_codes
    assert config.automatic_function_calling.disable is True


@pytest.mark.asyncio
async def test_generate_response_not_configured():
    """Calling before configure() raises RuntimeError."""
    with pytest.raises(RuntimeError, match="not configured"):
        await LLMService().generate_response("sys", "user")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("system", "user", "message"),
    [("", "hi", "System prompt cannot be empty"), ("  ", "hi", "System prompt cannot be empty"),
     ("sys", "", "User prompt cannot be empty"), ("sys", "  ", "User prompt cannot be empty")],
)
async def test_generate_response_rejects_empty_prompts(service, system, user, message):
    """Empty system or user prompts are rejected before any API call."""
    with pytest.raises(ValueError, match=message):
        await service.generate_response(system, user)

    service._client.aio.models.generate_content.assert_not_called()


@pytest.mark.asyncio
async def test_generate_response_empty_response(service):
    """An empty model reply is an error."""
    service._client.aio.models.generate_content = AsyncMock(return_value=SimpleNamespace(text=""))

    with pytest.raises(ValueError, match="empty response"):
        await service.generate_response("sys", "user")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "error",
    [TimeoutError("boom"), errors.ServerError(504, {"error": {"message": "Deadline expired"}})],
)
async def test_generate_response_timeout(service, error):
    """Timeouts (client-side or 504) become TimeoutError."""
    service._client.aio.models.generate_content = AsyncMock(side_effect=error)

    with pytest.raises(TimeoutError, match="timed out after 5 seconds"):
        await service.generate_response("sys", "user", timeout=5)


@pytest.mark.asyncio
async def test_generate_response_api_failure(service):
    """Other API errors propagate unchanged."""
    service._client.aio.models.generate_content = AsyncMock(side_effect=Exception("API error"))

    with pytest.raises(Exception, match="API error"):
        await service.generate_response("sys", "user")


# Test: thinking-level fallback


@pytest.mark.asyncio
async def test_unsupported_thinking_level_is_retried_without_it(service):
    """If the model rejects the thinking level, the call is retried once without it."""
    service._client.aio.models.generate_content = AsyncMock(
        side_effect=[thinking_error(), SimpleNamespace(text="ok")]
    )

    with patch.object(settings, "GEMINI_THINKING_LEVEL", "minimal"):
        assert await service.generate_response("sys", "user") == "ok"
        calls = service._client.aio.models.generate_content.call_args_list
        assert calls[0].kwargs["config"].thinking_config is not None
        assert calls[1].kwargs["config"].thinking_config is None
        assert service._use_thinking_config is False

        # Later calls skip the thinking config entirely
        service._client.aio.models.generate_content = AsyncMock(return_value=SimpleNamespace(text="again"))
        await service.generate_response("sys", "user")
        assert service._client.aio.models.generate_content.call_args.kwargs["config"].thinking_config is None


@pytest.mark.asyncio
async def test_thinking_level_empty_means_model_default(service):
    """An empty GEMINI_THINKING_LEVEL sends no thinking config."""
    service._client.aio.models.generate_content = AsyncMock(return_value=SimpleNamespace(text="ok"))

    with patch.object(settings, "GEMINI_THINKING_LEVEL", ""):
        await service.generate_response("sys", "user")

    assert service._client.aio.models.generate_content.call_args.kwargs["config"].thinking_config is None


# Test: stream_turn


@pytest.mark.asyncio
async def test_stream_turn_yields_text_then_done(service):
    """Text deltas stream out in order; hidden thoughts are skipped; done carries content."""
    stream = agen(
        make_chunk(text_part("thinking...", thought=True)),
        make_chunk(text_part("Hello ")),
        make_chunk(text_part("world")),
    )
    service._client.aio.models.generate_content_stream = AsyncMock(return_value=stream)
    contents = [types.Content(role="user", parts=[types.Part.from_text(text="hi")])]

    events = [e async for e in service.stream_turn(contents, "sys")]

    assert [e.kind for e in events] == ["text", "text", "done"]
    assert "".join(e.text for e in events if e.kind == "text") == "Hello world"
    assert events[-1].function_calls == []
    assert events[-1].model_content.role == "model"
    # Original parts (including thoughts) are kept so signatures can be echoed back
    assert len(events[-1].model_content.parts) == 3


@pytest.mark.asyncio
async def test_stream_turn_collects_function_calls(service):
    """Function-call parts are reported on the done event and not streamed as text."""
    call = types.FunctionCall(name="search_documents", args={"query": "privacy"})
    service._client.aio.models.generate_content_stream = AsyncMock(
        return_value=agen(make_chunk(types.Part(function_call=call)))
    )
    contents = [types.Content(role="user", parts=[types.Part.from_text(text="q")])]
    tool = types.Tool(function_declarations=[types.FunctionDeclaration(name="search_documents")])

    events = [e async for e in service.stream_turn(contents, "sys", tools=[tool])]

    assert [e.kind for e in events] == ["done"]
    assert events[0].function_calls[0].args == {"query": "privacy"}
    config = service._client.aio.models.generate_content_stream.call_args.kwargs["config"]
    assert config.tools == [tool]
    assert config.automatic_function_calling.disable is True


@pytest.mark.asyncio
async def test_stream_turn_skips_chunks_without_content(service):
    """Chunks with no candidates (e.g. usage-only) are ignored."""
    service._client.aio.models.generate_content_stream = AsyncMock(
        return_value=agen(types.GenerateContentResponse(), make_chunk(text_part("ok")))
    )
    contents = [types.Content(role="user", parts=[types.Part.from_text(text="q")])]

    events = [e async for e in service.stream_turn(contents, "sys")]

    assert [e.kind for e in events] == ["text", "done"]


@pytest.mark.asyncio
async def test_stream_turn_not_configured():
    """Streaming before configure() raises RuntimeError."""
    with pytest.raises(RuntimeError, match="not configured"):
        async for _ in LLMService().stream_turn([MagicMock()], "sys"):
            pass


@pytest.mark.asyncio
async def test_stream_turn_validates_inputs(service):
    """Empty system prompt or contents are rejected."""
    with pytest.raises(ValueError, match="System prompt cannot be empty"):
        async for _ in service.stream_turn([MagicMock()], " "):
            pass
    with pytest.raises(ValueError, match="Contents cannot be empty"):
        async for _ in service.stream_turn([], "sys"):
            pass


@pytest.mark.asyncio
async def test_stream_turn_timeout(service):
    """A timeout while streaming becomes TimeoutError."""
    service._client.aio.models.generate_content_stream = AsyncMock(side_effect=TimeoutError("slow"))
    contents = [types.Content(role="user", parts=[types.Part.from_text(text="q")])]

    with pytest.raises(TimeoutError, match="timed out"):
        async for _ in service.stream_turn(contents, "sys", timeout=3):
            pass


@pytest.mark.asyncio
async def test_stream_turn_api_failure(service):
    """Other API errors propagate."""
    service._client.aio.models.generate_content_stream = AsyncMock(side_effect=Exception("API error"))
    contents = [types.Content(role="user", parts=[types.Part.from_text(text="q")])]

    with pytest.raises(Exception, match="API error"):
        async for _ in service.stream_turn(contents, "sys"):
            pass


@pytest.mark.asyncio
async def test_stream_turn_retries_without_unsupported_thinking(service):
    """A rejected thinking level in a stream is retried without it before any output."""
    calls = []

    async def fake_stream(**kwargs):
        calls.append(kwargs["config"].thinking_config)
        if len(calls) == 1:
            raise thinking_error()
        return agen(make_chunk(text_part("fine")))

    service._client.aio.models.generate_content_stream = fake_stream
    contents = [types.Content(role="user", parts=[types.Part.from_text(text="q")])]

    with patch.object(settings, "GEMINI_THINKING_LEVEL", "minimal"):
        events = [e async for e in service.stream_turn(contents, "sys")]

    assert [e.kind for e in events] == ["text", "done"]
    assert calls[0] is not None
    assert calls[1] is None


# Test: singleton


@pytest.mark.asyncio
async def test_get_llm_service_singleton():
    """get_llm_service returns one shared, configured instance."""
    import app.services.llm_service as module

    module._llm_service = None
    with patch("app.services.llm_service.genai.Client"):
        first = await get_llm_service()
        second = await get_llm_service()

    assert first is second
    assert first._configured is True
    module._llm_service = None
