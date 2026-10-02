"""
Unit tests for the Gemini chat provider (google-genai SDK).

Tests: streaming text and tool calls, message conversion, thinking-level fallback,
error mapping, input validation.
"""

from unittest.mock import AsyncMock, patch

import pytest
from google.genai import errors, types

from app.core.config import settings
from app.services.providers.base import (
    Message,
    ProviderAuthError,
    ProviderError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
    ToolCall,
    ToolResult,
    ToolSpec,
)
from app.services.providers.gemini import GeminiProvider

USER_MESSAGES = [Message(role="user", text="hi")]
TOOL = ToolSpec(name="search_documents", description="Search", parameters={"type": "object"})


def make_chunk(*parts: types.Part) -> types.GenerateContentResponse:
    """Build a streamed response chunk with the given parts."""
    return types.GenerateContentResponse(
        candidates=[types.Candidate(content=types.Content(role="model", parts=list(parts)))]
    )


def text_part(text: str, thought: bool = False) -> types.Part:
    """A text part, optionally marked as model thought."""
    return types.Part(text=text, thought=thought or None)


def api_error(cls, code: int, message: str = "boom") -> errors.APIError:
    """Build an SDK error with the given status code."""
    return cls(code, {"error": {"message": message, "status": "X"}})


@pytest.fixture
def provider():
    """GeminiProvider with a mocked Gemini client."""
    with patch("app.services.providers.gemini.genai.Client") as client_cls:
        instance = GeminiProvider("test-key", "gemini-test")
        instance._client = client_cls.return_value
        instance._client.aio.models.generate_content_stream = AsyncMock()
        yield instance


async def run(provider, messages=USER_MESSAGES, system="sys", tools=None, timeout=30):
    """Drain stream_turn into a list of events."""
    return [e async for e in provider.stream_turn(messages, system, tools, timeout)]


def set_stream(provider, stream):
    """Make the mocked client return the given stream."""
    provider._client.aio.models.generate_content_stream.return_value = stream


@pytest.mark.asyncio
async def test_stream_yields_text_then_done(provider, agen):
    """Text deltas stream out in order; hidden thoughts are skipped; done carries the turn."""
    set_stream(
        provider,
        agen(
            make_chunk(text_part("thinking...", thought=True)),
            make_chunk(text_part("Hello ")),
            make_chunk(text_part("world")),
        ),
    )

    events = await run(provider)

    assert [e.kind for e in events] == ["text", "text", "done"]
    done = events[-1].message
    assert done.role == "assistant"
    assert done.text == "Hello world"
    assert done.tool_calls == []
    # Original parts (including thoughts) are kept so signatures can be echoed back
    assert len(done.raw.parts) == 3


@pytest.mark.asyncio
async def test_stream_collects_tool_calls(provider, agen):
    """Function-call parts become ToolCalls on the done message and are not streamed as text."""
    call = types.FunctionCall(name="search_documents", args={"query": "privacy"}, id="c1")
    set_stream(provider, agen(make_chunk(types.Part(function_call=call))))

    events = await run(provider, tools=[TOOL])

    assert [e.kind for e in events] == ["done"]
    assert events[0].message.tool_calls == [
        ToolCall(name="search_documents", args={"query": "privacy"}, id="c1")
    ]
    config = provider._client.aio.models.generate_content_stream.call_args.kwargs["config"]
    declaration = config.tools[0].function_declarations[0]
    assert declaration.name == "search_documents"
    assert config.automatic_function_calling.disable is True


@pytest.mark.asyncio
async def test_tools_without_parameters_omit_the_schema(provider, agen):
    """A tool that takes no arguments is declared without a parameter schema."""
    set_stream(provider, agen(make_chunk(text_part("ok"))))
    with_args = ToolSpec(
        name="search_documents",
        description="Search",
        parameters={"type": "object", "properties": {"query": {"type": "string"}}},
    )
    no_args = ToolSpec(
        name="list_documents", description="List", parameters={"type": "object", "properties": {}}
    )

    await run(provider, tools=[with_args, no_args])

    config = provider._client.aio.models.generate_content_stream.call_args.kwargs["config"]
    declarations = {d.name: d for d in config.tools[0].function_declarations}
    assert declarations["list_documents"].parameters_json_schema is None
    assert declarations["search_documents"].parameters_json_schema == with_args.parameters


@pytest.mark.asyncio
async def test_config_carries_system_timeout_and_retries(provider, agen):
    """System prompt, timeout and the 503 retry policy reach the request config."""
    set_stream(provider, agen(make_chunk(text_part("ok"))))

    await run(provider, system="Be brief.", timeout=7)

    kwargs = provider._client.aio.models.generate_content_stream.call_args.kwargs
    assert kwargs["model"] == "gemini-test"
    config = kwargs["config"]
    assert config.system_instruction == "Be brief."
    assert config.tools is None
    assert config.http_options.timeout == 7000
    assert config.http_options.retry_options.attempts == 3
    assert 503 in config.http_options.retry_options.http_status_codes
    assert 429 not in config.http_options.retry_options.http_status_codes


@pytest.mark.asyncio
async def test_stream_skips_chunks_without_content(provider, agen):
    """Chunks with no candidates (e.g. usage-only) are ignored."""
    set_stream(provider, agen(types.GenerateContentResponse(), make_chunk(text_part("ok"))))

    events = await run(provider)

    assert [e.kind for e in events] == ["text", "done"]


def test_messages_convert_to_gemini_contents():
    """User, assistant (with and without raw) and tool messages map to Gemini contents."""
    call = ToolCall(name="search_documents", args={"query": "q"}, id="c1")
    raw = types.Content(role="model", parts=[types.Part(function_call=types.FunctionCall(name="search_documents", args={"query": "q"}))])
    messages = [
        Message(role="user", text="question"),
        Message(role="assistant", text="earlier answer"),
        Message(role="assistant", tool_calls=[call], raw=raw),
        Message(role="tool", tool_results=[ToolResult(call, {"results": []})]),
    ]

    contents = GeminiProvider._to_contents(messages)

    assert [c.role for c in contents] == ["user", "model", "model", "user"]
    assert contents[1].parts[0].text == "earlier answer"
    assert contents[2] is raw
    response = contents[3].parts[0].function_response
    assert response.name == "search_documents"
    assert response.response == {"results": []}


@pytest.mark.asyncio
async def test_unsupported_thinking_level_is_retried_without_it(provider, agen):
    """If the model rejects the thinking level, the request is retried once without it."""
    calls = []

    async def fake_stream(**kwargs):
        calls.append(kwargs["config"].thinking_config)
        if len(calls) == 1:
            raise api_error(errors.ClientError, 400, "Thinking level MINIMAL is not supported")
        return agen(make_chunk(text_part("fine")))

    provider._client.aio.models.generate_content_stream = fake_stream

    with patch.object(settings, "GEMINI_THINKING_LEVEL", "minimal"):
        events = await run(provider)
        assert [e.kind for e in events] == ["text", "done"]
        assert calls[0] is not None
        assert calls[1] is None
        assert provider._use_thinking_config is False

        # Later requests skip the thinking config entirely
        await run(provider)
        assert calls[2] is None


@pytest.mark.asyncio
async def test_empty_thinking_level_means_model_default(provider, agen):
    """An empty GEMINI_THINKING_LEVEL sends no thinking config."""
    set_stream(provider, agen(make_chunk(text_part("ok"))))

    with patch.object(settings, "GEMINI_THINKING_LEVEL", ""):
        await run(provider)

    config = provider._client.aio.models.generate_content_stream.call_args.kwargs["config"]
    assert config.thinking_config is None


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (TimeoutError("slow"), ProviderTimeoutError),
        (api_error(errors.ServerError, 504), ProviderTimeoutError),
        (api_error(errors.ClientError, 429), ProviderRateLimitError),
        (api_error(errors.ClientError, 403), ProviderAuthError),
        (api_error(errors.ClientError, 400, "API key not valid"), ProviderAuthError),
        (api_error(errors.ServerError, 503), ProviderUnavailableError),
        (api_error(errors.ClientError, 404), ProviderError),
    ],
)
async def test_sdk_errors_map_to_provider_errors(provider, error, expected):
    """SDK and network failures become the provider-neutral error types."""
    provider._client.aio.models.generate_content_stream.side_effect = error

    with pytest.raises(expected) as exc:
        await run(provider)

    assert type(exc.value) is expected


@pytest.mark.asyncio
async def test_unknown_errors_propagate_unchanged(provider):
    """Errors that are not provider failures are not disguised."""
    provider._client.aio.models.generate_content_stream.side_effect = RuntimeError("bug")

    with pytest.raises(RuntimeError, match="bug"):
        await run(provider)


@pytest.mark.asyncio
async def test_validates_inputs(provider):
    """An empty system prompt or empty messages are rejected before any request."""
    with pytest.raises(ValueError, match="System prompt cannot be empty"):
        await run(provider, system=" ")
    with pytest.raises(ValueError, match="Messages cannot be empty"):
        await run(provider, messages=[])

    provider._client.aio.models.generate_content_stream.assert_not_called()
