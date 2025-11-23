import asyncio
import secrets
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))


from app.db.database import get_session
from app.models.invite_code import InviteCode, InviteCodeStatus


def generate_invite_code() -> str:
    parts = [secrets.token_hex(2).upper() for _ in range(3)]
    return f"KB-{'-'.join(parts)}"


async def create_admin_invite_code() -> None:
    async for session in get_session():
        code = generate_invite_code()
        invite = InviteCode(
            code=code,
            created_by=None,
            max_uses=1,
            current_uses=0,
            status=InviteCodeStatus.ACTIVE.value,
        )
        session.add(invite)
        await session.commit()
        await session.refresh(invite)

        print(f"\n{'=' * 50}")
        print("Admin Invite Code Generated Successfully!")
        print(f"{'=' * 50}")
        print(f"\nInvite Code: {code}")
        print(f"Invite ID: {invite.invite_code_id}")
        print(f"Max Uses: {invite.max_uses}")
        print("\nUse this code to create the first admin account.")
        print(f"{'=' * 50}\n")


if __name__ == "__main__":
    asyncio.run(create_admin_invite_code())
