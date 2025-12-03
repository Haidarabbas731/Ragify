import logging
import secrets
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
from app.core.security import decode_token, hash_password, validate_password_strength
from app.schemas.common import MessageResponse
from app.schemas.user import (
    LogoutRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import (
    authenticate_user,
    refresh_access_token_from_details,
    register_user,
)
from app.services.email_service import send_password_reset_email, send_welcome_email
from app.services.redis_service import (
    add_jti_to_blocklist,
    check_email_rate_limit,
    delete_password_reset_token,
    get_refresh_jti_from_access_jti,
    get_user_id_from_reset_token,
    store_password_change_timestamp,
    store_password_reset_token,
)
from app.services.user_service import get_user_by_email, update_user_password

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    data: UserRegister,
    session: AsyncSession = Depends(get_db),  # noqa: B008
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

    # Send welcome email (non-blocking, failures are logged but don't affect registration)
    try:
        await send_welcome_email(data.email, data.email)
    except Exception as e:
        logger.error(f"Failed to send welcome email to {data.email}: {str(e)}")

    return UserResponse(**user_data)  # type: ignore


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, session: AsyncSession = Depends(get_db)):  # noqa: B008
    """
    Authenticate user and return JWT tokens.

    - **email**: User email address
    - **password**: User password

    Returns access token (1 hour) and refresh token (7 days).
    """
    success, message, auth_data = await authenticate_user(session, data.email, data.password)

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
    success, message, tokens_data = await refresh_access_token_from_details(token_details)

    if not success:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)

    return TokenResponse(
        access_token=tokens_data["access_token"],  # type: ignore
        refresh_token=tokens_data["refresh_token"],  # type: ignore
        token_type=tokens_data["token_type"],  # type: ignore
        expires_in=tokens_data["expires_in"],  # type: ignore
    )


@router.post("/logout", status_code=status.HTTP_200_OK, response_model=MessageResponse)
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

    Security: Revoked tokens are blocklisted in Redis and cannot be reused.
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
            max(int(exp - time.time()), 0) if exp else settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
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

    # Note: We do NOT call revoke_all_user_sessions() here because:
    # - That would block ALL future logins for this user (7 days!)
    # - Individual token revocation is sufficient for logout
    # - revoke_all_user_sessions() is only for password reset/admin suspension

    return JSONResponse(
        content={"message": "Logged out successfully"},
        status_code=status.HTTP_200_OK,
    )


@router.post("/password-reset/request", response_model=MessageResponse)
async def request_password_reset(
    data: PasswordResetRequest,
    session: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Request password reset email.

    - **email**: User email address

    Rate limited to 3 requests per hour per email.
    Always returns success to prevent email enumeration.
    """
    is_allowed, count = await check_email_rate_limit(data.email)
    if not is_allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many password reset requests. Please try again in 1 hour.",
        )

    user = await get_user_by_email(session, data.email)

    if user:
        reset_token = secrets.token_urlsafe(32)

        await store_password_reset_token(
            reset_token, user.user_id, settings.PASSWORD_RESET_TOKEN_EXPIRY
        )

        try:
            email_sent = await send_password_reset_email(user.email, reset_token)
            if not email_sent:
                logger.error(f"Failed to send password reset email to {data.email}")
        except Exception as e:
            logger.error(f"Error sending password reset email to {data.email}: {str(e)}")

    return JSONResponse(
        content={
            "message": "If an account with that email exists, a password reset link has been sent"
        },
        status_code=status.HTTP_200_OK,
    )


@router.post("/password-reset/confirm", response_model=MessageResponse)
async def confirm_password_reset(
    data: PasswordResetConfirm,
    session: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Confirm password reset with token and new password.

    - **token**: Reset token from email
    - **new_password**: New password (min 8 chars, 1 uppercase, 1 number, 1 special)
    """
    is_valid, error = validate_password_strength(data.new_password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error)

    user_id = await get_user_id_from_reset_token(data.token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    password_hash = hash_password(data.new_password)
    await update_user_password(session, user_id, password_hash)

    await delete_password_reset_token(data.token)

    # Store password change timestamp to invalidate old tokens
    refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    await store_password_change_timestamp(user_id, refresh_ttl)

    return JSONResponse(
        content={"message": "Password reset successfully"},
        status_code=status.HTTP_200_OK,
    )
