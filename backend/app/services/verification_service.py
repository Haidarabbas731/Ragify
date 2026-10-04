"""Email verification: 6-digit codes that prove a new user owns their address."""

import hashlib
import hmac
import secrets
from dataclasses import dataclass
from enum import Enum

from app.core.config import settings
from app.models.user import User
from app.services.email_service import send_verification_code_email
from app.services.redis_service import (
    acquire_resend_cooldown,
    check_rate_limit,
    count_verification_attempt,
    get_verification_code_hash,
    store_verification_code,
)


class CodeCheck(str, Enum):
    """Outcome of checking a submitted code."""

    OK = "ok"
    WRONG = "wrong"
    LOCKED = "locked"
    EXPIRED = "expired"


@dataclass(frozen=True)
class CodeCheckResult:
    """A code check outcome, with the tries left after a wrong code."""

    outcome: CodeCheck
    attempts_left: int = 0


@dataclass(frozen=True)
class SendBlocked:
    """Why a verification email may not be sent right now."""

    reason: str  # "cooldown" or "limit"
    retry_after: int  # seconds


def generate_code() -> str:
    """
    Generate a random 6-digit code.

    Returns:
        The code, zero-padded (for example "004821")
    """
    return f"{secrets.randbelow(10**6):06d}"


def hash_code(user_id: str, code: str) -> str:
    """
    Hash a code with the server secret. A plain hash of six digits could be reversed offline in
    milliseconds if Redis leaked, so the secret is part of it, and the user ID keeps equal codes
    for different users from matching.

    Args:
        user_id: User the code belongs to
        code: The 6-digit code

    Returns:
        Hex digest
    """
    return hmac.new(
        settings.JWT_SECRET_KEY.encode(), f"{user_id}:{code}".encode(), hashlib.sha256
    ).hexdigest()


async def issue_code(user_id: str) -> str:
    """
    Create a new code for a user, replacing any earlier one and resetting the attempt counter.

    Args:
        user_id: User ID

    Returns:
        The code, to be emailed (it is stored only as a hash)
    """
    code = generate_code()
    await store_verification_code(
        user_id, hash_code(user_id, code), settings.EMAIL_VERIFICATION_CODE_EXPIRY
    )
    return code


async def check_code(user_id: str, code: str) -> CodeCheckResult:
    """
    Check a submitted code. Every submission counts, and the code locks after the allowed
    number of tries; the comparison takes the same time whatever the digits are.

    Args:
        user_id: User ID
        code: The submitted 6-digit code

    Returns:
        The outcome and, after a wrong code, how many tries are left
    """
    stored = await get_verification_code_hash(user_id)
    if stored is None:
        return CodeCheckResult(CodeCheck.EXPIRED)

    max_attempts = settings.EMAIL_VERIFICATION_MAX_ATTEMPTS
    attempts = await count_verification_attempt(user_id, settings.EMAIL_VERIFICATION_CODE_EXPIRY)
    if attempts > max_attempts:
        return CodeCheckResult(CodeCheck.LOCKED)

    if hmac.compare_digest(stored, hash_code(user_id, code)):
        return CodeCheckResult(CodeCheck.OK)
    if attempts >= max_attempts:
        return CodeCheckResult(CodeCheck.LOCKED)
    return CodeCheckResult(CodeCheck.WRONG, attempts_left=max_attempts - attempts)


async def gate_code_send(email: str) -> SendBlocked | None:
    """
    Apply the send limits to an address: a wait between sends and a cap per hour. This is keyed
    by the address alone, so it answers the same whether or not an account exists.

    Args:
        email: Email address a code would be sent to

    Returns:
        None if sending is allowed, otherwise why not and how long to wait
    """
    wait = await acquire_resend_cooldown(email, settings.EMAIL_VERIFICATION_RESEND_COOLDOWN)
    if wait:
        return SendBlocked("cooldown", wait)
    if not await check_rate_limit(
        f"email_verify_sends:{email}", settings.EMAIL_VERIFICATION_SENDS_PER_HOUR, 3600
    ):
        return SendBlocked("limit", 3600)
    return None


async def deliver_code(user: User) -> bool:
    """
    Issue a new code for a user and email it.

    Args:
        user: The user to verify

    Returns:
        bool: True if the email was sent
    """
    code = await issue_code(user.user_id)
    return await send_verification_code_email(
        user.email, code, expiry_minutes=max(1, settings.EMAIL_VERIFICATION_CODE_EXPIRY // 60)
    )
