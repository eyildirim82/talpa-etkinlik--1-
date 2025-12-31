# Geliştirici Kurulum Rehberi

Bu doküman, Talpa Etkinlik Yönetim Sistemi'ni yerel geliştirme ortamında kurmak için adım adım rehberdir.

## İçindekiler

- [Gereksinimler](#gereksinimler)
- [Proje Kurulumu](#proje-kurulumu)
- [Supabase Kurulumu](#supabase-kurulumu)
- [Veritabanı Migrasyonu](#veritabanı-migrasyonu)
- [Environment Variables](#environment-variables)
- [Geliştirme Sunucusu](#geliştirme-sunucusu)
- [Yaygın Sorunlar](#yaygın-sorunlar)

## Gereksinimler

### Yazılım Gereksinimleri

- **Node.js**: v18.0.0 veya üzeri
- **npm**: v9.0.0 veya üzeri (veya yarn/pnpm)
- **Git**: Versiyon kontrolü için
- **Supabase Hesabı**: Ücretsiz hesap yeterli

### IDE Önerileri

- **VS Code**: Önerilen
- **TypeScript Extension**: VS Code için
- **ESLint Extension**: Kod kalitesi için
- **Prettier Extension**: Kod formatlama için

## Proje Kurulumu

### 1. Projeyi Klonlayın

```bash
git clone [repository-url]
cd talpa-etkinlik
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

**Not:** Eğer `package-lock.json` ile sorun yaşıyorsanız:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 3. Environment Variables Dosyasını Oluşturun

Proje kök dizininde `.env.local` dosyası oluşturun:

```bash
cp .env.example .env.local  # Eğer .env.example varsa
# veya
touch .env.local
```

`.env.local` dosyasına şu değişkenleri ekleyin:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

**Not:** Bu değerleri Supabase Dashboard'dan alacaksınız.

## Supabase Kurulumu

### 1. Supabase Projesi Oluşturun

1. [Supabase](https://supabase.com) sitesine gidin
2. "Start your project" butonuna tıklayın
3. GitHub ile giriş yapın (veya e-posta)
4. Yeni proje oluşturun:
   - **Name**: `talpa-etkinlik-dev` (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre seçin (kaydedin!)
   - **Region**: En yakın bölgeyi seçin

### 2. Supabase Credentials'ları Alın

1. Proje oluşturulduktan sonra **Settings** → **API** sayfasına gidin
2. Şu bilgileri kopyalayın:
   - **Project URL**: `VITE_SUPABASE_URL` değeri
   - **anon public key**: `VITE_SUPABASE_ANON_KEY` değeri

3. `.env.local` dosyasına yapıştırın

### 3. Storage Bucket'larını Oluşturun

1. **Storage** → **Buckets** sayfasına gidin
2. **New Bucket** butonuna tıklayın

**Bucket 1: event-banners**
- **Name**: `event-banners`
- **Public bucket**: ✅ Evet (Afişleri herkes görebilmeli)
- **File size limit**: 5 MB (veya istediğiniz limit)
- **Allowed MIME types**: `image/jpeg, image/png, image/webp`

**Bucket 2: tickets**
- **Name**: `tickets`
- **Public bucket**: ❌ Hayır (Gizli, sadece yetkili indirebilmeli)
- **File size limit**: 10 MB (veya istediğiniz limit)
- **Allowed MIME types**: `application/pdf`

### 4. Veritabanı Şemasını Oluşturun

**SQL Editor**'e gidin ve şu dosyaları sırasıyla çalıştırın:

1. **Enum Tipleri** (`veritabani.md`'den):
```sql
CREATE TYPE event_status AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
CREATE TYPE queue_status AS ENUM ('ASIL', 'YEDEK', 'IPTAL');
CREATE TYPE payment_status AS ENUM ('WAITING', 'PAID');
```

2. **Tablo Oluşturma** (`veritabani.md` veya `MIGRATION_GUIDE.md`'den):
   - `profiles` tablosu güncellemesi
   - `events` tablosu güncellemesi
   - `bookings` tablosu oluşturma
   - `ticket_pool` tablosu oluşturma

3. **RPC Fonksiyonları** (`veritabani.md`'den):
   - `join_event`
   - `assign_ticket`
   - `promote_from_waitlist`

4. **RLS Politikaları** (`veritabani.md`'den):
   - `profiles` RLS politikaları
   - `bookings` RLS politikaları
   - `ticket_pool` RLS politikaları

**Not:** Detaylı adımlar için `docs/MIGRATION_GUIDE.md` dosyasına bakın.

## Veritabanı Migrasyonu

### Otomatik Migrasyon (Önerilen)

Eğer `supabase/` klasöründe migration dosyaları varsa:

```bash
# Supabase CLI kurulumu (opsiyonel)
npm install -g supabase

# Migration'ları çalıştır
supabase db push
```

### Manuel Migrasyon

1. `docs/MIGRATION_GUIDE.md` dosyasını açın
2. Adım adım SQL komutlarını Supabase SQL Editor'de çalıştırın
3. Her adımdan sonra doğrulama sorgularını çalıştırın

## Environment Variables

### Geliştirme Ortamı (.env.local)

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opsiyonel: Development modu
VITE_APP_ENV=development
```

### Production Ortamı

Production'da environment variables:
- **Vercel**: Settings → Environment Variables
- **Netlify**: Site settings → Environment variables
- **Diğer**: Hosting sağlayıcınızın dokümantasyonuna bakın

## Geliştirme Sunucusu

### Sunucuyu Başlatın

```bash
npm run dev
```

Sunucu genellikle `http://localhost:5173` adresinde çalışır (Vite default port).

### Tarayıcıda Açın

1. Tarayıcınızda `http://localhost:5173` adresine gidin
2. Ana sayfayı görmelisiniz

### Hot Reload

Kod değişiklikleriniz otomatik olarak tarayıcıda yansır (Hot Module Replacement).

## İlk Kurulum Sonrası

### 1. Test Admin Kullanıcısı Oluşturun

Supabase Dashboard → **Authentication** → **Users** → **Add User**:

- **Email**: `admin@test.com`
- **Password**: Güçlü bir şifre
- **Auto Confirm User**: ✅ Evet

Sonra SQL Editor'de:
```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'admin@test.com';
```

### 2. Test Etkinliği Oluşturun

SQL Editor'de:
```sql
INSERT INTO public.events (
  title, description, event_date, location_url, price,
  quota_asil, quota_yedek, cut_off_date, status, banner_image
)
VALUES (
  'Test Etkinliği',
  'Bu bir test etkinliğidir',
  NOW() + INTERVAL '30 days',
  'https://maps.google.com/',
  500.00,
  50,
  30,
  NOW() + INTERVAL '25 days',
  'ACTIVE',
  NULL
);
```

### 3. Test Bilet Havuzu Yükleyin

1. Admin paneline giriş yapın
2. Etkinlik yönetimi sayfasına gidin
3. Test ZIP dosyası yükleyin (en az 10 PDF içeren)

## Yaygın Sorunlar

### Sorun 1: "Supabase URL or Key is missing"

**Çözüm:**
- `.env.local` dosyasının proje kök dizininde olduğundan emin olun
- Environment variable isimlerinin doğru olduğundan emin olun (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Sunucuyu yeniden başlatın (`npm run dev`)

### Sorun 2: "Row Level Security policy violation"

**Çözüm:**
- RLS politikalarının doğru kurulduğundan emin olun
- Test kullanıcısı ile giriş yaptığınızdan emin olun
- Admin işlemleri için admin kullanıcısı kullanın

### Sorun 3: "Function join_event does not exist"

**Çözüm:**
- RPC fonksiyonlarının Supabase'de oluşturulduğundan emin olun
- SQL Editor'de fonksiyonları kontrol edin:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'join_event';
```

### Sorun 4: "Cannot find module" Hataları

**Çözüm:**
```bash
# node_modules'ı temizle ve yeniden yükle
rm -rf node_modules package-lock.json
npm install
```

### Sorun 5: TypeScript Hataları

**Çözüm:**
- `src/types/supabase.ts` dosyasını Supabase'den generate edin:
```bash
# Supabase CLI ile (eğer kuruluysa)
supabase gen types typescript --project-id your-project-id > src/types/supabase.ts
```

- Veya Supabase Dashboard → **Settings** → **API** → **Generate TypeScript types**

### Sorun 6: Storage Upload Çalışmıyor

**Çözüm:**
- Bucket'ların oluşturulduğundan emin olun
- Bucket policy'lerini kontrol edin
- RLS politikalarını kontrol edin (tickets bucket için)

## Geliştirme İpuçları

### 1. TypeScript Tip Kontrolü

```bash
# Tip kontrolü yap
npm run type-check  # Eğer script varsa
# veya
npx tsc --noEmit
```

### 2. Linting

```bash
# ESLint çalıştır
npm run lint  # Eğer script varsa
```

### 3. Kod Formatlama

```bash
# Prettier çalıştır
npm run format  # Eğer script varsa
```

### 4. Veritabanı Değişikliklerini Test Etme

1. Test verileri oluşturun
2. SQL Editor'de sorguları çalıştırın
3. Frontend'de sonuçları kontrol edin

### 5. Debugging

**Browser Console:**
- F12 → Console sekmesi
- Hata mesajlarını kontrol edin

**Network Tab:**
- F12 → Network sekmesi
- Supabase API çağrılarını kontrol edin

**Supabase Logs:**
- Dashboard → **Logs** → **Postgres Logs**
- Database sorgularını kontrol edin

## Sonraki Adımlar

1. ✅ Kurulum tamamlandı
2. ⏭️ `docs/IMPLEMENTATION_CHECKLIST.md` dosyasına bakın
3. ⏭️ `docs/TESTING_GUIDE.md` dosyasına bakın
4. ⏭️ Geliştirmeye başlayın!

---

**Son Güncelleme:** 2025-01-XX

