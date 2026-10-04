"""Rendering and sending of the transactional emails."""

import base64
import logging
import re
from unittest.mock import patch

import pytest

from app.services import email_service
from app.services.email_service import (
    LOGO_CID,
    LOGO_PATH,
    render_email,
    send_password_reset_email,
    send_verification_code_email,
    send_welcome_email,
)

TOKEN = "tok_Abc-123_secretvalue"
RESET_URL = f"http://localhost:5173/reset-password?token={TOKEN}"
CODE = "482913"


@pytest.fixture
def settings():
    """Replace the module's settings with a configured provider."""
    with patch("app.services.email_service.settings") as s:
        s.RESEND_API_KEY = "re_real_looking_key"
        s.FRONTEND_URL = "http://localhost:5173"
        s.PASSWORD_RESET_TOKEN_EXPIRY = 900
        s.EMAIL_FROM_NAME = "Ragify"
        s.EMAIL_FROM_ADDRESS = "no-reply@example.com"
        yield s


@pytest.fixture
def rendered(settings):
    """All three emails rendered to HTML and text."""
    return {
        "reset_password": render_email(
            "reset_password", to_email="user@example.com", reset_url=RESET_URL, expiry_minutes=15
        ),
        "verification_code": render_email(
            "verification_code",
            to_email="user@example.com",
            code=CODE,
            code_spaced="482 913",
            expiry_minutes=10,
        ),
        "welcome": render_email("welcome", to_email="user@example.com"),
    }


@pytest.mark.parametrize("name", ["reset_password", "verification_code", "welcome"])
def test_every_email_uses_solid_colours_and_system_fonts(rendered, name):
    html, _ = rendered[name]
    assert "gradient" not in html
    assert "fonts.googleapis" not in html and "@import" not in html
    assert "KNOWLEDGE" not in html.upper().replace("KNOWLEDGE BASE", "")
    assert 'name="color-scheme"' in html
    assert "prefers-color-scheme: dark" in html


@pytest.mark.parametrize("name", ["reset_password", "verification_code", "welcome"])
def test_every_email_has_a_preheader_and_page_background(rendered, name):
    html, _ = rendered[name]
    assert re.search(r"display:none;[^>]*>\s*\S", html)
    assert re.search(r"<body[^>]*background-color:#[0-9a-f]{6}", html)


@pytest.mark.parametrize("name", ["reset_password", "welcome"])
def test_button_keeps_its_background_without_css_support(rendered, name):
    """The colour is on the cell (bgcolor + style) and on the link, so Outlook cannot drop it."""
    html, _ = rendered[name]
    assert re.search(r'<td[^>]*bgcolor="#6e56cf"[^>]*background-color:#6e56cf', html)
    link = re.search(r'<a [^>]*class="btn-link"[^>]*>', html)
    assert link and "background-color:#6e56cf" in link.group(0)
    assert "padding:14px 28px" in link.group(0)  # 20px line + 28px = 48px tall tap target


def test_reset_email_has_link_expiry_and_plain_text(rendered):
    html, text = rendered["reset_password"]
    assert html.count(RESET_URL) >= 2  # the button and the pasteable fallback
    assert "15 minutes" in html and "15 minutes" in text
    assert RESET_URL in text
    assert "user@example.com" in html


def test_verification_email_shows_the_code_large(rendered):
    html, text = rendered["verification_code"]
    assert CODE in html and CODE in text
    assert "482 913" in html  # in the <title>
    assert "10 minutes" in html
    assert "font-size:38px" in html


def test_welcome_email_points_to_the_app_and_the_key_step(rendered):
    html, text = rendered["welcome"]
    assert 'href="http://localhost:5173"' in html
    assert "AI key" in html and "AI key" in text


def test_user_supplied_values_are_escaped(settings):
    html, text = render_email("welcome", to_email='"><script>alert(1)</script>@example.com')
    assert "<script>" not in html
    assert "&lt;script&gt;" in html


def test_logo_is_inline_and_small(settings):
    html, _ = render_email("welcome", to_email="user@example.com")
    assert f"cid:{LOGO_CID}" in html
    assert LOGO_PATH.stat().st_size < 100_000


def test_email_renders_without_the_logo_file(settings):
    email_service._logo_attachment.cache_clear()
    with patch.object(email_service, "LOGO_PATH", LOGO_PATH.with_name("missing.png")):
        html, _ = render_email("welcome", to_email="user@example.com")
        assert "cid:" not in html
        assert email_service._logo_attachment() is None
    email_service._logo_attachment.cache_clear()


@pytest.mark.asyncio
async def test_reset_email_is_sent_with_subject_text_and_inline_logo(settings):
    email_service._logo_attachment.cache_clear()
    with patch("app.services.email_service.resend.Emails.send", return_value={"id": "e1"}) as send:
        ok = await send_password_reset_email("user@example.com", TOKEN)

    assert ok is True
    params = send.call_args.args[0]
    assert params["subject"] == "Reset your Ragify password"
    assert params["to"] == ["user@example.com"]
    assert RESET_URL in params["html"] and RESET_URL in params["text"]
    attachment = params["attachments"][0]
    assert attachment["content_id"] == LOGO_CID
    assert base64.b64decode(attachment["content"]).startswith(b"\x89PNG")


@pytest.mark.asyncio
async def test_verification_email_subject_carries_the_code(settings):
    with patch("app.services.email_service.resend.Emails.send", return_value={"id": "e2"}) as send:
        ok = await send_verification_code_email("user@example.com", CODE)

    assert ok is True
    assert send.call_args.args[0]["subject"] == "Your Ragify code is 482 913"


@pytest.mark.asyncio
async def test_welcome_email_subject(settings):
    with patch("app.services.email_service.resend.Emails.send", return_value={"id": "e3"}) as send:
        assert await send_welcome_email("user@example.com") is True
    assert send.call_args.args[0]["subject"] == "Welcome to Ragify"


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "key", ["", "your-resend-api-key-here", "re_your_resend_api_key_here"], ids=["empty", "old", "example"]
)
async def test_nothing_is_sent_when_the_provider_is_not_configured(settings, key):
    """An empty key and the placeholder from either example env file both count as not set up."""
    settings.RESEND_API_KEY = key
    with patch("app.services.email_service.resend.Emails.send") as send:
        assert await send_welcome_email("user@example.com") is True
        assert await send_verification_code_email("user@example.com", CODE) is True
        assert await send_password_reset_email("user@example.com", TOKEN) is True
    send.assert_not_called()


@pytest.mark.asyncio
async def test_code_token_and_recipient_never_reach_the_logs(settings, caplog):
    caplog.set_level(logging.DEBUG)
    with patch("app.services.email_service.resend.Emails.send", return_value={"id": "e4"}):
        await send_verification_code_email("user@example.com", CODE)
        await send_password_reset_email("user@example.com", TOKEN)
    with patch("app.services.email_service.resend.Emails.send", side_effect=RuntimeError("boom")):
        assert await send_verification_code_email("user@example.com", CODE) is False

    assert CODE not in caplog.text
    assert TOKEN not in caplog.text
    assert "user@example.com" not in caplog.text
