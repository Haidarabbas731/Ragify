"""
Unit tests for redis_service.py - Redis operations for JWT, rate limiting, and caching.

Tests:
- JTI blocklisting (add, check)
- User session revocation (revoke, check, clear)
- Token pair storage (store, retrieve)
- Password reset tokens (store, retrieve, delete)
- Rate limiting (check_rate_limit, check_email_rate_limit)
"""

from unittest.mock import AsyncMock, patch

import pytest

from app.services.redis_service import (
    add_jti_to_blocklist,
    add_to_blocklist,
    check_email_rate_limit,
    check_rate_limit,
    clear_user_session_revocation,
    delete_password_reset_token,
    get_redis,
    get_refresh_jti_from_access_jti,
    get_user_id_from_reset_token,
    is_jti_blocklisted,
    is_token_blocklisted,
    is_user_sessions_revoked,
    revoke_all_user_sessions,
    store_password_reset_token,
    store_token_pair,
)

# Test: get_redis


@pytest.mark.asyncio
async def test_get_redis():
    """Test get Redis client instance."""

    with patch("app.services.redis_service.Redis.from_url") as mock_from_url:
        mock_client = AsyncMock()
        mock_from_url.return_value = mock_client

        client = await get_redis()

        assert client == mock_client
        mock_from_url.assert_called_once()


# Test: add_jti_to_blocklist


@pytest.mark.asyncio
async def test_add_jti_to_blocklist():
    """Test adding JTI to blocklist."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_get_redis.return_value = mock_redis

        await add_jti_to_blocklist("test_jti_123", ttl=3600)

        mock_redis.setex.assert_called_once_with("blocklist:test_jti_123", 3600, "1")
        mock_redis.aclose.assert_called_once()


# Test: is_jti_blocklisted - True


@pytest.mark.asyncio
async def test_is_jti_blocklisted_true():
    """Test checking if JTI is blocklisted (exists)."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = "1"
        mock_get_redis.return_value = mock_redis

        result = await is_jti_blocklisted("test_jti_123")

        assert result is True
        mock_redis.get.assert_called_once_with("blocklist:test_jti_123")
        mock_redis.aclose.assert_called_once()


# Test: is_jti_blocklisted - False


@pytest.mark.asyncio
async def test_is_jti_blocklisted_false():
    """Test checking if JTI is blocklisted (does not exist)."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = None
        mock_get_redis.return_value = mock_redis

        result = await is_jti_blocklisted("test_jti_456")

        assert result is False
        mock_redis.aclose.assert_called_once()


# Test: add_to_blocklist (deprecated)


@pytest.mark.asyncio
async def test_add_to_blocklist_deprecated():
    """Test deprecated add_to_blocklist function."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_get_redis.return_value = mock_redis

        await add_to_blocklist("token_abc", ttl=7200)

        mock_redis.setex.assert_called_once_with("blocklist:token_abc", 7200, "1")
        mock_redis.aclose.assert_called_once()


# Test: is_token_blocklisted (deprecated)


@pytest.mark.asyncio
async def test_is_token_blocklisted_deprecated():
    """Test deprecated is_token_blocklisted function."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = "1"
        mock_get_redis.return_value = mock_redis

        result = await is_token_blocklisted("token_abc")

        assert result is True
        mock_redis.get.assert_called_once_with("blocklist:token_abc")
        mock_redis.aclose.assert_called_once()


# Test: revoke_all_user_sessions


@pytest.mark.asyncio
async def test_revoke_all_user_sessions():
    """Test revoking all sessions for a user."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_get_redis.return_value = mock_redis

        await revoke_all_user_sessions("user_123", ttl=604800)

        mock_redis.setex.assert_called_once_with("user_revoked:user_123", 604800, "1")
        mock_redis.aclose.assert_called_once()


# Test: is_user_sessions_revoked - True


@pytest.mark.asyncio
async def test_is_user_sessions_revoked_true():
    """Test checking if user sessions are revoked (yes)."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = "1"
        mock_get_redis.return_value = mock_redis

        result = await is_user_sessions_revoked("user_123")

        assert result is True
        mock_redis.get.assert_called_once_with("user_revoked:user_123")
        mock_redis.aclose.assert_called_once()


# Test: is_user_sessions_revoked - False


@pytest.mark.asyncio
async def test_is_user_sessions_revoked_false():
    """Test checking if user sessions are revoked (no)."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = None
        mock_get_redis.return_value = mock_redis

        result = await is_user_sessions_revoked("user_456")

        assert result is False
        mock_redis.aclose.assert_called_once()


# Test: clear_user_session_revocation


@pytest.mark.asyncio
async def test_clear_user_session_revocation():
    """Test clearing user session revocation flag."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.delete.return_value = 1
        mock_get_redis.return_value = mock_redis

        await clear_user_session_revocation("user_123")

        mock_redis.delete.assert_called_once_with("user_revoked:user_123")
        mock_redis.aclose.assert_called_once()


# Test: store_token_pair


@pytest.mark.asyncio
async def test_store_token_pair():
    """Test storing access/refresh token pair."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_get_redis.return_value = mock_redis

        await store_token_pair("access_jti_123", "refresh_jti_456", ttl=604800)

        mock_redis.setex.assert_called_once_with(
            "token_pair:access_jti_123", 604800, "refresh_jti_456"
        )
        mock_redis.aclose.assert_called_once()


# Test: get_refresh_jti_from_access_jti - Found


@pytest.mark.asyncio
async def test_get_refresh_jti_from_access_jti_found():
    """Test retrieving refresh JTI from access JTI (found)."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = "refresh_jti_456"
        mock_get_redis.return_value = mock_redis

        result = await get_refresh_jti_from_access_jti("access_jti_123")

        assert result == "refresh_jti_456"
        mock_redis.get.assert_called_once_with("token_pair:access_jti_123")
        mock_redis.aclose.assert_called_once()


# Test: get_refresh_jti_from_access_jti - Not found


@pytest.mark.asyncio
async def test_get_refresh_jti_from_access_jti_not_found():
    """Test retrieving refresh JTI from access JTI (not found)."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = None
        mock_get_redis.return_value = mock_redis

        result = await get_refresh_jti_from_access_jti("access_jti_999")

        assert result is None
        mock_redis.aclose.assert_called_once()


# Test: store_password_reset_token


@pytest.mark.asyncio
async def test_store_password_reset_token():
    """Test storing password reset token."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_get_redis.return_value = mock_redis

        await store_password_reset_token("reset_token_abc", "user_123", ttl=3600)

        mock_redis.set.assert_called_once_with(
            "password_reset:reset_token_abc", "user_123", ex=3600
        )
        mock_redis.aclose.assert_called_once()


# Test: get_user_id_from_reset_token - Found


@pytest.mark.asyncio
async def test_get_user_id_from_reset_token_found():
    """Test retrieving user ID from password reset token (found)."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = "user_123"
        mock_get_redis.return_value = mock_redis

        result = await get_user_id_from_reset_token("reset_token_abc")

        assert result == "user_123"
        mock_redis.get.assert_called_once_with("password_reset:reset_token_abc")
        mock_redis.aclose.assert_called_once()


# Test: get_user_id_from_reset_token - Not found


@pytest.mark.asyncio
async def test_get_user_id_from_reset_token_not_found():
    """Test retrieving user ID from password reset token (not found/expired)."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = None
        mock_get_redis.return_value = mock_redis

        result = await get_user_id_from_reset_token("reset_token_expired")

        assert result is None
        mock_redis.aclose.assert_called_once()


# Test: delete_password_reset_token


@pytest.mark.asyncio
async def test_delete_password_reset_token():
    """Test deleting password reset token (single-use enforcement)."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_get_redis.return_value = mock_redis

        await delete_password_reset_token("reset_token_abc")

        mock_redis.delete.assert_called_once_with("password_reset:reset_token_abc")
        mock_redis.aclose.assert_called_once()


# Test: check_rate_limit - Allowed (first request)


@pytest.mark.asyncio
async def test_check_rate_limit_allowed_first_request():
    """Test rate limit check - first request allowed."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.incr.return_value = 1  # First request
        mock_get_redis.return_value = mock_redis

        result = await check_rate_limit("chat:user_123", max_requests=100, window_seconds=3600)

        assert result is True
        mock_redis.incr.assert_called_once_with("chat:user_123")
        mock_redis.expire.assert_called_once_with("chat:user_123", 3600)
        mock_redis.aclose.assert_called_once()


# Test: check_rate_limit - Allowed (within limit)


@pytest.mark.asyncio
async def test_check_rate_limit_allowed_within_limit():
    """Test rate limit check - within limit allowed."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.incr.return_value = 50  # 50th request out of 100 allowed
        mock_get_redis.return_value = mock_redis

        result = await check_rate_limit("chat:user_123", max_requests=100, window_seconds=3600)

        assert result is True
        mock_redis.incr.assert_called_once()
        mock_redis.expire.assert_not_called()  # Only called on first request
        mock_redis.aclose.assert_called_once()


# Test: check_rate_limit - Blocked (exceeded)


@pytest.mark.asyncio
async def test_check_rate_limit_blocked_exceeded():
    """Test rate limit check - limit exceeded, blocked."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.incr.return_value = 101  # 101st request, max is 100
        mock_get_redis.return_value = mock_redis

        result = await check_rate_limit("chat:user_123", max_requests=100, window_seconds=3600)

        assert result is False
        mock_redis.incr.assert_called_once()
        mock_redis.aclose.assert_called_once()


# Test: check_rate_limit - Exact limit


@pytest.mark.asyncio
async def test_check_rate_limit_exact_limit():
    """Test rate limit check - exactly at limit, still allowed."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.incr.return_value = 100  # Exactly 100, max is 100
        mock_get_redis.return_value = mock_redis

        result = await check_rate_limit("chat:user_123", max_requests=100, window_seconds=3600)

        assert result is True
        mock_redis.aclose.assert_called_once()


# Test: check_email_rate_limit - Allowed (first request)


@pytest.mark.asyncio
async def test_check_email_rate_limit_allowed_first():
    """Test email rate limit - first request allowed."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = None  # No previous requests
        mock_redis.incr.return_value = 1
        mock_get_redis.return_value = mock_redis

        is_allowed, count = await check_email_rate_limit("user@example.com")

        assert is_allowed is True
        assert count == 1
        mock_redis.get.assert_called_once_with("email_rate_limit:user@example.com")
        mock_redis.incr.assert_called_once_with("email_rate_limit:user@example.com")
        mock_redis.expire.assert_called_once_with("email_rate_limit:user@example.com", 3600)
        mock_redis.aclose.assert_called_once()


# Test: check_email_rate_limit - Allowed (within limit)


@pytest.mark.asyncio
async def test_check_email_rate_limit_allowed_within_limit():
    """Test email rate limit - within 3 requests allowed."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = "2"  # 2 previous requests
        mock_redis.incr.return_value = 3
        mock_get_redis.return_value = mock_redis

        is_allowed, count = await check_email_rate_limit("user@example.com")

        assert is_allowed is True
        assert count == 3
        mock_redis.expire.assert_not_called()  # Not called for subsequent requests
        mock_redis.aclose.assert_called_once()


# Test: check_email_rate_limit - Blocked (exceeded)


@pytest.mark.asyncio
async def test_check_email_rate_limit_blocked_exceeded():
    """Test email rate limit - 3+ requests blocked."""

    with patch("app.services.redis_service.get_redis") as mock_get_redis:
        mock_redis = AsyncMock()
        mock_redis.get.return_value = "3"  # Already 3 requests
        mock_get_redis.return_value = mock_redis

        is_allowed, count = await check_email_rate_limit("user@example.com")

        assert is_allowed is False
        assert count == 3
        mock_redis.incr.assert_not_called()  # Don't increment if blocked
        mock_redis.aclose.assert_called_once()
