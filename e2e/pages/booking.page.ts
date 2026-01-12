import { Page, Locator, expect } from '@playwright/test';

export class BookingPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly kvkkCheckbox: Locator;
  readonly paymentCheckbox: Locator;
  readonly submitButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly userInfo: Locator;
  readonly closeButton: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('.fixed.inset-0');
    this.modalTitle = page.getByText('Başvuru Onayı');
    // Label içindeki checkbox'ları seç - label'a tıkla
    this.kvkkCheckbox = page.locator('label').filter({ hasText: 'KVKK Aydınlatma Metni' });
    this.paymentCheckbox = page.locator('label').filter({ hasText: 'Mesafeli Satış Sözleşmesi' });
    this.submitButton = page.getByRole('button', { name: /Onaylıyorum/i });
    this.cancelButton = page.getByRole('button', { name: 'Vazgeç' });
    this.errorMessage = page.locator('.bg-red-50');
    this.userInfo = page.locator('.bg-blue-50').first();
    this.closeButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    this.loadingSpinner = page.getByText('İşleniyor...');
  }

  async expectModalVisible() {
    await expect(this.modalTitle).toBeVisible({ timeout: 5000 });
  }

  async expectModalClosed() {
    await expect(this.modalTitle).not.toBeVisible();
  }

  async acceptKvkk() {
    await this.kvkkCheckbox.click();
  }

  async acceptPayment() {
    await this.paymentCheckbox.click();
  }

  async submit() {
    await this.submitButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async close() {
    await this.closeButton.click();
  }

  async acceptAllAndSubmit() {
    await this.acceptKvkk();
    await this.acceptPayment();
    await this.submit();
  }

  async expectError(message: string) {
    await expect(this.page.getByText(message)).toBeVisible({ timeout: 5000 });
  }

  async expectGenericError() {
    await expect(this.errorMessage).toBeVisible({ timeout: 5000 });
  }

  async expectSubmitDisabled() {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitEnabled() {
    await expect(this.submitButton).toBeEnabled();
  }

  async expectUserInfo(userName: string) {
    await expect(this.page.getByText(userName)).toBeVisible();
  }

  async expectLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async waitForLoadingComplete() {
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 10000 });
  }
}
