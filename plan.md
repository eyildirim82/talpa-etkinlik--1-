# Proje Revize Planı (Project Revision Plan)

Bu plan, `SRS.md`, `UI-UX.md` ve `veritabani.md` dosyalarındaki gereksinimleri mevcut projeye uygulamak için hazırlanmıştır.

## 1. Veritabanı ve Tip Tanımları (Database & Types)

Mevcut kod yapısı (`src/types/supabase.ts`), yeni veritabanı şemasıyla uyumlu değildir.

- [ ] **Supabase SQL Çalıştırma**: Kullanıcı tarafından `veritabani.md` içerisindeki SQL kodlarının Supabase SQL Editor'de çalıştırılması gerekmektedir.
- [ ] **Tip Güncellemesi**: `src/types/supabase.ts` dosyasının yeni şemaya (`events`, `bookings`, `ticket_pool`, `profiles`) göre güncellenmesi.
- [ ] **Domain Types**: Proje içinde kullanılacak TypeScript arayüzlerinin (`Event`, `Booking`, `Profile` vb.) `src/types/` altında tanımlanması.

## 2. Servis Katmanı ve Mantık (Service Layer & Logic)

Veritabanı işlemleri için merkezi servis fonksiyonları oluşturulacak.

- [ ] **RPC Entegrasyonu**: `join_event` fonksiyonunu çağıran güvenli servis metodunun yazılması.
- [ ] **Auth Servisi**: Admin ve Üye ayrımını yöneten, profil bilgilerini çeken servislerin güncellenmesi.
- [ ] **Storage Servisi**: Bilet havuzu (ZIP yükleme) ve Etkinlik afişi yükleme fonksiyonları.

## 3. Ön Yüz: İskelet ve Yönlendirme (Frontend: Skeleton & Routing)

- [ ] **Layout Düzenlemesi**: Tüm sayfaların Responsive ve Mobil Öncelikli (Mobile First) yapıya uygun olduğunun doğrulanması.
- [ ] **Routing**: `App.tsx` (veya Router yapılandırması) kontrol edilerek şu rotaların varlığı/doğruluğu sağlanacak:
    - `/` (Landing Page - Akıllı Ana Ekran)
    - `/login` (Giriş)
    - `/admin` (Yönetici Paneli)

## 4. Ön Yüz: Sayfa Geliştirmeleri (Frontend: Pages)

### 4.1. Login (Giriş)
- [ ] `Login.tsx` revizesi: Tasarımın `UI-UX.md` ile birebir uyumlu hale getirilmesi (Header, renkler, "Şifremi Unuttum" linki).

### 4.2. Landing Page (Ana Sayfa)
- [ ] **Hero Section**: Aktif etkinlik varsa detayları, yoksa "Etkinlik Yok" uyarısı.
- [ ] **Durum Yönetimi (State Machine)**: Kullanıcının durumuna göre butonun dinamik değişimi:
    - Misafir -> [GİRİŞ YAP]
    - Üye -> [HEMEN KATIL] (Modal açar)
    - Asil Liste -> [KAYDINIZ ALINDI] (Yeşil)
    - Yedek Liste -> [YEDEK LİSTEDESİNİZ] (Sarı)
    - Dolu -> [KONTENJAN DOLU]
- [ ] **Başvuru Modalı**: KVKK ve Ödeme onayı checkbox'larını içeren, `join_event` fonksiyonunu tetikleyen modal.

### 4.3. Admin Paneli
- [ ] **Genel Bakış (Overview)**: Yeni metriklerin (Asil/Yedek doluluk) eklenmesi.
- [ ] **Etkinlik Yönetimi**:
    - Yeni etkinlik oluşturma formuna `quota_asil`, `quota_yedek`, `cut_off_date` alanlarının eklenmesi.
    - Afiş yükleme entegrasyonu.
- [ ] **Bilet Havuzu (Ticket Pool)**:
    - Sadece Admin'in görebileceği, Etkinlik oluştururken veya düzenlerken ZIP dosyası yükleyebileceği alan.
    - ZIP'in açılarak dosya isimlerinin `ticket_pool` tablosuna işlenmesi mantığı (Backend Function veya Client-side JS ile). *Not: İstemci tarafında (Client-side) JSZip kütüphanesi ile ZIP okunup tek tek storage'a atılması veya Supabase Edge Function kullanımı planlanmalı.*
- [ ] **Başvurular (Bookings)**:
    - Başvuru listesi tablosu (Ad, Soyad, Statü, Ödeme Durumu).
    - Aksiyon Butonu: [ÖDEME ONAYLA VE BİLET ATA]. Bu işlem `ticket_pool`'dan sıradaki bileti üyeye atayacak (Update).

## 5. Test ve Doğrulama
- [ ] **Kuyruk Testi**: Farklı hesaplarla giriş yapıp kota dolduğunda yedeğe düşme durumunun testi.
- [ ] **Bilet Dağıtım Testi**: Admin onayı sonrası bileti görüntüleme testi.
