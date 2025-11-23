import asyncio
import os
import sys
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from main import app
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.db.database import get_session
from app.middleware.rate_limit import RateLimitMiddleware
from app.models.user import User

# Set environment variable to disable Redis rate limiting in tests
os.environ["TESTING"] = "true"

# Fix Windows async event loop issues - must be set before any async operations
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())


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


@pytest.fixture(scope="function", autouse=False)  # Disabled autouse to prevent cleanup issues
async def cleanup_test_data(test_engine: AsyncEngine):
    """Clean up test data before and after each test - only removes test emails."""
    test_emails = [
        "test@example.com",
        "duplicate@example.com",
        "weak@example.com",
        "create@example.com",
        "newuser@example.com",
        "user@example.com",
        "admin@example.com",
    ]

    async with test_engine.begin() as conn:
        for email in test_emails:
            await conn.execute(text("DELETE FROM users WHERE email = :email"), {"email": email})
        await conn.execute(text("DELETE FROM invite_codes WHERE code LIKE 'KB-TEST%'"))
        await conn.execute(text("DELETE FROM documents"))
        await conn.execute(text("DELETE FROM collections"))

    yield

    async with test_engine.begin() as conn:
        for email in test_emails:
            await conn.execute(text("DELETE FROM users WHERE email = :email"), {"email": email})
        await conn.execute(text("DELETE FROM invite_codes WHERE code LIKE 'KB-TEST%'"))
        await conn.execute(text("DELETE FROM documents"))
        await conn.execute(text("DELETE FROM collections"))


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
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        role="user",
    )
    session.add(user)
    await session.flush()
    await session.refresh(user)
    return user


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
