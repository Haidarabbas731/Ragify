"""Transactional emails: Jinja2 templates rendered to HTML and plain text, sent through Resend."""

import asyncio
import base64
import logging
from functools import lru_cache
from pathlib import Path

import resend
from jinja2 import Environment, FileSystemLoader, StrictUndefined, select_autoescape

from app.core.config import settings

logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY

APP_NAME = "Ragify"
TEMPLATE_DIR = Path(__file__).resolve().parents[1] / "templates" / "email"
LOGO_PATH = Path(__file__).resolve().parents[2] / "public" / "images" / "ragify.png"
LOGO_CID = "ragify-logo"

# System font stacks only: web fonts do not load in most mail clients.
FONT_SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
FONT_MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"

_env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html"]),
    undefined=StrictUndefined,
    trim_blocks=True,
    lstrip_blocks=True,
)


@lru_cache(maxsize=1)
def _logo_attachment() -> dict[str, str] | None:
    """The inline logo attachment, or None when the file is not deployed."""
    if not LOGO_PATH.is_file():
        logger.warning("Email logo not found at %s - emails are sent without it", LOGO_PATH)
        return None
    return {
        "filename": LOGO_PATH.name,
        "content": base64.b64encode(LOGO_PATH.read_bytes()).decode("ascii"),
        "content_type": "image/png",
        "content_id": LOGO_CID,
    }


def render_email(name: str, **context: object) -> tuple[str, str]:
    """
    Render an email template to HTML and plain text.

    Args:
        name: Template name without extension (``reset_password``, ``verification_code``, ``welcome``)
        **context: Variables for the template, on top of the shared brand values

    Returns:
        tuple[str, str]: ``(html, text)``
    """
    shared = {
        "app_name": APP_NAME,
        "app_url": settings.FRONTEND_URL,
        "font_sans": FONT_SANS,
        "font_mono": FONT_MONO,
        "logo_cid": LOGO_CID if _logo_attachment() else None,
    }
    values = {**shared, **context}
    html = _env.get_template(f"{name}.html").render(values)
    text = _env.get_template(f"{name}.txt").render(values)
    return html, text


def _email_configured() -> bool:
    """True when a real Resend API key is set."""
    return bool(settings.RESEND_API_KEY) and settings.RESEND_API_KEY != "your-resend-api-key-here"


async def _send(to_email: str, subject: str, html: str, text: str, kind: str) -> bool:
    """
    Send one rendered email through Resend.

    Args:
        to_email: Recipient address
        subject: Subject line
        html: HTML body
        text: Plain-text body
        kind: Short label for logs (never the content or the recipient)

    Returns:
        bool: True if sent, False if the provider call failed
    """
    params: dict[str, object] = {
        "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>",
        "to": [to_email],
        "subject": subject,
        "html": html,
        "text": text,
    }
    logo = _logo_attachment()
    if logo:
        params["attachments"] = [logo]

    try:
        # The SDK is blocking; keep it off the event loop.
        response = await asyncio.to_thread(resend.Emails.send, params)  # type: ignore[arg-type]
        logger.info("%s email sent. Email ID: %s", kind, response["id"])
        return True
    except Exception as e:
        logger.error("Failed to send %s email: %s", kind, e)
        return False


async def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """
    Send the password reset email with a single-use link.

    The token and link are secrets and are never logged.

    Args:
        to_email: Recipient email address
        reset_token: Cryptographically secure reset token

    Returns:
        bool: True if the email was sent, or if email sending is not configured
    """
    if not _email_configured():
        logger.warning("Resend API key not configured - password reset email was not sent")
        return True

    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    html, text = render_email(
        "reset_password",
        to_email=to_email,
        reset_url=reset_url,
        expiry_minutes=max(1, settings.PASSWORD_RESET_TOKEN_EXPIRY // 60),
    )
    return await _send(to_email, f"Reset your {APP_NAME} password", html, text, "Password reset")


async def send_verification_code_email(to_email: str, code: str, expiry_minutes: int = 10) -> bool:
    """
    Send the email verification code.

    The code is a secret and is never logged.

    Args:
        to_email: Recipient email address
        code: The 6-digit code
        expiry_minutes: How long the code stays valid, shown in the email

    Returns:
        bool: True if the email was sent, or if email sending is not configured
    """
    if not _email_configured():
        logger.warning("Resend API key not configured - verification email was not sent")
        return True

    code_spaced = f"{code[:3]} {code[3:]}" if len(code) == 6 else code
    html, text = render_email(
        "verification_code",
        to_email=to_email,
        code=code,
        code_spaced=code_spaced,
        expiry_minutes=expiry_minutes,
    )
    return await _send(
        to_email, f"Your {APP_NAME} code is {code_spaced}", html, text, "Verification code"
    )


async def send_welcome_email(to_email: str) -> bool:
    """
    Send the welcome email to a newly registered user.

    Args:
        to_email: Recipient email address

    Returns:
        bool: True if the email was sent, or if email sending is not configured
    """
    if not _email_configured():
        logger.warning("Resend API key not configured - welcome email was not sent")
        return True

    html, text = render_email("welcome", to_email=to_email)
    return await _send(to_email, f"Welcome to {APP_NAME}", html, text, "Welcome")


async def check_email_service_health() -> dict[str, str]:
    """
    Check Resend email service health status.

    Returns:
        dict: Health status with 'status' key ('up', 'down', or 'not_configured')
    """
    if not _email_configured():
        return {"status": "not_configured", "message": "Resend API key not configured"}

    try:
        # Resend has no dedicated health endpoint, so we only verify the key is set.
        if resend.api_key:
            return {"status": "up", "message": "Email service operational"}
        return {"status": "down", "message": "API key not set"}
    except Exception as e:
        logger.error("Email service health check failed: %s", e)
        return {"status": "down", "message": f"Service unavailable: {e}"}
