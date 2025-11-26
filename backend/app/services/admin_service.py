"""
Admin service for user management, system stats, and audit logging.
"""

import logging
from datetime import datetime, timedelta
from typing import Any

from sqlmodel import func, select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.models.admin_audit_log import AdminAuditLog
from app.models.collection import Collection
from app.models.conversation import Conversation
from app.models.document import Document
from app.models.invite_code import InviteCode
from app.models.user import User
from app.services.redis_service import revoke_all_user_sessions

logger = logging.getLogger(__name__)


async def list_all_users(
    session: AsyncSession,
    page: int = 1,
    limit: int = 50,
    status: str | None = None,
    role: str | None = None,
    sort_by: str = "created_at",
    order: str = "desc",
) -> tuple[list[User], int]:
    """
    List all users with filters and pagination.

    Args:
        session: Database session
        page: Page number (1-indexed)
        limit: Items per page
        status: Filter by status (active, suspended, pending)
        role: Filter by role (user, admin)
        sort_by: Sort field (created_at, email, storage_used_bytes, last_login_at)
        order: Sort order (asc, desc)

    Returns:
        Tuple of (users list, total count)
    """
    # Build query
    query = select(User).where(User.is_active == True)  # noqa: E712

    if status:
        query = query.where(User.status == status)
    if role:
        query = query.where(User.role == role)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await session.exec(count_query)
    total = count_result.one()

    # Sort
    sort_column = getattr(User, sort_by, User.created_at)
    if order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await session.exec(query)
    users = result.all()

    return list(users), total


async def get_user_details(session: AsyncSession, user_id: str) -> dict[str, Any] | None:
    """
    Get detailed user information including document and conversation counts.

    Args:
        session: Database session
        user_id: User ID

    Returns:
        User details dict or None if not found
    """
    # Get user
    result = await session.exec(select(User).where(User.user_id == user_id))
    user = result.one_or_none()

    if not user:
        return None

    # Count documents
    doc_count_result = await session.exec(
        select(func.count()).where(Document.user_id == user_id, Document.status != "DELETED")
    )
    document_count = doc_count_result.one()

    # Count conversations
    conv_count_result = await session.exec(
        select(func.count()).where(Conversation.user_id == user_id)
    )
    conversation_count = conv_count_result.one()

    # Count collections
    coll_count_result = await session.exec(
        select(func.count()).where(Collection.user_id == user_id)
    )
    collection_count = coll_count_result.one()

    return {
        "user_id": user.user_id,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "storage_used_bytes": user.storage_used_bytes,
        "storage_limit_bytes": user.storage_limit_bytes,
        "last_login_at": user.last_login_at,
        "created_at": user.created_at,
        "updated_at": user.updated_at,
        "invited_by_code": user.invited_by_code,
        "invited_at": user.invited_at,
        "document_count": document_count,
        "conversation_count": conversation_count,
        "collection_count": collection_count,
    }


async def suspend_user(
    session: AsyncSession, user_id: str, reason: str, admin_user_id: str, ip_address: str | None = None
) -> bool:
    """
    Suspend a user account and revoke all sessions.

    Args:
        session: Database session
        user_id: User ID to suspend
        reason: Reason for suspension
        admin_user_id: Admin user performing the action
        ip_address: IP address of admin

    Returns:
        True if successful, False if user not found
    """
    result = await session.exec(select(User).where(User.user_id == user_id))
    user = result.one_or_none()

    if not user:
        return False

    # Update user status
    old_status = user.status
    user.status = "suspended"
    user.updated_at = datetime.utcnow()
    session.add(user)

    # Revoke all user sessions
    refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    await revoke_all_user_sessions(user_id, refresh_ttl)

    # Log audit event
    await log_admin_action(
        session=session,
        admin_user_id=admin_user_id,
        action="SUSPEND_USER",
        target_type="user",
        target_id=user_id,
        details={"reason": reason, "old_status": old_status, "new_status": "suspended"},
        ip_address=ip_address,
    )

    await session.commit()
    logger.info(f"User {user_id} suspended by admin {admin_user_id}. Reason: {reason}")
    return True


async def activate_user(
    session: AsyncSession, user_id: str, admin_user_id: str, ip_address: str | None = None
) -> bool:
    """
    Activate a suspended user account.

    Args:
        session: Database session
        user_id: User ID to activate
        admin_user_id: Admin user performing the action
        ip_address: IP address of admin

    Returns:
        True if successful, False if user not found
    """
    result = await session.exec(select(User).where(User.user_id == user_id))
    user = result.one_or_none()

    if not user:
        return False

    # Update user status
    old_status = user.status
    user.status = "active"
    user.updated_at = datetime.utcnow()
    session.add(user)

    # Log audit event
    await log_admin_action(
        session=session,
        admin_user_id=admin_user_id,
        action="ACTIVATE_USER",
        target_type="user",
        target_id=user_id,
        details={"old_status": old_status, "new_status": "active"},
        ip_address=ip_address,
    )

    await session.commit()
    logger.info(f"User {user_id} activated by admin {admin_user_id}")
    return True


async def delete_user(
    session: AsyncSession, user_id: str, admin_user_id: str, ip_address: str | None = None
) -> bool:
    """
    Soft delete a user account.

    Note: This does NOT delete associated data (documents, conversations, etc.).
    A background job should be enqueued to clean up user data.

    Args:
        session: Database session
        user_id: User ID to delete
        admin_user_id: Admin user performing the action
        ip_address: IP address of admin

    Returns:
        True if successful, False if user not found
    """
    result = await session.exec(select(User).where(User.user_id == user_id))
    user = result.one_or_none()

    if not user:
        return False

    # Soft delete user
    user.is_active = False
    user.status = "suspended"
    user.updated_at = datetime.utcnow()
    session.add(user)

    # Revoke all user sessions
    refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    await revoke_all_user_sessions(user_id, refresh_ttl)

    # Log audit event
    await log_admin_action(
        session=session,
        admin_user_id=admin_user_id,
        action="DELETE_USER",
        target_type="user",
        target_id=user_id,
        details={"user_email": user.email},
        ip_address=ip_address,
    )

    await session.commit()
    logger.warning(f"User {user_id} ({user.email}) deleted by admin {admin_user_id}")
    return True


async def get_system_stats(session: AsyncSession) -> dict[str, Any]:
    """
    Get system-wide statistics.

    Args:
        session: Database session

    Returns:
        Dictionary containing system statistics
    """
    # Total users
    total_users_result = await session.exec(
        select(func.count()).where(User.is_active == True)  # noqa: E712
    )
    total_users = total_users_result.one()

    # Active users (logged in last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    active_users_result = await session.exec(
        select(func.count()).where(
            User.is_active == True,  # noqa: E712
            User.last_login_at >= thirty_days_ago,
        )
    )
    active_users = active_users_result.one()

    # Total documents
    total_docs_result = await session.exec(
        select(func.count()).where(Document.status != "DELETED")
    )
    total_documents = total_docs_result.one()

    # Total storage used
    storage_result = await session.exec(
        select(func.sum(User.storage_used_bytes)).where(User.is_active == True)  # noqa: E712
    )
    total_storage = storage_result.one() or 0

    # Total conversations
    total_convs_result = await session.exec(select(func.count(Conversation.conversation_id)))
    total_conversations = total_convs_result.one()

    # Active invite codes
    active_invites_result = await session.exec(
        select(func.count()).where(InviteCode.status == "active")
    )
    active_invite_codes = active_invites_result.one()

    # Failed documents
    failed_docs_result = await session.exec(
        select(func.count()).where(Document.status == "ERROR")
    )
    failed_documents = failed_docs_result.one()

    return {
        "total_users": total_users,
        "active_users_30d": active_users,
        "total_documents": total_documents,
        "total_storage_bytes": total_storage,
        "total_conversations": total_conversations,
        "active_invite_codes": active_invite_codes,
        "failed_documents": failed_documents,
        "timestamp": datetime.utcnow().isoformat(),
    }


async def log_admin_action(
    session: AsyncSession,
    admin_user_id: str,
    action: str,
    target_type: str,
    target_id: str,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> AdminAuditLog:
    """
    Log an admin action to the audit log.

    Args:
        session: Database session
        admin_user_id: Admin user performing the action
        action: Action type (SUSPEND_USER, ACTIVATE_USER, DELETE_USER, etc.)
        target_type: Type of target (user, document, invite_code)
        target_id: ID of target
        details: Additional details as JSON
        ip_address: IP address of admin

    Returns:
        Created audit log entry
    """
    audit_log = AdminAuditLog(
        admin_user_id=admin_user_id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or {},
        ip_address=ip_address,
        timestamp=datetime.utcnow(),
    )

    session.add(audit_log)
    await session.flush()

    logger.info(
        f"Audit log: Admin {admin_user_id} performed {action} on {target_type} {target_id}"
    )

    return audit_log


async def list_audit_logs(
    session: AsyncSession,
    page: int = 1,
    limit: int = 50,
    admin_user_id: str | None = None,
    action: str | None = None,
    target_type: str | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
) -> tuple[list[AdminAuditLog], int]:
    """
    List audit logs with filters and pagination.

    Args:
        session: Database session
        page: Page number (1-indexed)
        limit: Items per page
        admin_user_id: Filter by admin user
        action: Filter by action type
        target_type: Filter by target type
        start_date: Filter by start date
        end_date: Filter by end date

    Returns:
        Tuple of (audit logs list, total count)
    """
    # Build query
    query = select(AdminAuditLog)

    if admin_user_id:
        query = query.where(AdminAuditLog.admin_user_id == admin_user_id)
    if action:
        query = query.where(AdminAuditLog.action == action)
    if target_type:
        query = query.where(AdminAuditLog.target_type == target_type)
    if start_date:
        query = query.where(AdminAuditLog.timestamp >= start_date)
    if end_date:
        query = query.where(AdminAuditLog.timestamp <= end_date)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await session.exec(count_query)
    total = count_result.one()

    # Sort by timestamp descending (most recent first)
    query = query.order_by(AdminAuditLog.timestamp.desc())

    # Paginate
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await session.exec(query)
    logs = result.all()

    return list(logs), total
