import type { LegalDocumentDefinition } from './legal-document.types';

/**
 * 12.1 — Terms of Service, English, v1.0.0.
 *
 * Two things this deliberately does not do, both of which are the default in a
 * copied-in template and both of which would be false here:
 *
 * 1. It does not take a broad, sublicensable, perpetual licence over what a
 *    player writes. GMRLog needs exactly enough licence to store, display and
 *    transmit content inside the product; anything past that would contradict
 *    F2.27 §4 (data ownership) and would not survive a KVKK/GDPR reading of
 *    "purpose limited to stated product need".
 * 2. It does not impose an arbitration clause, a class-action waiver, or a
 *    foreign forum on a consumer. Both Turkish and EU consumer law treat those
 *    as unenforceable against a consumer, so writing one in would be a clause
 *    that reads as strong and is void — worse than not having it.
 *
 * There is no payment, subscription, refund or billing section because GMRLog
 * has no paid tier and no billing backend (TASKS.md 3b.5). A refund policy for
 * something that cannot be bought is the same class of error as a privacy
 * policy promising an endpoint that does not exist.
 */
export const termsOfServiceEn: LegalDocumentDefinition = {
  id: 'terms-of-service',
  locale: 'en',
  version: '1.0.0',
  effectiveDate: '2026-08-21',
  title: 'Terms of Service',
  requiresAcceptance: true,
  body: `# Terms of Service

**Effective date:** 21 August 2026

**Version:** 1.0.0

## 1. What this is

These terms are the agreement between you and GMRLog for your use of the
GMRLog service. GMRLog is operated by [LEGAL ENTITY NAME], registered at
[REGISTERED ADDRESS].

By creating an account you accept these terms. If you do not accept them, do
not create an account.

GMRLog is a gaming identity service. It exists to answer one question about
you — what kind of gamer you are — from what you log, review and play.

## 2. Who can use GMRLog

You must be at least 13 years old. Where the law that applies to you sets a
higher minimum age for using an online service without a parent's consent,
that higher age applies to you instead.

One person, one account. You are responsible for what happens under your
account and for keeping your password to yourself. Tell us promptly if you
think someone else has access to it.

## 3. Your content stays yours

**You own what you write.** Your reviews, posts, comments, collections, tier
lists and logs remain yours. Nothing here transfers ownership to us.

To run the service we need a limited licence from you: a **non-exclusive,
worldwide, royalty-free licence to store, reproduce, display and transmit your
content for the sole purpose of operating GMRLog and showing your content to
the people you chose to show it to.** That licence exists only to make the
product work. It does not let us sell your content, license it onward,
advertise with it, or use it to train machine-learning models.

The licence ends when you delete the content or your account, except where
someone else already holds a copy in the ordinary course — a message already
delivered, a quote another player wrote around your post — and except for
backups still inside their retention window.

## 4. What you must not do

Do not use GMRLog to:

- harass, threaten, stalk or incite violence against anyone;
- post content that is unlawful where it is read, or that sexualises minors in
  any way;
- impersonate another person, or misrepresent an affiliation with a studio,
  publisher or organisation;
- post someone else's private information without their permission;
- break into, overload, scrape at scale, or circumvent any technical or rate
  limit of the service;
- manipulate rankings, reputation, matches or community standing through fake
  accounts, coordinated voting or automation;
- upload malware, or use GMRLog to distribute it;
- infringe someone else's copyright or trademark.

## 5. Moderation, and what happens when something goes wrong

We may remove content or restrict an account that breaks section 4 or the law.
Where we take action against your account we will tell you what happened and
why, unless telling you would itself be unlawful or would defeat an
investigation into serious harm.

You may appeal by writing to support@gmrlog.com. There is no hidden scoring
and no silent penalty: we do not secretly reduce your reach as an unannounced
sanction.

Reports you make about others are handled by human review.

## 6. Connected gaming accounts

You may connect an external gaming account, such as Steam. When you do, you
authorise us to fetch the data covered by the scopes you granted and show it
in your GMRLog profile. You can disconnect at any time. Those providers have
their own terms and their own privacy policies, and we do not control them.

## 7. Game data and other people's rights

Game titles, cover art, trademarks and metadata belong to their publishers,
developers and catalog providers. GMRLog displays them to identify games. That
display is not a claim of ownership and does not imply any endorsement,
sponsorship or partnership.

If you believe content on GMRLog infringes your copyright or trademark, write
to legal@gmrlog.com with enough detail to identify the work and the content
concerned. We will look at it and act where a claim is well-founded.

## 8. Availability

We try to keep GMRLog running and to keep your data intact, but we do not
promise uninterrupted or error-free service. We may change, suspend or
withdraw features. Where a change materially reduces what the service does for
you, we will give reasonable notice.

## 9. Liability

To the extent the law allows, GMRLog is provided as it is, and we are not
liable for indirect or consequential loss, lost data, or lost profit.

**Nothing in these terms limits liability that cannot lawfully be limited.**
That includes death or personal injury caused by negligence, fraud, and — if
you are a consumer — the rights your national consumer law gives you. If you
are a consumer in Türkiye or the European Union, your statutory consumer
rights are unaffected by anything written here.

## 10. Ending the agreement

You may stop using GMRLog and ask us to delete your account at any time. See
the Privacy Policy for how deletion works and how long it takes.

We may suspend or close an account that seriously or repeatedly breaks these
terms, or where we are required to. Except where an immediate close is
necessary to prevent harm or to comply with the law, we will tell you first
and give you the chance to respond.

Sections 3 (as to licences already granted), 7, 9 and 11 survive the end of
this agreement.

## 11. Governing law and where disputes are heard

These terms are governed by the laws of [GOVERNING JURISDICTION].

**If you are a consumer, this does not deprive you of the protection of the
mandatory law of the country where you live, and you may bring proceedings in
your own courts.** In Türkiye, consumers may also apply to the Consumer
Arbitration Committees (Tüketici Hakem Heyetleri) and the Consumer Courts.

We do not require you to arbitrate, and we do not ask you to waive a class
action.

## 12. Changes to these terms

When we change these terms we bump the version and the effective date. A
change that affects your rights or obligations is at minimum a minor version
bump, and we will ask you to review and accept the new version rather than
quietly substituting it. Only a change that cannot alter what you agreed to —
a typo, a broken link, a translation fix — is made as a patch.

If you do not accept a new version, you may close your account.

## 13. Contact

support@gmrlog.com

[LEGAL ENTITY NAME]

[REGISTERED ADDRESS]
`,
};
