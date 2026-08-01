/**
 * E2E tests for Authentication functionality
 * REQ-UI-001 / REQ-AUTH-001~007
 */

import { test, expect, Page, Locator } from '@playwright/test';
import { LoginPage, AppHeader, loginAsTestUser } from '../shared/utils';

test.describe('Authentication - REQ-UI-001 / REQ-AUTH', () => {

  test('REQ-AUTH-001: Login page renders correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify all form elements are visible
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.toggleModeButton).toBeVisible();

    // Verify test account hint is NOT visible (removed in UI beautification)
    await expect(loginPage.testAccountHint).not.toBeVisible();
  });

  test('REQ-AUTH-001: Login/Register mode switch works', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Initially in login mode - email field should not exist
    await expect(loginPage.emailInput).not.toBeVisible();
    await expect(loginPage.submitButton).toContainText('登录');

    // Switch to register mode
    await loginPage.switchToRegister();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.submitButton).toContainText('注册');

    // Switch back to login mode
    await loginPage.toggleModeButton.click();
    await expect(loginPage.emailInput).not.toBeVisible();
    await expect(loginPage.submitButton).toContainText('登录');
  });

  test('REQ-AUTH-001: Password minLength validation', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Try to submit with short password (less than 6 characters)
    await loginPage.usernameInput.fill('testuser');
    await loginPage.passwordInput.fill('12345'); // 5 characters

    // The HTML5 validation should prevent submission
    const isValid = await loginPage.passwordInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValid).toBe(false);

    // With 6 characters, it should be valid
    await loginPage.passwordInput.fill('123456');
    const isValidAfter = await loginPage.passwordInput.evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(isValidAfter).toBe(true);
  });

  test('REQ-AUTH-003: test/123456 login succeeds and redirects to main interface', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('test', '123456');

    // Wait for redirect and verify we're on the word bank selection page
    await expect(page.getByRole('heading', { name: '选择词库' })).toBeVisible({ timeout: 10000 });

    // Verify user is logged in (header shows username directly, followed by "欢迎回来")
    const header = new AppHeader(page);
    await header.expectLoggedIn('test');
  });

  test('REQ-AUTH-004: Wrong password shows correct error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('test', 'wrongpassword');

    // Wait for error message to appear
    await loginPage.expectErrorVisible();

    // The error message should contain specific text
    // Per specs: should show "用户名或密码错误"
    // Note: Backend currently returns "Incorrect username or password"
    // This test will FAIL until localization is fixed
    const errorText = await loginPage.errorMessage.textContent();

    // Expected behavior: Chinese error message
    expect(errorText).toContain('用户名或密码错误');
  });

  test('REQ-AUTH-004: Non-existent user shows correct error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.login('nonexistentuser12345', '123456');

    // Wait for error message to appear
    await loginPage.expectErrorVisible();

    // The error message should be shown
    const errorText = await loginPage.errorMessage.textContent();
    expect(errorText).toBeTruthy();
    expect(errorText?.length).toBeGreaterThan(0);
  });

  test('REQ-AUTH-005: Network failure shows network error, not auth error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Simulate network failure by routing to a non-existent server
    await page.route('**/api/auth/login', route => route.abort('failed'));

    await loginPage.login('test', '123456');

    // Wait for error message
    await loginPage.expectErrorVisible();

    // Should show network error message, not authentication error
    const errorText = await loginPage.errorMessage.textContent();
    expect(errorText).toContain('无法连接到服务器');
    // Should NOT contain auth error message
    expect(errorText).not.toContain('用户名或密码错误');
    expect(errorText).not.toContain('Incorrect');
  });

  test('REQ-AUTH-002: Duplicate username registration shows 400 error', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Switch to register mode
    await loginPage.switchToRegister();

    // Try to register with existing username 'test'
    await loginPage.usernameInput.fill('test');
    await loginPage.emailInput.fill('test@example.com');
    // Use a strength-compliant password so the request reaches the
    // duplicate-username check rather than being rejected for weak password.
    await loginPage.passwordInput.fill('Password123');

    await loginPage.submitButton.click();

    // Wait for error message
    await loginPage.expectErrorVisible();

    const errorText = await loginPage.errorMessage.textContent();
    expect(errorText).toContain('already registered');
  });

  test('REQ-AUTH-001: Registration success auto-logs in', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Generate unique username
    const uniqueUsername = `user_${Date.now()}`;

    // Switch to register mode
    await loginPage.switchToRegister();

    await loginPage.usernameInput.fill(uniqueUsername);
    await loginPage.emailInput.fill(`${uniqueUsername}@test.com`);
    await loginPage.passwordInput.fill('Password123');

    await loginPage.submitButton.click();

    // Should auto-login and redirect to word bank selection
    await expect(page.getByRole('heading', { name: '选择词库' })).toBeVisible({ timeout: 10000 });
    const header = new AppHeader(page);
    await header.expectLoggedIn(uniqueUsername);
  });

  // REQ-AUTH-006: Password Strength Validation E2E Tests
  test.describe('REQ-AUTH-006: Password Strength Validation', () => {

    test('REQ-AUTH-006: Password strength indicator not shown in login mode', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // In login mode, password strength indicator should not appear
      await loginPage.passwordInput.fill('Password123');

      // Strength indicator should not be visible in login mode
      await expect(page.getByText('密码强度')).not.toBeVisible();
    });

    test('REQ-AUTH-006: Weak password shows "弱" strength', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();

      // Type a weak password (missing requirements)
      await loginPage.passwordInput.fill('abc');

      // Should show "密码强度：弱"
      await expect(page.getByText('密码强度：弱')).toBeVisible();

      // Requirements should show unchecked (gray text, not green)
      await expect(page.getByText('至少8个字符').first()).not.toHaveClass(/text-green-600/);
      await expect(page.getByText('至少1个大写字母').first()).not.toHaveClass(/text-green-600/);
    });

    test('REQ-AUTH-006: Strong password "Abcd1234" shows "强"', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();

      // Type a strong password that meets all basic requirements
      await loginPage.passwordInput.fill('Abcd1234');

      // Should show "密码强度：强"
      await expect(page.getByText('密码强度：强')).toBeVisible();

      // All requirements should be checked (green)
      const lengthCheck = page.getByText('至少8个字符').first();
      const upperCheck = page.getByText('至少1个大写字母').first();
      const lowerCheck = page.getByText('至少1个小写字母').first();
      const digitCheck = page.getByText('至少1个数字').first();

      await expect(lengthCheck).toHaveClass(/text-green-600/);
      await expect(upperCheck).toHaveClass(/text-green-600/);
      await expect(lowerCheck).toHaveClass(/text-green-600/);
      await expect(digitCheck).toHaveClass(/text-green-600/);
    });

    test('REQ-AUTH-006: Very strong password "Abcdefgh1234!@#" shows "非常强"', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();

      // Type a very strong password (12+ chars with special characters)
      await loginPage.passwordInput.fill('Abcdefgh1234!@#');

      // Should show "密码强度：非常强"
      await expect(page.getByText('密码强度：非常强')).toBeVisible();
    });

    test('REQ-AUTH-006: Missing uppercase shows unchecked requirement', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();

      // Password without uppercase letter
      await loginPage.passwordInput.fill('abcdefgh123');

      // Uppercase requirement should be unchecked
      const upperCheck = page.getByText('至少1个大写字母').first();
      await expect(upperCheck).not.toHaveClass(/text-green-600/);

      // Other requirements that are met should be green
      const lengthCheck = page.getByText('至少8个字符').first();
      const digitCheck = page.getByText('至少1个数字').first();
      await expect(lengthCheck).toHaveClass(/text-green-600/);
      await expect(digitCheck).toHaveClass(/text-green-600/);
    });

    test('REQ-AUTH-006: Missing lowercase shows unchecked requirement', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();

      // Password without lowercase letter
      await loginPage.passwordInput.fill('ABCDEFGH123');

      // Lowercase requirement should be unchecked
      const lowerCheck = page.getByText('至少1个小写字母').first();
      await expect(lowerCheck).not.toHaveClass(/text-green-600/);
    });

    test('REQ-AUTH-006: Missing digit shows unchecked requirement', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();

      // Password without digit
      await loginPage.passwordInput.fill('Abcdefgh');

      // Digit requirement should be unchecked
      const digitCheck = page.getByText('至少1个数字').first();
      await expect(digitCheck).not.toHaveClass(/text-green-600/);
    });

    test('REQ-AUTH-006: Registration with weak password is rejected', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();

      const uniqueUsername = `weakuser_${Date.now()}`;

      // Try to register with weak password (passes HTML minLength=6 but fails backend strength validation)
      // "abcdefgh" has 8 chars but missing uppercase and digit
      await loginPage.usernameInput.fill(uniqueUsername);
      await loginPage.emailInput.fill(`${uniqueUsername}@test.com`);
      await loginPage.passwordInput.fill('abcdefgh');

      await loginPage.submitButton.click();

      // Wait a moment for the API call to complete
      await page.waitForTimeout(1000);

      // Should NOT redirect to word bank selection (registration failed)
      await expect(page.getByRole('heading', { name: '选择词库' })).not.toBeVisible({ timeout: 3000 });

      // Should still be on the register page
      await expect(page.getByRole('button', { name: '注册' })).toBeVisible();
    });

    test('REQ-AUTH-006: Registration with strong password succeeds', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();

      const uniqueUsername = `stronguser_${Date.now()}`;

      // Register with strong password
      await loginPage.usernameInput.fill(uniqueUsername);
      await loginPage.emailInput.fill(`${uniqueUsername}@test.com`);
      await loginPage.passwordInput.fill('Password123');

      await loginPage.submitButton.click();

      // Should succeed and redirect to word bank selection
      await expect(page.getByRole('heading', { name: '选择词库' })).toBeVisible({ timeout: 10000 });
      // Updated to match new UI: username shown with "欢迎回来" below it
      await expect(page.locator('header').getByText(uniqueUsername)).toBeVisible();
    });

    test('REQ-AUTH-006: Strength indicator updates in real-time', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();

      // Type weak password first
      await loginPage.passwordInput.fill('abc');
      await expect(page.getByText('密码强度：弱')).toBeVisible();

      // Clear and type strong password
      await loginPage.passwordInput.fill('');
      await loginPage.passwordInput.fill('Abcd1234');
      await expect(page.getByText('密码强度：强')).toBeVisible();

      // Clear and type very strong password
      await loginPage.passwordInput.fill('');
      await loginPage.passwordInput.fill('Abcdefgh1234!@#');
      await expect(page.getByText('密码强度：非常强')).toBeVisible();
    });
  });

  // REQ-AUTH-007: Forgot Password / Reset Password E2E Tests
  test.describe('REQ-AUTH-007: Forgot Password / Reset Password', () => {

    test('REQ-AUTH-007: Forgot password page renders correctly', async ({ page }) => {
      const forgotPasswordPage = new ForgotPasswordPage(page);
      await forgotPasswordPage.goto();

      // Verify page elements are visible
      await expect(page.getByRole('heading', { name: '忘记密码' })).toBeVisible();
      await expect(page.getByLabel('邮箱')).toBeVisible();
      await expect(page.getByRole('button', { name: '发送重置邮件' })).toBeVisible();
      await expect(page.getByText('返回登录')).toBeVisible();
    });

    test('REQ-AUTH-007: Forgot password link on login page works', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      // Click the forgot password link
      await page.getByText('忘记密码？').click();

      // Should navigate to forgot password page
      await expect(page.getByRole('heading', { name: '忘记密码' })).toBeVisible();
    });

    test('REQ-AUTH-007: Unregistered email shows error', async ({ page }) => {
      const forgotPasswordPage = new ForgotPasswordPage(page);
      await forgotPasswordPage.goto();

      // Enter unregistered email
      await forgotPasswordPage.sendResetEmail('nonexistent@example.com');

      // Should show error message
      await forgotPasswordPage.expectErrorVisible();
      const errorText = await forgotPasswordPage.errorMessage.textContent();
      expect(errorText).toContain('该邮箱未注册');
    });

    test('REQ-AUTH-007: Registered email sends reset email and shows success', async ({ page }) => {
      const forgotPasswordPage = new ForgotPasswordPage(page);
      await forgotPasswordPage.goto();

      // Register a test user first
      const uniqueEmail = `reset_${Date.now()}@test.com`;
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.switchToRegister();
      await loginPage.usernameInput.fill(`resetuser_${Date.now()}`);
      await loginPage.emailInput.fill(uniqueEmail);
      await loginPage.passwordInput.fill('Password123');
      await loginPage.submitButton.click();
      await expect(page.getByRole('heading', { name: '选择词库' })).toBeVisible({ timeout: 10000 });

      // Go to forgot password page
      await forgotPasswordPage.goto();

      // Enter registered email
      await forgotPasswordPage.sendResetEmail(uniqueEmail);

      // Should show success message
      await expect(page.getByRole('heading', { name: '邮件已发送' })).toBeVisible();
      await expect(page.getByText(uniqueEmail)).toBeVisible();
      await expect(page.getByText('24 小时')).toBeVisible();
    });

    test('REQ-AUTH-007: Reset password page renders with valid token', async ({ page }) => {
      // Mock a valid token scenario
      const resetPasswordPage = new ResetPasswordPage(page, 'valid-test-token');
      await resetPasswordPage.goto();

      // Verify page elements are visible
      await expect(page.getByRole('heading', { name: '重置密码' })).toBeVisible();
      await expect(page.getByLabel('新密码')).toBeVisible();
      await expect(page.getByLabel('确认密码')).toBeVisible();
      await expect(page.getByRole('button', { name: '重置密码' })).toBeVisible();
    });

    test('REQ-AUTH-007: Password strength indicator on reset page', async ({ page }) => {
      const resetPasswordPage = new ResetPasswordPage(page, 'test-token');
      await resetPasswordPage.goto();

      // Enter weak password
      await page.getByLabel('新密码').fill('weak');

      // Should show weak strength indicator
      await expect(page.getByText('密码强度：弱')).toBeVisible();

      // Enter strong password
      await page.getByLabel('新密码').fill('StrongPassword123');
      await expect(page.getByText('密码强度：强')).toBeVisible();
    });

    test('REQ-AUTH-007: Password mismatch shows error', async ({ page }) => {
      // Mock API to simulate reset scenario
      await page.route('**/api/auth/reset-password', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ message: '密码重置成功' }),
        });
      });

      const resetPasswordPage = new ResetPasswordPage(page, 'test-token');
      await resetPasswordPage.goto();

      // Enter mismatched passwords
      await page.getByLabel('新密码').fill('StrongPassword123');
      await page.getByLabel('确认密码').fill('DifferentPassword123');

      // Submit form
      await page.getByRole('button', { name: '重置密码' }).click();

      // Should show validation error
      await expect(page.getByText('两次密码输入不一致')).toBeVisible();
    });

    test('REQ-AUTH-007: Reset with invalid token shows error', async ({ page }) => {
      // Mock API error response
      await page.route('**/api/auth/reset-password', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({ detail: '链接已失效' }),
        });
      });

      const resetPasswordPage = new ResetPasswordPage(page, 'invalid-token');
      await resetPasswordPage.goto();

      // Enter valid password
      await page.getByLabel('新密码').fill('StrongPassword123');
      await page.getByLabel('确认密码').fill('StrongPassword123');

      // Submit form
      await page.getByRole('button', { name: '重置密码' }).click();

      // Should show error message
      await expect(page.getByText('链接已失效')).toBeVisible();
    });

    test('REQ-AUTH-007: Reset with weak password shows error', async ({ page }) => {
      const resetPasswordPage = new ResetPasswordPage(page, 'test-token');
      await resetPasswordPage.goto();

      // Enter weak password that doesn't match requirements
      await page.getByLabel('新密码').fill('weak');
      await page.getByLabel('确认密码').fill('weak');

      // Submit form
      await page.getByRole('button', { name: '重置密码' }).click();

      // Should show validation error about password strength.
      // Scope to the error banner (bg-red-50); a bare [class*="bg-red-50"]
      // also matches the bg-red-500 strength-meter bar.
      await expect(page.locator('.bg-red-50')).toBeVisible();
    });

    test('REQ-AUTH-007: Successful reset redirects to login', async ({ page }) => {
      // Mock successful reset API
      await page.route('**/api/auth/reset-password', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ message: '密码重置成功' }),
        });
      });

      const resetPasswordPage = new ResetPasswordPage(page, 'valid-token');
      await resetPasswordPage.goto();

      // Enter strong matching passwords
      await page.getByLabel('新密码').fill('StrongPassword123');
      await page.getByLabel('确认密码').fill('StrongPassword123');

      // Submit form
      await page.getByRole('button', { name: '重置密码' }).click();

      // Should show success message
      await expect(page.getByText('密码重置成功')).toBeVisible();

      // Click return to login
      await page.getByRole('button', { name: '返回登录' }).click();

      // Should navigate back to login page
      await expect(page.getByRole('heading', { name: 'VocabMaster' })).toBeVisible();
    });

    test('REQ-AUTH-007: Back to login navigation works', async ({ page }) => {
      const forgotPasswordPage = new ForgotPasswordPage(page);
      await forgotPasswordPage.goto();

      // Click back to login link
      await page.getByText('返回登录').click();

      // Should navigate back to login page
      await expect(page.getByRole('heading', { name: 'VocabMaster' })).toBeVisible();
      // Verify login form is visible (username input is a stable indicator)
      const loginPage = new LoginPage(page);
      await expect(loginPage.usernameInput).toBeVisible();
    });
  });
});

/**
 * ForgotPassword Page Object
 */
class ForgotPasswordPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('邮箱');
    this.submitButton = page.getByRole('button', { name: '发送重置邮件' });
    this.errorMessage = page.locator('[class*="bg-red-50"] p').first();
    this.backButton = page.getByText('返回登录');
  }

  async goto() {
    await this.page.goto('/forgot-password');
  }

  async sendResetEmail(email: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async expectErrorVisible() {
    await expect(this.errorMessage).toBeVisible();
  }
}

/**
 * ResetPassword Page Object
 */
class ResetPasswordPage {
  readonly page: Page;
  readonly token: string;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page, token: string) {
    this.page = page;
    this.token = token;
    this.passwordInput = page.getByLabel('新密码');
    this.confirmPasswordInput = page.getByLabel('确认密码');
    this.submitButton = page.getByRole('button', { name: '重置密码' });
  }

  async goto() {
    await this.page.goto(`/reset-password?token=${this.token}`);
  }

  async resetPassword(newPassword: string) {
    await this.passwordInput.fill(newPassword);
    await this.confirmPasswordInput.fill(newPassword);
    await this.submitButton.click();
  }
}
