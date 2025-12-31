# Revizyon Gereksinimleri Detaylı Dökümanı

Bu doküman, SRS.md, veritabani.md, UI-UX.md ve plan.md dosyalarındaki gereksinimlerin detaylı analizini ve uygulama rehberini içerir.

## İçindekiler

- [Genel Bakış](#genel-bakış)
- [Kritik Değişiklikler](#kritik-değişiklikler)
- [Veritabanı Değişiklikleri](#veritabanı-değişiklikleri)
- [API ve Servis Değişiklikleri](#api-ve-servis-değişiklikleri)
- [Frontend Değişiklikleri](#frontend-değişiklikleri)
- [Güvenlik Gereksinimleri](#güvenlik-gereksinimleri)
- [Performans Gereksinimleri](#performans-gereksinimleri)

## Genel Bakış

### Mevcut Sistem

Mevcut sistem basit bir bilet satın alma akışına sahiptir:
- Tek bir aktif etkinlik
- Anında bilet satın alma (stok kontrolü ile)
- QR kodlu biletler
- Basit admin paneli

### Hedef Sistem

Yeni sistem kuyruk tabanlı bir başvuru ve onay sürecine sahiptir:
- Kuyruk sistemi (Asil/Yedek)
- Ödeme onayı sonrası bilet dağıtımı
- PDF bilet havuzu yönetimi
- Excel ile üye import
- KVKK/Ödeme onayları

## Kritik Değişiklikler

### 1. Bilet Satın Alma → Başvuru Sistemi

**Eski Akış:**
```
Kullanıcı → Bilet Al → Anında Bilet → QR Kod
```

**Yeni Akış:**
```
Kullanıcı → Başvuru Yap → Kuyruk (Asil/Yedek) → Ödeme Onayı → PDF Bilet Atama
```

**Etkilenen Bileşenler:**
- `tickets` tablosu → `bookings` tablosu
- `purchase_ticket` RPC → `join_event` RPC
- Anında bilet oluşturma → Kuyruk sistemi

### 2. Stok Yönetimi → Kuyruk Yönetimi

**Eski Sistem:**
- `total_quota` ile basit stok kontrolü
- Anında bilet oluşturma

**Yeni Sistem:**
- `quota_asil` ve `quota_yedek` ile iki seviyeli sistem
- Başvuru zamanına göre sıralama
- Yedekten asile otomatik geçiş

### 3. QR Kod → PDF Bilet

**Eski Sistem:**
- Sistem tarafından oluşturulan QR kodlu biletler

**Yeni Sistem:**
- Admin tarafından yüklenen PDF biletler
- Dosya adına göre sıralama ve atama
- Storage'da saklama

## Veritabanı Değişiklikleri

### Yeni Tablolar

#### `bookings` Tablosu

**Amaç:** Başvuruları ve kuyruk durumunu yönetmek

**Kritik Alanlar:**
- `booking_date`: Milisaniye bazında sıralama için
- `queue_status`: ASIL, YEDEK, IPTAL
- `payment_status`: WAITING, PAID
- `consent_kvkk` ve `consent_payment`: Yasal onaylar

**İş Kuralları:**
- Bir kullanıcı bir etkinliğe sadece bir başvuru yapabilir (UNIQUE constraint)
- Başvuru zamanına göre sıralama (First-Come, First-Served)

#### `ticket_pool` Tablosu

**Amaç:** PDF bilet havuzunu yönetmek

**Kritik Alanlar:**
- `file_name`: Sıralama için önemli (A1.pdf, A2.pdf...)
- `file_path`: Supabase Storage path
- `assigned_to`: Kime atandığı
- `is_assigned`: Atanma durumu

**İş Kuralları:**
- Dosya adına göre sıralama
- Atanmamış biletler önce çekilir
- Bir bilet sadece bir kişiye atanabilir

### Güncellenen Tablolar

#### `events` Tablosu

**Eklenen Alanlar:**
- `quota_asil`: Asil liste kontenjanı
- `quota_yedek`: Yedek liste kontenjanı
- `cut_off_date`: Son iptal tarihi
- `status`: DRAFT, ACTIVE, ARCHIVED enum
- `banner_image`: Afiş görseli path

**Kaldırılan/Kullanılmayan Alanlar:**
- `total_quota`: `quota_asil + quota_yedek` ile değiştirildi
- `is_active`: `status = 'ACTIVE'` ile değiştirildi

#### `profiles` Tablosu

**Eklenen Alanlar:**
- `tckn`: TC Kimlik No (UNIQUE)
- `sicil_no`: Dernek Sicil No (UNIQUE)

**Kullanım:**
- Excel import ile doldurulacak
- Unique constraint ile çakışma kontrolü

### Yeni RPC Fonksiyonları

#### `join_event(event_id_param BIGINT)`

**Amaç:** Kuyruk sistemine başvuru yapmak

**Özellikler:**
- Race condition koruması (FOR UPDATE lock)
- Otomatik Asil/Yedek belirleme
- Milisaniye bazında sıralama garantisi

**Dönüş Değeri:**
```json
{
  "status": "success" | "error",
  "queue": "ASIL" | "YEDEK",
  "message": "..."
}
```

#### `assign_ticket(booking_id_param BIGINT)`

**Amaç:** Ödeme onayı sonrası bilet atamak

**Özellikler:**
- Bilet havuzundan sıradaki PDF'i çeker
- Booking'i PAID olarak günceller
- Admin yetki kontrolü

**Dönüş Değeri:**
```json
{
  "status": "success" | "error",
  "ticket_id": 123,
  "file_path": "tickets/event-1/A1.pdf"
}
```

#### `promote_from_waitlist(event_id_param BIGINT)`

**Amaç:** İptal durumunda yedekten asile geçiş

**Özellikler:**
- İlk yedeği bulur (booking_date'e göre)
- Asil listeye çıkarır
- E-posta bildirimi tetikler (gelecekte)

## API ve Servis Değişiklikleri

### Yeni Server Actions

#### `actions/bookings.ts` (Yeni Dosya)

```typescript
// Başvuru yapma
export async function createBooking(
  eventId: number,
  consentKvkk: boolean,
  consentPayment: boolean
): Promise<{ success: boolean; message: string; queue?: string }>

// Kullanıcının başvurusunu getirme
export async function getUserBooking(
  eventId: number
): Promise<Booking | null>

// İptal etme
export async function cancelBooking(
  bookingId: number
): Promise<{ success: boolean; message: string }>
```

#### `actions/admin.ts` Güncellemeleri

```typescript
// Bilet atama
export async function assignTicketToBooking(
  bookingId: number
): Promise<{ success: boolean; message: string }>

// Toplu bilet atama
export async function assignTicketsBulk(
  bookingIds: number[]
): Promise<{ success: number; failed: number }>

// Excel export
export async function exportBookingsToExcel(
  eventId: number
): Promise<Blob>
```

#### `actions/storage.ts` (Yeni Dosya)

```typescript
// ZIP yükleme ve işleme
export async function uploadTicketPool(
  eventId: number,
  zipFile: File
): Promise<{ success: boolean; count: number }>

// Afiş yükleme
export async function uploadBanner(
  eventId: number,
  imageFile: File
): Promise<{ success: boolean; url: string }>
```

### Güncellenen Hooks

#### `src/hooks/useActiveEvent.ts`

```typescript
// Yeni alanlar: quota_asil, quota_yedek, cut_off_date, status
// Yeni hesaplamalar: Asil doluluk, Yedek sayısı
```

#### `src/hooks/useProfile.ts`

```typescript
// Yeni alanlar: tckn, sicil_no
```

## Frontend Değişiklikleri

### Yeni Componentler

#### `components/BookingModal.tsx`

**Amaç:** Başvuru onay modalı

**Özellikler:**
- KVKK checkbox
- Ödeme onayı checkbox (fiyat dinamik)
- Checkbox'lar seçilmeden buton aktif değil
- `join_event` RPC çağrısı

#### `components/BookingStatus.tsx`

**Amaç:** Kullanıcının başvuru durumunu göstermek

**Durumlar:**
- Başvurmamış
- Asil listede
- Yedek listede (sıra numarası ile)
- Kontenjan dolu

#### `components/admin/TicketPoolManager.tsx`

**Amaç:** Bilet havuzu yönetimi

**Özellikler:**
- ZIP yükleme
- Yüklenen dosyaların listesi
- Atanmamış bilet sayısı

#### `components/admin/BookingsTable.tsx`

**Amaç:** Başvurular tablosu

**Özellikler:**
- Sıralama: Başvuru zamanına göre
- Filtreleme: Asil/Yedek, Ödeme durumu
- İşlem butonları: Ödeme onayla, İptal et
- Excel export

### Güncellenen Componentler

#### `components/ActionZone.tsx`

**Değişiklikler:**
- "Bilet Al" → "Katıl" butonu
- Modal açma mantığı
- Durum gösterimi (Asil/Yedek)

#### `components/admin/EventsPanel.tsx`

**Değişiklikler:**
- Yeni form alanları: quota_asil, quota_yedek, cut_off_date
- Bilet havuzu yükleme alanı
- Status yönetimi (DRAFT, ACTIVE, ARCHIVED)

### Sayfa Güncellemeleri

#### `app/page.tsx` (Landing Page)

**Değişiklikler:**
- Aktif etkinlik kontrolü (`status = 'ACTIVE'`)
- Kullanıcı durumuna göre buton değişimi
- Booking durumu kontrolü

#### `app/admin/page.tsx`

**Değişiklikler:**
- Yeni metrikler: Asil doluluk, Yedek sayısı
- Bilet gönderim sayısı

#### `app/admin/tickets/page.tsx` (Yeni)

**Amaç:** Bilet yönetimi sayfası

**İçerik:**
- BookingsTable component
- Filtreleme ve arama
- Toplu işlemler

## Güvenlik Gereksinimleri

### RLS Politikaları

#### `bookings` Tablosu

```sql
-- Kullanıcılar sadece kendi başvurularını görebilir
CREATE POLICY "Users view own bookings"
ON public.bookings FOR SELECT
USING (auth.uid() = user_id);

-- Adminler tüm başvuruları yönetebilir
CREATE POLICY "Admins manage all bookings"
ON public.bookings FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
```

#### `ticket_pool` Tablosu

```sql
-- Kullanıcılar sadece kendine atanan bileti görebilir
CREATE POLICY "Users view assigned ticket"
ON public.ticket_pool FOR SELECT
USING (assigned_to = auth.uid());
```

### Race Condition Koruması

**Sorun:** 500 kişi aynı anda başvurursa kota aşılabilir.

**Çözüm:**
- `join_event` RPC fonksiyonu `FOR UPDATE` lock kullanır
- Transaction içinde atomik işlem
- Milisaniye bazında sıralama garantisi

### Input Validation

**Server Actions'da:**
- Form verileri doğrulanmalı
- SQL injection koruması (Supabase client)
- XSS koruması (React otomatik)

## Performans Gereksinimleri

### Database İndeksleri

```sql
-- Bookings sorguları için
CREATE INDEX idx_bookings_event_date ON public.bookings(event_id, booking_date ASC);
CREATE INDEX idx_bookings_queue_status ON public.bookings(event_id, queue_status);

-- Ticket pool sorguları için
CREATE INDEX idx_ticket_pool_unassigned ON public.ticket_pool(event_id, is_assigned) 
WHERE is_assigned = false;
```

### Query Optimizasyonu

**Sorun:** Büyük başvuru listelerinde yavaşlık

**Çözüm:**
- Pagination kullanılmalı
- Sadece gerekli alanlar çekilmeli
- Server Components kullanılmalı

### Storage Optimizasyonu

**Sorun:** PDF dosyaları büyük olabilir

**Çözüm:**
- Etkinlik tarihi geçtikten sonra otomatik silme
- CDN kullanımı (Supabase Storage)
- Signed URL'ler ile güvenli erişim

## Excel Import Gereksinimleri

### Format

**Gerekli Kolonlar:**
- TC Kimlik No
- Dernek Sicil No
- E-posta
- Ad Soyad

### İş Kuralları

1. **Unique Kontrolü:**
   - TC Kimlik No unique olmalı
   - Sicil No unique olmalı
   - E-posta unique olmalı

2. **Çakışma Yönetimi:**
   - Mevcut kayıt varsa ve bilgiler farklıysa → Hata
   - Mevcut kayıt varsa ve bilgiler aynıysa → Skip

3. **Kullanıcı Oluşturma:**
   - Supabase Auth'da kullanıcı oluşturulur
   - E-posta token gönderilir (şifre belirleme için)
   - `profiles` tablosuna kayıt eklenir

## E-posta Bildirimleri (Gelecek)

### Senaryolar

1. **Başvuru Onayı:**
   - Asil listeye alındıysa → "Başvurunuz alındı, ödeme bekleniyor"
   - Yedek listeye alındıysa → "Yedek listedesiniz, sıra: X"

2. **Yedekten Asile Geçiş:**
   - "Tebrikler! Asil listeye çıktınız, ödeme bekleniyor"

3. **Bilet Gönderimi:**
   - PDF bilet e-postaya eklenir
   - İndirme linki verilir

### Teknoloji

- Supabase Edge Functions (gelecekte)
- Resend veya SendGrid entegrasyonu

## Test Senaryoları

### 1. Kuyruk Sistemi Testi

**Senaryo:** 100 kişi aynı anda başvurur, asil kota 50.

**Beklenen:**
- İlk 50 kişi → Asil
- Sonraki 30 kişi → Yedek (yedek kota 30 ise)
- Kalan 20 kişi → "Kontenjan Dolu"

### 2. Race Condition Testi

**Senaryo:** Son asil kontenjan için 10 kişi aynı anda başvurur.

**Beklenen:**
- Sadece 1 kişi asil olur
- Diğerleri yedek veya "Kontenjan Dolu"

### 3. Bilet Atama Testi

**Senaryo:** Admin 10 başvuruyu onaylar, havuzda 10 PDF var.

**Beklenen:**
- Her başvuruya sırasıyla bilet atanır (A1.pdf → 1. başvuru)
- Tüm başvurular PAID olur

### 4. Yedekten Asile Geçiş Testi

**Senaryo:** Asil listeden biri iptal eder.

**Beklenen:**
- İlk yedek otomatik asile çıkar
- E-posta bildirimi gönderilir (gelecekte)

---

**Son Güncelleme:** 2025-01-XX

