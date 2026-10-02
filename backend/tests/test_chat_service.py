"""
Unit tests for chat_service.py - the tool-calling chat agent.

Covers:
- Agent decides per turn: direct answer (no search) vs. `search_documents` tool call
- Tool execution with user isolation (user/collection come from the request, not the model)
- Tool round cap, unknown tools, search failures, timeouts, empty queries
- Chunk enrichment, no-results hints, conversation saving
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from google.genai import types
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.conversation import Conversation
from app.models.document import Document, DocumentStatus
from app.prompts.chat_prompt import SEARCH_TOOL_NAME
from app.schemas.chat import ChatResponse
from app.services.chat_service import (
    EMPTY_RESPONSE_MESSAGE,
    TIMEOUT_MESSAGE,
    _enrich_chunks_with_metadata,
    _no_results_hint,
    _save_to_conversation,
    execute_rag_query,
    execute_rag_query_stream,
)
from app.services.llm_service import StreamEvent


@pytest.fixture
def mock_user_id():
    """Mock user ID for testing."""
    return str(uuid.uuid4())


@pytest.fixture
def mock_conversation():
    """Mock conversation for testing."""
    return Conversation(
        conversation_id=str(uuid.uuid4()),
        user_id=str(uuid.uuid4()),
        messages=[],
        message_count=0,
    )


@pytest.fixture
def mock_document():
    """Mock document for testing."""
    return Document(
        document_id=str(uuid.uuid4()),
        user_id=str(uuid.uuid4()),
        filename="test_document.pdf",
        file_type="pdf",
        size_bytes=1024,
        storage_key="test/key",
        status=DocumentStatus.ACTIVE.value,
    )


@pytest.fixture
def mock_chunks():
    """Mock Milvus search results (chunks)."""
    doc_id = str(uuid.uuid4())
    return [
        {
            "document_id": doc_id,
            "chunk_index": 0,
            "chunk_text": "This is test chunk 1 about vacation policy.",
            "score": 0.95,
        },
        {
            "document_id": doc_id,
            "chunk_index": 1,
            "chunk_text": "This is test chunk 2 about sick leave policy.",
            "score": 0.87,
        },
    ]


# Helpers to script the model


def text_turn(*texts: str) -> list[StreamEvent]:
    """A model turn that only streams answer text."""
    full = "".join(texts)
    events = [StreamEvent(kind="text", text=t) for t in texts]
    events.append(
        StreamEvent(
            kind="done",
            model_content=types.Content(role="model", parts=[types.Part.from_text(text=full)]),
        )
    )
    return events


def call_turn(name: str = SEARCH_TOOL_NAME, **args) -> list[StreamEvent]:
    """A model turn that requests a tool call."""
    call = types.FunctionCall(name=name, args=args)
    return [
        StreamEvent(
            kind="done",
            function_calls=[call],
            model_content=types.Content(role="model", parts=[types.Part(function_call=call)]),
        )
    ]


class FakeLLM:
    """Stand-in for LLMService: plays back scripted turns and records the requests."""

    def __init__(self, turns: list[list[StreamEvent]]):
        self.turns = list(turns)
        self.requests: list[dict] = []

    async def stream_turn(self, contents, system_instruction, tools=None, timeout=30):
        self.requests.append(
            {"contents": list(contents), "system": system_instruction, "tools": tools}
        )
        for event in self.turns.pop(0):
            if isinstance(event, Exception):
                raise event
            yield event


@pytest.fixture
def agent_env(mock_user_id, mock_conversation, mock_document, mock_chunks):
    """Patch every collaborator of the agent; yields the mocks for assertions."""
    mock_document.user_id = mock_user_id
    for chunk in mock_chunks:
        chunk["document_id"] = mock_document.document_id

    embedding_service = MagicMock()
    embedding_service.embed_query = AsyncMock(return_value=[0.1] * 1024)
    milvus_service = MagicMock()
    milvus_service.search_similar = AsyncMock(return_value=mock_chunks)

    with (
        patch("app.services.chat_service.get_or_create_conversation") as get_conv,
        patch("app.services.chat_service.get_last_messages") as get_history,
        patch("app.services.chat_service.get_embedding_service") as get_embed,
        patch("app.services.chat_service.get_milvus_service") as get_milvus,
        patch("app.services.chat_service.get_document_by_id") as get_doc,
        patch("app.services.chat_service.get_llm_service") as get_llm,
        patch("app.services.chat_service._save_to_conversation") as save,
    ):
        get_conv.return_value = mock_conversation
        get_history.return_value = []
        get_embed.return_value = embedding_service
        get_milvus.return_value = milvus_service
        get_doc.return_value = mock_document
        save.return_value = None

        class Env:
            pass

        env = Env()
        env.embedding_service = embedding_service
        env.milvus_service = milvus_service
        env.get_history = get_history
        env.get_llm = get_llm
        env.get_doc = get_doc
        env.save = save
        env.conversation = mock_conversation
        env.document = mock_document
        yield env


async def collect(stream) -> list[dict]:
    """Drain an event stream into a list."""
    return [event async for event in stream]


# Test: direct answer, no tool call


@pytest.mark.asyncio
async def test_greeting_answers_without_searching(agent_env, mock_user_id):
    """The agent can answer small talk directly: one model call, no search, no sources."""
    llm = FakeLLM([text_turn("Hello! ", "How can I help?")])
    agent_env.get_llm.return_value = llm

    events = await collect(execute_rag_query_stream("Hiii", mock_user_id, MagicMock()))

    assert [e["type"] for e in events] == ["text", "text", "done"]
    assert len(llm.requests) == 1
    agent_env.embedding_service.embed_query.assert_not_called()
    agent_env.milvus_service.search_similar.assert_not_called()
    assert events[-1]["sources"] == []
    # saved with the full text and no sources
    saved = agent_env.save.call_args[0]
    assert saved[3] == "Hello! How can I help?"
    assert saved[4] == []


# Test: document question -> tool call -> answer


@pytest.mark.asyncio
async def test_document_question_uses_search_tool(agent_env, mock_user_id):
    """A tool call triggers embed + Milvus search; the answer streams after the results."""
    llm = FakeLLM([call_turn(query="vacation policy"), text_turn("You get 20 days.")])
    agent_env.get_llm.return_value = llm

    events = await collect(
        execute_rag_query_stream("How many vacation days?", mock_user_id, MagicMock())
    )

    types_seen = [e["type"] for e in events]
    assert types_seen == ["tool_start", "tool_end", "text", "done"]
    assert events[0]["query"] == "vacation policy"
    assert events[1]["chunks"] == 2
    assert events[1]["documents"] == 1
    assert events[1]["error"] is False

    agent_env.embedding_service.embed_query.assert_awaited_once_with("vacation policy")

    # Second model request carries the model's call and our function response
    assert len(llm.requests) == 2
    second = llm.requests[1]["contents"]
    assert second[-2].role == "model"
    response = second[-1].parts[0].function_response
    assert response.name == SEARCH_TOOL_NAME
    results = response.response["results"]
    assert results[0]["document"] == "test_document.pdf"
    assert "vacation policy" in results[0]["text"]
    assert "score" not in results[0]

    done = events[-1]
    assert done["conversation_id"] == agent_env.conversation.conversation_id
    assert len(done["sources"]) == 1
    assert done["sources"][0]["filename"] == "test_document.pdf"
    assert done["sources"][0]["document_name"] == "test_document.pdf"


@pytest.mark.asyncio
async def test_tool_call_cannot_override_user_or_collection(agent_env, mock_user_id):
    """user_id/collection_id come from the request even if the model tries to pass them."""
    llm = FakeLLM(
        [
            call_turn(query="salaries", user_id="someone-else", collection_id="other"),
            text_turn("Done."),
        ]
    )
    agent_env.get_llm.return_value = llm

    await collect(
        execute_rag_query_stream(
            "salaries?", mock_user_id, MagicMock(), collection_id="my-collection", top_k=3
        )
    )

    kwargs = agent_env.milvus_service.search_similar.call_args.kwargs
    assert kwargs["user_id"] == mock_user_id
    assert kwargs["collection_id"] == "my-collection"
    assert kwargs["top_k"] == 3


@pytest.mark.asyncio
async def test_tool_call_without_query_falls_back_to_user_message(agent_env, mock_user_id):
    """If the model sends no query argument, the user's message is searched."""
    llm = FakeLLM([call_turn(), text_turn("ok")])
    agent_env.get_llm.return_value = llm

    events = await collect(execute_rag_query_stream("find the budget", mock_user_id, MagicMock()))

    assert events[0]["query"] == "find the budget"


@pytest.mark.asyncio
async def test_history_is_sent_as_chat_turns(agent_env, mock_user_id):
    """Previous messages become user/model turns before the new question."""
    agent_env.get_history.return_value = [
        {"role": "user", "content": "What is the leave policy?"},
        {"role": "assistant", "content": "It is 20 days."},
    ]
    llm = FakeLLM([text_turn("Sure.")])
    agent_env.get_llm.return_value = llm

    await collect(execute_rag_query_stream("and sick leave?", mock_user_id, MagicMock()))

    contents = llm.requests[0]["contents"]
    assert [c.role for c in contents] == ["user", "model", "user"]
    assert contents[-1].parts[0].text == "and sick leave?"


# Test: no results


@pytest.mark.asyncio
async def test_search_with_no_results_returns_note(agent_env, mock_user_id):
    """An empty search tells the model why via a note; no sources are returned."""
    agent_env.milvus_service.search_similar.return_value = []
    llm = FakeLLM([call_turn(query="moon base"), text_turn("I couldn't find that.")])
    agent_env.get_llm.return_value = llm

    with patch("app.services.chat_service._no_results_hint", new=AsyncMock(return_value="hint!")):
        events = await collect(execute_rag_query_stream("moon base?", mock_user_id, MagicMock()))

    response = llm.requests[1]["contents"][-1].parts[0].function_response.response
    assert response == {"results": [], "note": "hint!"}
    assert events[1]["chunks"] == 0
    assert events[-1]["sources"] == []


# Test: robustness


@pytest.mark.asyncio
async def test_tool_rounds_are_capped(agent_env, mock_user_id):
    """After AGENT_MAX_TOOL_ROUNDS searches the model is asked again without tools."""
    llm = FakeLLM(
        [call_turn(query="a"), call_turn(query="b"), text_turn("Final answer.")]
    )
    agent_env.get_llm.return_value = llm

    with patch.object(settings, "AGENT_MAX_TOOL_ROUNDS", 2):
        events = await collect(execute_rag_query_stream("q", mock_user_id, MagicMock()))

    assert [r["tools"] is not None for r in llm.requests] == [True, True, False]
    assert events[-1]["type"] == "done"
    assert agent_env.save.call_args[0][3] == "Final answer."


@pytest.mark.asyncio
async def test_unknown_tool_is_rejected_not_executed(agent_env, mock_user_id):
    """A call to a tool we didn't declare gets an error response and no search runs."""
    llm = FakeLLM([call_turn(name="delete_everything"), text_turn("Sorry.")])
    agent_env.get_llm.return_value = llm

    events = await collect(execute_rag_query_stream("do it", mock_user_id, MagicMock()))

    agent_env.milvus_service.search_similar.assert_not_called()
    assert all(e["type"] not in ("tool_start", "tool_end") for e in events)
    response = llm.requests[1]["contents"][-1].parts[0].function_response.response
    assert "Unknown tool" in response["error"]


@pytest.mark.asyncio
async def test_search_failure_is_reported_to_model(agent_env, mock_user_id):
    """If search breaks, the UI event is flagged and the model still gets to answer."""
    agent_env.milvus_service.search_similar.side_effect = RuntimeError("milvus down")
    llm = FakeLLM([call_turn(query="x"), text_turn("Search is unavailable right now.")])
    agent_env.get_llm.return_value = llm

    events = await collect(execute_rag_query_stream("x?", mock_user_id, MagicMock()))

    tool_end = next(e for e in events if e["type"] == "tool_end")
    assert tool_end["error"] is True
    response = llm.requests[1]["contents"][-1].parts[0].function_response.response
    assert "error" in response
    assert events[-1]["type"] == "done"


@pytest.mark.asyncio
async def test_empty_model_answer_uses_fallback(agent_env, mock_user_id):
    """If the model produces no text at all, the user gets a clear message."""
    llm = FakeLLM([text_turn()])
    agent_env.get_llm.return_value = llm

    events = await collect(execute_rag_query_stream("hello", mock_user_id, MagicMock()))

    assert events[0] == {"type": "text", "text": EMPTY_RESPONSE_MESSAGE}
    assert agent_env.save.call_args[0][3] == EMPTY_RESPONSE_MESSAGE


@pytest.mark.asyncio
async def test_llm_timeout_raises_friendly_error(agent_env, mock_user_id):
    """Model timeouts surface as TimeoutError with the user-facing message."""
    llm = FakeLLM([[TimeoutError("slow")]])
    agent_env.get_llm.return_value = llm

    with pytest.raises(TimeoutError, match="taking too long") as exc:
        await collect(execute_rag_query_stream("hi", mock_user_id, MagicMock()))

    assert str(exc.value) == TIMEOUT_MESSAGE
    agent_env.save.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("query", ["", "   "])
async def test_empty_query_raises(query, mock_user_id):
    """Empty or whitespace queries are rejected before any model call."""
    with pytest.raises(ValueError, match="Query cannot be empty"):
        await collect(execute_rag_query_stream(query, mock_user_id, MagicMock()))


# Test: execute_rag_query (non-streaming wrapper)


@pytest.mark.asyncio
async def test_execute_rag_query_returns_chat_response(agent_env, mock_user_id):
    """The non-streaming API collects the stream into a ChatResponse."""
    llm = FakeLLM([call_turn(query="vacation"), text_turn("20 ", "days.")])
    agent_env.get_llm.return_value = llm

    response = await execute_rag_query("vacation?", mock_user_id, MagicMock())

    assert isinstance(response, ChatResponse)
    assert response.answer == "20 days."
    assert response.conversation_id == agent_env.conversation.conversation_id
    assert len(response.sources) == 1


@pytest.mark.asyncio
async def test_execute_rag_query_empty_query(mock_user_id):
    """Non-streaming path also rejects an empty query."""
    with pytest.raises(ValueError, match="Query cannot be empty"):
        await execute_rag_query("", mock_user_id, MagicMock())


# Test: _enrich_chunks_with_metadata


@pytest.mark.asyncio
async def test_enrich_chunks_with_metadata_success(
    session: AsyncSession, sample_user, mock_document, mock_chunks
):
    """Test chunk enrichment with document metadata."""
    mock_document.user_id = sample_user.user_id
    session.add(mock_document)
    await session.commit()
    await session.refresh(mock_document)

    for chunk in mock_chunks:
        chunk["document_id"] = mock_document.document_id

    with patch("app.services.chat_service.get_document_by_id") as mock_get_doc:
        mock_get_doc.return_value = mock_document

        enriched = await _enrich_chunks_with_metadata(session, mock_chunks, mock_document.user_id)

        assert len(enriched) == 2
        assert enriched[0]["document_name"] == "test_document.pdf"
        assert enriched[1]["document_name"] == "test_document.pdf"
        assert enriched[0]["chunk_text"] == mock_chunks[0]["chunk_text"]


@pytest.mark.asyncio
async def test_enrich_chunks_with_metadata_wrong_user(
    session: AsyncSession, mock_user_id, mock_document, mock_chunks
):
    """Test that chunks from different user's documents are filtered out."""
    for chunk in mock_chunks:
        chunk["document_id"] = mock_document.document_id

    wrong_user_doc = Document(
        document_id=mock_document.document_id,
        user_id=str(uuid.uuid4()),  # Different user!
        filename="secret_document.pdf",
        file_type="pdf",
        size_bytes=1024,
        storage_key="test/key",
        status=DocumentStatus.ACTIVE.value,
    )

    with patch("app.services.chat_service.get_document_by_id") as mock_get_doc:
        mock_get_doc.return_value = wrong_user_doc

        enriched = await _enrich_chunks_with_metadata(session, mock_chunks, mock_user_id)

        assert len(enriched) == 0


# Test: _no_results_hint


@pytest.mark.asyncio
async def test_no_results_hint_no_documents(session: AsyncSession, mock_user_id):
    """Hint says so when the user has no documents."""
    hint = await _no_results_hint(mock_user_id, session)

    assert "not uploaded any documents" in hint


@pytest.mark.asyncio
async def test_no_results_hint_processing_documents(session: AsyncSession, sample_user):
    """Hint says so when documents are still processing."""
    doc = Document(
        document_id=str(uuid.uuid4()),
        user_id=sample_user.user_id,
        filename="processing.pdf",
        file_type="pdf",
        size_bytes=1024,
        storage_key="test/key",
        status=DocumentStatus.PROCESSING.value,
    )
    session.add(doc)
    await session.commit()

    hint = await _no_results_hint(sample_user.user_id, session)

    assert "still being processed" in hint


@pytest.mark.asyncio
async def test_no_results_hint_no_relevant_info(session: AsyncSession, sample_user):
    """Hint is the generic one when active documents exist but nothing matched."""
    doc = Document(
        document_id=str(uuid.uuid4()),
        user_id=sample_user.user_id,
        filename="active.pdf",
        file_type="pdf",
        size_bytes=1024,
        storage_key="test/key",
        status=DocumentStatus.ACTIVE.value,
    )
    session.add(doc)
    await session.commit()

    hint = await _no_results_hint(sample_user.user_id, session)

    assert "No relevant excerpts" in hint


# Test: _save_to_conversation


@pytest.mark.asyncio
async def test_save_to_conversation_success(mock_conversation):
    """Test saving user query and assistant response to conversation."""
    with patch("app.services.chat_service.add_message") as mock_add_message:
        mock_add_message.return_value = None

        await _save_to_conversation(
            MagicMock(),
            mock_conversation.conversation_id,
            "What is the policy?",
            "The policy is...",
            [{"document_id": "doc1", "score": 0.95}],
        )

        assert mock_add_message.call_count == 2

        user_call = mock_add_message.call_args_list[0]
        assert user_call[0][1] == mock_conversation.conversation_id
        assert user_call[0][2] == "user"
        assert user_call[0][3] == "What is the policy?"

        assistant_call = mock_add_message.call_args_list[1]
        assert assistant_call[0][1] == mock_conversation.conversation_id
        assert assistant_call[0][2] == "assistant"
        assert assistant_call[0][3] == "The policy is..."
