"""Create the admin user, and keep its password in sync with ADMIN_PASSWORD.

    python scripts/seed_admin.py                  # runs at every startup
    python scripts/seed_admin.py --restore-access # also make the account an active admin again

ADMIN_PASSWORD is the source of truth for this account: when it differs from the stored
password, the stored one is replaced on the next start. A password changed through the app for
this account is therefore reverted by the next restart unless ADMIN_PASSWORD is updated too.
"""

import argparse
import asyncio
from datetime import UTC, datetime

from sqlmodel import select

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.db.database import async_session_maker
from app.models.user import User, UserStatus


async def seed_admin(restore_access: bool = False) -> None:
    """
    Create the admin user from env vars, or update an existing one to match them.

    Args:
        restore_access: Also make the account an active admin again (role, status, active
            flag), which recovers an admin that was demoted or suspended
    """
    email = settings.ADMIN_EMAIL
    password = settings.ADMIN_PASSWORD

    if not email or not password:
        print("==> ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed")
        return

    async with async_session_maker() as session:
        admin = (await session.exec(select(User).where(User.email == email))).first()

        if admin is None:
            session.add(
                User(
                    email=email,
                    password_hash=hash_password(password),
                    role="admin",
                    status=UserStatus.ACTIVE.value,
                    is_active=True,
                    email_verified_at=datetime.now(UTC),
                )
            )
            await session.commit()
            print(f"==> Admin user created: {email}")
            return

        updated = []
        if not verify_password(password, admin.password_hash):
            admin.password_hash = hash_password(password)
            updated.append("password")
        if admin.email_verified_at is None:
            admin.email_verified_at = datetime.now(UTC)
            updated.append("verification")
        if restore_access and (
            admin.role != "admin" or admin.status != UserStatus.ACTIVE.value or not admin.is_active
        ):
            admin.role = "admin"
            admin.status = UserStatus.ACTIVE.value
            admin.is_active = True
            updated.append("access")

        if not updated:
            print(f"==> Admin already up to date ({email})")
            return

        session.add(admin)
        await session.commit()
        print(f"==> Admin {' and '.join(updated)} updated: {email}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "--restore-access",
        action="store_true",
        help="also make the account an active admin again",
    )
    asyncio.run(seed_admin(restore_access=parser.parse_args().restore_access))
