import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import { InfoCockpit } from './InfoCockpit'
import { useApp } from '../contexts/AppContext'
import { createMockActiveEvent } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('../contexts/AppContext', () => ({
  useApp: vi.fn(),
}))

describe('InfoCockpit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when event is not available', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    const { container } = render(<InfoCockpit />)

    expect(container.firstChild).toBeNull()
  })

  it('should display event date formatted correctly', () => {
    const mockEvent = createMockActiveEvent({
      event_date: '2024-12-31T18:00:00Z',
    })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    expect(screen.getByText(/31 Aralık/i)).toBeInTheDocument()
  })

  it('should display event time formatted correctly', () => {
    const mockEvent = createMockActiveEvent({
      event_date: '2024-12-31T18:30:00Z',
    })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    // Time format should be HH:MM
    expect(screen.getByText(/21:30/i)).toBeInTheDocument()
  })

  it('should display event location when available', () => {
    const mockEvent = createMockActiveEvent({
      location: 'Test Lokasyon',
    })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    expect(screen.getByText(/Test Lokasyon/i)).toBeInTheDocument()
  })

  it('should display location as link when location_url is available', () => {
    const mockEvent = createMockActiveEvent({
      location: 'Test Lokasyon',
      location_url: 'https://maps.google.com/test',
    } as any)
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    const locationLink = screen.getByRole('link')
    expect(locationLink).toHaveAttribute('href', 'https://maps.google.com/test')
    expect(locationLink).toHaveAttribute('target', '_blank')
  })

  it('should display duration', () => {
    const mockEvent = createMockActiveEvent()
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    expect(screen.getByText(/4 Saat/i)).toBeInTheDocument()
  })

  it('should display event price formatted correctly', () => {
    const mockEvent = createMockActiveEvent({
      price: 1500.50,
      currency: 'TL',
    })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    expect(screen.getByText(/1\.500,50 TL/i)).toBeInTheDocument()
  })

  it('should display event description when available', () => {
    const mockEvent = createMockActiveEvent({
      description: 'Bu bir test etkinliğidir',
    })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    expect(screen.getByText('Bu bir test etkinliğidir')).toBeInTheDocument()
  })

  it('should not display description section when description is not available', () => {
    const mockEvent = createMockActiveEvent({
      description: null,
    } as any)
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    // Description label should not be present
    expect(screen.queryByText(/Açıklama/i)).not.toBeInTheDocument()
  })

  it('should handle Google Maps URL and extract location name', () => {
    const mockEvent = createMockActiveEvent({
      location: 'https://www.google.com/maps/place/UFUK+HALISAHA+SPOR+SA%C4%9FL%C4%B1KT%C4%B1R',
      location_url: 'https://www.google.com/maps/place/UFUK+HALISAHA+SPOR+SA%C4%9FL%C4%B1KT%C4%B1R',
    } as any)
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    // Should extract and display location name from URL
    const locationLink = screen.getByRole('link')
    expect(locationLink).toBeInTheDocument()
  })

  it('should handle location URL with query parameter', () => {
    const mockEvent = createMockActiveEvent({
      location: 'https://www.google.com/maps/search/?api=1&query=Test+Location',
      location_url: 'https://www.google.com/maps/search/?api=1&query=Test+Location',
    } as any)
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    const locationLink = screen.getByRole('link')
    expect(locationLink).toHaveAttribute('href', 'https://www.google.com/maps/search/?api=1&query=Test+Location')
  })

  it('should truncate long location names', () => {
    const longLocation = 'A'.repeat(60)
    const mockEvent = createMockActiveEvent({
      location: longLocation,
    })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    // Location should be truncated to 50 characters + '...'
    const locationElement = screen.getByText(new RegExp(`^${'A'.repeat(47)}\\.\\.\\.$`))
    expect(locationElement).toBeInTheDocument()
  })

  it('should display all required labels', () => {
    const mockEvent = createMockActiveEvent()
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<InfoCockpit />)

    expect(screen.getByText('Tarih')).toBeInTheDocument()
    expect(screen.getByText('Saat')).toBeInTheDocument()
    expect(screen.getByText('Konum')).toBeInTheDocument()
    expect(screen.getByText('Süre')).toBeInTheDocument()
    expect(screen.getByText('Bilet Fiyatı')).toBeInTheDocument()
  })
})

