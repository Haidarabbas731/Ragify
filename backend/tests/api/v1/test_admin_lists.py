"""Admin list endpoints must not leak sensitive columns."""

import uuid
from datetime import UTC, datetime

import pytest
from httpx import AsyncClient
from sqlalchemy import text

from app.core.security import create_access_token, hash_password

SENSITIVE_USER_FIELDS = {"password_hash", "is_active"}
SENSITIVE_DOCUMENT_FIELDS = {"storage_key", "doc_metadata", "deleted_at"}


@pytest.fixture
async def admin_headers(test_engine):
    """Create an admin user with one document and return its auth headers."""
    user_id = str(uuid.uuid4())
    async with test_engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO users (user_id, email, password_hash, role, storage_used_bytes,
                                   storage_limit_bytes, status, is_active, created_at, updated_at)
                VALUES (:user_id, :email, :password_hash, 'admin', 0, 1073741824, 'active', true,
                        :now, :now)
                """
            ),
            {
                "user_id": user_id,
                "email": f"admin-{user_id[:8]}@example.com",
                "password_hash": hash_password("AdminPassword123!"),
                "now": datetime.now(UTC),
            },
        )
        await conn.execute(
            text(
                """
                INSERT INTO documents (document_id, user_id, filename, file_type, size_bytes,
                                       storage_key, status, chunks_count, uploaded_at)
                VALUES (:document_id, :user_id, 'report.pdf', 'pdf', 2048,
                        :storage_key, 'active', 3, :uploaded_at)
                """
            ),
            {
                "document_id": str(uuid.uuid4())[:8],
                "user_id": user_id,
                "storage_key": f"documents/{user_id}/secret-key-report.pdf",
                "uploaded_at": datetime.now(UTC),
            },
        )
    async with test_engine.begin() as conn:
        await conn.execute(
            text(
                """
                INSERT INTO documents (document_id, user_id, filename, file_type, size_bytes,
                                       storage_key, status, chunks_count, uploaded_at)
                VALUES (:document_id, :user_id, 'broken.pdf', 'pdf', 10,
                        :storage_key, 'error', 0, :uploaded_at)
                """
            ),
            {
                "document_id": str(uuid.uuid4())[:8],
                "user_id": user_id,
                "storage_key": f"documents/{user_id}/broken.pdf",
                "uploaded_at": datetime.now(UTC),
            },
        )

    yield {"Authorization": f"Bearer {create_access_token({'sub': user_id})}"}

    async with test_engine.begin() as conn:
        await conn.execute(
            text("DELETE FROM documents WHERE user_id = :user_id"), {"user_id": user_id}
        )
        await conn.execute(text("DELETE FROM users WHERE user_id = :user_id"), {"user_id": user_id})


@pytest.mark.asyncio
async def test_admin_users_list_hides_sensitive_fields(client: AsyncClient, admin_headers: dict):
    """GET /admin/users returns only the documented user fields."""
    response = await client.get("/api/v1/admin/users", headers=admin_headers)

    assert response.status_code == 200
    users = response.json()["users"]
    assert users, "expected the admin user in the list"
    for user in users:
        assert SENSITIVE_USER_FIELDS.isdisjoint(user)
        assert {"user_id", "email", "role", "status", "storage_used_bytes"} <= set(user)
    assert "$argon2" not in response.text


@pytest.mark.asyncio
async def test_admin_documents_list_hides_storage_details(client: AsyncClient, admin_headers: dict):
    """GET /admin/documents returns only the documented document fields."""
    response = await client.get("/api/v1/admin/documents", headers=admin_headers)

    assert response.status_code == 200
    documents = response.json()["documents"]
    assert documents, "expected the seeded document in the list"
    for document in documents:
        assert SENSITIVE_DOCUMENT_FIELDS.isdisjoint(document)
        assert document["user_email"].endswith("@example.com")
    assert any(document["filename"] == "report.pdf" for document in documents)
    assert "secret-key-report" not in response.text


@pytest.mark.asyncio
async def test_admin_stats_count_failed_documents(client: AsyncClient, admin_headers: dict):
    """GET /admin/stats counts documents whose status is the lowercase "error"."""
    response = await client.get("/api/v1/admin/stats", headers=admin_headers)

    assert response.status_code == 200
    assert response.json()["failed_documents"] >= 1
