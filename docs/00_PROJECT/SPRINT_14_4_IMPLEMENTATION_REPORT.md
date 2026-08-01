# Sprint 14.4 — Analytics Hardening Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_14_4_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Scope:** Production hardening only — no new features, APIs, metrics, or events  
**Freeze:** [`ANALYTICS_PLATFORM_FREEZE_v1.md`](./ANALYTICS_PLATFORM_FREEZE_v1.md)  
**Prior:** Sprints 14.1–14.3 implementation reports

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 14.4 audits and hardens the Analytics V1 pipeline (ingestion → aggregation → dashboard read). Changes are limited to replay safety, dedupe, batch performance, GDPR/retention hooks, privacy denylist expansion, dashboard range guards, and cache discipline. No new product surface.

| Area | Outcome |
|------|---------|
| Replay / idempotency | Confirmed upsert-only DailyMetric; ingest dedupe by `sourceEventId` |
| Performance | Aggregation daily counts → single `groupBy`; DailyMetric batch `$transaction` |
| GDPR | `AnalyticsGdprService.unlinkUser` hook (batch scrub) |
| Retention | `AnalyticsEventRetentionService` 24-month purge hook |
| Privacy | Expanded denied property keys + tests |
| Dashboard | Max 90 UTC-day range guard |
| Cache | Verified targeted keys only — no FLUSHALL/KEYS/wildcard |
| Quality gates | prisma ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit **534/534** · admin e2e **3/3** |

---

## Audit scope (reviewed)

| Component | Status |
|-----------|--------|
| `AnalyticsModule` | Wired ingestion, aggregation, dashboard, GDPR, retention hooks |
| `AnalyticsConsumerService` | Allowlist-only; errors swallowed (best-effort bus) |
| `AnalyticsEventService` | GDPR sanitize + dedupe guard |
| `AnalyticsEventRepository` | Append-only create; GDPR/retention exceptions documented |
| `AnalyticsAggregationService` | Full recompute + batch upsert |
| `DailyMetricRepository` | Idempotent `(metricDate, metricKey)` upsert + `upsertMany` |
| `AnalyticsDashboardService` | DailyMetric-only reads; range cap |
| `AnalyticsCacheService` | `analytics:daily:{date}`, `analytics:dashboard:{hash}`, `analytics:metric:{name}` |
| `AnalyticsDashboardController` | AdminAuth + PlatformRoleGuard; OpenAPI operationId |
| `AdminModule` compose | KPI via Analytics port; `GET /admin/dashboard` unchanged |
| `RetentionMetricService` | Scaffold only (unchanged) |

---

## Hardening summary

### Replay safety & idempotent aggregation

| Rule | Implementation |
|------|----------------|
| DailyMetric never incremented | Full recompute → `upsert` / `upsertMany` replace value |
| Replay same UTC day | Identical metrics (14.2 integration retained) |
| AnalyticsEvent append-only | Repository exposes `create` only for ingest path |
| Allowed mutations | GDPR unlink (`userId` null + property scrub); retention purge `deleteMany` |

### Duplicate event protection (14.4)

- Before append, `existsBySourceEventId(event.id)` skips redelivered domain events.
- `properties.sourceEventId` set at ingest from domain event id.
- **Note:** Without a DB unique index on JSON path, concurrent duplicate delivery has a small race window (classified Minor below).

### GDPR (`AnalyticsGdprService`)

- `unlinkUser(userId)` — batch scan (500 rows), sets `userId` null, scrubs user UUID refs from `properties`, strips denied PII keys via `scrubPropertiesForUser`.
- Exported from `AnalyticsModule` for Auth/Users deletion workers.
- Does **not** block domain deletion (retry-safe worker pattern per Visibility Matrix).

### Retention policy hook (`AnalyticsEventRetentionService`)

- `ANALYTICS_EVENT_RETENTION_MONTHS = 24` (aligns with `DATA_RETENTION.md`).
- `purgeEventsBefore(cutoff, batchSize)` — batched `deleteMany` on old `AnalyticsEvent` rows.
- `DailyMetric` aggregates retained (non-PII).
- Not scheduled in V1 — ops/cron wiring deferred.

### Dashboard consistency

- Reads **only** `DailyMetric` via `AnalyticsDashboardRepository.findInDateRange`.
- Proxy metrics (`dau_proxy`, `malp_proxy`) use as-of end date; counts sum across range.
- `ANALYTICS_MAX_DASHBOARD_RANGE_DAYS = 90` prevents unbounded scans.

### Permission enforcement

- `AnalyticsDashboardController`: `AdminAuthGuard` + `PlatformRoleGuard` + staff roles.
- No public or user-level analytics endpoints added.

---

## Performance improvements

| Before | After |
|--------|-------|
| ~10 parallel `countByNameInRange` per aggregation day | **1** `groupBy` for all daily count metrics + search names |
| Sequential DailyMetric upserts (13 awaits) | **1** `$transaction` batch via `upsertMany` |
| Metric snapshot cache sets sequential | Parallel `Promise.all` for snapshot writes |

Proxy metrics (`dau_proxy`, `wau_proxy`, `malp_proxy`) still use 3 distinct-user queries (different UTC windows) — required by definition.

Dashboard: single `findMany` on `DailyMetric` with `(metricDate, metricKey)` filter — no N+1.

---

## Privacy review (GDPR)

Verified `AnalyticsEventService` **never persists**:

| Forbidden | Enforcement |
|-----------|-------------|
| email, username, displayName | `ANALYTICS_DENIED_PROPERTY_KEYS` |
| review/message text | `body`, `content`, `message`, `messageBody`, `reviewText`, `text`, `comment`, `snippet` |
| raw search query | `query`, `searchQuery`, `rawQuery` |
| IP | `ip`, `ipAddress`, `ipAddr` |
| tokens / password | denied set |

Only allowlisted keys pass; values must be UUID, enum-like string, boolean, or finite number.

**Tests added:** duplicate skip, extended denylist, GDPR scrub helper.

No PII in dashboard API — aggregate numbers only.

---

## Cache review

| Key | TTL | Invalidation |
|-----|-----|--------------|
| `analytics:daily:{date}` | 600s | Targeted `DEL` on aggregation for date `D` |
| `analytics:metric:{name}` | 300s | Targeted `DEL` for touched keys |
| `analytics:dashboard:{hash}` | 45s | TTL-first; `invalidateDashboard(hash)` when hash known |

**Verified absent:** `FLUSHALL`, `FLUSHDB`, `KEYS analytics:*`, wildcard `DEL analytics:dashboard:*`.

Admin `admin:dashboard:home` namespace not touched.

---

## Replay review

| Scenario | Expected | Verified |
|----------|----------|----------|
| Run aggregation twice for same day | Same DailyMetric values | ✅ integration |
| Re-ingest same domain event id | Skip second append | ✅ unit + integration |
| Dashboard after re-aggregation | Reads updated DailyMetric; cache TTL refreshes | ✅ |
| GDPR unlink then re-aggregate | Unlinked users excluded from future proxy counts | ✅ by design (null `userId`) |

---

## Primary files changed (14.4)

- `apps/api/src/analytics/analytics-event.repository.ts` — dedupe lookup, `groupBy` counts
- `apps/api/src/analytics/analytics-event.service.ts` — duplicate skip
- `apps/api/src/analytics/analytics-aggregation.service.ts` — batch aggregation + upsert
- `apps/api/src/analytics/daily-metric.repository.ts` — `upsertMany`
- `apps/api/src/analytics/daily-metric.service.ts` — batch façade
- `apps/api/src/analytics/analytics-gdpr.service.ts` — **new**
- `apps/api/src/analytics/analytics-event-retention.service.ts` — **new**
- `apps/api/src/analytics/analytics.constants.ts` — denylist + max dashboard range
- `apps/api/src/analytics/analytics-dashboard.service.ts` — range guard
- `apps/api/src/analytics/analytics-dashboard.controller.ts` — dashboard id type guard
- `apps/api/src/analytics/analytics.module.ts` — register/export hooks
- `apps/api/src/analytics/*.spec.ts` — hardening tests

**Not changed:** OpenAPI, domain business logic, new APIs/metrics/events, ingestion allowlist, aggregation formulas (except batching).

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| typecheck (`@gmrlog/api`) | ✅ |
| build (`@gmrlog/api`) | ✅ |
| scoped eslint (`src/analytics`) | ✅ |
| Unit + integration (full suite) | ✅ **534/534** (133 files) |
| Analytics-scoped specs | ✅ **25/25** |
| E2E `admin-core` | ✅ **3/3** |

---

## Remaining issues (classified)

### Critical

**None.**

### Major

**None** (code-level). Ops wiring for GDPR unlink + retention purge into Auth/Users deletion scheduler is an **expected V1 deferral** per Freeze (“retry job”; do not block domain deletion).

### Minor

| Issue | Notes |
|-------|--------|
| Best-effort in-process event bus | No outbox durability — known Freeze risk; duplicates mitigated by `sourceEventId` dedupe |
| Dedupe race without DB unique index | Concurrent identical event id could double-append; acceptable V1; index amendment Phase 2 |
| GDPR / retention hooks not cron-bound | Services exported; worker schedule is ops (14.5 / DevOps) |
| Banned/deleted user proxy exclusion | Freeze optional “when cheap”; not filtered in DAU/MALP V1 |
| `countDistinctUsersInRange` at very large scale | In-memory distinct via Prisma; optimize with SQL `COUNT(DISTINCT)` if needed later |
| Full e2e suite | Pre-existing moderation flakes unrelated to Analytics |

---

## Verdict

All remaining items are **Minor** (or deferred ops wiring explicitly allowed by Freeze).

**Analytics Module is production-ready pending final audit (Sprint 14.5).**

---

## Gate

**SPRINT 14.4 COMPLETE**

Stop. Do **not** continue to Sprint 14.5.
