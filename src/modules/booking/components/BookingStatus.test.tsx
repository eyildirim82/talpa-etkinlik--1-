import { describe, it, expect } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import { BookingStatus } from './BookingStatus'
import { createMockBooking } from '@/shared/test-utils/test-data'

describe('BookingStatus', () => {
  it('should show loading state', () => {
    render(<BookingStatus booking={null} isLoading={true} />)

    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument()
  })

  it('should return null when booking is null and not loading', () => {
    const { container } = render(
      <BookingStatus booking={null} isLoading={false} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should display ASIL status correctly', () => {
    const mockBooking = createMockBooking({ queue_status: 'ASIL' })

    render(<BookingStatus booking={mockBooking} />)

    expect(screen.getByText(/KAYDINIZ ALINDI \(ASİL\)/)).toBeInTheDocument()
    expect(
      screen.getByText(/Ödeme onayından sonra biletiniz e-postanıza gelecektir/)
    ).toBeInTheDocument()
  })

  it('should display YEDEK status with queue position', () => {
    const mockBooking = createMockBooking({ queue_status: 'YEDEK' })

    render(<BookingStatus booking={mockBooking} queuePosition={5} />)

    expect(screen.getByText(/YEDEK LİSTEDESİNİZ/)).toBeInTheDocument()
    expect(screen.getByText(/SIRA: 5/)).toBeInTheDocument()
  })

  it('should display YEDEK status without queue position', () => {
    const mockBooking = createMockBooking({ queue_status: 'YEDEK' })

    render(<BookingStatus booking={mockBooking} />)

    expect(screen.getByText(/YEDEK LİSTEDESİNİZ/)).toBeInTheDocument()
  })

  it('should display IPTAL status', () => {
    const mockBooking = createMockBooking({ queue_status: 'IPTAL' })

    render(<BookingStatus booking={mockBooking} />)

    expect(screen.getByText('BAŞVURUNUZ İPTAL EDİLDİ')).toBeInTheDocument()
  })

  it('should show payment status when PAID', () => {
    const mockBooking = createMockBooking({
      queue_status: 'ASIL',
      payment_status: 'PAID',
    })

    render(<BookingStatus booking={mockBooking} />)

    expect(screen.getByText('✓ Ödeme Alındı')).toBeInTheDocument()
  })

  it('should not show payment status when WAITING', () => {
    const mockBooking = createMockBooking({
      queue_status: 'ASIL',
      payment_status: 'WAITING',
    })

    render(<BookingStatus booking={mockBooking} />)

    expect(screen.queryByText('✓ Ödeme Alındı')).not.toBeInTheDocument()
  })
})

