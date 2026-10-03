"""The password reset token and link are credentials and must never reach the logs."""

import logging
from unittest.mock import patch

import pytest

from app.services.email_service import send_password_reset_email

TOKEN = "super-secret-reset-token-1234567890"


@pytest.mark.asyncio
async def test_reset_token_not_logged_when_email_not_configured(caplog):
    """With no email provider configured the token must not be printed for convenience."""
    caplog.set_level(logging.DEBUG)

    with patch("app.services.email_service.settings") as settings:
        settings.RESEND_API_KEY = ""
        settings.FRONTEND_URL = "http://localhost:5173"
        result = await send_password_reset_email("user@example.com", TOKEN)

    assert result is True
    assert TOKEN not in caplog.text
    assert "reset-password?token" not in caplog.text


@pytest.mark.asyncio
async def test_reset_token_not_logged_when_sending_fails(caplog):
    """A failing provider call logs the failure, never the token."""
    caplog.set_level(logging.DEBUG)

    with (
        patch("app.services.email_service.settings") as settings,
        patch("app.services.email_service.resend.Emails.send", side_effect=RuntimeError("boom")),
    ):
        settings.RESEND_API_KEY = "re_real_looking_key"
        settings.FRONTEND_URL = "http://localhost:5173"
        settings.EMAIL_FROM_NAME = "Ragify"
        settings.EMAIL_FROM_ADDRESS = "no-reply@example.com"
        result = await send_password_reset_email("user@example.com", TOKEN)

    assert result is False
    assert TOKEN not in caplog.text
    assert "re_real_looking_key" not in caplog.text
