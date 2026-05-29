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

# Start Milvus Lite only when using a local .db path (not an HTTP URI)
if [[ "$VECTOR_DB_URI" != http* ]]; then
    echo "==> Starting Milvus Lite server..."
    MILVUS_URI_FILE=/tmp/milvus_lite_uri
    rm -f "$MILVUS_URI_FILE"

    PYTHONPATH=/app python scripts/start_milvus_lite.py "$VECTOR_DB_URI" "$MILVUS_URI_FILE" &
    MILVUS_PID=$!

    # Wait up to 30s for Milvus Lite to write its URI
    for i in $(seq 1 30); do
        [ -f "$MILVUS_URI_FILE" ] && break
        sleep 1
    done

    if [ ! -f "$MILVUS_URI_FILE" ]; then
        echo "==> ERROR: Milvus Lite failed to start within 30s"
        exit 1
    fi

    export VECTOR_DB_URI=$(cat "$MILVUS_URI_FILE")
    echo "==> Milvus Lite ready at: $VECTOR_DB_URI"
fi

echo "==> Starting ARQ worker..."
arq app.tasks.worker.WorkerSettings &
WORKER_PID=$!

echo "==> Starting API server on port ${PORT:-8000}..."
if [[ "$ENVIRONMENT" == "development" ]]; then
    uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}" --reload --reload-dir /app/app --reload-dir /app/main.py &
else
    uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}" &
fi
SERVER_PID=$!

wait -n $WORKER_PID $SERVER_PID
EXIT_CODE=$?

kill $WORKER_PID $SERVER_PID 2>/dev/null || true
exit $EXIT_CODE
