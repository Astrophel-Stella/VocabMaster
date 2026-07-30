/**
 * E2E tests for App-level functionality
 */

import { test, expect } from '@playwright/test';
import { LoginPage, WordBankPage, WordLearningPage, AppHeader, loginAsTestUser, selectFirstWordBank } from '../shared/utils';

test.describe('App-level functionality', () => {

  test('App title is VocabMaster', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Check page title
    await expect(page).toHaveTitle('VocabMaster');
  });

  test('Logout returns to login page', async ({ page }) => {
    await loginAsTestUser(page);

    // Click logout button
    const header = new AppHeader(page);
    await header.logout();

    // Should be back at login page
    const loginPage = new LoginPage(page);
    await expect(loginPage.usernameInput).toBeVisible({ timeout: 5000 });
    await expect(loginPage.passwordInput).toBeVisible();
  });

  test('Refresh preserves login state and progress', async ({ page }) => {
    // Login
    await loginAsTestUser(page);
    await selectFirstWordBank(page);

    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Mark first word as mastered
    let isMastered = await wordLearningPage.isMastered();
    if (!isMastered) {
      await wordLearningPage.toggleMastered();
      await page.waitForTimeout(500);
      isMastered = true;
    }

    // Record the mastered state
    const masteredBeforeRefresh = await wordLearningPage.getMasteredCount();
    const firstWordSpelling = await wordLearningPage.wordSpelling.textContent();

    // Refresh page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be logged in (on word learning page, not login)
    await wordLearningPage.expectLoaded();

    // Verify same word
    const wordAfterRefresh = await wordLearningPage.wordSpelling.textContent();
    expect(wordAfterRefresh).toBe(firstWordSpelling);

    // Verify mastered state is preserved
    const isStillMastered = await wordLearningPage.isMastered();
    expect(isStillMastered).toBe(true);

    // Verify stats are preserved - this is the key assertion
    const masteredAfterRefresh = await wordLearningPage.getMasteredCount();
    expect(masteredAfterRefresh!.mastered).toBe(masteredBeforeRefresh!.mastered);
  });

  test('Platform badge shows Web in browser', async ({ page }) => {
    await loginAsTestUser(page);

    // Check platform badge
    const platformBadge = page.getByText('Web');
    await expect(platformBadge).toBeVisible();
  });

  test('Version badge shows v1.0', async ({ page }) => {
    await loginAsTestUser(page);

    // Check version badge
    const versionBadge = page.getByText('v1.0');
    await expect(versionBadge).toBeVisible();
  });

  test('Header shows logged-in username', async ({ page }) => {
    await loginAsTestUser(page);

    const header = new AppHeader(page);
    await header.expectLoggedIn('test');
  });

  test('Word bank name shown in header when selected', async ({ page }) => {
    await loginAsTestUser(page);
    await selectFirstWordBank(page);

    // Check that word bank name is shown in header
    const wordBankBadge = page.getByText(/高考英语|考研英语|生活英语/);
    await expect(wordBankBadge.first()).toBeVisible();
  });

  test('Return button works from word learning page', async ({ page }) => {
    await loginAsTestUser(page);
    await selectFirstWordBank(page);

    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Click return button
    await wordLearningPage.goBack();

    // Should be back at word bank selection
    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();
  });

  test('Full user flow: login → select bank → view word → mark mastered → return', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('test', '123456');

    // Select word bank
    const wordBankPage = new WordBankPage(page);
    await wordBankPage.expectLoaded();
    await wordBankPage.selectBank('高考英语');

    // View word
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Mark mastered
    const isMastered = await wordLearningPage.isMastered();
    if (!isMastered) {
      await wordLearningPage.toggleMastered();
      await page.waitForTimeout(500);
    }

    // Return to word bank selection
    await wordLearningPage.goBack();
    await wordBankPage.expectLoaded();
  });
});
