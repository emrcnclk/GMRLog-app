# GMRLOG — Sprint F6.5: Data Architecture

**Document:** `docs/06_ENGINEERING/F6_5_DATA_ARCHITECTURE.md`  
**Version:** 1.1  
**Status:** **DRAFT**  
**Sprint:** F6.5 (Data Architecture — organization of durable and projected data only)  
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
| 9 | [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) — client organization · temporary presentation state |
| 10 | [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) — platform organization · durable truth owner |
| 11 | [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) — exposure contract · projections as transport |
| 12 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 13 | **This document** — Data Architecture Specification (how data is organized) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never invent MVP features.

Never redefine ownership — **product ownership defined in F5.1 cannot be violated**.

This sprint specifies **HOW data is organized**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI law |
| F5 | What exists · ownership · behavior — **LOCKED** |
| F6.1 | Engineering organization · data & memory layer role |
| F6.2 | Frontend — temporary presentation state only |
| F6.3 | Backend — durable truth · repositories · domains |
| F6.4 | API — how durable meaning is exposed |
| **F6.5** | How **data** is owned, bounded, projected, lifecycle-managed |

This sprint answers:

> “How is data organized?”

rather than:

> “What does the schema look like?” · “How is it queried?” · “How is it cached?”

| Does | Does not |
|------|----------|
| Define data philosophy · ownership · aggregate boundaries · entity responsibility · source of truth · read/write model split · search · cache · transactions · consistency · events · lifecycle · soft delete · audit · versioning · migration philosophy · validation boundaries · performance · scalability · dependency rules | Database schemas · Prisma models · SQL · migrations · indexes · Mongo collections · Redis keys · caching implementation · algorithms · configuration · code · examples |

**Stack note:** `TECH_STACK_DECISIONS.md` approves **PostgreSQL** (authoritative store), **Prisma** (persistence access organization), **Redis** (cache / ephemeral acceleration), **Meilisearch** (search projection). This document assigns architectural responsibilities only. It does **not** configure them, schema them, or implement them. Stack changes require ADR.

**Gate:** Stop after this specification. Do **not** continue to Sprint F6.6 in this deliverable.

---

## Scope

**In scope:** Mission · relationship to prior constitutions · data philosophy · data ownership principles · domain ownership · aggregate boundaries · entity responsibility · source of truth · read model vs write model · search architecture philosophy · cache philosophy · transaction philosophy · consistency philosophy · event propagation · data lifecycle · soft delete · audit history · versioning · migration philosophy · data validation boundaries · performance principles · scalability principles · dependency rules.

**Out of scope:**

| Forbidden |
|-----------|
| Database schemas · table designs · column lists |
| Prisma models · schema files · generated client usage tutorials |
| SQL · queries · indexes · partitions as implementation |
| Mongo collections · document shapes |
| Redis key layouts · TTL values · command sequences |
| Cache invalidation code · Meilisearch index settings |
| Algorithms · ranking · recommendation engines |
| Migrations as scripts · migration tool configuration |
| Product · UX · UI · IA redesign · new MVP features |
| Source code · snippets · configuration examples |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Relationship · Data Philosophy · Ownership Principles |
| B | 5–9 | Domain Ownership · Aggregates · Entity Responsibility · Source of Truth · Read/Write Models |
| C | 10–14 | Search · Cache · Transactions · Consistency · Event Propagation |
| D | 15–20 | Lifecycle · Soft Delete · Audit · Versioning · Migration · Validation Boundaries |
| E | 21–24 | Performance · Scalability · Dependency Rules · Anti-Patterns · Audit Checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the data organization that every future persistence document, projection, and storage decision must obey.

Data architecture is a **projection of F5.1 ownership into durable and ephemeral memory**. It never becomes a second Source of Truth for product meaning.

| Prefer | Never |
|--------|-------|
| One owner per entity | Entities claimed by two domains |
| Authoritative store for durable truth | Search or cache as systems of record |
| Projections that can be rebuilt | Projections that invent meaning |
| Honest lifecycle states | Silent deletion theater |
| Boundaries that mirror Shared Destinations | Copying Shared meaning under tab domains |

---

# 2. Relationship to Previous Constitutions

| Prior law | Data obligation |
|-----------|-----------------|
| F5.1 | **Every entity has exactly one owner.** Shared Destinations remain singular. Product ownership cannot be violated by table convenience or folder habit |
| F5.2 | Feed data is an aggregation projection — it does not absorb Game · Post · Review · Community ownership |
| F5.3 | Durable data exists to serve cataloged surfaces — no orphan product meaning invented for storage convenience |
| F5.4 | Lifecycle and error honesty in data (pending · soft-deleted · unavailable) must be expressible to clients |
| F5.5 §20.1 | Version 2 scopes receive no MVP data scaffolding under MVP names |
| F2.21 · F2.19 · F2.14 amendments | Steam import is optional guest data · Discord is identity guest · GMRLOG Achievements are platform-owned · Steam achievements are not imported as GMRLOG truth · Semantic Similarity is assistive projection, not generative memory |
| F6.1 §5 · §14–§16 | Data & memory layer · offline honesty · cache as acceleration · API never owns schema |
| F6.2 | **Frontend owns temporary presentation state** — never durable product records as source of truth |
| F6.3 | **Backend owns durable truth** — repositories · domains · jobs that update projections |
| F6.4 | API exposes owned meaning — search and list shapes are projections of this architecture |
| `TECH_STACK_DECISIONS.md` | PostgreSQL · Prisma · Redis · Meilisearch — roles only; no configuration here |

On conflict, the higher law wins. Storage convenience never overrides F5.1 ownership.

---

# 3. Data Philosophy

## 3.1 Immutable data laws

| Law |
|-----|
| **Backend owns durable truth.** |
| **Frontend owns temporary presentation state.** |
| **Database remains authoritative.** |
| **Search is a projection, never the source of truth.** |
| **Cache is disposable.** |
| **Read models may differ from write models.** |
| **Events synchronize projections.** |
| **Every entity has exactly one owner.** |
| **Shared Destinations remain singular.** |
| **Product ownership defined in F5.1 cannot be violated.** |

## 3.2 What data is for

| Role of data | Meaning |
|--------------|---------|
| Durable records | Authoritative product meaning under domain ownership |
| Projections | Optimized reads · search · caches — rebuildable · never foundational |
| Ephemeral client state | Continuity · drafts · UI — never authoritative Trust |
| Guest integration payloads | Temporary or mirrored guest facts — never identity foundations |

## 3.3 Preference order

1. Constitutional ownership (F5.1)
2. Authoritative store integrity
3. Clear aggregate boundaries
4. Rebuildable projections
5. Honest lifecycle and consistency
6. Performance via projection — not by forking truth

---

# 4. Data Ownership Principles

| Principle |
|-----------|
| Ownership of data follows ownership of product meaning (F5.1 → F6.3 domains → this document) |
| A domain that does not own a meaning may **read** through declared contracts — it may not **write** authoritative fields |
| Aggregation domains (e.g. feed) compose foreign keys / references — they do not redefine foreign entities |
| Guest adapters may write only into adapter-owned staging or mapped fields under explicit product law — never into core identity as foundation |
| Staff domains own staff-only records — never player Shared Destination truth |
| Cross-domain writes require an owning orchestrator and explicit authorization — never silent dual writes of the same meaning |

| Ownership conflict | Resolution |
|--------------------|------------|
| Two domains claim one entity | Illegal — amend F5.1 / F6.3 first |
| Table split for performance that forks ownership | Illegal without aggregate redesign under same owner |
| “Temporary” dual ownership | Banned — silent forks are architecture defects |

## 4.1 External Data Rule

External providers contribute information.

Steam,
Discord,
and any future external integrations
remain guest data providers.

Imported data must always become subordinate to GMRLOG domain rules.

External providers may enrich product knowledge,
but they may never redefine ownership,
identity,
or authoritative product meaning.

---

# PART B — OWNERSHIP · BOUNDARIES · TRUTH

---

# 5. Domain Ownership

Domain ownership of data mirrors F6.3 §6 and F5.1.

## 5.1 Root-aligned data homes

| Product home | Data ownership role |
|--------------|---------------------|
| Home / Feed | Owns feed membership / pacing records as **aggregation** — not the entities shown |
| Discover / Search | Owns discovery indexes and search projection orchestration — not Shared Destination truth |
| Library | Owns archive membership · player–game relationship records · import orchestration state |
| Notifications | Owns notification records · delivery state — not the pointed-to entities |
| Profile | Owns self-identity durable fields · entry indexes — not other-user as a second system |

## 5.2 Shared Destination data homes (singular)

| Shared Destination | Sole data owner |
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

Shared Destination data is never copied under Home · Discover · Library · Profile as a second authoritative store.

## 5.3 Gate · control · task · guest · staff

| Area | Data role |
|------|-----------|
| Auth / session | Session and identity-attachment records — platform authoritative |
| Settings · Connected Accounts | Preference and link-state records — guest links are optional |
| Messages | Message records under messages ownership |
| Tasks (compose · import · link · report) | Intent / draft / progress records — pending distinguishable from confirmed |
| Integrations (Steam · Discord) | Adapter-owned guest state — absence is normal |
| Staff | Isolated staff records |

---

# 6. Aggregate Boundaries

## 6.1 Meaning

An **aggregate** is a consistency boundary around a cluster of entities that must change together under one owner.

| Rule |
|------|
| Aggregate roots align to product entities with clear F5.1 homes |
| Consistency rules are enforced inside the owning aggregate — not by scattering invariants across domains |
| References across aggregates are by identity — not by embedding foreign aggregates’ internals |
| Child structures (e.g. Community Feed · Members · Activity) remain inside the Community aggregate — Discover does not own them |

## 6.2 Aggregate laws

| Law |
|-----|
| One aggregate → one owning domain |
| Transactions preferably commit within one aggregate boundary (§12) |
| Cross-aggregate coordination uses events / explicit orchestration — not hidden distributed writes |
| Aggregate redesign requires ownership review — performance alone is not a license to split meaning |

---

# 7. Entity Responsibility Philosophy

| Principle |
|-----------|
| An entity represents one product meaning — not a dump of convenience columns from many rooms |
| Entities carry only fields their owner is authorized to define |
| Derived values prefer computation or projection over duplicated durable fields — when duplicated for performance, the owner and rebuild rule must be explicit |
| Identity fields are opaque and stable (F6.4 kinship) — entities are not versioned by rewriting history in place without policy (§18) |
| Guest-sourced fields remain marked as guest-origin in meaning — they never silently overwrite player-authored GMRLOG meaning where product law forbids it (Library import kinship — F2.6 · F2.21) |

## 7.1 Canonical Identity Rule

Every durable entity owns exactly one canonical identifier.

All derived projections,
indexes,
search documents,
cached representations,
and future analytical models
must reference this canonical identity.

Derived systems must never invent competing identities or ownership.

---

# 8. Source of Truth Philosophy

## 8.1 Authoritative truth

| Store class | Truth role |
|-------------|------------|
| **Primary database (PostgreSQL)** | **Authoritative durable truth** for product meaning |
| Prisma access layer | Organization of access to that truth — not a second truth |
| Search (Meilisearch) | **Projection only** — never source of truth |
| Cache (Redis) | **Disposable acceleration** — never source of truth |
| Client stores / MMKV / query cache | Temporary presentation — never durable product truth |
| Object storage | Bytes for media — ownership metadata remains in the database |

## 8.2 Source of truth laws

| Law |
|-----|
| **Database remains authoritative.** |
| If search and database disagree, the database wins — search must be repaired |
| If cache and database disagree, the database wins — cache must be discarded or refreshed |
| If client and platform disagree on Trust-sensitive meaning, the platform wins |
| Pending local client writes are not confirmed truth until platform confirmation (F6.2 §11.3) |

---

# 9. Read Model vs Write Model Philosophy

## 9.1 Split is allowed — ownership is not

| Model | Purpose |
|-------|---------|
| Write model | Optimized for enforcing invariants · durable commits under the owning domain |
| Read model | Optimized for listing · feed · search · hubs — may denormalize **projections** of owned data |

| Law |
|-----|
| **Read models may differ from write models.** |
| Read models never become writable systems of record for the same meaning |
| Denormalized read fields declare their owner and invalidation/rebuild path |
| Feed and Discover heavily use read projections — they still reference singular Shared Destinations |
| CQRS-like separation is a philosophy option inside ownership — not a license to invent parallel products |

---

# PART C — PROJECTIONS · MEMORY · CONSISTENCY

---

# 10. Search Architecture Philosophy

Meilisearch is the approved search projection engine (`TECH_STACK_DECISIONS.md`).

| Principle |
|-----------|
| **Search is a projection, never the source of truth.** |
| Indexes mirror product entities under Discover-aligned orchestration (F5.1 · F6.4 §15) |
| Index updates are triggered by authoritative domain writes / events (§14) |
| Search result identity always resolves back to owning domain records |
| Typo tolerance and ranking are search-engine concerns — they must not redefine product meaning or manipulate engagement contrary to constitution |
| Semantic Similarity Recommendation (MVP) is assistive similarity projection — not a generative memory store, not chat history, not an assistant knowledge base |
| Search downtime degrades discovery honesty — core Digital Home durable truth remains in the database |

This document does not define index settings, schemas, or ranking algorithms.

## 10.1 Projection Rebuild Philosophy

All projections are disposable.

Search indexes,
feed projections,
recommendation projections,
analytics projections,
and future derived views
must always be rebuildable from authoritative domain data.

Loss of any projection must never imply loss of durable product meaning.

Authoritative stores remain the only source of truth.

---

# 11. Cache Philosophy

Redis is the approved cache / ephemeral acceleration layer (`TECH_STACK_DECISIONS.md`).

| Principle |
|-----------|
| **Cache is disposable.** |
| Cache accelerates reads (sessions · hot lists · rate counters · transient coordination) — it never authors product meaning |
| Loss of cache must be survivable — cold start from authoritative store is always legal |
| Cached player meaning must not outlive honesty — stale presentation is a client contract concern (F6.2 · F6.4), not a reason to treat cache as truth |
| Cache keys and TTLs are implementation details of later documents — banned from this constitution as examples |
| Engagement “stickiness” via immortal cache is banned |

---

# 12. Transaction Philosophy

| Principle |
|-----------|
| Authoritative writes commit under clear transaction boundaries aligned to aggregates (§6) |
| Prefer single-aggregate transactions for invariant safety |
| Cross-aggregate work: commit the owning write, then propagate via events — avoid distributed multi-system transactions as a lifestyle |
| Side effects (search index · cache bust · notifications · realtime) are **not** the transaction’s product truth — they follow confirmation |
| Failed side effects retry without inventing a second truth (§14) |
| Import and link intents use explicit pending → confirmed transitions — never silent partial success (F5.4 · F6.4 §20) |

This document does not define isolation levels or SQL transaction syntax.

---

# 13. Consistency Philosophy

| Mode | Where it applies |
|------|------------------|
| Strong consistency | Trust-sensitive durable commits inside the authoritative store (identity · ownership · permissions · confirmed library relationships · achievement awards as platform meaning) |
| Eventual consistency | Search indexes · caches · secondary read models · notification fan-out · realtime delivery |

| Consistency laws |
|------------------|
| Clients must tolerate eventual projection lag honestly — never fake instantaneous global agreement when projections lag |
| Conflict rules prefer product law (player-authored meaning over guest import where F2.6 / F2.21 require it) |
| “Read your writes” for the acting player on authoritative paths is a product honesty goal — projections may lag |
| Consistency never licenses dual authoritative stores |

---

# 14. Event Propagation Philosophy

| Principle |
|-----------|
| **Events synchronize projections.** |
| Domain events are emitted after authoritative success (F6.3 · F6.4 lifecycle) |
| Consumers: search indexers · cache invalidators · notification jobs · realtime emitters · read-model builders |
| Events carry enough identity to update projections — they do not replace the database as archive of meaning |
| Event handlers are idempotent in philosophy — duplicate delivery must not corrupt projections |
| Ordering guarantees are best-effort per stream ownership — handlers must be resilient to reorder within declared bounds |
| Events never invent product destinations or Version 2 meaning |

This document does not define event bus topology or payload schemas.

## 14.1 Analytics Philosophy

Analytics consumes events.

Analytics never owns product truth.

Analytics datasets,
reports,
dashboards,
and future BI systems
are derived projections only.

Product behavior,
permissions,
ownership,
and business rules
must never depend on analytics availability.

---

# PART D — LIFECYCLE · GOVERNANCE

---

# 15. Data Lifecycle

| Stage | Meaning |
|-------|---------|
| Create | Authoritative insert under owning domain · pending intents distinguishable |
| Active | Confirmed durable meaning available to authorized readers |
| Update | Owner-controlled mutation · events refresh projections |
| Soft-delete / hide | Product-visible absence with recoverable or policy-bound retention (§16) |
| Archive / retain | Policy-bound retention for Trust · legal · audit needs |
| Hard-delete | Exceptional · policy-gated · projections must be purged as followers |

| Lifecycle laws |
|----------------|
| Lifecycle states must be honest to API and clients (F5.4 · F6.4) |
| Guest disconnect removes guest link state — it does not erase GMRLOG-authored meaning by accident |
| Media bytes lifecycle follows ownership metadata — orphans are cleaned by jobs, not ignored forever |

---

# 16. Soft Delete Philosophy

| Principle |
|-----------|
| Soft delete is the default departure for player-meaningful content where recovery, moderation, or referential honesty matters |
| Soft-deleted meaning is absent to unauthorized readers — not silently rewritten as engagement bait |
| References to soft-deleted Shared Destinations fail honestly or render tombstones per product law — never dangling lies |
| Hard delete is rare and policy-bound (staff · legal · retention windows) |
| Soft delete never becomes a second public “shame state” or manipulation device |

---

# 17. Audit History Philosophy

| Principle |
|-----------|
| Trust-sensitive mutations may produce audit history — who · what · when · outcome — under privacy law |
| Audit is for accountability and safety — not surveillance theater or retention coercion (F6.1 · F6.3) |
| Audit records are append-oriented in philosophy — they are not a playground for rewriting history |
| Staff actions against player content are auditable |
| Audit storage is owned by platform policy domains — not mixed into Design System or client packages |
| PII minimization applies — log enough to be accountable, not everything by default |

---

# 18. Versioning Philosophy

| Principle |
|-----------|
| Product entities may carry optimistic concurrency / revision tokens where conflicts matter — philosophy only |
| Schema versioning of the database is a migration concern (§19) — not entity marketing versions |
| Contract versioning of APIs remains F6.4’s concern — data versioning does not invent parallel public APIs |
| Historical revisions of content (if product requires edit history) are an owned feature of that domain — not a global dump table for everything |
| Versioning never forks Shared Destination identity |

---

# 19. Migration Philosophy

| Principle |
|-----------|
| Schema evolution is deliberate, reviewed, and reversible where possible — never silent drift |
| Migrations serve ownership clarity and safety — they never smuggle Version 2 product meaning under MVP |
| Expand / migrate / contract philosophy preferred over big-bang rewrites |
| Data backfills are jobs with observability — not hidden side effects of deploys |
| Projection rebuilds (search · read models) are first-class after structural change |
| Migration **scripts · SQL · Prisma migration files** are out of scope for this document — only the philosophy binds later work |

---

# 20. Data Validation Boundaries

| Boundary | Responsibility |
|----------|----------------|
| Shared validators (`@gmrlog/validators`) | Shape and shared meaning constraints — same language as API (F6.4 §10) |
| Domain services | Invariants · ownership · Trust rules that schemas alone cannot express |
| Database constraints | Last line of durable integrity — not the only line, and not a place to hide product IA |
| Client validation | Courtesy only — never authoritative (F6.2 · F6.3) |

| Validation laws |
|-----------------|
| Never trust client input as durable truth |
| Guest payloads validated at adapter boundaries before mapping into owned fields |
| Invalid durable writes fail closed — they do not partially corrupt aggregates |

---

# PART E — SCALE · DEPENDENCIES · CLOSE

---

# 21. Performance Principles

| Principle |
|-----------|
| Performance serves calm journeys (F6.1 §19) — not casino urgency |
| Prefer read models and disposable cache for hot paths — never dual authoritative writes for speed |
| Lists and feeds use projection + cursor philosophy (F6.4) — data shape must support it without ownership forks |
| N+1 ownership mistakes across Shared opens are organizational defects — fix ownership access paths, do not denormalize meaning into the wrong home |
| Media remains in object storage — database holds references and ownership |
| Measure against product journeys — Home · Search · Game relationship · Library archive |

No numeric budgets or index lists live here.

---

# 22. Scalability Principles

| Principle |
|-----------|
| Scale along ownership boundaries — shard/partition philosophy follows domain meaning when later required, not fashion |
| Feed aggregation scales as orchestration over singular Shared data |
| Search and cache scale independently as disposable/rebuildable projections |
| Async jobs absorb projection fan-out so writes stay within aggregate honesty |
| Team scale: one data owner per entity enables parallel work without conflicting migrations of the same meaning |
| Version 2 data domains receive **zero** MVP scaffolding (Marketplace · Premium · Creator economy · Twitch · advanced AI memory) |

---

# 23. Dependency Rules

## 23.1 Allowed direction (data view)

```
Owning domain (write model)
  → authoritative database (via repository / Prisma organization)
  → emits events
      → projection workers (search · cache · read models · notifications)
```

```
Read-side consumers (feed · discover · API list handlers)
  → read models / cache / search projections
  → resolve identity back to owning domain when authority is required
```

## 23.2 Forbidden direction

| Forbidden |
|-----------|
| Search → authoritative writes of product meaning |
| Cache → authoritative writes of product meaning |
| Frontend stores → treated as durable source of truth |
| Domain A writing Domain B’s authoritative tables without orchestration ownership |
| Shared Destination data owned under a tab domain |
| `packages/ui` or client apps importing `packages/database` as a client dependency path |
| Circular ownership of the same entity |

## 23.3 Package boundaries

| Package | Data role |
|---------|-----------|
| `packages/database` | Platform persistence utilities — authoritative access organization |
| `packages/types` · `validators` | Shared meaning language — not storage |
| `packages/storage` | Object byte capability — not entity ownership |
| Client packages | No durable schema authority |

---

# 24. Anti-Patterns

| Banned |
|--------|
| Defining schemas · Prisma models · SQL · indexes · Redis keys · Meilisearch settings in the spirit of this constitution as “temporary truth” |
| Search or cache as system of record |
| Frontend as durable source of truth for Trust-sensitive meaning |
| Two owners for one entity · Shared Destination forks under tabs |
| Dual writes that create conflicting authoritative stores |
| Silent hard deletes of player meaning without policy |
| Soft delete as shame / manipulation device |
| Embedding Version 2 product data under MVP names |
| Steam achievements imported as GMRLOG achievement truth |
| Discord-shaped social graph as core data foundation |
| Generative AI memory / assistant transcript stores disguised as recommendations |
| Immortal engagement caches · streak pressure data architectures |
| Migrations that rewrite product ownership without F5 amendment |
| Treating F6.5 as authority over F5.1 or F6.1–F6.4 |

---

# 25. Audit Checklist

- [ ] Defines how data is organized — no schemas · no SQL · no Prisma · no Redis keys · no code  
- [ ] Explicitly states: backend durable truth · frontend temporary state · search projection · cache disposable · database authoritative · read≠write allowed · events sync projections · one owner per entity · Shared Destinations singular · F5.1 ownership inviolable  
- [ ] Domain ownership mirrors F5.1 / F6.3 · aggregates and entity responsibility explicit  
- [ ] Source of truth hierarchy clear · read/write model split without ownership forks  
- [ ] Search (Meilisearch) and cache (Redis) roles defined as philosophy only  
- [ ] Transactions · consistency · event propagation philosophies explicit  
- [ ] Lifecycle · soft delete · audit · versioning · migration · validation boundaries explicit  
- [ ] Performance · scalability · dependency rules explicit  
- [ ] No algorithms · no configuration · no implementation examples  
- [ ] Compatible with F6.1–F6.4 and `TECH_STACK_DECISIONS.md` as subordinate stack reference  
- [ ] Gate: stop — do not continue to F6.6 in this deliverable  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Sprint F6.5 — Data Architecture** delivered as **DRAFT**.

This document is the working SSOT candidate for **data organization** under F1–F5 · F6.1–F6.4.

Stop.

Do **NOT** continue to Sprint F6.6 until F6.5 is explicitly advanced / LOCKED by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) | Engineering organization · data & memory layer role |
| [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) | Temporary presentation state · offline honesty |
| [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) | Durable truth owner · domains · repositories |
| [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) | Exposure of owned data · search/list projection contracts |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | **LOCKED** ownership source — inviolable |
| [`F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | **LOCKED** feed aggregation boundaries |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **LOCKED** MVP scope boundary |
| [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) | `packages/database` · storage boundaries |
| [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) | Naming · layer discipline |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | PostgreSQL · Prisma · Redis · Meilisearch — ADR governance |
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Data architecture: ownership · aggregates · source of truth hierarchy · read/write models · search/cache as projections · transactions · consistency · events · lifecycle · soft delete · audit · versioning · migration · validation boundaries · performance/scalability/dependencies; no schemas · no SQL · no Prisma · no Redis keys · no code; gate before F6.6 |
| 1.1 | July 2026 | Version 1.1 — Data Architecture Reinforcement Amendment (Projection Rebuild, Canonical Identity, Analytics Boundary, External Data Rule). |
