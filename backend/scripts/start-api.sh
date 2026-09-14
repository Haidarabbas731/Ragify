#!/bin/bash
set -e

echo "==> Running database migrations..."
if ! alembic upgrade head; then
    echo "==> ERROR: Migrations failed. Check DATABASE_URL is set correctly."
    echo "==> DATABASE_URL host: $(echo $DATABASE_URL | sed 's/.*@//' | cut -d'/' -f1)"
    exit 1
fi

echo "==> Seeding admin user..."
PYTHONPATH=/app python scripts/seed_admin.py

echo "==> Starting API server on port ${PORT:-8000}..."
if [[ "$ENVIRONMENT" == "development" ]]; then
    exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}" --reload --reload-dir /app/app --reload-dir /app/main.py
else
    exec uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
fi
