import logging
import re
from collections.abc import AsyncIterator
from datetime import UTC, datetime

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.document import Document
from app.prompts.chat_prompt import (
    DIRECT_RESPONSE_PROMPT,
    SYSTEM_PROMPT,
    format_context_with_metadata,
    format_user_prompt,
)
from app.schemas.chat import ChatResponse, SourceCitation
from app.services.conversation_service import (
    add_message,
    get_last_messages,
    get_or_create_conversation,
)
from app.services.document_service import get_document_by_id
from app.services.embedding_service import get_embedding_service
from app.services.llm_service import get_llm_service
from app.services.milvus_service import get_milvus_service

logger = logging.getLogger(__name__)


async def classify_query_intent(query: str) -> tuple[str, str]:
    """
    Classify query intent using hybrid approach (regex + LLM fallback).

    Args:
        query: User's question

    Returns:
        tuple[str, str]: (intent_type, confidence)
        - intent_type: 'direct' (skip RAG) or 'rag' (use RAG)
        - confidence: 'high' (regex match) or 'medium' (LLM classification) or 'low' (fallback)
    """
    query_lower = query.lower().strip()

    # STEP 1: Fast Regex Patterns (handles 80% of cases in <1ms)
    # =========================================================

    # Pattern 1: Greetings (very high confidence)
    greeting_patterns = [
        r"^(hi|hello|hey|greetings|good morning|good afternoon|good evening)[\s!?.]*$",
        r"^(how are you|how\'s it going|what\'s up|sup)[\s!?.]*$",
        r"^(thanks|thank you|thx|thank you very much)[\s!?.]*$",
        r"^(bye|goodbye|see you|later|farewell)[\s!?.]*$",
    ]
    for pattern in greeting_patterns:
        if re.match(pattern, query_lower):
            logger.info(f"Intent: GREETING (regex match) - '{query[:50]}...'")
            return ("direct", "high")

    # Pattern 2: System/Capability Questions (high confidence)
    system_patterns = [
        r"^(what can you do|what are your capabilities|how do you work)",
        r"^(who are you|what are you|tell me about yourself)",
        r"^(help|how to use|usage|instructions)",
        r"^(what (is|are) (this|your) (system|app|tool|ragify))",
    ]
    for pattern in system_patterns:
        if re.search(pattern, query_lower):
            logger.info(f"Intent: SYSTEM (regex match) - '{query[:50]}...'")
            return ("direct", "high")

    # Pattern 3: Document Keywords (high confidence for RAG)
    document_keywords = [
        "document",
        "file",
        "pdf",
        "report",
        "policy",
        "contract",
        "according to",
        "in the document",
        "based on",
        "what does",
        "explain",
        "summarize",
        "tell me about",
        "find",
        "search",
        "show me",
        "where",
        "when",
        "how many",
        "list",
        "describe",
    ]
    if any(keyword in query_lower for keyword in document_keywords):
        logger.info(f"Intent: DOCUMENT (keyword match) - '{query[:50]}...'")
        return ("rag", "high")

    # STEP 2: LLM Fallback for Ambiguous Cases (handles remaining 20%)
    # ================================================================

    logger.info(f"Intent: UNCERTAIN - Using LLM classification for '{query[:50]}...'")

    try:
        # Use fast Gemini Flash model for quick classification
        classification_prompt = f"""Classify this user query into ONE category:

Query: "{query}"

Categories:
1. GREETING - Simple greetings, thank you, small talk
2. SYSTEM - Questions about the system itself, capabilities, how to use
3. DOCUMENT - Questions that require searching through documents or knowledge base

Respond with ONLY ONE WORD: GREETING, SYSTEM, or DOCUMENT

Classification:"""

        # Fast LLM call (Gemini Flash 1.5 - ~200ms)
        llm_service = await get_llm_service()
        classification = await llm_service.generate_response(
            system_prompt="You are a query classifier. Respond with only one word.",
            user_prompt=classification_prompt,
            max_tokens=10,  # Only need 1 word
            temperature=0.0,  # Deterministic
            timeout=10,
        )

        classification = classification.strip().upper()

        if classification in ["GREETING", "SYSTEM"]:
            logger.info(f"Intent: {classification} (LLM fallback) - '{query[:50]}...'")
            return ("direct", "medium")
        else:  # DOCUMENT or anything else defaults to RAG (safer)
            logger.info(f"Intent: DOCUMENT (LLM fallback) - '{query[:50]}...'")
            return ("rag", "medium")

    except Exception as e:
        # STEP 3: Error Fallback - Default to RAG (safer than direct)
        logger.warning(f"LLM classification failed: {e}. Defaulting to RAG.")
        return ("rag", "low")


async def _generate_direct_response(
    query: str,
    user_id: str,
    db: AsyncSession,
    conversation_id: str,
) -> str:
    """
    Generate direct response without RAG retrieval (for greetings/system questions).

    Args:
        query: User's question
        user_id: User ID
        db: Database session
        conversation_id: Conversation ID

    Returns:
        str: Direct response text
    """
    logger.info(f"Generating direct response for query: {query[:50]}...")

    # Get conversation history for context
    conversation_history = await get_last_messages(
        db, conversation_id, limit=settings.CONVERSATION_HISTORY_LIMIT
    )

    # Build simple prompt without document context
    history_section = ""
    if conversation_history:
        history_section = "\n\nPrevious conversation:\n"
        for msg in conversation_history:
            role = "User" if msg["role"] == "user" else "Assistant"
            history_section += f"{role}: {msg['content']}\n"

    user_prompt = f"{history_section}\n\nUser: {query}\n\nAssistant:"

    # Call LLM with direct response prompt
    llm_service = await get_llm_service()
    response_text = await llm_service.generate_response(
        DIRECT_RESPONSE_PROMPT, user_prompt, timeout=10
    )

    logger.info(f"Generated direct response ({len(response_text)} chars)")
    return response_text


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
    1. Get or create conversation
    2. Generate query embedding
    3. Search Milvus for similar chunks
    4. Enrich chunks with document metadata
    5. Handle no results edge case
    6. Format context from results
    7. Get conversation history (last 5 messages)
    8. Build RAG prompt with conversation context
    9. Call LLM for answer
    10. Save user query and assistant response to conversation
    11. Return response with sources

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

        # Step 2: Classify query intent (SMART ROUTING)
        intent, confidence = await classify_query_intent(query)
        logger.info(f"Query intent: {intent} (confidence: {confidence})")

        # Step 3: Direct response path (skip RAG for greetings/system questions)
        if intent == "direct":
            response_text = await _generate_direct_response(
                query, user_id, db, conversation.conversation_id
            )

            # Save to conversation (no sources)
            await _save_to_conversation(
                db, conversation.conversation_id, query, response_text, []
            )

            return ChatResponse(
                answer=response_text,
                sources=[],
                conversation_id=conversation.conversation_id,
                timestamp=datetime.now(UTC),
            )

        # Step 4: Continue with RAG pipeline for document questions
        # Generate query embedding
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
            response_text = await _generate_no_results_response(user_id, db)
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

        # Step 7: Get conversation history for context
        conversation_history = await get_last_messages(
            db, conversation.conversation_id, limit=settings.CONVERSATION_HISTORY_LIMIT
        )

        # Step 8: Build prompts with conversation history
        user_prompt = format_user_prompt(formatted_context, query, conversation_history)

        # Step 9: Call LLM for response
        llm_service = await get_llm_service()
        response_text = await llm_service.generate_response(
            SYSTEM_PROMPT, user_prompt, timeout=settings.GEMINI_RAG_TIMEOUT_SECONDS
        )
        logger.info(f"Generated LLM response ({len(response_text)} chars)")

        # Step 10: Save to conversation
        await _save_to_conversation(
            db, conversation.conversation_id, query, response_text, sources
        )

        # Step 11: Return response
        return ChatResponse(
            answer=response_text,
            sources=[
                SourceCitation(
                    document_id=src["document_id"],
                    document_name=src["document_name"],
                    filename=src["filename"],
                    chunk_index=src["chunk_index"],
                    chunk_text=src["chunk_text"],
                    relevance_score=src["relevance_score"],
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
        document = await get_document_by_id(db, document_id)  # type:ignore
        if not document or document.user_id != user_id:  # Verify user ownership
            logger.warning(
                f"Document {document_id} not found or access denied for user {user_id}"
            )
            continue

        # Add document name to chunk
        enriched_chunk = chunk.copy()
        enriched_chunk["document_name"] = document.filename
        enriched.append(enriched_chunk)

    return enriched


async def _generate_no_results_response(user_id: str, db: AsyncSession) -> str:
    """
    Generate helpful response when no results found.

    Checks if user has any documents to provide more specific guidance.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        str: Helpful error message tailored to user's situation
    """
    # Check if user has any documents
    result = await db.exec(
        select(func.count(Document.document_id))  # type: ignore
        .where(Document.user_id == user_id)
        .where(Document.deleted_at.is_(None))  # type: ignore
    )
    doc_count = result.one()

    if doc_count == 0:
        # User has no documents at all
        return (
            "You haven't uploaded any documents yet. "
            "Please upload documents to your knowledge base so I can answer your questions."
        )

    # Check if user has any active (processed) documents
    result = await db.exec(
        select(func.count(Document.document_id))  # type:ignore
        .where(Document.user_id == user_id)
        .where(Document.status == "active")
        .where(Document.deleted_at.is_(None))  # type: ignore
    )
    active_count = result.one()

    if active_count == 0:
        # User has documents but they're all still processing
        return (
            "Your documents are still being processed. "
            "Please wait a moment and try again."
        )

    # User has active documents but no results found for this query
    return (
        "I don't have enough information in your documents to answer that question. "
        "This could mean:\n"
        "- The information isn't in your uploaded documents\n"
        "- Try rephrasing your question with different keywords\n\n"
        "You can also try uploading more relevant documents to expand my knowledge."
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


async def execute_rag_query_stream(
    query: str,
    user_id: str,
    db: AsyncSession,
    conversation_id: str | None = None,
    collection_id: str | None = None,
    top_k: int = 5,
) -> AsyncIterator[str | dict]:
    """
    Execute RAG query with streaming response.

    This function performs the same RAG flow as execute_rag_query but streams
    the LLM response word-by-word for better user experience.

    Flow:
    1-7. Same as execute_rag_query (prepare context)
    8. Build prompt with conversation history
    9. Stream LLM response chunks
    10. Save complete response to conversation after streaming finishes
    11. Yield metadata (conversation_id and sources)

    Args:
        query: User's question
        user_id: User ID for data isolation
        db: Database session
        conversation_id: Optional conversation ID (creates new if None)
        collection_id: Optional collection filter
        top_k: Number of chunks to retrieve (default: 5)

    Yields:
        str: Response text chunks as they are generated
        dict: Metadata at the end containing conversation_id and sources

    Raises:
        ValueError: If query is empty
        TimeoutError: If LLM times out
        Exception: If any step fails
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    logger.info(f"Starting streaming RAG query for user {user_id}: {query[:100]}...")

    try:
        # Step 1: Get/create conversation
        conversation = await get_or_create_conversation(db, user_id, conversation_id)

        # Step 2: Classify query intent (SMART ROUTING)
        intent, confidence = await classify_query_intent(query)
        logger.info(f"Streaming query intent: {intent} (confidence: {confidence})")

        # Step 3: Direct response path (skip RAG for greetings/system questions)
        if intent == "direct":
            response_text = await _generate_direct_response(
                query, user_id, db, conversation.conversation_id
            )

            # Save to conversation (no sources)
            await _save_to_conversation(
                db, conversation.conversation_id, query, response_text, []
            )

            # Yield response and metadata
            yield response_text
            yield {
                "conversation_id": conversation.conversation_id,
                "sources": [],
            }
            return

        # Steps 4-5: Continue with RAG pipeline - generate embedding
        embedding_service = await get_embedding_service()
        query_embedding = await embedding_service.embed_query(query)

        # Steps 6-7: Search Milvus and enrich chunks
        milvus_service = await get_milvus_service()
        chunks = await milvus_service.search_similar(
            user_id=user_id,
            query_embedding=query_embedding,
            top_k=top_k,
            collection_id=collection_id,
        )
        enriched_chunks = await _enrich_chunks_with_metadata(db, chunks, user_id)

        # Step 5: Handle no results
        if not enriched_chunks:
            response_text = await _generate_no_results_response(user_id, db)
            await _save_to_conversation(
                db, conversation.conversation_id, query, response_text, []
            )
            yield response_text
            return

        # Steps 6-7: Format context and get conversation history
        formatted_context, sources = format_context_with_metadata(enriched_chunks)
        conversation_history = await get_last_messages(
            db, conversation.conversation_id, limit=settings.CONVERSATION_HISTORY_LIMIT
        )

        # Step 8: Build prompt
        user_prompt = format_user_prompt(formatted_context, query, conversation_history)

        # Step 9: Stream LLM response
        llm_service = await get_llm_service()
        full_response = []

        async for chunk in llm_service.generate_response_stream(
            SYSTEM_PROMPT, user_prompt, timeout=settings.GEMINI_RAG_TIMEOUT_SECONDS
        ):
            full_response.append(chunk)
            yield chunk

        # Step 10: Save complete response to conversation
        response_text = "".join(full_response)
        await _save_to_conversation(
            db, conversation.conversation_id, query, response_text, sources
        )

        # Yield metadata at the end (conversation_id and sources)
        yield {
            "conversation_id": conversation.conversation_id,
            "sources": [
                {
                    "document_id": src["document_id"],
                    "document_name": src["document_name"],
                    "filename": src["filename"],
                    "chunk_index": src["chunk_index"],
                    "chunk_text": src["chunk_text"],
                    "relevance_score": src["relevance_score"],
                }
                for src in sources
            ],
        }

        logger.info(
            f"Completed streaming RAG query for conversation {conversation.conversation_id}"
        )

    except TimeoutError as e:
        logger.error("LLM streaming request timed out")
        raise TimeoutError(
            "The AI is taking too long to respond. Please try again or simplify your question."
        ) from e

    except Exception as e:
        logger.error(f"Streaming RAG query failed: {e}")
        raise
