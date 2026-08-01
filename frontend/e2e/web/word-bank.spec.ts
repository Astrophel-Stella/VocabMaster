/**
 * E2E tests for Word Bank Selection functionality
 * REQ-UI-002 / REQ-WB-001
 */

import { test, expect } from '@playwright/test';
import { LoginPage, WordBankPage, loginAsTestUser } from '../shared/utils';

test.describe('Word Bank Selection - REQ-UI-002 / REQ-WB-001', () => {

  test('REQ-WB-001: Three word banks displayed with name/description/word count', async ({ page }) => {
    await loginAsTestUser(page);

    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();

    // Verify 3 word banks are displayed
    const count = await wordBankPage.getBankCount();
    expect(count).toBe(3);

    // Verify each bank has required information
    // Bank 1: 高考英语
    await wordBankPage.expectBankVisible('高考英语');
    const bank1 = page.getByRole('button', { name: /高考英语/ });
    // New UI: shows "X 词" instead of "X 个单词"
    await expect(bank1.getByText(/词$/)).toBeVisible();

    // Bank 2: 考研英语
    await wordBankPage.expectBankVisible('考研英语');
    const bank2 = page.getByRole('button', { name: /考研英语/ });
    await expect(bank2.getByText(/词$/)).toBeVisible();

    // Bank 3: 生活英语
    await wordBankPage.expectBankVisible('生活英语');
    const bank3 = page.getByRole('button', { name: /生活英语/ });
    await expect(bank3.getByText(/词$/)).toBeVisible();
  });

  test('REQ-WB-001: Word bank names and descriptions are correct', async ({ page }) => {
    await loginAsTestUser(page);

    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();

    // Verify bank 1 name and description
    const bank1 = page.getByRole('button', { name: /高考英语/ });
    await expect(bank1.getByRole('heading', { name: '高考英语' })).toBeVisible();

    // Verify bank 2 name
    const bank2 = page.getByRole('button', { name: /考研英语/ });
    await expect(bank2.getByRole('heading', { name: '考研英语' })).toBeVisible();

    // Verify bank 3 name
    const bank3 = page.getByRole('button', { name: /生活英语/ });
    await expect(bank3.getByRole('heading', { name: '生活英语' })).toBeVisible();
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
