"""
Unit tests for the database startup check. Tables are created by Alembic only.
"""

from unittest.mock import MagicMock, patch

import pytest
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine

import main
from app.db import database
from app.db.database import check_connection


@pytest.mark.asyncio
async def test_check_connection_succeeds_against_a_reachable_database(test_engine: AsyncEngine):
    """A reachable database passes the check."""
    with patch.object(database, "async_engine", test_engine):
        await check_connection()


@pytest.mark.asyncio
async def test_check_connection_raises_when_the_database_is_unreachable():
    """An unreachable database raises so startup can report it."""
    broken = MagicMock()
    broken.connect.side_effect = ConnectionRefusedError("down")

    with patch.object(database, "async_engine", broken), pytest.raises(ConnectionRefusedError):
        await check_connection()


@pytest.mark.asyncio
async def test_check_connection_does_not_create_tables(test_engine: AsyncEngine):
    """Startup must never create tables: that is Alembic's job, and two creators race."""
    async with test_engine.begin() as conn:
        await conn.execute(text("DROP TABLE IF EXISTS system_state"))

    with patch.object(database, "async_engine", test_engine):
        await check_connection()

    async with test_engine.connect() as conn:
        exists = await conn.scalar(text("SELECT to_regclass('public.system_state')"))
    assert exists is None


def test_the_app_startup_uses_the_connection_check_not_table_creation():
    """main.py wires check_connection and no longer imports a table-creating init."""
    assert main.check_connection is check_connection
    assert not hasattr(main, "init_db")
    assert not hasattr(database, "init_db")
