import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MemberImport } from './MemberImport'
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import * as XLSX from 'xlsx'

// Mock dependencies
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}))

// Mock window methods
beforeEach(() => {
  global.alert = vi.fn()
})

describe('MemberImport', () => {
  const mockSupabaseClient = {
    functions: {
      invoke: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabaseClient as any)
  })

  it('should render upload section', () => {
    render(<MemberImport />)

    expect(screen.getByText(/Excel dosyası seç/i)).toBeInTheDocument()
  })

  it('should parse Excel file correctly', async () => {
    const user = userEvent.setup()
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {},
    }
    const mockData = [
      {
        tckn: '12345678901',
        sicil_no: 'TALPA-001',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    ]

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData as any)

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    // Mock arrayBuffer
    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(XLSX.read).toHaveBeenCalled()
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })
  })

  it('should show error when file has no valid data', async () => {
    const user = userEvent.setup()
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {},
    }

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue([])

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/Dosyada geçerli veri bulunamadı/i)).toBeInTheDocument()
    })
  })

  it('should show error when file parsing fails', async () => {
    const user = userEvent.setup()

    vi.mocked(XLSX.read).mockImplementation(() => {
      throw new Error('Parse error')
    })

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText(/Dosya okunurken hata oluştu/i)).toBeInTheDocument()
    })
  })

  it('should call import function when import button is clicked', async () => {
    const user = userEvent.setup()
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {},
    }
    const mockData = [
      {
        tckn: '12345678901',
        sicil_no: 'TALPA-001',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    ]

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData as any)

    mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
      data: [{ email: 'test@example.com', status: 'success' }],
      error: null,
    })

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    const importButton = screen.getByText(/İçe Aktar/i)
    await user.click(importButton)

    await waitFor(() => {
      expect(mockSupabaseClient.functions.invoke).toHaveBeenCalledWith('import-users', {
        body: { users: mockData },
      })
    })
  })

  it('should display success status after successful import', async () => {
    const user = userEvent.setup()
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {},
    }
    const mockData = [
      {
        tckn: '12345678901',
        sicil_no: 'TALPA-001',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    ]

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData as any)

    mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
      data: [{ email: 'test@example.com', status: 'success' }],
      error: null,
    })

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    const importButton = screen.getByText(/İçe Aktar/i)
    await user.click(importButton)

    await waitFor(() => {
      expect(screen.getByText(/Kullanıcı oluşturuldu/i)).toBeInTheDocument()
    })
  })

  it('should display error status when import fails', async () => {
    const user = userEvent.setup()
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {},
    }
    const mockData = [
      {
        tckn: '12345678901',
        sicil_no: 'TALPA-001',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    ]

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData as any)

    mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
      data: [{ email: 'test@example.com', status: 'error', message: 'Import failed' }],
      error: null,
    })

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    const importButton = screen.getByText(/İçe Aktar/i)
    await user.click(importButton)

    await waitFor(() => {
      expect(screen.getByText(/Import failed/i)).toBeInTheDocument()
    })
  })

  it('should show error when import function call fails', async () => {
    const user = userEvent.setup()
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {},
    }
    const mockData = [
      {
        tckn: '12345678901',
        sicil_no: 'TALPA-001',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    ]

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData as any)

    mockSupabaseClient.functions.invoke = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Server error' },
    })

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    const importButton = screen.getByText(/İçe Aktar/i)
    await user.click(importButton)

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeInTheDocument()
    })
  })

  it('should handle multiple rows in Excel file', async () => {
    const user = userEvent.setup()
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {},
    }
    const mockData = [
      {
        tckn: '12345678901',
        sicil_no: 'TALPA-001',
        email: 'test1@example.com',
        full_name: 'Test User 1',
      },
      {
        tckn: '12345678902',
        sicil_no: 'TALPA-002',
        email: 'test2@example.com',
        full_name: 'Test User 2',
      },
    ]

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData as any)

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Test User 1')).toBeInTheDocument()
      expect(screen.getByText('Test User 2')).toBeInTheDocument()
    })
  })

  it('should filter out rows without email or tckn', async () => {
    const user = userEvent.setup()
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {},
    }
    const mockData = [
      {
        tckn: '12345678901',
        sicil_no: 'TALPA-001',
        email: 'test@example.com',
        full_name: 'Test User',
      },
      {
        tckn: '',
        sicil_no: 'TALPA-002',
        email: '',
        full_name: 'Invalid User',
      },
    ]

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData as any)

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
      expect(screen.queryByText('Invalid User')).not.toBeInTheDocument()
    })
  })

  it('should disable import button when no data', () => {
    render(<MemberImport />)

    const importButton = screen.getByText(/İçe Aktar/i)
    expect(importButton).toBeDisabled()
  })

  it('should show loading state during import', async () => {
    const user = userEvent.setup()
    const mockWorkbook = {
      SheetNames: ['Sheet1'],
      Sheets: {},
    }
    const mockData = [
      {
        tckn: '12345678901',
        sicil_no: 'TALPA-001',
        email: 'test@example.com',
        full_name: 'Test User',
      },
    ]

    vi.mocked(XLSX.read).mockReturnValue(mockWorkbook as any)
    vi.mocked(XLSX.utils.sheet_to_json).mockReturnValue(mockData as any)

    mockSupabaseClient.functions.invoke = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<MemberImport />)

    const fileInput = screen.getByLabelText(/Excel dosyası seç/i) as HTMLInputElement
    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    file.arrayBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8))

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    const importButton = screen.getByText(/İçe Aktar/i)
    await user.click(importButton)

    await waitFor(() => {
      expect(importButton).toBeDisabled()
    })
  })
})

