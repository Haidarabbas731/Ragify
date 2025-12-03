"""User profile management API endpoints.

Handles user profile retrieval, updates, password changes, and statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.user import (
    ChangePasswordRequest,
    UserProfile,
    UserStatsResponse,
    UserUpdateRequest,
)
from app.services.redis_service import (
    clear_user_session_revocation,
    revoke_all_user_sessions,
)
from app.services.user_service import (
    change_user_password,
    get_user_stats,
    update_user_email,
)

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Get current user profile with storage statistics.

    Returns:
        User profile with calculated storage fields (MB, percentage)

    Requires:
        Valid access token
    """
    # Calculate storage statistics
    storage_used_mb = current_user.storage_used_bytes / 1024 / 1024
    storage_limit_mb = current_user.storage_limit_bytes / 1024 / 1024
    storage_percentage = (
        (current_user.storage_used_bytes / current_user.storage_limit_bytes * 100)
        if current_user.storage_limit_bytes > 0
        else 0.0
    )

    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status,
        "storage_used_bytes": current_user.storage_used_bytes,
        "storage_limit_bytes": current_user.storage_limit_bytes,
        "storage_used_mb": round(storage_used_mb, 2),
        "storage_limit_mb": round(storage_limit_mb, 2),
        "storage_percentage": round(storage_percentage, 2),
        "created_at": current_user.created_at,
        "last_login_at": current_user.last_login_at,
    }


@router.patch("/me", response_model=UserProfile)
async def update_current_user_profile(
    data: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Update current user profile.

    Args:
        data: User update data (currently only email)
        current_user: Authenticated user
        db: Database session

    Returns:
        Updated user profile with storage statistics

    Raises:
        HTTPException: 400 if email already in use or validation fails

    Requires:
        Valid access token
    """
    # Only update email if provided
    if data.email is not None:
        success, message, updated_user = await update_user_email(
            db, current_user.user_id, data.email
        )
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

        # Refresh current_user reference
        current_user = updated_user  # type:ignore

    # Calculate storage statistics
    storage_used_mb = current_user.storage_used_bytes / 1024 / 1024
    storage_limit_mb = current_user.storage_limit_bytes / 1024 / 1024
    storage_percentage = (
        (current_user.storage_used_bytes / current_user.storage_limit_bytes * 100)
        if current_user.storage_limit_bytes > 0
        else 0.0
    )

    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status,
        "storage_used_bytes": current_user.storage_used_bytes,
        "storage_limit_bytes": current_user.storage_limit_bytes,
        "storage_used_mb": round(storage_used_mb, 2),
        "storage_limit_mb": round(storage_limit_mb, 2),
        "storage_percentage": round(storage_percentage, 2),
        "created_at": current_user.created_at,
        "last_login_at": current_user.last_login_at,
    }


@router.post("/me/change-password", response_model=MessageResponse)
async def change_current_user_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Change current user password.

    Validates current password, checks new password strength,
    and revokes all user sessions (logout from all devices).

    Args:
        data: Password change request with current and new passwords
        current_user: Authenticated user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: 400 if current password incorrect or new password invalid

    Requires:
        Valid access token

    Note:
        This will revoke ALL user sessions. User must login again with new password.
    """
    success, message = await change_user_password(
        db, current_user.user_id, data.current_password, data.new_password
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    # Revoke all user sessions (logout from all devices)
    # User will need to login again with new password
    await revoke_all_user_sessions(current_user.user_id, ttl=604800)  # 7 days

    # Clear revocation flag to allow user to login with new password
    await clear_user_session_revocation(current_user.user_id)

    return {
        "message": "Password changed successfully. Please login again with your new password."
    }


@router.get("/me/stats", response_model=UserStatsResponse)
async def get_current_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get current user dashboard statistics.

    Returns:
        User statistics including document counts, storage usage,
        collections count, conversations count, and documents by status

    Requires:
        Valid access token
    """
    stats = await get_user_stats(db, current_user.user_id)
    return stats
