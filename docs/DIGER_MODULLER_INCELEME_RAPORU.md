# TALPA Etkinlik Platformu - Diğer Modüller İnceleme Raporu

**Hazırlanma Tarihi:** 2026-01-04  
**İnceleyen:** Senior Software Architect  
**Kapsam:** `src/modules/ticket`, `src/modules/event`, `src/modules/file-processing`, `src/modules/payment`, `src/modules/profile`, `src/modules/reporting`, `src/modules/notification`

---

## 📋 Modül Özeti

| Modül | Durum | Puan | Kritik Sorunlar |
|-------|-------|------|-----------------|
| **ticket** | ⚠️ Riskli | 75/100 | RPC parametre uyumsuzluğu, yanıt formatı hatası |
| **event** | 🟡 İyi | 80/100 | Admin kontrolü tekrarı, N+1 query |
| **file-processing** | 🔴 Kritik | 65/100 | Edge Function güvenlik açığı |
| **payment** | 🟢 Placeholder | N/A | Henüz implement edilmemiş |
| **profile** | ✅ İyi | 90/100 | Sorun yok |
| **reporting** | 🟡 İyi | 78/100 | Admin kontrolü tekrarı, N+1 query |
| **notification** | ✅ İyi | 85/100 | Küçük iyileştirmeler gerekli |

---

## 🐛 Modül Bazlı Detaylı İnceleme

### 1. TICKET MODÜLÜ

**Dosya:** `src/modules/ticket/api/ticket.api.ts`

#### 🔴 KRİTİK: RPC Parametre Adı Uyumsuzluğu
**Satır:** 29-30

**Sorun:**
- `assign_ticket` RPC çağrısı `booking_id_param` parametresiyle yapılıyor
- Veritabanında `master_schema.sql` fonksiyonu `p_booking_id` parametresi bekliyor

**Çözüm:**
```typescript
const { data, error } = await supabase.rpc('assign_ticket', {
  p_booking_id: bookingId  // ✅ Düzeltildi
})
```

#### 🔴 KRİTİK: RPC Yanıt Formatı Uyumsuzluğu
**Satır:** 38-39

**Sorun:**
- `data.status === 'error'` kontrolü yapılıyor
- Veritabanı `success: false` döndürüyor

**Çözüm:**
```typescript
if (!data || data.success === false) {
  return { success: false, message: data?.message || 'Bilet atanamadı.' }
}
```

#### ⚠️ ORTA: Admin Kontrolü Kod Tekrarı
**Satır:** 5-17

**Sorun:** Her modülde aynı `checkAdmin()` fonksiyonu tekrar ediliyor

**Çözüm:** Merkezi `@/modules/auth/utils/admin.utils` kullanılmalı

---

### 2. EVENT MODÜLÜ

**Dosya:** `src/modules/event/api/event.api.ts`

#### ⚠️ ORTA: Admin Kontrolü Kod Tekrarı
**Satır:** 5-18

**Sorun:** Her modülde aynı `checkAdmin()` fonksiyonu tekrar ediliyor

**Çözüm:** Merkezi utility kullanılmalı

#### ⚠️ ORTA: N+1 Query Sorunu
**Satır:** 48-58 (`getActiveEvent` fonksiyonu)

**Sorun:**
- Her event için 2 ayrı sorgu yapılıyor (asil_count, yedek_count)
- View kullanılıyor ama fallback'te N+1 sorunu var

**Mevcut Kod:**
```typescript
const { count: asilCount } = await supabase
  .from('bookings')
  .select('*', { count: 'exact', head: true })
  .eq('event_id', data.id)
  .eq('queue_status', 'ASIL')

const { count: yedekCount } = await supabase
  .from('bookings')
  .select('*', { count: 'exact', head: true })
  .eq('event_id', data.id)
  .eq('queue_status', 'YEDEK')
```

**Çözüm:** Tek sorguda grupla ve say:
```typescript
const { data: bookings } = await supabase
  .from('bookings')
  .select('queue_status')
  .eq('event_id', data.id)

const asilCount = bookings?.filter(b => b.queue_status === 'ASIL').length || 0
const yedekCount = bookings?.filter(b => b.queue_status === 'YEDEK').length || 0
```

#### ⚠️ ORTA: `getEventStats` Fonksiyonunda N+1 Query
**Satır:** 164-180

**Sorun:** 3 ayrı sorgu yapılıyor (asil_count, yedek_count, paid_count)

**Çözüm:** Tek sorguda grupla ve say (yukarıdaki gibi)

#### ✅ İYİ: `setActiveEvent` RPC Kullanımı
**Satır:** 129-131

**Not:** RPC parametre adı doğru (`p_event_id`)

---

### 3. FILE-PROCESSING MODÜLÜ

**Dosya:** `src/modules/file-processing/api/file-processing.api.ts`  
**Edge Function:** `supabase/functions/process-zip/index.ts`

#### 🔴 KRİTİK: Edge Function Güvenlik Açığı
**Dosya:** `supabase/functions/process-zip/index.ts` (Satır 31-50)

**Sorun:**
- Edge Function'da admin kontrolü **disabled/bypassed**
- Yorum satırında "Optional double check" yazıyor ama kontrol yapılmıyor
- Service Role Key kullanılıyor ama kullanıcı kontrolü yok
- Herkes ZIP yükleyebilir (eğer JWT verify kapalıysa)

**Mevcut Kod:**
```typescript
// Verify User is Admin (Optional double check, though Service Key bypasses RLS, 
// we should check if the caller is authorized if we were using anon key, 
// but here we expect the client to call with some auth. 
// For now, we trust the caller has the right info or we rely on the function being protected by Verify JWT 
// and checking the user role. But since we use Service Role inside, we are powerful.)

// Better: Check the Visualization of the JWT sent by client
const authHeader = req.headers.get('Authorization')
if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
        // ❌ Hata durumunda bile devam ediyor!
        // For simplicity in this implementation, we proceed.
    }
}
```

**Risk:**
- Yetkisiz kullanıcılar ZIP yükleyebilir
- Sistem güvenliği açığı
- Ticket pool'a yetkisiz erişim

**Çözüm:**
```typescript
// supabase/functions/process-zip/index.ts - Düzeltilmiş versiyon
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // ✅ ÖNCE: Admin kontrolü yap (Service Role ile)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // ✅ JWT'den kullanıcıyı al
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Authorization header required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid token' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // ✅ Admin kontrolü yap (RPC fonksiyonu kullan)
        const { data: isAdmin, error: adminCheckError } = await supabaseAdmin.rpc('get_my_admin_status')

        if (adminCheckError || !isAdmin) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized: Admin access required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
            )
        }

        // ✅ Artık işleme devam edebiliriz
        const { event_id, storage_path } = await req.json()
        // ... rest of the code
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
```

#### ⚠️ ORTA: Admin Kontrolü Kod Tekrarı
**Satır:** 5-17

**Sorun:** Her modülde aynı `checkAdmin()` fonksiyonu tekrar ediliyor

---

### 4. PAYMENT MODÜLÜ

**Dosya:** `src/modules/payment/api/payment.api.ts`

#### ✅ PLACEHOLDER: Henüz Implement Edilmemiş
**Durum:** Modül sadece placeholder fonksiyon içeriyor

**Not:** Gelecekte payment gateway entegrasyonu (iyzico, Stripe, vb.) için hazırlanmış

**Öneri:** Production'a çıkmadan önce implement edilmeli veya modül kaldırılmalı

---

### 5. PROFILE MODÜLÜ

**Dosya:** `src/modules/profile/api/profile.api.ts`

#### ✅ İYİ: Sorun Yok
**Durum:** Basit profil sorgusu, RLS politikaları koruma sağlıyor

**Not:** Önceki raporda `useSession` hook'una profil bilgisi eklenmesi önerilmişti

---

### 6. REPORTING MODÜLÜ

**Dosya:** `src/modules/reporting/api/reporting.api.ts`

#### ⚠️ ORTA: Admin Kontrolü Kod Tekrarı
**Satır:** 5-17

**Sorun:** Her modülde aynı `checkAdmin()` fonksiyonu tekrar ediliyor

#### ⚠️ ORTA: N+1 Query Sorunu
**Satır:** 41-57 (`getEventStats` fonksiyonu)

**Sorun:** 3 ayrı sorgu yapılıyor (asil_count, yedek_count, paid_count)

**Çözüm:** Tek sorguda grupla ve say (event modülündeki gibi)

#### 🔴 KRİTİK: Event Modülü ile Kod Tekrarı
**Sorun:** `getEventStats` fonksiyonu `event.api.ts`'de de var, kod tekrarı

**Çözüm:** Ortak utility fonksiyonu oluşturulmalı veya birinden kaldırılmalı

---

### 7. NOTIFICATION MODÜLÜ

**Dosya:** `src/modules/notification/api/notification.api.ts`

#### ✅ İYİ: Temel Yapı Doğru
**Durum:** Edge Function çağrısı doğru yapılmış

#### 🟢 DÜŞÜK: Hata Yönetimi İyileştirilebilir
**Sorun:** Edge Function yanıt formatı kontrol edilmiyor

**Öneri:**
```typescript
if (!data || !data.success) {
    return { success: false, message: data?.error || 'E-posta gönderilemedi.' }
}
```

---

## 📊 Genel Sorunlar ve Çözümler

### 1. Admin Kontrolü Kod Tekrarı (Tüm Modüller)

**Sorun:** 6 modülde aynı `checkAdmin()` fonksiyonu tekrar ediliyor:
- `ticket/api/ticket.api.ts`
- `event/api/event.api.ts`
- `file-processing/api/file-processing.api.ts`
- `admin/api/admin.api.ts`
- `reporting/api/reporting.api.ts`

**Çözüm:** Merkezi utility oluşturulmalı (önceki raporda önerilmişti):

```typescript
// src/modules/auth/utils/admin.utils.ts
import { createBrowserClient } from '@/shared/infrastructure/supabase'

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
```

**Kullanım:**
```typescript
// Tüm modüllerde
import { checkAdmin } from '@/modules/auth/utils/admin.utils'

// checkAdmin() fonksiyonunu kaldır, import et
```

---

### 2. N+1 Query Sorunu (Event, Reporting Modülleri)

**Sorun:** Her event için ayrı sorgular yapılıyor

**Çözüm:** Tek sorguda grupla ve say veya PostgreSQL view kullan

---

### 3. RPC Parametre Adı Uyumsuzlukları

**Tespit Edilen Sorunlar:**
- ✅ `join_event`: `event_id_param` → `p_event_id` (booking modülünde düzeltildi)
- ✅ `assign_ticket`: `booking_id_param` → `p_booking_id` (admin modülünde tespit edildi)
- ✅ `promote_from_waitlist`: `event_id_param` → `p_event_id` (admin modülünde tespit edildi)
- ✅ `set_active_event`: `p_event_id` (doğru, event modülünde)

**Çözüm:** Tüm RPC çağrılarını `master_schema.sql`'deki parametre adlarına göre güncelle

---

### 4. RPC Yanıt Formatı Uyumsuzlukları

**Sorun:** Bazı modüllerde `data.status === 'error'` kontrolü yapılıyor, bazılarında `data.success === false`

**Çözüm:** Tüm modüllerde `success` field'ı kontrol edilmeli

---

## 🛠️ Öncelikli Aksiyonlar

### Faz 1: Kritik Güvenlik Düzeltmeleri (ACİL)

1. ✅ **Edge Function Admin Kontrolü** (`process-zip/index.ts`)
   - Admin kontrolü zorunlu hale getirilmeli
   - RPC fonksiyonu (`get_my_admin_status`) kullanılmalı

2. ✅ **RPC Parametre Adları**
   - `assign_ticket`: `p_booking_id`
   - `promote_from_waitlist`: `p_event_id`

3. ✅ **RPC Yanıt Formatı**
   - Tüm modüllerde `success` field'ı kontrol edilmeli

### Faz 2: Kod Kalitesi İyileştirmeleri

1. ✅ **Merkezi Admin Utility**
   - `src/modules/auth/utils/admin.utils.ts` oluşturulmalı
   - Tüm modüllerde kullanılmalı

2. ✅ **N+1 Query Sorunları**
   - Event modülünde `getActiveEvent` ve `getEventStats` düzeltilmeli
   - Reporting modülünde `getEventStats` düzeltilmeli

3. ✅ **Kod Tekrarı**
   - `getEventStats` fonksiyonu event ve reporting modüllerinde tekrar ediyor
   - Ortak utility oluşturulmalı

### Faz 3: Eksik Özellikler

1. ⚠️ **Payment Modülü**
   - Implement edilmeli veya kaldırılmalı

---

## 📈 Modül Bazlı Puanlama Detayları

### Ticket Modülü: 75/100
- ✅ Temel yapı: 18/20
- ⚠️ RPC Entegrasyonu: 12/20 (Parametre uyumsuzluğu)
- ⚠️ Güvenlik: 15/20 (Admin kontrolü tekrarı)
- ✅ Type Safety: 18/20
- ✅ State Yönetimi: 12/15

### Event Modülü: 80/100
- ✅ Temel yapı: 18/20
- ✅ RPC Entegrasyonu: 18/20
- ⚠️ Performans: 12/20 (N+1 query)
- ⚠️ Güvenlik: 15/20 (Admin kontrolü tekrarı)
- ✅ Type Safety: 17/20

### File-Processing Modülü: 65/100
- ✅ Temel yapı: 15/20
- 🔴 Güvenlik: 8/20 (Edge Function açığı)
- ⚠️ Admin Kontrolü: 12/20 (Tekrar)
- ✅ Edge Function Entegrasyonu: 15/20
- ✅ Hata Yönetimi: 15/20

### Payment Modülü: N/A
- Placeholder durumda

### Profile Modülü: 90/100
- ✅ Temel yapı: 20/20
- ✅ Güvenlik: 18/20
- ✅ Type Safety: 18/20
- ✅ Performans: 17/20
- ✅ State Yönetimi: 17/20

### Reporting Modülü: 78/100
- ✅ Temel yapı: 18/20
- ⚠️ Performans: 12/20 (N+1 query)
- ⚠️ Güvenlik: 15/20 (Admin kontrolü tekrarı)
- ⚠️ Kod Tekrarı: 13/20 (Event modülü ile)
- ✅ Type Safety: 20/20

### Notification Modülü: 85/100
- ✅ Temel yapı: 18/20
- ✅ Edge Function Entegrasyonu: 17/20
- ✅ Hata Yönetimi: 15/20
- 🟢 İyileştirme: 15/20 (Yanıt formatı kontrolü)

---

## ⏭️ Sonuç ve Öneriler

**Genel Durum:** Modüller genel olarak iyi yapılandırılmış ancak kritik güvenlik açıkları ve kod tekrarları var.

**Öncelikli Aksiyonlar:**
1. 🔴 **Edge Function güvenlik açığı** (process-zip) - ACİL
2. 🔴 **RPC parametre adı uyumsuzlukları** - ACİL
3. ⚠️ **Merkezi admin utility** - YÜKSEK
4. ⚠️ **N+1 query sorunları** - ORTA
5. 🟢 **Payment modülü** - DÜŞÜK (henüz kullanılmıyor)

**Tahmini Düzeltme Süresi:**
- Faz 1 (Kritik): 2-4 saat
- Faz 2 (Kod Kalitesi): 4-6 saat
- Faz 3 (Eksik Özellikler): 8-16 saat (payment implement)

---

**Not:** Bu rapor, önceki modül incelemeleriyle birlikte tüm projenin durumunu kapsar. Tüm kritik sorunlar production'a çıkmadan önce mutlaka düzeltilmelidir.
