import logging
import secrets
import time

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession

from app.api.dependencies import (
    AccessTokenBearer,
    RefreshTokenBearer,
)
from app.core.config import settings
from app.core.security import decode_token, hash_password, validate_password_strength
from app.db.database import get_session
from app.schemas.common import MessageResponse
from app.schemas.user import (
    EmailVerifyRequest,
    LogoutRequest,
    PasswordResetConfirm,
    PasswordResetRequest,
    PasswordResetValidation,
    ResendCodeRequest,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
)
from app.services.auth_service import (
    EMAIL_NOT_VERIFIED,
    authenticate_user,
    refresh_access_token_from_details,
    register_user,
    verify_email,
)
from app.services.email_service import send_password_reset_email, send_welcome_email
from app.services.redis_service import (
    add_jti_to_blocklist,
    check_email_rate_limit,
    check_rate_limit,
    delete_password_reset_token,
    get_refresh_jti_from_access_jti,
    get_user_id_from_reset_token,
    store_password_change_timestamp,
    store_password_reset_token,
)
from app.services.user_service import get_user_by_email, update_user_password
from app.services.verification_service import SendBlocked, deliver_code, gate_code_send

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


def _client_ip(request: Request) -> str:
    """The caller's IP address (behind a proxy, set FORWARDED_ALLOW_IPS so uvicorn reads it)."""
    return request.client.host if request.client else "unknown"


def _too_many_requests(code: str, message: str, retry_after: int) -> HTTPException:
    """A 429 whose body tells the client what happened and when to try again."""
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={"code": code, "message": message, "retry_after": retry_after},
        headers={"Retry-After": str(retry_after)},
    )


def _send_blocked_error(blocked: SendBlocked) -> HTTPException:
    """The 429 for a verification email that may not be sent yet."""
    if blocked.reason == "cooldown":
        return _too_many_requests(
            "resend_too_soon",
            f"Wait {blocked.retry_after} seconds before asking for another code.",
            blocked.retry_after,
        )
    return _too_many_requests(
        "too_many_requests",
        "Too many codes were sent to this address. Try again in an hour.",
        blocked.retry_after,
    )


async def _email_new_code(session: AsyncSession, email: str) -> None:
    """
    Send a verification code to an unverified account, if the send limits allow it.

    Failures are logged and swallowed: the caller already has its answer, and the verify screen
    can ask for another code.
    """
    try:
        if await gate_code_send(email):
            return
        user = await get_user_by_email(session, email)
        if user and user.is_active and user.email_verified_at is None:
            if not await deliver_code(user):
                logger.error("Failed to send a verification code")
    except Exception as e:
        logger.error("Error sending a verification code: %s", e)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    request: Request,
    data: UserRegister,
    session: AsyncSession = Depends(get_session),  # noqa: B008
):
    """
    Register a new user and email them a 6-digit code to verify the address.

    - **email**: Valid email address
    - **password**: Min 8 chars, 1 uppercase, 1 number, 1 special char

    The account cannot sign in until the code is submitted to `/auth/verify-email`. Signing up
    again with an address that was never verified replaces the password and sends a new code.
    """
    if not await check_rate_limit(
        f"register_ip:{_client_ip(request)}", settings.REGISTER_LIMIT_PER_IP_PER_HOUR, 3600
    ):
        raise _too_many_requests(
            "too_many_requests", "Too many sign-ups from this network. Try again in an hour.", 3600
        )

    success, message, user_data = await register_user(session, data.email, data.password)

    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    await _email_new_code(session, data.email)

    return UserResponse(**user_data)  # type: ignore


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin, session: AsyncSession = Depends(get_session)):  # noqa: B008
    """
    Authenticate user and return JWT tokens.

    - **email**: User email address
    - **password**: User password

    Returns access token (1 hour) and refresh token (7 days).
    """
    success, message, auth_data = await authenticate_user(session, data.email, data.password)

    if not success:
        if message == EMAIL_NOT_VERIFIED:
            # The password was right, so it is safe to say why sign-in is refused. A fresh code
            # goes out so the verify screen has something to enter.
            await _email_new_code(session, data.email)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "email_not_verified",
                    "message": "Verify your email to sign in. We sent you a new code.",
                },
            )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=message)

    return TokenResponse(
        access_token=auth_data["access_token"],  # type: ignore
        refresh_token=auth_data["refresh_token"],  # type: ignore
        token_type=auth_data["token_type"],  # type: ignore
        expires_in=auth_data["expires_in"],  # type: ignore
    )


@router.post("/verify-email", response_model=TokenResponse)
async def verify_email_code(
    request: Request,
    data: EmailVerifyRequest,
    session: AsyncSession = Depends(get_session),  # noqa: B008
):
    """
    Verify an email address with the 6-digit code and sign the user in.

    - **email**: The address that was signed up
    - **code**: The 6-digit code from the email

    A code works for 10 minutes and locks after 5 wrong tries (send a new one to continue).
    """
    if not await check_rate_limit(
        f"verify_ip:{_client_ip(request)}", settings.VERIFY_ATTEMPTS_PER_IP_PER_HOUR, 3600
    ):
        raise _too_many_requests(
            "too_many_requests", "Too many attempts from this network. Try again later.", 3600
        )

    result = await verify_email(session, data.email, data.code)

    if result.status == "ok" and result.tokens:
        try:
            await send_welcome_email(data.email)
        except Exception as e:
            logger.error("Failed to send the welcome email: %s", e)
        return TokenResponse(
            access_token=result.tokens["access_token"],
            refresh_token=result.tokens["refresh_token"],
            token_type=result.tokens["token_type"],
            expires_in=result.tokens["expires_in"],
        )

    if result.status == "already_verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "already_verified",
                "message": "This email is already verified. Sign in.",
            },
        )
    if result.status == "expired":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "code_expired", "message": "That code has expired. Send a new one."},
        )
    if result.status == "locked":
        raise _too_many_requests(
            "too_many_attempts", "Too many wrong codes. Send a new code to try again.", 0
        )
    if result.status == "wrong":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "invalid_code",
                "message": "That code isn't right.",
                "attempts_left": result.attempts_left,
            },
        )
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Your email is verified but we could not sign you in. Try signing in.",
    )


@router.post("/resend-code", response_model=MessageResponse)
async def resend_verification_code(
    request: Request,
    data: ResendCodeRequest,
    session: AsyncSession = Depends(get_session),  # noqa: B008
):
    """
    Send a new verification code to an address that has not been verified.

    - **email**: The address that was signed up

    Always answers the same way, whether or not an account exists, so it cannot be used to find
    out who has one. Limited to one send a minute and five an hour per address.
    """
    if not await check_rate_limit(
        f"resend_ip:{_client_ip(request)}", settings.RESEND_LIMIT_PER_IP_PER_HOUR, 3600
    ):
        raise _too_many_requests(
            "too_many_requests", "Too many requests from this network. Try again later.", 3600
        )

    blocked = await gate_code_send(data.email)
    if blocked:
        raise _send_blocked_error(blocked)

    try:
        user = await get_user_by_email(session, data.email)
        if user and user.is_active and user.email_verified_at is None:
            if not await deliver_code(user):
                logger.error("Failed to send a verification code")
    except Exception as e:
        logger.error("Error sending a verification code: %s", e)

    return JSONResponse(
        content={"message": "If that address needs verifying, we sent a new code."},
        status_code=status.HTTP_200_OK,
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
    session: AsyncSession = Depends(get_session),  # noqa: B008
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


@router.get("/password-reset/validate", response_model=PasswordResetValidation)
async def validate_password_reset_token(
    token: str = Query(min_length=1, max_length=200),
) -> PasswordResetValidation:
    """
    Check whether a password reset link can still be used, without using it.

    - **token**: Reset token from the email link

    An expired link and one that was already used look the same: both are simply not valid.
    """
    return PasswordResetValidation(valid=await get_user_id_from_reset_token(token) is not None)


@router.post("/password-reset/confirm", response_model=MessageResponse)
async def confirm_password_reset(
    data: PasswordResetConfirm,
    session: AsyncSession = Depends(get_session),  # noqa: B008
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
