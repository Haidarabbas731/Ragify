import asyncio
import os
import sys
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.db.database import get_session
from app.middleware.rate_limit import RateLimitMiddleware
from app.models.user import User
from main import app

# Set environment variables for testing
os.environ["TESTING"] = "true"

# Fix Windows async event loop issues - must be set before any async operations
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Monkey-patch settings to disable INVITE_ONLY mode for tests
# Must be done after imports because settings is instantiated at module load

settings.INVITE_ONLY = False


def pytest_configure(config):
    """Configure pytest - set event loop policy early for Windows."""
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


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
            await conn.execute(
                text("DELETE FROM users WHERE email = :email"), {"email": email}
            )
        await conn.execute(text("DELETE FROM invite_codes WHERE code LIKE 'KB-TEST%'"))

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
            await conn.execute(
                text("DELETE FROM users WHERE email = :email"), {"email": email}
            )
        await conn.execute(text("DELETE FROM invite_codes WHERE code LIKE 'KB-TEST%'"))


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
    )
    session.add(admin)
    await session.flush()
    await session.refresh(admin)
    return admin


@pytest.fixture
async def test_invite_code(session: AsyncSession):
    """Create a test invite code for registration tests."""
    from app.models.invite_code import InviteCode

    invite = InviteCode(
        code="KB-TEST-1234-5678",
        created_by=None,
        max_uses=100,
        current_uses=0,
        status="active",
        description="Test invite code",
    )
    session.add(invite)
    await session.flush()
    await session.refresh(invite)
    return invite


@pytest.fixture
async def client(test_engine: AsyncEngine) -> AsyncGenerator[AsyncClient, None]:
    """HTTP client for testing API endpoints."""

    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        connection = await test_engine.connect()
        transaction = await connection.begin()
        session = AsyncSession(bind=connection, expire_on_commit=False)

        try:
            yield session
        finally:
            await session.close()
            await transaction.rollback()
            await connection.close()

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
                INSERT INTO users (user_id, email, password_hash, role, storage_used_bytes, storage_limit_bytes, status, is_active)
                VALUES (:user_id, :email, :password_hash, :role, :storage_used, :storage_limit, :status, :is_active)
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
            }
        )

    token = create_access_token({"sub": user_id})
    return {"Authorization": f"Bearer {token}"}
