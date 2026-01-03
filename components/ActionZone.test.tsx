import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ActionZone } from './ActionZone'
import { useApp } from '../contexts/AppContext'
import { useBooking, useBookingQueuePosition } from '@/modules/booking'
import { createMockActiveEvent, createMockProfile } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('../contexts/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('@/modules/booking', () => ({
  useBooking: vi.fn(),
  useBookingQueuePosition: vi.fn(),
  BookingModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="booking-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
  BookingStatus: ({ booking }: { booking: any }) => (
    <div data-testid="booking-status">
      {booking ? `Status: ${booking.queue_status}` : 'No booking'}
    </div>
  ),
}))

vi.mock('./AuthModal', () => ({
  AuthModal: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="auth-modal">
      <button onClick={onClose}>Close</button>
    </div>
  ),
}))

describe('ActionZone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render nothing when event is not available', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    const { container } = render(<ActionZone />)

    expect(container.firstChild).toBeNull()
  })

  it('should show login button when user is not authenticated', () => {
    const mockEvent = createMockActiveEvent()

    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useBooking).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    vi.mocked(useBookingQueuePosition).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    render(<ActionZone />)

    expect(screen.getByText(/Giriş Yap/i)).toBeInTheDocument()
  })

  it('should show booking button when user is authenticated and no booking exists', () => {
    const mockEvent = createMockActiveEvent({ remaining_stock: 10 })
    const mockUser = createMockProfile()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useBooking).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    vi.mocked(useBookingQueuePosition).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    render(<ActionZone />)

    expect(screen.getByText(/Başvuru Yap/i)).toBeInTheDocument()
  })

  it('should show booking status when booking exists', () => {
    const mockEvent = createMockActiveEvent()
    const mockUser = createMockProfile()
    const mockBooking = {
      id: 1,
      queue_status: 'ASIL',
      payment_status: 'WAITING',
    }

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useBooking).mockReturnValue({
      data: mockBooking,
      isLoading: false,
    } as any)

    vi.mocked(useBookingQueuePosition).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    render(<ActionZone />)

    expect(screen.getByTestId('booking-status')).toBeInTheDocument()
    expect(screen.getByText(/Status: ASIL/)).toBeInTheDocument()
  })

  it('should show sold out message when stock is 0', () => {
    const mockEvent = createMockActiveEvent({ remaining_stock: 0 })
    const mockUser = createMockProfile()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useBooking).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    vi.mocked(useBookingQueuePosition).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    render(<ActionZone />)

    expect(screen.getByText(/BİLETLER TÜKENMİŞTİR/i)).toBeInTheDocument()
  })
})

