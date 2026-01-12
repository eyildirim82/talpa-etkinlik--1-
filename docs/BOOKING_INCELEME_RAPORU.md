# TALPA Etkinlik Platformu - Booking Modülü İnceleme Raporu

**Hazırlanma Tarihi:** 2026-01-04  
**İnceleyen:** Senior Software Architect  
**Kapsam:** `src/modules/booking/`

---

## 📋 Dosya Analizi

### `src/modules/booking/` (Core Business Logic Modülü)

**Dosyanın Rolü:** Etkinlik başvuru (booking) işlemlerini yönetir. FCFS (First-Come, First-Served) kuyruk sistemi, race condition koruması ve kullanıcı başvuru akışı burada.

**Mimari Konumu:** Modüler monolitik yapının en kritik iş mantığı katmanı. Veritabanı RPC fonksiyonları ile entegre.

**Modül Yapısı:**
- `api/booking.api.ts` - Booking API çağrıları (RPC entegrasyonu)
- `hooks/useBooking.ts` - React Query hook'ları
- `components/BookingModal.tsx` - Başvuru modal bileşeni
- `components/BookingStatus.tsx` - Başvuru durumu gösterimi
- `types/booking.types.ts` - Type tanımları

---

## 📊 Puanlama: **85/100**

### Puanlama Detayları:
- ✅ **RPC Entegrasyonu:** 16/20 (İyi ama parametre uyumsuzluğu var)
- ✅ **Race Condition Koruması:** 20/20 (RPC tarafında mükemmel, frontend'de gereksiz kontrol yok)
- ⚠️ **Hata Yönetimi:** 14/20 (RPC yanıt formatı uyumsuzluğu)
- ✅ **Type Safety:** 18/20 (TypeScript kullanımı iyi, `user: any` tipi var)
- ✅ **State Yönetimi:** 17/20 (React Query kullanımı doğru, cache invalidation iyi)

---

## 🐛 Tespit Edilen Sorunlar

### 🔴 KRİTİK (Acil Müdahale Gerektirir)

#### 1. RPC Parametre Adı Uyumsuzluğu
**Dosya:** `src/modules/booking/api/booking.api.ts` (Satır 28-30)

**Sorun:**
- Frontend'de RPC çağrısı `event_id_param` parametresiyle yapılıyor
- Veritabanında `master_schema.sql` fonksiyonu `p_event_id` parametresi bekliyor
- Bu uyumsuzluk RPC çağrısının başarısız olmasına neden olur

**Mevcut Kod:**
```typescript
// booking.api.ts - Satır 28-30
const { data, error } = await supabase.rpc('join_event', {
  event_id_param: eventId  // ❌ Yanlış parametre adı
})
```

**Veritabanı Fonksiyonu:**
```sql
-- master_schema.sql - Satır 234
CREATE OR REPLACE FUNCTION public.join_event(p_event_id BIGINT)
-- ✅ Fonksiyon p_event_id bekliyor
```

**Risk:**
- RPC çağrısı başarısız olur
- Kullanıcılar etkinliğe başvuru yapamaz
- Sistem çalışmaz

**Çözüm:**
```typescript
// booking.api.ts - Düzeltilmiş versiyon
const { data, error } = await supabase.rpc('join_event', {
  p_event_id: eventId  // ✅ Doğru parametre adı
})
```

**Alternatif:** Veritabanı fonksiyonunu `event_id_param` kabul edecek şekilde güncellemek (önerilmez, master_schema.sql standart)

---

#### 2. RPC Yanıt Formatı Uyumsuzluğu
**Dosya:** `src/modules/booking/api/booking.api.ts` (Satır 38-41)

**Sorun:**
- Frontend'de `data.status === 'error'` kontrolü yapılıyor
- Veritabanı fonksiyonu `success: false` döndürüyor, `status` field'ı yok
- Bu kontrol hiçbir zaman true olmaz, hatalar yakalanmaz

**Mevcut Kod:**
```typescript
// booking.api.ts - Satır 38-41
// Handle business logic errors from function
if (data.status === 'error') {  // ❌ data.status hiçbir zaman 'error' olmaz
  return { success: false, message: data.message || 'Başvuru yapılamadı.' }
}
```

**Veritabanı Fonksiyonu Yanıt Formatı:**
```json
// master_schema.sql - Başarılı durum
{
  "success": true,
  "queue": "ASIL",
  "position": 1,
  "message": "Başvurunuz alındı. Asil listedesiniz."
}

// master_schema.sql - Hata durumu
{
  "success": false,
  "error_code": "EVENT_NOT_FOUND",
  "message": "Etkinlik bulunamadı."
}
```

**Risk:**
- Hata durumları yakalanmaz
- Kullanıcıya yanlış mesaj gösterilir
- Sistem davranışı belirsiz

**Çözüm:**
```typescript
// booking.api.ts - Düzeltilmiş versiyon
try {
  const { data, error } = await supabase.rpc('join_event', {
    p_event_id: eventId  // ✅ Parametre adı düzeltildi
  })

  // Handle RPC call errors (network, permission, etc.)
  if (error) {
    console.error('Join Event RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' }
  }

  // ✅ DÜZELTME: success field'ını kontrol et
  if (!data || data.success === false) {
    return { 
      success: false, 
      message: data?.message || 'Başvuru yapılamadı.',
      errorCode: data?.error_code  // ✅ Error code'u da döndür
    }
  }

  // Success - Return queue status
  return {
    success: true,
    queue: data.queue as QueueStatus,
    message: data.message || 'Başvurunuz başarıyla alındı!',
    position: data.position  // ✅ Position bilgisi de döndürülebilir
  }

} catch (err) {
  console.error('Unexpected Error:', err)
  return { success: false, message: 'Beklenmeyen bir hata oluştu.' }
}
```

---

#### 3. `useUserBooking` Hook'unda Auth Kontrolü Eksik
**Dosya:** `src/modules/booking/hooks/useBooking.ts` (Satır 42-56)

**Sorun:**
- Hook `auth.uid()` kontrolü yapmıyor
- Kullanıcı giriş yapmamışsa gereksiz sorgu yapılıyor
- RLS politikası zaten koruma sağlıyor ama gereksiz network trafiği

**Mevcut Kod:**
```typescript
export function useUserBooking(eventId: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['user-booking', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_id', eventId)
        .maybeSingle()  // ❌ user_id kontrolü yok
      return data
    }
  })
}
```

**Risk:**
- Gereksiz veritabanı sorguları
- Performans sorunu
- Cache pollution (giriş yapmamış kullanıcılar için de cache oluşur)

**Çözüm:**
```typescript
export function useUserBooking(eventId: number) {
  const supabase = createClient()
  const { user } = useSession()  // ✅ Auth kontrolü eklendi

  return useQuery({
    queryKey: ['user-booking', eventId, user?.id],
    queryFn: async () => {
      if (!user) return null  // ✅ Giriş yapmamışsa null döndür

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)  // ✅ user_id kontrolü eklendi
        .maybeSingle()
      return data
    },
    enabled: !!user,  // ✅ Sadece giriş yapmış kullanıcılar için çalıştır
  })
}
```

---

### 🟡 ORTA SEVİYE (İyileştirme Gerektirir)

#### 4. `cancelBooking()` Fonksiyonunda Client-Side Tarih Kontrolü
**Dosya:** `src/modules/booking/api/booking.api.ts` (Satır 88-135)

**Sorun:**
- Cut-off date kontrolü client-side yapılıyor
- Kullanıcı sistem saatini değiştirerek bypass edebilir
- RPC fonksiyonu (`cancel_booking`) kullanılmıyor

**Mevcut Kod:**
```typescript
// 3. Check cut-off date
const cutOffDate = new Date((booking as any).events.cut_off_date)
const now = new Date()  // ❌ Client-side tarih kontrolü
if (now > cutOffDate) {
  return { success: false, message: 'İptal tarihi geçmiş. Başvurunuzu iptal edemezsiniz.' }
}
```

**Risk:**
- Güvenlik açığı (client-side tarih kontrolü bypass edilebilir)
- Tutarsızlık (RPC fonksiyonu var ama kullanılmıyor)

**Çözüm:**
```typescript
export async function cancelBooking(bookingId: number): Promise<BookingResponse> {
  const supabase = createBrowserClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'İşlem için giriş yapmalısınız.' }
  }

  try {
    // ✅ RPC fonksiyonu kullan (server-side tarih kontrolü)
    const { data, error } = await supabase.rpc('cancel_booking', {
      booking_id_param: bookingId
    })

    if (error) {
      console.error('Cancel Booking RPC Error:', error)
      return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' }
    }

    // RPC fonksiyonu JSON döndürür
    if (!data || data.status === 'error') {
      return { 
        success: false, 
        message: data?.message || 'Başvuru iptal edilemedi.' 
      }
    }

    return { success: true, message: data.message || 'Başvurunuz iptal edildi.' }

  } catch (err) {
    console.error('Unexpected Error:', err)
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' }
  }
}
```

**Not:** `cancel_booking` RPC fonksiyonu `consolidated_schema.sql`'de tanımlı (Satır 341-377).

---

#### 5. `BookingModal` Component'inde Type Safety Eksikliği
**Dosya:** `src/modules/booking/components/BookingModal.tsx` (Satır 11)

**Sorun:**
- `user: any` tipi kullanılıyor
- Type safety eksik
- Refactoring zorluğu

**Mevcut Kod:**
```typescript
interface BookingModalProps {
  eventId: number
  eventPrice: number
  onClose: () => void
  onSuccess: (queue: QueueStatus) => void
  user: any  // ❌ any tipi kullanılıyor
}
```

**Çözüm:**
```typescript
import type { Profile } from '@/modules/profile/types/profile.types'

interface BookingModalProps {
  eventId: number
  eventPrice: number
  onClose: () => void
  onSuccess: (queue: QueueStatus) => void
  user: Profile | null  // ✅ Proper type
}
```

---

#### 6. `getBookingQueuePosition()` Fonksiyonunda Performans Sorunu
**Dosya:** `src/modules/booking/api/booking.api.ts` (Satır 140-168)

**Sorun:**
- İki ayrı sorgu yapılıyor (booking fetch + count)
- Tek sorguda yapılabilir (window function veya subquery)

**Mevcut Kod:**
```typescript
// 1. Get booking
const { data: booking } = await supabase
  .from('bookings')
  .select('booking_date, queue_status')
  .eq('event_id', eventId)
  .eq('user_id', userId)
  .single()

// 2. Count bookings before this one
const { count } = await supabase
  .from('bookings')
  .select('*', { count: 'exact', head: true })
  .eq('event_id', eventId)
  .eq('queue_status', 'YEDEK')
  .lt('booking_date', booking.booking_date)
```

**Etki:**
- Gereksiz network round-trip
- Performans sorunu (özellikle yüksek trafikte)

**Çözüm:**
```typescript
export async function getBookingQueuePosition(eventId: number, userId: string): Promise<number | null> {
  const supabase = createBrowserClient()

  try {
    // ✅ Tek sorguda window function kullanarak position hesapla
    const { data, error } = await supabase.rpc('get_booking_queue_position', {
      p_event_id: eventId,
      p_user_id: userId
    })

    if (error || !data) {
      console.error('Error getting queue position:', error)
      return null
    }

    return data.position
  } catch (error) {
    console.error('Error getting queue position:', error)
    return null
  }
}
```

**Alternatif:** RPC fonksiyonu yerine tek sorguda subquery kullanılabilir (daha basit).

---

#### 7. `BookingModal` Component'inde Fallback Queue Status
**Dosya:** `src/modules/booking/components/BookingModal.tsx` (Satır 55-58)

**Sorun:**
- `'ONAYLANDI'` gibi geçersiz bir queue status kullanılıyor
- `QueueStatus` enum'unda böyle bir değer yok

**Mevcut Kod:**
```typescript
} else if (result.success) {
  // Fallback if queue is not present but success is true
  onSuccess('ONAYLANDI')  // ❌ Geçersiz queue status
  onClose()
}
```

**Risk:**
- Type error (TypeScript strict mode'da)
- Runtime hatası riski

**Çözüm:**
```typescript
} else if (result.success) {
  // Fallback if queue is not present but success is true
  // Bu durum normalde olmamalı, log'la ve varsayılan değer kullan
  console.warn('Queue status missing in successful response:', result)
  onSuccess('ASIL' as QueueStatus)  // ✅ Varsayılan değer
  onClose()
}
```

**Daha İyi Çözüm:** RPC fonksiyonunun her zaman `queue` field'ı döndürmesini garanti etmek.

---

### 🟢 DÜŞÜK SEVİYE (İyileştirme Önerileri)

#### 8. Error Code Handling Eksikliği
**Sorun:** RPC fonksiyonu `error_code` döndürüyor ama frontend'de kullanılmıyor

**Öneri:** Error code'lara göre farklı mesajlar ve UI davranışları gösterilebilir

---

#### 9. Loading State Yönetimi
**Sorun:** `useJoinEvent` hook'unda loading state yok (mutation'da var ama component'te kullanılmıyor)

**Öneri:** Loading state'i component'te gösterilmeli

---

#### 10. Retry Mekanizması Eksikliği
**Sorun:** Network hatalarında otomatik retry yok

**Öneri:** React Query'nin `retry` özelliği kullanılabilir

---

## 💡 İyileştirme Önerileri

### 1. RPC Yanıt Formatı Standardizasyonu

**Öneri:** Tüm RPC fonksiyonları aynı formatı kullanmalı:

```typescript
// Standart başarılı yanıt
{
  success: true,
  data?: any,
  message?: string
}

// Standart hata yanıtı
{
  success: false,
  error_code: string,
  message: string,
  details?: string
}
```

---

### 2. Type Safety İyileştirmesi

**Öneri:** `JoinEventResult` interface'ine `errorCode` ve `position` eklenmeli:

```typescript
export interface JoinEventResult {
  success: boolean
  queue?: QueueStatus
  message: string
  errorCode?: string  // ✅ Eklendi
  position?: number   // ✅ Eklendi
}
```

---

### 3. Error Handling Utility

**Öneri:** Merkezi error handling utility oluşturulmalı:

```typescript
// src/modules/booking/utils/error.utils.ts
export function handleRPCError(error: any, defaultMessage: string): BookingResponse {
  if (error?.code === 'PGRST116') {
    return { success: false, message: 'Fonksiyon bulunamadı. Lütfen yöneticiye bildirin.' }
  }
  // ... diğer hata kodları
  return { success: false, message: defaultMessage }
}
```

---

## 🛠️ Refactor Edilmiş Kod Bloğu

### `src/modules/booking/api/booking.api.ts` - Düzeltilmiş Versiyon

```typescript
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { Booking, JoinEventResult, BookingResponse, BookingFilters, BookingsWithCount, QueueStatus } from '../types/booking.types'

/**
 * Join event queue system
 * Calls join_event RPC function which handles race conditions and queue assignment
 */
export async function joinEvent(
  eventId: number,
  consentKvkk: boolean,
  consentPayment: boolean
): Promise<JoinEventResult> {
  const supabase = createBrowserClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'İşlem için giriş yapmalısınız.' }
  }

  // 2. Validate consents
  if (!consentKvkk || !consentPayment) {
    return { success: false, message: 'KVKK ve ödeme onaylarını vermelisiniz.' }
  }

  try {
    // ✅ DÜZELTME: Doğru parametre adı
    const { data, error } = await supabase.rpc('join_event', {
      p_event_id: eventId  // ✅ event_id_param yerine p_event_id
    })

    // Handle RPC call errors (network, permission, etc.)
    if (error) {
      console.error('Join Event RPC Error:', error)
      return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' }
    }

    // ✅ DÜZELTME: success field'ını kontrol et (status değil)
    if (!data || data.success === false) {
      return { 
        success: false, 
        message: data?.message || 'Başvuru yapılamadı.',
        errorCode: data?.error_code  // ✅ Error code'u da döndür
      }
    }

    // Success - Return queue status
    return {
      success: true,
      queue: data.queue as QueueStatus,
      message: data.message || 'Başvurunuz başarıyla alındı!',
      position: data.position  // ✅ Position bilgisi de döndür
    }

  } catch (err) {
    console.error('Unexpected Error:', err)
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' }
  }
}

/**
 * Cancel booking (user can cancel before cut-off date)
 * ✅ DÜZELTME: RPC fonksiyonu kullan (server-side tarih kontrolü)
 */
export async function cancelBooking(bookingId: number): Promise<BookingResponse> {
  const supabase = createBrowserClient()

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'İşlem için giriş yapmalısınız.' }
  }

  try {
    // ✅ RPC fonksiyonu kullan (server-side tarih kontrolü)
    const { data, error } = await supabase.rpc('cancel_booking', {
      booking_id_param: bookingId
    })

    if (error) {
      console.error('Cancel Booking RPC Error:', error)
      return { success: false, message: 'Bağlantı hatası. Lütfen tekrar deneyin.' }
    }

    // RPC fonksiyonu JSON döndürür
    if (!data || data.status === 'error') {
      return { 
        success: false, 
        message: data?.message || 'Başvuru iptal edilemedi.' 
      }
    }

    return { success: true, message: data.message || 'Başvurunuz iptal edildi.' }

  } catch (err) {
    console.error('Unexpected Error:', err)
    return { success: false, message: 'Beklenmeyen bir hata oluştu.' }
  }
}

// ... diğer fonksiyonlar aynı kalabilir
```

---

### `src/modules/booking/hooks/useBooking.ts` - Düzeltilmiş Versiyon

```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { joinEvent, cancelBooking } from '@/modules/booking/api/booking.api'
import { createClient } from '@/utils/supabase/client'
import { useSession } from '@/modules/auth'  // ✅ Eklendi
import type { QueueStatus } from '../types/booking.types'

export function useJoinEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ eventId, consentKvkk, consentPayment }: {
      eventId: number, consentKvkk: boolean, consentPayment: boolean
    }) => {
      const result = await joinEvent(eventId, consentKvkk, consentPayment)
      if (!result.success) throw new Error(result.message)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-booking'] })
      queryClient.invalidateQueries({ queryKey: ['active-event'] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    }
  })
}

export function useCancelBooking() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (bookingId: number) => {
      const result = await cancelBooking(bookingId)
      if (!result.success) throw new Error(result.message)
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-booking'] })
      queryClient.invalidateQueries({ queryKey: ['active-event'] })
    }
  })
}

export function useUserBooking(eventId: number) {
  const supabase = createClient()
  const { user } = useSession()  // ✅ Auth kontrolü eklendi

  return useQuery({
    queryKey: ['user-booking', eventId, user?.id],  // ✅ user.id eklendi
    queryFn: async () => {
      if (!user) return null  // ✅ Giriş yapmamışsa null döndür

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)  // ✅ user_id kontrolü eklendi
        .maybeSingle()
      return data
    },
    enabled: !!user,  // ✅ Sadece giriş yapmış kullanıcılar için çalıştır
  })
}
```

---

### `src/modules/booking/types/booking.types.ts` - Güncellenmiş Versiyon

```typescript
/**
 * Booking Module Types
 */
import type { Database } from '@/shared/infrastructure/supabase/types'

export type Booking = Database['public']['Tables']['bookings']['Row']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

export enum QueueStatus {
  ASIL = 'ASIL',
  YEDEK = 'YEDEK',
  IPTAL = 'IPTAL'
}

export enum PaymentStatus {
  WAITING = 'WAITING',
  PAID = 'PAID'
}

export interface JoinEventResult {
  success: boolean
  queue?: QueueStatus
  message: string
  errorCode?: string  // ✅ Eklendi
  position?: number   // ✅ Eklendi
}

export interface BookingResponse {
  success: boolean
  message: string
  errorCode?: string  // ✅ Eklendi (opsiyonel)
}

// ... diğer type'lar aynı kalabilir
```

---

## ⏭️ Sıradaki Adım

**Review Roadmap'e göre bir sonraki adım:**

### 4. Admin Logic İncelemesi

Lütfen aşağıdaki dosyaları gönderin:

1. **`src/modules/admin/`** klasörü içindeki tüm dosyalar:
   - `api/` - Admin API çağrıları
   - `components/` - Admin bileşenleri
   - `hooks/` - Admin hook'ları
   - `types/` - Admin type tanımları
   - `utils/` - Admin utility fonksiyonları

2. **`actions/admin.ts`** - Server Actions (eğer varsa)

**Beklenen İnceleme Konuları:**
- Admin yetki kontrolü doğru mu?
- `assign_ticket()` RPC çağrısı doğru mu?
- `promote_from_waitlist()` kullanımı doğru mu?
- Excel export güvenli mi?

---

**Not:** Bu rapor, Booking modülünün kritik sorunlarını tespit etmiştir. **RPC parametre adı uyumsuzluğu** ve **yanıt formatı uyumsuzluğu** production'a çıkmadan önce mutlaka düzeltilmelidir.
