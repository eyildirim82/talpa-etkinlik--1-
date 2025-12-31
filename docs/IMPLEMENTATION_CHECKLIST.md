# Uygulama Kontrol Listesi

Bu doküman, SRS.md, veritabani.md, UI-UX.md ve plan.md'deki gereksinimlerin uygulanması için detaylı kontrol listesidir.

## İçindekiler

- [Veritabanı ve Tip Tanımları](#veritabanı-ve-tip-tanımları)
- [Servis Katmanı ve Mantık](#servis-katmanı-ve-mantık)
- [Ön Yüz: İskelet ve Yönlendirme](#ön-yüz-iskelet-ve-yönlendirme)
- [Ön Yüz: Sayfa Geliştirmeleri](#ön-yüz-sayfa-geliştirmeleri)
- [Test ve Doğrulama](#test-ve-doğrulama)

## Veritabanı ve Tip Tanımları

### Supabase SQL Çalıştırma

- [ ] **Enum Tipleri Oluşturuldu**
  - [ ] `event_status` enum: DRAFT, ACTIVE, ARCHIVED
  - [ ] `queue_status` enum: ASIL, YEDEK, IPTAL
  - [ ] `payment_status` enum: WAITING, PAID

- [ ] **Profiles Tablosu Güncellendi**
  - [ ] `tckn` alanı eklendi (UNIQUE)
  - [ ] `sicil_no` alanı eklendi (UNIQUE)
  - [ ] `is_admin` alanı kontrol edildi (varsa)

- [ ] **Events Tablosu Güncellendi**
  - [ ] `quota_asil` alanı eklendi (INT, NOT NULL)
  - [ ] `quota_yedek` alanı eklendi (INT, NOT NULL)
  - [ ] `cut_off_date` alanı eklendi (TIMESTAMPTZ, NOT NULL)
  - [ ] `status` alanı eklendi (event_status enum)
  - [ ] `banner_image` alanı eklendi (TEXT)

- [ ] **Ticket Pool Tablosu Oluşturuldu**
  - [ ] Tablo oluşturuldu
  - [ ] `event_id` foreign key eklendi
  - [ ] `file_name` alanı eklendi (sıralama için önemli)
  - [ ] `file_path` alanı eklendi (Storage path)
  - [ ] `assigned_to` foreign key eklendi
  - [ ] İndeksler oluşturuldu

- [ ] **Bookings Tablosu Oluşturuldu**
  - [ ] Tablo oluşturuldu
  - [ ] `event_id` ve `user_id` foreign key'ler eklendi
  - [ ] `booking_date` alanı eklendi (sıralama için)
  - [ ] `queue_status` enum alanı eklendi
  - [ ] `payment_status` enum alanı eklendi
  - [ ] `consent_kvkk` ve `consent_payment` boolean alanları eklendi
  - [ ] UNIQUE constraint: (event_id, user_id)
  - [ ] İndeksler oluşturuldu

- [ ] **RPC Fonksiyonları Oluşturuldu**
  - [ ] `join_event(event_id_param BIGINT)` - Kuyruk sistemi
  - [ ] `assign_ticket(booking_id_param BIGINT)` - Bilet atama
  - [ ] `promote_from_waitlist(event_id_param BIGINT)` - Yedekten asile geçiş

- [ ] **RLS Politikaları Güncellendi**
  - [ ] `profiles` tablosu için RLS politikaları
  - [ ] `bookings` tablosu için RLS politikaları
  - [ ] `ticket_pool` tablosu için RLS politikaları

- [ ] **Storage Bucket'ları Oluşturuldu**
  - [ ] `event-banners` bucket (Public: Yes)
  - [ ] `tickets` bucket (Public: No)

### Tip Güncellemesi

- [ ] **src/types/supabase.ts Güncellendi**
  - [ ] `Database` interface'i yeni şemaya göre güncellendi
  - [ ] `events` tablosu için yeni tip tanımları
  - [ ] `bookings` tablosu için tip tanımları
  - [ ] `ticket_pool` tablosu için tip tanımları
  - [ ] `profiles` tablosu için güncellenmiş tip tanımları
  - [ ] Enum tipleri tanımlandı

- [ ] **Domain Types Oluşturuldu**
  - [ ] `src/types/event.ts` - Event interface
  - [ ] `src/types/booking.ts` - Booking interface
  - [ ] `src/types/profile.ts` - Profile interface
  - [ ] `src/types/ticket.ts` - Ticket interface

## Servis Katmanı ve Mantık

### RPC Entegrasyonu

- [ ] **join_event Servisi**
  - [ ] `src/api/events.ts` içinde `joinEvent()` fonksiyonu
  - [ ] KVKK ve ödeme onaylarını parametre olarak alıyor
  - [ ] Hata yönetimi implementasyonu
  - [ ] TypeScript tip güvenliği

- [ ] **assign_ticket Servisi**
  - [ ] `src/api/admin.ts` içinde `assignTicket()` fonksiyonu
  - [ ] Admin yetki kontrolü
  - [ ] Bilet atama mantığı
  - [ ] E-posta gönderme entegrasyonu (gelecekte)

- [ ] **promote_from_waitlist Servisi**
  - [ ] `src/api/admin.ts` içinde `promoteFromWaitlist()` fonksiyonu
  - [ ] İptal durumunda otomatik çağrılma
  - [ ] E-posta bildirimi (gelecekte)

### Auth Servisi

- [ ] **Admin Kontrolü**
  - [ ] `useAdmin()` hook güncellendi
  - [ ] `is_admin` alanı kontrol ediliyor
  - [ ] Server Actions'da admin kontrolü

- [ ] **Profil Servisi**
  - [ ] `useProfile()` hook güncellendi
  - [ ] `tckn` ve `sicil_no` alanları destekleniyor
  - [ ] Profil güncelleme fonksiyonları

### Storage Servisi

- [ ] **Bilet Havuzu Yükleme**
  - [ ] ZIP dosyası yükleme fonksiyonu
  - [ ] ZIP içindeki PDF'leri çıkarma (JSZip veya Edge Function)
  - [ ] Dosyaları Supabase Storage'a yükleme
  - [ ] `ticket_pool` tablosuna kayıt ekleme
  - [ ] Dosya adına göre sıralama

- [ ] **Afiş Yükleme**
  - [ ] `event-banners` bucket'ına yükleme
  - [ ] URL döndürme
  - [ ] `events.banner_image` alanını güncelleme

- [ ] **Bilet İndirme**
  - [ ] Kullanıcıya atanan bileti indirme
  - [ ] RLS kontrolü
  - [ ] Signed URL oluşturma

## Ön Yüz: İskelet ve Yönlendirme

### Layout Düzenlemesi

- [ ] **Responsive Tasarım**
  - [ ] Tüm sayfalar mobil öncelikli
  - [ ] Tailwind CSS responsive breakpoint'ler kullanılıyor
  - [ ] Mobilde sticky footer çalışıyor

- [ ] **Routing Kontrolü**
  - [ ] `/` - Landing Page (Ana Sayfa)
  - [ ] `/login` - Giriş Sayfası
  - [ ] `/admin` - Admin Paneli
  - [ ] `/admin/events` - Etkinlik Yönetimi
  - [ ] `/admin/tickets` - Bilet Yönetimi
  - [ ] `/ticket/[id]` - Bilet Görüntüleme (opsiyonel)

### Middleware

- [ ] **middleware.ts Güncellendi**
  - [ ] Session yönetimi çalışıyor
  - [ ] Admin route koruması (gelecekte)

## Ön Yüz: Sayfa Geliştirmeleri

### Login (Giriş)

- [ ] **Login.tsx Revizesi**
  - [ ] Tasarım UI-UX.md ile uyumlu
  - [ ] Header: Logo ve butonlar
  - [ ] Form: TC Kimlik No veya E-Posta + Şifre
  - [ ] "Şifremi Unuttum / İlk Giriş" linki
  - [ ] E-posta token akışı (gelecekte)

### Landing Page (Ana Sayfa)

- [ ] **Hero Section**
  - [ ] Aktif etkinlik varsa detayları gösteriliyor
  - [ ] Etkinlik yoksa "Etkinlik Yok" uyarısı
  - [ ] Durum etiketi (Badge): BAŞVURUYA AÇIK, DOLMAK ÜZERE, KONTENJAN DOLU

- [ ] **Durum Yönetimi (State Machine)**
  - [ ] Misafir -> [BİLET ALMAK İÇİN GİRİŞ YAP] butonu
  - [ ] Üye (Başvurmamış) -> [HEMEN KATIL] butonu (Modal açar)
  - [ ] Asil Liste -> [✅ KAYDINIZ ALINDI (ASİL)] (Yeşil, pasif)
  - [ ] Yedek Liste -> [⚠️ YEDEK LİSTEDESİNİZ (SIRA: X)] (Sarı, pasif)
  - [ ] Dolu -> [❌ KONTENJAN DOLU] (Gri, pasif)

- [ ] **Başvuru Modalı**
  - [ ] Modal component oluşturuldu
  - [ ] KVKK checkbox'ı
  - [ ] Ödeme onayı checkbox'ı (fiyat dinamik)
  - [ ] Checkbox'lar seçilmeden buton aktif olmuyor
  - [ ] [VAZGEÇ] ve [ONAYLIYORUM VE KATIL] butonları
  - [ ] `join_event` RPC fonksiyonunu çağırıyor
  - [ ] Başarı/hata mesajları gösteriliyor

- [ ] **Detay Alanı**
  - [ ] Etkinlik başlığı
  - [ ] Künye: Tarih | Saat | Konum | Fiyat
  - [ ] Açıklama metni
  - [ ] Google Maps linki (varsa)

### Admin Paneli

- [ ] **Genel Bakış (Overview)**
  - [ ] Toplam Başvuru sayısı
  - [ ] Asil doluluk yüzdesi
  - [ ] Yedek sayısı
  - [ ] Gönderilen bilet sayısı

- [ ] **Etkinlik Yönetimi**
  - [ ] Durum kontrolü: Aktif etkinlik var mı?
  - [ ] Varsa: Mevcut etkinlik özeti ve "Yönet" butonu
  - [ ] Yoksa: "Yeni Etkinlik Oluştur" formu
  - [ ] Form alanları:
    - [ ] Etkinlik Adı
    - [ ] Tarih/Saat
    - [ ] Konum (Google Maps URL)
    - [ ] Açıklama
    - [ ] Fiyat
    - [ ] Asil Kota
    - [ ] Yedek Kota
    - [ ] Son İptal Tarihi (Cut-off Date)
    - [ ] Afiş Görseli yükleme
    - [ ] Bilet Havuzu (ZIP) yükleme
  - [ ] "Taslak Olarak Kaydet" butonu
  - [ ] "Yayına Al" butonu

- [ ] **Bilet Havuzu Yönetimi**
  - [ ] ZIP yükleme alanı
  - [ ] Yüklenen dosyaların listesi
  - [ ] Dosya adına göre sıralama
  - [ ] Atanmamış bilet sayısı

- [ ] **Başvurular (Bookings)**
  - [ ] Tablo görünümü:
    - [ ] Sıra No
    - [ ] Ad Soyad / Sicil No
    - [ ] Başvuru Zamanı (Saat:Dakika:Saniye)
    - [ ] Durum (Asil / Yedek)
    - [ ] Ödeme Durumu (Bekliyor / Alındı)
    - [ ] Bilet Durumu (Gönderildi / Bekliyor)
  - [ ] Filtreleme: Asil/Yedek, Ödeme Durumu
  - [ ] Sıralama: Başvuru zamanına göre
  - [ ] İşlem Butonları:
    - [ ] [ÖDEME ONAYLA VE BİLET GÖNDER] (Tekil veya toplu)
    - [ ] [İPTAL ET] (Yedekten asile geçiş tetikler)
    - [ ] [EXCEL İNDİR] (Muhasebe formatı)

- [ ] **Bilet Atama İşlemi**
  - [ ] `assign_ticket` RPC fonksiyonunu çağırıyor
  - [ ] Bilet havuzundan sıradaki PDF'i çekiyor
  - [ ] Üyeye e-posta gönderiyor (gelecekte)
  - [ ] Başarı/hata mesajları

## Test ve Doğrulama

### Kuyruk Testi

- [ ] **Farklı Hesaplarla Test**
  - [ ] 5-10 farklı hesap ile giriş yapıldı
  - [ ] Aynı anda "Katıl" butonuna basıldı
  - [ ] Sıralama doğru çalışıyor (milisaniye bazında)
  - [ ] Asil kota dolduğunda yedek listeye düşüyor
  - [ ] Yedek kota dolduğunda "Kontenjan Dolu" mesajı

- [ ] **Race Condition Testi**
  - [ ] 50+ eşzamanlı istek gönderildi
  - [ ] Kota aşımı olmadı
  - [ ] Veri tutarlılığı korundu

### Bilet Dağıtım Testi

- [ ] **Admin Onayı**
  - [ ] Ödeme bekleyen başvurular görünüyor
  - [ ] "Ödeme Onayla ve Bilet Gönder" butonu çalışıyor
  - [ ] Bilet havuzundan sıradaki PDF atanıyor
  - [ ] Booking durumu "PAID" olarak güncelleniyor

- [ ] **Bilet Görüntüleme**
  - [ ] Kullanıcı kendi biletini görebiliyor
  - [ ] PDF indirme çalışıyor
  - [ ] Başkasının biletini göremiyor (RLS)

### İptal ve Yedek Yönetimi

- [ ] **İptal Testi**
  - [ ] Asil listeden biri iptal edildi
  - [ ] Cut-off tarihi kontrol ediliyor
  - [ ] İptal sonrası yedekten asile geçiş çalışıyor
  - [ ] E-posta bildirimi gönderiliyor (gelecekte)

### Excel Import Testi

- [ ] **Üye Import**
  - [ ] Excel dosyası yüklendi
  - [ ] TC Kimlik No, Sicil No, E-posta unique kontrolü
  - [ ] Çakışma durumunda hata mesajı
  - [ ] Profiller oluşturuldu
  - [ ] E-posta token gönderimi (gelecekte)

### Storage Testi

- [ ] **ZIP Yükleme**
  - [ ] ZIP dosyası yüklendi
  - [ ] PDF'ler çıkarıldı
  - [ ] Storage'a yüklendi
  - [ ] `ticket_pool` tablosuna kaydedildi
  - [ ] Dosya adına göre sıralama doğru

- [ ] **Afiş Yükleme**
  - [ ] Görsel yüklendi
  - [ ] Public URL oluşturuldu
  - [ ] Ana sayfada görüntüleniyor

### RLS Testi

- [ ] **Güvenlik Testleri**
  - [ ] Kullanıcı sadece kendi booking'ini görebiliyor
  - [ ] Kullanıcı sadece kendi biletini görebiliyor
  - [ ] Admin tüm verileri görebiliyor
  - [ ] Misafir hiçbir veriyi göremiyor

## Performans ve Optimizasyon

- [ ] **Database İndeksleri**
  - [ ] `bookings(event_id, booking_date)` indeksi
  - [ ] `ticket_pool(event_id, is_assigned)` indeksi
  - [ ] `profiles(tckn)` ve `profiles(sicil_no)` indeksleri

- [ ] **Query Optimizasyonu**
  - [ ] N+1 query problemi yok
  - [ ] Gereksiz veri çekilmiyor
  - [ ] Pagination kullanılıyor (büyük listeler için)

- [ ] **Frontend Optimizasyonu**
  - [ ] Server Components kullanılıyor
  - [ ] Client Components sadece gerektiğinde
  - [ ] Code splitting çalışıyor
  - [ ] Image optimization

## Dokümantasyon

- [ ] **Kod Dokümantasyonu**
  - [ ] Fonksiyonlarda JSDoc yorumları
  - [ ] Kompleks mantık açıklamaları
  - [ ] TODO notları temizlendi

- [ ] **Kullanıcı Dokümantasyonu**
  - [ ] Admin kullanım kılavuzu
  - [ ] Üye kullanım kılavuzu

## Deployment

- [ ] **Production Hazırlığı**
  - [ ] Environment variables ayarlandı
  - [ ] Supabase production projesi hazır
  - [ ] Vercel/Netlify deployment
  - [ ] Domain ayarları

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry vb.)
  - [ ] Analytics (gelecekte)

---

**Not:** Bu kontrol listesi, plan.md'deki görevlerin detaylandırılmış halidir. Her madde tamamlandığında işaretlenmelidir.

**Son Güncelleme:** 2025-01-XX

