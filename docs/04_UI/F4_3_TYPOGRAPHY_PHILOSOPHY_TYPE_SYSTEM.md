# GMRLOG — Sprint F4.3: Typography Philosophy & Type System

**Document:** `docs/04_UI/F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F4.3 (Typography Philosophy & Type System — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UI Typography Constitution

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
| 8 | **This document** — Typography Philosophy & Type System |

Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.1 · F4.2.

This sprint answers:

> “How should typography communicate meaning inside GMRLOG?”

rather than:

> “Which font should we use?”

| Does | Does not |
|------|----------|
| Define typography philosophy · semantic hierarchy · reading philosophy · type roles | Select fonts · families · sizes · weights |
| Define information hierarchy · scalable typography architecture | Select line heights · letter spacing |
| Prepare later typography tokens | Implement typography · create Figma styles |

| Layer | Defined |
|-------|---------|
| F4.1 | Visual philosophy |
| F4.2 | Color language |
| **F4.3** | Visual language through text |

Later typography tokens, styles, and implementation must obey this constitution. On conflict, **F4.3 + F4.2 + F4.1 + F3 + F2 + Master** win.

Master · F1 remain higher-law foundations; this freeze governs **type semantics** — it does not pick typefaces.

**Gate:** Stop after freeze. Do **not** continue to Sprint F4.4.

---

## Scope

**In scope:** Typography philosophy · reading hierarchy · information hierarchy · type semantics · display philosophy · heading philosophy · body philosophy · metadata philosophy · UI text philosophy · reading rhythm · accessibility implications · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Fonts |
| Font sizes |
| Weights |
| Line heights |
| Tracking |
| Tokens |
| Components |
| Engineering |
| Sprint F4.3.1+ · F4.4 |

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Typography Philosophy |
| 3 | Reading Before Decoration |
| 4 | Semantic Type System |
| 5 | Information Hierarchy |
| 6 | Reading Rhythm |
| 7 | UI Typography |
| 8 | Long-form Reading |
| 9 | Gaming Identity Through Typography |
| 10 | Accessibility Relationship |
| 11 | Consistency Rules |
| 12 | Anti-Manipulation |
| 13 | Future Ready |
| 14 | Emotional Goal |
| 15 | Audit Checklist |

---

# 1. Mission

Define how typography communicates meaning across GMRLOG **before** any font is selected.

Typography exists to reinforce:

| Reinforce |
|-----------|
| Clarity |
| Hierarchy |
| Reading comfort |
| Trust |
| Craftsmanship |

Typography never exists to maximize engagement.

---

# 2. Typography Philosophy

Typography communicates meaning.

Never decoration.

| Always | Never |
|--------|-------|
| Clarify | Decorate |
| Support hierarchy | Fight hierarchy |
| Support reading | Reduce readability |
| Guide understanding | Demand attention |
| Express confidence | Express excitement |

Typography is language.

Not ornament.

Align F4.1: clarify > decorate · F4.2: meaning before beauty — type follows the same law.

---

# 3. Reading Before Decoration

Every text style must answer:

> Why is this text different?

Not:

> Does this look stylish?

Beauty follows meaning.

Hierarchy follows understanding.

If difference cannot be justified by role, the style does not belong.

---

# 4. Semantic Type System

Typography should be organized by **meaning**.

Future semantic families include:

| Family |
|--------|
| Display |
| Heading |
| Subheading |
| Body |
| Caption |
| Metadata |
| Navigation |
| Interactive |
| Status |
| Labels |
| Monospace (reserved) |

No typography category may exist solely for aesthetics.

Roles precede styling.

Families are jobs — not font picks. Values arrive in later F4 / token work.

---

# 5. Information Hierarchy

Hierarchy determines typography.

Never the reverse.

| Rule |
|------|
| Primary information receives strongest emphasis |
| Supporting information recedes |
| Metadata never competes with content |
| Chrome remains visually quieter than content |

Typography must reinforce [F3.3](../03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md).

Meaning → hierarchy → type emphasis.

---

# 6. Reading Rhythm

Reading should feel effortless.

Typography should create:

| Create |
|--------|
| One entry point |
| One reading rhythm |
| One visual cadence |

The eye should never wonder where to begin.

Rhythm is care — not decoration.

---

# 7. UI Typography

UI text should prioritize comprehension.

Navigation, buttons, labels, and controls should feel:

| Feel |
|------|
| Concise |
| Calm |
| Readable |
| Predictable |

Interface typography is **functional before expressive**.

Align F3.11 voice: calm companion · comprehension over conversion — type carries that voice visually.

---

# 8. Long-form Reading

Reviews, articles, and user-generated writing are **first-class citizens**.

Typography must support:

| Support |
|---------|
| Long reading sessions |
| Low fatigue |
| Clear paragraph hierarchy |
| Spoiler readability |
| Annotation friendliness |

Reading remains a core product activity.

Digital Home is a place people stay to read — type must honor that stay.

---

# 9. Gaming Identity Through Typography

Gaming identity should emerge through composition and hierarchy.

Not through “gamer fonts.”

Never imitate:

| Never |
|-------|
| Esports branding |
| Sci-fi clichés |
| Fantasy clichés |
| Retro pixel nostalgia by default |

Culture over stereotype.

Align F4.1 · F4.2: atmosphere and system — not costume.

---

# 10. Accessibility Relationship

Typography must remain compatible with [F2.18](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) and F3.

Reading must remain possible without relying on:

| Forbidden sole carriers |
|-------------------------|
| Color |
| Motion |
| Decoration |

Future typography choices must prioritize:

| Prioritize |
|------------|
| Readability |
| Scalable sizing |
| Assistive compatibility |
| Internationalization |

Accessibility is constitutional.

Not optional.

This freeze does **not** specify scales or ratios — those belong to later tokens under F2.18 law.

---

# 11. Consistency Rules

| Rule |
|------|
| Same semantic role → same typography family |
| Same hierarchy → same emphasis |
| Metadata remains metadata everywhere |
| Reviews always read like reviews |
| Navigation remains visually predictable |
| Typography hierarchy follows F3.3 |

Inconsistency in type language is design debt (F3.12).

---

# 12. Anti-Manipulation

Explicit bans:

| Banned |
|--------|
| Oversized urgency headlines |
| Clickbait typography |
| Fake emphasis |
| Excessive capitalization |
| Unnecessary boldness |
| Visual shouting |
| Promotional hierarchy disguised as content |
| Typography used to increase engagement |

If typography primarily attracts clicks rather than improves understanding, it is unconstitutional.

Align F2.22 · F2.29 · F3.12 · F4.1 · F4.2.

---

# 13. Future Ready

Reserve architecture only (no fonts · no implementation):

| Reserved for later F4 / tokens |
|--------------------------------|
| Typography Tokens |
| Font Selection |
| Font Scale |
| Responsive Typography |
| Variable Font Support |
| Localization Variants |
| Accessibility Variants |

F4.3 defines the grammar.

Tokens write the sentences later.

---

# 14. Emotional Goal

Players should feel:

> “Reading here feels effortless.”

Never:

> “The interface is shouting at me.”

Never:

> “Everything looks equally important.”

---

# 15. Audit Checklist

- [ ] Answers how typography should communicate  
- [ ] Reading before decoration  
- [ ] Semantic hierarchy defined  
- [ ] Reading rhythm preserved  
- [ ] Long-form reading protected  
- [ ] Gaming identity preserved  
- [ ] Accessibility acknowledged  
- [ ] Anti-manipulation explicit  
- [ ] Compatible with F1 · F2 · F3 · F4.1 · F4.2  
- [ ] No fonts selected  
- [ ] No font sizes  
- [ ] No implementation  
- [ ] Ready for F4.4  

---

## Final gate

### APPROVED

**Sprint F4.3 — Typography Philosophy & Type System LOCKED.**

Stop.

Do **NOT** continue to Sprint F4.4.

---

## Related documents

| Doc | Role |
|-----|------|
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) | UI Foundation · visual feel |
| [F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md](./F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md) | Color meaning language |
| [F4_4_GRID_LAYOUT_SPACING_SYSTEM.md](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md) | **LOCKED** Grid, Layout & Spacing System |
| [F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) | **LOCKED** Surface, Elevation & Layering System |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](../03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) | Hierarchy law type must obey |
| [F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md](../03_UX/F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md) | Voice type must carry |
| [F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md](../03_UX/F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md) | UX governance |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Readability · i18n · a11y |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Typography meaning constitution: reading before decoration; semantic families; long-form protected; anti-shouting; no fonts/sizes |
