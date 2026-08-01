# GMRLOG — Sprint F4.4: Grid, Layout & Spacing System

**Document:** `docs/04_UI/F4_4_GRID_LAYOUT_SPACING_SYSTEM.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F4.4 (Grid, Layout & Spacing System — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UI Layout Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution ([`SPRINT_F2_29`](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) closes F2) |
| 5 | Entire F3 UX Constitution (F3.1–F3.12) |
| 6 | [`F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md`](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) |
| 7 | [`F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md`](./F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md) |
| 8 | [`F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md`](./F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md) |
| 9 | **This document** — Grid, Layout & Spacing System |

Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.1–F4.3.

This sprint answers:

> “How should information occupy space inside GMRLOG?”

rather than:

> “How many pixels should margins or grids use?”

| Does | Does not |
|------|----------|
| Define layout · spacing · spatial hierarchy · page rhythm · alignment · whitespace philosophy | Choose spacing values · grid columns · breakpoints |
| Prepare future grid and spacing tokens | Define measurements · implement layout · create Figma frames |

| Layer | Defines |
|-------|---------|
| F4.1 | Visual philosophy |
| F4.2 | Color language |
| F4.3 | Typography language |
| **F4.4** | Spatial language |

Later grid systems, spacing tokens, responsive layouts, and implementation must obey this constitution. On conflict, **F4.4 + F4.3 + F4.2 + F4.1 + F3 + F2 + Master** win.

Master · F1 remain higher-law foundations (including 8pt grid discipline as higher law — this freeze governs **spatial meaning**, not measurements).

**Gate:** Stop after freeze. Do **not** continue to Sprint F4.5.

---

## Scope

**In scope:** Layout philosophy · spatial hierarchy · whitespace philosophy · reading corridors · alignment philosophy · grid philosophy · spatial rhythm · responsive philosophy · page composition · accessibility implications · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Grid columns |
| Pixel values |
| Tokens |
| Components |
| Breakpoints |
| Engineering |
| Figma |
| Sprint F4.4.1+ · F4.5 |

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Layout Philosophy |
| 3 | Space Before Decoration |
| 4 | Grid Philosophy |
| 5 | Whitespace Philosophy |
| 6 | Reading Corridors |
| 7 | Spatial Hierarchy |
| 8 | Alignment Philosophy |
| 9 | Responsive Space Philosophy |
| 10 | Accessibility Relationship |
| 11 | Consistency Rules |
| 12 | Anti-Manipulation |
| 13 | Future Ready |
| 14 | Emotional Goal |
| 15 | Audit Checklist |

---

# 1. Mission

Define how space communicates meaning inside GMRLOG **before** any measurements are created.

Layout exists to reinforce:

| Reinforce |
|-----------|
| Clarity |
| Hierarchy |
| Rhythm |
| Orientation |
| Calm |

Layout never exists to impress.

---

# 2. Layout Philosophy

Space communicates meaning.

Never emptiness.

| Always | Never |
|--------|-------|
| Clarify | Decorate |
| Guide attention | Scatter attention |
| Support hierarchy | Fight hierarchy |
| Reduce cognitive load | Increase visual noise |
| Express confidence | Express complexity |

Space is structure.

Not absence.

Align F4.1: clarify > decorate · F4.3 reading rhythm — space carries both.

---

# 3. Space Before Decoration

Every empty area must answer:

> Why is this space here?

Not:

> Can we fill it with something?

Whitespace is intentional.

Not leftover room.

If purpose cannot be stated, the fill does not belong — the space does.

---

# 4. Grid Philosophy

The grid exists to create **consistency**.

Never rigidity.

The grid should:

| Should |
|--------|
| Organize |
| Align |
| Simplify |
| Disappear beneath content |

Players should never notice the grid itself.

Only its benefits.

The grid is invisible craftsmanship.

---

# 5. Whitespace Philosophy

Whitespace carries hierarchy.

Not decoration.

Whitespace should:

| Should |
|--------|
| Separate meaning |
| Improve reading |
| Create rhythm |
| Reduce fatigue |

Whitespace must never feel like wasted space.

Breathing room is confidence (F4.1 density kinship).

---

# 6. Reading Corridors

Layouts must preserve natural reading flow.

Every page should provide:

| Must provide |
|--------------|
| One visual entry point |
| One reading direction |
| One primary corridor |

No competing reading paths.

Align [F3.3](../03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) · F4.3 reading rhythm.

---

# 7. Spatial Hierarchy

Meaning determines spatial priority.

Never the reverse.

| Rule |
|------|
| Primary content receives more space |
| Supporting content compresses naturally |
| Chrome remains visually secondary |
| Empty space follows importance |

Meaning → hierarchy → space allocation.

---

# 8. Alignment Philosophy

Alignment communicates craftsmanship.

Not mathematics.

Elements should feel:

| Feel |
|------|
| Related |
| Balanced |
| Intentional |

Alignment reduces uncertainty.

Misalignment is noise — even when “creative.”

---

# 9. Responsive Space Philosophy

Layout should adapt.

Meaning should not.

Across:

| Class |
|-------|
| Mobile |
| Tablet |
| Desktop |

Hierarchy remains identical.

Only available space changes.

Align F3.10: same jobs · same meaning · adapted canvas.

---

# 10. Accessibility Relationship

Spatial organization must remain compatible with [F2.18](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) and F3.

Layouts should support:

| Support |
|---------|
| Readable grouping |
| Predictable scanning |
| Focus visibility |
| Assistive navigation |

Meaning must never rely on spatial tricks alone.

Accessibility is constitutional.

Not optional.

---

# 11. Consistency Rules

| Rule |
|------|
| Same page type → same spatial rhythm |
| Same hierarchy → same spacing philosophy |
| Reading corridors remain stable |
| Primary actions occupy predictable locations |
| Spatial hierarchy follows F3.3 |

Inconsistent spacing is design debt (F3.12).

---

# 12. Anti-Manipulation

Explicit bans:

| Banned |
|--------|
| Visual clutter to increase interaction |
| Artificially compressed layouts |
| Endless content walls |
| Deceptive spacing |
| Fake prominence through oversized whitespace |
| Overcrowding to maximize engagement |

If spacing primarily increases engagement rather than understanding, it is unconstitutional.

Align F2.22 · F2.29 · F3.12 · F4.1–F4.3.

---

# 13. Future Ready

Reserve architecture only (no pixels · no implementation):

| Reserved for later F4 / tokens |
|--------------------------------|
| Grid Tokens |
| Spacing Tokens |
| Responsive Grid |
| Adaptive Layout Rules |
| Safe Area Rules |
| Density Modes |

F4.4 defines the grammar.

Tokens write the measurements later.

---

# 14. Emotional Goal

Players should feel:

> “Everything has room to breathe.”

Never:

> “Everything competes for my attention.”

Never:

> “The interface feels cramped or unfinished.”

---

# 15. Audit Checklist

- [ ] Answers how space communicates  
- [ ] Space before decoration  
- [ ] Grid philosophy defined  
- [ ] Whitespace protected  
- [ ] Reading corridors preserved  
- [ ] Spatial hierarchy defined  
- [ ] Responsive philosophy protected  
- [ ] Accessibility acknowledged  
- [ ] Anti-manipulation explicit  
- [ ] Compatible with F1 · F2 · F3 · F4.1–F4.3  
- [ ] No pixel values  
- [ ] No grid measurements  
- [ ] No implementation  
- [ ] Ready for F4.5  

---

## Final gate

### APPROVED

**Sprint F4.4 — Grid, Layout & Spacing System LOCKED.**

Stop.

Do **NOT** continue to Sprint F4.5.

---

## Related documents

| Doc | Role |
|-----|------|
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) | UI Foundation · visual feel · density |
| [F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md](./F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md) | Color language |
| [F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md](./F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md) | Typography · reading rhythm |
| [F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) | **LOCKED** Surface, Elevation & Layering System |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](../03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) | Hierarchy law space must obey |
| [F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md](../03_UX/F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md) | Responsive meaning parity |
| [F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md](./F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md) | **LOCKED** Responsive UI · adaptive identity |
| [F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md](../03_UX/F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md) | UX governance · design debt |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Spatial a11y |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Spatial language constitution: space before decoration; reading corridors; responsive meaning parity; no pixels/columns |
