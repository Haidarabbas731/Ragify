web: cd backend && uv run alembic upgrade head && uv run uvicorn main:app --host 0.0.0.0 --port $PORT
worker: cd backend && uv run arq app.tasks.worker.WorkerSettings
