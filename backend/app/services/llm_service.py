import logging
from collections.abc import AsyncIterator
from dataclasses import dataclass, field

from google import genai
from google.genai import errors, types

from app.core.config import settings

logger = logging.getLogger(__name__)

_TIMEOUT_STATUS_CODES = {408, 504}

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


@dataclass
class StreamEvent:
    """One event from a streamed model turn.

    ``text`` events carry a delta of visible answer text. A single ``done`` event closes
    the turn and carries the complete model content (so function-call parts and their
    signatures can be sent back unchanged) plus any function calls the model requested.
    """

    kind: str  # "text" | "done"
    text: str = ""
    function_calls: list[types.FunctionCall] = field(default_factory=list)
    model_content: types.Content | None = None


class LLMService:
    """Google Gemini LLM service for chat generation and tool calling."""

    def __init__(self):
        """Initialize Gemini API client holder."""
        self.model_name = settings.GEMINI_MODEL
        self._client: genai.Client | None = None
        # Cleared if the model rejects the configured thinking level
        self._use_thinking_config = True

    @property
    def _configured(self) -> bool:
        """Whether the Gemini client has been created."""
        return self._client is not None

    async def configure(self) -> bool:
        """
        Create the Gemini API client with credentials.

        Returns:
            bool: True if configuration successful

        Raises:
            Exception: If the client cannot be created
        """
        try:
            self._client = genai.Client(api_key=settings.GOOGLE_API_KEY)
            logger.info(f"Gemini LLM configured successfully. Model: {self.model_name}")
            return True

        except Exception as e:
            logger.error(f"Gemini LLM configuration failed: {e}")
            self._client = None
            raise

    def _ensure_configured(self) -> genai.Client:
        """Return the client, raising if configure() has not been called."""
        if self._client is None:
            raise RuntimeError("Gemini LLM not configured. Call configure() first.")
        return self._client

    def _thinking_config(self) -> types.ThinkingConfig | None:
        """Build the thinking config from settings (None leaves the model default)."""
        level = settings.GEMINI_THINKING_LEVEL.strip().upper()
        if not level or not self._use_thinking_config:
            return None
        return types.ThinkingConfig(thinking_level=types.ThinkingLevel(level))

    def _disable_thinking_if_unsupported(self, e: Exception) -> bool:
        """
        Turn off the thinking config if the model rejected it.

        Returns:
            bool: True if thinking was just disabled and the call should be retried
        """
        if (
            self._use_thinking_config
            and self._thinking_config() is not None
            and isinstance(e, errors.ClientError)
            and e.code == 400
            and "thinking" in str(e).lower()
        ):
            logger.warning(
                f"Model {self.model_name} rejected thinking level "
                f"'{settings.GEMINI_THINKING_LEVEL}'; continuing without it"
            )
            self._use_thinking_config = False
            return True
        return False

    def _build_config(
        self,
        system_instruction: str,
        timeout: int,
        tools: list[types.Tool] | None = None,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> types.GenerateContentConfig:
        """Build the generation config shared by all calls."""
        return types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=temperature,
            max_output_tokens=max_tokens,
            tools=tools,
            # Tool execution happens in our code (user isolation), never in the SDK.
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            thinking_config=self._thinking_config(),
            http_options=types.HttpOptions(timeout=timeout * 1000, retry_options=_RETRY_OPTIONS),
        )

    @staticmethod
    def _wrap_error(e: Exception, timeout: int) -> Exception:
        """Translate SDK/network timeouts into TimeoutError, pass others through."""
        if isinstance(e, TimeoutError):
            return TimeoutError(f"LLM request timed out after {timeout} seconds")
        if isinstance(e, errors.APIError) and e.code in _TIMEOUT_STATUS_CODES:
            return TimeoutError(f"LLM request timed out after {timeout} seconds")
        if "timeout" in type(e).__name__.lower():
            return TimeoutError(f"LLM request timed out after {timeout} seconds")
        return e

    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        timeout: int = 10,
        max_tokens: int | None = None,
        temperature: float | None = None,
    ) -> str:
        """
        Generate a complete (non-streamed) response.

        Args:
            system_prompt: System instructions for the model
            user_prompt: User query with context
            timeout: Timeout in seconds (default: 10)
            max_tokens: Maximum number of output tokens (default: model default)
            temperature: Sampling temperature (default: model default)

        Returns:
            str: Generated response text

        Raises:
            RuntimeError: If LLM not configured
            ValueError: If prompts are empty or the model returns no text
            TimeoutError: If request times out
            Exception: If generation fails
        """
        client = self._ensure_configured()

        if not system_prompt or not system_prompt.strip():
            raise ValueError("System prompt cannot be empty")

        if not user_prompt or not user_prompt.strip():
            raise ValueError("User prompt cannot be empty")

        try:
            for attempt in range(2):
                try:
                    response = await client.aio.models.generate_content(
                        model=self.model_name,
                        contents=user_prompt,
                        config=self._build_config(
                            system_prompt, timeout, None, max_tokens, temperature
                        ),
                    )
                    break
                except Exception as e:
                    if attempt == 0 and self._disable_thinking_if_unsupported(e):
                        continue
                    raise

            text = response.text
            if not text:
                raise ValueError("LLM returned empty response")

            logger.info(f"Generated LLM response ({len(text)} chars)")
            return text

        except Exception as e:
            wrapped = self._wrap_error(e, timeout)
            logger.error(f"LLM generation failed: {wrapped}")
            if wrapped is e:
                raise
            raise wrapped from e

    async def stream_turn(
        self,
        contents: list[types.Content],
        system_instruction: str,
        tools: list[types.Tool] | None = None,
        timeout: int = 30,
    ) -> AsyncIterator[StreamEvent]:
        """
        Stream one model turn, optionally with tools the model may call.

        Args:
            contents: Conversation so far (user/model turns, function responses)
            system_instruction: System prompt
            tools: Tools the model may call (None disables tool calling)
            timeout: Request timeout in seconds

        Yields:
            StreamEvent: ``text`` deltas as they arrive, then one ``done`` event

        Raises:
            RuntimeError: If LLM not configured
            ValueError: If system instruction or contents are empty
            TimeoutError: If the request times out
            Exception: If generation fails
        """
        client = self._ensure_configured()

        if not system_instruction or not system_instruction.strip():
            raise ValueError("System prompt cannot be empty")

        if not contents:
            raise ValueError("Contents cannot be empty")

        parts: list[types.Part] = []
        function_calls: list[types.FunctionCall] = []

        try:
            for attempt in range(2):
                try:
                    stream = await client.aio.models.generate_content_stream(
                        model=self.model_name,
                        contents=contents,
                        config=self._build_config(system_instruction, timeout, tools),
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
                        function_calls.append(part.function_call)
                    elif part.text and not part.thought:
                        yield StreamEvent(kind="text", text=part.text)

        except Exception as e:
            wrapped = self._wrap_error(e, timeout)
            logger.error(f"LLM streaming generation failed: {wrapped}")
            if wrapped is e:
                raise
            raise wrapped from e

        yield StreamEvent(
            kind="done",
            function_calls=function_calls,
            model_content=types.Content(role="model", parts=parts),
        )


# Singleton instance
_llm_service: LLMService | None = None


async def get_llm_service() -> LLMService:
    """
    Get or create LLM service singleton.

    Returns:
        LLMService: Initialized LLM service instance
    """
    global _llm_service

    if _llm_service is None:
        _llm_service = LLMService()
        await _llm_service.configure()

    return _llm_service
