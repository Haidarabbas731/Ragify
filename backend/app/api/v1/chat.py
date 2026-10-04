import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.db.database import get_session
from app.models.user import User
from app.schemas.chat import ChatQuery, ChatResponse
from app.services.ai_settings_service import resolve_chat_provider
from app.services.chat_service import execute_rag_query, execute_rag_query_stream
from app.services.providers.base import ProviderError
from app.services.redis_service import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])

GENERIC_STREAM_ERROR = ProviderError.user_message


def _friendly_error(error: Exception) -> str:
    """
    Turn an exception raised while answering into a short message that is safe to show users.

    Provider error payloads (quota details, request IDs, URLs) stay in the server logs.

    Args:
        error: Exception raised while producing the chat response

    Returns:
        str: User-facing message
    """
    if isinstance(error, ProviderError):
        return error.user_message
    if isinstance(error, ValueError):
        return str(error)
    return GENERIC_STREAM_ERROR


@router.post("/chat", response_model=ChatResponse)
async def chat_query(
    request: ChatQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Execute RAG chat query (with optional streaming).

    This endpoint:
    1. Validates rate limits (configurable per minute)
    2. Runs the chat agent: the model decides whether to answer directly or to search
       the user's documents with a tool, then answers (JSON or SSE stream)
    3. Returns the answer with the source documents it used

    **Rate Limit:** Configurable requests per minute (default: 100/minute)

    **Request Body:**
    - query: User's question (1-2000 chars)
    - conversation_id: Optional conversation ID for multi-turn chat
    - collection_id: Optional collection ID to filter search
    - top_k: Number of chunks to retrieve (1-20, default: 5)
    - stream: Enable streaming response (SSE) for word-by-word output

    **Response:**
    - If stream=false: JSON with answer, sources, conversation_id, timestamp
    - If stream=true: SSE stream of JSON events (data: {...}): {chunk} answer text,
      {tool_call} / {tool_result} when the agent searches documents, and a final
      {done, conversation_id, sources}

    **Error Responses:**
    - 400: Invalid query format
    - 404: Conversation or collection not found
    - 429: Rate limit exceeded
    - 500: Internal server error
    - 504: LLM timeout
    """
    try:
        # Check rate limit (configurable per minute)
        rate_limit_key = f"chat:{current_user.user_id}"
        is_allowed = await check_rate_limit(
            rate_limit_key,
            max_requests=settings.RATE_LIMIT_PER_MINUTE,
            window_seconds=60
        )

        if not is_allowed:
            logger.warning(f"Rate limit exceeded for user {current_user.user_id}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded. Maximum {settings.RATE_LIMIT_PER_MINUTE} requests per minute.",
            )

        # The user's own model and key if they saved them, else the server defaults
        provider = await resolve_chat_provider(db, current_user.user_id)

        # Handle streaming vs non-streaming
        if request.stream:
            # Return streaming response (SSE)
            async def stream_generator():
                try:
                    async for event in execute_rag_query_stream(
                        query=request.query,
                        user_id=current_user.user_id,
                        db=db,
                        provider=provider,
                        conversation_id=request.conversation_id,
                        collection_id=request.collection_id,
                        top_k=request.top_k,
                    ):
                        event_type = event["type"]

                        if event_type == "text":
                            payload = {"chunk": event["text"]}
                        elif event_type == "tool_start":
                            payload = {"tool_call": event["step"].model_dump()}
                        elif event_type == "tool_end":
                            payload = {"tool_result": event["step"].model_dump()}
                        else:  # done
                            payload = {
                                "done": True,
                                "conversation_id": event["conversation_id"],
                                "sources": [src.model_dump() for src in event["sources"]],
                            }

                        # Format as SSE (Server-Sent Events)
                        yield f"data: {json.dumps(payload)}\n\n"

                except Exception as e:
                    logger.error(f"Streaming error: {e}")
                    error_data = json.dumps({"error": _friendly_error(e)})
                    yield f"data: {error_data}\n\n"

            logger.info(f"Starting streaming chat for user {current_user.user_id}")
            return StreamingResponse(
                stream_generator(),
                media_type="text/event-stream",
                headers={
                    "Cache-Control": "no-cache",
                    "X-Accel-Buffering": "no",
                },
            )

        else:
            # Execute regular RAG query (non-streaming)
            response = await execute_rag_query(
                query=request.query,
                user_id=current_user.user_id,
                db=db,
                provider=provider,
                conversation_id=request.conversation_id,
                collection_id=request.collection_id,
                top_k=request.top_k,
            )

            logger.info(
                f"Chat query completed for user {current_user.user_id} - "
                f"conversation {response.conversation_id}"
            )
            return response

    except ValueError as e:
        # Invalid input (conversation not found, empty query, etc.)
        logger.warning(f"Invalid chat request: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e

    except ProviderError as e:
        # Model provider failure (timeout, rate limit, bad key, outage)
        logger.error(f"Provider error for user {current_user.user_id}: {e}")
        raise HTTPException(status_code=e.status_code, detail=e.user_message) from e

    except Exception as e:
        # Unexpected error
        logger.error(f"Chat query failed for user {current_user.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your question. Please try again.",
        ) from e
