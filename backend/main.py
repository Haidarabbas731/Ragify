from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymilvus import connections, utility
from redis.asyncio import Redis
from sqlalchemy import text

from app.api.exceptions import register_exception_handlers
from app.api.v1 import auth, documents
from app.api.v1.admin import invite_codes, system_cleanup
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.database import async_engine, init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.size_limit import RequestSizeLimitMiddleware
from app.services.b2_service import B2Service

configure_logging(log_level=settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    import logging
    import os

    from redis.asyncio import Redis

    logger = logging.getLogger(__name__)

    db_available = False
    redis_available = False

    try:
        await init_db()
        db_available = True
        logger.info("✓ Database connection established")
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        logger.error("  → Make sure PostgreSQL is running")
        logger.error(
            f"  → Connection string: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL}"
        )

    try:
        redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis.ping()
        await redis.aclose()
        redis_available = True
        logger.info("✓ Redis connection established")
    except Exception as e:
        logger.error(f"✗ Redis connection failed: {e}")
        logger.error("  → Make sure Redis is running")

    if not db_available or not redis_available:
        logger.error("\n" + "=" * 60)
        logger.error("STARTUP FAILED: Required services are unavailable")
        logger.error("=" * 60)
        if not db_available:
            logger.error("• PostgreSQL is not running or not accessible")
        if not redis_available:
            logger.error("• Redis is not running or not accessible")
        logger.error("\nPlease start the required services and try again.")
        logger.error("=" * 60 + "\n")
        os._exit(1)

    yield


app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    lifespan=lifespan,
)

# Register exception handlers
register_exception_handlers(app)

# Security middleware (order matters!)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestSizeLimitMiddleware)
app.add_middleware(RateLimitMiddleware)  # type:ignore

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint to verify API and all services are running."""
    services = {
        "api": "up",
        "database": "down",
        "redis": "down",
        "b2_storage": "down",
        "milvus": "down",
    }

    arq_stats = {
        "pending_tasks": 0,
        "failed_tasks_24h": 0,
    }

    # Check PostgreSQL
    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            services["database"] = "up"
    except Exception:
        pass

    # Check Redis
    try:
        redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis.ping()
        services["redis"] = "up"

        # Get ARQ worker stats
        try:
            pending = await redis.llen("arq:queue")  # type: ignore
            arq_stats["pending_tasks"] = pending

            failed_key = "arq:failed_tasks_24h"
            failed = await redis.get(failed_key)
            arq_stats["failed_tasks_24h"] = int(failed) if failed else 0
        except Exception:
            pass

        await redis.aclose()
    except Exception:
        pass

    # Check Backblaze B2
    try:
        b2_service = B2Service()
        await b2_service.authorize()
        services["b2_storage"] = "up"
    except Exception:
        pass

    # Check Milvus
    try:
        connections.connect(
            alias="health_check",
            uri=settings.MILVUS_URI,
            token=settings.MILVUS_TOKEN,  # type: ignore
        )
        # Check if collection exists as a health check
        utility.has_collection(settings.MILVUS_COLLECTION, using="health_check")
        services["milvus"] = "up"
        connections.disconnect(alias="health_check")
    except Exception:
        try:
            connections.disconnect(alias="health_check")
        except Exception:
            pass

    overall_status = "healthy" if all(s == "up" for s in services.values()) else "degraded"

    return {
        "status": overall_status,
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "services": services,
        "arq_worker": arq_stats,
    }


# Register API routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(system_cleanup.router, prefix="/api/v1")
app.include_router(invite_codes.router, prefix="/api/v1/admin")


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Knowledge Base API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
