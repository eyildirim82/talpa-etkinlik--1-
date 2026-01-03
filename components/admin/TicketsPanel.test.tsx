import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import { TicketsPanel } from './TicketsPanel'
import { useActiveEvent } from '@/modules/event'
import { createMockActiveEvent } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('@/modules/event', () => ({
  useActiveEvent: vi.fn(),
}))

vi.mock('./BookingsTable', () => ({
  BookingsTable: ({ eventId }: { eventId: number }) => (
    <div data-testid="bookings-table">BookingsTable for event {eventId}</div>
  ),
}))

describe('TicketsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display loading state when event is loading', () => {
    vi.mocked(useActiveEvent).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    render(<TicketsPanel />)

    // Check for loading spinner
    expect(document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('should display empty state when no active event', () => {
    vi.mocked(useActiveEvent).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    render(<TicketsPanel />)

    expect(screen.getByText('Aktif Etkinlik Yok')).toBeInTheDocument()
    expect(screen.getByText(/Etkinlik Yönetimi menüsünden/i)).toBeInTheDocument()
  })

  it('should display BookingsTable when active event exists', () => {
    const mockEvent = createMockActiveEvent({
      id: 1,
      title: 'Test Etkinliği',
    })

    vi.mocked(useActiveEvent).mockReturnValue({
      data: mockEvent,
      isLoading: false,
    } as any)

    render(<TicketsPanel />)

    expect(screen.getByText('Başvurular')).toBeInTheDocument()
    expect(screen.getByText('Test Etkinliği')).toBeInTheDocument()
    expect(screen.getByTestId('bookings-table')).toBeInTheDocument()
  })

  it('should display event title in header', () => {
    const mockEvent = createMockActiveEvent({
      id: 1,
      title: 'Yılbaşı Galası',
    })

    vi.mocked(useActiveEvent).mockReturnValue({
      data: mockEvent,
      isLoading: false,
    } as any)

    render(<TicketsPanel />)

    expect(screen.getByText('Yılbaşı Galası')).toBeInTheDocument()
  })

  it('should handle numeric event ID', () => {
    const mockEvent = createMockActiveEvent({
      id: 123,
      title: 'Test Event',
    })

    vi.mocked(useActiveEvent).mockReturnValue({
      data: mockEvent,
      isLoading: false,
    } as any)

    render(<TicketsPanel />)

    expect(screen.getByTestId('bookings-table')).toBeInTheDocument()
  })

  it('should handle string event ID', () => {
    const mockEvent = createMockActiveEvent({
      id: 456,
      title: 'Test Event',
    })

    vi.mocked(useActiveEvent).mockReturnValue({
      data: mockEvent,
      isLoading: false,
    } as any)

    render(<TicketsPanel />)

    expect(screen.getByTestId('bookings-table')).toBeInTheDocument()
  })
})

