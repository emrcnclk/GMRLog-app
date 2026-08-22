import type { LegalDocumentDefinition } from './legal-document.types';

/**
 * 12.1 — Gizlilik Politikası, Turkish, v1.0.0.
 *
 * Mirrors `privacy-policy.en` section for section, deliberately: a reader who
 * switches locale mid-document should land on the same clause, not a differently
 * organised text. The same two corrections apply — no birth date, no device or
 * IP data against a session — and the same gate: rights are exercised by email
 * until 12.5/12.6 ship, because the backend cannot serve them yet.
 */
export const privacyPolicyTr: LegalDocumentDefinition = {
  id: 'privacy-policy',
  locale: 'tr',
  version: '1.0.0',
  effectiveDate: '2026-08-21',
  title: 'Gizlilik Politikası',
  // 12.4a — a notice, not a bargain. GDPR Art. 13/14 and KVKK Art. 10 require
  // that a privacy notice be *given*; the reader is informed, they do not
  // consent to it. Presenting it with an accept control would blur the same
  // line the Aydınlatma Metni was already kept on the right side of. It is
  // still shown, still linked from sign-up, and its display is still recorded —
  // as an acknowledgement.
  requiresAcceptance: false,
  body: `# Gizlilik Politikası

**Yürürlük tarihi:** 21 Ağustos 2026

**Sürüm:** 1.0.0

## 1. Verilerinizden kim sorumlu

GMRLog hizmetini [LEGAL ENTITY NAME] işletmektedir. 6698 sayılı Kişisel
Verilerin Korunması Kanunu ("KVKK") bakımından **veri sorumlusu**, Avrupa
Birliği Genel Veri Koruma Tüzüğü ("GDPR") bakımından **veri sorumlusu (data
controller)** sıfatını taşıyoruz.

- Tüzel kişi: [LEGAL ENTITY NAME]
- Adres: [REGISTERED ADDRESS]
- Gizlilik iletişimi: privacy@gmrlog.com

Bu politika KVKK ile GDPR'ı birlikte karşılayacak şekilde yazılmıştır. İkisinin
ayrıştığı noktalarda size daha fazla koruma sağlayanı uygularız. Nerede
yaşıyor olursanız olun, GMRLog'u kullandığınız her yerde geçerlidir.

## 2. Neyi, neden topluyoruz

Yalnızca ürünün çalışması için gerekeni topluyoruz. Aşağıdaki her başlık,
GMRLog'un bugün gerçekten sakladığı bir veriye karşılık gelir.

### 2.1 Hesap ve kimlik

E-posta adresiniz, parolanız (yalnızca tuzlanmış özet olarak; hiçbir zaman
okunabilir biçimde değil), kullanıcı adınız, görünen adınız ve eklemeyi tercih
ederseniz biyografiniz, profil görseliniz ve kapak görseliniz. Bunlar hesabı
oluşturmak, sizi oturuma almak ve diğer oyunculara göstermek için gereklidir.

**Doğum tarihinizi, resmî adınızı, telefon numaranızı, adresinizi veya
herhangi bir ödeme bilginizi toplamıyoruz.** GMRLog'un ücretli bir katmanı
yoktur ve hiçbir ödeme işlemi yapılmamaktadır.

### 2.2 Oluşturduklarınız ve kaydettikleriniz

Oyun kütüphanesi kayıtlarınız ve oynama günlükleriniz, incelemeleriniz,
gönderileriniz, yorumlarınız, tepkileriniz, koleksiyonlarınız, tier
listeleriniz, topluluk üyelikleriniz, etkinlik katılımlarınız ve başarım
ilerlemeleriniz. Ürünün kendisi budur: nasıl bir oyuncu olduğunuzun kaydı. Bu
veriler, siz saklamamızı istediğiniz için saklanır.

### 2.3 Sosyal bağlantılar

Kimi takip ettiğiniz ve sizi kimin takip ettiği, arkadaşlık istekleri ve
arkadaşlıklar, engellemeler ve sessize almalar ile çevrimiçi durum bilginiz.
Diğer oyuncularla aranızdaki özel mesajlar, iletilebilmeleri ve
okunabilmeleri için saklanır.

### 2.4 Bağlı oyun hesapları

Steam gibi harici bir oyun hesabını **yalnızca siz bağlarsanız**, o hesabın
referansını, görünen adını, verdiğiniz yetki kapsamını ve sağlayıcının
döndürdüğü kütüphane, oynama süresi ve başarım verilerini saklarız. Bağlamayı
siz seçersiniz, dilediğiniz zaman kaldırabilirsiniz ve bağlamadığınız hiçbir
sağlayıcıya dokunmayız.

### 2.5 Teknik ve operasyonel veriler

Bir isteğin gerçekleştiğini, ne zaman gerçekleştiğini ve başarılı olup
olmadığını kaydeden, bir hatanın izlenebilmesi için izleme kimliği taşıyan
sunucu kayıtları. Güvenlik ve hesap verebilirlik için tutulan moderasyon
bildirimleri ve yönetimsel işlem kayıtları.

**IP adresinizi ve cihaz türünüzü hesabınızla ilişkilendirerek
saklamıyoruz.** Bir GMRLog oturum kaydı yalnızca sona erme zamanını ve iptal
edilip edilmediğini tutar.

### 2.6 Yapmadıklarımız

- Kişisel verilerinizi satmıyoruz. Hiçbir çerçevede, hiç kimseye.
- Reklam yayınlamıyoruz; GMRLog'un hiçbir yerinde reklam kimliği yoktur.
- Üçüncü taraf analitik araçları veya izleme pikselleri kullanmıyoruz.
- Sizi ürünün dışındaki hiçbir amaç için profillemiyoruz.
- İçeriğinizi makine öğrenmesi modellerini eğitmek için kullanmıyoruz.

GMRLog'un sizinle ilgili hesapladığı benzerlik ve arketip puanları, yalnızca
görebildiğiniz özellikleri — DNA eşleşmeniz, arketipleriniz — beslemek için
vardır. Gizli bir puan, gölge bir sıralama veya hakkınızda hukuki ya da benzer
ölçüde önemli sonuç doğuran otomatik bir karar yoktur.

## 3. Her kullanım için hukuki dayanağımız

| Ne yapıyoruz | GDPR m. 6 dayanağı | KVKK m. 5 dayanağı |
|---|---|---|
| Hesabınızı oluşturmak ve işletmek | Sözleşmenin ifası | Sözleşmenin ifası için gerekli olması |
| Kütüphane, günlük, inceleme ve gönderilerinizi saklamak | Sözleşmenin ifası | Sözleşmenin ifası için gerekli olması |
| Hizmeti güvende tutmak, kötüye kullanımı önlemek, moderasyon | Meşru menfaat | Veri sorumlusunun meşru menfaati |
| Parola sıfırlama gibi vazgeçilemez hizmet e-postaları | Sözleşmenin ifası | Sözleşmenin ifası için gerekli olması |
| Harici bir oyun hesabını bağlamak | Açık rıza | Açık rıza |
| Hukuki yükümlülük veya yetkili talep | Hukuki yükümlülük | Hukuki yükümlülük |

Açık rızaya dayandığımız hâllerde rızanızı dilediğiniz zaman geri
alabilirsiniz. Geri almak, vermek kadar kolaydır; gerekçe göstermenizi
gerektirmez ve GMRLog'un çekirdeğine erişiminize mal olmaz. Rızanın geri
alınması, öncesinde hukuka uygun gerçekleşmiş işlemeyi geçersiz kılmaz.

## 4. Verilerinizi başka kimler görebilir

### 4.1 Diğer oyuncular

Profiliniz, kullanıcı adınız, görünen adınız ve paylaştığınız içerik,
seçtiğiniz görünürlük ayarlarına göre görünür. Özel mesajlar yalnızca
taraflarınca görülür. **E-posta adresiniz hiçbir oyuncuya gösterilmez.**

### 4.2 Talimatlarımızla hareket eden hizmet sağlayıcılar

Her biri verileri yalnızca bizim talimatımızla işlemekle yükümlü, sınırlı
sayıda tedarikçi kullanıyoruz:

- **Barındırma ve veritabanı altyapısı**, hizmeti çalıştırmak için.
- **Nesne depolama**, profil görselleri, kapaklar ve yüklenen görseller için.
- **Arama dizinleme**, profillerin, oyunların ve toplulukların bulunabilmesi
  için.
- **E-posta iletimi**, parola sıfırlama gibi hesap e-postaları için.
- **Hata izleme**, bir şey bozulduğunda haberdar olmak için. Hata raporlarına
  kişisel tanımlayıcı eklemeyecek şekilde yapılandırılmıştır.

### 4.3 Harici oyun sağlayıcıları

Bir hesap bağladığınızda, verdiğiniz yetki kapsamında o sağlayıcıyla — örneğin
Steam ile — veri alışverişi yaparız. Onların verinizi nasıl ele aldığı kendi
politikalarına tabidir, bu politikaya değil.

### 4.4 Oyun kataloğu kaynakları

Oyun meta verilerini üçüncü taraf katalog kaynaklarından alırız. Bu akış
**bize doğrudur** ve hakkınızda hiçbir kişisel veri içermez.

### 4.5 Hukuki paylaşım

Hukuken zorunlu olduğumuz hâllerde veri paylaşabiliriz. Size bildirmemize izin
verilen hâllerde bildiririz.

## 5. Yurt dışına aktarım

GMRLog, ülkenizin dışında — Türkiye ve Avrupa Ekonomik Alanı dışı dâhil —
konumlanabilen altyapılar üzerinde çalışır. Kişisel verileri yurt dışına
aktardığımızda, uygulanacak hukukun gerektirdiği güvencelere dayanırız: GDPR
bakımından bir yeterlilik kararı veya Standart Sözleşme Hükümleri; KVKK
bakımından 9. maddedeki şartlar. Belirli bir aktarım için hangi güvencenin
uygulandığını bize sorabilirsiniz.

## 6. Ne kadar süre saklıyoruz

- **Hesabınız ve içeriği:** hesabınız var olduğu sürece.
- **Hesabınızın silinmesini istedikten sonra:** fikrinizi değiştirebileceğiniz
  30 günlük bir bekleme süresi; ardından hesap ve kişisel verileri kalıcı
  olarak silinir. Bkz. bölüm 7.
- **Sunucu kayıtları:** kısa bir operasyonel süre, sonra imha.
- **Moderasyon ve güvenlik kayıtları:** daha kısa bir sürenin yasaklı bir
  hesabın basitçe geri dönmesine yol açacağı ya da saklamakla yükümlü
  olduğumuz hâllerde daha uzun süre.
- **Kanunen saklamakla yükümlü olduğumuz her şey:** gerekli süre boyunca,
  daha fazlası değil.

Yazdığınız içerik bir başkasınınkiyle iç içe geçtiğinde — başka bir oyuncunun
gönderisinin altındaki bir yanıt, alıcısına çoktan iletilmiş bir mesaj —
hesabınızın silinmesi, o kişinin kendi yazışmasına dair kaydını yok etmek
yerine kimliğinizi oradan kaldırır.

## 7. Haklarınız ve nasıl kullanacağınız

GDPR ve KVKK kapsamında şu haklara sahipsiniz:

- Hakkınızda hangi kişisel veriyi neden tuttuğumuzu **öğrenme ve erişme**.
- Bunun taşınabilir, makinece okunabilir bir **kopyasını alma**.
- Yanlış veya eksik olan her şeyi **düzelttirme**.
- Kişisel verilerinizi **sildirme**.
- Belirli işlemeleri **kısıtlatma veya bunlara itiraz etme**.
- İşlemenin dayandığı hâllerde **rızanızı geri alma**.
- Düzeltme veya silmenin, verinin aktarıldığı üçüncü kişilere
  **bildirilmesini isteme**.
- Denetim makamına **şikâyette bulunma**.

**Bugün nasıl kullanılır.** Bir kısmı hâlihazırda uygulama içinden
yapılabilir: profilinizi düzenleyebilir, görünürlük ayarlarınızı
değiştirebilir ve bağlı bir hesabı dilediğiniz zaman kaldırabilirsiniz.

Erişim, dışa aktarma ve silme için hesabınıza kayıtlı adresten
**privacy@gmrlog.com** adresine yazın. **30 gün** içinde yanıt veririz;
talebin açıkça dayanaksız veya aşırı olduğu hâller dışında ücretsizdir.

Bunu, henüz var olmayan bir düğmeyi tarif etmek yerine açıkça söylüyoruz:
uygulama içinden dışa aktarma ve hesap silme geliştirilmektedir; tamamlandığında
bu politika güncellenecek ve onayınız yeniden istenecektir.

**Nereye şikâyet edilir.** Türkiye'de Kişisel Verileri Koruma Kurumu'na. Avrupa
Ekonomik Alanı'nda yerel denetim makamınıza. Önce bize gelmek zorunda
değilsiniz; yine de düzeltme şansını tercih ederiz.

## 8. Güvenlik

Verilerinizi aktarım sırasında TLS ile koruruz, parolaları yalnızca tuzlanmış
özet olarak saklarız, yönetimsel işlemleri denetim kaydında tutarız ve iç
erişimi rolün gerektirdiğiyle sınırlarız. Hiçbir sistem kusursuz güvenli
değildir. Haklarınızı riske atması muhtemel bir ihlal gerçekleşirse, sizi ve
ilgili makamı kanunun öngördüğü süreler içinde bilgilendiririz.

## 9. Çocuklar

GMRLog 13 yaşın altındaki çocuklara yönelik değildir ve bilerek onların
kişisel verilerini toplamayız. Yerel hukukun çevrimiçi hizmetlere rıza için
daha yüksek bir yaş öngördüğü hâllerde, o yaş uygulanır. Bir çocuğun bize
kişisel veri verdiğini düşünüyorsanız bizimle iletişime geçin; sileriz.

## 10. Bu politikadaki değişiklikler

Bu politikayı değiştirdiğimizde sürümünü ve yürürlük tarihini yükseltiriz.
Sahip olduğunuz bir hakkı, işleme amacını, saklama süresini veya veriyi
paylaştığımız bir tarafı etkileyen değişiklik en az bir minor sürüm
yükseltmesidir ve yeni sürümü sessizce yerine koymak yerine gözden geçirip
kabul etmenizi isteriz. Yalnızca kabul ettiğiniz şeyi değiştirmesi mümkün
olmayan düzeltmeler — yazım hatası, kırık bağlantı, çeviri düzeltmesi — patch
olarak yapılır.

Reddettiğiniz bir şeyi, siz kabul edene kadar tekrar tekrar sormayız.

## 11. İletişim

privacy@gmrlog.com

[LEGAL ENTITY NAME]

[REGISTERED ADDRESS]
`,
};
