import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { BoardingPass } from './BoardingPass'
import { useApp } from '../contexts/AppContext'
import { createMockActiveEvent, createMockProfile } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('../contexts/AppContext', () => ({
  useApp: vi.fn(),
}))

// Mock window.print
global.window.print = vi.fn()

describe('BoardingPass', () => {
  const mockTicket = {
    id: 'ticket-1',
    qr_code: 'QR-CODE-123',
    seat_number: 'A12',
    gate: 'Ana Salon',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return null when ticket is not available', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    const { container } = render(<BoardingPass ticket={null as any} event={null as any} user={null as any} />)

    expect(container.firstChild).toBeNull()
  })

  it('should return null when user is not available', () => {
    const mockEvent = createMockActiveEvent()

    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    const { container } = render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={null as any} />)

    expect(container.firstChild).toBeNull()
  })

  it('should return null when event is not available', () => {
    const mockUser = createMockProfile()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    const { container } = render(<BoardingPass ticket={mockTicket as any} event={null as any} user={mockUser} />)

    expect(container.firstChild).toBeNull()
  })

  it('should display success message', () => {
    const mockUser = createMockProfile()
    const mockEvent = createMockActiveEvent()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={mockUser} />)

    expect(screen.getByText('İşlem Başarılı')).toBeInTheDocument()
    expect(screen.getByText('Biletiniz oluşturuldu.')).toBeInTheDocument()
  })

  it('should display event title', () => {
    const mockUser = createMockProfile()
    const mockEvent = createMockActiveEvent({ title: 'Test Etkinliği' })

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={mockUser} />)

    expect(screen.getByText('Test Etkinliği')).toBeInTheDocument()
  })

  it('should display event date and time formatted correctly', () => {
    const mockUser = createMockProfile()
    const mockEvent = createMockActiveEvent({
      event_date: '2024-12-31T18:30:00Z',
    })

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={mockUser} />)

    expect(screen.getByText(/31 Aralık/i)).toBeInTheDocument()
    expect(screen.getByText(/21:30/i)).toBeInTheDocument()
  })

  it('should display user full name', () => {
    const mockUser = createMockProfile({ full_name: 'Ahmet Yılmaz' })
    const mockEvent = createMockActiveEvent()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={mockUser} />)

    expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument()
  })

  it('should display seat number', () => {
    const mockUser = createMockProfile()
    const mockEvent = createMockActiveEvent()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={mockUser} />)

    expect(screen.getByText('A12')).toBeInTheDocument()
  })

  it('should display gate information', () => {
    const mockUser = createMockProfile()
    const mockEvent = createMockActiveEvent()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={mockUser} />)

    expect(screen.getByText('Ana Salon')).toBeInTheDocument()
  })

  it('should display default gate when gate is not provided', () => {
    const mockUser = createMockProfile()
    const mockEvent = createMockActiveEvent()
    const ticketWithoutGate = {
      ...mockTicket,
      gate: null,
    }

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={ticketWithoutGate as any} event={mockEvent} user={mockUser} />)

    expect(screen.getByText('Ana Salon')).toBeInTheDocument()
  })

  it('should display QR code', () => {
    const mockUser = createMockProfile()
    const mockEvent = createMockActiveEvent()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={mockUser} />)

    expect(screen.getByText('QR-CODE-123')).toBeInTheDocument()
  })

  it('should display QR code icon', () => {
    const mockUser = createMockProfile()
    const mockEvent = createMockActiveEvent()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={mockUser} />)

    // QrCode icon should be rendered
    const qrIcon = screen.getByRole('img', { hidden: true }) || document.querySelector('svg')
    expect(qrIcon).toBeTruthy()
  })

  it('should call window.print when download button is clicked', async () => {
    const user = userEvent.setup()
    const mockUser = createMockProfile()
    const mockEvent = createMockActiveEvent()

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={mockTicket as any} event={mockEvent} user={mockUser} />)

    const downloadButton = screen.getByText('Bileti İndir')
    await user.click(downloadButton)

    expect(global.window.print).toHaveBeenCalled()
  })

  it('should display all ticket information correctly', () => {
    const mockUser = createMockProfile({
      full_name: 'Mehmet Demir',
    })
    const mockEvent = createMockActiveEvent({
      title: 'Yılbaşı Galası',
      event_date: '2024-12-31T20:00:00Z',
    })
    const ticket = {
      id: 'ticket-2',
      qr_code: 'QR-456',
      seat_number: 'B5',
      gate: 'VIP Salon',
    }

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: mockEvent,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<BoardingPass ticket={ticket as any} event={mockEvent} user={mockUser} />)

    expect(screen.getByText('Yılbaşı Galası')).toBeInTheDocument()
    expect(screen.getByText('Mehmet Demir')).toBeInTheDocument()
    expect(screen.getByText('B5')).toBeInTheDocument()
    expect(screen.getByText('VIP Salon')).toBeInTheDocument()
    expect(screen.getByText('QR-456')).toBeInTheDocument()
  })
})

