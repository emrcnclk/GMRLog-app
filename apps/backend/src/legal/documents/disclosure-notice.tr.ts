import type { LegalDocumentDefinition } from './legal-document.types';

/**
 * 12.1 — KVKK Aydınlatma Metni, Turkish, v1.0.0.
 *
 * This is the operative text for KVKK purposes; `disclosure-notice.en` is a
 * rendering of it for readers who do not read Turkish. If the two ever drift,
 * this one governs — which is also why a translation fix here is never a patch
 * bump on its own: a wording change in the operative text can change what was
 * disclosed.
 *
 * `requiresAcceptance: false` for the reason set out on the English file: KVKK
 * Art. 10 imposes a duty to inform that is separate from consent, and putting
 * an accept control on a disclosure would manufacture a consent for processing
 * that does not rest on consent.
 */
export const disclosureNoticeTr: LegalDocumentDefinition = {
  id: 'disclosure-notice',
  locale: 'tr',
  version: '1.1.0',
  effectiveDate: '2026-08-22',
  title: 'KVKK Aydınlatma Metni',
  requiresAcceptance: false,
  body: `# Kişisel Verilerin Korunması Hakkında Aydınlatma Metni

**Yürürlük tarihi:** 22 Ağustos 2026

**Sürüm:** 1.1.0

İşbu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu'nun
("KVKK") 10. maddesi ile Aydınlatma Yükümlülüğünün Yerine Getirilmesinde
Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca hazırlanmıştır.

Aydınlatılmak, rıza vermekle aynı şey değildir. Bu metin verilerinize ne
olduğunu anlatır; onaylamanız gereken bir sözleşme değildir ve sizden bu metni
kabul etmeniz istenmez.

## 1. Veri sorumlusu

- **Veri sorumlusu:** [LEGAL ENTITY NAME]
- **Adres:** [REGISTERED ADDRESS]
- **İletişim:** privacy@gmrlog.com

## 2. İşlenen kişisel veriler

- **Kimlik ve iletişim verileri:** e-posta adresi, kullanıcı adı, görünen ad,
  doğum tarihi, ülke, dil tercihi, eklemeyi tercih ettiğiniz biyografi, profil
  görseli ve kapak görseli ile — yalnızca vermeyi seçerseniz — ad ve soyad.
- **Kimlik doğrulama verileri:** parolanızın tuzlanmış özeti (hash) ve oturum
  kayıtlarınız.
- **Ürün kapsamında oluşturduğunuz veriler:** oyun kütüphanesi kayıtları ve
  oynama günlükleri, incelemeler, gönderiler, yorumlar, tepkiler,
  koleksiyonlar, tier listeleri, topluluk üyelikleri, etkinlik katılımları ve
  başarım ilerlemeleri.
- **Sosyal veriler:** takip ilişkileri, arkadaşlık istekleri ve arkadaşlıklar,
  engelleme ve sessize alma kayıtları, çevrimiçi durum bilgisi ve
  gönderdiğiniz ile aldığınız özel mesajlar.
- **Bağlı hesap verileri:** harici bir oyun hesabı bağlamanız hâlinde, o
  hesabın referansı, görünen adı, verdiğiniz yetki kapsamı ve sağlayıcının
  döndürdüğü kütüphane, oynama süresi ve başarım verileri.
- **İşlem güvenliği ve operasyon verileri:** bir isteğin gerçekleştiğini,
  zamanını ve sonucunu izleme kimliğiyle birlikte tutan sunucu kayıtları,
  moderasyon bildirimleri ve yönetimsel işlem kayıtları.

Telefon numaranız, posta adresiniz, ödeme bilgileriniz, biyometrik veya sağlık
verileriniz ile herhangi bir **özel nitelikli kişisel veriniz
işlenmemektedir.** IP adresiniz ve cihaz türünüz hesabınızla ilişkilendirilerek
**saklanmamaktadır** — ülkeniz de IP adresinizden çıkarılmaz, kayıt sırasında
sizin seçtiğiniz değerdir. Ad ve soyad **zorunlu değildir**; vermemeyi seçerseniz
hizmetin hiçbir bölümü kısıtlanmaz.

## 3. İşleme amaçları

- Hesabınızı oluşturmak, işletmek ve kimliğinizi doğrulamak.
- Hizmetin kendisini sunmak: kütüphaneniz, günlükleriniz, profiliniz, DNA
  eşleşmeniz, arketipleriniz, topluluklarınız ve sosyal bağlantılarınız.
- Talep ettiğiniz mesaj ve bildirimleri iletmek.
- Hizmetin güvenliğini sağlamak, kötüye kullanım ve dolandırıcılığı önlemek,
  içerik moderasyonu yürütmek.
- Talebiniz üzerine harici bir oyun hesabını bağlamak.
- Hukuki yükümlülüklerimizi yerine getirmek ve yetkili taleplere yanıt vermek.

Kişisel verileriniz reklam amacıyla, ürün dışı profilleme amacıyla veya makine
öğrenmesi modellerinin eğitilmesi amacıyla **kullanılmamakta** ve üçüncü
kişilere **satılmamaktadır.**

## 4. Aktarılan taraflar ve aktarım amacı

- **Diğer GMRLog kullanıcıları:** seçtiğiniz görünürlük ayarları ölçüsünde.
  E-posta adresiniz hiçbir kullanıcıya gösterilmez.
- **Talimatlarımız doğrultusunda işleyen tedarikçiler:** yalnızca hizmetin
  yürütülmesi için gerekli ölçüde — barındırma ve veritabanı altyapısı,
  görseller için nesne depolama, arama dizinleme, e-posta iletimi ve hata
  izleme hizmetleri.
- **Harici oyun sağlayıcıları:** Steam gibi, yalnızca bir hesap bağlamanız
  hâlinde ve verdiğiniz yetki kapsamıyla sınırlı olarak.
- **Yetkili kamu kurum ve kuruluşları ile yargı mercileri:** hukuka uygun bir
  talebin gerektirdiği hâllerde.

Yurt dışına aktarım, KVKK'nın 9. maddesindeki şartlara uygun olarak
yapılmaktadır. GMRLog, Türkiye dışında konumlanabilen altyapılar üzerinde
çalışmaktadır.

## 5. Toplama yöntemi ve hukuki sebep

Kişisel verileriniz; GMRLog uygulaması ve internet sitesi üzerinden, kayıt
olmanız, hizmeti kullanmanız ve — bağlamanız hâlinde — harici oyun
sağlayıcısının kendi arayüzü aracılığıyla **elektronik ortamda**
toplanmaktadır.

KVKK'nın 5. maddesi kapsamındaki hukuki sebepler şunlardır:

| İşleme faaliyeti | Hukuki sebep |
|---|---|
| Hesap oluşturma, kimlik doğrulama, hizmetin sunulması | Sözleşmenin kurulması veya ifası için gerekli olması |
| Asgari yaşın sağlandığının denetlenmesi (doğum tarihi) | Kanunlarda açıkça öngörülmesi / hukuki yükümlülük |
| Uygulanacak tüketici hukukunun ve asgari yaşın belirlenmesi (ülke) | Hukuki yükümlülük |
| Ürünün seçilen dilde sunulması | Sözleşmenin ifası için gerekli olması |
| Profilde gerçek adın gösterilmesi (ad, soyad) | Açık rıza |
| Güvenlik, kötüye kullanımın önlenmesi, moderasyon | Veri sorumlusunun meşru menfaati |
| Kanunen saklama ve bildirim yükümlülükleri | Kanunlarda açıkça öngörülmesi / hukuki yükümlülük |
| Harici oyun hesabının bağlanması | Açık rıza |

Açık rızaya dayanan işlemelerde rızanızı **dilediğiniz zaman**, gerekçe
göstermeksizin ve hizmetin çekirdek işlevlerine erişiminizi kaybetmeksizin
geri alabilirsiniz. Rızanın geri alınması, geri alınmadan önce hukuka uygun
şekilde gerçekleştirilmiş işlemeyi geçersiz kılmaz.

## 6. KVKK 11. madde kapsamındaki haklarınız

Veri sorumlusuna başvurarak;

- kişisel verilerinizin işlenip işlenmediğini öğrenme,
- işlenmişse buna ilişkin bilgi talep etme,
- işlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,
- yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,
- eksik veya yanlış işlenmiş olması hâlinde düzeltilmesini isteme ve bunun
  aktarıldığı üçüncü kişilere bildirilmesini isteme,
- işlenmesini gerektiren sebeplerin ortadan kalkması hâlinde silinmesini veya
  yok edilmesini isteme ve bunun aktarıldığı üçüncü kişilere bildirilmesini
  isteme,
- münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle
  aleyhinize bir sonucun ortaya çıkmasına itiraz etme,
- kanuna aykırı işleme sebebiyle zarara uğramanız hâlinde zararın
  giderilmesini talep etme

haklarına sahipsiniz.

## 7. Başvuru yöntemi

Taleplerinizi, hesabınıza kayıtlı e-posta adresinden **privacy@gmrlog.com**
adresine iletebilirsiniz. Başvurularınız, talebin niteliğine göre en geç
**30 gün** içinde ücretsiz olarak sonuçlandırılır; işlemin ayrıca bir maliyet
gerektirmesi hâlinde Kurul tarafından belirlenen tarifedeki ücret alınabilir.
Başvurular ayrıca Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ'de
öngörülen yöntemlerle de iletilebilir.

Bazı haklarınızı GMRLog içinden doğrudan kullanabilirsiniz: profil
bilgilerinizi düzeltebilir, görünürlük ayarlarınızı değiştirebilir ve bağlı
bir hesabı dilediğiniz zaman kaldırabilirsiniz. Erişim, dışa aktarma ve silme
talepleri şu an yukarıdaki adres üzerinden yürütülmektedir; bu işlemlerin
uygulama içinden yapılabilmesi için geliştirme sürmekte olup, tamamlandığında
bu metin güncellenecektir.

Ayrıca Kişisel Verileri Koruma Kurumu'na şikâyette bulunma hakkınız saklıdır.

## 8. İletişim

privacy@gmrlog.com

[LEGAL ENTITY NAME]

[REGISTERED ADDRESS]
`,
};
