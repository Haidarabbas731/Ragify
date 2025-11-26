"""
Unit tests for conversation_service.py - Conversation management.

Tests:
- Get or create conversation
- Add messages to conversation
- Get conversation by ID
- List user conversations
- Delete conversation
- Get last messages
- Get conversation count
"""

import uuid

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.conversation import Conversation
from app.services.conversation_service import (
    add_message,
    delete_conversation,
    get_conversation_by_id,
    get_conversation_count,
    get_last_messages,
    get_or_create_conversation,
    list_user_conversations,
)

# Test: get_or_create_conversation - Create new


@pytest.mark.asyncio
async def test_get_or_create_conversation_new(session: AsyncSession, sample_user):
    """Test creating a new conversation."""

    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    assert conversation is not None
    assert conversation.user_id == sample_user.user_id
    assert conversation.message_count == 0
    assert conversation.messages == []
    assert conversation.conversation_id is not None


# Test: get_or_create_conversation - Get existing


@pytest.mark.asyncio
async def test_get_or_create_conversation_existing(session: AsyncSession, sample_user):
    """Test getting an existing conversation."""

    # Create conversation first
    existing_conv = Conversation(
        conversation_id=str(uuid.uuid4()),
        user_id=sample_user.user_id,
        messages=[],
        message_count=0,
    )
    session.add(existing_conv)
    await session.commit()
    await session.refresh(existing_conv)

    # Get existing conversation
    conversation = await get_or_create_conversation(
        session, sample_user.user_id, existing_conv.conversation_id
    )

    assert conversation.conversation_id == existing_conv.conversation_id
    assert conversation.user_id == sample_user.user_id


# Test: get_or_create_conversation - Wrong user


@pytest.mark.asyncio
async def test_get_or_create_conversation_wrong_user(session: AsyncSession, sample_user):
    """Test that getting conversation with wrong user_id fails."""

    # Create conversation for sample_user
    existing_conv = Conversation(
        conversation_id=str(uuid.uuid4()),
        user_id=sample_user.user_id,
        messages=[],
        message_count=0,
    )
    session.add(existing_conv)
    await session.commit()

    # Try to get with different user_id
    wrong_user_id = str(uuid.uuid4())

    with pytest.raises(ValueError, match="not found for user"):
        await get_or_create_conversation(
            session, wrong_user_id, existing_conv.conversation_id
        )


# Test: add_message - User message


@pytest.mark.asyncio
async def test_add_message_user(session: AsyncSession, sample_user):
    """Test adding a user message to conversation."""

    # Create conversation
    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    # Add user message
    updated_conv = await add_message(
        session, conversation.conversation_id, "user", "What is the policy?"
    )

    assert updated_conv.message_count == 1
    assert len(updated_conv.messages) == 1
    assert updated_conv.messages[0]["role"] == "user"
    assert updated_conv.messages[0]["content"] == "What is the policy?"
    assert "timestamp" in updated_conv.messages[0]


# Test: add_message - Assistant message with sources


@pytest.mark.asyncio
async def test_add_message_assistant_with_sources(session: AsyncSession, sample_user):
    """Test adding an assistant message with source citations."""

    # Create conversation
    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    # Add assistant message with sources
    sources = [
        {"document_id": "doc1", "document_name": "policy.pdf", "score": 0.95}
    ]
    updated_conv = await add_message(
        session,
        conversation.conversation_id,
        "assistant",
        "The policy is...",
        sources,
    )

    assert updated_conv.message_count == 1
    assert updated_conv.messages[0]["role"] == "assistant"
    assert updated_conv.messages[0]["content"] == "The policy is..."
    assert "sources" in updated_conv.messages[0]
    assert len(updated_conv.messages[0]["sources"]) == 1


# Test: add_message - Invalid role


@pytest.mark.asyncio
async def test_add_message_invalid_role(session: AsyncSession, sample_user):
    """Test that adding message with invalid role fails."""

    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    with pytest.raises(ValueError, match="Invalid role"):
        await add_message(
            session, conversation.conversation_id, "invalid_role", "content"
        )


# Test: add_message - Conversation not found


@pytest.mark.asyncio
async def test_add_message_conversation_not_found(session: AsyncSession):
    """Test that adding message to non-existent conversation fails."""

    fake_conversation_id = str(uuid.uuid4())

    with pytest.raises(ValueError, match="not found"):
        await add_message(session, fake_conversation_id, "user", "content")


# Test: get_conversation_by_id - Success


@pytest.mark.asyncio
async def test_get_conversation_by_id_success(session: AsyncSession, sample_user):
    """Test getting conversation by ID."""

    # Create conversation
    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    # Get by ID
    retrieved = await get_conversation_by_id(
        session, conversation.conversation_id, sample_user.user_id
    )

    assert retrieved is not None
    assert retrieved.conversation_id == conversation.conversation_id


# Test: get_conversation_by_id - Not found


@pytest.mark.asyncio
async def test_get_conversation_by_id_not_found(session: AsyncSession):
    """Test getting non-existent conversation returns None."""

    fake_id = str(uuid.uuid4())
    fake_user_id = str(uuid.uuid4())

    retrieved = await get_conversation_by_id(session, fake_id, fake_user_id)

    assert retrieved is None


# Test: get_conversation_by_id - Wrong user


@pytest.mark.asyncio
async def test_get_conversation_by_id_wrong_user(session: AsyncSession, sample_user):
    """Test that getting conversation with wrong user_id returns None."""

    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    wrong_user_id = str(uuid.uuid4())
    retrieved = await get_conversation_by_id(
        session, conversation.conversation_id, wrong_user_id
    )

    assert retrieved is None


# Test: list_user_conversations - Empty list


@pytest.mark.asyncio
async def test_list_user_conversations_empty(session: AsyncSession, sample_user):
    """Test listing conversations when user has none."""

    conversations = await list_user_conversations(session, sample_user.user_id)

    assert conversations == []


# Test: list_user_conversations - Multiple conversations


@pytest.mark.asyncio
async def test_list_user_conversations_multiple(session: AsyncSession, sample_user):
    """Test listing multiple conversations."""

    # Create 3 conversations
    conv1 = await get_or_create_conversation(session, sample_user.user_id, None)
    conv2 = await get_or_create_conversation(session, sample_user.user_id, None)
    conv3 = await get_or_create_conversation(session, sample_user.user_id, None)

    # List conversations
    conversations = await list_user_conversations(session, sample_user.user_id)

    assert len(conversations) == 3
    conv_ids = [c.conversation_id for c in conversations]
    assert conv1.conversation_id in conv_ids
    assert conv2.conversation_id in conv_ids
    assert conv3.conversation_id in conv_ids


# Test: list_user_conversations - Pagination


@pytest.mark.asyncio
async def test_list_user_conversations_pagination(session: AsyncSession, sample_user):
    """Test conversation listing with pagination."""

    # Create 5 conversations
    for _ in range(5):
        await get_or_create_conversation(session, sample_user.user_id, None)

    # Get first 2
    page1 = await list_user_conversations(session, sample_user.user_id, limit=2, offset=0)
    assert len(page1) == 2

    # Get next 2
    page2 = await list_user_conversations(session, sample_user.user_id, limit=2, offset=2)
    assert len(page2) == 2

    # Ensure different conversations
    page1_ids = {c.conversation_id for c in page1}
    page2_ids = {c.conversation_id for c in page2}
    assert page1_ids.isdisjoint(page2_ids)


# Test: delete_conversation - Success


@pytest.mark.asyncio
async def test_delete_conversation_success(session: AsyncSession, sample_user):
    """Test deleting a conversation."""

    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    result = await delete_conversation(
        session, conversation.conversation_id, sample_user.user_id
    )

    assert result is True

    # Verify deletion
    retrieved = await get_conversation_by_id(
        session, conversation.conversation_id, sample_user.user_id
    )
    assert retrieved is None


# Test: delete_conversation - Not found


@pytest.mark.asyncio
async def test_delete_conversation_not_found(session: AsyncSession):
    """Test deleting non-existent conversation returns False."""

    fake_id = str(uuid.uuid4())
    fake_user_id = str(uuid.uuid4())

    result = await delete_conversation(session, fake_id, fake_user_id)

    assert result is False


# Test: delete_conversation - Wrong user


@pytest.mark.asyncio
async def test_delete_conversation_wrong_user(session: AsyncSession, sample_user):
    """Test that deleting conversation with wrong user_id returns False."""

    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    wrong_user_id = str(uuid.uuid4())
    result = await delete_conversation(session, conversation.conversation_id, wrong_user_id)

    assert result is False

    # Conversation should still exist
    retrieved = await get_conversation_by_id(
        session, conversation.conversation_id, sample_user.user_id
    )
    assert retrieved is not None


# Test: get_last_messages - Empty conversation


@pytest.mark.asyncio
async def test_get_last_messages_empty(session: AsyncSession, sample_user):
    """Test getting messages from empty conversation."""

    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    messages = await get_last_messages(session, conversation.conversation_id, limit=5)

    assert messages == []


# Test: get_last_messages - Multiple messages


@pytest.mark.asyncio
async def test_get_last_messages_multiple(session: AsyncSession, sample_user):
    """Test getting last N messages from conversation."""

    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    # Add 5 messages
    for i in range(5):
        await add_message(session, conversation.conversation_id, "user", f"Message {i+1}")

    # Get last 3
    messages = await get_last_messages(session, conversation.conversation_id, limit=3)

    assert len(messages) == 3
    assert messages[0]["content"] == "Message 3"
    assert messages[1]["content"] == "Message 4"
    assert messages[2]["content"] == "Message 5"


# Test: get_last_messages - Limit larger than message count


@pytest.mark.asyncio
async def test_get_last_messages_limit_larger(session: AsyncSession, sample_user):
    """Test getting messages when limit exceeds message count."""

    conversation = await get_or_create_conversation(session, sample_user.user_id, None)

    # Add 2 messages
    await add_message(session, conversation.conversation_id, "user", "Message 1")
    await add_message(session, conversation.conversation_id, "assistant", "Response 1")

    # Request last 10 (but only 2 exist)
    messages = await get_last_messages(session, conversation.conversation_id, limit=10)

    assert len(messages) == 2


# Test: get_last_messages - Conversation not found


@pytest.mark.asyncio
async def test_get_last_messages_not_found(session: AsyncSession):
    """Test getting messages from non-existent conversation."""

    fake_id = str(uuid.uuid4())

    messages = await get_last_messages(session, fake_id, limit=5)

    assert messages == []


# Test: get_conversation_count - Zero


@pytest.mark.asyncio
async def test_get_conversation_count_zero(session: AsyncSession, sample_user):
    """Test getting count when user has no conversations."""

    count = await get_conversation_count(session, sample_user.user_id)

    assert count == 0


# Test: get_conversation_count - Multiple


@pytest.mark.asyncio
async def test_get_conversation_count_multiple(session: AsyncSession, sample_user):
    """Test getting conversation count with multiple conversations."""

    # Create 3 conversations
    for _ in range(3):
        await get_or_create_conversation(session, sample_user.user_id, None)

    count = await get_conversation_count(session, sample_user.user_id)

    assert count == 3
