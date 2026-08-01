# D3.20 Smoke Results

**Generated:** 2026-07-29 (local, post jobId / search DI / schema fixes)  
**Runner:** `scripts/release/smoke-*.mjs`  
**API:** `http://127.0.0.1:4000/api/v1`  
**Postgres:** Docker `gmrlog-postgres` on host port **5433** (Windows native PG occupies 5432)

> **Later sprint results are tracked separately, not appended here:**
> `D3_24_RELEASE_GATE` (see `docs/07_SOCIAL/D3_24_IMPLEMENTATION_STATUS.md`) ·
> [`D3_25_SMOKE_RESULTS.md`](D3_25_SMOKE_RESULTS.md) — Game Metadata & Catalog
> Foundation, 22/22 PASS, includes a D3.24 regression re-run.

## Matrix

| Suite | Script | Result | Notes |
|-------|--------|--------|-------|
| Infra | `smoke-infra.mjs` | PASS | PG · Redis 7.4.9 · MinIO · Meili · Mailpit · API · worker |
| Health | `smoke-health.mjs` | PASS | ready: database/redis/storage/meili = up |
| Upload | `smoke-upload.mjs` | PASS | grant → PUT → confirm → HeadObject → `media.image.process` (Bull jobId sanitized) |
| Password | `smoke-password.mjs` | PASS | forgot → Mailpit → reset → revoke → login |
| Search | `smoke-search.mjs` | PASS | post → index → Meili hit (`SearchService` `@Inject` + `communities.visibility`) |
| Queue | `smoke-queue.mjs` | PASS | complete/fail/retry × maintenance · media · search-index |
| Security | `smoke-security.mjs` | PASS | headers · auth 429 · enumeration 204 |
| Perf | `smoke-perf.mjs` | PASS | `PERF_RESULTS.json` (`SMOKE_PERF_ITERATIONS=5`, auth gap 15s) |
| Backup | `smoke-backup.mjs` | PASS | pg_dump + restore side DB (47 public tables) |

## Overall

```
ALL_SMOKE_PASS
```

## Fixes applied during this validation

1. **BullMQ jobId** — `:` forbidden; `toBullJobId()` in uploads / fanout / search-index / scheduler.
2. **Search DI** — `@Optional()` + `| null` broke Nest metadata; added `@Inject(MeiliClientService)` / `@Inject(SearchIndexService)`.
3. **Schema** — applied missing `communities.visibility` on Docker Postgres 5433.
4. **Perf runner** — auth 5/min pacing (`SMOKE_PERF_AUTH_GAP_MS`) + MinIO MIME-safe confirm put.

## Host prerequisites (Windows)

1. Prefer Docker Postgres on **5433** — native Windows PostgreSQL on 5432 breaks Prisma under `lc_messages=tr-TR`.
2. Prefer Docker Redis 7 — BullMQ rejects Redis &lt; 5.
3. Apply pending SQL if volume was baselined without columns (`secret_hash`, upload indexes, `communities.visibility`).
4. Auth rate limit is **5/min** — space auth-heavy smokes ≥65s apart or set `SMOKE_AUTH_COOLDOWN_MS`.

## Commands

```powershell
$env:DATABASE_URL='postgresql://gmrlog:gmrlog@localhost:5433/gmrlog?schema=public'
pnpm --filter @gmrlog/backend start
pnpm --filter @gmrlog/backend worker
$env:SMOKE_PERF_ITERATIONS='5'
$env:SMOKE_AUTH_COOLDOWN_MS='65000'
pnpm release:smoke
# or:
powershell -ExecutionPolicy Bypass -File scripts/release/smoke.ps1
```
