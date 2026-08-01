# GMRLOG — Sprint F3.6: Components, Forms, States & Search Experience

**Document:** `docs/03_UX/F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F3.6 (UX Components, Forms, States & Search Experience — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UX Components & States Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution — especially F2.10 Discover · F2.16 Premium · F2.18 · F2.19 · F2.20 · F2.29 |
| 5 | [`F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md`](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) |
| 6 | [`F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md`](./F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) |
| 7 | [`F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md`](./F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) |
| 8 | [`F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md`](./F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) |
| 9 | [`F3_5_MOTION_ANIMATION_PHILOSOPHY.md`](./F3_5_MOTION_ANIMATION_PHILOSOPHY.md) |
| 10 | **This document** — Components, Forms, States & Search Experience |

Never contradict previous freezes.

Never modify F1 · F2 · F3.1–F3.5.

This sprint answers:

> “How should the interface consistently communicate and collect information?”

rather than:

> “What should buttons or forms look like?”

| Does | Does not |
|------|----------|
| Define behavioral philosophy of reusable elements & states | Specify visuals · tokens · RN · engineering APIs |
| Bind later component libraries to calm/honest patterns | Invent new product pillars or nav roots |
| Align search/filter feel with F2.10 taste-first | Turn search into engagement trap |

Subordinate: [`COMPONENT_LIBRARY.md`](../02_DESIGN/COMPONENT_LIBRARY.md), F1 signatures, later form/search specs.

---

## Scope

**In scope:** Component consistency · buttons · inputs · text fields/areas · toggles · checkboxes · radios · dropdowns · pickers · chips · badges · tags · search field · filters · sort · empty/loading/skeleton/error/success/offline/no-results/first-use/permission states · validation · form completion · confirmation · recovery · accessibility implications · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| UI mockups |
| Component visuals |
| Colors |
| Typography tokens |
| Motion implementation |
| Design system implementation |
| React Native |
| Backend |
| Database |
| Algorithms |
| Engineering specifications |
| Sprint F3.6.1+ |

**Gate:** Stop after freeze. Do **not** continue to Sprint F3.6.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Component Philosophy |
| 3 | Form Philosophy |
| 4 | Input Philosophy |
| 5 | Validation Philosophy |
| 6 | Search Philosophy |
| 7 | Filter & Sort Philosophy |
| 8 | Loading States |
| 9 | Empty States |
| 10 | Error & Recovery Philosophy |
| 11 | Success States |
| 12 | Offline Philosophy |
| 13 | Accessibility Relationship |
| 14 | Consistency Rules |
| 15 | Anti-Manipulation |
| 16 | Future Ready |
| 17 | Emotional Goal |
| 18 | Audit Checklist |

---

# 1. Mission

Define how reusable interface elements should **behave** across GMRLOG before visual implementation.

Components and states exist so players can communicate intent and receive honest system status inside a calm premium gaming home.

They never exist to decorate, coerce, or farm interaction.

---

# 2. Component Philosophy

Components support **understanding**.

Never decoration.

| Always | Never |
|--------|-------|
| Communicate intention clearly | Pressure |
| Reuse consistent meaning across rooms | Invent one-off dialects per screen |
| Fit F3.3 hierarchy (primary vs secondary controls) | Equal shouting of all controls |
| Obey F3.4 feedback ethics | Treat controls as engagement toys |
| Compose F1 signatures where applicable | Parallel component religions |

## Control classes (philosophy)

| Class | Role |
|-------|------|
| Buttons | Declare intent · weight matches consequence |
| Toggles / checkboxes / radios | Binary or exclusive choice · reversible where possible |
| Dropdowns / pickers | Choose from known sets without fake scarcity |
| Chips / tags | Filter or label — not vanity badges as reputation (F2.13) |
| Badges | Status honesty — never FOMO counters as identity |

Buttons communicate intention.

Never pressure.

---

# 3. Form Philosophy

Forms **reduce effort**.

Never create friction for its own sake.

| Forms should | Forms must never |
|--------------|------------------|
| Ask only what the task requires | Harvest for unspecified future monetization (F2.27) |
| Progress calmly toward completion | Guilt incomplete profiles into belonging |
| Preserve draft dignity where authorship matters (F2.12) | Trap players in mandatory fields for growth (F2.25) |
| Align with one primary purpose per screen (F3.1) | Compete with reading corridors |

Form completion is success of intent — not a gamified checklist.

---

# 4. Input Philosophy

Inputs are contracts of clarity.

| Input type | Philosophy |
|------------|------------|
| Text fields | Single-line intent · labels honest |
| Textareas | Long-form authorship · reading comfort first (F3.1 · F2.18) |
| Search field | Orientation tool — see §6 |
| Sensitive inputs | Consent & privacy visible (F2.27 · F2.20) |

| Inputs should | Must never |
|---------------|------------|
| Show what is editable | Hide requiredness until punish-time |
| Support assistive & multi-input paths | Gesture-only critical entry |
| Match validation timing to kindness (§5) | Surprise format traps |

---

# 5. Validation Philosophy

Validation **guides**.

Never punishes.

| Validation should | Must never |
|-------------------|------------|
| Explain how to succeed | Blame the player |
| Appear close to the field of meaning | Misleading rules that change after submit |
| Prefer prevention over post-blame | Fake errors to drive Premium (F2.16 · F2.26) |
| Respect Auth / identity rules already frozen (F2.2) | Invent darker local laws |

No misleading validation.

Confirmation patterns remain respectful — never dramatic (F3.4).

---

# 6. Search Philosophy

Search helps **orientation**.

Never traps exploration.

| Search should | Must never |
|---------------|------------|
| Remain taste-first & explainable (F2.10 · F2.19) | Become engagement slot |
| Clarify scope (global vs library vs community) | Mystery ranking as fate |
| Land in named rooms (F3.2) | Infinite compulsive result theater |
| Support no-results with dignity (§9) | Fake urgency “trending now” as trap |

Search field philosophy: calm entry · clear cancel/exit · results subordinate to comprehension hierarchy (F3.3).

Universal search remains exploration — not a funnel.

---

# 7. Filter & Sort Philosophy

Filters and sort **organize** exploration and archives.

| May | Must never |
|-----|------------|
| Reduce noise for intent | Sell better ranking as Premium (F2.16) |
| Persist player preference with agency (F2.20) | Reset hostilely to drive rediscovery addiction |
| Stay secondary to primary content | Outshout results |
| Be progressive for advanced depth (F3.3) | Hide critical safety filters |

Sort communicates order honesty.

Not manufactured “for you” theater without explainability.

---

# 8. Loading States

Loading communicates **honesty** (F3.4 · F3.5).

Never builds anticipation.

| Loading / skeleton should | Must never |
|---------------------------|------------|
| Preserve layout orientation | Engagement-oriented shimmer personality |
| Signal work without drama | Artificial wait |
| Yield quietly to content | Reward the wait |

Skeleton philosophy: structure first · meaning later · no casino pulse.

---

# 9. Empty States

Empty states **inspire next steps**.

Never create guilt.

| Empty / first-use / no-results should | Must never |
|---------------------------------------|------------|
| Explain where the player is | Shame “you have nothing” |
| Offer one calm next action | Addictive empty-state recommendation walls |
| Respect guest/browse dignity (F2.2) | Forced signup as the only empty CTA everywhere |
| Stay sparse (F2.19) | Fake scarcity inventory |

First-use states teach by orientation — not by feature dump (F3.1 Learning Curve).

Permission request states: clear purpose · refuse without losing Digital Home core (F2.27) · no manipulative stacking.

---

# 10. Error & Recovery Philosophy

Errors **teach recovery** (F3.1 · F3.4).

Never blame users.

| Always | Never |
|--------|-------|
| What · why · how to recover | Shame copy |
| Preserve entered intent when possible | Wipe forms as punishment |
| Offer exit / retry / help path | Dead ends |
| Align Trust transparency (F2.17) | Mysterious failures |

Recovery philosophy: restore agency quickly.

The house remains enterable after a stumble.

---

# 11. Success States

Success confirms **quietly**.

Never celebrates trivial actions.

| Success should | Must never |
|----------------|------------|
| Match consequence weight | Confetti for follows / toggles |
| Allow continued flow | Modal victory for routine saves |
| Prefer inline certainty | Retention spectacle |

Align F3.4 Success Philosophy.

---

# 12. Offline Philosophy

Offline is a **honest room state**, not a failure of the player.

| Offline should | Must never |
|----------------|------------|
| Explain limits calmly | Guilt connectivity |
| Preserve readable local meaning when possible | Fake online completeness |
| Recover without dark re-engagement hooks | Turn reconnect into a celebration farm |

Offline is continuity under constraint.

Not a growth moment.

---

# 13. Accessibility Relationship

Component/state philosophy must be realizable accessibly (F2.18 · F3.1–F3.5).

| Implication |
|-------------|
| Labels · roles · states communicable without color alone |
| Errors associated with fields meaningfully |
| Search/filter operable by keyboard / assistive tech paths |
| Loading/empty/error not motion-dependent for meaning |
| Touch targets & focus honest (philosophy) |
| Forms completable without gesture-only traps |

Implementation out of scope.

Capability mandatory.

---

# 14. Consistency Rules

| Rule |
|------|
| Same control · same meaning across Home · Discover · Library · Profile |
| Same state class · same recovery grammar |
| Search field behavior stable whether global or scoped |
| Validation voice consistent with Auth and publishing |
| Empty/loading/error/success feel like one house |
| Buttons’ destructive vs primary weights never swap casually |
| Chips/tags/badges never silently become reputation systems |

Consistency is how the interface “always helps me succeed.”

---

# 15. Anti-Manipulation

Explicit bans:

| Ban |
|-----|
| Addictive empty-state recommendations |
| Fake urgency |
| Misleading validation |
| Engagement-oriented loading |
| Dark-pattern confirmations |
| Manipulative permission requests |
| Artificial friction to drive Premium |
| Guilt empty states |
| Success spectacle as retention |
| Search traps / compulsive result mills |
| Sold sort/rank disguised as filters (F2.16) |
| Badge/chip vanity as bought status |

If a component pattern’s best argument is conversion pressure, it is illegitimate.

---

# 16. Future Ready

Reserve architecture only:

| Capability |
|------------|
| Formal component behavior map bound to F1 catalog |
| Form patterns for creator publishing & settings |
| Search scope grammar appendix |
| State catalog (empty · loading · error · offline · permission) |
| Validation message tone guide (non-visual) |

No visuals · no tokens · no RN · no engineering schemas.

---

# 17. Emotional Goal

The interface should feel like:

> “The interface always helps me succeed.”

Never:

> “I don’t know what the interface wants.”

Never:

> “The interface is manipulating my choices.”

---

# 18. Audit Checklist

- [ ] Answers how interface communicates/collects — not how it looks  
- [ ] Components support understanding · forms reduce effort · search orients  
- [ ] Validation guides · errors recover · success quiet · empty inspires without guilt  
- [ ] Loading/skeleton honest · offline calm · permissions non-manipulative  
- [ ] Search/filter/sort taste-first · explainable · not traps  
- [ ] Accessibility implications acknowledged  
- [ ] Anti-manipulation bans explicit  
- [ ] Compatible with F1 · F2 · F3.1–F3.5 · never modifies them  
- [ ] No mockups · visuals · colors · type tokens · motion/DS impl · RN · eng specs · F3.6.1  

---

## Final gate

### APPROVED

**Sprint F3.6 — Components, Forms, States & Search Experience LOCKED.**

Stop.

Do **NOT** continue to Sprint F3.6.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md](./F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) | Feedback · dialogs · loading feel |
| [F3_5_MOTION_ANIMATION_PHILOSOPHY.md](./F3_5_MOTION_ANIMATION_PHILOSOPHY.md) | Skeleton/loading motion ethics |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](./F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) | Control hierarchy · progressive disclosure |
| [F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) | Errors teach · calm home |
| [SPRINT_F2_10_DISCOVER_SEARCH.md](../02_DESIGN/SPRINT_F2_10_DISCOVER_SEARCH.md) | Taste-first search |
| [SPRINT_F2_16_PREMIUM_MEMBERSHIP.md](../02_DESIGN/SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) | No friction-for-Premium |
| [SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md](../02_DESIGN/SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md) | Sparse explainable suggestions |
| [SPRINT_F1_FOUNDATION.md](../02_DESIGN/SPRINT_F1_FOUNDATION.md) | Signature components |
| [COMPONENT_LIBRARY.md](../02_DESIGN/COMPONENT_LIBRARY.md) | Subordinate component specs |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Recognizability · restraint |
| [F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md](./F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md) | Error/empty/success voice · no FOMO copy |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Components/forms/states/search constitution: honest controls, guiding validation, taste-first search, non-guilt empty states, anti-manipulation bans |
