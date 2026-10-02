"""
Provider-neutral types for chat models.

The chat agent builds `Message` lists and consumes `StreamEvent`s, so it never touches a
provider SDK. Each provider adapter converts to and from its own wire format and maps its
SDK exceptions onto the `ProviderError` hierarchy below.
"""

from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol


class ProviderError(Exception):
    """Base error for model-provider failures.

    ``user_message`` is safe to show to end users; ``str(error)`` keeps the technical detail
    for logs. ``status_code`` is the HTTP status the non-streaming API responds with.
    """

    user_message = "Something went wrong while generating the answer. Please try again."
    status_code = 502

    def __init__(self, message: str = "", *, user_message: str | None = None):
        """
        Args:
            message: Technical detail, for logs
            user_message: Overrides the class-level message shown to users
        """
        super().__init__(message)
        if user_message:
            self.user_message = user_message


class ProviderTimeoutError(ProviderError, TimeoutError):
    """The provider did not answer in time."""

    user_message = (
        "The AI is taking too long to respond. Please try again or simplify your question."
    )
    status_code = 504


class ProviderRateLimitError(ProviderError):
    """The provider's rate limit or quota was hit."""

    user_message = "The AI service has reached its usage limit. Please try again in a minute."
    status_code = 429


class ProviderUnavailableError(ProviderError):
    """The provider is overloaded or down."""

    user_message = "The AI service is busy right now. Please try again in a moment."
    status_code = 503


class ProviderAuthError(ProviderError):
    """The API key is missing or was rejected."""

    user_message = "The AI provider rejected the API key. Check that it is correct."
    # Deliberately not 401: the frontend treats 401 as an expired login session.
    status_code = 400


class ProviderKeyMissingError(ProviderAuthError):
    """Neither the user nor the server has an API key for the chat model."""

    user_message = "No AI API key is set. Add your own key in Profile > Preferences to use chat."


@dataclass(frozen=True)
class ToolSpec:
    """A tool the model may call. ``parameters`` is a JSON Schema object."""

    name: str
    description: str
    parameters: dict[str, Any]


@dataclass(frozen=True)
class ToolCall:
    """A tool call requested by the model."""

    name: str
    args: dict[str, Any]
    id: str = ""


@dataclass(frozen=True)
class ToolResult:
    """The result of running a `ToolCall`, sent back to the model."""

    call: ToolCall
    result: dict[str, Any]


@dataclass
class Message:
    """One conversation turn.

    ``raw`` holds the provider-native form of an assistant turn (for example Gemini content
    with thought signatures). Adapters echo it back unchanged when the turn is replayed.
    """

    role: Literal["user", "assistant", "tool"]
    text: str = ""
    tool_calls: list[ToolCall] = field(default_factory=list)
    tool_results: list[ToolResult] = field(default_factory=list)
    raw: Any = None


@dataclass
class StreamEvent:
    """One event from a streamed model turn.

    ``text`` events carry a delta of visible answer text. A single ``done`` event closes the
    turn and carries the complete assistant `Message` (including any tool calls).
    """

    kind: Literal["text", "done"]
    text: str = ""
    message: Message | None = None


class ChatProvider(Protocol):
    """A chat model that can stream a turn and call tools."""

    def stream_turn(
        self,
        messages: list[Message],
        system: str,
        tools: list[ToolSpec] | None = None,
        timeout: int = 30,
    ) -> AsyncIterator[StreamEvent]:
        """Stream one assistant turn, optionally with tools the model may call.

        Raises:
            ProviderError: (or a subclass) for any provider failure
        """
        ...
