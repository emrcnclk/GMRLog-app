# GMRLOG — Sprint F4.8: Component Design System Constitution

**Document:** `docs/04_UI/F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F4.8 (Component Design System Constitution — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Design System Constitution · Component Governance

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution ([`SPRINT_F2_29`](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) closes F2) |
| 5 | Entire F3 UX Constitution (F3.1–F3.12) — especially F3.4 · F3.6 · F3.12 |
| 6 | [`F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md`](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) |
| 7 | [`F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md`](./F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md) |
| 8 | [`F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md`](./F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md) |
| 9 | [`F4_4_GRID_LAYOUT_SPACING_SYSTEM.md`](./F4_4_GRID_LAYOUT_SPACING_SYSTEM.md) |
| 10 | [`F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md`](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) |
| 11 | [`F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md`](./F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md) |
| 12 | [`F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md`](./F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md) |
| 13 | **This document** — Component Design System Constitution |

Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.1–F4.7.

This sprint answers:

> “How should every UI component inside GMRLOG exist?”

rather than:

> “How should a button look?”

| Does | Does not |
|------|----------|
| Govern existence · taxonomy · composition · communication · states · scalability · governance of all reusable UI objects | Design any specific component · define appearance · tokens · pixels |
| Define how components relate, nest, own information, and scale | Figma · React Native · implementation · COMPONENT_LIBRARY specs |

| Layer | Defines |
|-------|---------|
| F4.7 | How components behave as interaction objects |
| **F4.8** | How the Design System of components exists, scales, and governs |

F4.7 = citizenship of objects.  
F4.8 = constitution of the system those citizens form.

Subordinate `COMPONENT_LIBRARY.md`, design tokens, and later component specs must obey this constitution. On conflict, **F4.8 + F4.7–F4.1 + F3.6 + F3.12 + F2 + Master** win.

**Gate:** Stop after freeze. Do **not** continue to Sprint F4.9.

---

## Scope

**Governs all reusable interface objects**, including (non-exhaustive):

Buttons · Cards · Lists · Forms · Inputs · Selectors · Dropdowns · Navigation · Tabs · Menus · Sheets · Dialogs · Modals · Overlays · Snackbars · Toasts · Search · Badges · Tags · Chips · Progress · Loading · Skeletons · Timeline items · Review blocks · Game blocks · Library objects · Creator objects · Profile objects · and every future reusable UI object.

**In scope:** Component philosophy · taxonomy · responsibilities · composition · containers · interaction & information ownership · hierarchy · communication · nesting · reuse · scalability · state classes · domain component philosophies · accessibility · cross-platform · design debt · anti-patterns · governance · audit.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Button / card / input design |
| Tokens · HEX · px · radius · shadow recipes |
| Props · variants · API specs |
| Figma · RN · code |
| Sprint F4.8.1+ · F4.9 |

---

## Table of contents

| Part | §§ | Title |
|------|----|-------|
| A | 1–3 | Mission · Philosophy · Taxonomy |
| B | 4–8 | Responsibilities · SRP · Composition · Containers · Interaction |
| C | 9–13 | Information ownership · Hierarchy · Communication · Nesting · Reuse |
| D | 14–15 | Scalability · State system |
| E | 16–21 | Loading · Empty · Error · Disabled · Success · Selection |
| F | 22–27 | Navigation · Content · Feedback · Form · Overlay · Search philosophies |
| G | 28–32 | Accessibility · Cross-platform · Design debt · Anti-patterns · Governance |
| H | 33–34 | Emotional goal · Audit checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the constitutional architecture of GMRLOG’s component Design System **before** any component is specified.

Every reusable UI object must exist to:

| Exist to |
|----------|
| Enable clear interaction |
| Preserve predictability across rooms |
| Scale without fragmenting identity |
| Compose into Digital Home — not dashboards |
| Protect Trust · Accessibility · Agency |

Components never exist to maximize engagement, invent local languages, or decorate screens.

This document is the **system law**.  
Later specs are statutes.  
Implementation is enforcement.

---

# 2. Component Philosophy

## 2.1 Existence

A component may exist only when:

| Condition |
|-----------|
| It has a named semantic responsibility |
| That responsibility is reusable across contexts |
| It does not duplicate an existing family |
| It can be composed without inventing private rules |
| It remains compatible with F3.6 · F4.7 |

If a UI need is one-off and non-reusable, it is a **screen assembly** — not a Design System citizen — until reuse is proven.

## 2.2 Nature

Components are **system objects**, not visual ornaments.

| Always | Never |
|--------|-------|
| Carry one primary job | Carry fashion |
| Speak the shared language | Invent dialect |
| Scale through composition | Scale through forks |
| Disappear behind place | Compete with place |

Reference F4.7 for object citizenship; this section binds citizenship to **system membership**.

## 2.3 Design System posture

The Design System is a **shared language of construction**.

| Posture | Meaning |
|---------|---------|
| Coherent | Same grammar everywhere |
| Extensible | New citizens join by law |
| Constraining | Freedom within roles — not chaos |
| Humble | Serves Digital Home · never becomes the product |

GMRLOG players should never feel the Design System.  
They should feel the home.

## 2.4 Relationship to prior law

| Document | Role relative to F4.8 |
|----------|----------------------|
| F3.6 | How components / forms / states / search should *feel* |
| F4.7 | How objects behave as citizens |
| F4.1–F4.6 | Languages objects may speak (visual · color · type · space · surface · symbol) |
| **F4.8** | How the society of objects is organized and governed |

Do not restate those philosophies here — obey them.

---

# 3. Component Taxonomy

## 3.1 Taxonomic law

Every component belongs to **exactly one primary taxonomic family**.

Secondary affinities may exist; primary family owns governance.

## 3.2 Primary families

| Family | Exists to | Examples of roles (not designs) |
|--------|-----------|----------------------------------|
| Navigation | Move between rooms / structures | Tabs · menus · wayfinding · pagination roles |
| Actions | Commit or propose change | Primary / secondary / destructive action roles |
| Content | Present cultural meaning | Review · game · library · profile · creator blocks |
| Input | Capture player intent | Text · selection · composition fields |
| Selection | Choose among options | Pickers · toggles · multi-select roles |
| Feedback | Report system / outcome state | Toast · snackbar · inline status · progress roles |
| Containers | Group related meaning | Sections · lists · collection frames |
| Overlays | Temporary focus layers | Dialog · modal · sheet · menu layers |
| Discovery | Find & filter culture | Search · filter · sort control roles |
| System | Platform housekeeping | Settings controls · permission prompts · chrome utilities |
| Community | Social / guild structure | Member · thread · invite interaction roles |
| Library | Memory & collection structure | Shelf · entry · ownership-status roles |

Families align F4.7 semantic groups; F4.8 makes them **taxonomic law** for the Design System.

## 3.3 Domain content objects

Content family includes domain objects that express GMRLOG culture:

| Domain object class | Anchors |
|---------------------|---------|
| Game blocks | F2.4 · F3.8 |
| Review blocks | F2 · F3.8 · F3.11 |
| Library objects | F2.6 · F3.7 |
| Profile objects | F2.5 · F3.7 |
| Creator objects | F2.12 · F3.9 |
| Timeline items | F2.14 · F3.7 · F3.8 |
| Community objects | F2.8 · F2.11 · F3.9 |

Domain objects obey the same system laws as generic controls — culture does not exempt them from taxonomy, SRP, or states.

## 3.4 Classification rules

| Rule |
|------|
| New component proposals must declare primary family |
| Cross-family hybrids require governance review (§32) |
| Renaming a family requires constitutional amendment — not silent drift |
| “Utility” or “misc” is not a valid primary family |

## 3.5 Atomic vs composite (conceptual)

| Level | Meaning |
|-------|---------|
| Atomic citizen | Smallest reusable responsibility |
| Molecular pattern | Legal composition of atoms |
| Organism pattern | Domain-meaningful composition |
| Template | Page assembly — not a DS citizen by default |

Levels describe **scale of composition**, not a license to skip SRP.

---

# PART B — RESPONSIBILITY & COMPOSITION

---

# 4. Component Responsibilities

## 4.1 Responsibility contract

Every component must publish (in later specs — not here) a responsibility contract covering:

| Contract element |
|------------------|
| Primary job |
| What it owns |
| What it must not own |
| Valid parent contexts |
| Valid child contexts |
| State classes it participates in |

This constitution locks the **requirement** for contracts — not their content.

## 4.2 Responsibility classes

| Class | Duty |
|-------|------|
| Structural | Organize space / hierarchy |
| Interactive | Accept player action |
| Informative | Present meaning without commanding |
| Transitional | Bridge states / rooms |
| Protective | Prevent error · confirm irreversible acts |

A component’s class must be declared. Mixing Protective with Informative casually is unconstitutional.

## 4.3 Responsibility boundaries

| May | Must not |
|-----|----------|
| Own its interaction model | Own unrelated domain policy |
| Own local presentation hierarchy | Override page-level F3.3 hierarchy |
| Emit events / intents | Silently mutate distant system state as UX surprise |
| Compose children | Absorb children’s jobs |

## 4.4 Shared vs exclusive responsibility

| Kind | Rule |
|------|------|
| Shared system behaviors (focus, disabled honesty) | Belong to system law — not reinvented per screen |
| Exclusive domain meaning | Owned by the domain content citizen |
| Chrome responsibilities | Remain secondary to content |

---

# 5. Single Responsibility Principle

## 5.1 Law

**One component · one primary responsibility.**

Secondary behaviors require explicit composition — not silent overload.

## 5.2 Violation signals

| Signal | Interpretation |
|--------|----------------|
| “Also does X” without composition | Likely SRP breach |
| Multiple competing CTAs inside one atomic control | Likely SRP breach |
| Navigation + irreversible commit in one object | Governance review required |
| Content block that also is a form and a dialog | Split |

## 5.3 Remediation

| Path |
|------|
| Split into composing citizens |
| Elevate shared behavior to a pattern — not a frankenstein object |
| Demote one-off overload to screen assembly until reused |

Align F4.7 Interaction Objects.

## 5.4 SRP and signatures

F1 signature components remain identity anchors **and** still obey SRP. Signature status is prestige of craft — not exemption from law.

---

# 6. Composition Rules

## 6.1 Composition philosophy

GMRLOG scales by **composition**, not by forking.

| Prefer | Avoid |
|--------|-------|
| Small citizens composing larger meaning | Giant exclusive widgets per screen |
| Shared patterns | Copy-paste variants with private rules |
| Explicit slots / regions (conceptually) | Hidden side effects between siblings |

## 6.2 Composition legality

Composition is legal when:

| Condition |
|-----------|
| Parent family’s container rules allow the child (§7) |
| Nested depth remains comprehensible (§12) |
| Information ownership remains clear (§9) |
| Accessibility tree remains coherent (§28) |
| No anti-pattern from §31 |

## 6.3 Composition illegality

| Illegal |
|---------|
| Composing overlays inside overlays without governance |
| Nesting forms inside forms without explicit multi-step pattern |
| Placing irreversible Actions inside Discovery filters as default |
| Using Feedback objects as permanent navigation |

## 6.4 Pattern vs component vs template

| Term | Meaning |
|------|---------|
| Component | Reusable citizen with SRP |
| Pattern | Recurring legal composition of citizens |
| Template | Page-level assembly of patterns (not a DS citizen by default) |

Patterns are governed; templates must not invent component law.

## 6.5 Composition documentation duty

Later specs must declare:

| Declare |
|---------|
| Allowed children |
| Required children (if any) |
| Forbidden children |
| Slot meaning (conceptual regions) |

Undeclared composition becomes tribal knowledge — and drift.

---

# 7. Container Relationships

## 7.1 Container duty

Containers **group related meaning** (F4.5 · F4.7).

They must:

| Must |
|------|
| Clarify ownership of content |
| Preserve reading corridors (F4.4) |
| Remain quieter than content |
| Not imprison information |

## 7.2 Container types (roles)

| Role | Purpose |
|------|---------|
| Section container | Thematic grouping |
| List container | Homogeneous sequences |
| Collection container | Cultural shelves / sets |
| Form container | Intent capture grouping |
| Overlay container | Temporary focus grouping |

## 7.3 Parent–child matrix (constitutional)

| Parent | Typical children | Forbidden by default |
|--------|------------------|----------------------|
| Section | Content · Actions · Lists | Nested overlays |
| List | Homogeneous content / rows | Heterogeneous dialogs as rows |
| Collection | Library / game / review objects | System chrome |
| Form | Inputs · Selection · inline Feedback | Navigation families as fields |
| Overlay | Content · Actions · Forms | Permanent Navigation chrome |

Exceptions require governance (§32).

## 7.4 Container silence

If removing the container’s visual presence does not harm understanding or interaction grouping, the container is over-decorated — fix appearance later under F4.1 · F4.5; do not invent new container types for fashion.

## 7.5 List homogeneity

Lists should contain **peers**.

Mixing unrelated object classes in one list without sectioning is hierarchy violence (F3.3).

---

# 8. Interaction Relationships

## 8.1 Interaction chain

Components participate in chains:

```
Affordance → Intent → Confirmation (if needed) → Outcome → Feedback
```

| Stage | Owner class |
|-------|-------------|
| Affordance | Actions · Selection · Input · Navigation |
| Intent | Player |
| Confirmation | Protective Actions / Overlay |
| Outcome | System |
| Feedback | Feedback family |

## 8.2 Relationship rules

| Rule |
|------|
| Actions must not hide irreversible outcomes |
| Inputs must not auto-commit irreversible change without clear pattern |
| Navigation must not masquerade as Action |
| Feedback must not become the only record of important outcomes |
| Selection must not silently trigger Navigation without expectation |

## 8.3 Gesture / platform

Interaction relationships remain stable across platforms (F3.10). Platform gestures may map differently; **meaning of the object** must not.

## 8.4 Action density

Multiple Actions in one region require hierarchy:

| Prefer |
|--------|
| One primary Action |
| Secondary Actions recede |
| Destructive Actions isolated and Protective |

Action piles are cognitive debt.

---

# PART C — INFORMATION, HIERARCHY, COMMUNICATION

---

# 9. Information Ownership

## 9.1 Ownership law

Every piece of meaning on screen has an **owner component**.

| Owner decides |
|---------------|
| What the information is |
| How it updates |
| Whether it is editable |
| How errors about it surface |

## 9.2 Ownership conflicts

| Conflict | Resolution |
|----------|------------|
| Two components claim same fact | One owner · others display by reference |
| Container claims child’s data | Illegal — container groups, does not own domain facts |
| Overlay edits without returning ownership | Illegal — ownership returns to source surface |

## 9.3 Derived information

Derived displays (counts · summaries · badges) are **projections**.

| Rule |
|------|
| Projections must not invent conflicting truth |
| Badge / tag / chip projections follow Content or System ownership — never marketing ownership |
| Stale projections must degrade honestly (Error / Loading philosophy) |

## 9.4 Privacy-bearing information

Where information is privacy-sensitive (F2.27):

| Rule |
|------|
| Owner component must not leak via casual projection |
| System components handling permissions remain Protective / System families |
| UI objects must not coerce disclosure |

---

# 10. Hierarchy Rules

## 10.1 Hierarchy sources

Component hierarchy must reinforce:

| Source |
|--------|
| F3.3 Visual Hierarchy |
| F4.3 Type hierarchy |
| F4.4 Spatial hierarchy |
| F4.5 Surface / elevation hierarchy |

Components never invent a private hierarchy language.

## 10.2 Intra-component hierarchy

Within a content object:

| Order (conceptual) |
|--------------------|
| Primary meaning |
| Supporting meaning |
| Metadata |
| Secondary actions |
| System chrome |

Metadata must not outrank primary meaning (F4.3).

## 10.3 Inter-component hierarchy

| Rule |
|------|
| Page focal purpose outranks local component ambition |
| Temporary overlays outrank background for *focus*, not for *permanent meaning* |
| Feedback is ephemeral — must not permanently reorder page hierarchy |

## 10.4 Competitive hierarchy ban

No two peer components may shout for primary focus in the same corridor without a declared page purpose that ranks them.

---

# 11. Component Communication

## 11.1 Communication philosophy

Components communicate through **explicit, predictable channels** — not telepathy.

| Channel (conceptual) |
|----------------------|
| Parent → child configuration of responsibility |
| Child → parent intents / requests |
| Sibling coordination via shared parent |
| System → Feedback for outcomes |

## 11.2 Communication laws

| Law |
|-----|
| No silent cross-tree mutation as primary UX |
| Destructive intents require explicit confirmation path |
| Loading / error of a child must be representable without crashing parent meaning |
| Communication must remain explainable to accessibility services |

## 11.3 Intent classes

Later specs may name events; constitutionally:

| Intent class | Must feel |
|--------------|-----------|
| Navigate | Movement between places |
| Submit | Commitment of input |
| Select | Choice among options |
| Dismiss | Leaving temporary layer |
| Retry | Recovery from failure |
| Cancel | Abandon without side effect (where promised) |

Misnaming intents is an anti-pattern (§31).

## 11.4 Feedback coupling

| Rule |
|------|
| Outcome owners request Feedback — Feedback does not invent outcomes |
| Multiple Feedbacks for one outcome require orchestration — not spam |

---

# 12. Component Nesting Rules

## 12.1 Nesting depth

Nesting is allowed when meaning remains scannable.

| Guidance |
|----------|
| Prefer shallow trees |
| Deep trees require stronger hierarchy cues (F4.4 · F4.5) — not more decoration |
| Infinite nest of containers is design debt |

## 12.2 Nesting bans (default)

| Ban |
|-----|
| Overlay inside Overlay (unless governed pattern: e.g. confirm within sheet) |
| Dialog inside Dialog as casual nesting |
| Form inside Overlay inside Form |
| List of Overlays |

## 12.3 Nesting of domain objects

Game / Review / Library / Profile objects may nest **metadata and secondary actions**, not rival primary objects that compete for the same focal purpose.

## 12.4 Nesting and performance of meaning

Even without implementation metrics: if nesting forces the player to hold too many contexts, simplify composition — not add chrome.

---

# 13. Component Reuse Rules

## 13.1 Reuse law

Reuse is a first-class good.

| Prefer | Avoid |
|--------|-------|
| Extend existing family | Create parallel twin |
| Parameterize responsibility within family | Fork “SpecialButtonForScreenX” culture |
| Shared state language | One-off state dialects |

## 13.2 When not to reuse

| Do not force reuse when |
|-------------------------|
| Responsibilities conflict (SRP) |
| Domain meaning would be falsified |
| Accessibility contracts cannot be shared honestly |
| Reuse would require deceptive affordances |

Honest new citizen > dishonest reuse.

## 13.3 Signature components

Master / F1 signature components remain higher-law identity anchors.

| Rule |
|------|
| Signatures extend F4.8 law — they do not exempt it |
| Signatures must still declare family · SRP · states |
| Signature status is not a license for dark patterns |

## 13.4 Adoption rule

A screen may assemble citizens; it may **not** invent a private component kit without admission (§32).

---

# PART D — SCALE & STATE

---

# 14. Scalability Philosophy

## 14.1 Scale dimensions

The system must scale across:

| Dimension |
|-----------|
| Number of screens |
| Number of teams |
| Number of platforms |
| Number of locales |
| Number of domain objects |
| Longevity (years) |

## 14.2 Scale laws

| Law |
|-----|
| Growth adds citizens by taxonomy — not by tribal kits |
| Complexity is paid by composition, not by mega-components |
| Localization must not require per-locale component forks (F2.18 · F3.11) |
| New product areas inherit the system — they do not found rival systems |

## 14.3 Versioning of citizens

Later implementation may version components; constitutionally:

| Rule |
|------|
| Breaking interaction meaning requires migration plan |
| Visual refresh must not silently change responsibility |
| Deprecation is explicit (design debt §30) |

## 14.4 Team scale

| Rule |
|------|
| Teams extend the system through governance — not forks |
| Local experiments must be labeled debt or exit to admission |
| “Move fast” does not override Trust · A11y · Anti-manipulation |

---

# 15. State Philosophy

## 15.1 State as meaning

States communicate **condition of meaning**, not decoration.

Align F3.6 state experience; F4.8 binds states to **system-wide obligation**.

## 15.2 Universal state classes

Every interactive citizen must account for applicable classes:

| Class | Meaning |
|-------|---------|
| Resting | Default ready |
| Hover / focus (where platform has) | Attention without commit |
| Pressed / active | Moment of engagement |
| Selected | Chosen among peers |
| Loading | Meaning in transit |
| Empty | Absence of items / content |
| Error | Failure needing recovery |
| Disabled | Unavailable with reason path |
| Success | Completed positive outcome |
| Partial / indeterminate | Progress without full certainty |

Not every component uses every class — but omission must be intentional.

## 15.3 State consistency

| Rule |
|------|
| Same class → same semantic treatment across families (F4.2 · F4.3 · F4.6) |
| State must not rely on color / motion / icon alone (§28) |
| State transitions must be recoverable (F3.4) |

## 15.4 State ownership

| Rule |
|------|
| Parent may orchestrate child states |
| Child owns local honesty of its state |
| Global app state must not falsify local component state |

## 15.5 Concurrent states

When states combine (e.g. Selected + Loading):

| Rule |
|------|
| Declare precedence in later specs |
| Never leave contradictory messages |
| Prefer honest partials over fake certainty |

---

# PART E — STATE CLASS CONSTITUTIONS

---

# 16. Loading Philosophy

| Law |
|-----|
| Loading protects trust during uncertainty |
| Prefer skeleton / structured waiting that preserves layout rhythm (F4.4) |
| Never fake completion |
| Never use loading as engagement theater |
| Long waits need honest progress language (F3.11) |
| Loading must not rearrange hierarchy permanently |
| Region loading preferred over full-home blackout when partial meaning remains usable |

---

# 17. Empty State Philosophy

| Law |
|-----|
| Empty is a place of orientation — not failure shame |
| Explain what can happen next |
| Invite without FOMO (F3.11 · F4.6 illustration rules) |
| Do not fill emptiness with unrelated engagement modules |
| Domain empties (library · reviews · community) stay culture-first |
| Empty ≠ Error — do not reuse Error styling for calm absence |

---

# 18. Error State Philosophy

| Law |
|-----|
| Errors teach and recover (F3.1 · F3.6) |
| Name the problem · offer next step |
| Distinguish blocking vs non-blocking |
| Never blame the player for system failure |
| Never use error styling for marketing urgency |
| Destructive errors require Protective Action paths |
| Inline errors prefer proximity to the owner field / object |

---

# 19. Disabled State Philosophy

| Law |
|-----|
| Disabled means unavailable — with discoverable why when needed |
| Do not disable as dark pattern to force another path |
| Disabled must remain perceivable to assistive tech |
| Prefer prevent-invalid over silent disable when teaching forms |
| Disabled Actions must not look identical to resting Actions |

---

# 20. Success State Philosophy

| Law |
|-----|
| Success confirms meaning calmly |
| Prefer quiet confirmation over celebration explosions |
| Success feedback is ephemeral unless the outcome is a new persistent object |
| Never hijack success into upsell theater |
| Success must not erase the player’s place / orientation |

---

# 21. Selection Philosophy

| Law |
|-----|
| Selection is choice — not commitment unless clearly Action |
| Multi-select must show ownership of the selection set |
| Selection visuals must not rely on color alone |
| Clearing selection must be as clear as selecting |
| Selection must not trap players in irreversible flows |
| Bulk Actions on selections are Protective when destructive |

---

# PART F — DOMAIN FAMILY PHILOSOPHIES

---

# 22. Navigation Component Philosophy

| Law |
|-----|
| Navigation moves between places — never sells |
| Primary destinations remain F2.1 structure |
| Nav chrome stays quieter than content (F4.4 · F4.5) |
| Active location must be obvious without color alone |
| Do not overload Nav with Action / Feedback duties |
| Nested navigation must preserve orientation (F3.2) |

---

# 23. Content Component Philosophy

| Law |
|-----|
| Content carries culture — Game · Review · Library · Profile · Creator · Community |
| Relationship-first / culture-first hierarchies from F2 · F3 remain binding |
| Content objects may include secondary Actions — primary meaning stays content |
| Content must remain readable as long-form first-class (F4.3) |
| Content is not a billboard for engagement modules |
| Spoiler / sensitive content patterns remain honest (product law) |

---

# 24. Feedback Component Philosophy

| Law |
|-----|
| Feedback reports — does not navigate as primary job |
| Ephemeral by default |
| Stacking feedback must not create anxiety walls |
| Severity must map to semantic families (F4.2) honestly |
| Feedback never fakes urgency for engagement |
| Critical Feedback may be persistent until acknowledged — still not promotional |

---

# 25. Form Component Philosophy

| Law |
|-----|
| Forms capture intent with agency (F2.20 · F3.6) |
| Label · error · help relationships are mandatory conceptually |
| Progressive disclosure over interrogations |
| Validation teaches — does not punish |
| Forms must not dark-pattern consent |
| Multi-step forms are patterns — each step remains a Form citizen composition |

---

# 26. Overlay Component Philosophy

| Law |
|-----|
| Overlays create temporary focus (F4.5 elevation = structure not power) |
| Must be dismissible unless legally / safety blocking |
| Must return player to previous place with orientation intact |
| Must not permanently rebrand the room |
| Promotional permanent overlays are banned (§31) |
| Sheets · dialogs · menus share Overlay family law with distinct responsibilities in later specs |

---

# 27. Search Component Philosophy

| Law |
|-----|
| Search is taste-first discovery (F2.10 · F3.6 · F3.8) |
| Query · results · filters are related citizens — not rival apps |
| Empty / loading / error of search obey Part E |
| Search must not become engagement bait ranking theater in the component layer |
| Filters clarify — they do not manipulate scarcity |
| Sort / filter controls remain Selection / Discovery — not Actions of irreversible harm |

---

# PART G — QUALITY, RISK, GOVERNANCE

---

# 28. Accessibility Relationship

Compatible with F2.18 · F3 · F4.2 · F4.3 · F4.6 · F4.7.

| Law |
|-----|
| Name · role · state · value must be expressible |
| Meaning never depends on color · motion · or icon alone |
| Focus order follows reading corridors |
| Hit targets and assistive paths are constitutional obligations for later specs |
| Disabled / error / loading must be announced honestly |
| Custom content objects inherit the same a11y duties as generic controls |

Component Design System without accessibility is unfinished law.

---

# 29. Cross-platform Consistency

Align F3.10 · F4.4 responsive space.

| Law |
|-----|
| Same component meaning on Mobile · Tablet · Desktop |
| Layout may adapt · responsibility must not |
| Platform idioms map to shared taxonomy — not rival taxonomies |
| Web / native differences are adaptation — not identity split |
| Density modes (future) change space — not taxonomy |

---

# 30. Design Debt Rules

Align F3.12.

| Temporary compromise must |
|---------------------------|
| Be documented |
| Have an owner |
| Have a planned resolution |
| Not violate Trust · Privacy · Accessibility · Anti-manipulation |

| Permanent inconsistency |
|-------------------------|
| Unacceptable |

Component forks “just for this screen” without debt record are unconstitutional drift.

| Debt kinds (component layer) |
|------------------------------|
| Taxonomy debt (misc / hybrid without review) |
| SRP debt (overloaded objects) |
| State dialect debt |
| Accessibility debt |
| Fork kit debt |

---

# 31. Anti-patterns

Explicit bans (component layer):

| Anti-pattern |
|--------------|
| Fake buttons / deceptive affordances |
| Hidden actions / mystery meat |
| Dark patterns · confirm-shaming · trick defaults |
| Engagement-first components |
| Permanent promotional overlays |
| Fake badges / casino feedback |
| Loading theater · fake progress |
| Error-as-marketing |
| Success-as-upsell hijack |
| Color-only / icon-only / motion-only meaning |
| Mega-components absorbing whole screens without composition |
| Parallel Design Systems per team |
| Taxonomy “misc” dumping ground |
| Overlay nesting chaos |
| Nav that sells · Feedback that navigates as primary job |
| Content blocks that are secretly ads without disclosure law |
| Disabled-as-coercion |
| Selection-as-trap |
| Silent ownership theft between components |

If a component primarily increases engagement rather than understanding or agency, it is unconstitutional.

Align F2.22 · F2.29 · F3.12 · F4.1–F4.7.

---

# 32. Governance

## 32.1 Admission of new citizens

A new component enters the Design System only when:

| Gate |
|------|
| Primary family declared |
| SRP stated |
| State classes accounted for |
| Accessibility relationship stated |
| Composition parents/children stated |
| Anti-pattern review passed |
| F2.29 Feature Acceptance / F3.12 UX gates considered where feature-linked |
| Does not contradict F4.1–F4.7 |

## 32.2 Change control

| Change type | Requirement |
|-------------|-------------|
| Visual refresh within same responsibility | Design review · no silent meaning change |
| Responsibility change | Governance review · migration |
| New family | Constitutional amendment |
| Deprecation | Debt record · replacement path |
| Signature change | Master / F1-aware review |

## 32.3 Conflict resolution

```
North Star
  → Master → F1 → F2 → F3
  → F4.1–F4.7
  → This document (F4.8)
  → COMPONENT_LIBRARY / tokens / implementation
```

Lower layers never override higher layers.

## 32.4 Review questions

Every significant component change asks:

| Question |
|----------|
| Does it clarify interaction? |
| Does it preserve one responsibility? |
| Does it compose legally? |
| Does it keep Digital Home intact? |
| Does it remain accessible without color/motion/icon alone? |
| Does it avoid engagement manipulation? |

If not — it does not ship as system law.

## 32.5 Stewardship

| Role (conceptual) |
|-------------------|
| Product Design Director — constitutional owner |
| Design System stewards — admission & debt hygiene |
| Feature teams — propose · do not silently fork |

---

# PART H — CLOSE

---

# 33. Emotional Goal

Players should feel:

> “The interface is one craft — every object belongs to the same home.”

Never:

> “Every screen brought its own toolkit.”

Never:

> “I can feel the Design System fighting the product.”

---

# 34. Audit Checklist

### Existence & taxonomy
- [ ] Answers how every UI component should exist  
- [ ] Taxonomy families defined · no misc dumping  
- [ ] Domain objects under same law  
- [ ] Atomic / pattern / template distinction clear  

### Responsibility & composition
- [ ] Responsibility contracts required  
- [ ] SRP explicit  
- [ ] Composition · container · nesting rules explicit  
- [ ] Information ownership explicit  
- [ ] Communication channels & intent classes explicit  
- [ ] Reuse & signature rules explicit  

### States
- [ ] Universal state classes defined  
- [ ] Loading · Empty · Error · Disabled · Success · Selection philosophies locked  

### Families
- [ ] Navigation · Content · Feedback · Form · Overlay · Search philosophies locked  

### Quality
- [ ] Accessibility relationship locked  
- [ ] Cross-platform consistency locked  
- [ ] Design debt rules locked  
- [ ] Anti-patterns explicit  
- [ ] Governance · admission · change control locked  

### Compatibility & purity
- [ ] Compatible with F1 · F2 · F3 · F4.1–F4.7  
- [ ] No button/card/input designs  
- [ ] No tokens · pixels · Figma · RN · implementation  
- [ ] Ready for F4.9  

---

## Final gate

### APPROVED

**Sprint F4.8 — Component Design System Constitution LOCKED.**

Stop.

Do **NOT** continue to Sprint F4.9.

---

## Related documents

| Doc | Role |
|-----|------|
| [F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md](./F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md) | Object citizenship · function before form |
| [F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md](../03_UX/F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md) | Component *experience* constitution |
| [F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md](../03_UX/F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) | Interaction feel |
| [F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md](../03_UX/F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md) | UX governance · debt |
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](./F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) | Visual philosophy |
| [F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md](./F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) | Containers · overlays · place |
| [F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md](./F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md) | Symbol language |
| [F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md](./F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md) | **LOCKED** Motion Language & Transition System |
| [F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md](./F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md) | **LOCKED** Design Token Architecture |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | A11y |
| [SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) | Product acceptance kinship |
| [COMPONENT_LIBRARY.md](../02_DESIGN/COMPONENT_LIBRARY.md) | Subordinate specs (must obey this) |
| [F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md](./F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md) | **LOCKED** Design System governance · lifecycles |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Component Design System Constitution: taxonomy · SRP · composition · ownership · states · family philosophies · governance · anti-patterns; no component specs |
