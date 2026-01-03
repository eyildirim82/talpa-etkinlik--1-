import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { LoginModal } from './LoginModal'
import { useApp } from '../contexts/AppContext'

// Mock dependencies
vi.mock('../contexts/AppContext', () => ({
  useApp: vi.fn(),
}))

// Mock console.warn
const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('LoginModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    consoleWarnSpy.mockClear()
  })

  it('should render modal with header', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<LoginModal onClose={mockOnClose} />)

    expect(screen.getByText('Üye Girişi')).toBeInTheDocument()
  })

  it('should render member ID input', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<LoginModal onClose={mockOnClose} />)

    expect(screen.getByLabelText(/Üye Numarası/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/19842/i)).toBeInTheDocument()
  })

  it('should disable submit button when member ID is empty', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<LoginModal onClose={mockOnClose} />)

    const submitButton = screen.getByText('Devam Et')
    expect(submitButton).toBeDisabled()
  })

  it('should enable submit button when member ID is entered', async () => {
    const user = userEvent.setup()
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<LoginModal onClose={mockOnClose} />)

    const input = screen.getByLabelText(/Üye Numarası/i)
    await user.type(input, '19842')

    const submitButton = screen.getByText('Devam Et')
    expect(submitButton).not.toBeDisabled()
  })

  it('should disable submit button when loading', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: true,
      logout: vi.fn(),
    })

    render(<LoginModal onClose={mockOnClose} />)

    const submitButton = screen.getByText('Kontrol Ediliyor...')
    expect(submitButton).toBeDisabled()
  })

  it('should call onClose when form is submitted', async () => {
    const user = userEvent.setup()
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<LoginModal onClose={mockOnClose} />)

    const input = screen.getByLabelText(/Üye Numarası/i)
    await user.type(input, '19842')

    const submitButton = screen.getByText('Devam Et')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalledWith('Member ID login is deprecated. Please use AuthModal.')
    })
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<LoginModal onClose={mockOnClose} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should not submit when member ID is empty', async () => {
    const user = userEvent.setup()
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<LoginModal onClose={mockOnClose} />)

    const form = screen.getByRole('form')
    await user.click(form)

    // Should not call onClose
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('should display instruction text', () => {
    vi.mocked(useApp).mockReturnValue({
      user: null,
      event: null,
      isLoading: false,
      logout: vi.fn(),
    })

    render(<LoginModal onClose={mockOnClose} />)

    expect(screen.getByText(/Lütfen devam etmek için TALPA üye numaranızı/i)).toBeInTheDocument()
  })
})

