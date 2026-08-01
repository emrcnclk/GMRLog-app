# GMRLOG — Sprint F6.6: Realtime & Background Jobs Architecture

**Document:** `docs/06_ENGINEERING/F6_6_REALTIME_BACKGROUND_JOBS_ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** F6.6 (Realtime & Background Jobs Architecture — organization only)  
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
| 9 | [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) — client organization · server-state honesty |
| 10 | [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) — platform organization · jobs & realtime boundaries |
| 11 | [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) — exposure · realtime as delivery channel |
| 12 | [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) — durable truth · projections · events synchronize projections |
| 13 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 14 | **This document** — Realtime & Background Jobs Architecture (how async delivery and work are organized) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never invent MVP features.

Never redefine ownership — **all ownership comes from F5.1**.

This sprint specifies **HOW realtime communication and background processing are organized**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI law |
| F5 | What exists · ownership · behavior — **LOCKED** |
| F6.1 | Engineering organization · async side effects · performance calm |
| F6.2 | Client receives realtime into server-state — never as a second truth |
| F6.3 | Jobs and realtime as platform boundaries — domains own meaning |
| F6.4 | Realtime as delivery channel under the same contract vocabulary |
| F6.5 | Events synchronize projections · cache disposable · database authoritative |
| **F6.6** | How **realtime delivery** and **background execution** are organized under that law |

This sprint answers:

> “How are realtime and background work organized?”

rather than:

> “What events exist?” · “What jobs run?” · “How is the queue configured?”

| Does | Does not |
|------|----------|
| Define realtime philosophy · background processing philosophy · event ownership · job ownership · queue · worker · propagation · notifications · feed/search/cache update roles · retry · failure · idempotency · scheduling · connections · scalability · security · dependency rules | BullMQ job definitions · Socket.IO event catalogs · Redis configuration · worker code · notification payloads · cron expressions · infrastructure · algorithms · product redesign |

**Stack note:** `TECH_STACK_DECISIONS.md` approves **BullMQ** (background execution), **Redis** (queue/ephemeral coordination kinship), **Socket.IO** (realtime delivery). This document assigns architectural responsibilities only. It does **not** configure them, name events, define payloads, or implement them. Stack changes require ADR.

**Gate:** Stop after this specification. Do **not** continue to Sprint F6.7 in this deliverable.

---

## Scope

**In scope:** Mission · relationship to prior constitutions · realtime philosophy · background processing philosophy · event ownership · job ownership · queue philosophy · worker philosophy · event propagation · notification philosophy · feed update philosophy · search index update philosophy · cache refresh philosophy · retry philosophy · failure philosophy · idempotency philosophy · scheduling philosophy · realtime connection philosophy · scalability · security · dependency rules.

**Out of scope:**

| Forbidden |
|-----------|
| BullMQ job class lists · queue names · concurrency settings |
| Socket.IO event name catalogs · room topologies as implementation |
| Redis key layouts · broker configuration |
| Worker source code · processor implementations |
| Notification payload schemas · push provider wiring |
| Cron expressions · schedule calendars |
| Infrastructure · cloud · DevOps runbooks |
| Algorithms · ranking · recommendation engines |
| Product · UX · UI · IA redesign · new MVP features |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Relationship · Realtime Philosophy · Background Processing Philosophy |
| B | 5–9 | Event Ownership · Job Ownership · Queue · Worker · Event Propagation |
| C | 10–13 | Notifications · Feed Updates · Search Index Updates · Cache Refresh |
| D | 14–18 | Retry · Failure · Idempotency · Scheduling · Realtime Connection |
| E | 19–22 | Scalability · Security · Dependency Rules · Anti-Patterns · Audit Checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the organization of realtime delivery and background execution that every future async document and processor must obey.

Realtime and jobs are **consequences of authoritative domain work**. They never become a second product constitution.

| Prefer | Never |
|--------|-------|
| Delivery after durable confirmation | Speculative side effects that invent truth |
| Rebuildable projections | Jobs that own product meaning |
| Honest failure and retry | Silent corruption of durable data |
| Optional realtime presence | Correctness that requires an open socket |
| Calm, owned async boundaries | Engagement ping machinery |

---

# 2. Relationship to Previous Constitutions

| Prior law | Realtime / jobs obligation |
|-----------|----------------------------|
| F5.1 | Events and jobs inherit ownership — they never invent Shared Destinations or a sixth root |
| F5.2 | Feed updates are projections — never live-pressure theater or engagement fan-out as product law |
| F5.3 | Async work serves cataloged surfaces — no orphan product meaning invented for a job |
| F5.4 | Pending · success · failure · delivery absence must remain honest client states |
| F5.5 §20.1 | Version 2 scopes receive no MVP job/realtime scaffolding under MVP names |
| F2.21 · F2.19 amendments | Integration sync jobs are optional guests · recommendation projections are assistive — never assistant/chat realtime products |
| F6.1 §13–§14 · §19 | Async for non-critical side effects · offline honesty · performance without casino urgency |
| F6.2 §5.5–§5.6 · §11.4 | Realtime lands in query cache under same keys · optional slots fail into absence · offline never depends on sockets |
| F6.3 §5.4–§5.6 | Jobs are side effects of domain meaning · realtime is a delivery channel |
| F6.4 §22 | Realtime shares contract vocabulary · authn/authz apply · never a parallel API dialect |
| F6.5 §10–§14 · §10.1 · §14.1 | Projections disposable and rebuildable · events synchronize projections · analytics consumes events and never owns truth |

On conflict, the higher law wins. Async convenience never overrides F5.1 ownership or durable truth (F6.5).

---

# 3. Realtime Philosophy

## 3.1 Immutable realtime laws

| Law |
|-----|
| **Realtime never becomes the source of truth.** |
| **Backend remains authoritative.** |
| **Realtime delivery is optional; product correctness must never depend on an active connection.** |
| Realtime delivers what REST could truthfully return — it accelerates honesty, it never invents state (F6.4 §22) |
| Realtime never becomes attention machinery — no engagement pings · no live-pressure theater (F5.2) |
| Connection absence is a normal state — clients remain oriented via REST and local honesty (F6.2) |

## 3.2 What realtime is for

| Role | Meaning |
|------|---------|
| Delivery channel | Push owned domain change notifications to connected clients |
| Continuity aid | Reduce staleness of projections the client already understands |
| Presence / messaging kinship | Where product law already places realtime (F2.8 · Messages) — not invented rooms |

| Realtime is not |
|-----------------|
| A second API dialect |
| A system of record |
| A requirement for product correctness |
| An engagement or FOMO engine |

## 3.3 Approved delivery reference

Socket.IO is the approved realtime delivery technology (`TECH_STACK_DECISIONS.md`). This document does not define events, rooms, or configuration.

---

# 4. Background Processing Philosophy

## 4.1 Immutable background laws

| Law |
|-----|
| **Workers execute domain work; they never own product meaning.** |
| **Queues are execution mechanisms, not business domains.** |
| **Jobs must be retry-safe and idempotent.** |
| **Failed jobs must never corrupt durable data.** |
| Jobs are enqueued after authoritative domain decisions — they do not invent product truth (F6.3 §5.4) |
| Side effects follow confirmation — never speculative durable writes disguised as “eventual truth” |

## 4.2 What background processing is for

| Class (philosophy) | Meaning |
|--------------------|---------|
| Fan-out / notify | Notification delivery after confirmed domain events |
| Projection sync | Search index · read models · cache refresh · feed projection rebuild triggers |
| Media processing | Variants after confirmed upload intent |
| Integration sync | Optional Steam import steps — never blocking core identity |
| Maintenance | Cleanup · expiry — never streak pressure or engagement schedulers |
| Analytics handoff | Emit for analytics consumption — analytics never owns truth (F6.5 §14.1) |

## 4.3 Approved execution reference

BullMQ (with Redis kinship) is the approved background execution technology (`TECH_STACK_DECISIONS.md`). This document does not define job names, payloads, or schedules.

---

# PART B — OWNERSHIP · EXECUTION · PROPAGATION

---

# 5. Event Ownership

## 5.1 Meaning

| Principle |
|-----------|
| **Events communicate change; they do not create ownership.** |
| The owning domain of the mutated meaning owns the event’s meaning |
| Aggregations (feed · discover) may consume events — they do not re-own the entity |
| Guest adapters may emit adapter events — they never redefine core identity ownership |
| Staff events stay in staff isolation |

## 5.2 Event ownership laws

| Law |
|-----|
| One product meaning → events under that meaning’s owner (F5.1 · F6.5 §4 · §7.1 canonical identity) |
| Event consumers update projections and consequences — they do not become dual writers of authoritative fields |
| Unknown or Version 2 meanings receive no MVP event invention |
| Event catalogs are subordinate documentation — banned as implementation lists in this constitution |

---

# 6. Job Ownership

| Principle |
|-----------|
| A job is owned by the domain whose meaning it advances or whose projection it refreshes |
| Cross-domain jobs require an explicit orchestrator owner — never orphan “platform misc” jobs that hide product meaning |
| Integration jobs are owned by guest adapters — optional · absence-normal |
| Notification delivery jobs are owned by notifications domain as **consequence processors** — not as rule authors for foreign entities |
| Workers may call only exported domain surfaces / ports — never deep-write foreign aggregates |

| Job ownership conflict | Resolution |
|------------------------|------------|
| Two domains claim one job’s meaning | Illegal — amend F6.3 / F5.1 first |
| Job invents a product capability | Illegal without product architecture amendment |
| “Temporary” unowned queue | Banned |

---

# 7. Queue Philosophy

| Principle |
|-----------|
| **Queues are execution mechanisms, not business domains.** |
| Queues organize retry · concurrency · isolation of work classes — they do not define IA |
| Separation of queues (philosophy): Trust-sensitive work · projection work · integration work · bulk maintenance — to protect player journeys from noisy neighbors |
| Queue depth is an operational signal (F6.3 observability) — not a product metric for engagement |
| Losing a queue’s ephemeral state must not lose durable product meaning (F6.5 · rebuildable projections) |

This document does not define queue names, priorities as numeric configs, or Redis structures.

---

# 8. Worker Philosophy

| Principle |
|-----------|
| **Workers execute domain work; they never own product meaning.** |
| Workers are replaceable executors behind the queue — domain modules remain the law |
| Workers load meaning through repositories / exported services under F6.3 layering — not through ad-hoc SQL in the worker spirit of this constitution |
| Workers must be horizontally scalable in philosophy (§19) without changing ownership |
| Workers emit outcomes: success · retryable failure · terminal failure — never silent partial durable corruption |
| Staff workers remain isolated from player worker pools where isolation matters for Trust |

---

# 9. Event Propagation

| Principle |
|-----------|
| Propagation path: authoritative commit → domain event → consumers (jobs · realtime emitters · projection builders · analytics handoff) |
| Order: durable truth first · projections and delivery second (F6.4 lifecycle · F6.5 §12–§14) |
| Consumers are idempotent in philosophy (§16) |
| Fan-out may be parallel — each consumer owns its failure domain without rolling back confirmed durable truth unless product law requires compensating actions under the owning domain |
| Propagation never creates engagement urgency semantics |

```
Authoritative domain write (database)
        ↓
   Domain event
        ↓
   ┌────────────┬────────────┬────────────┬────────────┐
   │ Projection │ Notification│ Realtime   │ Analytics  │
   │ jobs       │ jobs        │ emit       │ handoff    │
   └────────────┴────────────┴────────────┴────────────┘
```

Realtime emit failure does not unwind the durable write. Projection job failure schedules retry. Analytics absence never blocks product behavior (F6.5 §14.1).

---

# PART C — CONSEQUENCES · PROJECTIONS

---

# 10. Notification Philosophy

| Principle |
|-----------|
| **Notifications are consequences, not business rules.** |
| Notification records and delivery jobs live under notifications ownership (F5.1 · F6.3 · F6.5) |
| Creating a notification never authorizes a foreign write to Shared Destination truth |
| Delivery channels (in-app · push kinship per stack) are transport — product meaning of “what happened” remains domain-owned |
| Notification absence or delay never rewrites whether the underlying event occurred |
| Anti-manipulation: no streak pressure · FOMO countdowns · obligation loops via notification jobs (F3 · F5.4 kinship) |

This document does not define payloads or provider wiring.

---

# 11. Feed Update Philosophy

| Principle |
|-----------|
| **Feed updates are projections.** |
| Home feed membership / pacing updates follow F5.2 — aggregation over singular Shared Destinations |
| Feed projection jobs rebuild or increment from authoritative events — they do not become the system of record |
| Loss of feed projection is recoverable from durable domain data (F6.5 §10.1) |
| Realtime feed hints are optional freshness aids — correctness never requires them |
| No live-pressure theater · no casino refresh loops |

---

# 12. Search Index Update Philosophy

| Principle |
|-----------|
| Search index updates are projection jobs triggered by authoritative domain events (F6.5 §10) |
| **Search is never the source of truth** — index lag is eventual; database wins on conflict |
| Index rebuild must always be possible from authoritative stores (F6.5 §10.1) |
| Failed index jobs retry safely (§14–§16) — they never write authoritative product tables as compensation theater |
| Semantic Similarity Recommendation projections remain assistive — no generative/realtime assistant product |

---

# 13. Cache Refresh Philosophy

| Principle |
|-----------|
| Cache refresh / invalidation jobs treat cache as **disposable** (F6.5 §11) |
| Prefer invalidate-or-rebuild over pretending cache is durable |
| Cache job failure must fall back to authoritative reads — never fail closed on product truth |
| Immortal engagement caches and streak-pressure key architectures are banned |
| Realtime may hint clients to refetch — it does not replace cache policy ownership |

---

# PART D — SAFETY · TIME · CONNECTIONS

---

# 14. Retry Philosophy

| Principle |
|-----------|
| Retries apply to **execution**, not to reinventing product decisions already confirmed |
| Retryable failures: transient infrastructure · downstream unavailability · lock contention of a safe kind |
| Non-retryable / terminal: permanent validation failure against current authoritative state · policy denial · poison messages after governed attempts |
| Retry must preserve idempotency (§16) |
| Retry storms must not become denial-of-service against the Digital Home — backoff philosophy is operational, values live elsewhere |
| Integration retries respect optional-guest law — endless retry must not block core identity |

---

# 15. Failure Philosophy

| Principle |
|-----------|
| **Failed jobs must never corrupt durable data.** |
| Durable commits that already succeeded remain true if a downstream job fails |
| Compensating actions, when required, are owned domain use cases — not ad-hoc worker side mutations |
| Terminal failures are observable (F6.3 §16) — dead-letter philosophy exists as operations, not as a product feature |
| Partial fan-out failure: one consumer’s failure does not redefine another consumer’s success |
| Client-visible honesty: pending vs confirmed remains distinguishable (F6.2 · F6.4 · F6.5) |

---

# 16. Idempotency Philosophy

| Principle |
|-----------|
| **Jobs must be retry-safe and idempotent.** |
| Handlers key off canonical entity identity (F6.5 §7.1) and event/intent identity — duplicate delivery yields the same durable and projection outcome |
| At-least-once delivery is assumed in philosophy — exactly-once is not required for correctness if idempotency holds |
| Realtime re-delivery to clients must not invent duplicate product meaning — clients reconcile via server-state keys (F6.2 §11.4) |
| Idempotency never excuses skipping authorization checks on sensitive work |

---

# 17. Scheduling Philosophy

| Principle |
|-----------|
| Schedules exist for maintenance · projection rebuild · optional sync — never for engagement coercion |
| Scheduled work still has a domain owner (§6) |
| Schedules must be pausable and observable — silent forever-jobs are defects |
| Cron expressions and calendars are out of scope here |
| No FOMO countdown schedulers · streak pressure tickers · addiction loops |

---

# 18. Realtime Connection Philosophy

| Principle |
|-----------|
| Connections authenticate and authorize under the same identity classes as the API (F6.4 §17–§18 · §22) |
| **Realtime delivery is optional; product correctness must never depend on an active connection.** |
| Disconnect · reconnect · offline are first-class normal states — resume via REST and honest cache |
| Connection scope follows product rooms already defined — never invents parallel IA via “channels” |
| Soft-gates and privacy apply to what may be subscribed — guests do not receive protected meaning |
| Staff realtime, if any, remains isolated |

This document does not define connection options or room naming schemes.

---

# PART E — SCALE · TRUST · CLOSE

---

# 19. Scalability Philosophy

| Principle |
|-----------|
| Scale workers and realtime gateways horizontally behind clear ownership — not by forking product domains |
| Isolate noisy projection/integration work from Trust-sensitive queues (§7) |
| Backpressure and rate kinship protect the home — never punish legitimate play as theater |
| Projection rebuilds must remain feasible at scale (F6.5 §10.1) — disposable systems that cannot rebuild are illegal architectures |
| Realtime fan-out scales as delivery — authoritative write path stays within aggregate honesty (F6.5 §12) |
| Version 2 realtime products (e.g. Twitch-shaped live layers) receive **zero** MVP scaffolding |

---

# 20. Security Philosophy

| Principle |
|-----------|
| Authn/authz on realtime subscriptions and job-triggered privileged actions — workers are not a Trust bypass |
| Secrets never live in job payloads as standing credentials |
| Guest integration jobs carry least privilege and explicit consent kinship (F2.21) |
| Notification and realtime content must not exfiltrate private archive meaning beyond policy |
| Poison jobs and abusive connection patterns are operational security concerns — responses stay non-manipulative |
| Security never licenses dark-pattern push storms |

---

# 21. Dependency Rules

## 21.1 Allowed direction

```
Owning domain (authoritative write)
  → domain event
    → queue (execution mechanism)
      → worker (executor)
        → exported domain ports / projection ports / notification consequence ports
    → realtime emitter (delivery)
      → connected clients (optional)
```

```
Analytics handoff
  → analytics projections only (F6.5 §14.1)
```

## 21.2 Forbidden direction

| Forbidden |
|-----------|
| Queue / worker → inventing product ownership |
| Realtime → authoritative durable writes of product meaning |
| Notification jobs → redefining Shared Destination rules |
| Analytics → gating product permissions or ownership |
| Client sockets → treated as source of truth |
| Circular “job A enqueues job B that rewrites A’s aggregate” without an owning orchestrator |
| UI packages or Design System imported into workers |

## 21.3 Package boundaries

| Package / area | Role |
|----------------|------|
| `packages/websocket` | Realtime contract helpers — delivery vocabulary kinship |
| `packages/database` | Authoritative access — used by domain services workers call |
| Queue / worker runtime | Execution — not a monorepo product domain |
| `packages/analytics` | Measurement handoff — never product truth |

---

# 22. Anti-Patterns

| Banned |
|--------|
| Defining Socket.IO event catalogs · BullMQ job lists · cron expressions · Redis keys · payloads as constitutional “temporary truth” |
| Realtime as source of truth · correctness requiring an open connection |
| Queues treated as business domains · workers owning product meaning |
| Events that create ownership or invent destinations |
| Feed live-pressure theater · engagement ping machines · FOMO / streak schedulers |
| Notifications as business-rule engines for foreign domains |
| Failed jobs corrupting durable data · non-idempotent poison retries |
| Search/cache update jobs writing authoritative meaning as “fix” |
| Analytics availability required for product behavior |
| Version 2 realtime/job scaffolding under MVP names |
| Dual authoritative writes via async paths |
| Treating F6.6 as authority over F5.1 or F6.1–F6.5 |

---

# 23. Audit Checklist

- [ ] Defines how realtime and background work are organized — no event catalogs · no job lists · no cron · no code · no payloads  
- [ ] Explicitly states: realtime ≠ source of truth · backend authoritative · workers execute don’t own · queues ≠ domains · events communicate don’t create ownership · feed updates are projections · notifications are consequences · realtime optional for correctness · jobs retry-safe/idempotent · failed jobs never corrupt durable data  
- [ ] Event and job ownership mirror F5.1 / F6.3 / F6.5  
- [ ] Propagation: durable first · projections and delivery second  
- [ ] Notification · feed · search · cache update philosophies align with F6.5 projection law  
- [ ] Retry · failure · idempotency · scheduling · connection philosophies explicit and Trust-aligned  
- [ ] Scalability · security · dependency rules explicit  
- [ ] BullMQ · Redis · Socket.IO referenced as stack roles only — no configuration  
- [ ] Compatible with F6.1–F6.5 and `TECH_STACK_DECISIONS.md`  
- [ ] Gate: stop — do not continue to F6.7 in this deliverable  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Sprint F6.6 — Realtime & Background Jobs Architecture** delivered as **DRAFT**.

This document is the working SSOT candidate for **realtime delivery and background execution organization** under F1–F5 · F6.1–F6.5.

Stop.

Do **NOT** continue to Sprint F6.7 until F6.6 is explicitly advanced / LOCKED by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) | Engineering organization · async side effects |
| [`F6_2_FRONTEND_ARCHITECTURE.md`](./F6_2_FRONTEND_ARCHITECTURE.md) | Optional realtime into server-state · offline honesty |
| [`F6_3_BACKEND_ARCHITECTURE.md`](./F6_3_BACKEND_ARCHITECTURE.md) | Jobs · realtime boundaries · domain ownership |
| [`F6_4_API_ARCHITECTURE.md`](./F6_4_API_ARCHITECTURE.md) | Realtime as delivery channel · shared vocabulary |
| [`F6_5_DATA_ARCHITECTURE.md`](./F6_5_DATA_ARCHITECTURE.md) | Durable truth · disposable projections · events · analytics boundary |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | **LOCKED** ownership source |
| [`F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | **LOCKED** feed projection boundaries |
| [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) | `packages/websocket` · analytics · database boundaries |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | BullMQ · Redis · Socket.IO — ADR governance |
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Realtime & background jobs architecture: delivery vs truth · event/job ownership · queue/worker as execution · notifications/feed/search/cache as consequences or projections · retry/failure/idempotency/scheduling/connections · scale/security/dependencies; no event catalogs · no job lists · no cron · no code; gate before F6.7 |
