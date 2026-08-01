# Sprint 14.0 — Analytics Platform Architecture & Freeze

**Document:** `docs/00_PROJECT/SPRINT_14_0_ANALYTICS_ARCHITECTURE.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Type:** Documentation only — **no code, no Prisma, no migrations, no OpenAPI edits, no endpoint implementation**  
**Freeze:** [`ANALYTICS_PLATFORM_FREEZE_v1.md`](./ANALYTICS_PLATFORM_FREEZE_v1.md)  
**Scope precursor:** [`MODULE_14_SCOPE_REPORT.md`](./MODULE_14_SCOPE_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 14.0 establishes **Analytics Platform Freeze v1.0**: Analytics is an **event-consumer & metric-store BC**. Domains remain SoT. Analytics appends `AnalyticsEvent`, aggregates `DailyMetric`, and never mutates domain entities. MVP is **PostgreSQL-first**, allowlisted domain-event ingestion, frozen KPI keys, and staff `platform` dashboard reads. Admin operational dashboard compose stays separate. `SearchEvent` stays Search-owned. AI, funnels, cohorts, recommendation analytics, heatmaps, session replay, A/B, ML dashboards, revenue analytics, and third-party providers are deferred.

Historical [`docs/13_ANALYTICS/*`](../13_ANALYTICS/) is non-normative on conflict.

Implementation unlock: **Sprint 14.1 Event Ingestion only**.

---

## Artifacts generated

| # | Document | Role |
|---|----------|------|
| 1 | `docs/01_ARCHITECTURE/ANALYTICS_ARCHITECTURE.md` | BC, pipeline, Admin compose |
| 2 | `docs/01_ARCHITECTURE/ADR/ADR_Analytics_Platform.md` | ADR-ANL-001 |
| 3 | `docs/00_PROJECT/ANALYTICS_PLATFORM_FREEZE_v1.md` | Normative freeze |
| 4 | `docs/03_EVENTS/ANALYTICS_EVENT_MATRIX.md` | Consumer allowlist only |
| 5 | `docs/04_CACHE/ANALYTICS_CACHE_STRATEGY.md` | Targeted Redis / bans |
| 6 | `docs/05_SECURITY/ANALYTICS_PERMISSION_MATRIX.md` | AuthZ |
| 7 | `docs/05_SECURITY/ANALYTICS_VISIBILITY_MATRIX.md` | Privacy / GDPR |
| 8 | This report | Validation + approval |

**Not modified:** Prisma, OpenAPI, code, migrations.

---

## Architecture

| Topic | Decision |
|-------|----------|
| Ownership | Analytics owns `AnalyticsEvent`, `DailyMetric`, `RetentionMetric`, derived analytics only |
| Non-ownership | All domain entities; `SearchEvent`; Admin ops counters SoT |
| Pattern | Event-driven consumers → append-only store → aggregation → dashboard read |
| Engine | First-party PostgreSQL; in-process bus best-effort V1 |
| Admin | Compose Analytics reads for KPI embeds; do not write Analytics tables |
| AI | Deferred |

---

## Ownership (locked)

```text
Analytics BC
  ├── AnalyticsEvent
  ├── DailyMetric
  ├── RetentionMetric
  └── Derived analytics (cache / read DTOs)

NOT Analytics
  ├── Users / Games / Reviews / GameLogs / Feed
  ├── SearchEvent / Notifications / Moderation policy
  ├── Collections / Lists / TierLists
  └── Admin shell domain-stats dashboard
```

---

## Allowlist summary

### Events

Allowlisted runtime domain events only — see Event Matrix (review, gamelog, feed, search-executed, moderation, notification, collection/list/tierlist create-delete, user sanctions).  
**No future events** in V1 consumers.

### Metrics

`malp_proxy`, `dau_proxy`, `wau_proxy`, `reviews_created`, `gamelogs_created`, `search_executed`, `feed_items_created`, `reports_created`, `moderation_resolved`, `notifications_created`.

### APIs

Analytics module + staff platform KPI read; `adminGetAnalyticsDashboard` `platform` (optional moderation volume).  
Deferred: client SDK ingest, `ai`/`releases` dashboards, `searchAnalytics`, BI exports.

---

## Deferred work

| Item | Bucket |
|------|--------|
| AI analytics | AI phase |
| Funnels / cohorts productization | Phase 2 |
| Recommendation analytics | Phase 2+ |
| Heatmaps / session replay | Deferred |
| A/B testing / ML dashboards | Deferred |
| Revenue analytics | Phase 3 / Monetization |
| Third-party providers as required runtime | Deferred |
| Client SDK `PAGE_VIEW` path | Phase 1.5/2 |
| Outbox / durable bus | Known risk — amend if required |
| `RetentionMetric` writers | Optional after core DailyMetric |
| View-fact writers (`ScreenView` etc.) | With client telemetry |

---

## Known risks (accepted for V1)

| Risk | Disposition |
|------|-------------|
| In-process bus misses events | Best-effort; document; outbox later |
| DAU without client events | `dau_proxy` from domain events |
| Admin vs Analytics counter confusion | Explicit SoT split in Freeze |
| SearchEvent dual-write temptation | Forbidden — consume search-executed events only |
| Event explosion | Strict allowlist; no DM/reaction churn |

---

## Consistency review

| Check | Result |
|-------|--------|
| Scope Report minor changes addressed | **Pass** (PG-first, proxies, Admin/Search boundaries) |
| Prior Freezes not reopened | **Pass** |
| Event Matrix = runtime names only | **Pass** |
| Cache bans align Admin/Search discipline | **Pass** |
| No code/Prisma/OpenAPI edited this sprint | **Pass** |

---

## Approval

**Decision: APPROVED**

Analytics Platform Freeze v1.0 is accepted. Sprint 14.1 may begin after explicit authorization.

---

## Unlock

| Next | Status |
|------|--------|
| Sprint **14.1 Event Ingestion** | Unlocked by this Freeze |
| 14.2–14.5 | Sequenced after 14.1 |
| AI / third-party / Studio Analytics | Locked out of Module 14 V1 |

---

**APPROVED**

**SPRINT 14.0 COMPLETE**

Stop. Do **not** start Sprint 14.1 from this freeze sprint.
