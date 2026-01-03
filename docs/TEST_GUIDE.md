# Test Yazma Rehberi

## Yeni Test Dosyası Oluşturma

### 1. API Testi Örneği

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { myFunction } from './my.api'
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'
import { createMockUser } from '@/shared/test-utils/test-data'

// Mock infrastructure
vi.mock('@/shared/infrastructure/supabase', () => ({
  createBrowserClient: vi.fn(),
}))

describe('My API', () => {
  let mockSupabase: any

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    const { createBrowserClient } = await import('@/shared/infrastructure/supabase')
    vi.mocked(createBrowserClient).mockReturnValue(mockSupabase as any)
  })

  it('should do something', async () => {
    // Test implementation
  })
})
```

### 2. Hook Testi Örneği

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { useMyHook } from './useMyHook'
import * as myApi from '../api/my.api'

vi.mock('../api/my.api', () => ({
  myFunction: vi.fn(),
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useMyHook', () => {
  it('should work correctly', async () => {
    vi.mocked(myApi.myFunction).mockResolvedValue({ success: true })

    const { result } = renderHook(() => useMyHook(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })
})
```

### 3. Component Testi Örneği

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@/shared/test-utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent prop="value" />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })

  it('should handle user interactions', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)

    const button = screen.getByRole('button')
    await user.click(button)

    // Assertions
  })
})
```

## Mock Kullanımı

### Supabase Mock

```typescript
// Setup mock client
const mockSupabase = createMockSupabaseClient()
setupMockAuth(mockSupabase, mockUser)

// Setup query responses
setupMockQuery(mockSupabase, 'events', mockEvents, { count: 10 })

// Setup RPC responses
mockSupabase.rpc.mockResolvedValue({
  data: { success: true },
  error: null,
})
```

### React Query Mock

```typescript
// Mock hook
vi.mock('@/modules/auth', () => ({
  useSession: vi.fn(() => ({
    user: mockUser,
    isLoading: false,
  })),
}))
```

## Test Senaryoları

### Başarılı Senaryo
```typescript
it('should succeed when conditions are met', async () => {
  // Setup success scenario
  // Execute
  // Assert success
})
```

### Hata Senaryosu
```typescript
it('should handle errors gracefully', async () => {
  // Setup error scenario
  // Execute
  // Assert error handling
})
```

### Edge Cases
```typescript
it('should handle edge cases', async () => {
  // Setup edge case
  // Execute
  // Assert edge case handling
})
```

## Yaygın Hatalar ve Çözümler

### 1. Mock'lar Çalışmıyor
- `vi.mock()` çağrısının dosyanın en üstünde olduğundan emin olun
- Mock'ları `beforeEach` içinde resetleyin

### 2. Async Test Hataları
- `waitFor()` kullanarak async işlemleri bekleyin
- `await` kullanmayı unutmayın

### 3. React Query Hook Testleri
- `QueryClientProvider` wrapper kullanın
- `retry: false` ayarını yapın

## Örnekler

Daha fazla örnek için mevcut test dosyalarına bakın:
- `src/modules/auth/api/auth.api.test.ts`
- `src/modules/booking/hooks/useBooking.test.ts`
- `src/modules/event/components/EventCard.test.tsx`

