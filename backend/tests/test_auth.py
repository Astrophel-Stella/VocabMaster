"""Tests for authentication API"""

from fastapi.testclient import TestClient


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
        assert response.status_code == 400
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
        assert response.status_code == 400
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
        assert response.status_code == 400
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
        assert response.status_code == 400
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
        assert response.status_code == 400
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
