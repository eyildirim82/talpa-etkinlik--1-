import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { BookingModal } from './BookingModal'
import { useApp } from '../contexts/AppContext'
import { useJoinEvent } from '@/modules/booking'
import { createMockProfile } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('../contexts/AppContext', () => ({
  useApp: vi.fn(),
}))

vi.mock('@/modules/booking', () => ({
  useJoinEvent: vi.fn(),
}))

describe('BookingModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  const defaultProps = {
    eventId: 1,
    eventPrice: 500,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal with header and close button', () => {
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    expect(screen.getByText('Başvuru Onayı')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('should display user information when user is logged in', () => {
    const mockUser = createMockProfile({ full_name: 'Ahmet Yılmaz' })
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    expect(screen.getByText(/Sayın Ahmet Yılmaz/i)).toBeInTheDocument()
  })

  it('should display warning when user is not logged in', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    expect(screen.getByText(/Giriş yapmamış görünüyorsunuz/i)).toBeInTheDocument()
  })

  it('should display KVKK and payment consent checkboxes', () => {
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    expect(screen.getByText(/KVKK Aydınlatma Metni/i)).toBeInTheDocument()
    expect(screen.getByText(/Mesafeli Satış Sözleşmesi/i)).toBeInTheDocument()
    expect(screen.getByText(/500 ₺/i)).toBeInTheDocument()
  })

  it('should disable submit button when checkboxes are not checked', () => {
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i })
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when both checkboxes are checked', async () => {
    const user = userEvent.setup()
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    const kvkkCheckbox = screen.getByLabelText(/KVKK Aydınlatma Metni/i)
    const paymentCheckbox = screen.getByLabelText(/Mesafeli Satış Sözleşmesi/i)

    await user.click(kvkkCheckbox)
    await user.click(paymentCheckbox)

    const submitButton = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('should show error message when submitting without checkboxes', async () => {
    const user = userEvent.setup()
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    // Try to submit without checking boxes
    const kvkkCheckbox = screen.getByLabelText(/KVKK Aydınlatma Metni/i)
    await user.click(kvkkCheckbox)
    // Don't check payment checkbox

    const submitButton = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/KVKK ve ödeme onaylarını vermelisiniz/i)).toBeInTheDocument()
    })
  })

  it('should show error message when user is not logged in and tries to submit', async () => {
    const user = userEvent.setup()
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    const kvkkCheckbox = screen.getByLabelText(/KVKK Aydınlatma Metni/i)
    const paymentCheckbox = screen.getByLabelText(/Mesafeli Satış Sözleşmesi/i)

    await user.click(kvkkCheckbox)
    await user.click(paymentCheckbox)

    const submitButton = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/İşlem için giriş yapmalısınız/i)).toBeInTheDocument()
    })
  })

  it('should call onSuccess and onClose when form submission is successful', async () => {
    const user = userEvent.setup()
    const mockUser = createMockProfile()
    const mockMutateAsync = vi.fn().mockResolvedValue({
      success: true,
      queue: 'ASIL' as const,
      message: 'Başvuru başarılı',
    })

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    const kvkkCheckbox = screen.getByLabelText(/KVKK Aydınlatma Metni/i)
    const paymentCheckbox = screen.getByLabelText(/Mesafeli Satış Sözleşmesi/i)

    await user.click(kvkkCheckbox)
    await user.click(paymentCheckbox)

    const submitButton = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        eventId: 1,
        consentKvkk: true,
        consentPayment: true,
      })
      expect(mockOnSuccess).toHaveBeenCalledWith('ASIL')
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should show error message when form submission fails', async () => {
    const user = userEvent.setup()
    const mockUser = createMockProfile()
    const mockMutateAsync = vi.fn().mockResolvedValue({
      success: false,
      message: 'Kontenjan dolmuştur',
    })

    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    const kvkkCheckbox = screen.getByLabelText(/KVKK Aydınlatma Metni/i)
    const paymentCheckbox = screen.getByLabelText(/Mesafeli Satış Sözleşmesi/i)

    await user.click(kvkkCheckbox)
    await user.click(paymentCheckbox)

    const submitButton = screen.getByRole('button', { name: /Onaylıyorum ve Katıl/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Kontenjan dolmuştur')).toBeInTheDocument()
    })

    expect(mockOnSuccess).not.toHaveBeenCalled()
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should show loading state when mutation is pending', () => {
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    } as any)

    render(<BookingModal {...defaultProps} />)

    expect(screen.getByText(/İşleniyor/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /İşleniyor/i })).toBeDisabled()
  })

  it('should disable close button when mutation is pending', () => {
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    } as any)

    render(<BookingModal {...defaultProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    expect(closeButton).toBeDisabled()
  })

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup()
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should close modal when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: /Vazgeç/i })
    await user.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should format price correctly', () => {
    const mockUser = createMockProfile()
    vi.mocked(useApp).mockReturnValue({
      user: mockUser,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    vi.mocked(useJoinEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<BookingModal {...defaultProps} eventPrice={1500.50} />)

    expect(screen.getByText(/1\.500,50 ₺/i)).toBeInTheDocument()
  })
})

