from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from sqlalchemy import text

from app.api.exceptions import register_exception_handlers
from app.api.v1 import auth, chat, collections, conversations, documents, users
from app.api.v1.admin import audit_logs, invite_codes
from app.api.v1.admin import documents as admin_documents
from app.api.v1.admin import users as admin_users
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.database import async_engine, init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.size_limit import RequestSizeLimitMiddleware
from app.schemas.common import HealthCheckResponse, RootResponse
from app.services.b2_service import B2Service
from app.services.email_service import check_email_service_health

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
    description="AI-powered knowledge base chat system with RAG. Upload documents, organize collections, and chat with your data using Google Gemini.",
    version="1.0.0",
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
    expose_headers=[
        "Content-Type",
        "Cache-Control",
        "X-Accel-Buffering",
    ],  # Required for SSE (Server-Sent Events) - only expose necessary headers
)


@app.get("/api/v1/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint to verify API and all services are running."""
    services = {
        "api": "up",
        "database": "down",
        "redis": "down",
        "b2_storage": "down",
        "milvus": "down",
        "email": "down",
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
        from app.services.milvus_service import get_milvus_service
        milvus = await get_milvus_service()
        milvus.client.has_collection(settings.MILVUS_COLLECTION)  # type: ignore
        services["milvus"] = "up"
    except Exception:
        pass

    # Check Email Service (Resend)
    try:
        email_health = await check_email_service_health()
        services["email"] = email_health["status"]
    except Exception:
        pass

    overall_status = (
        "healthy" if all(s == "up" for s in services.values()) else "degraded"
    )

    return {
        "status": overall_status,
        "services": services,
        "app_info": {
            "app_name": settings.APP_NAME,
            "environment": settings.ENVIRONMENT,
        },
        "arq_worker": arq_stats,
    }


# Register API routes
app.include_router(auth.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")
app.include_router(collections.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")

# Admin routes
app.include_router(admin_documents.router, prefix="/api/v1")
app.include_router(admin_users.router, prefix="/api/v1")
app.include_router(audit_logs.router, prefix="/api/v1")
app.include_router(invite_codes.router, prefix="/api/v1/admin")


@app.get("/ping")
async def ping():
    """Lightweight liveness check — use this for uptime cron jobs."""
    return {"status": "ok"}


@app.get("/", response_model=RootResponse)
async def root():
    """Root endpoint."""
    return {
        "message": "Ragify API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
