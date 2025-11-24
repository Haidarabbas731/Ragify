import logging
from datetime import UTC, datetime

from sqlmodel.ext.asyncio.session import AsyncSession

from app.prompts.chat_prompt import SYSTEM_PROMPT, format_context_with_metadata, format_user_prompt
from app.schemas.chat import ChatResponse, SourceCitation
from app.services.conversation_service import add_message, get_or_create_conversation
from app.services.document_service import get_document_by_id
from app.services.embedding_service import get_embedding_service
from app.services.llm_service import get_llm_service
from app.services.milvus_service import get_milvus_service

logger = logging.getLogger(__name__)


async def execute_rag_query(
    query: str,
    user_id: str,
    db: AsyncSession,
    conversation_id: str | None = None,
    collection_id: str | None = None,
    top_k: int = 5,
) -> ChatResponse:
    """
    Execute complete RAG (Retrieval-Augmented Generation) query flow.

    Flow:
    1. Generate query embedding
    2. Search Milvus for similar chunks
    3. Enrich chunks with document metadata
    4. Format context from results
    5. Build RAG prompt
    6. Call LLM for answer
    7. Save user query and assistant response to conversation
    8. Return response with sources

    Args:
        query: User's question
        user_id: User ID for data isolation
        db: Database session
        conversation_id: Optional conversation ID (creates new if None)
        collection_id: Optional collection filter
        top_k: Number of chunks to retrieve (default: 5)

    Returns:
        ChatResponse: AI response with sources and conversation_id

    Raises:
        ValueError: If query is empty
        TimeoutError: If LLM times out
        Exception: If any step fails
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    logger.info(f"Starting RAG query for user {user_id}: {query[:100]}...")

    try:
        # Step 1: Get or create conversation
        conversation = await get_or_create_conversation(db, user_id, conversation_id)

        # Step 2: Generate query embedding
        embedding_service = await get_embedding_service()
        query_embedding = await embedding_service.embed_query(query)
        logger.info(f"Generated query embedding ({len(query_embedding)} dims)")

        # Step 3: Search Milvus for similar chunks
        milvus_service = await get_milvus_service()
        chunks = await milvus_service.search_similar(
            user_id=user_id,
            query_embedding=query_embedding,
            top_k=top_k,
            collection_id=collection_id,
        )
        logger.info(f"Found {len(chunks)} similar chunks")

        # Step 4: Enrich chunks with document metadata
        enriched_chunks = await _enrich_chunks_with_metadata(db, chunks, user_id)

        # Step 5: Handle no results edge case
        if not enriched_chunks:
            response_text = _generate_no_results_response(user_id, db)
            await _save_to_conversation(
                db, conversation.conversation_id, query, response_text, []
            )
            return ChatResponse(
                answer=response_text,
                sources=[],
                conversation_id=conversation.conversation_id,
                timestamp=datetime.now(UTC),
            )

        # Step 6: Format context and extract sources
        formatted_context, sources = format_context_with_metadata(enriched_chunks)

        # Step 7: Build prompts
        user_prompt = format_user_prompt(formatted_context, query)

        # Step 8: Call LLM for response
        llm_service = await get_llm_service()
        response_text = await llm_service.generate_response(SYSTEM_PROMPT, user_prompt, timeout=10)
        logger.info(f"Generated LLM response ({len(response_text)} chars)")

        # Step 9: Save to conversation
        await _save_to_conversation(
            db, conversation.conversation_id, query, response_text, sources
        )

        # Step 10: Return response
        return ChatResponse(
            answer=response_text,
            sources=[
                SourceCitation(
                    document_id=src["document_id"],
                    document_name=src["document_name"],
                    chunk_text=src["chunk_text"],
                    score=src["score"],
                )
                for src in sources
            ],
            conversation_id=conversation.conversation_id,
            timestamp=datetime.now(UTC),
        )

    except TimeoutError as e:
        logger.error("LLM request timed out")
        raise TimeoutError(
            "The AI is taking too long to respond. Please try again or simplify your question."
        ) from e

    except Exception as e:
        logger.error(f"RAG query failed: {e}")
        raise


async def _enrich_chunks_with_metadata(
    db: AsyncSession, chunks: list[dict], user_id: str
) -> list[dict]:
    """
    Enrich chunks with document metadata (name, etc).

    Args:
        db: Database session
        chunks: Raw chunks from Milvus
        user_id: User ID for document lookup

    Returns:
        list[dict]: Enriched chunks with document_name added
    """
    enriched = []

    for chunk in chunks:
        document_id = chunk.get("document_id")
        if not document_id:
            continue

        # Get document metadata
        document = await get_document_by_id(db, document_id, user_id)
        if not document:
            logger.warning(f"Document {document_id} not found for chunk enrichment")
            continue

        # Add document name to chunk
        enriched_chunk = chunk.copy()
        enriched_chunk["document_name"] = document.filename
        enriched.append(enriched_chunk)

    return enriched


def _generate_no_results_response(user_id: str, db: AsyncSession) -> str:
    """
    Generate helpful response when no results found.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        str: Helpful error message
    """
    # TODO: Check if user has any documents uploaded
    return (
        "I don't have enough information in your documents to answer that question. "
        "This could mean:\n"
        "- The information isn't in your uploaded documents\n"
        "- Your documents are still being processed\n"
        "- You haven't uploaded any documents yet\n\n"
        "Try uploading relevant documents or rephrasing your question."
    )


async def _save_to_conversation(
    db: AsyncSession,
    conversation_id: str,
    user_query: str,
    assistant_response: str,
    sources: list[dict],
) -> None:
    """
    Save user query and assistant response to conversation.

    Args:
        db: Database session
        conversation_id: Conversation ID
        user_query: User's question
        assistant_response: AI's response
        sources: Source citations
    """
    # Save user message
    await add_message(db, conversation_id, "user", user_query)

    # Save assistant message with sources
    await add_message(db, conversation_id, "assistant", assistant_response, sources)

    logger.info(f"Saved messages to conversation {conversation_id}")
