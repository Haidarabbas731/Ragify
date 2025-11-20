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
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f4f4f4;">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">
                    🤖 AI Knowledge Base
                </h1>
            </div>

            <!-- Body -->
            <div style="background: white; padding: 40px 30px; border-radius: 0 0 8px 8px;">
                <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>

                <p style="font-size: 16px; color: #555;">
                    We received a request to reset the password for your account.
                </p>

                <p style="font-size: 16px; color: #555;">
                    Click the button below to create a new password:
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 35px 0;">
                    <a href="{reset_url}"
                       style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                              color: white;
                              padding: 14px 35px;
                              text-decoration: none;
                              border-radius: 6px;
                              display: inline-block;
                              font-weight: 600;
                              font-size: 16px;
                              box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        Reset Password
                    </a>
                </div>

                <!-- Alternative Link -->
                <p style="font-size: 14px; color: #777; margin-top: 30px;">
                    Or copy and paste this URL into your browser:<br>
                    <a href="{reset_url}" style="color: #667eea; word-break: break-all;">
                        {reset_url}
                    </a>
                </p>

                <!-- Security Notice -->
                <div style="background: #fff3cd; border-left: 4px solid #ffc107;
                            padding: 15px; margin-top: 30px; border-radius: 4px;">
                    <p style="margin: 0; font-size: 14px; color: #856404;">
                        ⏱️ <strong>This link expires in 15 minutes</strong>
                    </p>
                </div>

                <p style="font-size: 14px; color: #777; margin-top: 25px;">
                    If you didn't request this password reset, you can safely ignore this email.
                    Your password will remain unchanged.
                </p>
            </div>

            <!-- Footer -->
            <div style="background: #f4f4f4; padding: 20px; text-align: center;
                        color: #999; font-size: 12px;">
                <p style="margin: 5px 0;">
                    AI Knowledge Base | Powered by RAG Technology
                </p>
                <p style="margin: 5px 0;">
                    This is an automated message, please do not reply.
                </p>
            </div>

        </body>
        </html>
        """,
    }

    try:
        response = resend.Emails.send(params)
        logger.info(f"Password reset email sent successfully to {to_email}. Email ID: {response['id']}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {to_email}: {str(e)}")
        return False
