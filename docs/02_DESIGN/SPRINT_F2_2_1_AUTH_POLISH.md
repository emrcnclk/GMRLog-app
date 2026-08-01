# GMRLOG — Sprint F2.2.1: Authentication Experience Polish Amendment

**Document:** `docs/02_DESIGN/SPRINT_F2_2_1_AUTH_POLISH.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.2.1 (Architecture refinement only)  
**Last Updated:** July 2026  
**Owner:** Lead UX / Authentication Experience  
**Classification:** Amendment to Authentication SSOT (emotional & identity alignment)

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md`](./SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md) — **base Auth freeze (unchanged structure)** |
| 6 | **This amendment** — emotional positioning, copy direction, onboarding philosophy, guest depth, provider reservation, completion moment |

### Amendment rules

- **F2.2 remains the authority** for flows, screens, validation, errors, security UX mechanics, and a11y requirements.
- This document **refines meaning and emotional alignment** with Master / Story Ember.
- On conflict of *emotion / positioning / guest depth / onboarding intent*: **this amendment wins**.
- On conflict of *mechanics / API / navigation / stacks*: **F2.2 + F2.1 win** — this amendment must not override them.
- **Do not** redesign screens, create UI, modify navigation, touch React Native, change API, or alter authentication logic.

**Out of scope:** Visual design, motion specs, Figma, implementation, Sprint F2.3+.

---

## Objective

Authentication must not feel like a **premium SaaS login**.

GMRLOG is the **Gaming Identity Platform** — the culture OS front door (Master).

Users should feel:

> “I’m entering my gaming world.”

Not:

> “I’m logging into an account.”

Emotional references (behaviors only — **never copy UI**): Steam · X · Letterboxd · Discord · Reddit.

**Constraints:** Subtle. No gimmicks. No gaming clichés. No RGB. No esports energy. Story Ember quiet premium only.

---

# 1. Authentication Brand Positioning

Freeze the emotional role of each auth moment:

| Moment | Emotional role |
|--------|----------------|
| **Login** | Return to your gaming identity. |
| **Register** | Start your gaming identity. |
| **Verification** | Protect your gaming identity. |
| **Onboarding** | Discover your gaming taste. |
| **Recovery** | Recover your gaming identity. |

Every authentication surface reinforces **belonging**, not account management.

### SaaS → Identity translation

| Avoid framing | Prefer framing |
|---------------|----------------|
| Account / workspace | Gaming identity / world |
| Sign in to continue | Return to your journey |
| Create account | Start your identity |
| Verify email (cold) | Protect your identity |
| Set preferences | Discover your taste |
| Reset password (cold) | Recover your identity |

Mechanics from F2.2 (fields, tokens, resend) stay identical; **framing** changes.

---

# 2. Copy Direction

**Do not** write final UI copy. Localization comes later.

### Principles

1. **Belonging first** — journey, identity, world, taste.  
2. **Calm confidence** — warm, minimal; never hype or grind language.  
3. **One idea per screen** — match the positioning table above.  
4. **Human recovery** — F2.2 error philosophy unchanged; tone stays protective, not bureaucratic.  
5. **No SaaS jargon** as primary labels when an identity phrase exists.  
6. **Inspiration ≠ mandate** — examples below guide voice; final strings are a later localization pass.

### Directional examples (inspiration only)

| Avoid (SaaS-default) | Emotional direction |
|----------------------|---------------------|
| Login | Continue Your Journey / Return to Your World |
| Create Account | Start Your Gaming Identity |
| Forgot Password | Recover Your Identity |
| Verify your email | Protect Your Gaming Identity |
| Skip onboarding | Continue — discover taste later |
| Submit | Enter / Continue / Begin |

Secondary/legal strings (Terms, Privacy) remain clear and plain.

**Forbidden copy energy:** rank, grind, rewards, domination, “level up your account,” neon slang, esports banter.

---

# 3. Onboarding Refinement

### Philosophy shift (amends F2.2 onboarding goal)

| F2.2 (base) | F2.2.1 (amendment) |
|-------------|---------------------|
| Goal described as personalization | **Goal = identity discovery** |
| Collect preferences for systems | Help the player **recognize who they are as a gamer** |

Personalization may still *result* from answers (Discovery ranking later). The **user-facing purpose** is identity discovery, not “feed settings.”

Still **not a tutorial**. Still skippable with dignity (F2.2 skip rules stand).

### Recommended sequence (architecture only)

```
Favorite Genres
  → Favorite Platforms
  → Gaming Style
  → Favorite Games
  → (Optional) Import Gaming Libraries
  → Finish (completion moment §6)
```

### Gaming Style (identity archetypes — labels directional)

Examples of style chips (not exhaustive, not API enums):

- Story Focused  
- Competitive  
- Collector  
- Achievement Hunter  
- Indie Explorer  
- Social Player  
- Retro Fan  
- Speedrunner  

Multi-select allowed; none required if user skips.

### Favorite Games

Light identity signal (search/pick a few). No library sync required at this step.

### Import Gaming Libraries (optional)

Future-ready step only. **No API. No implementation.** Soft “connect later in Settings” if skipped.

### Completion criteria (refined)

- F2.2 mechanical completion (skip or any progress → complete) **remains valid**.  
- Emotional success = user reaches **Finish / completion moment** (§6), whether via answers or skip.  
- Taste/style editable later in Profile (Master Identity pillar).

---

# 4. Guest Experience

### Problem

Guest mode must not feel like a shallow login wall.

### Intended architecture (freeze)

Guest users should **understand GMRLOG before creating an account**. Never force registration immediately.

```
Public Home Preview
  → Game Pages
  → Reviews
  → Collections
  → Profiles
  → Attempt interaction (follow, like, log, comment, save, compose, …)
  → Soft Authentication Gate
  → Auth (F2.2) → return to queued intent
```

### Rules

| Rule | Freeze |
|------|--------|
| Browse-first | Public content readable without account |
| Soft gate | Gate on **interaction**, not on first open |
| Preview honesty | Preview is clearly limited where needed; never fake logged-in powers |
| Framing | Gate copy uses identity positioning (“Save this in your gaming world”) — not “Please register” |
| Navigation | **No tab model change** (F2.1). Guest uses same destinations where public; AuthGate only when required |
| Deep links | F2.1 soft gate + queued target unchanged |

This **deepens** F2.1/F2.2 guest soft-gate intent; it does not add bottom tabs or rewrite MainApp.

---

# 5. Future Identity Providers

Architecture reservation only. **No implementation. No API changes.**

| Provider | Status |
|----------|--------|
| Steam | Reserved |
| Discord | Reserved |
| Google | Reserved |
| Apple | Reserved |
| Xbox | Reserved |
| PlayStation | Reserved |
| Nintendo | Reserved |
| Epic Games | Reserved |
| Future providers | Extension slot |

### UX reservation rules

- Login/Register retain **provider slots** (F2.2 readiness).  
- Order and visibility are product decisions at ship time; architecture must not assume only Google/Apple.  
- Platform providers (Steam/Xbox/PlayStation/Nintendo/Epic) reinforce **gaming identity**, not generic SaaS OAuth.  
- Account linking remains Settings (future) — not forced at Register.

---

# 6. Onboarding Completion Moment

Freeze a final **emotional milestone** after onboarding (answered or skipped into Finish).

| Element | Freeze |
|---------|--------|
| **Purpose** | Celebrate identity creation calmly — belonging, not rewards |
| **Directional message** | “Your gaming world is ready.” (inspiration; final copy later) |
| **Feeling** | Warm · confident · minimal |
| **Not** | Badges dump, XP, streaks, confetti gimmicks, RGB, rank unlock |
| **Next** | Enter MainApp · Home (F2.1/F2.2) |
| **Visuals / animation** | **Not defined** here — UI/motion sprints only; F1 motion constraints apply when built |

---

# 7. Emotional Design Principles

Authentication communicates:

| Yes | No |
|-----|-----|
| Belonging | Competition |
| Progress (gentle journey) | Power |
| Identity | Rank |
| Memory | Rewards |
| Journey | Grinding |

**Tone:** Calm. Warm. Confident. Minimal. Story Ember.

**References (emotion only):** the wonder of returning to a Steam library, the social pulse of X/Discord, the taste pride of Letterboxd, the community gravity of Reddit — **without copying any UI**.

---

# 8. Consistency Validation

| Document | Alignment |
|----------|-----------|
| **Master** | Culture OS; identity home; six pillars; Story Ember; no clone UI; Creator Economy not gated at auth; Mobile-first unchanged |
| **F1** | No new components required by this amendment; no RGB/glow; motion still no-bounce when UI ships |
| **F2.1** | AuthGate / stacks / deep links / tabs unchanged; guest depth clarified under same graph |
| **F2.2** | Flows, validation (password ≥12, username ≥3), errors, security mechanics, a11y **preserved**; onboarding *goal* and guest *depth* refined; copy *direction* added; providers *expanded reservation*; completion *moment* added |

### Explicit non-contradictions

- Does **not** make Reviews the center.  
- Does **not** add Compose tab or change bottom nav.  
- Does **not** weaken API validation.  
- Does **not** introduce Premium paywall at auth.  
- Does **not** redesign screens or specify pixels.

---

# 9. Amendment summary (what changed vs F2.2)

| Area | Change type |
|------|-------------|
| Brand positioning table | **New** emotional roles |
| Copy direction | **New** principles (no final strings) |
| Onboarding goal | **Refine** → identity discovery |
| Onboarding sequence | **Refine** → + Gaming Style, Favorite Games, optional Import, Finish |
| Guest experience | **Deepen** browse-first public journey |
| Identity providers | **Expand** reserved list |
| Completion moment | **New** calm milestone |
| Flows / API / nav / RN | **Unchanged** |

---

## Final gate

### APPROVED

**Sprint F2.2.1 Authentication Polish LOCKED**

This amendment is part of the **Authentication SSOT** together with F2.2.

Stop. Do **not** continue to Sprint F2.3.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md](./SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md) | Base Auth freeze |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Product & brand SSOT |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | AuthGate / guest soft gate |
| [SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md](./SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md) | Optional platform guests · identity independence |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Identity positioning, copy direction, onboarding discovery, guest depth, providers, completion moment |
