# Next.js'den Vite'a Geçiş Notları

**Tarih:** 2026-01-XX  
**Proje:** TALPA Etkinlik Platformu

## Genel Bakış

Proje Next.js'den Vite'a geçirilmiştir. Bu dokümantasyon yapılan değişiklikleri ve nedenlerini açıklar.

## Neden Vite?

1. **Proje Tipi:** Internal admin/üye paneli - SEO gerekmiyor
2. **Mimari:** Zaten React Router kullanılıyor - SPA yapısına uygun
3. **Performans:** Daha hızlı dev server, daha küçük bundle
4. **Basitlik:** Daha az konfigürasyon, daha kolay bakım

## Yapılan Değişiklikler

### 1. Dependency Temizliği

- `next` dependency'si kaldırıldı
- `vite-next-stub.js` dosyası kaldırıldı
- `middleware.ts` arşivlendi (`docs/archived/middleware.ts`)

### 2. Route Protection

**Önce:** Next.js middleware ile server-side route protection  
**Sonra:** React Router ve `ProtectedRoute` component'i ile client-side protection

**Değişiklikler:**
- `src/components/ProtectedRoute.tsx` geliştirildi
  - Admin kontrolü eklendi (`requireAdmin` prop)
  - Type safety iyileştirildi
  - Error handling eklendi
- `src/shared/hooks/useAdminCheck.ts` hook'u oluşturuldu
- `App.tsx`'te route'lar `ProtectedRoute` ile sarmalandı

### 3. Image Component

**Önce:** `next/image` component'i kullanılıyordu  
**Sonra:** Standart `<img>` tag'i kullanılıyor

**Değişiklikler:**
- `components/Hero.tsx` güncellendi
- `fill` prop'u yerine Tailwind class'ları kullanıldı
- `priority` prop'u yerine `loading="eager"` kullanıldı

### 4. Server-Side Supabase Client

**Önce:** Server-side ve browser client'lar vardı  
**Sonra:** Sadece browser client kullanılıyor

**Arşivlenen Dosyalar:**
- `utils/supabase/server.ts` → `docs/archived/utils-supabase-server.ts`
- `src/shared/infrastructure/supabase/server.ts` → `docs/archived/shared-supabase-server.ts`
- `src/shared/infrastructure/supabase/index.ts` temizlendi

**Neden:** Vite SPA olduğu için server-side client'a gerek yok

### 5. Environment Variables

**Önce:** `NEXT_PUBLIC_` prefix kullanılıyordu (fallback ile)  
**Sonra:** Sadece `VITE_` prefix kullanılıyor

**Değişiklikler:**
- Tüm `NEXT_PUBLIC_` referansları kaldırıldı
- `src/shared/infrastructure/config/env.ts` güncellendi
- Hata mesajları iyileştirildi (throw error instead of empty string)

**Etkilenen Dosyalar:**
- `utils/supabase/browser.ts`
- `src/lib/supabase.ts`
- `utils/supabase/client.ts`
- `src/shared/infrastructure/supabase/browser.ts`
- `test-connection.js`

### 6. Vite Config Temizliği

**Kaldırılanlar:**
- `ignoreNextPlugin()` fonksiyonu
- `fs.deny` array'inden `**/middleware.ts` ve `**/app/**`
- `optimizeDeps.exclude` array'inden Next.js paketleri
- `ssr.external` array'inden Next.js paketleri

### 7. Test Dosyaları

**Güncellemeler:**
- `components/Hero.test.tsx` - `next/image` mock'u kaldırıldı
- `src/shared/infrastructure/supabase/browser.test.ts` - NEXT_PUBLIC_ fallback testi kaldırıldı
- `src/shared/infrastructure/config/env.test.ts` - NEXT_PUBLIC_ fallback testleri kaldırıldı, error throw testleri eklendi
- `src/shared/infrastructure/supabase/server.test.ts` arşivlendi

## Migration Checklist

- [x] Next.js dependency kaldırıldı
- [x] Stub dosyası kaldırıldı
- [x] Middleware arşivlendi
- [x] Route protection React Router'a taşındı
- [x] Admin hook oluşturuldu
- [x] ProtectedRoute geliştirildi
- [x] next/image standart img'e çevrildi
- [x] Server-side Supabase client'lar arşivlendi
- [x] Environment variables standardize edildi
- [x] Vite config temizlendi
- [x] Test dosyaları güncellendi

## Breaking Changes

1. **Environment Variables:** Artık sadece `VITE_` prefix kullanılıyor
2. **Route Protection:** Middleware yerine React Router component'i kullanılıyor
3. **Server-Side Client:** Artık mevcut değil - sadece browser client

## Notlar

- Arşivlenmiş dosyalar `docs/archived/` klasöründe saklanmaktadır
- Gelecekte Next.js'e geri dönülmesi durumunda referans için kullanılabilir
- Tüm değişiklikler geriye dönük uyumlu değildir - migration gerektirir
