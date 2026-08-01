# Sprint 14.2 — Analytics Aggregation Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_14_2_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Scope:** Analytics aggregation only (no dashboard / Analytics API / client SDK)  
**Freeze:** [`ANALYTICS_PLATFORM_FREEZE_v1.md`](./ANALYTICS_PLATFORM_FREEZE_v1.md)  
**Prior:** [`SPRINT_14_1_IMPLEMENTATION_REPORT.md`](./SPRINT_14_1_IMPLEMENTATION_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 14.2 delivers the **deterministic, replay-safe aggregation pipeline**: read append-only `AnalyticsEvent`, recompute allowlisted KPI values for a UTC day, upsert `DailyMetric`, and apply targeted Redis invalidation. Domains remain SoT. No domain table reads/writes for metrics. No OpenAPI, dashboard, funnels, or client telemetry.

| Area | Outcome |
|------|---------|
| Aggregation | `AnalyticsAggregationService` + `AggregationJobRunner` |
| DailyMetric | Repository + service; upsert on `(metricDate, metricKey)` |
| Retention | `RetentionMetricService` storage scaffold only |
| Cache | `analytics:daily:{date}` + `analytics:metric:{name}` targeted DEL/SET |
| Replay | Full recompute → upsert (never increment) |
| Quality gates | prisma ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit/integration ✅ · e2e ⚠️ env |

---

## Aggregation pipeline

```
AggregationJobRunner.runForUtcDate(YYYY-MM-DD)
  → AnalyticsAggregationService.aggregateUtcDate
      → AnalyticsEventRepository counts / distinct users (UTC windows)
      → AnalyticsCacheService.invalidateDaily (targeted DEL)
      → DailyMetricService.upsertMetric × N keys
      → AnalyticsCacheService.setDailyBundle + setMetricSnapshot
```

| Component | Responsibility |
|-----------|----------------|
| `AggregationJobRunner` | Callable entrypoint (`runForUtcDate`, `runForYesterdayUtc`). No cron framework in V1. |
| `AnalyticsAggregationService` | Deterministic KPI computation from `AnalyticsEvent` only |
| `DailyMetricRepository` / `DailyMetricService` | Idempotent upsert + date listing |
| `RetentionMetricService` | Scaffold upsert for future cohorts — **not** invoked by the job runner |
| `AnalyticsCacheService` | Frozen keys only; no FLUSHALL / KEYS / namespace wipe |

**Never:** mutate `AnalyticsEvent`, query GameLogs / Reviews / other domain tables for metrics, invent custom metric keys.

---

## Generated metrics

Allowlist in `ANALYTICS_DAILY_METRIC_KEYS` — **Freeze §5 only** (post-audit remediation removed non-Freeze content-creation keys):

| Key | Definition (UTC) |
|-----|------------------|
| `dau_proxy` | Distinct non-null `userId` on any `AnalyticsEvent` in the day |
| `wau_proxy` | Distinct non-null `userId` in rolling 7d ending at day end |
| `malp_proxy` | Distinct non-null `userId` on approved GameLog **events** in rolling 30d |
| `reviews_created` | Count `review.created.v1` |
| `gamelogs_created` | Count `gamelog.created.v1` |
| `feed_items_created` | Count `feed.item.created.v1` |
| `search_executed` | Count allowlisted `*.search.executed.v1` / `search.global.executed.v1` |
| `reports_created` | Count `moderation.report.created.v1` |
| `moderation_resolved` | Count `moderation.resolved.v1` |
| `notifications_created` | Count `notification.created.v1` |

No custom / revenue / recommendation / AI metrics. No `collections_created` / `lists_created` / `tierlists_created` (not Freeze-canonical).

### DAU proxy (documented)

Client telemetry SDK is **deferred**. `dau_proxy` is therefore derived from **authenticated** Analytics rows only: distinct `userId IS NOT NULL` on ingested allowlisted domain events for that UTC day. Anonymous / null-`userId` events (e.g. some search executions) do **not** contribute to DAU.

### MALP proxy (documented)

`malp_proxy` uses **AnalyticsEvent names only** (approved GameLog events):

- `gamelog.created.v1`
- `game.progress.completed.v1`

Rolling 30 UTC days ending at the aggregation day end. **Never** queries `GameLogs` (or other domain tables) via SQL. Proxy until future client analytics SDK. GameLogs remain SoT for log rows.

---

## Replay strategy

1. Choose UTC day `D` (`YYYY-MM-DD`).
2. Recompute every allowlisted key from current `AnalyticsEvent` facts for the required windows.
3. `DailyMetric.upsert` on unique `(metricDate, metricKey)` — **replace** value, never `+=`.
4. Targeted cache invalidate then refresh for that date / touched metric names.

**Invariant:** Running aggregation twice for the same day yields identical `DailyMetric` values and does not double-count.

`AnalyticsEvent` remains append-only; aggregation never updates or deletes events.

---

## DailyMetric behavior

- Derived only; domains unchanged.
- Unique constraint `(metricDate, metricKey)` is the idempotency key.
- Values stored as `Decimal`; writers pass integers from counts.
- Aggregation does not expose HTTP/API in this sprint.

---

## Cache

| Key | Use |
|-----|-----|
| `analytics:daily:{date}` | Day bundle JSON after successful aggregate (TTL 600s) |
| `analytics:metric:{name}` | Per-key snapshot (TTL 300s) |

After upsert for date `D`: `DEL analytics:daily:{D}` and `DEL analytics:metric:{name}` for touched keys, then SET refreshed values.

**Forbidden:** `FLUSHALL`, `FLUSHDB`, `KEYS analytics:*`, namespace wipes.

---

## Retention

`RetentionMetricService.upsertScaffold` can write `RetentionMetric` rows for future jobs. **No** cohort analysis, **no** retention dashboard, **not** wired into `AggregationJobRunner` in 14.2.

---

## Primary files

- `apps/api/src/analytics/analytics-aggregation.service.ts`
- `apps/api/src/analytics/aggregation-job.runner.ts`
- `apps/api/src/analytics/daily-metric.repository.ts`
- `apps/api/src/analytics/daily-metric.service.ts`
- `apps/api/src/analytics/retention-metric.service.ts`
- `apps/api/src/analytics/analytics-cache.service.ts`
- `apps/api/src/analytics/analytics-event.repository.ts` (aggregation reads)
- `apps/api/src/analytics/analytics.constants.ts` (metric keys + cache helpers)
- `apps/api/src/analytics/analytics.module.ts`
- `apps/api/src/analytics/*.spec.ts` / `analytics.aggregation.integration.spec.ts`

**Not modified:** OpenAPI, domain ownership, domain business logic, Prisma schema invent (existing `DailyMetric` / `RetentionMetric` only).

---

## Explicitly out of scope (deferred)

Dashboard, charts, Analytics API, funnels, heatmaps, AI, recommendation/revenue metrics, client telemetry SDK — **Sprint 14.3+**.

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| typecheck (`@gmrlog/api`) | ✅ |
| build (`@gmrlog/api`) | ✅ |
| scoped eslint (`src/analytics`) | ✅ |
| Unit + integration (`vitest` full `src/**/*.spec.ts`) | ✅ **522/522** (129 files) |
| Analytics-scoped specs | ✅ **13/13** |
| E2E | ⚠️ **211/214** — 3 moderation env flakes (401/queue); unrelated to Analytics aggregation (no HTTP surface) |

---

## Remaining debt (out of 14.2)

| Debt | Notes |
|------|-------|
| Admin / Analytics dashboard compose | Sprint 14.3 |
| Cron / worker schedule for nightly aggregate | Ops wiring; runner is ready |
| Retention cohort jobs | Future phase |
| Outbox durability for ingestion | Known Freeze risk |

---

## Gate

**SPRINT 14.2 COMPLETE**

Stop. Do **not** continue to Sprint 14.3.
