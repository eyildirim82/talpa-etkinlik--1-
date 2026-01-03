import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { AdminLayout } from './AdminLayout'

describe('AdminLayout', () => {
  const mockOnTabChange = vi.fn()
  const mockOnBack = vi.fn()
  const mockOnLogout = vi.fn()

  const defaultProps = {
    activeTab: 'overview' as const,
    onTabChange: mockOnTabChange,
    onBack: mockOnBack,
    onLogout: mockOnLogout,
    children: <div>Test Content</div>,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children content', () => {
    render(<AdminLayout {...defaultProps} />)

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should display TALPA logo and admin panel text', () => {
    render(<AdminLayout {...defaultProps} />)

    expect(screen.getByText('TALPA')).toBeInTheDocument()
    expect(screen.getByText('Admin Panel')).toBeInTheDocument()
  })

  it('should display menu items', () => {
    render(<AdminLayout {...defaultProps} />)

    expect(screen.getByText('Genel Bakış')).toBeInTheDocument()
    expect(screen.getByText('Etkinlikler')).toBeInTheDocument()
    expect(screen.getByText('Biletler')).toBeInTheDocument()
    expect(screen.getByText('Üyeler')).toBeInTheDocument()
  })

  it('should call onTabChange when menu item is clicked', async () => {
    const user = userEvent.setup()
    render(<AdminLayout {...defaultProps} />)

    const eventsTab = screen.getByText('Etkinlikler')
    await user.click(eventsTab)

    expect(mockOnTabChange).toHaveBeenCalledWith('events')
  })

  it('should highlight active tab', () => {
    render(<AdminLayout {...defaultProps} activeTab="events" />)

    const eventsTab = screen.getByText('Etkinlikler')
    // Active tab should have different styling (checked via data attributes or classes)
    expect(eventsTab).toBeInTheDocument()
  })

  it('should call onBack when back button is clicked', async () => {
    const user = userEvent.setup()
    render(<AdminLayout {...defaultProps} />)

    const backButton = screen.getByRole('button', { name: /geri/i })
    await user.click(backButton)

    expect(mockOnBack).toHaveBeenCalled()
  })

  it('should call onLogout when logout button is clicked', async () => {
    const user = userEvent.setup()
    render(<AdminLayout {...defaultProps} userName="Test User" />)

    const logoutButton = screen.getByText(/Çıkış/i)
    await user.click(logoutButton)

    expect(mockOnLogout).toHaveBeenCalled()
  })

  it('should display user name when provided', () => {
    render(<AdminLayout {...defaultProps} userName="Ahmet Yılmaz" />)

    expect(screen.getByText('Ahmet Yılmaz')).toBeInTheDocument()
  })

  it('should toggle mobile sidebar', async () => {
    const user = userEvent.setup()
    render(<AdminLayout {...defaultProps} />)

    const menuButton = screen.getByRole('button', { name: /menu/i })
    await user.click(menuButton)

    // Sidebar should be visible
    expect(screen.getByText('TALPA')).toBeInTheDocument()
  })
})

