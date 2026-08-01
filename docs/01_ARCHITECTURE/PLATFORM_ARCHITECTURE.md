# Platform Infrastructure Architecture

**Document:** `docs/01_ARCHITECTURE/PLATFORM_ARCHITECTURE.md`  
**Status:** **Frozen — Platform Infrastructure Freeze v1.0** (Sprint 15.1)  
**ADR:** [`ADR_Platform_Infrastructure.md`](./ADR/ADR_Platform_Infrastructure.md) (ADR-PLT-001)  
**Scope report:** [`MODULE_15_SCOPE_REPORT.md`](../00_PROJECT/MODULE_15_SCOPE_REPORT.md)

**Naming:** Sprint Module **15 = Platform Infrastructure**. Feature Matrix DOMAIN 15 (Moderation) is unrelated.

---

## Purpose

Define the **Platform Infrastructure** layer that hardens GMRLOG before Backend MVP declaration.

Platform is **not** a product bounded context. It provides shared infrastructure primitives consumed by Auth, Admin, Analytics, and all domain BCs.

North Star alignment: infrastructure exists so the digital home of gaming culture is **safe, operable, and reliable** — it does not invent belonging features.

---

## Hard rule

**Platform owns infrastructure only. Platform NEVER owns business entities.**

| Platform MAY own | Platform MUST NOT own |
|------------------|------------------------|
| Configuration / env validation | Users, profiles, `PlatformRole` policy |
| Secrets *loading* from environment | Games, catalog, providers |
| Rate limiting primitives | Reviews, GameLogs, Feed |
| Storage abstraction (S3/MinIO) | Notifications inbox / delivery policy |
| Mail *transport* abstraction | Search index / `SearchEvent` |
| Scheduler / job *host* infrastructure | Moderation reports / queue |
| Health / readiness / liveness | AnalyticsEvent / DailyMetric SoT |
| Logging standards | Admin audit business semantics |
| Monitoring *hooks* (MVP stubs) | Any domain aggregate |
| Platform cache helpers (`platform:*`) | Domain cache namespaces |

---

## Context map

```text
                    ┌─────────────────────────────┐
                    │   Platform Infrastructure   │
                    │  config · redis · storage   │
                    │  mail transport · rate limit│
                    │  schedule · health · logger │
                    └──────────────┬──────────────┘
           ┌───────────┬───────────┼───────────┬───────────┐
           ▼           ▼           ▼           ▼           ▼
        Auth        Admin      Analytics    Domains    Workers
     (identity)  (compose)   (KPIs/cron)  (entities)  (SYSTEM)
```

Prior Freezes (Notification, Search, Moderation, Admin, Analytics) remain intact. Platform **extends** Sprint 0.1 bootstrap; it does not reopen domain ownership.

---

## Pillars (Module 15 V1)

| Pillar | Responsibility | Runtime locus (today / target) |
|--------|----------------|--------------------------------|
| **Configuration** | Zod-validated env; Nest ConfigModule | `AppConfigModule`, `@gmrlog/config` |
| **Rate limiting** | Redis sliding-window policy + HTTP 429 | **Missing** → Sprint 15.2+ |
| **Mail transport** | SMTP driver behind Auth mail façade | Auth `MailService` stub → SMTP |
| **Storage** | Object put/delete/health; shared upload policy helpers | `StorageService` |
| **Scheduler / jobs host** | Nest `ScheduleModule`; optional minimal job runner ADR | Analytics crons today |
| **Health** | `/health`, `/live`, `/ready` | `HealthModule` |
| **Logging** | Pino + redact + request-id | `LoggerModule` |
| **Monitoring hooks** | Structured log fields / health probes only in V1 | No Prometheus/OTEL stack |
| **Operational config** | `ANALYTICS_CRON_ENABLED`, SMTP, S3, Redis env matrix | `.env` / CI |

---

## Ownership details

### Mail

| Aspect | Owner |
|--------|-------|
| When to send / templates / recipient selection | **Auth** (and later Notifications for product mail — Notification Freeze) |
| SMTP connection / retry / driver | **Platform** (transport abstraction) |
| Message content / PII in body | Owning BC — never logged by Platform |

### Storage

| Aspect | Owner |
|--------|-------|
| Whether to upload (avatar, banner, …) | **Domain** (Users today) |
| Bucket, key scheme helpers, mime/size policy | **Platform** |
| Object bytes | Object store (MinIO/S3) |

### Scheduler / background jobs

| Aspect | Owner |
|--------|-------|
| Job *business* work (aggregate DailyMetric, purge, …) | Owning BC (e.g. Analytics) |
| Cron registration host (`ScheduleModule`) | **Platform** |
| Durable queue topology (BullMQ fleets) | **Deferred** — see ADR |

### Logging / health / monitoring

| Aspect | Owner |
|--------|-------|
| Logger factory, redact rules, request-id | **Platform** |
| Health probe aggregation (DB/Redis/storage) | **Platform** |
| Domain log message semantics | Owning BC |
| Prometheus/Grafana/OTEL product stack | **Deferred** |

### Configuration / secrets

| Aspect | Owner |
|--------|-------|
| Schema of required env vars | **Platform** (`packages/config`) |
| Secret *values* in production | Ops / CI secret store (no Vault invent in V1) |
| Domain feature toggles (FeatureFlag CRUD) | **Admin Phase 2** — not Platform |

### Rate limiting

| Aspect | Owner |
|--------|-------|
| Policy classes + Redis counters | **Platform** |
| Which routes join which class | Platform Freeze allowlist + owning BC annotation |
| AuthZ / identity | Auth — rate limit uses subject/IP keys only |

---

## Boundaries with prior Freezes

| Freeze | Platform must not |
|--------|-------------------|
| Notification | Own inbox / preference / delivery SoT; may provide mail/queue transport later |
| Search | Own `SearchEvent` / Meilisearch workers |
| Moderation | Own reports / queue / resolve policy |
| Admin | Own AuditLog semantics, FeatureFlag Admin UI, jobs console (Phase 2) |
| Analytics | Own `AnalyticsEvent` / `DailyMetric`; only hosts shared scheduler |

---

## Event stance

Platform **does not** publish domain lifecycle events (`user.*`, `review.*`, …).

Platform **may** emit **operational** signals (log lines, future `platform.job.*` internal hooks) listed in [`PLATFORM_EVENT_MATRIX.md`](../03_EVENTS/PLATFORM_EVENT_MATRIX.md). Those are **not** domain SoT.

---

## Cache stance

Platform cache helpers use `platform:*` keys only. Never flush domain namespaces. See [`PLATFORM_CACHE_STRATEGY.md`](../04_CACHE/PLATFORM_CACHE_STRATEGY.md).

---

## Security stance

Public: health liveness only as documented.  
Staff: Admin health compose remains Admin-owned.  
SYSTEM: cron/jobs.  
See Permission / Visibility matrices.

---

## Explicitly deferred (architecture)

Kafka, RabbitMQ, S3 CDN migration, multi-region, Kubernetes operators, distributed scheduler/locks, secrets-manager products, Grafana/Prometheus/Elastic/OpenTelemetry *platforms*, serverless, blue/green, autoscaling.

---

## Related

- Freeze: [`PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`](../00_PROJECT/PLATFORM_INFRASTRUCTURE_FREEZE_v1.md)  
- Post-MVP engineering: [`POST_MVP_PRODUCTION_BACKLOG.md`](../00_PROJECT/POST_MVP_PRODUCTION_BACKLOG.md)
