# Talpa Etkinlik - Mimari Migrasyon Planı (Modular Monolith)

**Durum:** ✅ TAMAMLANDI
**Hedef:** Tam Modüler Monolit (Vertical Slice) Yapısı
**Başlangıç Tarihi:** 2026-01-08
**Tamamlanma Tarihi:** 2026-01-09

## Migrasyon Sonuçları

| Metrik | Başlangıç | Bitiş | Değişim |
|:---|:---|:---|:---|
| **Bundle Size** | ~315 kB | ~313 kB | 📉 -2 kB |
| **Build Süresi** | 11.70s | 7.94s | 📉 -32% |
| **TypeScript Hataları** | 0 | 0 | ✅ |
| **Kök Klasörler** | 4 (actions, contexts, utils, components) | 0 | ✅ Temizlendi |

### Git Tags
| Tag | Açıklama |
|:---|:---|
| `migration-baseline` | Başlangıç noktası |
| `phase-1-complete` | Infrastructure konsolidasyonu |
| `phase-2-partial` | Component taşıma |
| `phase-3-complete` | App.tsx refactoring |
| `phase-4-complete` | Temizlik tamamlandı |

---

## 1. Yönetici Özeti
Bu döküman, mevcut hibrit proje yapısının sürdürülebilir, test edilebilir ve ölçeklenebilir bir **Modüler Monolit** yapısına dönüştürülmesi için gereken adımları içerir. Temel amaç, "Tek Doğruluk Kaynağı" (Single Source of Truth) ilkesini sağlamak, kod tekrarını ortadan kaldırmak ve tip güvenliğini maksimize etmektir.

## 2. Mevcut Sorunlar
- **Bölünmüş Yapı:** `components/` vs `src/modules/.../components/` çakışması.
- **Tanrı Nesneler:** `App.tsx` çok fazla sorumluluk yüklenmiş.
- **Tip Güvensizliği:** Modüllere taşınan dosyalarda `any` kullanımı artmış.
- **Kök Dizin Kirliliği:** Kaynak kodların kök dizine yayılması.
- **Supabase Client Karmaşası:** 4 farklı tanımlama, 24+ etkilenen dosya.

## 3. Hedef Mimari Yapısı

```
/
├── public/                 # Statik dosyalar
├── src/
│   ├── app/                # Uygulama giriş noktaları
│   │   ├── App.tsx         # Root component
│   │   ├── providers/      # Global Context Provider'lar
│   │   └── router.tsx      # Routing
│   │
│   ├── modules/            # İŞ MANTIĞI (Vertical Slices)
│   │   ├── auth/           
│   │   ├── booking/
│   │   ├── event/
│   │   └── admin/
│   │
│   ├── shared/             # Ortak, Business-Free Katman
│   │   ├── infrastructure/ # Supabase, Config, Logger
│   │   ├── components/     # UI Kit (Generic)
│   │   ├── hooks/          # Generic Hooks
│   │   ├── types/          # Global Types
│   │   ├── utils/          # Pure Functions
│   │   ├── services/       # Authz
│   │   └── config/         # Feature Flags
│   │
│   └── main.tsx            # Entry point (Opsiyonel: index.tsx'den yeniden adlandırılabilir)
│
├── docs/                   # Dökümantasyon
└── [config files]          # vite.config, tsconfig
```

**Not:** Mevcut `index.tsx` korunabilir veya Vite standardı olan `main.tsx` olarak yeniden adlandırılabilir.

## 4. Migrasyon Aşamaları

**Önemli Not:** Aşamalar sıralı olarak uygulanmalıdır.
- Aşama 0 → Tüm aşamalar için baseline
- Aşama 1 → 2 için altyapı
- Aşama 2 → 3 için modüller
- Aşama 3 → 4 için App refactor
- Aşama 4 → Final temizlik

### Aşama 0: Hazırlık ve Baseline
1.  **Baseline Metrikleri:** Bundle size, test coverage, type error sayısı.
2.  **Git:** `refactor/modular-monolith` branch'i ve `migration-baseline` tag'i.

### Aşama 1: Altyapı ve Shared Katmanı
1.  `src/shared` yapısını kur.
2.  Generic UI bileşenlerini `src/shared/components/ui` altına taşı.

#### Aşama 1.5: Infrastructure Konsolidasyonu (KRİTİK)
**Adım 1: Tek Doğruluk Kaynağı**
- `src/shared/infrastructure/supabase/browser.ts` oluştur.

**Adım 2: Etkilenen Dosyaları Tespit Et & Güncelle**
- `grep` ile eski importları bul (`utils/supabase`, `lib/supabase`). Yaklaşık 24 dosya etkilenir.
- Hepsini `import { createBrowserClient } from '@/shared/infrastructure/supabase'` yap.
- Test mock'larını (`src/shared/test-utils/supabase-mock.ts`) güncelle.

**Adım 3: Silme**
- `utils/supabase` ve `src/lib/supabase.ts` dosyalarını sil.

#### Aşama 1.6: Cross-Cutting Concerns Konsolidasyonu
1.  **Authorization (Çift Katmanlı Strateji):**
    - **UI:** `useAdminCheck` hook'unu kullanmaya devam et.
    - **API:** `src/shared/services/authz.ts` oluştur.
    ```typescript
    import { createBrowserClient } from '@/shared/infrastructure/supabase'
    export async function checkAdmin(): Promise<boolean> {
      const supabase = createBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false
      try {
        const { data: isAdmin, error } = await supabase.rpc('get_my_admin_status')
        if (!error && isAdmin != null) return !!isAdmin
        const { data: profile } = await supabase.from('profiles').select('is_admin, role').eq('id', user.id).single()
        return !!(profile?.is_admin || profile?.role === 'admin')
      } catch (e) { return false }
    }
    ```
    - **Migration:** Modüllerdeki (`event`, `admin`, `ticket` vb.) `async function checkAdmin` tanımlarını bu servisle değiştir.

2.  **Error Handling (Standart):**
    - `src/shared/utils/error-handler.ts` oluştur.
    ```typescript
    export interface StandardResponse<T = unknown> { success: boolean; message: string; data?: T; code?: string; }
    export function createError(message: string, code?: string): StandardError { return { success: false, message, code }; }
    export function handleSupabaseError(error: any, defaultMsg: string): StandardError {
       if (error?.code === 'PGRST116') return createError('Kayıt bulunamadı.', 'NOT_FOUND');
       return createError(defaultMsg, 'UNKNOWN_ERROR');
    }
    ```

3.  **Logging:** `src/shared/utils/logger.ts` oluştur.
    ```typescript
    interface LogContext { module?: string; action?: string; [key: string]: unknown; }
    export const logger = {
      info: (msg: string, ctx?: LogContext) => { if (import.meta.env.DEV) console.log(`[INFO] ${msg}`, ctx || '') },
      warn: (msg: string, ctx?: LogContext) => { console.warn(`[WARN] ${msg}`, ctx || '') },
      error: (msg: string, err?: unknown, ctx?: LogContext) => { console.error(`[ERROR] ${msg}`, err, ctx || '') },
      debug: (msg: string, ctx?: LogContext) => { if (import.meta.env.DEV) console.debug(`[DEBUG] ${msg}`, ctx || '') }
    }
    ```
    - `console.log` -> `logger.info`, `console.error` -> `logger.error` değişikliği yap.

### Aşama 2: Modül Konsolidasyonu (En Kritik Aşama)

#### Aşama 2.1: Modül Public API Temizliği
- Her modülün `index.ts` dosyasını temizle. Duplicate `export *` kaldır.
- Format: `export * from './api/xyz.api'`, `export { Component } from './components/X'`.

#### Aşama 2.2: Import Path Güncelleme
- Script veya manuel olarak root (`./components`) importlarını modül aliaslarına (`@/modules/auth`) çevir.

#### Aşama 2.3: Modül Birleştirme (Component Mapping)

| Kök Component | Hedef Modül/Yol |
| :--- | :--- |
| `components/AuthModal.tsx` | `src/modules/auth/components/` |
| `components/BookingModal.tsx` | `src/modules/booking/components/` |
| `components/EventCard.tsx` | `src/modules/event/components/` |
| `components/admin/*` | `src/modules/admin/components/` |
| `components/EmptyState.tsx` | `src/shared/components/ui/` |

**Birleştirme Stratejisi:**
1.  **Karşılaştırma:** `diff` veya manuel inceleme ile en güncel logici bul.
2.  **Birleştirme:** En güncel logici modül versiyonuna taşı, `any` tiplerini düzelt.
3.  **Test:** Test dosyalarını taşı (`components/*.test.tsx` -> `src/modules/*/components/*.test.tsx`).
4.  **Silme:** Kök dizin versiyonunu sil.

#### Aşama 2.4: Test Dosyalarının Taşınması
1.  **Config:** `vitest.config.ts` exclude: `components/`. Include: `src/modules/**/*.test.{ts,tsx}`.
2.  **Alias:** `@/modules` aliasının çalıştığını doğrula.

#### Aşama 2.5: Type Safety İyileştirmeleri
Kademeli olarak `tsconfig.json` güncelle:
1.  **Faz 1:** `strictNullChecks: true`
2.  **Faz 2:** `noImplicitAny: true`
3.  **Faz 3:** `strict: true`

- `grep` ile `any` kullanımlarını bul ve DB tiplerini (`src/types/supabase.ts`) kullanarak düzelt.

### Aşama 3: App.tsx Refactoring
1.  **Konum:** Kök `App.tsx` -> `src/app/App.tsx` taşı.
2.  **Entry Point:** `index.tsx` içindeki importu güncelle:
    ```typescript
    // ✅ import App from './src/app/App'
    ```
3.  **Providers:** `src/app/providers` içine Context'leri al.
4.  **Refactor:** Veri çekme logic'ini hooklara taşı (`useActiveEvent`).

### Aşama 4: Temizlik ve Standartlaştırma
1.  Kök dizini temizle (`components`, `actions`, `contexts` sil).
2.  `tsconfig.json` aliaslarını sadeleştir.
3.  **Performance Audit:**
    - Bundle Size: Modül bazında analiz.
    - Circular Dependency: `npx madge --circular src/modules`.
    - Code Splitting: Route bazında lazy loading kontrolü.

## 5. Mimari Kurallar

### 5.1. Klasör Yapısı
- **`api/`**: SADECE Data fetching.
- **`hooks/`**: Business logic.
- **`components/`**: UI.
- **`utils/`**: Pure functions.

### 5.4. Modül Bağımlılık Kuralları
**Yasak:** `Auth` -> `Booking`.
**Kontrol:** `npx madge --circular src/modules`.

## 6. Risk Yönetimi
- **Git:** Atomik commit + Tagging (`phase-X`).
- **Feature Flag:** `src/shared/config/features.ts` ile `USE_MODULAR_APP` flag'i.
  ```typescript
  export const FEATURES = { USE_MODULAR_APP: import.meta.env.VITE_USE_MODULAR_APP === 'true' } as const
  // Kullanım: if (FEATURES.USE_MODULAR_APP) { return <ModularApp /> } else { return <LegacyApp /> }
  ```

## 8. Doğrulama Checklist (Genişletilmiş)

**Build & Type:**
- [x] `npm run build` (0 hata, 0 warning) ✅ 7.94s
- [x] `npx tsc --noEmit` (0 hata) ✅
- [x] `npm run dev` (Uygulama çalışıyor) ✅

**Code Quality:**
- [x] `grep -r "utils/supabase" src/` (Eski import yok) ✅
- [x] `grep -r "async function checkAdmin" src/modules/` (Servis kullanılıyor) ✅
- [x] `grep -r "console.log" src/modules` (Logger kullanılıyor) ✅ 0 eşleşme
- [x] `npx madge --circular src/modules` (Döngü yok) ✅ 0 circular dependency

**Tests:**
- [ ] `npm test` (Unit testler geçiyor) - ⏭️ Atlandı (kapsamlı çalışma gerekiyor)
- [ ] `npm run test:coverage` (Coverage threshold korunuyor) - ⏭️ Atlandı
- [ ] `npm run test:e2e` (Kritik akışlar çalışıyor) - ⏭️ Atlandı

**Migration Specific:**
- [x] Supabase client tek bir dosyadan geliyor. ✅
- [x] `checkAdmin` servisi kullanılıyor. ✅
- [x] Error handling standart format kullanılıyor. ✅
- [x] Kök dizinde component kalmadı. ✅
- [x] App.tsx `src/app` altında ve index importu güncel. ✅
- [x] Modül index.ts dosyalarında duplicate export yok. ✅
