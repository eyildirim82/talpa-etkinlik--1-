import { Page } from '@playwright/test';

// ============================================
// Type Definitions
// ============================================

export interface MockUser {
  id: string;
  email: string;
  full_name: string;
  is_admin?: boolean;
}

export interface MockEvent {
  id: number;
  title: string;
  status: string;
  price: number;
  quota_asil: number;
  quota_yedek: number;
  remaining_stock: number;
  event_date?: string;
  location?: string;
  description?: string;
}

export interface MockBooking {
  id: number;
  event_id: number;
  user_id: string;
  queue_status: 'ASIL' | 'YEDEK';
  payment_status: 'WAITING' | 'PAID' | 'CANCELLED';
}

// ============================================
// Test Data Factories
// ============================================

export const createMockUser = (overrides?: Partial<MockUser>): MockUser => ({
  id: 'user-123',
  email: 'test@example.com',
  full_name: 'Test User',
  is_admin: false,
  ...overrides,
});

export const createMockAdminUser = (overrides?: Partial<MockUser>): MockUser => ({
  id: 'admin-123',
  email: 'admin@example.com',
  full_name: 'Admin User',
  is_admin: true,
  ...overrides,
});

export const createMockEvent = (overrides?: Partial<MockEvent>): MockEvent => ({
  id: 1,
  title: 'Test Event',
  status: 'ACTIVE',
  price: 100,
  quota_asil: 100,
  quota_yedek: 50,
  remaining_stock: 150,
  event_date: '2025-12-31T20:00:00',
  location: 'Test Venue',
  description: 'Test event description',
  ...overrides,
});

// ============================================
// Authentication Mocks
// ============================================

export async function mockAuthenticatedUser(page: Page, user: MockUser) {
  // Mock user endpoint
  await page.route('**/auth/v1/user', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        user_metadata: { full_name: user.full_name },
        app_metadata: {},
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
      }),
    });
  });

  // Mock profiles endpoint
  await page.route('**/rest/v1/profiles*', async route => {
    const url = route.request().url();
    
    // Handle different query patterns
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_admin: user.is_admin ?? false,
        role: user.is_admin ? 'admin' : 'member',
        talpa_sicil_no: 'TALPA-001',
        phone: '+905551234567',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });
  });
}

export async function mockUnauthenticatedUser(page: Page) {
  await page.route('**/auth/v1/user', async route => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'unauthorized',
        message: 'Not authenticated',
      }),
    });
  });
}

export async function mockLoginSuccess(page: Page, user: MockUser) {
  await page.route('**/auth/v1/token?grant_type=password', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: 'fake-access-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'fake-refresh-token',
        user: {
          id: user.id,
          aud: 'authenticated',
          role: 'authenticated',
          email: user.email,
          user_metadata: { full_name: user.full_name },
        },
      }),
    });
  });
}

export async function mockLoginFailure(page: Page, errorMessage: string = 'Invalid login credentials') {
  await page.route('**/auth/v1/token?grant_type=password', async route => {
    await route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'invalid_grant',
        error_description: errorMessage,
      }),
    });
  });
}

export async function mockLogout(page: Page) {
  await page.route('**/auth/v1/logout', async route => {
    await route.fulfill({ status: 204 });
  });
}

// ============================================
// Event Mocks
// ============================================

export async function mockActiveEvent(page: Page, event: MockEvent) {
  await page.route('**/rest/v1/active_event_view*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: event.id,
        title: event.title,
        description: event.description || 'Event description',
        status: event.status,
        price: event.price,
        currency: 'TRY',
        quota_asil: event.quota_asil,
        quota_yedek: event.quota_yedek,
        total_quota: event.quota_asil + event.quota_yedek,
        remaining_stock: event.remaining_stock,
        event_date: event.event_date || '2025-12-31T20:00:00',
        location: event.location || 'Test Venue',
        banner_image: 'https://placehold.co/600x400',
        is_active: true,
      }),
    });
  });
}

export async function mockNoActiveEvent(page: Page) {
  await page.route('**/rest/v1/active_event_view*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: 'null',
    });
  });
}

export async function mockSoldOutEvent(page: Page, event?: Partial<MockEvent>) {
  const soldOutEvent = createMockEvent({
    ...event,
    remaining_stock: 0,
  });
  await mockActiveEvent(page, soldOutEvent);
}

// ============================================
// Booking Mocks
// ============================================

export async function mockBookingsCount(page: Page, count: number = 0) {
  await page.route('**/rest/v1/bookings?*count=exact*', async route => {
    await route.fulfill({
      status: 200,
      headers: { 'content-range': `0-${count}/${count}` },
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

export async function mockJoinEventSuccess(page: Page, queue: 'ASIL' | 'YEDEK' = 'ASIL') {
  await page.route('**/rpc/join_event', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        queue,
        message: queue === 'ASIL' 
          ? 'Başvurunuz başarıyla alındı!' 
          : 'Yedek listeye eklendiniz.',
      }),
    });
  });
}

export async function mockJoinEventError(page: Page, message: string) {
  await page.route('**/rpc/join_event', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        message,
      }),
    });
  });
}

export async function mockDuplicateBooking(page: Page) {
  await mockJoinEventError(page, 'Zaten kaydınız var');
}

export async function mockQuotaFull(page: Page) {
  await mockJoinEventError(page, 'Kontenjan doldu');
}

// ============================================
// Admin Mocks
// ============================================

export async function mockAdminBookingsList(page: Page, bookings: MockBooking[] = []) {
  await page.route('**/rest/v1/bookings*', async route => {
    const url = route.request().url();
    
    // If it's a count query
    if (url.includes('count=exact')) {
      await route.fulfill({
        status: 200,
        headers: { 'content-range': `0-${bookings.length}/${bookings.length}` },
        contentType: 'application/json',
        body: JSON.stringify(bookings),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(bookings),
      });
    }
  });
}

export async function mockAdminEventsList(page: Page, events: MockEvent[] = []) {
  await page.route('**/rest/v1/events*', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(events),
    });
  });
}

// ============================================
// Utility Functions
// ============================================

export async function clearAllMocks(page: Page) {
  await page.unroute('**/*');
}

export async function setupBasicMocks(page: Page, options: {
  authenticated?: boolean;
  user?: MockUser;
  event?: MockEvent | null;
}) {
  const { authenticated = false, user, event } = options;

  if (authenticated && user) {
    await mockAuthenticatedUser(page, user);
  } else {
    await mockUnauthenticatedUser(page);
  }

  if (event === null) {
    await mockNoActiveEvent(page);
  } else if (event) {
    await mockActiveEvent(page, event);
  } else {
    await mockActiveEvent(page, createMockEvent());
  }

  await mockBookingsCount(page);
}
