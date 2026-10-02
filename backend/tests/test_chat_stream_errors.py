"""
Unit tests for the user-facing error messages of the chat SSE stream.
"""

import pytest
from google.genai import errors

from app.api.v1.chat import (
    BUSY_MESSAGE,
    GENERIC_STREAM_ERROR,
    RATE_LIMITED_MESSAGE,
    _friendly_stream_error,
)


def api_error(cls, code: int) -> errors.APIError:
    """Build a provider error with a noisy payload that must never reach users."""
    return cls(code, {"error": {"message": "quota details https://ai.dev/rate-limit id=abc123"}})


@pytest.mark.parametrize(
    ("error", "expected"),
    [
        (api_error(errors.ClientError, 429), RATE_LIMITED_MESSAGE),
        (api_error(errors.ServerError, 503), BUSY_MESSAGE),
        (api_error(errors.ServerError, 500), BUSY_MESSAGE),
        (api_error(errors.ClientError, 400), GENERIC_STREAM_ERROR),
        (RuntimeError("db password=hunter2"), GENERIC_STREAM_ERROR),
    ],
)
def test_provider_and_unexpected_errors_are_sanitized(error, expected):
    """Provider payloads and unexpected exceptions never leak into the message."""
    message = _friendly_stream_error(error)

    assert message == expected
    assert "abc123" not in message
    assert "hunter2" not in message


@pytest.mark.parametrize("error", [TimeoutError("The AI is taking too long."), ValueError("Query cannot be empty")])
def test_timeouts_and_validation_errors_keep_their_message(error):
    """Our own already-friendly errors pass through unchanged."""
    assert _friendly_stream_error(error) == str(error)
