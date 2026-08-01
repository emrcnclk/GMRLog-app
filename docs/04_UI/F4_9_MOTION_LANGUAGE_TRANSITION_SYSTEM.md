# GMRLOG — Sprint F4.9: Motion Language & Transition System

**Document:** `docs/04_UI/F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F4.9 (Motion Language & Transition System — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UI Motion Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution ([`SPRINT_F2_29`](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) closes F2) |
| 5 | Entire F3 UX Constitution (F3.1–F3.12) — especially [`F3_5_MOTION_ANIMATION_PHILOSOPHY.md`](../03_UX/F3_5_MOTION_ANIMATION_PHILOSOPHY.md) |
| 6 | [`F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md`](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) |
| 7 | [`F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md`](./F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md) |
| 8 | [`F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md`](./F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md) |
| 9 | [`F4_4_GRID_LAYOUT_SPACING_SYSTEM.md`](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md) |
| 10 | [`F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md`](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) |
| 11 | [`F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md`](./F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md) |
| 12 | [`F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md`](./F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md) |
| 13 | [`F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md`](./F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) |
| 14 | **This document** — Motion Language & Transition System |

Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.1–F4.8.

This sprint answers:

> “How should movement communicate meaning inside GMRLOG?”

rather than:

> “How long should animations last?”

| Does | Does not |
|------|----------|
| Define motion · transition · continuity · hierarchy · interruptibility philosophy | Specify durations · ms · easing · bezier · springs |
| Prepare later motion tokens / guidelines under F3.5 · this law | Implement RN · Framer · Reanimated · CSS · Figma · code |

| Layer | Defines |
|-------|---------|
| F3.5 | Motion *experience* philosophy (UX constitution) |
| F4.5 | Physical digital environment · elevation meaning |
| F4.8 | How components exist / compose / change state |
| **F4.9** | How **movement** carries meaning across that system |

F3.5 remains the UX motion constitution.  
F4.9 binds motion to the **UI Design System language** — without values.

Subordinate `MOTION_GUIDELINES.md` and later motion tokens must obey **F3.5 + this document**. On conflict, **F4.9 + F4.8–F4.1 + F3.5 + F2 + Master** win.

**Gate:** Stop after freeze. Do **not** continue to Sprint F4.10.

---

## Scope

**In scope:** Motion philosophy · transition philosophy · navigation transitions · context / page changes · modal · bottom sheet · shared-element philosophy · loading transitions · state transitions · interruptibility · motion hierarchy · consistency · spatial continuity · perceived performance · accessibility · reduced motion · Digital Home continuity · anti-manipulation · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Animation values · milliseconds · durations |
| Bezier curves · easing recipes · spring values |
| Tokens · libraries · engineering · code |
| Figma · component motion specs |
| Sprint F4.9.1+ · F4.10 |

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Motion Philosophy |
| 3 | Movement Before Decoration |
| 4 | Transition Philosophy |
| 5 | Spatial Continuity |
| 6 | Motion Hierarchy |
| 7 | Navigation Motion |
| 8 | Modal & Overlay Motion |
| 9 | Loading Philosophy |
| 10 | State Change Philosophy |
| 11 | Interruptibility |
| 12 | Shared Element Philosophy |
| 13 | Perceived Performance |
| 14 | Digital Home Continuity |
| 15 | Accessibility Relationship |
| 16 | Reduced Motion Philosophy |
| 17 | Consistency Rules |
| 18 | Anti-Manipulation |
| 19 | Future Ready |
| 20 | Emotional Goal |
| 21 | Audit Checklist |

---

# 1. Mission

Define how movement communicates meaning inside GMRLOG **before** any timing, curve, or implementation is chosen.

Motion exists to:

| Exist to |
|----------|
| Explain what changed |
| Reassure during uncertainty |
| Orient — where from · where to |
| Preserve place |
| Support calm premium craft |

Motion never exists to entertain by itself.

Motion never exists to increase engagement.

Align F3.5: motion supports understanding — F4.9 makes that the **UI system language** for transitions.

---

# 2. Motion Philosophy

Movement communicates meaning.

Never decoration.

| Always | Never |
|--------|-------|
| Explain | Entertain |
| Orient | Distract |
| Reassure | Startle |
| Preserve continuity | Fragment place |
| Express confidence | Express excitement |

Motion should feel:

| Feel |
|------|
| Calm |
| Intentional |
| Invisible when successful |
| Premium through restraint |

If players notice the animation more than the meaning, the motion failed.

---

# 3. Movement Before Decoration

Every motion must answer:

> Why does this move?

Not:

> Can we add motion here?

| Law |
|-----|
| No motion without a meaning job |
| Beauty is a consequence of clarity |
| Idle decorative movement is unconstitutional |
| More motion ≠ more premium |

Align F4.1: clarify > decorate · F4.5: depth is structure not spectacle.

---

# 4. Transition Philosophy

Transitions connect **contexts**.

They must help players understand:

| Understand |
|------------|
| Where they came from |
| Where they are going |
| What changed |

| Always | Never |
|--------|-------|
| Bridge meaning | Hard-cut without cause when continuity is needed |
| Match the type of change | Use one theatrical transition for all changes |
| Remain interruptible (§11) | Trap players in choreography |

Transition type follows change type — not fashion.

---

# 5. Spatial Continuity

Space should feel continuous.

| Law |
|-----|
| Rooms of Digital Home remain one place (F4.5 · F4.1) |
| Motion preserves spatial relationships when entering / leaving layers |
| Chrome should not teleport content without orientation |
| Back should feel like return — not random reset |

Spatial continuity is orientation insurance.

---

# 6. Motion Hierarchy

Meaning determines motion emphasis.

Never the reverse.

| Priority (conceptual) |
|-----------------------|
| 1 · Changes that affect place / navigation |
| 2 · Changes that affect focus (overlays) |
| 3 · Changes that affect object state |
| 4 · Ambient / peripheral acknowledgment |

| Rule |
|------|
| Primary meaning receives clearer continuity |
| Peripheral chrome stays quieter |
| Feedback motion must not outrank content change |
| Hierarchy follows F3.3 · F4.4 · F4.5 · F4.8 |

---

# 7. Navigation Motion

Navigation moves between **places**.

| Law |
|-----|
| Nav motion orients — never sells |
| Forward / back relationships remain learnable |
| Tab / primary destination changes preserve home continuity |
| Nested navigation must not erase parent orientation (F3.2 · F4.8 Nav philosophy) |
| Navigation motion must never feel like a commercial cut |

---

# 8. Modal & Overlay Motion

Overlays are temporary focus (F4.5 · F4.8 Overlay family).

| Law |
|-----|
| Entering an overlay should feel like focus gained — not a new app |
| Leaving should restore the previous place intact |
| Bottom sheets · dialogs · menus share continuity law with distinct later specs |
| Overlay motion must remain dismissible in meaning — not only in code |
| Promotional or permanent overlay theater is banned (§18) |

Elevation meaning (structure not power) binds overlay motion.

---

# 9. Loading Philosophy

Loading motion protects trust during uncertainty (F4.8 §16 · F3.6).

| Law |
|-----|
| Structured waiting preferred over spectacle |
| Preserve layout rhythm when possible (F4.4) |
| Never fake completion |
| Never use looping motion as engagement bait |
| Long waits need honest progress language — not hypnotic chrome |

Loading motion reassures — it does not perform.

---

# 10. State Change Philosophy

State changes (F4.8 Part E) may move — only to clarify condition.

| Law |
|-----|
| Resting ↔ focus ↔ pressed ↔ selected: acknowledge, do not celebrate |
| Error / success / disabled: communicate condition · not drama |
| Selection motion must not trap or coerce |
| State motion must remain compatible with reduced motion (§16) |
| Same state class → same motion meaning across families |

---

# 11. Interruptibility

Players own time.

| Law |
|-----|
| Motion must not imprison interaction |
| Incoming input may interrupt non-critical choreography |
| Critical safety / confirmation moments may complete meaning — still without spectacle |
| Stuck animations are defects of philosophy as much as engineering |

Interruptibility is agency (F2.20 kinship).

---

# 12. Shared Element Philosophy

Shared elements (conceptual continuity of an object across contexts) exist to preserve identity of meaning.

| Law |
|-----|
| Shared continuity explains “this is the same object” |
| Never use shared-element theater for unrelated objects |
| Never force shared motion when it confuses hierarchy |
| Shared continuity is optional clarity — not a brand gimmick |

---

# 13. Perceived Performance

Motion may improve perceived responsiveness.

| Law |
|-----|
| Acknowledge input promptly in meaning |
| Do not delay outcomes with decorative preambles |
| Prefer honest progress over fake speed illusions that break trust |
| Perceived performance never excuses manipulation |

---

# 14. Digital Home Continuity

The entire product should feel like **one continuous place**.

Players should feel:

> “I moved within my home.”

Never:

> “A new product loaded with a show.”

| Law |
|-----|
| Home · Discover · Library · Profile · Game · Community share one motion grammar |
| Room changes adapt — grammar does not fork |
| Continuity > novelty |

---

# 15. Accessibility Relationship

Compatible with F2.18 · F3 · F3.5 · F4.7 · F4.8.

| Law |
|-----|
| Meaning must never depend on motion alone |
| Motion supports · labels · hierarchy · structure carry meaning |
| Focus visibility and orientation remain first-class |
| Vestibular / sensitivity concerns are constitutional — not optional polish |

---

# 16. Reduced Motion Philosophy

Reduced motion is a first-class mode of the language — not a broken fallback.

| Law |
|-----|
| Essential meaning must survive with minimal or no motion |
| Instantaneous clarity > decorative continuity when reduced |
| Do not smuggle engagement motion into reduced paths |
| Cross-platform reduced-motion respect is mandatory later under F2.18 |

Quiet is valid premium.

---

# 17. Consistency Rules

| Rule |
|------|
| Same change type → same motion meaning |
| Same overlay class → same enter/exit philosophy |
| Same state class → same motion acknowledgment class |
| Navigation back feels like return everywhere |
| Motion hierarchy follows F3.3 · F4.4 · F4.5 · F4.8 |
| No screen invents a private motion dialect |

Inconsistent motion is design debt (F3.12).

---

# 18. Anti-Manipulation

Explicit bans:

| Banned |
|--------|
| Reward explosions |
| Attention-grabbing animations |
| Casino motion |
| Infinite motion |
| Idle decorative movement |
| Aggressive notification animation |
| Fake urgency |
| Dopamine loops |
| Motion whose primary purpose is engagement |
| Fake progress / loading theater |
| Success celebrations that hijack into upsell |
| Motion that blocks exit / dismiss to coerce |

If motion primarily increases engagement rather than understanding, orientation, or trust, it is unconstitutional.

Align F2.22 · F2.29 · F3.5 · F3.12 · F4.1–F4.8.

---

# 19. Future Ready

Reserve architecture only (no values · no implementation):

| Reserved |
|----------|
| Motion tokens |
| Transition catalogs by change type |
| Shared-element patterns |
| Reduced-motion variants |
| Platform motion adapters |
| Motion debt register |

F4.9 defines the grammar.

Later guidelines write the timing sentences — under this law and F3.5.

---

# 20. Emotional Goal

Players should feel:

> “I always know where I am — and what just changed.”

Never:

> “The interface is putting on a show.”

Never:

> “Motion is trying to keep me hooked.”

---

# 21. Audit Checklist

- [ ] Answers how movement communicates meaning  
- [ ] Movement before decoration  
- [ ] Transitions orient (from · to · what changed)  
- [ ] Spatial · Digital Home continuity protected  
- [ ] Motion hierarchy defined  
- [ ] Navigation · overlay · loading · state philosophies locked  
- [ ] Interruptibility protected  
- [ ] Shared-element philosophy restrained  
- [ ] Perceived performance without fake speed tricks  
- [ ] Accessibility · reduced motion acknowledged  
- [ ] Anti-manipulation explicit (explosions · casino · dopamine · engagement motion)  
- [ ] Compatible with F1 · F2 · F3 (esp. F3.5) · F4.1–F4.8  
- [ ] No ms · durations · easing · springs · code · Figma · libraries  
- [ ] Ready for F4.10  

---

## Final gate

### APPROVED

**Sprint F4.9 — Motion Language & Transition System LOCKED.**

Stop.

Do **NOT** continue to Sprint F4.10.

---

## Related documents

| Doc | Role |
|-----|------|
| [F3_5_MOTION_ANIMATION_PHILOSOPHY.md](../03_UX/F3_5_MOTION_ANIMATION_PHILOSOPHY.md) | UX motion constitution |
| [F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) | Overlay · place · elevation meaning |
| [F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md](./F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) | State · overlay · loading system law |
| [F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md](./F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md) | Interaction objects |
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) | Clarify > decorate |
| [F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md](../03_UX/F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md) | UX governance · debt |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Reduced motion · a11y |
| [MOTION_GUIDELINES.md](../02_DESIGN/MOTION_GUIDELINES.md) | Subordinate detail (must obey F3.5 · F4.9) |
| [F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md](./F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md) | **LOCKED** Token architecture (future motion tokens) |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Motion language constitution: meaning before decoration; continuity; interruptibility; reduced motion; anti-engagement motion; no durations/easing/implementation |
