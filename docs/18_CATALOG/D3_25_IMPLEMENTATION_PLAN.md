# D3.25 — Game Metadata & Catalog Foundation — Implementation Plan

**Document:** `docs/18_CATALOG/D3_25_IMPLEMENTATION_PLAN.md`
**Sprint:** D3.25
**Date opened:** 2026-07-31
**Status:** PLAN (superseded by `D3_25_COMPLETION_REPORT.md` on close)
**Authority:** `docs/00_PROJECT/SPRINT_0_PROJECT_AUDIT.md` §3 (C1, C3), §8, §10 Sprint 2

---

## 0. Sprint sequencing note — read this first

`docs/07_SOCIAL/D3_24_IMPLEMENTATION_STATUS.md` closes with:

> **Next Sprint** — D3.25 — Messaging / Chat / Voice / Presence (realtime)

That line predates the Sprint 0 audit. The audit (2026-07-31) re-prioritised the
programme and placed **Game Metadata Foundation** immediately after safety
hardening, on the grounds that four already-built systems — similarity,
recommendation, discovery surfaces, and every game-bearing card — are currently
computing against empty columns (audit §1 "Second/Fourth finding", §6 Discovery
row, R1 "Certain / Existential").

**Resolution:** D3.25 is **Game Metadata & Catalog Foundation**.
Messaging / realtime is deferred; it is not deleted from the programme, and it
carries no dependency on this sprint. The D3.24 status document is amended in
place to point at this decision.

---

## 1. Goal

> Every `Game` becomes a complete object instead of `title` + `slug`.

Concretely, at sprint close a catalog game may carry: external provider IDs,
summary, description, cover, hero image, screenshots, trailer, genres, tags,
developers, publishers, platforms, release date, franchise, series, and
provider-declared similar games — all populated **asynchronously**, and all
sourced from a provider chain rather than from user input.

## 2. Non-goals (explicit)

| Not in D3.25 | Why |
|---|---|
| Any UI / screen work | Instructed out of scope. Backend + workers only. |
| Premium UI, modal layer, Game Hub redesign | D3.27+ (audit Sprint 7). |
| Making `Post.gameId` required | Audit Sprint 3 — separate sprint. |
| Wiring feed ranking's zeroed game signals | Audit Sprint 3 — separate sprint. |
| `Community.gameId` | Audit Sprint 3. |
| Kaggle ingestion | Audit §10 Sprint 2 item 6 — zero references in repo; not a source. |
| Retiring `ExternalGame` | It is user/integration-scoped; catalog identity is separate. |

## 3. Hard constraints

1. **Everything asynchronous through BullMQ.** No HTTP request may block on a
   provider call. Read endpoints serve whatever is persisted and, at most,
   fire-and-forget an enqueue.
2. **Additive migration only.** No column drops, no destructive type changes.
3. **No hotlinking.** Provider artwork is mirrored into object storage; only the
   trailer (a third-party video URL) is stored as a URL.
4. **Fail-soft.** Absent provider credentials must not break boot, tests, or any
   request path. Providers self-report `isEnabled()`; a disabled chain leaves
   games at `metadata_status = 'pending'` and the platform behaves as it does today.
5. **Discovery must start using real metadata** — the hardcoded `null` cover in
   `discover/mappers/game-card.mapper.ts` is deleted this sprint.

## 4. Work breakdown

### WP1 — Documentation (this directory + OpenAPI change control)
- `docs/18_CATALOG/*` — architecture, providers, licensing, queues, media, ops.
- `docs/08_API/OPENAPI_CHANGE_CONTROL_D3_25.md` — additive-only change record.
- Amendments: `BACKGROUND_JOBS.md` (queue registry), `ENVIRONMENT_VARIABLES.md`,
  `PRISMA_SCHEMA.md`, `SIMILARITY_ENGINE.md`, `D3_24_IMPLEMENTATION_STATUS.md`.

### WP2 — Schema + additive Prisma migration
New enums: `metadata_provider`, `game_metadata_status`, `company_role`,
`game_related_kind`; `game_media_kind` gains `hero`, `artwork`, `logo`, `trailer`.

`Game` gains: `igdbId`, `steamAppId`, `rawgId`, `summary`, `description`,
`heroKey`, `trailerUrl`, `externalRating`, `externalRatingCount`, `seriesId`,
`metadataStatus`, `metadataProvider`, `metadataVersion`, `metadataRefreshedAt`,
`metadataAttempts`, `metadataError`.

New models: `Tag`, `GameTag`, `Company`, `GameCompany`, `GameSeries`,
`GameRelatedGame`, `GameMetadataRun`.
`GameMedia` gains: `provider`, `sourceUrl`, `sortOrder`, `width`, `height`.

Migration `20260731xxxxxx_d3_25_game_metadata_catalog` — `ADD COLUMN`,
`CREATE TABLE`, `ADD VALUE IF NOT EXISTS`, `CREATE INDEX` only.

### WP3 — Provider abstraction
`apps/backend/src/games/metadata/providers/`
- `metadata-provider.port.ts` — the interface + normalized `ProviderGameMetadata`.
- `igdb.provider.ts` — Twitch client-credentials token cache, IGDB APIv4,
  in-process token-bucket rate limiter (4 rps default).
- `steam-store.provider.ts` — `appdetails` fallback; used when IGDB is disabled
  or returns nothing, and to fill Steam-only fields.
- `rawg.provider.ts` — implemented but **disabled by default**; see
  `METADATA_LICENSING.md`.
- `metadata-provider.registry.ts` — ordered chain, per-field fill-forward merge.
- `metadata-merge.ts` / `metadata-normalize.ts` — pure, exhaustively unit-tested.

### WP4 — Queues, workers, backfill, scheduler
Queues `game.metadata` and `game.media`; jobs `game.metadata.enrich`,
`game.metadata.backfill.scan`, `game.metadata.refresh.scan`,
`game.media.ingest`. Publisher with deterministic `jobId`, `attempts: 5`,
exponential backoff, `removeOnFail: false`. Backfill + refresh scans registered
as BullMQ repeatables in `SchedulerService`. `library-sync.resolveOrCreateGame`
enqueues enrichment for every newly created skeleton game.

### WP5 — Media ingestion
Download → validate content type + byte ceiling → `putObject` into
`games/{gameId}/{kind}/{hash}.{ext}` → `GameMedia` row → promote `coverKey` /
`heroKey` on `Game`. Idempotent on `(gameId, kind, sourceUrl)`.

### WP6 — Catalog + discovery wiring
- Delete the hardcoded `null` in `game-card.mapper.ts`.
- Enrich `GameResponse`, `GameCardResponse`.
- New reads: `GET /games/:id/media`, `GET /games/:id/similar`,
  `GET /games/:id/metadata`.
- `similarity.engine.ts` gains real `tagIds`, `developerIds`, `publisherIds`,
  `seriesId` signals — replacing the franchise-as-publisher proxy.
- `recommendation.engine.ts` tag signal reads real `GameTag` rows.

### WP7 — Tests + coverage
Unit: normalizers, merge precedence, rate limiter, each provider against
recorded fixtures, media key derivation. Service: enrichment application,
backfill selection, refresh staleness window. Processor: job dispatch,
idempotency, failure → `metadata_status = 'failed'` + attempt counter.
Controller: new read endpoints. Repository: new Prisma repositories.

### WP8 — Migration run, smoke, production gate
Apply migration to the live stack, run `smoke-d3-25-catalog-gate.mjs`, record
results in `docs/06_RELEASE/SMOKE_RESULTS.md`.

### WP9 — Release documentation
Completion report, CHANGELOG, production checklist, docs index.

## 5. Exit criteria (Production Gate)

| # | Criterion | Verification |
|---|---|---|
| G1 | Migration applies additively to a live DB with existing data | `prisma migrate deploy` against running Postgres |
| G2 | No request path awaits a provider call | grep audit + smoke latency assertion on `GET /games/:id` |
| G3 | Provider chain works with zero credentials configured | full unit suite green with no env set |
| G4 | Enrichment populates every listed field from a fixture provider | integration test on the applier |
| G5 | Media is mirrored into object storage, never hotlinked | ingestion test asserts `putObject` + stored key |
| G6 | Backfill enqueues only `pending`/`failed`/`stale` games, bounded batch | service test |
| G7 | Refresh scheduler registers repeatables idempotently | scheduler test |
| G8 | Discovery cards return a real `coverImageUrl` when a cover exists | mapper test + smoke |
| G9 | Similarity engine consumes real tag/company/series signals | engine test |
| G10 | OpenAPI is additive-only and the bundle rebuilds | change-control doc + bundle diff |
| G11 | Backend test suite green; coverage not regressed | `pnpm --filter @gmrlog/backend test` |
| G12 | Smoke gate passes end to end | `smoke-d3-25-catalog-gate.mjs` |

## 6. Risks

| Risk | Mitigation |
|---|---|
| IGDB rate limit (4 rps) throttles backfill | In-process token bucket + bounded worker concurrency + bounded batch size |
| Provider outage stalls the catalog | `attempts: 5` + exponential backoff + DLQ retention; `failed` games re-enter via the backfill scan |
| Title-only matching mis-resolves games | Confidence scoring on match; below threshold → `partial`, never overwrite a higher-confidence provider |
| Media download abuse / oversized assets | Content-type allowlist + byte ceiling + per-game media count cap |
| Silent drift between provider and catalog | `metadataRefreshedAt` + daily refresh scan with a staleness window |
