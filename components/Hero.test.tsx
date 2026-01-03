import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import { Hero } from './Hero'
import { useApp } from '../contexts/AppContext'
import { createMockActiveEvent } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('../contexts/AppContext', () => ({
  useApp: vi.fn(),
}))

describe('Hero', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading skeleton when isLoading is true', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    const { container } = render(<Hero isLoading={true} />)

    // Check for skeleton elements
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('should return null when event is not available', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    const { container } = render(<Hero isLoading={false} />)

    expect(container.firstChild).toBeNull()
  })

  it('should render event title when event is available', () => {
    const mockEvent = createMockActiveEvent({ title: 'Test Etkinliği' })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<Hero isLoading={false} />)

    expect(screen.getByText('Test Etkinliği')).toBeInTheDocument()
  })

  it('should display "BAŞVURUYA AÇIK" status when remaining stock is greater than 20', () => {
    const mockEvent = createMockActiveEvent({ remaining_stock: 50 })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<Hero isLoading={false} />)

    expect(screen.getByText('BAŞVURUYA AÇIK')).toBeInTheDocument()
  })

  it('should display "DOLMAK ÜZERE" status when remaining stock is between 1 and 20', () => {
    const mockEvent = createMockActiveEvent({ remaining_stock: 15 })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<Hero isLoading={false} />)

    expect(screen.getByText('DOLMAK ÜZERE')).toBeInTheDocument()
  })

  it('should display "KONTENJAN DOLU" status when remaining stock is 0', () => {
    const mockEvent = createMockActiveEvent({ remaining_stock: 0 })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<Hero isLoading={false} />)

    expect(screen.getByText('KONTENJAN DOLU')).toBeInTheDocument()
  })

  it('should display "KONTENJAN DOLU" status when remaining stock is negative', () => {
    const mockEvent = createMockActiveEvent({ remaining_stock: -5 })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<Hero isLoading={false} />)

    expect(screen.getByText('KONTENJAN DOLU')).toBeInTheDocument()
  })

  it('should display event image when image_url is available', () => {
    const mockEvent = createMockActiveEvent({
      image_url: 'https://example.com/image.jpg',
    })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<Hero isLoading={false} />)

    const image = screen.getByAltText(mockEvent.title)
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('should display "TALPA ÖZEL ETKİNLİK" badge', () => {
    const mockEvent = createMockActiveEvent()
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<Hero isLoading={false} />)

    expect(screen.getByText('TALPA ÖZEL ETKİNLİK')).toBeInTheDocument()
  })

  it('should handle missing image_url gracefully', () => {
    const mockEvent = createMockActiveEvent({
      image_url: '',
    })
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<Hero isLoading={false} />)

    const image = screen.getByAltText(mockEvent.title)
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', '')
  })

  it('should use default isLoading value when not provided', () => {
    const mockEvent = createMockActiveEvent()
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<Hero />)

    expect(screen.getByText(mockEvent.title)).toBeInTheDocument()
  })
})

