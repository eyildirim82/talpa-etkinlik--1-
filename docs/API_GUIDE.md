# Supabase API Kullanım Kılavuzu

Bu doküman, TALPA Etkinlik platformunda Supabase backend'ini nasıl kullanacağınızı gösterir.

## 📦 Supabase Client

### Client Oluşturma

Projenizde 3 farklı Supabase client türü vardır:

```typescript
// 1. Browser Client (Client-side components için)
import { createClient } from './utils/supabase/browser'
const supabase = createClient()

// 2. Server Client (Server components için)
import { createClient } from './utils/supabase/server'
const supabase = createClient()
```

## 🔐 Authentication (Kimlik Doğrulama)

### Kayıt Ol (Signup)

```typescript
import { signup } from './actions/auth'

const formData = new FormData()
formData.append('email', 'pilot@talpa.org')
formData.append('password', 'SecurePass123!')
formData.append('fullName', 'Ahmet Yılmaz')
formData.append('sicilNo', 'TALPA-2024-001')

const result = await signup(formData)
if (result.success) {
  console.log('Kayıt başarılı!')
} else {
  console.error(result.message)
}
```

### Giriş Yap (Login)

```typescript
import { login } from './actions/auth'

const formData = new FormData()
formData.append('email', 'pilot@talpa.org')
formData.append('password', 'SecurePass123!')

const result = await login(formData)
if (result.success) {
  console.log('Giriş başarılı!')
}
```

### Çıkış Yap (Logout)

```typescript
import { logout } from './actions/auth'

const result = await logout()
// Frontend'de yönlendirme yapın
window.location.href = '/'
```

### Mevcut Kullanıcıyı Alma

```typescript
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  console.log('User ID:', user.id)
  console.log('Email:', user.email)
}
```

## 🎫 Etkinlikler (Events)

### Aktif Etkinliği Görüntüleme

```typescript
const supabase = createClient()

// Aktif etkinliği view üzerinden al (remaining_stock otomatik hesaplanır)
const { data: activeEvent } = await supabase
  .from('active_event_view')
  .select('*')
  .single()

if (activeEvent) {
  console.log('Etkinlik:', activeEvent.title)
  console.log('Kalan Bilet:', activeEvent.remaining_stock)
  console.log('Tarih:', activeEvent.event_date)
}
```

### Tüm Etkinlikleri Listeleme (Admin)

```typescript
const supabase = createClient()

const { data: events } = await supabase
  .from('events')
  .select('*')
  .order('event_date', { ascending: false })

console.log('Tüm Etkinlikler:', events)
```

### Yeni Etkinlik Oluşturma (Admin)

```typescript
import { createEvent } from './actions/admin'

const formData = new FormData()
formData.append('title', 'TALPA Yıl Sonu Gala')
formData.append('description', 'Yıl sonu özel etkinliği')
formData.append('date', '2025-12-31')
formData.append('time', '19:00')
formData.append('location', 'İstanbul Havacılık Kulübü')
formData.append('price', '500')
formData.append('quota', '150')
formData.append('imageUrl', 'https://example.com/image.jpg')

const result = await createEvent(formData)
if (result.success) {
  console.log('Etkinlik oluşturuldu!')
}
```

### Etkinliği Aktif Etme (Admin)

```typescript
import { setActiveEvent } from './actions/admin'

const result = await setActiveEvent('event-uuid-here')
if (result.success) {
  console.log('Etkinlik aktif edildi!')
}
```

## 🎟️ Bilet İşlemleri

### Bilet Satın Alma

```typescript
import { buyTicket } from './actions/purchase'

const result = await buyTicket('event-uuid-here')

if (result.success) {
  console.log('Bilet satın alındı!')
  console.log('QR Kod:', result.ticket.qr_code)
  console.log('Bilet ID:', result.ticket.id)
} else {
  console.error('Hata:', result.message)
}
```

### Kullanıcının Biletlerini Görüntüleme

```typescript
const supabase = createClient()

const { data: tickets } = await supabase
  .rpc('get_user_tickets')

if (tickets) {
  tickets.forEach(ticket => {
    console.log('Etkinlik:', ticket.event_title)
    console.log('QR Kod:', ticket.qr_code)
    console.log('Durum:', ticket.status)
  })
}
```

### Tek Bir Bileti Görüntüleme

```typescript
const supabase = createClient()

const { data: ticket } = await supabase
  .from('tickets')
  .select(`
    *,
    events (
      title,
      event_date,
      location,
      price
    ),
    profiles (
      full_name,
      talpa_sicil_no
    )
  `)
  .eq('id', 'ticket-uuid-here')
  .single()

console.log('Bilet:', ticket)
```

### Bilet İptal Etme

```typescript
const supabase = createClient()

const { data, error } = await supabase
  .rpc('cancel_ticket', { p_ticket_id: 'ticket-uuid-here' })

if (data.success) {
  console.log('Bilet iptal edildi')
}
```

## 📊 Admin İstatistikleri

### Etkinlik İstatistiklerini Alma

```typescript
import { getEventStats } from './actions/admin'

const result = await getEventStats('event-uuid-here')

if (result.success) {
  console.log('Toplam Kontenjan:', result.stats.total_quota)
  console.log('Satılan Biletler:', result.stats.sold_tickets)
  console.log('Kalan Biletler:', result.stats.remaining_stock)
  console.log('Hasılat:', result.stats.revenue)
  console.log('Doluluk Oranı:', result.stats.occupancy_rate + '%')
}
```

### Etkinliğe Katılacakların Listesi (Admin)

```typescript
const supabase = createClient()

const { data: attendees } = await supabase
  .from('tickets')
  .select(`
    id,
    seat_number,
    qr_code,
    status,
    purchase_date,
    profiles (
      full_name,
      talpa_sicil_no,
      phone
    )
  `)
  .eq('event_id', 'event-uuid-here')
  .in('status', ['pending', 'paid'])
  .order('purchase_date', { ascending: true })

console.log('Katılımcılar:', attendees)
```

## 🖼️ Dosya Yükleme (Storage)

### Etkinlik Görseli Yükleme (Admin)

```typescript
const supabase = createClient()

// Dosyayı yükle
const file = event.target.files[0]
const fileName = `event-${Date.now()}.${file.name.split('.').pop()}`

const { data: uploadData, error: uploadError } = await supabase
  .storage
  .from('event-images')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false
  })

if (uploadError) {
  console.error('Yükleme hatası:', uploadError)
  return
}

// Public URL'i al
const { data: { publicUrl } } = supabase
  .storage
  .from('event-images')
  .getPublicUrl(fileName)

console.log('Resim URL:', publicUrl)
// Bu URL'i event oluştururken image_url olarak kullanın
```

### Görsel Silme (Admin)

```typescript
const supabase = createClient()

const { error } = await supabase
  .storage
  .from('event-images')
  .remove(['filename.jpg'])

if (!error) {
  console.log('Görsel silindi')
}
```

## 🔄 Realtime Subscriptions

### Aktif Etkinlik Değişikliklerini Dinleme

```typescript
const supabase = createClient()

const channel = supabase
  .channel('active-event-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'events',
      filter: 'is_active=eq.true'
    },
    (payload) => {
      console.log('Aktif etkinlik değişti:', payload.new)
      // UI'ı güncelle
    }
  )
  .subscribe()

// Cleanup
// channel.unsubscribe()
```

### Yeni Bilet Satışlarını Dinleme (Admin)

```typescript
const supabase = createClient()

const channel = supabase
  .channel('ticket-sales')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'tickets'
    },
    (payload) => {
      console.log('Yeni bilet satışı:', payload.new)
      // İstatistikleri güncelle
    }
  )
  .subscribe()
```

## 🛡️ Güvenlik ve Hatalar

### Hata Yakalama

```typescript
try {
  const { data, error } = await supabase
    .from('events')
    .select('*')
  
  if (error) throw error
  
  console.log('Veriler:', data)
} catch (error) {
  console.error('Hata oluştu:', error.message)
}
```

### RLS Policy Hataları

Eğer "Row Level Security policy violation" hatası alırsanız:

1. Kullanıcı giriş yapmış mı kontrol edin
2. Kullanıcının gerekli yetkisi var mı kontrol edin
3. RLS policy'lerinin doğru kurulduğunu doğrulayın

### Type Safety

TypeScript ile tip güvenliği için:

```typescript
import { EventData, Ticket, User } from './types'

const { data } = await supabase
  .from('events')
  .select('*')
  .returns<EventData[]>()
```

## 💡 Best Practices

1. **Her zaman try-catch kullanın** - Hataları yakalayın
2. **Client'ı tekrar kullanın** - Her API çağrısında yeni client oluşturmayın
3. **RPC fonksiyonlarını tercih edin** - Karmaşık işlemler için
4. **Type'ları kullanın** - TypeScript tip tanımlarını kullanın
5. **Environment variables'ları koruyun** - `.env.local` dosyasını Git'e commit etmeyin

---

**Daha fazla bilgi için**: [Supabase Documentation](https://supabase.com/docs)
