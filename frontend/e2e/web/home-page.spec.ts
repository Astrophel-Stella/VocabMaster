/**
 * E2E tests for the beautified home page (word bank selection)
 * REQ-UI-005: Hero + 整体学习进度概览 + 词库卡片升级
 *
 * Runs against the same production-preview server as the rest of the E2E suite
 * (see ai-native-pipeline.yml: `npm run build` + `npm run preview`).
 */

import { test, expect } from '@playwright/test';
import { WordBankPage, WordLearningPage, loginAsTestUser } from '../shared/utils';

test.describe('Home Page Beautification - REQ-UI-005', () => {

  test('REQ-UI-005: Hero section shows brand title, subtitle and progress overview', async ({ page }) => {
    await loginAsTestUser(page);

    // Brand Hero title + subtitle
    await expect(page.getByRole('heading', { name: /继续你的单词之旅/ })).toBeVisible();
    await expect(page.getByText(/精选高频词库/)).toBeVisible();

    // Overall learning progress overview panel
    await expect(page.getByRole('heading', { name: /整体学习进度/ })).toBeVisible();

    // Accessible progress bar with a valid 0-100 value
    const progressbar = page.getByRole('progressbar', { name: /整体学习进度/ });
    await expect(progressbar).toBeVisible();
    const now = Number(await progressbar.getAttribute('aria-valuenow'));
    expect(Number.isNaN(now)).toBe(false);
    expect(now).toBeGreaterThanOrEqual(0);
    expect(now).toBeLessThanOrEqual(100);

    // Overview sentence summarizing mastered / total words
    await expect(page.getByText(/个单词$/)).toBeVisible();
  });

  test('REQ-UI-005: Word bank cards show a "开始学习" call to action and word count', async ({ page }) => {
    await loginAsTestUser(page);

    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();

    // Every card carries the "开始学习" CTA
    const ctas = page.getByText('开始学习');
    expect(await ctas.count()).toBe(await wordBankPage.getBankCount());

    // Word count is still shown on the first card (contract preserved)
    const bank = page.getByRole('button', { name: /高考英语/ });
    await expect(bank.getByText(/词$/)).toBeVisible();
  });

  test('REQ-UI-005: Cards are keyboard accessible (focus + Enter selects a bank)', async ({ page }) => {
    await loginAsTestUser(page);

    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();

    // Focus the first word bank card and activate it with the keyboard only
    const bank = page.getByRole('button', { name: /高考英语/ });
    await bank.focus();
    await expect(bank).toBeFocused();
    await page.keyboard.press('Enter');

    // Should navigate into the word learning view — no regression on selection contract
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();
    await expect(page.getByRole('button', { name: '返回' })).toBeVisible();
  });

  test('REQ-UI-005: Selecting a bank by click still loads words (no regression)', async ({ page }) => {
    await loginAsTestUser(page);

    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();
    await wordBankPage.selectBank('高考英语');

    await expect(page.getByTestId('word-spelling')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/已掌握 \d+ \/ \d+/)).toBeVisible();
  });
});
