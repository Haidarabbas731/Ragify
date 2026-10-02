"""
Unit tests for the user-facing error messages of the chat API.
"""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from app.api.v1.chat import GENERIC_STREAM_ERROR, _friendly_error, chat_query
from app.schemas.chat import ChatQuery
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


@pytest.fixture
def endpoint():
    """Patch the endpoint's collaborators; yields (resolve_provider, execute_query) mocks."""
    with (
        patch("app.api.v1.chat.check_rate_limit", new=AsyncMock(return_value=True)),
        patch("app.api.v1.chat.resolve_chat_provider", new=AsyncMock()) as resolve,
        patch("app.api.v1.chat.execute_rag_query", new=AsyncMock()) as execute,
    ):
        yield resolve, execute


async def call_endpoint():
    """Call the non-streaming chat endpoint as a logged-in user."""
    user = MagicMock(user_id="user-1")
    return await chat_query(ChatQuery(query="hello", stream=False), user, MagicMock())


@pytest.mark.asyncio
async def test_endpoint_runs_the_agent_with_the_users_resolved_provider(endpoint):
    """The provider chosen for this user is the one the agent runs with."""
    resolve, execute = endpoint

    await call_endpoint()

    assert execute.call_args.kwargs["provider"] is resolve.return_value


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("error", "status"),
    [
        (ProviderRateLimitError("x"), 429),
        (ProviderUnavailableError("x"), 503),
        (ProviderTimeoutError("x"), 504),
        (ProviderAuthError("x"), 400),
        (ProviderError("x"), 502),
    ],
)
async def test_endpoint_maps_provider_errors_to_status_and_safe_message(endpoint, error, status):
    """Provider failures keep their own HTTP status and never leak the technical detail."""
    _, execute = endpoint
    execute.side_effect = error

    with pytest.raises(HTTPException) as exc:
        await call_endpoint()

    assert exc.value.status_code == status
    assert exc.value.detail == error.user_message


@pytest.mark.asyncio
async def test_endpoint_reports_a_missing_user_key_before_calling_the_model(endpoint):
    """If the user has no usable key, the request ends with that message and no model call."""
    resolve, execute = endpoint
    resolve.side_effect = ProviderAuthError("none", user_message="Add your API key.")

    with pytest.raises(HTTPException) as exc:
        await call_endpoint()

    assert (exc.value.status_code, exc.value.detail) == (400, "Add your API key.")
    execute.assert_not_called()
