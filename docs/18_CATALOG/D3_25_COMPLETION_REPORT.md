# D3.25 — Game Metadata & Catalog Foundation — Completion Report

**Document:** `docs/18_CATALOG/D3_25_COMPLETION_REPORT.md`
**Status:** **COMPLETE · Production Gate PASS**
**Date:** 2026-07-31
**Supersedes:** `docs/18_CATALOG/D3_25_IMPLEMENTATION_PLAN.md` (plan → result)
**Authority:** `docs/00_PROJECT/SPRINT_0_PROJECT_AUDIT.md` §3 (C1, C3), §10 Sprint 2

---

## 1. Sprint sequencing note

`docs/07_SOCIAL/D3_24_IMPLEMENTATION_STATUS.md` originally named D3.25 as
"Messaging / Chat / Voice / Presence." The Sprint 0 audit (2026-07-31)
re-prioritised the programme: the audit found the catalog's core differentiator
— similarity, recommendation, discovery, and every game-bearing card — was
computing against empty columns, and moved game metadata ahead of messaging.
D3.25 delivered here is **Game Metadata & Catalog Foundation**. Messaging is
deferred, not cancelled, and carries no dependency on this sprint.
`D3_24_IMPLEMENTATION_STATUS.md` §"Next Sprint" is amended in place to point at
this report.

## 2. Goal — met

> Every `Game` becomes a complete object instead of `title` + `slug`.

A catalog game can now carry: external provider IDs (IGDB/Steam/RAWG),
summary, description, cover, hero image, screenshots, trailer, genres, tags,
developers, publishers, platforms, release date, franchise, series, and
provider-declared similar games — all populated **asynchronously**, sourced
from a provider chain, never from the request path.

## 3. Production Gate

| Area | Status |
|---|---|
| Prisma migration (additive, applied to live Postgres) | PASS |
| Provider abstraction (IGDB / Steam Store / RAWG) | PASS |
| Metadata queues + workers | PASS |
| Backfill + refresh scheduler | PASS |
| Media ingestion (no hotlinking) | PASS |
| Catalog reads wired to real data | PASS |
| Similarity / recommendation engines use real signals | PASS |
| OpenAPI (additive-only) | PASS |
| Backend test suite | PASS — 143 files / 1201 tests |
| Coverage threshold | PASS — 95.0% statements / 95.16% lines (≥95% gate) |
| Database package suite (real-schema repository tests) | PASS — 6 files / 97 tests |
| D3.25 smoke gate | **PASS — 22/22** |
| D3.24 regression check | PASS — 49/49 (no regressions) |
| Core smoke (`infra`, `health`, `queue`) | PASS |

Full run: `node scripts/release/smoke-d3-25-catalog-gate.mjs`.

## 4. What was built

### 4.1 Documentation (`docs/18_CATALOG/`)
`README.md`, `D3_25_IMPLEMENTATION_PLAN.md`, `GAME_METADATA_ARCHITECTURE.md`,
`METADATA_PROVIDERS.md`, `METADATA_LICENSING.md`, `METADATA_QUEUES.md`,
`MEDIA_INGESTION.md`, `CATALOG_OPERATIONS.md`, this report.

### 4.2 Schema — additive migration
`packages/database/prisma/migrations/20260731090000_d3_25_game_metadata_catalog/`

- `Game` gains 17 columns (external IDs, descriptive fields, enrichment
  lifecycle) — see `GAME_METADATA_ARCHITECTURE.md` §3.1.
- New tables: `game_series`, `tags`, `game_tags`, `companies`,
  `game_companies`, `game_related_games`, `game_metadata_runs`.
- `game_media` gains `provider`, `source_url`, `sort_order`, `width`,
  `height` + a `(game_id, kind, source_url)` unique index.
- `game_media_kind` gains `hero`, `artwork`, `logo`, `trailer`.
- Verified: applies cleanly to the live dev database (with existing rows) and
  to an empty schema built from scratch (`packages/database` migration test
  suite).

### 4.3 Provider abstraction
`apps/backend/src/games/metadata/providers/`

- `metadata-provider.port.ts` — the interface + normalized DTO.
- `igdb.provider.ts` — Twitch client-credentials, APIv4 query, image URL
  rewriting, in-process rate limiter. **Primary.**
- `steam-store.provider.ts` — `appdetails` fallback, appid-only lookup,
  off by default (`STEAM_STORE_METADATA_ENABLED`).
- `rawg.provider.ts` — **implemented, disabled by default.** Licensing does
  not currently require it; see `METADATA_LICENSING.md` §4 for the decision
  record and the three conditions that would flip it.
- `metadata-provider.registry.ts` — ordered chain, no-downgrade fill-forward
  merge (`metadata-merge.ts`), confidence scoring (`metadata-match.ts`).
- `rate-limiter.ts` — in-process token bucket.

### 4.4 Queues, workers, scheduling
- `QUEUE_GAME_METADATA` / `QUEUE_GAME_MEDIA`, four job types.
- `GameMetadataPublisher` — **no synchronous fallback** (deliberate
  divergence from `SearchIndexPublisher`; see `METADATA_QUEUES.md` §3).
- `GameCatalogWorkerService` — consumes both queues, worker-process only.
- `GameMetadataBackfillService` — hourly backfill scan, daily refresh scan,
  registered as BullMQ repeatables in `SchedulerService`.
- `library-sync.service.ts` hooked: every newly created skeleton game is
  enqueued for enrichment; Steam sync passes the observed appid through.

### 4.5 Media ingestion
`GameMediaIngestionService` — content-type allowlist, byte ceiling, per-kind
caps, content-addressed storage key
(`games/{gameId}/{kind}/{sha256(sourceUrl)[0..16]}.{ext}`), idempotent on
`(gameId, kind, sourceUrl)`. Cover/hero promotion is no-downgrade.

### 4.6 Catalog + discovery wiring
- `discover/mappers/game-card.mapper.ts` — the hardcoded `null` cover
  (audit C3) is **deleted**; resolves real `coverKey`/`heroKey`.
- `games/mappers/game.mapper.ts` — full catalog projection (summary,
  description, hero, trailer, genres, tags, developers, publishers,
  franchise, series, screenshots, metadata status).
- New reads: `GET /games/:id/media`, `GET /games/:id/similar`,
  `GET /games/:id/metadata` — all unauthenticated, all read-only, none
  trigger enrichment.
- `similarity.engine.ts` — real `themeTagIds`, `mechanicsTagIds`,
  `publisherIds`, `developerIds`, `seriesId` signals, falling back to the
  pre-D3.25 genre/franchise proxies for un-enriched games so scores stay
  comparable mid-backfill.
- `recommendation.service.ts` — tag signal reads real `game_tags`.

### 4.7 Environment / configuration
26 new environment keys under "Game catalog metadata (D3.25)" in
`env.schema.ts`, all defaulted, none required for boot — see §6 below.

## 5. Verification

```
$ pnpm --filter @gmrlog/backend test        → 143 files, 1201 tests, 0 failures
$ pnpm --filter @gmrlog/database test       → 6 files, 97 tests, 0 failures
$ node scripts/release/smoke-d3-25-catalog-gate.mjs
  22/22 checks passed — D3.25 CATALOG PRODUCTION GATE: PASS
$ node scripts/release/smoke-d3-24-release-gate.mjs
  TOTAL 49  FAIL 0 — no regression from D3.25 changes
$ node scripts/release/smoke-infra.mjs / smoke-health.mjs / smoke-queue.mjs
  all PASS
$ python docs/08_API/bundle_openapi.py
  operationIds: OK (458) · module validation: OK (15 files)
  bundle: 368 paths, 411 schemas · bundle validation: PASSED
```

Coverage (backend, `vitest --coverage`):

```
Statements   : 95.00% ( 5796/6101 )
Lines        : 95.16% ( 5650/5937 )
Functions    : 97.45% ( 1224/1256 )
Branches     : 85.27% ( 3485/4087 )
```

## 6. Incident found and fixed during smoke testing

Live smoke testing against real Postgres + Redis (not caught by any unit
test, since unit tests always construct `GameMetadataPublisher` with an
explicit `jobs` argument) surfaced a real DI wiring bug:

**Symptom:** every catalog enrichment enqueue silently no-op'd in the running
worker, logging `game.metadata.enqueue.unavailable`, even though
`JobsModule` was correctly imported and `JobsService` was always available.

**Root cause:** `GameMetadataPublisher`'s constructor declared
`@Optional() private readonly jobs: JobsService | null`. TypeScript erases a
`T | null` union to `Object` in the `design:paramtypes` metadata Nest reads
for constructor injection, so Nest could not resolve the token and — because
the parameter was marked `@Optional()` — silently injected `null` instead of
throwing.

**Fix:** `@Optional() @Inject(JobsService) private readonly jobs: JobsService | null`
— the explicit token pins resolution regardless of the union type.

**Regression coverage:** `apps/backend/src/games/metadata/metadata.module.spec.ts`
boots the real module graph via `@nestjs/testing` (no HTTP, no live DB/Redis
connection needed — both are lazy) and asserts `GameMetadataPublisher`
actually receives a `JobsService` instance. This is the only test in the
D3.25 suite that exercises Nest's own reflection-based resolution rather than
manual construction, and it is what caught this class of bug.

This finding is a caution for the rest of the codebase: `SearchIndexPublisher`,
`EventReminderPublisher`, and `FeedFanoutPublisher` use the identical
`@Optional() private readonly jobs: JobsService | null` pattern. They were not
touched in D3.25 (out of scope — pre-existing code), but they carry the same
latent risk and should be reviewed under the same fix in a follow-up.

## 7. Environment configuration reference

See `docs/00_PROJECT/ENVIRONMENT_VARIABLES.md` "Game catalog metadata (D3.25)"
for the full table. Summary: every key defaults to a safe, zero-credential
value. IGDB and Steam Store are gate-enabled by credential presence; RAWG
requires two independent flags and stays off (`METADATA_LICENSING.md` §4).

## 8. Explicit non-goals (honored)

- No UI / screen work.
- `Post.gameId` remains optional (audit Sprint 3).
- Feed ranking's zeroed game signals remain zeroed (audit Sprint 3).
- `Community.gameId` not added (audit Sprint 3).
- Kaggle ingestion — confirmed zero references, not a source.
- `ExternalGame` untouched — separate, per-integration concern.

## 9. Carry-forwards

- IGDB attribution string is served by `GET /games/:id/metadata` but not yet
  rendered anywhere — UI work is out of scope for D3.25 (tracked for the
  Premium UI / Game Hub redesign sprint).
- `SearchIndexPublisher` / `EventReminderPublisher` / `FeedFanoutPublisher`
  share the DI pattern that caused §6's incident — recommend a follow-up
  audit applying the same `@Inject` fix.
- `GAME_API.yaml`'s speculative DLC/edition/bundle/HowLongToBeat sections
  remain unimplemented, pre-existing drift — out of scope, flagged in-line
  in the spec for the general doc-truth pass (audit Sprint 1).

## 10. Next sprint

Per the audit roadmap: **Sprint 3 — Reclaiming the Vision** (game-native
posts, wiring the feed's game signals, surfacing feed filters, tying
communities to games, building the user profile and review detail screens).
Do not start until this report and its Production Gate are reviewed and
accepted.
