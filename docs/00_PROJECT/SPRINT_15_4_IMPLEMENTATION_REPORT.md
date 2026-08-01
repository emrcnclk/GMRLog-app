# Sprint 15.4 — Platform Infrastructure Hardening Report

**Document:** `docs/00_PROJECT/SPRINT_15_4_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-20  
**Role:** Principal Software Architect / CTO  
**Mode:** Implementation (hardening only)  
**Freeze:** [`PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`](./PLATFORM_INFRASTRUCTURE_FREEZE_v1.md)  
**Preceded by:** [`SPRINT_15_2_IMPLEMENTATION_REPORT.md`](./SPRINT_15_2_IMPLEMENTATION_REPORT.md), [`SPRINT_15_3_IMPLEMENTATION_REPORT.md`](./SPRINT_15_3_IMPLEMENTATION_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 15.4 audited and hardened Platform Infrastructure Core without new features or business ownership. Fixes targeted production correctness: rate-limit fail-open/path/Retry-After/IP hop, ALS request correlation, SMTP lifecycle cleanup, storage key safety, health probe dedupe + job state meta, env parse cache + cross-field validation. No Kafka/BullMQ/OTEL/Prometheus.

---

## Hardening summary

| Area | Hardening applied |
|------|-------------------|
| Rate limiting | Guard respects `RATE_LIMIT_FAIL_OPEN`; auth overrides use normalized path; sliding-window `Retry-After`; XFF rightmost hop |
| Mail | SMTP `OnModuleDestroy` close; non-retryable auth/recipient errors skip retry; port 465 → `secure` |
| Storage | `assertSafeObjectKey`; signed URL TTL cap; S3 health `finally` clearTimeout; `STORAGE_PUBLIC_BASE_URL` in Zod |
| Scheduler | Job meta now `name:state`; lifecycle already clears error on restart |
| Health | Single Redis probe for `redis`+`cache`; soft vs critical unchanged |
| Logging | ALS preserved across RxJS subscribe; masked structured error logs |
| Monitoring | Error timing uses real HTTP status when `HttpException` |
| Configuration | Cached `loadApiEnv`; SMTP pair + prod memory storage ban |
| Cache | Confirmed no `FLUSHALL`/`KEYS`; rate-limit TTL via `pexpire` |
| Performance | Env single-parse; removed duplicate Redis PING |
| Redis DI | Prefers injected `API_ENV.REDIS_URL`; optional `process.env` fallback for out-of-DI integration harnesses |

---

## Security review

- Rate-limit IP bucket uses **rightmost** `X-Forwarded-For` hop (trusted-proxy assumption).
- Object keys reject `..`, absolute paths, and non-`avatar|banner/{id}/{file}` shapes.
- Mail validation + non-retryable auth failures reduce abuse amplification.
- Sensitive mask + Pino redact unchanged; structured error serialization strips prod stacks.
- Health remains public for probes (Freeze/permission matrix); no secrets in payloads.

---

## Performance review

- Boot: ApiEnv Zod parse cached (`getCachedApiEnv`) across main / Nest validate / DI / logger.
- Health: one Redis PING for both `redis` and `cache` checks.
- Rate-limit: pipeline includes `zrange` for Retry-After (one extra Redis op when limited — acceptable).
- Residual: SHA-256 on every put; monitoring dual log+metric lines per request (Minor debt).

---

## Cache review

- Repo scan: no Redis `FLUSHALL` / `FLUSHDB` / `KEYS` in runtime Platform or domain cache services (only docs/tests/comments).
- Platform rate-limit keys: `platform:ratelimit:{class}:{id}` with `pexpire(windowMs)`.
- Targeted `DEL` only for known keys elsewhere (Admin/Moderation/Analytics patterns preserved).

---

## Lifecycle review

| Component | Startup | Shutdown |
|-----------|---------|----------|
| Config | Cached validate + fingerprint log | n/a |
| Redis | Injected `API_ENV.REDIS_URL` | `quit()` / disconnect |
| SMTP | Nodemailer transport | `transporter.close()` |
| Scheduler | Job register + name validation | Jobs → `stopped`; host unhealthy |
| Health | Meta includes job `name:state` | n/a |

Failed cron recovery remains in-process (next run can `markJobStarted` / `markJobCompleted`) — durable recovery deferred (BullMQ).

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` (`@gmrlog/database`) | **Pass** |
| `typecheck` (`@gmrlog/api` + `@gmrlog/config` rebuild) | **Pass** |
| `build` (`@gmrlog/api`) | **Pass** |
| Scoped ESLint (`src/infrastructure/**`) | **Pass** |
| Unit (`vitest.config.ts`) | **Pass** — 139 files / 556 tests |
| Platform-focused unit | Rate-limit / upload-policy (incl. `assertSafeObjectKey`) — covered in suite |
| E2E health | **Pass** — `test/health.e2e-spec.ts` (3 tests) |
| Full E2E suite | **49/53 files pass**; 4 failures in **domain** suites (moderation ×3, catalog mock ×1) — outside Platform 15.4 scope; not regressions of infrastructure hardening |

---

## Remaining Critical Debt

1. **Multi-node cron duplication** — Nest `ScheduleModule` runs on every replica; distributed scheduler/locks explicitly deferred by Freeze.
2. **Transactional outbox** — best-effort in-process `DomainEventPublisher` remains; not Platform 15.4 scope (post-MVP backlog).

---

## Remaining Major Debt

1. Full BullMQ worker fleets / durable failed-job recovery (Freeze deferred).
2. Observability product stack (Prometheus / Grafana / OTEL / Elastic) — hooks only.
3. Progressive abuse IP block / full RATE_LIMITING.md class table (reset-password hourly, etc.).
4. Real multi-SMTP provider failover (memory fallback only; prod forbidden).
5. Trusted-proxy allowlist config for XFF (currently rightmost-hop heuristic).
6. Secrets Manager / Vault integrations (env loading only).

---

## Remaining Minor Debt

1. Config getter object churn on each access.
2. Memory signed URLs are synthetic (test/local).
3. `withTimeout` does not cancel underlying SMTP/Prisma work (timer race only).
4. LoggingInterceptor still emits alongside nestjs-pino autoLogging (duplicate request lines).
5. `APP_ENV` vs `NODE_ENV` drift not cross-validated.
6. Pipeline `zadd` then `zrem` on limit is non-atomic (tiny overcount window).
7. `RedisService` process.env fallback outside DI (integration harnesses only).

---

## Explicitly not implemented

Kafka · RabbitMQ · BullMQ · Distributed scheduler · Distributed locks · Prometheus · Grafana · Elastic · OpenTelemetry · Cloud monitoring · Secrets Manager · Blue/Green · Serverless · Any new Platform feature

---

## Gate

**SPRINT 15.4 COMPLETE**

Stop. Do **not** continue to Sprint 15.5.
