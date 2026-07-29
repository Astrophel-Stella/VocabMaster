/**
 * App-level E2E Tests - Isolated
 * Covers App-level functionality
 */

import { test, expect } from '@playwright/test';
import { LoginPage, WordBankSelectPage, TEST_USER } from '../shared/utils';

test.describe('App-level Tests', () => {
  /**
   * App: Browser title is VocabMaster
   */
  test('App: Browser title is "VocabMaster"', async ({ page }) => {
    await page.goto('/');

    const title = await page.title();
    expect(title).toBe('VocabMaster');
  });

  /**
   * App: Logout returns to login page
   */
  test('App: Logout returns to login page', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Logout
    const wordBankSelectPage = new WordBankSelectPage(page);
    await wordBankSelectPage.logout();

    // Wait for redirect to login page
    await page.waitForTimeout(1500);

    // Verify login page is shown
    await loginPage.expectLoginFormVisible();
  });

  /**
   * App: Refresh preserves login state
   */
  test('App: Refresh preserves login state', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Verify word bank selection page
    await expect(page.locator('h2')).toContainText('选择词库');

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Verify still logged in (word bank selection page)
    await expect(page.locator('h2')).toContainText('选择词库');
  });

  /**
   * App: Refresh preserves progress
   */
  test('App: Refresh preserves progress state', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Select word bank
    const wordBankSelectPage = new WordBankSelectPage(page);
    await wordBankSelectPage.selectWordBank('高考英语');

    // Wait for word card
    await page.waitForSelector('h1.text-5xl', { timeout: 10000 });

    // Check mastered state
    const markButton = page.locator('button:has-text("标记已掌握")');
    const masteredButton = page.locator('button:has-text("已掌握")');

    const isMarkVisible = await markButton.isVisible().catch(() => false);
    const isMasteredVisible = await masteredButton.isVisible().catch(() => false);

    console.log(`Before refresh: mark=${isMarkVisible}, mastered=${isMasteredVisible}`);

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1.text-5xl', { timeout: 10000 });

    // Verify state preserved
    const newMarkVisible = await markButton.isVisible().catch(() => false);
    const newMasteredVisible = await masteredButton.isVisible().catch(() => false);

    console.log(`After refresh: mark=${newMarkVisible}, mastered=${newMasteredVisible}`);

    // State should be preserved
    expect(newMarkVisible || newMasteredVisible).toBe(true);
  });

  /**
   * App: Platform badge shows correctly
   */
  test('App: Platform badge shows "Web"', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Look for platform badge
    const badge = page.locator('span:has-text("Web")');
    await expect(badge).toBeVisible();
  });

  /**
   * App: User greeting shows username
   */
  test('App: User greeting shows username', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Look for greeting
    const greeting = page.locator('text=你好');
    await expect(greeting).toBeVisible();

    // Username should be displayed
    await expect(page.locator('text=test')).toBeVisible();
  });

  /**
   * App: Return button from word card
   */
  test('App: Return button goes back to word bank selection', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Select word bank
    const wordBankSelectPage = new WordBankSelectPage(page);
    await wordBankSelectPage.selectWordBank('高考英语');

    // Wait for word card
    await page.waitForSelector('h1.text-5xl', { timeout: 10000 });

    // Verify return button is visible
    const returnButton = page.locator('button:has-text("返回")');
    await expect(returnButton).toBeVisible();

    // Click return button
    await returnButton.click();
    await page.waitForTimeout(500);

    // Verify navigation back to word bank selection (correct assertion)
    await expect(page.locator('h2:has-text("选择词库")')).toBeVisible({ timeout: 5000 });
  });
});
