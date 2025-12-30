# Deployment Kılavuzu

Bu doküman, TALPA Etkinlik Platformu'nu production ortamına deploy etme adımlarını açıklar.

## İçindekiler

- [Gereksinimler](#gereksinimler)
- [Supabase Kurulumu](#supabase-kurulumu)
- [Environment Variables](#environment-variables)
- [Vercel Deployment](#vercel-deployment)
- [Netlify Deployment](#netlify-deployment)
- [Post-Deployment](#post-deployment)
- [Sorun Giderme](#sorun-giderme)

## Gereksinimler

### Hesap Gereksinimleri

- **Supabase Hesabı**: [supabase.com](https://supabase.com) üzerinden ücretsiz hesap
- **Vercel/Netlify Hesabı**: Deployment platformu hesabı
- **GitHub/GitLab Hesabı**: Kod repository'si (opsiyonel, ancak önerilir)

### Yerel Gereksinimler

- Node.js 18+ yüklü
- Git yüklü
- Terminal/Command Line erişimi

---

## Supabase Kurulumu

### 1. Supabase Projesi Oluşturma

1. [Supabase Dashboard](https://app.supabase.com) üzerinden giriş yapın
2. "New Project" butonuna tıklayın
3. Proje bilgilerini girin:
   - **Name**: `talpa-etkinlik` (veya istediğiniz isim)
   - **Database Password**: Güçlü bir şifre seçin (kaydedin!)
   - **Region**: En yakın bölgeyi seçin (örn: `West Europe`)
4. Projeyi oluşturun (2-3 dakika sürebilir)

### 2. Veritabanı Şemasını Kurma

1. Supabase Dashboard'da **SQL Editor** sekmesine gidin
2. `schema.sql` dosyasındaki içeriği kopyalayın ve çalıştırın

**Önemli:** Eğer `schema.sql` dosyası boşsa, aşağıdaki temel şemayı kullanın:

```sql
-- Profiles tablosu
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  talpa_sicil_no TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Events tablosu
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'TRY',
  total_quota INTEGER NOT NULL CHECK (total_quota > 0),
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets tablosu
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  qr_code TEXT NOT NULL UNIQUE,
  seat_number TEXT,
  gate TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status) WHERE status != 'cancelled';
```

### 3. RPC Fonksiyonlarını Ekleme

1. **SQL Editor**'de `supabase_rpc.sql` dosyasındaki içeriği çalıştırın

**Önemli:** Eğer dosya boşsa, aşağıdaki fonksiyonları ekleyin:

```sql
-- purchase_ticket fonksiyonu
CREATE OR REPLACE FUNCTION purchase_ticket(
  p_event_id UUID,
  p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event RECORD;
  v_sold_count INTEGER;
  v_ticket_id UUID;
  v_qr_code TEXT;
BEGIN
  -- Etkinlik kontrolü
  SELECT * INTO v_event FROM events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;
  
  IF NOT v_event.is_active THEN
    RAISE EXCEPTION 'EVENT_NOT_ACTIVE';
  END IF;
  
  -- Stok kontrolü
  SELECT COUNT(*) INTO v_sold_count
  FROM tickets
  WHERE event_id = p_event_id AND status != 'cancelled';
  
  IF v_sold_count >= v_event.total_quota THEN
    RAISE EXCEPTION 'SOLD_OUT';
  END IF;
  
  -- QR kod oluştur
  v_qr_code := 'TALPA-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD((v_sold_count + 1)::TEXT, 4, '0');
  
  -- Bilet oluştur
  INSERT INTO tickets (event_id, user_id, qr_code, status)
  VALUES (p_event_id, p_user_id, v_qr_code, 'paid')
  RETURNING id INTO v_ticket_id;
  
  RETURN v_ticket_id;
END;
$$;

-- set_active_event fonksiyonu
CREATE OR REPLACE FUNCTION set_active_event(
  p_event_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Etkinlik kontrolü
  IF NOT EXISTS (SELECT 1 FROM events WHERE id = p_event_id) THEN
    RAISE EXCEPTION 'EVENT_NOT_FOUND';
  END IF;
  
  -- Tüm etkinlikleri pasif yap
  UPDATE events SET is_active = false;
  
  -- Seçilen etkinliği aktif yap
  UPDATE events SET is_active = true WHERE id = p_event_id;
END;
$$;
```

### 4. Row Level Security (RLS) Politikalarını Ayarlama

**Profiles Tablosu:**

```sql
-- RLS'yi etkinleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- SELECT: Kullanıcılar kendi profilini görebilir, adminler hepsini
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR 
         (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- UPDATE: Kullanıcılar kendi profilini güncelleyebilir, adminler hepsini
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR 
         (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

**Events Tablosu:**

```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- SELECT: Herkes aktif etkinlikleri görebilir, adminler hepsini
CREATE POLICY "Anyone can view active events"
  ON events FOR SELECT
  USING (is_active = true OR 
         (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- INSERT/UPDATE/DELETE: Sadece adminler
CREATE POLICY "Only admins can manage events"
  ON events FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

**Tickets Tablosu:**

```sql
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- SELECT: Kullanıcılar kendi biletlerini görebilir, adminler hepsini
CREATE POLICY "Users can view own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id OR 
         (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- INSERT: Sadece RPC fonksiyonu (SECURITY DEFINER)
-- UPDATE: Sadece adminler
CREATE POLICY "Only admins can update tickets"
  ON tickets FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
```

### 5. İlk Admin Kullanıcı Oluşturma

1. **Authentication** sekmesinde **Users** bölümüne gidin
2. "Add User" butonuna tıklayın
3. E-posta ve şifre ile kullanıcı oluşturun
4. Oluşturulan kullanıcının ID'sini kopyalayın
5. **SQL Editor**'de aşağıdaki komutu çalıştırın (ID'yi değiştirin):

```sql
-- Profil oluştur
INSERT INTO profiles (id, full_name, role)
VALUES ('USER_ID_BURAYA', 'Admin Kullanıcı', 'admin');
```

---

## Environment Variables

### Yerel Geliştirme (.env.local)

Proje kök dizininde `.env.local` dosyası oluşturun:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Değerleri Nereden Bulurum?**

1. Supabase Dashboard'da **Settings** → **API** sekmesine gidin
2. **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
3. **anon/public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Production Environment Variables

Deployment platformunda (Vercel/Netlify) aynı değişkenleri ekleyin.

---

## Vercel Deployment

### 1. Projeyi Vercel'e Bağlama

1. [Vercel Dashboard](https://vercel.com) üzerinden giriş yapın
2. "Add New Project" butonuna tıklayın
3. GitHub/GitLab repository'nizi seçin veya manuel olarak yükleyin
4. Proje ayarlarını yapılandırın:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (veya proje kök dizini)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 2. Environment Variables Ekleme

1. Proje ayarlarında **Environment Variables** sekmesine gidin
2. Aşağıdaki değişkenleri ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Production**, **Preview**, ve **Development** için işaretleyin
4. "Deploy" butonuna tıklayın

### 3. Build Ayarları

**Vercel otomatik olarak Next.js projelerini algılar**, ancak manuel ayar gerekirse:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install"
}
```

### 4. Custom Domain (Opsiyonel)

1. **Settings** → **Domains** sekmesine gidin
2. Domain adresinizi ekleyin
3. DNS kayıtlarını yapılandırın

---

## Netlify Deployment

### 1. Projeyi Netlify'e Bağlama

1. [Netlify Dashboard](https://app.netlify.com) üzerinden giriş yapın
2. "Add new site" → "Import an existing project" seçin
3. GitHub/GitLab repository'nizi bağlayın

### 2. Build Ayarları

**Netlify.toml** dosyası oluşturun (proje kök dizininde):

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

Veya Netlify Dashboard'da:
- **Build command**: `npm run build`
- **Publish directory**: `.next`

### 3. Environment Variables Ekleme

1. **Site settings** → **Environment variables** sekmesine gidin
2. Aşağıdaki değişkenleri ekleyin:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. "Deploy site" butonuna tıklayın

---

## Post-Deployment

### 1. Deployment Kontrol Listesi

- [ ] Uygulama erişilebilir mi? (URL'yi test edin)
- [ ] Environment variables doğru mu? (Browser console'da hata var mı?)
- [ ] Supabase bağlantısı çalışıyor mu?
- [ ] Authentication çalışıyor mu? (Giriş yapmayı test edin)
- [ ] Admin paneli erişilebilir mi? (`/admin`)
- [ ] Bilet satın alma işlemi çalışıyor mu?

### 2. İlk Testler

1. **Kullanıcı Kaydı**: Yeni bir kullanıcı oluşturun
2. **Etkinlik Oluşturma**: Admin olarak giriş yapın, etkinlik oluşturun
3. **Etkinlik Aktif Etme**: Etkinliği aktif yapın
4. **Bilet Satın Alma**: Üye olarak giriş yapın, bilet satın alın
5. **Bilet Görüntüleme**: Bilet sayfasını kontrol edin

### 3. Monitoring Kurulumu

**Önerilen Araçlar:**
- **Vercel Analytics**: Vercel Dashboard'da otomatik
- **Supabase Logs**: Supabase Dashboard → Logs
- **Error Tracking**: Sentry (opsiyonel)

---

## Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

#### 1. "Supabase connection error"

**Sorun:** Uygulama Supabase'e bağlanamıyor.

**Çözüm:**
- Environment variables'ların doğru olduğundan emin olun
- Supabase projesinin aktif olduğunu kontrol edin
- CORS ayarlarını kontrol edin (Supabase Dashboard → Settings → API)

#### 2. "Authentication failed"

**Sorun:** Giriş yapılamıyor.

**Çözüm:**
- Supabase Auth ayarlarını kontrol edin
- Email/Password provider'ın aktif olduğundan emin olun
- Email confirmation gerekip gerekmediğini kontrol edin (Settings → Auth)

#### 3. "RLS policy violation"

**Sorun:** Veri erişim hatası.

**Çözüm:**
- RLS politikalarının doğru kurulduğundan emin olun
- Kullanıcı rolünün doğru olduğunu kontrol edin
- Supabase Logs'da detaylı hata mesajını inceleyin

#### 4. "RPC function not found"

**Sorun:** `purchase_ticket` veya `set_active_event` bulunamıyor.

**Çözüm:**
- SQL Editor'de RPC fonksiyonlarının çalıştırıldığından emin olun
- Fonksiyon isimlerinin doğru olduğunu kontrol edin
- `SECURITY DEFINER` ayarının olduğundan emin olun

#### 5. Build hatası

**Sorun:** Deployment sırasında build başarısız.

**Çözüm:**
- Node.js versiyonunun 18+ olduğundan emin olun
- `package.json` dosyasındaki dependencies'leri kontrol edin
- Build loglarını inceleyin (Vercel/Netlify Dashboard)

#### 6. "Page not found" (404)

**Sorun:** Sayfalar yüklenmiyor.

**Çözüm:**
- Next.js routing yapısını kontrol edin
- `app/` klasör yapısının doğru olduğundan emin olun
- Middleware'in routing'i engellemediğini kontrol edin

---

## Production Checklist

### Güvenlik

- [ ] Environment variables production'da doğru ayarlanmış
- [ ] RLS politikaları aktif ve test edilmiş
- [ ] Admin kullanıcılar güvenli şifrelerle oluşturulmuş
- [ ] HTTPS aktif (Vercel/Netlify otomatik sağlar)
- [ ] CORS ayarları doğru yapılandırılmış

### Performans

- [ ] Build optimizasyonları aktif
- [ ] Image optimization aktif (Next.js Image component)
- [ ] Database index'leri oluşturulmuş
- [ ] CDN aktif (Vercel/Netlify otomatik sağlar)

### Monitoring

- [ ] Error tracking kurulmuş
- [ ] Analytics kurulmuş
- [ ] Log monitoring aktif
- [ ] Uptime monitoring (opsiyonel)

---

## Backup Stratejisi

### Veritabanı Backup

1. **Supabase Otomatik Backup**: Günlük otomatik backup alınır
2. **Manuel Backup**: Supabase Dashboard → Database → Backups
3. **Schema Backup**: SQL dosyaları version control'de tutulmalı

### Kod Backup

- Git repository'de tüm kod saklanır
- Production branch korunmalı
- Tag'ler ile versiyonlama yapılmalı

---

## Güncelleme Süreci

### 1. Yeni Özellik Deploy Etme

1. Feature branch'de geliştirme yapın
2. Test edin (local + staging)
3. Main branch'e merge edin
4. Vercel/Netlify otomatik deploy eder
5. Production'da test edin

### 2. Veritabanı Migration

1. Migration SQL script'i hazırlayın
2. Supabase SQL Editor'de test edin
3. Production'da çalıştırın
4. Geri alma planı hazırlayın

---

**Son Güncelleme:** 2025-01-XX

