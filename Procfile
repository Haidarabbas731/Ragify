web: uv run --directory backend alembic upgrade head && uv run --directory backend uvicorn main:app --host 0.0.0.0 --port $PORT
worker: uv run --directory backend arq app.tasks.worker.WorkerSettings
