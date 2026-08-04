/**
 * E2E tests for mobile responsive layout
 * REQ-UI-005: 移动端响应式适配
 *
 * Runs the core flow at a phone viewport (iPhone 12 logical size) and asserts
 * the page does not overflow horizontally and that the header controls — which
 * collapse to icon-only on small screens — remain reachable by their stable
 * accessible names (aria-label). This is the compensating check for not having
 * a real device lab, mirroring how CLAUDE.md treats production-config E2E.
 */

import { test, expect } from '@playwright/test';
import { WordLearningPage, loginAsTestUser, selectFirstWordBank } from '../shared/utils';

// Emulate a common small phone. 390x844 = iPhone 12/13/14 logical resolution.
test.use({ viewport: { width: 390, height: 844 } });

/** No element may push the page wider than the viewport (horizontal scroll). */
async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  // Allow 1px for sub-pixel rounding; anything larger is a real overflow.
  expect(overflow, 'page should not scroll horizontally on mobile').toBeLessThanOrEqual(1);
}

test.describe('Mobile responsive layout - REQ-UI-005', () => {
  test('REQ-UI-005: Login page fits the mobile viewport without horizontal scroll', async ({ page }) => {
    await page.goto('/');
    // Mobile-only header ("英语单词学习助手") should be visible on a phone.
    await expect(page.getByText('英语单词学习助手')).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('REQ-UI-005: Word bank selection fits the mobile viewport', async ({ page }) => {
    await loginAsTestUser(page);
    await expect(page.getByRole('heading', { name: '选择词库' })).toBeVisible();
    // Header controls collapse to icons on mobile but keep their accessible names.
    await expect(page.getByRole('button', { name: '退出' })).toBeVisible();
    await expect(page.getByRole('button', { name: '修改密码' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('REQ-UI-005: Word learning card fits the mobile viewport and controls work', async ({ page }) => {
    await loginAsTestUser(page);
    await selectFirstWordBank(page);

    const wordLearningPage = new WordLearningPage(page);
    await wordLearningPage.expectLoaded();

    // Header: back + collapsed controls all reachable by accessible name.
    await expect(page.getByRole('button', { name: '返回' })).toBeVisible();
    await expect(page.getByRole('button', { name: '退出' })).toBeVisible();

    // Action row: prev/next collapse to icon-only on mobile, but aria-label keeps
    // them addressable; the mastered button keeps its full label.
    await expect(page.getByRole('button', { name: '上一个' })).toBeVisible();
    await expect(page.getByRole('button', { name: '下一个' })).toBeVisible();
    await expect(wordLearningPage.masteredButton).toBeVisible();

    // Pronunciation button (icon) is visible and tappable on mobile.
    await wordLearningPage.expectPronunciationButtonVisible();

    await expectNoHorizontalOverflow(page);

    // Navigating to the next word must not introduce overflow either.
    await page.getByRole('button', { name: '下一个' }).click();
    await page.waitForTimeout(200);
    await expectNoHorizontalOverflow(page);
  });
});
