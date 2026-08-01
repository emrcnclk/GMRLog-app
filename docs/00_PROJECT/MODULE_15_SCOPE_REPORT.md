# Module 15 — Platform Infrastructure Scope Report

**Document:** `docs/00_PROJECT/MODULE_15_SCOPE_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Type:** Architecture discovery only — **no code, no migrations, no Prisma edits, no OpenAPI edits, no implementation**  
**Product roadmap ref:** `docs/01_PRODUCT/ROADMAP.md`  
**Matrix ref:** `docs/01_PRODUCT/FEATURE_MATRIX.md`  
**Prior Freezes:** Notification · Search · Moderation · Admin · Analytics  
**Prior gate:** Analytics Module V1 fully closed (`ANALYTICS_FINAL_CLEANUP.md`)

**SSOT precedence applied:**

1. `docs/00_PROJECT/NORTH_STAR.md`  
2. `docs/01_PRODUCT/ROADMAP.md` + Feature Matrix  
3. Existing Platform Freezes (Modules 10–14)  
4. Backend infra docs (`RATE_LIMITING`, `BACKGROUND_JOBS`, `OBSERVABILITY`, `DEPLOYMENT`, …)  
5. OpenAPI / Prisma — **read only**  
6. Runtime: `apps/api` infrastructure + Auth/Admin/Analytics consumers  

**Naming clarity:** Feature Matrix **DOMAIN 15 = Moderation**. Sprint **Module 15 = Platform Infrastructure** (cross-cutting) — **not** Moderation BC.

---

## Executive Summary

Module 15 is the **shared platform / infrastructure hardening** gate after domain platforms (Notification → Search → Moderation → Admin → Analytics) and **before Backend MVP declaration**. It is **not** a product bounded context and must **never** own business entities.

Sprint 0.1 already bootstrapped config, Prisma, Redis, MinIO storage, health, Pino logging, Docker Compose, and CI. Domain modules consume that baseline. **Remaining gaps are documented as SSOT but mostly unwired at runtime:** Redis sliding-window rate limiting, durable background job transport (BullMQ), real SMTP (Auth `MailService` is an in-memory stub), OpenTelemetry/Prometheus/Grafana, FeatureFlag runtime (Prisma + Admin OpenAPI Phase 2), and IaC beyond Docker Compose.

**Module 15 MVP** should deliver a **narrow infrastructure allowlist**:

1. **Architecture Freeze (15.0)** — ownership, MVP allowlist, non-goals, boundaries with Auth/Admin/Analytics  
2. **Rate limiting V1** — Redis sliding window on critical HTTP classes  
3. **Email SMTP driver** — wire Auth `MailService` transport (Mailpit local)  
4. **Storage / upload hardening** — shared mime/size/key policy for existing multipart paths  
5. **Scheduler / jobs hygiene** — document cron ownership; ADR for cron-only vs minimal BullMQ  
6. **Env / secrets / deploy baseline** — production checklist; CI + Compose as MVP story  

**Explicitly out of Module 15 MVP:** AI, recommendations, business features, game/search/moderation/analytics/admin product features, FeatureFlag Admin UI, full worker fleets, observability platforms, Kafka, UI, Mobile.

**Recommended path:** Treat Platform as **infrastructure primitives only**. Auth remains identity SoT. Admin remains operator orchestration. Domains remain entity SoT. Prefer **reuse** existing Redis/S3/ScheduleModule/env Zod — no invent tables without Freeze + Database change-control.

**Implementation must not start** until Sprint **15.0 Architecture + Freeze** is accepted.

---

## Goals

| Goal | Why (North Star) |
|------|------------------|
| Abuse-resistant APIs | Rate limits protect belonging surfaces (auth, uploads, hot writes) |
| Reliable outbound email | Verification / reset / security mail must leave the stub |
| Safe media path | Central upload policy without inventing a Media BC |
| Operable MVP | Health + logging + deploy story sufficient to declare Backend MVP |
| Preserve domain Freezes | Platform never re-owns Users/Games/Reviews/Search/Moderation/Analytics aggregates |

---

## Non-goals (Module 15 MVP)

- AI / recommendations / game logic / Search / Moderation / Analytics / Admin **product** features  
- FeatureFlag Admin CRUD + four-eyes (Admin Freeze Phase 2)  
- Full BullMQ worker topology (notif/search/media/AI/exports)  
- OpenTelemetry → Prometheus/Grafana/Sentry production stack  
- Kafka / RabbitMQ / multi-region / HA redesign  
- UI / Mobile clients  
- Owning business Prisma models as Platform SoT  

---

## Ownership matrix

**Hard rule:** Platform owns **infrastructure only** — never business entities.

| Concern | Source of Truth | Platform role |
|---------|-----------------|---------------|
| User identity / sessions / MFA / OAuth | **Auth** | Provides env secrets, mail transport, rate-limit hooks — does **not** re-own User |
| `PlatformRole` AuthZ | **Users** (+ Auth/Admin guards) | No parallel permission engine |
| Admin shell / audit / ops façades | **Admin** | May expose ops health probes; no entity SoT |
| Feature flag **values** (when unlocked) | **Admin + flag store** | Optional runtime eval helper — not product CRUD |
| Object bytes (S3/MinIO) | **Storage infra** | Put/delete/health; domains decide *when* to upload |
| Domain event payloads | Owning BCs | Platform may later own **transport** (queue/outbox) — not payloads |
| `AnalyticsEvent` / `DailyMetric` | **Analytics** | Hosts `ScheduleModule` crons only |
| Reports / sanctions / catalog / reviews / feed / search | Owning BCs | **Never** |
| Postgres business tables | Database Freeze / domains | Platform: connection, migration tooling, backup docs |

```text
Platform (infra) ──► Config · Redis · S3 · Health · Logger · (RateLimit) · (Mail SMTP) · (Jobs transport)
Auth             ──► Identity / sessions / MFA
Admin            ──► Operator façades (+ Phase 2 flags/jobs UI)
Domains          ──► Business aggregates
```

---

## Current implementation status

| Concern | Classification | Evidence |
|---------|----------------|----------|
| **Authentication** | **Already implemented** | `AuthModule` — JWT, OAuth, MFA, lifecycle |
| **Authorization** | **Already implemented** | `JwtAuthGuard`, `RolesGuard`, `AdminAuthGuard`, `PlatformRoleGuard` |
| **Configuration** | **Already implemented** | `AppConfigModule` + `packages/config/src/env.ts` (Zod) |
| **Storage** | **Partially implemented** | `StorageService` S3/MinIO + memory driver; avatar/banner only |
| **Email** | **Partially implemented** | Auth `MailService` in-memory stub; SMTP env present; Mailpit in Compose |
| **Media** | **Partially implemented** / **Deferred** | Multipart uploads; no transcode/CDN pipeline |
| **Background jobs** | **Missing** (durable) / **Partial** (cron) | No BullMQ; Analytics `@Cron` only; in-process `DomainEventPublisher` |
| **File uploads** | **Partially implemented** | Avatar/banner via Users → Storage; no general presign API |
| **Health checks** | **Already implemented** | `/health`, `/health/live`, `/health/ready` (+ Admin module health) |
| **Monitoring** | **Missing** | Docs only (`MONITORING.md` / `OBSERVABILITY.md`); no OTEL/Prometheus deps |
| **Logging** | **Already implemented** | nestjs-pino + `@gmrlog/logger` + request-id |
| **Rate limiting** | **Missing** | `RATE_LIMITING.md` normative; no Nest Redis guard |
| **Feature flags** | **Deferred** | Prisma `FeatureFlag*` + `ADMIN_API.yaml`; Admin Freeze Phase 2; no runtime |
| **Schedulers** | **Partially implemented** | `ScheduleModule.forRoot()` + Analytics crons |
| **Secrets** | **Partially implemented** | Env Zod + CI secrets; no Vault/KMS |
| **Environment management** | **Already implemented** (dev/CI) / **Partial** (prod) | `APP_ENV`, `.env.example`, CI; limited prod IaC |
| **Deployment support** | **Partially implemented** | CI workflow; Docker Compose; `DEPLOYMENT.md` aspirational; no k8s/terraform on disk |
| **Platform integrations** | **Partially implemented** | OAuth providers + IGDB; SMTP/push vendors unwired |
| **API versioning** | **Already implemented** | Global prefix `api/v1` |
| **Operational tooling** | **Partially implemented** | Swagger, health, Admin shell; no jobs console / metrics scrape |

### Runtime infrastructure map

| Area | Path |
|------|------|
| Config | `apps/api/src/infrastructure/config/` |
| Prisma | `apps/api/src/infrastructure/database/` |
| Redis | `apps/api/src/infrastructure/redis/` |
| Storage | `apps/api/src/infrastructure/storage/` |
| Health | `apps/api/src/infrastructure/health/` |
| Logger | `apps/api/src/infrastructure/logger/` |
| Mail (Auth-owned stub) | `apps/api/src/auth/services/mail.service.ts` |
| Schedulers | `ScheduleModule` in `app.module.ts`; Analytics crons |

---

## Missing platform capabilities (MVP-relevant)

1. **HTTP rate limiting** — Redis sliding window per `RATE_LIMITING.md` (auth, upload, hot writes)  
2. **Real SMTP transport** — replace Auth mail stub without changing call sites  
3. **Jobs foundation ADR** — cron-only V1 vs minimal BullMQ (must not silently diverge from `BACKGROUND_JOBS.md`)  
4. **Storage/upload hardening** — shared mime/size/key helpers for existing multipart paths  
5. **Env/secrets production checklist** — required matrix + rotation runbook (no vault invent required)  
6. **Deploy story freeze** — CI + Compose as MVP; document gaps vs full `DEPLOYMENT.md`  
7. **Health OpenAPI SSOT alignment** — optional change-control (minor)

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope creep into Admin Phase 2 (flags/jobs UI) | Reopens Admin Freeze | Freeze: Platform = primitives; Admin UI later |
| Full BullMQ + all workers in one module | Blocks MVP | Narrow ADR or defer topology |
| Platform “owns” FeatureFlag CRUD | Dual SoT | Admin + runtime eval only when unlocked |
| Rate limit deferred forever to “gateway” | Abuse on Nest routes | Ship Nest Redis limiter for critical classes |
| SMTP stub in production | Broken verification/reset | Wire SMTP before Backend MVP declare |
| In-process event bus | Lost side effects (known) | Document best-effort V1; outbox = post-MVP backlog |
| Name collision with Feature DOMAIN 15 | Wrong backlog | Title **Platform Infrastructure** |
| Inventing infra tables without Freeze | Database Freeze violation | Prefer Redis + existing schema |

---

## Recommended MVP scope

### In Module 15 MVP

| Surface | Notes |
|---------|-------|
| **15.0 Architecture Freeze** | Ownership, allowlist, non-goals, Auth/Admin/Analytics boundaries |
| **Rate limiting V1** | Redis sliding window; RFC 7807 429 + headers |
| **Email SMTP driver** | Auth `MailService` transport; Mailpit local |
| **Storage/upload hardening** | Central limits/mime/key policy |
| **Scheduler hygiene** | Cron ownership documented; no dual frameworks without ADR |
| **Env/secrets/deploy baseline** | Prod checklist; CI + Compose MVP story |
| **Health contract** | Keep probes; optional OpenAPI hygiene |

### Explicitly deferred / Phase 2

| Item | Bucket |
|------|--------|
| FeatureFlag runtime + Admin APIs | Admin Phase 2 |
| Full BullMQ fleets + Admin jobs console | BACKGROUND_JOBS Phase 2 |
| Transactional outbox | Database Freeze amendment + EVENT_ARCHITECTURE |
| OTEL / Prometheus / Grafana / Sentry | OBSERVABILITY Phase 2 |
| Vault / KMS | DEPLOYMENT Phase 2 |
| k8s / terraform / multi-region | Scale / ROADMAP later |
| Media transcoding / CDN pipeline | Media Phase 2 |
| Kafka / RabbitMQ / HA redesign | Post-MVP production backlog |
| AI / recommendations / business features | Out of Module 15 |

---

## Suggested sprint breakdown

| Sprint | Focus | Outcome |
|--------|-------|---------|
| **15.0 Architecture Freeze** | Ownership matrix, MVP allowlist, ADR stubs | **PLATFORM_FREEZE_v1** — unlocks code |
| **15.1 Rate Limiting Core** | Redis sliding window on allowlisted classes | Abuse baseline |
| **15.2 Mail + Env Hardening** | SMTP driver + secrets/env checklist | Real outbound email |
| **15.3 Storage & Upload Hardening** | Shared validation + key policy | Safer media path |
| **15.4 Jobs/Scheduler Foundation** | ADR: cron-only vs minimal BullMQ; implement Freeze choice only | No dual systems |
| **15.5 Ops Baseline + Final Audit** | Health/docs/CI alignment; Freeze compliance | Gate → Backend MVP |

**Do not start 15.1+ until 15.0 Freeze accepted.**

---

## Compatibility with SSOT

| Source | Result |
|--------|--------|
| North Star | Infra enables a safe digital home — **compatible** |
| Roadmap | Scale when necessary; Module 15 = foundation close, not Platform Expansion v2 — **compatible** |
| Feature Matrix | Compatible if Module 15 ≠ DOMAIN 15 Moderation — **compatible** (naming note required) |
| Freezes 10–14 | Platform must not re-own aggregates; Flags/Jobs stay Phase 2 unless unlocked — **compatible** |
| Rate limiting / Background jobs / Observability docs | Normative intent; MVP subsets via Freeze — **compatible with minor changes** |
| OpenAPI / Prisma | Reuse; no invent in discovery — **compatible** |
| Analytics post-MVP backlog | Outbox/distributed jobs remain post-MVP — **compatible** |

---

## Decision

Minor changes required for Freeze (15.0):

1. **Name collision** — Title Module 15 as **Platform Infrastructure** (not Feature Matrix Domain 15).  
2. **MVP allowlist lock** — Rate limit + SMTP + storage/upload hardening + env/deploy baseline; exclude FeatureFlags Admin UI, full BullMQ, full OTEL unless separately unlocked.  
3. **Ownership** — Auth keeps identity; Admin keeps operator façades; Platform owns transport/primitives only.  
4. **Jobs ADR** — Explicit cron-only V1 vs minimal BullMQ — no silent divergence from `BACKGROUND_JOBS.md`.  
5. **Event bus** — Document continued best-effort in-process publisher vs outbox (post-MVP).  
6. **OpenAPI** — No invent; health/flags/jobs only under change-control.

### Unlock

| Next | After this report? |
|------|---------------------|
| **Sprint 15.0 Architecture Freeze** | **Yes** (after explicit authorization) |
| 15.1–15.5 implementation | **No** until 15.0 Freeze accepted |
| Admin FeatureFlags / Jobs console | **No** under Module 15 MVP without Phase unlock |
| Backend MVP declaration | **No** until Module 15 audit gate |

---

## Gate

**APPROVED WITH MINOR CHANGES**

Stop. Do **not** start Sprint 15.0 Freeze from this report alone without explicit Freeze authorization.
