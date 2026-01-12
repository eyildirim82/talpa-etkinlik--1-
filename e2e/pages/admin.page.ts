import { Page, Locator, expect } from '@playwright/test';

export class AdminPage {
  readonly page: Page;
  readonly overviewTab: Locator;
  readonly eventsTab: Locator;
  readonly ticketsTab: Locator;
  readonly usersTab: Locator;
  readonly accessDenied: Locator;
  readonly loginRequired: Locator;
  readonly backButton: Locator;
  readonly logoutButton: Locator;
  readonly loadingSpinner: Locator;
  readonly adminLayout: Locator;

  constructor(page: Page) {
    this.page = page;
    this.overviewTab = page.getByText('Genel Bakış');
    this.eventsTab = page.getByText('Etkinlikler');
    this.ticketsTab = page.getByText('Biletler');
    this.usersTab = page.getByText('Kullanıcılar');
    this.accessDenied = page.getByText('Erişim Engellendi');
    this.loginRequired = page.getByText('Giriş Gerekli');
    this.backButton = page.getByText('Ana Sayfaya Dön');
    this.logoutButton = page.getByText('Çıkış Yap');
    this.loadingSpinner = page.getByText('Yükleniyor...');
    this.adminLayout = page.locator('[data-testid="admin-layout"]');
  }

  async goto() {
    await this.page.goto('/admin');
  }

  async gotoWithTab(tab: string) {
    await this.page.goto(`/admin?tab=${tab}`);
  }

  async expectAccessDenied() {
    await expect(this.accessDenied).toBeVisible({ timeout: 10000 });
  }

  async expectLoginRequired() {
    await expect(this.loginRequired).toBeVisible({ timeout: 10000 });
  }

  async expectDashboardVisible() {
    // Wait for either overview tab or any admin content to be visible
    await expect(this.overviewTab.or(this.eventsTab).or(this.ticketsTab)).toBeVisible({ timeout: 15000 });
  }

  async expectLoading() {
    await expect(this.loadingSpinner).toBeVisible();
  }

  async waitForLoadingComplete() {
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 15000 });
  }

  async switchToTab(tab: 'overview' | 'events' | 'tickets' | 'users') {
    const tabs = {
      overview: this.overviewTab,
      events: this.eventsTab,
      tickets: this.ticketsTab,
      users: this.usersTab,
    };
    await tabs[tab].click();
  }

  async goBack() {
    await this.backButton.click();
  }

  async logout() {
    await this.logoutButton.click();
  }

  async expectTabActive(tab: 'overview' | 'events' | 'tickets' | 'users') {
    const tabTexts = {
      overview: 'Genel Bakış',
      events: 'Etkinlikler',
      tickets: 'Biletler',
      users: 'Kullanıcılar',
    };
    // Check URL or active state
    await expect(this.page).toHaveURL(new RegExp(`tab=${tab}`));
  }
}
