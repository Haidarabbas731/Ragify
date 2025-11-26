"""Admin-only audit log API endpoints.

Handles viewing and filtering administrative action logs.
"""


from fastapi import APIRouter, Depends
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.models.user import User
from app.schemas.admin import AuditLogListParams, AuditLogsListResponse
from app.services.admin_service import list_audit_logs
from app.utils.validators import validate_uuid

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/audit-logs", response_model=AuditLogsListResponse)
async def get_audit_logs(
    params: AuditLogListParams = Depends(),
    admin_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    List audit logs with filters (admin only).

    Audit logs track all administrative actions performed in the system.

    Args:
        page: Page number (1-indexed)
        limit: Items per page (max 100)
        admin_user_id: Filter by admin user who performed action
        action: Filter by action type (SUSPEND_USER, ACTIVATE_USER, DELETE_USER, etc.)
        target_type: Filter by target type (user, document, invite_code)
        start_date: Filter by start date (ISO format)
        end_date: Filter by end date (ISO format)
        admin_user: Authenticated admin user
        db: Database session

    Returns:
        Paginated list of audit logs

    Raises:
        HTTPException: 400 if invalid parameters

    Example Actions:
        - SUSPEND_USER: User suspension
        - ACTIVATE_USER: User activation
        - DELETE_USER: User deletion
        - CREATE_INVITE_CODE: Invite code creation
        - REVOKE_INVITE_CODE: Invite code revocation

    Example Target Types:
        - user: User account actions
        - document: Document-related actions
        - invite_code: Invite code actions
    """
    # Validate admin_user_id if provided
    if params.admin_user_id:
        validate_uuid(params.admin_user_id, "admin_user_id")

    logs, total = await list_audit_logs(
        session=db,
        page=params.page,
        limit=params.limit,
        admin_user_id=params.admin_user_id,
        action=params.action,
        target_type=params.target_type,
        start_date=params.start_date,
        end_date=params.end_date,
    )

    return {
        "logs": [log.model_dump() for log in logs],
        "total": total,
        "page": params.page,
        "limit": params.limit,
        "pages": (total + params.limit - 1) // params.limit,
    }
