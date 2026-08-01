# Sprint 14.3 — Analytics Dashboard Metrics Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_14_3_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Scope:** Read-only Analytics platform dashboard API (no AI / retention / funnels)  
**Freeze:** [`ANALYTICS_PLATFORM_FREEZE_v1.md`](./ANALYTICS_PLATFORM_FREEZE_v1.md)  
**Prior:** [`SPRINT_14_1_IMPLEMENTATION_REPORT.md`](./SPRINT_14_1_IMPLEMENTATION_REPORT.md), [`SPRINT_14_2_IMPLEMENTATION_REPORT.md`](./SPRINT_14_2_IMPLEMENTATION_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 14.3 exposes **staff-only** platform KPI reads sourced exclusively from `DailyMetric`. Admin HTTP composes the Analytics read port via existing OpenAPI `adminGetAnalyticsDashboard`. Domain stats on `GET /admin/dashboard` are unchanged. No ingestion/aggregation logic changes. No OpenAPI invent.

| Area | Outcome |
|------|---------|
| Read port | `AnalyticsDashboardRepository` + `AnalyticsDashboardService` |
| HTTP | `AnalyticsDashboardController` → `GET /api/v1/admin/analytics/{dashboard}` |
| Admin compose | Controller registered in `AdminModule`; KPIs not dual-implemented in `AdminService` |
| Cache | `analytics:dashboard:{hash}` (TTL 45s), targeted only |
| Security | `AdminAuthGuard` + `PlatformRoleGuard` + staff roles |
| Quality gates | prisma ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit ✅ · e2e admin-core ✅ |

---

## Dashboard services

| Component | Responsibility |
|-----------|----------------|
| `AnalyticsDashboardRepository` | `DailyMetric` date-range reads only — never domain tables |
| `AnalyticsDashboardService` | Resolve UTC range, assemble KPI subset, cache-aside |
| `AnalyticsDashboardController` | OpenAPI `adminGetAnalyticsDashboard`; Admin AuthZ |
| `AnalyticsCacheService` | `getDashboard` / `setDashboard` / `invalidateDashboard(hash)` |

**Pipeline**

```
GET /admin/analytics/{dashboard}?from&to
  → AdminAuthGuard + PlatformRoleGuard
  → AnalyticsDashboardService.getDashboard
      → cache hit? return analytics:dashboard:{hash}
      → AnalyticsDashboardRepository.findInDateRange (DailyMetric)
      → assemble metrics → set cache → return DTO
```

**Defaults:** omitted `from`/`to` → latest completed UTC day (yesterday).  
**Counts** (e.g. `reviews_created`): sum across range.  
**Proxies** (`dau_proxy`, `malp_proxy`): value as-of range end date (not summed).

---

## Exposed KPIs

### `dashboard=platform` (MVP)

| Key | Notes |
|-----|--------|
| `dau_proxy` | As-of end date |
| `malp_proxy` | As-of end date — GameLog **events** only (never GameLogs SQL) |
| `reviews_created` | Sum in range |
| `feed_items_created` | Sum |
| `search_executed` | Sum |
| `reports_created` | Freeze name (not `moderation_reports_created`) |
| `moderation_resolved` | Freeze name (not `moderation_reports_resolved`) |
| `notifications_created` | Sum |

Freeze-canonical keys only. No `collections_created` / `lists_created` / `tierlists_created`.

### `dashboard=moderation` (light volume)

Only `reports_created` + `moderation_resolved` from Analytics metrics (not Moderation queue SoT).

### Deferred → **404**

`ai`, `releases` (Freeze Phase 2+).

**Response shape (OpenAPI `AnalyticsDashboard`):**

```json
{
  "dashboard": "platform",
  "generatedAt": "ISO-8601",
  "metrics": { "dau_proxy": 0, "...": 0 },
  "embedUrl": null
}
```

No PII. No custom metrics. No Grafana/PostHog embeds in V1.

---

## Admin integration

| Surface | Behavior |
|---------|----------|
| `GET /admin/dashboard` | **Unchanged** — domain stats ports (ops triage) |
| `GET /admin/analytics/{dashboard}` | Analytics KPI SoT via `DailyMetric` |
| `AdminModule` | Imports `AnalyticsModule`; registers `AnalyticsDashboardController` |
| `AdminService` | Does **not** recompute platform KPIs |

Admin consumes Analytics; Analytics never queries business entities for the dashboard.

---

## Cache strategy

| Key | TTL | Use |
|-----|-----|-----|
| `analytics:dashboard:{hash}` | 45s | Staff dashboard DTO |

**Hash:** SHA-256 of stable JSON `{ dashboard, from, to, roleBucket }` → 32 hex.  
**Invalidation:** TTL preferred; `DEL analytics:dashboard:{hash}` only when hash known.  
**Forbidden:** `FLUSHALL`, `KEYS`, wildcard `DEL analytics:dashboard:*`.

Existing `analytics:daily:{date}` / `analytics:metric:{name}` from 14.2 unchanged.

---

## Explicitly out of scope

AI dashboard, retention dashboard, funnels, cohorts, recommendation/revenue/crash/device/geo/studio/business analytics — deferred.

---

## Primary files

- `apps/api/src/analytics/analytics-dashboard.repository.ts`
- `apps/api/src/analytics/analytics-dashboard.service.ts`
- `apps/api/src/analytics/analytics-dashboard.controller.ts`
- `apps/api/src/analytics/analytics-dashboard.dto.ts`
- `apps/api/src/analytics/analytics-cache.service.ts` (dashboard methods)
- `apps/api/src/analytics/analytics.constants.ts` (platform/moderation key allowlists)
- `apps/api/src/analytics/analytics.module.ts`
- `apps/api/src/admin/admin.module.ts` (compose import + controller)
- `apps/api/test/admin-core.e2e-spec.ts` (staff analytics coverage)

**Not modified:** OpenAPI YAML, domain ownership/business logic, AnalyticsEvent ingestion, aggregation compute logic, Prisma schema invent.

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| typecheck (`@gmrlog/api`) | ✅ |
| build (`@gmrlog/api`) | ✅ |
| scoped eslint (`src/analytics` + `admin.module`) | ✅ |
| Unit + integration (full `vitest` unit config) | ✅ **527/527** (131 files) |
| Analytics-scoped specs | ✅ **18/18** |
| E2E `admin-core` | ✅ **3/3** (includes platform dashboard staff-only) |

---

## Remaining debt (out of 14.3)

| Debt | Notes |
|------|-------|
| Hardening / audit polish | Sprint 14.4 |
| `ai` / `releases` dashboards | Phase unlock |
| Role-differentiated metric payloads | Hash already includes `roleBucket` |
| Nightly aggregation schedule | Ops; runner ready since 14.2 |

---

## Gate

**SPRINT 14.3 COMPLETE**

Stop. Do **not** continue to Sprint 14.4.
