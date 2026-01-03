import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { EventsPanel } from './EventsPanel'
import {
  useAdminEvents,
  useSetActiveEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from '@/modules/admin'
import { createMockAdminEvent } from '@/shared/test-utils/test-data'

// Mock dependencies
vi.mock('@/modules/admin', () => ({
  useAdminEvents: vi.fn(),
  useSetActiveEvent: vi.fn(),
  useCreateEvent: vi.fn(),
  useUpdateEvent: vi.fn(),
  useDeleteEvent: vi.fn(),
}))

// Mock supabase storage
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(() => ({
          data: { publicUrl: 'https://example.com/image.jpg' },
        })),
      })),
    },
  },
}))

describe('EventsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.alert = vi.fn()
  })

  it('should display loading state when events are loading', () => {
    vi.mocked(useAdminEvents).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    // Check for loading spinner
    expect(screen.getByRole('status') || screen.getByText(/Yükleniyor/i)).toBeTruthy()
  })

  it('should display empty state when no events', () => {
    vi.mocked(useAdminEvents).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    expect(screen.getByText(/Henüz etkinlik yok/i)).toBeInTheDocument()
  })

  it('should display events list when events are available', () => {
    const mockEvent = createMockAdminEvent({
      id: 1,
      title: 'Test Etkinliği',
      status: 'ACTIVE',
    })

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [mockEvent],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    expect(screen.getByText('Test Etkinliği')).toBeInTheDocument()
  })

  it('should open create modal when "Yeni Etkinlik" button is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    const createButton = screen.getByText('Yeni Etkinlik')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Yeni Etkinlik')).toBeInTheDocument()
    })
  })

  it('should open edit modal when edit button is clicked', async () => {
    const user = userEvent.setup()
    const mockEvent = createMockAdminEvent({
      id: 1,
      title: 'Test Etkinliği',
    })

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [mockEvent],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    // Find edit button by title attribute or icon
    const editButtons = screen.getAllByTitle('Düzenle')
    await user.click(editButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Etkinliği Düzenle')).toBeInTheDocument()
    })
  })

  it('should call setActiveEvent when activate button is clicked', async () => {
    const user = userEvent.setup()
    const mockSetActive = vi.fn().mockResolvedValue(undefined)
    const mockEvent = createMockAdminEvent({
      id: 1,
      title: 'Test Etkinliği',
      status: 'DRAFT',
    })

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [mockEvent],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: mockSetActive,
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    const activateButtons = screen.getAllByTitle('Aktif Yap')
    await user.click(activateButtons[0])

    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith(1)
    })
  })

  it('should open delete confirmation when delete button is clicked', async () => {
    const user = userEvent.setup()
    const mockEvent = createMockAdminEvent({
      id: 1,
      title: 'Test Etkinliği',
    })

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [mockEvent],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    const deleteButtons = screen.getAllByTitle('Sil')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Etkinliği Sil')).toBeInTheDocument()
    })
  })

  it('should call deleteEvent when delete is confirmed', async () => {
    const user = userEvent.setup()
    const mockDelete = vi.fn().mockResolvedValue(undefined)
    const mockEvent = createMockAdminEvent({
      id: 1,
      title: 'Test Etkinliği',
    })

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [mockEvent],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: mockDelete,
      isPending: false,
    } as any)

    render(<EventsPanel />)

    const deleteButtons = screen.getAllByTitle('Sil')
    await user.click(deleteButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Etkinliği Sil')).toBeInTheDocument()
    })

    const confirmButton = screen.getByText('Sil')
    await user.click(confirmButton)

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith(1)
    })
  })

  it('should display event details correctly', () => {
    const mockEvent = createMockAdminEvent({
      id: 1,
      title: 'Test Etkinliği',
      price: 1500,
      quota_asil: 50,
      quota_yedek: 30,
      asil_count: 45,
      yedek_count: 20,
    })

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [mockEvent],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    expect(screen.getByText('Test Etkinliği')).toBeInTheDocument()
    expect(screen.getByText(/1\.500 ₺/)).toBeInTheDocument()
    expect(screen.getByText(/Asil: 45 \/ 50/)).toBeInTheDocument()
    expect(screen.getByText(/Yedek: 20 \/ 30/)).toBeInTheDocument()
  })

  it('should display ACTIVE status badge for active events', () => {
    const mockEvent = createMockAdminEvent({
      id: 1,
      status: 'ACTIVE',
    })

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [mockEvent],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    expect(screen.getByText('Aktif')).toBeInTheDocument()
  })

  it('should display DRAFT status badge for draft events', () => {
    const mockEvent = createMockAdminEvent({
      id: 1,
      status: 'DRAFT',
    })

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [mockEvent],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    expect(screen.getByText('Taslak')).toBeInTheDocument()
  })

  it('should call createEvent when form is submitted for new event', async () => {
    const user = userEvent.setup()
    const mockCreate = vi.fn().mockResolvedValue(undefined)

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: mockCreate,
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    const createButton = screen.getByText('Yeni Etkinlik')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/Etkinlik Adı/i)).toBeInTheDocument()
    })

    const titleInput = screen.getByLabelText(/Etkinlik Adı/i)
    await user.type(titleInput, 'Yeni Etkinlik')

    const submitButton = screen.getByText('Oluştur')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled()
    })
  })

  it('should close modal when cancel button is clicked', async () => {
    const user = userEvent.setup()

    vi.mocked(useAdminEvents).mockReturnValue({
      data: [],
      isLoading: false,
    } as any)

    vi.mocked(useSetActiveEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useCreateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useUpdateEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    vi.mocked(useDeleteEvent).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any)

    render(<EventsPanel />)

    const createButton = screen.getByText('Yeni Etkinlik')
    await user.click(createButton)

    await waitFor(() => {
      expect(screen.getByText('Yeni Etkinlik')).toBeInTheDocument()
    })

    const cancelButton = screen.getByText('İptal')
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText('Yeni Etkinlik')).not.toBeInTheDocument()
    })
  })
})

