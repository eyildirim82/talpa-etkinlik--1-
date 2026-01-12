# TALPA Etkinlik Platformu - Auth & Security İnceleme Raporu

**Hazırlanma Tarihi:** 2026-01-04  
**İnceleyen:** Senior Software Architect  
**Kapsam:** `middleware.ts`, `src/modules/auth/`

---

## 📋 Dosya Analizi

### `middleware.ts` (Next.js Middleware)

**Dosyanın Rolü:** Next.js middleware katmanı. Tüm HTTP isteklerini yakalar ve route protection sağlar.

**Mimari Konumu:** Uygulama katmanının en üst seviyesi. Tüm route'lara erişimden önce çalışır.

---

### `src/modules/auth/` (Auth Modülü)

**Dosyanın Rolü:** Kimlik doğrulama işlemlerini yönetir. Login, signup, logout ve session yönetimi.

**Mimari Konumu:** Modüler monolitik yapının auth katmanı. Diğer modüller bu modüle bağımlı.

**Modül Yapısı:**
- `api/auth.api.ts` - Auth API çağrıları
- `hooks/useAuth.ts` - Auth mutations hook'u
- `hooks/useSession.ts` - Session state hook'u
- `types/auth.types.ts` - Type tanımları

---

## 📊 Puanlama: **72/100**

### Puanlama Detayları:
- ⚠️ **Middleware Güvenliği:** 12/20 (Admin kontrolü eksik, sadece auth kontrolü var)
- ✅ **Auth API:** 16/20 (Temel işlemler doğru, profil kontrolü eksik)
- ⚠️ **Session Yönetimi:** 14/20 (Profil bilgisi eksik, sadece auth user var)
- 🔴 **Admin Kontrolü:** 8/20 (Her modülde tekrar eden kod, merkezi değil)
- ✅ **Type Safety:** 15/20 (TypeScript kullanımı iyi)
- ⚠️ **RLS Uyumluluğu:** 7/20 (Client-side admin kontrolü güvenilir değil)

---

## 🐛 Tespit Edilen Sorunlar

### 🔴 KRİTİK (Acil Müdahale Gerektirir)

#### 1. Middleware'de Admin Kontrolü Eksik
**Dosya:** `middleware.ts` (Satır 44-56)

**Sorun:**
- Middleware sadece kullanıcı girişi kontrol ediyor (`!user`)
- `/admin` route'larına admin olmayan kullanıcılar erişebilir
- Client-side kontrol güvenilir değil (kolayca bypass edilebilir)

**Risk:**
- Normal kullanıcılar admin paneline erişebilir
- Güvenlik açığı (Authorization bypass)
- RLS politikalarına güvenilse de, gereksiz veritabanı sorguları

**Mevcut Kod:**
```typescript
// PROTECTED ROUTES: Any path starting with /admin or /ticket
const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/ticket')

// Rule 1: Protected route + No user -> Redirect to Login
if (isProtectedRoute && !user) {
  // ✅ Sadece auth kontrolü var
  // ❌ Admin kontrolü YOK
}
```

**Çözüm:**
```typescript
// middleware.ts - Güncellenmiş versiyon
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Check Session
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Route Protection Logic
  const path = request.nextUrl.pathname

  const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/ticket')
  const isAdminRoute = path.startsWith('/admin')
  const isAuthRoute = path === '/login' || path === '/register'

  // Rule 1: Protected route + No user -> Redirect to Login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // ✅ YENİ: Admin route + User logged in -> Check admin status
  if (isAdminRoute && user) {
    // Use RPC function for admin check (server-side, secure)
    const { data: isAdmin } = await supabase.rpc('get_my_admin_status')
    
    if (!isAdmin) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}
```

**Not:** `get_my_admin_status()` RPC fonksiyonu `master_schema.sql`'de tanımlı. Middleware'de kullanılabilir.

---

#### 2. Profil Oluşturma Akışı Eksik
**Dosya:** `src/modules/auth/api/auth.api.ts` (Satır 20-40)

**Sorun:**
- `signup()` fonksiyonu sadece `auth.signUp()` çağırıyor
- Profil oluşturma kontrolü yok
- Trigger çalışmazsa kullanıcı profil olmadan kalabilir

**Risk:**
- Kullanıcı kayıt olduktan sonra profil bulunamaz
- RLS politikaları çalışmaz
- Uygulama çöker

**Mevcut Kod:**
```typescript
export async function signup(data: SignupData): Promise<AuthResponse> {
  const supabase = createClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        talpa_sicil_no: sicilNo,
      }
    }
  })

  if (authError || !authData.user) {
    return { success: false, message: authError?.message || 'Kayıt oluşturulamadı.' }
  }

  // ❌ Profil kontrolü YOK
  // ❌ Trigger çalıştı mı kontrolü YOK

  return { success: true, message: 'Kayıt başarılı. Giriş yapabilirsiniz.' }
}
```

**Çözüm:**
```typescript
export async function signup(data: SignupData): Promise<AuthResponse> {
  const supabase = createClient()
  const { email, password, fullName, sicilNo } = data

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        talpa_sicil_no: sicilNo,
      }
    }
  })

  if (authError || !authData.user) {
    return { success: false, message: authError?.message || 'Kayıt oluşturulamadı.' }
  }

  // ✅ Profil oluşturuldu mu kontrol et (trigger çalıştı mı?)
  // Trigger genelde anında çalışır ama kontrol edelim
  if (authData.user) {
    // Kısa bir bekleme (trigger'ın çalışması için)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      // Trigger çalışmadı, manuel oluştur
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          sicil_no: sicilNo,
          role: 'member',
          is_admin: false
        })

      if (insertError) {
        console.error('Failed to create profile:', insertError)
        return { 
          success: false, 
          message: 'Profil oluşturulamadı. Lütfen destek ekibiyle iletişime geçin.' 
        }
      }
    }
  }

  return { success: true, message: 'Kayıt başarılı. Giriş yapabilirsiniz.' }
}
```

**Alternatif Çözüm (Daha İyi):**
- Trigger'ın çalıştığından emin olmak için `migration_fix_profile_creation.sql` çalıştırılmalı
- Frontend'de fallback mekanizması olarak yukarıdaki kontrol eklenebilir

---

#### 3. Admin Kontrolü Kod Tekrarı (DRY İhlali)
**Dosya:** Tüm modüller (`admin.api.ts`, `event.api.ts`, `ticket.api.ts`, vb.)

**Sorun:**
- Her modülde aynı `checkAdmin()` fonksiyonu tekrar ediliyor
- Kod tekrarı (DRY prensibine aykırı)
- Değişiklik yapılması gerektiğinde 6+ dosyada güncelleme gerekir

**Etkilenen Dosyalar:**
- `src/modules/admin/api/admin.api.ts` (Satır 8-20)
- `src/modules/event/api/event.api.ts` (Satır 5-18)
- `src/modules/ticket/api/ticket.api.ts` (Satır 5-17)
- `src/modules/file-processing/api/file-processing.api.ts` (Satır 5-17)
- `src/modules/reporting/api/reporting.api.ts` (Satır 5-17)

**Risk:**
- Bakım zorluğu
- Tutarsızlık riski (bir modülde güncellenip diğerinde unutulabilir)
- Test zorluğu

**Çözüm:**
```typescript
// src/modules/auth/utils/admin.utils.ts (YENİ DOSYA)
import { createBrowserClient } from '@/shared/infrastructure/supabase'

/**
 * Check if current user is admin
 * Uses RPC function for server-side validation (secure)
 */
export async function checkAdmin(): Promise<boolean> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  // Use RPC function (server-side, RLS-safe)
  const { data: isAdmin, error } = await supabase.rpc('get_my_admin_status')
  
  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }

  return !!isAdmin
}

/**
 * Check admin status with fallback to direct query
 * (For cases where RPC is not available)
 */
export async function checkAdminFallback(): Promise<boolean> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  return !!(profile?.is_admin || profile?.role === 'admin')
}
```

**Kullanım:**
```typescript
// src/modules/admin/api/admin.api.ts
import { checkAdmin } from '@/modules/auth/utils/admin.utils'

export async function cancelBooking(bookingId: number, eventId: number): Promise<AdminResponse> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  // ... rest of the code
}
```

---

### 🟡 ORTA SEVİYE (İyileştirme Gerektirir)

#### 4. `useSession()` Hook'unda Profil Bilgisi Eksik
**Dosya:** `src/modules/auth/hooks/useSession.ts`

**Sorun:**
- Hook sadece `auth.user` döndürüyor
- Profil bilgisi (`is_admin`, `role`, `full_name`) yok
- Her yerde ayrı profil sorgusu yapılıyor

**Etki:**
- Gereksiz veritabanı sorguları
- State tutarsızlığı riski
- Performans sorunu

**Mevcut Kod:**
```typescript
export function useSession() {
  // ... 
  return {
    user: session?.user ?? null,  // ❌ Sadece auth user
    session: session?.session ?? null,
    isLoading,
  }
}
```

**Çözüm:**
```typescript
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/modules/profile/types/profile.types'

interface SessionState {
  user: User | null
  session: Session | null
  profile: Profile | null
}

export function useSession() {
  const supabase = createBrowserClient()
  const queryClient = useQueryClient()

  const { data: session, isLoading } = useQuery<SessionState>({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      
      let profile: Profile | null = null
      if (session?.user) {
        // Fetch profile along with session
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        profile = profileData
      }

      return {
        user: session?.user ?? null,
        session: session,
        profile: profile,
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Subscribe to auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      let profile: Profile | null = null
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        profile = profileData
      }

      queryClient.setQueryData(['session'], {
        user: session?.user ?? null,
        session: session,
        profile: profile,
      })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, queryClient])

  return {
    user: session?.user ?? null,
    session: session?.session ?? null,
    profile: session?.profile ?? null,  // ✅ Profil bilgisi eklendi
    isLoading,
    isAdmin: !!session?.profile?.is_admin || session?.profile?.role === 'admin',  // ✅ Admin kontrolü
  }
}
```

---

#### 5. Client-Side Admin Kontrolü Güvenilir Değil
**Sorun:**
- Tüm admin kontrolleri client-side yapılıyor
- RLS politikaları backend'de koruma sağlıyor ama gereksiz sorgular yapılıyor
- Middleware'de admin kontrolü yok

**Etki:**
- Güvenlik açığı riski (client-side kontrol bypass edilebilir)
- Performans sorunu (her admin işleminde profil sorgusu)

**Çözüm:**
- Middleware'de admin kontrolü eklendi (Yukarıdaki Çözüm 1)
- RPC fonksiyonu (`get_my_admin_status`) kullanılmalı
- Client-side kontrol sadece UX için olmalı, güvenlik için değil

---

#### 6. Hata Mesajları Tutarsız
**Dosya:** `src/modules/auth/api/auth.api.ts`

**Sorun:**
- `login()` ve `signup()` fonksiyonlarında hata mesajları farklı formatlarda
- Bazı yerlerde `error.message`, bazı yerlerde özel mesaj

**Çözüm:**
```typescript
// Standart hata formatı
export interface AuthResponse {
  success: boolean
  message: string
  error_code?: string  // ✅ Eklendi
}

// Hata kodları enum'u
export enum AuthErrorCode {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  PROFILE_CREATION_FAILED = 'PROFILE_CREATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
}
```

---

### 🟢 DÜŞÜK SEVİYE (İyileştirme Önerileri)

#### 7. `useAuth()` Hook'unda Error Handling İyileştirmesi
**Sorun:** Error state yönetimi basit, detaylı hata bilgisi yok

**Öneri:** Error tipi ve mesajı daha detaylı olmalı

---

#### 8. Session Refresh Mekanizması Eksik
**Sorun:** Session expire olduğunda otomatik refresh yok

**Öneri:** Supabase'in `onAuthStateChange` kullanılıyor (iyi), ancak refresh token rotation kontrol edilmeli

---

## 💡 İyileştirme Önerileri

### 1. Merkezi Admin Kontrolü

**Öneri:** `src/modules/auth/utils/admin.utils.ts` dosyası oluşturulmalı ve tüm modüller buradan import etmeli.

**Aksiyon:**
```bash
# 1. Yeni dosya oluştur
src/modules/auth/utils/admin.utils.ts

# 2. Tüm modüllerdeki checkAdmin() fonksiyonlarını kaldır
# 3. Import ekle: import { checkAdmin } from '@/modules/auth/utils/admin.utils'
```

---

### 2. Middleware'de RPC Kullanımı

**Öneri:** Middleware'de admin kontrolü için RPC fonksiyonu kullanılmalı (server-side, güvenli).

**Not:** `get_my_admin_status()` RPC fonksiyonu `master_schema.sql`'de tanımlı.

---

### 3. Profil State Yönetimi

**Öneri:** `useSession()` hook'u profil bilgisini de döndürmeli. Böylece her yerde ayrı sorgu yapılmasına gerek kalmaz.

---

### 4. Type Safety İyileştirmesi

**Öneri:** `auth.types.ts` dosyasına admin kontrolü için type'lar eklenmeli:

```typescript
export interface AuthUser extends User {
  profile?: {
    is_admin: boolean
    role: 'admin' | 'member'
    full_name: string
  }
}
```

---

## 🛠️ Refactor Edilmiş Kod Bloğu

### `src/modules/auth/utils/admin.utils.ts` (YENİ DOSYA)

```typescript
/**
 * Admin Utilities
 * Centralized admin role checking functions
 */
import { createBrowserClient } from '@/shared/infrastructure/supabase'

/**
 * Check if current user is admin using RPC function
 * Server-side validation (secure, RLS-safe)
 */
export async function checkAdmin(): Promise<boolean> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  try {
    // Use RPC function (server-side, uses SECURITY DEFINER)
    const { data: isAdmin, error } = await supabase.rpc('get_my_admin_status')
    
    if (error) {
      console.error('Error checking admin status via RPC:', error)
      // Fallback to direct query if RPC fails
      return await checkAdminFallback()
    }

    return !!isAdmin
  } catch (error) {
    console.error('Exception in checkAdmin:', error)
    return false
  }
}

/**
 * Fallback admin check using direct profile query
 * Use only if RPC is not available
 */
export async function checkAdminFallback(): Promise<boolean> {
  const supabase = createBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return false

  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile for admin check:', error)
      return false
    }

    return !!(profile?.is_admin || profile?.role === 'admin')
  } catch (error) {
    console.error('Exception in checkAdminFallback:', error)
    return false
  }
}

/**
 * Get admin status synchronously from session
 * Use in React components where session is already loaded
 */
export function isAdminFromProfile(profile: { is_admin?: boolean | null; role?: string | null } | null): boolean {
  if (!profile) return false
  return !!(profile.is_admin || profile.role === 'admin')
}
```

---

### `middleware.ts` - Güncellenmiş Versiyon

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create standard Supabase Client for Middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // 1. Check Session
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Route Protection Logic
  const path = request.nextUrl.pathname

  // PROTECTED ROUTES: Any path starting with /admin or /ticket
  const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/ticket')
  const isAdminRoute = path.startsWith('/admin')
  const isAuthRoute = path === '/login' || path === '/register'

  // Rule 1: Protected route + No user -> Redirect to Login
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path) // Store return URL
    return NextResponse.redirect(url)
  }

  // ✅ YENİ: Admin route + User logged in -> Check admin status
  if (isAdminRoute && user) {
    try {
      // Use RPC function for admin check (server-side, secure)
      const { data: isAdmin, error } = await supabase.rpc('get_my_admin_status')
      
      if (error || !isAdmin) {
        // Not admin or error occurred -> Redirect to home
        const url = request.nextUrl.clone()
        url.pathname = '/'
        return NextResponse.redirect(url)
      }
    } catch (error) {
      // Error checking admin status -> Deny access
      console.error('Middleware admin check error:', error)
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  // Rule 2: Auth route + User logged in -> Redirect to Home (Optional, improves UX)
  // if (isAuthRoute && user) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/'
  //   return NextResponse.redirect(url)
  // }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, assets, public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## ⏭️ Sıradaki Adım

**Review Roadmap'e göre bir sonraki adım:**

### 3. Core Business Logic İncelemesi

Lütfen aşağıdaki dosyaları gönderin:

1. **`src/modules/booking/`** klasörü içindeki tüm dosyalar:
   - `api/` - Booking API çağrıları
   - `components/` - Booking bileşenleri
   - `hooks/` - Booking hook'ları
   - `types/` - Booking type tanımları

2. **`actions/bookings.ts`** - Server Actions (eğer varsa)

**Beklenen İnceleme Konuları:**
- `join_event()` RPC çağrısı doğru mu?
- Race condition koruması var mı?
- Hata yönetimi yeterli mi?
- Frontend-backend senkronizasyonu doğru mu?

---

**Not:** Bu rapor, Auth & Security katmanının kritik sorunlarını tespit etmiştir. **Middleware'de admin kontrolü** ve **merkezi admin utility** oluşturulması production'a çıkmadan önce zorunludur.
