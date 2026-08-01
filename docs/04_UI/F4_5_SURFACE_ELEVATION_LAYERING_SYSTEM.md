# GMRLOG — Sprint F4.5: Surface, Elevation & Layering System

**Document:** `docs/04_UI/F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F4.5 (Surface, Elevation & Layering System — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UI Surface Constitution

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
| 9 | [`F4_4_GRID_LAYOUT_SPACING_SYSTEM.md`](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md) |
| 10 | **This document** — Surface, Elevation & Layering System |

Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.1–F4.4.

This sprint answers:

> “How should digital space feel physically inside GMRLOG?”

rather than:

> “How large should shadows, radius or cards be?”

| Does | Does not |
|------|----------|
| Define surface · layering · elevation meaning · depth hierarchy | Define shadows · border radius · blur · opacity |
| Define container philosophy · environmental consistency | Define materials · implementation |

| Layer | Defines |
|-------|---------|
| F4.1 | Visual philosophy |
| F4.2 | Color language |
| F4.3 | Typography |
| F4.4 | Spatial language |
| **F4.5** | Physical digital environment |

Later surface tokens, elevation tokens, shadows, radius and materials must obey this constitution. On conflict, **F4.5 + F4.4 + F4.3 + F4.2 + F4.1 + F3 + F2 + Master** win.

Master · F1 remain higher-law foundations (Story Ember layered surfaces as higher law — this freeze governs **depth meaning**, not material recipes).

**Gate:** Stop after freeze. Do **not** continue to Sprint F4.6.

---

## Scope

**In scope:** Surface philosophy · layering philosophy · elevation meaning · container hierarchy · depth communication · environmental consistency · accessibility implications · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Shadows |
| Blur |
| Radius |
| Materials |
| Components |
| Engineering |
| Figma |
| Sprint F4.5.1+ · F4.6 |

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Surface Philosophy |
| 3 | Layer Before Decoration |
| 4 | Elevation Philosophy |
| 5 | Container Philosophy |
| 6 | Environmental Consistency |
| 7 | Physical Hierarchy |
| 8 | Surface Relationships |
| 9 | Digital Home Atmosphere |
| 10 | Accessibility Relationship |
| 11 | Consistency Rules |
| 12 | Anti-Manipulation |
| 13 | Future Ready |
| 14 | Emotional Goal |
| 15 | Audit Checklist |

---

# 1. Mission

Define how digital surfaces communicate meaning **before** any visual material is created.

Surfaces exist to reinforce:

| Reinforce |
|-----------|
| Clarity |
| Place |
| Hierarchy |
| Stability |
| Craftsmanship |

Surfaces never exist to impress.

---

# 2. Surface Philosophy

Every surface represents a **place**.

Never decoration.

| Always | Never |
|--------|-------|
| Contain meaning | Contain decoration |
| Support content | Compete with content |
| Express stability | Express spectacle |
| Reduce complexity | Increase complexity |
| Feel intentional | Feel fashionable |

Surfaces create rooms.

Not effects.

Align F4.1 surface philosophy: stable · quiet · layered · intentional.

---

# 3. Layer Before Decoration

Every layer must answer:

> Why does this layer exist?

Not:

> Can we add another card?

Depth follows meaning.

Not aesthetics.

If meaning disappears, the layer disappears.

Cards are not a default habitat — they appear when purpose demands (F4.1 · composition kinship).

---

# 4. Elevation Philosophy

Elevation communicates **importance**.

Never status.

Higher elevation means:

| Means |
|-------|
| Temporary focus |
| Interaction context |
| Environmental separation |

Never:

| Never |
|-------|
| Superiority |
| Prestige |
| Marketing emphasis |

Depth communicates structure.

Not power.

---

# 5. Container Philosophy

Containers organize information.

Never imprison it.

Containers should:

| Should |
|--------|
| Group related content |
| Reduce cognitive load |
| Preserve reading rhythm |
| Clarify ownership |

Containers should disappear behind their purpose.

Align F4.3 reading rhythm · F4.4 reading corridors.

---

# 6. Environmental Consistency

The entire application should feel like **one continuous place**.

Never disconnected screens.

Players should feel:

> “I moved into another room.”

Never:

> “I opened another app.”

Align Digital Home philosophy (F2 + F3 · F4.1).

---

# 7. Physical Hierarchy

Environment determines depth.

Meaning determines environment.

| Rule |
|------|
| Background supports surfaces |
| Surfaces support content |
| Content remains primary |
| Temporary elements never permanently dominate |

Depth follows hierarchy.

Not decoration.

Align [F3.3](../03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) · [F4.4](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md).

---

# 8. Surface Relationships

Surfaces should communicate relationships.

| Rule |
|------|
| Objects sharing meaning should feel related |
| Objects with different purposes should feel distinct |
| Distance and layering reinforce semantic grouping |

Never visual randomness.

---

# 9. Digital Home Atmosphere

The interface should resemble:

| Resembles |
|-----------|
| Shelves |
| Desks |
| Collections |
| Albums |
| Memories |

Never:

| Never |
|-------|
| Floating advertisements |
| Casino panels |
| Dashboard widgets |
| Trading terminals |

Digital Home should feel **inhabited**.

Not assembled.

---

# 10. Accessibility Relationship

Layering must remain compatible with [F2.18](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) and F3.

Depth must never rely only on:

| Forbidden sole carriers |
|-------------------------|
| Shadows |
| Blur |
| Transparency |

Every hierarchy must remain understandable without visual effects.

Accessibility remains constitutional.

Not optional.

---

# 11. Consistency Rules

| Rule |
|------|
| Same semantic layer → same environmental role |
| Same temporary layer → same elevation philosophy |
| Same page type → same surface hierarchy |
| Reading surfaces remain dominant |
| Surface hierarchy follows F3.3 and F4.4 |

Inconsistent depth is design debt (F3.12).

---

# 12. Anti-Manipulation

Explicit bans:

| Banned |
|--------|
| Excessive floating panels |
| Unnecessary overlays |
| Permanent promotional layers |
| Fake depth to increase interaction |
| Exaggerated glassmorphism |
| Visual spectacle replacing clarity |
| Elevation used to manipulate clicks |

If depth primarily increases engagement rather than understanding, it is unconstitutional.

Align F2.22 · F2.29 · F3.12 · F4.1–F4.4.

---

# 13. Future Ready

Reserve architecture only (no shadows · radius · blur · materials · implementation):

| Reserved for later F4 / tokens |
|--------------------------------|
| Surface Tokens |
| Elevation Tokens |
| Material System |
| Layer Tokens |
| Blur System |
| Transparency System |
| Environmental Themes |

F4.5 defines the architecture.

Later tokens define the appearance.

---

# 14. Emotional Goal

Players should feel:

> “Everything belongs somewhere.”

Never:

> “Everything is floating randomly.”

Never:

> “The interface feels assembled instead of lived in.”

---

# 15. Audit Checklist

- [ ] Answers how digital space should feel  
- [ ] Surface before decoration  
- [ ] Elevation communicates meaning  
- [ ] Containers organize clearly  
- [ ] Environmental consistency preserved  
- [ ] Digital Home atmosphere reinforced  
- [ ] Accessibility acknowledged  
- [ ] Anti-manipulation explicit  
- [ ] Compatible with F1 · F2 · F3 · F4.1–F4.4  
- [ ] No shadows specified  
- [ ] No radius specified  
- [ ] No blur specified  
- [ ] No implementation  
- [ ] Ready for F4.6  

---

## Final gate

### APPROVED

**Sprint F4.5 — Surface, Elevation & Layering System LOCKED.**

Stop.

Do **NOT** continue to Sprint F4.6.

---

## Related documents

| Doc | Role |
|-----|------|
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) | UI Foundation · surface feel |
| [F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md](./F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md) | Color · surface/background families |
| [F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md](./F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md) | Reading surfaces |
| [F4_4_GRID_LAYOUT_SPACING_SYSTEM.md](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md) | Spatial language · meaning parity |
| [F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md](./F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md) | **LOCKED** Iconography & Visual Symbol Language |
| [F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md](./F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md) | **LOCKED** Responsive UI · adaptive identity |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](../03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) | Hierarchy law space must obey |
| [F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md](../03_UX/F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md) | UX governance · design debt |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Depth without effects-only |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT · Story Ember |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Physical digital environment: surfaces as places; elevation = structure not power; Digital Home inhabited; no shadows/radius/blur |
