# GMRLOG — Sprint F4.7: Interaction Components Philosophy

**Document:** `docs/04_UI/F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F4.7 (Interaction Components Philosophy — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UI Component Constitution

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
| 10 | [`F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md`](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) |
| 11 | [`F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md`](./F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md) |
| 12 | **This document** — Interaction Components Philosophy |

Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.1–F4.6.

This sprint answers:

> “How should UI components behave as objects inside GMRLOG?”

rather than:

> “Which buttons, cards, inputs, or design-system specs should we build?”

| Does | Does not |
|------|----------|
| Define component philosophy · object responsibility · predictability | Design buttons · cards · inputs · dropdowns |
| Define semantic component families (roles only) | Specify UI · Figma · RN components · design system |
| Prepare later component systems | Implement components |

| Layer | Defines |
|-------|---------|
| F4.1 | Visual philosophy |
| F4.2 | Color language |
| F4.3 | Typography language |
| F4.4 | Spatial language |
| F4.5 | Physical digital environment |
| F4.6 | Visual symbol language |
| **F4.7** | Interaction object philosophy |

Later Button / Card / Input systems and `COMPONENT_LIBRARY.md` must obey this constitution. On conflict, **F4.7 + F4.6–F4.1 + F3 (esp. F3.4 · F3.6) + F2 + Master** win.

Master · F1 remain higher-law foundations. F3.6 already locked component *experience* philosophy — F4.7 locks how those objects behave as **UI citizens** without inventing specs.

**Gate:** Stop after freeze. Do **not** continue to Sprint F4.8.

---

## Scope

**In scope:** Component philosophy · function before form · semantic families · interaction objects · predictability · cognitive simplicity · Digital Home relationship · accessibility implications · consistency · anti-manipulation · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Buttons · cards · inputs · dropdowns |
| Component specifications · variants · props |
| Design system implementation |
| Figma · RN · engineering |
| Sprint F4.7.1+ · F4.8 |

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Component Philosophy |
| 3 | Function Before Form |
| 4 | Semantic Component Families |
| 5 | Interaction Objects |
| 6 | Predictability |
| 7 | Cognitive Simplicity |
| 8 | Relationship With Digital Home |
| 9 | Accessibility Relationship |
| 10 | Consistency Rules |
| 11 | Anti-Manipulation |
| 12 | Future Ready |
| 13 | Emotional Goal |
| 14 | Audit Checklist |

---

# 1. Mission

Define how UI components behave as objects inside GMRLOG **before** any component is designed.

Components exist to reinforce:

| Reinforce |
|-----------|
| Clear interaction |
| Predictable affordance |
| Trust |
| Reduced cognitive load |
| Continuity of place |

Components never exist to maximize engagement.

F3 answered how interaction *feels*.

F4.7 answers how interaction *objects* should behave — without drawing them.

---

# 2. Component Philosophy

Components communicate interaction.

Never decoration.

| Always | Never |
|--------|-------|
| Enable action | Decorate the screen |
| Clarify possibility | Invent mystery |
| Support hierarchy | Fight hierarchy |
| Express confidence | Express excitement |
| Reduce friction | Perform complexity |

A component is a citizen of the room.

Not furniture for show.

Align F4.1: clarify > decorate · F3.4 · F3.6 experience law.

---

# 3. Function Before Form

Every component should answer:

> Why does this object exist?

before:

> What does it look like?

Form follows responsibility.

Appearance follows meaning (F3.3 · F4.1–F4.5).

If purpose cannot be stated, the object does not belong.

---

# 4. Semantic Component Families

Components should be organized by **meaning**.

Future semantic families include:

| Family |
|--------|
| Navigation |
| Actions |
| Content |
| Input |
| Selection |
| Feedback |
| Containers |
| Dialogs |
| System |
| Discovery |
| Community |
| Library |

Only roles — never designs.

No family may exist solely for aesthetics.

Roles precede specification. Specs arrive in later F4 / design-system work under F3.6.

---

# 5. Interaction Objects

Every component is an object with **one clear responsibility**.

Never multifunctional by default.

| Principle |
|-----------|
| One job per object |
| Secondary duties require explicit composition |
| Ambiguous objects become dark patterns |
| Composition > overloaded widgets |

If an object tries to do everything, it teaches nothing.

---

# 6. Predictability

Components must always behave consistently.

Never surprise users.

| Rule |
|------|
| Same control → same outcome class |
| Same state language across rooms |
| No screen invents private interaction rules |
| Learning once should transfer everywhere |

Surprise is for games players choose — not for chrome.

Align F3.1 · F3.4 · F3.10 cross-platform parity.

---

# 7. Cognitive Simplicity

Components reduce thinking.

Never increase thinking.

| Always | Never |
|--------|-------|
| Make next step obvious | Require decoding |
| Match mental models | Invent jargon objects |
| Collapse complexity | Expose platform machinery |
| Support recovery | Trap users |

Cognitive load is a product cost (F3.1). Components pay it down — or they fail.

---

# 8. Relationship With Digital Home

Components should disappear behind the experience.

The player remembers the **room**.

Not the widgets.

| Feel |
|------|
| Shelves · collections · conversations · journeys |
| Not a control panel of competing gadgets |

Digital Home is inhabited place (F4.5) — components are quiet tools of inhabitation.

---

# 9. Accessibility Relationship

Components must remain compatible with [F2.18](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) and F3.

Meaning must never rely only on:

| Forbidden sole carriers |
|-------------------------|
| Color |
| Motion |
| Icon |

Affordances need labels · roles · states · recoverable focus · keyboard/assistive paths where platforms require them.

Accessibility is constitutional.

Not optional.

This freeze does **not** specify a11y implementation details — those remain under F2.18 · subordinate `ACCESSIBILITY.md`.

---

# 10. Consistency Rules

| Rule |
|------|
| Same interaction → same component family |
| Same responsibility → same object |
| Same feedback → same behavior |
| Same state → same semantic treatment (F3.6 · F4.2) |
| Component hierarchy follows F3.3 · F4.4 · F4.5 |

Inconsistent object behavior is design debt (F3.12).

---

# 11. Anti-Manipulation

Explicit bans:

| Banned |
|--------|
| Fake buttons |
| Deceptive affordances |
| Hidden actions |
| Dark patterns |
| Misleading interaction |
| Engagement-first components |
| Confirm-shaming · trick defaults · disguised ads as UI |

If a component primarily increases engagement rather than understanding or agency, it is unconstitutional.

Align F2.20 · F2.22 · F2.29 · F3.12 · F4.1–F4.6.

---

# 12. Future Ready

Reserve architecture only (no designs · no specs · no implementation):

| Reserved for later F4 / design system |
|---------------------------------------|
| Button System |
| Card System |
| Inputs |
| Dialogs |
| Bottom Sheets |
| Menus |
| Navigation Components |
| Lists |
| Collection Components |
| Feedback Components |

F4.7 defines the citizenship rules.

Later work issues passports to specific objects.

---

# 13. Emotional Goal

Players should feel:

> “Every interaction behaves exactly as I expect.”

Never:

> “Every screen invents its own interaction rules.”

Never:

> “I have to relearn the interface in every room.”

---

# 14. Audit Checklist

- [ ] Answers how components behave as objects  
- [ ] Function before form  
- [ ] Semantic families defined (roles only)  
- [ ] One clear responsibility per object  
- [ ] Predictability protected  
- [ ] Cognitive simplicity protected  
- [ ] Digital Home · widgets disappear behind place  
- [ ] Accessibility acknowledged · color/motion/icon alone forbidden  
- [ ] Consistency rules explicit  
- [ ] Anti-manipulation explicit  
- [ ] Compatible with F1 · F2 · F3 · F4.1–F4.6  
- [ ] No buttons/cards/inputs designed · no specs · no implementation  
- [ ] Ready for F4.8  

---

## Final gate

### APPROVED

**Sprint F4.7 — Interaction Components Philosophy LOCKED.**

Stop.

Do **NOT** continue to Sprint F4.8.

---

## Related documents

| Doc | Role |
|-----|------|
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) | UI Foundation · clarify > decorate |
| [F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) | Containers · place · inhabited home |
| [F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md](./F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md) | Symbols components may use |
| [F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md](../03_UX/F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) | Interaction feel law |
| [F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md](../03_UX/F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md) | Component *experience* constitution |
| [F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md](../03_UX/F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md) | UX governance · design debt |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | A11y constitution |
| [SPRINT_F2_20_SETTINGS_PERSONALIZATION.md](../02_DESIGN/SPRINT_F2_20_SETTINGS_PERSONALIZATION.md) | Agency · anti dark patterns kinship |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |
| [F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md](./F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) | **LOCKED** Design System law · governs all citizens |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Interaction object philosophy: function before form; semantic families; predictability; no component specs |
