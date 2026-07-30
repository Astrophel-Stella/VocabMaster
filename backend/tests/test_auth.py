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


# REQ-AUTH-007: Forgot password tests
class TestForgotPassword:
    """REQ-AUTH-007: Forgot password flow test cases"""

    def test_REQ_AUTH_007_forgot_password_unregistered_email(self, client: TestClient):
        """REQ-AUTH-007: 未注册邮箱应返回错误"""
        response = client.post(
            "/api/auth/forgot-password",
            json={"email": "nonexistent@example.com"}
        )
        assert response.status_code == 400
        assert "该邮箱未注册" in response.json()["detail"]

    def test_REQ_AUTH_007_forgot_password_success(self, client: TestClient):
        """REQ-AUTH-007: 已注册邮箱应发送重置邮件"""
        # Register user
        client.post(
            "/api/auth/register",
            json={
                "username": "resetuser",
                "email": "reset@example.com",
                "password": "Password123"
            }
        )

        # Request password reset
        response = client.post(
            "/api/auth/forgot-password",
            json={"email": "reset@example.com"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "重置邮件已发送" in data["message"]

    def test_REQ_AUTH_007_reset_password_invalid_token(self, client: TestClient):
        """REQ-AUTH-007: 无效token应返回链接已失效"""
        response = client.post(
            "/api/auth/reset-password",
            json={
                "token": "invalid-token",
                "new_password": "NewPassword123"
            }
        )
        assert response.status_code == 400
        assert "链接已失效" in response.json()["detail"]

    def test_REQ_AUTH_007_reset_password_weak_password(self, client: TestClient, db_session):
        """REQ-AUTH-007: 弱密码应返回强度错误"""
        from app.models.user import User

        # Register user and request reset
        client.post(
            "/api/auth/register",
            json={
                "username": "weakpassuser",
                "email": "weakpass@example.com",
                "password": "Password123"
            }
        )
        client.post(
            "/api/auth/forgot-password",
            json={"email": "weakpass@example.com"}
        )

        # Get the token from the test database
        user = db_session.query(User).filter(User.email == "weakpass@example.com").first()
        token = user.reset_token

        # Try to reset with weak password
        response = client.post(
            "/api/auth/reset-password",
            json={
                "token": token,
                "new_password": "weak"
            }
        )
        assert response.status_code == 422

    def test_REQ_AUTH_007_reset_password_success(self, client: TestClient, db_session):
        """REQ-AUTH-007: 有效token和强密码应成功重置"""
        from app.models.user import User

        # Register user and request reset
        client.post(
            "/api/auth/register",
            json={
                "username": "resetpassuser",
                "email": "resetpass@example.com",
                "password": "OldPassword123"
            }
        )
        client.post(
            "/api/auth/forgot-password",
            json={"email": "resetpass@example.com"}
        )

        # Get the token from the test database
        user = db_session.query(User).filter(User.email == "resetpass@example.com").first()
        token = user.reset_token

        # Reset password with new strong password
        response = client.post(
            "/api/auth/reset-password",
            json={
                "token": token,
                "new_password": "NewPassword456"
            }
        )
        assert response.status_code == 200
        assert "密码重置成功" in response.json()["message"]

        # Verify can login with new password
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": "resetpassuser",
                "password": "NewPassword456"
            }
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()

        # Verify old password no longer works
        old_login = client.post(
            "/api/auth/login",
            data={
                "username": "resetpassuser",
                "password": "OldPassword123"
            }
        )
        assert old_login.status_code == 401

    def test_REQ_AUTH_007_token_single_use(self, client: TestClient, db_session):
        """REQ-AUTH-007: token使用后应失效"""
        from app.models.user import User

        # Register user and request reset
        client.post(
            "/api/auth/register",
            json={
                "username": "singleuse",
                "email": "singleuse@example.com",
                "password": "OldPassword123"
            }
        )
        client.post(
            "/api/auth/forgot-password",
            json={"email": "singleuse@example.com"}
        )

        # Get the token
        user = db_session.query(User).filter(User.email == "singleuse@example.com").first()
        token = user.reset_token

        # First reset - should succeed
        response1 = client.post(
            "/api/auth/reset-password",
            json={
                "token": token,
                "new_password": "NewPassword456"
            }
        )
        assert response1.status_code == 200

        # Second reset with same token - should fail
        response2 = client.post(
            "/api/auth/reset-password",
            json={
                "token": token,
                "new_password": "AnotherPassword789"
            }
        )
        assert response2.status_code == 400
        assert "链接已失效" in response2.json()["detail"]


# REQ-AUTH-009: Password change tests
class TestChangePassword:
    """REQ-AUTH-009: Password change test cases"""

    def test_REQ_AUTH_009_change_password_success(self, client: TestClient):
        """REQ-AUTH-009: 正确输入旧密码和新密码应修改成功"""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "username": "pwdtest",
                "email": "pwdtest@example.com",
                "password": "Password123"
            }
        )
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": "pwdtest",
                "password": "Password123"
            }
        )
        token = login_response.json()["access_token"]

        # Change password
        response = client.put(
            "/api/auth/password",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "old_password": "Password123",
                "new_password": "NewPassword456"
            }
        )
        assert response.status_code == 200
        assert response.json()["message"] == "密码修改成功，请重新登录"

        # Verify can login with new password
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": "pwdtest",
                "password": "NewPassword456"
            }
        )
        assert login_response.status_code == 200
        assert "access_token" in login_response.json()

        # Verify old password no longer works
        old_login_response = client.post(
            "/api/auth/login",
            data={
                "username": "pwdtest",
                "password": "Password123"
            }
        )
        assert old_login_response.status_code == 401

    def test_REQ_AUTH_009_old_password_incorrect(self, client: TestClient):
        """REQ-AUTH-009: 旧密码错误应拒绝修改"""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "username": "wrongoldpwd",
                "email": "wrongoldpwd@example.com",
                "password": "Password123"
            }
        )
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": "wrongoldpwd",
                "password": "Password123"
            }
        )
        token = login_response.json()["access_token"]

        # Try to change with wrong old password
        response = client.put(
            "/api/auth/password",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "old_password": "WrongPassword",
                "new_password": "NewPassword456"
            }
        )
        assert response.status_code == 400
        assert "旧密码错误" in response.json()["detail"]

    def test_REQ_AUTH_009_new_password_weak(self, client: TestClient):
        """REQ-AUTH-009: 新密码强度不足应拒绝修改"""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "username": "weaknewpwd",
                "email": "weaknewpwd@example.com",
                "password": "Password123"
            }
        )
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": "weaknewpwd",
                "password": "Password123"
            }
        )
        token = login_response.json()["access_token"]

        # Try to change to weak password
        response = client.put(
            "/api/auth/password",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "old_password": "Password123",
                "new_password": "weak"
            }
        )
        assert response.status_code == 422
        detail = response.json()["detail"]
        assert "密码强度不足" in detail["message"]

    def test_REQ_AUTH_009_new_password_same_as_old(self, client: TestClient):
        """REQ-AUTH-009: 新密码与旧密码相同应拒绝修改"""
        # Register and login
        client.post(
            "/api/auth/register",
            json={
                "username": "samepwd",
                "email": "samepwd@example.com",
                "password": "Password123"
            }
        )
        login_response = client.post(
            "/api/auth/login",
            data={
                "username": "samepwd",
                "password": "Password123"
            }
        )
        token = login_response.json()["access_token"]

        # Try to change to same password
        response = client.put(
            "/api/auth/password",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "old_password": "Password123",
                "new_password": "Password123"
            }
        )
        assert response.status_code == 400
        assert "新密码不能与旧密码相同" in response.json()["detail"]

    def test_REQ_AUTH_009_unauthenticated(self, client: TestClient):
        """REQ-AUTH-009: 未登录应返回401"""
        response = client.put(
            "/api/auth/password",
            json={
                "old_password": "Password123",
                "new_password": "NewPassword456"
            }
        )
        assert response.status_code == 401
