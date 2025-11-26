import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_user
from app.db.database import get_session
from app.models.user import User
from app.schemas.conversation import (
    ConversationListItem,
    ConversationListParams,
    ConversationResponse,
)
from app.services.conversation_service import (
    delete_conversation,
    get_conversation_by_id,
    list_user_conversations,
)
from app.utils.validators import validate_uuid

logger = logging.getLogger(__name__)

router = APIRouter(tags=["conversations"])


@router.get("/conversations", response_model=list[ConversationListItem])
async def list_conversations(
    params: ConversationListParams = Depends(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    List all conversations for the current user with pagination.

    Returns conversations ordered by most recently updated first.
    """
    conversations = await list_user_conversations(
        db, current_user.user_id, params.limit, params.offset
    )

    # Convert to response schema
    return [
        ConversationListItem(  # type:ignore
            conversation_id=conv.conversation_id,
            user_id=conv.user_id,
            message_count=conv.message_count,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            # Get preview from first user message if exists
            last_message=(  # type:ignore
                conv.messages[0]["content"][:100]
                if conv.messages
                else None
            ),
        )
        for conv in conversations
    ]


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Get full conversation history by ID.

    Returns all messages in the conversation.
    """
    validate_uuid(conversation_id, "conversation_id")
    conversation = await get_conversation_by_id(
        db, conversation_id, current_user.user_id
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Conversation {conversation_id} not found",
        )

    return ConversationResponse(
        conversation_id=conversation.conversation_id,
        user_id=conversation.user_id,
        messages=conversation.messages,  # type: ignore
        message_count=conversation.message_count,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


@router.delete(
    "/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT
)
async def delete_conversation_endpoint(
    conversation_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    """
    Delete a conversation (hard delete).

    This permanently removes the conversation and all its messages.
    """
    validate_uuid(conversation_id, "conversation_id")
    try:
        deleted = await delete_conversation(db, conversation_id, current_user.user_id)

        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Conversation {conversation_id} not found",
            )

        logger.info(
            f"Conversation {conversation_id} deleted by user {current_user.user_id}"
        )
        return None

    except Exception as e:
        logger.error(f"Conversation deletion failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation",
        ) from e
