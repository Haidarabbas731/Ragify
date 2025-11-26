"""Validation utilities for API endpoints.

This module provides reusable validation functions for common operations
like UUID validation across all API endpoints.
"""

from uuid import UUID

from fastapi import HTTPException, status


def validate_uuid(uuid_string: str, param_name: str = "ID") -> str:
    """
    Validate if a string is a valid UUID format.

    This validator is used across all API endpoints to ensure UUID parameters
    (path parameters, query parameters, form data, request body fields) have
    valid UUID format before database queries.

    Args:
        uuid_string: The string to validate as UUID
        param_name: Name of the parameter for error message (e.g., "document_id", "user_id")

    Returns:
        str: The validated UUID string (unchanged)

    Raises:
        HTTPException: 400 Bad Request if invalid UUID format

    Examples:
        >>> validate_uuid("550e8400-e29b-41d4-a716-446655440000", "document_id")
        '550e8400-e29b-41d4-a716-446655440000'

        >>> validate_uuid("invalid-uuid", "document_id")
        HTTPException: 400 Bad Request

    Usage in endpoints:
        ```python
        @router.get("/documents/{document_id}")
        async def get_document(document_id: str, ...):
            validate_uuid(document_id, "document_id")
            # Proceed with database query
        ```

    Usage in schemas:
        ```python
        @field_validator('document_id')
        @classmethod
        def validate_document_id(cls, v):
            if v is not None:
                validate_uuid(v, "document_id")
            return v
        ```
    """
    try:
        # Attempt to parse as UUID - raises ValueError if invalid
        UUID(uuid_string)
        return uuid_string
    except (ValueError, AttributeError, TypeError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid UUID format for {param_name}: {uuid_string}. "
            f"Expected format: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'",
        ) from e
