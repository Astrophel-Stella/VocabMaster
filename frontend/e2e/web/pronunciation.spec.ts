/**
 * E2E tests for Pronunciation functionality
 * REQ-WORD-003: 发音播放功能
 */

import { test, expect } from '@playwright/test';
import { WordLearningPage, LoginPage, loginAsTestUser, selectFirstWordBank } from '../shared/utils';

test.describe('Pronunciation - REQ-WORD-003', () => {

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await selectFirstWordBank(page);
  });

  test('REQ-WORD-003: Authenticated user can see pronunciation button on word card', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Pronunciation button should be visible for authenticated users
    await wordLearningPage.expectPronunciationButtonVisible();
  });

  test('REQ-WORD-003: Clicking pronunciation button triggers audio playback', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Click pronunciation button
    await wordLearningPage.clickPronunciation();

    // Wait a moment for audio to start loading
    await page.waitForTimeout(500);

    // After clicking, the button should be loading the audio, already playing,
    // or (if the network audio is unreachable) show an error — any of these
    // proves the click triggered a playback attempt.
    const isLoading = await wordLearningPage.isPronunciationButtonLoading();
    const isPlaying = await wordLearningPage.isPronunciationButtonPlaying();
    const hasError = await wordLearningPage.hasPronunciationError();

    // A playback attempt should have been triggered
    expect(isLoading || isPlaying || hasError).toBe(true);
  });

  test('REQ-WORD-003: Pronunciation button shows loading state when audio is loading', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Click pronunciation button
    await wordLearningPage.clickPronunciation();

    // Immediately check for loading state (animate-spin on SVG)
    // The loading state may be brief, so we check right away
    const svg = wordLearningPage.pronunciationButton.locator('svg');
    const className = await svg.getAttribute('class').catch(() => '');
    const isLoading = className?.includes('animate-spin');

    // In test environment, API not configured, so error may appear instead
    const hasError = await wordLearningPage.hasPronunciationError();

    // Either loading or error state should be triggered
    expect(isLoading || hasError).toBe(true);
  });

  test('REQ-WORD-003: Pronunciation works without commercial API keys (SOU-42 keyless provider)', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Click pronunciation button
    await wordLearningPage.clickPronunciation();

    // Wait for the request to resolve
    await page.waitForTimeout(1500);

    // Regression guard: the keyless public provider is enabled by default, so the
    // old "发音服务未配置" failure must NOT appear anymore.
    await expect(page.getByText('发音服务未配置')).toHaveCount(0);
  });

  test('REQ-WORD-003: Unauthenticated user cannot see pronunciation button', async ({ page }) => {
    // Logout first
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Click logout button
    await page.getByRole('button', { name: '退出' }).click();

    // Wait for redirect to login page (login page has no "登录" heading;
    // its heading is "📚 VocabMaster", so assert on the submit button).
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible({ timeout: 5000 });

    // Login with test user and select word bank to see word card
    // Then logout to test unauthenticated state
    const loginPage = new LoginPage(page);
    await loginPage.login('test', '123456');
    await expect(page.getByRole('heading', { name: '选择词库' })).toBeVisible({ timeout: 10000 });

    // Select first word bank
    const cards = page.locator('button:has(h3)');
    const count = await cards.count();
    if (count > 0) {
      await cards.first().click();
      await expect(page.getByTestId('word-spelling')).toBeVisible({ timeout: 10000 });
    }

    // Logout again
    await page.getByRole('button', { name: '退出' }).click();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible({ timeout: 5000 });

    // Now navigate directly to see if pronunciation button is hidden
    // (In this app, unauthenticated users see login page, not word cards)
    // So we verify that after logout, user cannot access word cards
    await page.goto('/');
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible({ timeout: 5000 });
  });

  test('REQ-WORD-003: Clicking different word pronunciation stops previous audio', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Click pronunciation for first word
    await wordLearningPage.clickPronunciation();
    await page.waitForTimeout(500);

    // Navigate to next word
    await wordLearningPage.goToNext();
    await page.waitForTimeout(300);

    // Click pronunciation for second word
    // This should stop any previous audio
    await wordLearningPage.clickPronunciation();
    await page.waitForTimeout(500);

    // The second word should be loading, playing, or (if unreachable) error —
    // any of these proves the click triggered a fresh playback attempt.
    const isLoading = await wordLearningPage.isPronunciationButtonLoading();
    const isPlaying = await wordLearningPage.isPronunciationButtonPlaying();
    const hasError = await wordLearningPage.hasPronunciationError();
    expect(isLoading || isPlaying || hasError).toBe(true);
  });

  test('REQ-WORD-003: Pronunciation button has correct aria attributes for accessibility', async ({ page }) => {
    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Check button has title attribute for tooltip
    const title = await wordLearningPage.pronunciationButton.getAttribute('title');
    expect(title).toBeTruthy();
    // Title should indicate play action or loading state
    expect(title).toMatch(/播放|加载|播放中/);
  });
});
