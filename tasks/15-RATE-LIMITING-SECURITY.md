# Phase 15: Rate Limiting & Security Hardening

**Priority:** High (before production)
**Estimated Time:** 2-3 days
**Dependencies:** Phase 2 (Authentication), Phase 9 (Deployment)
**PRD Reference:** Section 13.5 (Enhanced Rate Limiting), Section 13.6 (Security Measures)

---

## ⚠️ IMPORTANT GIT RULES (READ FIRST)

**PRD Reference:** Section 11.8 (Development Workflow & Git Strategy)

### Mandatory Git Workflow:
1. ✅ **ALWAYS** work on `dev` branch (not `main`)
2. ✅ **ALWAYS** run tests before committing (`pytest`)
3. ✅ **ALWAYS** run linting before committing (`ruff check .`)
4. ✅ **ALWAYS** keep commits local (`git commit`)
5. ❌ **NEVER** push to remote unless explicitly requested
6. ❌ **NEVER** commit directly to `main` branch
7. ❌ **NEVER** skip tests before committing

### Commit Message Format:
```
<type>(<scope>): <description>

Types: feat, fix, test, docs, refactor, chore
Example: feat(security): add cost-based rate limiting
```

### Code Style & Documentation:
- ❌ **DO NOT** add PRD references in code comments
- ❌ **DO NOT** add unnecessary comments
- ✅ **Document all functions** with docstrings (purpose, args, returns, raises)
- ✅ **Use type hints** for all function signatures
- ✅ **Follow consistent patterns** across all files
- ✅ Write clean, self-documenting code with descriptive names

**Note:** PRD references in this file are for verification only, NOT for code comments.

---

## 15.1 Rate Limiting Architecture

**PRD Reference:** Section 11.4 (Rate Limit Hierarchy & Coordination)

### Rate Limiting Hierarchy

**Execution Order (3-tier system):**

1. **IP-Based Rate Limit** (slowapi)
   - Global limit: 300 requests/minute per IP
   - Prevents DDoS and brute force attacks
   - Applied BEFORE authentication

2. **User-Based Rate Limit** (Redis)
   - User limit: 100 requests/minute per user
   - Prevents account abuse
   - Applied AFTER authentication

3. **Cost-Based Rate Limit** (Redis)
   - Credit-based system: 1000 units/hour
   - Different costs per operation:
     - Query: 1 credit
     - Upload: 10 credits
     - Download: 2 credits
     - Delete: 1 credit
   - Token bucket algorithm with credit regeneration

### Rate Limit Response Format

**PRD Reference:** Section 11.4 (Rate Limit Response)

All rate limit violations return **HTTP 429 Too Many Requests**:

```json
{
  "error": "rate_limit_exceeded",
  "message": "You have exceeded the rate limit. Please wait before trying again.",
  "retry_after": 60,
  "limit": 100,
  "remaining": 0,
  "reset": 1706356800
}
```

---

## 15.2 IP-Based Rate Limiting (Tier 1)

**PRD Reference:** Section 11.4 (IP-Based Rate Limit)

### Implementation with slowapi

**File:** `backend/app/middleware/rate_limit.py`

- [x] Verify `rate_limit.py` exists (created in Phase 0)
- [ ] Enhance with slowapi integration
- [ ] Configure IP-based limits (300/min)
- [ ] Add custom exception handler
- [ ] Add rate limit headers to responses
- [ ] Test rate limiting with multiple IPs

**Installation:**

```bash
uv add slowapi
```

**Implementation:**

```python
# backend/app/middleware/rate_limit.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response

# Initialize limiter
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300/minute"]  # Global IP limit
)

# Custom exception handler
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom handler for rate limit exceeded errors.
    """
    return Response(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": "You have exceeded the rate limit. Please wait before trying again.",
            "retry_after": 60,
            "limit": exc.detail.split()[0] if hasattr(exc, 'detail') else 300
        }
    )
```

**Integration in main.py:**

```python
# backend/main.py
from app.middleware.rate_limit import limiter, rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

app = FastAPI()

# Add slowapi
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
```

### Tasks to Implement

- [ ] Add `slowapi` to dependencies
- [ ] Enhance `rate_limit.py` with IP-based limiter
- [ ] Integrate limiter in `main.py`
- [ ] Add custom exception handler
- [ ] Test IP-based rate limiting (300/min)
- [ ] Add rate limit headers to responses

---

## 15.3 User-Based Rate Limiting (Tier 2)

**PRD Reference:** Section 11.4 (User-Based Rate Limit)

### Redis-Based User Rate Limiting

**File:** `backend/app/middleware/rate_limit.py`

- [ ] Add user-based rate limiter class
- [ ] Use Redis sliding window algorithm
- [ ] Configure user limits (100/min)
- [ ] Add rate limit dependency for authenticated endpoints
- [ ] Track requests per user in Redis
- [ ] Add rate limit info to response headers

**Implementation:**

```python
# backend/app/middleware/rate_limit.py
import time
from redis.asyncio import Redis
from fastapi import HTTPException, Depends
from app.core.auth import get_current_user
from app.models.user import User

class UserRateLimiter:
    """
    User-based rate limiting using Redis sliding window.
    """

    def __init__(self, redis: Redis):
        self.redis = redis
        self.max_requests = 100  # per minute
        self.window_seconds = 60

    async def check_rate_limit(self, user_id: str) -> dict:
        """
        Check if user has exceeded rate limit.

        Args:
            user_id: User ID to check

        Returns:
            Rate limit info (limit, remaining, reset)

        Raises:
            HTTPException: If rate limit exceeded
        """
        key = f"rate_limit:user:{user_id}"
        now = time.time()
        window_start = now - self.window_seconds

        # Redis sliding window
        pipe = self.redis.pipeline()
        pipe.zremrangebyscore(key, 0, window_start)  # Remove old entries
        pipe.zadd(key, {str(now): now})  # Add current request
        pipe.zcard(key)  # Count requests in window
        pipe.expire(key, self.window_seconds)  # Set expiry

        results = await pipe.execute()
        request_count = results[2]

        # Calculate rate limit info
        info = {
            "limit": self.max_requests,
            "remaining": max(0, self.max_requests - request_count),
            "reset": int(now + self.window_seconds)
        }

        # Check if exceeded
        if request_count > self.max_requests:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "rate_limit_exceeded",
                    "message": "You have exceeded the rate limit",
                    "retry_after": self.window_seconds,
                    **info
                }
            )

        return info


# Dependency
user_rate_limiter = UserRateLimiter(redis_client)

async def check_user_rate_limit(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Dependency to check user rate limit.
    """
    return await user_rate_limiter.check_rate_limit(current_user.user_id)
```

**Usage in Endpoints:**

```python
# backend/app/api/v1/chat.py
@router.post("/chat")
async def chat(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    rate_limit_info: dict = Depends(check_user_rate_limit)
) -> ChatResponse:
    """
    Chat endpoint with user-based rate limiting.
    """
    # Process chat request
    pass
```

### Tasks to Implement

- [ ] Create `UserRateLimiter` class
- [ ] Implement sliding window algorithm with Redis
- [ ] Add `check_user_rate_limit` dependency
- [ ] Apply to all authenticated endpoints
- [ ] Test user-based rate limiting (100/min)
- [ ] Add rate limit headers to responses

---

## 15.4 Cost-Based Rate Limiting (Tier 3)

**PRD Reference:** Section 13.5 (Cost-Based Rate Limiting)

### Credit System Implementation

**File:** `backend/app/middleware/cost_limiter.py` (NEW)

- [ ] Create `cost_limiter.py` for credit-based limiting
- [ ] Implement token bucket algorithm
- [ ] Configure operation costs (query: 1, upload: 10, download: 2, delete: 1)
- [ ] Credit regeneration: 100 credits/hour
- [ ] Max credits: 200
- [ ] Add credit tracking in Redis
- [ ] Add `/credits` endpoint to check remaining credits

**Operation Costs:**

| Operation       | Cost (Credits) |
|-----------------|----------------|
| Query (chat)    | 1              |
| Document Upload | 10             |
| Document Download | 2            |
| Document Delete | 1              |
| Search          | 1              |

**Implementation:**

```python
# backend/app/middleware/cost_limiter.py
from datetime import datetime
from redis.asyncio import Redis
from fastapi import HTTPException, Depends
from app.core.auth import get_current_user
from app.models.user import User

class CostBasedLimiter:
    """
    Rate limiting based on operation cost (credits).
    Each user gets credits that regenerate over time.
    """

    OPERATION_COSTS = {
        "query": 1,
        "upload": 10,
        "download": 2,
        "delete": 1,
        "search": 1
    }

    CREDITS_PER_HOUR = 100
    MAX_CREDITS = 200

    def __init__(self, redis: Redis):
        self.redis = redis

    async def check_credits(self, user_id: str, operation: str) -> bool:
        """
        Check if user has enough credits for operation.
        Implements token bucket algorithm with credit regeneration.

        Args:
            user_id: User ID
            operation: Operation type (query, upload, download, delete)

        Returns:
            True if user has enough credits, False otherwise
        """
        cost = self.OPERATION_COSTS.get(operation, 1)
        key = f"credits:{user_id}"

        # Get current credits and last update time
        data = await self.redis.hgetall(key)

        if not data:
            # Initialize credits
            current_credits = self.MAX_CREDITS
            last_update = datetime.utcnow()
        else:
            current_credits = float(data.get(b"credits", 0))
            last_update = datetime.fromisoformat(data[b"last_update"].decode())

        # Regenerate credits based on time elapsed
        now = datetime.utcnow()
        hours_elapsed = (now - last_update).total_seconds() / 3600
        regenerated = hours_elapsed * self.CREDITS_PER_HOUR
        current_credits = min(current_credits + regenerated, self.MAX_CREDITS)

        # Check if enough credits
        if current_credits < cost:
            return False

        # Deduct credits
        new_credits = current_credits - cost
        await self.redis.hset(key, mapping={
            "credits": new_credits,
            "last_update": now.isoformat()
        })
        await self.redis.expire(key, 86400)  # 24 hour expiry

        return True

    async def get_remaining_credits(self, user_id: str) -> float:
        """
        Get user's remaining credits with regeneration.

        Args:
            user_id: User ID

        Returns:
            Remaining credits (float)
        """
        key = f"credits:{user_id}"
        data = await self.redis.hgetall(key)

        if not data:
            return self.MAX_CREDITS

        current_credits = float(data.get(b"credits", 0))
        last_update = datetime.fromisoformat(data[b"last_update"].decode())

        # Regenerate credits
        now = datetime.utcnow()
        hours_elapsed = (now - last_update).total_seconds() / 3600
        regenerated = hours_elapsed * self.CREDITS_PER_HOUR

        return min(current_credits + regenerated, self.MAX_CREDITS)


# Dependency
cost_limiter = CostBasedLimiter(redis_client)

async def check_cost_limit(
    operation: str,
    current_user: User = Depends(get_current_user)
) -> None:
    """
    Dependency to check if user has enough credits for operation.

    Args:
        operation: Operation type (query, upload, download, delete)
        current_user: Authenticated user

    Raises:
        HTTPException: If user doesn't have enough credits
    """
    has_credits = await cost_limiter.check_credits(current_user.user_id, operation)

    if not has_credits:
        remaining = await cost_limiter.get_remaining_credits(current_user.user_id)
        required = cost_limiter.OPERATION_COSTS[operation]

        raise HTTPException(
            status_code=429,
            detail={
                "error": "rate_limit_exceeded",
                "message": "Insufficient credits for this operation",
                "remaining_credits": remaining,
                "required_credits": required,
                "retry_after": 3600  # Credits regenerate per hour
            }
        )
```

**Credits Endpoint:**

```python
# backend/app/api/v1/user.py
@router.get("/credits")
async def get_user_credits(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Get user's remaining credits.

    Returns:
        Remaining credits and regeneration info
    """
    remaining = await cost_limiter.get_remaining_credits(current_user.user_id)

    return {
        "remaining_credits": remaining,
        "max_credits": cost_limiter.MAX_CREDITS,
        "regeneration_rate": f"{cost_limiter.CREDITS_PER_HOUR} credits/hour",
        "operation_costs": cost_limiter.OPERATION_COSTS
    }
```

### Tasks to Implement

- [ ] Create `cost_limiter.py` module
- [ ] Implement `CostBasedLimiter` class
- [ ] Implement token bucket algorithm
- [ ] Add `check_cost_limit` dependency
- [ ] Apply to resource-intensive endpoints (chat, upload, download)
- [ ] Add `/credits` endpoint to user router
- [ ] Test credit deduction and regeneration
- [ ] Document credit system for users

---

## 15.5 Unified Rate Limiting Middleware

**PRD Reference:** Section 11.4 (Rate Limit Hierarchy)

**File:** `backend/app/middleware/unified_rate_limit.py` (NEW)

- [ ] Create unified middleware combining all 3 tiers
- [ ] Apply rate limits in order: IP → User → Cost
- [ ] Add rate limit headers to all responses
- [ ] Log rate limit violations
- [ ] Add metrics for rate limiting

**Unified Middleware:**

```python
# backend/app/middleware/unified_rate_limit.py
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.middleware.rate_limit import limiter
from app.middleware.cost_limiter import cost_limiter
from app.core.auth import get_user_from_token

class UnifiedRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Unified rate limiting middleware with hierarchy.

    Applies rate limits in order:
    1. IP-based (300/min)
    2. User-based (100/min)
    3. Cost-based (operation credits)
    """

    async def dispatch(self, request: Request, call_next):
        """
        Apply rate limiting hierarchy.
        """
        try:
            # 1. Check IP-based rate limit (handled by slowapi)
            # Already applied globally via limiter

            # 2. Check user-based rate limit (if authenticated)
            user = await get_user_from_token(request)
            if user:
                user_info = await user_rate_limiter.check_rate_limit(user.user_id)
                request.state.rate_limit_user = user_info

                # 3. Check cost-based rate limit
                # Applied per-endpoint via dependencies

            response = await call_next(request)

            # Add rate limit headers
            if hasattr(request.state, 'rate_limit_user'):
                info = request.state.rate_limit_user
                response.headers["X-RateLimit-Limit"] = str(info["limit"])
                response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
                response.headers["X-RateLimit-Reset"] = str(info["reset"])

            return response

        except HTTPException as e:
            # Re-raise rate limit exceptions
            raise
```

### Tasks to Implement

- [ ] Create unified middleware
- [ ] Integrate all 3 rate limit tiers
- [ ] Add rate limit headers to responses
- [ ] Log rate limit violations
- [ ] Add metrics (rate limit hit count)
- [ ] Test complete rate limiting flow

---

## 15.6 CORS Configuration

**PRD Reference:** Section 13.6 (CORS Configuration)

**File:** `backend/app/core/config.py`

- [ ] Add environment-specific CORS configuration
- [ ] Production: Restrict to frontend domain only
- [ ] Development: Allow localhost
- [ ] Configure allowed methods (GET, POST, PUT, DELETE)
- [ ] Configure allowed headers
- [ ] Configure credentials (cookies, JWT)

**CORS Implementation:**

```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI()

# CORS configuration - Environment-specific
if settings.ENVIRONMENT == "production":
    # Production: Only allow your actual frontend domain
    allowed_origins = [
        settings.FRONTEND_URL,  # e.g., "https://app.yourdomain.com"
    ]
else:
    # Development: Allow localhost and common dev ports
    allowed_origins = [
        "http://localhost:3000",
        "http://localhost:5173",  # Vite default
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,  # Allow cookies and JWT in headers
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],  # Allow all headers (Authorization, Content-Type, etc.)
    max_age=3600,  # Cache preflight requests for 1 hour
)
```

### Environment Variables

**File:** `backend/.env.example`

- [ ] Add `FRONTEND_URL` variable
- [ ] Document CORS configuration for production

```bash
# CORS
FRONTEND_URL=https://app.yourdomain.com  # Production frontend URL
```

### Tasks to Implement

- [ ] Add CORS middleware to `main.py`
- [ ] Configure environment-specific origins
- [ ] Add `FRONTEND_URL` to `.env.example`
- [ ] Test CORS from frontend (development)
- [ ] Document CORS configuration for production deployment

---

## 15.7 Security Headers

**PRD Reference:** Section 13.6 (Security Headers)

**File:** `backend/app/middleware/security_headers.py`

- [x] Verify `security_headers.py` exists (created in Phase 0)
- [ ] Enhance with all production security headers
- [ ] Add Content-Security-Policy (CSP)
- [ ] Add X-Frame-Options (prevent clickjacking)
- [ ] Add X-Content-Type-Options (prevent MIME sniffing)
- [ ] Add Referrer-Policy
- [ ] Add Permissions-Policy
- [ ] Test headers with securityheaders.com

**Security Headers Implementation:**

```python
# backend/app/middleware/security_headers.py
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Automatically add security headers to ALL responses.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Add security headers to response.
        """
        response = await call_next(request)

        # Content Security Policy (CSP)
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https://generativelanguage.googleapis.com; "
            "frame-ancestors 'none';"
        )

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions policy (disable unnecessary features)
        response.headers["Permissions-Policy"] = (
            "accelerometer=(), "
            "camera=(), "
            "geolocation=(), "
            "gyroscope=(), "
            "magnetometer=(), "
            "microphone=(), "
            "payment=(), "
            "usb=()"
        )

        # HSTS (HTTPS enforcement) - only in production
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains; preload"
            )

        return response
```

### Security Headers Explanation

- **Content-Security-Policy**: Prevents XSS attacks by restricting resource loading
- **X-Frame-Options**: Prevents clickjacking by disabling iframe embedding
- **X-Content-Type-Options**: Prevents MIME type sniffing
- **Referrer-Policy**: Controls referrer information sent with requests
- **Permissions-Policy**: Disables unnecessary browser features
- **Strict-Transport-Security**: Enforces HTTPS (production only)

### Tasks to Implement

- [ ] Enhance `security_headers.py` with all headers
- [ ] Add CSP configuration
- [ ] Add environment-specific HSTS (production only)
- [ ] Test headers with securityheaders.com
- [ ] Document security headers for developers

---

## 15.8 Input Validation & Sanitization

**File:** `backend/app/utils/sanitization.py`

- [x] Verify `sanitization.py` exists (created in Phase 0)
- [ ] Enhance with additional sanitization functions
- [ ] Add HTML escaping for user inputs
- [ ] Add SQL injection prevention (already handled by SQLModel)
- [ ] Add NoSQL injection prevention (Milvus queries)
- [ ] Add file path traversal prevention
- [ ] Add XSS prevention

**Enhanced Sanitization:**

```python
# backend/app/utils/sanitization.py
import re
from html import escape
from pathlib import Path

def sanitize_html(text: str) -> str:
    """
    Escape HTML characters to prevent XSS.

    Args:
        text: User input text

    Returns:
        HTML-escaped text
    """
    return escape(text)

def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal.

    Args:
        filename: User-provided filename

    Returns:
        Safe filename without path components
    """
    # Remove path separators
    filename = Path(filename).name

    # Remove dangerous characters
    filename = re.sub(r'[^\w\s\-\.]', '', filename)

    # Limit length
    if len(filename) > 255:
        filename = filename[:255]

    return filename

def sanitize_search_query(query: str) -> str:
    """
    Sanitize search query to prevent injection attacks.

    Args:
        query: User search query

    Returns:
        Sanitized query
    """
    # Remove special characters that could be injection vectors
    query = re.sub(r'[;\'"\\<>]', '', query)

    # Limit length
    if len(query) > 500:
        query = query[:500]

    return query.strip()
```

### Tasks to Implement

- [ ] Enhance `sanitization.py` with additional functions
- [ ] Apply HTML sanitization to user inputs
- [ ] Apply filename sanitization to uploads
- [ ] Apply query sanitization to search inputs
- [ ] Test sanitization with malicious inputs
- [ ] Document sanitization guidelines

---

## 15.9 Brute Force Protection

**File:** `backend/app/middleware/brute_force_protection.py` (NEW)

- [ ] Create brute force protection for login endpoint
- [ ] Track failed login attempts per IP
- [ ] Track failed login attempts per email
- [ ] Temporarily block after 5 failed attempts (15 minutes)
- [ ] Add CAPTCHA requirement after 3 failed attempts (optional)
- [ ] Log brute force attempts

**Implementation:**

```python
# backend/app/middleware/brute_force_protection.py
from redis.asyncio import Redis
from fastapi import HTTPException
import time

class BruteForceProtection:
    """
    Brute force protection for authentication endpoints.
    """

    def __init__(self, redis: Redis):
        self.redis = redis
        self.max_attempts = 5
        self.block_duration = 900  # 15 minutes

    async def check_attempts(self, identifier: str, attempt_type: str = "login") -> None:
        """
        Check if identifier (IP or email) has exceeded attempts.

        Args:
            identifier: IP address or email
            attempt_type: Type of attempt (login, password_reset)

        Raises:
            HTTPException: If attempts exceeded
        """
        key = f"brute_force:{attempt_type}:{identifier}"
        attempts = await self.redis.get(key)

        if attempts and int(attempts) >= self.max_attempts:
            ttl = await self.redis.ttl(key)
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "too_many_attempts",
                    "message": "Too many failed attempts. Please try again later.",
                    "retry_after": ttl
                }
            )

    async def record_attempt(self, identifier: str, attempt_type: str = "login") -> None:
        """
        Record a failed attempt.

        Args:
            identifier: IP address or email
            attempt_type: Type of attempt
        """
        key = f"brute_force:{attempt_type}:{identifier}"
        pipe = self.redis.pipeline()
        pipe.incr(key)
        pipe.expire(key, self.block_duration)
        await pipe.execute()

    async def reset_attempts(self, identifier: str, attempt_type: str = "login") -> None:
        """
        Reset attempts after successful login.

        Args:
            identifier: IP address or email
            attempt_type: Type of attempt
        """
        key = f"brute_force:{attempt_type}:{identifier}"
        await self.redis.delete(key)


# Usage in login endpoint
brute_force_protection = BruteForceProtection(redis_client)

@router.post("/auth/login")
async def login(
    request: Request,
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_session)
) -> LoginResponse:
    """
    Login with brute force protection.
    """
    ip = request.client.host
    email = credentials.email

    # Check attempts
    await brute_force_protection.check_attempts(ip, "login")
    await brute_force_protection.check_attempts(email, "login")

    # Attempt login
    user = await authenticate_user(db, credentials.email, credentials.password)

    if not user:
        # Record failed attempt
        await brute_force_protection.record_attempt(ip, "login")
        await brute_force_protection.record_attempt(email, "login")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Reset attempts on successful login
    await brute_force_protection.reset_attempts(ip, "login")
    await brute_force_protection.reset_attempts(email, "login")

    # Generate tokens
    ...
```

### Tasks to Implement

- [ ] Create `brute_force_protection.py` module
- [ ] Implement attempt tracking in Redis
- [ ] Apply to login endpoint
- [ ] Apply to password reset endpoint
- [ ] Test brute force protection
- [ ] Log brute force attempts
- [ ] Document protection mechanism

---

## 15.10 Security Testing

### Security Test Suite

**File:** `backend/tests/test_security.py` (NEW)

- [ ] Test rate limiting (IP, user, cost)
- [ ] Test CORS configuration
- [ ] Test security headers
- [ ] Test input sanitization
- [ ] Test brute force protection
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention
- [ ] Test authentication bypass attempts

**Test Examples:**

```python
# backend/tests/test_security.py
import pytest
from fastapi.testclient import TestClient

def test_ip_rate_limiting(client: TestClient):
    """Test IP-based rate limiting."""
    # Make 301 requests (exceeds 300/min limit)
    for i in range(301):
        if i < 300:
            response = client.get("/api/v1/health")
            assert response.status_code == 200
        else:
            response = client.get("/api/v1/health")
            assert response.status_code == 429

def test_user_rate_limiting(client: TestClient, auth_headers: dict):
    """Test user-based rate limiting."""
    # Make 101 requests (exceeds 100/min limit)
    for i in range(101):
        response = client.get("/api/v1/documents", headers=auth_headers)
        if i < 100:
            assert response.status_code in [200, 404]
        else:
            assert response.status_code == 429

def test_cost_based_limiting(client: TestClient, auth_headers: dict):
    """Test cost-based rate limiting."""
    # Make 11 uploads (exceeds 100 credits with 10/upload)
    for i in range(11):
        response = client.post(
            "/api/v1/documents/upload",
            headers=auth_headers,
            files={"file": ("test.txt", b"test content")}
        )
        if i < 10:
            assert response.status_code == 201
        else:
            assert response.status_code == 429

def test_xss_prevention(client: TestClient, auth_headers: dict):
    """Test XSS prevention in document titles."""
    malicious_title = "<script>alert('XSS')</script>"
    response = client.post(
        "/api/v1/documents",
        headers=auth_headers,
        json={"title": malicious_title}
    )
    # Title should be escaped
    assert "<script>" not in response.json()["title"]

def test_brute_force_protection(client: TestClient):
    """Test brute force protection on login."""
    # Try 6 failed logins
    for i in range(6):
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "wrong"}
        )
        if i < 5:
            assert response.status_code == 401
        else:
            assert response.status_code == 429

def test_security_headers(client: TestClient):
    """Test security headers are present."""
    response = client.get("/api/v1/health")
    assert "X-Frame-Options" in response.headers
    assert "X-Content-Type-Options" in response.headers
    assert "Content-Security-Policy" in response.headers
```

### Tasks to Implement

- [ ] Create `test_security.py`
- [ ] Write tests for all rate limiting tiers
- [ ] Write tests for security headers
- [ ] Write tests for input sanitization
- [ ] Write tests for brute force protection
- [ ] Run security tests: `uv run pytest tests/test_security.py`
- [ ] Achieve >90% coverage for security code

---

## 15.11 Security Documentation

### Security Best Practices Guide

**File:** `docs/SECURITY.md` (NEW)

- [ ] Create security documentation
- [ ] Document rate limiting configuration
- [ ] Document CORS configuration
- [ ] Document security headers
- [ ] Document input validation requirements
- [ ] Document secret management
- [ ] Document security update procedures
- [ ] Add security contact information

### Vulnerability Reporting

**File:** `SECURITY.md` (root)

- [ ] Create GitHub-standard security policy
- [ ] Add vulnerability reporting instructions
- [ ] Add security contact email
- [ ] Document response timeline
- [ ] Document supported versions

---

## ✅ Phase 15 Completion Checklist

**IMPORTANT: Verify Against PRD**
- [ ] **Cross-check rate limiting with PRD Section 11.4** (3-tier hierarchy)
- [ ] **Verify CORS configuration** (production vs development)
- [ ] **Test all security headers** (securityheaders.com)
- [ ] **Verify rate limits work** (IP, user, cost)
- [ ] **Test brute force protection** (login, password reset)

Before marking Phase 15 complete:
- [ ] IP-based rate limiting implemented (300/min)
- [ ] User-based rate limiting implemented (100/min)
- [ ] Cost-based rate limiting implemented (credit system)
- [ ] Unified rate limiting middleware working
- [ ] CORS configured (environment-specific)
- [ ] Security headers middleware enhanced
- [ ] Input sanitization enhanced
- [ ] Brute force protection implemented
- [ ] Security test suite created
- [ ] All security tests passing: `uv run pytest tests/test_security.py`
- [ ] Security documentation complete
- [ ] Vulnerability reporting process documented
- [ ] All tests passing: `uv run pytest`
- [ ] Linting passing: `uv run ruff check .`

**Security Readiness:** ⬜ Not Started / ⬜ In Progress / ⬜ Ready for Security Review / ⬜ Production Ready

---

**Next Steps:** Proceed to Phase 9 (Deployment) for production deployment
