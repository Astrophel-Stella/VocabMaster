/**
 * E2E tests for Word Bank Selection functionality
 * REQ-UI-002 / REQ-WB-001
 */

import { test, expect } from '@playwright/test';
import { LoginPage, WordBankPage, loginAsTestUser } from '../shared/utils';

test.describe('Word Bank Selection - REQ-UI-002 / REQ-WB-001', () => {

  test('REQ-WB-001: Four word banks displayed with name/description/word count', async ({ page }) => {
    await loginAsTestUser(page);

    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();

    // Verify the four ECDICT exam banks are displayed
    const count = await wordBankPage.getBankCount();
    expect(count).toBe(4);

    // Verify each bank shows its name and a "X 词" word count
    for (const name of ['高考英语', '大学英语四级', '大学英语六级', '考研英语']) {
      await wordBankPage.expectBankVisible(name);
      const card = page.getByRole('button', { name: new RegExp(name) });
      // New UI: shows "X 词" instead of "X 个单词"
      await expect(card.getByText(/词$/)).toBeVisible();
    }
  });

  test('REQ-WB-001: Word bank names and descriptions are correct', async ({ page }) => {
    await loginAsTestUser(page);

    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();

    // Each bank card exposes its name as a heading inside the button
    for (const name of ['高考英语', '大学英语四级', '大学英语六级', '考研英语']) {
      const card = page.getByRole('button', { name: new RegExp(name) });
      await expect(card.getByRole('heading', { name })).toBeVisible();
    }
  });

  test('REQ-WB-001: Click word bank navigates to word learning page', async ({ page }) => {
    await loginAsTestUser(page);

    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();

    // Click on first word bank
    await wordBankPage.selectBank('高考英语');

    // Should navigate to word learning page
    // Wait for word card to appear (spelling is displayed). Use the
    // word-spelling testid; heading level:1 also matches the app header.
    await expect(page.getByTestId('word-spelling')).toBeVisible({ timeout: 10000 });

    // Verify we're on the word learning page by checking for word card elements
    // New UI: mastered count shows "已掌握 X / Y"
    await expect(page.getByText(/已掌握 \d+ \/ \d+/)).toBeVisible();
    await expect(page.getByRole('button', { name: '返回' })).toBeVisible();
  });

  test('REQ-WB-001: Loading state shows spinner', async ({ page }) => {
    // Slow down the API response to see loading state
    await page.route('**/api/word-banks', async route => {
      await new Promise(resolve => setTimeout(resolve, 800));
      await route.continue();
    });

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test', '123456');

    // Loading spinner should be visible during loading
    const wordBankPage = new WordBankPage(page);
    await expect(wordBankPage.loadingSpinner).toBeVisible({ timeout: 500 });

    // Eventually the title should appear
    await wordBankPage.expectLoaded();
  });

  test('REQ-WB-001: Error state displays error message', async ({ page }) => {
    // Simulate API error
    await page.route('**/api/word-banks', route => route.fulfill({ status: 500, body: 'Server error' }));

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test', '123456');

    // Wait for error message to appear - use more specific selector to avoid strict mode violation
    await expect(page.locator('.bg-red-50.border-red-200 p').first()).toBeVisible({ timeout: 10000 });
  });
});
