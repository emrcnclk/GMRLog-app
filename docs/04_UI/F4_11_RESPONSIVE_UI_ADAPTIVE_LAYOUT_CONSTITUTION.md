# GMRLOG — Sprint F4.11: Responsive UI & Adaptive Layout Constitution

**Document:** `docs/04_UI/F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F4.11 (Responsive UI & Adaptive Layout Constitution — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UI Responsive Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution ([`SPRINT_F2_29`](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) closes F2) |
| 5 | Entire F3 UX Constitution (F3.1–F3.12) — especially [`F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md`](../03_UX/F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md) |
| 6–15 | Entire F4.1–F4.10 — especially [`F4_4_GRID_LAYOUT_SPACING_SYSTEM.md`](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md) · [`F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md`](./F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) · [`F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md`](./F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md) |
| 16 | **This document** — Responsive UI & Adaptive Layout Constitution |

Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.1–F4.10.

This sprint answers:

> “How should GMRLOG’s UI adapt across different devices while preserving the exact same identity?”

rather than:

> “Which breakpoints, pixels, or CSS should we use?”

| Does | Does not |
|------|----------|
| Define responsive · adaptive · cross-device identity philosophy | Define breakpoints · px · columns · grids as measurements |
| Bind device-class adaptation to F3.10 · F4.4 meaning parity | CSS · AutoLayout · RN · Figma · engineering · component specs |

| Layer | Defines |
|-------|---------|
| F3.10 | Cross-platform *experience* — same jobs · same meaning |
| F4.4 | Spatial language — layout adapts · meaning does not |
| **F4.11** | How the **UI** adapts across device classes while identity stays one |

F3.10 remains the UX responsive constitution.  
F4.11 binds adaptation to the **UI Design System** — without measurements.

Subordinate screen specs and layout implementations must obey **F3.10 + F4.4 + this document**. On conflict, **F4.11 + F4.10–F4.1 + F3.10 + F2 + Master** win.

**Gate:** Stop after freeze. Do **not** continue to Sprint F4.12.

---

## Scope

**In scope:** Responsive UI philosophy · adaptive layout philosophy · cross-device identity · device classes · mobile-first · tablet · desktop · wide-screen · reading · navigation · density · interaction adaptation · multi-column philosophy · large-screen behavior · foldable reservation · accessibility · consistency · anti-fragmentation · anti-manipulation · future ready · emotional goal · audit.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Breakpoint values · px · columns · grid measurements |
| CSS · AutoLayout · RN · Figma · code · engineering |
| Component specs |
| Sprint F4.11.1+ · F4.12 |

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Responsive UI Philosophy |
| 3 | Adaptive Layout Philosophy |
| 4 | Cross-device Identity |
| 5 | Device Classes Philosophy |
| 6 | Mobile-first Philosophy |
| 7 | Tablet Adaptation Philosophy |
| 8 | Desktop Adaptation Philosophy |
| 9 | Wide-screen Philosophy |
| 10 | Reading Adaptation |
| 11 | Navigation Adaptation |
| 12 | Information Density Adaptation |
| 13 | Interaction Adaptation |
| 14 | Multi-column Philosophy |
| 15 | Large Screen Behavior Philosophy |
| 16 | Foldable Philosophy (Future Reservation) |
| 17 | Accessibility Relationship |
| 18 | Consistency Rules |
| 19 | Anti-Fragmentation |
| 20 | Anti-Manipulation |
| 21 | Future Ready |
| 22 | Emotional Goal |
| 23 | Audit Checklist |

---

# 1. Mission

Define how GMRLOG’s UI adapts across devices **while preserving the exact same identity** — before any breakpoint or measurement is chosen.

Adaptation exists to:

| Exist to |
|----------|
| Preserve Digital Home continuity |
| Keep meaning · hierarchy · jobs identical |
| Honor available space without inventing a new product |
| Support reading · orientation · agency on every class |

Adaptation never exists to ship a “mobile app” and a “desktop site” as rival identities.

---

# 2. Responsive UI Philosophy

The UI responds to **context of use**.

Never to fashion.

| Always | Never |
|--------|-------|
| Adapt canvas | Rewrite meaning |
| Preserve identity | Fork brand per device |
| Keep one Design System | Invent device-local kits |
| Clarify under constraint | Decorate with leftover space |

Responsive UI is stewardship of place across sizes.

Not a collage of separate products.

Align Master: Mobile-first / Desktop-ready · F3.10.

---

# 3. Adaptive Layout Philosophy

Layout adapts.

**Meaning does not.**

| Law |
|-----|
| Hierarchy remains F3.3 · F4.3 · F4.4 |
| Room jobs remain F2 · F3 |
| Component responsibilities remain F4.7 · F4.8 |
| Tokens remain semantic (F4.10) — themes/devices remap presentation, not roles |

If a layout change alters what the product *is*, it is illegal adaptation.

---

# 4. Cross-device Identity

A screenshot on any device class should still feel like GMRLOG.

| Preserve |
|----------|
| Composition discipline (F4.1) |
| Semantic color · type · space · surface languages |
| Symbol · component · motion grammars |
| Digital Home atmosphere |

| Never |
|-------|
| “Mobile GMRLOG” vs “Desktop GMRLOG” personalities |
| Device-only engagement chrome |
| Identity that depends on one screen width |

Recognizability survives without relying on logos alone (F4.1).

---

# 5. Device Classes Philosophy

Device classes are **contexts**, not products.

| Class (conceptual) | Role |
|--------------------|------|
| Mobile | Primary crafting context · highest constraint · first truth |
| Tablet | Bridge · more breath · same jobs |
| Desktop | Expanded canvas · deeper concurrent reading / tooling without dashboard culture |
| Wide-screen | Restraint under abundance · not content sprawl |
| Foldable (reserved) | Continuity across posture changes (§16) |

Classes may receive different **spatial arrangements**.

They must not receive different **constitutions**.

---

# 6. Mobile-first Philosophy

Mobile is the **first truth** of the UI.

| Law |
|-----|
| Design meaning under constraint first |
| Enrich on larger canvases — do not invent meaning that only exists on desktop |
| Touch-first agency remains honorable on every class that supports it |
| Desktop must not become the only place culture is complete |

Mobile-first is priority of clarity — not neglect of desktop craft.

---

# 7. Tablet Adaptation Philosophy

Tablet is a **bridge**, not a halfway compromise identity.

| Law |
|-----|
| Same rooms · same hierarchy · more spatial breathing when earned |
| Avoid “stretched phone” emptiness and “shrunken desktop” clutter |
| Multi-pane only when it serves one focal purpose (F4.4 corridors) |
| Do not introduce desktop-only features as tablet bait |

---

# 8. Desktop Adaptation Philosophy

Desktop expands **capacity**, not personality.

| Law |
|-----|
| More concurrent structure allowed when it reduces friction |
| Chrome remains quieter than content |
| Keyboard / pointer idioms map to shared component meaning (F3.10 · F4.8) |
| Desktop must not become an ops dashboard or trading terminal (F4.5 · F4.1) |

Desktop is a larger room in the same home.

---

# 9. Wide-screen Philosophy

Abundance is a risk.

| Law |
|-----|
| Extra space serves reading · composition · calm — not stuffing |
| Do not stretch single reading corridors into unreadable widths without purpose |
| Do not fill margins with engagement modules |
| Restraint under abundance is premium (F4.1) |

Wide screens test discipline more than mobile screens do.

---

# 10. Reading Adaptation

Reading remains first-class on every class (F4.3 · F3.8).

| Law |
|-----|
| Long-form comfort adapts spatially — not by demoting reading |
| Reviews · articles · UGC keep paragraph hierarchy |
| Do not sacrifice readability to show more chrome on large screens |
| Spoiler / annotation friendliness remains class-agnostic |

---

# 11. Navigation Adaptation

Navigation adapts presentation.

**Destinations and jobs do not** (F2.1 · F3.2 · F4.8 Nav).

| Law |
|-----|
| Primary destinations remain the same set of meanings |
| Wayfinding stays predictable when chrome form changes |
| Back / return orientation remains intact (F3.2 · F4.9) |
| Nav must never sell or become device-specific engagement rails |

---

# 12. Information Density Adaptation

Density communicates confidence (F4.1 · F4.4) — scaled to space.

| Law |
|-----|
| Constrained classes prioritize primary meaning ruthlessly |
| Larger classes may reveal secondary structure without shouting |
| Never crowd to maximize engagement |
| Never leave unfinished emptiness that feels like a broken layout |

Density adapts.

Anxiety must not.

---

# 13. Interaction Adaptation

Interaction meaning stays stable (F3.4 · F4.7 · F4.9).

| Law |
|-----|
| Same object · same responsibility across classes |
| Input modality may change · affordance honesty must not |
| Destructive / Protective paths remain Protective everywhere |
| Do not hide critical agency on one class and reveal it only on another without governance |

---

# 14. Multi-column Philosophy

Multiple columns are a **spatial tool**, not a lifestyle.

| Law |
|-----|
| Columns exist to clarify relationships or concurrent tasks |
| One focal purpose per view remains law (F4.1 · F4.4) |
| Side columns must not become engagement billboards |
| Multi-column must preserve reading corridors — not compete with them |

If columns fight for primary attention, simplify.

---

# 15. Large Screen Behavior Philosophy

Large screens invite dashboard temptation.

| Always | Never |
|--------|-------|
| Deeper culture · clearer structure | Widget walls |
| Calm concurrent reading / library / community | Casino panels · trading terminals |
| Stronger composition | Decorative sprawl |

Large-screen GMRLOG remains a Digital Home — inhabited, not assembled (F4.5).

---

# 16. Foldable Philosophy (Future Reservation)

Reserve only:

| Reserved |
|----------|
| Continuity across folded / unfolded postures |
| Same identity · same jobs · adapted canvas |
| No foldable-only engagement gimmicks |
| No second product personality for fold state |

No posture measurements · no implementation here.

---

# 17. Accessibility Relationship

Compatible with F2.18 · F3.10 · F4.4 · F4.10.

| Law |
|-----|
| Adaptation must not remove accessible structure |
| Reflow / magnification / density modes (future) change space — not meaning |
| Focus order follows reading corridors on every class |
| Class change is not an excuse for color-only / motion-only meaning |

---

# 18. Consistency Rules

| Rule |
|------|
| Same page type → same adaptive philosophy |
| Same hierarchy → same priority across classes |
| Same component meaning on every class (F4.8 · F4.10) |
| Reading corridors remain stable in intent |
| Navigation destinations remain stable in meaning |
| Adaptation follows F3.10 · F4.4 |

Inconsistent device dialects are design debt (F3.12).

---

# 19. Anti-Fragmentation

Explicit bans:

| Banned |
|--------|
| Separate mobile / desktop Design Systems |
| Device-only component kits |
| Theme-or-device forks of meaning |
| “Desktop exclusive culture” that empties mobile |
| Parallel IA per device |
| Breakpoint-driven product philosophy (values still forbidden here — the *habit* of letting breakpoints invent identity is banned) |

One home.

Many canvases.

---

# 20. Anti-Manipulation

| Banned |
|--------|
| Stuffing large screens with engagement modules |
| Hiding costs / consent on “small” classes |
| Density tricks to increase taps |
| Device-specific fake urgency |
| Infinite content walls justified by “we have space” |

If adaptation primarily increases engagement rather than understanding or comfort, it is unconstitutional.

Align F2.22 · F2.29 · F3.12 · F4.1–F4.10.

---

# 21. Future Ready

Reserve architecture only (no measurements · no implementation):

| Reserved |
|----------|
| Device-class presentation catalogs |
| Density modes |
| Multi-pane patterns under corridor law |
| Foldable posture patterns |
| Large-screen composition templates (meaning-preserving) |
| Adaptive token projections (F4.10) |

F4.11 defines the adaptation constitution.

Later specs write arrangements — under this law.

---

# 22. Emotional Goal

Players should feel:

> “It’s the same home — just a different room size.”

Never:

> “I opened a different product on my computer.”

Never:

> “Mobile feels unfinished so desktop can feel complete.”

---

# 23. Audit Checklist

- [ ] Answers how UI adapts while identity stays the same  
- [ ] Layout adapts · meaning does not  
- [ ] Cross-device identity protected  
- [ ] Device classes as contexts · not products  
- [ ] Mobile-first · tablet · desktop · wide-screen philosophies locked  
- [ ] Reading · navigation · density · interaction adaptation locked  
- [ ] Multi-column · large-screen restraint locked  
- [ ] Foldable reserved without implementation  
- [ ] Accessibility acknowledged  
- [ ] Anti-fragmentation · anti-manipulation explicit  
- [ ] Compatible with F1 · F2 · F3 (esp. F3.10) · F4.1–F4.10  
- [ ] No breakpoints · px · columns · CSS · RN · Figma · specs  
- [ ] Ready for F4.12  

---

## Final gate

### APPROVED

**Sprint F4.11 — Responsive UI & Adaptive Layout Constitution LOCKED.**

Stop.

Do **NOT** continue to Sprint F4.12.

---

## Related documents

| Doc | Role |
|-----|------|
| [F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md](../03_UX/F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md) | UX cross-platform constitution |
| [F4_4_GRID_LAYOUT_SPACING_SYSTEM.md](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md) | Spatial language · meaning parity |
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) | Identity · density · recognizability |
| [F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) | Continuous place · anti-dashboard |
| [F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md](./F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) | Same citizens across classes |
| [F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md](./F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md) | Semantic stability across canvases |
| [F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md](./F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md) | Continuity across place changes |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Mobile-first / Desktop-ready |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |
| [F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md](./F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md) | **LOCKED** Design System governance · anti-fork |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Responsive UI constitution: adapt canvas · preserve identity; device classes as contexts; anti-fragmentation; no breakpoints/px |
