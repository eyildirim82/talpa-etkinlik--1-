YAZILIM GEREKSİNİM SPESİFİKASYONU (SRS) - FINAL
Proje Adı: Talpa Etkinlik Yönetim ve Dijital Bilet Dağıtım Sistemi Versiyon: 1.0 (Release Candidate) Hazırlayan: Sistem Mimarı (Gemini) Tarih: 31.12.2025

1. PROJE TANIMI VE KAPSAM
Bu proje; dernek üyelerinin sınırlı kontenjanlı etkinliklere adil bir sıra sistemiyle (First-Come, First-Served) kayıt olmasını, KVKK/Ödeme rızası vermesini ve ödeme onayı sonrası dijital biletlerin (PDF) otomatik olarak dağıtılmasını sağlayan web tabanlı bir platformdur.

Kritik Güvenlik Sınırı: Sistemde kredi kartı bilgisi SAKLANMAZ. Ödeme akışı "Üye Rızası -> Muhasebe Manuel Tahsilat -> Admin Onayı -> Sistem Bilet Dağıtımı" şeklindedir.

2. KULLANICI MODÜLLERİ VE ÜYELİK
2.1. Veri Aktarımı (Data Import)
Kaynak: Kullanıcı verileri Admin tarafından Excel formatında sisteme yüklenecektir.

Unique Keys: TC Kimlik No, Dernek Sicil No ve E-posta alanları benzersizdir.

Çakışma Yönetimi: Yüklenen Excel'de, sistemde zaten var olan bir TC/Sicil No varsa ancak bilgiler farklıysa sistem hata verecek ve kaydı güncellemeyip adminin manuel düzeltmesini isteyecektir.

2.2. Oturum Açma (Onboarding)
Sisteme aktarılan üyelerin varsayılan şifresi yoktur.

Üye, ilk girişte "Şifremi Oluştur/Unuttum" adımını kullanır. E-postasına gelen Token (Tek kullanımlık link) ile şifresini belirler.

3. ETKİNLİK YÖNETİMİ (ADMIN PANELİ)
3.1. Etkinlik Oluşturma
Admin şu verileri girer:

Etkinlik Adı, Tarih/Saat, Konum, Açıklama.

Görsel (Afiş) ve Fiyat Bilgisi.

Son İptal Tarihi (Cut-off Time): Bu tarihten sonra üye iptal yapamaz.

3.2. Bilet Havuzu ve Dosya Yönetimi
Dosya Tipi: Biletler, koltuk numaralı ancak isimsiz PDF dosyalarıdır.

Toplu Yükleme (Bulk Upload): Admin, yüzlerce PDF'i tek tek yüklemek yerine ZIP formatında toplu yükleyecektir. Sistem ZIP'i açar ve dosyaları dosya adına göre (Örn: A1.pdf, A2.pdf...) sıralayıp havuzda bekletir.

Otomatik Temizlik: Etkinlik tarihi geçtikten sonra sistem PDF dosyalarını sunucudan otomatik olarak silecektir (Storage tasarrufu). Ancak dağıtım logları (Kimin hangi dosyayı aldığı) veritabanında saklanmaya devam edecektir.

4. ÖN YÜZ VE KUYRUK YÖNETİMİ (KULLANICI TARAFI)
4.1. Başvuru Süreci
Üye, mobil uyumlu (Responsive) arayüzden etkinliği inceler.

"Katıl" butonuna basar.

Yasal Onay: Ekranda "KVKK", "Mesafeli Satış Sözleşmesi" ve "Kayıtlı kartımdan çekim yapılmasını onaylıyorum" kutucukları belirir. Bunlar işaretlenmeden işlem devam etmez.

4.2. Kuyruk Mantığı (Concurrency & Queue)
Kişi Başı Limit: 1 Üye = 1 Bilet. (Misafir/Refakatçi girişi yoktur).

Sıralama: Başvurular milisaniye bazında sıraya alınır.

Kayıt Sırası <= Asil Kota ise -> ASİL LİSTE

Asil Kota < Kayıt Sırası <= (Asil + Yedek Kota) ise -> YEDEK LİSTE

Kota dolduysa -> "Kontenjan Dolu" uyarısı.

Yedek Yönetimi: Asil listeden biri (Cut-off süresi içinde) iptal ederse, 1. sıradaki Yedek otomatik olarak Asil listeye geçer ve E-posta bildirimi alır.

5. ÖDEME ONAYI VE BİLET DAĞITIMI
5.1. Muhasebe Akışı
Admin, "Ödeme Bekleyenler Listesi"ni Excel olarak indirir.

Muhasebe, ofis dışı sistemden tahsilatları yapar.

5.2. Dağıtım Algoritması (Distribution Logic)
Admin panelden ödemesi alınan kişileri seçer ve "Onayla" butonuna basar.

Sistem şu algoritmayı çalıştırır:

Asil Listeye giriş sırasına (Timestamp) göre üyeleri dizer.

Bilet Havuzundaki dosyaları isim sırasına göre (A1.pdf, A2.pdf...) çeker.

1. Üyeye -> 1. Dosyayı, 2. Üyeye -> 2. Dosyayı atar (Assign).

Eğer dosya sayısı, onaylanan kişi sayısından az ise sistem işlemi durdurur ve "Bilet Stoku Yetersiz" hatası verir.

5.3. Teslimat ve Görüntüleme
Sistem, atanan PDF dosyasını ekleyerek üyeye E-posta atar.

Üye, kullanıcı paneline girip "Biletlerim" sekmesinden, kendisine atanmış bileti tekrar indirebilir (E-posta ulaşmama riskine karşı).

6. TEKNİK GEREKSİNİMLER
Platform: Web (Responsive Design - Mobil Öncelikli).

Veritabanı Bütünlüğü: Race Condition (Yarış Durumu) engellenmelidir. Aynı anda 500 kişinin butona basması durumunda sıralama şaşmamalıdır. (Transaction Locking).

Loglama: Kimin ne zaman başvurduğu, ne zaman iptal ettiği ve hangi PDF biletinin kime atandığı "Audit Log" olarak saklanmalıdır.

Admin Yetkisi: Admin manuel olarak "Çift bilet atama" yapamaz. Sistem 1 kişi = 1 bilet kuralına sadık kalır.