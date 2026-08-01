# ADR — Platform Infrastructure

**ADR ID:** ADR-PLT-001  
**Date:** 2026-07-20  
**Status:** **Accepted** (Sprint 15.1 — Platform Infrastructure Freeze v1.0)  
**Deciders:** Architecture / Backend / Platform Ops / Security  
**Preceded by:** [`MODULE_15_SCOPE_REPORT.md`](../../00_PROJECT/MODULE_15_SCOPE_REPORT.md) (`APPROVED WITH MINOR CHANGES`)

---

## Context

Sprint 0.1 bootstrapped config, Prisma, Redis, MinIO, health, Pino, Docker Compose, and CI. Modules 10–14 delivered Notification, Search, Moderation, Admin, and Analytics Freezes atop that baseline.

Module 15 Scope Report found **SSOT docs ahead of runtime** for rate limiting, SMTP mail, durable jobs, and observability platforms. Auth `MailService` remains an in-memory stub. Analytics already uses Nest `ScheduleModule` crons. FeatureFlag Prisma models and Admin OpenAPI jobs/flags surfaces remain Phase 2 per Admin Freeze.

Risk: treating Module 15 as a new product BC (or as Feature Matrix DOMAIN 15 Moderation) would reopen Freezes and invent ownership.

North Star: infrastructure enables a trustworthy digital home — it does not become the product.

## Decision

1. **Platform = infrastructure layer only** — configuration, env validation, rate limiting, storage abstraction, mail transport, scheduler/job *host*, health, logging standards, monitoring *hooks*, platform cache helpers.  
2. **Platform NEVER owns business entities** — Users, Games, Reviews, Feed, Notifications, Search, Moderation, Analytics aggregates, Admin audit semantics.  
3. **Auth remains identity SoT.** Platform supplies mail transport + rate-limit primitives; does not re-implement sessions/MFA/OAuth.  
4. **Admin remains operator orchestration.** FeatureFlag CRUD / jobs console stay Admin Phase 2 unless separately unlocked.  
5. **Analytics remains KPI SoT** for `DailyMetric` / `AnalyticsEvent`. Platform only hosts shared `ScheduleModule`.  
6. **MVP allowlist (implementation unlocked after this Freeze):**  
   - Redis sliding-window rate limiting (critical HTTP classes)  
   - SMTP driver for Auth mail façade (Mailpit local)  
   - Storage/upload policy hardening (shared helpers)  
   - Scheduler hygiene + jobs foundation ADR choice below  
   - Env/secrets/deploy baseline checklist  
   - Health + logging standards (already largely present — harden/document)  
7. **Jobs foundation (V1):** **Nest `ScheduleModule` + BC-owned cron handlers** is the V1 host. **Full BullMQ worker fleets are deferred.** A *minimal* job runner may be introduced only by Freeze amendment if a single maintenance use-case cannot use cron.  
8. **Event bus:** continue **best-effort in-process** `DomainEventPublisher` for V1. Transactional outbox = post-MVP (`POST_MVP_PRODUCTION_BACKLOG.md`).  
9. **Observability platforms deferred:** no Grafana/Prometheus/Elastic/OpenTelemetry *product* requirement in Module 15 V1. Monitoring *hooks* = structured logs + health probes.  
10. **OpenAPI / Prisma:** no invent in Freeze; reuse existing health routes and env schema. FeatureFlag tables unused until Admin Phase unlock.  
11. **Cache:** `platform:*` targeted keys only; no `FLUSHALL` / `KEYS`. Never wipe domain namespaces.  
12. **Naming:** Module 15 title is **Platform Infrastructure**, not Feature Matrix Domain 15.

## Why not Platform owns FeatureFlags / Jobs Admin UI

- Admin Freeze already deferred those to Phase 2.  
- Dual operator consoles create AuthZ forks.

## Why not BullMQ fleets in V1

- Scope Report risk: blocks Backend MVP.  
- Analytics/Notification known debt is outbox/cron monitoring — backlog, not Module 15 sprawl.  
- Cron host already exists and is sufficient for MVP maintenance jobs.

## Why SMTP under Platform transport + Auth façade

- Auth already owns send *intent* and templates.  
- Platform owns how bytes leave the process (SMTP driver), matching Notification Freeze “email send later via platform”.

## Consequences

- Sprint 15.2+ may implement rate limit / SMTP / storage hardening without touching domain Freezes.  
- Distributed locks, Kafka, multi-node cron coordination remain deferred.  
- Production alerting / Grafana remain post-MVP.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Module 15 = Moderation (Feature DOMAIN 15) | Wrong BC; Moderation Freeze complete |
| Platform owns Users/Auth | Breaks Auth SoT |
| Require Prometheus before MVP | Blocks declare; Scope Report deferral |
| Ship full BullMQ + all workers | Scope explosion |
| Invent Platform business tables | Violates “infra only” |
| Replace Analytics crons with Platform jobs UI | Breaks Analytics ownership |

## Status

**Accepted** with Platform Infrastructure Freeze v1.0.
