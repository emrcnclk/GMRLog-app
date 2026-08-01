# ADR — Analytics Platform

**ADR ID:** ADR-ANL-001  
**Date:** 2026-07-20  
**Status:** **Accepted** (Sprint 14.0 — Analytics Platform Freeze v1.0)  
**Deciders:** Architecture / Data / Backend / Platform Ops / Product  
**Preceded by:** [`MODULE_14_SCOPE_REPORT.md`](../../00_PROJECT/MODULE_14_SCOPE_REPORT.md)

---

## Context

Prisma already defines `AnalyticsEvent`, view facts (`ScreenView`, `GameView`, `ReviewView`), `DailyMetric`, and `RetentionMetric`. Product docs under `docs/13_ANALYTICS/` describe a client SDK → `POST /analytics/events` pipeline and mention PostHog / Firebase / Grafana. Runtime has **no** Nest Analytics module and **no** writers to those tables.

Meanwhile domains already emit rich `*.v1` events through `DomainEventPublisher`, Search owns `SearchEvent`, and Admin Module V1 ships operational dashboard compose via domain stats ports. Module 14 Scope Report (`APPROVED WITH MINOR CHANGES`) required locking: Analytics as **event consumer only**, domains as SoT, PostgreSQL-first MVP, Admin vs Analytics counter boundaries, SearchEvent boundary, and deferred AI/third-party/BI sprawl.

North Star: Analytics Products may monetize later; Module 14 V1 is **internal** metrics that protect and improve the digital home — not a second SoT and not Studio B2B Analytics.

## Decision

1. Treat **Analytics Platform as an event-consumer & metric-store BC** — ingestion, aggregation, dashboard reads — **not** a data owner for domain entities.  
2. **Domains remain source of truth.** Analytics **never mutates** Users, Games, Reviews, GameLogs, Feed, Search, Notifications, Moderation, Collections, Lists, or TierLists.  
3. **Event-driven analytics (MVP):** consume Freeze-allowlisted domain events from `DomainEventPublisher` into append-only `AnalyticsEvent`.  
4. **Append-only architecture:** no update/delete of historical `AnalyticsEvent` rows for “corrections”; retention purge/unlink is the only lifecycle exception (GDPR).  
5. **PostgreSQL-first MVP:** first-party Postgres is the V1 store. PostHog / Firebase / Grafana / Prometheus embeds are **not** required runtime for Module 14 V1.  
6. **DailyMetric ownership = Analytics** for frozen platform KPI keys. Admin shell operational counters remain Admin compose over domain ports.  
7. **SearchEvent remains Search-owned.** Analytics may mirror search-executed **domain events** into `AnalyticsEvent` for KPIs; must not become SoT for query logs/trending.  
8. **AI deferred.** No toxicity scores, recommendation accuracy, ML dashboards, or predictive analytics in Module 14 V1.  
9. **Reuse schema** — prefer existing analytics models; no new tables/enums in V1 without Freeze amendment. View-fact writers (`ScreenView` etc.) deferred until client telemetry is authorized.  
10. **OpenAPI discipline** — implement narrow `adminGetAnalyticsDashboard` `platform` (optional light `moderation` volume); do not invent undeclared paths; client ingest OpenAPI is change-control if needed.  
11. **Cache:** targeted Redis only; no `FLUSHALL` / `KEYS` wipes.  
12. **Historical product docs:** `docs/13_ANALYTICS/*` remain informative; on conflict, this ADR + Freeze win for Module 14+.

## Why event-driven (not dual-write from services)

- Domains already publish after successful writes — lowest coupling.  
- Dual-writing Analytics inside every service recreates SoT forks and review burden.  
- Consumers can fail independently (best-effort V1) without rolling back user actions.

## Why PostgreSQL-first

- Schema already exists; avoids vendor lock-in for MVP.  
- Spec’s PostHog/Firebase list is product aspiration — Scope Report required an explicit V1 path lock.  
- Warehouse / third-party BI can attach later without blocking operator KPIs.

## Why Analytics must not mutate domains

- Violates every prior Freeze (Reviews, Games, Moderation, Search, Notification, Admin).  
- Metrics must not silently “heal” entity state.

## Consequences

- Sprint 14.1 can ship consumers + `AnalyticsEvent` append without client SDK.  
- DAU may be a **proxy** from authenticated domain events until client `PAGE_VIEW` exists.  
- **MALP proxy (V1):** derived **only** from approved GameLog domain events ingested as `AnalyticsEvent` (`gamelog.created.v1`, `game.progress.completed.v1`); **never** calculated via GameLogs SQL. Stored as `malp_proxy` in `DailyMetric`. Proxy until a future client analytics SDK. GameLogs remain SoT for log rows.  
- Admin `GET /admin/dashboard` is not deleted or replaced wholesale.  
- Outbox/durable bus remains a known risk (best-effort) unless later amended.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Analytics owns copies of Users/Games/Reviews | SoT fork; privacy risk |
| Require PostHog before any metrics | Blocks MVP; schema unused |
| Dual-write Analytics inside every domain service | Coupling; inconsistent adoption |
| Replace Admin dashboard with Analytics only | Breaks operational triage; Admin Freeze |
| Own SearchEvent | Breaks Search Freeze |
| Ship funnels/cohorts/AI in V1 | Scope explosion; Feature Matrix Future / AI phase |
| Invent `analytics.*.v1` domain lifecycle events | Duplicate SoT signals |

## Status

**Accepted** with Analytics Platform Freeze v1.0.
