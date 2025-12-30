# Veritabanı Dokümantasyonu

Bu doküman, TALPA Etkinlik Platformu'nun veritabanı şeması, RPC fonksiyonları ve iş kurallarını açıklar.

## İçindekiler

- [Veritabanı Şeması](#veritabanı-şeması)
- [RPC Fonksiyonları](#rpc-fonksiyonları)
- [Row Level Security (RLS)](#row-level-security-rls)
- [İş Kuralları](#iş-kuralları)
- [İlişkiler](#ilişkiler)

## Veritabanı Şeması

Veritabanı PostgreSQL üzerinde çalışır ve Supabase tarafından yönetilir. Tüm tablolar ilişkisel veri bütünlüğünü (Referential Integrity) koruyacak şekilde normalize edilmiştir.

### `profiles` Tablosu

Kullanıcı profil bilgilerini tutar. `auth.users` tablosu ile `id` üzerinden 1:1 ilişkilidir.

**Alanlar:**

| Alan | Tip | Açıklama | Kısıtlamalar |
|------|-----|----------|--------------|
| `id` | `uuid` | Kullanıcı ID'si (PK, FK → auth.users.id) | PRIMARY KEY, NOT NULL |
| `full_name` | `text` | Kullanıcının tam adı | NOT NULL |
| `talpa_sicil_no` | `text` | TALPA sicil numarası | NULL |
| `phone` | `text` | Telefon numarası | NULL |
| `role` | `text` | Kullanıcı rolü | NOT NULL, DEFAULT 'member' |
| `created_at` | `timestamp` | Oluşturulma tarihi | DEFAULT now() |
| `updated_at` | `timestamp` | Güncellenme tarihi | DEFAULT now() |

**Rol Değerleri:**
- `'admin'` - Yönetici, tüm işlemlere erişim
- `'member'` - Üye, sadece bilet satın alma

**Örnek Veri:**
```sql
INSERT INTO profiles (id, full_name, talpa_sicil_no, role)
VALUES ('user-uuid-123', 'Ahmet Yılmaz', '12345', 'member');
```

---

### `events` Tablosu

Etkinlik bilgilerini tutar.

**Alanlar:**

| Alan | Tip | Açıklama | Kısıtlamalar |
|------|-----|----------|--------------|
| `id` | `uuid` | Etkinlik ID'si (PK) | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `title` | `text` | Etkinlik başlığı | NOT NULL |
| `description` | `text` | Etkinlik açıklaması | NULL |
| `event_date` | `timestamptz` | Etkinlik tarihi ve saati | NOT NULL |
| `location` | `text` | Etkinlik konumu | NOT NULL |
| `price` | `numeric` | Bilet fiyatı | NOT NULL, CHECK (price >= 0) |
| `currency` | `text` | Para birimi | NOT NULL, DEFAULT 'TRY' |
| `total_quota` | `integer` | Toplam kontenjan | NOT NULL, CHECK (total_quota > 0) |
| `image_url` | `text` | Etkinlik görsel URL'si | NULL |
| `is_active` | `boolean` | Aktif etkinlik mi? | NOT NULL, DEFAULT false |
| `created_at` | `timestamp` | Oluşturulma tarihi | DEFAULT now() |
| `updated_at` | `timestamp` | Güncellenme tarihi | DEFAULT now() |

**Kritik Alan:**
- `is_active`: Sistemde o an hangi etkinliğin "Yayında" olduğunu belirler. Aynı anda sadece bir etkinlik aktif olabilir (iş kuralı).

**Örnek Veri:**
```sql
INSERT INTO events (title, event_date, location, price, total_quota, image_url, is_active)
VALUES (
  'TALPA Yıllık Toplantısı',
  '2025-06-15 19:00:00+03',
  'İstanbul Havacılık Müzesi',
  500.00,
  150,
  'https://example.com/image.jpg',
  true
);
```

---

### `tickets` Tablosu

Satın alınan biletleri tutar.

**Alanlar:**

| Alan | Tip | Açıklama | Kısıtlamalar |
|------|-----|----------|--------------|
| `id` | `uuid` | Bilet ID'si (PK) | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `event_id` | `uuid` | Etkinlik ID'si (FK) | NOT NULL, FOREIGN KEY → events.id |
| `user_id` | `uuid` | Kullanıcı ID'si (FK) | NOT NULL, FOREIGN KEY → profiles.id |
| `status` | `text` | Bilet durumu | NOT NULL, DEFAULT 'pending' |
| `qr_code` | `text` | QR kod değeri | NOT NULL, UNIQUE |
| `seat_number` | `text` | Koltuk numarası | NULL |
| `gate` | `text` | Kapı bilgisi | NULL |
| `purchase_date` | `timestamp` | Satın alma tarihi | NOT NULL, DEFAULT now() |
| `created_at` | `timestamp` | Oluşturulma tarihi | DEFAULT now() |
| `updated_at` | `timestamp` | Güncellenme tarihi | DEFAULT now() |

**Durum Değerleri:**
- `'pending'` - Beklemede
- `'paid'` - Ödendi
- `'cancelled'` - İptal edildi

**Örnek Veri:**
```sql
INSERT INTO tickets (event_id, user_id, status, qr_code, seat_number)
VALUES (
  'event-uuid-123',
  'user-uuid-456',
  'paid',
  'TALPA-2025-001',
  'A-15'
);
```

---

## RPC Fonksiyonları

RPC (Remote Procedure Call) fonksiyonları, veritabanı seviyesinde çalışan PostgreSQL fonksiyonlarıdır. Bu fonksiyonlar atomik işlemler ve iş kurallarını garanti altına alır.

### `purchase_ticket`

Atomik bilet satın alma işlemini gerçekleştirir. Race condition'ları önler ve stok kontrolü yapar.

**Fonksiyon İmzası:**
```sql
CREATE OR REPLACE FUNCTION purchase_ticket(
  p_event_id uuid,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
```

**Parametreler:**
- `p_event_id` (uuid): Satın alınacak etkinliğin ID'si
- `p_user_id` (uuid): Bilet alan kullanıcının ID'si

**Dönüş Değeri:**
- `uuid`: Oluşturulan biletin ID'si

**İş Mantığı:**
1. Etkinliğin mevcut olduğunu ve aktif olduğunu kontrol eder
2. Mevcut satılan bilet sayısını sayar (iptal edilenler hariç: `status != 'cancelled'`)
3. `total_quota` ile karşılaştırır
4. Eğer yer varsa:
   - Yeni bilet oluşturur
   - QR kod oluşturur (format: `TALPA-{YEAR}-{SEQUENCE}`)
   - Bilet ID'sini döner
5. Eğer yer yoksa: `SOLD_OUT` hatası fırlatır

**Transaction:**
Tüm işlemler tek bir database transaction içinde gerçekleşir. Hata olursa tüm işlem geri alınır (Rollback).

**Hata Durumları:**
- `SOLD_OUT` - Kontenjan dolmuş
- `EVENT_NOT_FOUND` - Etkinlik bulunamadı
- `EVENT_NOT_ACTIVE` - Etkinlik aktif değil

**Örnek Kullanım:**
```sql
SELECT purchase_ticket('event-uuid-123', 'user-uuid-456');
```

**Supabase'den Çağrı:**
```typescript
const { data: ticketId, error } = await supabase.rpc('purchase_ticket', {
  p_event_id: 'event-uuid-123',
  p_user_id: 'user-uuid-456'
});
```

---

### `set_active_event`

Belirtilen etkinliği aktif yapar ve diğer tüm etkinlikleri pasif yapar. "Single Active Event" prensibini garanti altına alır.

**Fonksiyon İmzası:**
```sql
CREATE OR REPLACE FUNCTION set_active_event(
  p_event_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
```

**Parametreler:**
- `p_event_id` (uuid): Aktif edilecek etkinliğin ID'si

**Dönüş Değeri:**
- `void`

**İş Mantığı:**
1. Etkinliğin mevcut olduğunu kontrol eder
2. Tüm etkinliklerin `is_active` değerini `false` yapar
3. Belirtilen etkinliğin `is_active` değerini `true` yapar
4. Tüm işlemler tek bir transaction içinde gerçekleşir

**Transaction:**
Atomik işlem garantisi sağlar. Aynı anda iki etkinlik aktif olamaz.

**Hata Durumları:**
- `EVENT_NOT_FOUND` - Etkinlik bulunamadı

**Örnek Kullanım:**
```sql
SELECT set_active_event('event-uuid-123');
```

**Supabase'den Çağrı:**
```typescript
const { error } = await supabase.rpc('set_active_event', {
  p_event_id: 'event-uuid-123'
});
```

---

## Row Level Security (RLS)

Row Level Security, Supabase'de veri erişimini satır seviyesinde kontrol eden bir güvenlik mekanizmasıdır. Her tablo için politikalar tanımlanır.

### `profiles` Tablosu RLS Politikaları

**SELECT Politikası:**
- Kullanıcılar kendi profilini görebilir: `auth.uid() = id`
- Adminler tüm profilleri görebilir: `(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'`

**UPDATE Politikası:**
- Kullanıcılar sadece kendi profilini güncelleyebilir: `auth.uid() = id`
- Adminler tüm profilleri güncelleyebilir

**INSERT Politikası:**
- Sadece sistem (RPC fonksiyonları) yeni profil oluşturabilir

---

### `events` Tablosu RLS Politikaları

**SELECT Politikası:**
- Herkes aktif etkinlikleri görebilir: `is_active = true`
- Adminler tüm etkinlikleri görebilir

**INSERT/UPDATE/DELETE Politikaları:**
- Sadece adminler etkinlik oluşturabilir, güncelleyebilir ve silebilir

---

### `tickets` Tablosu RLS Politikaları

**SELECT Politikası:**
- Kullanıcılar sadece kendi biletlerini görebilir: `auth.uid() = user_id`
- Adminler tüm biletleri görebilir

**INSERT Politikası:**
- Sadece `purchase_ticket` RPC fonksiyonu bilet oluşturabilir (`SECURITY DEFINER`)

**UPDATE Politikası:**
- Sadece adminler bilet durumunu güncelleyebilir

---

## İş Kuralları

### 1. Single Active Event Prensibi

**Kural:** Sistemde aynı anda sadece bir etkinlik aktif olabilir.

**Uygulama:**
- Veritabanı seviyesinde `set_active_event` RPC fonksiyonu ile garanti altına alınmıştır
- Admin bir etkinliği aktif ettiğinde, diğer tüm etkinlikler otomatik olarak pasif yapılır
- Transaction içinde gerçekleştiği için race condition riski yoktur

**Avantajları:**
- Kullanıcı deneyimi: Karmaşıklık yok, tek odak noktası
- Performans: Sadece aktif etkinlik sorgulanır
- Basitlik: Karmaşık filtreleme ve seçim mekanizmalarına gerek yok

---

### 2. Stok Yönetimi ve Race Condition Koruması

**Sorun:** Son bilet için aynı anda iki kullanıcının butona basması durumunda stok aşımı riski.

**Çözüm:** `purchase_ticket` RPC fonksiyonu atomik işlem kullanır.

**Mekanizma:**
1. Transaction başlatılır
2. Mevcut satılan bilet sayısı sayılır (LOCK ile)
3. Stok kontrolü yapılır
4. Eğer yer varsa bilet oluşturulur
5. Transaction commit edilir

**Garanti:**
- Aynı anda sadece bir işlem bilet oluşturabilir
- Stok aşımı imkansızdır
- Veri tutarlılığı korunur

---

### 3. QR Kod Benzersizliği

**Kural:** Her biletin benzersiz bir QR kodu olmalıdır.

**Uygulama:**
- `tickets.qr_code` alanı `UNIQUE` constraint'e sahiptir
- RPC fonksiyonu QR kod oluştururken benzersizlik kontrolü yapar
- Format: `TALPA-{YEAR}-{SEQUENCE}`

---

### 4. İptal Edilen Biletlerin Stok Hesaplaması

**Kural:** İptal edilen biletler stok hesaplamasına dahil edilmez.

**Uygulama:**
- `purchase_ticket` fonksiyonu stok sayımında `status != 'cancelled'` filtresi kullanır
- İptal edilen biletler kontenjanı etkilemez

---

## İlişkiler

### Foreign Key İlişkileri

```
auth.users (Supabase Auth)
    ↓ (1:1)
profiles
    ↓ (1:N)
tickets

events
    ↓ (1:N)
tickets
```

**Detaylar:**

1. **profiles ↔ auth.users**
   - `profiles.id` → `auth.users.id`
   - 1:1 ilişki
   - Kullanıcı oluşturulduğunda profil otomatik oluşturulmalı

2. **events ↔ tickets**
   - `tickets.event_id` → `events.id`
   - 1:N ilişki
   - Bir etkinlikte birden fazla bilet olabilir
   - Etkinlik silinirse biletler cascade delete edilir (opsiyonel)

3. **profiles ↔ tickets**
   - `tickets.user_id` → `profiles.id`
   - 1:N ilişki
   - Bir kullanıcının birden fazla bileti olabilir
   - Kullanıcı silinirse biletler cascade delete edilir (opsiyonel)

---

## Veri Bütünlüğü

### Constraints

1. **Primary Keys:** Tüm tablolarda UUID primary key
2. **Foreign Keys:** Referential integrity garantisi
3. **Unique Constraints:** QR kod benzersizliği
4. **Check Constraints:** 
   - `price >= 0`
   - `total_quota > 0`

### Triggers (Opsiyonel)

Gelecekte eklenebilecek trigger'lar:
- `updated_at` otomatik güncelleme
- Profil oluşturma trigger'ı (auth.users'dan)
- Bilet durumu değişikliği loglama

---

## Performans Optimizasyonları

### İndeksler

**Önerilen İndeksler:**

```sql
-- Etkinlik sorguları için
CREATE INDEX idx_events_is_active ON events(is_active) WHERE is_active = true;

-- Bilet sorguları için
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_status ON tickets(status) WHERE status != 'cancelled';

-- Profil sorguları için
CREATE INDEX idx_profiles_role ON profiles(role);
```

---

## Backup ve Recovery

### Backup Stratejisi

1. **Günlük Otomatik Backup:** Supabase otomatik olarak günlük backup alır
2. **Manuel Backup:** Supabase Dashboard'dan manuel backup alınabilir
3. **Schema Backup:** SQL dosyaları version control'de tutulmalı

### Recovery Senaryoları

1. **Veri Kaybı:** Supabase point-in-time recovery özelliği kullanılabilir
2. **Schema Değişikliği:** Migration script'leri ile geri alınabilir

---

**Son Güncelleme:** 2025-01-XX

