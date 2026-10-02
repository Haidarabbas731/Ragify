#!/bin/bash
# Runs everything in ONE container: Milvus Lite, the ARQ worker and the API.
#
# Milvus Lite allows one process per database file and its server only listens on
# 127.0.0.1, so the worker and the API must live in the same container as the Lite server.
# Used by docker-compose.lite.yml (local) and docker-compose.dokploy-lite.yml (Dokploy).
#
# Settings (environment):
#   MILVUS_LITE_PATH  database folder (default /app/milvus_data/ragify.db; keep it on a volume)
#   ARQ_WATCH         if set, the worker reloads when files in that folder change (dev only)
set -e

MILVUS_LITE_PATH="${MILVUS_LITE_PATH:-/app/milvus_data/ragify.db}"
URI_FILE=/tmp/milvus_lite_uri

# On stop, take every child process down with us
trap 'kill $(jobs -p) 2>/dev/null || true' TERM INT

rm -f "$URI_FILE"
echo "==> Starting Milvus Lite (${MILVUS_LITE_PATH})..."
python scripts/start_milvus_lite.py "$MILVUS_LITE_PATH" "$URI_FILE" &

for _ in $(seq 1 60); do
    [ -s "$URI_FILE" ] && break
    sleep 1
done
if [ ! -s "$URI_FILE" ]; then
    echo "==> ERROR: Milvus Lite did not start within 60 seconds."
    exit 1
fi
export VECTOR_DB_URI="$(cat "$URI_FILE")"
echo "==> Milvus Lite ready at ${VECTOR_DB_URI}"

echo "==> Starting ARQ worker..."
arq app.tasks.worker.WorkerSettings ${ARQ_WATCH:+--watch "$ARQ_WATCH"} &

bash ./scripts/start-api.sh &

# If any of the three exits, stop the rest and fail, so Docker restarts the container
# instead of leaving it running half-broken (for example without a worker).
status=0
wait -n || status=$?
echo "==> A service exited (status ${status}); stopping the container so it restarts."
kill $(jobs -p) 2>/dev/null || true
exit $(( status == 0 ? 1 : status ))
