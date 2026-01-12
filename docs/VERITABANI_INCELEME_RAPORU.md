# TALPA Etkinlik Platformu - Veritabanı İnceleme Raporu

**Hazırlanma Tarihi:** 2026-01-04  
**İnceleyen:** Senior Software Architect  
**Kapsam:** `supabase/master_schema.sql`, `supabase/functions.sql`, `supabase/schema.sql`

---

## 📋 Dosya Analizi

### `supabase/master_schema.sql` (Ana Schema Dosyası)

**Dosyanın Rolü:** Projenin birincil veritabanı şeması. RLS politikaları, RPC fonksiyonları ve güvenlik mekanizmalarını içerir.

**Mimari Konumu:** Veritabanı katmanının temel taşı. Tüm iş mantığı bu şema üzerine kurulu.

**Versiyon:** 3.0.0 (2026-01-04)

---

## 📊 Puanlama: **78/100**

### Puanlama Detayları:
- ✅ **RLS Güvenliği:** 18/20 (get_my_admin_status() ile recursion çözülmüş)
- ✅ **Race Condition Koruması:** 20/20 (FOR UPDATE ve FOR UPDATE SKIP LOCKED kullanımı mükemmel)
- ⚠️ **Schema Tutarlılığı:** 12/20 (functions.sql ile çatışma var)
- ✅ **Hata Yönetimi:** 15/20 (Standart hata kodları, ancak bazı fonksiyonlarda eksik)
- ⚠️ **Dokümantasyon:** 8/15 (Yorumlar var ama yetersiz)
- ⚠️ **Profil Oluşturma:** 5/5 (Trigger eksik, migration_fix_profile_creation.sql'de var ama master_schema'da yok)

---

## 🐛 Tespit Edilen Sorunlar

### 🔴 KRİTİK (Acil Müdahale Gerektirir)

#### 1. Schema Versiyon Çatışması
**Dosya:** `supabase/functions.sql` vs `supabase/master_schema.sql`

**Sorun:**
- `functions.sql` eski schema'ya göre yazılmış (`tickets` tablosu, UUID event_id, `is_active` boolean)
- `master_schema.sql` yeni schema'yı kullanıyor (`bookings` tablosu, BIGINT event_id, `status` enum)
- İki dosya aynı anda çalıştırılırsa sistem çöker

**Risk:** 
- Veritabanı tutarsızlığı
- RPC fonksiyonlarının çalışmaması
- Production'da sistemin durması

**Çözüm:**
```sql
-- functions.sql dosyası ARŞİVLENMELİ veya SİLİNMELİ
-- Tüm RPC fonksiyonları master_schema.sql içinde birleştirilmeli
```

**Etkilenen Fonksiyonlar:**
- `purchase_ticket()` → `join_event()` ile değiştirilmeli
- `set_active_event(UUID)` → `set_active_event(BIGINT)` ile güncellenmeli
- `get_event_stats()` → Yeni schema'ya göre yeniden yazılmalı

---

#### 2. Profil Oluşturma Trigger'ı Eksik
**Dosya:** `supabase/master_schema.sql`

**Sorun:**
- Yeni kullanıcı kaydolduğunda `public.profiles` tablosuna otomatik kayıt oluşturan trigger yok
- `migration_fix_profile_creation.sql` dosyasında var ama master_schema'ya entegre edilmemiş

**Risk:**
- Kullanıcılar giriş yaptığında "Profil bulunamadı" hatası alacak
- RLS politikaları çalışmayacak (profiles tablosunda kayıt yok)
- Uygulama tamamen çökecek

**Çözüm:**
```sql
-- master_schema.sql'e eklenmeli (STEP 11 olarak)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        'member'
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

---

#### 3. `join_event()` Fonksiyonunda Tip Uyuşmazlığı Riski
**Dosya:** `supabase/master_schema.sql` (Satır 234-348)

**Sorun:**
- Fonksiyon `BIGINT` parametre bekliyor (`p_event_id BIGINT`)
- Ancak `events` tablosunda `id` kolonu `BIGINT` olarak tanımlı mı kontrol edilmeli
- `consolidated_schema.sql`'de `BIGINT` görünüyor ama `master_schema.sql`'de events tablosu tanımı yok

**Risk:**
- Fonksiyon çağrıldığında tip uyuşmazlığı hatası
- Runtime'da sistem çökmesi

**Çözüm:**
- `master_schema.sql`'e events tablosu tanımı eklenmeli veya
- `consolidated_schema.sql` ile birleştirilmeli

---

### 🟡 ORTA SEVİYE (İyileştirme Gerektirir)

#### 4. Hata Mesajlarında Tutarsızlık
**Dosya:** `supabase/master_schema.sql`

**Sorun:**
- `join_event()` fonksiyonunda standart hata kodları var (`error_code`, `message`)
- `set_active_event()` fonksiyonunda sadece `message` var, `error_code` yok
- `assign_ticket()` fonksiyonunda standart format kullanılmış

**Etki:** Frontend'de hata yönetimi zorlaşır, tutarsız API yanıtları

**Çözüm:** Tüm fonksiyonlarda standart JSON formatı:
```json
{
  "success": boolean,
  "error_code": string,
  "message": string,
  "details": string (optional)
}
```

---

#### 5. `promote_from_waitlist()` Fonksiyonunda Transaction Eksikliği
**Dosya:** `supabase/master_schema.sql` (Satır 450-532)

**Sorun:**
- Fonksiyon içinde birden fazla UPDATE işlemi var ama explicit transaction yok
- PostgreSQL otomatik transaction kullanıyor ama atomicity garantisi için BEGIN/COMMIT açık olmalı

**Etki:** Çok düşük risk, ancak edge case'lerde veri tutarsızlığı olabilir

**Çözüm:**
```sql
BEGIN
  -- ... mevcut kod ...
  UPDATE bookings SET queue_status = 'ASIL' WHERE id = v_next_waitlist_record.id;
  -- ... 
COMMIT;
```

---

#### 6. `assign_ticket()` Fonksiyonunda Index Eksikliği
**Dosya:** `supabase/master_schema.sql` (Satır 359-444)

**Sorun:**
- `ticket_pool` tablosunda `file_name` üzerinde sıralama yapılıyor (`ORDER BY file_name ASC`)
- Ancak `file_name` üzerinde index olmayabilir (consolidated_schema'da kontrol edilmeli)

**Etki:** Büyük veri setlerinde performans sorunu

**Çözüm:**
```sql
CREATE INDEX IF NOT EXISTS idx_ticket_pool_file_name 
ON public.ticket_pool(event_id, file_name) 
WHERE is_assigned = false;
```

---

### 🟢 DÜŞÜK SEVİYE (İyileştirme Önerileri)

#### 7. Dokümantasyon Eksikliği
**Sorun:** Fonksiyonların parametreleri, dönüş değerleri ve kullanım senaryoları yeterince dokümante edilmemiş

**Öneri:** Her fonksiyon için örnek kullanım ve edge case'ler eklenmeli

---

#### 8. `get_my_admin_status()` Fonksiyonunda Cache Eksikliği
**Sorun:** Her RLS kontrolünde veritabanı sorgusu yapılıyor

**Öneri:** PostgreSQL'in `STABLE` fonksiyon cache'i kullanılıyor (iyi), ancak application-level cache değerlendirilebilir

---

## 💡 İyileştirme Önerileri

### 1. Schema Birleştirme Stratejisi

**Öneri:** `consolidated_schema.sql` ve `master_schema.sql` birleştirilmeli, tek bir "source of truth" dosyası oluşturulmalı.

**Aksiyon:**
```bash
# 1. consolidated_schema.sql'deki tablo tanımlarını master_schema.sql'e ekle
# 2. functions.sql'i arşivle (kullanılmayacak)
# 3. Tek bir master_schema.sql dosyası ile devam et
```

---

### 2. Migration Stratejisi

**Sorun:** Birden fazla migration dosyası var, hangisinin çalıştırılacağı belirsiz

**Öneri:** 
- `master_schema.sql` → İlk kurulum için
- `migration_*.sql` → Artımsal güncellemeler için
- Her migration dosyasına versiyon numarası ekle

---

### 3. Test Senaryoları

**Eksik:** RPC fonksiyonları için unit test yok

**Öneri:** PostgreSQL'in `pgTAP` extension'ı kullanılarak test suite oluşturulmalı

---

### 4. Monitoring ve Logging

**Eksik:** RPC fonksiyonlarında hata loglama mekanizması yok

**Öneri:** Supabase'in `pg_stat_statements` extension'ı ile slow query monitoring

---

## 🛠️ Refactor Edilmiş Kod Bloğu

### `master_schema.sql` - Profil Trigger Eklentisi

```sql
-- ============================================
-- STEP 11: Auto-Profile Creation Trigger
-- ============================================
-- Bu trigger yeni kullanıcı kaydolduğunda otomatik profil oluşturur
-- RLS timing sorununu çözer

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, is_admin)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        'member',
        false
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail user creation
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Automatically create profile when new user signs up. Prevents RLS timing issues.';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 12: Standardize Error Response Format
-- ============================================
-- Tüm fonksiyonlarda tutarlı hata formatı kullanılmalı

-- set_active_event() fonksiyonu güncellenmeli:
CREATE OR REPLACE FUNCTION public.set_active_event(p_event_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_exists BOOLEAN;
BEGIN
  -- 1. Admin check using SECURITY DEFINER function
  IF NOT public.get_my_admin_status() THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'UNAUTHORIZED',  -- ✅ Eklendi
      'message', 'Bu işlem için yetkiniz yok.'
    );
  END IF;
  
  -- 2. Check if event exists
  SELECT EXISTS (
    SELECT 1 FROM events WHERE id = p_event_id
  ) INTO v_event_exists;
  
  IF NOT v_event_exists THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'EVENT_NOT_FOUND',  -- ✅ Eklendi
      'message', 'Etkinlik bulunamadı.'
    );
  END IF;
  
  -- 3. Deactivate all events first (atomic transaction)
  UPDATE events SET status = 'ARCHIVED' WHERE status = 'ACTIVE';
  
  -- 4. Activate the selected event
  UPDATE events 
  SET status = 'ACTIVE' 
  WHERE id = p_event_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Etkinlik aktif edildi.'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error_code', 'INTERNAL_ERROR',  -- ✅ Eklendi
      'message', 'Etkinlik aktif edilirken hata oluştu.',
      'details', SQLERRM
    );
END;
$$;
```

---

### `functions.sql` - Arşivleme Notu

```sql
-- ============================================
-- ⚠️ BU DOSYA ARTIK KULLANILMIYOR ⚠️
-- ============================================
-- Bu dosya eski schema'ya (UUID event_id, tickets tablosu) göre yazılmıştır.
-- Yeni schema'da (BIGINT event_id, bookings tablosu) bu fonksiyonlar geçersizdir.
--
-- YENİ FONKSİYONLAR: supabase/master_schema.sql içinde bulunmaktadır.
--
-- Migration Notları:
-- - purchase_ticket() → join_event() ile değiştirildi
-- - set_active_event(UUID) → set_active_event(BIGINT) ile güncellendi
-- - get_event_stats() → Yeni schema'ya göre yeniden yazılmalı
--
-- Tarih: 2026-01-04
-- ============================================
```

---

## ⏭️ Sıradaki Adım

**Review Roadmap'e göre bir sonraki adım:**

### 2. Auth & Security İncelemesi

Lütfen aşağıdaki dosyaları gönderin:

1. **`middleware.ts`** - Next.js middleware dosyası (rol kontrolü, yönlendirme)
2. **`src/modules/auth/`** klasörü içindeki tüm dosyalar:
   - `api/` - Auth API çağrıları
   - `components/` - Login/Register bileşenleri
   - `hooks/` - Auth hook'ları
   - `types/` - Auth type tanımları

**Beklenen İnceleme Konuları:**
- Middleware'de rol bazlı yönlendirme doğru mu?
- Auth state yönetimi güvenli mi?
- RLS politikaları ile frontend uyumlu mu?
- Profil oluşturma akışı doğru mu?

---

**Not:** Bu rapor, veritabanı katmanının kritik sorunlarını tespit etmiştir. **Faz 1 (Stabilizasyon)** maddelerinin tamamlanması production'a çıkmadan önce zorunludur.
