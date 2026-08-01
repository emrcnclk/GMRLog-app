# GMRLOG — Sprint F6.3: Backend Architecture

**Document:** `docs/06_ENGINEERING/F6_3_BACKEND_ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** F6.3 (Backend Architecture — organization only)  
**Last Updated:** July 2026  
**Owner:** Engineering Architecture Director  
**Classification:** Engineering Architecture

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
| 8 | [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) — engineering organization constitution |
| 9 | [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) — frontend organization (boundary peer) |
| 10 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 11 | **This document** — Backend Architecture Specification (how the backend is organized) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never introduce new MVP features.

Never redefine **what** GMRLOG is.

This sprint specifies **HOW the backend is organized**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI law |
| F5 | What exists · how it behaves · how implementation stays consistent — **LOCKED** |
| F6.1 | How engineering systems, packages, modules and boundaries are organized |
| F6.2 | How the frontend projects F6.1 onto the client |
| **F6.3** | How the **backend / platform** projects F6.1 onto server organization |

This sprint answers:

> “How is the backend organized?”

rather than:

> “What endpoints exist?” · “What does the schema look like?” · “How is business logic coded?”

| Does | Does not |
|------|----------|
| Define NestJS application organization · domain modules · shared domains · routing philosophy · controller / service / repository responsibilities · DI · validation · authn/authz boundaries · errors · jobs · storage · logging · observability · security · scalability · dependency rules · package boundaries | API endpoints · request/response schemas · database schema · SQL · collections · Redis structure · recommendation algorithms · authentication/JWT implementation · queue implementation · cloud provider · DevOps · infrastructure |

**Stack note:** `TECH_STACK_DECISIONS.md` approves **NestJS** (HTTP engine: **Fastify**) as the backend application framework. This document organizes that approved stack. It does **not** re-select the stack and does **not** introduce Express as a competing foundation. Stack changes require ADR.

**Gate:** Stop after this specification. Do **not** continue to Sprint F6.4 in this deliverable.

---

## Scope

**In scope:** Backend mission and philosophy · relationship to prior constitutions · monorepo backend position · NestJS application architecture · Dependency Injection philosophy · module architecture · domain ownership · shared domain philosophy · routing philosophy · controller / service / repository responsibilities · validation philosophy · authentication boundary · authorization philosophy · error handling · background jobs philosophy · file storage philosophy · logging · observability · security principles · scalability · dependency rules · package boundaries.

**Out of scope:**

| Forbidden |
|-----------|
| API endpoint definitions · OpenAPI bodies · request/response schemas |
| Database schemas · migrations · Prisma models · SQL · Mongo collections |
| Redis key layouts · queue payload schemas · job schedule values |
| Recommendation / ranking / similarity algorithms |
| Authentication implementation · JWT issuance/refresh code · OAuth flow code |
| Queue worker implementation · cloud provider selection · DevOps · infrastructure runbooks |
| Product · UX · UI · IA redesign · new MVP features · Version 2 scaffolding |
| Source code · snippets · syntax tutorials |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Backend Philosophy · Relationship to Previous Constitutions · Backend Position inside Monorepo |
| B | 5–8 | NestJS Application Architecture · Module Architecture · Shared Domain Architecture · Routing Philosophy |
| C | 9–14 | Controller · Service · Repository · Validation · Authentication Boundary · Authorization |
| D | 15–17 | Error Handling · Logging & Observability · Security Principles |
| E | 18–21 | Dependency Rules · Scalability Rules · Anti-Patterns · Audit Checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the backend organization that every platform implementation must obey.

The backend is the **authoritative home of product rules, Trust, and durable meaning**. It projects the frozen Product Architecture (F5) through the frozen engineering organization (F6.1). It never becomes a second Source of Truth for product IA, UX feel, or visual systems.

| Prefer | Never |
|--------|-------|
| Domains that mirror F5.1 ownership | Technical folders that invent parallel product meaning |
| Clear layer responsibilities | Controllers that own business invariants |
| Shared contracts with the client | Private transport dialects per feature |
| Honest errors and access outcomes | Silent failures · engagement manipulation |
| Guest adapters for integrations | Treating Steam / Discord as foundations |

---

# 2. Backend Philosophy

## 2.1 The backend is Trust’s home

| Quality | Architectural consequence |
|---------|---------------------------|
| Authoritative | Domain rules · permissions · Trust decisions live here — not only on the client |
| Owned | Every capability maps to an F5.1 ownership home or guest-adapter boundary |
| Honest | Access denials · validation failures · soft-gates are explicit outcomes — never vague |
| Calm | No engagement machinery · no manipulation systems · no casino urgency in jobs or APIs |
| Bounded | Modules own one meaning; they do not absorb Shared Destinations into a tab domain |
| Optional-integration-aware | Steam · Discord remain guests (F2.21) — core Digital Home works without them |

## 2.2 Backend laws

| Law |
|-----|
| Platform owns business invariants; clients reflect them (F6.1 §7 · F6.2 §2) |
| Domains map to F5.1 ownership — not to arbitrary technical nouns alone |
| Shared Destinations have shared (or singular) domain homes — never copied under Home / Discover / Library |
| Guest integrations are adapters — never identity foundations |
| Transport shapes are not product meaning — mappers separate them |
| Soft-gates and role differences are access outcomes — not separate product universes |
| Version 2 scopes receive no MVP domain scaffolding (F5.5 §20.1) |

## 2.3 Preference order

1. Constitutional obedience (F1–F5 · F6.1 · F6.2 boundary law)
2. Clear ownership and dependency direction
3. Reuse of shared packages and kernel primitives
4. Simplicity and readability
5. Scalability and maintainability
6. Local delivery speed

If a shortcut breaks F5 ownership or Trust defaults, it is illegitimate.

---

# 3. Relationship to Previous Constitutions

| Prior law | Backend obligation |
|-----------|--------------------|
| F2.1 · F5.1 | Five player roots + Shared Destinations + gate/control/task/staff — domain modules mirror this map; no sixth player root; staff isolated |
| F5.2 | Feed aggregation may orchestrate many domains — it does not absorb them |
| F5.3 | Player-facing capabilities require a cataloged screen (or amendment) before inventing platform surfaces for them |
| F5.4 | Client behavior contracts imply honest platform outcomes (pending · success · failure · access denial) — not engagement traps |
| F5.5 §20.1 | MVP scope boundary binds what domains may exist under MVP naming |
| F2.21 · F2.19 MVP amendments | Steam Import · Discord linking · Semantic Similarity Recommendation remain optional / presentation-assistive — never foundations or generative assistants |
| F2.20 · F2.27 | Privacy · consent · Trust are engineering defaults |
| F6.1 | Monorepo · FE/BE separation · ownership mapping · dependency direction · API layer philosophy · offline honesty · security/performance/testing |
| F6.2 | Client talks only through shared API SDK; backend never imports client UI; shared contracts (`types` · `validators`) cross the boundary |
| `TECH_STACK_DECISIONS.md` | NestJS · Fastify · Prisma · PostgreSQL · Redis · BullMQ · Meilisearch · Socket.IO · Zod — this document organizes; it does not re-select; changes require ADR |
| `MONOREPO_STRUCTURE.md` | `apps/backend` · package inventory · ownership |
| `CODING_STANDARDS.md` | Strict TypeScript · layer discipline · naming |

On conflict, the higher law wins. Backend convenience never overrides F5 ownership or North Star / Trust law.

---

# 4. Backend Position inside Monorepo

## 4.1 Where the backend lives

The platform application is `apps/backend` (per `MONOREPO_STRUCTURE.md`).

```
gmrlog/
├── apps/
│   ├── backend/         ← THIS DOCUMENT’S PRIMARY SUBJECT
│   ├── mobile/          ← F6.2 client (peer — never imported)
│   ├── web/
│   └── admin/           ← staff client · talks to staff-isolated domains
└── packages/
    ├── api              ← shared API SDK / contract surface consumed by clients
    ├── types            ← shared TypeScript contracts
    ├── validators       ← shared Zod schemas (same meaning client + platform)
    ├── constants        ← shared enums · feature IDs · route name constants
    ├── auth             ← session capability helpers (client-facing + shared concerns)
    ├── database         ← Prisma / data utilities (platform-side)
    ├── websocket        ← realtime event contracts / helpers
    ├── analytics        ← measurement helpers
    ├── storage          ← object storage capability helpers
    ├── config           ← environment / runtime config loaders
    └── utils · testing  ← pure helpers · test utilities
```

## 4.2 Position laws

| Law |
|-----|
| `apps/backend` is an **assembly of domains** — not a dump of routes |
| Shared meaning packages (`types` · `validators` · `constants`) are the only sanctioned product-language bridge to clients |
| Backend never imports `apps/mobile` · `apps/web` · `packages/ui` · `packages/design-tokens` · `packages/icons` |
| Clients never import platform repositories or Nest modules |
| New platform packages follow F6.1 §8.2 admission — purpose · owner · acyclic direction · non-duplication |

## 4.3 Package boundaries (backend view)

| Package class | Backend relationship |
|---------------|----------------------|
| `types` · `validators` · `constants` | Shared product language — platform validates the same meaning the client courtesy-validates |
| `database` | Persistence utilities — consumed by repositories; never by controllers directly |
| `storage` · `websocket` · `analytics` · `config` | Capability packages — consumed through public surfaces |
| `auth` | Session/capability helpers where shared; authoritative authz remains platform-enforced |
| `api` | Client SDK generation / contract packaging — not a place to hide domain rules |
| `ui` · design packages | **Forbidden** imports from backend |

---

# PART B — APPLICATION SHAPE

---

# 5. NestJS Application Architecture

## 5.1 Framework posture

| Decision | Source | This document adds |
|----------|--------|--------------------|
| NestJS (latest stable) | `TECH_STACK_DECISIONS.md` | How modules · layers · DI are organized |
| Fastify as HTTP engine | `TECH_STACK_DECISIONS.md` | Transport adapter — not a second architecture |
| TypeScript strict | `CODING_STANDARDS.md` | Layer discipline |

This document does not define Nest configuration files, bootstrap code, or deployment topology.

## 5.2 Application shell

The platform shell wires cross-cutting concerns once:

```
PLATFORM SHELL
  Config / environment resolution
    → Logging · observability instrumentation
      → Global validation pipe (shared Zod / Nest validation pipeline philosophy)
        → Authn boundary (identity attachment — not authorization)
          → Authz guards / policies (permission decisions)
            → Domain modules (product ownership)
              → Integrations (guest adapters)
              → Jobs / workers boundary
              → Realtime boundary
```

| Shell law |
|-----------|
| Cross-cutting concerns are registered once — domains do not remount private globals |
| The shell owns boot order and Trust defaults — domains own meaning |
| Staff domains mount isolated — never as player-domain plugins |
| Changing shell order is an architectural change — amend this document |

## 5.3 Dependency Injection philosophy

NestJS DI is the **wiring mechanism**, not an excuse for hidden ownership.

| Principle |
|-----------|
| Inject interfaces / tokens at module boundaries — prefer explicit providers |
| Controllers depend on services; services depend on repositories and domain helpers; repositories depend on data access abstractions |
| Domains export a narrow public surface — other domains consume exports, not internals |
| Circular module imports are defects — resolve by extracting a shared kernel or clarifying ownership |
| DI never smuggles UI concerns, client packages, or guest SDKs of record into core domains |
| Testability is a first-class reason for DI — providers must be replaceable at boundaries |

## 5.4 Background jobs philosophy

Async work exists to keep player journeys calm (F6.1 §13 · §19). Jobs are **side effects of domain meaning**, not a parallel product.

| Job class (philosophy) | Examples of meaning (not schedules) |
|------------------------|-------------------------------------|
| Fan-out / notify | Notification delivery after a confirmed domain event |
| Media processing | Image variants after upload intent |
| Indexing triggers | Search index updates after durable writes |
| Integration sync | Optional Steam library import steps — never blocking core identity |
| Maintenance | Cleanup · expiry — never engagement streak pressure |

| Job law |
|---------|
| Jobs are enqueued after authoritative domain decisions — jobs do not invent product truth |
| Job processors live near the owning domain or a declared jobs boundary — not as orphan scripts |
| Failures are observable and retryable where safe — never silent loss of player intent |
| Jobs never implement recommendation ranking algorithms in this architecture document’s scope |
| Optional integrations offline/absent: jobs degrade honestly — absence is normal |
| Approved queue technology is organized later under ADR/stack docs — this section defines philosophy only |

## 5.5 File storage philosophy

Object storage holds **media bytes**, not product IA.

| Law |
|-----|
| Upload intents are domain-owned (avatar · cover · attachment) — storage is a capability |
| Clients obtain access through platform-mediated flows — never through embedded cloud secrets |
| Metadata and ownership live in platform domains; blobs live in object storage |
| Processing (variants · moderation hooks) is job-backed where needed |
| Storage absence or failure surfaces as honest domain errors — never fake success |
| Provider topology is out of scope here — capability contracts matter more than vendor names |

## 5.6 Realtime boundary (organization only)

Realtime (Socket.IO per approved stack) is a **delivery channel** for already-owned domain events. It does not own meaning, does not create destinations, and does not become feed pressure theater (F5.2 kinship).

---

# 6. Module Architecture

## 6.1 Definition

A **domain module** is an engineering unit that implements one F5 ownership home, one Shared Destination family, one gate/control concern, one guest adapter, or one staff overlay (F6.1 §9 · §10).

## 6.2 Domain ownership map

### 6.2.1 Root-aligned domains

| Product home | Platform domain | Owns | Does not own |
|--------------|-----------------|------|--------------|
| Home | `feed` (aggregation) | Feed assembly / pacing orchestration for Home presentation | Game · Post · Review · Community meaning as absorbed property |
| Discover | `discover` / `search` | Hub indexes · search · discovery lists · recommendation **slots** as data provision | Recommendation algorithms · Community/Event as private copies |
| Library | `library` | Archive indexes · ownership records · import orchestration entry | Game destination meaning |
| Notifications | `notifications` | Attention desk persistence · delivery orchestration | The objects notifications point to |
| Profile | `profile` | Self identity projection · achievements **index** entry points | Other-user profile as a second system · achievement definition theft |

### 6.2.2 Shared destination domains

| Shared Destination | Platform domain |
|--------------------|-----------------|
| Game | `game` |
| Post | `post` |
| Review | `review` |
| Collection | `collection` |
| Tier | `tier` |
| User (other) | `user` |
| Community (+ children) | `community` |
| Event | `event` |
| Achievement | `achievement` |

Shared domains are singular. Root domains import/orchestrate; they do not fork.

### 6.2.3 Gate · control · task · staff · guest

| Area | Platform home |
|------|---------------|
| Authentication / session boundary | `auth` (gate) — identity attachment & session lifecycle organization |
| Onboarding readiness | `onboarding` — readiness flags · not product IA invention |
| Settings · Connected Accounts | `settings` / `connected-accounts` |
| Messages | `messages` — entered from Profile in product law |
| Compose / editors / report / pickers | Task-supporting domain surfaces — not destinations |
| Admin · Moderator | `staff/admin` · `staff/mod` — isolated |
| Steam · Discord | `integrations/steam` · `integrations/discord` — **guest adapters** |

## 6.3 Internal module layering

```
domain module
├── presentation / transport adapters   # controllers · gateway handlers (thin)
├── application services                # use-case orchestration
├── domain rules                        # invariants · policies (platform-owned meaning)
├── repositories / ports                # persistence & external ports
└── jobs / events (if needed)           # async side effects of this domain
```

Exact folder names are projections. Layer meaning is not optional.

## 6.4 Module laws

| Law |
|-----|
| One Primary Owner per product surface → one primary domain |
| Cross-domain collaboration prefers events / exported services — not deep imports of internals |
| Feed aggregation orchestrates; it does not own Shared entities |
| Optional MVP integrations are modules that can be absent without blocking core Digital Home |
| No Version 2 domains under MVP names |

---

# 7. Shared Domain Architecture

## 7.1 Meaning

Shared Domains are the platform’s answer to: *one meaning · one room · many doors* (F5.1).

## 7.2 Shared domain laws

| Law |
|-----|
| A Shared Destination’s authoritative rules live in exactly one domain |
| Presentation context (which client tab opened the room) never changes platform ownership |
| Community children (Feed · Members · Activity) belong to `community` — not to Discover |
| Event detail belongs to `event` — Discover owns hub listing/orchestration only |
| Achievement definitions / progress authority belong to `achievement` — Profile indexes; Steam achievements are not imported as GMRLOG achievements (F2.14 · F2.21 MVP amendments) |
| Soft-delete · visibility · Trust checks are enforced in the shared domain — clients may hide affordances but are never the only gate |

## 7.3 Shared vs kernel

| Belongs in a shared domain | Belongs in shared kernel / packages |
|----------------------------|-------------------------------------|
| Destination invariants · ownership rules | Pagination primitives · error types · authz helpers |
| Domain events for that destination | Shared Zod schemas · shared types |
| Destination-specific repositories | Database utilities · config · storage capability |

---

# 8. Routing Philosophy

## 8.1 Routes are transport projections

HTTP (and realtime event names) **project** domain capabilities. They hold zero product-structure authority.

| Routing truth | Owner |
|---------------|-------|
| What product rooms exist | F5.1 · F5.3 — frozen |
| What a capability means | Owning domain |
| How URLs/versioning are shaped | Later API documents — must obey this philosophy |
| Route module registration | This document — organization only |

## 8.2 Routing laws

| Law |
|-----|
| Routes are grouped by domain ownership — not by accidental file convenience |
| Versioning philosophy is singular (`/api/v1` kinship per stack docs) — not per-domain private universes |
| Guest / soft-gate / role differences are expressed as **access outcomes** on the same meaning — not duplicate route trees for the same room |
| Staff routes are isolated — never mixed into player domain routers |
| Integration callbacks are adapter-owned — never core identity routes in disguise |
| Controllers registered on routes remain thin (§9) |
| This document does **not** define endpoints |

---

# PART C — LAYERS · TRUST · VALIDATION

---

# 9. Controller Responsibilities

Controllers are **transport adapters**.

| Owns | Does not own |
|------|----------------|
| Accepting transport input | Business invariants |
| Invoking the correct application service | Persistence queries |
| Mapping transport ↔ application DTOs at the edge | Authorization policy invention (beyond applying declared guards) |
| Returning normalized success / error envelopes | Ranking · recommendation logic |
| Declaring route metadata / guards wiring | Cross-domain orchestration hidden in the controller |

| Controller law |
|----------------|
| One controller family per domain transport surface — not a god controller |
| No repository injection into controllers |
| No raw SQL / ORM calls in controllers |
| No Trust decisions beyond applying shared guards/policies |
| Keep controllers boring |

---

# 10. Service Responsibilities

Services (application / domain services) are **use-case and rule homes**.

| Owns | Does not own |
|------|----------------|
| Orchestrating a use case | HTTP concerns · status code trivia |
| Enforcing domain invariants | UI copy · client navigation |
| Applying authorization decisions via policies | Designing F5 screens |
| Emitting domain events / enqueueing jobs after success | Becoming a second feed product |
| Coordinating repositories and ports | Importing client packages |

| Service law |
|-------------|
| Prefer explicit use-case services over catch-all “manager” gods |
| Transactions and consistency boundaries live here (or in explicitly owned unit-of-work helpers) — not in controllers |
| Services may call other domains only through exported public surfaces |
| Semantic Similarity Recommendation (MVP) is assistive data provision — services must not become chat/assistant/generative systems (F2.19 amendment) |
| Services never invent Version 2 capabilities under MVP |

---

# 11. Repository Responsibilities

Repositories are **persistence ports**.

| Owns | Does not own |
|------|----------------|
| Loading / saving durable records for one domain | Business policy (“may this user…?”) beyond query filters supplied by services |
| Mapping persistence models ↔ domain models | HTTP mapping |
| Query shapes needed by the owning domain | Cross-domain joins that smuggle ownership across boundaries without an orchestration owner |
| Encapsulating Prisma/data-access details | Exposing database schema as public API |

| Repository law |
|----------------|
| One domain’s repository does not become a dumping ground for all tables |
| Controllers never talk to repositories |
| Schema details stay inside the persistence boundary — this document does not define them |
| Cache is acceleration beside repositories/services — never a second source of identity truth (F6.1 §15) |

---

# 12. Validation Philosophy

| Principle |
|-----------|
| Shared Zod schemas in `@gmrlog/validators` define the same meaning for client courtesy and platform enforcement |
| Platform validation is **authoritative** — never trust client input (F6.1 §18) |
| Validation failures are honest, field-aware outcomes — never stack traces to clients |
| Soft-gate and role validation differ from schema validation — access is not a schema error |
| Validation belongs at the boundary (pipes / guards) and again at domain edges where invariants require it |
| Do not fork validators per app — amend the shared package |

This document does not define request/response schemas.

---

# 13. Authentication Boundary

## 13.1 Meaning

Authentication answers: **who is speaking?**  
It does not answer: **what may they do?** (that is authorization).

## 13.2 Boundary laws

| Law |
|-----|
| Identity attachment happens at the platform edge — before domain use cases that require a subject |
| Session / token mechanics are organized behind the auth boundary — this document does not define JWT implementation |
| Optional Connected Accounts (Discord · Steam linking) are **identity/provider guests** — Discord is never a social layer; Steam never replaces GMRLOG (F2.21 · F2.2 amendments) |
| Unauthenticated guests receive only soft-gated capabilities defined by product law — never a parallel product |
| Clients may hide affordances; they must not be the only authentication gate |
| Secrets never live in clients or docs samples as real values |

---

# 14. Authorization Philosophy

## 14.1 Meaning

Authorization answers: **may this subject perform this action on this resource?**

## 14.2 Authorization laws

| Law |
|-----|
| Authz is enforced on the platform for every protected meaning |
| Policies live near the owning domain — not as a single unmaintainable global switchboard of undocumented rules |
| Staff powers exist only in staff modules |
| Soft-gates produce honest access outcomes — not fake 404 theater used to manipulate |
| Library ownership · profile privacy · community membership · moderation powers are domain policies under Trust law |
| Authorization failures are explicit — clients map them to F5.4 error/empty contracts |
| Never encode engagement coercion as permission design |

---

# PART D — ERRORS · OBSERVABILITY · SECURITY

---

# 15. Error Handling

| Principle |
|-----------|
| Errors are a contract, not an accident |
| Normalize errors at the edge into stable categories (validation · authn · authz · not-found · conflict · rate · unavailable · internal) |
| Domain services throw / return typed domain failures — controllers do not invent ad-hoc messages |
| Internal details never leak to clients |
| Idempotent and conflict outcomes are first-class where product requires them |
| Partial failure in fan-out jobs must not corrupt authoritative writes already committed |
| Error philosophy aligns with F5.4 honesty — calm recovery, no guilt |

---

# 16. Logging & Observability

## 16.1 Logging philosophy

| Law |
|-----|
| Logs explain system behavior for operators — not for surveilling private archive content without policy |
| Correlate requests with stable request IDs across edge → service → job |
| Log structured fields (domain · action · outcome · subject id where lawful) — not sprawling dumps of PII |
| Prefer sampling noise; never silence Trust-relevant failures |
| Integration adapters log guest failures as guest failures — not as core identity collapse |

## 16.2 Observability philosophy

| Signal | Purpose |
|--------|---------|
| Metrics | Health of journeys and domains — latency · error rates · queue depth — not vanity |
| Traces | Cross-boundary path of a request/job — find ownership bottlenecks |
| Health checks | Liveness/readiness of the assembly — not a product feature |
| Crash/error reporting | Defect visibility (approved tooling kinship) — never engagement analytics in disguise |

Observability serves calm operation and Trust. It never becomes retention coercion or attention surveillance theater.

---

# 17. Security Principles

| Principle |
|-----------|
| Secure by default · least privilege |
| Never trust client input |
| Authn/authz on platform for protected meaning |
| Secrets in sealed configuration — never in repos · clients · docs as real values |
| Rate limiting · abuse resistance at the edge — without turning into harassment of legitimate play |
| Connected Accounts require explicit consent and honest scope |
| Import / OAuth tasks are cancellable and non-trapping (product law) |
| Staff isolation is a security boundary as well as an IA boundary |
| Dependency supply-chain hygiene is part of build health (F6.1) |
| Security never licenses dark patterns |

Trust alignment: security protects Digital Home — it is not surveillance costume.

---

# PART E — DEPENDENCIES · SCALE · CLOSE

---

# 18. Dependency Rules

## 18.1 Allowed direction

```
apps/backend (shell · domain modules)
  → domain public surfaces → other domains (acyclic)
    → shared kernel (errors · authz helpers · pagination primitives)
      → packages/* (database · validators · types · storage · config · utils)
        → lower-level packages
```

```
integrations/* (guest adapters)
  → owning platform ports / shared kernel
  → never become foundations imported by every domain casually
```

## 18.2 Forbidden direction

| Forbidden |
|-----------|
| `packages/*` → `apps/backend` (except generated/build-time artifacts explicitly designed as outputs) |
| Backend → `apps/mobile` · `apps/web` · `packages/ui` · design-token packages |
| Shared destination domain → root “tab” domain internals (ownership inversion) |
| Controller → Repository (skipping service) |
| Domain A deep-importing Domain B internals |
| Circular module graphs |
| Guest integration SDK as identity foundation for core domains |

## 18.3 Package boundaries (summary)

| Boundary | Rule |
|----------|------|
| Contract packages | Shared; additive evolution preferred |
| `database` | Platform-side only relative to clients |
| `ui` / tokens / icons | Client-only relative to backend |
| New package | F6.1 admission gate |

## 18.4 Code ownership

| Area | Owner |
|------|-------|
| `apps/backend` domain modules | Backend / platform team — one owner per domain mirroring F5.1 |
| `packages/database` · platform auth concerns | Backend / platform |
| `packages/types` · `validators` · `api` contracts | Shared — cross-boundary review with frontend |
| Staff domains | Staff/platform — isolated |
| Integration adapters | Integrations ownership — guests |

---

# 19. Scalability Rules

| Rule |
|------|
| Scale by splitting along product ownership — not by fashion micro-fragments |
| Feed aggregation scales as orchestration — Shared domains remain singular |
| Async jobs absorb non-critical side effects — player journeys stay responsive |
| Cache accelerates reads — never becomes identity source of truth |
| Search indexing is triggered by domain writes — search is not the system of record |
| Read replicas / partitioning / pooling are infrastructure projections — out of scope here; they must not rewrite domain ownership |
| Team scale: clear domain ownership enables parallel work without god-modules |
| Version 2 surfaces (Marketplace · Premium · Creator dashboards · Twitch · advanced AI engine) get **zero** MVP domain scaffolding |

---

# 20. Anti-Patterns

| Banned |
|--------|
| Defining endpoints · schemas · SQL · Redis layouts in this constitution’s spirit as “temporary docs inside code” without proper API/DB documents |
| Redesigning product · UX · UI · IA inside backend folders |
| New MVP features invented in domains without F5 / F2.29 acceptance |
| Version 2 domains under MVP names |
| Sixth player root implemented as a convenience module |
| Absorbing Shared Destinations into Home / Discover / Library domains |
| Controllers with business invariants or repository calls |
| Platform importing client UI packages |
| Trust enforced only on the client |
| JWT/OAuth “implemented” by scattering secrets and ad-hoc crypto across domains |
| Discord-as-social-layer architecture · Steam-as-identity-foundation architecture |
| Generative AI assistant / chat architecture disguised as recommendations |
| Offline/platform fake-success for import or sync |
| Engagement jobs (streak pressure · FOMO schedulers · addiction loops) |
| Undocumented ownership forks · “temporary” god modules |
| Treating F6.3 as authority over F5 or F6.1 |

---

# 21. Audit Checklist

- [ ] Defines how the backend is organized — not endpoints, schemas, or algorithms  
- [ ] Obeys F1–F5 · F6.1 · F6.2 boundary law · no product/UX/UI redesign · no new MVP features  
- [ ] NestJS application architecture · DI · shell · jobs · storage philosophies defined without implementation detail  
- [ ] Domain modules mirror F5.1 ownership · shared domains are singular · guests are adapters  
- [ ] Routing is transport projection only — no endpoint catalog  
- [ ] Controller / Service / Repository responsibilities explicit and non-overlapping  
- [ ] Validation · authn boundary · authz · error handling philosophies explicit  
- [ ] Logging · observability · security principles explicit and Trust-aligned  
- [ ] Dependency rules · package boundaries · scalability rules explicit  
- [ ] No API schemas · no DB schema · no SQL · no Redis structure · no JWT/queue/cloud/DevOps implementation  
- [ ] Compatible with `MONOREPO_STRUCTURE.md` · `CODING_STANDARDS.md` · `TECH_STACK_DECISIONS.md` as subordinate projections  
- [ ] Gate: stop — do not continue to F6.4 in this deliverable  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Sprint F6.3 — Backend Architecture** delivered as **DRAFT**.

This document is the working SSOT candidate for **backend / platform organization** under F1–F5 · F6.1 · F6.2.

Stop.

Do **NOT** continue to Sprint F6.4 until F6.3 is explicitly advanced / LOCKED by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) | Engineering organization constitution |
| [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) | Frontend organization · client boundary peer |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | **LOCKED** product structure · ownership |
| [`F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | **LOCKED** Home feed boundaries |
| [`F5_3_SCREEN_SPECIFICATIONS.md`](../05_PRODUCT_ARCHITECTURE/F5_3_SCREEN_SPECIFICATIONS.md) | **LOCKED** screen catalog |
| [`F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | **LOCKED** interaction contracts |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **LOCKED** implementation consistency · MVP scope boundary |
| [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) | Concrete monorepo · package inventory |
| [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) | Language · layer · quality discipline |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | Approved backend stack · ADR governance |
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Backend architecture: NestJS (Fastify) application organization · domain/shared modules · routing philosophy · controller/service/repository · DI · validation · authn/authz boundaries · errors · jobs · storage · logging/observability · security · dependencies · scalability; no endpoints · no schemas · no algorithms · no infra; gate before F6.4 |
