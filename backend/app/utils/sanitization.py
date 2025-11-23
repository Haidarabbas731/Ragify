import re
from pathlib import Path


def sanitize_email(email: str) -> str:
    """
    Sanitize email address.

    Args:
        email: Email address to sanitize

    Returns:
        Sanitized email (lowercase, trimmed)
    """
    return email.lower().strip()


def sanitize_text_input(text: str) -> str:
    """
    Sanitize text input by removing null bytes and control characters.

    Args:
        text: Text to sanitize

    Returns:
        Sanitized text
    """
    text = text.replace("\x00", "")

    text = "".join(char for char in text if ord(char) >= 32 or char in "\n\r\t")

    return text.strip()


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename by removing path traversal characters and dangerous chars.

    Args:
        filename: Original filename

    Returns:
        Safe filename
    """
    filename = Path(filename).name

    filename = re.sub(r'[<>:"|?*\x00-\x1f]', "", filename)

    filename = filename.replace("..", "")

    filename = re.sub(r"\s+", "_", filename)

    if not filename or filename.startswith("."):
        filename = "file" + filename

    return filename[:255]


def validate_file_extension(filename: str, allowed: list[str]) -> bool:
    """
    Validate file extension against allowed list.

    Args:
        filename: File name to check
        allowed: List of allowed extensions (without dots)

    Returns:
        True if extension is allowed
    """
    extension = Path(filename).suffix.lower().lstrip(".")
    return extension in [ext.lower() for ext in allowed]


def sanitize_query(query: str, max_length: int = 1000) -> str:
    """
    Sanitize user query input.

    Args:
        query: User query text
        max_length: Maximum allowed length

    Returns:
        Sanitized query
    """
    query = sanitize_text_input(query)

    query = query[:max_length]

    return query


def validate_collection_name(name: str) -> bool:
    """
    Validate collection name (alphanumeric, spaces, hyphens, underscores only).

    Args:
        name: Collection name to validate

    Returns:
        True if valid
    """
    if not name or len(name) > 255:
        return False

    pattern = r"^[a-zA-Z0-9\s\-_]+$"
    return bool(re.match(pattern, name))
