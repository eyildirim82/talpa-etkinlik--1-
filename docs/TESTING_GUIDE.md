# Test Rehberi

Bu doküman, Talpa Etkinlik Yönetim Sistemi'nin revizyon sonrası test senaryolarını ve test adımlarını içerir.

## İçindekiler

- [Test Ortamı Hazırlığı](#test-ortamı-hazırlığı)
- [Birim Testleri](#birim-testleri)
- [Entegrasyon Testleri](#entegrasyon-testleri)
- [Kullanıcı Senaryoları](#kullanıcı-senaryoları)
- [Performans Testleri](#performans-testleri)
- [Güvenlik Testleri](#güvenlik-testleri)
- [Test Verileri](#test-verileri)

## Test Ortamı Hazırlığı

### Gereksinimler

1. **Supabase Test Projesi**
   - Ayrı bir Supabase projesi (production'dan ayrı)
   - Test verileri ile doldurulmuş

2. **Test Kullanıcıları**
   - En az 10 test kullanıcısı
   - 1 admin kullanıcı
   - Farklı durumlarda kullanıcılar (Asil, Yedek, Başvurmamış)

3. **Test Etkinliği**
   - Aktif bir etkinlik
   - Asil kota: 50
   - Yedek kota: 30
   - Cut-off tarihi: Gelecekte bir tarih

4. **Test Bilet Havuzu**
   - En az 100 PDF dosyası (ZIP formatında)
   - Dosya adları: A1.pdf, A2.pdf, ..., A100.pdf

## Birim Testleri

### 1. RPC Fonksiyon Testleri

#### `join_event` Fonksiyonu

**Test 1: Başarılı Asil Başvuru**
```sql
-- Test kullanıcısı ile giriş yap
-- RPC çağrısı
SELECT join_event(1); -- event_id = 1

-- Beklenen: {"status": "success", "queue": "ASIL"}
```

**Test 2: Yedek Listeye Düşme**
```sql
-- Asil kotayı doldur (50 başvuru)
-- Sonraki başvuru
SELECT join_event(1);

-- Beklenen: {"status": "success", "queue": "YEDEK"}
```

**Test 3: Kontenjan Dolu**
```sql
-- Hem asil hem yedek kotayı doldur
SELECT join_event(1);

-- Beklenen: {"status": "error", "message": "Kontenjan dolmuştur."}
```

**Test 4: Zaten Başvurmuş**
```sql
-- Aynı kullanıcı tekrar başvurur
SELECT join_event(1);

-- Beklenen: {"status": "error", "message": "Zaten başvurunuz var."}
```

**Test 5: Etkinlik Aktif Değil**
```sql
-- Etkinlik status = 'DRAFT'
SELECT join_event(1);

-- Beklenen: {"status": "error", "message": "Etkinlik aktif değil."}
```

#### `assign_ticket` Fonksiyonu

**Test 1: Başarılı Bilet Atama**
```sql
-- Admin ile giriş yap
-- Bir booking oluştur (payment_status = 'WAITING')
SELECT assign_ticket(1); -- booking_id = 1

-- Beklenen: {"status": "success", "ticket_id": 1, "file_path": "..."}
```

**Test 2: Bilet Stoku Yetersiz**
```sql
-- Tüm biletler atanmış
SELECT assign_ticket(1);

-- Beklenen: {"status": "error", "message": "Bilet stoku yetersiz."}
```

**Test 3: Yetkisiz Erişim**
```sql
-- Normal kullanıcı ile giriş yap
SELECT assign_ticket(1);

-- Beklenen: {"status": "error", "message": "Yetkisiz erişim."}
```

#### `promote_from_waitlist` Fonksiyonu

**Test 1: Yedekten Asile Geçiş**
```sql
-- Asil listeden birini iptal et
SELECT promote_from_waitlist(1); -- event_id = 1

-- Beklenen: {"status": "success", "user_id": "...", "message": "..."}
```

**Test 2: Yedek Liste Boş**
```sql
-- Yedek liste boşken çağır
SELECT promote_from_waitlist(1);

-- Beklenen: {"status": "info", "message": "Yedek liste boş."}
```

### 2. RLS Politikası Testleri

**Test: Kullanıcı Sadece Kendi Booking'ini Görebilir**
```sql
-- Kullanıcı A ile giriş yap
SELECT * FROM public.bookings WHERE user_id = 'user-b-id';

-- Beklenen: Boş sonuç (RLS engelliyor)
```

**Test: Admin Tüm Booking'leri Görebilir**
```sql
-- Admin ile giriş yap
SELECT * FROM public.bookings;

-- Beklenen: Tüm booking'ler görünüyor
```

## Entegrasyon Testleri

### 1. Başvuru Akışı Testi

**Adımlar:**
1. Kullanıcı giriş yapar
2. Ana sayfada aktif etkinliği görür
3. "Katıl" butonuna tıklar
4. Modal açılır
5. KVKK ve ödeme onaylarını işaretler
6. "Onaylıyorum ve Katıl" butonuna tıklar
7. Başarı mesajı görür
8. Durum butonu güncellenir (Asil/Yedek)

**Beklenen Sonuç:**
- Booking oluşturulur
- Kuyruk durumu doğru belirlenir
- UI güncellenir

### 2. Admin Bilet Atama Testi

**Adımlar:**
1. Admin giriş yapar
2. Admin panelinde başvuruları görür
3. Bir başvuruyu seçer
4. "Ödeme Onayla ve Bilet Gönder" butonuna tıklar
5. Başarı mesajı görür

**Beklenen Sonuç:**
- Booking `payment_status = 'PAID'` olur
- Bilet havuzundan sıradaki PDF atanır
- `ticket_pool.is_assigned = true` olur

### 3. Yedekten Asile Geçiş Testi

**Adımlar:**
1. Asil listede bir kullanıcı var
2. Yedek listede bir kullanıcı var
3. Admin asil listedeki kullanıcıyı iptal eder
4. Sistem otomatik olarak yedekten asile geçiş yapar

**Beklenen Sonuç:**
- Yedek listedeki ilk kullanıcı asil olur
- E-posta bildirimi gönderilir (gelecekte)

## Kullanıcı Senaryoları

### Senaryo 1: Başarılı Başvuru (Asil)

**Kullanıcı:** Ahmet Yılmaz (Üye)

**Adımlar:**
1. Ana sayfaya gider
2. Giriş yapar
3. "Katıl" butonuna tıklar
4. Onayları işaretler
5. Başvuruyu tamamlar

**Beklenen:**
- ✅ "Kaydınız alındı (ASİL)" mesajı
- ✅ Yeşil buton görünür
- ✅ "Ödeme onayından sonra biletiniz e-postanıza gelecektir" metni

### Senaryo 2: Yedek Listeye Düşme

**Kullanıcı:** Mehmet Demir (Üye)

**Ön Koşul:** Asil kota dolu

**Adımlar:**
1. Ana sayfaya gider
2. Giriş yapar
3. "Katıl" butonuna tıklar
4. Onayları işaretler
5. Başvuruyu tamamlar

**Beklenen:**
- ✅ "Yedek listedesiniz (SIRA: 1)" mesajı
- ✅ Sarı buton görünür
- ✅ Sıra numarası doğru gösterilir

### Senaryo 3: Kontenjan Dolu

**Kullanıcı:** Ayşe Kaya (Üye)

**Ön Koşul:** Hem asil hem yedek kota dolu

**Adımlar:**
1. Ana sayfaya gider
2. Giriş yapar
3. "Katıl" butonuna tıklar

**Beklenen:**
- ✅ "Kontenjan Dolu" mesajı
- ✅ Gri buton görünür (pasif)
- ✅ Başvuru yapılamaz

### Senaryo 4: Admin Etkinlik Oluşturma

**Kullanıcı:** Admin

**Adımlar:**
1. Admin paneline gider
2. "Yeni Etkinlik Oluştur" butonuna tıklar
3. Formu doldurur:
   - Etkinlik adı
   - Tarih/saat
   - Konum
   - Fiyat
   - Asil kota: 50
   - Yedek kota: 30
   - Cut-off tarihi
4. Afiş görseli yükler
5. Bilet havuzu ZIP'i yükler
6. "Yayına Al" butonuna tıklar

**Beklenen:**
- ✅ Etkinlik oluşturulur
- ✅ Status = 'ACTIVE' olur
- ✅ ZIP açılır ve PDF'ler yüklenir
- ✅ Ana sayfada görünür

### Senaryo 5: Admin Bilet Atama

**Kullanıcı:** Admin

**Ön Koşul:** Başvurular var, bilet havuzu dolu

**Adımlar:**
1. Admin paneline gider
2. "Başvurular" sekmesine gider
3. Ödeme bekleyen başvuruları görür
4. Bir başvuruyu seçer
5. "Ödeme Onayla ve Bilet Gönder" butonuna tıklar

**Beklenen:**
- ✅ Bilet atanır (A1.pdf → 1. başvuru)
- ✅ Booking `payment_status = 'PAID'` olur
- ✅ Kullanıcıya e-posta gönderilir (gelecekte)

## Performans Testleri

### 1. Eşzamanlı Başvuru Testi

**Amaç:** Race condition korumasını test etmek

**Test:**
- 100 kullanıcı aynı anda başvuru yapar
- Asil kota: 50

**Beklenen:**
- ✅ Sadece 50 kişi asil olur
- ✅ 30 kişi yedek olur (yedek kota 30 ise)
- ✅ 20 kişi "Kontenjan Dolu" alır
- ✅ Veri tutarlılığı korunur
- ✅ Hiçbir zaman kota aşımı olmaz

**Araç:** 
- Load testing tool (k6, Artillery vb.)
- Veya manuel olarak 100 tarayıcı sekmesi

### 2. Büyük Liste Performansı

**Test:**
- 1000 başvuru ile admin paneli açılır

**Beklenen:**
- ✅ Sayfa 2 saniye içinde yüklenir
- ✅ Tablo render edilir
- ✅ Filtreleme çalışır
- ✅ Pagination kullanılıyor (100 kayıt/sayfa)

### 3. ZIP Yükleme Performansı

**Test:**
- 500 PDF içeren ZIP dosyası yüklenir (50 MB)

**Beklenen:**
- ✅ Yükleme tamamlanır (5 dakika içinde)
- ✅ Tüm PDF'ler storage'a yüklenir
- ✅ `ticket_pool` tablosuna kaydedilir
- ✅ Progress indicator gösterilir

## Güvenlik Testleri

### 1. RLS Testleri

**Test: Kullanıcı Başkasının Booking'ini Göremez**
```sql
-- Kullanıcı A ile giriş yap
SELECT * FROM public.bookings WHERE id = 'booking-of-user-b';

-- Beklenen: Boş sonuç
```

**Test: Kullanıcı Başkasının Biletini Göremez**
```sql
-- Kullanıcı A ile giriş yap
SELECT * FROM public.ticket_pool WHERE assigned_to = 'user-b-id';

-- Beklenen: Boş sonuç
```

### 2. Yetki Testleri

**Test: Normal Kullanıcı Admin İşlemi Yapamaz**
- Normal kullanıcı ile `assign_ticket` RPC çağrılır
- Beklenen: "Yetkisiz erişim" hatası

**Test: Misafir Başvuru Yapamaz**
- Giriş yapmadan `join_event` çağrılır
- Beklenen: "Giriş yapmalısınız" hatası

### 3. SQL Injection Testi

**Test:**
- Form alanlarına SQL injection denemeleri yapılır
- Örnek: `'; DROP TABLE bookings; --`

**Beklenen:**
- ✅ Supabase client SQL injection'ı önler
- ✅ Hata mesajı gösterilir
- ✅ Veritabanı etkilenmez

### 4. XSS Testi

**Test:**
- Form alanlarına XSS payload'ları girilir
- Örnek: `<script>alert('XSS')</script>`

**Beklenen:**
- ✅ React otomatik olarak escape eder
- ✅ Script çalışmaz

## Test Verileri

### Örnek Test Kullanıcıları

```sql
-- Admin
INSERT INTO public.profiles (id, full_name, email, is_admin, tckn, sicil_no)
VALUES (
  'admin-uuid',
  'Admin User',
  'admin@talpa.org',
  true,
  '12345678901',
  'ADMIN001'
);

-- Üye 1 (Asil listede)
INSERT INTO public.profiles (id, full_name, email, is_admin, tckn, sicil_no)
VALUES (
  'user-1-uuid',
  'Ahmet Yılmaz',
  'ahmet@example.com',
  false,
  '11111111111',
  'MEMBER001'
);

-- Üye 2 (Yedek listede)
INSERT INTO public.profiles (id, full_name, email, is_admin, tckn, sicil_no)
VALUES (
  'user-2-uuid',
  'Mehmet Demir',
  'mehmet@example.com',
  false,
  '22222222222',
  'MEMBER002'
);
```

### Örnek Test Etkinliği

```sql
INSERT INTO public.events (
  id, title, description, event_date, location_url, price,
  quota_asil, quota_yedek, cut_off_date, status, banner_image
)
VALUES (
  1,
  'Test Etkinliği',
  'Bu bir test etkinliğidir',
  NOW() + INTERVAL '30 days',
  'https://maps.google.com/...',
  500.00,
  50,  -- Asil kota
  30,  -- Yedek kota
  NOW() + INTERVAL '25 days',  -- Cut-off
  'ACTIVE',
  'event-banners/test-banner.jpg'
);
```

### Örnek Test Booking'leri

```sql
-- Asil listede 50 kişi
-- (Döngü ile oluşturulabilir)
INSERT INTO public.bookings (event_id, user_id, queue_status, payment_status, consent_kvkk, consent_payment)
VALUES (1, 'user-1-uuid', 'ASIL', 'WAITING', true, true);

-- Yedek listede 30 kişi
INSERT INTO public.bookings (event_id, user_id, queue_status, payment_status, consent_kvkk, consent_payment)
VALUES (1, 'user-2-uuid', 'YEDEK', 'WAITING', true, true);
```

## Test Checklist

### Ön Hazırlık
- [ ] Test ortamı hazırlandı
- [ ] Test kullanıcıları oluşturuldu
- [ ] Test etkinliği oluşturuldu
- [ ] Test bilet havuzu yüklendi

### Birim Testler
- [ ] `join_event` fonksiyonu test edildi
- [ ] `assign_ticket` fonksiyonu test edildi
- [ ] `promote_from_waitlist` fonksiyonu test edildi
- [ ] RLS politikaları test edildi

### Entegrasyon Testler
- [ ] Başvuru akışı test edildi
- [ ] Admin bilet atama test edildi
- [ ] Yedekten asile geçiş test edildi

### Kullanıcı Senaryoları
- [ ] Senaryo 1: Başarılı başvuru (Asil)
- [ ] Senaryo 2: Yedek listeye düşme
- [ ] Senaryo 3: Kontenjan dolu
- [ ] Senaryo 4: Admin etkinlik oluşturma
- [ ] Senaryo 5: Admin bilet atama

### Performans Testler
- [ ] Eşzamanlı başvuru testi
- [ ] Büyük liste performansı
- [ ] ZIP yükleme performansı

### Güvenlik Testler
- [ ] RLS testleri
- [ ] Yetki testleri
- [ ] SQL injection testi
- [ ] XSS testi

---

**Son Güncelleme:** 2025-01-XX

