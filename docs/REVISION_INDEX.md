# Revizyon Dökümanları İndeksi

Bu doküman, Talpa Etkinlik Yönetim Sistemi revizyonu için oluşturulan tüm dökümanların indeksidir.

## Revizyon Gereksinimleri

Revizyon, aşağıdaki kaynak dökümanlara göre yapılmaktadır:
- `SRS.md` - Yazılım Gereksinim Spesifikasyonu
- `veritabani.md` - Veritabanı tasarımı ve SQL kodları
- `UI-UX.md` - Kullanıcı arayüzü ve deneyim gereksinimleri
- `plan.md` - Revizyon planı ve görev listesi

## Oluşturulan Dökümanlar

### 1. MIGRATION_GUIDE.md
**Amaç:** Veritabanı migrasyonu için adım adım rehber

**İçerik:**
- Enum tipleri oluşturma
- Tablo güncellemeleri
- Yeni tablolar (bookings, ticket_pool)
- RPC fonksiyonları
- RLS politikaları
- Storage bucket'ları
- Veri migrasyonu
- Geri alma planı
- Doğrulama adımları

**Kullanım:** Supabase SQL Editor'de adım adım çalıştırılacak SQL komutları.

---

### 2. IMPLEMENTATION_CHECKLIST.md
**Amaç:** Uygulama için detaylı kontrol listesi

**İçerik:**
- Veritabanı ve tip tanımları kontrol listesi
- Servis katmanı görevleri
- Frontend geliştirme görevleri
- Test senaryoları
- Performans optimizasyonları

**Kullanım:** Her görev tamamlandığında işaretlenmelidir.

---

### 3. REVISION_REQUIREMENTS.md
**Amaç:** Revizyon gereksinimlerinin detaylı analizi

**İçerik:**
- Kritik değişiklikler
- Veritabanı değişiklikleri
- API ve servis değişiklikleri
- Frontend değişiklikleri
- Güvenlik gereksinimleri
- Performans gereksinimleri
- Excel import gereksinimleri

**Kullanım:** Geliştirme sırasında referans olarak kullanılmalıdır.

---

### 4. TESTING_GUIDE.md
**Amaç:** Test senaryoları ve test adımları

**İçerik:**
- Test ortamı hazırlığı
- Birim testleri (RPC fonksiyonları)
- Entegrasyon testleri
- Kullanıcı senaryoları
- Performans testleri
- Güvenlik testleri
- Test verileri

**Kullanım:** Her test senaryosu uygulanmalı ve sonuçlar kaydedilmelidir.

---

### 5. DEVELOPER_SETUP.md
**Amaç:** Geliştirici kurulum rehberi

**İçerik:**
- Gereksinimler
- Proje kurulumu
- Supabase kurulumu
- Veritabanı migrasyonu
- Environment variables
- Geliştirme sunucusu
- Yaygın sorunlar ve çözümleri

**Kullanım:** Yeni geliştiriciler için başlangıç rehberi.

---

### 6. DATABASE.md (Güncellendi)
**Amaç:** Veritabanı şeması dokümantasyonu

**Değişiklikler:**
- `profiles` tablosu: `tckn`, `sicil_no` alanları eklendi
- `events` tablosu: `quota_asil`, `quota_yedek`, `cut_off_date`, `status` enum eklendi
- `bookings` tablosu: Yeni tablo (başvurular için)
- `ticket_pool` tablosu: Yeni tablo (PDF bilet havuzu için)
- RPC fonksiyonları: `join_event`, `assign_ticket`, `promote_from_waitlist`
- RLS politikaları: Yeni tablolar için politikalar

**Kullanım:** Veritabanı yapısını anlamak için referans.

---

## Revizyon Akışı

### Adım 1: Hazırlık
1. `DEVELOPER_SETUP.md` dosyasını okuyun
2. Geliştirme ortamını kurun
3. Supabase projesi oluşturun

### Adım 2: Veritabanı Migrasyonu
1. `MIGRATION_GUIDE.md` dosyasını takip edin
2. SQL komutlarını Supabase SQL Editor'de çalıştırın
3. Her adımdan sonra doğrulama yapın

### Adım 3: Kod Geliştirme
1. `IMPLEMENTATION_CHECKLIST.md` dosyasını açın
2. `REVISION_REQUIREMENTS.md` dosyasını referans alın
3. Görevleri sırayla tamamlayın
4. Her görev tamamlandığında işaretleyin

### Adım 4: Test
1. `TESTING_GUIDE.md` dosyasındaki senaryoları uygulayın
2. Tüm testleri geçtiğinden emin olun
3. Hataları düzeltin

### Adım 5: Dokümantasyon
1. Kod dokümantasyonunu güncelleyin
2. README dosyasını güncelleyin

## Önemli Notlar

### Veritabanı Değişiklikleri
- **Kritik:** Eski `tickets` tablosu artık kullanılmıyor
- **Yeni:** `bookings` ve `ticket_pool` tabloları kullanılıyor
- **ID Tipi:** `events` tablosu UUID'den BIGINT'e geçti

### API Değişiklikleri
- **Eski:** `purchase_ticket` RPC → **Yeni:** `join_event` RPC
- **Yeni:** `assign_ticket` RPC (bilet atama için)
- **Yeni:** `promote_from_waitlist` RPC (yedekten asile geçiş için)

### Frontend Değişiklikleri
- **Yeni Component:** `BookingModal` (başvuru onay modalı)
- **Yeni Component:** `BookingStatus` (durum göstergesi)
- **Yeni Component:** `TicketPoolManager` (bilet havuzu yönetimi)
- **Güncellenen:** `ActionZone` (buton mantığı değişti)

## Destek ve Sorular

Herhangi bir sorunuz veya belirsizlik varsa:
1. İlgili dökümanı tekrar okuyun
2. `REVISION_REQUIREMENTS.md` dosyasına bakın
3. Test senaryolarını kontrol edin

## Kaldırılan Dökümanlar

Aşağıdaki dökümanlar eski sistemi referans aldığı için kaldırılmıştır:
- `API_DOCUMENTATION.md` - Eski API'leri (buyTicket, purchase_ticket) dokümante ediyordu
- `API_GUIDE.md` - Eski API kullanımını gösteriyordu
- `SUPABASE_SETUP.md` - DEVELOPER_SETUP.md ile çakışıyordu ve eski şemayı referans alıyordu
- `DEPLOYMENT.md` - Eski veritabanı şemasını içeriyordu
- `ARCHITECTURE.md` - Eski mimariyi gösteriyordu
- `COMPONENTS.md` - Eski component yapısını dokümante ediyordu

Yeni sistem için güncel bilgiler yukarıdaki dökümanlarda bulunmaktadır.

## Sonraki Adımlar

Revizyon tamamlandıktan sonra:
1. Production ortamına deploy edin
2. Kullanıcı eğitimi yapın
3. Monitoring ve loglama kurun
4. Performans metriklerini takip edin

---

**Son Güncelleme:** 2025-01-XX

