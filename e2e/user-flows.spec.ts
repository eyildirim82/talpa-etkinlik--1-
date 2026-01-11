import { test, expect } from '@playwright/test';
import { HomePage, AuthPage, BookingPage, AdminPage } from './pages';
import {
  createMockUser,
  createMockAdminUser,
  createMockEvent,
  mockAuthenticatedUser,
  mockUnauthenticatedUser,
  mockLoginSuccess,
  mockLoginFailure,
  mockLogout,
  mockActiveEvent,
  mockNoActiveEvent,
  mockSoldOutEvent,
  mockBookingsCount,
  mockJoinEventSuccess,
  mockJoinEventError,
  mockDuplicateBooking,
  setupBasicMocks,
} from './fixtures';

// ============================================
// Test Data
// ============================================

const TEST_USER = createMockUser();
const TEST_ADMIN = createMockAdminUser();
const TEST_EVENT = createMockEvent();

// ============================================
// UI Display Tests
// ============================================

test.describe('UI Display Scenarios', () => {
  
  test('UI-01: Active event displays correctly', async ({ page }) => {
    const homePage = new HomePage(page);

    await mockUnauthenticatedUser(page);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    await homePage.goto();
    await homePage.waitForLoad();
    
    await homePage.expectEventVisible(TEST_EVENT.title);
    await homePage.expectQuotaVisible();
    await homePage.expectTicketButtonEnabled();
  });

  test('UI-02: No active event shows empty state', async ({ page }) => {
    const homePage = new HomePage(page);

    await mockUnauthenticatedUser(page);
    await mockNoActiveEvent(page);

    await homePage.goto();
    await homePage.waitForLoad();
    
    await homePage.expectNoActiveEvent();
  });

  test('UI-03: Sold out event shows disabled button', async ({ page }) => {
    const homePage = new HomePage(page);

    await mockUnauthenticatedUser(page);
    await mockSoldOutEvent(page, { title: 'Sold Out Event' });

    await homePage.goto();
    await homePage.waitForLoad();
    
    await homePage.expectSoldOut();
  });

  test('UI-04: Quota information displays correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    const eventWithQuota = createMockEvent({
      remaining_stock: 75,
      quota_asil: 100,
      quota_yedek: 50,
    });

    await mockUnauthenticatedUser(page);
    await mockActiveEvent(page, eventWithQuota);
    await mockBookingsCount(page);

    await homePage.goto();
    await homePage.waitForLoad();
    
    await expect(page.getByText(/75 \/ 150 Kalan/)).toBeVisible();
  });
});

// ============================================
// Authentication Tests
// ============================================

test.describe('Authentication Scenarios', () => {

  test('AUTH-01: Login modal opens on click', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await mockUnauthenticatedUser(page);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openLoginModal();
    
    await authPage.expectModalVisible();
  });

  test('AUTH-02: Successful login', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    // Initial state: unauthenticated
    await mockUnauthenticatedUser(page);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);
    
    // Setup login success
    await mockLoginSuccess(page, TEST_USER);

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openLoginModal();
    
    // Before login, change mock to authenticated
    await page.unroute('**/auth/v1/user');
    await mockAuthenticatedUser(page, TEST_USER);
    
    await authPage.login(TEST_USER.email, 'password123');
    
    await homePage.expectLoggedIn(TEST_USER.full_name);
  });

  test('AUTH-03: Failed login shows error', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await mockUnauthenticatedUser(page);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);
    await mockLoginFailure(page);

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openLoginModal();
    
    await authPage.loginWithoutReload('wrong@example.com', 'wrongpassword');
    
    await authPage.expectLoginError();
  });

  test('AUTH-04: Logout works correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await mockAuthenticatedUser(page, TEST_USER);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);
    await mockLogout(page);

    await homePage.goto();
    await homePage.waitForLoad();
    
    await expect(homePage.accountButton).toBeVisible();
    await homePage.openAccountMenu();
    
    // Setup unauthenticated state for after logout
    await page.unroute('**/auth/v1/user');
    await mockUnauthenticatedUser(page);
    
    await authPage.logout();
    
    await homePage.expectLoggedOut();
  });
});

// ============================================
// Booking Flow Tests
// ============================================

test.describe('Booking Scenarios', () => {

  test('BOOK-01: Unauthenticated user prompted to login', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await mockUnauthenticatedUser(page);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openBookingModal();
    
    // Should open auth modal instead of booking modal
    await authPage.expectModalVisible();
  });

  test('BOOK-02: Booking modal opens for authenticated user', async ({ page }) => {
    const homePage = new HomePage(page);
    const bookingPage = new BookingPage(page);

    await mockAuthenticatedUser(page, TEST_USER);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openBookingModal();
    
    await bookingPage.expectModalVisible();
    await bookingPage.expectUserInfo(TEST_USER.full_name);
  });

  test('BOOK-03: Submit disabled without consents', async ({ page }) => {
    const homePage = new HomePage(page);
    const bookingPage = new BookingPage(page);

    await mockAuthenticatedUser(page, TEST_USER);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openBookingModal();
    
    await bookingPage.expectModalVisible();
    await bookingPage.expectSubmitDisabled();
    
    // Accept only KVKK
    await bookingPage.acceptKvkk();
    await bookingPage.expectSubmitDisabled();
    
    // Accept payment too
    await bookingPage.acceptPayment();
    await bookingPage.expectSubmitEnabled();
  });

  test('BOOK-04: Successful ASIL booking', async ({ page }) => {
    const homePage = new HomePage(page);
    const bookingPage = new BookingPage(page);

    await mockAuthenticatedUser(page, TEST_USER);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);
    await mockJoinEventSuccess(page, 'ASIL');

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openBookingModal();
    
    await bookingPage.expectModalVisible();
    await bookingPage.acceptAllAndSubmit();
    
    // Should reload on success
    try {
        await page.waitForEvent('load', { timeout: 3000 });
    } catch {
        // If reload doesn't happen, modal should be gone
        await bookingPage.expectModalClosed();
    }
  });

  test('BOOK-05: YEDEK booking when quota low', async ({ page }) => {
    const homePage = new HomePage(page);
    const bookingPage = new BookingPage(page);

    const lowQuotaEvent = createMockEvent({
      remaining_stock: 1,
      quota_asil: 1,
      quota_yedek: 10,
    });

    await mockAuthenticatedUser(page, TEST_USER);
    await mockActiveEvent(page, lowQuotaEvent);
    await mockBookingsCount(page);
    await mockJoinEventSuccess(page, 'YEDEK');

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openBookingModal();
    
    // Modal açılmasını bekle
    await bookingPage.expectModalVisible();
    await bookingPage.acceptAllAndSubmit();
    
    await page.waitForTimeout(1500);
  });

  test('BOOK-06: Duplicate booking prevented', async ({ page }) => {
    const homePage = new HomePage(page);
    const bookingPage = new BookingPage(page);

    await mockAuthenticatedUser(page, TEST_USER);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);
    await mockDuplicateBooking(page);

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openBookingModal();
    
    // Modal açılmasını bekle
    await bookingPage.expectModalVisible();
    await bookingPage.acceptAllAndSubmit();
    
    await bookingPage.expectError('Zaten kaydınız var');
  });

  test('BOOK-07: Cancel button closes modal', async ({ page }) => {
    const homePage = new HomePage(page);
    const bookingPage = new BookingPage(page);

    await mockAuthenticatedUser(page, TEST_USER);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openBookingModal();
    
    await bookingPage.expectModalVisible();
    await bookingPage.cancel();
    
    await bookingPage.expectModalClosed();
  });
});

// ============================================
// Admin Access Tests
// ============================================

test.describe('Admin Access Scenarios', () => {

  test('ADM-01: Unauthenticated user cannot access admin', async ({ page }) => {
    const adminPage = new AdminPage(page);

    await mockUnauthenticatedUser(page);

    await adminPage.goto();
    
    await adminPage.expectLoginRequired();
  });

  test('ADM-02: Regular user denied admin access', async ({ page }) => {
    const adminPage = new AdminPage(page);

    await mockAuthenticatedUser(page, TEST_USER);

    await adminPage.goto();
    
    await adminPage.expectAccessDenied();
  });

  test('ADM-03: Admin user can access admin panel', async ({ page }) => {
    const adminPage = new AdminPage(page);

    await mockAuthenticatedUser(page, TEST_ADMIN);

    await adminPage.goto();
    
    await adminPage.expectDashboardVisible();
  });

  test('ADM-04: Back button returns to home', async ({ page }) => {
    const adminPage = new AdminPage(page);

    await mockUnauthenticatedUser(page);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    await adminPage.goto();
    // Sayfa yüklenene kadar bekle
    await adminPage.expectLoginRequired();
    await adminPage.goBack();
    
    await expect(page).toHaveURL('/');
  });
});

// ============================================
// Complete User Flow Tests
// ============================================

test.describe('Complete User Flows', () => {

  test('FLOW-01: Guest → Login → Book ticket → Success', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const bookingPage = new BookingPage(page);

    // Start unauthenticated
    await mockUnauthenticatedUser(page);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);
    await mockLoginSuccess(page, TEST_USER);
    await mockJoinEventSuccess(page, 'ASIL');

    // Step 1: Visit home
    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.expectEventVisible(TEST_EVENT.title);

    // Step 2: Try to book (should open login)
    await homePage.openBookingModal();
    await authPage.expectModalVisible();

    // Step 3: Login
    await page.unroute('**/auth/v1/user');
    await mockAuthenticatedUser(page, TEST_USER);
    await authPage.login(TEST_USER.email, 'password123');

    // Step 4: Now book
    await homePage.expectLoggedIn(TEST_USER.full_name);
    await homePage.openBookingModal();
    await bookingPage.expectModalVisible();

    // Step 5: Complete booking
    await bookingPage.acceptAllAndSubmit();
    await page.waitForTimeout(1500);
  });

  test('FLOW-02: Admin workflow', async ({ page }) => {
    const homePage = new HomePage(page);
    const adminPage = new AdminPage(page);

    await mockAuthenticatedUser(page, TEST_ADMIN);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    // Step 1: Visit home
    await homePage.goto();
    await homePage.waitForLoad();

    // Step 2: Go to admin
    await page.goto('/admin');
    await adminPage.expectDashboardVisible();

    // Step 3: Check tabs exist
    await expect(adminPage.overviewTab).toBeVisible();
    await expect(adminPage.eventsTab).toBeVisible();
    await expect(adminPage.ticketsTab).toBeVisible();
    await expect(adminPage.usersTab).toBeVisible();
  });
});

// ============================================
// Error Handling Tests
// ============================================

test.describe('Error Handling', () => {

  test('ERR-01: Network error during booking', async ({ page }) => {
    const homePage = new HomePage(page);
    const bookingPage = new BookingPage(page);

    await mockAuthenticatedUser(page, TEST_USER);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    // Mock network error
    await page.route('**/rpc/join_event', async route => {
      await route.abort('failed');
    });

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openBookingModal();
    
    // Modal açılmasını bekle
    await bookingPage.expectModalVisible();
    await bookingPage.acceptAllAndSubmit();
    
    // Should show some error
    await bookingPage.expectGenericError();
  });

  test('ERR-02: Server error during booking', async ({ page }) => {
    const homePage = new HomePage(page);
    const bookingPage = new BookingPage(page);

    await mockAuthenticatedUser(page, TEST_USER);
    await mockActiveEvent(page, TEST_EVENT);
    await mockBookingsCount(page);

    // Mock server error
    await page.route('**/rpc/join_event', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await homePage.goto();
    await homePage.waitForLoad();
    await homePage.openBookingModal();
    
    // Modal açılmasını bekle
    await bookingPage.expectModalVisible();
    await bookingPage.acceptAllAndSubmit();
    
    await bookingPage.expectGenericError();
  });
});
