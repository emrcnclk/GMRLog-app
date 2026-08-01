# GMRLOG — Sprint F6.1: Engineering Architecture

**Document:** `docs/06_ENGINEERING/F6_1_ENGINEERING_ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** F6.1 (Engineering Architecture — organization only)  
**Last Updated:** July 2026  
**Owner:** Engineering Architecture Director  
**Classification:** Engineering Architecture Specification

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | Entire F1 |
| 4 | Entire F2 |
| 5 | Entire F3 |
| 6 | Entire F4 |
| 7 | Entire F5 (**LOCKED** product architecture — F5.1–F5.5) |
| 8 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 9 | **This document** — Engineering Architecture Specification (how software is organized) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never introduce new MVP features.

Never redefine **what** GMRLOG is.

This sprint specifies **HOW the software is organized**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI law |
| F5 | What exists · how it behaves · how implementation stays consistent — **LOCKED** |
| **F6.1** | How engineering systems, packages, modules and boundaries are organized |

This sprint answers:

> “How should the software be organized?”

rather than:

> “How should it be implemented?” · “What should the product be?”

| Does | Does not |
|------|----------|
| Define engineering philosophy · system shape · monorepo organization · FE/BE separation · shared packages · feature modules · ownership mapping · folder philosophy · dependency direction · scalability · offline-first · state · API layer · component reuse · security · performance · testing · build | Product features · UX redesign · UI redesign · IA / navigation changes · new MVP features |
| Specify organization as engineering SSOT for future F6+ docs | Code · API contracts · database schemas · algorithms · Expo configuration · React Native syntax · concrete endpoints · SQL |

**Gate:** Stop after this specification. Do **not** continue to Sprint F6.2 in this deliverable.

---

## Scope

**In scope:** Overall engineering philosophy · high-level system architecture · monorepo structure · frontend / backend separation · shared package philosophy · feature module philosophy · ownership mapping · folder organization philosophy · dependency direction · scalability principles · offline-first philosophy · state management philosophy · API layer philosophy · component reuse philosophy · security principles · performance principles · testing philosophy · build philosophy.

**Out of scope:**

| Forbidden |
|-----------|
| Product · UX · UI · IA redesign |
| New MVP features or Version 2 scope creep |
| Source code · snippets · syntax |
| API endpoint definitions · OpenAPI bodies · request/response schemas |
| Database schemas · migrations · Prisma models |
| Algorithms · ranking · recommendation engines |
| Expo configuration · React Native syntax · framework tutorials |
| Infrastructure runbooks · concrete cloud accounts · secrets |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Position · Engineering Constitution · Relationship to Prior Law |
| B | 5–9 | System architecture · Monorepo · FE/BE separation · Shared packages · Feature modules |
| C | 10–14 | Ownership mapping · Folder philosophy · Dependency direction · Scalability · Offline-first |
| D | 15–20 | State · API layer · Component reuse · Security · Performance · Testing |
| E | 21–25 | Build philosophy · Anti-patterns · Checklist · Diagrams · Close |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the engineering organization that every future implementation document and every line of production code must obey.

Engineering is a **projection** of F1–F5 law.

Engineering never becomes the Single Source of Truth for product meaning, UX feel, or UI systems.

| Prefer | Never |
|--------|-------|
| Organization over improvisation | Inventing product structure in folders |
| Boundaries over convenience | Cross-layer shortcuts |
| Reuse over duplication | Shadow packages / shadow design systems |
| Clarity over cleverness | Magic that hides ownership |
| Scalability over shortcuts | Temporary forks that become permanent |

---

# 2. Architectural Position

| Layer | Answers | Owner series |
|-------|---------|--------------|
| Product constitution | What GMRLOG is | F1 · F2 |
| Experience constitution | How it feels | F3 |
| Visual constitution | How it looks / systems | F4 |
| Product architecture | What exists · ownership · behavior · build consistency | F5 |
| **Engineering architecture** | **How software is organized** | **F6** |
| Implementation docs | How specific surfaces / services are built | Later F6+ · domain docs |

On conflict:

| Conflict | Winner |
|----------|--------|
| Engineering convenience vs F5 ownership | F5 |
| Folder layout vs F2.1 navigation freeze | F2.1 |
| Package invention vs F4.12 / F5.5 reuse law | F4.12 · F5.5 |
| Engineering docs vs North Star / Master | North Star · Master |

---

# 3. Engineering Constitution

## 3.1 Immutable engineering laws

| Law |
|-----|
| F1–F5 define meaning; F6 defines organization |
| One monorepo · one TypeScript · one Design System · one API client surface |
| Applications never contain a private product constitution |
| Packages never invent features absent from F5 |
| Features map to F5.1 ownership homes — not to team preference |
| Shared Destinations are shared modules — never copied under a tab feature |
| Task layers are shared actions — never destinations and never feature-owned “mini apps” |
| Dependency arrows point inward toward shared foundations — never outward toward apps |
| Offline-capable client behavior must degrade honestly — never invent ghost product states |
| Security · privacy · Trust are architectural defaults — never optional add-ons |
| Tests prove organization and contracts — never decorate broken structure |

## 3.2 Preference order

When engineering choices conflict, prefer in this order:

1. Constitutional obedience (F1–F5)
2. Clear ownership and dependency direction
3. Reuse of existing packages and modules
4. Simplicity and readability
5. Scalability and maintainability
6. Local delivery speed

If a shortcut breaks F5.1–F5.5 or F4 Design System law, it is illegitimate.

---

# 4. Relationship to Prior Law

| Prior law | Engineering obligation |
|-----------|------------------------|
| F2.1 · F5.1 | Five player roots + Shared Destinations + tasks — folders and modules must reflect this, not invent a sixth root |
| F5.2 | Home owns feed presentation only — feed domain logic never absorbs Shared domains |
| F5.3 | No screen implementation without a cataloged screen (or amendment) |
| F5.4 | Interaction behavior contracts bind client modules |
| F5.5 | Reuse · tokens · naming · file organization philosophy · MVP scope boundary |
| F4.8 · F4.10 · F4.12 | Component and token systems never fork |
| F2.21 · F2.19 MVP amendments | Optional integrations and semantic recommendations remain optional modules — never foundations |
| F2.29 §15.1 | Version 2 scope must not enter MVP engineering organization under MVP naming |
| `MONOREPO_STRUCTURE.md` | Concrete package inventory projection under this constitution |
| `CODING_STANDARDS.md` | Language · layer · naming discipline under this constitution |
| `TECH_STACK_DECISIONS.md` | Approved technology choices — changes require ADR; this document does not re-select the stack |

---

# PART B — SYSTEM SHAPE

---

# 5. High-Level System Architecture

GMRLOG engineering is organized as a **client–platform** system with shared contracts and shared meaning packages.

```
CLIENT SURFACE LAYER
  Mobile client · Web client · Admin client
        │
        ▼
SHARED CLIENT CAPABILITIES
  UI · Design tokens · Hooks · Validators · Localization · Icons · Auth helpers · API SDK · Storage helpers · Realtime helpers · Analytics helpers
        │
        ▼
PLATFORM EDGE
  Gateway · Auth boundary · Realtime boundary
        │
        ▼
PLATFORM CORE
  Domain services (by product ownership) · Jobs · Search · Notifications · Moderation · Integrations
        │
        ▼
DATA & MEMORY LAYER
  Primary datastore · Cache · Queues · Object storage
```

## 5.1 Architectural roles

| Role | Responsibility |
|------|----------------|
| Client surfaces | Present F5 screens · obey F5.4 behavior · consume shared UI and API SDK |
| Shared client capabilities | Reusable client foundations — never product ownership |
| Platform edge | Trust boundary · session · rate · routing into core |
| Platform core | Domain rules · persistence orchestration · async work · integration guests |
| Data & memory | Durable and ephemeral storage — never product IA |

## 5.2 Separation laws

| Law |
|-----|
| Clients do not own business rules that belong to platform core |
| Platform core does not own visual Design System decisions |
| Admin / Moderator stacks remain isolated overlays (F5.1) — never bleed into player IA packages |
| External platforms (Steam · Discord · …) are **guest adapters** (F2.21) — never foundations |
| Recommendation presentation slots remain presentation — similarity engines (if any later) never redefine product meaning in F6.1 |

## 5.3 What “system architecture” means here

This section defines **boundaries and roles**.

It does **not** define endpoints, tables, queues topology values, or deployment topology specifics. Those belong to later engineering documents that must amend or project this constitution — never contradict it.

---

# 6. Monorepo Structure

GMRLOG is built as **one monorepo**.

Purpose: shared types, shared Design System, shared API client, unified tooling, incremental builds, coherent ownership.

## 6.1 Top-level organization philosophy

```
gmrlog/
├── apps/             # Deployable surfaces (clients · platform · staff · docs)
├── packages/         # Shared libraries (never deployable products by themselves)
├── infrastructure/   # Runtime & delivery projections (not product meaning)
├── scripts/          # Repo automation
├── docs/             # Single Source of Truth (product + engineering)
└── tooling configs   # Workspace · build graph · environment examples
```

## 6.2 Applications philosophy

| App family | Engineering role | Product constraint |
|------------|------------------|--------------------|
| Mobile client | Primary player surface | Implements F5.3 screens · F5.1 strata |
| Web client | Marketing · future player web | Same Design System · no forked IA |
| Backend / platform | Domain services · APIs · jobs · realtime | Implements product rules · not UI |
| Admin | Staff overlay | Isolated · never a sixth player root |
| Docs site | Documentation presentation | Does not redefine law |

Apps are **assemblies**. They compose packages. They do not become private ecosystems.

## 6.3 Packages philosophy

Packages exist to share meaning and capability — not to invent shadow products.

| Package class | Intent |
|---------------|--------|
| Design System packages | UI · tokens · icons — F4 / F5.5 obedience |
| Contract packages | Types · validators · constants — shared language |
| Capability packages | Auth helpers · API SDK · storage · realtime · analytics · localization · hooks · utils · testing |
| Platform packages | Database utilities · shared server helpers when justified |

Packages must remain **thin in product ownership**. A package named after a player tab that secretly owns Shared Destinations is an anti-pattern.

## 6.4 Monorepo laws

| Law |
|-----|
| One workspace · one package manager · one build graph philosophy |
| Apps may depend on packages |
| Packages may depend on lower-level packages only |
| Packages must never depend on apps |
| No circular package graphs |
| No “common” dump that hides a second Design System or a second API |
| New packages require admission: purpose · owner · dependency direction · non-duplication proof |

Concrete package inventory lives in `MONOREPO_STRUCTURE.md` and must remain a projection of these laws.

---

# 7. Frontend / Backend Separation

## 7.1 Frontend responsibility

| Owns | Does not own |
|------|----------------|
| Screen assemblies from F5.3 | Authoritative business invariants |
| Navigation presentation of F5.1 strata | Database schema |
| Consumption of Design System | Staff tools leakage into player UI |
| Client state · offline cache presentation | Server-only Trust decisions |
| Calling the API layer through shared SDK | Direct datastore access |

## 7.2 Backend / platform responsibility

| Owns | Does not own |
|------|----------------|
| Domain rules · permissions · Trust enforcement | Visual tokens · component trees |
| Persistence orchestration | Client navigation IA |
| Async jobs · notifications fan-out · indexing triggers | Engagement manipulation systems |
| Integration guest adapters | Product feature invention outside F5 |

## 7.3 Boundary laws

| Law |
|-----|
| UI components never import platform repositories |
| Platform modules never import client UI packages |
| Shared types and validators may cross the boundary |
| Mapping between transport shapes and domain meaning happens in dedicated API / mapper layers — not in visual components |
| Soft-gates and access rules are enforced on the platform; clients reflect them honestly |

## 7.4 Multi-client sameness

Mobile · Web · Admin (where applicable) share:

| Shared | Not shared |
|--------|------------|
| Types · validators · Design System meaning · API SDK philosophy | Device chrome · staff-only modules · platform-only services |

Device adaptation never forks product identity (F4.11 · F5.5).

---

# 8. Shared Package Philosophy

## 8.1 Why packages exist

| Reason |
|--------|
| Prevent duplication across apps |
| Keep Design System singular |
| Keep transport contracts singular |
| Keep Trust-sensitive helpers consistent |
| Enable independent evolution under versioned package boundaries |

## 8.2 Admission rules

A new shared package is allowed only when:

| Condition |
|-----------|
| At least two consumers need it **or** it is a foundational capability with clear ownership |
| It does not duplicate an existing package |
| It has a single responsibility |
| Its dependency direction is acyclic and inward |
| It does not encode a player destination that belongs in a feature module |

## 8.3 Forbidden package patterns

| Banned |
|--------|
| `packages/home-ui` that secretly owns Game / Review / Post |
| App-copied Design System forks |
| “Utils” packages that grow into undocumented platforms |
| Feature business rules smuggled into `ui` |
| Integration SDKs that become identity foundations (Steam / Discord remain guests) |

## 8.4 Design System packages

Design System packages obey F4.8 · F4.10 · F4.12 · F5.5:

| Rule |
|------|
| Components consume semantic tokens |
| Raw visual values do not live in feature modules |
| New components pass reusability / admission governance |
| MVP feature UIs reuse families — they do not invent private kits |

---

# 9. Feature Module Philosophy

## 9.1 Definition

A **feature module** is an engineering unit that implements one F5 ownership home or one Shared Destination family.

Feature modules are not marketing epics. They are ownership-aligned code boundaries.

## 9.2 Feature module shapes

| Module kind | Maps to | Examples of meaning |
|-------------|---------|---------------------|
| Root feature | F5.1 tab / stratum root | Home · Discover · Library · Notifications · Profile |
| Shared destination module | F5.1 §17 families | Game · Post · Review · Collection · Tier · User · Community · Event · Achievement |
| Gate module | Auth · Onboarding | Login · Register · readiness steps |
| Control module | Settings · Messages entry | Account · Privacy · Connected Accounts |
| Task module | Non-destination tasks | Compose · Import · Account Link · Report |
| Staff module | Admin · Moderator stacks | Isolated staff tools |

## 9.3 Internal layering (philosophy)

Within a feature module, organization prefers clear layers:

| Layer | Role |
|-------|------|
| Screens / routes assemblies | F5.3 surfaces only |
| UI composition | Design System consumption · local feature composition |
| Hooks / application services | Orchestration · no datastore |
| Data access via API SDK | Transport calls · mappers · cache keys |
| Local store slices (if needed) | UI/session concerns only |

Exact folder names are projections. Layer meaning is not optional.

## 9.4 Feature laws

| Law |
|-----|
| One Primary Owner per screen (F5.3) → one primary feature module |
| Presentation context (which tab pushed a Shared screen) never moves ownership |
| Cross-feature imports prefer Shared modules and packages — not peer feature deep imports |
| Optional MVP integrations are modules/adapters — features remain usable when adapters are absent |
| Version 2 scopes do not receive feature modules under MVP |

---

# PART C — OWNERSHIP · FOLDERS · DEPENDENCIES · SCALE · OFFLINE

---

# 10. Ownership Mapping

Engineering ownership must mirror product ownership (F5.1 Feature → Home).

## 10.1 Root ownership

| Product home | Engineering home |
|--------------|------------------|
| Home | `home` feature module — feed presentation · compose entry only |
| Discover | `discover` — hub · search · communities hub · events hub · recommendation surfaces |
| Library | `library` — archive indexes · import entry |
| Notifications | `notifications` — attention desk · activity center |
| Profile | `profile` — self identity · achievements index entry · overflow entries |

## 10.2 Shared ownership

| Shared Destination | Engineering home |
|--------------------|------------------|
| Game | `shared/game` (or equivalent shared domain module) |
| Post · Review | `shared/post` · `shared/review` |
| Collection · Tier | `shared/collection` · `shared/tier` |
| User (other) | `shared/user` |
| Community (+ children) | `shared/community` |
| Event | `shared/event` |
| Achievement | `shared/achievement` |

Shared modules are imported by roots. Roots do not re-implement Shared.

## 10.3 Control · gate · task · staff

| Area | Engineering home |
|------|------------------|
| Authentication · Onboarding | `auth` / `onboarding` gate modules |
| Settings · Connected Accounts | `settings` control module |
| Messages (Profile-entered) | `messages` control module entered from Profile |
| Compose · editors · import · account link · report · pickers | `tasks` (or task family modules) |
| Admin · Moderator | `staff/admin` · `staff/mod` isolated |

## 10.4 Platform domain ownership

Backend / platform modules organize by the same product domains — not by arbitrary technical nouns alone.

| Principle |
|-----------|
| A platform `community` domain serves Shared Community product meaning |
| A platform `library` domain serves archive meaning |
| Integration domains (`steam` · `discord`) are guest adapters under integrations ownership |
| Feed aggregation may orchestrate many domains — it does not absorb them |

## 10.5 Ownership conflict resolution

| Conflict | Resolution |
|----------|------------|
| Two modules claim one screen | Illegal — amend F5.3 / F5.1 first |
| Feature copies Shared UI | Illegal — extract or import Shared |
| Platform endpoint invented without product screen/owner | Illegal for player-facing work — amend product architecture first |
| “Temporary” ownership fork | Requires documented debt + removal plan — silent forks banned |

---

# 11. Folder Organization Philosophy

## 11.1 Guiding principle

Folders are a **map of ownership**, not a map of opinions.

| Prefer | Avoid |
|--------|-------|
| Group by product ownership, then by layer | Group only by technical type across the whole app |
| Shared destinations in shared modules | Copy Shared under Home / Discover / Library |
| Colocate a screen with its feature hooks/mappers | Scatter one screen’s meaning across unrelated trees |
| Keep Design System in packages | Keep one-off “pretty” components in random folders |

## 11.2 Client organization philosophy

```
app surface
  ├── gate / auth / onboarding
  ├── main roots (home · discover · library · notifications · profile)
  ├── shared destinations
  ├── settings / messages
  ├── tasks
  └── staff (if present · isolated)
```

Navigation frameworks project this map. They do not redefine it.

## 11.3 Platform organization philosophy

```
platform
  ├── domains (aligned to product ownership)
  ├── integrations (guests)
  ├── shared kernel (authz helpers · errors · pagination primitives)
  ├── jobs / workers
  └── staff domains (isolated)
```

## 11.4 Docs organization

`docs/` remains SSOT. Engineering must not invent a second undocumented constitution inside code comments or wiki forks.

| Rule |
|------|
| If organization changes, documentation amends first or simultaneously |
| Code that contradicts docs is wrong until docs or code is corrected — docs win on product meaning |

---

# 12. Dependency Direction

## 12.1 Allowed direction

```
apps/*
  → packages/* (capabilities · UI · contracts)
    → lower-level packages (types · tokens · utils · config)
```

```
feature modules
  → shared destination modules
    → packages
```

```
platform domains
  → shared kernel
    → data access abstractions
```

## 12.2 Forbidden direction

| Forbidden |
|-----------|
| `packages/*` → `apps/*` |
| Shared destination module → root feature module (ownership inversion) |
| UI package → platform domain services |
| Feature A deep-importing Feature B internals instead of Shared / packages |
| Circular imports between packages or domains |

## 12.3 Dependency admission questions

Before adding a dependency:

| Question |
|----------|
| Does this preserve ownership? |
| Does this create a cycle? |
| Does this pull UI into platform or platform into UI? |
| Can a thinner contract package replace a heavy coupling? |

---

# 13. Scalability Principles

## 13.1 Scale without rewriting identity

| Principle |
|-----------|
| Add modules under existing ownership homes |
| Extend Shared Destinations instead of inventing parallel rooms |
| Grow hub entries under Discover / Profile — never grow player tabs without F2.1 amendment |
| Split platform domains by product meaning when load demands — not by fashion |
| Keep contracts versioned and additive where possible |

## 13.2 Team scalability

| Principle |
|-----------|
| Clear module ownership enables parallel work |
| Shared packages reduce cross-team redesign |
| Staff isolation prevents player-path thrash |
| Admission gates prevent package sprawl |

## 13.3 Technical scalability (philosophy only)

| Prefer | Avoid |
|--------|-------|
| Horizontal growth behind clear boundaries | Big-ball modules that own everything |
| Async work for non-critical side effects | Blocking user journeys on every side effect |
| Cache as acceleration | Cache as source of truth for identity meaning |
| Queue-backed fan-out | Synchronous fan-out that couples domains forever |

No specific vendor topology is mandated by this section beyond obedience to approved stack decisions elsewhere.

---

# 14. Offline-First Philosophy

## 14.1 Meaning

Offline-first means the client **remains a Digital Home** under imperfect connectivity — not that the client becomes a second server of record for all meaning.

| Is | Is not |
|----|--------|
| Honest local continuity for reading and drafting where product allows | Inventing successful sync that did not happen |
| Queued actions with visible pending state | Silent data loss |
| Degraded but oriented UI (F5.4 loading/empty/error kinship) | Fake freshness theater |
| Resume after reconnect | Parallel offline-only product IA |

## 14.2 Offline laws

| Law |
|-----|
| Authoritative Trust · permissions · identity mutations remain platform-confirmed |
| Pending local writes are distinguishable from confirmed writes |
| Conflict resolution prefers player-authored meaning (especially Library import vs authored status — F2.6 · F2.21) |
| Optional integrations offline: absence is normal — never an error wall |
| Feed / Discover may show cached slices — never pretend live culture when stale beyond honesty |
| Offline never creates a sixth navigation mode |

## 14.3 Sync philosophy

| Prefer |
|--------|
| Explicit sync boundaries |
| Idempotent client intents where possible |
| User-visible recovery |
| Feature modules declaring what is readable offline vs action-gated |

Detailed sync protocols belong in later engineering docs — they must obey this philosophy.

---

# PART D — STATE · API · REUSE · SECURITY · PERFORMANCE · TESTING

---

# 15. State Management Philosophy

## 15.1 State classes

| Class | Purpose | Lives near |
|-------|---------|------------|
| Server / remote state | Product data owned by platform | API SDK · query/cache layer |
| Session / auth state | Who is signed in · readiness | Auth capability package · gate modules |
| UI state | Ephemeral presentation · sheets · local toggles | Screen / component local state |
| Draft / task state | Compose · import · link in progress | Task modules |
| Preferences | Settings the player controls | Settings module · synced when applicable |
| Navigation state | Stack / tab restoration (F5.1 · F5.4) | Navigation projection — not a business store |

## 15.2 State laws

| Law |
|-----|
| Do not store remote lists as permanent global bags without ownership |
| Do not put business invariants only in client stores |
| One meaning → one state owner |
| Cache is a performance tool — not a product constitution |
| Feature stores must not become cross-app event buses |
| Shared Destination state is shared — not re-owned by the presenting tab |

## 15.3 Consistency with F5.4 / F5.5

Loading · empty · error · success · disabled · selected states are **behavioral contracts**. State systems must make those states expressible — not invent alternate state dialects per feature.

---

# 16. API Layer Philosophy

## 16.1 Role of the API layer

The API layer is the **only sanctioned bridge** between client features and platform capabilities for remote meaning.

| Owns | Does not own |
|------|----------------|
| Transport calls · typing · mapping · error normalization · auth attachment | Visual layout |
| Client-facing SDK surface | Database schemas |
| Idempotency / retry policy hooks (philosophy) | Product IA |

## 16.2 API layer laws

| Law |
|-----|
| Screens and visual components do not perform raw transport |
| Feature modules call shared API SDK / feature API facades — not ad-hoc clients |
| Mappers translate transport ↔ feature models explicitly |
| Errors become user-honest states (F5.4) — never stack traces |
| Pagination · filtering · expand patterns stay consistent across domains |
| Guest / soft-gate / role differences are expressed as access outcomes — not as separate API universes for the same meaning |

## 16.3 Contract philosophy

| Prefer |
|--------|
| Shared contracts consumed by Mobile · Web · Admin as appropriate |
| Additive evolution over silent breaking changes |
| Explicit versioning / deprecation policy in later API docs |
| Alignment with product screens and ownership before inventing endpoints |

This document does **not** define endpoints. Future API documents must project F5 ownership and this boundary law.

## 16.4 Integrations boundary

Steam · Discord and future guests:

| Rule |
|------|
| Client talks to GMRLOG platform |
| Platform owns guest adapters |
| Clients never embed guest secrets or become guest SDKs of record |
| Disconnect / absence is a first-class state |

---

# 17. Component Reuse Philosophy

Engineering reuse obeys F4.8 · F5.4 · F5.5.

| Law |
|-----|
| Prefer existing Design System components |
| Compose screens from shared families (cards · rows · lists · sheets · dialogs · tasks) |
| Community · Event · Achievement · Connected Account · Recommendation slots are **variants**, not new systems |
| If a component is needed twice, it belongs in the Design System admission path — not copy-paste |
| Feature-specific composition is allowed; feature-specific Design Systems are not |

Reusability gate (F5.5 §16) is mandatory before introducing new UI objects.

---

# 18. Security Principles

## 18.1 Default posture

| Principle |
|-----------|
| Secure by default · least privilege |
| Never trust client input |
| Secrets never live in clients · repos · docs samples as real values |
| Privacy and consent are product law (F2.20 · F2.21 · F2.27) and engineering defaults |
| Staff powers stay in staff modules |

## 18.2 Engineering security laws

| Law |
|-----|
| Authn / authz enforced on platform for protected meaning |
| Clients may hide affordances; they must not be the only gate |
| Connected Accounts linking requires explicit consent and honest scope |
| Import and OAuth tasks are cancellable and non-trapping |
| Logging and analytics must not exfiltrate private archive content without policy |
| Dependency supply chain and secret scanning are part of build hygiene |
| Threats do not justify dark patterns or engagement traps |

## 18.3 Trust alignment

Security engineering protects Digital Home. It never becomes surveillance theater or retention coercion.

---

# 19. Performance Principles

## 19.1 Performance meaning

Performance serves **orientation and calm continuity** — not casino urgency.

| Prefer | Avoid |
|--------|-------|
| Fast return to identity and rooms | Infinite novelty loaders as engagement |
| Incremental rendering of long lists | Blocking the whole app on secondary fans |
| Predictable navigation transitions | Motion that cannot be interrupted (F4.9) |
| Honest skeletons | Fake completion |

## 19.2 Engineering performance laws

| Law |
|-----|
| Measure against product journeys (Home heartbeat · Search · Game relationship · Library archive) |
| Cache thoughtfully · invalidate honestly |
| Avoid N+1 ownership mistakes across Shared opens |
| Images and media obey product restraint — not autoplay addiction |
| Staff tools must not degrade player path budgets by shared-thread starvation (organizational isolation) |
| Performance work never licenses IA forks or Design System forks |

Numeric budgets, if defined, live in subordinate performance docs — they must not contradict this philosophy.

---

# 20. Testing Philosophy

## 20.1 Purpose of tests

Tests protect **organization, contracts, and Trust** — not vanity coverage numbers alone.

| Layer | Proves |
|-------|--------|
| Unit | Pure rules · mappers · validators · small domain logic |
| Integration | Module boundaries · API facades · repository contracts |
| Contract | Shared client ↔ platform agreement |
| End-to-end | Critical journeys across F5 screens |
| Accessibility | Constitutional a11y obligations remain enforceable |
| Visual / component | Design System regressions (where established) |

## 20.2 Testing laws

| Law |
|-----|
| New feature modules ship with tests at the layers they touch |
| Shared Destination changes require shared-module tests — not only root-tab tests |
| Offline / pending / error paths are tested as first-class states |
| Optional integrations are tested in connected and absent modes |
| Snapshots alone are not architecture proof |
| Tests must not encode engagement manipulation as success criteria |
| Flaky tests are defects in the suite — not acceptable debt forever |

Coverage targets in `CODING_STANDARDS.md` remain subordinate discipline under this philosophy.

---

# PART E — BUILD · ANTI-PATTERNS · CLOSE

---

# 21. Build Philosophy

## 21.1 Build goals

| Goal |
|------|
| Incremental · cacheable · reproducible builds |
| Clear app and package graph |
| Fail fast on type · lint · test · secret hygiene |
| Environment configuration explicit and non-secret in examples |
| CI proves organization health before merge |

## 21.2 Build laws

| Law |
|-----|
| Apps and packages build through the monorepo graph — not via undocumented side channels |
| Design tokens and shared types break the build when violated — silent drift banned |
| Feature flags (if used) never invent undocumented product destinations |
| Release artifacts map to apps — packages are not secretly shipped as second products |
| Documentation generation may consume docs SSOT — it must not rewrite law |

## 21.3 Change management

| Rule |
|------|
| Architectural shifts amend this document (or later F6 docs) before sprawling in code |
| Stack changes require ADR under `TECH_STACK_DECISIONS.md` governance |
| Product meaning changes require F1–F5 amendment — never F6 alone |

---

# 22. Anti-Patterns

| Banned |
|--------|
| Redesigning product · UX · UI · IA inside engineering folders |
| New MVP features invented in code without F5 / F2.29 acceptance |
| Version 2 scope shipped under MVP module names |
| Sixth player tab implemented “just for engineering convenience” |
| Copying Shared Destinations under Home / Discover / Library |
| UI components calling transport directly |
| Platform modules importing client UI |
| Package ↔ app circular dependencies |
| Shadow Design Systems / token hardcoding in features |
| Offline fake-success |
| Integration required to open core Digital Home |
| Recommendation / assistant mini-product architecture |
| Discord chat or Steam-client identity leaking into modules |
| Undocumented ownership forks |
| “Temporary” folders that become permanent parallel architecture |
| Treating F6 as authority over North Star / F5 |

---

# 23. Pre-Implementation Checklist

Before building a surface or service:

| Check |
|-------|
| F5.3 screen (or amendment) exists for player-facing UI |
| F5.1 ownership home identified |
| F5.2 boundaries respected if Home-related |
| F5.4 behavior contract identified |
| F5.5 reuse / tokens / naming obeyed |
| Module kind chosen (root · shared · gate · control · task · staff · platform domain · guest adapter) |
| Dependency direction validated |
| Shared vs feature placement decided |
| Offline / empty / error honesty considered |
| Security & privacy defaults considered |
| Tests planned for touched layers |
| Scope is MVP — not Version 2 |

If any check fails → stop and amend the correct SSOT layer. Do not “just code it.”

---

# 24. Architecture Diagrams (text)

## 24.1 Authority cascade

```
NORTH STAR
  → Master Design Direction
    → F1–F4 constitutions
      → F5 product architecture (LOCKED)
        → F6.1 engineering organization (this document)
          → Later F6+ / domain engineering projections
            → Code
```

## 24.2 Ownership → modules

```
PRODUCT OWNERSHIP (F5.1)
  → FEATURE / SHARED / TASK / STAFF MODULES
    → PACKAGES (UI · contracts · capabilities)
      → APPS (assemblies)
```

## 24.3 Client ↔ platform

```
Screen (F5.3)
  → Feature / Shared module
    → API layer (SDK / facades / mappers)
      → Platform edge
        → Domain services (same ownership names)
          → Data & memory
```

---

# 25. Audit Checklist

- [ ] Answers how software should be organized — not how product should look or what features exist  
- [ ] Obeys F1–F5 · does not redesign IA / UX / UI · introduces no new MVP features  
- [ ] Monorepo · FE/BE separation · shared packages · feature modules defined as philosophy  
- [ ] Ownership mapping mirrors F5.1 / F5.3  
- [ ] Folder philosophy · dependency direction · scalability explicit  
- [ ] Offline-first · state · API layer philosophies explicit without endpoints/schemas  
- [ ] Component reuse · security · performance · testing · build philosophies explicit  
- [ ] Anti-patterns and pre-implementation checklist present  
- [ ] No code · no API definitions · no DB schemas · no RN/Expo implementation detail  
- [ ] Compatible with `MONOREPO_STRUCTURE.md` · `CODING_STANDARDS.md` · `TECH_STACK_DECISIONS.md` as subordinate projections  
- [ ] Gate: stop — do not continue to F6.2 in this deliverable  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Sprint F6.1 — Engineering Architecture** delivered as **DRAFT**.

This document is the working SSOT candidate for **software organization** under F1–F5.

Stop.

Do **NOT** continue to Sprint F6.2 until F6.1 is explicitly advanced / LOCKED by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |
| [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | Product structure · ownership |
| [`F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | Home feed boundaries |
| [`F5_3_SCREEN_SPECIFICATIONS.md`](../05_PRODUCT_ARCHITECTURE/F5_3_SCREEN_SPECIFICATIONS.md) | Screen catalog |
| [`F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | Interaction contracts |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | Implementation consistency · F5 close |
| [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) | Concrete monorepo projection |
| [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) | Language · layer · quality discipline |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | Approved stack · ADR governance |
| [`SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md`](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) | Feature acceptance · MVP scope boundary |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Engineering architecture constitution: organization of monorepo · FE/BE · packages · feature modules · ownership · dependencies · offline/state/API philosophies · security/performance/testing/build; no code · no APIs · no schemas; gate before F6.2 |
