"""
Unit tests for the OpenAI-compatible chat provider (used for OpenRouter).

Tests: message and tool conversion, text streaming, tool calls assembled from streamed
fragments, error mapping, input validation.
"""

import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import httpx
import openai
import pytest

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
from app.services.providers.openai_compat import OpenAICompatProvider

USER_MESSAGES = [Message(role="user", text="hi")]
TOOL = ToolSpec(name="search_documents", description="Search", parameters={"type": "object"})
REQUEST = httpx.Request("POST", "https://openrouter.ai/api/v1/chat/completions")


def chunk(content=None, tool_calls=None) -> SimpleNamespace:
    """A streamed chat-completions chunk with one choice."""
    delta = SimpleNamespace(content=content, tool_calls=tool_calls)
    return SimpleNamespace(choices=[SimpleNamespace(delta=delta)])


def fragment(index, id=None, name=None, arguments=None) -> SimpleNamespace:
    """One streamed tool-call fragment."""
    return SimpleNamespace(
        index=index, id=id, function=SimpleNamespace(name=name, arguments=arguments)
    )


def status_error(cls, code: int) -> openai.APIStatusError:
    """Build an SDK status error with the given HTTP status."""
    return cls("boom", response=httpx.Response(code, request=REQUEST), body=None)


@pytest.fixture
def provider():
    """Provider whose client returns whatever `create` is set to."""
    instance = OpenAICompatProvider("key", "test/model", "https://openrouter.ai/api/v1")
    instance._client = MagicMock()
    instance._client.with_options.return_value.chat.completions.create = AsyncMock()
    return instance


def create_mock(provider) -> AsyncMock:
    """The mocked chat.completions.create."""
    return provider._client.with_options.return_value.chat.completions.create


async def run(provider, messages=USER_MESSAGES, system="sys", tools=None, timeout=30):
    """Drain stream_turn into a list of events."""
    return [e async for e in provider.stream_turn(messages, system, tools, timeout)]


@pytest.mark.asyncio
async def test_stream_yields_text_then_done(provider, agen):
    """Content deltas stream out in order and the done message carries the full text."""
    create_mock(provider).return_value = agen(
        chunk("Hello "), SimpleNamespace(choices=[]), chunk("world")
    )

    events = await run(provider)

    assert [e.kind for e in events] == ["text", "text", "done"]
    assert events[-1].message == Message(role="assistant", text="Hello world")


@pytest.mark.asyncio
async def test_tool_calls_are_assembled_from_fragments(provider, agen):
    """Arguments streamed in pieces are joined per tool call and parsed as JSON."""
    create_mock(provider).return_value = agen(
        chunk(tool_calls=[fragment(0, id="call_a", name="search_documents", arguments='{"que')]),
        chunk(tool_calls=[fragment(0, arguments='ry": "privacy"}')]),
        chunk(tool_calls=[fragment(1, id="call_b", name="search_documents", arguments="{}")]),
    )

    events = await run(provider, tools=[TOOL])

    assert [e.kind for e in events] == ["done"]
    assert events[0].message.tool_calls == [
        ToolCall(name="search_documents", args={"query": "privacy"}, id="call_a"),
        ToolCall(name="search_documents", args={}, id="call_b"),
    ]


@pytest.mark.asyncio
async def test_invalid_tool_arguments_become_empty_args_and_missing_id_is_synthesized(
    provider, agen
):
    """Malformed argument JSON does not crash the turn; a missing id gets a stable one."""
    create_mock(provider).return_value = agen(
        chunk(tool_calls=[fragment(0, name="search_documents", arguments="{not json")])
    )

    events = await run(provider, tools=[TOOL])

    assert events[0].message.tool_calls == [
        ToolCall(name="search_documents", args={}, id="call_0")
    ]


@pytest.mark.asyncio
async def test_request_carries_model_tools_stream_and_timeout(provider, agen):
    """The request has the system prompt first, the tool schema, stream=True and the timeout."""
    create_mock(provider).return_value = agen(chunk("ok"))

    await run(provider, system="Be brief.", tools=[TOOL], timeout=7)

    provider._client.with_options.assert_called_once_with(timeout=7)
    request = create_mock(provider).call_args.kwargs
    assert request["model"] == "test/model"
    assert request["stream"] is True
    assert request["messages"][0] == {"role": "system", "content": "Be brief."}
    assert request["tools"] == [
        {
            "type": "function",
            "function": {
                "name": "search_documents",
                "description": "Search",
                "parameters": {"type": "object"},
            },
        }
    ]


@pytest.mark.asyncio
async def test_request_has_no_tools_key_without_tools(provider, agen):
    """With no tools the request omits the key entirely (some models reject an empty list)."""
    create_mock(provider).return_value = agen(chunk("ok"))

    await run(provider)

    assert "tools" not in create_mock(provider).call_args.kwargs


def test_messages_convert_to_openai_format():
    """User, assistant (with tool calls) and tool messages map to chat-completions messages."""
    call = ToolCall(name="search_documents", args={"query": "q"}, id="call_1")
    messages = [
        Message(role="user", text="question"),
        Message(role="assistant", text="earlier answer"),
        Message(role="assistant", tool_calls=[call]),
        Message(role="tool", tool_results=[ToolResult(call, {"results": []})]),
    ]

    converted = OpenAICompatProvider._to_openai(messages, "sys")

    assert converted[0] == {"role": "system", "content": "sys"}
    assert converted[1] == {"role": "user", "content": "question"}
    assert converted[2] == {"role": "assistant", "content": "earlier answer"}
    assert converted[3]["content"] is None
    assert converted[3]["tool_calls"] == [
        {
            "id": "call_1",
            "type": "function",
            "function": {"name": "search_documents", "arguments": json.dumps({"query": "q"})},
        }
    ]
    assert converted[4] == {
        "role": "tool",
        "tool_call_id": "call_1",
        "content": json.dumps({"results": []}),
    }


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (openai.APITimeoutError(request=REQUEST), ProviderTimeoutError),
        (status_error(openai.RateLimitError, 429), ProviderRateLimitError),
        (status_error(openai.AuthenticationError, 401), ProviderAuthError),
        (status_error(openai.PermissionDeniedError, 403), ProviderAuthError),
        (status_error(openai.InternalServerError, 503), ProviderUnavailableError),
        (openai.APIConnectionError(request=REQUEST), ProviderUnavailableError),
        (status_error(openai.NotFoundError, 404), ProviderError),
    ],
)
async def test_sdk_errors_map_to_provider_errors(provider, error, expected):
    """SDK failures become the provider-neutral error types."""
    create_mock(provider).side_effect = error

    with pytest.raises(expected) as exc:
        await run(provider)

    assert type(exc.value) is expected


@pytest.mark.asyncio
async def test_unknown_errors_propagate_unchanged(provider):
    """Errors that are not provider failures are not disguised."""
    create_mock(provider).side_effect = RuntimeError("bug")

    with pytest.raises(RuntimeError, match="bug"):
        await run(provider)


@pytest.mark.asyncio
async def test_validates_inputs(provider):
    """An empty system prompt or empty messages are rejected before any request."""
    with pytest.raises(ValueError, match="System prompt cannot be empty"):
        await run(provider, system=" ")
    with pytest.raises(ValueError, match="Messages cannot be empty"):
        await run(provider, messages=[])

    create_mock(provider).assert_not_called()
