import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.collection import Collection
from app.models.document import Document, DocumentStatus
from app.models.invite_code import InviteCode, InviteCodeStatus
from app.models.user import User, UserStatus


@pytest.mark.asyncio
async def test_user_model_creation(session: AsyncSession) -> None:
    user = User(
        email="newuser@example.com",
        password_hash="hashed_pass",
        role="user",
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    assert user.user_id is not None
    assert user.email == "newuser@example.com"
    assert user.status == UserStatus.ACTIVE
    assert user.storage_used_bytes == 0


@pytest.mark.asyncio
async def test_document_status_transitions(session: AsyncSession, sample_user: User) -> None:
    document = Document(
        user_id=sample_user.user_id,
        filename="test.pdf",
        file_type="application/pdf",
        size_bytes=1024,
        storage_key="b2://bucket/key",
        status=DocumentStatus.PROCESSING,
    )
    session.add(document)
    await session.commit()
    await session.refresh(document)

    assert document.status == DocumentStatus.PROCESSING

    document.status = DocumentStatus.ACTIVE
    await session.commit()
    await session.refresh(document)

    assert document.status == DocumentStatus.ACTIVE


@pytest.mark.asyncio
async def test_collection_relationships(session: AsyncSession, sample_user: User) -> None:
    collection = Collection(
        user_id=sample_user.user_id,
        name="Test Collection",
        description="Test description",
    )
    session.add(collection)
    await session.commit()
    await session.refresh(collection)

    assert collection.collection_id is not None
    assert collection.user_id == sample_user.user_id
    assert collection.name == "Test Collection"


@pytest.mark.asyncio
async def test_invite_code_validation_logic(session: AsyncSession) -> None:
    invite = InviteCode(
        code="KB-TEST-1234-ABCD",
        max_uses=5,
        current_uses=0,
        status=InviteCodeStatus.ACTIVE,
    )
    session.add(invite)
    await session.commit()
    await session.refresh(invite)

    assert invite.status == InviteCodeStatus.ACTIVE
    assert invite.current_uses < invite.max_uses

    invite.current_uses = 5
    await session.commit()
    await session.refresh(invite)

    assert invite.current_uses == invite.max_uses
