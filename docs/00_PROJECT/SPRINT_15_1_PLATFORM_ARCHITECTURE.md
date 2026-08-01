# Sprint 15.1 — Platform Infrastructure Architecture Freeze

**Document:** `docs/00_PROJECT/SPRINT_15_1_PLATFORM_ARCHITECTURE.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Mode:** Architecture Freeze — **documentation only** (no code / Prisma / OpenAPI)  
**Scope report:** [`MODULE_15_SCOPE_REPORT.md`](./MODULE_15_SCOPE_REPORT.md)  
**Freeze:** [`PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`](./PLATFORM_INFRASTRUCTURE_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 15.1 freezes **Platform Infrastructure V1** as an infrastructure layer only. Ownership, MVP allowlist, deferred list, rate-limit/mail/storage/scheduler/health/logging policies, cache, security, and operational event stance are locked. Prior domain Freezes (10–14) are not reopened.

| Deliverable | Path |
|-------------|------|
| Architecture | `docs/01_ARCHITECTURE/PLATFORM_ARCHITECTURE.md` |
| ADR | `docs/01_ARCHITECTURE/ADR/ADR_Platform_Infrastructure.md` (ADR-PLT-001) |
| Freeze | `docs/00_PROJECT/PLATFORM_INFRASTRUCTURE_FREEZE_v1.md` |
| Events | `docs/03_EVENTS/PLATFORM_EVENT_MATRIX.md` |
| Cache | `docs/04_CACHE/PLATFORM_CACHE_STRATEGY.md` |
| Permissions | `docs/05_SECURITY/PLATFORM_PERMISSION_MATRIX.md` |
| Visibility | `docs/05_SECURITY/PLATFORM_VISIBILITY_MATRIX.md` |

**Code / Prisma / OpenAPI:** unchanged this sprint.

---

## Decisions locked

1. Platform = infra only; never business entities.  
2. Auth / Admin / Analytics / domain Freezes remain SoT for their aggregates.  
3. MVP: config, rate limiting, SMTP transport, storage hardening, ScheduleModule host, health, logging, monitoring hooks, ops config.  
4. Deferred: Kafka, RabbitMQ, CDN, multi-region, k8s operators, distributed scheduler/locks, secrets-manager products, Grafana/Prometheus/Elastic/OTEL platforms, serverless, blue/green, autoscaling, BullMQ fleets, FeatureFlag Admin UI, outbox invent.  
5. Jobs V1 = Nest ScheduleModule + BC handlers.  
6. Cache = `platform:*` targeted only.  
7. Naming: Module 15 ≠ Feature Matrix Domain 15.

---

## Ownership matrix (summary)

| Concern | Owner |
|---------|-------|
| Config / env schema | Platform |
| Rate limiting | Platform |
| Mail transport (SMTP) | Platform |
| Mail intent / templates | Auth (product mail later per Notification Freeze) |
| Storage abstraction | Platform |
| Upload *when* | Domain (Users today) |
| Scheduler host | Platform |
| Cron *work* | Owning BC |
| Health / logging standards | Platform |
| Identity / AuthZ policy | Auth / Users |
| Admin shell | Admin |
| Analytics KPIs | Analytics |

---

## Sprint numbering note

Scope Report labeled Architecture Freeze as **15.0**. This sprint delivers that Freeze as **Sprint 15.1** per program plan. Subsequent implementation starts at **15.2**.

---

## Unlock

| Next | Status |
|------|--------|
| Sprint **15.2** Rate Limiting Core | **Unlocked** by this Freeze |
| Backend MVP declaration | **Blocked** until Module 15 implementation + audit |

---

## Gate

**APPROVED**

**SPRINT 15.1 COMPLETE**

Stop. Do **not** start Sprint 15.2.
