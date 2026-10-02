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
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.conversation import Conversation
from app.models.document import Document, DocumentStatus
from app.prompts.chat_prompt import AGENT_SYSTEM_PROMPT, LIST_TOOL_NAME, SEARCH_TOOL_NAME
from app.schemas.chat import ChatResponse, SourceCitation
from app.services.chat_service import (
    EMPTY_RESPONSE_MESSAGE,
    _enrich_chunks_with_metadata,
    _extract_sources,
    _list_documents,
    _no_results_hint,
    _save_to_conversation,
    execute_rag_query,
    execute_rag_query_stream,
)
from app.services.providers.base import ProviderTimeoutError
from tests.fakes import FakeProvider, call_turn, text_turn


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
    llm = FakeProvider([text_turn("Hello! ", "How can I help?")])

    events = await collect(execute_rag_query_stream("Hiii", mock_user_id, MagicMock(), llm))

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
    llm = FakeProvider([call_turn(query="vacation policy"), text_turn("You get 20 days.")])

    events = await collect(
        execute_rag_query_stream("How many vacation days?", mock_user_id, MagicMock(), llm)
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
    second = llm.requests[1]["messages"]
    assert second[-2].role == "assistant"
    tool_result = second[-1].tool_results[0]
    assert second[-1].role == "tool"
    assert tool_result.call.name == SEARCH_TOOL_NAME
    results = tool_result.result["results"]
    assert results[0]["document"] == "test_document.pdf"
    assert "vacation policy" in results[0]["text"]
    assert "score" not in results[0]

    done = events[-1]
    assert done["conversation_id"] == agent_env.conversation.conversation_id
    assert len(done["sources"]) == 1
    assert isinstance(done["sources"][0], SourceCitation)
    assert done["sources"][0].filename == "test_document.pdf"
    assert done["sources"][0].document_name == "test_document.pdf"


def test_extract_sources_lists_each_document_once_in_retrieval_order():
    """Several chunks of one document produce one source; unknown ids and missing ids are skipped."""
    chunks = [
        {"document_id": "d1", "document_name": "a.pdf", "chunk_text": "x" * 500, "score": 0.9},
        {"document_id": "d2", "document_name": "b.pdf", "chunk_index": 3},
        {"document_id": "d1", "document_name": "a.pdf"},
        {"document_name": "no-id.pdf"},
    ]

    sources = _extract_sources(chunks)

    assert [s.document_id for s in sources] == ["d1", "d2"]
    assert sources[0].chunk_text == "x" * 200
    assert sources[0].relevance_score == 0.9
    assert sources[1].chunk_index == 3
    assert sources[1].filename == "b.pdf"


@pytest.mark.asyncio
async def test_tool_call_cannot_override_user_or_collection(agent_env, mock_user_id):
    """user_id/collection_id come from the request even if the model tries to pass them."""
    llm = FakeProvider(
        [
            call_turn(query="salaries", user_id="someone-else", collection_id="other"),
            text_turn("Done."),
        ]
    )

    await collect(
        execute_rag_query_stream(
            "salaries?", mock_user_id, MagicMock(), llm, collection_id="my-collection", top_k=3
        )
    )

    kwargs = agent_env.milvus_service.search_similar.call_args.kwargs
    assert kwargs["user_id"] == mock_user_id
    assert kwargs["collection_id"] == "my-collection"
    assert kwargs["top_k"] == 3


@pytest.mark.asyncio
async def test_tool_call_without_query_falls_back_to_user_message(agent_env, mock_user_id):
    """If the model sends no query argument, the user's message is searched."""
    llm = FakeProvider([call_turn(), text_turn("ok")])

    events = await collect(execute_rag_query_stream("find the budget", mock_user_id, MagicMock(), llm))

    assert events[0]["query"] == "find the budget"


@pytest.mark.asyncio
async def test_history_is_sent_as_chat_turns(agent_env, mock_user_id):
    """Previous messages become user/model turns before the new question."""
    agent_env.get_history.return_value = [
        {"role": "user", "content": "What is the leave policy?"},
        {"role": "assistant", "content": "It is 20 days."},
    ]
    llm = FakeProvider([text_turn("Sure.")])

    await collect(execute_rag_query_stream("and sick leave?", mock_user_id, MagicMock(), llm))

    messages = llm.requests[0]["messages"]
    assert [m.role for m in messages] == ["user", "assistant", "user"]
    assert messages[-1].text == "and sick leave?"


# Test: no results


@pytest.mark.asyncio
async def test_search_with_no_results_returns_note(agent_env, mock_user_id):
    """An empty search tells the model why via a note; no sources are returned."""
    agent_env.milvus_service.search_similar.return_value = []
    llm = FakeProvider([call_turn(query="moon base"), text_turn("I couldn't find that.")])

    with patch("app.services.chat_service._no_results_hint", new=AsyncMock(return_value="hint!")):
        events = await collect(execute_rag_query_stream("moon base?", mock_user_id, MagicMock(), llm))

    response = llm.requests[1]["messages"][-1].tool_results[0].result
    assert response == {"results": [], "note": "hint!"}
    assert events[1]["chunks"] == 0
    assert events[-1]["sources"] == []


# Test: robustness


@pytest.mark.asyncio
async def test_tool_rounds_are_capped(agent_env, mock_user_id):
    """After AGENT_MAX_TOOL_ROUNDS searches the model is asked again without tools."""
    llm = FakeProvider(
        [call_turn(query="a"), call_turn(query="b"), text_turn("Final answer.")]
    )

    with patch.object(settings, "AGENT_MAX_TOOL_ROUNDS", 2):
        events = await collect(execute_rag_query_stream("q", mock_user_id, MagicMock(), llm))

    assert [r["tools"] is not None for r in llm.requests] == [True, True, False]
    assert events[-1]["type"] == "done"
    assert agent_env.save.call_args[0][3] == "Final answer."


@pytest.mark.asyncio
async def test_unknown_tool_is_rejected_not_executed(agent_env, mock_user_id):
    """A call to a tool we didn't declare gets an error response and no search runs."""
    llm = FakeProvider([call_turn(name="delete_everything"), text_turn("Sorry.")])

    events = await collect(execute_rag_query_stream("do it", mock_user_id, MagicMock(), llm))

    agent_env.milvus_service.search_similar.assert_not_called()
    assert all(e["type"] not in ("tool_start", "tool_end") for e in events)
    response = llm.requests[1]["messages"][-1].tool_results[0].result
    assert "Unknown tool" in response["error"]


@pytest.mark.asyncio
async def test_search_failure_is_reported_to_model(agent_env, mock_user_id):
    """If search breaks, the UI event is flagged and the model still gets to answer."""
    agent_env.milvus_service.search_similar.side_effect = RuntimeError("milvus down")
    llm = FakeProvider([call_turn(query="x"), text_turn("Search is unavailable right now.")])

    events = await collect(execute_rag_query_stream("x?", mock_user_id, MagicMock(), llm))

    tool_end = next(e for e in events if e["type"] == "tool_end")
    assert tool_end["error"] is True
    response = llm.requests[1]["messages"][-1].tool_results[0].result
    assert "error" in response
    assert events[-1]["type"] == "done"


@pytest.mark.asyncio
async def test_empty_model_answer_uses_fallback(agent_env, mock_user_id):
    """If the model produces no text at all, the user gets a clear message."""
    llm = FakeProvider([text_turn()])

    events = await collect(execute_rag_query_stream("hello", mock_user_id, MagicMock(), llm))

    assert events[0] == {"type": "text", "text": EMPTY_RESPONSE_MESSAGE}
    assert agent_env.save.call_args[0][3] == EMPTY_RESPONSE_MESSAGE


@pytest.mark.asyncio
async def test_llm_timeout_raises_friendly_error(agent_env, mock_user_id):
    """Provider timeouts propagate (the API layer shows their user message) and nothing is saved."""
    llm = FakeProvider([[ProviderTimeoutError("slow")]])

    with pytest.raises(ProviderTimeoutError):
        await collect(execute_rag_query_stream("hi", mock_user_id, MagicMock(), llm))

    agent_env.save.assert_not_called()


@pytest.mark.asyncio
@pytest.mark.parametrize("query", ["", "   "])
async def test_empty_query_raises(query, mock_user_id):
    """Empty or whitespace queries are rejected before any model call."""
    with pytest.raises(ValueError, match="Query cannot be empty"):
        await collect(execute_rag_query_stream(query, mock_user_id, MagicMock(), FakeProvider([])))


# Test: execute_rag_query (non-streaming wrapper)


@pytest.mark.asyncio
async def test_execute_rag_query_returns_chat_response(agent_env, mock_user_id):
    """The non-streaming API collects the stream into a ChatResponse."""
    llm = FakeProvider([call_turn(query="vacation"), text_turn("20 ", "days.")])

    response = await execute_rag_query("vacation?", mock_user_id, MagicMock(), llm)

    assert isinstance(response, ChatResponse)
    assert response.answer == "20 days."
    assert response.conversation_id == agent_env.conversation.conversation_id
    assert len(response.sources) == 1


@pytest.mark.asyncio
async def test_execute_rag_query_empty_query(mock_user_id):
    """Non-streaming path also rejects an empty query."""
    with pytest.raises(ValueError, match="Query cannot be empty"):
        await execute_rag_query("", mock_user_id, MagicMock(), FakeProvider([]))


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
            [
                SourceCitation(
                    document_id="doc1",
                    document_name="a.pdf",
                    filename="a.pdf",
                    chunk_index=0,
                    chunk_text="text",
                    relevance_score=0.95,
                )
            ],
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
        # stored as plain JSON-able dicts
        assert assistant_call[0][4][0]["filename"] == "a.pdf"


# Test: list_documents tool


def make_document(user_id: str, filename: str, **overrides) -> Document:
    """A processed document owned by the given user."""
    values = {
        "document_id": str(uuid.uuid4()),
        "user_id": user_id,
        "filename": filename,
        "file_type": "pdf",
        "size_bytes": 10,
        "storage_key": f"key/{uuid.uuid4()}",
        "status": DocumentStatus.ACTIVE.value,
    }
    return Document(**(values | overrides))


@pytest.mark.asyncio
async def test_list_documents_returns_only_the_users_live_documents_newest_first(
    session: AsyncSession, sample_user, sample_admin
):
    """Other users' documents and soft-deleted ones never appear; newest comes first."""
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    session.add_all(
        [
            make_document(sample_user.user_id, "old.pdf", uploaded_at=now - timedelta(days=2)),
            make_document(sample_user.user_id, "new.pdf", uploaded_at=now),
            make_document(sample_user.user_id, "gone.pdf", deleted_at=now),
            make_document(sample_admin.user_id, "someone-elses.pdf"),
        ]
    )
    await session.commit()

    result, total = await _list_documents(sample_user.user_id, session, None)

    assert [d["name"] for d in result["documents"]] == ["new.pdf", "old.pdf"]
    assert total == 2
    assert result["documents"][0] == {
        "name": "new.pdf",
        "type": "pdf",
        "status": "active",
        "uploaded": now.date().isoformat(),
    }
    assert "note" not in result


@pytest.mark.asyncio
async def test_list_documents_respects_the_collection_filter(session: AsyncSession, sample_user):
    """When chat is limited to a collection, only that collection's documents are listed."""
    from app.models.collection import Collection

    collection = Collection(user_id=sample_user.user_id, name="HR")
    session.add(collection)
    await session.flush()
    session.add_all(
        [
            make_document(sample_user.user_id, "in.pdf", collection_id=collection.collection_id),
            make_document(sample_user.user_id, "out.pdf"),
        ]
    )
    await session.commit()

    result, total = await _list_documents(sample_user.user_id, session, collection.collection_id)

    assert [d["name"] for d in result["documents"]] == ["in.pdf"]
    assert total == 1


@pytest.mark.asyncio
async def test_list_documents_caps_the_list_and_says_so(session: AsyncSession, sample_user):
    """A long list is truncated, with the real total reported so the model can say so."""
    session.add_all([make_document(sample_user.user_id, f"{i}.pdf") for i in range(3)])
    await session.commit()

    with patch("app.services.chat_service.MAX_LISTED_DOCUMENTS", 2):
        result, total = await _list_documents(sample_user.user_id, session, None)

    assert len(result["documents"]) == 2
    assert total == 3
    assert "2 most recent of 3" in result["note"]


@pytest.mark.asyncio
async def test_list_documents_for_a_user_with_none_explains_why(session: AsyncSession, sample_user):
    """An empty library comes with a note, so the model tells the user to upload something."""
    result, total = await _list_documents(sample_user.user_id, session, None)

    assert result["documents"] == []
    assert total == 0
    assert "not uploaded any documents" in result["note"]


@pytest.mark.asyncio
async def test_agent_can_list_documents_without_searching(agent_env, mock_user_id):
    """A list_documents call runs the listing, reports the count, and adds no sources."""
    listing = {"documents": [{"name": "a.pdf"}, {"name": "b.pdf"}], "total": 2}
    llm = FakeProvider([call_turn(name=LIST_TOOL_NAME), text_turn("You have two documents.")])

    with patch("app.services.chat_service._list_documents", new=AsyncMock(return_value=(listing, 2))):
        events = await collect(
            execute_rag_query_stream("what documents do I have?", mock_user_id, MagicMock(), llm)
        )

    assert [e["type"] for e in events] == ["tool_start", "tool_end", "text", "done"]
    assert events[0] == {"type": "tool_start", "name": LIST_TOOL_NAME, "query": ""}
    assert events[1]["documents"] == 2
    assert events[1]["chunks"] == 0
    agent_env.embedding_service.embed_query.assert_not_called()
    assert llm.requests[1]["messages"][-1].tool_results[0].result == listing
    assert events[-1]["sources"] == []


@pytest.mark.asyncio
async def test_a_failing_list_is_reported_and_the_agent_still_answers(agent_env, mock_user_id):
    """If listing breaks, the UI event is flagged and the model gets an error result."""
    llm = FakeProvider([call_turn(name=LIST_TOOL_NAME), text_turn("Sorry, I can't list them.")])

    with patch(
        "app.services.chat_service._list_documents", new=AsyncMock(side_effect=RuntimeError("db"))
    ):
        events = await collect(
            execute_rag_query_stream("list my docs", mock_user_id, MagicMock(), llm)
        )

    assert next(e for e in events if e["type"] == "tool_end")["error"] is True
    assert "error" in llm.requests[1]["messages"][-1].tool_results[0].result
    assert events[-1]["type"] == "done"


@pytest.mark.asyncio
async def test_both_tools_are_offered_until_the_last_round(agent_env, mock_user_id):
    """The model can use either tool; the forced final round offers none."""
    llm = FakeProvider([call_turn(query="a"), text_turn("Final.")])

    with patch.object(settings, "AGENT_MAX_TOOL_ROUNDS", 1):
        await collect(execute_rag_query_stream("q", mock_user_id, MagicMock(), llm))

    assert {t.name for t in llm.requests[0]["tools"]} == {SEARCH_TOOL_NAME, LIST_TOOL_NAME}
    assert llm.requests[1]["tools"] is None


def test_the_prompt_covers_both_tools_and_broad_questions():
    """Guards the behaviors that were missing: broad questions search, listing uses its tool."""
    assert SEARCH_TOOL_NAME in AGENT_SYSTEM_PROMPT
    assert LIST_TOOL_NAME in AGENT_SYSTEM_PROMPT
    assert "what does the document say" in AGENT_SYSTEM_PROMPT
    assert "Never ask the user to clarify before searching" in AGENT_SYSTEM_PROMPT
