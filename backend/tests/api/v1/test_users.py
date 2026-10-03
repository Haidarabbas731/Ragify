"""Tests for user profile API endpoints."""

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.collection import Collection
from app.models.conversation import Conversation
from app.models.document import Document


@pytest.mark.asyncio
async def test_get_current_user_profile(client: AsyncClient, auth_headers: dict):
    """Test GET /api/v1/users/me - get current user profile."""
    response = await client.get("/api/v1/users/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert "user_id" in data
    assert "storage_used_mb" in data
    assert "storage_limit_mb" in data
    assert "storage_percentage" in data
    assert data["storage_used_mb"] >= 0


@pytest.mark.asyncio
async def test_get_current_user_profile_unauthorized(client: AsyncClient):
    """Test GET /api/v1/users/me - unauthorized access."""
    response = await client.get("/api/v1/users/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_user_email_success(client: AsyncClient, auth_headers: dict):
    """Test PATCH /api/v1/users/me - update email successfully."""
    new_email = "newemail@example.com"
    response = await client.patch(
        "/api/v1/users/me", json={"email": new_email}, headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == new_email


@pytest.mark.asyncio
async def test_update_user_email_same_as_current(client: AsyncClient, auth_headers: dict):
    """Test PATCH /api/v1/users/me - update to same email fails."""
    response = await client.patch(
        "/api/v1/users/me", json={"email": "test@example.com"}, headers=auth_headers
    )

    assert response.status_code == 400
    assert "same as current email" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_user_email_already_exists(
    client: AsyncClient, auth_headers: dict, test_engine
):
    """Test PATCH /api/v1/users/me - update to existing email fails."""
    # Create another user directly in database
    import uuid as uuid_module

    from sqlalchemy import text

    from app.core.security import hash_password

    async with test_engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO users (user_id, email, password_hash, role, storage_used_bytes, storage_limit_bytes, status, is_active)
                VALUES (:user_id, :email, :password_hash, :role, :storage_used, :storage_limit, :status, :is_active)
            """
            ),
            {
                "user_id": str(uuid_module.uuid4()),
                "email": "other@example.com",
                "password_hash": hash_password("TestPassword123!"),
                "role": "user",
                "storage_used": 0,
                "storage_limit": 1073741824,
                "status": "active",
                "is_active": True,
            },
        )

    # Try to update to other user's email
    response = await client.patch(
        "/api/v1/users/me", json={"email": "other@example.com"}, headers=auth_headers
    )

    assert response.status_code == 400
    assert "already in use" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_user_email_invalid_format(client: AsyncClient, auth_headers: dict):
    """Test PATCH /api/v1/users/me - invalid email format."""
    response = await client.patch(
        "/api/v1/users/me", json={"email": "invalid-email"}, headers=auth_headers
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_change_password_success(client: AsyncClient, auth_headers: dict):
    """Test POST /api/v1/users/me/change-password - successful password change."""
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={
            "current_password": "TestPassword123!",
            "new_password": "NewPassword456!",
        },
        headers=auth_headers,
    )

    assert response.status_code == 200
    data = response.json()
    assert "password changed successfully" in data["message"].lower()


@pytest.mark.asyncio
async def test_change_password_incorrect_current(client: AsyncClient, auth_headers: dict):
    """Test POST /api/v1/users/me/change-password - incorrect current password."""
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={
            "current_password": "WrongPassword123!",
            "new_password": "NewPassword456!",
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_change_password_same_as_current(client: AsyncClient, auth_headers: dict):
    """Test POST /api/v1/users/me/change-password - new password same as current."""
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={
            "current_password": "TestPassword123!",
            "new_password": "TestPassword123!",
        },
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "cannot be the same" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_change_password_weak_new_password(client: AsyncClient, auth_headers: dict):
    """Test POST /api/v1/users/me/change-password - weak new password."""
    # Long enough for the schema but missing an uppercase letter, a number and a symbol
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "TestPassword123!", "new_password": "weakpassword"},
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "password" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_change_password_too_short(client: AsyncClient, auth_headers: dict):
    """Test POST /api/v1/users/me/change-password - rejected by the request schema."""
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "TestPassword123!", "new_password": "weak"},
        headers=auth_headers,
    )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_user_stats(client: AsyncClient, auth_headers: dict, test_engine):
    """Test GET /api/v1/users/me/stats - get user statistics."""
    # Get user_id from auth_headers token
    from app.core.security import decode_token

    token = auth_headers["Authorization"].replace("Bearer ", "")
    payload = decode_token(token)
    user_id = payload["sub"]

    # Create test data through the models so column defaults are applied
    async with AsyncSession(test_engine) as db:
        collection = Collection(user_id=user_id, name="Test Collection", description="Test")
        db.add(collection)
        await db.commit()
        await db.refresh(collection)

        db.add_all(
            [
                Document(
                    user_id=user_id,
                    collection_id=collection.collection_id,
                    filename="test1.pdf",
                    file_type="pdf",
                    size_bytes=1024,
                    storage_key="test/key1",
                    status="active",
                    chunks_count=10,
                ),
                Document(
                    user_id=user_id,
                    filename="test2.pdf",
                    file_type="pdf",
                    size_bytes=2048,
                    storage_key="test/key2",
                    status="processing",
                    chunks_count=5,
                ),
                # Deleted documents must not be counted
                Document(
                    user_id=user_id,
                    filename="gone.pdf",
                    file_type="pdf",
                    size_bytes=512,
                    storage_key="test/key3",
                    status="deleted",
                    chunks_count=7,
                ),
            ]
        )
        db.add(
            Conversation(
                user_id=user_id,
                messages=[{"role": "user", "content": "test"}],
                message_count=1,
            )
        )
        await db.commit()

    # Get stats
    response = await client.get("/api/v1/users/me/stats", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total_documents"] == 2
    assert data["total_chunks"] == 15  # 10 + 5
    assert data["collections_count"] == 1
    assert data["conversations_count"] == 1
    assert "storage_used_mb" in data
    assert "storage_limit_mb" in data
    assert "storage_percentage" in data
    assert "documents_by_status" in data
    assert data["documents_by_status"] == {"active": 1, "processing": 1}


@pytest.mark.asyncio
async def test_get_user_stats_empty(client: AsyncClient, auth_headers: dict):
    """Test GET /api/v1/users/me/stats - empty user statistics."""
    response = await client.get("/api/v1/users/me/stats", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["total_documents"] == 0
    assert data["total_chunks"] == 0
    assert data["collections_count"] == 0
    assert data["conversations_count"] == 0
