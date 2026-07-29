/**
 * Progress Statistics E2E Tests - Isolated
 * Covers REQ-UI-004 / REQ-PROG-001~004
 */

import { test, expect } from '@playwright/test';
import { LoginPage, WordBankSelectPage, WordCardPage, TEST_USER } from '../shared/utils';

test.describe('Progress Statistics (REQ-UI-004 / REQ-PROG-001~004)', () => {

  /**
   * REQ-UI-004: Progress bar displays correctly
   */
  test('REQ-UI-004: Progress bar displays N/total format', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Select word bank
    const wordBankSelectPage = new WordBankSelectPage(page);
    await wordBankSelectPage.selectWordBank('高考英语');
    await page.waitForSelector('h1.text-5xl', { timeout: 10000 });

    // Verify progress text is visible
    const progressText = await page.locator('span:has-text("进度:")').textContent();
    expect(progressText).toMatch(/进度:\s*\d+\s*\/\s*\d+/);

    console.log(`Progress text: ${progressText}`);
  });

  /**
   * REQ-UI-004: Mastered count displays correctly
   */
  test('REQ-UI-004: Mastered count displays correctly', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Select word bank
    const wordBankSelectPage = new WordBankSelectPage(page);
    await wordBankSelectPage.selectWordBank('高考英语');
    await page.waitForSelector('h1.text-5xl', { timeout: 10000 });

    // Verify mastered text is visible
    const masteredText = await page.locator('span:has-text("已掌握:")').textContent();
    expect(masteredText).toMatch(/已掌握:\s*\d+\s*\/\s*\d+/);

    console.log(`Mastered text: ${masteredText}`);
  });

  /**
   * REQ-PROG-001: Mark word as mastered
   */
  test('REQ-PROG-001: Mark word as mastered updates UI', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Select word bank
    const wordBankSelectPage = new WordBankSelectPage(page);
    await wordBankSelectPage.selectWordBank('考研英语');
    await page.waitForSelector('h1.text-5xl', { timeout: 10000 });

    // Check current state - might be "标记已掌握" or "已掌握"
    const markButton = page.locator('button:has-text("标记已掌握")');
    const masteredButton = page.locator('button:has-text("已掌握")');

    const markButtonVisible = await markButton.isVisible().catch(() => false);
    const masteredButtonVisible = await masteredButton.isVisible().catch(() => false);

    if (markButtonVisible) {
      // Click mark mastered
      await markButton.click();
      await page.waitForTimeout(1500);

      // Verify button changed to "已掌握"
      await expect(masteredButton).toBeVisible();
      console.log('Word marked as mastered successfully');
    } else if (masteredButtonVisible) {
      // Already mastered - test passes
      console.log('Word already marked as mastered');
      await expect(masteredButton).toBeVisible();
    } else {
      throw new Error('Neither mark nor mastered button visible');
    }
  });

  /**
   * REQ-PROG-002: Unmark word as mastered
   */
  test('REQ-PROG-002: Unmark word as mastered updates UI', async ({ page }) => {
    // Login fresh
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USER.username, TEST_USER.password);
    await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });

    // Select word bank
    const wordBankSelectPage = new WordBankSelectPage(page);
    await wordBankSelectPage.selectWordBank('生活英语');
    await page.waitForSelector('h1.text-5xl', { timeout: 10000 });

    // Check current state
    const markButton = page.locator('button:has-text("标记已掌握")');
    const masteredButton = page.locator('button:has-text("已掌握")');

    const markButtonVisible = await markButton.isVisible().catch(() => false);
    const masteredButtonVisible = await masteredButton.isVisible().catch(() => false);

    if (masteredButtonVisible) {
      // Already mastered, unmark
      await masteredButton.click();
      await page.waitForTimeout(1500);

      // BUG: Button should change to "标记已掌握" but might not
      // Check both states
      const newMarkVisible = await markButton.isVisible().catch(() => false);
      const newMasteredVisible = await masteredButton.isVisible().catch(() => false);

      if (newMarkVisible) {
        console.log('Word unmarked successfully - button changed to "标记已掌握"');
      } else if (newMasteredVisible) {
        // POTENTIAL BUG: Unmark didn't work
        console.log('POTENTIAL BUG: Click on "已掌握" did not change to "标记已掌握"');
        // Take screenshot for evidence
        await page.screenshot({ path: 'bug-unmark-not-working.png' });
        // Fail the test - this is a bug that needs to be fixed
        expect(newMarkVisible).toBe(true);
      }

      // Verify final state
      expect(newMarkVisible || newMasteredVisible).toBe(true);
    } else if (markButtonVisible) {
      // Not mastered - mark first, then unmark
      await markButton.click();
      await page.waitForTimeout(1500);

      // Now try to unmark
      const newMasteredButton = page.locator('button:has-text("已掌握")');
      const newMasteredVisible = await newMasteredButton.isVisible().catch(() => false);

      if (newMasteredVisible) {
        await newMasteredButton.click();
        await page.waitForTimeout(1500);

        // Verify toggle back to unmarked state
        const finalMarkVisible = await markButton.isVisible().catch(() => false);
        expect(finalMarkVisible).toBe(true);
      }
    } else {
      throw new Error('Neither mark nor mastered button visible');
    }
  });
});
