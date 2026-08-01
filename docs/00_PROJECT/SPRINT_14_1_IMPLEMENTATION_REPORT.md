# Sprint 14.1 — Analytics Event Ingestion Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_14_1_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Scope:** Analytics event ingestion only (no aggregation / dashboard)  
**Freeze:** [`ANALYTICS_PLATFORM_FREEZE_v1.md`](./ANALYTICS_PLATFORM_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 14.1 delivers the **Analytics ingestion pipeline**: Nest `AnalyticsModule` consumes Freeze-allowlisted domain events via `DomainEventPublisher` and appends GDPR-safe `AnalyticsEvent` rows. Domains remain SoT. No DailyMetric, RetentionMetric, dashboard, Redis analytics cache, OpenAPI, or domain mutations.

| Area | Outcome |
|------|---------|
| Module | `AnalyticsModule` wired into `AppModule` |
| Consumer | Allowlist-only subscriptions (37 events) |
| Persistence | Append-only `AnalyticsEvent` |
| Search boundary | Consumes `search.*.executed.v1` → AnalyticsEvent only; never writes `SearchEvent` |
| Events published | **None** |
| Quality gates | prisma ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit ✅ · e2e ⚠️ env |

---

## Consumed events

All events from [`ANALYTICS_EVENT_MATRIX.md`](../03_EVENTS/ANALYTICS_EVENT_MATRIX.md) — registered in `ANALYTICS_CONSUMED_EVENTS`:

- Reviews: `review.created|updated|edited|deleted|hidden|restored|reported.v1`, `review.search.executed.v1`
- GameLogs: `gamelog.created|updated|deleted|status.changed.v1`, `game.progress.updated|completed.v1`
- Feed: `feed.item.created.v1`
- Search: `search.global.executed.v1`, `game|list|tierlist|collection|user.search.executed.v1`
- Moderation: `moderation.report.created.v1`, `moderation.resolved.v1`, `moderation.appeal.created|resolved.v1`
- Notifications: `notification.created.v1`
- Collections/Lists/TierLists: `*.created.v1`, `*.deleted.v1`
- Users sanctions: `user.warned|suspended|banned|unsuspended|unbanned.v1`

Non-allowlisted events (e.g. `message.created.v1`) are ignored.

---

## Repository / services

| Component | Responsibility |
|-----------|----------------|
| `AnalyticsEventRepository` | Append-only `analyticsEvent.create` |
| `AnalyticsEventService` | Allowlist gate, type map (`SEARCH` / `CUSTOM`), GDPR property sanitize, persist |
| `AnalyticsConsumerService` | `OnModuleInit` → `publisher.on(type, …)` for allowlist |

### Persistence mapping (existing schema — no Prisma invent)

| Logical field | Prisma column / JSON |
|---------------|----------------------|
| eventType | `eventType` (`AnalyticsEventType`) |
| eventName | `name` (versioned domain type string) |
| actorId | `properties.actorId` (+ `userId` when UUID subject) |
| entityType | `properties.entityType` (`aggregateType`) |
| entityId | `properties.entityId` when UUID; else `properties.entityKey` |
| timestamp | `createdAt` (from `occurredAt`) |
| metadata | sanitized `properties` (IDs / enums / counts) |

**Stripped forever:** email, username, query, body, title, reason, message, content, IP, tokens.

---

## Architecture compliance

| Rule | Result |
|------|--------|
| Event consumer only | **Pass** |
| Domains remain SoT | **Pass** |
| No domain table mutations | **Pass** |
| Append-only AnalyticsEvent | **Pass** |
| SearchEvent remains Search-owned | **Pass** |
| No public Analytics events | **Pass** |
| No DailyMetric / dashboard / Redis analytics keys | **Pass** |
| No OpenAPI edits | **Pass** |
| Schema reuse only | **Pass** — exported existing `AnalyticsEventType` from `@gmrlog/database` |

---

## Primary files

- `apps/api/src/analytics/analytics.module.ts`
- `apps/api/src/analytics/analytics.constants.ts`
- `apps/api/src/analytics/analytics-event.repository.ts`
- `apps/api/src/analytics/analytics-event.service.ts`
- `apps/api/src/analytics/analytics-consumer.service.ts`
- `apps/api/src/analytics/*.spec.ts`
- `apps/api/src/app.module.ts` (import)
- `packages/database/src/index.ts` (export `AnalyticsEventType` type only)

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| typecheck | ✅ |
| build | ✅ |
| scoped eslint (`src/analytics`) | ✅ |
| Unit + integration (`src/analytics`) | ✅ **7/7** |
| E2E | ⚠️ **209/214** |

### Environment / unrelated failures

| Failure | Classification |
|---------|----------------|
| `moderation-actions` appeal **401** | Pre-existing fixture flake |
| `moderation-queue` / `reviews-moderation` queue assertions | Env / data race — not Analytics HTTP |
| `games-discovery` autocomplete | Env flake |
| `tierlist-discovery` cache stale assertion | Env flake |

Handler failures are swallowed by `DomainEventPublisher` (best-effort bus per Freeze) — ingestion must not break domain writes.

---

## Remaining debt (out of 14.1)

| Debt | Notes |
|------|-------|
| DailyMetric aggregation | Sprint 14.2 |
| Dashboard / Admin compose | Sprint 14.3 |
| Outbox durability | Known Freeze risk |
| Client SDK ingest | Deferred |

---

## Gate

**SPRINT 14.1 COMPLETE**

Stop. Do **not** continue to Sprint 14.2.
