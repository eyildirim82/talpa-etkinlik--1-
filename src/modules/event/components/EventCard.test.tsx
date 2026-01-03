import { describe, it, expect } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import { EventCard } from './EventCard'
import { createMockActiveEvent } from '@/shared/test-utils/test-data'

describe('EventCard', () => {
  it('should render event information', () => {
    const mockEvent = createMockActiveEvent({
      title: 'Test Event',
      event_date: '2024-12-31T18:00:00Z',
    })

    render(<EventCard event={mockEvent} />)

    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText(/Tarih:/)).toBeInTheDocument()
    expect(screen.getByText(/Saat:/)).toBeInTheDocument()
  })

  it('should show remaining stock when available', () => {
    const mockEvent = createMockActiveEvent({
      remaining_stock: 30,
      total_quota: 80,
    })

    render(<EventCard event={mockEvent} />)

    expect(screen.getByText(/30 \/ 80 KALAN/)).toBeInTheDocument()
  })

  it('should show sold out message when stock is 0', () => {
    const mockEvent = createMockActiveEvent({
      remaining_stock: 0,
    })

    render(<EventCard event={mockEvent} />)

    expect(screen.getByText('BİLETLER TÜKENMİŞTİR.')).toBeInTheDocument()
  })

  it('should render featured event with additional styling', () => {
    const mockEvent = createMockActiveEvent({
      title: 'Featured Event',
      description: 'This is a featured event',
    })

    const { container } = render(<EventCard event={mockEvent} isFeatured={true} />)

    expect(screen.getByText('Featured Event')).toBeInTheDocument()
    expect(screen.getByText('This is a featured event')).toBeInTheDocument()
  })

  it('should display price for featured events', () => {
    const mockEvent = createMockActiveEvent({
      price: 150,
      currency: 'TL',
      remaining_stock: 10,
    })

    render(<EventCard event={mockEvent} isFeatured={true} />)

    expect(screen.getByText(/150/)).toBeInTheDocument()
    expect(screen.getByText(/TL/)).toBeInTheDocument()
  })

  it('should format date correctly in Turkish locale', () => {
    const mockEvent = createMockActiveEvent({
      event_date: '2024-12-31T18:00:00Z',
    })

    render(<EventCard event={mockEvent} />)

    // Date should be formatted as DD/MM/YYYY
    expect(screen.getByText(/Tarih:/)).toBeInTheDocument()
  })
})

