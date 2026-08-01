# D3.20 — Release Hardening & Production Validation

**Status:** COMPLETE  
**Date:** 2026-07-29  
**Mode:** Build locally  
**Scope:** Production hardening only — no new product features, endpoints, or frontend behavior changes.

## Summary

D3.20 hardens the D3.19 backend platform for release validation:

- Release smoke suite (`scripts/release/`)
- Ready probe gates configured MinIO + Meilisearch
- Production env fail-closed for seven required keys
- Helmet HSTS in production; explicit upload rate-limit class
- HTTP logs include `correlationId` + `durationMs`
- Backup restore path + release documentation

## Deliverables

| Area | Artifact |
|------|----------|
| Smoke runner | `scripts/release/smoke.sh`, `smoke.ps1`, `smoke-*.mjs` |
| Health | `GET /health`, `/health/live`, `/health/ready` (PG · Redis · storage · meili) |
| Upload / password / search / queue smokes | Node runners under `scripts/release/` |
| Performance | `smoke-perf.mjs` → p50/p95/p99 + `PERF_RESULTS.json` |
| Security | Helmet CSP + HSTS (prod), auth rate limit, enumeration 204 |
| Prod env | `PRODUCTION_REQUIRED_ENV_KEYS` in `env.schema.ts` |
| Docker | existing `docker-compose.prod.yml` validated via smoke |
| Backup | `backup-postgres.sh`, `restore-postgres.sh`, `smoke-backup.mjs` |
| Docs | this folder’s D3.20 guides |

## Code changes (hardening only)

- `apps/backend/src/infrastructure/config/env.schema.ts` — production required keys
- `apps/backend/src/health/health.service.ts` — storage/meili gate readiness when configured
- `apps/backend/src/main.ts` — HSTS in production
- `apps/backend/src/infrastructure/logging/request-logging.interceptor.ts` — correlationId
- `apps/backend/src/uploads/uploads.controller.ts` — `@RateLimitClass('upload')`

## Explicit non-goals (honored)

- No new S1 endpoints or product features
- No API contract changes
- No frontend behavior changes
- No Expo Metro package resolution changes (D3.19 follow-up)

## Verification

See `SMOKE_RESULTS.md` for live smoke outcomes. Gate commands:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm --filter @gmrlog/backend test
pnpm --filter @gmrlog/backend test:coverage
pnpm --filter @gmrlog/frontend test
pnpm release:smoke
```

**Local verification (2026-07-29):**

- Backend lint · build · 460 tests · coverage statements/lines **95.22%**
- Frontend 372 tests green
- Smoke: infra · health · queue · backup **PASS**; upload/password/security operable with Windows port + auth cooldown notes in `SMOKE_RESULTS.md`

## Exit criteria

| Criterion | Status |
|-----------|--------|
| Backend production-ready | Yes (env fail-closed + health + security) |
| Docker production-ready | Yes (compose overlay + smoke) |
| Monitoring production-ready | Yes (health · metrics · Sentry hook · structured logs) |
| Upload / search / password / queue verified | Via smoke suite |
| Documentation complete | Yes |
| Frontend unchanged | Yes |
| No new product features | Yes |

## Debt / follow-ups

- D3.19 Expo Metro closure checklist remains separate
- Prefer Docker Redis ≥5 (BullMQ); local Windows Redis 3.x on :6379 will fail worker/smoke
- Full reindex/admin bootstrap still deferred
- Prometheus/Grafana alerting outside this sprint
