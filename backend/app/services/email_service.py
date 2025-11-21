import logging

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)

resend.api_key = settings.RESEND_API_KEY


async def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """
    Send password reset email with secure token link.

    Args:
        to_email: Recipient email address
        reset_token: Cryptographically secure reset token

    Returns:
        bool: True if email sent successfully
    """
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"

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
            <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
        </head>
        <body style="margin: 0; padding: 0; background: #0a0e27; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;">

            <table width="100%" cellpadding="0" cellspacing="0" style="background: #0a0e27; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 2px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3);">

                            <!-- Accent Bar -->
                            <tr>
                                <td style="background: linear-gradient(90deg, #0EA5E9 0%, #06B6D4 100%); height: 4px; padding: 0;"></td>
                            </tr>

                            <!-- Header -->
                            <tr>
                                <td style="padding: 48px 48px 32px 48px; border-bottom: 1px solid #e5e7eb;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td>
                                                <div style="display: inline-block; background: #0a0e27; padding: 8px 16px; border-radius: 4px; margin-bottom: 24px;">
                                                    <span style="font-family: 'DM Serif Display', Georgia, serif; font-size: 14px; color: #ffffff; letter-spacing: 0.5px;">AI Knowledge Base</span>
                                                </div>
                                                <h1 style="font-family: 'DM Serif Display', Georgia, serif; font-size: 32px; font-weight: 400; color: #0a0e27; margin: 0 0 12px 0; line-height: 1.2; letter-spacing: -0.5px;">
                                                    Password Reset
                                                </h1>
                                                <p style="font-size: 15px; color: #64748b; margin: 0; font-weight: 300; line-height: 1.6;">
                                                    Secure authentication request
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                                <td style="padding: 48px 48px 40px 48px;">
                                    <p style="font-size: 16px; color: #1e293b; margin: 0 0 24px 0; line-height: 1.7; font-weight: 400;">
                                        We received a request to reset the password for your account. To proceed with creating a new password, use the secure link below.
                                    </p>

                                    <!-- CTA Button -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                                        <tr>
                                            <td align="center">
                                                <a href="{reset_url}"
                                                   style="display: inline-block;
                                                          background: #0a0e27;
                                                          color: #ffffff;
                                                          padding: 16px 48px;
                                                          text-decoration: none;
                                                          font-size: 15px;
                                                          font-weight: 500;
                                                          border-radius: 2px;
                                                          letter-spacing: 0.3px;
                                                          border: 1px solid #0a0e27;
                                                          transition: all 0.2s;">
                                                    Reset Password →
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Security Notice -->
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0 32px 0; background: #f0fdff; border-left: 3px solid #0EA5E9;">
                                        <tr>
                                            <td style="padding: 20px 24px;">
                                                <p style="margin: 0 0 8px 0; font-size: 13px; color: #0c4a6e; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;">
                                                    Security Notice
                                                </p>
                                                <p style="margin: 0; font-size: 14px; color: #0e7490; line-height: 1.6;">
                                                    This link expires in <strong>15 minutes</strong> for your security. If you didn't request this reset, please disregard this message.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                    <!-- Alternative Link -->
                                    <details style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                                        <summary style="font-size: 13px; color: #64748b; cursor: pointer; font-weight: 500; margin-bottom: 12px;">
                                            Having trouble with the button?
                                        </summary>
                                        <p style="font-size: 13px; color: #64748b; margin: 12px 0 0 0; line-height: 1.6;">
                                            Copy and paste this URL into your browser:
                                        </p>
                                        <p style="font-size: 12px; margin: 8px 0 0 0; padding: 12px; background: #f8fafc; border-radius: 4px; word-break: break-all; font-family: 'Courier New', monospace;">
                                            <a href="{reset_url}" style="color: #0EA5E9; text-decoration: none;">
                                                {reset_url}
                                            </a>
                                        </p>
                                    </details>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 32px 48px; background: #f8fafc; border-top: 1px solid #e5e7eb;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td>
                                                <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b; line-height: 1.6;">
                                                    <strong style="color: #475569;">AI Knowledge Base</strong><br>
                                                    Intelligent document retrieval powered by RAG
                                                </p>
                                                <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                                                    This is an automated security message. Please do not reply to this email.
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
