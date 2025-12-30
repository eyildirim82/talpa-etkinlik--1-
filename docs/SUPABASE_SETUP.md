# Supabase Backend Kurulum Kılavuzu

Bu doküman, TALPA Etkinlik platformu için Supabase backend'ini kurma adımlarını içerir.

## 📋 Gereksinimler

- Supabase hesabı ([supabase.com](https://supabase.com))
- Node.js 18+ yüklü
- Proje bağımlılıkları yüklenmiş

## 🚀 Adım 1: Supabase Projesi Oluşturma

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. **"New Project"** butonuna tıklayın
3. Proje bilgilerini girin:
   - **Name**: `talpa-etkinlik`
   - **Database Password**: Güçlü bir şifre seçin (kaydedin!)
   - **Region**: Europe (Avrupa - Frankfurt önerilir)
4. **"Create new project"** butonuna tıklayın
5. Proje oluşturulurken (2-3 dakika) bekleyin

## 🔑 Adım 2: API Anahtarlarını Alma

1. Sol menüden **Settings** > **API** bölümüne gidin
2. Şu bilgileri kopyalayın:
   - **Project URL** (örn: `https://xxxxxxxxxxxxx.supabase.co`)
   - **Project API key - anon public** (anon key)

3. Proje klasöründeki `.env.local` dosyasını açın (yoksa oluşturun):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> ⚠️ **Önemli**: Bu dosyayı Git'e commit etmeyin! `.gitignore` dosyasında olduğundan emin olun.

## 📊 Adım 3: Veritabanı Şemasını Oluşturma

SQL dosyalarını **sırayla** çalıştırın.

### 3.1 Schema (Tablolar ve View'lar)

1. Supabase Dashboard'da **SQL Editor** bölümüne gidin
2. **"New query"** butonuna tıklayın
3. `supabase/schema.sql` dosyasının içeriğini kopyalayıp yapıştırın
4. **"Run"** (Çalıştır) butonuna tıklayın
5. ✅ Başarılı olduğundan emin olun

### 3.2 RLS Policies (Güvenlik Politikaları)

1. Yeni bir query açın
2. `supabase/rls_policies.sql` dosyasının içeriğini kopyalayıp yapıştırın
3. **"Run"** butonuna tıklayın
4. ✅ Başarılı olduğundan emin olun

### 3.3 Functions (RPC Fonksiyonları)

1. Yeni bir query açın
2. `supabase/functions.sql` dosyasının içeriğini kopyalayıp yapıştırın
3. **"Run"** butonuna tıklayın
4. ✅ Başarılı olduğundan emin olun

### 3.4 Storage (Dosya Depolama)

1. Sol menüden **Storage** bölümüne gidin
2. **"Create a new bucket"** butonuna tıklayın
3. Bucket ayarları:
   - **Name**: `event-images`
   - **Public bucket**: ✅ İşaretleyin
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
4. **"Create bucket"** butonuna tıklayın
5. Oluşturulan bucket'a tıklayın
6. **Policies** sekmesine gidin
7. `supabase/storage.sql` dosyasındaki policy'leri tek tek ekleyin (veya SQL Editor'den çalıştırın)

## 👤 Adım 4: İlk Admin Kullanıcısını Oluşturma

### 4.1 Kullanıcı Kaydı

1. Uygulamayı başlatın: `npm run dev`
2. Tarayıcıda `http://localhost:3000` adresine gidin
3. **"Kayıt Ol"** butonuna tıklayın
4. Admin olmak istediğiniz hesabı oluşturun:
   - Email
   - Şifre
   - Ad Soyad
   - TALPA Sicil No (opsiyonel)

### 4.2 Admin Yetkisi Verme

1. Supabase Dashboard'da **Table Editor** > **profiles** tablosuna gidin
2. Az önce oluşturduğunuz kullanıcıyı bulun
3. `role` sütununu **"member"** yerine **"admin"** olarak değiştirin
4. Değişikliği kaydedin

> 💡 **Alternatif**: SQL Editor'de şu komutu çalıştırın:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'user-uuid-here';
```

## ✅ Adım 5: Test ve Doğrulama

### 5.1 Temel Testler

1. **Authentication Test**
   - Çıkış yapın ve tekrar giriş yapın
   - ✅ Başarılı giriş yapabilmelisiniz

2. **Admin Panel Test**
   - `/admin` adresine gidin
   - ✅ Admin panelini görebilmelisiniz

3. **Etkinlik Oluşturma Test**
   - Admin panelden yeni etkinlik oluşturun
   - ✅ Etkinlik başarıyla oluşturulmalı

4. **Etkinlik Aktif Etme Test**
   - Oluşturduğunuz etkinliği aktif edin
   - Ana sayfaya dönün
   - ✅ Etkinlik ana sayfada görünmelidir

5. **Bilet Satın Alma Test**
   - Normal kullanıcı olarak giriş yapın (veya yeni hesap oluşturun)
   - Aktif etkinliğe bilet satın alın
   - ✅ Bilet başarıyla oluşturulmalı
   - ✅ QR kod görünmelidir

### 5.2 Veri Kontrolü

Supabase Dashboard'da tabloları kontrol edin:

- **profiles**: Kullanıcılar kaydedildi mi?
- **events**: Etkinlikler oluşturuldu mu?
- **tickets**: Biletler kaydedildi mi?

## 🔒 Güvenlik Kontrol Listesi

- [ ] `.env.local` dosyası `.gitignore`'da
- [ ] RLS tüm tablolarda aktif (`ENABLE ROW LEVEL SECURITY`)
- [ ] Admin kullanıcı şifresi güçlü
- [ ] Storage bucket policy'leri doğru ayarlanmış
- [ ] Test kullanıcıları production'da silinecek

## 🐛 Sorun Giderme

### Hata: "Invalid API key"

- `.env.local` dosyasındaki anahtarları kontrol edin
- Anahtarların doğru kopyalandığından emin olun
- Geliştirme sunucusunu yeniden başlatın (`npm run dev`)

### Hata: "Row Level Security policy violation"

- RLS policy'lerinin doğru çalıştırıldığından emin olun
- SQL Editor'de hata olup olmadığını kontrol edin
- Table Editor'de RLS'in enabled olduğunu doğrulayın

### Hata: "Function does not exist"

- `functions.sql` dosyasının doğru çalıştırıldığından emin olun
- SQL Editor'de hata mesajlarını kontrol edin
- Fonksiyon isimlerinin doğru olduğunu doğrulayın

### Hata: "Storage bucket not found"

- Storage bucket'ın oluşturulduğundan emin olun
- Bucket isminin `event-images` olduğunu kontrol edin
- Bucket'ın public olarak işaretlendiğini doğrulayın

## 📚 Ek Kaynaklar

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Authentication Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)

## 🎯 Sonraki Adımlar

Backend kurulumu tamamlandıktan sonra:

1. **Frontend entegrasyonunu test edin**
2. **Admin panelinde örnek etkinlikler oluşturun**
3. **Bilet satın alma akışını test edin**
4. **Production deployment için hazırlıkları yapın**

---

**Tebrikler! 🎉** TALPA Etkinlik platformunun backend'i hazır.
