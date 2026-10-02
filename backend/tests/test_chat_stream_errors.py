"""
Unit tests for the user-facing error messages of the chat API.
"""

import pytest

from app.api.v1.chat import GENERIC_STREAM_ERROR, _friendly_error
from app.services.providers.base import (
    ProviderAuthError,
    ProviderError,
    ProviderRateLimitError,
    ProviderTimeoutError,
    ProviderUnavailableError,
)


@pytest.mark.parametrize(
    "error",
    [
        ProviderRateLimitError("quota details https://ai.dev/rate-limit id=abc123"),
        ProviderUnavailableError("503 id=abc123"),
        ProviderTimeoutError("timed out id=abc123"),
        ProviderAuthError("invalid key id=abc123"),
        ProviderError("id=abc123"),
    ],
)
def test_provider_errors_show_their_user_message_not_the_payload(error):
    """Provider failures show a safe message; the technical detail never reaches users."""
    message = _friendly_error(error)

    assert message == error.user_message
    assert "abc123" not in message


def test_each_provider_error_has_its_own_message_and_status():
    """Rate limit, outage, timeout and bad key are distinguishable to users and clients."""
    errors = [
        ProviderRateLimitError,
        ProviderUnavailableError,
        ProviderTimeoutError,
        ProviderAuthError,
        ProviderError,
    ]

    assert len({e.user_message for e in errors}) == len(errors)
    assert {e.status_code for e in errors} == {429, 503, 504, 400, 502}
    assert ProviderAuthError.status_code != 401  # 401 would log users out in the frontend


def test_validation_errors_keep_their_message():
    """Our own already-friendly ValueErrors pass through unchanged."""
    assert _friendly_error(ValueError("Query cannot be empty")) == "Query cannot be empty"


def test_unexpected_errors_are_sanitized():
    """Unexpected exceptions never leak into the message."""
    assert _friendly_error(RuntimeError("db password=hunter2")) == GENERIC_STREAM_ERROR
