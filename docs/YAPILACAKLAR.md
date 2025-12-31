# Talpa Etkinlik Yönetim Sistemi - Yapılacaklar Listesi

Bu döküman, revizyon planının uygulanmasından sonra kalan ve yapılması gereken işleri içerir.

## ✅ Tamamlanan İşler

### 1. Veritabanı Migrasyonu
- ✅ Migration SQL dosyası oluşturuldu (`supabase/migration_revision.sql`)
- ✅ Enum tipleri tanımlandı (event_status, queue_status, payment_status)
- ✅ Tablo güncellemeleri hazırlandı (profiles, events)
- ✅ Yeni tablolar tanımlandı (bookings, ticket_pool)
- ✅ RPC fonksiyonları yazıldı (join_event, assign_ticket, promote_from_waitlist, set_active_event)
- ✅ RLS politikaları hazırlandı

### 2. TypeScript Tip Güncellemeleri
- ✅ `src/types/supabase.ts` güncellendi
- ✅ `types.ts` güncellendi (yeni enum'lar ve tipler eklendi)

### 3. Actions Dosyaları
- ✅ `actions/bookings.ts` oluşturuldu
- ✅ `actions/admin.ts` güncellendi (Vite uyumlu hale getirildi)

### 4. Hooks Güncellemeleri
- ✅ `src/hooks/useActiveEvent.ts` güncellendi
- ✅ `src/hooks/useAdmin.ts` güncellendi
- ✅ `src/hooks/useBooking.ts` oluşturuldu

### 5. Frontend Component'ler
- ✅ `components/BookingModal.tsx` oluşturuldu
- ✅ `components/BookingStatus.tsx` oluşturuldu
- ✅ `components/ActionZone.tsx` güncellendi
- ✅ `components/admin/BookingsTable.tsx` oluşturuldu
- ✅ `components/admin/TicketPoolManager.tsx` oluşturuldu
- ✅ `components/admin/EventsPanel.tsx` güncellendi
- ✅ `components/admin/TicketsPanel.tsx` güncellendi
- ✅ `components/admin/OverviewPanel.tsx` güncellendi

### 6. Sayfa Güncellemeleri
- ✅ `app/page.tsx` güncellendi
- ✅ `app/admin/page.tsx` güncellendi
- ✅ `app/admin/tickets/page.tsx` güncellendi
- ✅ `app/admin/events/page.tsx` güncellendi

### 7. API Katmanı
- ✅ `src/api/events.ts` güncellendi
- ✅ `src/api/bookings.ts` oluşturuldu

---

## ⚠️ Yapılması Gerekenler

### 1. VERİTABANI MİGRASYONU (KRİTİK - ÖNCE BUNU YAPIN!)

#### Adım 1: Supabase'de Migration Çalıştırma
1. Supabase Dashboard'a giriş yapın
2. **SQL Editor** sekmesine gidin
3. `supabase/migration_revision.sql` dosyasının içeriğini kopyalayın
4. SQL Editor'e yapıştırın ve **RUN** butonuna tıklayın
5. Migration'ın başarılı olduğunu kontrol edin

**ÖNEMLİ:** Migration çalıştırmadan önce veritabanınızı yedekleyin!

#### Adım 2: Storage Bucket'larını Oluşturma
Supabase Dashboard → **Storage** → **Buckets**:

1. **event-banners** bucket'ı oluştur:
   - Name: `event-banners`
   - Public: `Yes` (Afişleri herkes görebilmeli)

2. **tickets** bucket'ı oluştur:
   - Name: `tickets`
   - Public: `No` (Gizli olmalı, sadece yetkili indirebilmeli)

#### Adım 3: RPC Fonksiyon Parametre Düzeltmesi
Eğer migration sonrası `set_active_event` hatası alırsanız:
- `supabase/fix_set_active_event.sql` dosyasını Supabase SQL Editor'de çalıştırın

#### Adım 4: Mevcut Veri Migrasyonu (Opsiyonel)
Eğer mevcut `tickets` veya `requests` tablosunda veri varsa:
- Migration dosyasındaki veri migrasyonu script'leri otomatik çalışacak
- Manuel kontrol için:
  ```sql
  SELECT COUNT(*) FROM bookings;
  SELECT COUNT(*) FROM ticket_pool;
  ```

---

### 2. EKSİK ÖZELLİKLERİN TAMAMLANMASI

#### 2.1 Bilet Havuzu Yükleme (ZIP → PDF)
**Durum:** Placeholder implementasyon var, tam implementasyon gerekli

**Yapılacaklar:**
- [ ] JSZip kütüphanesini yükle: `npm install jszip`
- [ ] `components/admin/TicketPoolManager.tsx` içindeki `handleFileUpload` fonksiyonunu tamamla
- [ ] ZIP dosyasından PDF'leri çıkar
- [ ] Her PDF'i Supabase Storage'a yükle (`tickets` bucket'ına)
- [ ] `ticket_pool` tablosuna kayıt ekle (file_name, file_path, event_id)
- [ ] Dosya adına göre sıralama yap (A1.pdf, A2.pdf, vb.)

**Örnek implementasyon:**
```typescript
import JSZip from 'jszip';

const handleFileUpload = async (file: File) => {
  const zip = await JSZip.loadAsync(file);
  const pdfFiles = Object.keys(zip.files).filter(name => name.endsWith('.pdf'));
  
  for (const fileName of pdfFiles.sort()) {
    const pdfBlob = await zip.files[fileName].async('blob');
    // Upload to Supabase Storage
    // Insert into ticket_pool table
  }
};
```

#### 2.2 Excel Export İyileştirmesi
**Durum:** Şu an CSV formatında, Excel formatına çevrilebilir

**Yapılacaklar:**
- [ ] Excel kütüphanesi ekle: `npm install xlsx` veya `npm install exceljs`
- [ ] `actions/admin.ts` içindeki `exportBookingsToExcel` fonksiyonunu güncelle
- [ ] Formatting ekle (başlık satırı, renkler, vb.)

#### 2.3 Üye Excel Import Fonksiyonu
**Durum:** Henüz implement edilmedi

**Yapılacaklar:**
- [ ] Excel import component'i oluştur (`components/admin/MemberImport.tsx`)
- [ ] Excel dosyası okuma (xlsx kütüphanesi)
- [ ] Supabase Auth API ile kullanıcı oluşturma (`supabase.auth.admin.createUser`)
- [ ] `profiles` tablosuna `tckn`, `sicil_no`, `email` ekleme
- [ ] Hata yönetimi ve validasyon

**Excel Formatı:**
```
| tckn      | sicil_no | email              | full_name |
|-----------|----------|--------------------|-----------|
| 123456789 | 001      | user1@example.com  | Ahmet Yılmaz |
```

#### 2.4 Bilet İptal ve Yedekten Asile Geçiş
**Durum:** RPC fonksiyonu var ama frontend entegrasyonu eksik

**Yapılacaklar:**
- [ ] `components/admin/BookingsTable.tsx` içindeki `handleCancelBooking` fonksiyonunu tamamla
- [ ] İptal sonrası `promote_from_waitlist` RPC'sini çağır
- [ ] UI'da yedekten asile geçen kullanıcıları göster

---

### 3. TEST VE DOĞRULAMA

#### 3.1 Veritabanı Testleri
- [ ] `join_event` RPC fonksiyonunu test et (race condition kontrolü)
- [ ] `assign_ticket` RPC fonksiyonunu test et
- [ ] `promote_from_waitlist` RPC fonksiyonunu test et
- [ ] RLS politikalarını test et (kullanıcı sadece kendi booking'ini görebilmeli)

#### 3.2 Frontend Testleri
- [ ] Ana sayfada aktif etkinlik görüntüleme
- [ ] Booking modal açılma ve form gönderimi
- [ ] Booking durumu gösterimi (Asil/Yedek)
- [ ] Admin panelinde booking listesi görüntüleme
- [ ] Admin panelinde bilet atama işlemi
- [ ] Event oluşturma ve düzenleme formları

#### 3.3 Senaryo Testleri
- [ ] **Senaryo 1:** Kullanıcı etkinliğe başvurur → Asil listesine eklenir
- [ ] **Senaryo 2:** Asil kontenjan dolu → Yedek listesine eklenir
- [ ] **Senaryo 3:** Admin ödeme onaylar → Bilet atanır
- [ ] **Senaryo 4:** Asil listeden biri iptal eder → İlk yedek asile geçer
- [ ] **Senaryo 5:** Eşzamanlı başvurular → Race condition olmamalı

---

### 4. GÜVENLİK KONTROLLERİ

- [ ] RLS politikalarının çalıştığını doğrula
- [ ] Admin kontrolünün her yerde yapıldığını kontrol et
- [ ] KVKK ve ödeme onaylarının zorunlu olduğunu kontrol et
- [ ] Bilet havuzu dosyalarının sadece yetkili erişebildiğini kontrol et

---

### 5. PERFORMANS İYİLEŞTİRMELERİ

- [ ] Booking listesi için pagination ekle (çok sayıda başvuru varsa)
- [ ] Event listesi için lazy loading
- [ ] React Query cache stratejisini optimize et
- [ ] Supabase query'lerinde gereksiz join'leri kaldır

---

### 6. UI/UX İYİLEŞTİRMELERİ

- [ ] Loading state'leri ekle (skeleton screens)
- [ ] Error handling mesajlarını iyileştir
- [ ] Success toast notifications ekle
- [ ] Mobile responsive kontrolleri yap
- [ ] Yedek listede sıra numarası gösterimini iyileştir

---

### 7. DÖKÜMANTASYON

- [ ] API dökümantasyonu oluştur
- [ ] Component dökümantasyonu (Storybook veya benzeri)
- [ ] Deployment guide oluştur
- [ ] Troubleshooting guide oluştur

---

## 🔧 HIZLI DÜZELTMELER

### Migration Sonrası Kontroller

1. **Fonksiyonların varlığını kontrol et:**
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('join_event', 'assign_ticket', 'promote_from_waitlist', 'set_active_event');
```

2. **Tablo yapılarını kontrol et:**
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;
```

3. **RLS'in aktif olduğunu kontrol et:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('bookings', 'ticket_pool', 'profiles');
```

---

## 📝 NOTLAR

- **ID Tip Değişikliği:** `events` tablosu UUID'den BIGINT'e geçti. Tüm referanslar güncellendi.
- **Backward Compatibility:** Eski `tickets` ve `requests` tabloları migration sırasında `bookings`'e taşınacak.
- **Storage:** Bilet PDF'leri Supabase Storage'da saklanacak, public URL'ler oluşturulmayacak (güvenlik).
- **Race Conditions:** `join_event` fonksiyonu `FOR UPDATE` lock kullanarak race condition'ları önlüyor.

---

## 🚀 DEPLOYMENT SIRASI

1. ✅ Kod değişiklikleri tamamlandı
2. ⏳ **Veritabanı migration'ı çalıştır** (KRİTİK!)
3. ⏳ Storage bucket'larını oluştur
4. ⏳ Test et
5. ⏳ Production'a deploy et

---

## 📞 SORUN GİDERME

### Hata: "Could not find the function public.set_active_event"
**Çözüm:** `supabase/fix_set_active_event.sql` dosyasını çalıştırın.

### Hata: "relation 'bookings' does not exist"
**Çözüm:** Migration dosyasını çalıştırdığınızdan emin olun.

### Hata: "permission denied for table bookings"
**Çözüm:** RLS politikalarının doğru oluşturulduğunu kontrol edin.

---

**Son Güncelleme:** 2025-01-XX
**Durum:** Kod tamamlandı, migration bekleniyor

