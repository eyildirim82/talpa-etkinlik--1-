# Component Dokümantasyonu

Bu doküman, TALPA Etkinlik Platformu'nun React component'lerini ve kullanımlarını açıklar.

## İçindekiler

- [Component Hiyerarşisi](#component-hiyerarşisi)
- [Ana Component'ler](#ana-componentler)
- [UI Component'leri](#ui-componentleri)
- [Admin Component'leri](#admin-componentleri)
- [State Yönetimi](#state-yönetimi)

## Component Hiyerarşisi

```
App.tsx
├── Header
├── MainContent
│   ├── Hero
│   ├── InfoCockpit
│   │   └── InstrumentBox
│   └── ActionZone
│       └── AuthModal
│           ├── Login Form
│           └── Signup Form
└── Footer

EmptyState (Aktif etkinlik yoksa)

BoardingPass (Bilet görüntüleme sayfası)
```

## Ana Component'ler

### `App.tsx`

Ana uygulama wrapper component'i. Context provider'ı sağlar ve ana layout'u oluşturur.

**Dosya:** `App.tsx`

**Props:**
```typescript
interface AppProps {
  initialEvent: EventData | null;
  initialUser: User | null;
}
```

**Kullanım:**
```typescript
<App initialEvent={eventData} initialUser={userData} />
```

**Özellikler:**
- `AppProvider` ile global state sağlar
- Header, MainContent ve Footer bileşenlerini içerir
- Kullanıcı oturum durumunu gösterir

**İlgili Dosyalar:**
- `contexts/AppContext.tsx` - Context tanımları
- `app/page.tsx` - Server component, App'i render eder

---

### `Hero`

Etkinlik görseli ve başlığını gösterir. Etkinliğin görsel kimliğini oluşturur.

**Dosya:** `components/Hero.tsx`

**Props:** Yok (Context'ten veri alır)

**State:** Yok

**Kullanım:**
```typescript
<Hero />
```

**Özellikler:**
- Etkinlik görselini gösterir
- Etkinlik başlığını gösterir
- Aktif/pasif durum rozetini gösterir
- Gradient overlay ile metin okunabilirliğini artırır

**Stil:**
- Yükseklik: `40vh` (mobil), `50vh` (desktop)
- Responsive tasarım
- Modern status badge

---

### `InfoCockpit`

Etkinlik detaylarını kokpit göstergeleri gibi gösterir. "Cockpit Clarity" tasarım dilinin merkezi bileşenidir.

**Dosya:** `components/InfoCockpit.tsx`

**Props:** Yok (Context'ten veri alır)

**State:** Yok

**Kullanım:**
```typescript
<InfoCockpit />
```

**Özellikler:**
- Tarih ve saat bilgisi
- Konum bilgisi
- Süre bilgisi (şu an mock data)
- Bilet fiyatı (büyük ve vurgulu)

**Grid Yapısı:**
- Mobil: 2 sütun
- Desktop: 4 sütun
- Fiyat: Tam genişlik, alt kısımda

**İlgili Component:**
- `InstrumentBox` - Her bir bilgi kutusu

---

### `ActionZone`

Bilet satın alma butonu ve stok bilgisini gösterir. Kullanıcının ana etkileşim noktasıdır.

**Dosya:** `components/ActionZone.tsx`

**Props:** Yok (Context'ten veri alır)

**State:**
```typescript
const [showAuthModal, setShowAuthModal] = useState(false);
const [isPending, startTransition] = useTransition();
const [errorMsg, setErrorMsg] = useState<string | null>(null);
```

**Kullanım:**
```typescript
<ActionZone />
```

**Özellikler:**
- Kalan kontenjan gösterimi
- Düşük stok uyarısı (< 20)
- Tükendi durumu
- Giriş yapmamış kullanıcılar için auth modal tetikleme
- Bilet satın alma işlemi
- Hata mesajı gösterimi

**Buton Durumları:**
- **Tükendi**: Gri, devre dışı
- **İşlem Yapılıyor**: Loading spinner
- **Giriş Yapmamış**: "GİRİŞ YAP / KAYIT OL"
- **Giriş Yapmış**: "BİLET AL VE ONAYLA"

**İlgili Component:**
- `AuthModal` - Giriş/kayıt modal'ı

---

### `AuthModal`

Giriş ve kayıt formlarını içeren modal component'i.

**Dosya:** `components/AuthModal.tsx`

**Props:**
```typescript
interface AuthModalProps {
  onClose: () => void;
}
```

**State:**
```typescript
const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**Kullanım:**
```typescript
<AuthModal onClose={() => setShowModal(false)} />
```

**Özellikler:**
- Tab-based arayüz (Login/Signup)
- Form validation
- Server Action entegrasyonu
- Hata mesajı gösterimi
- Loading state

**Form Alanları:**

**Login:**
- E-posta
- Şifre

**Signup:**
- Ad Soyad
- TALPA Sicil No
- E-posta
- Şifre (min 6 karakter)

**İlgili Actions:**
- `actions/auth.ts` - `login`, `signup`

---

### `EmptyState`

Aktif etkinlik olmadığında gösterilen boş durum component'i.

**Dosya:** `components/EmptyState.tsx`

**Props:** Yok

**State:** Yok

**Kullanım:**
```typescript
<EmptyState />
```

**Özellikler:**
- Radar animasyonu
- "NO ACTIVE SORTIES" mesajı
- "RADAR CLEAR" durumu
- Sistem standby göstergesi

**Tasarım:**
- Havacılık temalı görsel dil
- Minimalist ve bilgilendirici

---

### `BoardingPass`

Bilet görüntüleme component'i. QR kodlu dijital bilet gösterir.

**Dosya:** `components/BoardingPass.tsx`

**Props:**
```typescript
interface BoardingPassProps {
  ticket: Ticket;
}
```

**State:** Yok (Context'ten event ve user alır)

**Kullanım:**
```typescript
<BoardingPass ticket={ticketData} />
```

**Özellikler:**
- Başarı mesajı
- Etkinlik bilgileri
- Katılımcı bilgileri
- Koltuk numarası
- QR kod
- Bileti indirme butonu

**Not:** Bu component şu an kullanılmıyor. Bilet görüntüleme `app/ticket/[id]/page.tsx` içinde server component olarak implement edilmiş.

---

## UI Component'leri

### `InstrumentBox`

Kokpit göstergesi gibi bilgi kutusu. "Cockpit Clarity" tasarım dilinin temel yapı taşıdır.

**Dosya:** `components/ui/InstrumentBox.tsx`

**Props:**
```typescript
interface InstrumentBoxProps {
  label: string;
  value: string | number | React.ReactNode;
  highlight?: boolean;
  className?: string;
}
```

**Kullanım:**
```typescript
<InstrumentBox 
  label="Tarih" 
  value="15 Haziran 2025"
  highlight={false}
/>
```

**Özellikler:**
- Label ve value gösterimi
- Highlight modu (mavi arka plan)
- Custom className desteği
- Responsive tasarım

**Stil:**
- Label: Küçük, uppercase, gri
- Value: Büyük, kalın, mavi
- Highlight: Mavi arka plan vurgusu

---

## Admin Component'leri

Admin component'leri Next.js Server Components olarak implement edilmiştir. Bu nedenle ayrı component dosyaları yoktur, doğrudan `app/admin/` klasöründeki page dosyalarında tanımlanmışlardır.

### Admin Layout

**Dosya:** `app/admin/layout.tsx`

**Özellikler:**
- Sidebar navigasyon
- Admin rol kontrolü (server-side)
- Yetkisiz erişimde redirect
- Sabit sidebar, scrollable content

**Navigasyon Menüsü:**
- Dashboard (`/admin`)
- Etkinlik Yönetimi (`/admin/events`)
- Yolcu Listesi (`/admin/tickets`)

---

### Admin Dashboard

**Dosya:** `app/admin/page.tsx`

**Özellikler:**
- Aktif etkinlik bilgisi
- Doluluk oranı
- Tahmini hasılat
- Durum göstergesi

**Metrikler:**
- Satılan bilet sayısı / Toplam kontenjan
- Doluluk yüzdesi
- Tahmini gelir (satılan × fiyat)

---

### Etkinlik Yönetimi

**Dosya:** `app/admin/events/page.tsx`

**Özellikler:**
- Yeni etkinlik oluşturma formu
- Etkinlik listesi tablosu
- Aktif etkinlik belirleme butonu
- Durum rozetleri (Aktif/Pasif)

**Form Alanları:**
- Başlık
- Görsel URL
- Tarih ve Saat
- Fiyat
- Kontenjan
- Konum

---

### Yolcu Manifestosu

**Dosya:** `app/admin/tickets/page.tsx`

**Özellikler:**
- Aktif etkinlik için bilet listesi
- Yolcu bilgileri tablosu
- Excel indirme butonu (şu an placeholder)
- Sıralama: En yeni önce

**Tablo Kolonları:**
- Sıra No
- Yolcu Adı
- Sicil No
- Telefon
- Satın Alma Tarihi
- Durum

---

## State Yönetimi

### AppContext

Global state yönetimi için React Context kullanılır.

**Dosya:** `contexts/AppContext.tsx`

**Context Değerleri:**
```typescript
interface AppContextType {
  user: User | null;
  event: EventData | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}
```

**Kullanım:**
```typescript
const { user, event, logout } = useApp();
```

**Provider:**
```typescript
<AppProvider initialEvent={event} initialUser={user}>
  {children}
</AppProvider>
```

**Özellikler:**
- Server-side'dan gelen initial data
- Client-side state güncellemeleri
- Logout fonksiyonu

---

### Server State vs Client State

**Server State:**
- Etkinlik bilgileri
- Kullanıcı bilgileri
- Server Components'te fetch edilir

**Client State:**
- Modal açık/kapalı durumu
- Form input değerleri
- Loading state'leri
- Hata mesajları

---

## Component Best Practices

1. **Server Components Kullanımı**
   - Mümkün olduğunca Server Components kullan
   - Sadece interaktivite gerektiğinde Client Components

2. **Context Kullanımı**
   - Global state için AppContext
   - Prop drilling'den kaçın

3. **Type Safety**
   - Tüm props için TypeScript interface'leri
   - `types.ts` dosyasından import et

4. **Stil Tutarlılığı**
   - Tailwind utility classes
   - TALPA tasarım sistemi renkleri
   - Responsive design (mobile-first)

5. **Performans**
   - Gereksiz re-render'ları önle
   - `useTransition` ile async işlemler
   - Lazy loading gerektiğinde kullan

---

**Son Güncelleme:** 2025-01-XX

