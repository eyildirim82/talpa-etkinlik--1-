import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly loginButton: Locator;
  readonly accountButton: Locator;
  readonly ticketButton: Locator;
  readonly eventTitle: Locator;
  readonly quotaText: Locator;
  readonly soldOutButton: Locator;
  readonly emptyState: Locator;
  readonly emptyStateTitle: Locator;
  readonly header: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginButton = page.getByRole('button', { name: 'Giriş Yap' }).first();
    this.accountButton = page.getByRole('button', { name: 'Hesabım' });
    this.ticketButton = page.getByRole('button', { name: 'Bilet Al' });
    this.eventTitle = page.locator('h1');
    this.quotaText = page.getByText(/\d+ \/ \d+ Kalan/);
    this.soldOutButton = page.getByRole('button', { name: 'TÜKENDİ' });
    this.emptyState = page.getByText(/aktif bir etkinlik bulunmamaktadır/i);
    this.emptyStateTitle = page.getByRole('heading', { name: 'NO ACTIVE SORTIES' });
    this.header = page.locator('header');
  }

  async goto() {
    await this.page.goto('/');
  }

  async waitForLoad() {
    await expect(this.header).toBeVisible({ timeout: 20000 });
  }

  async openLoginModal() {
    await this.loginButton.click();
  }

  async openBookingModal() {
    await this.ticketButton.click();
  }

  async openAccountMenu() {
    await this.accountButton.click();
  }

  async expectLoggedIn(userName: string) {
    await expect(this.accountButton).toBeVisible({ timeout: 10000 });
    await this.accountButton.click();
    await expect(this.page.getByText(userName)).toBeVisible();
  }

  async expectLoggedOut() {
    await expect(this.loginButton).toBeVisible();
  }

  async expectEventVisible(title: string) {
    await expect(this.eventTitle).toContainText(title);
  }

  async expectQuotaVisible() {
    await expect(this.quotaText).toBeVisible();
  }

  async expectSoldOut() {
    await expect(this.soldOutButton).toBeVisible();
    await expect(this.soldOutButton).toBeDisabled();
  }

  async expectNoActiveEvent() {
    // EmptyState'in tamamen yüklendiğinden emin olmak için birden fazla element kontrol et
    // Önce başlığı kontrol et (daha güvenilir)
    await expect(this.emptyStateTitle).toBeVisible({ timeout: 15000 });
    // Sonra metni kontrol et
    await expect(this.emptyState).toBeVisible({ timeout: 5000 });
  }

  async expectTicketButtonEnabled() {
    await expect(this.ticketButton).toBeEnabled();
  }

  async expectTicketButtonDisabled() {
    await expect(this.ticketButton).toBeDisabled();
  }
}
