import pytest
from httpx import AsyncClient

from app.core.config import settings


@pytest.mark.asyncio
async def test_register_success(client: AsyncClient):
    """Test successful user registration."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "Test@123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "user"
    assert data["status"] == "active"
    assert "user_id" in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    """Test registration with duplicate email fails."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "Test@123"},
    )
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "duplicate@example.com", "password": "Test@123"},
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


@pytest.mark.asyncio
async def test_register_weak_password(client: AsyncClient):
    """Test registration with weak password fails."""
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": "weak@example.com", "password": "weak"},
    )
    assert response.status_code in (400, 422)


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    """Test successful login."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": "login@example.com", "password": "Test@123"},
    )

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "login@example.com", "password": "Test@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient):
    """Test login with invalid credentials fails."""
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@example.com", "password": "Wrong@123"},
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_logout_success(client: AsyncClient):
    """Test successful logout with both tokens revoked."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": "logout@example.com", "password": "Test@123"},
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "logout@example.com", "password": "Test@123"},
    )
    tokens = login_response.json()

    # Logout with both access token (header) and refresh token (body)
    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
        json={"refresh_token": tokens["refresh_token"]},
    )
    assert response.status_code == 200
    assert "Logged out successfully" in response.json()["message"]

    # Verify tokens are revoked - refresh should fail
    refresh_response = await client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {tokens['refresh_token']}"},
    )
    assert refresh_response.status_code in (401, 403)  # Token revoked or session expired


@pytest.mark.asyncio
async def test_refresh_token_success(client: AsyncClient):
    """Test successful token refresh."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": "refresh@example.com", "password": "Test@123"},
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "refresh@example.com", "password": "Test@123"},
    )
    tokens = login_response.json()

    response = await client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {tokens['refresh_token']}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


@pytest.mark.asyncio
async def test_refresh_with_access_token_fails(client: AsyncClient):
    """Test refresh endpoint rejects access tokens."""
    await client.post(
        "/api/v1/auth/register",
        json={"email": "refreshfail@example.com", "password": "Test@123"},
    )

    login_response = await client.post(
        "/api/v1/auth/login",
        json={"email": "refreshfail@example.com", "password": "Test@123"},
    )
    tokens = login_response.json()

    response = await client.post(
        "/api/v1/auth/refresh",
        headers={"Authorization": f"Bearer {tokens['access_token']}"},
    )
    assert response.status_code == 403
    assert "refresh token" in response.json()["detail"].lower()
