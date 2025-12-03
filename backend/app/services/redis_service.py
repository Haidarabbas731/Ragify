from redis.asyncio import Redis

from app.core.config import settings


async def get_redis() -> Redis:
    """
    Get Redis client instance.

    Returns:
        Redis client
    """
    return Redis.from_url(settings.REDIS_URL, decode_responses=True)


async def add_jti_to_blocklist(jti: str, ttl: int) -> None:
    """
    Add a JWT token ID (JTI) to the blocklist (revoke it).

    Args:
        jti: JWT ID (unique token identifier)
        ttl: Time to live in seconds (should match token expiry)
    """
    redis = await get_redis()
    try:
        await redis.setex(f"blocklist:{jti}", ttl, "1")
    finally:
        await redis.aclose()


async def is_jti_blocklisted(jti: str) -> bool:
    """
    Check if a JTI is in the blocklist (revoked).

    Args:
        jti: JWT ID (unique token identifier)

    Returns:
        True if JTI is blocklisted, False otherwise
    """
    redis = await get_redis()
    try:
        result = await redis.get(f"blocklist:{jti}")
        return result is not None
    finally:
        await redis.aclose()


async def add_to_blocklist(token: str, ttl: int) -> None:
    """
    Deprecated: Use add_jti_to_blocklist instead.
    Add a JWT token to the blocklist (revoke it).

    Args:
        token: JWT token string
        ttl: Time to live in seconds (should match token expiry)
    """
    redis = await get_redis()
    try:
        await redis.setex(f"blocklist:{token}", ttl, "1")
    finally:
        await redis.aclose()


async def is_token_blocklisted(token: str) -> bool:
    """
    Deprecated: Use is_jti_blocklisted instead.
    Check if a token is in the blocklist (revoked).

    Args:
        token: JWT token string

    Returns:
        True if token is blocklisted, False otherwise
    """
    redis = await get_redis()
    try:
        result = await redis.get(f"blocklist:{token}")
        return result is not None
    finally:
        await redis.aclose()


async def revoke_all_user_sessions(user_id: str, ttl: int = 604800) -> None:
    """
    DEPRECATED: Use store_password_change_timestamp() for password changes instead.

    Revoke all sessions for a user by blocking the entire account.

    This should ONLY be used for admin actions (suspend/delete user).
    For password changes, use store_password_change_timestamp() which invalidates
    old tokens without blocking new logins.

    Args:
        user_id: User ID
        ttl: Time to live in seconds (default 7 days for refresh tokens)
    """
    redis = await get_redis()
    try:
        await redis.setex(f"user_revoked:{user_id}", ttl, "1")
    finally:
        await redis.aclose()


async def is_user_sessions_revoked(user_id: str) -> bool:
    """
    DEPRECATED: Use is_token_issued_before_password_change() instead.

    Check if all user sessions have been revoked (account-level block).

    This checks for admin-imposed account blocks, not password changes.

    Args:
        user_id: User ID

    Returns:
        True if user sessions are revoked, False otherwise
    """
    redis = await get_redis()
    try:
        result = await redis.get(f"user_revoked:{user_id}")
        return result is not None
    finally:
        await redis.aclose()


async def clear_user_session_revocation(user_id: str) -> None:
    """
    DEPRECATED: No longer needed with timestamp-based approach.

    Clear user session revocation flag to allow new logins.

    This was needed to fix the revoke+clear pattern. With timestamp-based
    validation, this function is no longer necessary.

    Args:
        user_id: User ID
    """
    import logging

    logger = logging.getLogger(__name__)
    redis = await get_redis()
    try:
        key = f"user_revoked:{user_id}"
        result = await redis.delete(key)
        logger.warning(
            f"Cleared user session revocation for {user_id}. Key: {key}, Deleted: {result}"
        )
    finally:
        await redis.aclose()


async def store_token_pair(access_jti: str, refresh_jti: str, ttl: int) -> None:
    """
    Store mapping between access token JTI and refresh token JTI.

    This allows us to find the refresh token when we only have the access token.

    Args:
        access_jti: Access token JTI
        refresh_jti: Refresh token JTI
        ttl: Time to live in seconds (should match refresh token expiry)
    """
    redis = await get_redis()
    try:
        await redis.setex(f"token_pair:{access_jti}", ttl, refresh_jti)
    finally:
        await redis.aclose()


async def get_refresh_jti_from_access_jti(access_jti: str) -> str | None:
    """
    Get refresh token JTI associated with an access token JTI.

    Args:
        access_jti: Access token JTI

    Returns:
        Refresh token JTI if found, None otherwise
    """
    redis = await get_redis()
    try:
        return await redis.get(f"token_pair:{access_jti}")
    finally:
        await redis.aclose()


async def store_password_reset_token(token: str, user_id: str, ttl: int) -> None:
    """
    Store password reset token in Redis.

    Args:
        token: Password reset token
        user_id: User ID
        ttl: Time to live in seconds
    """
    redis = await get_redis()
    try:
        await redis.set(f"password_reset:{token}", user_id, ex=ttl)
    finally:
        await redis.aclose()


async def get_user_id_from_reset_token(token: str) -> str | None:
    """
    Get user ID from password reset token.

    Args:
        token: Password reset token

    Returns:
        User ID if token exists, None otherwise
    """
    redis = await get_redis()
    try:
        return await redis.get(f"password_reset:{token}")
    finally:
        await redis.aclose()


async def delete_password_reset_token(token: str) -> None:
    """
    Delete password reset token from Redis (single-use).

    Args:
        token: Password reset token
    """
    redis = await get_redis()
    try:
        await redis.delete(f"password_reset:{token}")
    finally:
        await redis.aclose()


async def check_rate_limit(key: str, max_requests: int, window_seconds: int) -> bool:
    """
    Check if a key has exceeded its rate limit using Redis INCR.

    This implements a sliding window rate limiter using Redis.
    Rate limits are hierarchical:
    - Document upload: 10 per hour
    - Chat query: 100 per hour
    - Authentication: 5 failed attempts per 15 minutes

    Args:
        key: Rate limit key (e.g., "upload:user_id", "chat:user_id")
        max_requests: Maximum number of requests allowed in window
        window_seconds: Time window in seconds

    Returns:
        bool: True if request is allowed, False if limit exceeded

    Raises:
        Exception: If Redis operation fails
    """
    redis = await get_redis()
    try:
        # Increment counter
        count = await redis.incr(key)

        # Set expiry on first request
        if count == 1:
            await redis.expire(key, window_seconds)

        # Check if limit exceeded
        return count <= max_requests

    finally:
        await redis.aclose()


async def check_email_rate_limit(email: str) -> tuple[bool, int]:
    """
    Check if email has exceeded password reset rate limit.

    Args:
        email: Email address to check

    Returns:
        Tuple of (is_allowed, current_count)
    """
    redis = await get_redis()
    try:
        key = f"email_rate_limit:{email}"
        count_str = await redis.get(key)
        count = int(count_str) if count_str else 0

        if count >= 3:
            return False, count

        await redis.incr(key)
        if count == 0:
            await redis.expire(key, 3600)

        return True, count + 1
    finally:
        await redis.aclose()


async def store_password_change_timestamp(user_id: str, ttl: int = 604800) -> None:
    """
    Store timestamp when user changed password.

    This invalidates all tokens issued before this time without blocking new logins.

    Args:
        user_id: User ID
        ttl: Time to live in seconds (default 7 days to match refresh token expiry)
    """
    from datetime import UTC, datetime

    redis = await get_redis()
    try:
        timestamp = datetime.now(UTC).timestamp()
        await redis.setex(f"password_changed:{user_id}", ttl, str(timestamp))
    finally:
        await redis.aclose()


async def get_password_change_timestamp(user_id: str) -> float | None:
    """
    Get timestamp when user last changed password.

    Args:
        user_id: User ID

    Returns:
        Timestamp if found, None otherwise
    """
    redis = await get_redis()
    try:
        result = await redis.get(f"password_changed:{user_id}")
        return float(result) if result else None
    finally:
        await redis.aclose()


async def is_token_issued_before_password_change(
    user_id: str, token_iat: float
) -> bool:
    """
    Check if token was issued before user's last password change.

    Args:
        user_id: User ID
        token_iat: Token issued at timestamp (from 'iat' claim)

    Returns:
        True if token should be rejected (issued before password change), False if valid
    """
    password_changed_at = await get_password_change_timestamp(user_id)
    if not password_changed_at:
        return False  # No password change recorded, token is valid

    return token_iat < password_changed_at
