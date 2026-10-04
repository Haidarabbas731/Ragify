"""Shared test doubles for chat providers."""

from app.services.providers.base import Message, StreamEvent, ToolCall


def text_turn(*texts: str) -> list[StreamEvent]:
    """A model turn that only streams answer text."""
    events = [StreamEvent(kind="text", text=t) for t in texts]
    events.append(StreamEvent(kind="done", message=Message(role="assistant", text="".join(texts))))
    return events


def call_turn(name: str = "search_documents", say: str = "", **args) -> list[StreamEvent]:
    """A model turn that requests a tool call, optionally after streaming some text (`say`)."""
    message = Message(
        role="assistant", text=say, tool_calls=[ToolCall(name=name, args=args, id="call_0")]
    )
    events = [StreamEvent(kind="text", text=say)] if say else []
    return [*events, StreamEvent(kind="done", message=message)]


class FakeProvider:
    """Stand-in for a chat provider: plays back scripted turns and records the requests.

    A turn may contain an Exception instead of events; it is raised when reached.
    """

    def __init__(self, turns: list[list[StreamEvent]]):
        self.turns = list(turns)
        self.requests: list[dict] = []

    async def stream_turn(self, messages, system, tools=None, timeout=30):
        self.requests.append({"messages": list(messages), "system": system, "tools": tools})
        for event in self.turns.pop(0):
            if isinstance(event, Exception):
                raise event
            yield event
