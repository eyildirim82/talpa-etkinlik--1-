# TALPA Etkinlik Platformu - Admin Modülü İnceleme Raporu

**Hazırlanma Tarihi:** 2026-01-04  
**İnceleyen:** Senior Software Architect  
**Kapsam:** `src/modules/admin/`

---

## 📋 Dosya Analizi

### `src/modules/admin/` (Admin Logic Modülü)

**Dosyanın Rolü:** Admin paneli işlemlerini yönetir. Bilet atama, yedek listesi yönetimi, etkinlik yönetimi ve Excel export.

**Mimari Konumu:** Modüler monolitik yapının admin katmanı. Kritik güvenlik kontrolleri burada.

**Modül Yapısı:**
- `api/admin.api.ts` - Admin API çağrıları
- `hooks/useAdmin.ts` - React Query hook'ları
- `utils/admin.utils.ts` - Admin utility fonksiyonları
- `components/` - Admin UI bileşenleri
- `types/admin.types.ts` - Type tanımları

---

## 📊 Puanlama: **78/100**

### Puanlama Detayları:
- ⚠️ **RPC Entegrasyonu:** 14/20 (Parametre adı uyumsuzlukları var)
- ⚠️ **Güvenlik:** 15/20 (Client-side Excel export riski, admin kontrolü tekrar ediyor)
- ✅ **State Yönetimi:** 18/20 (React Query kullanımı doğru)
- ⚠️ **Performans:** 12/20 (N+1 query sorunu var)
- ✅ **Type Safety:** 16/20 (TypeScript kullanımı iyi)

---

## 🐛 Tespit Edilen Sorunlar

### 🔴 KRİTİK (Acil Müdahale Gerektirir)

#### 1. RPC Parametre Adı Uyumsuzlukları
**Dosya:** `src/modules/admin/utils/admin.utils.ts` (Satır 10-11)

**Sorun:**
- `promote_from_waitlist` RPC çağrısı `event_id_param` parametresiyle yapılıyor
- Veritabanında `master_schema.sql` fonksiyonu `p_event_id` parametresi bekliyor
- Bu uyumsuzluk RPC çağrısının başarısız olmasına neden olur

**Mevcut Kod:**
```typescript
// admin.utils.ts - Satır 10-11
const { data, error } = await supabase.rpc('promote_from_waitlist', {
  event_id_param: eventId  // ❌ Yanlış parametre adı
})
```

**Veritabanı Fonksiyonu:**
```sql
-- master_schema.sql - Satır 450
CREATE OR REPLACE FUNCTION public.promote_from_waitlist(p_event_id BIGINT)
-- ✅ Fonksiyon p_event_id bekliyor
```

**Risk:**
- RPC çağrısı başarısız olur
- Yedek listeden asil listeye geçiş yapılamaz
- İptal edilen başvurulardan sonra yedek liste güncellenmez

**Çözüm:**
```typescript
// admin.utils.ts - Düzeltilmiş versiyon
const { data, error } = await supabase.rpc('promote_from_waitlist', {
  p_event_id: eventId  // ✅ Doğru parametre adı
})
```

---

#### 2. `assignTicket` RPC Parametre Adı Uyumsuzluğu
**Dosya:** `src/modules/ticket/api/ticket.api.ts` (Satır 29-30)

**Sorun:**
- `assign_ticket` RPC çağrısı `booking_id_param` parametresiyle yapılıyor
- Veritabanında `master_schema.sql` fonksiyonu `p_booking_id` parametresi bekliyor

**Mevcut Kod:**
```typescript
// ticket.api.ts - Satır 29-30
const { data, error } = await supabase.rpc('assign_ticket', {
  booking_id_param: bookingId  // ❌ Yanlış parametre adı
})
```

**Veritabanı Fonksiyonu:**
```sql
-- master_schema.sql - Satır 359
CREATE OR REPLACE FUNCTION public.assign_ticket(p_booking_id BIGINT)
-- ✅ Fonksiyon p_booking_id bekliyor
```

**Risk:**
- RPC çağrısı başarısız olur
- Adminler bilet atayamaz
- Ödeme onayı sonrası bilet atama işlemi çalışmaz

**Çözüm:**
```typescript
// ticket.api.ts - Düzeltilmiş versiyon
const { data, error } = await supabase.rpc('assign_ticket', {
  p_booking_id: bookingId  // ✅ Doğru parametre adı
})
```

---

#### 3. RPC Yanıt Formatı Uyumsuzluğu
**Dosya:** `src/modules/admin/utils/admin.utils.ts` (Satır 19-20), `src/modules/ticket/api/ticket.api.ts` (Satır 38-39)

**Sorun:**
- Frontend'de `data.status === 'error'` kontrolü yapılıyor
- Veritabanı fonksiyonları `success: false` döndürüyor, `status` field'ı yok
- Bu kontrol hiçbir zaman true olmaz, hatalar yakalanmaz

**Mevcut Kod:**
```typescript
// admin.utils.ts - Satır 19-20
if (data.status === 'error') {  // ❌ data.status hiçbir zaman 'error' olmaz
  return { success: false, message: data.message || 'Yedekten asile geçiş yapılamadı.' }
}
```

**Veritabanı Fonksiyonu Yanıt Formatı:**
```json
// master_schema.sql - Başarılı durum
{
  "success": true,
  "user_id": "uuid",
  "booking_id": 123,
  "message": "Yedek listeden asil listeye çıkarıldı."
}

// master_schema.sql - Hata durumu
{
  "success": false,
  "error_code": "WAITLIST_EMPTY",
  "message": "Yedek liste boş."
}
```

**Risk:**
- Hata durumları yakalanmaz
- Kullanıcıya yanlış mesaj gösterilir
- Sistem davranışı belirsiz

**Çözüm:**
```typescript
// admin.utils.ts - Düzeltilmiş versiyon
export async function promoteFromWaitlist(eventId: number): Promise<AdminResponse> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc('promote_from_waitlist', {
    p_event_id: eventId  // ✅ Parametre adı düzeltildi
  })

  if (error) {
    console.error('Promote Waitlist RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  // ✅ DÜZELTME: success field'ını kontrol et (status değil)
  if (!data || data.success === false) {
    return { 
      success: false, 
      message: data?.message || 'Yedekten asile geçiş yapılamadı.' 
    }
  }

  return { 
    success: true, 
    message: data.message || 'Yedek listeden asile çıkarıldı.' 
  }
}
```

---

#### 4. Excel Export Client-Side Güvenlik Riski
**Dosya:** `src/modules/admin/api/admin.api.ts` (Satır 56-105)

**Sorun:**
- Excel export işlemi tamamen client-side yapılıyor
- Admin kontrolü client-side yapılıyor (kolayca bypass edilebilir)
- Hassas veriler (TC Kimlik No, e-posta) client tarafında işleniyor

**Mevcut Kod:**
```typescript
export async function exportBookingsToExcel(eventId: number): Promise<Blob | null> {
  const isAdmin = await checkAdmin()  // ❌ Client-side admin kontrolü
  if (!isAdmin) {
    return null
  }
  // ... Excel oluşturma client-side
}
```

**Risk:**
- Client-side admin kontrolü bypass edilebilir
- Hassas veriler client tarafında işleniyor
- XLSX kütüphanesi client bundle'ına ekleniyor (performans)

**Çözüm:**
```typescript
// Öneri: Edge Function kullan (server-side)
export async function exportBookingsToExcel(eventId: number): Promise<Blob | null> {
  const supabase = createBrowserClient()
  
  // Edge Function'a istek gönder (server-side admin kontrolü)
  const { data, error } = await supabase.functions.invoke('export-bookings', {
    body: { eventId }
  })

  if (error || !data.success) {
    console.error('Export Error:', error)
    return null
  }

  // Base64 string'i Blob'a çevir
  const binaryString = atob(data.excelBase64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  
  return new Blob([bytes], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
}
```

**Alternatif (Daha Basit):** RPC fonksiyonu kullanarak server-side export yapılabilir.

---

### 🟡 ORTA SEVİYE (İyileştirme Gerektirir)

#### 5. Admin Kontrolü Kod Tekrarı
**Dosya:** `src/modules/admin/api/admin.api.ts` (Satır 8-20)

**Sorun:**
- Her modülde aynı `checkAdmin()` fonksiyonu tekrar ediliyor
- Auth modülünde merkezi utility oluşturulması önerilmişti ama admin modülünde hala tekrar ediyor

**Çözüm:** Auth modülündeki `admin.utils.ts` dosyasını kullanmalı (önceki raporda önerilmişti).

---

#### 6. `useAdminEvents` Hook'unda N+1 Query Sorunu
**Dosya:** `src/modules/admin/hooks/useAdmin.ts` (Satır 25-59)

**Sorun:**
- Her event için 3 ayrı sorgu yapılıyor (asil_count, yedek_count, paid_count)
- Event sayısı N ise, toplam sorgu sayısı 1 + (N * 3) olur
- Büyük veri setlerinde performans sorunu

**Mevcut Kod:**
```typescript
const eventsWithCounts = await Promise.all(
  (data || []).map(async (event) => {
    // ❌ Her event için 3 ayrı sorgu
    const { count: asilCount } = await eventSupabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('queue_status', 'ASIL')

    const { count: yedekCount } = await eventSupabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('queue_status', 'YEDEK')

    const { count: paidCount } = await eventSupabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id)
      .eq('payment_status', 'PAID')
    // ...
  })
)
```

**Etki:**
- 10 event için 31 sorgu (1 + 10*3)
- 100 event için 301 sorgu (1 + 100*3)
- Yavaş yükleme süreleri

**Çözüm:**
```typescript
export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async (): Promise<AdminEvent[]> => {
      const supabase = createBrowserClient()
      
      // ✅ Tek sorguda tüm event'leri ve booking sayılarını al
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (eventsError) throw eventsError

      // ✅ Tek sorguda tüm booking'leri al (event_id ve status ile grupla)
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('event_id, queue_status, payment_status')

      if (bookingsError) throw bookingsError

      // ✅ Client-side'da grupla ve say
      const bookingCounts = (bookings || []).reduce((acc, booking) => {
        const eventId = booking.event_id
        if (!acc[eventId]) {
          acc[eventId] = { asil: 0, yedek: 0, paid: 0 }
        }
        if (booking.queue_status === 'ASIL') acc[eventId].asil++
        if (booking.queue_status === 'YEDEK') acc[eventId].yedek++
        if (booking.payment_status === 'PAID') acc[eventId].paid++
        return acc
      }, {} as Record<number, { asil: number; yedek: number; paid: number }>)

      // ✅ Event'lere sayıları ekle
      return (events || []).map(event => ({
        ...event,
        asil_count: bookingCounts[event.id]?.asil || 0,
        yedek_count: bookingCounts[event.id]?.yedek || 0,
        paid_count: bookingCounts[event.id]?.paid || 0,
        image_url: event.banner_image,
        location: event.location_url,
        total_quota: event.quota_asil + event.quota_yedek,
        is_active: event.status === 'ACTIVE',
        sold_tickets: (bookingCounts[event.id]?.asil || 0) + (bookingCounts[event.id]?.yedek || 0)
      }))
    },
  })
}
```

**Daha İyi Çözüm:** PostgreSQL view veya RPC fonksiyonu kullanarak server-side'da hesaplama yapılabilir.

---

#### 7. `cancelBooking` Fonksiyonunda RLS Kontrolü Eksikliği
**Dosya:** `src/modules/admin/api/admin.api.ts` (Satır 25-51)

**Sorun:**
- Admin kontrolü client-side yapılıyor
- RLS politikaları koruma sağlıyor ama client-side kontrol güvenilir değil
- RPC fonksiyonu kullanılmıyor (doğrudan UPDATE yapılıyor)

**Mevcut Kod:**
```typescript
export async function cancelBooking(bookingId: number, eventId: number): Promise<AdminResponse> {
  const isAdmin = await checkAdmin()  // ❌ Client-side kontrol
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  
  // ❌ Doğrudan UPDATE (RPC kullanılmıyor)
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ queue_status: 'IPTAL', payment_status: 'WAITING' })
    .eq('id', bookingId)
}
```

**Risk:**
- Client-side admin kontrolü bypass edilebilir
- RLS politikaları koruma sağlıyor ama tutarsızlık var

**Çözüm:** RPC fonksiyonu kullanılmalı (eğer varsa) veya en azından admin kontrolü RPC ile yapılmalı.

---

#### 8. `useSetActiveEvent` Hook'unda Hata Yönetimi
**Dosya:** `src/modules/admin/hooks/useAdmin.ts` (Satır 185-207)

**Sorun:**
- RPC yanıt formatı kontrolü eksik
- `data.error` field'ı kontrol ediliyor ama `master_schema.sql`'de `error_code` kullanılıyor

**Mevcut Kod:**
```typescript
if (!data.success) {
  throw new Error(data.error || 'Etkinlik aktif edilemedi.')  // ❌ data.error yok
}
```

**Çözüm:**
```typescript
if (!data || data.success === false) {
  throw new Error(data?.message || data?.error_code || 'Etkinlik aktif edilemedi.')
}
```

---

### 🟢 DÜŞÜK SEVİYE (İyileştirme Önerileri)

#### 9. `BookingsTable` Component'inde Alert Kullanımı
**Sorun:** `alert()` ve `confirm()` kullanılıyor, modern UI için toast notification tercih edilmeli

---

#### 10. Type Safety İyileştirmesi
**Sorun:** Bazı yerlerde `any` tipi kullanılıyor (`booking as any`)

---

## 💡 İyileştirme Önerileri

### 1. Merkezi Admin Utility Kullanımı

**Öneri:** Auth modülündeki `admin.utils.ts` dosyasını kullanmalı (önceki raporda oluşturulmuştu).

**Aksiyon:**
```typescript
// admin.api.ts - Güncellenmiş versiyon
import { checkAdmin } from '@/modules/auth/utils/admin.utils'  // ✅ Merkezi utility

// checkAdmin() fonksiyonunu kaldır, import et
```

---

### 2. RPC Yanıt Formatı Standardizasyonu

**Öneri:** Tüm RPC fonksiyonları aynı formatı kullanmalı (önceki raporda önerilmişti).

---

### 3. Excel Export Edge Function

**Öneri:** Excel export işlemi Edge Function'a taşınmalı (server-side güvenlik).

---

## 🛠️ Refactor Edilmiş Kod Bloğu

### `src/modules/admin/utils/admin.utils.ts` - Düzeltilmiş Versiyon

```typescript
import { createBrowserClient } from '@/shared/infrastructure/supabase'
import type { AdminResponse } from '../types/admin.types'

/**
 * Promote first yedek to asil (admin only)
 * ✅ DÜZELTME: Parametre adı ve yanıt formatı düzeltildi
 */
export async function promoteFromWaitlist(eventId: number): Promise<AdminResponse> {
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc('promote_from_waitlist', {
    p_event_id: eventId  // ✅ Parametre adı düzeltildi
  })

  if (error) {
    console.error('Promote Waitlist RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  // ✅ DÜZELTME: success field'ını kontrol et (status değil)
  if (!data || data.success === false) {
    return { 
      success: false, 
      message: data?.message || 'Yedekten asile geçiş yapılamadı.' 
    }
  }

  return { 
    success: true, 
    message: data.message || 'Yedek listeden asile çıkarıldı.' 
  }
}
```

---

### `src/modules/ticket/api/ticket.api.ts` - Düzeltilmiş Versiyon

```typescript
/**
 * Assign ticket from pool to booking (admin only)
 * ✅ DÜZELTME: Parametre adı ve yanıt formatı düzeltildi
 */
export async function assignTicket(bookingId: number): Promise<TicketResponse> {
  const isAdmin = await checkAdmin()
  if (!isAdmin) {
    return { success: false, message: 'Yetkisiz erişim.' }
  }
  const supabase = createBrowserClient()

  const { data, error } = await supabase.rpc('assign_ticket', {
    p_booking_id: bookingId  // ✅ Parametre adı düzeltildi
  })

  if (error) {
    console.error('Assign Ticket RPC Error:', error)
    return { success: false, message: 'Bağlantı hatası.' }
  }

  // ✅ DÜZELTME: success field'ını kontrol et (status değil)
  if (!data || data.success === false) {
    return { 
      success: false, 
      message: data?.message || 'Bilet atanamadı.' 
    }
  }

  return { 
    success: true, 
    message: data.message || 'Bilet başarıyla atandı.',
    ticket_id: data.ticket_id,
    file_path: data.file_path
  }
}
```

---

### `src/modules/admin/hooks/useAdmin.ts` - Performans İyileştirmesi

```typescript
/**
 * Get all events for admin
 * ✅ DÜZELTME: N+1 query sorunu çözüldü
 */
export function useAdminEvents() {
  return useQuery({
    queryKey: ['admin', 'events'],
    queryFn: async (): Promise<AdminEvent[]> => {
      const supabase = createBrowserClient()
      
      // ✅ Tek sorguda tüm event'leri al
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (eventsError) throw eventsError

      // ✅ Tek sorguda tüm booking'leri al
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('event_id, queue_status, payment_status')

      if (bookingsError) throw bookingsError

      // ✅ Client-side'da grupla ve say
      const bookingCounts = (bookings || []).reduce((acc, booking) => {
        const eventId = booking.event_id
        if (!acc[eventId]) {
          acc[eventId] = { asil: 0, yedek: 0, paid: 0 }
        }
        if (booking.queue_status === 'ASIL') acc[eventId].asil++
        if (booking.queue_status === 'YEDEK') acc[eventId].yedek++
        if (booking.payment_status === 'PAID') acc[eventId].paid++
        return acc
      }, {} as Record<number, { asil: number; yedek: number; paid: number }>)

      // ✅ Event'lere sayıları ekle
      return (events || []).map(event => ({
        ...event,
        asil_count: bookingCounts[event.id]?.asil || 0,
        yedek_count: bookingCounts[event.id]?.yedek || 0,
        paid_count: bookingCounts[event.id]?.paid || 0,
        image_url: event.banner_image,
        location: event.location_url,
        total_quota: event.quota_asil + event.quota_yedek,
        is_active: event.status === 'ACTIVE',
        sold_tickets: (bookingCounts[event.id]?.asil || 0) + (bookingCounts[event.id]?.yedek || 0)
      }))
    },
  })
}
```

---

## ⏭️ Sıradaki Adım

**Review Roadmap'e göre bir sonraki adım:**

### 5. Frontend/UI İncelemesi

Lütfen aşağıdaki dosyaları gönderin:

1. **`components/`** klasöründeki kritik bileşenler:
   - Ana sayfa bileşenleri
   - Event listesi/gösterimi
   - Kullanıcı profil bileşenleri

2. **`src/components/`** klasörü (eğer varsa)

**Beklenen İnceleme Konuları:**
- Inline style kullanımı
- Component yapısı ve modülerlik
- State yönetimi
- Performans optimizasyonları

---

**Not:** Bu rapor, Admin modülünün kritik sorunlarını tespit etmiştir. **RPC parametre adı uyumsuzlukları** ve **yanıt formatı uyumsuzluğu** production'a çıkmadan önce mutlaka düzeltilmelidir.
