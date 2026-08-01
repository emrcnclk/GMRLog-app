# GMRLOG — Sprint F4.10: Design Token Architecture & Semantic Foundation

**Document:** `docs/04_UI/F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F4.10 (Design Token Architecture & Semantic Foundation — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UI Token Architecture Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution ([`SPRINT_F2_29`](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) closes F2) |
| 5 | Entire F3 UX Constitution (F3.1–F3.12) |
| 6–14 | Entire F4.1–F4.9 UI Constitution |
| 15 | **This document** — Design Token Architecture & Semantic Foundation |

Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.1–F4.9.

This sprint answers:

> “How should design decisions become reusable system tokens?”

rather than:

> “What are the token values?”

| Does | Does not |
|------|----------|
| Define token philosophy · hierarchy · semantics · naming · evolution · theme independence | Define HEX · spacing · type · radius · elevation · motion values |
| Prepare later `DESIGN_TOKENS.md` / packages under this law | JSON · CSS · RN constants · Figma variables · Tailwind · code |

| Layer | Defines |
|-------|---------|
| F4.1–F4.9 | Visual · color · type · space · surface · symbol · component · motion **meaning** |
| **F4.10** | How that meaning becomes a **reusable token architecture** |

Tokens are the translation layer between constitutional meaning and future implementation.

Subordinate [`DESIGN_TOKENS.md`](../02_DESIGN/DESIGN_TOKENS.md) and token packages must obey this constitution. On conflict, **F4.10 + F4.9–F4.1 + F3 + F2 + Master** win.

**Gate:** Stop after freeze. Do **not** continue to Sprint F4.11.

---

## Scope

**In scope:** Design token philosophy · semantic hierarchy · primitive vs semantic · inheritance · aliases · global / component / theme tokens · platform independence · naming · stability · versioning · scalability · extensibility · accessibility relationship · consistency · anti-fragmentation · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Hex · spacing · typography · radius · elevation · animation values |
| JSON examples · CSS · RN · Tailwind · Figma Variables |
| Engineering · code · implementation |
| Sprint F4.10.1+ · F4.11 |

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Token Philosophy |
| 3 | Meaning Before Values |
| 4 | Token Hierarchy |
| 5 | Primitive vs Semantic Philosophy |
| 6 | Alias & Inheritance Philosophy |
| 7 | Global · Component · Theme Tokens |
| 8 | Component Token Philosophy |
| 9 | Theme Independence |
| 10 | Naming Philosophy |
| 11 | Evolution · Stability · Versioning |
| 12 | Accessibility Relationship |
| 13 | Consistency Rules |
| 14 | Anti-Fragmentation |
| 15 | Anti-Manipulation |
| 16 | Future Ready |
| 17 | Emotional Goal |
| 18 | Audit Checklist |

---

# 1. Mission

Define how design decisions become reusable system tokens **before** any value is written.

Tokens exist to:

| Exist to |
|----------|
| Preserve meaning across platforms and themes |
| Scale the Design System without tribal forks |
| Let visuals evolve without rewriting every component |
| Keep Digital Home identity coherent over years |
| Enforce F4.1–F4.9 languages in implementable form — later |

Tokens never exist to optimize for a single library or trend.

---

# 2. Token Philosophy

Tokens are **named meaning**.

Not dumped values.

| Always | Never |
|--------|-------|
| Encode role | Encode fashion |
| Enable reuse | Encourage one-offs |
| Separate meaning from paint | Bind identity to one hex |
| Support themes | Fork components per theme |
| Stabilize contracts | Churn names casually |

Architecture before optimization.

Semantics before values.

Meaning before implementation.

---

# 3. Meaning Before Values

Every token must answer:

> What meaning does this name carry?

Not:

> What pretty number should we put here?

| Law |
|-----|
| Values may change · meaning must not silently change |
| A redesign may remap values under the same semantics |
| Components consume meaning — not raw paint |
| Implementation remains independent from meaning |

If a token cannot state its meaning, it must not exist.

---

# 4. Token Hierarchy

Tokens form layers. Lower layers never leak into components as primary consumption.

| Layer (conceptual) | Role |
|--------------------|------|
| Primitive | Raw foundation references without product role |
| Semantic (global) | Product meaning — background · text · border · status · interactive… |
| Component | Role bound to a citizen / pattern under F4.8 |
| Theme | Value sets mapped onto the same semantic names |

| Consumption law |
|-----------------|
| Components consume **semantic** (or component-semantic) tokens |
| Components must **not** consume primitives as first choice |
| Themes swap values · not component trees |

Align Master / existing token hierarchy posture: Primitive → Semantic → Component → Theme — this freeze makes it constitutional for F4.

---

# 5. Primitive vs Semantic Philosophy

## 5.1 Primitives

Primitives are **building material**.

| May | Must not |
|-----|----------|
| Exist as named foundations | Be the default API for UI citizens |
| Be remapped by themes | Carry marketing or engagement meaning |
| Support semantic aliases | Bypass accessibility contrast obligations |

## 5.2 Semantics

Semantics are **product language**.

| Family examples (roles — not values) |
|--------------------------------------|
| Background · Surface · Border · Text |
| Primary · Secondary · Interactive · Disabled |
| Success · Warning · Error · Information |
| Space · Type role · Elevation role · Motion role (future) |

Align F4.2 · F4.3 · F4.4 · F4.5 · F4.9 reserved families — tokens name those roles; they do not invent new visual philosophies.

## 5.3 Why semantics exist

| Why |
|-----|
| So Light / Dark / OLED / High Contrast can change paint without renaming the product |
| So components stay stable when identity evolves |
| So meaning remains auditable against F4 constitutions |

---

# 6. Alias & Inheritance Philosophy

| Law |
|-----|
| Aliases point meaning → meaning or meaning → primitive |
| Inheritance preserves a single source of truth for a role |
| Circular aliases are forbidden |
| Broken aliases are design debt — not “flexibility” |

Aliases exist to reduce duplication of meaning — not to create shadow vocabularies.

---

# 7. Global · Component · Theme Tokens

## 7.1 Global tokens

Shared across the product. Express Digital Home languages (color · type · space · surface · motion roles).

## 7.2 Component tokens

Bound to F4.8 citizens / patterns.

| Law |
|-----|
| Component tokens refine global semantics for a responsibility |
| They must not invent a private color religion |
| Prefer referencing global semantics over new primitives |

## 7.3 Theme tokens

Themes are **value packs** for the same semantic graph.

| Theme classes (reserved) |
|--------------------------|
| Dark · Light · OLED · High Contrast · future seasonal / accessibility variants |

Themes change values.

Themes must not change taxonomy of meaning.

---

# 8. Component Token Philosophy

Components (F4.7 · F4.8) must consume tokens that express **role**.

| Always | Never |
|--------|-------|
| Semantic / component-semantic tokens | Raw values inside components |
| Shared roles for shared states | Hardcoded spacing / color / type |
| Stable contracts across themes | Theme-specific component implementations |

When visual identity evolves, components keep consuming the same semantic names; stewards remap values underneath.

That is how the Design System survives redesign without rewriting the home.

---

# 9. Theme Independence

Recognition and behavior should survive theme change (F4.2 theme independence · F4.1 recognizability).

| Law |
|-----|
| Same semantic name → same role in every theme |
| Components do not fork per theme |
| Contrast / accessibility variants adjust values under F2.18 — not new component kits |
| Seasonal themes (future) may remap accents within semantic law — not invent engagement themes |

---

# 10. Naming Philosophy

| Law |
|-----|
| Names express meaning · not appearance (“surface.primary” role — not “almost-black-2”) |
| Prefer stable role language aligned with F4.2–F4.9 families |
| One meaning → one canonical token path |
| Synonym sprawl is fragmentation (§14) |
| Rename requires migration · not silent drift |

Exact string schemas belong to later token docs — this freeze locks **naming intent**.

---

# 11. Evolution · Stability · Versioning

## 11.1 Stability

| Law |
|-----|
| Semantic contracts are long-lived |
| Values may churn more than names |
| Breaking a semantic meaning requires governance (F3.12 · F4.8 kinship) |

## 11.2 Versioning

| Law |
|-----|
| Additive tokens preferred over silent redefinition |
| Deprecation must declare replacement |
| Consumers migrate by meaning — not by hunting hex |

## 11.3 Scalability

| Law |
|-----|
| New product areas inherit the graph — they do not found parallel token universes |
| Platform packages project the same semantics — they do not invent rival meanings |

---

# 12. Accessibility Relationship

Compatible with F2.18 · F4.2 · F4.3 · F4.9.

| Law |
|-----|
| Semantic roles must remain expressible under High Contrast / large text / reduced motion variants |
| Tokens must not encode meaning that only works as color alone |
| Accessibility variants are first-class themes of values — not afterthought forks |

---

# 13. Consistency Rules

| Rule |
|------|
| Same meaning → same token |
| Same state → same semantic treatment |
| Components consume semantics · not primitives by default |
| Themes remap values · not component trees |
| Token graph obeys F4.1–F4.9 languages |
| `DESIGN_TOKENS.md` / packages remain subordinate |

---

# 14. Anti-Fragmentation

Explicit bans:

| Banned |
|--------|
| Raw values inside components |
| Direct color references bypassing semantics |
| Hardcoded spacing / type / radius / elevation / motion |
| Visual duplication via copy-paste constants |
| Multiple meanings for one token |
| One meaning represented by multiple unrelated tokens |
| Theme-specific component implementations |
| Per-team private token kits |
| “Misc” or unnamed dump namespaces |

Fragmentation destroys Digital Home continuity.

---

# 15. Anti-Manipulation

| Banned |
|--------|
| Tokens whose sole purpose is engagement emphasis |
| “Urgency” semantics used as marketing chrome |
| Theme packs designed as casino / dopamine skins |
| Semantic names that launder dark patterns |

If a token primarily increases engagement rather than understanding or consistency, it is unconstitutional.

Align F2.22 · F2.29 · F3.12 · F4.1–F4.9.

---

# 16. Future Ready

Reserve architecture only (no values · no files of values here):

| Reserved |
|----------|
| Full primitive tables |
| Full semantic catalogs |
| Component token catalogs |
| Theme packs (Dark · Light · OLED · High Contrast) |
| Motion · elevation · space · type token graphs |
| Export pipelines (Figma ↔ code) under naming law |
| Versioned token packages |

F4.10 defines the architecture.

Later work writes the values — under this law and F4.1–F4.9.

---

# 17. Emotional Goal

Builders and players (indirectly) should benefit from:

> “The system stays itself even when the paint changes.”

Never:

> “Every screen invented its own numbers.”

Never:

> “Dark mode feels like a different product.”

---

# 18. Audit Checklist

- [ ] Answers how design decisions become reusable tokens  
- [ ] Meaning before values  
- [ ] Hierarchy: primitive → semantic → component → theme  
- [ ] Components consume semantics · not raw values  
- [ ] Theme independence protected  
- [ ] Naming · stability · versioning · scalability locked  
- [ ] Accessibility relationship acknowledged  
- [ ] Anti-fragmentation explicit  
- [ ] Anti-manipulation explicit  
- [ ] Compatible with F1 · F2 · F3 · F4.1–F4.9  
- [ ] No HEX · spacing · type · radius · elevation · motion values  
- [ ] No JSON · CSS · RN · Figma Variables · code  
- [ ] Ready for F4.11  

---

## Final gate

### APPROVED

**Sprint F4.10 — Design Token Architecture & Semantic Foundation LOCKED.**

Stop.

Do **NOT** continue to Sprint F4.11.

---

## Related documents

| Doc | Role |
|-----|------|
| [F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md](./F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md) | Color semantic families |
| [F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md](./F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md) | Type semantic families |
| [F4_4_GRID_LAYOUT_SPACING_SYSTEM.md](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md) | Space semantic language |
| [F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) | Surface / elevation roles |
| [F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md](./F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) | Component consumption law |
| [F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md](./F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md) | Motion meaning (future motion tokens) |
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) | Visual philosophy |
| [F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md](./F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md) | **LOCKED** Responsive UI · same semantics across canvases |
| [F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md](./F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md) | **LOCKED** Design System governance · anti-fork |
| [DESIGN_TOKENS.md](../02_DESIGN/DESIGN_TOKENS.md) | Subordinate token tables (must obey this) |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT · token posture |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Token architecture: meaning before values; primitive→semantic→component→theme; anti-fragmentation; no values/JSON/code |
