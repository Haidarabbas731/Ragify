"""Tests for user profile API endpoints."""

import pytest
from httpx import AsyncClient


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
async def test_update_user_email_success(
    client: AsyncClient, auth_headers: dict
):
    """Test PATCH /api/v1/users/me - update email successfully."""
    new_email = "newemail@example.com"
    response = await client.patch(
        "/api/v1/users/me", json={"email": new_email}, headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == new_email


@pytest.mark.asyncio
async def test_update_user_email_same_as_current(
    client: AsyncClient, auth_headers: dict
):
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
            text("""
                INSERT INTO users (user_id, email, password_hash, role, storage_used_bytes, storage_limit_bytes, status, is_active)
                VALUES (:user_id, :email, :password_hash, :role, :storage_used, :storage_limit, :status, :is_active)
            """),
            {
                "user_id": str(uuid_module.uuid4()),
                "email": "other@example.com",
                "password_hash": hash_password("TestPassword123!"),
                "role": "user",
                "storage_used": 0,
                "storage_limit": 1073741824,
                "status": "active",
                "is_active": True,
            }
        )

    # Try to update to other user's email
    response = await client.patch(
        "/api/v1/users/me", json={"email": "other@example.com"}, headers=auth_headers
    )

    assert response.status_code == 400
    assert "already in use" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_user_email_invalid_format(
    client: AsyncClient, auth_headers: dict
):
    """Test PATCH /api/v1/users/me - invalid email format."""
    response = await client.patch(
        "/api/v1/users/me", json={"email": "invalid-email"}, headers=auth_headers
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_change_password_success(
    client: AsyncClient, auth_headers: dict
):
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
async def test_change_password_incorrect_current(
    client: AsyncClient, auth_headers: dict
):
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
async def test_change_password_weak_new_password(
    client: AsyncClient, auth_headers: dict
):
    """Test POST /api/v1/users/me/change-password - weak new password."""
    response = await client.post(
        "/api/v1/users/me/change-password",
        json={"current_password": "TestPassword123!", "new_password": "weak"},
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert "password" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_user_stats(
    client: AsyncClient, auth_headers: dict, test_engine
):
    """Test GET /api/v1/users/me/stats - get user statistics."""
    from sqlalchemy import text

    # Get user_id from auth_headers token
    from app.core.security import decode_access_token
    token = auth_headers["Authorization"].replace("Bearer ", "")
    payload = decode_access_token(token)
    user_id = payload["sub"]

    # Create test data directly in database
    async with test_engine.begin() as conn:
        # Create collection
        result = await conn.execute(
            text("""
                INSERT INTO collections (user_id, name, description)
                VALUES (:user_id, :name, :description)
                RETURNING collection_id
            """),
            {
                "user_id": user_id,
                "name": "Test Collection",
                "description": "Test",
            }
        )
        collection_id = result.scalar_one()

        # Create documents
        import uuid as uuid_module
        await conn.execute(
            text("""
                INSERT INTO documents (document_id, user_id, collection_id, filename, file_type, size_bytes, storage_key, status, chunks_count)
                VALUES
                    (:doc_id1, :user_id, :collection_id, 'test1.pdf', 'pdf', 1024, 'test/key1', 'ACTIVE', 10),
                    (:doc_id2, :user_id, NULL, 'test2.pdf', 'pdf', 2048, 'test/key2', 'PROCESSING', 5)
            """),
            {
                "doc_id1": str(uuid_module.uuid4()),
                "doc_id2": str(uuid_module.uuid4()),
                "user_id": user_id,
                "collection_id": collection_id,
            }
        )

        # Create conversation
        await conn.execute(
            text("""
                INSERT INTO conversations (user_id, messages, message_count)
                VALUES (:user_id, :messages::jsonb, 1)
            """),
            {
                "user_id": user_id,
                "messages": '[{"role": "user", "content": "test"}]',
            }
        )

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
    assert data["documents_by_status"]["ACTIVE"] == 1
    assert data["documents_by_status"]["PROCESSING"] == 1


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
