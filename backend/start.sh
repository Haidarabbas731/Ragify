#!/bin/bash
set -e

if command -v alembic > /dev/null 2>&1; then
    echo "==> Running database migrations..."
    if ! alembic upgrade head; then
        echo "==> ERROR: Migrations failed. Check DATABASE_URL is set correctly."
        echo "==> DATABASE_URL host: $(echo $DATABASE_URL | sed 's/.*@//' | cut -d'/' -f1)"
        exit 1
    fi
else
    echo "==> Alembic not found in PATH, skipping migrations"
fi

echo "==> Seeding admin user..."
PYTHONPATH=/app python scripts/seed_admin.py

echo "==> Starting ARQ worker..."
arq app.tasks.worker.WorkerSettings &
WORKER_PID=$!

echo "==> Starting API server on port ${PORT:-8000}..."
uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}" &
SERVER_PID=$!

wait -n $WORKER_PID $SERVER_PID
EXIT_CODE=$?

kill $WORKER_PID $SERVER_PID 2>/dev/null || true
exit $EXIT_CODE
