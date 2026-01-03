# TALPA Etkinlik Platformu - İşlevler Raporu

**Hazırlanma Tarihi:** 2025  
**Versiyon:** 1.0  
**Platform:** Web (Responsive - Mobil Öncelikli)

---

## İçindekiler

1. [Genel Bakış](#genel-bakış)
2. [Kullanıcı İşlevleri](#kullanıcı-işlevleri)
3. [Yönetici İşlevleri](#yönetici-işlevleri)
4. [Sistem İşlevleri](#sistem-işlevleri)
5. [Güvenlik Özellikleri](#güvenlik-özellikleri)
6. [Teknik Altyapı](#teknik-altyapı)
7. [Modüler Yapı](#modüler-yapı)

---

## Genel Bakış

TALPA Etkinlik Platformu, Türkiye Havayolu Pilotları Derneği (TALPA) üyeleri için geliştirilmiş kapalı devre bir etkinlik biletleme ve yönetim sistemidir. Platform, sınırlı kontenjanlı etkinliklere adil bir sıra sistemiyle (First-Come, First-Served) kayıt olma, KVKK/Ödeme rızası verme ve ödeme onayı sonrası dijital biletlerin otomatik dağıtımını sağlar.

### Temel Özellikler

- **Tek Etkinlik Odaklı Sistem**: Herhangi bir anda sadece tek bir aktif etkinlik gösterilir
- **Kuyruk Tabanlı Başvuru**: Asil ve Yedek liste sistemi ile adil dağıtım
- **Manuel Ödeme Onayı**: Kredi kartı bilgisi saklanmaz, muhasebe manuel tahsilat yapar
- **PDF Bilet Havuzu**: Toplu PDF yükleme ve otomatik bilet atama
- **Excel Üye İçe Aktarma**: Toplu üye verisi yükleme
- **Gerçek Zamanlı Takip**: Anlık doluluk oranı ve başvuru durumu takibi

---

## Kullanıcı İşlevleri

### 1. Kimlik Doğrulama ve Hesap Yönetimi

#### 1.1. İlk Giriş ve Şifre Oluşturma
- **Özellik**: Sisteme aktarılan üyelerin varsayılan şifresi yoktur
- **İşlev**: Üye, "Şifremi Oluştur/Unuttum" adımını kullanarak e-postasına gelen token ile şifresini belirler
- **Güvenlik**: Tek kullanımlık token sistemi
- **Modül**: `src/modules/auth/`

#### 1.2. Giriş Yapma
- **Yöntem**: E-posta ve şifre ile giriş
- **Doğrulama**: Supabase Auth ile güvenli kimlik doğrulama
- **Oturum Yönetimi**: Otomatik token yenileme ve oturum takibi
- **Modül**: `src/modules/auth/api/auth.api.ts`

#### 1.3. Çıkış Yapma
- **İşlev**: Güvenli oturum sonlandırma
- **Temizlik**: Tüm oturum verilerinin temizlenmesi

### 2. Etkinlik Görüntüleme ve Bilgilendirme

#### 2.1. Aktif Etkinlik Görüntüleme
- **Özellik**: Ana sayfada sadece aktif etkinlik gösterilir
- **Bilgiler**:
  - Etkinlik başlığı ve açıklaması
  - Tarih, saat ve konum bilgisi
  - Fiyat bilgisi
  - Kalan kontenjan (Asil/Yedek)
  - Etkinlik afişi
- **Gerçek Zamanlı**: Anlık stok durumu güncellemesi
- **Modül**: `src/modules/event/`

#### 2.2. Durum Göstergeleri
- **BAŞVURUYA AÇIK**: Kontenjan mevcut
- **DOLMAK ÜZERE**: Kontenjan %80 dolmuş
- **KONTENJAN DOLU**: Tüm kontenjan dolu
- **ETKİNLİK YOK**: Aktif etkinlik bulunmuyor

### 3. Başvuru ve Kuyruk Yönetimi

#### 3.1. Etkinliğe Başvuru Yapma
- **Süreç**:
  1. Kullanıcı "KATIL" butonuna tıklar
  2. KVKK ve Ödeme rızası onayları alınır
  3. Sistem başvuruyu milisaniye bazında sıraya alır
  4. Kuyruk durumu belirlenir (ASİL/YEDEK)
- **Kuyruk Mantığı**:
  - Kayıt sırası <= Asil Kota → **ASİL LİSTE**
  - Asil Kota < Kayıt sırası <= (Asil + Yedek Kota) → **YEDEK LİSTE**
  - Kota dolduysa → "Kontenjan Dolu" uyarısı
- **Race Condition Koruması**: PostgreSQL transaction locking ile eşzamanlı başvurularda sıralama korunur
- **Modül**: `src/modules/booking/`

#### 3.2. Başvuru Durumu Takibi
- **ASİL LİSTEDE**: 
  - Durum: Yeşil buton ile gösterilir
  - Mesaj: "✅ KAYDINIZ ALINDI (ASİL)"
  - Bilgi: "Ödeme onayından sonra biletiniz e-postanıza gelecektir"
- **YEDEK LİSTEDE**:
  - Durum: Sarı buton ile gösterilir
  - Mesaj: "⚠️ YEDEK LİSTEDESİNİZ (SIRA: X)"
  - Sıra numarası gösterilir
- **Modül**: `components/BookingStatus.tsx`

#### 3.3. Başvuru İptal Etme
- **Koşul**: Cut-off tarihi geçmeden iptal edilebilir
- **İşlev**: 
  - Kullanıcı başvurusunu iptal edebilir
  - İptal sonrası yedek listeden otomatik geçiş tetiklenir
- **Kısıtlama**: Cut-off tarihi geçtikten sonra iptal yapılamaz
- **Modül**: `actions/bookings.ts`

### 4. Bilet Görüntüleme ve İndirme

#### 4.1. Dijital Bilet Görüntüleme
- **Format**: PDF bilet görüntüleme
- **Özellikler**:
  - QR kod içerir
  - Koltuk numarası gösterilir
  - Etkinlik bilgileri
- **Erişim**: "Biletlerim" sekmesinden görüntülenebilir
- **Modül**: `components/BoardingPass.tsx`

#### 4.2. Bilet İndirme
- **İşlev**: PDF bilet indirme
- **Yedekleme**: E-posta ulaşmama riskine karşı kullanıcı panelinden tekrar indirilebilir
- **Sayfa**: `app/ticket/[id]/page.tsx`

---

## Yönetici İşlevleri

### 1. Etkinlik Yönetimi

#### 1.1. Etkinlik Oluşturma
- **Gerekli Bilgiler**:
  - Etkinlik Adı
  - Tarih/Saat
  - Konum (URL veya metin)
  - Açıklama
  - Görsel (Afiş)
  - Fiyat Bilgisi
  - Asil Kontenjan
  - Yedek Kontenjan
  - Son İptal Tarihi (Cut-off Time)
- **Durumlar**: DRAFT, ACTIVE, ARCHIVED
- **Modül**: `actions/admin.ts` → `createEvent()`

#### 1.2. Aktif Etkinlik Belirleme
- **İşlev**: Mevcut etkinliklerden birini aktif yapma
- **Kısıtlama**: Aynı anda sadece bir etkinlik aktif olabilir
- **RPC Fonksiyonu**: `set_active_event()`
- **Modül**: `actions/admin.ts` → `setActiveEvent()`

#### 1.3. Etkinlik Listesi Görüntüleme
- **Sayfa**: `app/admin/events/page.tsx`
- **Özellikler**:
  - Tüm etkinliklerin listesi
  - Durum bilgileri
  - İstatistikler
- **Modül**: `components/admin/EventsPanel.tsx`

### 2. Bilet Havuzu Yönetimi

#### 2.1. Toplu PDF Yükleme
- **Format**: ZIP dosyası içinde PDF'ler
- **Süreç**:
  1. Admin ZIP dosyasını yükler
  2. Sistem ZIP'i açar
  3. PDF'ler dosya adına göre sıralanır (A1.pdf, A2.pdf...)
  4. Storage'a yüklenir
  5. `ticket_pool` tablosuna kaydedilir
- **Edge Function**: `supabase/functions/process-zip/`
- **Modül**: `src/modules/file-processing/`

#### 2.2. Bilet Havuzu Görüntüleme
- **Sayfa**: `app/admin/tickets/page.tsx`
- **Özellikler**:
  - Yüklenen bilet sayısı
  - Atanmamış biletler
  - Atanmış biletler
- **Modül**: `components/admin/TicketPoolManager.tsx`

#### 2.3. Otomatik Temizlik
- **İşlev**: Etkinlik tarihi geçtikten sonra PDF dosyaları otomatik silinir
- **Koruma**: Dağıtım logları veritabanında saklanmaya devam eder
- **Amaç**: Storage tasarrufu

### 3. Başvuru Yönetimi

#### 3.1. Başvuru Listesi Görüntüleme
- **Sayfa**: `app/admin/page.tsx`
- **Özellikler**:
  - Tüm başvuruların listesi
  - Filtreleme (ASİL/YEDEK/İPTAL, Ödeme Durumu)
  - Sayfalama
  - Arama
- **Modül**: `components/admin/BookingsTable.tsx`

#### 3.2. Başvuru Detayları
- **Gösterilen Bilgiler**:
  - Üye adı soyadı
  - TC Kimlik No
  - Dernek Sicil No
  - E-posta
  - Başvuru tarihi
  - Kuyruk durumu
  - Ödeme durumu

#### 3.3. Ödeme Onayı ve Bilet Atama
- **Süreç**:
  1. Admin ödeme bekleyenler listesini görüntüler
  2. Muhasebe manuel tahsilat yapar
  3. Admin ödemesi alınan kişileri seçer
  4. "Onayla" butonuna basar
  5. Sistem bilet atama algoritmasını çalıştırır:
     - Asil listeye giriş sırasına göre üyeleri sıralar
     - Bilet havuzundaki dosyaları isim sırasına göre çeker
     - 1. Üyeye → 1. Dosyayı, 2. Üyeye → 2. Dosyayı atar
  6. E-posta ile PDF bilet gönderilir
- **RPC Fonksiyonu**: `assign_ticket()`
- **Modül**: `actions/admin.ts` → `assignTicket()`

#### 3.4. Toplu Bilet Atama
- **İşlev**: Birden fazla başvuruyu aynı anda onaylama
- **Kontrol**: Bilet stoku yetersizse işlem durdurulur

#### 3.5. Yedekten Asile Geçiş
- **Otomatik Tetikleme**: 
  - Asil listeden biri iptal edildiğinde
  - Admin manuel olarak tetikleyebilir
- **Süreç**: 1. sıradaki yedek otomatik olarak asil listeye geçer
- **Bildirim**: Yedek listeden asile geçen üyeye e-posta gönderilir
- **RPC Fonksiyonu**: `promote_from_waitlist()`
- **Modül**: `actions/admin.ts` → `promoteFromWaitlist()`

#### 3.6. Başvuru İptal Etme (Admin)
- **İşlev**: Admin herhangi bir başvuruyu iptal edebilir
- **Sonuç**: İptal sonrası yedek listeden otomatik geçiş tetiklenir
- **Modül**: `actions/admin.ts` → `cancelBooking()`

### 4. Üye Yönetimi

#### 4.1. Excel ile Üye İçe Aktarma
- **Format**: Excel dosyası (.xlsx)
- **Gerekli Alanlar**:
  - TC Kimlik No (Benzersiz)
  - Dernek Sicil No (Benzersiz)
  - E-posta (Benzersiz)
  - Ad Soyad
  - Telefon (Opsiyonel)
- **Süreç**:
  1. Admin Excel dosyasını yükler
  2. Sistem dosyayı işler
  3. Çakışma kontrolü yapılır
  4. Yeni üyeler sisteme eklenir
  5. Mevcut üyeler güncellenir (eğer bilgiler uyumluysa)
- **Çakışma Yönetimi**: 
  - TC/Sicil No mevcut ama bilgiler farklıysa → Hata, admin manuel düzeltme yapar
- **Edge Function**: `supabase/functions/import-users/`
- **Modül**: `src/modules/file-processing/`
- **Component**: `components/admin/MemberImport.tsx`

#### 4.2. Üye Listesi Görüntüleme
- **Sayfa**: `app/admin/page.tsx`
- **Modül**: `components/admin/UsersPanel.tsx`

### 5. Raporlama ve İstatistikler

#### 5.1. Operasyon Özeti
- **Gösterilen Metrikler**:
  - Asil Başvuru Sayısı / Asil Kontenjan
  - Yedek Başvuru Sayısı / Yedek Kontenjan
  - Bilet Gönderilen (Ödeme Onayı Alınan)
  - Tahmini Hasılat
- **Görselleştirme**: 
  - İlerleme çubukları
  - Kartlar ile özet
- **Sayfa**: `app/admin/page.tsx`
- **Modül**: `components/admin/OverviewPanel.tsx`

#### 5.2. Excel Raporu İndirme
- **İşlev**: Başvuruları Excel formatında indirme
- **Kullanım**: Muhasebe için ödeme bekleyenler listesi
- **İçerik**:
  - Sıra numarası
  - Ad Soyad
  - TC Kimlik No
  - Dernek Sicil No
  - E-posta
  - Başvuru Tarihi
  - Durum (ASİL/YEDEK)
  - Ödeme Durumu
- **Modül**: `actions/admin.ts` → `exportBookingsToExcel()`

#### 5.3. Gerçek Zamanlı İstatistikler
- **Güncelleme**: Sayfa yenilemeden anlık güncelleme
- **Teknoloji**: React Query ile otomatik yenileme

---

## Sistem İşlevleri

### 1. Veritabanı İşlemleri

#### 1.1. RPC Fonksiyonları
- **`join_event()`**: 
  - Başvuru yapma
  - Kuyruk atama
  - Race condition koruması
- **`set_active_event()`**: 
  - Aktif etkinlik belirleme
  - Tek aktif etkinlik garantisi
- **`assign_ticket()`**: 
  - Bilet atama
  - Sıralı atama algoritması
- **`promote_from_waitlist()`**: 
  - Yedekten asile geçiş
  - Otomatik bildirim

#### 1.2. Veritabanı Tabloları
- **`profiles`**: Kullanıcı profilleri
- **`events`**: Etkinlik bilgileri
- **`bookings`**: Başvurular ve kuyruk durumu
- **`ticket_pool`**: Bilet havuzu (PDF dosyaları)
- **`event_requests`**: Etkinlik talepleri (opsiyonel)

### 2. Dosya Yönetimi

#### 2.1. Storage Yönetimi
- **Bucket**: `tickets` - PDF biletler için
- **Bucket**: `events` - Etkinlik afişleri için
- **Bucket**: `imports` - Excel import dosyaları için

#### 2.2. Edge Functions
- **`process-zip`**: ZIP dosyası işleme ve PDF çıkarma
- **`import-users`**: Excel dosyası işleme ve üye import
- **`send-email`**: E-posta gönderimi

### 3. Bildirim Sistemi

#### 3.1. E-posta Bildirimleri
- **Bilet Atandı**: PDF bilet e-postaya eklenir
- **Yedekten Asile Geçiş**: Yedek listeden asile geçen üyeye bildirim
- **Şifre Sıfırlama**: Token ile şifre sıfırlama linki
- **Modül**: `src/modules/notification/`

### 4. Güvenlik ve Yetkilendirme

#### 4.1. Row Level Security (RLS)
- **Profiller**: Kullanıcılar sadece kendi profilini görebilir
- **Başvurular**: Kullanıcılar sadece kendi başvurularını görebilir
- **Etkinlikler**: Herkes aktif etkinliği görebilir
- **Admin İşlemleri**: Sadece admin rolü erişebilir

#### 4.2. Middleware Koruması
- **Oturum Kontrolü**: Her istekte oturum tazelemesi
- **Yetki Kontrolü**: Admin sayfalarına erişim kontrolü
- **Dosya**: `middleware.ts`

---

## Güvenlik Özellikleri

### 1. Kimlik Doğrulama
- **Supabase Auth**: Güvenli kimlik doğrulama
- **Token Tabanlı**: JWT token sistemi
- **Oturum Yönetimi**: Otomatik token yenileme

### 2. Veri Güvenliği
- **Kredi Kartı Bilgisi**: Sistemde saklanmaz
- **KVKK Uyumu**: KVKK rızası alınır
- **Ödeme Rızası**: Kayıtlı kartımdan çekim rızası alınır

### 3. Erişim Kontrolü
- **Role-Based Access**: Admin ve Member rolleri
- **RLS Politikaları**: Veritabanı seviyesinde erişim kontrolü
- **Middleware**: Uygulama seviyesinde koruma

### 4. Audit Log
- **Başvuru Logları**: Kim ne zaman başvurdu
- **İptal Logları**: Kim ne zaman iptal etti
- **Bilet Atama Logları**: Hangi PDF kime atandı

---

## Teknik Altyapı

### 1. Frontend Teknolojileri
- **Framework**: Next.js 16 (App Router & Server Components)
- **Dil**: TypeScript
- **Stil**: Tailwind CSS
- **State Management**: React Query + React Context
- **İkon Seti**: Lucide React
- **Build Tool**: Vite

### 2. Backend Teknolojileri
- **BaaS**: Supabase
- **Veritabanı**: PostgreSQL
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Edge Functions**: Supabase Edge Functions
- **Business Logic**: PostgreSQL RPC Functions

### 3. Mimari Yapı
- **Modüler Monolitik Mimari**: 
  - `src/modules/auth/` - Kimlik doğrulama
  - `src/modules/profile/` - Profil yönetimi
  - `src/modules/event/` - Etkinlik yönetimi
  - `src/modules/booking/` - Başvuru yönetimi
  - `src/modules/ticket/` - Bilet yönetimi
  - `src/modules/admin/` - Admin işlemleri
  - `src/modules/payment/` - Ödeme işlemleri
  - `src/modules/notification/` - Bildirim sistemi
  - `src/modules/file-processing/` - Dosya işleme
  - `src/modules/reporting/` - Raporlama

### 4. Veritabanı Şeması
- **Tablolar**: profiles, events, bookings, ticket_pool
- **View'lar**: active_event_view
- **Fonksiyonlar**: join_event, set_active_event, assign_ticket, promote_from_waitlist
- **Trigger'lar**: Otomatik timestamp güncelleme

---

## Modüler Yapı

### 1. Auth Modülü (`src/modules/auth/`)
- **API**: `auth.api.ts` - Login, logout, signup
- **Hooks**: `useAuth.ts`, `useSession.ts`
- **Types**: `auth.types.ts`

### 2. Profile Modülü (`src/modules/profile/`)
- **API**: `profile.api.ts` - Profil getirme, güncelleme
- **Hooks**: `useProfile.ts`, `useAdmin.ts`
- **Types**: `profile.types.ts`

### 3. Event Modülü (`src/modules/event/`)
- **API**: `event.api.ts` - Etkinlik CRUD işlemleri
- **Hooks**: `useActiveEvent.ts`
- **Components**: `EventCard.tsx`
- **Types**: `event.types.ts`

### 4. Booking Modülü (`src/modules/booking/`)
- **API**: `booking.api.ts` - Başvuru işlemleri
- **Hooks**: `useBooking.ts`
- **Components**: `BookingModal.tsx`, `BookingStatus.tsx`
- **Types**: `booking.types.ts`

### 5. Ticket Modülü (`src/modules/ticket/`)
- **API**: `ticket.api.ts` - Bilet atama işlemleri
- **Hooks**: `useTicket.ts`
- **Types**: `ticket.types.ts`

### 6. Admin Modülü (`src/modules/admin/`)
- **API**: `admin.api.ts` - Admin işlemleri
- **Utils**: `admin.utils.ts` - Excel export, filtreleme
- **Hooks**: `useAdmin.ts`
- **Types**: `admin.types.ts`

### 7. Payment Modülü (`src/modules/payment/`)
- **API**: `payment.api.ts` - Ödeme durumu yönetimi
- **Types**: `payment.types.ts`

### 8. Notification Modülü (`src/modules/notification/`)
- **API**: `notification.api.ts` - E-posta gönderimi
- **Types**: `notification.types.ts`

### 9. File Processing Modülü (`src/modules/file-processing/`)
- **API**: `file-processing.api.ts` - ZIP ve Excel işleme
- **Types**: `file-processing.types.ts`

### 10. Reporting Modülü (`src/modules/reporting/`)
- **API**: `reporting.api.ts` - İstatistik hesaplama
- **Components**: `StatsPanel.tsx`
- **Types**: `reporting.types.ts`

---

## Kullanıcı Akışları

### 1. Üye Başvuru Akışı
```
1. Ana Sayfa → Aktif Etkinlik Görüntüleme
2. "KATIL" Butonuna Tıklama
3. KVKK ve Ödeme Rızası Onayları
4. Başvuru Yapma
5. Kuyruk Durumu Belirlenme (ASİL/YEDEK)
6. Durum Göstergesi Görüntüleme
```

### 2. Admin Bilet Atama Akışı
```
1. Admin Paneli → Başvuru Listesi
2. Ödeme Bekleyenleri Filtreleme
3. Excel Raporu İndirme → Muhasebe
4. Ödeme Alınanları Seçme
5. "Onayla" Butonuna Tıklama
6. Otomatik Bilet Atama
7. E-posta ile PDF Gönderimi
```

### 3. Üye İçe Aktarma Akışı
```
1. Admin Paneli → Üye Yönetimi
2. Excel Dosyası Yükleme
3. Dosya İşleme ve Doğrulama
4. Çakışma Kontrolü
5. Üyeleri Sisteme Ekleme/Güncelleme
6. Sonuç Raporu Görüntüleme
```

---

## Performans Özellikleri

### 1. Optimizasyonlar
- **Server Components**: Next.js Server Components ile performans
- **React Query**: Otomatik cache ve yenileme
- **Lazy Loading**: Sayfa bazlı kod bölme
- **Image Optimization**: Next.js Image optimizasyonu

### 2. Ölçeklenebilirlik
- **Race Condition Koruması**: Transaction locking
- **Sayfalama**: Büyük listeler için sayfalama
- **Filtreleme**: Veritabanı seviyesinde filtreleme

---

## Dokümantasyon ve Geliştirme Rehberleri

### 1. Geliştirici Dokümantasyonu

#### 1.1. DEVELOPER_SETUP.md
**Amaç**: Yeni geliştiriciler için kurulum rehberi

**İçerik**:
- Gereksinimler (Node.js, npm, Supabase hesabı)
- Proje kurulumu ve bağımlılık yükleme
- Supabase projesi oluşturma ve credentials alma
- Storage bucket'ları oluşturma (event-banners, tickets)
- Veritabanı şeması oluşturma
- Environment variables yapılandırması
- Geliştirme sunucusu başlatma
- İlk kurulum sonrası adımlar (test admin kullanıcısı, test etkinliği)
- Yaygın sorunlar ve çözümleri

**Kullanım**: Yeni geliştiriciler bu dokümanı takip ederek projeyi çalıştırabilir.

#### 1.2. MODULAR_MONOLITH_GUIDE.md
**Amaç**: Modüler monolitik mimariye geçiş rehberi

**İçerik**:
- Modüler mimari prensipleri
- Klasör yapısı organizasyonu
- Modül standartları (Public API Pattern)
- Faz faz geçiş planı:
  - Faz 1: Klasör yapısını oluşturma
  - Faz 2: Shared Infrastructure
  - Faz 3-7: Modül oluşturma (Auth, Profile, Event, Booking, vb.)
  - Faz 8: Import'ları güncelleme
  - Faz 9: Temizlik ve test
- Dependency injection pattern
- Type safety yaklaşımı

**Kullanım**: Kod refactoring sırasında referans olarak kullanılır.

### 2. Veritabanı Dokümantasyonu

#### 2.1. DATABASE.md
**Amaç**: Veritabanı şeması ve iş kuralları dokümantasyonu

**İçerik**:
- **Tablolar**:
  - `profiles`: Kullanıcı profilleri (tckn, sicil_no, email unique)
  - `events`: Etkinlik bilgileri (quota_asil, quota_yedek, cut_off_date, status enum)
  - `bookings`: Başvurular ve kuyruk durumu (queue_status, payment_status)
  - `ticket_pool`: PDF bilet havuzu (file_name, file_path, assigned_to)
- **RPC Fonksiyonları**:
  - `join_event()`: Kuyruk sistemine başvuru, race condition koruması
  - `assign_ticket()`: Ödeme onayı sonrası bilet atama
  - `promote_from_waitlist()`: Yedekten asile otomatik geçiş
- **Row Level Security (RLS)**: Her tablo için erişim politikaları
- **İş Kuralları**:
  - Single Active Event prensibi
  - Kuyruk yönetimi ve race condition koruması
  - Bilet atama algoritması
  - Yedekten asile geçiş mantığı
- **Performans Optimizasyonları**: İndeksler ve query optimizasyonu

**Kullanım**: Veritabanı yapısını anlamak ve sorgu yazmak için referans.

#### 2.2. MIGRATION_GUIDE.md
**Amaç**: Veritabanı migrasyonu için adım adım rehber

**İçerik**:
- Ön hazırlık (backup alma, test ortamı)
- Adım adım migrasyon:
  1. Yeni enum tipleri oluşturma
  2. Profiles tablosunu güncelleme
  3. Events tablosunu güncelleme
  4. Ticket pool tablosunu oluşturma
  5. Bookings tablosunu oluşturma
  6. RPC fonksiyonlarını oluşturma
  7. RLS politikalarını güncelleme
  8. Storage bucket'larını oluşturma
- Veri migrasyonu (eski tickets → bookings)
- Geri alma planı (rollback)
- Doğrulama adımları

**Kullanım**: Production'a geçiş sırasında SQL komutlarını çalıştırmak için.

### 3. Geliştirme ve Uygulama Dokümantasyonu

#### 3.1. IMPLEMENTATION_CHECKLIST.md
**Amaç**: Uygulama için detaylı kontrol listesi

**İçerik**:
- **Veritabanı ve Tip Tanımları**:
  - Enum tipleri, tablo güncellemeleri
  - TypeScript tip güncellemeleri
- **Servis Katmanı**:
  - RPC entegrasyonu
  - Auth servisi
  - Storage servisi
- **Frontend Geliştirmeleri**:
  - Layout ve routing
  - Sayfa geliştirmeleri (Login, Landing Page, Admin Panel)
  - Yeni component'ler (BookingModal, BookingStatus, TicketPoolManager)
- **Test ve Doğrulama**:
  - Kuyruk testi
  - Bilet dağıtım testi
  - İptal ve yedek yönetimi testi
  - Excel import testi
  - Storage testi
  - RLS testi
- **Performans ve Optimizasyon**: Database indeksleri, query optimizasyonu

**Kullanım**: Her görev tamamlandığında işaretlenmelidir.

#### 3.2. REVISION_REQUIREMENTS.md
**Amaç**: Revizyon gereksinimlerinin detaylı analizi

**İçerik**:
- **Kritik Değişiklikler**:
  - Bilet satın alma → Başvuru sistemi
  - Stok yönetimi → Kuyruk yönetimi
  - QR kod → PDF bilet
- **Veritabanı Değişiklikleri**: Yeni tablolar, güncellenen tablolar, yeni RPC fonksiyonları
- **API ve Servis Değişiklikleri**: Yeni Server Actions, güncellenen hooks
- **Frontend Değişiklikleri**: Yeni component'ler, güncellenen component'ler, sayfa güncellemeleri
- **Güvenlik Gereksinimleri**: RLS politikaları, race condition koruması, input validation
- **Performans Gereksinimleri**: Database indeksleri, query optimizasyonu, storage optimizasyonu
- **Excel Import Gereksinimleri**: Format, iş kuralları, çakışma yönetimi

**Kullanım**: Geliştirme sırasında referans olarak kullanılır.

#### 3.3. REVISION_INDEX.md
**Amaç**: Revizyon dokümanlarının indeksi

**İçerik**:
- Revizyon gereksinimleri kaynakları (SRS.md, veritabani.md, UI-UX.md, plan.md)
- Oluşturulan dokümanların özeti ve kullanım amaçları
- Revizyon akışı (Hazırlık → Migrasyon → Kod → Test → Dokümantasyon)
- Önemli notlar (veritabanı değişiklikleri, API değişiklikleri, frontend değişiklikleri)
- Kaldırılan dokümanlar ve nedenleri

**Kullanım**: Revizyon sürecini anlamak ve hangi dokümana bakılacağını belirlemek için.

### 4. Test Dokümantasyonu

#### 4.1. TESTING.md
**Amaç**: Test yapısı ve genel test dokümantasyonu

**İçerik**:
- Test yapısı (Vitest ve React Testing Library)
- Test kategorileri:
  - Unit Tests (API fonksiyonları, Hook'lar, Utils)
  - Component Tests (React component'leri)
  - Integration Tests (Modüller arası etkileşimler)
- Test çalıştırma komutları:
  - `npm test` - Tüm testleri çalıştırma
  - `npm run test:watch` - Watch mode
  - `npm run test:ui` - UI mode
  - `npm run test:coverage` - Coverage raporu
- Test utilities (Test Data Factory, Supabase Mock, React Query Wrapper)
- Best practices (Mock stratejisi, test data, isolation, coverage hedefleri)
- CI/CD entegrasyonu

**Kullanım**: Test yazma ve çalıştırma için genel rehber.

#### 4.2. TEST_GUIDE.md
**Amaç**: Test yazma rehberi ve örnekler

**İçerik**:
- Yeni test dosyası oluşturma:
  - API testi örneği
  - Hook testi örneği
  - Component testi örneği
- Mock kullanımı (Supabase Mock, React Query Mock)
- Test senaryoları (Başarılı senaryo, hata senaryosu, edge cases)
- Yaygın hatalar ve çözümler
- Örnek test dosyaları referansları

**Kullanım**: Yeni test yazarken örnek olarak kullanılır.

#### 4.3. TESTING_GUIDE.md
**Amaç**: Test senaryoları ve test adımları

**İçerik**:
- **Test Ortamı Hazırlığı**: Supabase test projesi, test kullanıcıları, test etkinliği, test bilet havuzu
- **Birim Testleri**:
  - `join_event` fonksiyonu testleri (başarılı asil, yedek listeye düşme, kontenjan dolu, vb.)
  - `assign_ticket` fonksiyonu testleri
  - `promote_from_waitlist` fonksiyonu testleri
  - RLS politikası testleri
- **Entegrasyon Testleri**: Başvuru akışı, admin bilet atama, yedekten asile geçiş
- **Kullanıcı Senaryoları**: 5 farklı senaryo (başarılı başvuru, yedek listeye düşme, kontenjan dolu, admin etkinlik oluşturma, admin bilet atama)
- **Performans Testleri**: Eşzamanlı başvuru testi, büyük liste performansı, ZIP yükleme performansı
- **Güvenlik Testleri**: RLS testleri, yetki testleri, SQL injection testi, XSS testi
- **Test Verileri**: Örnek test kullanıcıları, test etkinliği, test booking'leri
- **Test Checklist**: Ön hazırlık, birim testler, entegrasyon testler, kullanıcı senaryoları, performans testler, güvenlik testler

**Kullanım**: Her test senaryosu uygulanmalı ve sonuçlar kaydedilmelidir.

### 5. Eksiklikler ve Tespitler

#### 5.1. eksikler.md
**Amaç**: Kod tabanında tespit edilen eksiklikler

**İçerik**:
- **Eksik Bileşenler**:
  - `TicketPoolManager.tsx`: Bilet havuzu yönetimi bileşeni
  - `BookingsTable.tsx`: Başvurular tablosu bileşeni
  - `ActionZone.tsx`: Ana sayfa buton mantığı güncellemesi
- **Eksik Sayfalar**:
  - `/admin/tickets`: Bilet yönetimi sayfası
  - `/ticket/[id]`: Bilet görüntüleme sayfası
- **Eksik Entegrasyonlar**:
  - Bilet atama UI entegrasyonu
  - ZIP yükleme UI entegrasyonu
  - Admin navigasyonu
- **API Durumu**: Hangi API'lerin uygulandığı ve hangilerinin eksik olduğu
- **Öncelikli Aksiyonlar**: Eksikliklerin giderilmesi için öneriler

**Kullanım**: Geliştirme önceliklerini belirlemek için.

---

## Dokümantasyon Kullanım Rehberi

### Yeni Geliştirici İçin
1. **DEVELOPER_SETUP.md** → Projeyi kurmak için
2. **MODULAR_MONOLITH_GUIDE.md** → Mimariyi anlamak için
3. **DATABASE.md** → Veritabanı yapısını öğrenmek için
4. **TESTING.md** ve **TEST_GUIDE.md** → Test yazmak için

### Veritabanı Migrasyonu İçin
1. **MIGRATION_GUIDE.md** → Adım adım migrasyon rehberi
2. **DATABASE.md** → Şema referansı

### Geliştirme Süreci İçin
1. **IMPLEMENTATION_CHECKLIST.md** → Görevleri takip etmek için
2. **REVISION_REQUIREMENTS.md** → Gereksinimleri anlamak için
3. **eksikler.md** → Eksiklikleri görmek için

### Test Süreci İçin
1. **TESTING_GUIDE.md** → Test senaryolarını uygulamak için
2. **TEST_GUIDE.md** → Test yazma örnekleri için

### Genel Bakış İçin
1. **REVISION_INDEX.md** → Tüm dokümanların indeksi
2. **UYGULAMA_ISLEVLERI_RAPORU.md** (bu rapor) → Tüm işlevlerin özeti

---

## Sonuç

TALPA Etkinlik Platformu, dernek üyeleri için kapsamlı bir etkinlik yönetim ve biletleme sistemi sunmaktadır. Platform, adil bir kuyruk sistemi, güvenli ödeme süreci ve otomatik bilet dağıtımı ile etkinlik yönetimini kolaylaştırmaktadır. Modüler mimari yapısı sayesinde bakımı kolay ve genişletilebilir bir sistemdir.

Platform, kapsamlı bir dokümantasyon seti ile desteklenmektedir:
- **Geliştirici Rehberleri**: Kurulum, mimari, veritabanı
- **Geliştirme Dokümantasyonu**: Kontrol listeleri, gereksinimler, eksiklikler
- **Test Dokümantasyonu**: Test senaryoları, rehberler, örnekler
- **Migrasyon Rehberleri**: Veritabanı migrasyonu için adım adım kılavuz

Bu dokümantasyon seti, yeni geliştiricilerin projeye hızlıca adapte olmasını, mevcut geliştiricilerin referans bulmasını ve sistemin bakımını kolaylaştırmaktadır.

---

**Not**: Bu rapor, mevcut kod tabanı ve dokümantasyon analiz edilerek hazırlanmıştır. Sistemin güncel durumu için kod tabanına ve ilgili dokümantasyon dosyalarına bakılması önerilir.

