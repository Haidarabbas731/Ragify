"""
Unit tests for scripts/seed_admin.py: creating the admin and keeping its password in sync.
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
async def test_a_changed_admin_password_is_synced_on_the_next_start(session: AsyncSession):
    """If ADMIN_PASSWORD differs from the stored password, the stored one is replaced."""
    session.add(User(email=EMAIL, password_hash=hash_password("Old-Pass-1"), role="admin"))
    await session.flush()

    await seed_admin()

    admin = await get_admin(session)
    assert verify_password("New-Admin-Pass-1", admin.password_hash)
    assert not verify_password("Old-Pass-1", admin.password_hash)


@pytest.mark.asyncio
async def test_an_up_to_date_admin_is_left_completely_untouched(session: AsyncSession, capsys):
    """When the password already matches nothing is rehashed or written."""
    original = hash_password("New-Admin-Pass-1")
    session.add(User(email=EMAIL, password_hash=original, role="admin"))
    await session.flush()

    await seed_admin()

    assert (await get_admin(session)).password_hash == original
    assert "already up to date" in capsys.readouterr().out


@pytest.mark.asyncio
async def test_syncing_the_password_does_not_change_role_or_status(session: AsyncSession):
    """Only the password is synced by default; a demoted or suspended account stays as it is."""
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

    await seed_admin()

    admin = await get_admin(session)
    assert verify_password("New-Admin-Pass-1", admin.password_hash)
    assert (admin.role, admin.status, admin.is_active) == ("user", "suspended", False)


@pytest.mark.asyncio
async def test_restore_access_makes_the_account_an_active_admin_again(session: AsyncSession):
    """--restore-access recovers a demoted or suspended admin as well as syncing the password."""
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

    await seed_admin(restore_access=True)

    admin = await get_admin(session)
    assert verify_password("New-Admin-Pass-1", admin.password_hash)
    assert (admin.role, admin.status, admin.is_active) == ("admin", "active", True)


@pytest.mark.asyncio
async def test_restore_access_creates_the_admin_if_it_does_not_exist(session: AsyncSession):
    """On a database without that admin the flag simply creates it."""
    await seed_admin(restore_access=True)

    assert verify_password("New-Admin-Pass-1", (await get_admin(session)).password_hash)


@pytest.mark.asyncio
@pytest.mark.parametrize("missing", ["ADMIN_EMAIL", "ADMIN_PASSWORD"])
async def test_nothing_happens_without_admin_settings(session: AsyncSession, missing):
    """Without ADMIN_EMAIL or ADMIN_PASSWORD the script does nothing."""
    with patch.object(settings, missing, ""):
        await seed_admin()

    assert await get_admin(session) is None
