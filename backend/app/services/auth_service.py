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
    add_jti_to_blocklist,
    is_token_issued_before_password_change,
    store_token_pair,
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
            "status": user.status,
            "storage_used_bytes": user.storage_used_bytes,
            "storage_limit_bytes": user.storage_limit_bytes,
            "created_at": user.created_at,
            "last_login_at": user.last_login_at,
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

    access_token = create_access_token(
        {"sub": user.user_id, "email": user.email, "role": user.role}
    )
    refresh_token = create_refresh_token(
        {"sub": user.user_id, "email": user.email, "role": user.role}
    )

    # Check if tokens were issued before password change
    access_payload = decode_token(access_token)
    if access_payload:
        token_iat = access_payload.get("iat")
        if token_iat and await is_token_issued_before_password_change(user.user_id, token_iat):
            return False, "Session expired due to password change. Please login again.", None

    # Store token pair mapping for automatic refresh token lookup on logout
    refresh_payload = decode_token(refresh_token)
    if access_payload and refresh_payload:
        access_jti = access_payload.get("jti")
        refresh_jti = refresh_payload.get("jti")
        if access_jti and refresh_jti:
            refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
            await store_token_pair(access_jti, refresh_jti, refresh_ttl)

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


async def refresh_access_token_from_details(
    token_details: dict,
) -> tuple[bool, str, dict | None]:
    """
    Generate new access and refresh tokens from existing refresh token.

    Args:
        token_details: Decoded refresh token payload (from RefreshTokenBearer)

    Returns:
        Tuple of (success, message, tokens_dict)
    """
    user_id = token_details.get("sub")
    if not user_id:
        return False, "Invalid token payload", None

    # Check if token was issued before password change
    token_iat = token_details.get("iat")
    if token_iat and await is_token_issued_before_password_change(user_id, token_iat):
        return False, "Session expired due to password change. Please login again.", None

    # Revoke old refresh token
    old_jti = token_details.get("jti")
    if old_jti:
        refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        await add_jti_to_blocklist(old_jti, refresh_ttl)

    # Get user role and email (should be in token or fetch from DB)
    role = token_details.get("role", "user")
    email = token_details.get("email")

    # Generate new tokens
    access_token = create_access_token({"sub": user_id, "email": email, "role": role})
    refresh_token = create_refresh_token({"sub": user_id, "email": email, "role": role})

    # Store token pair mapping for automatic refresh token lookup on logout
    access_payload = decode_token(access_token)
    refresh_payload = decode_token(refresh_token)
    if access_payload and refresh_payload:
        access_jti = access_payload.get("jti")
        refresh_jti = refresh_payload.get("jti")
        if access_jti and refresh_jti:
            refresh_ttl = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
            await store_token_pair(access_jti, refresh_jti, refresh_ttl)

    return (
        True,
        "Token refreshed",
        {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        },
    )


async def logout_user(
    access_jti: str,
    access_ttl: int,
    refresh_jti: str | None = None,
    refresh_ttl: int | None = None,
    user_id: str | None = None,
) -> tuple[bool, str]:
    """
    Logout user by revoking tokens via JTI.

    Args:
        access_jti: JWT ID of access token to revoke
        access_ttl: Time to live for access token in seconds
        refresh_jti: Optional JWT ID of refresh token to revoke
        refresh_ttl: Optional time to live for refresh token in seconds
        user_id: Optional user ID to revoke all sessions

    Returns:
        Tuple of (success, message)
    """
    await add_jti_to_blocklist(access_jti, access_ttl)

    if refresh_jti and refresh_ttl:
        await add_jti_to_blocklist(refresh_jti, refresh_ttl)

    # Revoke all other tokens for this user for maximum security
    if user_id:
        from app.services.redis_service import revoke_all_user_sessions

        max_ttl = max(
            access_ttl,
            (
                refresh_ttl
                if refresh_ttl
                else settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
            ),
        )
        await revoke_all_user_sessions(user_id, max_ttl)

    return True, "Logged out successfully"
