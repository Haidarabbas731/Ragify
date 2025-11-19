from redis.asyncio import Redis

from app.core.config import settings


async def get_redis() -> Redis:
    """
    Get Redis client instance.

    Returns:
        Redis client
    """
    return Redis.from_url(settings.REDIS_URL, decode_responses=True)


async def add_to_blocklist(token: str, ttl: int) -> None:
    """
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
