/**
 * Page Object Model utilities for E2E tests
 */

import { Page, Locator, expect } from '@playwright/test';

/**
 * Login Page Object
 */
export class LoginPage {
  readonly page: Page;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly toggleModeButton: Locator;
  readonly errorMessage: Locator;
  readonly testAccountHint: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use accessible selectors based on labels and roles
    this.usernameInput = page.getByLabel('用户名');
    this.passwordInput = page.getByLabel('密码');
    this.emailInput = page.getByLabel('邮箱');
    // 提交按钮用 type=submit 精确定位，避免与"没有账号？点击注册"(含"注册"字样)歧义
    this.submitButton = page.locator('button[type="submit"]');
    this.toggleModeButton = page.getByRole('button', { name: /没有账号|已有账号/ });
    // Error message: find the error container (has red background) and get the text inside
    this.errorMessage = page.locator('[class*="bg-red-50"] p').first();
    this.testAccountHint = page.getByText('测试账号');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async switchToRegister() {
    await this.toggleModeButton.click();
  }

  async register(username: string, email: string, password: string) {
    await this.switchToRegister();
    await this.usernameInput.fill(username);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage).toContainText(message);
  }

  async expectErrorVisible() {
    await expect(this.errorMessage).toBeVisible();
  }
}

/**
 * Word Bank Selection Page Object
 */
export class WordBankPage {
  readonly page: Page;
  readonly title: Locator;
  readonly wordBankCards: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole('heading', { name: '选择词库' });
    this.wordBankCards = page.locator('button:has(h3)');
    // Loading spinner: the animated loading indicator
    this.loadingSpinner = page.locator('[class*="animate-spin"]');
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible();
  }

  async selectBank(name: string) {
    await this.page.getByRole('button', { name: new RegExp(name) }).click();
  }

  async expectBankVisible(name: string) {
    await expect(this.page.getByRole('button', { name: new RegExp(name) })).toBeVisible();
  }

  async getBankCount() {
    return await this.wordBankCards.count();
  }
}

/**
 * Word Learning Page Object
 */
export class WordLearningPage {
  readonly page: Page;
  readonly backButton: Locator;
  readonly wordSpelling: Locator;
  readonly wordPhonetic: Locator;
  readonly wordMeaning: Locator;
  readonly wordExample: Locator;
  readonly prevButton: Locator;
  readonly nextButton: Locator;
  readonly masteredButton: Locator;
  readonly progressText: Locator;
  readonly masteredCount: Locator;
  readonly navigationDots: Locator;
  readonly pronunciationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole('button', { name: '返回' });
    // 单词拼写：用 data-testid 精确定位，避免与页头 <h1>VocabMaster</h1> 冲突
    this.wordSpelling = page.getByTestId('word-spelling');
    // Phonetic: 定位到拼写区域下方的音标 <p>（灰色斜杠包裹文本）
    this.wordPhonetic = page.getByTestId('word-spelling').locator('../..').locator('p').filter({ hasText: /^\/.*\/$/ });
    // Meaning: the main content in the gray box (use data-testid for stability)
    this.wordMeaning = page.getByTestId('word-meaning');
    this.wordExample = page.getByText('例句:');
    this.prevButton = page.getByRole('button', { name: '上一个' });
    this.nextButton = page.getByRole('button', { name: '下一个' });
    this.masteredButton = page.getByRole('button', { name: /标记已掌握|已掌握/ });
    // Updated to match new UI: progress shows as styled box with current index number
    // The text "进度:" is no longer shown, but we can find the progress area by looking for the index display
    this.progressText = page.locator('div').filter({ hasText: /^\d+$/ }).locator('..').filter({ has: page.locator('span.text-gray-400') });
    // Updated to match new UI: mastered count shows as "已掌握 X / Y" in a pill badge
    this.masteredCount = page.getByText(/已掌握 \d+ \/ \d+/);
    // Navigation dots: small round buttons used for word navigation,
    // located by a stable data-testid (the dot's Tailwind classes live on the
    // button itself, so a has:-child filter never matches).
    this.navigationDots = page.getByTestId('nav-dot');
    // Pronunciation button: 用 data-testid 精确定位（图标按钮，带 aria-label 可访问名）
    this.pronunciationButton = page.getByTestId('pronunciation-button');
  }

  async expectLoaded() {
    await expect(this.wordSpelling).toBeVisible();
  }

  async goToPrevious() {
    await this.prevButton.click();
  }

  async goToNext() {
    await this.nextButton.click();
  }

  async toggleMastered() {
    await this.masteredButton.click();
  }

  async goBack() {
    await this.backButton.click();
  }

  async expectWordVisible(word: string) {
    await expect(this.wordSpelling).toContainText(word);
  }

  async isMastered() {
    // Use aria-pressed attribute which is more reliable than text content
    const pressed = await this.masteredButton.getAttribute('aria-pressed');
    return pressed === 'true';
  }

  async expectPrevDisabled() {
    await expect(this.prevButton).toBeDisabled();
  }

  async expectNextDisabled() {
    await expect(this.nextButton).toBeDisabled();
  }

  async getCurrentProgress() {
    // New UI: progress shows as styled box with current index number
    // Find the container that has the current index and total
    const container = this.page.locator('div.flex.justify-between.items-center.text-sm').first();
    const text = await container.textContent();
    // Extract numbers from text like "1 / 100"
    const match = text?.match(/(\d+)\s*\/\s*(\d+)/);
    if (match) {
      return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }
    return null;
  }

  async getMasteredCount() {
    const text = await this.masteredCount.textContent();
    // New UI: "已掌握 X / Y" (space instead of colon)
    const match = text?.match(/已掌握\s*(\d+)\s*\/\s*(\d+)/);
    if (match) {
      return { mastered: parseInt(match[1]), total: parseInt(match[2]) };
    }
    return null;
  }

  async expectPronunciationButtonVisible() {
    await expect(this.pronunciationButton).toBeVisible();
  }

  async expectPronunciationButtonHidden() {
    await expect(this.pronunciationButton).not.toBeVisible();
  }

  async clickPronunciation() {
    await this.pronunciationButton.click();
  }

  async isPronunciationButtonLoading() {
    // Loading state: button has animate-spin SVG inside
    const svg = this.pronunciationButton.locator('svg');
    const className = await svg.getAttribute('class');
    return className?.includes('animate-spin') || false;
  }

  async isPronunciationButtonPlaying() {
    // Playing state: button has animate-pulse class
    const className = await this.pronunciationButton.getAttribute('class');
    return className?.includes('animate-pulse') || false;
  }

  async hasPronunciationError() {
    // Error state: check for error message below the word spelling area
    const errorText = this.page.getByText(/发音加载失败|发音服务未配置|请先登录/);
    return await errorText.isVisible().catch(() => false);
  }
}

/**
 * App Header Page Object
 */
export class AppHeader {
  readonly page: Page;
  readonly title: Locator;
  readonly platform: Locator;
  readonly userName: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.getByRole('heading', { name: 'VocabMaster' });
    this.platform = page.getByText(/桌面版|Web/);
    // Updated to match new UI: username is shown directly, followed by "欢迎回来"
    this.userName = page.locator('header').getByText(/^(test|user_.*)$/);
    this.logoutButton = page.getByRole('button', { name: '退出' });
  }

  async logout() {
    await this.logoutButton.click();
  }

  async expectLoggedIn(username: string) {
    await expect(this.userName).toContainText(username);
  }
}

/**
 * Helper functions
 */

export async function loginAsTestUser(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test', '123456');
  // Wait for redirect to word bank selection
  await page.waitForURL('**/', { waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: '选择词库' })).toBeVisible({ timeout: 10000 });
}

export async function selectFirstWordBank(page: Page) {
  const wordBankPage = new WordBankPage(page);
  const cards = await wordBankPage.wordBankCards.all();
  if (cards.length > 0) {
    await cards[0].click();
    // Wait for word card to appear. Use the word-spelling testid rather than
    // heading level:1 — the app header is also an h1, so a bare level:1 query
    // hits a strict-mode violation (two matches).
    await expect(page.getByTestId('word-spelling')).toBeVisible({ timeout: 10000 });
  }
}
