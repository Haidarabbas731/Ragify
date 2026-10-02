"""
Unit tests for the system state key-value store.
"""

from contextlib import asynccontextmanager
from unittest.mock import patch

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.services.system_state_service import get_state, set_state


@pytest.fixture
def use_test_session(session: AsyncSession):
    """Run the service on the test session (rolled back after the test)."""

    @asynccontextmanager
    async def maker():
        yield session

    with patch("app.services.system_state_service.async_session_maker", maker):
        yield


@pytest.mark.asyncio
async def test_unknown_key_is_none(use_test_session):
    """A key that was never set reads as None."""
    assert await get_state("never-set") is None


@pytest.mark.asyncio
async def test_set_then_get_and_overwrite(use_test_session):
    """Values round-trip, and setting a key again replaces its value."""
    await set_state("embedding_fingerprint", "embed-v4.0:1024")
    assert await get_state("embedding_fingerprint") == "embed-v4.0:1024"

    await set_state("embedding_fingerprint", "other:768")
    assert await get_state("embedding_fingerprint") == "other:768"
