# D3.23 — Production Gate Smoke Results

**Status:** GATE_PASS  
**Date:** 2026-07-30  
**Script:** `scripts/release/smoke-d3-23-production-gate.mjs`  
**API:** `http://127.0.0.1:4000/api/v1`  
**Backend env:** `STEAM_MOCK_LIBRARY_SIZE=1000`

## Result matrix

| # | Check | Result | Notes |
|---|-------|--------|-------|
| 1 | Idempotency (5× Steam sync) | **PASS** | sync1 `imported=3`; sync2–5 `updated=3`; library stable at 3 |
| 2 | Disconnect → Connect → Sync | **PASS** | library stable=3; single connected Steam integration |
| 3 | Large library (1000 games) | **PASS** | `imported=1000` · `serverDurationMs≈33511` · `wallMs≈33845` · `queueWaiting=0` · `clientΔheap≈0.4MB` · `externalGamesRows=1005` |
| 4 | Concurrent sync | **PASS** | HTTP `201` + `409` (`Sync already running for this integration`) |
| 5 | Worker restart (mid-sync kill) | **PASS** | isolated backend on Redis db 5; SIGKILL while `processing`; restart → BullMQ attempt 2 completes; Steam `externalRef` persisted |
| 6 | Meilisearch after import | **PASS** | `GET /search?q=hades&types=game` returns Hades (`summary.title`) |

```
GATE_PASS — D3.23 production ready checklist
```

## How to re-run

```bash
# API process must expose the large mock library for test 3:
STEAM_MOCK_LIBRARY_SIZE=1000 pnpm --filter @gmrlog/backend run dev

# Gate (repo root):
STEAM_MOCK_LIBRARY_SIZE=1000 node scripts/release/smoke-d3-23-production-gate.mjs
```

Optional:

| Env | Purpose |
|-----|---------|
| `SMOKE_BASE_URL` | API base (default `http://127.0.0.1:4000/api/v1`) |
| `STEAM_MOCK_LIBRARY_SIZE` | `1000` / `5000` / `10000` (capped at 10000) — must match backend |
| `STEAM_MOCK_LIBRARY_STEAM_ID_PREFIX` | default `7656119800000999` — only these SteamIDs get the large library |
| `GATE_ONLY` | e.g. `5` or `1,6` to run a subset while iterating |
| `GATE_RESTART_LIBRARY_SIZE` | default `600` — size used by the isolated restart backend |
| `GATE_RESTART_API_PORT` | default `4123` |

## Root-cause notes (pre-fix)

| Symptom | Cause | Fix |
|---------|-------|-----|
| Disconnect → 400 | Gate sent `Content-Type: application/json` with empty body; Fastify rejects it | Only set JSON content-type when a body is present |
| `Unrecognized Steam identity` | Stress SteamIDs were 16 digits (`765611980000099` + digit) | Prefix is now `7656119800000999` (16) + digit → valid 17-digit SteamID64 |
| Meilisearch false FAIL | Hits live under `data[].summary.title`, script only checked `title` / `items` | Script reads `summary.title` |
| Large library SKIP | Soft-pass when env unset | Env now required; mock serves large set only for stress SteamID prefix so baseline tests stay at 3 games |
| Worker restart inline | Isolated child had no reliable BullMQ path / soft proxy | Real kill+restart on isolated API + Redis db 5; `IntegrationJobsPublisher` requires `JobsService` |

## Production Ready criteria

All six checks must print `PASS` with **zero** `FAIL` or `SKIP`. This run met that bar on 2026-07-30.
