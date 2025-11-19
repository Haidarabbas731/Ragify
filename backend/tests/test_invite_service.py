from datetime import UTC, datetime, timedelta

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.services.invite_service import (
    generate_invite_code,
    revoke_invite_code,
    use_invite_code,
    validate_invite_code,
)


@pytest.mark.asyncio
async def test_invite_code_generation(session: AsyncSession, sample_user) -> None:
    invite = await generate_invite_code(
        session=session,
        created_by=sample_user.user_id,
        max_uses=10,
        expires_at=datetime.now(UTC) + timedelta(days=7),
        description="Test invite",
    )

    assert invite.invite_code_id is not None
    assert invite.code.startswith("KB-")
    assert invite.max_uses == 10
    assert invite.current_uses == 0


@pytest.mark.asyncio
async def test_invite_code_validation(session: AsyncSession, sample_user) -> None:
    invite = await generate_invite_code(
        session=session,
        created_by=sample_user.user_id,
        max_uses=1,
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )

    is_valid = await validate_invite_code(session=session, code=invite.code)
    assert is_valid is True


@pytest.mark.asyncio
async def test_invite_code_usage_increment(session: AsyncSession, sample_user) -> None:
    invite = await generate_invite_code(
        session=session,
        created_by=sample_user.user_id,
        max_uses=5,
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )

    initial_uses = invite.current_uses

    await use_invite_code(session=session, code=invite.code)

    await session.refresh(invite)
    assert invite.current_uses == initial_uses + 1


@pytest.mark.asyncio
async def test_revoke_invite_code(session: AsyncSession, sample_user) -> None:
    invite = await generate_invite_code(
        session=session,
        created_by=sample_user.user_id,
        max_uses=5,
        expires_at=datetime.now(UTC) + timedelta(days=1),
    )

    await revoke_invite_code(session=session, code=invite.code)

    is_valid = await validate_invite_code(session=session, code=invite.code)
    assert is_valid is False
