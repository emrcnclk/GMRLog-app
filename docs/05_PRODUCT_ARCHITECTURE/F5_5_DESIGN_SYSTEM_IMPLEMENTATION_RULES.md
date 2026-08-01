# GMRLOG — Sprint F5.5: Design System & Implementation Rules

**Document:** `docs/05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`  
**Version:** 1.1  
**Status:** **LOCKED**  
**Sprint:** F5.5 (Design System & Implementation Rules — implementation constitution only) · amended by **MVP Final Integration Amendment** (§5 · §20.1)  
**Last Updated:** July 2026  
**Owner:** Product Architecture Director  
**Classification:** Implementation Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | Entire F1 |
| 4 | Entire F2 |
| 5 | Entire F3 |
| 6 | Entire F4 — especially F4.7–F4.13 · F4.10–F4.12 |
| 7 | Entire F5.1 |
| 8 | Entire F5.2 |
| 9 | Entire F5.3 |
| 10 | Entire F5.4 |
| 11 | **This document** |

Never contradict previous freezes.

This document exists to make **implementation consistent**.

It is the final product-architecture document Cursor (and contributors) should treat as the bridge from constitution → build.

This document answers:

> “How should the product be built consistently?”

rather than:

> “How should it look?” · “What features should exist?”

| Does | Does not |
|------|----------|
| Define Design System usage · reuse · naming · layout/responsive/a11y rules · token consumption · state consistency · file organization philosophy · scalability | Choose colors · redesign UI/UX · invent features |
| Close Phase F5 architecture series (when LOCKED) | Backend · DB · API · business logic · ranking · cache · network · Expo config · RN code |

**Gate:** Stop after this specification. No new architecture documents unless they **amend** an existing specification.

---

## Scope

**In scope:** Screen consistency · component reuse · Design System rules · naming · layout consistency · responsive behavior · accessibility · icon usage · typography hierarchy **references** · color/spacing **token usage** (not values) · state consistency · file organization philosophy · reusability · future scalability · implementation constitution.

**Out of scope:** Backend · database · API · business logic · recommendation algorithms · caching · networking · Expo configuration · React Native code · visual redesign.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Implementation Constitution |
| 3 | Relationship to Prior Law |
| 4 | Design System Usage Rules |
| 5 | Component Family Rules |
| 6 | Global Screen Consistency |
| 7 | Token Usage Rules |
| 8 | Typography & Spacing Hierarchy References |
| 9 | Icon Usage |
| 10 | Layout Consistency |
| 11 | Responsive Rules |
| 12 | Accessibility Requirements |
| 13 | State Consistency |
| 14 | Naming Conventions |
| 15 | File Organization Philosophy |
| 16 | Reusability Gate |
| 17 | Scalability Rules |
| 18 | Anti-Patterns |
| 19 | Pre-Implementation Checklist |
| 20 | Phase F5 Closure |
| 21 | Audit Checklist |

---

# 1. Mission

Specify the global implementation rules that every future screen, component, and feature must obey.

Implementation is a **projection** of F1–F5 law.

Implementation never becomes the Single Source of Truth (F4.12 · F4.13 · F5.1).

---

# 2. Implementation Constitution

Implementation must always prefer:

| Prefer | Over |
|--------|------|
| Consistency | Novelty |
| Reuse | Duplication |
| Simplicity | Cleverness |
| Scalability | Shortcuts |
| Maintainability | Speed-at-any-cost |

| Law |
|-----|
| If a shortcut breaks F5.1–F5.4 or F4 Design System law, it is illegitimate |
| “Just this screen” forks are unconstitutional without debt + governance (F4.12 · F3.12) |
| Visual novelty that invents a private interaction language is banned (F5.4) |

---

# 3. Relationship to Prior Law

| Layer | Implementation must |
|-------|---------------------|
| F5.1 | Attach to existing strata · destinations · ownership |
| F5.2 | Keep Home feed ownership boundaries |
| F5.3 | Only build screens that exist in the catalog (or amend catalog first) |
| F5.4 | Obey interaction contracts |
| F4.8 · F4.10 · F4.12 | Consume Design System · semantic tokens · no forks |
| F4.11 | Adapt chrome · not product identity |
| F3 / F2 / F1 / Master / North Star | Never contradict |

**Order of work for new UI:**

1. Confirm / amend F5.1–F5.3 ownership & screen  
2. Obey F5.4 behavior  
3. Reuse F4/F1 components & tokens  
4. Implement  

---

# 4. Design System Usage Rules

| Rule |
|------|
| Prefer existing Design System citizens before inventing new ones |
| New components require F4.8 admission + F4.12 governance when they enter the shared system |
| Screen-specific one-offs are assemblies — not silent Design System forks |
| Signatures (F1) remain identity anchors and still obey system law |
| `COMPONENT_LIBRARY.md` / packages project law — they do not override F4/F5 |

---

# 5. Component Family Rules

Behavior contracts live in F5.4. Implementation must map families to shared components — not reinvent per feature.

| Family | Implementation rule |
|--------|---------------------|
| Buttons | Use Action family · primary/secondary/destructive meanings stable · no fake buttons |
| Cards | Open Shared Destination per type · one card language per object class |
| Lists | Homogeneous peers · row open targets consistent |
| Inputs | Form/Input family · labels/errors per F3.6 · F4.8 |
| Navigation | Five roots only · chrome may adapt |
| Bottom Sheets | Task layer only |
| Dialogs | Confirm / short blocking tasks |
| Modals / Fullscreen tasks | Editors · immersive tasks · not destinations |
| FAB | Home compose action entry · not a tab |
| Tabs / Top Bars / Rails | Same five destinations · order frozen |
| Search | Discover-owned surfaces |
| Badges / Tags / Chips | Semantic projections · not marketing spam |
| Avatars / Images | Media rules · picker tasks for edit |
| Feed Objects | F5.2 taxonomy · route to Shared |
| Game / Review / Post / Collection / Tier Cards | Same open behavior everywhere (F5.4) |
| Community / Event / Achievement Cards | Variants of the shared card family — never bespoke components per feature (F5.4 §38.1) |
| Connected Account Rows | One provider-agnostic row · state stated in text + semantics, never colour or icon alone (F4.2 · F4.6) |
| Progress display (achievements · import) | One honest progress component · no gamified meters · no fake motion (F4.9) |
| Recommendation slots | Reuse the card family of the recommended object class · slot is a container, not a new object language |

**MVP Integration Amendment (July 2026):** the six MVP features (Steam Sync · Discord linking · semantic recommendations · Communities · Events · Achievements) introduce **no new component philosophy**. Each new surface must be assembled from existing families above. A new component is admissible only through the F5.5 §16 reusability gate and F4.8/F4.12 admission governance.

---

# 6. Global Screen Consistency

Every screen must:

| Must |
|------|
| Use existing components whenever possible |
| Avoid duplicate UI patterns |
| Preserve hierarchy (F3.3 · F4.3 · F4.4) |
| Preserve navigation language (F5.1 · F5.4) |
| Follow shared spacing system (tokens) |
| Follow shared typography hierarchy (roles) |
| Follow shared interaction behaviors (F5.4) |
| Declare empty/loading/error per F5.4 |
| Match F5.3 ownership · entry · exit |

| Must not |
|----------|
| Invent a private nav dialect |
| Duplicate a Shared Destination under a tab owner |
| Ship a screen absent from F5.3 without amendment |

---

# 7. Token Usage Rules

Align F4.10 — **usage**, not values.

| Rule |
|------|
| Components consume **semantic** (or component-semantic) tokens |
| Do not hardcode raw colors · spacing · type sizes · radii · elevation · motion timings in feature UI |
| Do not reference primitives as the default API in screens |
| Themes remap values · do not fork components per theme |
| One meaning → one token path · no synonym sprawl |

---

# 8. Typography & Spacing Hierarchy References

| Rule |
|------|
| Use semantic type roles from F4.3 (Display/Heading/Body/Metadata/…) — do not invent shouting styles |
| Long-form reading remains first-class |
| Spacing follows F4.4 spatial language via spacing tokens — no arbitrary one-off spacing cultures |
| Reading corridors and hierarchy outrank decorative density |

Exact scales live in subordinate token docs — implementation consumes them.

---

# 9. Icon Usage

Align F4.6.

| Rule |
|------|
| Icons communicate meaning · never decoration-only critical status |
| Same action → same icon family |
| Icons never communicate alone — labels/context required (a11y) |
| No casino / fake badge / engagement icon language |
| Do not invent multiple metaphors for one meaning |

---

# 10. Layout Consistency

| Rule |
|------|
| Compose with F4.4 · F4.5 surface/container rules |
| Containers group · do not imprison |
| Chrome quieter than content |
| Cards/lists only when they serve interaction or understanding |
| No widget-wall dashboards (F5.2 anti-patterns) |

---

# 11. Responsive Rules

Align F4.11 · F3.10 · F5.1.

| Class | Rule |
|-------|------|
| Phone | Primary constraint · mobile-first truth |
| Tablet | Bridge · same jobs · more breath when earned |
| Desktop | Expanded capacity · not a second product |
| Landscape | Same destinations · layout adapts |
| Large displays | Restraint under abundance · no engagement stuffing |

| Law |
|-----|
| Do not create different products per device |
| Do not fork IA or Design System by breakpoint |
| Interaction meaning stays identical (F5.4) |

---

# 12. Accessibility Requirements

Align F2.18 · F4 · F5.4.

| Requirement |
|-------------|
| Touch targets meet platform minimums (Master/F2.18 — implement to spec docs) |
| Contrast via semantic tokens / theme variants — not ad-hoc hex |
| Dynamic text must not break meaning |
| Screen readers: name · role · state · value |
| Focus order follows reading corridors |
| Keyboard navigation on web where applicable |
| Reduced motion: essential meaning survives (F4.9) |
| Color / icon / motion never sole carriers of meaning |

Accessibility is not optional polish.

---

# 13. State Consistency

Align F4.8 · F5.4.

| Rule |
|------|
| Same state class → same behavioral treatment |
| Loading · empty · error · disabled · success · selected consistent across families |
| Empty ≠ error · empty never FOMO bait |
| Disabled honest · not dark-pattern coercion |

---

# 14. Naming Conventions

Philosophy aligned with repo standards (`CODING_STANDARDS` · naming rules) and F4.10 naming intent.

| Kind | Convention (implementation philosophy) |
|------|----------------------------------------|
| Screens | Match F5.3 Screen Name meaning · stable route/destination ids from F5.1 families |
| Components | Design System / category naming · PascalCase components · no feature-typo forks |
| Layouts | Shared layout primitives · not per-screen private layout kits |
| Icons | Semantic names by role · not appearance nicknames |
| Assets | Stable meaning-based names · no “final_final2” culture |
| Feature folders | Map to F5.1 ownership homes (home · discover · library · … · shared) |
| Shared modules | `shared` / domain stacks — never copy Shared into feature silos |

Exact folder trees are engineering projections — they must **reflect** ownership, not invent parallel IA.

---

# 15. File Organization Philosophy

| Prefer |
|--------|
| Group by product ownership (F5.1) then by layer (ui · hooks · api client usage) |
| Shared destinations in shared modules |
| Task layers shared · not forked per feature |
| Colocate screen assemblies with clear imports from Design System packages |

| Avoid |
|-------|
| Per-squad private component kits |
| Duplicating Shared Game/Post/Review under Home |
| “Utils dump” that hides a second Design System |

---

# 16. Reusability Gate

Every new feature/UI change must answer **before** build:

| Question |
|----------|
| Can an existing component solve this? |
| Can this become Shared (destination or citizen)? |
| Does this duplicate another pattern? |
| Does this break consistency (nav · interaction · tokens · ownership)? |
| Is the screen listed in F5.3 (or amended)? |
| Does behavior match F5.4? |

If “duplicate” or “break” → redesign the approach · do not ship a fork.

---

# 17. Scalability Rules

Future features must:

| Must |
|------|
| Attach to existing architecture (F5.1) |
| Reuse existing navigation (five roots + Shared + tasks) |
| Reuse existing task layers |
| Reuse Shared Destinations |
| Extend token/component systems under F4.12 governance |

| Must never |
|------------|
| Create parallel systems |
| Create parallel Homes / Discovers |
| Create sixth player tabs without F2.1 amendment |
| Create theme-specific component trees |

---

# 18. Anti-Patterns

| Banned |
|--------|
| Novelty for its own sake |
| Copy-paste UI with tiny naming differences |
| Hardcoded visual values in features |
| Device-specific product forks |
| Engagement bait patterns in empty/loading/error |
| Shadow Design Systems |
| Architecture docs invented outside amendment process after F5 close |
| Implementing screens not in F5.3 |
| Interaction dialects that contradict F5.4 |
| Bespoke community / event / achievement components duplicating existing card, row and list families |
| Feature-owned "integration UI" that forks navigation, tokens or states for Steam or Discord surfaces |
| Making an optional integration a precondition for a screen to function |
| Recommendation surfaces built as a separate mini-product instead of reusing object components |
| Shipping Version 2 scope (Marketplace · Premium · Creator Economy · Publisher / Developer dashboards · Public API · Twitch · advanced AI engine) under MVP naming |

---

# 19. Pre-Implementation Checklist

Before merging product UI work:

| Check |
|-------|
| F5.3 screen exists (or amendment landed) |
| F5.1 ownership respected |
| F5.2 boundaries respected if Home-related |
| F5.4 behavior respected |
| Existing components reused or admission path started |
| Semantic tokens only |
| A11y obligations considered |
| No duplicate pattern without justification + debt |
| Compatible with F1–F4 constitutions |
| MVP integration work degrades gracefully when the integration is absent or disconnected |
| Feature is MVP scope — not Version 2 scope |

---

# 20. Phase F5 Closure

| Artifact | Role |
|----------|------|
| F5.1 | What exists · navigation structure |
| F5.2 | What exists inside Home |
| F5.3 | Every screen |
| F5.4 | How interactions behave |
| **F5.5** | **How implementation must stay consistent** |

When this document is **LOCKED**:

| Freeze |
|--------|
| Product architecture series F5.1–F5.5 is complete |
| Further work proceeds into implementation and MVP development |
| **No new architecture documents** may be introduced unless they **amend** an existing specification |
| UI constitutions remain F4; UX F3; product F2 — F5 does not reopen them |

This document is **LOCKED** — the frozen SSOT for implementation, authoritative over ad-hoc build choices when no conflict with higher LOCKED law.

## 20.1 MVP scope boundary (Integration Amendment)

The MVP Final Integration Amendment (July 2026) fixes MVP product scope. Implementation may build only what is declared below.

| MVP scope | Architectural anchor |
|-----------|----------------------|
| Steam Sync (optional) | F5.1 §34 · F5.3 Library Import · Connected Accounts · Steam Library Import task |
| Discord Account Linking (identity only) | F5.3 Connected Accounts · Account Link task |
| Semantic Smart Recommendations | F5.2 §6.4 slot · F5.3 Related Games · Similar Collections · Discover |
| Communities | F5.1 §17.7 · F5.3 Community Detail · Feed · Members · Activity |
| Events | F5.1 §17.8 · F5.3 Events Hub · Event Detail |
| GMRLOG Achievement System | F5.1 §17.9 · F5.3 Profile Achievements · Achievement Detail |

| Version 2 — not implementable under MVP |
|------------------------------------------|
| Marketplace · Premium · Creator Economy |
| Publisher Dashboard · Developer Dashboard · Public API |
| Twitch integration · advanced AI recommendation engine |

Anything absent from both lists requires an amendment before implementation.

---

# 21. Audit Checklist

- [ ] Answers how the product should be built consistently  
- [ ] Design System · reuse · naming · tokens · layout · responsive · a11y · states defined as rules  
- [ ] Component families covered without visual redesign  
- [ ] Reusability gate · scalability · anti-patterns explicit  
- [ ] Implementation constitution prefers consistency/reuse/simplicity/scalability/maintainability  
- [ ] Every implementation must use existing DS · nav · interaction · shared components · no duplicated UI/architecture  
- [ ] Compatible with F1 · F2 · F3 · F4 · F5.1–F5.4  
- [ ] No backend · API · DB · algo · Expo · RN code  
- [ ] Declares F5 closure / amendment-only future architecture docs  
- [ ] Ready for MVP implementation under this constitution  

---

## Final gate

### LOCKED — Phase F5 closed

**Sprint F5.5 — Design System & Implementation Rules** is **LOCKED** at Version 1.1 following the MVP Final Integration Amendment.

This document **closes Phase F5**. The Product Architecture is frozen; MVP implementation proceeds; new architecture only via amendment.

---

## F5 Product Architecture Index

| Sprint | Document | Status |
|--------|----------|--------|
| F5.1 | Information Architecture & Navigation Specification | **LOCKED** |
| F5.2 | Home Feed Product Architecture Specification | **LOCKED** |
| F5.3 | Screen Specifications | **LOCKED** |
| F5.4 | Interaction & Component Behavior Specification | **LOCKED** |
| **F5.5** | **Design System & Implementation Rules (this document)** | **LOCKED** |

---

## Related documents

| Doc | Role |
|-----|------|
| [F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md](./F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | Structure SSOT |
| [F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md](./F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | Home boundaries |
| [F5_3_SCREEN_SPECIFICATIONS.md](./F5_3_SCREEN_SPECIFICATIONS.md) | Screen catalog |
| [F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md](./F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | Behavior contracts |
| [F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md](../04_UI/F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) | DS system law |
| [F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md](../04_UI/F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md) | Token architecture |
| [F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md](../04_UI/F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md) | Responsive law |
| [F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md](../04_UI/F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md) | Anti-fork governance |
| [F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md](../04_UI/F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md) | F4 close · F5 authorized |
| [COMPONENT_LIBRARY.md](../02_DESIGN/COMPONENT_LIBRARY.md) | Subordinate component specs |
| [DESIGN_TOKENS.md](../02_DESIGN/DESIGN_TOKENS.md) | Subordinate tokens |
| [CODING_STANDARDS.md](../00_PROJECT/CODING_STANDARDS.md) | Engineering coding standards |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Implementation constitution: DS usage · reuse · tokens · responsive · a11y · naming · scalability; closes F5 series upon LOCK; no code |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §5 component families extended (community · event · achievement · connected account · progress · recommendation slot as reuse variants); §18 anti-patterns and §19 checklist extended; new §20.1 MVP scope boundary vs Version 2; no new component philosophy · no code |
| 1.1 | July 2026 | Version 1.1 — MVP Final Integration Amendment verified. Product Architecture frozen. |

---

# Product Architecture Freeze

The MVP Final Integration Amendment has been verified across the entire product architecture series. The following is now in force.

- **F5.1–F5.5 now constitute the frozen Product Architecture.** Information Architecture & Navigation (F5.1), Home Feed Product Architecture (F5.2), Screen Specifications (F5.3), Interaction & Component Behavior (F5.4), and Design System & Implementation Rules (F5.5) are LOCKED at Version 1.1 and stand as a single, coherent, immutable specification.
- **No future architecture documents may be created.** The F5 series is closed. No new F5.x specification may be opened.
- **Future changes must use Amendment documents only.** Any evolution of product structure, feed taxonomy, screens, interaction behavior, or implementation rules must be introduced as an Amendment that references and modifies an existing F5 specification — never as a new architecture document.
- **MVP implementation may begin.** The frozen architecture is the authoritative basis for building the MVP under the scope boundary defined in §20.1.
- **Architecture is considered complete for Version 1.** The Product Architecture requires no further specification work for Version 1. Version 2 features remain future-reserved and are not implementable under the MVP.

This freeze does not reopen F1–F4. UI constitutions remain F4, UX remains F3, product remains F2. F5 remains subordinate to all higher LOCKED law.
