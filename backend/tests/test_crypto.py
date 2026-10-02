"""
Unit tests for core/crypto.py - encryption of stored secrets.
"""

from unittest.mock import patch

import pytest
from cryptography.fernet import Fernet

from app.core.config import settings
from app.core.crypto import (
    EncryptionUnavailableError,
    SecretDecryptionError,
    decrypt_secret,
    encrypt_secret,
    encryption_enabled,
)


@pytest.fixture
def key() -> str:
    """A fresh Fernet key, installed as the server's encryption key."""
    value = Fernet.generate_key().decode()
    with patch.object(settings, "APP_ENCRYPTION_KEY", value):
        yield value


def test_round_trip_and_ciphertext_hides_the_secret(key):
    """Encrypt then decrypt returns the secret; the stored token does not contain it."""
    token = encrypt_secret("sk-or-v1-supersecret")

    assert "supersecret" not in token
    assert decrypt_secret(token) == "sk-or-v1-supersecret"


def test_same_secret_encrypts_differently_each_time(key):
    """Tokens are salted, so equal secrets cannot be spotted in the database."""
    assert encrypt_secret("same") != encrypt_secret("same")


def test_decrypting_with_a_different_key_fails_clearly(key):
    """After the server key changes, old tokens raise SecretDecryptionError."""
    token = encrypt_secret("secret")

    with (
        patch.object(settings, "APP_ENCRYPTION_KEY", Fernet.generate_key().decode()),
        pytest.raises(SecretDecryptionError),
    ):
        decrypt_secret(token)


def test_damaged_token_fails_clearly(key):
    """Garbage in the column raises SecretDecryptionError, not a cryptography internals error."""
    with pytest.raises(SecretDecryptionError):
        decrypt_secret("not-a-token")


@pytest.mark.parametrize("missing", [None, ""])
def test_without_a_server_key_the_feature_is_disabled(missing):
    """No APP_ENCRYPTION_KEY: nothing can be encrypted or decrypted."""
    with patch.object(settings, "APP_ENCRYPTION_KEY", missing):
        assert encryption_enabled() is False
        with pytest.raises(EncryptionUnavailableError):
            encrypt_secret("secret")
        with pytest.raises(EncryptionUnavailableError):
            decrypt_secret("token")


def test_encryption_enabled_with_a_key(key):
    """A configured key enables the feature."""
    assert encryption_enabled() is True
