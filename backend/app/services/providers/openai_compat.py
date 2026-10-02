import json
import logging
from collections.abc import AsyncIterator
from typing import Any

import openai
from openai import AsyncOpenAI

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


class OpenAICompatProvider:
    """Chat provider for any OpenAI-compatible API (OpenRouter, OpenAI, Groq, Ollama, ...).

    The SDK already retries 429/5xx and connection errors with backoff, so no extra retry
    logic lives here.
    """

    def __init__(
        self,
        api_key: str,
        model: str,
        base_url: str,
        default_headers: dict[str, str] | None = None,
    ):
        """
        Args:
            api_key: API key for the service
            model: Model id, e.g. ``openai/gpt-4o-mini`` on OpenRouter
            base_url: Service base URL, e.g. ``https://openrouter.ai/api/v1``
            default_headers: Extra headers sent with every request
        """
        self.model = model
        self._client = AsyncOpenAI(
            api_key=api_key, base_url=base_url, default_headers=default_headers
        )

    @staticmethod
    def _to_openai(messages: list[Message], system: str) -> list[dict[str, Any]]:
        """Convert neutral messages to chat-completions messages (system prompt first)."""
        out: list[dict[str, Any]] = [{"role": "system", "content": system}]
        for message in messages:
            if message.role == "user":
                out.append({"role": "user", "content": message.text})
            elif message.role == "assistant":
                entry: dict[str, Any] = {"role": "assistant", "content": message.text or None}
                if message.tool_calls:
                    entry["tool_calls"] = [
                        {
                            "id": call.id,
                            "type": "function",
                            "function": {"name": call.name, "arguments": json.dumps(call.args)},
                        }
                        for call in message.tool_calls
                    ]
                out.append(entry)
            else:
                out.extend(
                    {
                        "role": "tool",
                        "tool_call_id": r.call.id,
                        "content": json.dumps(r.result),
                    }
                    for r in message.tool_results
                )
        return out

    @staticmethod
    def _map_error(error: Exception) -> Exception:
        """Translate SDK errors into `ProviderError`s; pass others through."""
        if isinstance(error, openai.APITimeoutError):
            return ProviderTimeoutError(str(error))
        if isinstance(error, openai.RateLimitError):
            return ProviderRateLimitError(str(error))
        if isinstance(error, (openai.AuthenticationError, openai.PermissionDeniedError)):
            return ProviderAuthError(str(error))
        if isinstance(error, openai.APIConnectionError) or (
            isinstance(error, openai.APIStatusError) and error.status_code >= 500
        ):
            return ProviderUnavailableError(str(error))
        if isinstance(error, openai.APIError):
            return ProviderError(str(error))
        return error

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

        request: dict[str, Any] = {
            "model": self.model,
            "messages": self._to_openai(messages, system),
            "stream": True,
        }
        if tools:
            request["tools"] = [
                {
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": t.parameters,
                    },
                }
                for t in tools
            ]

        text_parts: list[str] = []
        # Tool calls stream in as fragments keyed by index: {index: {id, name, arguments}}
        fragments: dict[int, dict[str, str]] = {}

        try:
            stream = await self._client.with_options(timeout=timeout).chat.completions.create(
                **request
            )
            async for chunk in stream:
                if not chunk.choices:
                    continue
                delta = chunk.choices[0].delta
                if delta.content:
                    text_parts.append(delta.content)
                    yield StreamEvent(kind="text", text=delta.content)
                for call in delta.tool_calls or []:
                    slot = fragments.setdefault(call.index, {"id": "", "name": "", "args": ""})
                    slot["id"] = call.id or slot["id"]
                    if call.function:
                        slot["name"] += call.function.name or ""
                        slot["args"] += call.function.arguments or ""

        except Exception as e:
            mapped = self._map_error(e)
            logger.error(f"OpenAI-compatible streaming failed: {mapped}")
            if mapped is e:
                raise
            raise mapped from e

        tool_calls: list[ToolCall] = []
        for index in sorted(fragments):
            slot = fragments[index]
            try:
                args = json.loads(slot["args"]) if slot["args"] else {}
            except json.JSONDecodeError:
                logger.warning(f"Model sent invalid tool arguments for '{slot['name']}'")
                args = {}
            tool_calls.append(
                ToolCall(name=slot["name"], args=args, id=slot["id"] or f"call_{index}")
            )

        yield StreamEvent(
            kind="done",
            message=Message(role="assistant", text="".join(text_parts), tool_calls=tool_calls),
        )
