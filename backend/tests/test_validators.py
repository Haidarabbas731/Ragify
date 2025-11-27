"""
Tests for app/utils/validators.py validation utilities.

Tests all validation functions used across API endpoints:
- validate_uuid()
"""

import pytest
from fastapi import HTTPException

from app.utils.validators import validate_uuid

# Test validate_uuid with valid UUIDs


def test_validate_uuid_valid_uuid4():
    """Test validation passes for valid UUID v4."""
    valid_uuid = "550e8400-e29b-41d4-a716-446655440000"
    result = validate_uuid(valid_uuid, "document_id")
    assert result == valid_uuid


def test_validate_uuid_valid_uuid1():
    """Test validation passes for valid UUID v1."""
    valid_uuid = "6ba7b810-9dad-11d1-80b4-00c04fd430c8"
    result = validate_uuid(valid_uuid)
    assert result == valid_uuid


def test_validate_uuid_uppercase():
    """Test validation passes for uppercase UUID."""
    valid_uuid = "550E8400-E29B-41D4-A716-446655440000"
    result = validate_uuid(valid_uuid)
    assert result == valid_uuid


def test_validate_uuid_mixed_case():
    """Test validation passes for mixed case UUID."""
    valid_uuid = "550e8400-E29B-41d4-A716-446655440000"
    result = validate_uuid(valid_uuid)
    assert result == valid_uuid


# Test validate_uuid with invalid UUIDs


def test_validate_uuid_invalid_format():
    """Test validation fails for invalid UUID format."""
    with pytest.raises(HTTPException) as exc_info:
        validate_uuid("invalid-uuid-format", "test_id")

    assert exc_info.value.status_code == 400
    assert "Invalid UUID format" in exc_info.value.detail
    assert "test_id" in exc_info.value.detail


def test_validate_uuid_too_short():
    """Test validation fails for UUID that's too short."""
    with pytest.raises(HTTPException) as exc_info:
        validate_uuid("550e8400-e29b-41d4-a716", "document_id")

    assert exc_info.value.status_code == 400
    assert "Invalid UUID format" in exc_info.value.detail


def test_validate_uuid_too_long():
    """Test validation fails for UUID that's too long."""
    with pytest.raises(HTTPException) as exc_info:
        validate_uuid("550e8400-e29b-41d4-a716-446655440000-extra", "user_id")

    assert exc_info.value.status_code == 400
    assert "Invalid UUID format" in exc_info.value.detail


def test_validate_uuid_without_hyphens_accepted():
    """Test validation accepts UUID without hyphens (Python UUID library accepts this)."""
    # Python's UUID() accepts hex strings without hyphens
    result = validate_uuid("550e8400e29b41d4a716446655440000", "collection_id")
    assert result == "550e8400e29b41d4a716446655440000"


def test_validate_uuid_empty_string():
    """Test validation fails for empty string."""
    with pytest.raises(HTTPException) as exc_info:
        validate_uuid("", "document_id")

    assert exc_info.value.status_code == 400
    assert "Invalid UUID format" in exc_info.value.detail


def test_validate_uuid_none_value():
    """Test validation fails for None value."""
    with pytest.raises(HTTPException) as exc_info:
        validate_uuid(None, "user_id")  # type: ignore

    assert exc_info.value.status_code == 400
    assert "Invalid UUID format" in exc_info.value.detail


def test_validate_uuid_special_characters():
    """Test validation fails for UUID with invalid characters."""
    with pytest.raises(HTTPException) as exc_info:
        validate_uuid("550e8400-e29b-41d4-a716-44665544000g", "test_id")

    assert exc_info.value.status_code == 400
    assert "Invalid UUID format" in exc_info.value.detail


def test_validate_uuid_custom_param_name():
    """Test custom parameter name appears in error message."""
    with pytest.raises(HTTPException) as exc_info:
        validate_uuid("invalid", "my_custom_id")

    assert exc_info.value.status_code == 400
    assert "my_custom_id" in exc_info.value.detail


def test_validate_uuid_default_param_name():
    """Test default parameter name is 'ID' when not specified."""
    with pytest.raises(HTTPException) as exc_info:
        validate_uuid("invalid")

    assert exc_info.value.status_code == 400
    assert "ID" in exc_info.value.detail


def test_validate_uuid_expected_format_in_error():
    """Test error message includes expected UUID format."""
    with pytest.raises(HTTPException) as exc_info:
        validate_uuid("invalid")

    assert exc_info.value.status_code == 400
    assert "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" in exc_info.value.detail
