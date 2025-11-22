"""ARQ worker configuration for background task processing.

Handles document processing, cleanup jobs, and orphaned job recovery.
"""

from urllib.parse import urlparse

from arq import ArqRedis, create_pool
from arq.connections import RedisSettings

from app.core.config import settings


def _parse_redis_settings() -> RedisSettings:
    """
    Parse Redis URL from settings into RedisSettings.

    Returns:
        RedisSettings instance
    """
    parsed = urlparse(settings.REDIS_URL)

    # Extract host and port
    host = parsed.hostname or "localhost"
    port = parsed.port or 6379

    # Extract database from path (e.g., /0, /1)
    database = 0
    if parsed.path and len(parsed.path) > 1:
        try:
            database = int(parsed.path.lstrip("/"))
        except ValueError:
            database = 0

    # Extract password from URL
    password = parsed.password or settings.REDIS_PASSWORD

    return RedisSettings(
        host=host,
        port=port,
        password=password,
        database=database,
    )


async def get_arq_redis() -> ArqRedis:
    """
    Get ARQ Redis connection for enqueueing jobs.

    Returns:
        ARQ Redis connection pool

    Raises:
        ConnectionError: If Redis connection fails
    """
    redis = await create_pool(_parse_redis_settings())
    return redis


class WorkerSettings:
    """
    ARQ worker settings for background job processing.

    Configuration follows PRD Section 11.3:
    - max_jobs: 10 concurrent jobs
    - job_timeout: 3600 seconds (1 hour)
    - max_tries: 3 retry attempts
    - Redis connection from settings
    """

    redis_settings = _parse_redis_settings()

    # Worker configuration
    max_jobs = 10
    job_timeout = 3600  # 1 hour
    max_tries = 3
    retry_jobs = True

    # Task functions - imported here to ensure they're registered
    @staticmethod
    def functions():
        """Import and return task functions to avoid circular imports."""
        from app.tasks.document_processing import process_document

        return [process_document]

    # Cron jobs for scheduled tasks
    cron_jobs = []
