import type { LegalDocumentDefinition } from './legal-document.types';

/**
 * 12.1 — KVKK Aydınlatma Metni (disclosure notice), English rendering, v1.0.0.
 *
 * This is the document that makes the set three rather than two. KVKK Art. 10
 * imposes a duty to *inform* that is separate from, and prior to, any consent:
 * the controller's identity, the purposes, the recipients and the purpose of
 * transfer, the method and legal ground of collection, and the Art. 11 rights
 * must be given to the data subject regardless of which legal ground the
 * processing rests on. A privacy policy that also happens to mention those
 * facts does not discharge it, because the duty is to give the notice, not to
 * publish one somewhere.
 *
 * Hence `requiresAcceptance: false`. A disclosure is served and shown; it is
 * not a bargain to agree to. Presenting it with an accept control would blur
 * exactly the line KVKK draws between being informed (Art. 10) and consenting
 * (Art. 5/6), and would also manufacture a "consent" for processing that does
 * not rest on consent at all.
 *
 * The English text is a rendering for readers who do not read Turkish. The
 * Turkish text is the operative one for KVKK purposes.
 */
export const disclosureNoticeEn: LegalDocumentDefinition = {
  id: 'disclosure-notice',
  locale: 'en',
  version: '1.1.0',
  effectiveDate: '2026-08-22',
  title: 'KVKK Disclosure Notice',
  requiresAcceptance: false,
  body: `# Disclosure Notice under KVKK

**Effective date:** 22 August 2026

**Version:** 1.1.0

This notice is given under Article 10 of the Turkish Personal Data Protection
Law No. 6698 (KVKK). It is a rendering, for readers who do not read Turkish,
of the Turkish Aydınlatma Metni, which is the operative text.

Being informed is not the same as consenting. This notice tells you what
happens to your data. It is not something you agree to, and we do not ask you
to accept it.

## 1. The data controller

- **Veri sorumlusu (data controller):** [LEGAL ENTITY NAME]
- **Registered address:** [REGISTERED ADDRESS]
- **Contact:** privacy@gmrlog.com

## 2. What personal data we process

- **Identity and contact data:** email address, handle, display name, date of
  birth, country, language preference, any bio, avatar or banner you choose to
  add, and — only if you choose to give them — a first and last name.
- **Authentication data:** your password as a salted hash, and your sessions.
- **Product data you create:** game library entries and play logs, reviews,
  posts, comments, reactions, collections, tier lists, community memberships,
  event participation, achievement progress.
- **Social data:** follows, friend requests and friendships, blocks, mutes,
  presence, and the private messages you send and receive.
- **Connected account data:** where you connect an external gaming account,
  its reference, display name, granted scopes, and the library, playtime and
  achievement data that provider returns.
- **Transaction security and operational data:** server logs of requests with
  a correlation identifier, moderation reports, and administrative action
  records.

We do **not** process your phone number, postal address, payment data,
biometric or health data, or any special category of personal data. We do
**not** store your IP address or device type against your account — your
country is not inferred from your IP either, it is the value you select at
registration. A first and last name are **not required**; declining to give
them restricts nothing.

## 3. Why we process it

- To create and operate your account and authenticate you.
- To provide the service itself: your library, logs, profile, DNA match,
  archetypes, communities and social connections.
- To deliver the messages and notifications you asked for.
- To keep the service secure, prevent abuse and fraud, and moderate content.
- To connect an external gaming account, where you ask us to.
- To meet our legal obligations and respond to lawful requests.

We do not use your personal data for advertising, for profiling outside the
product, or for training machine-learning models, and we do not sell it.

## 4. To whom we transfer it, and why

- **Other users of GMRLog**, according to the visibility settings you choose.
  Your email address is never shown to another user.
- **Suppliers processing on our instructions**, only to the extent needed to
  run the service: hosting and database infrastructure, object storage for
  images, search indexing, email delivery, and error monitoring.
- **External gaming providers**, such as Steam, where you have connected an
  account, within the scopes you granted.
- **Public authorities and courts**, where a lawful request requires it.

Transfers abroad are made in accordance with Article 9 of KVKK. GMRLog runs on
infrastructure that may be located outside Türkiye.

## 5. How we collect it, and on what legal ground

We collect personal data electronically: through the GMRLog application and
website, when you register, when you use the service, and — where you connect
one — through the external gaming provider's own interface.

The legal grounds under KVKK Article 5 are:

| Processing | Ground |
|---|---|
| Account creation, authentication, providing the service | Necessary for the performance of a contract |
| Checking the minimum age is met (date of birth) | Expressly stipulated by law / legal obligation |
| Applying the right consumer law and minimum age (country) | Legal obligation |
| Presenting the product in the chosen language | Necessary for the performance of a contract |
| Showing a real name on your profile (first, last name) | Explicit consent |
| Security, abuse prevention, moderation | Legitimate interests of the controller |
| Retention and disclosure required by law | Expressly stipulated by law / legal obligation |
| Connecting an external gaming account | Explicit consent |

Where processing rests on explicit consent, you may withdraw it at any time,
without giving a reason and without losing access to the core of the service.

## 6. Your rights under Article 11

You have the right to:

- learn whether your personal data is processed;
- request information if it has been processed;
- learn the purpose of processing and whether it is used in line with that
  purpose;
- know the third parties to whom it is transferred, at home or abroad;
- request correction if it is incomplete or inaccurate, and request that this
  be notified to third parties to whom it was transferred;
- request erasure or destruction where the grounds for processing have
  disappeared, and request that this be notified to third parties to whom it
  was transferred;
- object to a result arising from analysis of your data solely by automated
  means, where that result is to your detriment;
- claim compensation for damage arising from unlawful processing.

## 7. How to use those rights

Write to **privacy@gmrlog.com** from the email address on your account. We
respond within **30 days**, free of charge, unless a request is manifestly
unfounded or excessive. Requests may also be submitted by the methods set out
in the Communiqué on the Procedures and Principles of Application to the Data
Controller.

Some rights are already self-serve inside GMRLog: you can correct your profile
data, change your visibility settings, and disconnect an external account at
any time. Access, export and erasure are handled by writing to the address
above; self-serve versions of those are being built, and this notice will be
updated when they ship.

You may also complain to the Personal Data Protection Authority (Kişisel
Verileri Koruma Kurumu).

## 8. Contact

privacy@gmrlog.com

[LEGAL ENTITY NAME]

[REGISTERED ADDRESS]
`,
};
