import type { LegalDocumentDefinition } from './legal-document.types';

/**
 * 12.1 — Privacy Policy, English, v1.0.0.
 *
 * Written against the real schema, not against the aspiration in
 * `docs/11_SECURITY/PRIVACY_POLICY.md`. Two claims in that document are wrong
 * and are deliberately absent here: GMRLog collects no birth date (no such
 * column exists on `User`) and stores no device type or IP address against a
 * session (`Session` carries `expiresAt`/`revokedAt` only). 12.7 corrects that
 * document rather than this one bending to match it.
 *
 * The rights section routed to a human because 12.5 (export) and 12.6
 * (deletion) did not exist yet. That was Phase 12's stated gate: a policy must
 * not claim a self-serve right the backend cannot serve. 12.5 shipped
 * `POST /me/export` (1.2.0); 12.6 now ships the deletion half —
 * `/me/account/deletion`'s 30-day grace period, cancellable any time before
 * it takes effect — which is why this is 1.3.0, another minor bump for the
 * same reason 1.2.0 was: a right's own exercise changed, so every existing
 * acceptance goes stale and re-consent is raised. Both halves of Phase 12's
 * gate are closed as of this version.
 */
export const privacyPolicyEn: LegalDocumentDefinition = {
  id: 'privacy-policy',
  locale: 'en',
  version: '1.3.0',
  effectiveDate: '2026-08-23',
  title: 'Privacy Policy',
  // 12.4a — a notice, not a bargain. GDPR Art. 13/14 and KVKK Art. 10 require
  // that a privacy notice be *given*; the reader is informed, they do not
  // consent to it. Presenting it with an accept control would blur the same
  // line the Aydınlatma Metni was already kept on the right side of. It is
  // still shown, still linked from sign-up, and its display is still recorded —
  // as an acknowledgement.
  requiresAcceptance: false,
  body: `# Privacy Policy

**Effective date:** 23 August 2026

**Version:** 1.3.0

## 1. Who is responsible for your data

GMRLog ("GMRLog", "we", "us") operates the GMRLog service. Under the EU
General Data Protection Regulation (GDPR) we are the **data controller**.
Under the Turkish Personal Data Protection Law No. 6698 (KVKK) we are the
**veri sorumlusu**.

- Legal entity: [LEGAL ENTITY NAME]
- Registered address: [REGISTERED ADDRESS]
- Contact for privacy matters: privacy@gmrlog.com

This policy is written to satisfy KVKK and the GDPR together. Where the two
differ, we apply whichever gives you more protection. It applies wherever you
use GMRLog, regardless of where you live.

## 2. What we collect, and why

We collect only what the product needs in order to work. Every category below
corresponds to data GMRLog actually stores today.

### 2.1 Account and identity

Your email address, your password (kept only as a salted hash, never in
readable form), your handle and display name, and — if you choose to add them
— your bio, avatar and profile banner. We need these to create your account,
sign you in, and show you to other players.

**Your date of birth**, which you give when you register. We ask for it for one
reason: GMRLog is not for children under 13, and until we knew your date of
birth that rule was a sentence in our Terms with nothing behind it. We store the
date rather than your age, because an age is wrong the day after you give it and
cannot be checked again.

**Your country**, which you choose when you register — we do not infer it from
your network connection. It tells us which consumer law protects you, which
minimum age applies to you (it is higher than 13 in several countries), and
where your data may be held.

**Your language**, so the product and these documents appear in a language you
read.

**Your first and last name, only if you choose to give them.** They are optional
and the sign-up form says so. GMRLog is built on handles and display names —
your real name is not needed to use any part of it, we do not verify it, and
leaving both fields empty costs you nothing.

**We do not collect your phone number, your postal address, or any payment
details.** GMRLog has no paid tier and performs no payment processing of any
kind.

### 2.2 What you create and log

Your game library entries and play logs, reviews, posts, comments, reactions,
collections, tier lists, community memberships, event participation and
achievement progress. This is the product: a record of what kind of gamer you
are. It is stored because you asked us to store it.

### 2.3 Social connections

Who you follow and who follows you, friend requests and friendships, blocks
and mutes, and your presence status. Private messages between you and other
players are stored so that they can be delivered and read.

### 2.4 Connected gaming accounts

If — and only if — you connect an external gaming account such as Steam, we
store the external account reference, its display name, the scopes you
granted, and the library, playtime and achievement data that provider returns.
You choose to connect it, you can disconnect it at any time, and we never
touch a provider you have not connected.

### 2.5 Technical and operational data

Server logs recording that a request happened, when, and whether it succeeded,
carrying a correlation identifier so that an error can be traced. Records of
moderation reports and administrative actions, kept for safety and
accountability.

**We do not store your IP address or your device type against your account.** A
GMRLog session record holds only its expiry and whether it was revoked.

### 2.6 What we do not do

- We do not sell your personal data. Not to anyone, under any framing.
- We do not run advertising, and there is no advertising identifier anywhere
  in GMRLog.
- We do not use third-party analytics or tracking pixels.
- We do not profile you for any purpose outside the product itself.
- We do not use your content to train machine-learning models.

The similarity and archetype scores GMRLog computes about you exist to power
features you can see — your DNA match, your archetypes — and nothing else.
There is no hidden score, no shadow ranking, and no automated decision that
produces a legal or similarly significant effect on you.

## 3. Our legal basis for each use

| What we do | GDPR Art. 6 basis | KVKK Art. 5 basis |
|---|---|---|
| Create and operate your account | Performance of a contract | Necessary for performance of a contract |
| Check you meet the minimum age (date of birth) | Legal obligation | Legal obligation |
| Apply the right consumer law and minimum age (country) | Legal obligation | Legal obligation |
| Show the product in your language | Performance of a contract | Necessary for performance of a contract |
| Show a real name on your profile, if you gave one | Consent | Explicit consent |
| Store your library, logs, reviews and posts | Performance of a contract | Necessary for performance of a contract |
| Keep the service secure, prevent abuse, moderate | Legitimate interests | Legitimate interests of the controller |
| Send service email you cannot opt out of, such as a password reset | Performance of a contract | Necessary for performance of a contract |
| Connect an external gaming account | Consent | Explicit consent |
| Meet a legal obligation or respond to lawful process | Legal obligation | Legal obligation |

Where we rely on consent, you may withdraw it at any time. Withdrawal is as
easy as giving it, does not require you to explain yourself, and does not cost
you access to the core of GMRLog. Withdrawing consent does not undo processing
that was lawful before you withdrew it.

## 4. Who else can see your data

### 4.1 Other players

Your profile, handle, display name and the content you post are visible
according to the visibility settings you choose. Private messages are visible
to their participants. **Your email address is never shown to another player.**

### 4.2 Service providers acting on our instructions

We use a small number of processors, each bound to process data only as we
instruct:

- **Hosting and database infrastructure**, to run the service.
- **Object storage**, for avatars, banners and uploaded images.
- **Search indexing**, so that profiles, games and communities can be found.
- **Email delivery**, to send account email such as a password reset.
- **Error monitoring**, to be told when something breaks. It is configured not
  to attach personal identifiers to error reports.

### 4.3 External gaming providers

When you connect an account, we exchange data with that provider — for
example, Steam — within the scopes you granted. Their handling of your data is
governed by their own policy, not by this one.

### 4.4 Game catalog sources

We obtain game metadata from third-party catalog sources. That data flows
**towards** us and contains no personal data about you.

### 4.5 Legal disclosure

We may disclose data where we are legally required to. Where we are permitted
to tell you, we will.

## 5. International transfers

GMRLog runs on infrastructure that may be located outside your country,
including outside Türkiye and outside the European Economic Area. Where we
transfer personal data internationally we rely on the safeguards the
applicable law requires — under the GDPR, an adequacy decision or Standard
Contractual Clauses; under KVKK, the conditions set out in Article 9. You may
ask us which safeguard applies to a particular transfer.

## 6. How long we keep things

- **Your account and its content:** for as long as your account exists.
- **After you ask us to delete your account:** a 30-day grace period during
  which you can change your mind, after which the account and its personal
  data are permanently erased. See section 7.
- **Server logs:** a short operational window, then discarded.
- **Moderation and safety records:** kept longer, where a shorter period would
  simply let a banned account return, or where we are required to keep them.
- **Anything we are legally required to retain:** for the required period, and
  no longer.

Where content you wrote is entangled with someone else's — a reply beneath
another player's post, a message already delivered to its recipient — deleting
your account removes your identity from it rather than destroying another
person's record of their own conversation.

## 7. Your rights, and how to use them

Under the GDPR and KVKK you have the right to:

- **Know and access** what personal data we hold about you, and why.
- **Receive a copy** of it in a portable, machine-readable format.
- **Correct** anything inaccurate or incomplete.
- **Delete** your personal data.
- **Restrict or object to** certain processing.
- **Withdraw consent** where processing rests on it.
- **Ask us to notify** third parties to whom the data was transferred about a
  correction or a deletion.
- **Complain** to a supervisory authority.

**How to exercise them today.** Several are already self-serve: you can edit
your profile, change your visibility settings, disconnect an external account,
and — from Settings → Account → Your data — download a copy of your data in a
portable, machine-readable format, covering every category in section 2, at
any time (limited to once every 24 hours).

**Deletion is also self-serve.** From Settings → Account → Delete account,
you can start a 30-day grace period: your account still works normally during
those 30 days, and you can cancel from the same screen at any point before
they end. Once they pass, deletion is permanent — your account is erased and
cannot be recovered. Content entangled with someone else's — a reply beneath
another player's post, a message already delivered to its recipient — is
handled exactly as section 6 describes: your identity is removed from it, the
other person's record of their own conversation is not. A community you are
the sole owner of is archived rather than handed to another member, the same
outcome as if you had deleted it yourself before leaving.

For correction beyond what your profile settings cover, email
**privacy@gmrlog.com** from the address on your account. We will respond
within **30 days**, free of charge unless a request is manifestly unfounded or
excessive.

**Where to complain.** In Türkiye, the Personal Data Protection Authority
(Kişisel Verileri Koruma Kurumu). In the EEA, your local supervisory
authority. You are not required to come to us first, though we would rather
have the chance to fix it.

## 8. Security

We protect your data in transit with TLS, store passwords only as salted
hashes, keep administrative actions in an audit record, and limit internal
access to what a role requires. No system is perfectly secure. If a breach
occurs that is likely to put your rights at risk, we will notify you and the
relevant authority within the periods the law requires.

## 9. Children

GMRLog is not directed at children under 13, and we do not knowingly collect
their personal data. Where local law sets a higher age for consenting to
online services, that higher age applies. If you believe a child has given us
personal data, contact us and we will delete it.

## 10. Changes to this policy

When we change this policy we bump its version and its effective date. A
change that affects a right you have, a purpose we process for, a period we
retain for, or a party we share with is at minimum a minor version bump, and
we will ask you to review and accept the new version rather than quietly
substituting it. Only a change that cannot alter what you agreed to — a typo,
a broken link, a translation fix — is made as a patch.

We will not re-ask for something you have refused until you give in.

## 11. Contact

privacy@gmrlog.com

[LEGAL ENTITY NAME]

[REGISTERED ADDRESS]
`,
};
