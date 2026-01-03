# Test Dokümantasyonu

## Genel Bakış

Bu proje Vitest ve React Testing Library kullanarak modüler mimariye uygun testler içermektedir.

## Test Yapısı

```
src/
├── modules/
│   ├── auth/
│   │   ├── api/
│   │   │   └── auth.api.test.ts
│   │   └── hooks/
│   │       ├── useAuth.test.ts
│   │       └── useSession.test.ts
│   └── ...
├── shared/
│   └── test-utils/
│       ├── test-utils.tsx
│       ├── supabase-mock.ts
│       └── test-data.ts
└── __tests__/
    └── integration/
        ├── auth-profile.test.ts
        └── ...
```

## Test Kategorileri

### 1. Unit Tests
- **API Fonksiyonları**: `src/modules/*/api/*.test.ts`
- **Hook'lar**: `src/modules/*/hooks/*.test.ts`
- **Utils**: `src/modules/*/utils/*.test.ts`

### 2. Component Tests
- **React Component'leri**: `src/modules/*/components/*.test.tsx`
- **Ana Component'ler**: `components/*.test.tsx`

### 3. Integration Tests
- **Modüller arası etkileşimler**: `src/__tests__/integration/*.test.ts`

## Test Çalıştırma

### Tüm Testleri Çalıştırma
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### UI Mode
```bash
npm run test:ui
```

### Coverage Raporu
```bash
npm run test:coverage
```

## Test Utilities

### Test Data Factory
```typescript
import { createMockUser, createMockEvent } from '@/shared/test-utils/test-data'

const user = createMockUser({ email: 'custom@example.com' })
const event = createMockEvent({ title: 'Custom Event' })
```

### Supabase Mock
```typescript
import { createMockSupabaseClient, setupMockAuth } from '@/shared/test-utils/supabase-mock'

const mockSupabase = createMockSupabaseClient()
setupMockAuth(mockSupabase, mockUser)
```

### React Query Wrapper
```typescript
import { render } from '@/shared/test-utils/test-utils'

// Otomatik olarak QueryClientProvider ile sarar
render(<MyComponent />)
```

## Best Practices

1. **Mock Stratejisi**: Supabase ve diğer external dependencies mock'lanmalı
2. **Test Data**: Factory pattern kullanarak test data oluşturun
3. **Isolation**: Her test bağımsız çalışmalı
4. **Coverage**: Kritik path'ler %100 coverage'a sahip olmalı
5. **Naming**: Test dosyaları `*.test.ts` veya `*.test.tsx` formatında

## Coverage Hedefleri

- **Minimum**: %70
- **Kritik Path'ler**: %100
- **Modüller**: Her modül için minimum %70

## CI/CD

Testler GitHub Actions ile otomatik çalıştırılır:
- Push ve PR'lerde testler çalışır
- Coverage raporları oluşturulur
- Coverage threshold kontrolü yapılır

