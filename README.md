# TALPA Etkinlik Platformu

Modern web tabanlı etkinlik yönetim ve dijital bilet dağıtım sistemi.

## Teknoloji Stack

- **Framework:** React 19 + Vite 6
- **Routing:** React Router v7
- **Styling:** Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **State Management:** TanStack Query (React Query)
- **Testing:** Vitest + Playwright
- **Type Safety:** TypeScript 5.8

## Proje Yapısı

```
├── src/
│   ├── modules/          # Modüler mimari (auth, booking, admin, vb.)
│   ├── shared/           # Paylaşılan utilities ve infrastructure
│   ├── components/       # React component'leri
│   └── pages/           # Sayfa component'leri
├── components/           # Legacy component'ler (migrasyon sürecinde)
├── docs/                # Dokümantasyon
└── supabase/            # Supabase schema ve migrations
```

## Hızlı Başlangıç

### Gereksinimler

- Node.js 18+ 
- npm veya yarn
- Supabase projesi

### Kurulum

1. **Dependency'leri yükle:**
```bash
npm install
```

2. **Environment variables oluştur:**
`.env.local` dosyası oluştur ve şunları ekle:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Önemli:** Vite projesi olduğu için environment variable'lar `VITE_` prefix'i ile başlamalıdır.

3. **Development server'ı başlat:**
```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## Scripts

- `npm run dev` - Development server başlat
- `npm run build` - Production build oluştur
- `npm run preview` - Production build'i preview et
- `npm test` - Unit test'leri çalıştır
- `npm run test:ui` - Test UI ile çalıştır
- `npm run test:coverage` - Test coverage raporu oluştur
- `npm run test:watch` - Watch mode'da test çalıştır

## Route Protection

Proje React Router ile client-side route protection kullanmaktadır:

- **Protected Routes:** `/admin`, `/ticket/:id` - Authentication gerektirir
- **Admin Routes:** `/admin` - Admin yetkisi gerektirir

Route protection `src/components/ProtectedRoute.tsx` component'i ile yapılmaktadır.

## Environment Variables

Tüm environment variable'lar `VITE_` prefix'i ile başlamalıdır:

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

**Not:** Next.js `NEXT_PUBLIC_` prefix'i artık desteklenmemektedir.

## Dokümantasyon

Detaylı dokümantasyon için `docs/` klasörüne bakın:

- `DEVELOPER_SETUP.md` - Geliştirici kurulum rehberi
- `DATABASE.md` - Veritabanı şeması
- `TESTING.md` - Test stratejisi
- `MODULAR_MONOLITH_GUIDE.md` - Mimari rehberi
- `archived/MIGRATION_NOTES.md` - Next.js'den Vite'a geçiş notları

## Notlar

- Bu proje **Vite** ile çalışmaktadır, Next.js kullanılmamaktadır
- Tüm Supabase işlemleri browser client ile yapılmaktadır (server-side client yok)
- Route protection React Router ve `ProtectedRoute` component'i ile yapılmaktadır

## Lisans

Private project - TALPA
