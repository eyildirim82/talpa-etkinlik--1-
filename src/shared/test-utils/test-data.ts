import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/modules/profile'
import type { Event, ActiveEvent } from '@/modules/event'
import type { Booking } from '@/modules/booking'
import type { AdminEvent, AdminUser, AdminTicket } from '@/modules/admin'

/**
 * Test Data Factory Functions
 * Creates mock data for testing with optional overrides
 */

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: { full_name: 'Test User' },
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
} as User)

export const createMockProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'user-1',
  email: 'test@example.com',
  full_name: 'Test User',
  talpa_sicil_no: 'TALPA-001',
  phone: '+905551234567',
  role: 'member',
  is_admin: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  tckn: '12345678901', // Default value required
  is_verified: true,
  ...overrides,
} as unknown as Profile)

export const createMockEvent = (overrides?: Partial<Event>): Event => ({
  id: 1,
  title: 'Test Event',
  description: 'Test event description',
  banner_image: 'https://example.com/banner.jpg',
  event_date: '2024-12-31T18:00:00Z',
  location_url: 'https://example.com/location',
  price: 100,
  quota_asil: 50,
  quota_yedek: 30,
  cut_off_date: '2024-12-30T18:00:00Z',
  status: 'ACTIVE',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  remaining_stock: 50,
  ...overrides,
} as unknown as Event)

export const createMockActiveEvent = (overrides?: Partial<ActiveEvent>): ActiveEvent => ({
  id: 1, // Changed to number
  title: 'Test Event',
  description: 'Test event description',
  banner_image: 'https://example.com/banner.jpg',
  event_date: '2024-12-31T18:00:00Z',
  location_url: 'https://example.com/location',
  price: 100,
  quota_asil: 50,
  quota_yedek: 30,
  cut_off_date: '2024-12-30T18:00:00Z',
  status: 'ACTIVE',
  image_url: 'https://example.com/banner.jpg',
  location: 'https://example.com/location',
  currency: 'TL',
  total_quota: 80,
  is_active: true,
  remaining_stock: 30,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  asil_count: 0,
  yedek_count: 0,
  paid_count: 0,
  ...overrides,
} as unknown as ActiveEvent)

// Extend Booking type for tests that include profiles
export const createMockBooking = (overrides?: Partial<Booking & { profiles?: Profile }>): Booking & { profiles?: Profile } => ({
  id: 1,
  event_id: 1,
  user_id: 'user-1',
  booking_date: '2024-01-15T10:00:00Z',
  queue_status: 'ASIL', // Type checker will accept string literal if it matches Enum value
  payment_status: 'WAITING',
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z',
  consent_kvkk: true,
  consent_payment: true,
  profiles: createMockProfile(),
  ...overrides,
} as unknown as Booking & { profiles?: Profile })

export const createMockAdminEvent = (overrides?: Partial<AdminEvent>): AdminEvent => ({
  id: 1,
  title: 'Test Event',
  description: 'Test event description',
  banner_image: 'https://example.com/banner.jpg',
  event_date: '2024-12-31T18:00:00Z',
  location_url: 'https://example.com/location',
  price: 100,
  quota_asil: 50,
  quota_yedek: 30,
  cut_off_date: '2024-12-30T18:00:00Z',
  status: 'ACTIVE',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  asil_count: 45,
  yedek_count: 20,
  paid_count: 40,
  ...overrides,
})

export const createMockAdminUser = (overrides?: Partial<AdminUser>): AdminUser => ({
  id: 'user-1',
  full_name: 'Test User',
  talpa_sicil_no: 'TALPA-001',
  phone: '+905551234567',
  role: 'member',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

export const createMockAdminTicket = (overrides?: Partial<AdminTicket>): AdminTicket => ({
  id: 'ticket-1',
  event_id: '1',
  user_id: 'user-1',
  qr_code: 'QR-CODE-123',
  status: 'pending',
  purchase_date: '2024-01-15T10:00:00Z',
  seat_number: null,
  gate: null,
  event_title: 'Test Event',
  user_name: 'Test User',
  ...overrides,
})

