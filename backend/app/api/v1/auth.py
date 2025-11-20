import time

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import (
    AccessTokenBearer,
    RefreshTokenBearer,
    get_db,
)
from app.core.config import settings
from app.core.security import decode_token
from app.schemas.user import LogoutRequest, TokenResponse, UserLogin, UserRegister, UserResponse
from app.services.auth_service import (
    authenticate_user,
    refresh_access_token_from_details,
    register_user,
)
from app.services.redis_service import (
    add_jti_to_blocklist,
    get_refresh_jti_from_access_jti,
    revoke_all_user_sessions,
)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
async def register(
    data: UserRegister, session: AsyncSession = Depends(get_db)  # noqa: B008
):
    """
    Register a new user.

    - **email**: Valid email address
    - **password**: Min 8 chars, 1 uppercase, 1 number, 1 special char
    - **invite_code**: Required if INVITE_ONLY=true (format: KB-XXXX-XXXX-XXXX)
    """
    success, message, user_data = await register_user(
        session, data.email, data.password, data.invite_code
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    return UserResponse(**user_data)  # type: ignore


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, session: AsyncSession = Depends(get_db)):  # noqa: B008
    """
    Authenticate user and return JWT tokens.

    - **email**: User email address
    - **password**: User password

    Returns access token (1 hour) and refresh token (7 days).
    """
    success, message, auth_data = await authenticate_user(
        session, data.email, data.password
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)

    return TokenResponse(
        access_token=auth_data["access_token"],  # type: ignore
        refresh_token=auth_data["refresh_token"],  # type: ignore
        token_type=auth_data["token_type"],  # type: ignore
        expires_in=auth_data["expires_in"],  # type: ignore
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_details: dict = Depends(RefreshTokenBearer()),  # noqa: B008
):
    """
    Refresh access token using refresh token.

    - Requires refresh token in Authorization header
    - Returns new access token and refresh token
    - Old refresh token is automatically revoked
    """
    success, message, tokens_data = await refresh_access_token_from_details(
        token_details
    )

    if not success:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)

    return TokenResponse(
        access_token=tokens_data["access_token"],  # type: ignore
        refresh_token=tokens_data["refresh_token"],  # type: ignore
        token_type=tokens_data["token_type"],  # type: ignore
        expires_in=tokens_data["expires_in"],  # type: ignore
    )


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    token_details: dict = Depends(AccessTokenBearer()),  # noqa: B008
    logout_data: LogoutRequest | None = None,
):
    """
    Logout user by revoking access token and refresh token.

    - Requires access token in Authorization header
    - Automatically finds and revokes associated refresh token (from token mapping)
    - Optionally accepts refresh_token in request body (overrides automatic lookup)
    - Revokes both access token and refresh token
    - Also revokes all other tokens for the user for security

    Security: This ensures that even if a hacker has the refresh token,
    they cannot generate new access tokens after logout.
    """
    user_id = token_details.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid token",
        )

    # Revoke the access token
    access_jti = token_details.get("jti")
    if access_jti:
        exp = token_details.get("exp", 0)
        access_ttl = (
            max(int(exp - time.time()), 0)
            if exp
            else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        await add_jti_to_blocklist(access_jti, access_ttl)

    # Try to find refresh token JTI from mapping (automatic lookup)
    refresh_jti = None
    if access_jti:
        refresh_jti = await get_refresh_jti_from_access_jti(access_jti)

    # If refresh token provided in body, use it (overrides automatic lookup)
    if logout_data and logout_data.refresh_token:
        refresh_payload = decode_token(logout_data.refresh_token)
        if refresh_payload:
            provided_refresh_jti = refresh_payload.get("jti")
            # Verify refresh token belongs to same user
            if provided_refresh_jti and refresh_payload.get("sub") == user_id:
                refresh_jti = provided_refresh_jti

    # Revoke the refresh token if found
    if refresh_jti:
        refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        await add_jti_to_blocklist(refresh_jti, refresh_ttl)

    # Revoke all other tokens for this user (most secure approach)
    # This invalidates any other refresh tokens the user might have
    refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    await revoke_all_user_sessions(user_id, refresh_ttl)

    return JSONResponse(
        content={"message": "Logged out successfully"},
        status_code=status.HTTP_200_OK,
    )
