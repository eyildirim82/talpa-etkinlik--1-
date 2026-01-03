import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import { EventGrid } from './EventGrid'
import { createMockActiveEvent } from '@/shared/test-utils/test-data'

// Mock EventCard component
vi.mock('@/modules/event', () => ({
  EventCard: ({ event, isFeatured }: { event: any; isFeatured?: boolean }) => (
    <div data-testid={`event-card-${event.id}`} data-featured={isFeatured}>
      {event.title}
    </div>
  ),
}))

describe('EventGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display empty state when no events', () => {
    render(<EventGrid events={[]} />)

    expect(screen.getByText(/Henüz etkinlik bulunmamaktadır/i)).toBeInTheDocument()
  })

  it('should display empty state when events is null', () => {
    render(<EventGrid events={null as any} />)

    expect(screen.getByText(/Henüz etkinlik bulunmamaktadır/i)).toBeInTheDocument()
  })

  it('should display active event as featured', () => {
    const activeEvent = createMockActiveEvent({
      id: '1',
      title: 'Aktif Etkinlik',
      remaining_stock: 10,
    })

    render(<EventGrid events={[activeEvent]} />)

    expect(screen.getByText('Aktif Etkinlik')).toBeInTheDocument()
    expect(screen.getByText(/Aktif Etkinlik/i)).toBeInTheDocument()
    const eventCard = screen.getByTestId('event-card-1')
    expect(eventCard).toHaveAttribute('data-featured', 'true')
  })

  it('should display "Aktif Etkinlik" heading when active event exists', () => {
    const activeEvent = createMockActiveEvent({
      id: '1',
      remaining_stock: 5,
    })

    render(<EventGrid events={[activeEvent]} />)

    expect(screen.getByText('Aktif Etkinlik')).toBeInTheDocument()
  })

  it('should display past events section when past events exist', () => {
    const pastEvent = createMockActiveEvent({
      id: '2',
      title: 'Geçmiş Etkinlik',
      remaining_stock: 0,
    })

    render(<EventGrid events={[pastEvent]} />)

    expect(screen.getByText('Geçmiş Etkinlikler')).toBeInTheDocument()
    expect(screen.getByText('Geçmiş Etkinlik')).toBeInTheDocument()
    const eventCard = screen.getByTestId('event-card-2')
    expect(eventCard).toHaveAttribute('data-featured', 'false')
  })

  it('should display both active and past events', () => {
    const activeEvent = createMockActiveEvent({
      id: '1',
      title: 'Aktif Etkinlik',
      remaining_stock: 10,
    })
    const pastEvent1 = createMockActiveEvent({
      id: '2',
      title: 'Geçmiş Etkinlik 1',
      remaining_stock: 0,
    })
    const pastEvent2 = createMockActiveEvent({
      id: '3',
      title: 'Geçmiş Etkinlik 2',
      remaining_stock: 0,
    })

    render(<EventGrid events={[activeEvent, pastEvent1, pastEvent2]} />)

    expect(screen.getByText('Aktif Etkinlik')).toBeInTheDocument()
    expect(screen.getByText('Geçmiş Etkinlikler')).toBeInTheDocument()
    expect(screen.getByText('Geçmiş Etkinlik 1')).toBeInTheDocument()
    expect(screen.getByText('Geçmiş Etkinlik 2')).toBeInTheDocument()
  })

  it('should not display past events section when no past events', () => {
    const activeEvent = createMockActiveEvent({
      id: '1',
      remaining_stock: 10,
    })

    render(<EventGrid events={[activeEvent]} />)

    expect(screen.queryByText('Geçmiş Etkinlikler')).not.toBeInTheDocument()
  })

  it('should not display active event section when no active event', () => {
    const pastEvent = createMockActiveEvent({
      id: '1',
      remaining_stock: 0,
    })

    render(<EventGrid events={[pastEvent]} />)

    expect(screen.queryByText('Aktif Etkinlik')).not.toBeInTheDocument()
    expect(screen.getByText('Geçmiş Etkinlikler')).toBeInTheDocument()
  })

  it('should handle multiple past events', () => {
    const pastEvents = [
      createMockActiveEvent({ id: '1', title: 'Etkinlik 1', remaining_stock: 0 }),
      createMockActiveEvent({ id: '2', title: 'Etkinlik 2', remaining_stock: 0 }),
      createMockActiveEvent({ id: '3', title: 'Etkinlik 3', remaining_stock: 0 }),
    ]

    render(<EventGrid events={pastEvents} />)

    expect(screen.getByText('Etkinlik 1')).toBeInTheDocument()
    expect(screen.getByText('Etkinlik 2')).toBeInTheDocument()
    expect(screen.getByText('Etkinlik 3')).toBeInTheDocument()
  })

  it('should prioritize first active event when multiple active events exist', () => {
    const activeEvent1 = createMockActiveEvent({
      id: '1',
      title: 'İlk Aktif Etkinlik',
      remaining_stock: 5,
    })
    const activeEvent2 = createMockActiveEvent({
      id: '2',
      title: 'İkinci Aktif Etkinlik',
      remaining_stock: 3,
    })

    render(<EventGrid events={[activeEvent1, activeEvent2]} />)

    // Should display first active event as featured
    expect(screen.getByText('İlk Aktif Etkinlik')).toBeInTheDocument()
    expect(screen.getByText(/Aktif Etkinlik/i)).toBeInTheDocument()
  })
})

