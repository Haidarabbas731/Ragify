from datetime import UTC, datetime

from app.db.database import async_session_maker
from app.models.system_state import SystemState


async def get_state(key: str) -> str | None:
    """
    Read a system state value.

    Args:
        key: State key

    Returns:
        str | None: The stored value, or None if the key was never set
    """
    async with async_session_maker() as db:
        row = await db.get(SystemState, key)
        return row.value if row else None


async def set_state(key: str, value: str) -> None:
    """
    Create or update a system state value.

    Args:
        key: State key
        value: Value to store
    """
    async with async_session_maker() as db:
        row = await db.get(SystemState, key)
        if row is None:
            row = SystemState(key=key, value=value)
        row.value = value
        row.updated_at = datetime.now(UTC)
        db.add(row)
        await db.commit()
