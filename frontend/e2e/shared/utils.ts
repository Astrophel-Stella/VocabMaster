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
    this.submitButton = page.getByRole('button', { name: /登录|注册/ });
    this.toggleModeButton = page.getByRole('button', { name: /没有账号|已有账号/ });
    this.errorMessage = page.locator('.text-red-600');
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
    this.loadingSpinner = page.locator('.animate-spin');
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

  constructor(page: Page) {
    this.page = page;
    this.backButton = page.getByRole('button', { name: '返回' });
    this.wordSpelling = page.getByRole('heading', { level: 1 });
    this.wordPhonetic = page.locator('p.text-xl.text-gray-500');
    this.wordMeaning = page.locator('.bg-gray-50 p.text-lg');
    this.wordExample = page.getByText('例句:');
    this.prevButton = page.getByRole('button', { name: '上一个' });
    this.nextButton = page.getByRole('button', { name: '下一个' });
    this.masteredButton = page.getByRole('button', { name: /标记已掌握|已掌握/ });
    this.progressText = page.getByText(/进度:/);
    this.masteredCount = page.getByText(/已掌握:/);
    this.navigationDots = page.locator('button[class*="rounded-full"][class*="w-2"][class*="h-2"]');
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
    const text = await this.masteredButton.textContent();
    return text?.includes('已掌握') || false;
  }

  async expectPrevDisabled() {
    await expect(this.prevButton).toBeDisabled();
  }

  async expectNextDisabled() {
    await expect(this.nextButton).toBeDisabled();
  }

  async getCurrentProgress() {
    const text = await this.progressText.textContent();
    const match = text?.match(/进度:\s*(\d+)\s*\/\s*(\d+)/);
    if (match) {
      return { current: parseInt(match[1]), total: parseInt(match[2]) };
    }
    return null;
  }

  async getMasteredCount() {
    const text = await this.masteredCount.textContent();
    const match = text?.match(/已掌握:\s*(\d+)\s*\/\s*(\d+)/);
    if (match) {
      return { mastered: parseInt(match[1]), total: parseInt(match[2]) };
    }
    return null;
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
    this.userName = page.getByText(/你好/);
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
    // Wait for word card to appear
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  }
}
