
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    validate_password_strength,
    verify_password,
)
from app.services.invite_service import (
    use_invite_code,
    validate_invite_code_for_registration,
)
from app.services.redis_service import (
    add_to_blocklist,
    is_token_blocklisted,
    is_user_sessions_revoked,
)
from app.services.user_service import (
    create_user,
    get_user_by_email,
    update_user_last_login,
)


async def register_user(
    session: AsyncSession, email: str, password: str, invite_code: str | None
) -> tuple[bool, str, dict | None]:
    """
    Register a new user.

    Args:
        session: Database session
        email: User email
        password: Plain text password
        invite_code: Invite code (required if INVITE_ONLY=true)

    Returns:
        Tuple of (success, message, user_dict)
    """
    is_valid, error = validate_password_strength(password)
    if not is_valid:
        return False, error, None  # type: ignore

    is_valid, error = await validate_invite_code_for_registration(session, invite_code)
    if not is_valid:
        return False, error, None  # type: ignore

    existing = await get_user_by_email(session, email)
    if existing:
        return False, "Email already registered", None

    password_hash = hash_password(password)
    user = await create_user(session, email, password_hash, invite_code)

    if invite_code:
        await use_invite_code(session, invite_code)

    return (
        True,
        "User registered successfully",
        {
            "user_id": user.user_id,
            "email": user.email,
            "role": user.role,
        },
    )


async def authenticate_user(
    session: AsyncSession, email: str, password: str
) -> tuple[bool, str, dict | None]:
    """
    Authenticate user with email and password.

    Args:
        session: Database session
        email: User email
        password: Plain text password

    Returns:
        Tuple of (success, message, tokens_dict)
    """
    user = await get_user_by_email(session, email)
    if not user:
        return False, "Invalid email or password", None

    if not verify_password(password, user.password_hash):
        return False, "Invalid email or password", None

    if not user.is_active:
        return False, "Account is suspended", None

    if await is_user_sessions_revoked(user.user_id):
        return False, "Session expired, please login again", None

    access_token = create_access_token({"sub": user.user_id, "role": user.role})
    refresh_token = create_refresh_token({"sub": user.user_id})

    await update_user_last_login(session, user.user_id)

    return (
        True,
        "Login successful",
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": {
                "user_id": user.user_id,
                "email": user.email,
                "role": user.role,
            },
        },
    )


async def refresh_access_token(refresh_token: str) -> tuple[bool, str, dict | None]:
    """
    Generate new access token from refresh token.

    Args:
        refresh_token: Valid refresh token

    Returns:
        Tuple of (success, message, tokens_dict)
    """
    if await is_token_blocklisted(refresh_token):
        return False, "Token has been revoked", None

    payload = decode_token(refresh_token)
    if not payload:
        return False, "Invalid or expired token", None

    user_id = payload.get("sub")
    if not user_id:
        return False, "Invalid token payload", None

    if await is_user_sessions_revoked(user_id):
        return False, "Session expired, please login again", None

    role = payload.get("role", "user")
    access_token = create_access_token({"sub": user_id, "role": role})

    return (
        True,
        "Token refreshed",
        {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        },
    )


async def logout_user(access_token: str, refresh_token: str) -> tuple[bool, str]:
    """
    Logout user by revoking tokens.

    Args:
        access_token: Access token to revoke
        refresh_token: Refresh token to revoke

    Returns:
        Tuple of (success, message)
    """
    access_ttl = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60

    await add_to_blocklist(access_token, access_ttl)
    await add_to_blocklist(refresh_token, refresh_ttl)

    return True, "Logged out successfully"
