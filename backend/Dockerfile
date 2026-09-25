# Choose your preferred base Python image
FROM python:3.12-slim-bookworm

WORKDIR /app

# Best updated & highly optimized method to copy the latest uv binary
COPY --from=ghcr.io/astral-sh/uv:0.12.13 /uv /usr/local/bin/uv

# Optimize container startup times by compiling .py files to .pyc bytecode
ENV UV_COMPILE_BYTECODE=1

# Cache mount and .venv are on different filesystems; avoid failed hardlink attempts
ENV UV_LINK_MODE=copy

# libmagic1 is required by python-magic
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

# Non-root user for security
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup -s /bin/bash appuser

# Copy dependency files first to maximize Docker layer caching
COPY pyproject.toml uv.lock ./

# Install production deps only, using an explicit cache mount to speed up subsequent image rebuilds
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# Put venv on PATH so scripts can call uvicorn/alembic/arq directly
ENV PATH="/app/.venv/bin:$PATH"

# Copy application source
COPY --chown=appuser:appgroup . .

# Make startup scripts executable
RUN chmod +x scripts/start-api.sh scripts/start-worker.sh

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${PORT:-8000}/api/v1/health')" || exit 1

# Default to the API process; the worker service overrides this via `command:` in compose.
CMD ["./scripts/start-api.sh"]
