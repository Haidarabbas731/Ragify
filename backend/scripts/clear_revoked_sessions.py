"""Clear all user session revocation flags from Redis.

Usage:
    Run from anywhere:
    $ uv run python scripts/clear_revoked_sessions.py
    $ uv run python backend/scripts/clear_revoked_sessions.py
"""

import asyncio
import os
import sys
from pathlib import Path

# Change to backend directory so pydantic-settings can find .env
backend_dir = Path(__file__).parent.parent
os.chdir(backend_dir)

sys.path.insert(0, str(backend_dir))

from app.services.redis_service import get_redis  # noqa: E402


async def clear_all_revoked_sessions():
    """Clear all user_revoked:* keys from Redis."""
    redis = await get_redis()
    try:
        # Find all user_revoked keys
        keys = []
        cursor = 0
        while True:
            cursor, batch = await redis.scan(cursor, match="user_revoked:*", count=100)
            keys.extend(batch)
            if cursor == 0:
                break

        if not keys:
            print("✅ No revoked user sessions found in Redis")
            return

        print(f"🔍 Found {len(keys)} revoked user session keys")
        print(f"Keys: {keys}")

        # Delete all keys
        deleted = 0
        for key in keys:
            result = await redis.delete(key)
            deleted += result

        print(f"✅ Cleared {deleted} user session revocation flags")
        print("Users can now login again!")

    finally:
        await redis.aclose()


if __name__ == "__main__":
    asyncio.run(clear_all_revoked_sessions())
