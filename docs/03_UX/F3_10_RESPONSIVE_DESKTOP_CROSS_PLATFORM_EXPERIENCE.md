# GMRLOG — Sprint F3.10: Responsive, Desktop & Cross-Platform Experience

**Document:** `docs/03_UX/F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F3.10 (UX Responsive, Desktop & Cross-Platform Experience — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UX Cross-Platform Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Constitution — especially F2.1 IA · F2.18 Accessibility · F2.29 |
| 5 | F3.1–F3.9 |
| 6 | **This document** — Responsive, Desktop & Cross-Platform Experience |

Never contradict previous freezes.

Never modify F1 · F2 · F3.1–F3.9.

This sprint answers:

> “How should GMRLOG feel across every device?”

Not:

> “How should desktop UI look?”

| Does | Does not |
|------|----------|
| Define platform · responsive · multi-device consistency philosophy | Design desktop UI · specify breakpoints · CSS · RN · web code · components |
| Define continuity across devices & sessions | Invent a second product for large screens |
| Affirm Master Mobile-first / Desktop-ready | Change IA · terminology · interaction law per platform |

---

## Scope

**In scope:** Mobile-first · desktop adaptation · tablet · foldables · landscape · keyboard & mouse philosophy · touch vs pointer · responsive hierarchy · cross-device continuity · multi-session continuity · platform expectations · accessibility consistency · anti-fragmentation · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| UI layouts |
| Components |
| CSS |
| React Native |
| Web code |
| Engineering |
| Breakpoints |
| Platform implementation |
| Sprint F3.10.1+ |

**Gate:** Stop after freeze. Do **not** continue to Sprint F3.10.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Mobile-first Philosophy |
| 3 | Desktop Philosophy |
| 4 | Tablet Experience |
| 5 | Responsive Layout Philosophy |
| 6 | Input Method Philosophy |
| 7 | Cross-Device Continuity |
| 8 | Session Continuity |
| 9 | Platform Expectations |
| 10 | Accessibility Across Devices |
| 11 | Consistency Rules |
| 12 | Anti-Fragmentation |
| 13 | Future Ready |
| 14 | Emotional Goal |
| 15 | Audit Checklist |

---

# 1. Mission

Define how GMRLOG remains **one product** across every device.

Players should never think:

> “This is the mobile version.”

or:

> “This is the desktop version.”

Instead:

> “This is GMRLOG.”

Meaning never changes.

Only available space changes.

Align Master: Mobile-first, Desktop-ready — layout adapts, meaning does not.

---

# 2. Mobile-first Philosophy

**Mobile remains the canonical experience.**

| Law |
|-----|
| Design intent starts from the phone-sized Digital Home |
| Primary navigation, identity, and culture jobs are proven on mobile first (F2.1 · F3.2) |
| Desktop inherits that meaning — it does not redefine it |
| Touch-first affordances remain honest even when pointers exist |

Canonical ≠ “mobile-only features.”

Canonical = **source of product truth**.

---

# 3. Desktop Philosophy

Desktop is an **expansion**.

Never another product.

| Desktop may | Desktop must never |
|-------------|--------------------|
| Add breathing room | Add a different philosophy |
| Show more information density when calm (F3.3) | Show different information that changes meaning |
| Expand reading corridors comfortably | Invent desktop-only culture pillars |
| Support keyboard/mouse excellence | Make critical paths pointer-only |

More space = more breath.

Not more complexity.

Not a second IA.

---

# 4. Tablet Experience

Tablet sits between mobile and desktop without becoming a third product.

| Tablet should | Must never |
|---------------|------------|
| Preserve five-root mental model | Invent tablet-only navigation religion |
| Use space for comfort · not novelty | Split into “app mode” vs “site mode” identities |
| Respect touch primacy with optional pointer | Gesture-only critical actions (F3.1 · F3.4) |

Foldables / unusual aspect ratios: same constitution — orientation may adapt; meaning may not.

Landscape: same rooms · same jobs · no landscape-only product.

---

# 5. Responsive Layout Philosophy

Responsive behavior expands **available space**.

It does not rewrite hierarchy law (F3.3) or room jobs (F3.2 · F3.7 · F3.8 · F3.9).

| Responsive may | Must never |
|----------------|------------|
| Reflow columns · widen reading measure | Change what is primary vs secondary in meaning |
| Reveal progressive tools earlier when space allows | Hide mobile-critical actions on large screens |
| Preserve one starting point per screen | Create multi-hero desktop dashboards |
| Keep magazine Home rhythm spirit | Turn Home into a dense ops console |

Navigation · Identity · Relationships · Communities · Game pages remain **identical in philosophy**.

---

# 6. Input Method Philosophy

First-class citizens (F2.18 · F3.4):

| Input |
|-------|
| Touch |
| Mouse |
| Keyboard |
| Trackpad |
| Controller (future) |

| Law |
|-----|
| No interaction should only exist on one input type for critical paths |
| Hover may enhance — never solely disclose critical affordances |
| Keyboard focus paths complete and honest |
| Touch targets remain usable; pointer precision never becomes exclusion |
| Controller reserved without becoming a console-only fork |

Touch vs pointer: different physics · same intentions · same outcomes.

---

# 7. Cross-Device Continuity

A player may:

| Continuity |
|------------|
| Open on mobile |
| Continue on desktop |
| Return on tablet |

…without relearning anything.

| Continuity includes |
|---------------------|
| Same terminology |
| Same navigation map |
| Same identity model |
| Same interaction ethics (F3.4) |
| Same motion ethics when motion is present (F3.5) |
| Same Trust / privacy / agency controls (F2.17 · F2.20) |

Spatial object continuity (games · profiles) remains recognizable across form factors (F3.5 kinship).

---

# 8. Session Continuity

Multi-session continuity is dignity — not lock-in theater.

| Session continuity may | Must never |
|------------------------|------------|
| Preserve place · drafts · preferences per agency | Force re-onboarding per device |
| Respect account integrity (F2.2 · F2.27) | Hostage sessions for engagement |
| Allow calm device switching | Punish multi-device use |

Where state sync exists later, philosophy: player-owned continuity · not surveillance stitching (F2.27).

---

# 9. Platform Expectations

| Expectation | Meaning |
|-------------|---------|
| Web / native shells | Same GMRLOG — not divergent brands |
| OS conventions | May borrow behaviors — never borrow identity (F2.29) |
| Notifications / share sheets | Calm · optional · non-FOMO (F2.9 · F3.9) |
| External guests | Still guests across platforms (F2.21) |

Platform polish is hospitality.

Platform forks are fragmentation.

---

# 10. Accessibility Across Devices

Accessibility parity across devices (F2.18 · F3.1–F3.9):

| Must preserve the same meaning |
|--------------------------------|
| Reduce Motion |
| Keyboard navigation |
| Screen readers |
| Large text |
| High contrast |

| Law |
|-----|
| A11y is not “mobile-only” or “desktop-only” |
| Desktop density never voids cognitive calm |
| Meaning of states (loading · error · empty) identical across form factors (F3.6) |

---

# 11. Consistency Rules

| Rule |
|------|
| Same IA across devices (F2.1) |
| Same terminology |
| Same navigation philosophy |
| Same identity model (F3.7) |
| Same interaction philosophy (F3.4) |
| Same accessibility philosophy |
| Same Home / Discover / Game / Social emotional jobs (F3.8 · F3.9) |
| Desktop breathing room ≠ desktop redesign of meaning |

Players should feel familiarity immediately — not a tutorial for “the other app.”

---

# 12. Anti-Fragmentation

Explicit bans:

| Ban |
|-----|
| Desktop-only features that change culture access |
| Mobile-only navigation that desktop replaces with another map |
| Different IA per platform |
| Different terminology |
| Different interaction logic |
| Different product philosophy |
| Responsive redesign that changes meaning |
| Separate design language per device |
| “Desktop Pro” caste vs mobile core (F2.16 kinship) |
| Controller/web/native meaning forks |

If a large-screen idea requires a second GMRLOG, it is illegitimate.

---

# 13. Future Ready

Reserve architecture only:

| Capability |
|------------|
| Foldable / multi-window continuity philosophy |
| Controller-first play-adjacent browsing without IA fork |
| Multi-monitor desktop breath without dashboard capture |
| Cross-device draft/journey continuity under privacy law |
| Platform shell guidelines that obey one constitution |

No breakpoints · no CSS · no implementation.

---

# 14. Emotional Goal

Players should feel:

> “GMRLOG feels familiar no matter where I open it.”

Never:

> “I need to learn this platform again.”

Never:

> “The desktop app feels like another product.”

---

# 15. Audit Checklist

- [ ] Mobile-first preserved · desktop expands rather than changes  
- [ ] Same IA · terminology · navigation · identity · interaction · accessibility across devices  
- [ ] More space = breath · not different meaning or complexity  
- [ ] Input parity · no critical single-input-only paths  
- [ ] Cross-device & session continuity without relearning  
- [ ] Anti-fragmentation bans explicit  
- [ ] Compatible with F1 · F2 · F3.1–F3.9  
- [ ] No implementation · breakpoints · UI · components · RN/Web code · F3.10.1  

---

## Final gate

### APPROVED

**Sprint F3.10 — Responsive, Desktop & Cross-Platform Experience LOCKED.**

Stop.

Do **NOT** continue to Sprint F3.10.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Mobile-first / Desktop-ready |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | One IA across form factors |
| [F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md](./F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) | Same room mental model |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](./F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) | Hierarchy preserved when space expands |
| [F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md](./F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) | Input / hover / focus parity |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | A11y parity · multi-input |
| [F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) | One calm home feel |
| [NAVIGATION_SPECIFICATION.md](./NAVIGATION_SPECIFICATION.md) | Subordinate multi-device nav detail |
| [F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md](./F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md) | Same terminology · calm voice across devices |
| [F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md](../04_UI/F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md) | **LOCKED** UI responsive constitution (F4.11) |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Cross-platform constitution: mobile canonical; desktop expands meaning-unchanged; input/a11y parity; anti-fragmentation bans |
