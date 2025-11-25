import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import text
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.conversation import Conversation

logger = logging.getLogger(__name__)


async def get_or_create_conversation(
    db: AsyncSession, user_id: str, conversation_id: str | None = None
) -> Conversation:
    """
    Get existing conversation or create a new one.

    Args:
        db: Database session
        user_id: User ID
        conversation_id: Optional conversation ID (creates new if None)

    Returns:
        Conversation: Existing or newly created conversation

    Raises:
        ValueError: If conversation_id doesn't exist or belongs to different user
    """
    if conversation_id:
        # Get existing conversation
        result = await db.exec(
            select(Conversation).where(
                Conversation.conversation_id == conversation_id,
                Conversation.user_id == user_id,
            )
        )
        conversation = result.one_or_none()

        if not conversation:
            raise ValueError(
                f"Conversation {conversation_id} not found for user {user_id}"
            )

        return conversation

    # Create new conversation
    conversation = Conversation(
        conversation_id=str(uuid.uuid4()),
        user_id=user_id,
        messages=[],
        message_count=0,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)

    logger.info(
        f"Created new conversation {conversation.conversation_id} for user {user_id}"
    )
    return conversation


async def add_message(
    db: AsyncSession,
    conversation_id: str,
    role: str,
    content: str,
    sources: list[dict] | None = None,
) -> Conversation:
    """
    Add a message to a conversation.

    Args:
        db: Database session
        conversation_id: Conversation ID
        role: Message role ("user" or "assistant")
        content: Message content
        sources: Optional source citations for assistant messages

    Returns:
        Conversation: Updated conversation

    Raises:
        ValueError: If conversation not found or role invalid
    """
    if role not in ["user", "assistant"]:
        raise ValueError(f"Invalid role: {role}. Must be 'user' or 'assistant'")

    # Get conversation
    result = await db.exec(
        select(Conversation).where(Conversation.conversation_id == conversation_id)
    )
    conversation = result.one_or_none()

    if not conversation:
        raise ValueError(f"Conversation {conversation_id} not found")

    # Create message
    message = {
        "role": role,
        "content": content,
        "timestamp": datetime.now(UTC).isoformat(),
    }

    if sources and role == "assistant":
        message["sources"] = sources  # type:ignore

    # Add message to conversation
    conversation.messages.append(message)
    conversation.message_count += 1
    conversation.updated_at = datetime.now(UTC)

    # Use flag_modified to ensure JSONB update is detected
    from sqlalchemy.orm import attributes

    attributes.flag_modified(conversation, "messages")

    await db.commit()
    await db.refresh(conversation)

    logger.info(
        f"Added {role} message to conversation {conversation_id} (total: {conversation.message_count})"
    )
    return conversation


async def get_conversation_by_id(
    db: AsyncSession, conversation_id: str, user_id: str
) -> Conversation | None:
    """
    Get conversation by ID (with user isolation).

    Args:
        db: Database session
        conversation_id: Conversation ID
        user_id: User ID for isolation

    Returns:
        Conversation | None: Conversation if found, None otherwise
    """
    result = await db.exec(
        select(Conversation).where(
            Conversation.conversation_id == conversation_id,
            Conversation.user_id == user_id,
        )
    )
    return result.one_or_none()


async def list_user_conversations(
    db: AsyncSession, user_id: str, limit: int = 50, offset: int = 0
) -> list[Conversation]:
    """
    List all conversations for a user.

    Args:
        db: Database session
        user_id: User ID
        limit: Max number of conversations to return (default: 50)
        offset: Number of conversations to skip (default: 0)

    Returns:
        list[Conversation]: List of conversations ordered by updated_at DESC
    """
    result = await db.exec(
        select(Conversation)
        .where(Conversation.user_id == user_id)
        .order_by(Conversation.updated_at.desc())  # type:ignore
        .limit(limit)
        .offset(offset)
    )
    conversations = result.all()
    return list(conversations)


async def delete_conversation(
    db: AsyncSession, conversation_id: str, user_id: str
) -> bool:
    """
    Delete a conversation (hard delete).

    Args:
        db: Database session
        conversation_id: Conversation ID
        user_id: User ID for isolation

    Returns:
        bool: True if deleted, False if not found

    Raises:
        Exception: If deletion fails
    """
    # Get conversation with user isolation
    conversation = await get_conversation_by_id(db, conversation_id, user_id)

    if not conversation:
        return False

    await db.delete(conversation)
    await db.commit()

    logger.info(f"Deleted conversation {conversation_id} for user {user_id}")
    return True


async def get_last_messages(
    db: AsyncSession, conversation_id: str, limit: int = 5
) -> list[dict]:
    """
    Get last N messages from a conversation.

    Args:
        db: Database session
        conversation_id: Conversation ID
        limit: Number of messages to return (default: 5)

    Returns:
        list[dict]: List of last N messages

    Note:
        Returns empty list if conversation not found
    """
    result = await db.exec(
        select(Conversation).where(Conversation.conversation_id == conversation_id)
    )
    conversation = result.one_or_none()

    if not conversation or not conversation.messages:
        return []

    # Return last N messages
    return conversation.messages[-limit:]


async def get_conversation_count(db: AsyncSession, user_id: str) -> int:
    """
    Get total number of conversations for a user.

    Args:
        db: Database session
        user_id: User ID

    Returns:
        int: Number of conversations
    """
    result = await db.execute(
        text("SELECT COUNT(*) FROM conversations WHERE user_id = :user_id"),
        {"user_id": user_id},
    )
    count = result.scalar()
    return count if count else 0
