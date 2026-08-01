# D3.25 Smoke Results — Game Metadata & Catalog Foundation

**Generated:** 2026-07-31
**Runner:** `scripts/release/smoke-d3-25-catalog-gate.mjs`
**API:** `http://127.0.0.1:4000/api/v1`
**Postgres:** Docker `gmrlog-postgres` on host port **5433**
**Environment:** zero-credential (no `IGDB_CLIENT_ID`/`STEAM_STORE_METADATA_ENABLED`/`RAWG_ENABLED` set) — the deliberate valid-deployment case per `docs/18_CATALOG/METADATA_PROVIDERS.md` §1

## Result

```
[gate] 22/22 checks passed
D3.25 CATALOG PRODUCTION GATE: PASS
```

## Matrix

| Check | Result | Verifies |
|---|---|---|
| `openapi-games-media-path` | PASS | `/games/{id}/media` present in `/docs-json` |
| `openapi-games-similar-path` | PASS | `/games/{id}/similar` present |
| `openapi-games-metadata-path` | PASS | `/games/{id}/metadata` present |
| `game-detail-200` | PASS | `GET /games/:id` succeeds |
| `game-detail-no-provider-block` | PASS | Response &lt;2s — no request-path provider call |
| `game-detail-has-metadata-block` | PASS | `metadata` field always present |
| `game-detail-metadata-shape` | PASS | `{ status, provider }` shape |
| `game-detail-catalog-fields-present` | PASS | All 14 D3.25 fields present even pre-enrichment |
| `game-media-200` / `game-media-is-array` | PASS | `GET /games/:id/media` |
| `game-similar-200` / `game-similar-is-array` | PASS | `GET /games/:id/similar` |
| `game-metadata-status-200` / `-shape` | PASS | `GET /games/:id/metadata` |
| `game-detail-404-for-missing` | PASS | Unknown id → 404 |
| `game-cover-resolves-real-url` | PASS | Real `coverKey` → real URL (audit C3 regression check) |
| `discover-card-cover-not-hardcoded-null` | SKIPPED | Test game not on first discover page — non-blocking, informational |
| `csv-import-preview-200` | PASS | CSV wizard preview |
| `csv-import-run-accepted` | PASS | CSV import triggers a sync job |
| `skeleton-game-created` | PASS | Import creates a title-only `Game` row |
| `enrichment-run-recorded` | PASS | Worker recorded a `game_metadata_runs` row for the new game |
| `enrichment-skipped-with-zero-credentials` | PASS | Outcome `skipped`, provider `null` — correct zero-credential behavior |
| `skeleton-game-stays-pending-not-corrupted` | PASS | `metadata_status` stayed `pending`, no partial/corrupt write |

## Regression checks

| Suite | Result |
|---|---|
| `smoke-d3-24-release-gate.mjs` | **PASS — 49/49** |
| `smoke-infra.mjs` | PASS |
| `smoke-health.mjs` | PASS |
| `smoke-queue.mjs` | PASS |
| `pnpm --filter @gmrlog/backend test` | PASS — 143 files / 1201 tests |
| `pnpm --filter @gmrlog/database test` | PASS — 6 files / 97 tests |
| Coverage (backend) | 95.00% statements / 95.16% lines — threshold met |

## Fixes applied during this validation

1. **`GameMetadataPublisher` DI resolution** — `@Optional() jobs: JobsService | null`
   erased to `Object` in TS decorator metadata, causing Nest to silently
   inject `null`. Fixed with explicit `@Inject(JobsService)`. See
   `docs/18_CATALOG/D3_25_COMPLETION_REPORT.md` §6 for the full incident
   record and `apps/backend/src/games/metadata/metadata.module.spec.ts` for
   the regression test.
2. **Docker Desktop** — the engine's Windows-side named pipe was down at the
   start of this validation session (WSL backend still running); restarted
   from `%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe`, containers
   auto-resumed with existing port mappings and data intact. Unrelated to
   D3.25 code.
3. **Workspace tooling junctions** — `node_modules/@gmrlog/*` junctions in
   several packages pointed at a stale pre-move path
   (`D:\MASAÜST\GMRLog\...`), breaking `tsc`/`vitest` config resolution
   workspace-wide. Repointed to the current path. Unrelated to D3.25 code;
   pre-existing from an earlier directory rename.

## Commands

```bash
pnpm --filter @gmrlog/backend build
node apps/backend/dist/main.js &
node apps/backend/dist/worker.main.js &
node scripts/release/smoke-d3-25-catalog-gate.mjs
node scripts/release/smoke-d3-24-release-gate.mjs   # regression check
```
