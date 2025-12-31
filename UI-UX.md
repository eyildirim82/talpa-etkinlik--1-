UI/UX EKRAN TASARIM RAPORU (FİNAL)
Proje: Talpa Etkinlik Yönetim Sistemi Platform: Web (Responsive - %100 Mobil Uyumlu) Tasarım Yaklaşımı: "Tek Sayfa, Tek Odak."

BÖLÜM 1: KULLANICI ARAYÜZÜ (FRONTEND)
1.1. Ana Sayfa (Landing Page) - Akıllı Tek Ekran
Kullanıcı siteye girdiği an bu ekranı görür. Giriş yapmış olsun veya olmasın, etkinlik detayları herkese açıktır. Ancak aksiyon butonları kullanıcının durumuna göre değişir.

Üst Bar (Header):

Sol: TALPA Logosu.

Sağ:

Misafir ise: [GİRİŞ YAP] butonu.

Giriş yapmışsa: [ÇIKIŞ YAP] butonu ve "Hoşgeldin, [Ad Soyad]" metni.

Vitrin Alanı (Hero Section):

Görsel: Etkinlik Afişi (Tam genişlik).

Durum Etiketi (Badge): Görselin köşesinde "BAŞVURUYA AÇIK", "DOLMAK ÜZERE" veya "KONTENJAN DOLU" etiketi.

Eğer aktif etkinlik yoksa: "Şu an planlanmış bir etkinlik bulunmamaktadır." uyarısı ve boş durum görseli.

Detay Alanı:

Başlık: Etkinlik Adı.

Künye: Tarih | Saat | Konum (Google Maps Linki) | Fiyat.

Açıklama: Etkinlik detay metni.

Aksiyon Alanı (Sticky Footer - Mobilde Ekran Altına Sabit): Bu alandaki buton, kullanıcı statüsüne göre dinamik değişir:

Misafir (Giriş Yapmamış):

Buton: [BİLET ALMAK İÇİN GİRİŞ YAP] -> (Tıklayınca Login ekranına atar).

Üye (Giriş Yapmış & Başvurmamış):

Buton: [HEMEN KATIL] -> (Onay Penceresini açar).

Başvurmuş (Asil Listede):

Buton: [✅ KAYDINIZ ALINDI (ASİL)] -> (Pasif/Tıklanamaz Yeşil Buton).

Alt Metin: "Ödeme onayından sonra biletiniz e-postanıza gelecektir."

Başvurmuş (Yedek Listede):

Buton: [⚠️ YEDEK LİSTEDESİNİZ (SIRA: X)] -> (Pasif Sarı Buton).

Kota Dolu (Başvurmamış):

Buton: [❌ KONTENJAN DOLDU] -> (Pasif Gri Buton).

1.2. Giriş Ekranı (Login)
Giriş Formu:

TC Kimlik No veya E-Posta.

Şifre.

Aksiyonlar:

[GİRİŞ YAP] butonu.

"Şifremi Unuttum / İlk Giriş" linki (E-posta token akışı için).

1.3. Başvuru Onay Penceresi (Modal / Popup)
Ana sayfada "HEMEN KATIL" butonuna basınca açılan kritik onay ekranı.

Başlık: Başvuru Onayı.

Bilgilendirme: "Sayın [Üye Adı], etkinliğe ön kayıt yaptırmak üzeresiniz."

Zorunlu Onaylar (Checkbox):

[ ] KVKK ve Aydınlatma Metnini okudum, kabul ediyorum.

[ ] Sistemde kayıtlı kredi kartımdan [X] TL tutarın, etkinlik bedeli olarak tahsil edilmesini onaylıyorum.

Footer:

[VAZGEÇ] (Pencereyi kapatır).

[ONAYLIYORUM VE KATIL] (Checkboxlar seçilmeden aktif olmaz).

BÖLÜM 2: YÖNETİCİ ARAYÜZÜ (ADMIN PANEL)
2.1. Etkinlik Yönetimi (Create & Manage)
Durum Kontrolü: Sayfa açıldığında sistem kontrol eder; "Şu an aktif bir etkinlik var mı?"

Varsa: Mevcut etkinliğin özetini ve "Yönet" butonunu gösterir. Yeni oluşturmaya izin vermez.

Yoksa: "Yeni Etkinlik Oluştur" formunu açar.

Oluşturma Formu:

Temel Bilgiler (Ad, Tarih, Fiyat vb.).

Dosya Yükleme:

Afiş Görseli.

Bilet Havuzu (ZIP): Toplu PDF yükleme alanı.

Yayınlama: "Taslak Olarak Kaydet" veya "Yayına Al".

2.2. Başvuru ve Bilet Operasyonları (Tablo Ekranı)
Mevcut aktif etkinliğin detay sayfasıdır.

Üst Özet: Toplam Başvuru | Asil Doluluk % | Yedek Sayısı | Gönderilen Bilet Sayısı.

Ana Tablo Sütunları:

Sıra No.

Ad Soyad / Sicil No.

Başvuru Zamanı (Saat:Dakika:Saniye).

Durum (Asil / Yedek).

Ödeme Durumu (Bekliyor / Alındı).

Bilet Durumu (Gönderildi / Bekliyor).

İşlem Butonları (Her satır için veya toplu seçimle):

[ÖDEME ONAYLA VE BİLET GÖNDER] -> (Bilet havuzundan sıradaki PDF'i çeker, üyeye mail atar).

[İPTAL ET] -> (Kullanıcıyı listeden çıkarır, sıradaki yedeği Asil'e çeker).

[EXCEL İNDİR] -> (Listenin tamamını muhasebe formatında indirir).

KRİTİK NOTLAR (YAZILIMCIYA)
Profil Yok: Kullanıcının geçmiş biletlerini gördüğü bir "Profil" sayfası yoktur. Tüm iletişim E-Posta üzerindendir.

Stateless UI: Ana Sayfa (1.1), kullanıcının o anki veritabanı durumuna (Bookings tablosu) göre anlık şekil almalıdır.

Tokenization: Giriş ekranında şifre belirleme işlemi için e-posta servisi (SMTP) hazır olmalıdır.