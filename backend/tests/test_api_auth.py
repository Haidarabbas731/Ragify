"""
API Integration Tests for Authentication Endpoints.

Tests all endpoints in app/api/v1/auth.py:
- POST /api/v1/auth/register
- POST /api/v1/auth/login
- POST /api/v1/auth/refresh
- POST /api/v1/auth/logout
- POST /api/v1/auth/password-reset/request
- POST /api/v1/auth/password-reset/confirm

Note: INVITE_ONLY mode is disabled in conftest.py for tests.
"""

import asyncio
import sys
from unittest.mock import patch

import pytest
from httpx import AsyncClient

# Known issue: Windows + pytest-asyncio + Starlette BaseHTTPMiddleware causes
# "Future attached to a different loop" errors when making multiple sequential requests
# in the same test. This is a test infrastructure issue, not application code.
skip_on_windows_event_loop_issue = pytest.mark.skipif(
    sys.platform == "win32",
    reason="Windows event loop issue with multiple sequential HTTP requests in tests"
)


# Test 1: Register with valid data


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test successful user registration."""
    with patch("app.api.v1.auth.send_welcome_email") as mock_email:
        mock_email.return_value = None

        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "password": "StrongP@ss123",
            },
        )

        if response.status_code != 201:
            print(f"Registration failed: {response.json()}")

        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["role"] == "user"
        assert "user_id" in data


# Test 2: Register with weak password


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    """Test registration fails with weak password."""
    response = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "weakpass@example.com",
            "password": "weak",
        },
    )

    # Pydantic validation returns 422 for invalid input
    assert response.status_code == 422
    data = response.json()
    # Check that error mentions password length
    assert "password" in str(data).lower()


# Test 3: Register with existing email


@skip_on_windows_event_loop_issue
@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test registration fails with duplicate email."""
    with patch("app.api.v1.auth.send_welcome_email") as mock_email:
        mock_email.return_value = None

        # First registration
        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "StrongP@ss123",
            },
        )

        # Small delay to avoid event loop conflicts on Windows
        await asyncio.sleep(0.01)

        # Second registration with same email
        response = await client.post(
            "/api/v1/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "StrongP@ss123",
            },
        )

        assert response.status_code in [400, 409]


# Test 4: Login with valid credentials


@skip_on_windows_event_loop_issue
@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login with valid credentials."""
    # First register a user
    with patch("app.api.v1.auth.send_welcome_email") as mock_email:
        mock_email.return_value = None

        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "logintest@example.com",
                "password": "StrongP@ss123",
            },
        )

    # Then login
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "logintest@example.com", "password": "StrongP@ss123"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"].lower() == "bearer"


# Test 5: Login with invalid credentials


@skip_on_windows_event_loop_issue
@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login fails with wrong password."""
    # First register a user
    with patch("app.api.v1.auth.send_welcome_email") as mock_email:
        mock_email.return_value = None

        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "wrongpass@example.com",
                "password": "StrongP@ss123",
            },
        )

    # Small delay to avoid event loop conflicts on Windows
    await asyncio.sleep(0.01)

    # Login with wrong password
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "wrongpass@example.com", "password": "WrongPassword123"},
    )

    assert response.status_code == 401


# Test 6: Token refresh


@skip_on_windows_event_loop_issue
@pytest.mark.asyncio
async def test_token_refresh(client: AsyncClient):
    """Test token refresh with valid refresh token."""
    # Register and login
    with patch("app.api.v1.auth.send_welcome_email") as mock_email:
        mock_email.return_value = None

        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "refreshtest@example.com",
                "password": "StrongP@ss123",
            },
        )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "refreshtest@example.com", "password": "StrongP@ss123"},
    )

    refresh_token = login_response.json()["refresh_token"]

    # Refresh token
    response = await client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {refresh_token}"},
    )

    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


# Test 7: Logout


@skip_on_windows_event_loop_issue
@pytest.mark.asyncio
async def test_logout(client: AsyncClient):
    """Test logout revokes tokens."""
    # Register and login
    with patch("app.api.v1.auth.send_welcome_email") as mock_email:
        mock_email.return_value = None

        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "logouttest@example.com",
                "password": "StrongP@ss123",
            },
        )

    # Small delay to avoid event loop conflicts on Windows
    await asyncio.sleep(0.01)

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "logouttest@example.com", "password": "StrongP@ss123"},
    )

    access_token = login_response.json()["access_token"]
    refresh_token = login_response.json()["refresh_token"]

    # Small delay to avoid event loop conflicts on Windows
    await asyncio.sleep(0.01)

    # Logout
    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
        json={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "revoke_all_sessions": False,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Logged out successfully"


# Test 8: Password reset flow


@skip_on_windows_event_loop_issue
@pytest.mark.asyncio
async def test_password_reset_flow(client: AsyncClient):
    """Test complete password reset flow."""
    # Register a user
    with patch("app.api.v1.auth.send_welcome_email") as mock_email:
        mock_email.return_value = None

        await client.post(
            "/api/v1/auth/register",
            json={
                "email": "resetpass@example.com",
                "password": "StrongP@ss123",
            },
        )

    # Request password reset
    with patch("app.api.v1.auth.send_password_reset_email") as mock_reset_email, patch(
        "app.api.v1.auth.store_password_reset_token"
    ) as mock_store_token:
        mock_reset_email.return_value = None
        mock_store_token.return_value = None

        response = await client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "resetpass@example.com"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "email" in data["message"].lower() or "sent" in data["message"].lower()

    # Note: Confirming password reset requires a valid reset token from Redis,
    # which is difficult to test in integration tests without mocking extensively.
    # The E2E test covers this flow end-to-end.
