# Modüler Monolitik Mimariye Geçiş Rehberi

Bu dokümantasyon, TALPA Etkinlik Platformu'nu modüler monolitik mimariye dönüştürmek için adım adım uygulama rehberidir.

## İçindekiler

- [Hazırlık](#hazırlık)
- [Faz 1: Klasör Yapısını Oluşturma](#faz-1-klasör-yapısını-oluşturma)
- [Faz 2: Shared Infrastructure](#faz-2-shared-infrastructure)
- [Faz 3: Auth Modülü](#faz-3-auth-modülü)
- [Faz 4: Profile Modülü](#faz-4-profile-modülü)
- [Faz 5: Event Modülü](#faz-5-event-modülü)
- [Faz 6: Booking Modülü](#faz-6-booking-modülü)
- [Faz 7: Diğer Modüller](#faz-7-diğer-modüller)
- [Faz 8: Import'ları Güncelleme](#faz-8-importları-güncelleme)
- [Faz 9: Temizlik ve Test](#faz-9-temizlik-ve-test)
- [Sık Sorulan Sorular](#sık-sorulan-sorular)

---

## Hazırlık

### Gereksinimler

- Git branch oluştur: `git checkout -b refactor/modular-monolith`
- Mevcut kodun çalıştığından emin ol
- Test suite'i çalıştır: `npm test` (varsa)

### Önemli Notlar

⚠️ **Dikkat:** Bu refactoring büyük bir değişikliktir. Her fazı tamamladıktan sonra uygulamanın çalıştığından emin olun.

✅ **İyi Pratik:** Her modülü tamamladıktan sonra commit yapın:
```bash
git add .
git commit -m "refactor: create auth module"
```

---

## Faz 1: Klasör Yapısını Oluşturma

### Adım 1.1: Ana Klasörleri Oluştur

Proje kök dizininde şu klasörleri oluşturun:

```bash
mkdir -p src/modules
mkdir -p src/shared/infrastructure
mkdir -p src/shared/api
mkdir -p src/shared/hooks
mkdir -p src/shared/components
mkdir -p src/shared/types
mkdir -p src/shared/utils
mkdir -p src/shared/constants
```

### Adım 1.2: Modül Klasörlerini Oluştur

Her modül için standart klasör yapısını oluşturun:

```bash
# Auth modülü
mkdir -p src/modules/auth/{api,hooks,types,utils,constants}

# Profile modülü
mkdir -p src/modules/profile/{api,hooks,types,utils}

# Event modülü
mkdir -p src/modules/event/{api,hooks,types,components,utils}

# Booking modülü
mkdir -p src/modules/booking/{api,hooks,types,components,utils}

# Ticket modülü
mkdir -p src/modules/ticket/{api,hooks,types,components,utils}

# Payment modülü
mkdir -p src/modules/payment/{api,hooks,types,utils}

# Notification modülü
mkdir -p src/modules/notification/{api,hooks,types,utils}

# Admin modülü
mkdir -p src/modules/admin/{api,hooks,types,components,utils}

# File Processing modülü
mkdir -p src/modules/file-processing/{api,hooks,types,utils}

# Reporting modülü
mkdir -p src/modules/reporting/{api,hooks,types,components,utils}
```

### Adım 1.3: Infrastructure Klasörlerini Oluştur

```bash
mkdir -p src/shared/infrastructure/supabase
mkdir -p src/shared/infrastructure/storage
mkdir -p src/shared/infrastructure/config
```

### Doğrulama

Klasör yapısı şu şekilde olmalı:

```
src/
├── modules/
│   ├── auth/
│   ├── profile/
│   ├── event/
│   ├── booking/
│   ├── ticket/
│   ├── payment/
│   ├── notification/
│   ├── admin/
│   ├── file-processing/
│   └── reporting/
└── shared/
    └── infrastructure/
        ├── supabase/
        ├── storage/
        └── config/
```

---

## Faz 2: Shared Infrastructure

### Adım 2.1: Supabase Client'ları Taşı

**Kaynak:** `utils/supabase/browser.ts`, `utils/supabase/server.ts`, `src/lib/supabase.ts`

**Hedef:** `src/shared/infrastructure/supabase/`

#### 2.1.1: Browser Client'ı Taşı

`utils/supabase/browser.ts` → `src/shared/infrastructure/supabase/browser.ts`

```typescript
// src/shared/infrastructure/supabase/browser.ts
import { createBrowserClient } from '@supabase/ssr';

// Environment variable loading
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
                    import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
                    import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL || '';

const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
                        import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                        import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Key is missing from environment variables!');
}

export const createBrowserClient = () => {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
        db: { schema: 'public' },
        auth: {
            persistSession: true,
            autoRefreshToken: true
        }
    });
};
```

#### 2.1.2: Server Client'ı Taşı

`utils/supabase/server.ts` → `src/shared/infrastructure/supabase/server.ts`

#### 2.1.3: Index Dosyası Oluştur

`src/shared/infrastructure/supabase/index.ts`:

```typescript
export { createBrowserClient } from './browser';
export { createServerClient } from './server';
export type { Database } from './types';
```

### Adım 2.2: Storage Utilities Taşı

Storage ile ilgili utility fonksiyonlarını `src/shared/infrastructure/storage/` altına taşıyın.

### Adım 2.3: Config Dosyası Oluştur

`src/shared/infrastructure/config/env.ts`:

```typescript
export const config = {
    supabase: {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    },
    app: {
        name: 'TALPA Etkinlik Platformu',
        version: '1.0.0',
    },
};
```

### Adım 2.4: Shared Index Oluştur

`src/shared/infrastructure/index.ts`:

```typescript
export * from './supabase';
export * from './storage';
export * from './config';
```

---

## Faz 3: Auth Modülü

### Adım 3.1: Types Oluştur

`src/modules/auth/types/auth.types.ts`:

```typescript
export interface LoginCredentials {
    email: string;
    password: string;
}

export interface SignupCredentials {
    email: string;
    password: string;
    fullName: string;
    sicilNo: string;
}

export interface AuthResult {
    success: boolean;
    message: string;
}

export interface AuthUser {
    id: string;
    email: string;
    // ... diğer alanlar
}
```

### Adım 3.2: API Fonksiyonlarını Taşı

`actions/auth.ts` → `src/modules/auth/api/auth.api.ts`

```typescript
// src/modules/auth/api/auth.api.ts
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import type { LoginCredentials, SignupCredentials, AuthResult } from '../types';

export async function login(credentials: LoginCredentials): Promise<AuthResult> {
    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
    });

    if (error) {
        return { success: false, message: 'Giriş başarısız. Bilgilerinizi kontrol ediniz.' };
    }

    return { success: true, message: 'Giriş başarılı.' };
}

export async function signup(credentials: SignupCredentials): Promise<AuthResult> {
    const supabase = createBrowserClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
            data: {
                full_name: credentials.fullName,
                talpa_sicil_no: credentials.sicilNo,
            }
        }
    });

    if (authError || !authData.user) {
        return { success: false, message: authError?.message || 'Kayıt oluşturulamadı.' };
    }

    return { success: true, message: 'Kayıt başarılı. Giriş yapabilirsiniz.' };
}

export async function logout(): Promise<AuthResult> {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    return { success: true, message: 'Çıkış başarılı.' };
}
```

### Adım 3.3: Hooks Oluştur

`src/modules/auth/hooks/useAuth.ts`:

```typescript
// src/modules/auth/hooks/useAuth.ts
import { useMutation } from '@tanstack/react-query';
import { login, logout, signup } from '../api/auth.api';
import type { LoginCredentials, SignupCredentials } from '../types';

export function useLogin() {
    return useMutation({
        mutationFn: (credentials: LoginCredentials) => login(credentials),
    });
}

export function useSignup() {
    return useMutation({
        mutationFn: (credentials: SignupCredentials) => signup(credentials),
    });
}

export function useLogout() {
    return useMutation({
        mutationFn: () => logout(),
    });
}
```

`src/modules/auth/hooks/useSession.ts`:

```typescript
// src/modules/auth/hooks/useSession.ts
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import type { User } from '@supabase/supabase-js';

export function useSession() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const supabase = createBrowserClient();
        
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    return { user, isLoading, isAuthenticated: !!user };
}
```

### Adım 3.4: Public API Export

`src/modules/auth/index.ts`:

```typescript
// src/modules/auth/index.ts
// Public API - Sadece bu dosyadan export edilenler modül dışında kullanılabilir

// Hooks
export { useLogin, useSignup, useLogout } from './hooks/useAuth';
export { useSession } from './hooks/useSession';

// API Functions
export { login, logout, signup } from './api/auth.api';

// Types
export type { LoginCredentials, SignupCredentials, AuthResult, AuthUser } from './types/auth.types';
```

### Adım 3.5: Test Et

Auth modülünü test etmek için:

```typescript
// Test dosyası veya component'te
import { useLogin, useSession } from '@/modules/auth';

function TestComponent() {
    const { mutate: login } = useLogin();
    const { user, isAuthenticated } = useSession();
    
    // Test login
    login({ email: 'test@example.com', password: 'password' });
    
    return <div>{isAuthenticated ? 'Logged in' : 'Not logged in'}</div>;
}
```

---

## Faz 4: Profile Modülü

### Adım 4.1: Types Oluştur

`src/modules/profile/types/profile.types.ts`:

```typescript
import { Database } from '@/shared/infrastructure/supabase';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface ProfileUpdate {
    full_name?: string;
    phone?: string;
    // ... diğer alanlar
}
```

### Adım 4.2: API Fonksiyonlarını Taşı

`src/api/profiles.ts` → `src/modules/profile/api/profile.api.ts`

```typescript
// src/modules/profile/api/profile.api.ts
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import type { Profile } from '../types';

export const getProfile = async (userId: string): Promise<Profile | null> => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }
    return data;
};

export const updateProfile = async (userId: string, updates: ProfileUpdate): Promise<Profile | null> => {
    const supabase = createBrowserClient();
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('Error updating profile:', error);
        return null;
    }
    return data;
};
```

### Adım 4.3: Hooks Taşı ve Güncelle

`src/hooks/useProfile.ts` → `src/modules/profile/hooks/useProfile.ts`

Import'ları güncelleyin:

```typescript
// src/modules/profile/hooks/useProfile.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile } from '../api/profile.api';
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types';

export const useProfile = () => {
    const [sessionUser, setSessionUser] = useState<User | null>(null);
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const queryClient = useQueryClient();

    useEffect(() => {
        const supabase = createBrowserClient();
        
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSessionUser(session?.user ?? null);
            setIsAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSessionUser(session?.user ?? null);
            setIsAuthLoading(false);
            if (session?.user) {
                queryClient.invalidateQueries({ queryKey: ['profile', session.user.id] });
            } else {
                queryClient.removeQueries({ queryKey: ['profile'] });
            }
        });

        return () => subscription.unsubscribe();
    }, [queryClient]);

    const { data: profile, isLoading: isProfileLoading } = useQuery({
        queryKey: ['profile', sessionUser?.id],
        queryFn: () => getProfile(sessionUser!.id),
        enabled: !!sessionUser?.id,
    });

    return {
        user: profile,
        isLoading: isAuthLoading || (!!sessionUser && isProfileLoading),
        isAuthenticated: !!sessionUser
    };
};
```

Admin hook'unu da taşıyın: `src/hooks/useAdmin.ts` → `src/modules/profile/hooks/useAdmin.ts`

### Adım 4.4: Public API Export

`src/modules/profile/index.ts`:

```typescript
// src/modules/profile/index.ts
export { useProfile } from './hooks/useProfile';
export { useAdmin } from './hooks/useAdmin';
export { getProfile, updateProfile } from './api/profile.api';
export type { Profile, ProfileUpdate } from './types/profile.types';
```

---

## Faz 5: Event Modülü

### Adım 5.1: Types Oluştur

`src/modules/event/types/event.types.ts`:

```typescript
import { Database } from '@/shared/infrastructure/supabase';

export type Event = Database['public']['Tables']['events']['Row'];
export type ActiveEvent = Database['public']['Views']['active_event_view']['Row'];

export interface EventCreate {
    title: string;
    description?: string;
    event_date: string;
    location_url?: string;
    price: number;
    quota_asil: number;
    quota_yedek: number;
    cut_off_date: string;
    banner_image?: string;
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
}

export interface EventUpdate extends Partial<EventCreate> {}
```

### Adım 5.2: API Fonksiyonlarını Taşı

`src/api/events.ts` → `src/modules/event/api/event.api.ts`

`actions/admin.ts` içindeki event fonksiyonlarını da buraya taşıyın:

```typescript
// src/modules/event/api/event.api.ts
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import type { Event, ActiveEvent, EventCreate } from '../types';

export const getActiveEvent = async (): Promise<ActiveEvent | null> => {
    const supabase = createBrowserClient();
    // ... mevcut kod
};

export const createEvent = async (eventData: EventCreate) => {
    const supabase = createBrowserClient();
    // Admin check
    // ... create logic
};

export const setActiveEvent = async (eventId: number) => {
    const supabase = createBrowserClient();
    // Admin check
    // ... RPC call
};
```

### Adım 5.3: Hooks Taşı

`src/hooks/useActiveEvent.ts` → `src/modules/event/hooks/useActiveEvent.ts`

Import'ları güncelleyin.

### Adım 5.4: Components Taşı

`components/EventCard.tsx` → `src/modules/event/components/EventCard.tsx`

Import'ları güncelleyin.

### Adım 5.5: Public API Export

`src/modules/event/index.ts`:

```typescript
export { useActiveEvent, useEvents } from './hooks';
export { getActiveEvent, createEvent, setActiveEvent } from './api';
export { EventCard } from './components';
export type { Event, ActiveEvent, EventCreate } from './types';
```

---

## Faz 6: Booking Modülü

### Adım 6.1: Types Oluştur

`src/modules/booking/types/booking.types.ts`:

```typescript
import { Database } from '@/shared/infrastructure/supabase';

export type Booking = Database['public']['Tables']['bookings']['Row'];

export type QueueStatus = 'ASIL' | 'YEDEK' | 'IPTAL';
export type PaymentStatus = 'WAITING' | 'PAID';

export interface JoinEventResult {
    success: boolean;
    queue?: QueueStatus;
    message: string;
}

export interface JoinEventParams {
    eventId: number;
    consentKvkk: boolean;
    consentPayment: boolean;
}
```

### Adım 6.2: API Fonksiyonlarını Birleştir ve Taşı

`actions/bookings.ts` ve `src/api/bookings.ts` dosyalarını birleştirip `src/modules/booking/api/booking.api.ts` altına taşıyın:

```typescript
// src/modules/booking/api/booking.api.ts
import { createBrowserClient } from '@/shared/infrastructure/supabase';
import type { Booking, JoinEventResult, JoinEventParams } from '../types';

export async function joinEvent(params: JoinEventParams): Promise<JoinEventResult> {
    const supabase = createBrowserClient();
    // ... mevcut kod
}

export async function getUserBooking(eventId: number): Promise<Booking | null> {
    // ... mevcut kod
}

export async function cancelBooking(bookingId: number): Promise<{ success: boolean; message: string }> {
    // ... mevcut kod
}
```

### Adım 6.3: Hooks Taşı ve Güncelle

`src/hooks/useBooking.ts` → `src/modules/booking/hooks/useBooking.ts`

Import'ları güncelleyin:

```typescript
// src/modules/booking/hooks/useBooking.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { joinEvent, getUserBooking, cancelBooking } from '../api/booking.api';
import type { Booking, JoinEventParams } from '../types';

export function useBooking(eventId: number | null) {
    return useQuery({
        queryKey: ['booking', eventId],
        queryFn: () => eventId ? getUserBooking(eventId) : null,
        enabled: !!eventId,
    });
}

export function useJoinEvent() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (params: JoinEventParams) => joinEvent(params),
        onSuccess: (data, variables) => {
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['booking', variables.eventId] });
                queryClient.invalidateQueries({ queryKey: ['activeEvent'] });
            }
        },
    });
}
```

### Adım 6.4: Components Taşı

`components/BookingModal.tsx` → `src/modules/booking/components/BookingModal.tsx`
`components/BookingStatus.tsx` → `src/modules/booking/components/BookingStatus.tsx`

Import'ları güncelleyin.

### Adım 6.5: Public API Export

`src/modules/booking/index.ts`:

```typescript
export { useBooking, useJoinEvent, useCancelBooking } from './hooks';
export { joinEvent, getUserBooking, cancelBooking } from './api';
export { BookingModal, BookingStatus } from './components';
export type { Booking, JoinEventResult, QueueStatus, PaymentStatus } from './types';
```

---

## Faz 7: Diğer Modüller

Aynı pattern'i takip ederek diğer modülleri oluşturun:

### Ticket Modülü
- `actions/admin.ts` içindeki ticket fonksiyonlarını taşı
- `components/admin/TicketPoolManager.tsx` ve `components/BoardingPass.tsx` taşı

### Payment Modülü
- Payment logic'i booking'den ayır
- `components/admin/BookingsTable.tsx` içindeki payment logic'i modüle taşı

### Notification Modülü
- Email gönderim logic'ini modüle taşı
- Edge Function çağrılarını modüle taşı

### Admin Modülü
- `actions/admin.ts` → `src/modules/admin/api/admin.api.ts`
- Admin component'lerini taşı
- Excel export/import logic'ini taşı

### File Processing Modülü
- ZIP processing logic'ini modüle taşı
- File upload utilities'ini taşı

### Reporting Modülü
- `components/InfoCockpit.tsx` taşı
- Stats calculation logic'ini modüle taşı

---

## Faz 8: Import'ları Güncelleme

### Adım 8.1: Path Alias Ekle

`tsconfig.json` veya `vite.config.ts` içine path alias ekleyin:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

```typescript
// vite.config.ts
import path from 'path';

export default {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '@/shared': path.resolve(__dirname, './src/shared'),
    },
  },
};
```

### Adım 8.2: Import'ları Toplu Güncelle

Tüm dosyalarda eski import'ları yeni modül import'larıyla değiştirin:

**Eski:**
```typescript
import { login } from '../actions/auth';
import { getProfile } from '../src/api/profiles';
import { useActiveEvent } from '../src/hooks/useActiveEvent';
```

**Yeni:**
```typescript
import { login } from '@/modules/auth';
import { getProfile } from '@/modules/profile';
import { useActiveEvent } from '@/modules/event';
```

### Adım 8.3: Otomatik Güncelleme (Opsiyonel)

VS Code'da "Find and Replace" kullanarak toplu güncelleme yapabilirsiniz:

1. `Ctrl+Shift+H` (Find and Replace)
2. Regex mode: `(?<=from ['"])(\.\.\/)?actions\/auth`
3. Replace: `@/modules/auth`
4. Replace All

---

## Faz 9: Temizlik ve Test

### Adım 9.1: Eski Dosyaları Sil

Tüm modüller taşındıktan ve import'lar güncellendikten sonra:

```bash
# Eski klasörleri sil
rm -rf actions/
rm -rf src/api/
rm -rf src/hooks/
rm -rf src/lib/

# Eski component'leri kontrol et (bazıları modüllere taşındı)
# components/ klasöründe sadece shared component'ler kalmalı
```

### Adım 9.2: Test Et

1. **Build test:**
```bash
npm run build
```

2. **Dev server test:**
```bash
npm run dev
```

3. **Manuel test:**
   - Login/Logout çalışıyor mu?
   - Event listesi görünüyor mu?
   - Booking yapılabiliyor mu?
   - Admin paneli çalışıyor mu?

### Adım 9.3: Linter ve Type Check

```bash
npm run lint
npx tsc --noEmit
```

### Adım 9.4: Git Commit

```bash
git add .
git commit -m "refactor: migrate to modular monolith architecture"
```

---

## Modül Standartları

### Public API Pattern

Her modül sadece `index.ts` üzerinden export yapar:

```typescript
// ✅ DOĞRU - Modül dışından kullanım
import { login, useLogin } from '@/modules/auth';

// ❌ YANLIŞ - Modül iç implementasyonuna erişim
import { login } from '@/modules/auth/api/auth.api';
```

### Dependency Injection

Modüller infrastructure'a bağımlılıkları inject eder:

```typescript
// ✅ DOĞRU
import { createBrowserClient } from '@/shared/infrastructure/supabase';

// ❌ YANLIŞ - Direkt Supabase import
import { supabase } from '@/lib/supabase';
```

### Type Safety

Her modül kendi types'ını export eder:

```typescript
// ✅ DOĞRU
import type { LoginCredentials } from '@/modules/auth';

// ❌ YANLIŞ - Shared types kullanımı (modül-specific types için)
import type { LoginCredentials } from '@/shared/types';
```

---

## Sık Sorulan Sorular

### S: Tüm modülleri aynı anda mı refactor etmeliyim?

**C:** Hayır. Modül modül, faz faz ilerleyin. Her modülü tamamladıktan sonra test edin ve commit yapın.

### S: Eski kod çalışırken refactoring yapabilir miyim?

**C:** Evet, ama dikkatli olun. Her modülü taşıdıktan sonra import'ları hemen güncelleyin. Eski ve yeni kodun aynı anda çalışmasını önleyin.

### S: Component'ler modüllere mi yoksa shared'a mı gitmeli?

**C:** 
- **Modül-specific component'ler:** Modüle git (örn: `BookingModal` → `modules/booking/components/`)
- **Shared/Generic component'ler:** Shared'a git (örn: `Button`, `Modal` → `shared/components/`)

### S: Hooks modüllere mi yoksa shared'a mı gitmeli?

**C:**
- **Modül-specific hooks:** Modüle git (örn: `useBooking` → `modules/booking/hooks/`)
- **Generic hooks:** Shared'a git (örn: `useDebounce`, `useLocalStorage` → `shared/hooks/`)

### S: Import path'leri çok uzun oluyor, ne yapmalıyım?

**C:** Path alias kullanın (`@/modules/auth` gibi). `tsconfig.json` ve `vite.config.ts` içinde alias tanımlayın.

### S: Test dosyaları nereye gitmeli?

**C:** Her modülün yanına `__tests__` klasörü ekleyin:
```
modules/auth/
├── __tests__/
│   ├── auth.api.test.ts
│   └── useAuth.test.ts
```

---

## Sonraki Adımlar

Refactoring tamamlandıktan sonra:

1. **Modül dokümantasyonu:** Her modül için README oluştur
2. **API dokümantasyonu:** Public API'leri dokümante et
3. **Test coverage:** Her modül için test yaz
4. **Performance monitoring:** Modül performansını izle
5. **Code review:** Refactoring'i review et

---

## Yardım ve Destek

Sorun yaşarsanız:

1. Git history'ye bakın (her faz commit edildi)
2. TypeScript hatalarını kontrol edin
3. Import path'lerini doğrulayın
4. Modül `index.ts` dosyalarını kontrol edin

---

**Not:** Bu refactoring büyük bir değişikliktir. Acele etmeyin, her adımı dikkatli yapın ve test edin.

