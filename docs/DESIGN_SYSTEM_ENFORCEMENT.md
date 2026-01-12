# Design System Enforcement Guide

Bu dokümantasyon, TALPA Design System'inin tutarlı kullanımını sağlamak için kurulmuş enforcement mekanizmalarını açıklar.

## ESLint Kuralları

### Genel Bakış

ESLint kuralları, design system token'larının kullanımını zorunlu kılar ve hardcoded değerlerin kullanımını engeller. Kurallar `error` seviyesindedir ve commit öncesi kontrol edilir.

### Yasaklanan Pattern'ler

#### 1. Hardcoded Tailwind Color Classes

**Yasak:**
```tsx
<div className="bg-gray-50 text-gray-700 border-gray-300">
<div className="bg-blue-500 text-red-600">
```

**Doğru:**
```tsx
<div className="bg-ui-background text-text-primary border-ui-border">
<div className="bg-state-info text-state-error">
```

**ESLint Kuralı:** `no-restricted-syntax` - Template literal ve JSX className attribute'larında hardcoded color class'ları yakalar.

#### 2. Arbitrary Typography Values

**Yasak:**
```tsx
<h1 className="text-[22px]">
<p style={{ fontSize: '1.375rem' }}>
```

**Doğru:**
```tsx
<h1 className="text-h3">
<p className="text-body-lg">
```

**ESLint Kuralı:** `no-restricted-syntax` - Arbitrary typography değerlerini (`text-[...px]`) yakalar.

#### 3. Raw Tailwind Typography Scale

**Yasak:**
```tsx
<h1 className="text-3xl font-bold">
<p className="text-sm">
```

**Doğru:**
```tsx
<h1 className="text-h1">
<p className="text-body-sm">
```

**ESLint Kuralı:** `no-restricted-syntax` - Raw Tailwind typography scale class'larını (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, vb.) yakalar.

#### 4. Arbitrary Z-Index Values

**Yasak:**
```tsx
<div className="z-[100]">
<div className="z-[9999]">
```

**Doğru:**
```tsx
<div className="z-overlay">
<div className="z-modal">
```

**ESLint Kuralı:** `no-restricted-syntax` - Arbitrary z-index değerlerini (`z-[...]`) yakalar.

### Kural Detayları

Tüm kurallar `eslint.config.js` dosyasında tanımlıdır:

```javascript
'no-restricted-syntax': [
  'error',
  {
    // Hardcoded gray colors
    selector: 'TemplateLiteral > TemplateElement[value.raw=/\\b(bg|text|border)-gray-\\d+/]',
    message: 'Hardcoded gray colors are forbidden. Use semantic tokens...'
  },
  {
    // Arbitrary typography
    selector: 'TemplateLiteral > TemplateElement[value.raw=/\\btext-\\[\\d+px\\]/]',
    message: 'Arbitrary typography values are forbidden...'
  },
  // ... diğer kurallar
]
```

## Pre-commit Hook'ları

### Husky ve lint-staged

Pre-commit hook'ları, commit öncesi ESLint kontrollerini otomatik olarak çalıştırır.

### Kurulum

Husky ve lint-staged zaten kurulmuştur. Yeni bir geliştirici için:

```bash
npm install
npm run prepare  # Husky'yi initialize eder
```

### Çalışma Mantığı

1. Commit yapıldığında `.husky/pre-commit` hook çalışır
2. `lint-staged` sadece staged dosyaları kontrol eder
3. ESLint hataları varsa commit engellenir
4. Hatalar düzeltilip tekrar commit edilmelidir

### lint-staged Configuration

`.lintstagedrc.json` dosyasında tanımlı:

```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "eslint"
  ]
}
```

- İlk `eslint --fix` otomatik düzeltilebilir hataları düzeltir
- İkinci `eslint` kalan hataları kontrol eder ve commit'i engeller

## Token Kullanımı Best Practices

### 1. Semantic Token'ları Tercih Et

Her zaman semantic token'ları kullan:

```tsx
// ✅ Doğru
<div className="bg-ui-surface text-text-primary border-ui-border">

// ❌ Yanlış
<div className="bg-white text-black border-gray-300">
```

### 2. Typography Scale Kullan

Typography için semantic scale'i kullan:

```tsx
// ✅ Doğru
<h1 className="text-h1">Başlık</h1>
<p className="text-body">Metin</p>

// ❌ Yanlış
<h1 className="text-3xl font-bold">Başlık</h1>
<p className="text-base">Metin</p>
```

### 3. Z-Index Token'ları Kullan

Z-index için semantic token'ları kullan:

```tsx
// ✅ Doğru
<div className="z-modal">Modal</div>
<div className="z-overlay">Overlay</div>

// ❌ Yanlış
<div className="z-[1050]">Modal</div>
<div className="z-[1040]">Overlay</div>
```

### 4. Motion Token'ları Kullan

Animasyonlar için motion token'ları kullan:

```tsx
// ✅ Doğru
<div className="transition-colors duration-normal ease-motion-default">

// ❌ Yanlış
<div className="transition-colors duration-200 ease-in-out">
```

## Migration Guide

### Hardcoded Değerlerden Token'lara Geçiş

#### Renkler

| Hardcoded | Semantic Token |
|-----------|----------------|
| `bg-gray-50` | `bg-ui-background` |
| `text-gray-700` | `text-text-primary` |
| `border-gray-300` | `border-ui-border` |
| `bg-blue-500` | `bg-state-info` |
| `text-red-600` | `text-state-error` |

#### Typography

| Hardcoded | Semantic Token |
|-----------|----------------|
| `text-3xl font-bold` | `text-h1` |
| `text-2xl font-semibold` | `text-h2` |
| `text-xl font-medium` | `text-h3` |
| `text-base` | `text-body` |
| `text-sm` | `text-body-sm` |
| `text-xs` | `text-caption` |

#### Z-Index

| Hardcoded | Semantic Token |
|-----------|----------------|
| `z-[1000]` | `z-dropdown` |
| `z-[1020]` | `z-sticky` |
| `z-[1040]` | `z-overlay` |
| `z-[1050]` | `z-modal` |
| `z-[1100]` | `z-toast` |
| `z-[1200]` | `z-tooltip` |

## Sorun Giderme

### ESLint Hataları

ESLint hataları alıyorsanız:

1. Hata mesajını okuyun - hangi token kullanılması gerektiğini belirtir
2. `docs/DESIGN_SYSTEM.md` dosyasına bakın - mevcut token'ları gösterir
3. Hardcoded değeri semantic token ile değiştirin

### Pre-commit Hook Çalışmıyor

Eğer pre-commit hook çalışmıyorsa:

```bash
# Husky'yi yeniden initialize et
npm run prepare

# Hook'un executable olduğundan emin ol (Linux/Mac)
chmod +x .husky/pre-commit
```

### Otomatik Düzeltme

Bazı hatalar otomatik olarak düzeltilebilir:

```bash
# Tüm dosyaları kontrol et ve düzelt
npm run lint:fix

# Sadece staged dosyaları düzelt (lint-staged otomatik yapar)
npx lint-staged
```

## İstisnalar

### Dynamic Değerler

Dynamic değerler için inline style kullanılabilir:

```tsx
// ✅ Kabul edilebilir
<div style={{ width: `${progress}%` }}>
<div style={{ '--custom-var': value } as React.CSSProperties}>
```

### CSS Custom Properties

CSS custom properties için inline style kullanılabilir:

```tsx
// ✅ Kabul edilebilir
<div style={{ '--hero-bg-image': `url('${imageUrl}')` } as React.CSSProperties}>
```

## Kaynaklar

- [Design System Dokümantasyonu](./DESIGN_SYSTEM.md) - Tüm token'lar ve kullanımları
- [ESLint Config](../eslint.config.js) - Tüm kuralların tanımları
- [Tailwind Config](../tailwind.config.ts) - Token'ların Tailwind'e map edilmesi
