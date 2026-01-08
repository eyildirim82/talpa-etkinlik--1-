import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { AuthModal } from './AuthModal'
import * as authApi from '@/modules/auth'

// Mock dependencies
vi.mock('@/modules/auth', () => ({
  loginWithFormData: vi.fn(),
  signupWithFormData: vi.fn(),
}))

describe('AuthModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form by default', () => {
    const onClose = vi.fn()
    render(<AuthModal onClose={onClose} />)

    expect(screen.getByLabelText(/E-posta/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Şifre/i)).toBeInTheDocument()
    expect(screen.getByText(/Giriş Yap/i)).toBeInTheDocument()
  })

  it('should switch to signup tab', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AuthModal onClose={onClose} />)

    const signupTab = screen.getByText(/Kayıt Ol/i)
    await user.click(signupTab)

    expect(screen.getByLabelText(/Ad Soyad/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Sicil No/i)).toBeInTheDocument()
  })

  it('should call login API on login form submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    vi.mocked(authApi.loginWithFormData).mockResolvedValue({
      success: true,
      message: 'Giriş başarılı',
    })

    render(<AuthModal onClose={onClose} />)

    const emailInput = screen.getByLabelText(/E-posta/i)
    const passwordInput = screen.getByLabelText(/Şifre/i)
    const submitButton = screen.getByText(/Giriş Yap/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(authApi.loginWithFormData).toHaveBeenCalled()
    })
  })

  it('should show error message on login failure', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    vi.mocked(authApi.loginWithFormData).mockResolvedValue({
      success: false,
      message: 'Giriş başarısız',
    })

    render(<AuthModal onClose={onClose} />)

    const emailInput = screen.getByLabelText(/E-posta/i)
    const passwordInput = screen.getByLabelText(/Şifre/i)
    const submitButton = screen.getByText(/Giriş Yap/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Giriş başarısız')).toBeInTheDocument()
    })
  })

  it('should call signup API on signup form submit', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    vi.mocked(authApi.signupWithFormData).mockResolvedValue({
      success: true,
      message: 'Kayıt başarılı',
    })

    render(<AuthModal onClose={onClose} />)

    // Switch to signup tab
    const signupTab = screen.getByText(/Kayıt Ol/i)
    await user.click(signupTab)

    const fullNameInput = screen.getByLabelText(/Ad Soyad/i)
    const emailInput = screen.getByLabelText(/E-posta/i)
    const passwordInput = screen.getByLabelText(/Şifre/i)
    const sicilInput = screen.getByLabelText(/Sicil No/i)
    const submitButton = screen.getByText(/Kayıt Ol/i)

    await user.type(fullNameInput, 'Test User')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.type(sicilInput, 'TALPA-001')
    await user.click(submitButton)

    await waitFor(() => {
      expect(authApi.signupWithFormData).toHaveBeenCalled()
    })
  })

  it('should close modal on close button click', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<AuthModal onClose={onClose} />)

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalled()
  })
})

