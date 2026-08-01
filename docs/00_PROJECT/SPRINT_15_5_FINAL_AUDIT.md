# Sprint 15.5 — Platform Infrastructure Final Audit

**Document:** `docs/00_PROJECT/SPRINT_15_5_FINAL_AUDIT.md`  
**Date:** 2026-07-21  
**Role:** Principal Software Architect / CTO  
**Mode:** Final Architecture Audit — **read only** (no code / Prisma / OpenAPI / migrations / tests)  
**Freeze:** [`PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`](./PLATFORM_INFRASTRUCTURE_FREEZE_v1.md)  
**Architecture:** [`PLATFORM_ARCHITECTURE.md`](../01_ARCHITECTURE/PLATFORM_ARCHITECTURE.md) · [`ADR_Platform_Infrastructure.md`](../01_ARCHITECTURE/ADR/ADR_Platform_Infrastructure.md) (ADR-PLT-001)

**SSOT precedence applied:** North Star → Freeze → OpenAPI → Architecture → Implementation

> Findings below are **tracked awareness only** — not fixed in this sprint.  
> **Do not begin Module 16 from this sprint.**  
> **Do not implement remediation in this sprint.**

---

## Executive Summary

Module 15 delivers a coherent **Platform Infrastructure V1**: Freeze + architecture (15.1), core runtime (15.2), operational hardening (15.3), and production hardening (15.4). Implementation matches Freeze non-negotiables: Platform owns **only** configuration, rate limiting, mail *transport*, storage abstraction, scheduler *host*, health, logging standards, and monitoring *hooks*; domains remain SoT; no Prisma business invent; no Kafka/BullMQ/OTEL product stack; Redis invalidation is targeted (`platform:ratelimit:*`); operational signals only (Event Matrix).

Residual gaps are **Freeze-deferred ops risks** (multi-node cron duplication, transactional outbox), **deploy/trust heuristics** (XFF), and **OpenAPI hygiene** for public health routes — none require redesign of the Platform layer or reopen domain Freezes.

| Dimension | Score |
|-----------|------:|
| Architecture | **9 / 10** |
| Security | **8 / 10** |
| Production readiness | **8 / 10** |

**Decision: APPROVED WITH MINOR CHANGES**

---

## Audit method

| Layer | Sources |
|-------|---------|
| North Star / SSOT | `NORTH_STAR.md`, Freeze precedence |
| Freeze / ADR / Architecture | `PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`, ADR-PLT-001, `PLATFORM_ARCHITECTURE.md` |
| Matrices | Event / Cache / Permission / Visibility |
| Env | `PLATFORM_ENV_CONFIGURATION.md`, `packages/config/src/env.ts` |
| Sprint reports | `SPRINT_15_2` … `SPRINT_15_4` Implementation Reports |
| Implementation | `apps/api/src/infrastructure/**` (+ Auth mail façade compose) |
| OpenAPI | Listed parity only — **not modified** |
| Validation | Re-executed 2026-07-21 (this sprint) |

No source, Prisma, OpenAPI, migration, or test modifications in Sprint 15.5.

---

## Sprint delivery rollup

| Sprint | Outcome |
|--------|---------|
| 15.1 | SSOT Freeze — infra-only ownership, deferred stack lock |
| 15.2 | Core — rate limit, SMTP/memory mail, storage, schedule host, health, logging/monitoring hooks |
| 15.3 | Operational — mail retry/failover, signed URLs, scheduler lifecycle, health meta, ALS, config diagnostics |
| 15.4 | Hardening — fail-open/path/Retry-After/XFF, SMTP close, key safety, env cache, probe dedupe |
| 15.5 | Final audit (this document) |

---

## Architecture

| Check | Result | Evidence |
|-------|--------|----------|
| Infrastructure ownership only | **Pass** | `infrastructure/{config,rate-limit,mail,storage,schedule,health,logger,monitoring,redis}` |
| No business ownership | **Pass** | No Users/Games/Reviews/Feed/Notification/Search/Moderation/Analytics aggregates in Platform |
| No duplicated domain logic | **Pass** | Auth owns mail intent/templates; Analytics owns cron *work*; Platform hosts transport/schedule |
| Compose-only integrations | **Pass** | Auth `MailService` → `PlatformMailService`; Analytics → `PlatformSchedulerHost`; AppModule wires Platform then BCs |
| Shared service boundaries | **Pass** | Global modules export ports; `DomainEventPublisher` remains under `common/events` (not Platform) |
| Naming (≠ Feature Matrix DOMAIN 15) | **Pass** | Module title = Platform Infrastructure |

**Architecture score: 9 / 10**  
(−1: general-purpose `RedisService` is connection SoT for domains without namespace enforcement at the Redis layer — Platform rate-limit keys themselves are correct; discipline is by convention.)

---

## Security

| Check | Result | Evidence |
|-------|--------|----------|
| Environment validation | **Pass** | Zod `apiEnvSchema` + cached `getCachedApiEnv`; prod bans memory mail fallback / memory storage; SMTP pair rule |
| Secrets handling | **Pass** | Env loading only; Pino redact + `maskSensitive`; no Vault invent (Freeze deferred) |
| Mail safety | **Pass** | Transport-only; no body/`to` in Platform logs; non-retryable auth errors skip retry |
| Storage safety | **Pass** | `assertSafeObjectKey`, mime/size helpers, signed URL TTL cap |
| Rate limiting | **Pass** | Redis sliding window; auth fail-closed; 429 + headers; health skip; no staff bypass |
| Permission Matrix | **Pass** | Public health probes; no public mail/storage/rate-limit admin API; SYSTEM for jobs |
| Visibility Matrix | **Pass** | Health booleans + meta without secrets; rate-limit headers allowed |

**Security score: 8 / 10**  
(−1 XFF rightmost-hop without trusted-proxy allowlist; −1 S3 health probe is MinIO-path-specific — AWS-native deployments may false-`degraded`.)

---

## Infrastructure pillars

| Pillar | Result | Notes |
|--------|--------|-------|
| Health | **Pass** | `/health`, `/health/live`, `/health/ready`; `ok\|degraded\|error`; DB/Redis critical → `error` |
| Scheduler | **Pass** | Nest `ScheduleModule` + `PlatformSchedulerHost`; BC registers work; shutdown → `stopped` |
| Logging | **Pass** | Pino + redact + request-id ALS (15.4 RxJS fix) |
| Monitoring hooks | **Pass** | `MonitoringHooksService` / `LogMetricsSink` — no Prometheus |
| Storage | **Pass** | S3 + memory (test); capabilities + signed URLs |
| Mail | **Pass** | SMTP + memory; retry/timeout/failover (prod memory fallback forbidden) |
| Configuration | **Pass** | Fingerprint log; `PLATFORM_ENV_CONFIGURATION.md` |
| Cache helpers | **Pass** | `platform:ratelimit:*` live; optional probe/config keys unused (catalog optional) |
| Lifecycle | **Pass with debt** | Redis quit, SMTP close; **S3 client `destroy` absent** (Minor) |

---

## Cache

| Rule | Result |
|------|--------|
| Targeted invalidation only | **Pass** |
| TTL consistency (`pexpire` on rate-limit keys) | **Pass** |
| Namespace `platform:ratelimit:{class}:{id}` | **Pass** |
| No `FLUSHALL` / `FLUSHDB` in runtime | **Pass** |
| No `KEYS` wipe | **Pass** |
| No domain namespace wipe from Platform | **Pass** |

**Known non-blocker:** optional `platform:health:probe:*` / `platform:config:hash` Redis keys from Cache Strategy remain unused (fingerprint is log-only).

---

## Events

| Rule | Result |
|------|--------|
| Operational signals only | **Pass** — structured logs / metric hooks |
| No business ownership via events | **Pass** |
| No invented domain events from Platform | **Pass** — zero `DomainEventPublisher` under `infrastructure/` |
| Event Matrix allowlist | **Pass** — rate-limit / mail / storage / health / cron / config boot |

---

## Performance & lifecycle

| Area | Assessment |
|------|------------|
| Startup | **Good** — single Zod parse (`getCachedApiEnv`); config fingerprint |
| Shutdown | **Good** — Redis quit, SMTP close, scheduler mark stopped; S3 destroy gap |
| Resource cleanup | **Acceptable** — withTimeout does not cancel underlying I/O (Minor) |
| Memory | **Acceptable V1** — sliding-window ZSET bounded by TTL/limit |
| Dependency lifecycle | **Good** — lazy Redis connect; health probe timeouts |
| Hot path | Rate-limit Redis pipeline per request — acceptable; watch under high QPS |

---

## OpenAPI parity

**Do not edit OpenAPI (this sprint). List only.**

| Surface | Runtime | OpenAPI | Disposition |
|---------|---------|---------|-------------|
| `GET /health` | **Implemented** | Not found under `docs/08_API/**` | Hygiene backlog (Freeze: routes pre-existed; no invent) |
| `GET /health/live` | **Implemented** | Not documented | Hygiene backlog |
| `GET /health/ready` | **Implemented** | Not documented | Hygiene backlog |
| `GET /admin/health` | Admin compose (Module 13) | Shell gap (Admin audit) | Out of Platform invent |
| Rate-limit **429** + `X-RateLimit-*` / `Retry-After` | **Implemented** (guard headers) | Documented on Auth (and shared responses/headers) | **Parity** for Auth surfaces |
| Public mail / storage / rate-limit admin HTTP | **Absent** (correct) | **Absent** | **Correct** |
| FeatureFlag / Jobs Admin APIs | **Absent** | Phase 2 Admin | **Correctly deferred** |
| Kafka / Prometheus / BullMQ surfaces | **Absent** | **Absent** | **Correctly deferred** |

---

## Production readiness

| Dimension | Assessment |
|-----------|------------|
| Architecture | Strong — ADR-PLT-001 infra layer locked |
| Security | Strong env/redact/rate-limit; proxy trust + storage health portability remain ops debt |
| Maintainability | Clear module split; config façade; documented env matrix |
| Scalability | Stateless HTTP; Redis counters; multi-node cron duplication is known Freeze deferral |
| Performance | Env cache + probe dedupe; RL/health load acceptable for MVP |
| Testing | Unit **556/556**; Platform health e2e **3/3**; full e2e has pre-existing domain flakes |
| Deployment readiness | Zod fail-fast + health probes + SMTP/S3 env matrix; Secrets Manager / distributed scheduler deferred |

**Production readiness: 8 / 10 — Ready with known Freeze-deferred ops debt**

---

## Technical debt

### Critical

| # | Debt | Notes |
|---|------|-------|
| 1 | Multi-node cron duplication | Nest `ScheduleModule` runs on every replica; distributed scheduler/locks **explicitly deferred by Freeze** — ops must pin single replica or accept duplicate work |
| 2 | Transactional outbox | Best-effort in-process `DomainEventPublisher` remains; **post-MVP backlog** — not Platform entity ownership |

> These are **Freeze-authorized production risks**, not Module 15 scope escapes. Documented only — not remediated in 15.5.

### Major

| # | Debt | Notes |
|---|------|-------|
| 1 | BullMQ worker fleets / durable failed-job recovery | Freeze deferred |
| 2 | Observability product stack (Prometheus / Grafana / OTEL / Elastic) | Hooks only |
| 3 | Progressive abuse IP block / full `RATE_LIMITING.md` class table | Partial class coverage shipped |
| 4 | Real multi-SMTP provider failover | Memory fallback only; forbidden in production |
| 5 | Trusted-proxy allowlist for `X-Forwarded-For` | Rightmost-hop heuristic |
| 6 | Secrets Manager / Vault product integrations | Env loading only |
| 7 | S3 health probe MinIO-specific path | May false-`degraded` on pure AWS S3 |

### Minor

| # | Debt | Notes |
|---|------|-------|
| 1 | Config getter object churn | Per-access allocations |
| 2 | Memory signed URLs synthetic | Test/local driver |
| 3 | `withTimeout` does not cancel underlying work | Timer race only |
| 4 | Duplicate request logging (interceptor + pino autoLogging) | Noise |
| 5 | `APP_ENV` vs `NODE_ENV` drift not cross-validated | |
| 6 | Rate-limit `zadd` then `zrem` non-atomic on limit | Tiny overcount window |
| 7 | `RedisService` `process.env` fallback outside DI | Integration harnesses |
| 8 | S3 client missing `destroy` on shutdown | |
| 9 | Optional `platform:health:probe` / `config:hash` unused | Catalog optional |
| 10 | Public health OpenAPI register missing | Hygiene; Freeze forbade invent in Module 15 |

---

## Known non-blockers

- Kafka · RabbitMQ · BullMQ · distributed locks · OTEL/Prometheus/Grafana · Vault · Blue/Green · Serverless — correctly **out of V1**.
- FeatureFlag Admin CRUD / Jobs console — Admin Phase 2.
- Vitest forces `RATE_LIMIT_ENABLED=false` — intentional for suite stability.
- Full e2e suite historical domain flakes (moderation / catalog mock) — outside Platform BC.
- Admin `/admin/health` OpenAPI shell gap — Admin Module residual, not Platform invent.
- `CacheHealthIndicator` provider retained while controller reuses Redis probe result — harmless.

---

## Validation summary

| Check | Result |
|-------|--------|
| `prisma validate` (`@gmrlog/database`) | ✅ **Pass** (2026-07-21) |
| `typecheck` (`@gmrlog/api`) | ✅ **Pass** |
| `build` (`@gmrlog/api`) | ✅ **Pass** |
| Scoped ESLint (`src/infrastructure/**`) | ✅ **Pass** |
| Unit (`vitest.config.ts`) | ✅ **Pass** — 139 files / **556** tests |
| Integration (included in unit config) | ✅ **Pass** (suite includes `*.integration.spec.ts`) |
| E2E health | ✅ **Pass** — `test/health.e2e-spec.ts` **3 / 3** |
| Full E2E suite | ⚠️ **Not re-blocking** — prior 15.4: 49/53 files; 4 **domain** failures (moderation ×3, catalog mock ×1) unrelated to Platform infra |

---

## Scoring

| Dimension | Score | Notes |
|-----------|------:|-------|
| Architecture | **9 / 10** | Infra-only BC boundaries solid; Redis namespace by convention |
| Security | **8 / 10** | Env/redact/RL strong; proxy trust + S3 health portability |
| Production readiness | **8 / 10** | MVP allowlist shipped; Freeze-deferred ops remain |

---

## Final decision

Platform Infrastructure V1 is **structurally complete** against Freeze MVP: rate limiting, SMTP transport, storage hardening, scheduler host, health/logging/monitoring hooks, and env validation are in place without business ownership or forbidden product invent. Critical items are Freeze/post-MVP risks already accepted by ADR-PLT-001 — they do not reopen Modules 10–14 Freezes and do not justify REJECTED.

**APPROVED WITH MINOR CHANGES**

**PLATFORM MODULE V1 COMPLETE**

Stop. Do **not** continue to Module 16.  
Do **not** implement remediation from this audit.
