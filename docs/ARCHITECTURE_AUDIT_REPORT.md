# Yazılım Mimarisi Analiz Raporu

## 1. Tespit Edilen Mimari (Inferred Architecture)

Proje, **Modular Monolith** mimarisini hedefleyen bir **React SPA** uygulaması olarak tasarlanmış. Yapıya bakıldığında:

- **Feature-based modüller**: `src/modules/` altında 11 ayrı modül (admin, auth, booking, event, file-processing, notification, payment, profile, reporting, ticket)
- **Shared katman**: `src/shared/` altında ortak altyapı, servisler ve utility'ler
- **Vertical slice**: Her modül kendi `api/`, `components/`, `hooks/`, `types/`, `utils/` alt klasörlerine sahip
- **Public API pattern**: Her modül `index.ts` üzerinden public export sunuyor
- **Infrastructure abstraction**: Supabase client'ı `shared/infrastructure/` altında soyutlanmış

Hedeflenen mimari kavramlar doğru, ancak **uygulama tutarsız** ve birçok kritik ihlal mevcut.

---

## 2. Yüksek Riskli Mimari Sorunlar

### 2.1 App.tsx'te "God Component" Antipattern'i

`App.tsx` tek bir component içinde çok fazla sorumluluk üstlenmektedir:
- State yönetimi (6+ farklı useState)
- Data fetching (doğrudan Supabase çağrıları)
- Authentication listener
- Routing konfigürasyonu
- UI rendering
- Event handling

**Neden riskli**: Single Responsibility Principle (SRP) ihlali. Bu dosya her değişiklikte regresyon riski taşıyor ve test edilmesi zorlaşıyor.

### 2.2 Modüller Arası Yasak Bağımlılık Yönü

`src/modules/admin/api/admin.api.ts` gibi dosyalarda doğrudan diğer modüllerden (örneğin `ticket` modülünden) fonksiyon import edildiği görülmüştür. Modular monolith'te **modüller arası doğrudan bağımlılık yasaklanmalı**; bunun yerine shared interface'ler veya event-driven iletişim kullanılmalıdır.

### 2.3 Çoklu QueryClient Instance'ları

`src/pages/AdminPage.tsx` içinde `const queryClient = new QueryClient();` satırı ile yeni bir instance oluşturulmaktadır.
**Sorun**:
- Global cache tutarsızlığı
- Memory leak riski
- Veri senkronizasyon sorunları

Ana uygulama seviyesinde tek bir `QueryClientProvider` olmalı ve `src/app/providers/` altında yönetilmelidir.

### 2.4 Infrastructure Katmanı Bypass

`App.tsx`, `shared/infrastructure/supabase` altındaki client oluşturucuyu direkt import edip kullanmaktadır (`createBrowserClient`). Bu durum diğer sayfa veya hook'larda da tekrarlanırsa, altyapı değişiklikleri (örneğin auth provider değişimi) tüm kod tabanında değişiklik gerektirecektir. Modül API'leri üzerinden erişim sağlanmalıdır.

---

## 3. Orta Riskli Yapısal Sorunlar

### 3.1 Kod Tekrarı: Admin Kontrolü
`src/shared/services/authz.ts` ve `src/shared/hooks/useAdminCheck.ts` dosyalarında neredeyse aynı admin kontrol mantığı tekrar edilmiştir. DRY (Don't Repeat Yourself) prensibine aykırıdır.

### 3.2 Yanlış Yerdeki Admin Fonksiyonları
`src/modules/booking/api/booking.api.ts` içinde `getEventBookings` gibi sadece admin'in kullanması gereken fonksiyonlar yer almaktadır. Bunlar `admin` modülüne veya `admin-booking` namespace'ine taşınmalıdır.

### 3.3 Kök Dizin Kirliliği
Kök dizinde `types.ts`, `mockData.ts`, `index.tsx`, `index.css` gibi dosyalar dağınık durmaktadır. Bunlar `src/types`, `src/__tests__`, `src/main.tsx` gibi uygun yerlere taşınmalıdır.

### 3.4 Legacy Kod Kirliliği
`types.ts` ve `useAdmin.ts` içinde "Backward compatibility" notlarıyla bırakılmış eski kodlar ve mapping'ler mevcuttur. Bu teknik borç temizlenmelidir.

### 3.5 Inline Style Problemi
`CinematicHero.tsx` vb. componentlerde Tailwind yerine yoğun inline style kullanımı mevcuttur. Bu, stil yönetimini ve tutarlılığı zorlaştırır.

### 3.6 Hatalı Exportlar
`src/modules/booking/index.ts` içinde aynı dosyanın iki kez export edildiği (`export * from './api/booking.api'`) görülmüştür.

---

## 4. Dosya Seviyesi Bulgular

| Dosya | Gözlemlenen Sorumluluk | Mimari Sorun | Neden Problem |
|-------|----------------------|--------------|---------------|
| `src/app/App.tsx` | Routing, state, auth, UI | God Component | 5+ farklı sorumluluk tek dosyada |
| `src/pages/AdminPage.tsx` | Page + QueryClient provider | Layer mixing | Provider'lar ayrı olmalı |
| `src/components/ProtectedRoute.tsx` | Auth + role check | Mixed concerns | İki ayrı logic birleşmiş |
| `src/modules/admin/api/admin.api.ts` | Admin ops + ticket import | Cross-module coupling | Modül bağımsızlığı ihlali |
| `src/modules/booking/api/booking.api.ts` | User + Admin queries | Mixed access levels | Admin fonksiyonları ayrılmalı |

---

## 5. Mimari Öneriler

### 5.1 App.tsx Refactor
- **Routing**: `src/app/routes.tsx` ayrı dosyaya taşınsın.
- **Providers**: `src/app/providers/` altında `QueryProvider.tsx`, `AuthProvider.tsx` oluşturulsun.
- **Data fetching**: `useAppBootstrap` gibi bir hook'a alınsın.

### 5.2 Modül İzolasyonu
- Modüller arası doğrudan import ESLint ile kısıtlanmalı.
- `admin` modülünün diğer modüllere olan bağımlılığı yeniden tasarlanmalı.

### 5.3 Provider Yapısı
Uygulama tek bir kök provider yapısına (`src/app/providers/index.tsx`) sahip olmalı.

### 5.4 Dosya Organizasyonu
- `types.ts` -> `src/types/domain.ts`
- `index.tsx` -> `src/main.tsx`
- Inline stiller -> Tailwind sınıfları

Bu rapor doğrultusunda bir **Refactoring Planı** oluşturulması önerilir.
