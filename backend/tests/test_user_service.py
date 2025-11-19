import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.services.user_service import (
    create_user,
    get_user_by_email,
    soft_delete_user,
    update_user_storage,
)


@pytest.mark.asyncio
async def test_create_user_with_valid_data(session: AsyncSession) -> None:
    user = await create_user(
        session=session,
        email="create@example.com",
        password_hash="hashed",
        invite_code="KB-TEST-0001-ABCD",
    )

    assert user.user_id is not None
    assert user.email == "create@example.com"
    assert user.is_active is True


@pytest.mark.asyncio
async def test_get_user_by_email(session: AsyncSession, sample_user) -> None:
    user = await get_user_by_email(session=session, email=sample_user.email)

    assert user is not None
    assert user.email == sample_user.email


@pytest.mark.asyncio
async def test_storage_quota_updates(session: AsyncSession, sample_user) -> None:
    initial_storage = sample_user.storage_used_bytes

    await update_user_storage(
        session=session,
        user_id=sample_user.user_id,
        delta_bytes=1024,
    )

    updated_user = await get_user_by_email(session=session, email=sample_user.email)
    assert updated_user.storage_used_bytes == initial_storage + 1024


@pytest.mark.asyncio
async def test_soft_delete_user(session: AsyncSession, sample_user) -> None:
    await soft_delete_user(session=session, user_id=sample_user.user_id)

    user = await get_user_by_email(session=session, email=sample_user.email)
    assert user.is_active is False
