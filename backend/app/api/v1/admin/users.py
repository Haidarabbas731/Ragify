"""Admin-only user management API endpoints.

Handles user administration including listing, suspending, activating,
deleting users, and viewing system statistics.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.models.user import User
from app.schemas.admin import (
    AdminUserListParams,
    SuspendUserRequest,
    SuspendUserResponse,
    SystemStatsResponse,
    UserDetailsResponse,
    UsersListResponse,
)
from app.schemas.common import MessageResponse
from app.services.admin_service import (
    activate_user,
    delete_user,
    get_system_stats,
    get_user_details,
    list_all_users,
    suspend_user,
)
from app.utils.validators import validate_uuid

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=UsersListResponse)
async def list_users(
    params: AdminUserListParams = Depends(),
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    List all users with pagination and filters (admin only).

    Args:
        params: Query parameters (page, limit, status_filter, role, sort_by, order)
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        Paginated list of users
    """

    users, total = await list_all_users(
        session=db,
        page=params.page,
        limit=params.limit,
        status=params.status_filter,
        role=params.role,
        sort_by=params.sort_by,
        order=params.order,
    )

    return {
        "users": [user.model_dump() for user in users],
        "total": total,
        "page": params.page,
        "limit": params.limit,
        "pages": (total + params.limit - 1) // params.limit,
    }


@router.get("/users/{user_id}", response_model=UserDetailsResponse)
async def get_user(
    user_id: str,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get detailed user information (admin only).

    Includes document count, conversation count, and collection count.

    Args:
        user_id: User ID to retrieve
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        User details with statistics

    Raises:
        HTTPException: 404 if user not found
    """
    validate_uuid(user_id, "user_id")
    user_details = await get_user_details(db, user_id)

    if not user_details:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return user_details


@router.post("/users/{user_id}/suspend", response_model=SuspendUserResponse)
async def suspend_user_endpoint(
    user_id: str,
    suspend_data: SuspendUserRequest,
    request: Request,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Suspend a user account and revoke all sessions (admin only).

    Args:
        user_id: User ID to suspend
        suspend_data: Suspension request data (includes reason)
        request: HTTP request (for IP address logging)
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: 404 if user not found
        HTTPException: 400 if trying to suspend self
    """
    validate_uuid(user_id, "user_id")
    if user_id == admin_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot suspend your own account",
        )

    ip_address = request.client.host if request.client else None

    success = await suspend_user(
        session=db,
        user_id=user_id,
        reason=suspend_data.reason,
        admin_user_id=admin_user.user_id,
        ip_address=ip_address,
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": f"User {user_id} suspended successfully", "reason": suspend_data.reason}


@router.post("/users/{user_id}/activate", response_model=MessageResponse)
async def activate_user_endpoint(
    user_id: str,
    request: Request,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Activate a suspended user account (admin only).

    Args:
        user_id: User ID to activate
        request: HTTP request (for IP address logging)
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: 404 if user not found
    """
    validate_uuid(user_id, "user_id")
    ip_address = request.client.host if request.client else None

    success = await activate_user(
        session=db,
        user_id=user_id,
        admin_user_id=admin_user.user_id,
        ip_address=ip_address,
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": f"User {user_id} activated successfully"}


@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user_endpoint(
    user_id: str,
    request: Request,
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Soft delete a user account (admin only).

    Note: This does NOT delete associated data (documents, conversations).
    A background job should be enqueued to clean up user data.

    Args:
        user_id: User ID to delete
        request: HTTP request (for IP address logging)
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        Success message

    Raises:
        HTTPException: 404 if user not found
        HTTPException: 400 if trying to delete self
    """
    validate_uuid(user_id, "user_id")
    if user_id == admin_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    ip_address = request.client.host if request.client else None

    success = await delete_user(
        session=db,
        user_id=user_id,
        admin_user_id=admin_user.user_id,
        ip_address=ip_address,
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {"message": f"User {user_id} deleted successfully"}


@router.get("/stats", response_model=SystemStatsResponse)
async def get_stats(
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get system-wide statistics (admin only).

    Returns:
        Dictionary containing system statistics including:
        - Total users
        - Active users (last 30 days)
        - Total documents
        - Total storage used
        - Total conversations
        - Active invite codes
        - Failed documents
        - Timestamp
    """
    stats = await get_system_stats(db)
    return stats
