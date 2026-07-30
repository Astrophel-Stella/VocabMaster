/**
 * E2E tests for Word Learning functionality
 * REQ-UI-003 / REQ-WB-002 / REQ-WORD-001/004
 */

import { test, expect } from '@playwright/test';
import { WordLearningPage, loginAsTestUser, selectFirstWordBank } from '../shared/utils';

test.describe('Word Learning - REQ-UI-003 / REQ-WB-002 / REQ-WORD', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await selectFirstWordBank(page);
  });

  test('REQ-WORD-001: Word card shows spelling/phonetic/meaning/example without loading spinner', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);

    // Word spelling should be visible immediately (no loading spinner)
    await wordLearningPage.expectLoaded();

    // Verify word spelling is displayed
    const spelling = await wordLearningPage.wordSpelling.textContent();
    expect(spelling).toBeTruthy();
    expect(spelling!.length).toBeGreaterThan(0);

    // Verify word meaning is displayed
    const meaning = await wordLearningPage.wordMeaning.textContent();
    expect(meaning).toBeTruthy();
    expect(meaning!.length).toBeGreaterThan(0);

    // Phonetic should be visible if present
    const hasPhonetic = await wordLearningPage.wordPhonetic.isVisible();
    // It's OK if phonetic is empty for some words

    // Example sentence may or may not be present
    const hasExample = await wordLearningPage.wordExample.isVisible().catch(() => false);
    // Both cases are valid
  });

  test('REQ-WORD-001: First word is "abandon" (alphabetically sorted)', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // The first word should be "abandon" (sorted by order_index which is alphabetical)
    const spelling = await wordLearningPage.wordSpelling.textContent();
    expect(spelling?.toLowerCase()).toBe('abandon');
  });

  test('REQ-WORD-001: All word card elements are present', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Navigation buttons
    await expect(wordLearningPage.prevButton).toBeVisible();
    await expect(wordLearningPage.nextButton).toBeVisible();

    // Mastered button
    await expect(wordLearningPage.masteredButton).toBeVisible();

    // Progress indicator
    await expect(wordLearningPage.progressText).toBeVisible();

    // Back button
    await expect(wordLearningPage.backButton).toBeVisible();
  });

  test('REQ-WB-002: Next/Previous navigation works correctly', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Get initial word
    const firstWord = await wordLearningPage.wordSpelling.textContent();

    // Previous button should be disabled on first word
    await wordLearningPage.expectPrevDisabled();

    // Click next
    await wordLearningPage.goToNext();
    await page.waitForTimeout(300); // Wait for transition

    // Word should have changed
    const secondWord = await wordLearningPage.wordSpelling.textContent();
    expect(secondWord).not.toBe(firstWord);

    // Previous button should now be enabled
    await expect(wordLearningPage.prevButton).toBeEnabled();

    // Go back to first word
    await wordLearningPage.goToPrevious();
    await page.waitForTimeout(300);

    // Should be back to first word
    const backToFirst = await wordLearningPage.wordSpelling.textContent();
    expect(backToFirst).toBe(firstWord);
  });

  test('REQ-WB-002: Navigation dots allow jumping to specific words', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Count navigation dots
    const dots = await wordLearningPage.navigationDots.all();
    expect(dots.length).toBeGreaterThan(0);

    // First dot should be active (indigo color)
    const firstDot = dots[0];
    const className = await firstDot.getAttribute('class');
    expect(className).toContain('bg-indigo-600');

    // Click on second dot
    if (dots.length > 1) {
      await dots[1].click();
      await page.waitForTimeout(300);

      // Second dot should now be active
      const secondDotClass = await dots[1].getAttribute('class');
      expect(secondDotClass).toContain('bg-indigo-600');

      // First dot should be inactive
      const firstDotClass = await firstDot.getAttribute('class');
      expect(firstDotClass).not.toContain('bg-indigo-600');
    }
  });

  test('REQ-WB-002: Previous button disabled at first word, Next button disabled at last word', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // At first word - previous disabled
    await wordLearningPage.expectPrevDisabled();
    await expect(wordLearningPage.nextButton).toBeEnabled();

    // Navigate to last word by clicking dot at the end
    const dots = await wordLearningPage.navigationDots.all();
    if (dots.length > 1) {
      // Click the last visible dot
      const lastDotIndex = Math.min(dots.length - 1, 49); // Max 50 dots shown
      await dots[lastDotIndex].click();
      await page.waitForTimeout(300);

      // At last word - next should be disabled
      await wordLearningPage.expectNextDisabled();
      await expect(wordLearningPage.prevButton).toBeEnabled();
    }
  });

  test('REQ-WORD-004: Words are sorted by order_index', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // First word should be "abandon" (sorted alphabetically)
    const firstWord = await wordLearningPage.wordSpelling.textContent();
    expect(firstWord?.toLowerCase()).toBe('abandon');

    // Navigate through first 5 words and verify alphabetical order
    const words: string[] = [firstWord!.toLowerCase()];

    for (let i = 0; i < 4; i++) {
      if (await wordLearningPage.nextButton.isEnabled()) {
        await wordLearningPage.goToNext();
        await page.waitForTimeout(200);
        const word = (await wordLearningPage.wordSpelling.textContent())?.toLowerCase();
        words.push(word!);
      }
    }

    // Verify words are in alphabetical order
    for (let i = 1; i < words.length; i++) {
      expect(words[i] >= words[i - 1]).toBe(true);
    }
  });

  test('REQ-UI-003: Return button navigates back to word bank selection', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Click return button
    await wordLearningPage.goBack();

    // Should be back at word bank selection page
    await expect(page.getByRole('heading', { name: '选择词库' })).toBeVisible({ timeout: 5000 });

    // Word bank cards should be visible
    const cards = page.locator('button:has(h3)');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });
});
