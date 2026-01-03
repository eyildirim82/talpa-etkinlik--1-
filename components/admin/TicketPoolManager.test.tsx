import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { TicketPoolManager } from './TicketPoolManager'
import { useQuery } from '@tanstack/react-query'
import { getTicketPool, getTicketStats } from '@/modules/ticket'
import { processTicketZip } from '@/modules/file-processing'
import { createBrowserClient } from '@/shared/infrastructure/supabase'

// Mock dependencies
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
}))

vi.mock('@/modules/ticket', () => ({
  getTicketPool: vi.fn(),
  getTicketStats: vi.fn(),
}))

vi.mock('@/modules/file-processing', () => ({
  processTicketZip: vi.fn(),
}))

vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

// Mock window methods
beforeEach(() => {
  global.alert = vi.fn()
})

describe('TicketPoolManager', () => {
  const defaultProps = {
    eventId: 1,
  }

  const mockSupabaseClient = {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
      })),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabaseClient as any)
  })

  it('should display loading state when tickets are loading', () => {
    vi.mocked(useQuery).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as any).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    expect(screen.getByText(/Yükleniyor/i)).toBeInTheDocument()
  })

  it('should display ticket pool statistics', () => {
    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 100,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 50,
        assigned: 50,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    expect(screen.getByText(/50/i)).toBeInTheDocument()
  })

  it('should display tickets list', () => {
    const mockTickets = [
      {
        id: '1',
        file_path: 'tickets/A1.pdf',
        is_assigned: false,
        assigned_to: null,
      },
      {
        id: '2',
        file_path: 'tickets/A2.pdf',
        is_assigned: true,
        assigned_to: 'user-1',
      },
    ]

    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: mockTickets,
        count: 2,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 1,
        assigned: 1,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    expect(screen.getByText('tickets/A1.pdf')).toBeInTheDocument()
    expect(screen.getByText('tickets/A2.pdf')).toBeInTheDocument()
  })

  it('should display empty state when no tickets', () => {
    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 0,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 0,
        assigned: 0,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    expect(screen.getByText(/Henüz bilet yüklenmemiş/i)).toBeInTheDocument()
  })

  it('should display upload section', () => {
    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 0,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 0,
        assigned: 0,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    expect(screen.getByText(/ZIP dosyası yükleyin/i)).toBeInTheDocument()
  })

  it('should show error when non-ZIP file is selected', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()

    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 0,
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 0,
        assigned: 0,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    const fileInput = screen.getByLabelText(/ZIP dosyası yükleyin/i) as HTMLInputElement
    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/Lütfen ZIP dosyası seçin/i)).toBeInTheDocument()
    })
  })

  it('should upload and process ZIP file successfully', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()
    const mockUpload = vi.fn().mockResolvedValue({ error: null })

    mockSupabaseClient.storage.from = vi.fn(() => ({
      upload: mockUpload,
    })) as any

    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 0,
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 0,
        assigned: 0,
      },
      isLoading: false,
    } as any)

    vi.mocked(processTicketZip).mockResolvedValue({
      success: true,
      count: 10,
      message: 'Başarılı',
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    const fileInput = screen.getByLabelText(/ZIP dosyası yükleyin/i) as HTMLInputElement
    const file = new File(['content'], 'test.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalled()
      expect(processTicketZip).toHaveBeenCalled()
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('should show error when upload fails', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()
    const mockUpload = vi.fn().mockResolvedValue({
      error: { message: 'Upload failed' },
    })

    mockSupabaseClient.storage.from = vi.fn(() => ({
      upload: mockUpload,
    })) as any

    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 0,
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 0,
        assigned: 0,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    const fileInput = screen.getByLabelText(/ZIP dosyası yükleyin/i) as HTMLInputElement
    const file = new File(['content'], 'test.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/Upload failed/i)).toBeInTheDocument()
    })
  })

  it('should show error when processing fails', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()
    const mockUpload = vi.fn().mockResolvedValue({ error: null })

    mockSupabaseClient.storage.from = vi.fn(() => ({
      upload: mockUpload,
    })) as any

    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 0,
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 0,
        assigned: 0,
      },
      isLoading: false,
    } as any)

    vi.mocked(processTicketZip).mockResolvedValue({
      success: false,
      message: 'Processing failed',
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    const fileInput = screen.getByLabelText(/ZIP dosyası yükleyin/i) as HTMLInputElement
    const file = new File(['content'], 'test.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/Processing failed/i)).toBeInTheDocument()
    })
  })

  it('should display pagination when total pages > 1', () => {
    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 50, // More than pageSize (20)
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 50,
        assigned: 0,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    expect(screen.getByText(/Sayfa 1 \/ 3/)).toBeInTheDocument()
  })

  it('should navigate to next page', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()

    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 50,
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 50,
        assigned: 0,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    const nextButton = screen.getByText(/Sonraki/i)
    await user.click(nextButton)

    await waitFor(() => {
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  it('should show loading state during file upload', async () => {
    const user = userEvent.setup()
    const mockRefetch = vi.fn()
    const mockUpload = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    mockSupabaseClient.storage.from = vi.fn(() => ({
      upload: mockUpload,
    })) as any

    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 0,
      },
      isLoading: false,
      refetch: mockRefetch,
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 0,
        assigned: 0,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    const fileInput = screen.getByLabelText(/ZIP dosyası yükleyin/i) as HTMLInputElement
    const file = new File(['content'], 'test.zip', { type: 'application/zip' })
    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/ZIP dosyası yükleniyor/i)).toBeInTheDocument()
    })
  })

  it('should display assigned and unassigned ticket counts', () => {
    vi.mocked(useQuery).mockReturnValueOnce({
      data: {
        data: [],
        count: 100,
      },
      isLoading: false,
      refetch: vi.fn(),
    } as any).mockReturnValueOnce({
      data: {
        unassigned: 60,
        assigned: 40,
      },
      isLoading: false,
    } as any)

    render(<TicketPoolManager {...defaultProps} />)

    expect(screen.getByText(/60/i)).toBeInTheDocument()
    expect(screen.getByText(/40/i)).toBeInTheDocument()
  })
})

