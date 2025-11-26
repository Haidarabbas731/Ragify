import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY


async def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """
    Send password reset email with secure token link.

    Always logs the token to console for development/testing purposes.
    Can be removed once frontend is integrated.

    Args:
        to_email: Recipient email address
        reset_token: Cryptographically secure reset token

    Returns:
        bool: True if email sent successfully or token logged
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

    # Always log token to console for development/testing (no frontend yet)
    logger.warning("=" * 80)
    logger.warning("PASSWORD RESET TOKEN (Development Mode)")
    logger.warning("=" * 80)
    logger.warning(f"Email: {to_email}")
    logger.warning(f"Token: {reset_token}")
    logger.warning(f"Reset URL: {reset_url}")
    logger.warning("")
    logger.warning("Use this token to reset password via API:")
    logger.warning("POST /api/v1/auth/password-reset/confirm")
    logger.warning(f'{{"token": "{reset_token}", "new_password": "YourNewPassword123!"}}')
    logger.warning("=" * 80)

    # If Resend is not configured, return success (development mode)
    if not settings.RESEND_API_KEY or settings.RESEND_API_KEY == "your-resend-api-key-here":
        logger.info("Resend API key not configured - skipping email send")
        return True

    params = {
        "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>",
        "to": [to_email],
        "subject": "Reset Your Password - AI Knowledge Base",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%); font-family: 'Crimson Pro', Georgia, serif;">

            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 60px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%); border-radius: 0; overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1) inset;">

                            <!-- Decorative Top Edge -->
                            <tr>
                                <td style="background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%); height: 3px; padding: 0;"></td>
                            </tr>

                            <!-- Hero Section -->
                            <tr>
                                <td style="padding: 64px 56px 48px 56px; background: linear-gradient(135deg, rgba(102,126,234,0.03) 0%, rgba(118,75,162,0.05) 100%);">
                                    <!-- Brand Mark -->
                                    <div style="margin-bottom: 32px;">
                                        <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; color: #667eea; letter-spacing: 2px; text-transform: uppercase; border: 1.5px solid #667eea; padding: 6px 14px; display: inline-block; border-radius: 0;">
                                            KNOWLEDGE·BASE
                                        </span>
                                    </div>

                                    <!-- Headline -->
                                    <h1 style="font-family: 'Crimson Pro', Georgia, serif; font-size: 42px; font-weight: 600; color: #1a1a2e; margin: 0 0 16px 0; line-height: 1.2; letter-spacing: -0.8px;">
                                        Password Reset
                                    </h1>
                                    <p style="font-size: 17px; color: #6b7280; margin: 0; font-weight: 300; line-height: 1.6;">
                                        Secure authentication request
                                    </p>
                                </td>
                            </tr>

                            <!-- Content Body -->
                            <tr>
                                <td style="padding: 56px 56px 48px 56px;">
                                    <p style="font-family: 'Crimson Pro', Georgia, serif; font-size: 18px; color: #374151; margin: 0 0 32px 0; line-height: 1.8; font-weight: 300;">
                                        We received a request to reset the password for your account. Click the button below to create a new password.
                                    </p>

                                    <!-- CTA Button -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 40px 0;">
                                        <tr>
                                            <td align="center">
                                                <a href="{reset_url}"
                                                   style="display: inline-block;
                                                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                          color: #ffffff;
                                                          padding: 18px 52px;
                                                          text-decoration: none;
                                                          font-family: 'JetBrains Mono', monospace;
                                                          font-size: 13px;
                                                          font-weight: 500;
                                                          border-radius: 0;
                                                          letter-spacing: 1px;
                                                          text-transform: uppercase;
                                                          box-shadow: 0 12px 32px rgba(102,126,234,0.3);">
                                                    Reset Password →
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Security Notice -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 32px 0; background: linear-gradient(135deg, rgba(102,126,234,0.08) 0%, rgba(118,75,162,0.08) 100%); border: 1px solid rgba(102,126,234,0.2);">
                                        <tr>
                                            <td style="padding: 24px 28px;">
                                                <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; color: #667eea; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 12px 0;">
                                                    ⚠ Security Notice
                                                </p>
                                                <p style="font-family: 'Crimson Pro', Georgia, serif; font-size: 15px; color: #374151; margin: 0; line-height: 1.7; font-weight: 300;">
                                                    This link expires in <strong style="font-weight: 600;">15 minutes</strong> for your security. If you didn't request this reset, please ignore this message.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Alternative Link -->
                                    <div style="padding-top: 24px; border-top: 1px solid #e5e7eb;">
                                        <p style="font-size: 13px; color: #6b7280; margin: 0 0 12px 0; font-weight: 400;">
                                            Button not working? Copy this link:
                                        </p>
                                        <p style="font-family: 'JetBrains Mono', monospace; font-size: 11px; margin: 0; padding: 14px; background: #f8fafc; border: 1px solid #e5e7eb; word-break: break-all; color: #667eea;">
                                            {reset_url}
                                        </p>
                                    </div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 48px 56px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-top: 3px solid rgba(102,126,234,0.3);">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td>
                                                <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.4); letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 12px 0;">
                                                    Knowledge·Base
                                                </p>
                                                <p style="font-family: 'Crimson Pro', Georgia, serif; font-size: 14px; color: rgba(255,255,255,0.7); margin: 0; line-height: 1.7; font-weight: 300;">
                                                    Intelligent document retrieval powered by RAG.<br/>
                                                    This is an automated security message.
                                                </p>
                                                <p style="font-size: 12px; color: rgba(255,255,255,0.4); margin: 24px 0 0 0; line-height: 1.6;">
                                                    Sent to <strong style="color: rgba(255,255,255,0.6);">{to_email}</strong>
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>

        </body>
        </html>
        """,
    }

    try:
        response = resend.Emails.send(params)  # type:ignore
        logger.info(
            f"Password reset email sent successfully to {to_email}. Email ID: {response['id']}"
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {str(e)}")
        return False


async def send_welcome_email(to_email: str, user_email: str) -> bool:
    """
    Send welcome email to newly registered users.

    Always logs the email details to console for development/testing purposes.

    Args:
        to_email: Recipient email address
        user_email: User's email (same as to_email, for personalization)

    Returns:
        bool: True if email sent successfully or logged
    """
    # Always log to console for development/testing
    logger.info("=" * 80)
    logger.info("WELCOME EMAIL (Development Mode)")
    logger.info("=" * 80)
    logger.info(f"Email: {to_email}")
    logger.info(f"User: {user_email}")
    logger.info("=" * 80)

    # If Resend is not configured, return success (development mode)
    if not settings.RESEND_API_KEY or settings.RESEND_API_KEY == "your-resend-api-key-here":
        logger.info("Resend API key not configured - skipping email send")
        return True

    params = {
        "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM_ADDRESS}>",
        "to": [to_email],
        "subject": "Welcome to AI Knowledge Base!",
        "html": f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%); font-family: 'Crimson Pro', Georgia, serif;">

            <table width="100%" cellpadding="0" cellspacing="0" style="padding: 60px 20px;">
                <tr>
                    <td align="center">
                        <!-- Main Card -->
                        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: linear-gradient(180deg, #ffffff 0%, #fafbfc 100%); border-radius: 0; overflow: hidden; box-shadow: 0 30px 90px rgba(0,0,0,0.4), 0 0 1px rgba(255,255,255,0.1) inset;">

                            <!-- Decorative Top Edge -->
                            <tr>
                                <td style="background: linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%); height: 3px; padding: 0;"></td>
                            </tr>

                            <!-- Hero Section -->
                            <tr>
                                <td style="padding: 64px 56px 48px 56px; background: linear-gradient(135deg, rgba(102,126,234,0.03) 0%, rgba(118,75,162,0.05) 100%); position: relative;">
                                    <!-- Brand Mark -->
                                    <div style="margin-bottom: 32px;">
                                        <span style="font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 500; color: #667eea; letter-spacing: 2px; text-transform: uppercase; border: 1.5px solid #667eea; padding: 6px 14px; display: inline-block; border-radius: 0;">
                                            KNOWLEDGE·BASE
                                        </span>
                                    </div>

                                    <!-- Welcome Headline -->
                                    <h1 style="font-family: 'Crimson Pro', Georgia, serif; font-size: 48px; font-weight: 300; color: #1a1a2e; margin: 0 0 16px 0; line-height: 1.1; letter-spacing: -1px;">
                                        Welcome to Your<br/>
                                        <span style="font-weight: 600; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">Intelligence Layer</span>
                                    </h1>

                                    <p style="font-size: 18px; color: #6b7280; margin: 0; font-weight: 300; line-height: 1.7; max-width: 440px;">
                                        Your documents are now supercharged with AI-powered understanding. Let's explore what's possible.
                                    </p>
                                </td>
                            </tr>

                            <!-- Content Body -->
                            <tr>
                                <td style="padding: 56px 56px 48px 56px;">
                                    <!-- Intro Text -->
                                    <p style="font-family: 'Crimson Pro', Georgia, serif; font-size: 20px; color: #374151; margin: 0 0 40px 0; line-height: 1.8; font-weight: 300;">
                                        Your account is active. Here's how to transform your document library into an intelligent knowledge system:
                                    </p>

                                    <!-- Quick Start Steps -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 48px 0;">
                                        <tr>
                                            <td style="padding: 0 0 28px 0; vertical-align: top;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="width: 48px; vertical-align: top;">
                                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500; color: #ffffff;">01</div>
                                                        </td>
                                                        <td style="padding-left: 20px;">
                                                            <h3 style="font-family: 'Crimson Pro', Georgia, serif; font-size: 22px; font-weight: 600; color: #1a1a2e; margin: 0 0 8px 0; line-height: 1.3;">Upload Your Documents</h3>
                                                            <p style="font-size: 16px; color: #6b7280; margin: 0; line-height: 1.6; font-weight: 300;">Drop PDFs, DOCX, TXT, or Markdown files. We'll extract and index every word using state-of-the-art embeddings.</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 0 0 28px 0; vertical-align: top;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="width: 48px; vertical-align: top;">
                                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #764ba2 0%, #f093fb 100%); display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500; color: #ffffff;">02</div>
                                                        </td>
                                                        <td style="padding-left: 20px;">
                                                            <h3 style="font-family: 'Crimson Pro', Georgia, serif; font-size: 22px; font-weight: 600; color: #1a1a2e; margin: 0 0 8px 0; line-height: 1.3;">Organize Into Collections</h3>
                                                            <p style="font-size: 16px; color: #6b7280; margin: 0; line-height: 1.6; font-weight: 300;">Group related documents by project, topic, or purpose. Query specific collections for laser-focused results.</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 0; vertical-align: top;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="width: 48px; vertical-align: top;">
                                                            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #f093fb 0%, #667eea 100%); display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 500; color: #ffffff;">03</div>
                                                        </td>
                                                        <td style="padding-left: 20px;">
                                                            <h3 style="font-family: 'Crimson Pro', Georgia, serif; font-size: 22px; font-weight: 600; color: #1a1a2e; margin: 0 0 8px 0; line-height: 1.3;">Ask Anything</h3>
                                                            <p style="font-size: 16px; color: #6b7280; margin: 0; line-height: 1.6; font-weight: 300;">Type questions in plain English. Get accurate answers with exact source citations—backed by your own documents.</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Stats Panel -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 48px 0; background: linear-gradient(135deg, rgba(102,126,234,0.08) 0%, rgba(118,75,162,0.08) 100%); border: 1px solid rgba(102,126,234,0.2);">
                                        <tr>
                                            <td style="padding: 32px 28px;">
                                                <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; color: #667eea; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 16px 0;">Your Account Limits</p>
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="width: 50%; padding-right: 12px; padding-bottom: 12px;">
                                                            <p style="font-family: 'Crimson Pro', Georgia, serif; font-size: 32px; font-weight: 600; color: #1a1a2e; margin: 0; line-height: 1;">1 GB</p>
                                                            <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0 0;">Storage Capacity</p>
                                                        </td>
                                                        <td style="width: 50%; padding-left: 12px; padding-bottom: 12px;">
                                                            <p style="font-family: 'Crimson Pro', Georgia, serif; font-size: 32px; font-weight: 600; color: #1a1a2e; margin: 0; line-height: 1;">100</p>
                                                            <p style="font-size: 13px; color: #6b7280; margin: 4px 0 0 0;">Queries / Hour</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- CTA Button -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0;">
                                        <tr>
                                            <td align="center">
                                                <a href="{settings.FRONTEND_URL}"
                                                   style="display: inline-block;
                                                          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                                          color: #ffffff;
                                                          padding: 18px 52px;
                                                          text-decoration: none;
                                                          font-family: 'JetBrains Mono', monospace;
                                                          font-size: 13px;
                                                          font-weight: 500;
                                                          border-radius: 0;
                                                          letter-spacing: 1px;
                                                          text-transform: uppercase;
                                                          box-shadow: 0 12px 32px rgba(102,126,234,0.3);">
                                                    Launch Dashboard →
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 48px 56px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-top: 3px solid rgba(102,126,234,0.3);">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td>
                                                <p style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 500; color: rgba(255,255,255,0.4); letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 12px 0;">
                                                    Knowledge·Base
                                                </p>
                                                <p style="font-family: 'Crimson Pro', Georgia, serif; font-size: 14px; color: rgba(255,255,255,0.7); margin: 0; line-height: 1.7; font-weight: 300;">
                                                    Intelligent document retrieval powered by RAG.<br/>
                                                    Built for researchers, developers, and knowledge workers.
                                                </p>
                                                <p style="font-size: 12px; color: rgba(255,255,255,0.4); margin: 24px 0 0 0; line-height: 1.6;">
                                                    You received this email because you created an account at <strong style="color: rgba(255,255,255,0.6);">{user_email}</strong>
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                        </table>
                    </td>
                </tr>
            </table>

        </body>
        </html>
        """,
    }

    try:
        response = resend.Emails.send(params)  # type:ignore
        logger.info(
            f"Welcome email sent successfully to {to_email}. Email ID: {response['id']}"
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {to_email}: {str(e)}")
        return False


async def check_email_service_health() -> dict[str, str]:
    """
    Check Resend email service health status.

    Returns:
        dict: Health status with 'status' key ('up', 'down', or 'not_configured')
    """
    # If Resend is not configured, return not_configured status
    if not settings.RESEND_API_KEY or settings.RESEND_API_KEY == "your-resend-api-key-here":
        return {"status": "not_configured", "message": "Resend API key not configured"}

    try:
        # Try to get API key status (lightweight check)
        # Resend doesn't have a dedicated health endpoint, so we just verify the key exists
        if resend.api_key:
            return {"status": "up", "message": "Email service operational"}
        return {"status": "down", "message": "API key not set"}
    except Exception as e:
        logger.error(f"Email service health check failed: {str(e)}")
        return {"status": "down", "message": f"Service unavailable: {str(e)}"}
