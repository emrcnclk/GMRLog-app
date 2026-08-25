import type { LegalDocumentDefinition } from './legal-document.types';

/**
 * 12.1 — Kullanım Koşulları, Turkish, v1.0.0.
 *
 * Mirrors `terms-of-service.en` section for section. The consumer carve-out in
 * §9 and §11 matters more here than in the English text, not less: Turkish
 * consumer law (6502) makes an unfair term void against a consumer whatever
 * the contract says, so the clause states the carve-out rather than relying on
 * a court to read it in.
 */
export const termsOfServiceTr: LegalDocumentDefinition = {
  id: 'terms-of-service',
  locale: 'tr',
  version: '1.0.0',
  effectiveDate: '2026-08-21',
  title: 'Kullanım Koşulları',
  requiresAcceptance: true,
  body: `# Kullanım Koşulları

**Yürürlük tarihi:** 21 Ağustos 2026

**Sürüm:** 1.0.0

## 1. Bu metin nedir

Bu koşullar, GMRLog hizmetini kullanmanıza ilişkin olarak sizinle GMRLog
arasındaki sözleşmedir. GMRLog, [REGISTERED ADDRESS] adresinde kayıtlı
[LEGAL ENTITY NAME] tarafından işletilmektedir.

Hesap oluşturarak bu koşulları kabul etmiş olursunuz. Kabul etmiyorsanız hesap
oluşturmayın.

GMRLog bir oyuncu kimliği hizmetidir. Hakkınızdaki tek bir soruyu — nasıl bir
oyuncu olduğunuzu — kaydettiklerinizden, incelemelerinizden ve
oynadıklarınızdan yanıtlamak için vardır.

## 2. Kimler kullanabilir

En az 13 yaşında olmanız gerekir. Size uygulanan hukuk, çevrimiçi bir hizmeti
ebeveyn onayı olmaksızın kullanmak için daha yüksek bir asgari yaş öngörüyorsa,
sizin için o yaş geçerlidir.

Bir kişi, bir hesap. Hesabınız altında olan bitenden ve parolanızı kendinize
saklamaktan siz sorumlusunuz. Başkasının erişim sağladığını düşünüyorsanız
gecikmeksizin bize bildirin.

## 3. İçeriğiniz sizindir

**Yazdıklarınızın sahibi sizsiniz.** İncelemeleriniz, gönderileriniz,
yorumlarınız, koleksiyonlarınız, tier listeleriniz ve günlükleriniz sizin
kalır. Buradaki hiçbir hüküm mülkiyeti bize devretmez.

Hizmeti çalıştırabilmek için sizden sınırlı bir lisansa ihtiyacımız var:
**yalnızca GMRLog'u işletmek ve içeriğinizi göstermeyi seçtiğiniz kişilere
göstermek amacıyla, münhasır olmayan, dünya çapında, telifsiz bir saklama,
çoğaltma, gösterme ve iletme lisansı.** Bu lisans yalnızca ürünün çalışması
içindir. İçeriğinizi satmamıza, başkasına lisanslamamıza, reklamda
kullanmamıza veya makine öğrenmesi modelleri eğitmemize izin vermez.

İçeriği veya hesabınızı sildiğinizde lisans sona erer; ancak olağan akış
içinde bir başkasında çoktan bir kopya bulunuyorsa — iletilmiş bir mesaj,
gönderinizin etrafına başka bir oyuncunun yazdığı bir alıntı — ve saklama
süresi içindeki yedekler bakımından bu hüküm saklıdır.

## 4. Yapmamanız gerekenler

GMRLog'u şunlar için kullanmayın:

- herhangi birini taciz etmek, tehdit etmek, takip etmek veya birine karşı
  şiddete teşvik etmek;
- okunduğu yerde hukuka aykırı olan ya da çocukları herhangi bir biçimde
  cinselleştiren içerik paylaşmak;
- başka bir kişinin kimliğine bürünmek ya da bir stüdyo, yayıncı veya kurumla
  bağlantınız hakkında yanlış izlenim yaratmak;
- bir başkasının özel bilgilerini izni olmadan paylaşmak;
- hizmete izinsiz erişmek, aşırı yük bindirmek, kitlesel olarak veri kazımak
  veya teknik ya da hız sınırlarını aşmak;
- sahte hesaplar, koordineli oylama veya otomasyonla sıralamaları, itibarı,
  eşleşmeleri ya da topluluk konumunu manipüle etmek;
- zararlı yazılım yüklemek veya GMRLog üzerinden dağıtmak;
- bir başkasının telif veya marka hakkını ihlal etmek.

## 5. Moderasyon ve bir şeyler ters gittiğinde

4. bölümü veya hukuku ihlal eden içeriği kaldırabilir, hesabı
kısıtlayabiliriz. Hesabınıza yönelik bir işlem yaptığımızda, bunu size
bildirmek başlı başına hukuka aykırı olmadıkça veya ciddi bir zarara ilişkin
soruşturmayı boşa çıkarmadıkça, ne olduğunu ve nedenini size söyleriz.

support@gmrlog.com adresine yazarak itiraz edebilirsiniz. Gizli bir puanlama
ve sessiz bir yaptırım yoktur: duyurulmamış bir ceza olarak erişiminizi gizlice
kısmayız.

Başkaları hakkında yaptığınız bildirimler insan incelemesiyle ele alınır.

## 6. Bağlı oyun hesapları

Steam gibi harici bir oyun hesabını bağlayabilirsiniz. Bağladığınızda,
verdiğiniz yetki kapsamındaki verileri almamıza ve GMRLog profilinizde
göstermemize izin vermiş olursunuz. Dilediğiniz zaman bağlantıyı
kaldırabilirsiniz. Bu sağlayıcıların kendi koşulları ve kendi gizlilik
politikaları vardır; onları biz denetlemeyiz.

## 7. Oyun verileri ve başkalarının hakları

Oyun adları, kapak görselleri, markalar ve meta veriler; yayıncılarına,
geliştiricilerine ve katalog sağlayıcılarına aittir. GMRLog bunları oyunları
tanımlamak için gösterir. Bu gösterim bir mülkiyet iddiası değildir ve
herhangi bir onay, sponsorluk veya iş birliği anlamına gelmez.

GMRLog'daki bir içeriğin telif veya marka hakkınızı ihlal ettiğini
düşünüyorsanız, eseri ve ilgili içeriği tanımlamaya yetecek ayrıntıyla
legal@gmrlog.com adresine yazın. İnceler ve haklı bir talep varsa işlem
yaparız.

## 8. Erişilebilirlik

GMRLog'u çalışır ve verinizi bütün tutmaya çalışırız; ancak kesintisiz veya
hatasız bir hizmet vaat etmiyoruz. Özellikleri değiştirebilir,
askıya alabilir veya kaldırabiliriz. Bir değişiklik hizmetin sizin için
yaptığını esaslı biçimde azaltıyorsa, makul bir süre önceden bildiririz.

## 9. Sorumluluk

Hukukun izin verdiği ölçüde GMRLog olduğu hâliyle sunulur ve dolaylı zarardan,
veri kaybından veya kâr kaybından sorumlu değiliz.

**Bu koşullardaki hiçbir hüküm, hukuken sınırlandırılamayacak bir sorumluluğu
sınırlamaz.** Buna ihmalden kaynaklanan ölüm veya bedensel zarar, hile ve —
tüketici iseniz — ulusal tüketici hukukunuzun size verdiği haklar dâhildir.
Türkiye'de veya Avrupa Birliği'nde tüketici iseniz, **6502 sayılı Tüketicinin
Korunması Hakkında Kanun başta olmak üzere kanundan doğan haklarınız burada
yazılanlardan etkilenmez.**

## 10. Sözleşmenin sona ermesi

GMRLog'u kullanmayı dilediğiniz zaman bırakabilir ve hesabınızın silinmesini
isteyebilirsiniz. Silmenin nasıl işlediği ve ne kadar sürdüğü için Gizlilik
Politikası'na bakın.

Bu koşulları ağır veya tekrarlayan biçimde ihlal eden ya da hukuken zorunlu
olduğumuz hâllerde bir hesabı askıya alabilir veya kapatabiliriz. Zararı
önlemek ya da hukuka uymak için derhâl kapatmanın zorunlu olduğu hâller
dışında, önce size bildirir ve yanıt verme imkânı tanırız.

3. bölüm (verilmiş lisanslar bakımından), 7, 9 ve 11. bölümler sözleşmenin
sona ermesinden sonra da yürürlükte kalır.

## 11. Uygulanacak hukuk ve uyuşmazlıkların çözümü

Bu koşullara [GOVERNING JURISDICTION] hukuku uygulanır.

**Tüketici iseniz bu hüküm sizi, yaşadığınız ülkenin emredici hukukunun
sağladığı korumadan yoksun bırakmaz ve kendi mahkemelerinizde dava
açabilirsiniz.** Türkiye'de tüketiciler ayrıca Tüketici Hakem Heyetleri'ne ve
Tüketici Mahkemeleri'ne başvurabilir.

Sizi tahkime zorlamıyor ve toplu dava hakkınızdan feragat etmenizi
istemiyoruz.

## 12. Bu koşullardaki değişiklikler

Bu koşulları değiştirdiğimizde sürümü ve yürürlük tarihini yükseltiriz.
Haklarınızı veya yükümlülüklerinizi etkileyen bir değişiklik en az bir minor
sürüm yükseltmesidir ve yeni sürümü sessizce yerine koymak yerine gözden
geçirip kabul etmenizi isteriz. Yalnızca kabul ettiğiniz şeyi değiştirmesi
mümkün olmayan düzeltmeler — yazım hatası, kırık bağlantı, çeviri düzeltmesi —
patch olarak yapılır.

Yeni bir sürümü kabul etmiyorsanız hesabınızı kapatabilirsiniz.

## 13. İletişim

support@gmrlog.com

[LEGAL ENTITY NAME]

[REGISTERED ADDRESS]
`,
};
