<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TALPA Etkinlik Platformu

Türkiye Havayolu Pilotları Derneği (TALPA) üyeleri için geliştirilmiş, kapalı devre ve yüksek performanslı bir etkinlik biletleme platformudur.

## 📋 İçindekiler

- [Özellikler](#-özellikler)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Hızlı Başlangıç](#-hızlı-başlangıç)
- [Proje Yapısı](#-proje-yapısı)
- [Dokümantasyon](#-dokümantasyon)
- [Katkıda Bulunma](#-katkıda-bulunma)

## ✨ Özellikler

### Kullanıcı Özellikleri
- 🎫 **Tek Etkinlik Odaklı Arayüz**: Herhangi bir anda sadece tek bir aktif etkinlik gösterilir
- 🔐 **Güvenli Kimlik Doğrulama**: Supabase Auth ile email/şifre tabanlı giriş
- 💳 **Hızlı Bilet Satın Alma**: Saniyeler içinde bilet alma işlemi
- 📱 **Dijital Boarding Pass**: QR kodlu dijital bilet görüntüleme
- 📊 **Gerçek Zamanlı Stok Takibi**: Anlık kalan kontenjan bilgisi

### Yönetici Özellikleri
- 📈 **Operasyon Özeti**: Anlık doluluk oranı ve tahmini hasılat takibi
- 🎪 **Etkinlik Yönetimi**: Yeni etkinlik oluşturma ve aktif etkinlik belirleme
- 👥 **Yolcu Manifestosu**: Aktif etkinlik için bilet alanların detaylı listesi

## 🛠 Teknoloji Yığını

### Frontend
- **Framework**: Next.js 16 (App Router & Server Components)
- **Dil**: TypeScript
- **Stil**: Tailwind CSS
- **İkon Seti**: Lucide React
- **State Management**: React Context + React Server Actions

### Backend & Veritabanı
- **BaaS**: Supabase
- **Veritabanı**: PostgreSQL
- **Authentication**: Supabase Auth
- **Business Logic**: PostgreSQL RPC Functions

### Altyapı
- **Build Tool**: Vite
- **Deploy**: Vercel / Netlify (Önerilen)
- **Güvenlik**: Middleware + Row Level Security (RLS)

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18 veya üzeri
- NPM veya PNPM
- Supabase hesabı

### Kurulum Adımları

1. **Repoyu Klonlayın**
   ```bash
   git clone [repo-url]
   cd talpa-etkinlik
   ```

2. **Bağımlılıkları Yükleyin**
   ```bash
   npm install
   ```

3. **Supabase Backend Kurulumu**
   
   Detaylı kurulum için [SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) dosyasını takip edin:
   
   - Supabase projesi oluşturun
   - SQL dosyalarını sırayla çalıştırın (`schema.sql`, `rls_policies.sql`, `functions.sql`, `storage.sql`)
   - Storage bucket oluşturun
   - `.env.local` dosyasını yapılandırın:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```
   - İlk admin kullanıcısı oluşturun

4. **Geliştirme Sunucusunu Başlatın**
   ```bash
   npm run dev
   ```
   
   Uygulama `http://localhost:5173` adresinde çalışacaktır (Vite default port).

### Geliştirme Komutları

```bash
# Geliştirme sunucusunu başlat
npm run dev

# Production build oluştur
npm run build

# Production build'i önizle
npm run preview
```

## 📁 Proje Yapısı

```
talpa-etkinlik/
├── app/                    # Next.js App Router sayfaları
│   ├── admin/             # Yönetici paneli
│   ├── ticket/            # Bilet görüntüleme
│   └── page.tsx           # Ana sayfa
├── actions/               # Server Actions
│   ├── admin.ts          # Admin işlemleri
│   ├── auth.ts           # Kimlik doğrulama
│   └── purchase.ts       # Bilet satın alma
├── components/           # React bileşenleri
│   ├── ui/              # UI bileşenleri
│   └── ...              # Diğer bileşenler
├── contexts/            # React Context'ler
├── utils/               # Yardımcı fonksiyonlar
│   └── supabase/       # Supabase client'ları
├── supabase/            # 🆕 Backend SQL dosyaları
│   ├── schema.sql       # Database schema
│   ├── rls_policies.sql # Row Level Security
│   ├── functions.sql    # RPC fonksiyonları
│   └── storage.sql      # Storage konfigürasyonu
├── types.ts             # TypeScript tip tanımları
├── middleware.ts        # Next.js middleware
└── docs/                # Dokümantasyon
    ├── SUPABASE_SETUP.md  # 🆕 Backend kurulum kılavuzu
    └── API_GUIDE.md       # 🆕 API kullanım örnekleri
```

## 📚 Dokümantasyon

Detaylı dokümantasyon için aşağıdaki dosyalara bakabilirsiniz:

### Backend Dokümantasyonu
- **[Supabase Kurulum Kılavuzu](docs/SUPABASE_SETUP.md)** - Adım adım backend kurulumu
- **[API Kullanım Kılavuzu](docs/API_GUIDE.md)** - Supabase API kullanım örnekleri
- **[Teknik Tasarım Dokümanı](TECHNICAL_DESIGN_DOCUMENT.md)** - Detaylı teknik tasarım

### SQL Dosyaları
- **[schema.sql](supabase/schema.sql)** - Database tablolar ve view'lar
- **[rls_policies.sql](supabase/rls_policies.sql)** - Row Level Security politikaları
- **[functions.sql](supabase/functions.sql)** - RPC business logic fonksiyonları
- **[storage.sql](supabase/storage.sql)** - Storage bucket konfigürasyonu

## 🎨 Tasarım Prensibi

Bu proje **"Cockpit Clarity"** tasarım dili üzerine kurulmuştur. Uçak kokpitindeki göstergelerin netliğinden ilham alınarak, dekoratif öğelerden arındırılmış, tamamen veriye odaklı bir arayüz sunar.

### Temel Prensipler
- **Single Event Strategy**: Herhangi bir anda sadece tek bir aktif etkinlik
- **Data Density**: Yüksek veri yoğunluğu, minimal dekorasyon
- **Linear Flow**: Basit ve doğrusal kullanıcı akışı

## 🔒 Güvenlik

- **Row Level Security (RLS)**: Veritabanı seviyesinde veri erişim kontrolü
- **Middleware Koruması**: Her istekte oturum tazelemesi
- **Server-Side Validation**: Tüm form verileri sunucu tarafında doğrulanır
- **Role-Based Access**: Admin ve member rolleri ile erişim kontrolü

## 🤝 Katkıda Bulunma

1. Bu repoyu fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📝 Lisans

Bu proje TALPA (Türkiye Havayolu Pilotları Derneği) için özel olarak geliştirilmiştir.

## 📞 İletişim

Sorularınız için TALPA yönetimi ile iletişime geçebilirsiniz.

---

**Not**: Bu doküman, projenin mimari bütünlüğünü korumak amacıyla yazılım ekibi tarafından referans alınmalıdır. Yeni özellik eklemelerinde "Single Event" prensibine ve "Cockpit Clarity" tasarım diline sadık kalınmalıdır.
