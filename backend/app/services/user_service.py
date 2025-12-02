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


async def update_user_storage(
    session: AsyncSession, user_id: str, delta_bytes: int
) -> User:
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
        raise ValueError(
            f"Storage limit exceeded: {new_usage} > {user.storage_limit_bytes}"
        )

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


async def update_user_password(
    session: AsyncSession, user_id: str, password_hash: str
) -> User:
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


async def update_user_email(
    session: AsyncSession, user_id: str, new_email: str
) -> tuple[bool, str, User | None]:
    """
    Update user email with duplicate check.

    Args:
        session: Database session
        user_id: User ID
        new_email: New email address

    Returns:
        Tuple of (success, message, user)
    """
    user = await get_user_by_id(session, user_id)
    if not user:
        return False, "User not found", None

    # Check if new email is same as current
    if user.email == new_email:
        return False, "New email is the same as current email", None

    # Check if email already exists
    existing_user = await get_user_by_email(session, new_email)
    if existing_user:
        return False, "Email already in use by another account", None

    user.email = new_email
    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()
    await session.refresh(user)
    return True, "Email updated successfully", user


async def change_user_password(
    session: AsyncSession, user_id: str, current_password: str, new_password: str
) -> tuple[bool, str]:
    """
    Change user password with current password verification.

    Args:
        session: Database session
        user_id: User ID
        current_password: Current password (plain text)
        new_password: New password (plain text)

    Returns:
        Tuple of (success, message)
    """
    from app.core.security import (
        hash_password,
        validate_password_strength,
        verify_password,
    )

    user = await get_user_by_id(session, user_id)
    if not user:
        return False, "User not found"

    # Verify current password
    if not verify_password(current_password, user.password_hash):
        return False, "Current password is incorrect"

    # Check if new password is same as current
    if verify_password(new_password, user.password_hash):
        return False, "New password cannot be the same as current password"

    # Validate new password strength
    is_valid, error_msg = validate_password_strength(new_password)
    if not is_valid:
        return False, error_msg or "Password does not meet security requirements"

    # Update password
    user.password_hash = hash_password(new_password)
    user.updated_at = datetime.now(UTC)
    session.add(user)
    await session.commit()

    return True, "Password changed successfully"


async def get_user_stats(session: AsyncSession, user_id: str) -> dict:
    """
    Get user dashboard statistics.

    Args:
        session: Database session
        user_id: User ID

    Returns:
        Dictionary with user statistics
    """
    from sqlmodel import func

    from app.models.collection import Collection
    from app.models.conversation import Conversation
    from app.models.document import Document

    # Get user for storage info
    user = await get_user_by_id(session, user_id)
    if not user:
        return {
            "total_documents": 0,
            "total_chunks": 0,
            "storage_used_mb": 0.0,
            "storage_limit_mb": 0.0,
            "storage_percentage": 0.0,
            "collections_count": 0,
            "conversations_count": 0,
            "documents_by_status": {},
        }

    # Count documents (exclude DELETED)
    doc_count_result = await session.exec(
        select(func.count()).where(
            Document.user_id == user_id, Document.status != "DELETED"
        )
    )
    total_documents = doc_count_result.one()

    # Sum total chunks
    chunks_result = await session.exec(
        select(func.sum(Document.chunks_count)).where(
            Document.user_id == user_id, Document.status != "DELETED"
        )
    )
    total_chunks = chunks_result.one() or 0

    # Count collections
    coll_count_result = await session.exec(
        select(func.count()).where(Collection.user_id == user_id)
    )
    collections_count = coll_count_result.one()

    # Count conversations
    conv_count_result = await session.exec(
        select(func.count()).where(Conversation.user_id == user_id)
    )
    conversations_count = conv_count_result.one()

    # Calculate storage stats
    storage_used_mb = user.storage_used_bytes / 1024 / 1024
    storage_limit_mb = user.storage_limit_bytes / 1024 / 1024
    storage_percentage = (
        (user.storage_used_bytes / user.storage_limit_bytes * 100)
        if user.storage_limit_bytes > 0
        else 0.0
    )

    # Group documents by status
    status_result = await session.exec(
        select(Document.status, func.count())
        .where(Document.user_id == user_id, Document.status != "DELETED")
        .group_by(Document.status)
    )
    documents_by_status = dict(status_result.all())

    return {
        "total_documents": total_documents,
        "total_chunks": total_chunks,
        "storage_used_mb": round(storage_used_mb, 2),
        "storage_limit_mb": round(storage_limit_mb, 2),
        "storage_percentage": round(storage_percentage, 2),
        "collections_count": collections_count,
        "conversations_count": conversations_count,
        "documents_by_status": documents_by_status,
    }
