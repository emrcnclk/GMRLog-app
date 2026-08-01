# GMRLOG — Sprint F2.2: Authentication Experience Architecture & UX Freeze

**Document:** `docs/02_DESIGN/SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§12)  
**Sprint:** F2.2 (Auth Experience Only)  
**Last Updated:** July 2026  
**Owner:** Lead UX / Authentication Experience  
**Classification:** Frozen authentication & onboarding UX architecture

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | **This document** — Auth experience freeze |
| 5a | [`SPRINT_F2_2_1_AUTH_POLISH.md`](./SPRINT_F2_2_1_AUTH_POLISH.md) — **LOCKED amendment** (emotional positioning, onboarding intent, guest depth, providers, completion moment) |
| 6 | `DESIGN_SYSTEM.md` · `COMPONENT_LIBRARY.md` · `DESIGN_TOKENS.md` |
| API contract (validation lengths) | [`AUTH_API.yaml`](../08_API/AUTH_API.yaml) — UX must not invent weaker rules |

**Auth SSOT** = this document + F2.2.1 polish amendment. Mechanics here; identity emotion in F2.2.1 when they differ.

**Scope:** Authentication experience architecture & UX freeze only.  
**Out of scope:** Home, Feed, Game, Profile UI; React Native; implementation; Sprint F2.3+.

**Gate:** Stop after freeze. Do **not** continue to F2.3 in this deliverable.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Authentication Philosophy |
| 2 | UX Principles |
| 3 | Complete User Flows |
| 4 | Screen Inventory |
| 5 | Validation Rules |
| 6 | Error States |
| 7 | Empty / Blocking States |
| 8 | Security UX |
| 9 | Accessibility |
| 10 | User Testing Scenarios |
| 11 | Authentication Audit Checklist |
| — | Design Gates (internal) |

---

# 1. Authentication Philosophy

## 1.1 Promise

Authentication is the **front door to a gaming identity**, not a chore form.

It must communicate:

> You’re entering your gaming world.

Not:

> Please fill another boring login form.

## 1.2 Dual job

| Job | Meaning |
|-----|---------|
| **Trust** | Secure, clear, calm — never fear-mongering |
| **Belonging** | First taste of Story Ember / culture OS energy |

Every auth screen should: **increase confidence · reduce friction · create quiet excitement**.

## 1.3 Relationship to IA (F2.1)

Auth lives in **AuthenticationStack** + **OnboardingStack** under AuthGate.  
Success lands on **MainApp · Home**. Soft-gated deep links return to queued target after auth.

## 1.4 What auth is not

- Not a product tour / feature slideshow  
- Not a review-site signup  
- Not a store account wall  
- Not the place for Premium upsell  

---

# 2. UX Principles

| # | Principle | Rule |
|---|-----------|------|
| 1 | **Identity over credentials** | Headlines speak to gaming home; fields stay secondary visually (UI sprint) |
| 2 | **Shortest honest path** | Fewer steps than competitors without hiding required trust actions (verify email) |
| 3 | **Progressive disclosure** | Advanced options (social, passkey, MFA) appear when ready — architecture reserved now |
| 4 | **Inline recovery** | Every error explains · recovers · continues — no dead ends |
| 5 | **One primary action** | Per screen: one ember Primary CTA |
| 6 | **Guest clarity** | Guest may browse limited public previews (F2.1 soft gate); joining is invited, not shamed |
| 7 | **Onboarding = personalization** | Taste signals for Discovery/Identity — not a tutorial |
| 8 | **Skip with dignity** | Skip where allowed; never punish; soft prompts later in-app |
| 9 | **Human errors** | No stack traces, status codes, or “Error 401” in UI copy |
| 10 | **Security without panic** | Calm tone for lockouts, suspicious login, timeouts |
| 11 | **F1 motion only** | 180–250ms core; no bounce; respect reduced motion |
| 12 | **API-aligned rules** | Password/username constraints match `AUTH_API.yaml` |

---

# 3. Complete User Flows

## 3.1 First-time (Guest → Home)

```
Guest
  → Splash
  → Session Check (no session)
  → Welcome / Login (default entry)
  → Register  (or Login if existing)
  → Email Verification (Pending → Success path)
  → Onboarding (personalization; skippable per §4)
  → Home (MainApp)
```

**Target:** Account creation path completable in **under 2 minutes** (Scenario 1) when email client is at hand; verification may pause the clock honestly (“Check your email” state with clear next steps).

## 3.2 Returning user

```
Splash
  → Session Check / Restore Session
  → (valid) Home
```

**Target:** Reach Home in **under 15 seconds** on healthy network (Scenario 2), including splash + restore.

## 3.3 Expired / invalid session

```
Splash
  → Restore Failed / Session Expired
  → Login (prefilled email/username if safely cached)
  → Home
```

Queued deep link preserved when possible.

## 3.4 Forgot password

```
Login → Forgot Password (Request)
  → Email Sent
  → (email link / app) Password Reset
  → Success
  → Login (auto-focus password) or auto-login if API allows
```

User never feels lost: always **what happened · what to do · where to go**.

## 3.5 Logout

```
Settings (or Profile overflow) → Logout
  → Confirmation Dialog
  → Guest (Auth entry)
```

Optional: “Log out all devices” future — Settings security, not default logout.

## 3.6 Email verification branch

```
Register success
  → Verification Pending
  → Resend (rate-limited)
  → deep link / code → Verification Success
  → Onboarding | Home
```

Already verified → skip Pending.

## 3.7 Soft gate (public preview)

```
Deep link (game/user) as Guest
  → Limited preview (F2.1)
  → Auth prompt (“Save your place in GMRLOG”)
  → Login/Register
  → return to queued target (skip Onboarding only if already complete)
```

## 3.8 Blocked paths

| Condition | Flow |
|-----------|------|
| Account locked | Account Locked screen → support / unlock instructions → Login when clear |
| Rate limited | Rate Limited state on current screen → wait + retry |
| Maintenance | Maintenance full-screen → retry |
| Offline at boot | Offline state → retry session check |
| Suspicious login | Security challenge UX (§8) → Login or verify |

## 3.9 Future-ready branches (architecture only)

| Capability | UX readiness |
|------------|--------------|
| Social login (Google, Apple, Steam, Discord, …) | Buttons reserved on Login/Register; provider sheet; account linking later in Settings |
| Passkeys | Secondary action “Sign in with passkey” when OS supports |
| Biometrics | After first password/passkey success: optional “Unlock with Face ID / biometrics” for local session re-entry — never sole remote auth without server session |
| MFA | Challenge screen after password; backup codes — Future |
| Age verification | Gate before Register submit when region requires — Future field/step |

---

# 4. Screen Inventory

**Architecture & UX purpose only — no visual design in this sprint.**

| Screen ID | Purpose | Entry | Exit / Next |
|-----------|---------|-------|-------------|
| **Splash** | Brand moment; no decisions | Cold start | Session Check |
| **Loading / Session Check** | Restore tokens; remote config; decide gate | Splash | Home / Auth / Expired / Offline / Maintenance |
| **Welcome / Login** | Primary sign-in; identity invitation | No session; logout; expired | Register, Forgot, Home, Verification |
| **Register** | Create identity | Login secondary; deep link | Verification Pending / errors |
| **Forgot Password** | Request reset | Login | Email Sent |
| **Email Sent** | Confirm request; inbox guidance | Forgot; resend verify | Login; open mail (OS); Resend |
| **Password Reset** | Set new password (token from link) | Deep link | Success → Login |
| **Reset Success** | Confidence + next step | Reset submit OK | Login |
| **Verification Pending** | Explain verify; resend; change email (if API) | Register | Success; Login; support |
| **Verification Success** | Celebrate lightly; continue | Verify OK | Onboarding / Home |
| **Session Expired** | Calm re-auth | Restore fail | Login |
| **Account Locked** | Explain lock; recovery path; no dead end | API lock | Support; Login when unlocked |
| **Maintenance** | Platform unavailable | Boot or mid-auth | Retry |
| **Offline** | No connectivity | Boot or action fail | Retry; open settings (OS) |
| **Rate Limited** | Too many attempts | Any auth action | Wait timer; Retry |
| **Onboarding — Genres** | Taste personalization | Post-verify / first session | Next / Skip |
| **Onboarding — Platforms** | Platform identity | After genres | Next / Skip |
| **Onboarding — Franchises** (optional step) | Franchise taste | After platforms | Next / Skip |
| **Onboarding — Habits** | How they play (frequency, solo/social) | Mid flow | Next / Skip |
| **Onboarding — Review interest** | Logging vs social emphasis (soft) | Mid flow | Next / Skip |
| **Onboarding — Friends** | Follow suggestions | Alpha+ | Next / Skip |
| **Onboarding — Import** | Steam/etc import | Future | Next / Skip |
| **Onboarding — Complete** | Brief confirmation | Last step | Home |
| **Logout Confirm** | Dialog | Settings | Guest / dismiss |
| **OAuth Bridge** | Provider handoff | Social buttons | Register/Login complete / error |
| **Legal WebView** | Terms / Privacy | Links on Register | Back |

### Login experience (frozen behaviors)

| Element | Freeze |
|---------|--------|
| **Entry** | Default Auth root = Login with identity-forward headline; Register as secondary |
| **Primary action** | Sign in (email/username + password) |
| **Secondary actions** | Create account · Forgot password |
| **Guest fallback** | Soft gate copy if arrived from preview; else no forced guest mode inside Auth stack |
| **Social login** | Ready slots (Future) — hidden or disabled until providers ship; layout reserved |
| **Passkey** | Ready secondary (Future) |
| **Biometric** | Post-login local unlock prompt (Future/Alpha) — not on first Register |
| **Password visibility** | Toggle; default hidden; a11y label |
| **Validation timing** | Submit-time for credentials; inline after blur for format only |
| **Loading** | Primary button loading; form non-editable; no double submit |
| **Errors** | Inline + optional banner; field-level when possible (§6) |

### Register experience (frozen)

| Element | Freeze |
|---------|--------|
| **Fields (MVP)** | Email · Username · Password · Confirm password (or single password + strength UI) · Terms agree · Privacy acknowledge · Marketing opt-in (unchecked default) |
| **Validation philosophy** | Helpful, early for username availability; password rules visible before submit; never shame |
| **Password rules** | Align API: **min 12** characters; show requirements checklist; discourage weak patterns in copy |
| **Username** | Check availability (`/auth/check-username`); min length **3** (API); allowed charset per API; debounce |
| **Terms / Privacy** | Required checkboxes or combined “I agree to Terms & Privacy” with links |
| **Marketing opt-in** | Explicit opt-in; never pre-checked |
| **Age verification** | Future step when required — placeholder in flow map only |
| **Friction** | No captcha wall by default; risk-based challenges only (§8) |

### Onboarding (frozen)

| Rule | Freeze |
|------|--------|
| **Goal** | Personalization for Discovery + Identity — **not** a tutorial |
| **Core MVP steps** | Favorite genres → Favorite platforms → (optional) habits → Done |
| **Alpha** | Follow friends suggestions |
| **Optional / Future** | Franchises · Review interest · Import sources |
| **Skip** | Available on each step and “Skip for now” on hub; no loss of account |
| **Completion criteria** | MVP: genres **or** platforms selected **or** explicit skip → mark onboarding complete |
| **Edit later** | Same data editable in Profile / Settings taste |

---

# 5. Validation Rules

## 5.1 Philosophy

- Prefer **prevention** (clear requirements) over punishment.  
- **Format** validated on blur; **availability** debounced; **auth correctness** on submit.  
- Client rules ≤ server rules; server always wins.  
- Never show raw API error codes.

## 5.2 Field rules (UX ↔ API)

| Field | Client UX rule | Source |
|-------|----------------|--------|
| Email | Valid format; trim; lowercase normalize for display consistency | Standard + API |
| Username | Min **3**; charset per API; availability check | `AUTH_API` check-username |
| Password | Min **12**; show strength/requirements; confirm match if dual field | `AUTH_API` minLength 12 |
| Reset token | Opaque; invalid → human reset error + request new link | API |
| Verification | Code/link; resend cooldown visible | API |

## 5.3 Timing

| Event | Behavior |
|-------|----------|
| Typing | No error spam |
| Blur | Format hints |
| Username idle ~400–600ms | Availability |
| Submit | Full validate → loading → success/error |
| Rate limit | Disable primary; show wait |

## 5.4 Success criteria (UX)

| Action | Success signal |
|--------|----------------|
| Login | Transition to Home/Onboarding; optional biometric ask later |
| Register | Verification Pending (unless auto-verified) |
| Reset request | Email Sent (same message if email unknown — **anti-enumeration** copy) |
| Reset submit | Success screen |
| Verify | Verification Success |
| Onboarding complete/skip | Home |

Anti-enumeration: Forgot password always “If an account exists, we sent instructions.”

---

# 6. Error States

## 6.1 Error philosophy

Every error must:

1. **Explain** — what happened in plain language  
2. **Recover** — one clear action  
3. **Continue** — path forward (retry, forgot password, support, back)

No technical wording (“JWT expired”, “ECONNRESET”).

## 6.2 Catalog (UX copy intent — final strings in localization sprint)

| Situation | Explain (intent) | Recover | Continue |
|-----------|------------------|---------|----------|
| Invalid credentials | “That email/username or password doesn’t match.” | Try again | Forgot password |
| Unverified email | “Confirm your email to continue.” | Resend | Open Verification Pending |
| Network fail | “We couldn’t reach GMRLOG.” | Retry | Offline help |
| Validation fail | Field-specific | Fix field | Stay |
| Username taken | “That username is taken.” | Suggestions if any | Stay |
| Weak/short password | “Use at least 12 characters.” | Edit | Stay |
| Reset token invalid | “This reset link expired or was used.” | Request new | Forgot Password |
| Verify invalid | “That code doesn’t work.” | Resend | Pending |
| Rate limited | “Too many tries — wait a moment.” | Timer | Retry when enabled |
| Locked | “Your account is temporarily locked.” | Unlock instructions / support | Locked screen |
| Suspicious | “We need to confirm it’s you.” | Challenge / email | §8 |
| Maintenance | “GMRLOG is being updated.” | Retry | Maintenance screen |
| OAuth cancel | “Sign-in was cancelled.” | Try again / email path | Login |
| OAuth fail | “We couldn’t connect that account.” | Retry / another method | Login |
| Generic server | “Something went wrong on our side.” | Retry | Support link |

---

# 7. Empty / Blocking States

| State | User understanding | Primary action | Secondary |
|-------|-------------------|----------------|-----------|
| **Offline** | No connection; progress saved when possible | Retry | OS network settings |
| **No connection** (mid-submit) | Same; form data retained | Retry | — |
| **Maintenance** | Temporary unavailability | Retry | Status link (if any) |
| **Verification pending** | Must confirm email; inbox guidance | Open email app / Resend | Logout / wrong email help |
| **Rate limited** | Wait required | Wait + Retry | — |
| **Locked account** | Access paused; how to unlock | Contact support / wait | Back to Login |
| **Email sent** | Check inbox + spam; may take minutes | Open mail | Resend · Back to Login |
| **Session expired** | Signed out for safety | Sign in | — |

These use F1 Empty/Error patterns when UI is built — structure frozen here.

---

# 8. Security UX

Communicate security **without fear**. Calm, respectful, brief.

| Topic | UX freeze |
|-------|-----------|
| **Password** | Hidden by default; requirements upfront; no password in URLs/logs messaging |
| **Email verification** | Framed as protecting identity & recovery — not punishment |
| **Suspicious login** | “Confirm it’s you” + familiar device/email path; avoid “ATTACK” language |
| **Session timeout** | “For your security, sign in again” + preserve intent (deep link) |
| **Device logout** | Settings: list sessions (Future); “Log out of this device” clear |
| **Logout** | Confirm only if needed; default single-device |
| **Future MFA** | Optional step-up; backup codes education screen; never block core without recovery |
| **Biometrics** | Optional convenience unlock; fallback to password always available |
| **Passkeys** | Presented as easier + safer when available |
| **Account lock** | Temporary; countdown or support; never silent |

---

# 9. Accessibility

| Area | Auth-specific rule |
|------|-------------------|
| **Touch targets** | ≥ 44×44 (prefer 48); full-width Primary OK |
| **Dynamic Type** | Forms reflow; CTAs not clipped; avoid fixed one-screen-only layouts |
| **Contrast** | F1 text/onPrimary pairs; errors not color-only (icon + text) |
| **Screen reader** | Labels on all fields; errors linked via `accessibilityDescribedBy` pattern; password toggle named; loading “Signing in” |
| **Keyboard / focus** | Logical order: identity → secret → primary → secondary links; focus moves to first error on fail |
| **Reduced motion** | Instant or opacity transitions only |
| **Autofill** | Support password managers / OTP autofill |
| **Language** | Clear headings as accessibility titles |

---

# 10. User Testing Scenarios

| # | Scenario | Pass criteria |
|---|----------|---------------|
| 1 | **First-time gamer** | Creates account in **under 2 minutes** active time (excluding waiting on email); understands verification next step |
| 2 | **Returning player** | Reaches **Home in under 15 seconds** with valid session on healthy network |
| 3 | **Forgot password** | Completes reset without dead end; always knows next step |
| 4 | **Offline** | Understands cause; can retry; no data-loss panic on filled forms |
| 5 | **Verification** | Always knows what to do next (check email, resend, continue) |

Internal dogfood must run these before Auth UI implementation sign-off.

---

# 11. Authentication Audit Checklist

- [ ] Feels premium (Story Ember / culture home — not generic SaaS login)  
- [ ] Low friction (minimal fields; skip onboarding allowed)  
- [ ] High trust (calm security; anti-enumeration; clear verification)  
- [ ] Fast completion (Scenarios 1–2 targets)  
- [ ] Gaming identity framing (copy + flow, not feature dump)  
- [ ] Accessibility (§9)  
- [ ] Errors explain · recover · continue  
- [ ] Validation aligns with `AUTH_API.yaml`  
- [ ] Composer/social/passkey/MFA readiness without cluttering MVP  
- [ ] Soft gate returns to deep link target  
- [ ] Logout → Guest cleanly  
- [ ] No Home/Feed/Game scope creep in this freeze  
- [ ] F1 motion & component tokens only when built  
- [ ] F2.1 stack placement respected  
- [ ] Optional connect step never blocks entry (§12) · Discord is a login method only  

---

# 12. MVP Final Integration Amendment — Optional Connect Step & Discord Login

**Amendment:** MVP Final Integration Amendment (July 2026). Entry philosophy (§1–§2), flows and screen inventory are unchanged in intent; this section adds two **optional** MVP elements.

## 12.1 Optional connect step (onboarding)

| Rule |
|------|
| Onboarding readiness may include one optional connect step offering Steam Sync and Discord linking |
| The step is skippable and deferrable — the player reaches Home either way |
| Skipping is never framed as an incomplete account or a failure |
| Import may be deferred to Library later without repeating onboarding (F2.6 · F2.21 §20.1) |
| No Premium wall · no tour theater · no additional onboarding stages per provider |

## 12.2 Discord as an optional login method

| Rule |
|------|
| Discord joins the optional provider set (F2.2.1) as an identity provider only |
| Email/password entry remains fully sufficient — no provider is required |
| Linking or unlinking happens in Settings → Connected Accounts, never as a hidden side-effect of login |
| Discord grants identity convenience only: no chat, no presence, no community import (F2.21 §20.2) |
| A refused connection is never re-prompted (F2.20 honesty) |

## 12.3 Architecture references

| Reference | Contains |
|-----------|----------|
| F5.3 | Onboarding Connect Accounts screen · Account Link task · Connected Accounts |
| F5.4 §42.1.1 | Account-link behavior contract |
| F2.21 §20 | Guest boundaries for Steam and Discord |

---

## Microinteractions (behavioral freeze)

| Interaction | Behavior |
|-------------|----------|
| Button press | F1 `motion.press` |
| Loading | Button loading + disabled form |
| Validation | Inline message appear 180–200ms fade |
| Success | Short confirm then navigate (`motion.page`) |
| Failure | Shake **forbidden**; prefer field highlight + message |
| Transitions | Auth stack push/pop F1 page; sheets for legal |

No bounce. No flashy animations.

---

## Design Gates (executed)

| Gate | Result | Notes |
|------|--------|-------|
| **Product Gate** | **PASS** | Identity entry; six-pillar onboarding taste; no Premium wall; API-aligned |
| **UX Gate** | **PASS** | Flows complete; soft gate; skip; anti-dead-end errors; composer-not-in-auth |
| **Accessibility Gate** | **PASS** | Targets, SR, focus, reduced motion, autofill called out |
| **Developer Handoff Gate** | **PASS** | Screens, validation, states, deep links (`auth/*`) mapped; API reference explicit |
| **Brand Recognition Gate** | **PASS** | Philosophy = gaming home; onboarding = taste not tutorial; calm security |

All gates **PASS** → freeze allowed.

---

## Final gate

### APPROVED

Sprint F2.2 Authentication Experience is **LOCKED**.

Do **not** continue to Sprint F2.3 in this output.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | AuthGate, stacks, deep links |
| [SPRINT_F2_2_1_AUTH_POLISH.md](./SPRINT_F2_2_1_AUTH_POLISH.md) | Identity polish amendment (LOCKED) |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | Components / motion |
| [AUTH_API.yaml](../08_API/AUTH_API.yaml) | Server validation contract |
| [SCREEN_SPECIFICATIONS.md](./SCREEN_SPECIFICATIONS.md) | Must align AUTH screens to this freeze |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Auth philosophy, flows, screens, validation, errors, security UX, onboarding, gates |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §12 added: optional skippable connect step in onboarding (Steam · Discord) and Discord as an optional login method; entry philosophy · flows · gates unchanged |
