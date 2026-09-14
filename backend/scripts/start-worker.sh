#!/bin/bash
set -e

echo "==> Starting ARQ worker..."
exec arq app.tasks.worker.WorkerSettings
