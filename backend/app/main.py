from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from redis.asyncio import Redis
from sqlalchemy import text

from app.api.exceptions import register_exception_handlers
from app.core.config import settings
from app.core.logging import configure_logging
from app.db.database import async_engine, init_db
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.size_limit import RequestSizeLimitMiddleware

configure_logging(log_level=settings.LOG_LEVEL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database on startup."""
    await init_db()
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
app.middleware("http")(RateLimitMiddleware(app))

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
    }

    try:
        async with async_engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            services["database"] = "up"
    except Exception:
        pass

    try:
        redis = Redis.from_url(settings.REDIS_URL, decode_responses=True)
        await redis.ping()
        await redis.aclose()
        services["redis"] = "up"
    except Exception:
        pass

    overall_status = "healthy" if all(s == "up" for s in services.values()) else "degraded"

    return {
        "status": overall_status,
        "app_name": settings.APP_NAME,
        "environment": settings.ENVIRONMENT,
        "services": services,
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Knowledge Base API",
        "docs": "/docs",
        "health": "/api/v1/health"
    }
