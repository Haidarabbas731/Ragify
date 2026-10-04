"""
Tests for the readable summary of request validation errors (the `detail` field forms show).
"""

import json
from unittest.mock import MagicMock

import pytest
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError

from app.api.exceptions import summarize_validation_errors, validation_exception_handler
from app.schemas.user import UserRegister


def real_errors(**overrides) -> list[dict]:
    """The errors pydantic really produces for a registration with the given overrides.

    Locations get the "body" prefix FastAPI adds for request bodies.
    """
    values = {
        "email": "person@example.com",
        "password": "Str0ng!Passw0rd",
    }
    with pytest.raises(ValidationError) as exc:
        UserRegister(**(values | overrides))
    return [{**error, "loc": ("body", *error["loc"])} for error in exc.value.errors()]


def test_a_reserved_email_domain_gets_an_actionable_message():
    """The case that reached a user: test@test.local is rejected with a clear reason."""
    message = summarize_validation_errors(real_errors(email="test@test.local"))

    assert message.startswith("Email: use a real email address")
    assert ".local" in message
    assert "special-use" not in message  # no library jargon


def test_a_malformed_email_drops_the_library_prefix():
    """Ordinary invalid emails keep the library's reason without its boilerplate prefix."""
    message = summarize_validation_errors(real_errors(email="not-an-email"))

    assert message.startswith("Email: ")
    assert "value is not a valid email address:" not in message


def test_field_names_are_readable():
    """Snake_case fields become words."""
    errors = [{"loc": ("body", "new_password"), "msg": "Value error, too short"}]

    assert summarize_validation_errors(errors) == "New password: too short"


def test_only_the_first_few_errors_are_listed_with_a_count_of_the_rest():
    """A form with many problems stays one short sentence."""
    errors = [{"loc": ("body", f"field_{i}"), "msg": "required"} for i in range(5)]

    message = summarize_validation_errors(errors)

    assert message.count(";") == 3
    assert message.endswith("and 2 more")


def test_no_errors_falls_back_to_the_generic_text():
    """An empty list never produces an empty message."""
    assert summarize_validation_errors([]) == "Invalid request data"


@pytest.mark.asyncio
async def test_the_response_keeps_the_old_fields_and_adds_a_readable_detail():
    """`message` and `details` are unchanged; `detail` is the new human sentence."""
    exc = RequestValidationError(real_errors(email="test@test.local"))

    response = await validation_exception_handler(MagicMock(), exc)
    body = json.loads(response.body)

    assert response.status_code == 422
    assert body["error"] == "VALIDATION_ERROR"
    assert body["message"] == "Invalid request data"
    assert body["details"][0]["loc"] == ["body", "email"]
    assert body["detail"].startswith("Email: use a real email address")
