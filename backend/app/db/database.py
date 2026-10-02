from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, async_sessionmaker, create_async_engine
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings

async_engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,
    pool_recycle=3600,
)

# Module-level session maker for background tasks
async_session_maker: async_sessionmaker[AsyncSession] = async_sessionmaker(
    bind=async_engine, class_=AsyncSession, expire_on_commit=False
)


async def check_connection() -> None:
    """
    Verify the database is reachable.

    Schema changes are applied by Alembic (`alembic upgrade head`), never at app startup, so
    two mechanisms cannot race to create the same table.

    Raises:
        Exception: If the database cannot be reached
    """
    async with async_engine.connect() as conn:
        await conn.execute(text("SELECT 1"))


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Provide a request-scoped async session for FastAPI dependencies.

    Usage in FastAPI:
        @router.get("/users")
        async def get_users(session: AsyncSession = Depends(get_session)):
            ...
    """
    async with async_session_maker() as session:
        yield session
