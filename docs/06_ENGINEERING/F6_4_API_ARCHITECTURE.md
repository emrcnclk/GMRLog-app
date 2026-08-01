# GMRLOG — Sprint F6.4: API Architecture

**Document:** `docs/06_ENGINEERING/F6_4_API_ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** F6.4 (API Architecture — how the backend exposes the product)  
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
| 9 | [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) — client organization · SDK consumer |
| 10 | [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) — platform organization · API producer |
| 11 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 12 | **This document** — API Architecture Specification (how the platform is exposed) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never invent MVP features.

Never redefine ownership — **all ownership comes from F5.1**.

This sprint specifies **HOW the backend exposes the product through APIs**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI law |
| F5 | What exists · ownership · behavior — **LOCKED** |
| F6.1 | Engineering organization · API layer philosophy (§16) |
| F6.2 | The client that consumes the API through the shared SDK |
| F6.3 | The platform that produces the API through domain modules |
| **F6.4** | The **contract surface** between them — exposure architecture |

This sprint answers:

> “How is the product exposed?”

rather than:

> “What endpoints exist?” · “What do payloads look like?” · “How is logic implemented?”

| Does | Does not |
|------|----------|
| Define API philosophy · resource orientation · REST conventions · endpoint organization · versioning · lifecycle · consistency · errors · pagination · filtering · sorting · search · upload · authn/authz boundaries · rate limiting · idempotency · public/private/internal boundaries · realtime relationship · evolution · deprecation · compatibility | Endpoint lists · OpenAPI specs · JSON schemas · DTO implementations · request/response examples · controller code · decorators · middleware · JWT/OAuth implementation · business logic |

**Gate:** Stop after this specification. Do **not** continue to Sprint F6.5 in this deliverable.

---

## Scope

**In scope:** API philosophy · resource-oriented architecture · REST conventions · endpoint organization philosophy · versioning philosophy · validation philosophy · request lifecycle · response consistency · error response philosophy · pagination (including cursor) philosophy · filtering philosophy · sorting philosophy · search philosophy · file upload philosophy · authentication boundary · authorization boundary · rate limiting philosophy · idempotency philosophy · public vs private API boundaries · internal API philosophy · service-to-service boundaries · realtime API relationship · API evolution policy · deprecation policy · compatibility rules.

**Out of scope:**

| Forbidden |
|-----------|
| Actual endpoint list · route catalog |
| OpenAPI specification bodies · JSON schemas · DTO implementations |
| Request / response examples |
| Controller code · NestJS decorators · middleware code |
| JWT / OAuth implementation |
| Business logic · algorithms · recommendation logic |
| Database schema · persistence detail |
| Product · UX · UI · IA redesign · new MVP features |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · API Philosophy · Relationship to Previous Constitutions · Contract Position |
| B | 5–8 | Resource-Oriented Architecture · REST Conventions · Endpoint Organization · Versioning |
| C | 9–16 | Request Lifecycle · Validation · Response Consistency · Errors · Pagination · Filtering & Sorting · Search · File Upload |
| D | 17–20 | Authentication Boundary · Authorization Boundary · Rate Limiting · Idempotency |
| E | 21–23 | Public / Private / Internal Boundaries · Realtime Relationship · Evolution · Deprecation · Compatibility |
| F | 24–25 | Anti-Patterns · Audit Checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the exposure architecture that every future API document, generated contract, and endpoint decision must obey.

The API is the **only sanctioned bridge** between clients and platform meaning (F6.1 §16). It is a **contract surface**, not a product.

| Prefer | Never |
|--------|-------|
| Resources that mirror F5.1 ownership | Endpoints that invent product structure |
| One consistent dialect across all domains | Per-domain private conventions |
| Additive, honest evolution | Silent breaking changes |
| Access outcomes on shared meaning | Duplicate API universes per role |
| Boring, predictable contracts | Clever transport magic |

---

# 2. API Philosophy

## 2.1 The API is a projection, not an author

| Truth | Owner |
|-------|-------|
| What resources exist | F5.1 ownership map — frozen |
| What a resource means | Owning platform domain (F6.3 §6) |
| How clients consume it | Shared API SDK (`@gmrlog/api` — F6.2 §11) |
| How it is exposed | **This document** |

The API never creates a room the product does not have, and never hides a room the product does have behind transport trickery.

## 2.2 API laws

| Law |
|-----|
| One API dialect — conventions are global, not per-team taste |
| REST is the approved architecture (`TECH_STACK_DECISIONS.md`) — this document organizes it |
| Contracts are documented (OpenAPI as documentation vehicle) and the client SDK is generated from them — clients never hand-roll transport |
| Same meaning → same contract for every client (Mobile · Web · Admin where applicable) |
| Guest · soft-gate · role differences are **access outcomes**, not separate endpoints for the same meaning |
| Transport shapes are not domain models — mapping happens at declared edges (F6.2 facades · F6.3 controllers) |
| The API never encodes engagement machinery (streak pressure endpoints · FOMO payloads · manipulation flags) |

## 2.3 Consumer contract

| Consumer | Relationship |
|----------|--------------|
| Mobile / Web clients | Consume via generated `@gmrlog/api` SDK only |
| Admin client | Same dialect · staff-isolated surface (§21) |
| Internal services / jobs | Internal boundaries (§21) — never through the public surface as a workaround |
| Third parties | **No public API in Version 1** (F2.29 §15.1 — Public API is Version 2) |

---

# 3. Relationship to Previous Constitutions

| Prior law | API obligation |
|-----------|----------------|
| F5.1 | Resources and their nesting mirror ownership — Shared Destinations are singular resources; no per-tab duplicates |
| F5.2 | Feed exposure is aggregation output — it never becomes the owner of Game / Post / Review meaning |
| F5.3 | Player-facing capabilities exposed only for cataloged screens (or amendments) — no endpoint without a product surface |
| F5.4 | Response and error philosophy must make honest client states expressible (loading · empty · error · pending) |
| F5.5 §20.1 | MVP scope boundary binds what may be exposed — Version 2 capabilities receive no endpoints |
| F2.21 · F2.19 amendments | Steam Import · Discord linking · Semantic Similarity Recommendation exposed as optional, assistive capabilities — never foundations, never assistant/chat surfaces |
| F6.1 §16 | API layer is the only bridge · consistent pagination/filtering/expand patterns · additive evolution |
| F6.2 §11 | Client server-state honesty depends on contract honesty — cache keys and staleness derive from stable contracts |
| F6.3 §8–§9 | Routes are transport projections · controllers are thin adapters — this document gives them their shared dialect |
| `TECH_STACK_DECISIONS.md` | REST · OpenAPI · `/api/v1` versioning · Zod validation · Socket.IO realtime — organized here, not re-selected; changes require ADR |

On conflict, the higher law wins. API convenience never overrides F5 ownership.

---

# 4. Contract Position

## 4.1 Where the contract lives

```
apps/backend (domain modules — F6.3)
      │  exposes through
      ▼
API CONTRACT SURFACE (this document’s subject)
  documented via OpenAPI (documentation vehicle · not law)
      │  generates
      ▼
packages/api (@gmrlog/api — shared client SDK)
      │  consumed by
      ▼
apps/mobile · apps/web · apps/admin (feature API facades — F6.2)
```

## 4.2 Contract position laws

| Law |
|-----|
| The contract is owned jointly — changes require cross-boundary review (F6.2 §18.3) |
| Generated SDK is the only sanctioned client transport — hand-rolled clients are banned |
| Shared meaning types live in `@gmrlog/types` · shared validation in `@gmrlog/validators` — the contract references shared language, it does not fork it |
| OpenAPI documents the contract — it never becomes a place to invent product meaning |
| This document defines the dialect; later API documents fill the catalog under this dialect |

---

# PART B — SHAPE OF EXPOSURE

---

# 5. Resource-Oriented Architecture

## 5.1 Resources mirror ownership

The API is organized around **resources**, and resources are **projections of F5.1 ownership homes**.

| Resource family (philosophy) | F5.1 source |
|------------------------------|-------------|
| Shared Destination resources | Game · Post · Review · Collection · Tier · User · Community · Event · Achievement |
| Root projection resources | Feed (Home aggregation) · Discover indexes · Library archive · Notifications · Profile self |
| Gate / control resources | Session · Onboarding readiness · Settings · Connected Accounts · Messages |
| Task resources | Compose intents · Import intents · Account link intents · Reports |
| Staff resources | Admin / Moderation — isolated (§21) |
| Guest adapter resources | Integration callbacks — adapter-owned |

## 5.2 Resource laws

| Law |
|-----|
| One meaning → one resource family — never two resource trees for the same room |
| Sub-resources express containment that product law defines (Community children · Collection entries) — never invented hierarchy |
| Aggregations (Feed · Discover hubs) are read projections over owned resources — they expose composition, not ownership |
| Actions that are not CRUD are modeled as intent/task resources or explicit action sub-resources — sparingly, consistently, never as RPC sprawl |
| Resource naming follows shared constants and naming discipline (`CODING_STANDARDS.md`) — one canonical name per meaning |

---

# 6. REST Conventions

## 6.1 Dialect

| Convention | Rule |
|-----------|------|
| Methods | Standard HTTP semantics — reads are safe · writes are explicit · deletes are honest |
| Nouns over verbs | Resources are nouns; verbs appear only in sanctioned intent/action patterns |
| Plural resource collections | One pluralization convention everywhere |
| Identifiers | Opaque, stable identifiers — clients never parse meaning out of IDs |
| Status semantics | One shared mapping of outcome categories → status classes — no per-domain reinterpretation |
| Casing · naming | One casing convention for paths · query parameters · fields — defined once, obeyed everywhere |
| Time · locale | One timestamp convention · locale-neutral payloads — presentation formatting is the client’s job (F6.2 §17) |

Concrete values (exact status codes per case, casing choice, header names) are fixed in the subordinate API standards document generated under this dialect — once, globally, never per feature.

## 6.2 Convention laws

| Law |
|-----|
| No endpoint may deviate from the dialect for convenience |
| No hidden side effects on safe methods |
| No tunneling writes through reads or deletes through updates |
| No client-specific endpoint variants for the same meaning (F4.11 kinship: adaptation never forks identity) |

---

# 7. Endpoint Organization Philosophy

## 7.1 Organization mirrors domains

| Principle |
|-----------|
| Endpoints group by owning domain (F6.3 §6) — the URL space is a map of ownership, not of teams |
| Shared Destination endpoints live under their shared resource family — never under a tab’s namespace |
| Root projections (feed · discover · library · notifications · profile) expose orchestration reads under their own namespaces |
| Task intents (compose · import · link · report) are organized as explicit intent surfaces — cancellable · inspectable · non-trapping (F5.4) |
| Staff endpoints live in an isolated namespace — never interleaved with player surfaces |
| Integration callbacks live under adapter namespaces — never disguised as core identity surfaces |

## 7.2 Organization laws

| Law |
|-----|
| A new namespace requires a new owning domain (F6.3 admission) — never the reverse |
| No “misc” namespace |
| Namespace depth stays shallow and meaningful — nesting expresses ownership, not implementation history |
| This document does not enumerate endpoints — the catalog lives in subordinate API documents under this organization |

---

# 8. Versioning Philosophy

## 8.1 Posture

| Rule |
|------|
| One global version prefix (`/api/v1` per approved stack) — versioning is platform-wide, not per-endpoint |
| Version 1 is the MVP contract surface — it exposes only MVP scope (F5.5 §20.1) |
| New major versions are exceptional events requiring architectural review — not a release habit |
| Within a version, evolution is **additive** (§23) |
| Version negotiation lives in the path — not in fragile header dialects per team |

## 8.2 Versioning laws

| Law |
|-----|
| No per-domain version forks (`/api/v1/games` and `/api/v2/reviews` coexisting as a lifestyle is banned) |
| Deprecation inside a version follows §23 policy — never silent removal |
| Internal boundaries (§21) version by contract packages — not by public path theatrics |

---

# PART C — LIFECYCLE · CONSISTENCY

---

# 9. Request Lifecycle

Every request travels the same declared path (projection of F6.3 §5.2):

```
Client feature facade (F6.2)
  → @gmrlog/api SDK call
    → Platform edge (rate · correlation ID attachment)
      → Authentication boundary (identity attachment — §17)
        → Validation boundary (schema honesty — §10)
          → Authorization decision (§18)
            → Controller (thin transport adapter — F6.3 §9)
              → Application service (use case — F6.3 §10)
                → Repositories / ports (F6.3 §11)
              ← normalized response envelope (§11)
            ← or normalized error outcome (§12)
```

| Lifecycle law |
|---------------|
| The order is fixed — authn before validation-of-protected-meaning before authz before use case |
| Every request carries a correlation ID from edge to logs to jobs (F6.3 §16) |
| Side effects (jobs · events · realtime emits) fire after authoritative success — never speculatively |
| No layer is skippable for convenience |

---

# 10. Validation Philosophy

| Principle |
|-----------|
| One validation language: shared Zod schemas (`@gmrlog/validators`) define meaning once for client courtesy and platform enforcement (F6.2 §13 · F6.3 §12) |
| Platform validation is authoritative — never trust client input |
| Validate at the boundary; re-assert domain invariants at domain edges |
| Validation failure is a structured, field-aware outcome (§12) — never a stack trace, never a vague rejection |
| Unknown fields are rejected or ignored by one global policy — not per-endpoint mood |
| Validation never forks per client — schema changes amend the shared package |

This document does not define schemas.

---

# 11. Response Consistency

## 11.1 One envelope philosophy

| Rule |
|------|
| All success responses share one envelope philosophy — data · metadata (pagination cursors · freshness where honest) — defined once in subordinate standards |
| All list responses share one collection shape (§13) |
| Field semantics are stable — a field name never means different things in different domains |
| Nullability and absence are honest: absent means absent — never fake defaults that lie about state |
| Freshness/staleness metadata supports client honesty (F6.2 §11) — never fake liveness |
| Expansion/inclusion of related resources follows one global pattern (F6.1 §16) — not per-domain invention |

## 11.2 Consistency laws

| Law |
|-----|
| Clients must be able to treat the dialect generically — SDK generation depends on it |
| No endpoint invents a private envelope |
| Response shapes serve F5.4 states — a client must always be able to render honest loading/empty/error/success from what the API returns |

---

# 12. Error Response Philosophy

| Principle |
|-----------|
| Errors are contracts: one stable error shape — category · machine-readable code · human-safe message · field details where applicable · correlation ID |
| Categories align with F6.3 §15: validation · authn · authz · not-found · conflict · rate · unavailable · internal |
| Internal details never leak — messages are safe for display and honest in meaning |
| Access denials are explicit outcomes — not fake not-found theater used to manipulate (F6.3 §14); privacy-motivated indistinguishability, where product law requires it, is a documented policy — not an ad-hoc trick |
| Error codes are a governed vocabulary — added deliberately, never renamed silently |
| Every error maps cleanly to an F5.4 client state — calm recovery, no guilt copy |

---

# 13. Pagination Philosophy

## 13.1 Cursor-first

| Rule |
|------|
| Cursor pagination is the default for all product lists — feeds · archives · members · activity · results |
| Cursors are opaque — clients never construct or parse them |
| Page stability is honest: cursors tolerate insertion churn without duplication lies |
| Offset pagination is allowed only where cursors add nothing (small bounded staff/admin lists) — as a documented exception |
| One pagination contract shape everywhere — limit semantics · cursor fields · has-more truth defined once |

## 13.2 Pagination laws

| Law |
|-----|
| Feed pagination obeys F5.2 rhythm — calm continuation · no engagement-bait infinite tricks |
| No endpoint invents a private pagination dialect |
| Total counts are provided only where truthful and affordable — never fake precision |

---

# 14. Filtering & Sorting Philosophy

| Principle |
|-----------|
| One query-parameter convention for filters and sorts across all domains |
| Filterable and sortable fields are an explicit, documented allowlist per resource — never “anything goes” into the datastore |
| Filters express product-meaningful facets (F2.10 · F5.3 catalog semantics) — not raw column exposure |
| Sort defaults are product-honest (recency · relevance as product law defines) — never engagement-optimized dark defaults |
| Complex queries belong to search (§15) — filtering does not grow into a private query language |
| Invalid filter/sort input fails as validation — not as silent ignoring that lies about results |

---

# 15. Search Philosophy

| Principle |
|-----------|
| Search is a **read projection** over owned domains via the approved search system (Meilisearch) — search is never the system of record (F6.3 §19) |
| Search exposure lives under Discover-aligned ownership (F5.1: search belongs to Discover) — one search surface philosophy, not per-domain clones |
| Indexes mirror product entities (games · users · reviews · posts · collections · tiers · communities · events) — indexing is triggered by domain writes |
| Result shapes follow the same response dialect (§11) and pagination (§13) |
| Semantic Similarity Recommendation exposure is assistive data provision on recommendation slots (F2.19 amendment) — never a chat/assistant surface, never a generative endpoint |
| Search honesty: no result manipulation for engagement · sponsored theater is banned by product law |

---

# 16. File Upload Philosophy

| Principle |
|-----------|
| Uploads are **domain-owned intents** (avatar · cover · attachment — F6.3 §5.5) — the API exposes intent → grant → confirm phases as one consistent pattern |
| Clients receive platform-mediated upload grants — never embedded storage credentials |
| Binary transport does not flow through JSON API bodies as a habit — grant-based direct-to-storage is the philosophy; exceptions are documented |
| Upload confirmation is authoritative — media exists for the product only after platform confirmation |
| Processing (variants · moderation hooks) is asynchronous and observable — pending media is an honest state (F5.4) |
| Limits (size · type) are validated at grant time with honest errors — not discovered at failure time |

---

# PART D — TRUST AT THE SURFACE

---

# 17. Authentication Boundary

| Law |
|-----|
| Identity attachment happens at the platform edge, before protected meaning (F6.3 §13) |
| The API distinguishes: anonymous guest · authenticated player · staff — as identity classes, not as separate API universes |
| Session mechanics (tokens · refresh) are organized behind the boundary — this document does not define JWT/OAuth implementation |
| Soft-gated reads (product law) are honest: guests receive what product law grants — never accidental leakage, never bait-and-switch |
| Connected Accounts (Discord · Steam) authenticate **linking**, not platform identity foundations (F2.21) |
| Authentication failures are one error category (§12) — never disguised as other outcomes |

---

# 18. Authorization Boundary

| Law |
|-----|
| Every protected capability is authorized on the platform per owning-domain policy (F6.3 §14) — the API surface exposes outcomes |
| Authorization is resource-aware: subject × action × resource — not endpoint-name theater |
| The same resource returns access-honest projections per role — one contract, filtered honestly; never parallel endpoint trees per role |
| Staff capabilities exist only on staff surfaces (§21) |
| Authorization failures are explicit category outcomes — clients render F5.4 contracts from them |
| Permission design never encodes engagement coercion |

---

# 19. Rate Limiting Philosophy

| Principle |
|-----------|
| Rate limiting protects the Digital Home from abuse — it never harasses legitimate play |
| Limits are class-based (identity class · surface sensitivity · write vs read) — one governed policy, not per-endpoint improvisation |
| Rate outcomes are honest contract errors (§12 category: rate) with recovery guidance — never silent throttling that lies about system state |
| Trust-sensitive surfaces (auth attempts · linking · report) carry stricter classes by policy |
| Limits are observable (F6.3 §16) — operators see pressure before players feel pain |
| Concrete thresholds live in subordinate policy documents — never hardcoded folklore |

---

# 20. Idempotency Philosophy

| Principle |
|-----------|
| Safe methods are naturally idempotent — guaranteed by design, not by luck |
| Client-generated idempotency keys are the philosophy for non-idempotent writes where duplication harms meaning (compose · import intents · linking) |
| Retries by the SDK or offline queue (F6.2 §11.3) must be safe — the contract makes duplicate intent detectable |
| Idempotent replay returns the original outcome honestly — never a second side effect, never a confusing new error |
| Task intents (import · link) are resumable and inspectable — aligned with F5.4 cancellable/non-trapping law |
| One idempotency convention everywhere — not per-domain invention |

---

# PART E — BOUNDARIES · REALTIME · EVOLUTION

---

# 21. Public vs Private API Boundaries · Internal APIs · Service-to-Service

## 21.1 Surface classes

| Surface | Consumers | Rules |
|---------|-----------|-------|
| **Player API** (`/api/v1` philosophy) | Mobile · Web via generated SDK | The primary contract — everything in this document applies fully |
| **Staff API** | Admin client | Isolated namespace · same dialect · staff identity classes · never mixed into player surfaces |
| **Internal boundaries** | Platform services · jobs · realtime fan-out | Contract-package based (shared types) · in-process module exports or declared internal surfaces — never consuming the public API as a workaround |
| **Integration callbacks** | Guest platforms (Steam · Discord) | Adapter-owned · verified · minimal — guests never gain player-API powers |
| **Public third-party API** | External developers | **Does not exist in Version 1** (F2.29 §15.1) — no endpoint, no beta, no scaffolding under MVP |

## 21.2 Boundary laws

| Law |
|-----|
| A capability is exposed on exactly the surfaces that need it — never “public by default” |
| Internal shortcuts never bypass domain ownership — service-to-service calls go through exported domain surfaces (F6.3 §5.3) |
| Service-to-service communication stays within declared contracts — no reaching into another domain’s persistence |
| Staff surfaces never leak into player SDK generation |
| Future public API (Version 2) will be a deliberate product decision — nothing in Version 1 pre-commits its shape |

---

# 22. Realtime API Relationship

| Principle |
|-----------|
| Realtime (Socket.IO per approved stack) is a **delivery channel** for owned domain events — not a second API (F6.3 §5.6) |
| Realtime event names and payload meaning derive from the same shared contract language (`@gmrlog/types` · `@gmrlog/websocket`) — one vocabulary, not a parallel dialect |
| Realtime delivers what REST could truthfully return — it accelerates honesty, it never invents state |
| Authentication and authorization apply to realtime connections with the same identity classes (§17–§18) |
| Realtime lands in client server-state under the same cache keys (F6.2 §11.4) |
| Realtime never becomes attention machinery — no engagement pings, no live-pressure theater (F5.2) |

---

# 23. API Evolution · Deprecation · Compatibility

## 23.1 Evolution policy

| Rule |
|------|
| Within a version, evolution is **additive**: new resources · new optional fields · new optional parameters |
| Additions never change the meaning of existing fields |
| Contract changes flow: OpenAPI documentation → SDK regeneration → cross-boundary review (F6.2 §18.3) — in that governance, no silent drift |
| Exposure of new product capability requires the product law to exist first (F5 amendment before endpoint) |

## 23.2 Deprecation policy

| Rule |
|------|
| Deprecation is announced in the contract (documented, machine-visible) before behavior changes |
| Deprecated surfaces keep working through a declared grace window — clients are migrated, not ambushed |
| Removal happens only after all first-party consumers are verified off the surface |
| Deprecation never silently degrades honesty (a deprecated field must stay truthful until removed) |

## 23.3 Compatibility rules

| Rule |
|------|
| Never: renaming fields in place · changing types in place · repurposing error codes · narrowing enums silently |
| Enum-like vocabularies grow additively; clients must tolerate unknown values gracefully (forward compatibility duty on the SDK) |
| Pagination cursors remain decodable across compatible releases — or fail honestly as expired |
| Breaking needs → new major version (§8) with architectural review — never “just this once” exceptions |

---

# PART F — CLOSE

---

# 24. Anti-Patterns

| Banned |
|--------|
| Endpoints without a cataloged F5.3 surface or F5 amendment |
| Resource trees that fork Shared Destinations per tab |
| Per-domain conventions: private envelopes · private pagination · private error shapes |
| Verb-sprawl RPC APIs that hide ownership |
| Client-specific endpoint variants for the same meaning |
| Hand-rolled clients bypassing the generated SDK |
| Public third-party API scaffolding under MVP |
| Version 2 capabilities exposed under Version 1 naming |
| Silent breaking changes · in-place field renames · repurposed error codes |
| Fake not-found used to manipulate (outside documented privacy policy) |
| Rate limiting as engagement throttling or punishment theater |
| Non-idempotent retries that duplicate player intent |
| Uploads via embedded storage credentials in clients |
| Realtime as a parallel API dialect or engagement ping machine |
| Search as system of record · generative assistant endpoints disguised as recommendations |
| Internal services consuming the public API as a workaround |
| OpenAPI used to invent product meaning absent from F5 |
| Treating F6.4 as authority over F5 ownership or F6.1–F6.3 organization |

---

# 25. Audit Checklist

- [ ] Defines how the platform is exposed — no endpoint list · no schemas · no examples · no code  
- [ ] All ownership derives from F5.1 · no product/UX/UI/IA redesign · no invented MVP features  
- [ ] Resource orientation mirrors ownership · Shared Destinations singular · aggregations are projections  
- [ ] One global REST dialect: conventions · envelope · errors · pagination · filtering · sorting defined as philosophy  
- [ ] Versioning: one global prefix · additive within version · major versions exceptional  
- [ ] Request lifecycle order fixed: edge → authn → validation → authz → controller → service  
- [ ] Validation via shared schemas · platform authoritative · honest failures  
- [ ] Cursor-first pagination · allowlisted filters/sorts · search as projection · grant-based uploads  
- [ ] Authn/authz as identity classes and access outcomes — no parallel API universes  
- [ ] Rate limiting and idempotency as governed, honest, single conventions  
- [ ] Public/staff/internal/integration boundaries explicit · no V1 third-party API  
- [ ] Realtime as delivery channel under the same vocabulary  
- [ ] Evolution · deprecation · compatibility policies explicit and honest  
- [ ] Compatible with F6.1 §16 · F6.2 §11 · F6.3 §8–§15 and subordinate stack docs  
- [ ] Gate: stop — do not continue to F6.5 in this deliverable  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Sprint F6.4 — API Architecture** delivered as **DRAFT**.

This document is the working SSOT candidate for **API exposure architecture** under F1–F5 · F6.1–F6.3.

Stop.

Do **NOT** continue to Sprint F6.5 until F6.4 is explicitly advanced / LOCKED by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) | Engineering organization · API layer philosophy |
| [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) | SDK consumer · client server-state honesty |
| [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) | API producer · domains · layers · Trust boundaries |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | **LOCKED** ownership source for all resources |
| [`F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | **LOCKED** feed aggregation boundaries |
| [`F5_3_SCREEN_SPECIFICATIONS.md`](../05_PRODUCT_ARCHITECTURE/F5_3_SCREEN_SPECIFICATIONS.md) | **LOCKED** screen catalog — exposure precondition |
| [`F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | **LOCKED** honest client states the API must serve |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **LOCKED** MVP scope boundary |
| [`SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md`](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) | MVP vs Version 2 boundary (no V1 public API) |
| [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) | `packages/api` · shared contract packages |
| [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) | Naming · layer discipline |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | REST · OpenAPI · `/api/v1` · Zod · Socket.IO — ADR governance |
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — API architecture: resource orientation mirroring F5.1 · one REST dialect · versioning · lifecycle · consistency · errors · cursor pagination · filtering/sorting/search · uploads · authn/authz/rate/idempotency boundaries · public/staff/internal surfaces · realtime relationship · evolution/deprecation/compatibility; no endpoints · no schemas · no code; gate before F6.5 |
