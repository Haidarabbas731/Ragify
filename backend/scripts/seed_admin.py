"""Seed the initial admin user, or reset the admin's password.

    python scripts/seed_admin.py                  # create the admin if missing (runs at startup)
    python scripts/seed_admin.py --reset-password # set the admin's password from ADMIN_PASSWORD
"""

import argparse
import asyncio

from sqlmodel import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import async_session_maker
from app.models.user import User, UserStatus


async def seed_admin(reset_password: bool = False) -> None:
    """
    Create the admin user from env vars if it does not exist yet.

    An existing admin is normally left alone, so changing ADMIN_PASSWORD later does not change
    its password. With ``reset_password`` the existing admin's password is set from
    ADMIN_PASSWORD (and the account is re-activated), which recovers a locked-out admin.

    Args:
        reset_password: Overwrite the existing admin's password with ADMIN_PASSWORD
    """
    email = settings.ADMIN_EMAIL
    password = settings.ADMIN_PASSWORD

    if not email or not password:
        print("==> ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed")
        return

    async with async_session_maker() as session:
        existing = (await session.exec(select(User).where(User.email == email))).first()

        if existing and not reset_password:
            print(
                f"==> Admin already exists ({email}), skipping seed "
                "(use --reset-password to set its password from ADMIN_PASSWORD)"
            )
            return

        if existing:
            existing.password_hash = hash_password(password)
            existing.role = "admin"
            existing.status = UserStatus.ACTIVE.value
            existing.is_active = True
            session.add(existing)
            await session.commit()
            print(f"==> Admin password reset: {email}")
            return

        session.add(
            User(
                email=email,
                password_hash=hash_password(password),
                role="admin",
                status=UserStatus.ACTIVE.value,
                is_active=True,
            )
        )
        await session.commit()
        print(f"==> Admin user created: {email}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="set the existing admin's password from ADMIN_PASSWORD",
    )
    asyncio.run(seed_admin(reset_password=parser.parse_args().reset_password))
