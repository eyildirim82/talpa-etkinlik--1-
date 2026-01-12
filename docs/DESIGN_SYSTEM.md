# TALPA Design System

Bu dokümantasyon, TALPA Etkinlik Platformu için tasarım sistemi token'larını ve kullanım kurallarını içerir.

## Renk Sistemi

### Semantic Renkler

Renkler semantic (anlamsal) olarak organize edilmiştir:

#### Brand Colors (Marka Renkleri)
- `brand-primary`: `#111111` - Ana marka rengi (siyah)
- `brand-secondary`: `#555555` - İkincil marka rengi
- `brand-accent`: `#ea2a33` - Vurgu rengi (kırmızı)
- `brand-gold`: `#D4AF37` - Özel marka rengi (altın)
- `brand-gold-hover`: `#C9A227` - Altın hover durumu
- `brand-pink`: `#ea2a33` - Öne çıkan etkinlikler için
- `brand-purple`: `#8B5CF6` - Fiyat gösterimi için

**Kullanım:**
```tsx
<div className="bg-brand-primary text-white">...</div>
<button className="bg-brand-gold hover:bg-brand-gold-hover">...</button>
```

#### UI Colors (Arayüz Renkleri)
- `ui-surface`: `#ffffff` - Ana yüzey
- `ui-background`: `#f8f9fa` - Arka plan
- `ui-background-dark`: `#0A1929` - Koyu arka plan
- `ui-background-dark-alt`: `#0D2137` - Alternatif koyu arka plan
- `ui-border`: `#E5E7EB` - Varsayılan border
- `ui-border-subtle`: `#eff1f3` - Çok hafif border
- `ui-border-strong`: `#1a1a1a` - Güçlü border

**Kullanım:**
```tsx
<div className="bg-ui-surface border border-ui-border">...</div>
```

#### Text Colors (Metin Renkleri)
- `text-primary`: `#1a1a1a` - Ana metin
- `text-secondary`: `#6B7280` - İkincil metin
- `text-muted`: `#888888` - Soluk metin
- `text-disabled`: `#9CA3AF` - Devre dışı metin
- `text-inverse`: `#E5E5E5` - Ters metin (koyu arka plan için)
- `text-inverse-muted`: `rgba(229, 229, 229, 0.5)` - Ters soluk metin

**Kullanım:**
```tsx
<p className="text-text-primary">Ana metin</p>
<p className="text-text-muted">İkincil metin</p>
```

#### State Colors (Durum Renkleri)
- `state-success`: `#10B981` - Başarı rengi
- `state-success-bg`: `#D1FAE5` - Başarı arka plan
- `state-success-text`: `#065F46` - Başarı metin
- `state-success-border`: `#10B981` - Başarı border
- `state-warning`: `#F59E0B` - Uyarı rengi
- `state-warning-bg`: `#FEF3C7` - Uyarı arka plan
- `state-warning-text`: `#92400E` - Uyarı metin
- `state-warning-border`: `#F59E0B` - Uyarı border
- `state-error`: `#EF4444` - Hata rengi
- `state-error-bg`: `#FEE2E2` - Hata arka plan
- `state-error-text`: `#991B1B` - Hata metin
- `state-error-border`: `#EF4444` - Hata border
- `state-info`: `#3B82F6` - Bilgi rengi
- `state-info-bg`: `#DBEAFE` - Bilgi arka plan
- `state-info-text`: `#1E40AF` - Bilgi metin
- `state-info-border`: `#3B82F6` - Bilgi border

**Kullanım:**
```tsx
<div className="bg-state-success-bg text-state-success-text border border-state-success-border">Başarılı</div>
<div className="bg-state-error-bg text-state-error-text">Hata</div>
```

#### Interactive States (Etkileşim Durumları)
- `interactive-hover-surface`: `rgba(0,0,0,0.02)` - Hover arka plan
- `interactive-hover-border`: `rgba(0,0,0,0.1)` - Hover border
- `interactive-hover-text`: `rgba(0,0,0,0.8)` - Hover metin
- `interactive-focus-ring`: `rgba(234, 42, 51, 0.2)` - Focus ring (brand-accent/20)
- `interactive-focus-border`: `#ea2a33` - Focus border
- `interactive-active-surface`: `rgba(0,0,0,0.05)` - Active arka plan

**Kullanım:**
```tsx
<button className="hover:bg-interactive-hover-surface hover:border-interactive-hover-border focus:ring-2 focus:ring-interactive-focus-ring">
  Buton
</button>
```

## Typography Scale

### Display (Hero, Landing)
- `text-display-1`: 4rem (64px), line-height: 1.1, weight: 700
- `text-display-2`: 3rem (48px), line-height: 1.2, weight: 600

**Kullanım:**
```tsx
<h1 className="text-display-1">Ana Başlık</h1>
```

### Headings
- `text-h1`: 2.5rem (40px), line-height: 1.3, weight: 600
- `text-h2`: 2rem (32px), line-height: 1.4, weight: 600
- `text-h3`: 1.5rem (24px), line-height: 1.5, weight: 500
- `text-h4`: 1.25rem (20px), line-height: 1.5, weight: 500

**Kullanım:**
```tsx
<h1 className="text-h1">Başlık 1</h1>
<h2 className="text-h2">Başlık 2</h2>
```

### Body Text
- `text-body-lg`: 1.125rem (18px), line-height: 1.6
- `text-body`: 1rem (16px), line-height: 1.6
- `text-body-sm`: 0.875rem (14px), line-height: 1.5

**Kullanım:**
```tsx
<p className="text-body">Normal metin</p>
<p className="text-body-sm">Küçük metin</p>
```

### UI Text
- `text-label`: 0.875rem (14px), line-height: 1.4, weight: 500
- `text-caption`: 0.75rem (12px), line-height: 1.4

**Kullanım:**
```tsx
<label className="text-label">Etiket</label>
<span className="text-caption">Açıklama</span>
```

## Spacing Scale

Tailwind'in default spacing scale'i kullanılmaktadır (0.25rem = 4px base unit).

### Kullanım Kuralları

#### Card Padding
- **Küçük kartlar:** `p-4` (1rem / 16px)
- **Orta kartlar:** `p-6` (1.5rem / 24px)
- **Büyük kartlar:** `p-8` (2rem / 32px)

```tsx
<div className="p-6 bg-ui-surface rounded-xl">Kart içeriği</div>
```

#### Section Gap
- **Küçük bölümler:** `gap-4` (1rem / 16px)
- **Orta bölümler:** `gap-6` (1.5rem / 24px)
- **Büyük bölümler:** `gap-10` (2.5rem / 40px)

```tsx
<div className="flex flex-col gap-10">Bölüm içeriği</div>
```

#### Component Gap
- **Yakın elementler:** `gap-2` (0.5rem / 8px)
- **Normal elementler:** `gap-4` (1rem / 16px)
- **Uzak elementler:** `gap-6` (1.5rem / 24px)

```tsx
<div className="flex items-center gap-4">Elementler</div>
```

#### Margin
- **Paragraf altı:** `mb-4` (1rem / 16px)
- **Bölüm altı:** `mb-8` (2rem / 32px)
- **Sayfa altı:** `mb-12` (3rem / 48px)

## Border Radius

- `rounded-sm`: 0.25rem (4px) - Küçük elementler
- `rounded-md`: 0.5rem (8px) - Varsayılan
- `rounded-lg`: 0.75rem (12px) - Kartlar
- `rounded-xl`: 1rem (16px) - Büyük kartlar
- `rounded-2xl`: 1.5rem (24px) - Hero bölümleri
- `rounded-3xl`: 2rem (32px) - Özel kartlar
- `rounded-full`: 9999px - Tam yuvarlak

**Kullanım:**
```tsx
<div className="rounded-lg border border-ui-border">Kart</div>
<button className="rounded-full">Buton</button>
```

## Shadows

- `shadow-sm`: Çok hafif gölge
- `shadow-subtle`: Hafif gölge (varsayılan kartlar)
- `shadow-md`: Orta gölge
- `shadow-hover`: Hover durumu gölgesi
- `shadow-lg`: Büyük gölge
- `shadow-xl`: Çok büyük gölge
- `shadow-gold-glow`: Altın parıltı efekti

**Kullanım:**
```tsx
<div className="shadow-subtle hover:shadow-hover">Kart</div>
```

## Elevation System (Derinlik Sistemi)

- `shadow-elevation-0`: Gölge yok
- `shadow-elevation-1`: Kartlar için hafif gölge
- `shadow-elevation-2`: Modal'lar için orta gölge
- `shadow-elevation-3`: Dropdown'lar için güçlü gölge

**Kullanım:**
```tsx
<div className="shadow-elevation-1">Kart</div>
<div className="shadow-elevation-2">Modal</div>
```

## Background Gradients

- `bg-gradient-admin`: Admin panel arka plan gradyanı
- `bg-gradient-admin-card`: Admin panel kart gradyanı
- `bg-gradient-gold`: Altın buton gradyanı

**Kullanım:**
```tsx
<div className="bg-gradient-admin">Admin panel</div>
<button className="bg-gradient-gold">Altın buton</button>
```

## Layering (Z-Index) System

Arbitrary `z-[9999]` değerleri yerine bu semantik tokenlar kullanılmalıdır.

- `z-dropdown`: 1000
- `z-sticky`: 1020 (Headerlar vb.)
- `z-overlay`: 1040 (Backdrops)
- `z-modal`: 1050
- `z-toast`: 1100
- `z-tooltip`: 1200

## Iconography

Standart ikon seti olarak **Lucide React** kullanılmalıdır.
Google Material Symbols **deprecated** (kullanımdan kaldırılacak) durumundadır.

**Kurallar:**
- `lucide-react` paketinden import edin.
- Stroke width: Varsayılan (2px)
- Size: Genellikle `w-4 h-4` (sm), `w-5 h-5` (md), `w-6 h-6` (lg)
- Color: Genellikle `text-text-secondary` veya `text-brand-accent` (aktif durum)

**Kullanım:**
```tsx
import { User, Bell } from 'lucide-react';

<User className="w-5 h-5 text-text-secondary" />
```

## Motion & Animation

"Premium" hissi için `tailwindcss-animate` paketi ve standart giriş animasyonları kullanılır.

### Motion Tokens

Motion token'ları design tokens sisteminde tanımlıdır ve Tailwind config'e map edilmiştir.

#### Duration Tokens
- `duration-fast`: `150ms` - Hızlı geçişler için
- `duration-normal`: `200ms` - Standart geçişler için (varsayılan)
- `duration-slow`: `300ms` - Yavaş geçişler için

#### Easing Tokens
- `ease-motion-default`: `ease-in-out` - Varsayılan easing
- `ease-motion-bounce`: `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - Bounce efekti için

**Kullanım:**
```tsx
// Duration token kullanımı
<div className="transition-colors duration-normal">
  İçerik
</div>

// Easing token kullanımı
<div className="transition-all ease-motion-default">
  İçerik
</div>
```

**Standart Animasyonlar:**
- **Modal Açılış:** `animate-in fade-in zoom-in-95 duration-normal`
- **Dropdown/Popover:** `animate-in fade-in slide-in-from-top-2 duration-normal`
- **Sayfa Geçişleri:** `animate-in fade-in duration-slow`

**Kullanım:**
```tsx
<div className="animate-in fade-in zoom-in-95 duration-normal">
  Modal İçeriği
</div>
```

## Best Practices

### 1. Semantic Renkler Kullan
❌ **Yanlış:**
```tsx
<div className="text-[#1a1a1a]">Metin</div>
```

✅ **Doğru:**
```tsx
<div className="text-text-primary">Metin</div>
```

### 2. Typography Scale Kullan
❌ **Yanlış:**
```tsx
<h1 className="text-3xl font-bold">Başlık</h1>
```

✅ **Doğru:**
```tsx
<h1 className="text-h1">Başlık</h1>
```

### 3. Tutarlı Spacing
❌ **Yanlış:**
```tsx
<div className="p-5 mb-7 gap-3">İçerik</div>
```

✅ **Doğru:**
```tsx
<div className="p-6 mb-8 gap-4">İçerik</div>
```

### 4. Inline Style Kullanma
❌ **Yanlış:**
```tsx
<div style={{ padding: '1.5rem', backgroundColor: '#ffffff' }}>İçerik</div>
```

✅ **Doğru:**
```tsx
<div className="p-6 bg-ui-surface">İçerik</div>
```

### 5. Hardcoded Color Values Kullanma
❌ **Yanlış:**
```tsx
<div className="bg-gray-500 text-red-600">İçerik</div>
<span className="bg-emerald-50 text-emerald-700">Durum</span>
```

✅ **Doğru:**
```tsx
<div className="bg-ui-background text-state-error">İçerik</div>
<span className="bg-state-success-bg text-state-success-text">Durum</span>
```

### 6. Component-Specific Color Logic
❌ **Yanlış:**
```tsx
<span className={status === 'ACTIVE' ? 'bg-emerald-50' : 'bg-red-50'}>
  {status}
</span>
```

✅ **Doğru:**
```tsx
<StatusBadge status={status} />
// StatusBadge component'i içinde token-based logic kullanılır
```

### 7. Magic Numbers in Spacing
❌ **Yanlış:**
```tsx
<div className="p-[18px] gap-[13px]">İçerik</div>
```

✅ **Doğru:**
```tsx
<div className="p-4 gap-3">İçerik</div>
```

### 8. Typography Scale Bypass
❌ **Yanlış:**
```tsx
<h1 className="text-[22px]">Başlık</h1>
<p style={{ fontSize: '1.375rem' }}>Metin</p>
```

✅ **Doğru:**
```tsx
<h1 className="text-h3">Başlık</h1>
<p className="text-body-lg">Metin</p>
```

## Migration Guide

### Eski Renklerden Yeni Renklere

| Eski | Yeni |
|------|------|
| `primary` | `brand-primary` |
| `text-main` | `text-primary` |
| `text-muted` | `text-muted` (aynı) |
| `surface` | `ui-surface` |
| `background` | `ui-background` |
| `talpa.gold` | `brand-gold` |
| `talpa.red` | `brand-accent` |
| `talpa.success` | `state-success` |
| `talpa.warning` | `state-warning` |
| `talpa.danger` | `state-error` |

### Eski Typography'den Yeni Typography'ye

| Eski | Yeni |
|------|------|
| `text-3xl font-bold` | `text-h1` |
| `text-2xl font-semibold` | `text-h2` |
| `text-xl font-medium` | `text-h3` |
| `text-base` | `text-body` |
| `text-sm` | `text-body-sm` |

## Component Kullanım Kuralları

### Input Component
Tüm form input'ları için `Input` component'i kullanılmalıdır:

```tsx
import { Input } from '@/shared/components/ui/Input';

<Input
  type="email"
  label="E-posta"
  placeholder="ornek@email.com"
  error={errors.email}
  helperText="E-posta adresinizi girin"
  leftIcon={<Mail className="w-4 h-4" />}
/>
```

### Textarea Component
Çok satırlı metin girişleri için `Textarea` component'i kullanılmalıdır:

```tsx
import { Textarea } from '@/shared/components/ui/Textarea';

<Textarea
  label="Açıklama"
  placeholder="Açıklama girin..."
  error={errors.description}
  helperText="Maksimum 500 karakter"
  rows={6}
/>
```

### Select Component
Dropdown seçimleri için `Select` component'i kullanılmalıdır:

```tsx
import { Select } from '@/shared/components/ui/Select';

<Select
  label="Durum"
  placeholder="Durum seçin"
  options={[
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Pasif' },
  ]}
  error={errors.status}
/>
```

### Label Component
Standalone label'lar için `Label` component'i kullanılmalıdır:

```tsx
import { Label } from '@/shared/components/ui/Label';

<Label required error={hasError}>
  E-posta Adresi
</Label>
```

### FormGroup Component
Form field'larını gruplamak için `FormGroup` component'i kullanılmalıdır:

```tsx
import { FormGroup } from '@/shared/components/ui/FormGroup';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';

<FormGroup spacing="md">
  <Input label="Ad" />
  <Input label="Soyad" />
  <Textarea label="Açıklama" />
</FormGroup>
```

### StatusBadge Component
Durum gösterimi için `StatusBadge` component'i kullanılmalıdır:

```tsx
import { StatusBadge } from '@/modules/admin/components/StatusBadge';

<StatusBadge status="ACTIVE" />
<StatusBadge status="SOLD_OUT" />
```

## Anti-Patterns (Kaçınılması Gerekenler)

1. **Hardcoded Color Values**: `bg-gray-500`, `text-red-600` gibi değerler kullanmayın
2. **Inline Style Overuse**: Sadece dynamic değerler için inline style kullanın
3. **Component-Specific Color Logic**: Component içinde renk seçimi yapmayın, variant prop kullanın
4. **Magic Numbers**: `p-[18px]`, `gap-[13px]` gibi arbitrary değerler kullanmayın
5. **Typography Scale Bypass**: `text-[22px]` gibi değerler kullanmayın
6. **Responsive Breakpoint Inconsistency**: Standart breakpoint'ler kullanın (sm: 640px, md: 768px, lg: 1024px)
7. **Icon Set Mixing**: Lucide ve Material Symbols'ü karıştırmayın. Material Symbols kullanmayın.
8. **Arbitrary Z-Index**: `z-[9999]` yerine semantik z-index tokenları kullanın.
