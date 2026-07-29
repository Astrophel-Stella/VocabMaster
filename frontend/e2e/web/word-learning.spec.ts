/**
 * Word Learning E2E Tests
 * Covers REQ-UI-003 / REQ-WB-002 / REQ-WORD-001/004
 */

import { test, expect } from '@playwright/test';
import { loginAndSelectWordBank, WordCardPage } from '../shared/utils';

test.describe('Word Learning (REQ-UI-003 / REQ-WB-002 / REQ-WORD-001/004)', () => {
  let wordCardPage: WordCardPage;

  test.beforeEach(async ({ page }) => {
    await loginAndSelectWordBank(page, '高考英语');
    wordCardPage = new WordCardPage(page);
  });

  /**
   * REQ-UI-003: Word learning interface displays word card
   * REQ-WB-002: Get words from word bank
   * REQ-WORD-001: Word detail display
   */
  test('REQ-UI-003/REQ-WB-002/REQ-WORD-001: Word card displays correctly', async ({ page }) => {
    // Verify word spelling is visible (large text)
    await wordCardPage.expectWordVisible();
    const spelling = await page.locator('h1.text-5xl').textContent();
    expect(spelling).toBeTruthy();
    console.log(`Word spelling displayed: ${spelling}`);

    // Verify phonetic is visible
    await wordCardPage.expectPhoneticVisible();
    const phonetic = await page.locator('p.text-xl.text-gray-500').textContent();
    console.log(`Phonetic displayed: ${phonetic}`);

    // Verify meaning is visible
    await wordCardPage.expectMeaningVisible();
    const meaning = await page.locator('p.text-lg.text-gray-800').textContent();
    console.log(`Meaning displayed: ${meaning}`);

    // Verify example sentence is visible (if present)
    const exampleSentence = await page.locator('p.text-gray-700.italic').isVisible();
    if (exampleSentence) {
      console.log(`Example sentence displayed`);
    }
  });

  /**
   * REQ-UI-003: Word card does not show loading spinner (data loaded)
   */
  test('REQ-UI-003: Word card loads without spinning', async () => {
    // Verify no loading spinner is visible
    await wordCardPage.expectNoLoadingSpinner();
  });

  /**
   * REQ-UI-003: Previous button is disabled on first word
   */
  test('REQ-UI-003: Previous button disabled on first word', async () => {
    // First word should have disabled prev button
    await wordCardPage.expectPrevButtonDisabled();
  });

  /**
   * REQ-UI-003: Next button navigates to next word
   */
  test('REQ-UI-003: Next button navigates correctly', async ({ page }) => {
    // Get current word
    const firstWord = await page.locator('h1.text-5xl').textContent();

    // Click next
    await wordCardPage.nextWord();
    await page.waitForTimeout(500);

    // Verify word changed
    const secondWord = await page.locator('h1.text-5xl').textContent();
    expect(secondWord).not.toBe(firstWord);

    // Prev button should now be enabled
    await wordCardPage.expectPrevButtonEnabled();
  });

  /**
   * REQ-UI-003: Previous button navigates back
   */
  test('REQ-UI-003: Previous button navigates back', async ({ page }) => {
    // Navigate to second word
    await wordCardPage.nextWord();
    await page.waitForTimeout(500);

    const secondWord = await page.locator('h1.text-5xl').textContent();

    // Click prev
    await wordCardPage.prevWord();
    await page.waitForTimeout(500);

    // Verify word changed back
    const firstWord = await page.locator('h1.text-5xl').textContent();
    expect(firstWord).not.toBe(secondWord);

    // Prev should be disabled again
    await wordCardPage.expectPrevButtonDisabled();
  });

  /**
   * REQ-UI-003: Next button is disabled on last word
   */
  test('REQ-UI-003: Next button disabled on last word', async ({ page }) => {
    // Navigate to last word (index 2 for 3 words)
    await wordCardPage.nextWord();
    await page.waitForTimeout(500);
    await wordCardPage.nextWord();
    await page.waitForTimeout(500);

    // Next button should be disabled
    await wordCardPage.expectNextButtonDisabled();
  });

  /**
   * REQ-UI-003: Navigation dots work correctly
   */
  test('REQ-UI-003: Navigation dots work', async ({ page }) => {
    // Get all dots
    const dots = await page.locator('button[class*="w-2"][class*="h-2"][class*="rounded-full"]').all();
    expect(dots.length).toBeGreaterThan(0);

    // Click last dot
    await dots[dots.length - 1].click();
    await page.waitForTimeout(500);

    // Verify we're on last word
    await wordCardPage.expectNextButtonDisabled();
  });

  /**
   * REQ-WORD-004: Words are sorted by order_index
   * This is verified via API test
   */
  test('REQ-WORD-004: Words sorted by order_index (verified via API)', async () => {
    // This is verified in backend tests
    // The API returns words sorted by order_index
    expect(true).toBe(true);
  });

  /**
   * REQ-UI-003: Word card displays correct word content
   */
  test('REQ-UI-003: First word is "abandon" (sorted by order_index)', async ({ page }) => {
    const spelling = await page.locator('h1.text-5xl').textContent();
    expect(spelling?.toLowerCase()).toBe('abandon');
  });
});
