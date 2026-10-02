"""Symmetric encryption for secrets stored in the database (users' provider API keys)."""

import base64

from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF

from app.core.config import settings


class SecretDecryptionError(ValueError):
    """A stored secret cannot be decrypted (the encryption secret changed or the data is damaged)."""


def _fernet() -> Fernet:
    """
    Build the cipher.

    Uses APP_ENCRYPTION_KEY when set; otherwise derives a key from JWT_SECRET_KEY (HKDF with
    a purpose label, so the derived key is unrelated to the one that signs tokens).
    """
    if settings.APP_ENCRYPTION_KEY:
        return Fernet(settings.APP_ENCRYPTION_KEY.encode())

    derived = HKDF(
        algorithm=hashes.SHA256(), length=32, salt=None, info=b"ragify:user-api-keys:v1"
    ).derive(settings.JWT_SECRET_KEY.encode())
    return Fernet(base64.urlsafe_b64encode(derived))


def encrypt_secret(plaintext: str) -> str:
    """
    Encrypt a secret for storage.

    Args:
        plaintext: The secret, e.g. an API key

    Returns:
        str: URL-safe token to store
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
        SecretDecryptionError: If the token cannot be decrypted with the current secret
    """
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as e:
        raise SecretDecryptionError("Stored secret cannot be decrypted") from e
