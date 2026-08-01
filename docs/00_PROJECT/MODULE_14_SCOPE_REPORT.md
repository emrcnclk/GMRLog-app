# Module 14 — Analytics Platform Scope Report

**Document:** `docs/00_PROJECT/MODULE_14_SCOPE_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Type:** Architecture discovery only — **no code, no migrations, no Prisma edits, no OpenAPI edits, no endpoint implementation**  
**Product roadmap ref:** `docs/01_PRODUCT/ROADMAP.md`  
**Backlog / matrix refs:** `docs/00_PROJECT/PRODUCT_BACKLOG.md`, `docs/01_PRODUCT/FEATURE_MATRIX.md`, `docs/00_PROJECT/SUCCESS_METRICS.md`  
**Analytics SSOT:** `docs/13_ANALYTICS/*` (product folder **13**; sprint Module **14** — do not confuse with `docs/14_MONETIZATION/`)

**SSOT precedence applied:**

1. `docs/00_PROJECT/NORTH_STAR.md`  
2. `docs/01_PRODUCT/ROADMAP.md` + Feature Matrix + Success Metrics  
3. `docs/13_ANALYTICS/` (Architecture, Specification, Product Metrics, Data Retention)  
4. Existing Freezes (Admin V1 complete, Moderation, Search, Notification, Reviews, Games, Communication)  
5. OpenAPI (`ADMIN_API.yaml` analytics + `SEARCH_API.yaml` `searchAnalytics` — **read only**)  
6. Prisma analytics models (`AnalyticsEvent`, views, `DailyMetric`, `RetentionMetric`) + Search-owned `SearchEvent`  
7. Runtime: domain `DomainEventPublisher` events + Admin composed stats ports  

---

## Executive Summary

Analytics Platform is **documented and schema-stubbed, but not implemented as a Nest BC**. There is **no** `apps/api/src/analytics/**`, **no** writers to `AnalyticsEvent` / `ScreenView` / `GameView` / `ReviewView` / `DailyMetric` / `RetentionMetric`, and **no** handler for `adminGetAnalyticsDashboard`. Closest live pieces are:

| Piece | Owner | Role vs Analytics Platform |
|-------|-------|----------------------------|
| Domain `*.v1` events via `DomainEventPublisher` | Owning BCs | **Upstream signal** — Analytics must **consume**, never re-own |
| `SearchEvent` + trending | **Search BC** | Durable search query log — **not** Analytics SoT |
| Admin `GET /admin/dashboard` aggregates | **Admin** compose | Operational counts via domain `*AdminStatsService` — **not** Analytics BC |
| Profile / game-log statistics HTTP | **Users / GameLogs** | Player-facing stats — **not** platform Analytics |
| `docs/13_ANALYTICS/*` + Prisma analytics tables | Intended Analytics | **Unwired stubs** |

North Star allows **Analytics Products** as long-term monetization, but Module 14 MVP must first make GMRLOG a better digital home by giving operators **trustworthy internal product metrics** (engagement, content health, T&S load proxies) — without turning Analytics into a second SoT for Users, Games, Reviews, Search, or Moderation.

**Module 14 MVP** should deliver a **narrow first-party Analytics BC**:

1. **Event ingestion** — consume selected domain events (+ optional authenticated client batch later) into `AnalyticsEvent` (reuse schema)  
2. **Aggregation** — nightly/hourly writers to `DailyMetric` for a **frozen** KPI allowlist (MALP proxy, DAU/WAU proxies, review/search/moderation activity counts)  
3. **Dashboard metrics** — staff-readable aggregates for Admin compose / `adminGetAnalyticsDashboard` **platform** subset (not PostHog/Grafana embeds as MVP)  
4. **Hardening** — retention hooks per `DATA_RETENTION.md`, privacy (no PII in properties), cache discipline, no event explosion  

**Explicitly out of Module 14 MVP:** AI analytics, recommendations scoring, cohorts/funnels productization, heatmaps, session replay, A/B testing, ML dashboards, predictive analytics, Studio/B2B Analytics Products, full `ANALYTICS_SPECIFICATION` client catalog, warehouse, Experiment Analysis.

**Recommended path:** Treat Analytics as an **event consumer + metric store BC**. Domains remain SoT. Prefer **reuse existing Prisma analytics models** — no new tables in Freeze unless proven gap. Prefer **no OpenAPI invent**; Freeze may authorize minimal change-control to align client ingest path (`POST /analytics/events` in Architecture) with OpenAPI if required.

**Implementation must not start** until Sprint **14.0 Architecture + Freeze** is accepted.

---

## Goals

| Goal | Why (North Star) |
|------|------------------|
| Measure belonging signals | Logs, reviews, search, feed, social — prove the digital home is used |
| Operator visibility | Safe T&S + platform health without guessing |
| Preserve domain SoT | Analytics never mutates Reviews/Games/Users/Search entities |
| Privacy-first | GDPR retention; no PII in event properties |
| Avoid dual counters | Do not fork Admin dashboard or SearchEvent as competing truth |

---

## Non-goals (Module 14 MVP)

- PostHog / Firebase / Grafana / Prometheus **product embeds** as MVP dependency (Specification lists them; Freeze must choose first-party PG path for V1)  
- Studio / Advanced Analytics (Feature Matrix = **Future**)  
- Recommendation accuracy / ML dashboards  
- Geographic / device / revenue dashboards as full SUCCESS_METRICS laundry list  
- Owning `SearchEvent`, Notification delivery rows, Moderation queue tables  
- Replacing Admin shell compose counts for operational T&S queue triage  

---

## Architecture assessment

### What already exists

| Layer | Status | Evidence |
|-------|--------|----------|
| Product docs | **Exists** | `docs/13_ANALYTICS/ANALYTICS_ARCHITECTURE.md`, `ANALYTICS_SPECIFICATION.md`, `PRODUCT_METRICS.md`, `DATA_RETENTION.md` |
| Prisma analytics models | **Exists (stub)** | `AnalyticsEvent`, `ScreenView`, `GameView`, `ReviewView`, `DailyMetric`, `RetentionMetric`, enum `AnalyticsEventType` |
| Domain event bus | **Exists** | `DomainEventPublisher` (in-process; no outbox) |
| Rich domain events | **Exists** | Search, Notification, Moderation, Reviews, GameLogs, Feed, Collections/Lists/TierLists, Users sanctions |
| Admin operational dashboard | **Exists** | `GET /admin/dashboard` + Redis `admin:dashboard:home` |
| Search query analytics | **Exists** | `SearchEvent` write + `*.search.executed.v1` |
| OpenAPI contracts | **Partial** | `adminGetAnalyticsDashboard`, `searchAnalytics` (Search deferred) |
| Planned package | **Documented only** | `packages/analytics/` in `MONOREPO_STRUCTURE.md` |

### What is partially implemented

| Area | Gap |
|------|-----|
| Schema ready, writers missing | Zero Nest writers to analytics tables |
| Architecture ingest path | `POST /api/v1/analytics/events` documented — **no OpenAPI/runtime** yet |
| Admin analytics dashboard | OpenAPI `moderation` / `platform` / `ai` / `releases` — **unimplemented**; Admin shell uses lighter compose |
| Metrics dictionary | MALP/DAU/WAU defined — **no DailyMetric jobs** |
| Spec vs stack | Spec names PostHog/Firebase; Tech Stack also mentions custom analytics — **Freeze must pick V1 path** |

### What is missing

| Area | Status |
|------|--------|
| Nest `AnalyticsModule` | **Missing** |
| Event consumers (subscribe to domain events) | **Missing** |
| Aggregation workers / cron | **Missing** |
| `adminGetAnalyticsDashboard` handler | **Missing** |
| Client SDK (`@gmrlog/analytics`) | **Missing** |
| Outbox / durable event log for analytics | **Missing** (bus is in-process only) |
| `ANALYTICS_EVENT_MATRIX.md` | **Missing** (needed at Freeze) |

---

## Ownership matrix

**Hard rule:** Analytics **MUST NOT** own business entities. Analytics only **consumes events** (and optional client telemetry) and stores **derived** analytics rows / daily metrics.

| Concern | Source of Truth | Analytics role |
|---------|-----------------|----------------|
| User profile / sanctions / PlatformRole | **Users** | Consume `user.*` sanction events; never mutate flags |
| Game catalog | **Games** | Consume catalog/view signals if emitted; never mutate Game |
| Reviews / ratings / hide | **Reviews** | Consume `review.*` / moderation review events |
| Game logs / progress / play sessions | **GameLogs** | Consume `gamelog.*` / progress events; **MALP proxy** from approved GameLog **events** on `AnalyticsEvent` only — **never** GameLogs SQL; GameLogs remain SoT for rows |
| Feed items | **Feed** | Consume `feed.item.created.v1` (+ engagement if present) |
| Collections / Lists / TierLists | Owning BCs | Consume lifecycle / search-executed events |
| Search queries / trending | **Search** (`SearchEvent`) | **Do not dual-write** SearchEvent; may consume `*.search.executed.v1` into `AnalyticsEvent` for platform KPIs only |
| Notifications inbox | **Notifications** | Consume `notification.created.v1` (delivery analytics later) |
| Reports / queue / appeals | **Moderation** | Consume `moderation.*` for T&S volume metrics |
| Audit trail | Domains write / Admin read | Analytics does not replace `AuditLog` |
| Admin shell ops counts | **Admin** compose of domain stats | May **embed** Analytics dashboard later; must not fork SoT counters without Freeze rule |
| `AnalyticsEvent`, view facts, `DailyMetric`, `RetentionMetric` | **Analytics BC** (intended) | Append/aggregate only |

```text
Domains publish *.v1 ──► DomainEventPublisher ──► Analytics consumers ──► AnalyticsEvent / DailyMetric
Clients (optional)   ──► POST /analytics/events ──► Analytics validation ──┘
Admin / operators    ◄── Analytics read APIs / Admin compose (no entity writes)
```

---

## MVP scope (Module 14 V1)

### In MVP

| Surface | Notes |
|---------|-------|
| **Architecture Freeze (14.0)** | Event allowlist, ownership, cache, retention, OpenAPI disposition |
| **Event ingestion** | Subscribe to **frozen** domain event set; persist `AnalyticsEvent` (map to `AnalyticsEventType` + `name`/`properties` ids-only) |
| **Aggregation** | Populate `DailyMetric` for allowlisted keys (e.g. `dau_proxy`, `malp_proxy`, `reviews_created`, `search_executed`, `reports_created`, `feed_items_created`) |
| **Dashboard metrics** | Staff API for **platform** dashboard subset — either implement `adminGetAnalyticsDashboard?dashboard=platform` or Admin compose over Analytics read port (Freeze picks one) |
| **Privacy baseline** | No email/IP/raw UGC in properties; unlink/`userId` null on delete per retention |
| **Cache** | Targeted Redis keys only (e.g. `analytics:daily:{date}` / dashboard hash) — **no FLUSHALL / KEYS** |
| **Tests** | Unit consumers + aggregation determinism; e2e smoke if env allows |

### Suggested domain event allowlist (Freeze to finalize)

| Publisher | Events (examples — runtime names win) | MVP metric use |
|-----------|----------------------------------------|----------------|
| Users | `user.warned|suspended|banned|*.v1` | T&S volume (optional) |
| Reviews | `review.created|deleted|hidden|restored.v1` | Review activity |
| GameLogs | `gamelog.created.v1`, `game.progress.completed.v1` | MALP / engagement |
| Search | `search.global.executed.v1`, domain `*.search.executed.v1` | Search health |
| Feed | `feed.item.created.v1` | Feed health |
| Moderation | `moderation.report.created.v1`, `moderation.resolved.v1` | Queue pressure |
| Notifications | `notification.created.v1` | Delivery volume (light) |
| Collections/Lists/TierLists | `*.created.v1` (sample) | Content creation mix |

**Client `PAGE_VIEW` / `CLICK` / SDK batch:** Phase 1.5 or Phase 2 unless Freeze proves need for true DAU from `analytics_events` (PRODUCT_METRICS currently sources DAU from analytics_events — MVP may define **DAU proxy** from authenticated domain events until client SDK ships).

### Out of MVP (deferred)

| Item | Bucket |
|------|--------|
| AI analytics / toxicity / risk overlays | AI phase |
| Recommendation analytics / accuracy | Phase 2+ |
| Cohort product UI / RetentionMetric jobs beyond stub | Phase 2 |
| Funnels (registration → first log → review) productization | Phase 2 |
| Heatmaps, session replay | Deferred / third-party |
| A/B testing / Experiment Analysis | Phase 2+ |
| ML dashboards / predictive analytics | Deferred |
| Studio / Advanced / B2B Analytics Products | Feature Matrix Future / Monetization |
| Full SUCCESS_METRICS dashboard laundry list (geo, device, revenue, crash, recommendation accuracy) | Phase 2–3 |
| Warehouse / batch importer | Future |
| `searchAnalytics` OpenAPI product | Search Freeze deferred ops |
| Admin dashboards `ai` / `releases` embeds | Phase 2+ |
| PostHog/Firebase as required V1 runtime | Spec hygiene — Freeze chooses first-party PG |

---

## OpenAPI & schema disposition

| Contract / model | Disposition |
|------------------|-------------|
| Prisma `AnalyticsEvent` + views + `DailyMetric` / `RetentionMetric` | **Reuse** — prefer no new models in V1 |
| `SearchEvent` | **Search-owned** — Analytics must not become SoT |
| `adminGetAnalyticsDashboard` | Implement **narrow** `platform` (and optionally `moderation` volume) — `ai` deferred |
| Architecture `POST /analytics/events` | Freeze may authorize OpenAPI change-control or keep internal-only until client SDK |
| `searchAnalytics` | Remains Search Phase 2 / deferred |

---

## Blockers (before / during 14.0)

| ID | Blocker | Severity |
|----|---------|----------|
| B1 | No `ANALYTICS_EVENT_MATRIX.md` / consumer allowlist | **Critical** for Freeze |
| B2 | Dual truth risk: Admin dashboard counts vs Analytics `DailyMetric` | **Major** — Freeze must define SoT per metric |
| B3 | Dual truth risk: `SearchEvent` vs `AnalyticsEvent` SEARCH | **Major** — Search remains query SoT |
| B4 | In-process bus only (no outbox) — missed events on crash | **Major** — document best-effort V1 or require outbox spike |
| B5 | Spec lists PostHog/Firebase vs first-party schema | **Major** — Freeze picks V1 path |
| B6 | PRODUCT_METRICS DAU from `analytics_events` but no client events yet | **Major** — define proxy for MVP |
| B7 | Folder id `docs/13_ANALYTICS` vs Module 14 sprint | **Minor** — naming clarity only |

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Event ownership drift** | Analytics mutates domain tables | Hard rule + code review; consumers append-only |
| **Duplicated counters** | Admin vs Analytics disagree | Freeze: operational triage = Admin compose; product KPIs = DailyMetric |
| **Aggregation consistency** | Replay / late events | Idempotent daily keys; document eventual consistency |
| **Cache strategy** | Stale or FLUSHALL | Targeted keys; TTL; invalidate by key only |
| **Privacy / GDPR** | PII in properties; retention | Properties ids/enums only; 24m retention; unlink on delete |
| **Event explosion** | DB + bus overload | Strict allowlist; sample high-volume clicks later |
| **Performance** | Sync consumer slows requests | Async subscribe; never block domain publish path |
| **Spec sprawl** | Implementing full ANALYTICS_SPECIFICATION | MVP allowlist only |
| **Monetization confusion** | Shipping B2B Analytics Products as MVP | Defer to Monetization / Feature Matrix Future |

---

## Recommended sprint breakdown

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **14.0 Architecture Freeze** | Ownership, event allowlist, metric dictionary subset, cache, privacy, OpenAPI disposition, ADR | **Frozen SSOT** — unlocks implementation |
| **14.1 Event Ingestion** | `AnalyticsModule`, consumers for allowlisted domain events → `AnalyticsEvent` | Durable ingest path |
| **14.2 Aggregation** | Jobs/cron → `DailyMetric` for frozen KPI keys; MALP/DAU proxies | Aggregates exist |
| **14.3 Dashboard Metrics** | Staff read API / Admin compose for platform dashboard subset | Operators can query KPIs |
| **14.4 Hardening** | Retention, privacy unlink, cache, idempotency, performance, tests | Production-ready V1 |
| **14.5 Final Audit** | Freeze compliance gate | **APPROVED** / **WITH MINOR CHANGES** / **REJECTED** |

**Do not start Sprint 14.0 until this Scope Report is accepted.**

---

## Compatibility checklist

| Source | Result |
|--------|--------|
| North Star | Internal metrics enable a healthier gaming-culture home; B2B Analytics Products deferred — **compatible** |
| ROADMAP / Feature Matrix | Studio/Advanced Analytics = Future — **compatible** if deferred |
| Admin Freeze | Analytics was Phase 3 for Admin embeds — Module 14 builds platform first — **compatible** |
| Search / Notification / Moderation Freezes | Consume events only — **compatible** |
| OpenAPI / Prisma | Reuse stubs; no invent in discovery — **compatible** |

---

## Decision

**APPROVED WITH MINOR CHANGES**

Minor changes for Freeze (14.0) to resolve:

1. Lock **first-party PostgreSQL** analytics path for V1 (defer PostHog/Firebase as required runtime).  
2. Publish **event allowlist + DAU/MALP proxy definitions** (client SDK not required for MVP).  
3. Define **Admin compose vs Analytics DailyMetric** non-duplication rule.  
4. Clarify **SearchEvent vs AnalyticsEvent** boundary.  
5. Document **best-effort in-process bus** vs outbox requirement for V1.

---

## Unlock

| Next | May start after this report? |
|------|------------------------------|
| **Sprint 14.0 Architecture Freeze** | **Yes** (after explicit authorization) |
| 14.1–14.5 implementation | **No** until 14.0 Freeze accepted |
| Studio / AI / funnel / ML analytics | **No** under Module 14 V1 |

---

Stop. Do **not** start Sprint 14.0 from this discovery sprint.
