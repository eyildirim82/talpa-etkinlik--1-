# TALPA Etkinlik Platformu - Teknik Tasarım Dokümanı (TDD)

**Versiyon:** 1.0.0  
**Tarih:** 24.05.2025  
**Durum:** Yayına Hazır (Production Ready)  
**Hazırlayan:** Lead Software Architect

---

## 1. Proje Özeti (Executive Summary)

**TALPA Etkinlik**, Türkiye Havayolu Pilotları Derneği (TALPA) üyeleri için geliştirilmiş, kapalı devre ve yüksek performanslı bir etkinlik biletleme platformudur.

### Temel Değer Önermesi
Pilotlar ve havacılık profesyonelleri, zaman yönetimi kritik olan, analitik düşünen bir kullanıcı kitlesidir. Geleneksel biletleme sitelerindeki reklam kirliliği, karmaşık filtreler ve yavaş süreçler bu profil için uygun değildir. Bu proje, **"Single Event Strategy" (Tek Etkinlik Stratejisi)** üzerine kurulmuştur. Sistem, herhangi bir anda sadece **TEK BİR** aktif etkinliğe odaklanır ve kullanıcıyı saniyeler içinde sonuca ulaştırır.

### Hedef Kitle
*   **Kullanıcılar:** TALPA Üyesi Pilotlar.
*   **Beklenti:** Hız, Netlik, Güvenilirlik ("Cockpit Clarity").

---

## 2. Teknoloji Yığını (Tech Stack)

Uygulama, modern web standartlarına uygun, ölçeklenebilir ve güvenli bir mimari üzerine inşa edilmiştir.

### Frontend (İstemci Tarafı)
*   **Framework:** Next.js 16 (App Router & Server Components).
*   **Dil:** TypeScript (Tip güvenliği ve kod kalitesi için).
*   **Stil:** Tailwind CSS (Utility-first yaklaşımı).
*   **İkon Seti:** Lucide React (Minimalist vektör ikonlar).
*   **State Management:** React Context (Auth & Global State) + React Server Actions.

### Backend & Veritabanı (Sunucu Tarafı)
*   **BaaS (Backend as a Service):** Supabase.
*   **Veritabanı:** PostgreSQL.
*   **Authentication:** Supabase Auth (Email/Password & Session Management).
*   **Business Logic:** PostgreSQL Functions (RPC) ve Triggers.

### Altyapı & Güvenlik
*   **Deploy:** Vercel / Netlify (Önerilen).
*   **Koruma:** Middleware tabanlı Rota Koruması ve RLS (Row Level Security).

---

## 3. Tasarım Dili: "Cockpit Clarity"

Arayüz tasarımı, bir uçak kokpitindeki göstergelerin netliğinden ilham almıştır. Dekoratif öğelerden arındırılmış, tamamen veriye odaklı bir "Data Density" (Veri Yoğunluğu) yaklaşımı benimsenmiştir.

*   **Tipografi:** Başlıklarda `Inter` (Okunabilirlik), sayısal verilerde `Roboto Mono` (Tabular hizalama).
*   **Renk Paleti:**
    *   *Zemin:* Pure White (#FFFFFF) & Slate Gray (#F8FAFC).
    *   *Aksiyon:* TALPA Blue (#2563EB).
    *   *Durum:* Emerald (Başarılı/Satişta), Rose (Hata/Kapalı), Amber (Uyarı).
*   **UX Akışı:** Linear Flow (Lineer Akış). Anasayfa -> Login -> Satın Al -> Bilet Görüntüle.

---

## 4. Sistem Mimarisi ve Veritabanı

Veritabanı, ilişkisel veri bütünlüğünü (Referential Integrity) koruyacak şekilde normalize edilmiştir.

### Veritabanı Şeması (Schema)

1.  **`profiles` Tablosu:**
    *   Kullanıcı detaylarını tutar. `auth.users` tablosu ile `id` üzerinden 1:1 ilişkilidir.
    *   *Alanlar:* `id` (PK), `full_name`, `talpa_sicil_no`, `role` ('admin' | 'member').

2.  **`events` Tablosu:**
    *   Etkinlik bilgilerini tutar.
    *   *Alanlar:* `id` (PK), `title`, `event_date`, `total_quota`, `price`, `is_active` (boolean).
    *   *Kritik:* `is_active` alanı, sistemde o an hangi etkinliğin "Yayında" olduğunu belirler.

3.  **`tickets` Tablosu:**
    *   Satın alınan biletleri tutar.
    *   *Alanlar:* `id` (PK), `event_id` (FK), `user_id` (FK), `status`, `qr_code`, `seat_number`.

### Kritik İş Kuralları (Business Logic)

#### A. "Single Active Event" Prensibi
Sistemde aynı anda sadece bir etkinlik aktif olabilir. Bu kural, uygulama katmanında değil, veritabanı seviyesinde **Transaction** ile garanti altına alınmıştır.
*   *Mekanizma:* Admin bir etkinliği aktif ettiğinde, veritabanı fonksiyonu (`set_active_event`) önce tüm etkinliklerin `is_active` değerini `false` yapar, ardından seçilen etkinliği `true` yapar.

#### B. Stok Yönetimi ve Race Condition
Son bilet için aynı anda iki pilotun butona basması durumunda (Race Condition), stok aşımını önlemek için **Atomik İşlemler** kullanılır.
*   *Çözüm:* `purchase_ticket` isimli PostgreSQL RPC fonksiyonu kullanılır. Bu fonksiyon:
    1.  Mevcut satılan bilet sayısını sayar.
    2.  `total_quota` ile karşılaştırır.
    3.  Eğer yer varsa bileti `insert` eder.
    4.  Tüm bu adımları tek bir "Database Transaction" içinde yapar. Hata olursa tüm işlemi geri alır (Rollback).

---

## 5. Temel Özellikler (Core Features)

### Kullanıcı Tarafı (Client Side)
1.  **Dinamik Dashboard:**
    *   Kullanıcı siteye girdiğinde sunucu tarafında (`page.tsx`) aktif etkinlik kontrol edilir.
    *   Aktif etkinlik yoksa "Radar Clear" (Empty State) gösterilir.
    *   Aktif etkinlik varsa "Hero" ve "InfoCockpit" bileşenleri yüklenir.
2.  **Güvenli Satın Alma:**
    *   Sadece giriş yapmış (`auth guard`) kullanıcılar satın alabilir.
    *   Server Action (`buyTicket`) üzerinden güvenli RPC çağrısı yapılır.
3.  **Dijital Boarding Pass:**
    *   Satın alma sonrası kullanıcıya özel QR kodlu bilet oluşturulur.
    *   Tasarım, mobil ekran görüntüsü almaya uygun dikey formattadır.

### Yönetici Paneli (Admin Side)
1.  **Operasyon Özeti:**
    *   Anlık doluluk oranı ve tahmini hasılat takibi.
2.  **Etkinlik Yönetimi:**
    *   Yeni etkinlik oluşturma formu.
    *   "Tek Tıkla Aktif Etme" butonu (Diğerlerini pasife çeker).
3.  **Yolcu Manifestosu:**
    *   Aktif etkinlik için bilet alanların listesi.
    *   Sicil No, İsim ve Telefon verilerinin tablosal görünümü.

---

## 6. Güvenlik Önlemleri

### Row Level Security (RLS)
Supabase üzerinde veri erişimi katı kurallarla sınırlandırılmıştır:
*   `profiles`: Herkes kendi profilini görebilir. Adminler herkesi görebilir.
*   `events`: Herkes aktif etkinlikleri görebilir. Sadece Adminler tüm etkinlikleri düzenleyebilir.
*   `tickets`: Kullanıcı sadece kendi biletini görebilir (`auth.uid() = user_id`). Adminler tüm biletleri görebilir.

### Middleware & Rota Koruması
*   `middleware.ts`: Her istekte oturum (session) tazelemesi yapar.
*   `/admin/*` rotaları `layout.tsx` içinde sunucu taraflı (Server-Side) rol kontrolü yapar. Rolü `admin` olmayan istekler anasayfaya yönlendirilir.

### Input Validation
*   Form verileri Server Action'lar içerisinde işlenir.
*   Type-safety, TypeScript interface'leri (`types.ts`) ile sağlanır.

---

## 7. Kurulum ve Çalıştırma (Getting Started)

Projeyi yerel ortamda çalıştırmak için aşağıdaki adımları izleyin.

### Gereksinimler
*   Node.js 18+
*   NPM veya PNPM

### Kurulum Adımları

1.  **Repoyu Klonlayın:**
    ```bash
    git clone [repo-url]
    cd talpa-etkinlik
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Çevresel Değişkenleri Ayarlayın:**
    `.env.local` dosyası oluşturun ve Supabase bilgilerinizi girin:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
    ```

4.  **Geliştirme Sunucusunu Başlatın:**
    ```bash
    npm run dev
    ```
    Uygulama `http://localhost:3000` adresinde çalışacaktır.

---
**Not:** Bu doküman, projenin mimari bütünlüğünü korumak amacıyla yazılım ekibi tarafından referans alınmalıdır. Yeni özellik eklemelerinde "Single Event" prensibine ve "Cockpit Clarity" tasarım diline sadık kalınmalıdır.
