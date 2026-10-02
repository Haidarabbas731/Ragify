import logging
from collections.abc import AsyncIterator
from datetime import UTC, datetime

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.document import Document
from app.prompts.chat_prompt import (
    AGENT_SYSTEM_PROMPT,
    SEARCH_TOOL_DESCRIPTION,
    SEARCH_TOOL_NAME,
    SEARCH_TOOL_PARAMETERS,
    extract_sources,
    format_search_results,
)
from app.schemas.chat import ChatResponse, SourceCitation
from app.services.conversation_service import (
    add_message,
    get_last_messages,
    get_or_create_conversation,
)
from app.services.document_service import get_document_by_id
from app.services.embedding_service import get_embedding_service
from app.services.milvus_service import get_milvus_service
from app.services.providers.base import Message, ToolResult, ToolSpec
from app.services.providers.registry import get_chat_provider

logger = logging.getLogger(__name__)

SEARCH_TOOL = ToolSpec(
    name=SEARCH_TOOL_NAME,
    description=SEARCH_TOOL_DESCRIPTION,
    parameters=SEARCH_TOOL_PARAMETERS,
)

EMPTY_RESPONSE_MESSAGE = "I wasn't able to put together an answer. Please try asking again."


def _build_messages(history: list[dict], query: str) -> list[Message]:
    """
    Build the model conversation from stored history plus the new user message.

    Args:
        history: Previous messages (dicts with ``role`` and ``content``)
        query: The user's new message

    Returns:
        list[Message]: User/assistant turns ending with the new message
    """
    messages = [
        Message(role="user" if m.get("role") == "user" else "assistant", text=m["content"])
        for m in history
        if m.get("content")
    ]
    messages.append(Message(role="user", text=query))
    return messages


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
            logger.warning(f"Document {document_id} not found or access denied for user {user_id}")
            continue

        # Add document name to chunk
        enriched_chunk = chunk.copy()
        enriched_chunk["document_name"] = document.filename
        enriched.append(enriched_chunk)

    return enriched


async def _no_results_hint(user_id: str, db: AsyncSession) -> str:
    """
    Explain to the model why a search returned nothing.

    Checks whether the user has any documents, or only ones still processing, so the
    model can give specific guidance.

    Args:
        user_id: User ID
        db: Database session

    Returns:
        str: Short explanation passed to the model as the tool's ``note``
    """
    result = await db.exec(
        select(func.count(Document.document_id))  # type: ignore
        .where(Document.user_id == user_id)
        .where(Document.deleted_at.is_(None))  # type: ignore
    )
    if result.one() == 0:
        return "The user has not uploaded any documents yet."

    result = await db.exec(
        select(func.count(Document.document_id))  # type:ignore
        .where(Document.user_id == user_id)
        .where(Document.status == "active")
        .where(Document.deleted_at.is_(None))  # type: ignore
    )
    if result.one() == 0:
        return "The user's documents are still being processed; searching will work shortly."

    return "No relevant excerpts were found for this search in the user's documents."


async def _search_documents(
    query: str,
    user_id: str,
    db: AsyncSession,
    collection_id: str | None,
    top_k: int,
) -> tuple[dict, list[dict]]:
    """
    Run the ``search_documents`` tool: embed the query, search Milvus, attach metadata.

    ``user_id`` and ``collection_id`` come from the authenticated request, never from the
    model, so tool calls cannot reach another user's documents.

    Args:
        query: Search text chosen by the model
        user_id: Authenticated user ID (data isolation)
        db: Database session
        collection_id: Optional collection filter from the request
        top_k: Number of chunks to retrieve

    Returns:
        tuple[dict, list[dict]]: (tool response for the model, enriched chunks)
    """
    embedding_service = await get_embedding_service()
    query_embedding = await embedding_service.embed_query(query)

    milvus_service = await get_milvus_service()
    chunks = await milvus_service.search_similar(
        user_id=user_id,
        query_embedding=query_embedding,
        top_k=top_k,
        collection_id=collection_id,
    )
    enriched_chunks = await _enrich_chunks_with_metadata(db, chunks, user_id)
    logger.info(f"Search '{query[:80]}' found {len(enriched_chunks)} chunks")

    hint = None if enriched_chunks else await _no_results_hint(user_id, db)
    return format_search_results(enriched_chunks, hint), enriched_chunks


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
        sources: Source documents used for the answer
    """
    await add_message(db, conversation_id, "user", user_query)
    await add_message(db, conversation_id, "assistant", assistant_response, sources)

    logger.info(f"Saved messages to conversation {conversation_id}")


async def execute_rag_query_stream(
    query: str,
    user_id: str,
    db: AsyncSession,
    conversation_id: str | None = None,
    collection_id: str | None = None,
    top_k: int = 5,
) -> AsyncIterator[dict]:
    """
    Run the chat agent and stream what it does.

    The model decides per turn whether to answer directly or to call ``search_documents``
    (up to ``AGENT_MAX_TOOL_ROUNDS`` times), then streams the final answer.

    Yields dict events:
        {"type": "text", "text": str}                      answer text as it is generated
        {"type": "tool_start", "name": str, "query": str}  the agent started a search
        {"type": "tool_end", "name": str, "chunks": int, "documents": int, "error": bool}
        {"type": "done", "conversation_id": str, "sources": list[dict]}   always last

    Args:
        query: User's question
        user_id: User ID for data isolation
        db: Database session
        conversation_id: Optional conversation ID (creates new if None)
        collection_id: Optional collection filter
        top_k: Number of chunks to retrieve per search (default: 5)

    Raises:
        ValueError: If query is empty
        TimeoutError: If the LLM times out
        Exception: If any step fails
    """
    if not query or not query.strip():
        raise ValueError("Query cannot be empty")

    logger.info(f"Starting agent query for user {user_id}: {query[:100]}...")

    try:
        conversation = await get_or_create_conversation(db, user_id, conversation_id)
        history = await get_last_messages(
            db, conversation.conversation_id, limit=settings.CONVERSATION_HISTORY_LIMIT
        )
        messages = _build_messages(history, query)
        provider = get_chat_provider()

        answer_parts: list[str] = []
        all_chunks: list[dict] = []
        max_rounds = settings.AGENT_MAX_TOOL_ROUNDS

        # Final round runs without tools so the model must answer with what it has.
        for round_index in range(max_rounds + 1):
            tools = [SEARCH_TOOL] if round_index < max_rounds else None
            assistant_turn: Message | None = None

            async for event in provider.stream_turn(
                messages,
                AGENT_SYSTEM_PROMPT,
                tools=tools,
                timeout=settings.GEMINI_RAG_TIMEOUT_SECONDS,
            ):
                if event.kind == "text":
                    answer_parts.append(event.text)
                    yield {"type": "text", "text": event.text}
                else:
                    assistant_turn = event.message

            if assistant_turn is None or not assistant_turn.tool_calls:
                break

            messages.append(assistant_turn)
            results: list[ToolResult] = []

            for call in assistant_turn.tool_calls:
                name = call.name
                if name != SEARCH_TOOL_NAME:
                    logger.warning(f"Model requested unknown tool '{name}'")
                    results.append(ToolResult(call, {"error": f"Unknown tool: {name}"}))
                    continue

                search_query = str(call.args.get("query") or "").strip() or query
                yield {"type": "tool_start", "name": name, "query": search_query}

                try:
                    result, chunks = await _search_documents(
                        search_query, user_id, db, collection_id, top_k
                    )
                except Exception as e:
                    logger.error(f"Document search failed: {e}")
                    result = {"error": "Document search is temporarily unavailable."}
                    chunks = []
                    failed = True
                else:
                    failed = False

                all_chunks.extend(chunks)
                yield {
                    "type": "tool_end",
                    "name": name,
                    "chunks": len(chunks),
                    "documents": len(extract_sources(chunks)),
                    "error": failed,
                }
                results.append(ToolResult(call, result))

            messages.append(Message(role="tool", tool_results=results))

        answer = "".join(answer_parts).strip()
        if not answer:
            logger.warning("Agent finished without any answer text")
            answer = EMPTY_RESPONSE_MESSAGE
            yield {"type": "text", "text": answer}

        sources = extract_sources(all_chunks)
        await _save_to_conversation(db, conversation.conversation_id, query, answer, sources)

        yield {
            "type": "done",
            "conversation_id": conversation.conversation_id,
            "sources": sources,
        }

        logger.info(f"Completed agent query for conversation {conversation.conversation_id}")

    except Exception as e:
        logger.error(f"Agent query failed: {e}")
        raise


async def execute_rag_query(
    query: str,
    user_id: str,
    db: AsyncSession,
    conversation_id: str | None = None,
    collection_id: str | None = None,
    top_k: int = 5,
) -> ChatResponse:
    """
    Run the chat agent and return the complete answer (non-streaming).

    Args:
        query: User's question
        user_id: User ID for data isolation
        db: Database session
        conversation_id: Optional conversation ID (creates new if None)
        collection_id: Optional collection filter
        top_k: Number of chunks to retrieve per search (default: 5)

    Returns:
        ChatResponse: Answer, source documents and conversation_id

    Raises:
        ValueError: If query is empty
        TimeoutError: If the LLM times out
        Exception: If any step fails
    """
    answer_parts: list[str] = []
    sources: list[dict] = []
    result_conversation_id = ""

    async for event in execute_rag_query_stream(
        query=query,
        user_id=user_id,
        db=db,
        conversation_id=conversation_id,
        collection_id=collection_id,
        top_k=top_k,
    ):
        if event["type"] == "text":
            answer_parts.append(event["text"])
        elif event["type"] == "done":
            result_conversation_id = event["conversation_id"]
            sources = event["sources"]

    return ChatResponse(
        answer="".join(answer_parts).strip(),
        sources=[SourceCitation(**src) for src in sources],
        conversation_id=result_conversation_id,
        timestamp=datetime.now(UTC),
    )
