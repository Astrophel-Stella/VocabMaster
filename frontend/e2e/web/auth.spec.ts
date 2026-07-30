/**
 * E2E tests for Authentication functionality
 * REQ-UI-001 / REQ-AUTH-001~005
 */

import { test, expect } from '@playwright/test';
import { LoginPage, loginAsTestUser } from '../shared/utils';

test.describe('Authentication - REQ-UI-001 / REQ-AUTH', () => {

  test('REQ-AUTH-001: Login page renders correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Verify all form elements are visible
    await expect(loginPage.usernameInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.toggleModeButton).toBeVisible();

    // Verify test account hint is visible
    await expect(loginPage.testAccountHint).toBeVisible();
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

    // Verify user is logged in (header shows username)
    await expect(page.getByText('你好, test')).toBeVisible();
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
    await loginPage.passwordInput.fill('123456');

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
    await expect(page.getByText(`你好, ${uniqueUsername}`)).toBeVisible();
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

      // Try to register with weak password (doesn't meet requirements)
      await loginPage.usernameInput.fill(uniqueUsername);
      await loginPage.emailInput.fill(`${uniqueUsername}@test.com`);
      await loginPage.passwordInput.fill('weak');

      await loginPage.submitButton.click();

      // Should show error message about password strength
      await loginPage.expectErrorVisible();

      const errorText = await loginPage.errorMessage.textContent();
      // Backend returns error with password strength details
      expect(errorText).toMatch(/密码|password/i);
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
      await expect(page.getByText(`你好, ${uniqueUsername}`)).toBeVisible();
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
});
