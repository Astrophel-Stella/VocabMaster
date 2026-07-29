/**
 * Shared test utilities for VocabMaster E2E tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Test credentials
 */
export const TEST_USER = {
  username: 'test',
  password: '123456',
};

/**
 * API base URL
 */
export const API_BASE = 'http://localhost:8000/api';

/**
 * Page Object: Login Page
 */
export class LoginPage {
  constructor(private page: Page) {}

  // Selectors
  readonly usernameInput = () => this.page.locator('input[type="text"]');
  readonly passwordInput = () => this.page.locator('input[type="password"]');
  readonly submitButton = () => this.page.locator('button[type="submit"]');
  readonly switchToRegisterButton = () => this.page.locator('button:has-text("没有账号")');
  readonly switchToLoginButton = () => this.page.locator('button:has-text("已有账号")');
  readonly errorMessage = () => this.page.locator('.text-red-600');
  readonly emailInput = () => this.page.locator('input[type="email"]');

  // Actions
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async login(username: string = TEST_USER.username, password: string = TEST_USER.password) {
    await this.usernameInput().fill(username);
    await this.passwordInput().fill(password);
    await this.submitButton().click();
  }

  async switchToRegister() {
    await this.switchToRegisterButton().click();
  }

  async switchToLogin() {
    await this.switchToLoginButton().click();
  }

  // Assertions
  async expectLoginFormVisible() {
    await expect(this.usernameInput()).toBeVisible();
    await expect(this.passwordInput()).toBeVisible();
    await expect(this.submitButton()).toBeVisible();
  }

  async expectErrorMessage(message: string) {
    await expect(this.errorMessage()).toContainText(message);
  }

  async expectPasswordMinLength(minLength: number) {
    const minLengthAttr = await this.passwordInput().getAttribute('minLength');
    expect(minLengthAttr).toBe(String(minLength));
  }
}

/**
 * Page Object: Word Bank Selection Page
 */
export class WordBankSelectPage {
  constructor(private page: Page) {}

  // Selectors
  readonly title = () => this.page.locator('h2:has-text("选择词库")');
  readonly wordBankCards = () => this.page.locator('button[class*="p-6"]');
  readonly wordBankByName = (name: string) => this.page.locator(`button:has-text("${name}")`);
  readonly loadingSpinner = () => this.page.locator('.animate-spin');
  readonly errorMessage = () => this.page.locator('.text-red-600');
  readonly logoutButton = () => this.page.locator('button:has-text("退出")');

  // Actions
  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async selectWordBank(name: string) {
    await this.wordBankByName(name).click();
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    await this.logoutButton().click();
  }

  // Assertions
  async expectTitleVisible() {
    await expect(this.title()).toBeVisible();
  }

  async expectWordBankCount(count: number) {
    await expect(this.wordBankCards()).toHaveCount(count);
  }

  async expectWordBankVisible(name: string) {
    await expect(this.wordBankByName(name)).toBeVisible();
  }

  async expectWordBankHasDetails(name: string, details: { description?: string; wordCount?: number }) {
    const card = this.wordBankByName(name);
    if (details.description) {
      await expect(card).toContainText(details.description);
    }
    if (details.wordCount) {
      await expect(card).toContainText(`${details.wordCount} 个单词`);
    }
  }
}

/**
 * Page Object: Word Card Page
 */
export class WordCardPage {
  constructor(private page: Page) {}

  // Selectors
  readonly wordSpelling = () => this.page.locator('h1.text-5xl');
  readonly wordPhonetic = () => this.page.locator('p.text-xl.text-gray-500');
  readonly wordMeaning = () => this.page.locator('p.text-lg.text-gray-800');
  readonly exampleSentence = () => this.page.locator('p.text-gray-700.italic');
  readonly prevButton = () => this.page.locator('button:has-text("上一个")');
  readonly nextButton = () => this.page.locator('button:has-text("下一个")');
  readonly markMasteredButton = () => this.page.locator('button:has-text("标记已掌握")');
  readonly masteredButton = () => this.page.locator('button:has-text("已掌握")');
  readonly navigationDots = () => this.page.locator('button[class*="w-2"][class*="h-2"][class*="rounded-full"]');
  readonly progressText = () => this.page.locator('span:has-text("进度:")');
  readonly masteredText = () => this.page.locator('span:has-text("已掌握:")');
  readonly backButton = () => this.page.locator('button:has-text("返回")');
  readonly loadingSpinner = () => this.page.locator('.animate-spin');

  // Actions
  async nextWord() {
    await this.nextButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  async prevWord() {
    await this.prevButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToWord(index: number) {
    const dots = await this.navigationDots().all();
    if (index < dots.length) {
      await dots[index].click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async markAsMastered() {
    await this.markMasteredButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  async unmarkAsMastered() {
    await this.masteredButton().click();
    await this.page.waitForLoadState('networkidle');
  }

  async goBack() {
    await this.backButton().click();
  }

  // Assertions
  async expectWordVisible() {
    await expect(this.wordSpelling()).toBeVisible();
  }

  async expectWordSpelling(spelling: string) {
    await expect(this.wordSpelling()).toContainText(spelling);
  }

  async expectPhoneticVisible() {
    await expect(this.wordPhonetic()).toBeVisible();
  }

  async expectMeaningVisible() {
    await expect(this.wordMeaning()).toBeVisible();
  }

  async expectExampleSentenceVisible() {
    await expect(this.exampleSentence()).toBeVisible();
  }

  async expectNoLoadingSpinner() {
    await expect(this.loadingSpinner()).not.toBeVisible();
  }

  async expectPrevButtonDisabled() {
    await expect(this.prevButton()).toBeDisabled();
  }

  async expectNextButtonDisabled() {
    await expect(this.nextButton()).toBeDisabled();
  }

  async expectPrevButtonEnabled() {
    await expect(this.prevButton()).toBeEnabled();
  }

  async expectNextButtonEnabled() {
    await expect(this.nextButton()).toBeEnabled();
  }

  async expectMarkMasteredButtonVisible() {
    await expect(this.markMasteredButton()).toBeVisible();
  }

  async expectMasteredButtonVisible() {
    await expect(this.masteredButton()).toBeVisible();
  }

  async expectProgressVisible() {
    await expect(this.progressText()).toBeVisible();
    await expect(this.masteredText()).toBeVisible();
  }
}

/**
 * Helper function to login and navigate to word bank selection
 */
export async function loginAs(page: Page, username: string = TEST_USER.username, password: string = TEST_USER.password) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(username, password);

  // Wait for word bank selection page (SPA, URL doesn't change)
  await page.waitForSelector('h2:has-text("选择词库")', { timeout: 15000 });
}

/**
 * Helper function to login and select a word bank
 */
export async function loginAndSelectWordBank(page: Page, wordBankName: string) {
  await loginAs(page);
  const wordBankSelectPage = new WordBankSelectPage(page);
  await wordBankSelectPage.selectWordBank(wordBankName);
  await page.waitForSelector('h1.text-5xl', { timeout: 15000 });
}
