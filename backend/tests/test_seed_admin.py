"""
Unit tests for scripts/seed_admin.py: first-run seeding and the password reset option.
"""

import importlib.util
from contextlib import asynccontextmanager
from pathlib import Path
from unittest.mock import patch

import pytest
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.user import User

spec = importlib.util.spec_from_file_location(
    "seed_admin", Path(__file__).resolve().parents[1] / "scripts" / "seed_admin.py"
)
seed_admin_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(seed_admin_module)
seed_admin = seed_admin_module.seed_admin

EMAIL = "seed-admin@example.com"


@pytest.fixture(autouse=True)
def admin_settings(session: AsyncSession):
    """Run the script on the test session with known admin settings."""

    @asynccontextmanager
    async def maker():
        yield session

    with (
        patch.object(settings, "ADMIN_EMAIL", EMAIL),
        patch.object(settings, "ADMIN_PASSWORD", "New-Admin-Pass-1"),
        patch.object(seed_admin_module, "async_session_maker", maker),
    ):
        yield


async def get_admin(session: AsyncSession) -> User | None:
    """The seeded admin, if it exists."""
    return (await session.exec(select(User).where(User.email == EMAIL))).first()


@pytest.mark.asyncio
async def test_creates_the_admin_when_missing(session: AsyncSession):
    """First run: the admin is created with the configured password."""
    await seed_admin()

    admin = await get_admin(session)
    assert admin.role == "admin"
    assert admin.is_active is True
    assert verify_password("New-Admin-Pass-1", admin.password_hash)


@pytest.mark.asyncio
async def test_an_existing_admin_keeps_its_old_password_by_default(session: AsyncSession):
    """Later runs never change an existing admin (this is why a changed env var had no effect)."""
    session.add(User(email=EMAIL, password_hash=hash_password("Old-Pass-1"), role="admin"))
    await session.flush()

    await seed_admin()

    admin = await get_admin(session)
    assert verify_password("Old-Pass-1", admin.password_hash)
    assert not verify_password("New-Admin-Pass-1", admin.password_hash)


@pytest.mark.asyncio
async def test_reset_password_sets_it_from_the_environment_and_reactivates(session: AsyncSession):
    """--reset-password recovers a locked-out admin: new password, admin role, active again."""
    session.add(
        User(
            email=EMAIL,
            password_hash=hash_password("Old-Pass-1"),
            role="user",
            status="suspended",
            is_active=False,
        )
    )
    await session.flush()

    await seed_admin(reset_password=True)

    admin = await get_admin(session)
    assert verify_password("New-Admin-Pass-1", admin.password_hash)
    assert (admin.role, admin.status, admin.is_active) == ("admin", "active", True)


@pytest.mark.asyncio
async def test_reset_password_creates_the_admin_if_it_does_not_exist(session: AsyncSession):
    """Resetting on a database without that admin simply creates it."""
    await seed_admin(reset_password=True)

    assert verify_password("New-Admin-Pass-1", (await get_admin(session)).password_hash)


@pytest.mark.asyncio
@pytest.mark.parametrize("missing", ["ADMIN_EMAIL", "ADMIN_PASSWORD"])
async def test_nothing_happens_without_admin_settings(session: AsyncSession, missing):
    """Without ADMIN_EMAIL or ADMIN_PASSWORD the script does nothing."""
    with patch.object(settings, missing, ""):
        await seed_admin(reset_password=True)

    assert await get_admin(session) is None
