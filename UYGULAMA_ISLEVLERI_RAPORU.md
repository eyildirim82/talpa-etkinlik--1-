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

## Sonuç

TALPA Etkinlik Platformu, dernek üyeleri için kapsamlı bir etkinlik yönetim ve biletleme sistemi sunmaktadır. Platform, adil bir kuyruk sistemi, güvenli ödeme süreci ve otomatik bilet dağıtımı ile etkinlik yönetimini kolaylaştırmaktadır. Modüler mimari yapısı sayesinde bakımı kolay ve genişletilebilir bir sistemdir.

---

**Not**: Bu rapor, mevcut kod tabanı ve dokümantasyon analiz edilerek hazırlanmıştır. Sistemin güncel durumu için kod tabanına bakılması önerilir.

