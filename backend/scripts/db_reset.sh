#!/bin/bash

cd "$(dirname "$0")/.."

echo "WARNING: This will drop and recreate the database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

echo "Dropping all tables..."
uv run alembic downgrade base

echo "Running migrations..."
uv run alembic upgrade head

echo "Database reset complete!"
