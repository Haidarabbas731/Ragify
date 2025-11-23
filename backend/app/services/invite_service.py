import secrets
from datetime import UTC, datetime

from sqlmodel import col, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.invite_code import InviteCode


def generate_invite_code_string() -> str:
    """
    Generate a new invite code in format KB-XXXX-XXXX-XXXX.

    Returns:
        Generated invite code string
    """
    part1 = "".join(secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for _ in range(4))
    part2 = "".join(secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for _ in range(4))
    part3 = "".join(secrets.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789") for _ in range(4))
    return f"KB-{part1}-{part2}-{part3}"


async def generate_invite_code(
    session: AsyncSession,
    created_by: str | None = None,
    max_uses: int = 1,
    expires_at: datetime | None = None,
    description: str | None = None,
) -> InviteCode:
    """
    Generate a new invite code.

    Args:
        session: Database session
        created_by: Admin user ID who created the code
        max_uses: Maximum number of uses
        expires_at: Optional expiration datetime
        description: Optional description

    Returns:
        Created invite code instance
    """
    code_string = generate_invite_code_string()

    while await get_invite_code_by_string(session, code_string):
        code_string = generate_invite_code_string()

    invite_code = InviteCode(
        code=code_string,
        created_by=created_by,
        max_uses=max_uses,
        expires_at=expires_at,
        description=description,
    )
    session.add(invite_code)
    await session.commit()
    await session.refresh(invite_code)
    return invite_code


async def get_invite_code_by_string(session: AsyncSession, code: str) -> InviteCode | None:
    """
    Get invite code by code string.

    Args:
        session: Database session
        code: Invite code string

    Returns:
        InviteCode instance or None if not found
    """
    result = await session.exec(select(InviteCode).where(InviteCode.code == code))
    return result.one_or_none()


async def validate_invite_code_for_registration(
    session: AsyncSession, code: str | None
) -> tuple[bool, str | None]:
    """
    Validate invite code for registration based on INVITE_ONLY setting.

    Args:
        session: Database session
        code: Invite code string (can be None)

    Returns:
        Tuple of (is_valid, error_message)
        - (True, None) if valid or not required
        - (False, error_message) if invalid
    """
    if settings.INVITE_ONLY:
        if not code:
            return False, "Invite code is required when INVITE_ONLY mode is enabled"

        is_valid = await validate_invite_code(session, code)
        if not is_valid:
            return False, "Invalid or expired invite code"

    return True, None


async def validate_invite_code(session: AsyncSession, code: str) -> bool:
    """
    Validate if an invite code is active and can be used.

    Args:
        session: Database session
        code: Invite code string

    Returns:
        True if valid and usable, False otherwise
    """
    invite = await get_invite_code_by_string(session, code)
    if not invite:
        return False

    if invite.status != "active":
        return False

    if invite.current_uses >= invite.max_uses:
        return False

    if invite.expires_at and datetime.now(UTC) > invite.expires_at:
        invite.status = "expired"
        session.add(invite)
        await session.commit()
        return False

    return True


async def use_invite_code(session: AsyncSession, code: str) -> InviteCode:
    """
    Increment the usage count of an invite code.

    Args:
        session: Database session
        code: Invite code string

    Returns:
        Updated invite code instance

    Raises:
        ValueError: If code is invalid or cannot be used
    """
    if not await validate_invite_code(session, code):
        raise ValueError(f"Invalid or expired invite code: {code}")

    invite = await get_invite_code_by_string(session, code)
    if not invite:
        raise ValueError(f"Invite code not found: {code}")

    invite.current_uses += 1

    if invite.current_uses >= invite.max_uses:
        invite.status = "expired"

    session.add(invite)
    await session.commit()
    await session.refresh(invite)
    return invite


async def revoke_invite_code(session: AsyncSession, code: str) -> InviteCode:
    """
    Revoke an invite code.

    Args:
        session: Database session
        code: Invite code string

    Returns:
        Updated invite code instance

    Raises:
        ValueError: If code not found
    """
    invite = await get_invite_code_by_string(session, code)
    if not invite:
        raise ValueError(f"Invite code not found: {code}")

    invite.status = "revoked"
    session.add(invite)
    await session.commit()
    await session.refresh(invite)
    return invite


async def list_invite_codes(
    session: AsyncSession, status: str | None = None, limit: int = 50, offset: int = 0
) -> list[InviteCode]:
    """
    List invite codes with optional filters.

    Args:
        session: Database session
        status: Optional filter by status
        limit: Maximum number of results
        offset: Pagination offset

    Returns:
        List of invite codes
    """
    query = select(InviteCode)

    if status:
        query = query.where(InviteCode.status == status)

    query = query.order_by(col(InviteCode.created_at).desc()).limit(limit).offset(offset)

    result = await session.exec(query)
    return list(result.all())
