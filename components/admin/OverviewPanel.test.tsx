import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import { OverviewPanel } from './OverviewPanel'
import { useAdminStats, useAdminTickets } from '@/modules/admin'

// Mock dependencies
vi.mock('@/modules/admin', () => ({
  useAdminStats: vi.fn(),
  useAdminTickets: vi.fn(),
}))

describe('OverviewPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display loading state when stats are loading', () => {
    vi.mocked(useAdminStats).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    render(<OverviewPanel />)

    // Check for loading spinner
    expect(screen.getByRole('status') || document.querySelector('.animate-spin')).toBeTruthy()
  })

  it('should display statistics when data is available', () => {
    const mockStats = {
      total_events: 5,
      active_events: 2,
      total_bookings: 150,
      total_users: 200,
      total_revenue: 75000,
      paid_bookings: 100,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    expect(screen.getByText(/5/i)).toBeInTheDocument()
    expect(screen.getByText(/2/i)).toBeInTheDocument()
    expect(screen.getByText(/150/i)).toBeInTheDocument()
    expect(screen.getByText(/200/i)).toBeInTheDocument()
  })

  it('should display total events count', () => {
    const mockStats = {
      total_events: 10,
      active_events: 3,
      total_bookings: 0,
      total_users: 0,
      total_revenue: 0,
      paid_bookings: 0,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('should display active events count', () => {
    const mockStats = {
      total_events: 10,
      active_events: 3,
      total_bookings: 0,
      total_users: 0,
      total_revenue: 0,
      paid_bookings: 0,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should display total bookings count', () => {
    const mockStats = {
      total_events: 0,
      active_events: 0,
      total_bookings: 250,
      total_users: 0,
      total_revenue: 0,
      paid_bookings: 0,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    expect(screen.getByText('250')).toBeInTheDocument()
  })

  it('should display total users count', () => {
    const mockStats = {
      total_events: 0,
      active_events: 0,
      total_bookings: 0,
      total_users: 500,
      total_revenue: 0,
      paid_bookings: 0,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    expect(screen.getByText('500')).toBeInTheDocument()
  })

  it('should display revenue formatted correctly', () => {
    const mockStats = {
      total_events: 0,
      active_events: 0,
      total_bookings: 0,
      total_users: 0,
      total_revenue: 125000.50,
      paid_bookings: 0,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    expect(screen.getByText(/125\.000/i)).toBeInTheDocument()
  })

  it('should display paid bookings count', () => {
    const mockStats = {
      total_events: 0,
      active_events: 0,
      total_bookings: 100,
      total_users: 0,
      total_revenue: 0,
      paid_bookings: 75,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    expect(screen.getByText('75')).toBeInTheDocument()
  })

  it('should display all stat card titles', () => {
    const mockStats = {
      total_events: 5,
      active_events: 2,
      total_bookings: 150,
      total_users: 200,
      total_revenue: 75000,
      paid_bookings: 100,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    expect(screen.getByText(/Toplam Etkinlik/i)).toBeInTheDocument()
    expect(screen.getByText(/Aktif Etkinlik/i)).toBeInTheDocument()
    expect(screen.getByText(/Toplam Başvuru/i)).toBeInTheDocument()
    expect(screen.getByText(/Toplam Kullanıcı/i)).toBeInTheDocument()
  })

  it('should handle zero values correctly', () => {
    const mockStats = {
      total_events: 0,
      active_events: 0,
      total_bookings: 0,
      total_users: 0,
      total_revenue: 0,
      paid_bookings: 0,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    // Should display 0 values
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThan(0)
  })

  it('should handle missing stats gracefully', () => {
    vi.mocked(useAdminStats).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    // Should not crash, may show default values or empty state
    expect(screen.getByText(/Genel Bakış/i)).toBeInTheDocument()
  })

  it('should display dashboard header', () => {
    const mockStats = {
      total_events: 5,
      active_events: 2,
      total_bookings: 150,
      total_users: 200,
      total_revenue: 75000,
      paid_bookings: 100,
    }

    vi.mocked(useAdminStats).mockReturnValue({
      data: mockStats,
      isLoading: false,
    } as any)

    render(<OverviewPanel />)

    expect(screen.getByText(/Genel Bakış/i)).toBeInTheDocument()
  })
})

