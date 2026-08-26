"""Seed the initial admin user if one does not already exist."""

import asyncio

from sqlmodel import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.database import async_session_maker
from app.models.user import User, UserStatus


async def seed_admin() -> None:
    """Create the admin user from env vars if no admin exists yet."""
    email = settings.ADMIN_EMAIL
    password = settings.ADMIN_PASSWORD

    if not email or not password:
        print("==> ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin seed")
        return

    async with async_session_maker() as session:
        existing = await session.exec(select(User).where(User.email == email))
        if existing.first():
            print(f"==> Admin already exists ({email}), skipping seed")
            return

        admin = User(
            email=email,
            password_hash=hash_password(password),
            role="admin",
            status=UserStatus.ACTIVE.value,
            is_active=True,
        )
        session.add(admin)
        await session.commit()
        print(f"==> Admin user created: {email}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
