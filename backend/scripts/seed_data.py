import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.security import hash_password
from app.db.database import get_session
from app.models.collection import Collection
from app.models.invite_code import InviteCode, InviteCodeStatus
from app.models.user import User, UserStatus


async def seed_database() -> None:
    async for session in get_session():
        test_user = User(
            email="test@example.com",
            password_hash=hash_password("testpassword123"),
            role="user",
            status=UserStatus.ACTIVE.value,
            storage_limit_bytes=1_073_741_824,
        )
        session.add(test_user)
        await session.commit()
        await session.refresh(test_user)

        test_collection = Collection(
            user_id=test_user.user_id,
            name="Test Collection",
            description="Sample collection for development",
        )
        session.add(test_collection)

        invite_code = InviteCode(
            code="KB-TEST-1234-ABCD",
            created_by=None,
            max_uses=5,
            current_uses=0,
            status=InviteCodeStatus.ACTIVE.value,
        )
        session.add(invite_code)

        await session.commit()

        print("\n" + "=" * 50)
        print("Development Data Seeded Successfully!")
        print("=" * 50)
        print("\nTest User:")
        print("  Email: test@example.com")
        print("  Password: testpassword123")
        print(f"  User ID: {test_user.user_id}")
        print("\nTest Collection:")
        print(f"  Name: {test_collection.name}")
        print(f"  Collection ID: {test_collection.collection_id}")
        print("\nTest Invite Code:")
        print(f"  Code: {invite_code.code}")
        print(f"  Max Uses: {invite_code.max_uses}")
        print(f"  Current Uses: {invite_code.current_uses}")
        print("=" * 50 + "\n")


if __name__ == "__main__":
    asyncio.run(seed_database())
