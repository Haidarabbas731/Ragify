"""
Unit tests for auth_service.py - Authentication logic.

Tests:
- User registration (with password validation, invite code validation)
- User authentication (login, password verification, account status)
- Token refresh
- User logout (token revocation)
"""

from unittest.mock import patch

import pytest
from sqlmodel.ext.asyncio.session import AsyncSession

from app.models.user import User
from app.services.auth_service import (
    authenticate_user,
    logout_user,
    refresh_access_token_from_details,
    register_user,
)

# Test: register_user - Success


@pytest.mark.asyncio
async def test_register_user_success(session: AsyncSession):
    """Test successful user registration."""

    with patch(
        "app.services.auth_service.validate_password_strength"
    ) as mock_validate_pwd, patch(
        "app.services.auth_service.validate_invite_code_for_registration"
    ) as mock_validate_invite, patch(
        "app.services.auth_service.get_user_by_email"
    ) as mock_get_user, patch(
        "app.services.auth_service.hash_password"
    ) as mock_hash, patch(
        "app.services.auth_service.create_user"
    ) as mock_create, patch(
        "app.services.auth_service.use_invite_code"
    ) as mock_use_invite:
        # Setup mocks
        mock_validate_pwd.return_value = (True, "")
        mock_validate_invite.return_value = (True, "")
        mock_get_user.return_value = None
        mock_hash.return_value = "hashed_password_123"

        mock_user = User(
            email="newuser@example.com",
            password_hash="hashed_password_123",
            role="user",
        )
        mock_create.return_value = mock_user

        # Execute registration
        success, message, user_data = await register_user(
            session, "newuser@example.com", "ValidPass123!", "KB-1234-5678-9ABC"
        )

        # Assertions
        assert success is True
        assert message == "User registered successfully"
        assert user_data is not None
        assert user_data["email"] == "newuser@example.com"

        mock_validate_pwd.assert_called_once_with("ValidPass123!")
        mock_validate_invite.assert_called_once()
        mock_hash.assert_called_once_with("ValidPass123!")
        mock_use_invite.assert_called_once()


# Test: register_user - Weak password


@pytest.mark.asyncio
async def test_register_user_weak_password(session: AsyncSession):
    """Test registration fails with weak password."""

    with patch(
        "app.services.auth_service.validate_password_strength"
    ) as mock_validate_pwd:
        mock_validate_pwd.return_value = (
            False,
            "Password must be at least 8 characters",
        )

        success, message, user_data = await register_user(
            session, "newuser@example.com", "weak", None
        )

        assert success is False
        assert "at least 8 characters" in message
        assert user_data is None


# Test: register_user - Invalid invite code


@pytest.mark.asyncio
async def test_register_user_invalid_invite_code(session: AsyncSession):
    """Test registration fails with invalid invite code."""

    with patch(
        "app.services.auth_service.validate_password_strength"
    ) as mock_validate_pwd, patch(
        "app.services.auth_service.validate_invite_code_for_registration"
    ) as mock_validate_invite:
        mock_validate_pwd.return_value = (True, "")
        mock_validate_invite.return_value = (False, "Invalid invite code")

        success, message, user_data = await register_user(
            session, "newuser@example.com", "ValidPass123!", "INVALID-CODE"
        )

        assert success is False
        assert "Invalid invite code" in message
        assert user_data is None


# Test: register_user - Email already exists


@pytest.mark.asyncio
async def test_register_user_email_exists(session: AsyncSession):
    """Test registration fails when email already registered."""

    with patch(
        "app.services.auth_service.validate_password_strength"
    ) as mock_validate_pwd, patch(
        "app.services.auth_service.validate_invite_code_for_registration"
    ) as mock_validate_invite, patch(
        "app.services.auth_service.get_user_by_email"
    ) as mock_get_user:
        mock_validate_pwd.return_value = (True, "")
        mock_validate_invite.return_value = (True, "")
        mock_get_user.return_value = User(
            email="existing@example.com", password_hash="hash", role="user"
        )

        success, message, user_data = await register_user(
            session, "existing@example.com", "ValidPass123!", None
        )

        assert success is False
        assert message == "Email already registered"
        assert user_data is None


# Test: authenticate_user - Success


@pytest.mark.asyncio
async def test_authenticate_user_success(session: AsyncSession):
    """Test successful user authentication."""

    mock_user = User(
        user_id="user123",
        email="user@example.com",
        password_hash="hashed_password",
        role="user",
        status="active",
        is_active=True,
    )

    with patch("app.services.auth_service.get_user_by_email") as mock_get_user, patch(
        "app.services.auth_service.verify_password"
    ) as mock_verify, patch(
        "app.services.auth_service.is_token_issued_before_password_change"
    ) as mock_is_token_invalid, patch(
        "app.services.auth_service.create_access_token"
    ) as mock_create_access, patch(
        "app.services.auth_service.create_refresh_token"
    ) as mock_create_refresh, patch(
        "app.services.auth_service.decode_token"
    ) as mock_decode, patch(
        "app.services.auth_service.store_token_pair"
    ) as mock_store_pair, patch(
        "app.services.auth_service.update_user_last_login"
    ) as mock_update_login:
        # Setup mocks
        mock_get_user.return_value = mock_user
        mock_verify.return_value = True
        mock_is_token_invalid.return_value = False
        mock_create_access.return_value = "access_token_123"
        mock_create_refresh.return_value = "refresh_token_456"
        mock_decode.side_effect = [
            {"jti": "access_jti", "sub": "user123"},
            {"jti": "refresh_jti", "sub": "user123"},
        ]

        # Execute authentication
        success, message, tokens = await authenticate_user(
            session, "user@example.com", "correct_password"
        )

        # Assertions
        assert success is True
        assert message == "Login successful"
        assert tokens is not None
        assert tokens["access_token"] == "access_token_123"
        assert tokens["refresh_token"] == "refresh_token_456"
        assert tokens["token_type"] == "bearer"
        assert "user" in tokens

        mock_verify.assert_called_once_with("correct_password", "hashed_password")
        mock_update_login.assert_called_once()
        mock_store_pair.assert_called_once()


# Test: authenticate_user - Invalid email


@pytest.mark.asyncio
async def test_authenticate_user_invalid_email(session: AsyncSession):
    """Test authentication fails with non-existent email."""

    with patch("app.services.auth_service.get_user_by_email") as mock_get_user:
        mock_get_user.return_value = None

        success, message, tokens = await authenticate_user(
            session, "nonexistent@example.com", "password"
        )

        assert success is False
        assert message == "Invalid email or password"
        assert tokens is None


# Test: authenticate_user - Wrong password


@pytest.mark.asyncio
async def test_authenticate_user_wrong_password(session: AsyncSession):
    """Test authentication fails with incorrect password."""

    mock_user = User(
        email="user@example.com",
        password_hash="hashed_password",
        role="user",
        is_active=True,
    )

    with patch("app.services.auth_service.get_user_by_email") as mock_get_user, patch(
        "app.services.auth_service.verify_password"
    ) as mock_verify:
        mock_get_user.return_value = mock_user
        mock_verify.return_value = False

        success, message, tokens = await authenticate_user(
            session, "user@example.com", "wrong_password"
        )

        assert success is False
        assert message == "Invalid email or password"
        assert tokens is None


# Test: authenticate_user - Suspended account


@pytest.mark.asyncio
async def test_authenticate_user_suspended_account(session: AsyncSession):
    """Test authentication fails for suspended account."""

    mock_user = User(
        email="user@example.com",
        password_hash="hashed_password",
        role="user",
        is_active=False,  # Account suspended
    )

    with patch("app.services.auth_service.get_user_by_email") as mock_get_user, patch(
        "app.services.auth_service.verify_password"
    ) as mock_verify:
        mock_get_user.return_value = mock_user
        mock_verify.return_value = True

        success, message, tokens = await authenticate_user(
            session, "user@example.com", "correct_password"
        )

        assert success is False
        assert message == "Account is suspended"
        assert tokens is None


# Test: authenticate_user - Session revoked


@pytest.mark.asyncio
async def test_authenticate_user_session_revoked(session: AsyncSession):
    """Test authentication fails when user sessions are revoked."""

    mock_user = User(
        user_id="user123",
        email="user@example.com",
        password_hash="hashed_password",
        role="user",
        is_active=True,
    )

    with patch("app.services.auth_service.get_user_by_email") as mock_get_user, patch(
        "app.services.auth_service.verify_password"
    ) as mock_verify, patch(
        "app.services.auth_service.is_token_issued_before_password_change"
    ) as mock_is_token_invalid, patch(
        "app.services.auth_service.create_access_token"
    ) as mock_create_access, patch(
        "app.services.auth_service.decode_token"
    ) as mock_decode:
        mock_get_user.return_value = mock_user
        mock_verify.return_value = True
        mock_create_access.return_value = "access_token_123"
        mock_decode.return_value = {
            "jti": "access_jti",
            "sub": "user123",
            "iat": 1234567890,
        }
        mock_is_token_invalid.return_value = True  # Token issued before password change

        success, message, tokens = await authenticate_user(
            session, "user@example.com", "correct_password"
        )

        assert success is False
        assert "password change" in message.lower()
        assert tokens is None


# Test: refresh_access_token_from_details - Success


@pytest.mark.asyncio
async def test_refresh_token_success():
    """Test successful token refresh."""

    token_details = {"sub": "user123", "role": "user", "jti": "old_refresh_jti"}

    with patch(
        "app.services.auth_service.is_token_issued_before_password_change"
    ) as mock_is_token_invalid, patch(
        "app.services.auth_service.add_jti_to_blocklist"
    ) as mock_add_blocklist, patch(
        "app.services.auth_service.create_access_token"
    ) as mock_create_access, patch(
        "app.services.auth_service.create_refresh_token"
    ) as mock_create_refresh, patch(
        "app.services.auth_service.decode_token"
    ) as mock_decode, patch(
        "app.services.auth_service.store_token_pair"
    ) as mock_store_pair:
        # Setup mocks
        mock_is_token_invalid.return_value = False
        mock_create_access.return_value = "new_access_token"
        mock_create_refresh.return_value = "new_refresh_token"
        mock_decode.side_effect = [
            {"jti": "new_access_jti"},
            {"jti": "new_refresh_jti"},
        ]

        # Execute refresh
        success, message, tokens = await refresh_access_token_from_details(
            token_details
        )

        # Assertions
        assert success is True
        assert message == "Token refreshed"
        assert tokens is not None
        assert tokens["access_token"] == "new_access_token"
        assert tokens["refresh_token"] == "new_refresh_token"

        mock_add_blocklist.assert_called_once()  # Old refresh token revoked
        mock_store_pair.assert_called_once()  # New token pair stored


# Test: refresh_access_token_from_details - Invalid payload


@pytest.mark.asyncio
async def test_refresh_token_invalid_payload():
    """Test token refresh fails with invalid payload."""

    token_details = {}  # Missing 'sub'

    success, message, tokens = await refresh_access_token_from_details(token_details)

    assert success is False
    assert message == "Invalid token payload"
    assert tokens is None


# Test: refresh_access_token_from_details - Session revoked


@pytest.mark.asyncio
async def test_refresh_token_session_revoked():
    """Test token refresh fails when token was issued before password change."""

    token_details = {
        "sub": "user123",
        "role": "user",
        "jti": "old_refresh_jti",
        "iat": 1234567890,
    }

    with patch(
        "app.services.auth_service.is_token_issued_before_password_change"
    ) as mock_is_token_invalid:
        mock_is_token_invalid.return_value = True  # Token issued before password change

        success, message, tokens = await refresh_access_token_from_details(
            token_details
        )

        assert success is False
        assert "password change" in message.lower()
        assert tokens is None


# Test: logout_user - Success


@pytest.mark.asyncio
async def test_logout_user_success():
    """Test successful user logout."""

    with patch("app.services.auth_service.add_jti_to_blocklist") as mock_add_blocklist:
        success, message = await logout_user(
            access_jti="access_jti_123",
            access_ttl=3600,
            refresh_jti="refresh_jti_456",
            refresh_ttl=604800,
            user_id=None,
        )

        assert success is True
        assert message == "Logged out successfully"
        assert mock_add_blocklist.call_count == 2  # Access + refresh tokens


# Test: logout_user - Access token only


@pytest.mark.asyncio
async def test_logout_user_access_only():
    """Test logout with access token only."""

    with patch("app.services.auth_service.add_jti_to_blocklist") as mock_add_blocklist:
        success, message = await logout_user(
            access_jti="access_jti_123",
            access_ttl=3600,
            refresh_jti=None,
            refresh_ttl=None,
            user_id=None,
        )

        assert success is True
        assert message == "Logged out successfully"
        assert mock_add_blocklist.call_count == 1  # Only access token


# Test: logout_user - With user ID (revoke all sessions)


@pytest.mark.asyncio
async def test_logout_user_revoke_all_sessions():
    """Test logout revokes all user sessions when user_id provided."""

    with patch("app.services.auth_service.add_jti_to_blocklist"):
        with patch(
            "app.services.redis_service.revoke_all_user_sessions"
        ) as mock_revoke_all:
            success, message = await logout_user(
                access_jti="access_jti_123",
                access_ttl=3600,
                refresh_jti="refresh_jti_456",
                refresh_ttl=604800,
                user_id="user123",
            )

            assert success is True
            assert message == "Logged out successfully"
            mock_revoke_all.assert_called_once_with("user123", 604800)
