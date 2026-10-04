import asyncio
import os
import sys
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

import pytest
from sqlalchemy import text
from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings


def _build_test_database_url(url: str) -> str:
    """Return the test database URL derived from the configured DATABASE_URL.

    Uses TEST_DATABASE_URL when set; otherwise appends ``_test`` to the database name
    (``knowledge_base`` -> ``knowledge_base_test``).
    """
    explicit = os.environ.get("TEST_DATABASE_URL")
    if explicit:
        return explicit
    parsed = make_url(url)
    name = parsed.database or "knowledge_base"
    if not name.endswith("_test"):
        name = f"{name}_test"
    return parsed.set(database=name).render_as_string(hide_password=False)


# Point the whole app (engine, session maker, background tasks) at a dedicated test
# database BEFORE any module that builds an engine from settings is imported, so tests
# can never touch the development database.
settings.DATABASE_URL = _build_test_database_url(settings.DATABASE_URL)

from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.db.database import get_session  # noqa: E402
from app.middleware.rate_limit import RateLimitMiddleware  # noqa: E402
from app.models.user import User  # noqa: E402
from main import app  # noqa: E402

# Set environment variables for testing
os.environ["TESTING"] = "true"

# Fix Windows async event loop issues - must be set before any async operations
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Never send real email from tests: backend/.env holds a live Resend key.
# Must be done after imports because settings is instantiated at module load.
settings.RESEND_API_KEY = ""

# The per-IP limits count in Redis for an hour, so repeated runs would trip them. The limit
# tests set their own small values.
settings.REGISTER_LIMIT_PER_IP_PER_HOUR = 10**6
settings.VERIFY_ATTEMPTS_PER_IP_PER_HOUR = 10**6
settings.RESEND_LIMIT_PER_IP_PER_HOUR = 10**6


async def _recreate_test_database() -> None:
    """Drop (if present) and recreate the test database so every run starts clean."""
    target = make_url(settings.DATABASE_URL)
    db_name = target.database
    if not db_name or not db_name.endswith("_test"):
        raise RuntimeError(f"Refusing to run tests against non-test database: {db_name!r}")

    admin_engine = create_async_engine(
        target.set(database="postgres"),
        isolation_level="AUTOCOMMIT",
        poolclass=NullPool,
    )
    try:
        async with admin_engine.connect() as conn:
            await conn.execute(text(f'DROP DATABASE IF EXISTS "{db_name}" WITH (FORCE)'))
            await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    finally:
        await admin_engine.dispose()


def pytest_configure(config):
    """Configure pytest - set event loop policy early for Windows and reset the test DB."""
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(_recreate_test_database())


@pytest.fixture(scope="function")
async def test_engine() -> AsyncGenerator[AsyncEngine, None]:
    """Create a test database engine with proper cleanup.

    Uses NullPool to avoid event loop issues on Windows.
    Each test gets a fresh engine to prevent 'attached to different loop' errors.
    """
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=False,
        poolclass=NullPool,  # Disable connection pooling to avoid event loop issues
    )

    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    yield engine

    await engine.dispose()


@pytest.fixture(scope="function", autouse=True)  # Auto-cleanup between tests
async def cleanup_test_data(test_engine: AsyncEngine):
    """Clean up test data before and after each test - only removes test emails."""
    test_emails = [
        "test@example.com",
        "duplicate@example.com",
        "weak@example.com",
        "weakpass@example.com",
        "create@example.com",
        "newuser@example.com",
        "newemail@example.com",
        "other@example.com",
        "logintest@example.com",
        "wrongpass@example.com",
        "refreshtest@example.com",
        "logouttest@example.com",
        "resetpass@example.com",
        "user@example.com",
        "admin@example.com",
    ]

    async with test_engine.begin() as conn:
        # Delete in correct order to respect foreign key constraints
        await conn.execute(
            text(
                "DELETE FROM conversations WHERE user_id IN (SELECT user_id FROM users WHERE email = ANY(:emails))"
            ),
            {"emails": test_emails},
        )
        await conn.execute(
            text(
                "DELETE FROM documents WHERE user_id IN (SELECT user_id FROM users WHERE email = ANY(:emails))"
            ),
            {"emails": test_emails},
        )
        await conn.execute(
            text(
                "DELETE FROM collections WHERE user_id IN (SELECT user_id FROM users WHERE email = ANY(:emails))"
            ),
            {"emails": test_emails},
        )
        for email in test_emails:
            await conn.execute(text("DELETE FROM users WHERE email = :email"), {"email": email})

    yield

    async with test_engine.begin() as conn:
        # Delete in correct order to respect foreign key constraints
        await conn.execute(
            text(
                "DELETE FROM conversations WHERE user_id IN (SELECT user_id FROM users WHERE email = ANY(:emails))"
            ),
            {"emails": test_emails},
        )
        await conn.execute(
            text(
                "DELETE FROM documents WHERE user_id IN (SELECT user_id FROM users WHERE email = ANY(:emails))"
            ),
            {"emails": test_emails},
        )
        await conn.execute(
            text(
                "DELETE FROM collections WHERE user_id IN (SELECT user_id FROM users WHERE email = ANY(:emails))"
            ),
            {"emails": test_emails},
        )
        for email in test_emails:
            await conn.execute(text("DELETE FROM users WHERE email = :email"), {"email": email})


@pytest.fixture
async def session(test_engine: AsyncEngine) -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session with transaction rollback."""
    async with test_engine.connect() as connection:
        async with connection.begin() as transaction:
            session = AsyncSession(
                bind=connection,
                expire_on_commit=False,
                join_transaction_mode="create_savepoint",  # Use savepoints for nested transactions
            )

            yield session

            await session.close()
            await transaction.rollback()


@pytest.fixture
async def sample_user(session: AsyncSession) -> User:
    """Create a sample user with properly hashed password."""
    from app.core.security import hash_password

    user = User(
        email="test@example.com",
        password_hash=hash_password("TestPassword123!"),
        role="user",
        email_verified_at=datetime.now(UTC),
    )
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


@pytest.fixture
async def sample_admin(session: AsyncSession) -> User:
    """Create a sample admin user with properly hashed password."""
    from app.core.security import hash_password

    admin = User(
        email="admin@example.com",
        password_hash=hash_password("AdminPassword123!"),
        role="admin",
        email_verified_at=datetime.now(UTC),
    )
    session.add(admin)
    await session.flush()
    await session.refresh(admin)
    return admin


@pytest.fixture
async def client(test_engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client for testing API endpoints."""

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        # A normal session per request that really commits, so flows spanning several
        # requests (register then login) see each other's data. The autouse
        # cleanup_test_data fixture empties the tables between tests.
        async with AsyncSession(test_engine, expire_on_commit=False) as session:
            yield session

    app.dependency_overrides[get_session] = override_get_session

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:  # type: ignore
        yield ac

    # Cleanup: Close Redis connection in middleware if it exists
    # This prevents "Future attached to a different loop" errors on Windows
    try:
        # Access middleware instance through app's middleware stack
        # Starlette stores middleware instances in app.middleware_stack
        # We need to traverse the middleware stack to find RateLimitMiddleware
        middleware_stack = getattr(app, "middleware_stack", None)
        if middleware_stack:
            # Try to find and close Redis connection in RateLimitMiddleware
            # The middleware stack is a chain, we need to traverse it
            current = middleware_stack
            while hasattr(current, "app"):
                if hasattr(current, "cls") and current.cls == RateLimitMiddleware:
                    # Found the middleware, try to access its instance
                    if hasattr(current, "dispatch"):
                        # The dispatch function is bound to the middleware instance
                        # We can't directly access it, so we'll reset via a different method
                        pass
                current = getattr(current, "app", None)
                if current is None:
                    break
    except Exception:
        pass  # Ignore cleanup errors

    app.dependency_overrides.clear()


@pytest.fixture
async def auth_headers(test_engine: AsyncEngine) -> dict:
    """Create auth headers with valid JWT token for sample user.

    Creates a user directly in the test database so it's available
    across different session scopes (for use with client fixture).
    """
    import uuid

    from app.core.security import create_access_token, hash_password

    # Generate UUID for the user
    user_id = str(uuid.uuid4())

    # Create user directly in database (committed transaction)
    async with test_engine.begin() as conn:
        await conn.execute(
            text("""
                INSERT INTO users (user_id, email, password_hash, role, storage_used_bytes, storage_limit_bytes, status, is_active, created_at, updated_at, email_verified_at)
                VALUES (:user_id, :email, :password_hash, :role, :storage_used, :storage_limit, :status, :is_active, :now, :now, :now)
                ON CONFLICT (email) DO UPDATE SET
                    password_hash = EXCLUDED.password_hash,
                    user_id = EXCLUDED.user_id,
                    storage_used_bytes = EXCLUDED.storage_used_bytes,
                    is_active = EXCLUDED.is_active
            """),
            {
                "user_id": user_id,
                "email": "test@example.com",
                "password_hash": hash_password("TestPassword123!"),
                "role": "user",
                "storage_used": 0,
                "storage_limit": 1073741824,  # 1GB default
                "status": "active",
                "is_active": True,
                "now": datetime.now(UTC),
            },
        )

    token = create_access_token({"sub": user_id})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def agen():
    """Build an async iterator over the given items (stands in for a streamed response)."""

    async def _agen(*items):
        for item in items:
            yield item

    return _agen


@pytest.fixture
def mark_verified(test_engine: AsyncEngine):
    """Mark a registered account's email as verified, as if its code had been entered."""

    async def _mark(email: str) -> None:
        async with test_engine.begin() as conn:
            await conn.execute(
                text("UPDATE users SET email_verified_at = :now WHERE email = :email"),
                {"now": datetime.now(UTC), "email": email},
            )

    return _mark
