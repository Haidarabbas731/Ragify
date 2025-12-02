"""Tests for user profile API endpoints."""

import pytest
from httpx import AsyncClient
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.user import User


@pytest.mark.asyncio
async def test_get_current_user_profile(
    client: AsyncClient, sample_user: User, auth_headers: dict
):
    """Test GET /api/v1/users/me - get current user profile."""
    response = await client.get("/api/v1/users/me", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == sample_user.email
    assert data["user_id"] == sample_user.user_id
    assert "storage_used_mb" in data
    assert "storage_limit_mb" in data
    assert "storage_percentage" in data
    assert data["storage_used_mb"] == round(
        sample_user.storage_used_bytes / 1024 / 1024, 2
    )


@pytest.mark.asyncio
async def test_get_current_user_profile_unauthorized(client: AsyncClient):
    """Test GET /api/v1/users/me - unauthorized access."""
    response = await client.get("/api/v1/users/me")

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_user_email_success(
    client: AsyncClient, sample_user: User, auth_headers: dict, session: AsyncSession
):
    """Test PATCH /api/v1/users/me - update email successfully."""
    new_email = "newemail@example.com"
    response = await client.patch(
        "/api/v1/users/me", json={"email": new_email}, headers=auth_headers
    )

    assert response.status_code == 200
    data = response.json()
    assert data["email"] == new_email

    # Verify in database
    await session.refresh(sample_user)
    assert sample_user.email == new_email


@pytest.mark.asyncio
async def test_update_user_email_same_as_current(
    client: AsyncClient, sample_user: User, auth_headers: dict
):
    """Test PATCH /api/v1/users/me - update to same email fails."""
    response = await client.patch(
        "/api/v1/users/me", json={"email": sample_user.email}, headers=auth_headers
    )

    assert response.status_code == 400
    assert "same as current email" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_update_user_email_already_exists(
    client: AsyncClient, sample_user: User, auth_headers: dict, session: AsyncSession
):
    """Test PATCH /api/v1/users/me - update to existing email fails."""
    from app.core.security import hash_password

    # Create another user
    other_user = User(
        email="other@example.com",
        password_hash=hash_password("TestPassword123!"),
    )
    session.add(other_user)
    await session.commit()

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
    client: AsyncClient, sample_user: User, auth_headers: dict, session: AsyncSession
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

    # Verify password was updated in database
    await session.refresh(sample_user)
    from app.core.security import verify_password

    assert verify_password("NewPassword456!", sample_user.password_hash)
    assert not verify_password("TestPassword123!", sample_user.password_hash)


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
    client: AsyncClient, sample_user: User, auth_headers: dict, session: AsyncSession
):
    """Test GET /api/v1/users/me/stats - get user statistics."""
    # Create some test data
    from app.models.collection import Collection
    from app.models.conversation import Conversation
    from app.models.document import Document

    # Create collection
    collection = Collection(
        user_id=sample_user.user_id, name="Test Collection", description="Test"
    )
    session.add(collection)

    # Create documents
    doc1 = Document(
        user_id=sample_user.user_id,
        collection_id=collection.collection_id,
        filename="test1.pdf",
        file_type="pdf",
        size_bytes=1024,
        storage_key="test/key1",
        status="ACTIVE",
        chunks_count=10,
    )
    doc2 = Document(
        user_id=sample_user.user_id,
        filename="test2.pdf",
        file_type="pdf",
        size_bytes=2048,
        storage_key="test/key2",
        status="PROCESSING",
        chunks_count=5,
    )
    session.add(doc1)
    session.add(doc2)

    # Create conversation
    conv = Conversation(
        user_id=sample_user.user_id,
        messages=[{"role": "user", "content": "test"}],
        message_count=1,
    )
    session.add(conv)

    await session.commit()

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
