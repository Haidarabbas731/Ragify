import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_user
from app.core.config import settings
from app.db.database import get_session
from app.models.user import User
from app.schemas.chat import ChatQuery
from app.services.chat_service import execute_rag_query, execute_rag_query_stream
from app.services.redis_service import check_rate_limit

logger = logging.getLogger(__name__)

router = APIRouter(tags=["chat"])


@router.post("/chat")
async def chat_query(
    request: ChatQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Execute RAG chat query (with optional streaming).

    This endpoint:
    1. Validates rate limits (configurable per minute)
    2. Executes RAG flow (embed → search → format → LLM → save)
    3. Returns AI response with source citations (JSON or SSE stream)

    **Rate Limit:** Configurable requests per minute (default: 100/minute)

    **Request Body:**
    - query: User's question (1-2000 chars)
    - conversation_id: Optional conversation ID for multi-turn chat
    - collection_id: Optional collection ID to filter search
    - top_k: Number of chunks to retrieve (1-20, default: 5)
    - stream: Enable streaming response (SSE) for word-by-word output

    **Response:**
    - If stream=false: JSON with answer, sources, conversation_id, timestamp
    - If stream=true: SSE stream with text chunks (data: {...})

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

        # Handle streaming vs non-streaming
        if request.stream:
            # Return streaming response (SSE)
            async def stream_generator():
                try:
                    async for chunk in execute_rag_query_stream(
                        query=request.query,
                        user_id=current_user.user_id,
                        db=db,
                        conversation_id=request.conversation_id,
                        collection_id=request.collection_id,
                        top_k=request.top_k,
                    ):
                        # Format as SSE (Server-Sent Events)
                        yield f"data: {json.dumps({'chunk': chunk})}\n\n"

                    # Send final message to indicate completion
                    yield "data: {\"done\": true}\n\n"

                except Exception as e:
                    logger.error(f"Streaming error: {e}")
                    error_data = json.dumps({"error": str(e)})
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

    except TimeoutError as e:
        # LLM timeout
        logger.error(f"LLM timeout for user {current_user.user_id}")
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail=str(e),
        ) from e

    except Exception as e:
        # Unexpected error
        logger.error(f"Chat query failed for user {current_user.user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your question. Please try again.",
        ) from e
