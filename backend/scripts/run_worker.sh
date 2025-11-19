#!/bin/bash

cd "$(dirname "$0")/.."

echo "Starting arq worker..."
uv run arq app.tasks.worker.WorkerSettings
