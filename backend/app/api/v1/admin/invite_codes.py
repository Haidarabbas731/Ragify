from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import get_current_admin, get_db
from app.models.user import User
from app.schemas.admin import InviteCodeCreate, InviteCodeResponse
from app.services.invite_service import (
    generate_invite_code,
    list_invite_codes,
    revoke_invite_code,
)

router = APIRouter(prefix="/invite-codes", tags=["admin", "invite-codes"])


@router.post("", response_model=InviteCodeResponse, status_code=status.HTTP_201_CREATED)
async def create_invite_code(
    data: InviteCodeCreate,
    session: AsyncSession = Depends(get_db),  # noqa: B008
    current_admin: User = Depends(get_current_admin),  # noqa: B008
):
    """
    Create a new invite code (Admin only).

    - **max_uses**: Maximum number of uses (1-1000)
    - **expires_at**: Optional expiration datetime
    - **description**: Optional description
    """
    invite = await generate_invite_code(
        session=session,
        created_by=current_admin.user_id,
        max_uses=data.max_uses,
        expires_at=data.expires_at,
        description=data.description,
    )

    return InviteCodeResponse.model_validate(invite)


@router.get("", response_model=list[InviteCodeResponse])
async def get_invite_codes(
    status_filter: str | None = None,
    limit: int = 50,
    offset: int = 0,
    session: AsyncSession = Depends(get_db),  # noqa: B008
    current_admin: User = Depends(get_current_admin),  # noqa: B008
):
    """
    List all invite codes (Admin only).

    - **status**: Optional filter by status (active, expired, revoked)
    - **limit**: Maximum number of results (default: 50)
    - **offset**: Pagination offset (default: 0)
    """
    codes = await list_invite_codes(
        session=session, status=status_filter, limit=limit, offset=offset
    )

    return [InviteCodeResponse.model_validate(code) for code in codes]


@router.delete("/{code}", status_code=status.HTTP_200_OK)
async def revoke_code(
    code: str,
    session: AsyncSession = Depends(get_db),  # noqa: B008
    current_admin: User = Depends(get_current_admin),  # noqa: B008
):
    """
    Revoke an invite code (Admin only).

    - **code**: Invite code to revoke (format: KB-XXXX-XXXX-XXXX)
    """
    try:
        await revoke_invite_code(session=session, code=code)
        return {"message": f"Invite code {code} revoked successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=str(e)
        ) from e
