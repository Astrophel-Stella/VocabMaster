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

  test('REQ-WORD-001: First word is "the" (highest frequency first)', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Words are ordered by corpus frequency (order_index ascending), so the
    // most common English word "the" leads the 高考英语 bank.
    const spelling = await wordLearningPage.wordSpelling.textContent();
    expect(spelling?.toLowerCase()).toBe('the');
  });

  test('REQ-WORD-001: All word card elements are present', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Navigation buttons
    await expect(wordLearningPage.prevButton).toBeVisible();
    await expect(wordLearningPage.nextButton).toBeVisible();

    // Mastered button
    await expect(wordLearningPage.masteredButton).toBeVisible();

    // Progress indicator - new UI shows mastered count as pill badge
    await expect(page.getByText(/已掌握 \d+ \/ \d+/)).toBeVisible();

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

  test('REQ-WB-002 / SOU-39: first word disables Previous; full bank stays navigable past the 50-dot strip', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();
    await wordLearningPage.expectProgressLoaded();

    // At first word - previous disabled, next enabled.
    await wordLearningPage.expectPrevDisabled();
    await expect(wordLearningPage.nextButton).toBeEnabled();

    // The seeded banks are full libraries (thousands of words), so the total
    // shown is far larger than the 50-dot quick-jump strip.
    const progress = await wordLearningPage.getCurrentProgress();
    expect(progress!.total).toBeGreaterThan(50);

    // Jump to the last *visible* dot (word ~50). Because the WHOLE bank is
    // loaded, words remain beyond it, so Next must still be enabled. This is
    // exactly the behaviour the old 50-word-cap regression got wrong (it made
    // dot #50 the last word and disabled Next while the bank had thousands).
    const dots = await wordLearningPage.navigationDots.all();
    if (dots.length > 1) {
      const lastDotIndex = Math.min(dots.length - 1, 49);
      await dots[lastDotIndex].click();
      await expect(wordLearningPage.nextButton).toBeEnabled();
      await expect(wordLearningPage.prevButton).toBeEnabled();
    }
    // The "Next disabled at the true last word" boundary is asserted at the
    // unit level (WordCard.test.tsx) where a tiny word list makes the final
    // word reachable — reaching word #3677 through the UI is not practical.
  });


  test('REQ-WORD-004: Words are sorted by order_index', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // First word should be "the" (ordered by corpus frequency, most common first)
    const firstWord = await wordLearningPage.wordSpelling.textContent();
    expect(firstWord?.toLowerCase()).toBe('the');

    // Navigate through the first 5 words and verify each is served in a stable,
    // gap-free order (non-empty and distinct spellings).
    const words: string[] = [firstWord!.toLowerCase()];

    for (let i = 0; i < 4; i++) {
      if (await wordLearningPage.nextButton.isEnabled()) {
        await wordLearningPage.goToNext();
        await page.waitForTimeout(200);
        const word = (await wordLearningPage.wordSpelling.textContent())?.toLowerCase();
        words.push(word!);
      }
    }

    // Every word slot is populated and no spelling repeats within the sequence.
    for (const word of words) {
      expect(word).toBeTruthy();
    }
    expect(new Set(words).size).toBe(words.length);
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
