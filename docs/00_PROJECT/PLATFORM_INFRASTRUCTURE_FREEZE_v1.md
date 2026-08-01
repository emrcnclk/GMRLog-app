# Platform Infrastructure Freeze v1.0

**Document:** `docs/00_PROJECT/PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`  
**Date:** 2026-07-20  
**Status:** **FROZEN**  
**Preceded by:** Module 15 Scope Report (`APPROVED WITH MINOR CHANGES`) + Sprint 15.1 architecture  
**Unlocks:** Sprint 15.2 Rate Limiting Core (and subsequent 15.x implementation sprints)

**Naming:** Module 15 = **Platform Infrastructure**. Feature Matrix DOMAIN 15 (Moderation) is **out of scope** for this Freeze.

---

## What is frozen

The Platform Infrastructure documentation set below is the **normative SSOT** for Sprint 15.2+.

| Artifact | Role |
|----------|------|
| [`docs/01_ARCHITECTURE/PLATFORM_ARCHITECTURE.md`](../01_ARCHITECTURE/PLATFORM_ARCHITECTURE.md) | Layer boundaries |
| [`docs/01_ARCHITECTURE/ADR/ADR_Platform_Infrastructure.md`](../01_ARCHITECTURE/ADR/ADR_Platform_Infrastructure.md) | ADR-PLT-001 Accepted |
| [`docs/03_EVENTS/PLATFORM_EVENT_MATRIX.md`](../03_EVENTS/PLATFORM_EVENT_MATRIX.md) | Operational signals allowlist |
| [`docs/04_CACHE/PLATFORM_CACHE_STRATEGY.md`](../04_CACHE/PLATFORM_CACHE_STRATEGY.md) | Redis `platform:*` keys |
| [`docs/05_SECURITY/PLATFORM_PERMISSION_MATRIX.md`](../05_SECURITY/PLATFORM_PERMISSION_MATRIX.md) | AuthZ for platform surfaces |
| [`docs/05_SECURITY/PLATFORM_VISIBILITY_MATRIX.md`](../05_SECURITY/PLATFORM_VISIBILITY_MATRIX.md) | What may be exposed |

**Prior Freezes intact:** Notification, Search, Moderation, Admin, Analytics, Reviews, Games, Communication — **not reopened**.

**Database / OpenAPI:** This Freeze **does not authorize** new Prisma business tables or OpenAPI path invent. Health routes already exist. FeatureFlag / Admin jobs OpenAPI remain Phase 2 unless change-controlled later.

---

## Locked decisions (non-negotiable for 15.2+)

### 1. Ownership — infrastructure only

Platform owns **only**:

- Configuration & environment validation  
- Secrets *loading* from environment (not a secrets-manager product)  
- Rate limiting primitives  
- Storage abstraction & shared upload policy helpers  
- Mail **transport** abstraction (SMTP driver)  
- Scheduler / background-job **host** infrastructure  
- Health / readiness / liveness probes  
- Logging standards  
- Monitoring **hooks** (logs + health — not observability platforms)  
- Platform cache helpers (`platform:*`)  
- Shared operational configuration  

Platform **MUST NOT** own: Users, Games, Reviews, Feed, Notifications, Search, Moderation, Analytics aggregates, Admin business façades.

### 2. Domains / Auth / Admin remain SoT

| Owner | Remains SoT for |
|-------|-----------------|
| **Auth** | Identity, sessions, MFA, OAuth, mail *intent*/templates |
| **Users** | Profiles, privacy, `PlatformRole` |
| **Admin** | Operator shell, audit read, Phase 2 flags/jobs UI |
| **Analytics** | `AnalyticsEvent`, `DailyMetric`, analytics crons’ *work* |
| **All domain BCs** | Their aggregates |

### 3. MVP allowlist (implementation)

| Capability | Notes |
|------------|-------|
| Configuration / env validation | Extend existing Zod schema only as needed |
| Rate limiting | Redis sliding window; critical HTTP classes |
| SMTP mail service | Driver behind Auth `MailService` |
| Storage abstraction hardening | Mime/size/key helpers; existing MinIO/S3 |
| Health / readiness / liveness | Keep `/health`, `/live`, `/ready` |
| Background job **infrastructure** | Host only — V1 = Nest ScheduleModule |
| Scheduler infrastructure | Shared `ScheduleModule`; BC registers handlers |
| Logging standards | Pino + redact + request-id |
| Monitoring hooks | Structured logs / health only |
| Operational configuration | Cron enable flags, SMTP, Redis, S3 env |

### 4. Explicitly deferred (not Module 15 V1)

Kafka · RabbitMQ · S3 CDN migration · Multi-region · Kubernetes operators · Distributed scheduler · Distributed locks · Secrets manager integrations (Vault/KMS products) · Observability platforms · Grafana · Prometheus · Elastic · OpenTelemetry *product stack* · Serverless · Blue/Green · Auto scaling · Full BullMQ worker fleets · FeatureFlag Admin CRUD · Transactional outbox table invent

See also [`POST_MVP_PRODUCTION_BACKLOG.md`](./POST_MVP_PRODUCTION_BACKLOG.md).

### 5. Rate limiting policy (V1)

- Store: Redis. Algorithm: sliding window (align `docs/06_BACKEND/RATE_LIMITING.md` subset).  
- Response: HTTP **429** + Problem Details; standard rate-limit headers when implemented.  
- Classes (allowlist to refine in 15.2): auth endpoints, multipart uploads, high-cost writes.  
- Keys: subject id and/or IP — **no** PII beyond necessary identifiers.  
- Platform owns counter keys under `platform:ratelimit:*`.  
- Does **not** replace AuthZ.

### 6. Mail policy

- Auth (and future Notification senders) call a **mail port**.  
- Platform provides SMTP transport implementation.  
- Local: Mailpit. Prod: real SMTP from env.  
- Never log full message bodies or credentials.

### 7. Storage policy

- Domains decide *when* to upload.  
- Platform owns `StorageService` + shared validation helpers.  
- V1 paths remain existing avatar/banner (and any Freeze-approved multipart) — no Media BC invent.

### 8. Scheduler / jobs policy

- V1 host: Nest `@nestjs/schedule` (`ScheduleModule.forRoot` in AppModule).  
- Business handlers remain in owning BC (e.g. AnalyticsSchedulerService).  
- Full BullMQ topology deferred. Minimal runner only via Freeze amendment.  
- Multi-node duplicate cron risk: documented; distributed coordination deferred.

### 9. Health / logging / monitoring

- Health probes remain public for liveness/readiness as today.  
- Logging: Platform standards; domains emit messages.  
- Monitoring platforms deferred; hooks = logs + health only.

### 10. Cache policy

- Only `platform:*` keys in [`PLATFORM_CACHE_STRATEGY.md`](../04_CACHE/PLATFORM_CACHE_STRATEGY.md).  
- **Forbidden:** `FLUSHALL`, `FLUSHDB`, `KEYS platform:*` wipes, wiping domain namespaces.

### 11. Security policy

- Permission / Visibility matrices are normative.  
- Platform must not expose business PII via infra logs or health payloads.  
- SYSTEM role for cron/jobs; no public rate-limit admin API in V1.

### 12. Events

- No domain lifecycle events from Platform.  
- Operational signals only per Event Matrix.

---

## Phase summary

| Bucket | Includes |
|--------|----------|
| **MVP** | Freeze + rate limit + SMTP + storage harden + scheduler hygiene + env/deploy checklist + health/logging standards |
| **Phase 2** | FeatureFlags runtime/Admin UI, BullMQ fleets, OTEL/Prometheus/Grafana, Vault |
| **Post-MVP backlog** | Outbox, distributed dedupe/locks, multi-node cron, HA |

---

## Compatibility checklist

| Source | Result |
|--------|--------|
| North Star | Infra enables safe belonging — **compatible** |
| Module 15 Scope Report | Allowlist matches — **compatible** |
| Freezes 10–14 | Ownership preserved — **compatible** |
| OpenAPI / Prisma | No invent — **compatible** |

---

## Unlock

| Sprint | May start after this Freeze? |
|--------|------------------------------|
| **15.2 Rate Limiting Core** | **Yes** |
| 15.3 Mail + Env Hardening | After 15.2 (or parallel if Freeze permits sequenced plan) |
| 15.4 Storage / Jobs foundation | After prior gates |
| 15.5 Final Audit | After implementation sprints |
| Admin FeatureFlags / Jobs console | **No** without Admin Phase unlock |
| Backend MVP declaration | **No** until Module 15 audit |

---

## Status

**FROZEN — Platform Infrastructure Freeze v1.0**
