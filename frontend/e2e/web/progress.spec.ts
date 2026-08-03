/**
 * E2E tests for Progress Statistics functionality
 * REQ-UI-004 / REQ-PROG-001~004
 */

import { test, expect } from '@playwright/test';
import { WordLearningPage, loginAsTestUser, selectFirstWordBank } from '../shared/utils';

test.describe('Progress Statistics - REQ-UI-004 / REQ-PROG', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await selectFirstWordBank(page);
  });

  test('REQ-PROG-004: Progress bar shows correct format N/total and M/total', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();
    await wordLearningPage.expectProgressLoaded();

    // Get progress text - new UI shows progress as styled numbers
    const progress = await wordLearningPage.getCurrentProgress();
    expect(progress).not.toBeNull();
    expect(progress!.current).toBe(1); // First word
    expect(progress!.total).toBeGreaterThan(0);

    // Get mastered count
    const mastered = await wordLearningPage.getMasteredCount();
    expect(mastered).not.toBeNull();
    expect(mastered!.total).toBe(progress!.total);
    expect(mastered!.mastered).toBeGreaterThanOrEqual(0);
  });

  test('REQ-PROG-001: Mark as mastered updates UI and stats', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();
    // Progress must be loaded before toggling, otherwise the toggle would decide
    // its direction from an empty progress array.
    await wordLearningPage.expectProgressLoaded();

    // First, ensure word is NOT mastered (force unmark if needed), and wait for
    // that precondition to settle before capturing the baseline.
    if (await wordLearningPage.isMastered()) {
      await wordLearningPage.toggleMastered();
      await wordLearningPage.expectNotMastered();
    }

    // Get initial mastered count (now guaranteed unmastered)
    const initialMastered = await wordLearningPage.getMasteredCount();

    // Click mastered button (now guaranteed to be unmastered)
    await wordLearningPage.toggleMastered();

    // Verify button shows mastered state (retries until the API round-trip lands)
    await wordLearningPage.expectMastered();

    // Verify stats updated
    await expect.poll(async () => (await wordLearningPage.getMasteredCount())!.mastered)
      .toBe(initialMastered!.mastered + 1);
  });

  test('REQ-PROG-002: Unmark mastered updates UI and stats', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();
    await wordLearningPage.expectProgressLoaded();

    // First, ensure word is mastered, and wait for that precondition to settle.
    if (!(await wordLearningPage.isMastered())) {
      await wordLearningPage.toggleMastered();
      await wordLearningPage.expectMastered();
    }

    // Get current mastered count (now guaranteed mastered)
    const masteredBeforeUnmark = await wordLearningPage.getMasteredCount();

    // Unmark
    await wordLearningPage.toggleMastered();

    // Verify button shows unmarked state (retries until the API round-trip lands)
    await wordLearningPage.expectNotMastered();

    // Verify stats updated
    await expect.poll(async () => (await wordLearningPage.getMasteredCount())!.mastered)
      .toBe(masteredBeforeUnmark!.mastered - 1);
  });

  test('REQ-PROG-003: Progress persists across word navigation', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();
    await wordLearningPage.expectProgressLoaded();

    // Mark first word as mastered, waiting for the state to settle.
    if (!(await wordLearningPage.isMastered())) {
      await wordLearningPage.toggleMastered();
      await wordLearningPage.expectMastered();
    }

    const firstWordSpelling = await wordLearningPage.wordSpelling.textContent();
    const masteredCountAfterMark = await wordLearningPage.getMasteredCount();

    // Navigate to second word
    await wordLearningPage.goToNext();
    await expect(wordLearningPage.prevButton).toBeEnabled();

    // Navigate back to first word
    await wordLearningPage.goToPrevious();

    // Verify we're back at the first word
    await expect(wordLearningPage.wordSpelling).toHaveText(firstWordSpelling!);

    // Verify mastered state is preserved
    await wordLearningPage.expectMastered();

    // Verify stats are the same
    const masteredCountAfterNav = await wordLearningPage.getMasteredCount();
    expect(masteredCountAfterNav!.mastered).toBe(masteredCountAfterMark!.mastered);
  });
});
