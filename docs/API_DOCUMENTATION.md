# API Dokümantasyonu

Bu doküman, TALPA Etkinlik Platformu'nun Server Actions ve API endpoint'lerini açıklar.

## İçindekiler

- [Server Actions](#server-actions)
- [Supabase RPC Fonksiyonları](#supabase-rpc-fonksiyonları)
- [Hata Yönetimi](#hata-yönetimi)

## Server Actions

Server Actions, Next.js 16'da sunucu tarafında çalışan fonksiyonlardır. Tüm Server Actions `'use server'` direktifi ile işaretlenmiştir.

### Kimlik Doğrulama (Authentication)

**Dosya:** `actions/auth.ts`

#### `login`

Kullanıcı giriş işlemini gerçekleştirir.

**Parametreler:**
- `formData: FormData` - Form verileri
  - `email: string` - Kullanıcı e-posta adresi
  - `password: string` - Kullanıcı şifresi

**Dönüş Değeri:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Örnek Kullanım:**
```typescript
const formData = new FormData();
formData.append('email', 'kaptan@talpa.org');
formData.append('password', 'sifre123');

const result = await login(formData);
if (result.success) {
  // Giriş başarılı
}
```

**Hata Durumları:**
- `success: false, message: 'Giriş başarısız. Bilgilerinizi kontrol ediniz.'` - Geçersiz kimlik bilgileri

---

#### `signup`

Yeni kullanıcı kaydı oluşturur.

**Parametreler:**
- `formData: FormData` - Form verileri
  - `email: string` - Kullanıcı e-posta adresi
  - `password: string` - Kullanıcı şifresi (minimum 6 karakter)
  - `fullName: string` - Kullanıcının tam adı
  - `sicilNo: string` - TALPA sicil numarası

**Dönüş Değeri:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Örnek Kullanım:**
```typescript
const formData = new FormData();
formData.append('email', 'yeni@talpa.org');
formData.append('password', 'sifre123');
formData.append('fullName', 'Ahmet Yılmaz');
formData.append('sicilNo', '12345');

const result = await signup(formData);
```

**Hata Durumları:**
- `success: false, message: 'Kayıt oluşturulamadı.'` - Auth hatası
- `success: false, message: 'Profil oluşturulurken hata oluştu.'` - Profil oluşturma hatası

**Not:** Kayıt işlemi iki adımdan oluşur:
1. Supabase Auth'da kullanıcı oluşturulur
2. `profiles` tablosuna kullanıcı profili eklenir (varsayılan rol: `'member'`)

---

#### `logout`

Kullanıcı çıkış işlemini gerçekleştirir.

**Parametreler:** Yok

**Dönüş Değeri:** Yok (redirect yapar)

**Örnek Kullanım:**
```typescript
await logout(); // Kullanıcı anasayfaya yönlendirilir
```

---

### Bilet Satın Alma (Purchase)

**Dosya:** `actions/purchase.ts`

#### `buyTicket`

Etkinlik için bilet satın alma işlemini gerçekleştirir.

**Parametreler:**
- `eventId: string` - Satın alınacak etkinliğin ID'si

**Dönüş Değeri:**
```typescript
{
  success: boolean;
  message?: string;
}
```

**Örnek Kullanım:**
```typescript
const result = await buyTicket('event-uuid-123');
if (result.success) {
  // Bilet satın alma başarılı, kullanıcı bilet sayfasına yönlendirilir
} else {
  console.error(result.message);
}
```

**Hata Durumları:**
- `success: false, message: 'İşlem için giriş yapmalısınız.'` - Kullanıcı giriş yapmamış
- `success: false, message: 'Üzgünüz, kontenjan doldu.'` - Stok tükendi
- `success: false, message: 'İşlem sırasında bir hata oluştu.'` - Genel hata

**Not:** 
- İşlem başarılı olduğunda kullanıcı `/ticket/{ticketId}` sayfasına yönlendirilir
- Stok kontrolü ve bilet oluşturma işlemi atomik olarak `purchase_ticket` RPC fonksiyonu tarafından gerçekleştirilir

---

### Yönetici İşlemleri (Admin)

**Dosya:** `actions/admin.ts`

#### `createEvent`

Yeni etkinlik oluşturur. Sadece admin kullanıcılar erişebilir.

**Parametreler:**
- `formData: FormData` - Form verileri
  - `title: string` - Etkinlik başlığı
  - `description: string` - Etkinlik açıklaması (opsiyonel)
  - `date: string` - Etkinlik tarihi (YYYY-MM-DD formatında)
  - `time: string` - Etkinlik saati (HH:mm formatında)
  - `location: string` - Etkinlik konumu
  - `price: number` - Bilet fiyatı
  - `quota: number` - Toplam kontenjan
  - `imageUrl: string` - Etkinlik görsel URL'si

**Dönüş Değeri:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Örnek Kullanım:**
```typescript
const formData = new FormData();
formData.append('title', 'TALPA Yıllık Toplantısı');
formData.append('date', '2025-06-15');
formData.append('time', '19:00');
formData.append('location', 'İstanbul Havacılık Müzesi');
formData.append('price', '500');
formData.append('quota', '150');
formData.append('imageUrl', 'https://example.com/image.jpg');

const result = await createEvent(formData);
```

**Hata Durumları:**
- Admin rolü kontrolü başarısız olursa kullanıcı anasayfaya yönlendirilir
- `success: false, message: 'Etkinlik oluşturulamadı.'` - Veritabanı hatası

**Not:** 
- Oluşturulan etkinlik varsayılan olarak `is_active: false` durumunda oluşturulur
- Para birimi varsayılan olarak `'TRY'` olarak ayarlanır
- Tarih ve saat birleştirilerek ISO string formatında `event_date` alanına kaydedilir

---

#### `setActiveEvent`

Belirtilen etkinliği aktif hale getirir. Diğer tüm etkinlikler otomatik olarak pasif yapılır. Sadece admin kullanıcılar erişebilir.

**Parametreler:**
- `eventId: string` - Aktif edilecek etkinliğin ID'si

**Dönüş Değeri:**
```typescript
{
  success: boolean;
  message: string;
}
```

**Örnek Kullanım:**
```typescript
const result = await setActiveEvent('event-uuid-123');
if (result.success) {
  // Etkinlik aktif edildi, diğer tüm etkinlikler pasif yapıldı
}
```

**Hata Durumları:**
- Admin rolü kontrolü başarısız olursa kullanıcı anasayfaya yönlendirilir
- `success: false, message: 'Etkinlik aktif edilemedi.'` - RPC fonksiyonu hatası

**Not:** 
- Bu işlem `set_active_event` RPC fonksiyonu tarafından atomik olarak gerçekleştirilir
- İşlem başarılı olduğunda hem admin sayfası hem de anasayfa yeniden doğrulanır (revalidate)

---

## Supabase RPC Fonksiyonları

RPC (Remote Procedure Call) fonksiyonları, veritabanı seviyesinde çalışan PostgreSQL fonksiyonlarıdır. Bu fonksiyonlar atomik işlemler ve iş kurallarını garanti altına alır.

### `purchase_ticket`

Atomik bilet satın alma işlemini gerçekleştirir. Race condition'ları önler ve stok kontrolü yapar.

**Parametreler:**
- `p_event_id: uuid` - Etkinlik ID'si
- `p_user_id: uuid` - Kullanıcı ID'si

**Dönüş Değeri:**
- `uuid` - Oluşturulan biletin ID'si

**İş Mantığı:**
1. Mevcut satılan bilet sayısını sayar (iptal edilenler hariç)
2. `total_quota` ile karşılaştırır
3. Eğer yer varsa yeni bilet oluşturur
4. Tüm işlemler tek bir transaction içinde gerçekleşir

**Hata Durumları:**
- `SOLD_OUT` - Kontenjan dolmuş
- Diğer veritabanı hataları

**Örnek Kullanım:**
```typescript
const { data: ticketId, error } = await supabase.rpc('purchase_ticket', {
  p_event_id: 'event-uuid-123',
  p_user_id: 'user-uuid-456'
});
```

---

### `set_active_event`

Belirtilen etkinliği aktif yapar ve diğer tüm etkinlikleri pasif yapar. "Single Active Event" prensibini garanti altına alır.

**Parametreler:**
- `p_event_id: uuid` - Aktif edilecek etkinliğin ID'si

**Dönüş Değeri:**
- `void`

**İş Mantığı:**
1. Tüm etkinliklerin `is_active` değerini `false` yapar
2. Belirtilen etkinliğin `is_active` değerini `true` yapar
3. Tüm işlemler tek bir transaction içinde gerçekleşir

**Örnek Kullanım:**
```typescript
const { error } = await supabase.rpc('set_active_event', {
  p_event_id: 'event-uuid-123'
});
```

---

## Hata Yönetimi

Tüm Server Actions, hata durumlarını yakalar ve kullanıcı dostu mesajlarla döner. Hata mesajları Türkçe olarak sunulur.

### Hata Yapısı

```typescript
{
  success: false,
  message: string // Kullanıcı dostu hata mesajı
}
```

### Yaygın Hata Senaryoları

1. **Kimlik Doğrulama Hataları**
   - Geçersiz e-posta/şifre
   - Oturum süresi dolmuş
   - Yetkisiz erişim

2. **İş Mantığı Hataları**
   - Stok tükenmesi
   - Geçersiz veri
   - İş kuralı ihlali

3. **Sistem Hataları**
   - Veritabanı bağlantı sorunları
   - Beklenmeyen hatalar

### Hata Loglama

Tüm hatalar sunucu tarafında `console.error` ile loglanır. Production ortamında bu loglar bir loglama servisine yönlendirilmelidir.

---

## Güvenlik Notları

1. **Authentication**: Tüm Server Actions, kullanıcı oturumunu kontrol eder
2. **Authorization**: Admin işlemleri rol kontrolü yapar
3. **Input Validation**: Form verileri sunucu tarafında doğrulanır
4. **SQL Injection**: Supabase client'ı otomatik olarak SQL injection saldırılarını önler
5. **Row Level Security**: Veritabanı seviyesinde ek güvenlik katmanı

---

**Son Güncelleme:** 2025-01-XX

