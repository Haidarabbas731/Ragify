import logging
from collections.abc import AsyncIterator

from google import genai
from google.genai import errors, types

from app.core.config import settings
from app.services.providers.base import (
    Message,
    ProviderAuthError,
    ProviderError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
    StreamEvent,
    ToolCall,
    ToolSpec,
)

logger = logging.getLogger(__name__)

# Gemini regularly returns transient 503 ("high demand") responses. Retry the request a
# couple of times with a short backoff before giving up. 429 is deliberately not retried:
# it means a quota is exhausted and retrying only wastes requests. This only covers the
# request itself; an error after a stream has started is reported to the caller.
_RETRY_OPTIONS = types.HttpRetryOptions(
    attempts=3,
    initial_delay=0.5,
    max_delay=4.0,
    http_status_codes=[500, 502, 503],
)


# HTTP status -> the provider error it means. Statuses not listed are classified by
# `_error_class`.
_ERROR_BY_STATUS: dict[int, type[ProviderError]] = {
    408: ProviderTimeoutError,
    504: ProviderTimeoutError,
    429: ProviderRateLimitError,
    401: ProviderAuthError,
    403: ProviderAuthError,
}


def _error_class(status: int, message: str) -> type[ProviderError]:
    """Pick the provider error for an HTTP status that is not in the table."""
    if status in _ERROR_BY_STATUS:
        return _ERROR_BY_STATUS[status]
    if status == 400 and "api key" in message.lower():  # Google reports bad keys as 400
        return ProviderAuthError
    return ProviderUnavailableError if status >= 500 else ProviderError


def map_gemini_error(error: Exception, timeout: int) -> Exception:
    """Translate SDK and network errors into `ProviderError`s; pass others through."""
    if isinstance(error, TimeoutError) or "timeout" in type(error).__name__.lower():
        return ProviderTimeoutError(f"LLM request timed out after {timeout} seconds")
    if isinstance(error, errors.APIError):
        return _error_class(error.code, str(error))(str(error))
    return error


class GeminiProvider:
    """Google Gemini chat provider (native SDK, so thinking control and signatures work)."""

    def __init__(self, api_key: str, model: str):
        """
        Args:
            api_key: Gemini API key
            model: Model name, e.g. ``gemini-2.5-flash``
        """
        self.model = model
        self._client = genai.Client(api_key=api_key)
        # Cleared if the model rejects the configured thinking level
        self._use_thinking_config = True

    def _thinking_config(self) -> types.ThinkingConfig | None:
        """Build the thinking config from settings (None leaves the model default)."""
        level = settings.GEMINI_THINKING_LEVEL.strip().upper()
        if not level or not self._use_thinking_config:
            return None
        return types.ThinkingConfig(thinking_level=types.ThinkingLevel(level))

    def _disable_thinking_if_unsupported(self, error: Exception) -> bool:
        """
        Turn off the thinking config if the model rejected it.

        Returns:
            bool: True if thinking was just disabled and the call should be retried
        """
        if (
            self._thinking_config() is not None
            and isinstance(error, errors.ClientError)
            and error.code == 400
            and "thinking" in str(error).lower()
        ):
            logger.warning(
                f"Model {self.model} rejected thinking level "
                f"'{settings.GEMINI_THINKING_LEVEL}'; continuing without it"
            )
            self._use_thinking_config = False
            return True
        return False

    @staticmethod
    def _to_contents(messages: list[Message]) -> list[types.Content]:
        """Convert neutral messages to Gemini contents."""
        contents: list[types.Content] = []
        for message in messages:
            if message.role == "user":
                contents.append(
                    types.Content(role="user", parts=[types.Part.from_text(text=message.text)])
                )
            elif message.role == "assistant":
                # Replay the model's own content when we have it (keeps thought signatures)
                contents.append(
                    message.raw
                    or types.Content(role="model", parts=[types.Part.from_text(text=message.text)])
                )
            else:
                contents.append(
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_function_response(
                                name=r.call.name, response=r.result
                            )
                            for r in message.tool_results
                        ],
                    )
                )
        return contents

    def _config(
        self, system: str, timeout: int, tools: list[ToolSpec] | None
    ) -> types.GenerateContentConfig:
        """Build the generation config for one turn."""
        return types.GenerateContentConfig(
            system_instruction=system,
            tools=[
                types.Tool(
                    function_declarations=[
                        types.FunctionDeclaration(
                            name=t.name,
                            description=t.description,
                            # Gemini declarations omit the schema for tools without parameters
                            parameters_json_schema=t.parameters
                            if t.parameters.get("properties")
                            else None,
                        )
                        for t in tools
                    ]
                )
            ]
            if tools
            else None,
            # Tool execution happens in our code (user isolation), never in the SDK.
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            thinking_config=self._thinking_config(),
            http_options=types.HttpOptions(timeout=timeout * 1000, retry_options=_RETRY_OPTIONS),
        )

    async def stream_turn(
        self,
        messages: list[Message],
        system: str,
        tools: list[ToolSpec] | None = None,
        timeout: int = 30,
    ) -> AsyncIterator[StreamEvent]:
        """Stream one turn. See `ChatProvider.stream_turn`."""
        if not system or not system.strip():
            raise ValueError("System prompt cannot be empty")
        if not messages:
            raise ValueError("Messages cannot be empty")

        parts: list[types.Part] = []
        tool_calls: list[ToolCall] = []
        text_parts: list[str] = []

        try:
            for attempt in range(2):
                try:
                    stream = await self._client.aio.models.generate_content_stream(
                        model=self.model,
                        contents=self._to_contents(messages),
                        config=self._config(system, timeout, tools),
                    )
                    # Pull the first chunk inside the retry window: that is where the API
                    # reports a rejected request (e.g. unsupported thinking level).
                    first = await anext(stream, None)
                    break
                except Exception as e:
                    if attempt == 0 and self._disable_thinking_if_unsupported(e):
                        continue
                    raise

            async def chunks() -> AsyncIterator[types.GenerateContentResponse]:
                if first is not None:
                    yield first
                async for rest in stream:
                    yield rest

            async for chunk in chunks():
                if not chunk.candidates or not chunk.candidates[0].content:
                    continue
                for part in chunk.candidates[0].content.parts or []:
                    parts.append(part)
                    if part.function_call:
                        tool_calls.append(
                            ToolCall(
                                name=part.function_call.name or "",
                                args=dict(part.function_call.args or {}),
                                id=part.function_call.id or "",
                            )
                        )
                    elif part.text and not part.thought:
                        text_parts.append(part.text)
                        yield StreamEvent(kind="text", text=part.text)

        except Exception as e:
            mapped = map_gemini_error(e, timeout)
            logger.error(f"Gemini streaming failed: {mapped}")
            if mapped is e:
                raise
            raise mapped from e

        yield StreamEvent(
            kind="done",
            message=Message(
                role="assistant",
                text="".join(text_parts),
                tool_calls=tool_calls,
                raw=types.Content(role="model", parts=parts),
            ),
        )
