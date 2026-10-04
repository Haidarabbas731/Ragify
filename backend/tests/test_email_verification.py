"""Email verification: the code lifecycle, the send limits and the sign-up, verify and login flow."""

import hmac
import re
import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient

from app.core.config import settings
from app.services import verification_service
from app.services.redis_service import delete_verification_code
from app.services.verification_service import (
    CodeCheck,
    check_code,
    gate_code_send,
    generate_code,
    hash_code,
    issue_code,
)

PASSWORD = "StrongP@ss123"


def unique_email(prefix: str = "verify") -> str:
    """A fresh address, so Redis counters from earlier runs cannot interfere."""
    return f"{prefix}-{uuid.uuid4().hex[:10]}@example.com"


def unique_user_id() -> str:
    return f"user-{uuid.uuid4().hex}"


@pytest.fixture
def sent_codes():
    """Capture the codes that would have been emailed."""
    with patch(
        "app.services.verification_service.send_verification_code_email",
        new=AsyncMock(return_value=True),
    ) as send:
        yield send


def last_code(send: AsyncMock) -> str:
    return send.call_args.args[1]


async def register(client: AsyncClient, email: str, password: str = PASSWORD):
    return await client.post("/api/v1/auth/register", json={"email": email, "password": password})


async def verify(client: AsyncClient, email: str, code: str):
    return await client.post("/api/v1/auth/verify-email", json={"email": email, "code": code})


# ---- the code itself -------------------------------------------------------------------------


def test_codes_are_six_digits_and_keep_leading_zeros():
    codes = {generate_code() for _ in range(200)}
    assert all(re.fullmatch(r"\d{6}", code) for code in codes)
    with patch("app.services.verification_service.secrets.randbelow", return_value=42):
        assert generate_code() == "000042"


def test_the_hash_depends_on_the_user_the_code_and_the_server_secret():
    original = hash_code("u1", "123456")
    with patch.object(settings, "JWT_SECRET_KEY", "another-secret"):
        other_secret = hash_code("u1", "123456")

    assert original == hash_code("u1", "123456")
    assert original != hash_code("u2", "123456")
    assert original != hash_code("u1", "123457")
    assert original != other_secret
    assert "123456" not in original


@pytest.mark.asyncio
async def test_the_right_code_is_accepted():
    user_id = unique_user_id()
    code = await issue_code(user_id)

    assert (await check_code(user_id, code)).outcome is CodeCheck.OK


@pytest.mark.asyncio
async def test_a_wrong_code_reports_the_tries_left():
    user_id = unique_user_id()
    await issue_code(user_id)

    first = await check_code(user_id, "000000")
    second = await check_code(user_id, "000000")

    assert (first.outcome, first.attempts_left) == (CodeCheck.WRONG, 4)
    assert (second.outcome, second.attempts_left) == (CodeCheck.WRONG, 3)


@pytest.mark.asyncio
async def test_the_fifth_wrong_code_locks_it_and_then_even_the_right_one_fails():
    user_id = unique_user_id()
    code = await issue_code(user_id)
    wrong = "000000" if code != "000000" else "111111"

    outcomes = [(await check_code(user_id, wrong)).outcome for _ in range(5)]
    after_lock = await check_code(user_id, code)

    assert outcomes == [CodeCheck.WRONG] * 4 + [CodeCheck.LOCKED]
    assert after_lock.outcome is CodeCheck.LOCKED


@pytest.mark.asyncio
async def test_the_right_code_on_the_last_try_still_works():
    user_id = unique_user_id()
    code = await issue_code(user_id)
    wrong = "000000" if code != "000000" else "111111"

    for _ in range(4):
        await check_code(user_id, wrong)

    assert (await check_code(user_id, code)).outcome is CodeCheck.OK


@pytest.mark.asyncio
async def test_a_new_code_unlocks_and_resets_the_tries():
    user_id = unique_user_id()
    old = await issue_code(user_id)
    wrong = "000000" if old != "000000" else "111111"
    for _ in range(5):
        await check_code(user_id, wrong)
    assert (await check_code(user_id, old)).outcome is CodeCheck.LOCKED

    new = await issue_code(user_id)
    after_wrong = await check_code(user_id, wrong if new != wrong else "222222")

    assert (after_wrong.outcome, after_wrong.attempts_left) == (CodeCheck.WRONG, 4)
    assert (await check_code(user_id, new)).outcome is CodeCheck.OK


@pytest.mark.asyncio
async def test_a_missing_or_deleted_code_is_expired():
    user_id = unique_user_id()
    assert (await check_code(user_id, "123456")).outcome is CodeCheck.EXPIRED

    code = await issue_code(user_id)
    await delete_verification_code(user_id)
    assert (await check_code(user_id, code)).outcome is CodeCheck.EXPIRED


@pytest.mark.asyncio
async def test_the_comparison_is_constant_time():
    user_id = unique_user_id()
    await issue_code(user_id)

    with patch.object(
        verification_service.hmac, "compare_digest", wraps=hmac.compare_digest
    ) as compare:
        await check_code(user_id, "123456")

    compare.assert_called_once()


@pytest.mark.asyncio
async def test_the_code_is_stored_with_a_ten_minute_expiry():
    with patch(
        "app.services.verification_service.store_verification_code", new=AsyncMock()
    ) as store:
        await issue_code("user-ttl")

    user_id, stored_hash, ttl = store.call_args.args
    assert (user_id, ttl) == ("user-ttl", 600)
    assert re.fullmatch(r"[0-9a-f]{64}", stored_hash)


# ---- send limits -----------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_a_second_send_within_a_minute_is_blocked_with_the_wait():
    email = unique_email("cooldown")

    assert await gate_code_send(email) is None
    blocked = await gate_code_send(email)

    assert blocked is not None
    assert blocked.reason == "cooldown"
    assert 1 <= blocked.retry_after <= 60


@pytest.mark.asyncio
async def test_a_sixth_send_in_an_hour_is_blocked():
    email = unique_email("hourly")

    with patch(
        "app.services.verification_service.acquire_resend_cooldown",
        new=AsyncMock(return_value=0),
    ):
        results = [await gate_code_send(email) for _ in range(6)]

    assert results[:5] == [None] * 5
    assert results[5] is not None and results[5].reason == "limit"


# ---- sign-up, verify and sign-in -------------------------------------------------------------


@pytest.mark.asyncio
async def test_signing_up_emails_a_code_and_sign_in_is_refused_until_it_is_entered(
    client: AsyncClient, sent_codes
):
    email = unique_email()

    response = await register(client, email)
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})

    assert response.status_code == 201
    assert "access_token" not in response.json()
    assert re.fullmatch(r"\d{6}", last_code(sent_codes))
    assert login.status_code == 403
    assert login.json()["detail"]["code"] == "email_not_verified"


@pytest.mark.asyncio
async def test_a_wrong_password_on_an_unverified_account_does_not_reveal_it(
    client: AsyncClient, sent_codes
):
    email = unique_email()
    await register(client, email)

    login = await client.post("/api/v1/auth/login", json={"email": email, "password": "Wrong-Pass-1"})

    assert login.status_code == 401
    assert login.json()["detail"] == "Invalid email or password"


@pytest.mark.asyncio
async def test_the_right_code_verifies_signs_in_and_sends_the_welcome_email(
    client: AsyncClient, sent_codes
):
    email = unique_email()
    await register(client, email)

    with patch("app.api.v1.auth.send_welcome_email", new=AsyncMock(return_value=True)) as welcome:
        response = await verify(client, email, last_code(sent_codes))

    assert response.status_code == 200
    body = response.json()
    assert body["access_token"] and body["refresh_token"]
    welcome.assert_awaited_once_with(email)
    login = await client.post("/api/v1/auth/login", json={"email": email, "password": PASSWORD})
    assert login.status_code == 200


@pytest.mark.asyncio
async def test_a_code_works_once(client: AsyncClient, sent_codes):
    email = unique_email()
    await register(client, email)
    code = last_code(sent_codes)

    first = await verify(client, email, code)
    second = await verify(client, email, code)

    assert first.status_code == 200
    assert second.status_code == 400
    assert second.json()["detail"]["code"] == "already_verified"


@pytest.mark.asyncio
async def test_a_wrong_code_says_how_many_tries_are_left(client: AsyncClient, sent_codes):
    email = unique_email()
    await register(client, email)
    code = last_code(sent_codes)
    wrong = "000000" if code != "000000" else "111111"

    response = await verify(client, email, wrong)

    assert response.status_code == 400
    assert response.json()["detail"] == {
        "code": "invalid_code",
        "message": "That code isn't right.",
        "attempts_left": 4,
    }


@pytest.mark.asyncio
async def test_five_wrong_codes_lock_it_even_for_the_right_one(client: AsyncClient, sent_codes):
    email = unique_email()
    await register(client, email)
    code = last_code(sent_codes)
    wrong = "000000" if code != "000000" else "111111"

    statuses = [(await verify(client, email, wrong)).status_code for _ in range(5)]
    right_after = await verify(client, email, code)

    assert statuses == [400, 400, 400, 400, 429]
    assert right_after.status_code == 429
    assert right_after.json()["detail"]["code"] == "too_many_attempts"


@pytest.mark.asyncio
async def test_an_expired_code_asks_for_a_new_one(client: AsyncClient, sent_codes):
    email = unique_email()
    created = await register(client, email)
    await delete_verification_code(created.json()["user_id"])

    response = await verify(client, email, last_code(sent_codes))

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "code_expired"


@pytest.mark.asyncio
async def test_an_unknown_address_looks_like_a_wrong_code(client: AsyncClient):
    response = await verify(client, unique_email("nobody"), "123456")

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_code"


@pytest.mark.asyncio
async def test_a_malformed_code_is_rejected_before_any_lookup(client: AsyncClient):
    for code in ("12345", "1234567", "abcdef", "12 456"):
        response = await verify(client, unique_email(), code)
        assert response.status_code == 422


@pytest.mark.asyncio
async def test_signing_up_again_before_verifying_replaces_the_password(
    client: AsyncClient, sent_codes
):
    """Otherwise whoever signed up first could sign in once the real owner verifies."""
    email = unique_email()
    await register(client, email, "Attacker-Pass-1!")
    code = last_code(sent_codes)
    second = await register(client, email, "Owner-Pass-1!")  # inside the cooldown: no second email

    verified = await verify(client, email, code)
    old = await client.post(
        "/api/v1/auth/login", json={"email": email, "password": "Attacker-Pass-1!"}
    )
    new = await client.post("/api/v1/auth/login", json={"email": email, "password": "Owner-Pass-1!"})

    assert second.status_code == 201
    assert sent_codes.await_count == 1
    assert verified.status_code == 200
    assert old.status_code == 401
    assert new.status_code == 200


@pytest.mark.asyncio
async def test_signing_up_with_a_verified_address_is_refused(
    client: AsyncClient, sent_codes, mark_verified
):
    email = unique_email()
    await register(client, email)
    await mark_verified(email)

    response = await register(client, email)

    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"


@pytest.mark.asyncio
async def test_signing_up_still_works_when_the_email_cannot_be_sent(client: AsyncClient):
    with patch(
        "app.services.verification_service.send_verification_code_email",
        new=AsyncMock(return_value=False),
    ):
        response = await register(client, unique_email())

    assert response.status_code == 201


# ---- resend ----------------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_resend_sends_a_new_code_to_an_unverified_address(client: AsyncClient, sent_codes):
    email = unique_email()
    await register(client, email)

    with patch(
        "app.services.verification_service.acquire_resend_cooldown", new=AsyncMock(return_value=0)
    ):
        response = await client.post("/api/v1/auth/resend-code", json={"email": email})

    assert response.status_code == 200
    assert sent_codes.await_count == 2
    assert (await verify(client, email, last_code(sent_codes))).status_code == 200


@pytest.mark.asyncio
async def test_resend_answers_the_same_for_an_unknown_address_and_sends_nothing(
    client: AsyncClient, sent_codes
):
    known = unique_email()
    await register(client, known)
    sent_codes.reset_mock()

    with patch(
        "app.services.verification_service.acquire_resend_cooldown", new=AsyncMock(return_value=0)
    ):
        unknown = await client.post("/api/v1/auth/resend-code", json={"email": unique_email("no")})
        existing = await client.post("/api/v1/auth/resend-code", json={"email": known})

    assert unknown.status_code == existing.status_code == 200
    assert unknown.json() == existing.json()
    assert sent_codes.await_count == 1  # only the real, unverified address got a code


@pytest.mark.asyncio
async def test_resend_inside_the_cooldown_says_how_long_to_wait(client: AsyncClient, sent_codes):
    email = unique_email()
    await register(client, email)

    response = await client.post("/api/v1/auth/resend-code", json={"email": email})

    assert response.status_code == 429
    detail = response.json()["detail"]
    assert detail["code"] == "resend_too_soon"
    assert 1 <= detail["retry_after"] <= 60
    assert response.headers["Retry-After"] == str(detail["retry_after"])


@pytest.mark.asyncio
async def test_resend_does_not_send_to_an_already_verified_address(
    client: AsyncClient, sent_codes, mark_verified
):
    email = unique_email()
    await register(client, email)
    await mark_verified(email)
    sent_codes.reset_mock()

    with patch(
        "app.services.verification_service.acquire_resend_cooldown", new=AsyncMock(return_value=0)
    ):
        response = await client.post("/api/v1/auth/resend-code", json={"email": email})

    assert response.status_code == 200
    sent_codes.assert_not_awaited()


# ---- per-IP limits ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_signing_up_is_limited_per_ip(client: AsyncClient, sent_codes):
    ip = f"203.0.113.{uuid.uuid4().int % 250}-{uuid.uuid4().hex[:6]}"
    with (
        patch("app.api.v1.auth._client_ip", return_value=ip),
        patch.object(settings, "REGISTER_LIMIT_PER_IP_PER_HOUR", 2),
    ):
        statuses = [(await register(client, unique_email())).status_code for _ in range(3)]

    assert statuses == [201, 201, 429]


@pytest.mark.asyncio
async def test_submitting_codes_is_limited_per_ip(client: AsyncClient):
    ip = f"198.51.100-{uuid.uuid4().hex[:8]}"
    with (
        patch("app.api.v1.auth._client_ip", return_value=ip),
        patch.object(settings, "VERIFY_ATTEMPTS_PER_IP_PER_HOUR", 2),
    ):
        statuses = [
            (await verify(client, unique_email(), "123456")).status_code for _ in range(3)
        ]

    assert statuses == [400, 400, 429]
