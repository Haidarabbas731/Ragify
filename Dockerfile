# Use Python 3.12 slim image
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files
COPY backend/ ./backend/

# Set working directory to backend
WORKDIR /app/backend

# Install pip and uv
RUN pip install --upgrade pip && \
    pip install uv

# Install Python dependencies
RUN uv sync --frozen

# Expose port (Railway sets PORT env var)
EXPOSE 8000

# Default command (can be overridden by Procfile or Railway settings)
CMD ["sh", "-c", "uv run alembic upgrade head && uv run uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
