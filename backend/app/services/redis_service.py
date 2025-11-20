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
    Revoke all sessions for a user by adding user_id to blocklist.

    This is used when user changes password or admin suspends account.

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
    Check if all user sessions have been revoked.

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
