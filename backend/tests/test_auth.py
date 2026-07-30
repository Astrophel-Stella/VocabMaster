"""Tests for authentication API"""

from fastapi.testclient import TestClient
from app.models.user import User


def test_register_user(client: TestClient):
    """Test user registration"""
    response = client.post(
        "/api/auth/register",
        json={
            "username": "test",
            "email": "test@example.com",
            "password": "Password123"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "test"
    assert data["email"] == "test@example.com"
    assert "id" in data


def test_register_duplicate_username(client: TestClient):
    """Test registering with duplicate username"""
    # Register first user
    client.post(
        "/api/auth/register",
        json={
            "username": "test",
            "email": "test1@example.com",
            "password": "Password123"
        }
    )

    # Try to register with same username
    response = client.post(
        "/api/auth/register",
        json={
            "username": "test",
            "email": "test2@example.com",
            "password": "Password123"
        }
    )
    assert response.status_code == 400
    assert "Username already registered" in response.json()["detail"]


# REQ-AUTH-006: Password strength validation tests
class TestPasswordStrengthValidation:
    """REQ-AUTH-006: Password strength validation test cases"""

    def test_REQ_AUTH_006_password_too_short(self, client: TestClient):
        """REQ-AUTH-006: 密码少于8个字符应显示错误"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "shortpass",
                "email": "short@example.com",
                "password": "Abc123"
            }
        )
        assert response.status_code == 422
        detail = response.json()["detail"]
        assert "密码长度至少8个字符" in detail["errors"]

    def test_REQ_AUTH_006_password_no_uppercase(self, client: TestClient):
        """REQ-AUTH-006: 密码不包含大写字母应显示错误"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "nouppercase",
                "email": "nouppercase@example.com",
                "password": "abcdefgh123"
            }
        )
        assert response.status_code == 422
        detail = response.json()["detail"]
        assert "密码需包含至少1个大写字母" in detail["errors"]

    def test_REQ_AUTH_006_password_no_lowercase(self, client: TestClient):
        """REQ-AUTH-006: 密码不包含小写字母应显示错误"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "nolowercase",
                "email": "nolowercase@example.com",
                "password": "ABCDEFGH123"
            }
        )
        assert response.status_code == 422
        detail = response.json()["detail"]
        assert "密码需包含至少1个小写字母" in detail["errors"]

    def test_REQ_AUTH_006_password_no_digit(self, client: TestClient):
        """REQ-AUTH-006: 密码不包含数字应显示错误"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "nodigit",
                "email": "nodigit@example.com",
                "password": "Abcdefgh"
            }
        )
        assert response.status_code == 422
        detail = response.json()["detail"]
        assert "密码需包含至少1个数字" in detail["errors"]

    def test_REQ_AUTH_006_password_multiple_errors(self, client: TestClient):
        """REQ-AUTH-006: 密码多项不符合要求应显示多个错误"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "multierror",
                "email": "multierror@example.com",
                "password": "abc"
            }
        )
        assert response.status_code == 422
        detail = response.json()["detail"]
        errors = detail["errors"]
        assert "密码长度至少8个字符" in errors
        assert "密码需包含至少1个大写字母" in errors
        assert "密码需包含至少1个数字" in errors

    def test_REQ_AUTH_006_password_valid_strong(self, client: TestClient):
        """REQ-AUTH-006: 有效强密码应允许注册"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "strongpass",
                "email": "strong@example.com",
                "password": "Abcd1234"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "strongpass"

    def test_REQ_AUTH_006_password_very_strong(self, client: TestClient):
        """REQ-AUTH-006: 非常强的密码（包含特殊字符）应允许注册"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "verystrong",
                "email": "verystrong@example.com",
                "password": "Abcdefgh1234!@#"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "verystrong"


def test_login_user(client: TestClient):
    """Test user login"""
    # Register user first
    client.post(
        "/api/auth/register",
        json={
            "username": "test",
            "email": "test@example.com",
            "password": "Password123"
        }
    )

    # Login
    response = client.post(
        "/api/auth/login",
        data={
            "username": "test",
            "password": "Password123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid_credentials(client: TestClient):
    """Test login with invalid credentials"""
    response = client.post(
        "/api/auth/login",
        data={
            "username": "nonexistent",
            "password": "wrongpass"
        }
    )
    assert response.status_code == 401


def test_get_current_user(client: TestClient):
    """Test getting current user info"""
    # Register and login
    client.post(
        "/api/auth/register",
        json={
            "username": "test",
            "email": "test@example.com",
            "password": "Password123"
        }
    )

    login_response = client.post(
        "/api/auth/login",
        data={
            "username": "test",
            "password": "Password123"
        }
    )
    token = login_response.json()["access_token"]

    # Get current user
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "test"


# REQ-AUTH-008: Email verification tests
class TestEmailVerification:
    """REQ-AUTH-008: Email verification test cases"""

    def test_REQ_AUTH_008_register_creates_unverified_user(self, client: TestClient):
        """REQ-AUTH-008: 注册时初始状态为未验证"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "unverified_user",
                "email": "unverified@example.com",
                "password": "Password123"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["email_verified"] is False

    def test_REQ_AUTH_008_verify_email_success(self, client: TestClient, db_session):
        """REQ-AUTH-008: 有效验证链接应成功验证邮箱"""
        # Register user
        response = client.post(
            "/api/auth/register",
            json={
                "username": "verify_test",
                "email": "verify_test@example.com",
                "password": "Password123"
            }
        )
        assert response.status_code == 201

        # Get user from database to retrieve token
        user = db_session.query(User).filter(User.username == "verify_test").first()
        assert user is not None, "User should exist"
        token = user.verification_token
        assert token is not None, "Verification token should exist"

        # Verify email
        response = client.get(f"/api/auth/verify-email/{token}")
        assert response.status_code == 200
        data = response.json()
        assert "邮箱验证成功" in data["message"]

        # Verify user is marked as verified (refresh from db)
        db_session.refresh(user)
        assert user.email_verified is True
        assert user.verification_token is None

    def test_REQ_AUTH_008_verify_email_invalid_token(self, client: TestClient):
        """REQ-AUTH-008: 无效的验证链接应返回错误"""
        response = client.get("/api/auth/verify-email/invalid_token_12345")
        assert response.status_code == 400
        assert "无效的验证链接" in response.json()["detail"]

    def test_REQ_AUTH_008_verify_email_already_verified(self, client: TestClient, db_session):
        """REQ-AUTH-008: 已验证的邮箱再次验证应返回错误"""
        # Register user
        client.post(
            "/api/auth/register",
            json={
                "username": "already_verified",
                "email": "already_verified@example.com",
                "password": "Password123"
            }
        )

        # Get token and verify
        user = db_session.query(User).filter(User.username == "already_verified").first()
        token = user.verification_token
        # Mark as verified
        user.email_verified = True
        db_session.commit()

        # Try to verify again
        response = client.get(f"/api/auth/verify-email/{token}")
        assert response.status_code == 400
        assert "邮箱已验证" in response.json()["detail"]

    def test_REQ_AUTH_008_resend_verification_success(self, client: TestClient, db_session):
        """REQ-AUTH-008: 重新发送验证邮件应成功"""
        # Register user
        client.post(
            "/api/auth/register",
            json={
                "username": "resend_test",
                "email": "resend_test@example.com",
                "password": "Password123"
            }
        )

        # Get original token
        user = db_session.query(User).filter(User.username == "resend_test").first()
        original_token = user.verification_token

        # Resend verification
        response = client.post(
            "/api/auth/resend-verification",
            json={"email": "resend_test@example.com"}
        )
        assert response.status_code == 200
        assert "验证邮件已重新发送" in response.json()["message"]

        # Verify new token was generated
        db_session.refresh(user)
        assert user.verification_token != original_token

    def test_REQ_AUTH_008_resend_verification_nonexistent_email(self, client: TestClient):
        """REQ-AUTH-008: 不存在的邮箱重新发送应返回通用消息（不泄露信息）"""
        response = client.post(
            "/api/auth/resend-verification",
            json={"email": "nonexistent@example.com"}
        )
        assert response.status_code == 200
        assert "验证邮件已发送" in response.json()["message"]

    def test_REQ_AUTH_008_resend_verification_already_verified(self, client: TestClient, db_session):
        """REQ-AUTH-008: 已验证邮箱重新发送应返回错误"""
        # Register user and mark as verified
        client.post(
            "/api/auth/register",
            json={
                "username": "verified_user",
                "email": "verified_user@example.com",
                "password": "Password123"
            }
        )

        user = db_session.query(User).filter(User.username == "verified_user").first()
        user.email_verified = True
        db_session.commit()

        # Try to resend
        response = client.post(
            "/api/auth/resend-verification",
            json={"email": "verified_user@example.com"}
        )
        assert response.status_code == 400
        assert "邮箱已验证" in response.json()["detail"]

    def test_REQ_AUTH_008_login_unverified_user_allowed(self, client: TestClient):
        """REQ-AUTH-008: 未验证用户可以登录"""
        # Register user (unverified by default)
        client.post(
            "/api/auth/register",
            json={
                "username": "unverified_login",
                "email": "unverified_login@example.com",
                "password": "Password123"
            }
        )

        # Login should succeed
        response = client.post(
            "/api/auth/login",
            data={
                "username": "unverified_login",
                "password": "Password123"
            }
        )
        assert response.status_code == 200
        assert "access_token" in response.json()

    def test_REQ_AUTH_008_user_response_includes_verification_status(self, client: TestClient):
        """REQ-AUTH-008: 用户信息应包含邮箱验证状态"""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "username": "status_check",
                "email": "status_check@example.com",
                "password": "Password123"
            }
        )

        login_response = client.post(
            "/api/auth/login",
            data={
                "username": "status_check",
                "password": "Password123"
            }
        )
        token = login_response.json()["access_token"]

        # Get current user
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "email_verified" in data
        assert data["email_verified"] is False
