# GMRLOG — Sprint F4.2: Color Philosophy & Semantic Color System

**Document:** `docs/04_UI/F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F4.2 (Color Philosophy & Semantic Color System — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UI Color Constitution

---

## Authority


| Priority | Document                                                                                                                            |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1        | `[NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md)`                                                                                      |
| 2        | `[MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md)`                                     |
| 3        | `[SPRINT_F1_FOUNDATION.md](../02_DESIGN/SPRINT_F1_FOUNDATION.md)`                                                                   |
| 4        | Entire F2 Product Constitution (`[SPRINT_F2_29](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md)` closes F2) |
| 5        | Entire F3 UX Constitution (F3.1–F3.12)                                                                                              |
| 6        | `[F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md)`                                |
| 7        | **This document** — Color Philosophy & Semantic Color System                                                                        |


Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.1.

This sprint answers:

> “How should color communicate meaning inside GMRLOG?”

rather than:

> “Which hex values should we use?”


| Does                                                                               | Does not                                           |
| ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Define color philosophy · semantic use · emotional role · hierarchy of color usage | Define HEX · palettes · brand color picks          |
| Protect recognizability across themes                                              | Define dark/light themes · gradients               |
| Prepare later token definitions                                                    | Define implementation · accessibility ratio tables |


F4.1 defined how GMRLOG should **visually feel**.

F4.2 defines how **color carries meaning** inside that feel — without choosing paint values.

Subordinate color detail (`DESIGN_TOKENS.md`, theme specs, Figma) must obey this constitution. On conflict, **F4.2 + F4.1 + F3 + F2 + Master** win.

Master · F1 Story Ember remain higher-law brand foundations; this document governs **semantic use** — it does not re-choose brand hues.

**Gate:** Stop after freeze. Do **not** continue to Sprint F4.3.

---



## Scope

**In scope:** Color philosophy · semantic color hierarchy · emotional meaning · primary vs secondary color roles · neutral system philosophy · accent philosophy · status color philosophy · brand identity through color · theme independence · accessibility implications · future reservations.

**Out of scope:**


| Forbidden in this freeze |
| ------------------------ |
| Color tokens             |
| HEX                      |
| RGB                      |
| HSL                      |
| Dark theme               |
| Light theme              |
| Components               |
| Engineering              |
| Sprint F4.2.1+ · F4.3    |


---



## Deliverable map


| §   | Section                        |
| --- | ------------------------------ |
| 1   | Mission                        |
| 2   | Color Philosophy               |
| 3   | Meaning Before Beauty          |
| 4   | Neutral-first Philosophy       |
| 5   | Accent Philosophy              |
| 6   | Semantic Color System          |
| 7   | Emotional Use of Color         |
| 8   | Visual Hierarchy Through Color |
| 9   | Gaming Identity Through Color  |
| 10  | Theme Independence             |
| 11  | Accessibility Relationship     |
| 12  | Consistency Rules              |
| 13  | Anti-Manipulation              |
| 14  | Future Ready                   |
| 15  | Emotional Goal                 |
| 16  | Audit Checklist                |


---



# 1. Mission

Define how color communicates meaning across GMRLOG **before** any palette is created.

Color exists to reinforce:


| Reinforce             |
| --------------------- |
| Clarity               |
| Hierarchy             |
| Trust                 |
| Orientation           |
| Emotional consistency |


Color never exists to maximize engagement.

---



# 2. Color Philosophy

Color communicates meaning.

Never decoration.


| Always             | Never              |
| ------------------ | ------------------ |
| Clarify            | Decorate           |
| Support hierarchy  | Fight hierarchy    |
| Support reading    | Reduce readability |
| Guide attention    | Demand attention   |
| Express confidence | Express excitement |


Color is a language.

Not a costume.

---



# 3. Meaning Before Beauty

Every color must answer:

> Why is this color here?

Not:

> Does it look cool?

Beauty is a consequence.

Meaning is the purpose.

If meaning cannot be stated, the color does not belong.

---



# 4. Neutral-first Philosophy

The interface should primarily rely on **neutral surfaces**.

Color is introduced intentionally.

Not continuously.

The product should remain usable even if all accent colors disappeared.

Neutrals carry the home.

Accents visit with purpose.

---



# 5. Accent Philosophy

Accent colors represent **importance**.

Not decoration.

Accent should:


| Should     |
| ---------- |
| Guide      |
| Orient     |
| Prioritize |


Accent should never:


| Never                 |
| --------------------- |
| Dominate every screen |
| Compete with content  |
| Become visual noise   |


Align F4.1 restraint · Master warm accent discipline as higher law — this freeze does not pick the accent hue.

---



# 6. Semantic Color System

Every color belongs to **meaning** before aesthetics.

Future semantic families include:


| Family      |
| ----------- |
| Primary     |
| Secondary   |
| Success     |
| Warning     |
| Error       |
| Information |
| Interactive |
| Disabled    |
| Background  |
| Surface     |
| Border      |
| Text        |


No semantic category may exist solely for decoration.

Families are roles — not swatches. Values arrive in later F4 / token work.

---



# 7. Emotional Use of Color

Color should reinforce:


| Reinforce     |
| ------------- |
| Calm          |
| Trust         |
| Focus         |
| Craftsmanship |


Never:


| Never                 |
| --------------------- |
| Urgency               |
| Addiction             |
| Artificial excitement |
| Fear of missing out   |


Emotion through color must match F3 calm companion voice — never shout.

---



# 8. Visual Hierarchy Through Color

Hierarchy determines color intensity.

Never the reverse.


| Rule                                           |
| ---------------------------------------------- |
| Primary information receives stronger emphasis |
| Supporting information recedes                 |
| Chrome remains visually quieter than content   |


Align [F3.3](../03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md): meaning → appearance → color emphasis.

---



# 9. Gaming Identity Through Color

Gaming identity should emerge from the **overall system**.

Not from exaggerated saturated colors.

GMRLOG should feel like gaming culture.

Not esports branding.

Culture through atmosphere — not RGB costume (F4.1 kinship).

---



# 10. Theme Independence

Recognition should survive:


| Theme class (reserved) |
| ---------------------- |
| Dark Theme             |
| Light Theme            |
| OLED Theme             |
| High Contrast          |


The interface remains recognizably GMRLOG even if colors change.

Composition · spacing · hierarchy · semantic roles persist; hues may shift.

---



# 11. Accessibility Relationship

Meaning must never depend on color alone.

Every semantic color must have:


| Must have               |
| ----------------------- |
| Structural meaning      |
| Contextual meaning      |
| Readable contrast       |
| Non-color reinforcement |


Accessibility is constitutional ([F2.18](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) · F3 · F4.1).

Not optional.

This freeze does **not** specify WCAG ratio tables — those belong to later token / a11y detail under F2.18 law.

---



# 12. Consistency Rules


| Rule                                      |
| ----------------------------------------- |
| Same semantic meaning → same color family |
| Same interaction → same color behavior    |
| Same state → same semantic treatment      |
| Brand identity preserved across themes    |
| Color hierarchy follows F3.3 hierarchy    |


Inconsistency in color language is design debt (F3.12).

---



# 13. Anti-Manipulation

Explicit bans:


| Banned                           |
| -------------------------------- |
| Red as default engagement driver |
| Artificial urgency colors        |
| Notification red dominance       |
| Flash sale aesthetics            |
| Casino reward colors             |
| Endless bright highlights        |
| Color-based addiction mechanics  |
| Fake scarcity through color      |


If color primarily increases engagement rather than understanding, it is unconstitutional.

Align F2.22 · F2.29 · F3.12 · F4.1.

---



# 14. Future Ready

Reserve architecture only (no HEX · no implementation):


| Reserved for later F4 / tokens |
| ------------------------------ |
| Color Tokens                   |
| Theme System                   |
| Dynamic Themes                 |
| Seasonal Themes                |
| Accessibility Variants         |
| High Contrast Mode             |


F4.2 defines the grammar.

Tokens write the sentences later.

---



# 15. Emotional Goal

Players should feel:

> “The colors quietly help me understand the interface.”

Never:

> “The interface is screaming for my attention.”

Never:

> “Everything is colorful, so nothing feels important.”

---



# 16. Audit Checklist

- [ ] Answers how color should communicate  
- [ ] Meaning before beauty  
- [ ] Neutral-first philosophy  
- [ ] Accent used intentionally  
- [ ] Semantic hierarchy defined  
- [ ] Gaming identity preserved  
- [ ] Theme independence protected  
- [ ] Accessibility acknowledged  
- [ ] Anti-manipulation explicit  
- [ ] Compatible with F1 · F2 · F3 · F4.1  
- [ ] No HEX values  
- [ ] No palettes  
- [ ] No implementation  
- [ ] Ready for F4.3  

---



## Final gate



### APPROVED

**Sprint F4.2 — Color Philosophy & Semantic Color System LOCKED.**

Stop.

Do **NOT** continue to Sprint F4.3.

---



## Related documents


| Doc                                                                                                                               | Role                                 |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md)                                | UI Foundation · visual feel          |
| [F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md](./F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md)                                          | **LOCKED** Typography Philosophy & Type System |
| [F4_4_GRID_LAYOUT_SPACING_SYSTEM.md](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md)                                                        | **LOCKED** Grid, Layout & Spacing System |
| [F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md)                                          | **LOCKED** Surface, Elevation & Layering System |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](../03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md)                                         | Hierarchy law color must obey        |
| [F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md](../03_UX/F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md) | UX governance                        |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md)                   | Color-alone ban · a11y               |
| [SPRINT_F1_FOUNDATION.md](../02_DESIGN/SPRINT_F1_FOUNDATION.md)                                                                   | Visual foundations                   |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md)                                     | Design SSOT · Story Ember higher law |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md)                                                                                      | Supreme product question             |


---



## Revision history


| Version | Date      | Notes                                                                                                                       |
| ------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1.0     | July 2026 | LOCK — Color meaning constitution: neutral-first; semantic families; theme independence; anti-manipulation; no HEX/palettes |


