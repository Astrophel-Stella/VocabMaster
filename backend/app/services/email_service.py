"""Email service abstraction for verification and password reset (ADR-0012)."""

import secrets
from datetime import datetime, timedelta
from typing import Protocol


class EmailService(Protocol):
    """Email service protocol for sending verification and reset emails."""

    def send_verification_email(self, to: str, username: str, token: str, verify_url: str) -> None:
        """Send email verification link to user."""
        ...

    def send_password_reset_email(self, to: str, username: str, token: str, reset_url: str) -> None:
        """Send password reset link to user."""
        ...


class ConsoleEmailService:
    """
    Console-based email service for development and testing.
    Prints email content to console instead of sending actual emails.
    """

    def send_verification_email(self, to: str, username: str, token: str, verify_url: str) -> None:
        """Print verification email to console."""
        print("\n" + "=" * 60)
        print("[EMAIL SERVICE] Verification Email")
        print("=" * 60)
        print(f"To: {to}")
        print(f"Subject: 验证您的邮箱地址")
        print("-" * 60)
        print(f"亲爱的 {username},")
        print("")
        print("感谢您注册 VocabMaster！")
        print("")
        print("请点击以下链接验证您的邮箱地址：")
        print(f"{verify_url}?token={token}")
        print("")
        print("此链接有效期为 7 天。")
        print("")
        print("如果您没有注册 VocabMaster 账号，请忽略此邮件。")
        print("")
        print("VocabMaster 团队")
        print("=" * 60 + "\n")

    def send_password_reset_email(self, to: str, username: str, token: str, reset_url: str) -> None:
        """Print password reset email to console."""
        print("\n" + "=" * 60)
        print("[EMAIL SERVICE] Password Reset Email")
        print("=" * 60)
        print(f"To: {to}")
        print(f"Subject: 重置您的密码")
        print("-" * 60)
        print(f"亲爱的 {username},")
        print("")
        print("我们收到了重置您密码的请求。")
        print("")
        print("请点击以下链接重置密码：")
        print(f"{reset_url}?token={token}")
        print("")
        print("此链接有效期为 24 小时。")
        print("")
        print("如果您没有请求重置密码，请忽略此邮件。")
        print("")
        print("VocabMaster 团队")
        print("=" * 60 + "\n")


def generate_verification_token() -> str:
    """Generate a secure verification token using secrets.token_urlsafe."""
    return secrets.token_urlsafe(32)


def generate_reset_token() -> str:
    """Generate a secure reset token using secrets.token_urlsafe."""
    return secrets.token_urlsafe(32)


def get_verification_token_expiry() -> datetime:
    """Get verification token expiry datetime (7 days from now)."""
    return datetime.utcnow() + timedelta(days=7)


def get_reset_token_expiry() -> datetime:
    """Get reset token expiry datetime (24 hours from now)."""
    return datetime.utcnow() + timedelta(hours=24)
