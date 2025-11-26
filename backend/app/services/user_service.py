from datetime import UTC, datetime

from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.user import User


async def create_user(
    session: AsyncSession,
    email: str,
    password_hash: str,
    invite_code: str | None = None,
) -> User:
    """
    Create a new user with the provided credentials.

    Args:
        session: Database session
        email: User email address
        password_hash: Argon2 hashed password
        invite_code: Valid invite code (required only if INVITE_ONLY=true)

    Returns:
        Created user instance

    Raises:
        ValueError: If email already exists
    """
    existing = await get_user_by_email(session, email)
    if existing:
        raise ValueError(f"User with email {email} already exists")

    user = User(
        email=email,
        password_hash=password_hash,
        invited_by_code=invite_code,
        storage_limit_bytes=settings.STORAGE_QUOTA_DEFAULT,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def get_user_by_id(session: AsyncSession, user_id: str) -> User | None:
    """
    Get user by ID.

    Args:
        session: Database session
        user_id: User ID

    Returns:
        User instance or None if not found
    """
    result = await session.exec(select(User).where(User.user_id == user_id))
    return result.one_or_none()


async def get_user_by_email(session: AsyncSession, email: str) -> User | None:
    """
    Get user by email address.

    Args:
        session: Database session
        email: User email address

    Returns:
        User instance or None if not found
    """
    result = await session.exec(select(User).where(User.email == email))
    return result.one_or_none()


async def check_user_storage_quota(
    session: AsyncSession, user_id: str, file_size_bytes: int
) -> bool:
    """
    Check if user has enough storage quota for file.

    Args:
        session: Database session
        user_id: User ID
        file_size_bytes: Size of file to upload

    Returns:
        bool: True if user has enough quota, False otherwise
    """
    user = await get_user_by_id(session, user_id)
    if not user:
        return False

    new_usage = user.storage_used_bytes + file_size_bytes
    return new_usage <= user.storage_limit_bytes


async def update_user_storage(session: AsyncSession, user_id: str, delta_bytes: int) -> User:
    """
    Update user storage usage by delta.

    Args:
        session: Database session
        user_id: User ID
        delta_bytes: Bytes to add (positive) or remove (negative)

    Returns:
        Updated user instance

    Raises:
        ValueError: If user not found or storage limit exceeded
    """
    user = await get_user_by_id(session, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")

    new_usage = user.storage_used_bytes + delta_bytes
    if new_usage > user.storage_limit_bytes:
        raise ValueError(f"Storage limit exceeded: {new_usage} > {user.storage_limit_bytes}")

    user.storage_used_bytes = new_usage
    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def update_user_last_login(session: AsyncSession, user_id: str) -> User:
    """
    Update user last login timestamp.

    Args:
        session: Database session
        user_id: User ID

    Returns:
        Updated user instance

    Raises:
        ValueError: If user not found
    """
    user = await get_user_by_id(session, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")

    user.last_login_at = datetime.now(UTC)
    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def soft_delete_user(session: AsyncSession, user_id: str) -> User:
    """
    Soft delete a user by setting is_active to False.

    Args:
        session: Database session
        user_id: User ID

    Returns:
        Updated user instance

    Raises:
        ValueError: If user not found
    """
    user = await get_user_by_id(session, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")

    user.is_active = False
    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user


async def update_user_password(session: AsyncSession, user_id: str, password_hash: str) -> User:
    """
    Update user password.

    Args:
        session: Database session
        user_id: User ID
        password_hash: New hashed password

    Returns:
        Updated user instance

    Raises:
        ValueError: If user not found
    """
    user = await get_user_by_id(session, user_id)
    if not user:
        raise ValueError(f"User {user_id} not found")

    user.password_hash = password_hash
    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return user
