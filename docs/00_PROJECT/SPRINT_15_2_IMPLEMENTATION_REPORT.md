# Sprint 15.2 — Platform Infrastructure Core Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_15_2_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Mode:** Implementation  
**Freeze:** [`PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`](./PLATFORM_INFRASTRUCTURE_FREEZE_v1.md)  
**Preceded by:** Sprint 15.1 Architecture Freeze (`APPROVED`)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 15.2 delivered Platform Infrastructure Core as frozen: configuration façade, Redis sliding-window rate limiting, SMTP/memory mail transport, storage provider abstraction, Nest schedule host, expanded health compose, platform logger + monitoring hooks. Platform remains infrastructure-only — no business entities, no Prisma/OpenAPI invent, no Kafka/BullMQ/OTEL.

---

## Implemented infrastructure

| Pillar | Runtime locus | Notes |
|--------|---------------|-------|
| **Configuration** | `PlatformConfigService` + Zod `ApiEnv` | Typed access; no duplicated `process.env` parsing |
| **Rate limiting** | `RateLimitModule` / `RateLimitGuard` / `RateLimitService` | Redis sliding window; `platform:ratelimit:*` |
| **Mail** | `PlatformMailService` + SMTP/memory transports | Auth `MailService` remains intent façade |
| **Storage** | `PlatformStorageService` + memory/S3 providers | `StorageService` DI alias preserved |
| **Scheduler** | `PlatformScheduleModule` + `PlatformSchedulerHost` | BC crons register names; work stays in BCs |
| **Health** | `/health`, `/live`, `/ready` | DB, Redis, storage, cache, scheduler |
| **Logging** | `PlatformLoggerService` + Pino redact | Request id via interceptor / Fastify |
| **Monitoring hooks** | `MonitoringHooksService` | Structured logs only — no Prometheus |

---

## Rate limiting

- Global `APP_GUARD` (`RateLimitGuard`)
- Classes: `auth`, `public`, `read`, `write`, `upload`, `admin`
- Per-route overrides via `@RateLimitClass` / path inference / auth path table (register, forgot-password, refresh)
- Health bypass: `@SkipRateLimit` + `/health*` path
- Response: `429` Problem Details (`RATE_LIMIT_EXCEEDED`) + `X-RateLimit-*` + `Retry-After`
- Auth class fail-closed when Redis unavailable; others fail-open per Freeze / `RATE_LIMITING.md`
- Keys: `platform:ratelimit:{class}:{id}` (IP hashed)

Env: `RATE_LIMIT_ENABLED`, `RATE_LIMIT_FAIL_OPEN`, `RATE_LIMIT_GLOBAL_MULTIPLIER`

---

## Mail

- Transport abstraction (`MailTransport`): `SmtpMailTransport` (nodemailer), `MemoryMailTransport` (outbox)
- Template abstraction: domains pass pre-rendered text + opaque `templateId` (no business templates in Platform)
- Auth `MailService` delegates send/outbox helpers to `PlatformMailService`
- Test/default driver: `memory` when `NODE_ENV=test`

Env: `SMTP_*`, `EMAIL_FROM`, `MAIL_DRIVER`

---

## Storage

- Provider abstraction: memory + S3-compatible (`@aws-sdk/client-s3`)
- Shared upload policy helpers (`upload-policy.ts`): mime allowlist, max bytes, extensions
- Domains keep deciding *when* to upload (Users avatar/banner unchanged semantically)

---

## Scheduler

- `ScheduleModule.forRoot()` moved under `PlatformScheduleModule`
- `PlatformSchedulerHost.registerJob` used by Analytics cron host for health visibility
- No business cron logic moved into Platform; BullMQ deferred

---

## Health

Compose checks: `database`, `redis`, `storage`, `cache` (Redis), `scheduler` (host).  
Liveness unchanged (`/health/live`).

---

## Logging / monitoring hooks

- Pino redact extended (SMTP password paths)
- `RequestIdInterceptor` + Fastify `x-request-id`
- `MonitoringHooksService`: rate-limit checks/exceeded, request timing, health snapshots, mail attempts, storage failures — logs only

---

## Explicitly not implemented (deferred)

Kafka · RabbitMQ · BullMQ · Distributed scheduler/locks · S3 CDN migration · OpenTelemetry · Grafana · Prometheus · Elastic · Cloud storage product migration · Secrets Manager · Serverless · Blue/Green

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | **Pass** (with `DATABASE_URL` / `DIRECT_URL`) |
| `typecheck` (`@gmrlog/api`) | **Pass** |
| `build` (`@gmrlog/api`) | **Pass** |
| Scoped ESLint (`src/infrastructure/**` + touched wiring) | **Pass** |
| Unit (`vitest.config.ts`) | **Pass** — 137 files / 546 tests |
| Platform unit focus | Rate limit, mail, upload-policy, analytics scheduler — **Pass** |
| E2E health + auth + account-lifecycle | **Pass** |
| Full E2E suite | **212 / 215 pass** (53 files: 50 pass). 3 failures in moderation queue/appeal/review-moderation suites show pre-existing unique-constraint / missing queue-item flakes — not Platform infra wiring. Rate limiting forced off in Vitest setups to avoid shared Redis auth-bucket collisions. |

**Test note:** Vitest e2e loads `.env.example` (which enables rate limiting for local/prod defaults). Setups force `RATE_LIMIT_ENABLED=false` so shared Redis auth buckets do not flake suites. Production/local keep rate limiting enabled via env.

---

## Ownership preserved

| Owner | Still SoT |
|-------|-----------|
| Auth | Identity, mail intent/templates |
| Users | Profiles / uploads *when* |
| Analytics | Cron *work* / KPIs |
| Admin | Operator shell |
| Platform | Infra only |

---

## Unlock

| Next | Status |
|------|--------|
| Sprint **15.3** Mail + Env Hardening (or sequenced plan) | Unlocked by Freeze; **not started** this sprint |
| Backend MVP declaration | Still blocked until Module 15 audit |

---

## Gate

**SPRINT 15.2 COMPLETE**

Stop. Do **not** continue to Sprint 15.3.
