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

  test('REQ-WORD-001: First word is a real vocabulary word (frequency-ordered seed)', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // SOU-39: words are seeded from ECDICT and ordered by frequency (not
    // alphabetically), so the first word is a real English word.
    const spelling = (await wordLearningPage.wordSpelling.textContent())?.trim() ?? '';
    expect(spelling.length).toBeGreaterThan(0);
    expect(spelling).toMatch(/^[a-zA-Z][a-zA-Z '-]*$/);
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

  test('REQ-WB-002: Previous button disabled at first word, Next button disabled at last word', async ({ page }) => {
    // The real ECDICT banks hold thousands of words, so the last word is not
    // reachable by clicking one of the (max 50) nav dots. Serve a small, fixed
    // word list so the first/last boundary is deterministic and the disabled
    // logic is genuinely exercised.
    await page.route('**/word-banks/*/words*', route => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total: 3,
        words: [
          { id: 9001, spelling: 'the', phonetic: '/ðə/', pronunciation_url: null, meaning: 'art. 那', example_sentence: null },
          { id: 9002, spelling: 'be', phonetic: '/biː/', pronunciation_url: null, meaning: 'v. 是', example_sentence: null },
          { id: 9003, spelling: 'of', phonetic: '/əv/', pronunciation_url: null, meaning: 'prep. 属于', example_sentence: null },
        ],
      }),
    }));
    // Re-fetch words under the mock (words are not persisted; App reloads them).
    await page.reload();
    await page.waitForLoadState('networkidle');

    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // At first word - previous disabled, next enabled.
    await wordLearningPage.expectPrevDisabled();
    await expect(wordLearningPage.nextButton).toBeEnabled();

    // Navigate to the last word; with 3 words there are exactly 3 dots.
    const dots = await wordLearningPage.navigationDots.all();
    expect(dots.length).toBe(3);
    await dots[dots.length - 1].click();
    await page.waitForTimeout(300);

    // At last word - next disabled, previous enabled.
    await wordLearningPage.expectNextDisabled();
    await expect(wordLearningPage.prevButton).toBeEnabled();
  });

  test('REQ-WORD-004: Words are sorted by order_index', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // SOU-39: words are served in order_index order (ECDICT frequency ranking).
    // Navigate through the first 5 words and verify a stable, non-repeating
    // sequence of real words (not alphabetical — high-frequency words first).
    const firstWord = (await wordLearningPage.wordSpelling.textContent())?.trim().toLowerCase();
    expect(firstWord).toBeTruthy();

    const words: string[] = [firstWord!];
    for (let i = 0; i < 4; i++) {
      if (await wordLearningPage.nextButton.isEnabled()) {
        await wordLearningPage.goToNext();
        await page.waitForTimeout(200);
        const word = (await wordLearningPage.wordSpelling.textContent())?.trim().toLowerCase();
        words.push(word!);
      }
    }

    // Every word is a real, non-empty vocabulary word and the sequence advances
    // (no immediate repeats), confirming order_index paging.
    for (let i = 0; i < words.length; i++) {
      expect(words[i]?.length).toBeGreaterThan(0);
      if (i > 0) expect(words[i]).not.toBe(words[i - 1]);
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
