"""
Unit tests for chat_service.py - RAG orchestration logic.

Tests the complete RAG query flow including:
- Query validation
- Embedding generation
- Vector search
- Chunk enrichment
- Context formatting
- LLM response generation
- Conversation saving
- Error handling
"""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.conversation import Conversation
from app.models.document import Document, DocumentStatus
from app.schemas.chat import ChatResponse
from app.services.chat_service import (
    _enrich_chunks_with_metadata,
    _generate_no_results_response,
    _save_to_conversation,
    execute_rag_query,
    execute_rag_query_stream,
)


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


# Test: execute_rag_query - Success case


@pytest.mark.asyncio
async def test_execute_rag_query_success(
    session: AsyncSession, mock_user_id, mock_conversation, mock_document, mock_chunks
):
    """Test successful RAG query execution with all steps."""

    with patch(
        "app.services.chat_service.get_or_create_conversation"
    ) as mock_get_conversation, patch(
        "app.services.chat_service.get_embedding_service"
    ) as mock_get_embedding, patch(
        "app.services.chat_service.get_milvus_service"
    ) as mock_get_milvus, patch(
        "app.services.chat_service.get_llm_service"
    ) as mock_get_llm, patch(
        "app.services.chat_service._enrich_chunks_with_metadata"
    ) as mock_enrich, patch(
        "app.services.chat_service._save_to_conversation"
    ) as mock_save, patch(
        "app.services.chat_service.get_last_messages"
    ) as mock_get_messages, patch(
        "app.services.chat_service.format_context_with_metadata"
    ) as mock_format_context, patch(
        "app.services.chat_service.format_user_prompt"
    ) as mock_format_prompt:
        # Setup mocks
        mock_get_conversation.return_value = mock_conversation

        # Mock embedding service
        mock_embedding_service = AsyncMock()
        mock_embedding_service.embed_query.return_value = [0.1] * 1024
        mock_get_embedding.return_value = mock_embedding_service

        # Mock Milvus service
        mock_milvus_service = AsyncMock()
        mock_milvus_service.search_similar.return_value = mock_chunks
        mock_get_milvus.return_value = mock_milvus_service

        # Mock chunk enrichment
        enriched_chunks = [
            {**chunk, "document_name": "test_document.pdf"} for chunk in mock_chunks
        ]
        mock_enrich.return_value = enriched_chunks

        # Mock LLM service
        mock_llm_service = AsyncMock()
        mock_llm_service.generate_response.return_value = "You get 15 vacation days per year."
        mock_get_llm.return_value = mock_llm_service

        # Mock conversation history
        mock_get_messages.return_value = []

        # Mock context formatting
        mock_format_context.return_value = (
            "Context: vacation policy...",
            [
                {
                    "document_id": mock_chunks[0]["document_id"],
                    "document_name": "test_document.pdf",
                    "chunk_text": mock_chunks[0]["chunk_text"],
                    "score": mock_chunks[0]["score"],
                }
            ],
        )

        # Mock prompt formatting
        mock_format_prompt.return_value = "User prompt with context..."

        # Execute query
        response = await execute_rag_query(
            query="What is the vacation policy?",
            user_id=mock_user_id,
            db=session,
            conversation_id=mock_conversation.conversation_id,
            collection_id=None,
            top_k=5,
        )

        # Assertions
        assert isinstance(response, ChatResponse)
        assert response.answer == "You get 15 vacation days per year."
        assert response.conversation_id == mock_conversation.conversation_id
        assert len(response.sources) > 0
        assert response.sources[0].document_name == "test_document.pdf"

        # Verify service calls
        mock_get_conversation.assert_called_once()
        mock_embedding_service.embed_query.assert_called_once_with(
            "What is the vacation policy?"
        )
        mock_milvus_service.search_similar.assert_called_once()
        mock_llm_service.generate_response.assert_called_once()
        mock_save.assert_called_once()


# Test: execute_rag_query - Empty query


@pytest.mark.asyncio
async def test_execute_rag_query_empty_query(session: AsyncSession, mock_user_id):
    """Test that empty query raises ValueError."""
    with pytest.raises(ValueError, match="Query cannot be empty"):
        await execute_rag_query("", mock_user_id, session)

    with pytest.raises(ValueError, match="Query cannot be empty"):
        await execute_rag_query("   ", mock_user_id, session)


# Test: execute_rag_query - No results from Milvus


@pytest.mark.asyncio
async def test_execute_rag_query_no_results(
    session: AsyncSession, mock_user_id, mock_conversation
):
    """Test RAG query when no similar chunks are found."""

    with patch(
        "app.services.chat_service.get_or_create_conversation"
    ) as mock_get_conversation, patch(
        "app.services.chat_service.get_embedding_service"
    ) as mock_get_embedding, patch(
        "app.services.chat_service.get_milvus_service"
    ) as mock_get_milvus, patch(
        "app.services.chat_service._enrich_chunks_with_metadata"
    ) as mock_enrich, patch(
        "app.services.chat_service._generate_no_results_response"
    ) as mock_no_results, patch(
        "app.services.chat_service._save_to_conversation"
    ) as mock_save:
        # Setup mocks
        mock_get_conversation.return_value = mock_conversation

        mock_embedding_service = AsyncMock()
        mock_embedding_service.embed_query.return_value = [0.1] * 1024
        mock_get_embedding.return_value = mock_embedding_service

        mock_milvus_service = AsyncMock()
        mock_milvus_service.search_similar.return_value = []
        mock_get_milvus.return_value = mock_milvus_service

        mock_enrich.return_value = []
        mock_no_results.return_value = (
            "I don't have enough information in your documents to answer that question."
        )

        # Execute query
        response = await execute_rag_query(
            query="What is the vacation policy?", user_id=mock_user_id, db=session
        )

        # Assertions
        assert isinstance(response, ChatResponse)
        assert "don't have enough information" in response.answer
        assert len(response.sources) == 0
        mock_no_results.assert_called_once()
        mock_save.assert_called_once()


# Test: execute_rag_query - LLM timeout


@pytest.mark.asyncio
async def test_execute_rag_query_llm_timeout(
    session: AsyncSession, mock_user_id, mock_conversation, mock_chunks
):
    """Test that LLM timeout is handled properly."""

    with patch(
        "app.services.chat_service.get_or_create_conversation"
    ) as mock_get_conversation, patch(
        "app.services.chat_service.get_embedding_service"
    ) as mock_get_embedding, patch(
        "app.services.chat_service.get_milvus_service"
    ) as mock_get_milvus, patch(
        "app.services.chat_service._enrich_chunks_with_metadata"
    ) as mock_enrich, patch(
        "app.services.chat_service.get_llm_service"
    ) as mock_get_llm, patch(
        "app.services.chat_service.get_last_messages"
    ) as mock_get_messages, patch(
        "app.services.chat_service.format_context_with_metadata"
    ) as mock_format_context, patch(
        "app.services.chat_service.format_user_prompt"
    ) as mock_format_prompt:
        # Setup mocks
        mock_get_conversation.return_value = mock_conversation

        mock_embedding_service = AsyncMock()
        mock_embedding_service.embed_query.return_value = [0.1] * 1024
        mock_get_embedding.return_value = mock_embedding_service

        mock_milvus_service = AsyncMock()
        mock_milvus_service.search_similar.return_value = mock_chunks
        mock_get_milvus.return_value = mock_milvus_service

        enriched_chunks = [
            {**chunk, "document_name": "test.pdf"} for chunk in mock_chunks
        ]
        mock_enrich.return_value = enriched_chunks

        mock_get_messages.return_value = []
        mock_format_context.return_value = ("Context...", [])
        mock_format_prompt.return_value = "Prompt..."

        # Mock LLM timeout
        mock_llm_service = AsyncMock()
        mock_llm_service.generate_response.side_effect = TimeoutError("LLM timed out")
        mock_get_llm.return_value = mock_llm_service

        # Execute query and expect TimeoutError
        with pytest.raises(TimeoutError, match="taking too long"):
            await execute_rag_query(
                query="What is the vacation policy?", user_id=mock_user_id, db=session
            )


# Test: _enrich_chunks_with_metadata


@pytest.mark.asyncio
async def test_enrich_chunks_with_metadata_success(
    session: AsyncSession, sample_user, mock_document, mock_chunks
):
    """Test chunk enrichment with document metadata."""

    # Update document to use real user_id
    mock_document.user_id = sample_user.user_id

    # Add document to session
    session.add(mock_document)
    await session.commit()
    await session.refresh(mock_document)

    # Update chunks to use real document_id
    for chunk in mock_chunks:
        chunk["document_id"] = mock_document.document_id

    with patch("app.services.chat_service.get_document_by_id") as mock_get_doc:
        mock_get_doc.return_value = mock_document

        # Enrich chunks
        enriched = await _enrich_chunks_with_metadata(
            session, mock_chunks, mock_document.user_id
        )

        # Assertions
        assert len(enriched) == 2
        assert enriched[0]["document_name"] == "test_document.pdf"
        assert enriched[1]["document_name"] == "test_document.pdf"
        assert enriched[0]["chunk_text"] == mock_chunks[0]["chunk_text"]


@pytest.mark.asyncio
async def test_enrich_chunks_with_metadata_wrong_user(
    session: AsyncSession, mock_user_id, mock_document, mock_chunks
):
    """Test that chunks from different user's documents are filtered out."""

    # Update chunks to use real document_id
    for chunk in mock_chunks:
        chunk["document_id"] = mock_document.document_id

    # Mock document with different user_id
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

        # Enrich chunks - should return empty because user doesn't match
        enriched = await _enrich_chunks_with_metadata(session, mock_chunks, mock_user_id)

        # Assertions - user isolation enforced
        assert len(enriched) == 0


# Test: _generate_no_results_response


@pytest.mark.asyncio
async def test_generate_no_results_response_no_documents(
    session: AsyncSession, mock_user_id
):
    """Test no results response when user has no documents."""
    response = await _generate_no_results_response(mock_user_id, session)

    assert "haven't uploaded any documents yet" in response


@pytest.mark.asyncio
async def test_generate_no_results_response_processing_documents(
    session: AsyncSession, sample_user
):
    """Test no results response when documents are still processing."""

    # Create a processing document
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

    response = await _generate_no_results_response(sample_user.user_id, session)

    assert "still being processed" in response


@pytest.mark.asyncio
async def test_generate_no_results_response_no_relevant_info(
    session: AsyncSession, sample_user
):
    """Test no results response when user has active documents but no relevant info."""

    # Create an active document
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

    response = await _generate_no_results_response(sample_user.user_id, session)

    assert "don't have enough information" in response
    assert "Try rephrasing your question" in response


# Test: _save_to_conversation


@pytest.mark.asyncio
async def test_save_to_conversation_success(mock_conversation):
    """Test saving user query and assistant response to conversation."""

    with patch("app.services.chat_service.add_message") as mock_add_message:
        mock_add_message.return_value = None

        await _save_to_conversation(
            MagicMock(),  # db session mock
            mock_conversation.conversation_id,
            "What is the policy?",
            "The policy is...",
            [{"document_id": "doc1", "score": 0.95}],
        )

        # Verify add_message called twice (user + assistant)
        assert mock_add_message.call_count == 2

        # Verify user message
        user_call = mock_add_message.call_args_list[0]
        assert user_call[0][1] == mock_conversation.conversation_id
        assert user_call[0][2] == "user"
        assert user_call[0][3] == "What is the policy?"

        # Verify assistant message
        assistant_call = mock_add_message.call_args_list[1]
        assert assistant_call[0][1] == mock_conversation.conversation_id
        assert assistant_call[0][2] == "assistant"
        assert assistant_call[0][3] == "The policy is..."


# Test: execute_rag_query_stream - Basic streaming


@pytest.mark.asyncio
async def test_execute_rag_query_stream_success(
    session: AsyncSession, mock_user_id, mock_conversation, mock_chunks
):
    """Test streaming RAG query execution."""

    with patch(
        "app.services.chat_service.get_or_create_conversation"
    ) as mock_get_conversation, patch(
        "app.services.chat_service.get_embedding_service"
    ) as mock_get_embedding, patch(
        "app.services.chat_service.get_milvus_service"
    ) as mock_get_milvus, patch(
        "app.services.chat_service._enrich_chunks_with_metadata"
    ) as mock_enrich, patch(
        "app.services.chat_service.get_llm_service"
    ) as mock_get_llm, patch(
        "app.services.chat_service._save_to_conversation"
    ) as mock_save, patch(
        "app.services.chat_service.get_last_messages"
    ) as mock_get_messages, patch(
        "app.services.chat_service.format_context_with_metadata"
    ) as mock_format_context, patch(
        "app.services.chat_service.format_user_prompt"
    ) as mock_format_prompt:
        # Setup mocks
        mock_get_conversation.return_value = mock_conversation

        mock_embedding_service = AsyncMock()
        mock_embedding_service.embed_query.return_value = [0.1] * 1024
        mock_get_embedding.return_value = mock_embedding_service

        mock_milvus_service = AsyncMock()
        mock_milvus_service.search_similar.return_value = mock_chunks
        mock_get_milvus.return_value = mock_milvus_service

        enriched_chunks = [
            {**chunk, "document_name": "test.pdf"} for chunk in mock_chunks
        ]
        mock_enrich.return_value = enriched_chunks

        mock_get_messages.return_value = []
        mock_format_context.return_value = ("Context...", [])
        mock_format_prompt.return_value = "Prompt..."

        # Mock LLM streaming response
        async def mock_stream_gen(system_prompt, user_prompt, timeout=10):
            yield "You "
            yield "get "
            yield "15 "
            yield "vacation "
            yield "days."

        mock_llm_service = AsyncMock()
        mock_llm_service.generate_response_stream = mock_stream_gen
        mock_get_llm.return_value = mock_llm_service

        # Execute streaming query
        chunks_received = []
        async for chunk in execute_rag_query_stream(
            query="What is the vacation policy?",
            user_id=mock_user_id,
            db=session,
            conversation_id=mock_conversation.conversation_id,
        ):
            chunks_received.append(chunk)

        # Assertions
        assert len(chunks_received) == 5
        assert "".join(chunks_received) == "You get 15 vacation days."
        mock_save.assert_called_once()


# Test: execute_rag_query_stream - Empty query


@pytest.mark.asyncio
async def test_execute_rag_query_stream_empty_query(session: AsyncSession, mock_user_id):
    """Test that streaming with empty query raises ValueError."""
    with pytest.raises(ValueError, match="Query cannot be empty"):
        async for _ in execute_rag_query_stream("", mock_user_id, session):
            pass


# Test: execute_rag_query_stream - No results


@pytest.mark.asyncio
async def test_execute_rag_query_stream_no_results(
    session: AsyncSession, mock_user_id, mock_conversation
):
    """Test streaming query when no similar chunks found."""

    with patch(
        "app.services.chat_service.get_or_create_conversation"
    ) as mock_get_conversation, patch(
        "app.services.chat_service.get_embedding_service"
    ) as mock_get_embedding, patch(
        "app.services.chat_service.get_milvus_service"
    ) as mock_get_milvus, patch(
        "app.services.chat_service._enrich_chunks_with_metadata"
    ) as mock_enrich, patch(
        "app.services.chat_service._generate_no_results_response"
    ) as mock_no_results, patch(
        "app.services.chat_service._save_to_conversation"
    ) as mock_save:
        mock_get_conversation.return_value = mock_conversation

        mock_embedding_service = AsyncMock()
        mock_embedding_service.embed_query.return_value = [0.1] * 1024
        mock_get_embedding.return_value = mock_embedding_service

        mock_milvus_service = AsyncMock()
        mock_milvus_service.search_similar.return_value = []
        mock_get_milvus.return_value = mock_milvus_service

        mock_enrich.return_value = []
        mock_no_results.return_value = "I don't have information about that."

        # Execute streaming query
        chunks_received = []
        async for chunk in execute_rag_query_stream(
            query="What is the vacation policy?", user_id=mock_user_id, db=session
        ):
            chunks_received.append(chunk)

        # Assertions
        assert len(chunks_received) == 1
        assert "don't have information" in chunks_received[0]
        mock_save.assert_called_once()
