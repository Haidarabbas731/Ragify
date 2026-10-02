"""Symmetric encryption for secrets stored in the database (users' provider API keys)."""

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


class EncryptionUnavailableError(RuntimeError):
    """APP_ENCRYPTION_KEY is not configured, so secrets cannot be stored."""


class SecretDecryptionError(ValueError):
    """A stored secret cannot be decrypted (the encryption key changed or the data is damaged)."""


def encryption_enabled() -> bool:
    """Whether secrets can be encrypted on this server."""
    return bool(settings.APP_ENCRYPTION_KEY)


def _fernet() -> Fernet:
    """Build the cipher from settings."""
    if not settings.APP_ENCRYPTION_KEY:
        raise EncryptionUnavailableError("APP_ENCRYPTION_KEY is not configured")
    return Fernet(settings.APP_ENCRYPTION_KEY.encode())


def encrypt_secret(plaintext: str) -> str:
    """
    Encrypt a secret for storage.

    Args:
        plaintext: The secret, e.g. an API key

    Returns:
        str: URL-safe token to store

    Raises:
        EncryptionUnavailableError: If APP_ENCRYPTION_KEY is not configured
    """
    return _fernet().encrypt(plaintext.encode()).decode()


def decrypt_secret(token: str) -> str:
    """
    Decrypt a stored secret.

    Args:
        token: Value produced by `encrypt_secret`

    Returns:
        str: The original secret

    Raises:
        EncryptionUnavailableError: If APP_ENCRYPTION_KEY is not configured
        SecretDecryptionError: If the token cannot be decrypted with the current key
    """
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as e:
        raise SecretDecryptionError("Stored secret cannot be decrypted") from e
