# GMRLOG — Sprint F2.20: Settings, Personalization & User Control Ecosystem

**Document:** `docs/02_DESIGN/SPRINT_F2_20_SETTINGS_PERSONALIZATION.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.20 (Settings, Personalization & User Control Ecosystem — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Personal Agency Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) + [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) |
| 6 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) + [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) |
| 7 | [`SPRINT_F2_6_LIBRARY_COLLECTIONS.md`](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) |
| 8 | [`SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md`](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) |
| 9 | [`SPRINT_F2_10_DISCOVER_SEARCH.md`](./SPRINT_F2_10_DISCOVER_SEARCH.md) |
| 10 | [`SPRINT_F2_11_COMMUNITIES_GUILDS.md`](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) + [`SPRINT_F2_12_CREATOR_PLATFORM.md`](./SPRINT_F2_12_CREATOR_PLATFORM.md) |
| 11 | [`SPRINT_F2_16_PREMIUM_MEMBERSHIP.md`](./SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) |
| 12 | [`SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md`](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) |
| 13 | [`SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md`](./SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) |
| 14 | [`SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md`](./SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md) |
| 15 | **This document** — Settings, Personalization & User Control |

Never contradict previous freezes.

This document **extends** without changing their philosophy:

| Domain | Freeze |
|--------|--------|
| Identity / Digital Home | F2.5 / F2.5.1 |
| Discover | F2.10 |
| Home Feed | F2.3 / F2.3.1 / F2.7 |
| Library | F2.6 |
| Communities | F2.11 |
| Creator Platform | F2.12 |
| Notifications | F2.9 |
| Trust & Safety | F2.17 |
| Accessibility | F2.18 |
| Premium & Membership | F2.16 |
| Intelligence | F2.19 |

**This freeze is constitutional:** misdesigned control surfaces can poison agency, privacy, and trust. Its primary job is to lock:

> **The platform should adapt to people. People should never adapt to the platform.**

---

## Scope

**In scope:** How users control GMRLOG — settings philosophy, personalization boundaries, domain controls, privacy posture, Digital Home ownership, export & ownership philosophy.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| UI |
| Backend |
| APIs |
| Database |
| React Native |
| Settings screens |
| Algorithms |
| Engineering details |
| Technical implementation |
| Sprint F2.20.1+ |

**Placement:** Settings Stack via Profile → Settings (F2.1). Contextual controls may appear on Home · Discover · Notifications · Profile · Library · Communities · Creator — always consistent with Settings as the durable source of truth. **No new bottom tab.** No IA change.

**Gate:** Stop after freeze. Do **not** continue to Sprint F2.20.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Core Philosophy |
| 3 | Settings Philosophy |
| 4 | Personalization Philosophy |
| 5 | Identity Controls |
| 6 | Feed Controls |
| 7 | Discover Controls |
| 8 | Notification Controls |
| 9 | Community Controls |
| 10 | Creator Controls |
| 11 | Library Controls |
| 12 | Privacy Controls |
| 13 | Digital Home Personalization |
| 14 | Export & Ownership Philosophy |
| 15 | Relationship Graph |
| 16 | Future Ready |
| 17 | Emotional Goal |
| 18 | Audit Checklist |

---

# 1. Mission

Controls exist so players can shape a **lifelong Digital Home** without fighting the product.

The player owns their experience.

GMRLOG adapts.

The player does not reshape themselves to fit engagement defaults.

Without control:

| Collapses |
|-----------|
| Agency |
| Privacy meaning |
| Trust in recommendations |
| Calm Digital Home |
| Authentic identity |

---

# 2. Core Philosophy

Immutable laws:

| Law |
|-----|
| The player owns their experience |
| Everything should be optional |
| Everything should be reversible |
| Defaults should be calm |
| Defaults should be respectful |
| Defaults should never manipulate |

## Users decide

| Domain |
|--------|
| Notifications |
| Recommendations |
| Feed density |
| Activity visibility |
| Privacy |
| Personalization |
| Digital Home |
| Discover preferences |

## Never force

| Never force |
|-------------|
| Notifications |
| Recommendations |
| Engagement |
| Social visibility |
| Online presence |
| Activity sharing |

## Absolute bans

| Ban |
|-----|
| Dark patterns |
| Manipulative defaults |
| Hidden settings |
| Irreversible personalization |
| “Recommended because we said so” |

Personalization exists to **reduce friction**.

Never to increase addiction.

Identity remains authentic (F2.5.1 · F2.13).

---

# 3. Settings Philosophy

Settings is the **durable control plane** of GMRLOG.

Not a dumping ground.

Not a guilt surface.

## Principles

| Principle |
|-----------|
| Findable — no buried critical controls |
| Honest — labels match outcomes |
| Reversible — changes can be undone |
| Calm — no urgency theater |
| Consistent — contextual toggles mirror Settings truth |
| Complete enough — agency without overwhelm |

## Structure philosophy (architecture only)

Settings domains inherit from product constitution — not invent new product pillars:

| Domain family | Serves |
|---------------|--------|
| Account & security | Auth · sessions (F2.2) |
| Privacy & safety | F2.17 · F2.8 |
| Notifications | F2.9 |
| Feed & Discover | F2.3 / F2.7 / F2.10 / F2.19 |
| Appearance & accessibility | F2.18 · F1 |
| Identity & Digital Home | F2.5.1 |
| Library | F2.6 |
| Communities | F2.11 |
| Creator | F2.12 |
| Premium / membership | F2.16 (management only) |
| Intelligence assistance | F2.19 intensity / opt-out |

No new player bottom tab for Settings (F2.1).

---

# 4. Personalization Philosophy

Personalization adapts surfaces to the player.

It does not rewrite identity.

| Personalization may | Personalization must not |
|---------------------|--------------------------|
| Reduce friction | Increase addiction |
| Reflect stated preferences | Manufacture taste |
| Soften noise | Force social performance |
| Honor taste signals the player owns | Hide irreversible “optimization” |
| Stay explainable when it affects discovery | Become “because we said so” |

Align F2.19: human agency always wins.  
Align F2.10: taste-first, never popularity theater.  
Align F2.16: personalization depth may expand with Premium tools — **never** create two cultures or sold ranking.

Onboarding taste signals (F2.2) remain editable later — never locked traps.

---

# 5. Identity Controls

Players control how identity is presented and discovered.

| Control intent |
|----------------|
| Profile visibility domains |
| What appears on Identity Shelf / showcase |
| Presence / last-seen posture |
| What activity contributes to public story |
| Edit paths for taste / DNA language over time |

## Rules

| Rule |
|------|
| Identity remains authentic — controls do not invent prestige |
| Premium may expand expression tools — never buy reputation (F2.16 · F2.13) |
| Creator growth remains vertical on the same Profile (F2.5.1 · F2.12) |
| Controls never coerce public performance |

---

# 6. Feed Controls

Home remains culture heartbeat (F2.7) — under player tempo.

| Control intent |
|----------------|
| Feed density / pacing preference |
| Recommendation intensity / mute |
| Hide / not interested continuity |
| Following vs discovery balance preference (within F2.3 mix philosophy) |

## Rules

| Rule |
|------|
| Sparse over endless remains constitutional |
| No dark re-enable of recommendations after refusal (F2.8 kinship) |
| Explainability preserved when recommendations appear (F2.3.1 · F2.19) |
| No engagement-maximizing default density |

---

# 7. Discover Controls

Discover remains an exploration engine (F2.10).

| Control intent |
|----------------|
| Discover preferences / taste emphasis |
| Recommendation and suggestion posture |
| Filter preferences the player owns |
| Hide / not interested where suggestions appear |

## Rules

| Rule |
|------|
| Taste-first remains free and unbuyable |
| Premium may offer better **filters** — never sold better ranking (F2.16) |
| No compulsive infinite recommendation default |
| Mood / intent assistance stays optional (F2.19) |

---

# 8. Notification Controls

Notifications are attention tools — not FOMO engines (F2.9).

| Control intent |
|----------------|
| Category-level notification preferences |
| Quiet periods / calm defaults |
| Channel posture (in-app vs push philosophy) |
| Security / system exceptions only when appropriate |

## Rules

| Rule |
|------|
| Never force notifications for engagement |
| Defaults calm and respectful |
| No streak / urgency theater |
| Mark-all and clear agency remain player-owned |
| Settings is source of truth; no hidden re-subscription patterns |

---

# 9. Community Controls

Communities remain culture hubs (F2.11) — membership is intentional.

| Control intent |
|----------------|
| Join / leave / mute community signals |
| Community notification posture |
| Visibility of community membership where product allows |
| Local community preferences subordinate to platform constitution |

## Rules

| Rule |
|------|
| Community rules cannot override platform Trust (F2.17) |
| Roles and Community Trust remain unbuyable (F2.16 · F2.11) |
| Leaving / muting must not be dark-patterned |
| No forced community visibility for growth metrics |

---

# 10. Creator Controls

Creators control publishing posture — not platform celebrity theater (F2.12).

| Control intent |
|----------------|
| Publishing defaults (drafts, visibility, spoiler posture) |
| Creator notification preferences |
| Series / long-form organization preferences |
| Optional writing assistance intensity (F2.19) — human byline remains |

## Rules

| Rule |
|------|
| Craft before automation |
| Free users retain core culture publishing rights |
| Premium may enhance tools — never caste culture |
| No forced promotional sharing |

---

# 11. Library Controls

Library remains archive — not launcher (F2.6).

| Control intent |
|----------------|
| Shelf / collection visibility |
| Hidden Archive protection |
| Continue Playing / backlog organization preferences |
| Wishlist privacy posture |

## Rules

| Rule |
|------|
| Hidden Archive stays hidden without consent |
| Organization may deepen with Premium tools — culture access stays free |
| No storefront coercion via Library defaults |
| Player owns intentional backlog — not guilt backlog |

---

# 12. Privacy Controls

Privacy is default — not Premium (F2.17 · F2.16).

| Control intent |
|----------------|
| Presence |
| Last Seen |
| Profile visibility |
| Activity visibility |
| Collection visibility |
| Community visibility |
| Block / mute / report / hide continuity (F2.8 · F2.17) |
| Intelligence data posture / opt-out (F2.19) |

## Rules

| Rule |
|------|
| Defaults favor calm and safety |
| Openness is intentional |
| No manipulative “share more to unlock belonging” |
| Explanations must not leak others’ private data |
| Accessibility controls remain available to all (F2.18) |

---

# 13. Digital Home Personalization

Digital Home belongs **entirely** to the player (F2.5.1).

| Personalization may |
|---------------------|
| Themes / atmosphere within brand constitution |
| Module / shelf emphasis the player chooses |
| Memory surfaces the player wants present |
| Premium expansion of capacity / tools (F2.16) |

| Personalization must never |
|----------------------------|
| Sell belonging |
| Rewrite Known For / reputation |
| Force public showcase of private life |
| Become irreversible “optimized home” |
| Turn home into an ad surface |

Digital Home is sanctuary first.

Performance second — and only when the player chooses.

---

# 14. Export & Ownership Philosophy

Players own their gaming memory.

| Ownership intent |
|------------------|
| Export of player-authored journey / biography materials (reserved) |
| Clarity about what is personal data vs platform graph |
| Ability to leave without ritual humiliation |
| Drafts and private archives remain player-controlled |

## Rules

| Rule |
|------|
| Ownership supports legacy (F2.14) — not retention hostage |
| Export/portability reserved without promising engineering here |
| Deletion / account controls align Trust & Auth freezes |
| No irreversible personalization that blocks leaving cleanly |

---

# 15. Relationship Graph

Controls govern **comfort and consent** across the graph.

They do not redefine the graph.

```
Identity / Digital Home
  ↓
Privacy
  ↓
Feed
  ↓
Discover
  ↓
Library
  ↓
Communities
  ↓
Creator
  ↓
Notifications
  ↓
Intelligence (assist only)
  ↓
Trust
```

| Controls may | Controls must not |
|--------------|-------------------|
| Let players set tempo and visibility | Invent a second product philosophy |
| Make assistance optional | Make engagement mandatory |
| Keep Settings as durable truth | Hide critical agency in dark corners |

---

# 16. Future Ready

Reserve architecture for (philosophy only — no implementation):

| Capability |
|------------|
| Richer Settings findability / search within controls |
| Per-surface density presets (calm / standard) |
| Deeper intelligence intensity controls (F2.19) |
| Expanded accessibility personalization (F2.18) |
| Export / yearbook / biography packages (F2.14) |
| Cross-device preference sync posture |
| Transparent “what personalizes my experience” summaries |
| Session / device management expansion (F2.2) |

Architecture only.

---

# 17. Emotional Goal

Controls should feel like:

> “This home bends to how I play.”

Never:

> “I have to fight defaults to be left alone.”

And never:

> “The product knows better than I do who I am.”

---

# 18. Audit Checklist

- [ ] Player owns experience — platform adapts to people  
- [ ] Optional · reversible · calm · respectful defaults  
- [ ] No dark patterns · no manipulative defaults · no hidden settings  
- [ ] No irreversible personalization  
- [ ] No forced notifications · recommendations · engagement · presence · activity sharing  
- [ ] No “recommended because we said so”  
- [ ] Personalization reduces friction — never addiction  
- [ ] Identity authentic · Digital Home fully player-owned  
- [ ] Feed / Discover / Notifications / Community / Creator / Library controls aligned to prior freezes  
- [ ] Privacy by default · not Premium-gated  
- [ ] Export & ownership reserved without retention hostage  
- [ ] Compatible with Identity · Home · Discover · Library · Communities · Creator · Notifications · Trust · Accessibility · Premium · Intelligence  
- [ ] Settings via Profile stack only · no new tab · no UI · backend · APIs · RN · F2.20.1  

---

## Final gate

### APPROVED

**Sprint F2.20 — Settings, Personalization & User Control Ecosystem LOCKED.**

Stop.

Do **NOT** continue to Sprint F2.20.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | Settings Stack · Profile entry · deep links |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Digital Home ownership |
| [SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) | Notification agency · anti-FOMO |
| [SPRINT_F2_7_HOME_FEED.md](./SPRINT_F2_7_HOME_FEED.md) | Feed tempo · recommendation vocabulary |
| [SPRINT_F2_10_DISCOVER_SEARCH.md](./SPRINT_F2_10_DISCOVER_SEARCH.md) | Discover preferences · taste-first |
| [SPRINT_F2_6_LIBRARY_COLLECTIONS.md](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) | Archive · Hidden Archive |
| [SPRINT_F2_11_COMMUNITIES_GUILDS.md](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) | Community membership agency |
| [SPRINT_F2_12_CREATOR_PLATFORM.md](./SPRINT_F2_12_CREATOR_PLATFORM.md) | Creator publishing posture |
| [SPRINT_F2_16_PREMIUM_MEMBERSHIP.md](./SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) | Tools vs bought culture |
| [SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) | Privacy default · user protection |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](./SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Accessibility controls in Settings |
| [SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md](./SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md) | Intelligence opt-out · agency |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Culture-first product philosophy |
| [SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md](./SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md) | Optional guest links · anti-lock-in |
| [SPRINT_F2_23_ANALYTICS_INSIGHTS_PRODUCT_INTELLIGENCE.md](./SPRINT_F2_23_ANALYTICS_INSIGHTS_PRODUCT_INTELLIGENCE.md) | Insight visibility · analytics belong to users |
| [SPRINT_F2_27_SECURITY_PRIVACY_DATA_GOVERNANCE.md](./SPRINT_F2_27_SECURITY_PRIVACY_DATA_GOVERNANCE.md) | Privacy controls · consent · data ownership |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Personal Agency constitution: calm reversible controls, domain control map, Digital Home ownership, export philosophy, graph unchanged |
