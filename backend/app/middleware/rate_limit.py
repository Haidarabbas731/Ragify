import time

from fastapi import Request, status
from fastapi.responses import JSONResponse
from redis.asyncio import Redis

from app.core.config import settings


class RateLimitExceeded(Exception):
    """Custom exception for rate limit violations."""

    def __init__(self, error_code, limit_type, message, retry_after, details):
        self.error_code = error_code
        self.limit_type = limit_type
        self.message = message
        self.retry_after = retry_after
        self.details = details


class RateLimitMiddleware:
    """Unified rate limiting middleware with hierarchy."""

    def __init__(self, app):
        self.app = app
        self.redis: Redis | None = None

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        request = Request(scope, receive)

        if self.redis is None:
            self.redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)

        try:
            await self.check_ip_rate_limit(request)

            if user := getattr(request.state, "user", None):
                await self.check_user_rate_limit(request, user)

                await self.check_cost_limit(request, user)

            return await self.app(scope, receive, send)

        except RateLimitExceeded as e:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "error": e.error_code,
                    "limit_type": e.limit_type,
                    "message": e.message,
                    "retry_after": e.retry_after,
                    "details": e.details,
                },
                headers={
                    "X-RateLimit-Limit": str(e.details["limit"]),
                    "X-RateLimit-Remaining": str(e.details["remaining"]),
                    "X-RateLimit-Reset": str(e.details["reset_at"]),
                    "Retry-After": str(e.retry_after),
                },
            )

    async def check_ip_rate_limit(self, request: Request):
        """Check IP-based rate limit (300/min)."""
        ip = request.client.host
        key = f"rate_limit:ip:{ip}"

        current = await self.redis.incr(key)
        if current == 1:
            await self.redis.expire(key, 60)

        if current > 300:
            ttl = await self.redis.ttl(key)
            raise RateLimitExceeded(
                error_code="IP_RATE_LIMIT",
                limit_type="ip_based",
                message="Too many requests from this IP address",
                retry_after=ttl,
                details={"limit": 300, "remaining": 0, "reset_at": int(time.time()) + ttl},
            )

    async def check_user_rate_limit(self, request: Request, user):
        """Check user-based rate limit (100/min)."""
        key = f"rate_limit:user:{user.user_id}"

        current = await self.redis.incr(key)
        if current == 1:
            await self.redis.expire(key, 60)

        if current > 100:
            ttl = await self.redis.ttl(key)
            raise RateLimitExceeded(
                error_code="USER_RATE_LIMIT",
                limit_type="user_based",
                message="You have exceeded the rate limit",
                retry_after=ttl,
                details={"limit": 100, "remaining": 0, "reset_at": int(time.time()) + ttl},
            )

    async def check_cost_limit(self, request: Request, user):
        """Check cost-based rate limit (1000 units/hour)."""
        endpoint_costs = {
            "/api/v1/documents/upload": 50,
            "/api/v1/chat": 10,
        }

        cost = endpoint_costs.get(request.url.path, 1)
        key = f"cost_limit:user:{user.user_id}"

        current = await self.redis.incrby(key, cost)
        if current == cost:
            await self.redis.expire(key, 3600)

        if current > 1000:
            ttl = await self.redis.ttl(key)
            raise RateLimitExceeded(
                error_code="COST_LIMIT_EXCEEDED",
                limit_type="cost_based",
                message="You have exceeded your hourly usage quota",
                retry_after=ttl,
                details={
                    "limit": 1000,
                    "remaining": max(0, 1000 - current),
                    "reset_at": int(time.time()) + ttl,
                },
            )
