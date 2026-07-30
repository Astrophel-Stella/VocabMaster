"""Email service abstraction and implementations (ADR-0012)"""

import secrets
from typing import Protocol, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class EmailService(Protocol):
    """Email service protocol for sending verification and password reset emails"""

    def send_verification_email(
        self, to: str, username: str, token: str, verify_url: str
    ) -> None:
        """Send email verification link"""
        ...

    def send_password_reset_email(
        self, to: str, username: str, token: str, reset_url: str
    ) -> None:
        """Send password reset link"""
        ...


class ConsoleEmailService:
    """
    Development/Testing email service that prints emails to console.
    Used when email_provider is 'console' (default for dev/test).
    """

    def send_verification_email(
        self, to: str, username: str, token: str, verify_url: str
    ) -> None:
        """Print verification email to console"""
        full_url = f"{verify_url}?token={token}"
        message = f"""
========================================
[DEV] 邮箱验证邮件
----------------------------------------
收件人: {to}
用户名: {username}
验证链接: {full_url}
有效期: 7天
========================================
"""
        logger.info(message)
        print(message)

    def send_password_reset_email(
        self, to: str, username: str, token: str, reset_url: str
    ) -> None:
        """Print password reset email to console"""
        full_url = f"{reset_url}?token={token}"
        message = f"""
========================================
[DEV] 密码重置邮件
----------------------------------------
收件人: {to}
用户名: {username}
重置链接: {full_url}
有效期: 24小时
========================================
"""
        logger.info(message)
        print(message)


def generate_token() -> str:
    """Generate a secure token for email verification or password reset"""
    return secrets.token_urlsafe(32)


def get_token_expiry(hours: int = 24) -> datetime:
    """Get token expiry datetime"""
    return datetime.utcnow() + timedelta(hours=hours)


def get_email_service() -> EmailService:
    """Get the configured email service instance"""
    from app.config import settings

    if settings.email_provider == "console":
        return ConsoleEmailService()
    # Future: Add AliyunEmailService when provider is "aliyun"
    # For now, default to console
    return ConsoleEmailService()
