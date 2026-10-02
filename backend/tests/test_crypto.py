"""
Unit tests for core/crypto.py - encryption of stored secrets.
"""

from unittest.mock import patch

import pytest
from cryptography.fernet import Fernet

from app.core.config import settings
from app.core.crypto import SecretDecryptionError, decrypt_secret, encrypt_secret


@pytest.fixture(autouse=True)
def derived_key():
    """Default setup: no explicit encryption key, so one is derived from JWT_SECRET_KEY."""
    with (
        patch.object(settings, "APP_ENCRYPTION_KEY", None),
        patch.object(settings, "JWT_SECRET_KEY", "a-jwt-secret-for-tests"),
    ):
        yield


def test_works_with_no_extra_configuration():
    """Without APP_ENCRYPTION_KEY, encryption still works (derived from the JWT secret)."""
    assert decrypt_secret(encrypt_secret("sk-or-v1-supersecret")) == "sk-or-v1-supersecret"


def test_ciphertext_hides_the_secret_and_is_salted():
    """The stored token does not contain the secret, and equal secrets encrypt differently."""
    token = encrypt_secret("sk-or-v1-supersecret")

    assert "supersecret" not in token
    assert encrypt_secret("same") != encrypt_secret("same")


def test_changing_the_jwt_secret_makes_saved_secrets_unreadable_with_a_clear_error():
    """Rotating JWT_SECRET_KEY means saved keys must be re-entered; it fails clearly."""
    token = encrypt_secret("secret")

    with (
        patch.object(settings, "JWT_SECRET_KEY", "a-different-secret"),
        pytest.raises(SecretDecryptionError),
    ):
        decrypt_secret(token)


def test_the_derived_key_is_not_the_jwt_secret_itself():
    """A token cannot be opened by using the raw JWT secret as the key (domain separation)."""
    token = encrypt_secret("secret")

    with (
        patch.object(settings, "APP_ENCRYPTION_KEY", Fernet.generate_key().decode()),
        pytest.raises(SecretDecryptionError),
    ):
        decrypt_secret(token)


def test_an_explicit_encryption_key_takes_precedence():
    """APP_ENCRYPTION_KEY, when set, is used instead of the derived key."""
    explicit = Fernet.generate_key().decode()
    with patch.object(settings, "APP_ENCRYPTION_KEY", explicit):
        token = encrypt_secret("secret")

        assert Fernet(explicit.encode()).decrypt(token.encode()) == b"secret"
        assert decrypt_secret(token) == "secret"


def test_damaged_token_fails_clearly():
    """Garbage in the column raises SecretDecryptionError, not a cryptography internals error."""
    with pytest.raises(SecretDecryptionError):
        decrypt_secret("not-a-token")
