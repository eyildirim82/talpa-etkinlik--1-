import { Page, Locator, expect } from '@playwright/test';

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly logoutButton: Locator;
  readonly modal: Locator;

  constructor(page: Page) {
    this.page = page;
    // Gerçek placeholder'lar: user@example.com ve ••••••••
    this.emailInput = page.getByPlaceholder('user@example.com');
    this.passwordInput = page.getByPlaceholder('••••••••');
    // Button text uppercase: GİRİŞ YAP
    this.submitButton = page.getByRole('button', { name: /GİRİŞ YAP/i });
    this.errorMessage = page.getByText(/Invalid login credentials|hata oluştu/i);
    this.logoutButton = page.getByText('Çıkış Yap');
    this.modal = page.locator('.fixed.inset-0');
  }

  async expectModalVisible() {
    await expect(this.emailInput).toBeVisible({ timeout: 5000 });
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitButton.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    
    const reloadPromise = this.page.waitForEvent('load', { timeout: 5000 });
    await this.submit();
    await reloadPromise;
  }

  async loginWithoutReload(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async logout() {
    const reloadPromise = this.page.waitForEvent('load', { timeout: 5000 });
    await this.logoutButton.click();
    await reloadPromise;
  }

  async expectLoginError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }

  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }
}
