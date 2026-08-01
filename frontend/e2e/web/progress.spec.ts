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

    // First, ensure word is NOT mastered (force unmark if needed)
    const isMastered = await wordLearningPage.isMastered();
    if (isMastered) {
      await wordLearningPage.toggleMastered();
      await page.waitForTimeout(500);
    }

    // Get initial mastered count
    const initialMastered = await wordLearningPage.getMasteredCount();

    // Click mastered button (now guaranteed to be unmastered)
    await wordLearningPage.toggleMastered();
    await page.waitForTimeout(500); // Wait for API

    // Verify button shows mastered state
    const isNowMastered = await wordLearningPage.isMastered();
    expect(isNowMastered).toBe(true);

    // Verify stats updated
    const newMastered = await wordLearningPage.getMasteredCount();
    expect(newMastered!.mastered).toBe(initialMastered!.mastered + 1);
  });

  test('REQ-PROG-002: Unmark mastered updates UI and stats', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // First, ensure word is mastered
    let isMastered = await wordLearningPage.isMastered();
    if (!isMastered) {
      await wordLearningPage.toggleMastered();
      await page.waitForTimeout(500);
      isMastered = true;
    }

    // Get current mastered count
    const masteredBeforeUnmark = await wordLearningPage.getMasteredCount();

    // Unmark
    await wordLearningPage.toggleMastered();
    await page.waitForTimeout(500);

    // Verify button shows unmarked state
    const isNowUnmarked = await wordLearningPage.isMastered();
    expect(isNowUnmarked).toBe(false);

    // Verify stats updated
    const newMastered = await wordLearningPage.getMasteredCount();
    expect(newMastered!.mastered).toBe(masteredBeforeUnmark!.mastered - 1);
  });

  test('REQ-PROG-003: Progress persists across word navigation', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Mark first word as mastered
    const isMastered = await wordLearningPage.isMastered();
    if (!isMastered) {
      await wordLearningPage.toggleMastered();
      await page.waitForTimeout(500);
    }

    const firstWordSpelling = await wordLearningPage.wordSpelling.textContent();
    const masteredCountAfterMark = await wordLearningPage.getMasteredCount();

    // Navigate to second word
    await wordLearningPage.goToNext();
    await page.waitForTimeout(300);

    // Navigate back to first word
    await wordLearningPage.goToPrevious();
    await page.waitForTimeout(300);

    // Verify we're back at the first word
    const currentWord = await wordLearningPage.wordSpelling.textContent();
    expect(currentWord).toBe(firstWordSpelling);

    // Verify mastered state is preserved
    const isStillMastered = await wordLearningPage.isMastered();
    expect(isStillMastered).toBe(true);

    // Verify stats are the same
    const masteredCountAfterNav = await wordLearningPage.getMasteredCount();
    expect(masteredCountAfterNav!.mastered).toBe(masteredCountAfterMark!.mastered);
  });
});
