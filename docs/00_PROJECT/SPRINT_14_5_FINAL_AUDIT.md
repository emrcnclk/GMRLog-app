# Sprint 14.5 — Analytics Module Final Audit

**Document:** `docs/00_PROJECT/SPRINT_14_5_FINAL_AUDIT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Mode:** Final Architecture Audit — **read only** (no code / Prisma / OpenAPI / migrations / tests)  
**Freeze:** [`ANALYTICS_PLATFORM_FREEZE_v1.md`](./ANALYTICS_PLATFORM_FREEZE_v1.md)  
**Architecture:** [`ANALYTICS_ARCHITECTURE.md`](../01_ARCHITECTURE/ANALYTICS_ARCHITECTURE.md) · [`ADR_Analytics_Platform.md`](../01_ARCHITECTURE/ADR/ADR_Analytics_Platform.md) (ADR-ANL-001)

**SSOT precedence applied:** North Star → Freeze → OpenAPI → Architecture → Implementation

> Findings below are **tracked awareness only** — not fixed in this sprint.  
> **Do not begin Module 15 from this sprint.**

---

## Executive Summary

Module 14 delivers a coherent **Analytics Platform V1**: event ingestion (14.1), replay-safe DailyMetric aggregation (14.2), staff dashboard read via Admin compose (14.3), and production hardening (14.4). Implementation matches Freeze non-negotiables: Analytics owns only `AnalyticsEvent` / `DailyMetric` / `RetentionMetric` (+ derived cache); domains remain SoT; Analytics never mutates User / Review / Game / Notification / Search / Feed / Moderation entities; `SearchEvent` stays Search-owned; dashboard KPIs read **only** `DailyMetric`; Admin composes Analytics without dual SoT; Redis invalidation is targeted; privacy sanitize + GDPR unlink / retention **hooks** exist.

Residual gaps after Module 14 were **Freeze paper-trail** (non-Freeze content-creation keys; MALP wording). Those **Major** items are closed by post-audit remediation. Remaining work is **ops wiring** (cron for aggregation / GDPR / retention) and known **best-effort bus** risk — none require redesign of the Analytics BC.

| Dimension | Score |
|-----------|------:|
| Architecture | **9 / 10** |
| Security | **9 / 10** |
| Production readiness | **8 / 10** |

**Decision: APPROVED WITH MINOR CHANGES**

---

## Audit method

| Layer | Sources |
|-------|---------|
| North Star / Roadmap / SSOT | `NORTH_STAR.md`, product roadmap, Freeze precedence |
| Freeze / ADR / Architecture | `ANALYTICS_PLATFORM_FREEZE_v1.md`, ADR-ANL-001, `ANALYTICS_ARCHITECTURE.md` |
| Matrices | Event / Cache / Permission / Visibility |
| Sprint reports | `SPRINT_14_1` … `SPRINT_14_4` Implementation Reports |
| OpenAPI | `ADMIN_API.yaml` → `adminGetAnalyticsDashboard` |
| Implementation | `apps/api/src/analytics/**` + `admin.module.ts` compose |
| Validation | Claims from Sprint 14.4 gates (not re-executed in 14.5) |

No source, Prisma, OpenAPI, migration, or test modifications in Sprint 14.5.

---

## Architecture

| Check | Result | Evidence |
|-------|--------|----------|
| Owns only AnalyticsEvent / DailyMetric / RetentionMetric / derived | **Pass** | Prisma usage limited to those models (+ cache projections) |
| Domains remain SoT | **Pass** | No analytics writes to User/Review/Game/Notification/Search/Feed/Moderation tables |
| Never mutates domain entities | **Pass** | Grep: no `prisma.client` domain entity mutations under `src/analytics` |
| Append-only AnalyticsEvent (ingest) | **Pass** | `create` only on ingest path; updates/deletes only GDPR unlink + retention purge |
| No Analytics-published domain lifecycle events | **Pass** | Consumer only |
| PostgreSQL-first; no third-party runtime required | **Pass** | No PostHog/Firebase required path |
| North Star compatible | **Pass** | Operator KPIs support healthy platform culture home — not Studio B2B invent |

**Architecture score: 9 / 10**  
(Post-audit remediation closed Freeze key + MALP wording debt; −1 remaining ops/outbox engineering.)

---

## Ownership & event boundaries

| Concern | Owner | Status |
|---------|-------|--------|
| `AnalyticsEvent` | Analytics | **Pass** |
| `DailyMetric` | Analytics | **Pass** |
| `RetentionMetric` | Analytics (scaffold) | **Pass** — writers deferred; scaffold only |
| `SearchEvent` / trending | Search | **Pass** — Analytics never writes `SearchEvent` |
| Reviews / GameLogs / Feed / Moderation / Notifications / Collections… | Domain BCs | **Pass** — consume events only |
| Allowlist | `ANALYTICS_EVENT_MATRIX.md` | **Pass** — 37 events; no invented consumers |
| Search executed signals | Consume `search.*.executed.v1` → AnalyticsEvent | **Pass** |

---

## Aggregation

| Check | Result | Evidence |
|-------|--------|----------|
| Replay-safe | **Pass** | Full recompute per UTC day |
| Idempotent | **Pass** | Upsert on `(metricDate, metricKey)` — never `+=` |
| No double-counting on re-run | **Pass** | 14.2 / 14.4 integration coverage |
| Immutable AnalyticsEvent (ingest) | **Pass** | Append-only create |
| DailyMetric derived only | **Pass** | From AnalyticsEvent counts / distinct users |
| Batch aggregation (14.4) | **Pass** | `groupBy` for day counts; `upsertMany` transaction |
| Duplicate ingest protection | **Pass** | `sourceEventId` dedupe (race without unique index = Minor) |

---

## Dashboard

| Check | Result | Evidence |
|-------|--------|----------|
| Reads ONLY DailyMetric | **Pass** | `AnalyticsDashboardRepository` |
| Never queries business tables | **Pass** | No domain joins for KPIs |
| Admin composes Analytics | **Pass** | `AdminModule` imports `AnalyticsModule`; hosts controller |
| Analytics is KPI SoT | **Pass** | `GET /admin/dashboard` remains domain stats; KPIs via `/admin/analytics/{dashboard}` |
| Deferred `ai` / `releases` | **Pass** | 404 — Freeze Phase 2+ |
| Range guard | **Pass** | Max 90 UTC days (14.4) |

---

## Privacy & GDPR

| Check | Result | Evidence |
|-------|--------|----------|
| No email / username / displayName | **Pass** | Denylist + allowlist sanitize |
| No raw review / message body | **Pass** | `body`, `content`, `message`, `messageBody`, `reviewText`, … |
| No raw search query | **Pass** | `query` / `searchQuery` stripped |
| No IP / tokens | **Pass** | Denylist |
| Aggregates only on staff API | **Pass** | Metrics object = numbers |
| GDPR unlink exists | **Pass** | `AnalyticsGdprService.unlinkUser` |
| Retention hook exists | **Pass** | `AnalyticsEventRetentionService` (24 months) |
| Auth deletion wiring | **Gap (Minor/ops)** | Hook exported; not yet called from Users/Auth deletion flow |

---

## Security

| Check | Result | Evidence |
|-------|--------|----------|
| Admin only | **Pass** | `AdminAuthGuard` + `PlatformRoleGuard` |
| Permission Matrix | **Pass** | Staff roles for platform/moderation volume |
| No public analytics | **Pass** | No player-facing endpoints |
| No user-level event timeline | **Pass** | Deferred Phase 2 |
| Visibility Matrix | **Pass** | Aggregates; 403 for non-staff |

**Security score: 9 / 10**  
(−1 GDPR unlink not yet bound into account-deletion worker — hook ready, production wiring pending.)

---

## Cache

| Rule | Result |
|------|--------|
| `analytics:daily:{date}` | **Pass** |
| `analytics:dashboard:{hash}` | **Pass** |
| `analytics:metric:{name}` | **Pass** (optional) |
| Targeted invalidation only | **Pass** |
| No `FLUSHALL` / `KEYS` / wildcard | **Pass** |
| No Admin/domain namespace conflation | **Pass** |

---

## Performance

| Area | Assessment |
|------|------------|
| Batch aggregation | **Good** — single `groupBy` for day counts (14.4) |
| Batch DailyMetric writes | **Good** — `$transaction` `upsertMany` |
| Dashboard query | **Good** — one filtered `DailyMetric` `findMany` |
| N+1 | **Acceptable** — proxy metrics need 3 distinct windows by definition |
| Replay cost | **Acceptable** — full day recompute is intentional for correctness |
| Scale follow-up | Distinct-user via Prisma distinct rows — optimize later if needed |

---

## OpenAPI parity

| Surface | Status |
|---------|--------|
| `GET /admin/analytics/{dashboard}` (`adminGetAnalyticsDashboard`) `platform` | **Implemented** |
| Light `moderation` volume | **Implemented** |
| `ai` / `releases` | **Deferred** (404) |
| Client ingest SDK `POST …/analytics/events` | **Deferred** |
| Search analytics / Studio BI / AI dashboards | **Out of scope** |
| OpenAPI invent / schema invent | **Not done** (correct) |

Residual hygiene (not a path invent): YAML description still mentions PostHog/Prometheus — implementation is internal DailyMetric.

---

## Validation (latest claimed gates — Sprint 14.4)

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| typecheck (`@gmrlog/api`) | ✅ |
| build (`@gmrlog/api`) | ✅ |
| scoped eslint (`src/analytics`) | ✅ |
| Unit + integration (full suite) | ✅ **534 / 534** (133 files) |
| Analytics-scoped specs | ✅ **25 / 25** |
| E2E `admin-core` | ✅ **3 / 3** |

Historical note: full e2e suite has pre-existing moderation env flakes unrelated to Analytics HTTP.

---

## Scoring

| Dimension | Score | Notes |
|-----------|------:|-------|
| Architecture | **9 / 10** | BC boundaries solid; Freeze keys + MALP wording aligned (post-audit remediation) |
| Security | **9 / 10** | Staff gates + privacy sanitize strong; GDPR ops wiring pending |
| Production readiness | **8 / 10** | Replay-safe, cached, tested; cron/outbox ops remain |

---

## Technical debt

### Critical

**None.**

### Major

**None** — closed by post-audit remediation (`ANALYTICS_POST_AUDIT_REMEDIATION.md`): Freeze metric keys aligned; MALP wording harmonized (events only, never GameLogs SQL).

### Minor

| # | Debt | Notes |
|---|------|-------|
| 1 | Best-effort in-process event bus | No outbox — known Freeze V1 risk |
| 2 | Ingest dedupe without DB unique index | Concurrent same `sourceEventId` race window |
| 3 | Aggregation / GDPR / retention not cron-bound | Services exported; ops schedule pending |
| 4 | GDPR unlink not called from Auth/Users deletion | Hook ready |
| 5 | Optional banned/deleted exclusion from DAU/MALP | Freeze “when cheap” — not implemented |
| 6 | OpenAPI description hygiene | PostHog/Prometheus text vs internal DailyMetric |
| 7 | Distinct-user count memory shape at large scale | Follow-up if volume warrants |

---

## Production readiness verdict

Analytics V1 pipeline is **structurally production-ready**: ownership, allowlist, replay-safe aggregation, DailyMetric-only dashboard, staff AuthZ, privacy sanitize, targeted cache, and hardening hooks are in place. Freeze metric-key and MALP wording Major debt closed by post-audit remediation. Remaining work is ops scheduling / outbox engineering — not redesign.

**Analytics Module is production-ready pending Minor ops items only.**

---

## Gate

**APPROVED WITH MINOR CHANGES**

**ANALYTICS MODULE V1 COMPLETE**

Stop. Do **not** continue to Module 15.
