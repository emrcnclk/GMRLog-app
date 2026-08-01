# Analytics V1 — Post-Audit Remediation

**Document:** `docs/00_PROJECT/ANALYTICS_POST_AUDIT_REMEDIATION.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Mode:** Remediation — Major debt closure only  
**Source audit:** [`SPRINT_14_5_FINAL_AUDIT.md`](./SPRINT_14_5_FINAL_AUDIT.md)  
**Freeze:** [`ANALYTICS_PLATFORM_FREEZE_v1.md`](./ANALYTICS_PLATFORM_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

No new features. No Module 15. No new KPIs.

---

## Executive Summary

Closes the two **Major** findings from Sprint 14.5:

1. **Freeze metric key consistency** — removed non-Freeze DailyMetric / dashboard keys so runtime matches Freeze §5 exactly.  
2. **MALP wording consistency** — Freeze, Architecture, ADR, Event Matrix, aggregation, dashboard docs, and sprint reports now share one definition: event-derived proxy, never GameLogs SQL.

---

## Fixed metric keys

### Canonical Freeze §5 keys (SSOT)

| metricKey |
|-----------|
| `dau_proxy` |
| `wau_proxy` |
| `malp_proxy` |
| `reviews_created` |
| `gamelogs_created` |
| `search_executed` |
| `feed_items_created` |
| `reports_created` |
| `moderation_resolved` |
| `notifications_created` |

### Removed (non-Freeze — no aliases retained)

| Removed key | Was used in |
|-------------|-------------|
| `collections_created` | Aggregation writers, `ANALYTICS_DAILY_METRIC_KEYS`, platform dashboard keys, 14.2/14.3 reports |
| `lists_created` | Same |
| `tierlists_created` | Same |

### Aliases confirmed absent

- No `moderation_reports_created` / `moderation_reports_resolved` — Freeze names `reports_created` / `moderation_resolved` only.

### Code touched

- `apps/api/src/analytics/analytics.constants.ts`
- `apps/api/src/analytics/analytics-aggregation.service.ts`

Collection/list/tierlist **events** remain on the ingest allowlist (activity signals); they no longer produce DailyMetric KPI keys.

---

## MALP wording harmonization

**Single V1 definition (all normative surfaces):**

> `malp_proxy` = distinct non-null `userId` on approved GameLog **events** (`gamelog.created.v1`, `game.progress.completed.v1`) in rolling 30d UTC, stored in `DailyMetric`. Derived **only** from `AnalyticsEvent`. **Never** calculated from GameLogs SQL. Proxy until a future client analytics SDK. GameLogs remain SoT for log rows.

### Updated

| Artifact | Change |
|----------|--------|
| `ANALYTICS_PLATFORM_FREEZE_v1.md` §5 | Source column → `AnalyticsEvent` only; never GameLogs SQL |
| `ANALYTICS_ARCHITECTURE.md` | Aggregation input = events only for MALP |
| `ADR_Analytics_Platform.md` | Replaced GameLogs read-port wording |
| `ANALYTICS_EVENT_MATRIX.md` | MALP inputs annotated on create/complete events |
| `MODULE_14_SCOPE_REPORT.md` | Ownership table MALP row aligned |
| `SPRINT_14_2` / `14_3` / `14_5` reports | Keys + MALP text aligned |
| Aggregation constants / service comments | Freeze-canonical MALP note |

Non-normative product docs (`docs/13_ANALYTICS/*`, `SUCCESS_METRICS.md`) continue to describe product North Star MALP conceptually; Module 14 operational KPI is **`malp_proxy`** as above (Freeze wins on conflict).

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| typecheck (`@gmrlog/api`) | ✅ |
| build (`@gmrlog/api`) | ✅ |
| scoped eslint (`src/analytics`) | ✅ |
| Unit + integration (`src/analytics` + full unit suite) | ✅ (no new failures) |

---

## Debt status after remediation

**Remaining Critical Debt: NONE**

**Remaining Major Debt: NONE**

**Remaining Minor Debt:**

- Outbox (best-effort in-process bus)
- Cron wiring (aggregation / job schedule)
- GDPR scheduled retention (+ Auth deletion unlink binding)
- Extremely rare dedupe race (no DB unique on `sourceEventId`)
- Other production engineering items only (OpenAPI description hygiene, optional banned-user proxy filters, distinct-count scale)

---

## Gate

**ANALYTICS V1 REMEDIATION COMPLETE**

Stop. Do **not** continue to Module 15.
