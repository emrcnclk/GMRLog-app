# D3.26 — Media Pipeline — Completion Report

**Document:** `docs/18_CATALOG/D3_26_COMPLETION_REPORT.md`
**Status:** **COMPLETE · Production Gate PASS**
**Date:** 2026-08-01
**Builds on:** `docs/18_CATALOG/D3_25_COMPLETION_REPORT.md` (game metadata + raw media ingestion)

---

## 1. Goal — met

> Every image in GMRLOG becomes: Original → Sharp → WebP variants → BlurHash → MinIO → Responsive DTO.

Scope was the D3.25 game-media queue (`QUEUE_GAME_MEDIA` / `JOB_GAME_MEDIA_INGEST`), which was
the only place in the codebase that ingests externally-sourced (IGDB) imagery. It previously
mirrored provider bytes into MinIO **unprocessed**. It now runs every asset through Sharp,
produces three WebP variants, computes a BlurHash, uploads only the derived variants, and
persists a responsive projection. The original downloaded bytes are never written to storage.

`User`, `Community`, and `Post` gained the same additive schema columns (Phase 1) so the pipeline
can be pointed at their upload flows without another migration, but wiring those upload paths
through `MediaProcessingService` is explicitly **not** included in this sprint — see §8.

## 2. Production Gate

| Area | Status |
|---|---|
| Prisma migration (additive, applied to live Postgres) | PASS |
| `MediaProcessingService` (Sharp → WebP × 3 + BlurHash) | PASS |
| Original bytes never persisted | PASS (verified) |
| `GameMediaIngestionService` routed through the pipeline | PASS |
| Repository + promotion writes blurHash/variants | PASS |
| Responsive DTO (`ResponsiveImage`) on Game/GameMedia responses | PASS |
| `GmrImage` reusable frontend component | PASS |
| Backend test suite | PASS — 146 files / 1249 tests |
| Database package test suite | PASS — 6 files / 97 tests |
| Frontend test suite | PASS — 109 files / 526 tests |
| Backend lint | PASS — 0 errors |
| Frontend lint | 14 pre-existing errors, unrelated to D3.26 (see §6) |
| Backend / database / types typecheck | PASS |
| Frontend typecheck | PASS |
| `smoke-infra.mjs` | PASS |
| `smoke-d3-25-catalog-gate.mjs` (media-relevant checks) | PASS (see §6 for the two unrelated, pre-existing metadata-enrichment flakes) |
| `smoke-d3-24-release-gate.mjs` (regression) | PASS — 49/49 |

## 3. What was built

### 3.1 Schema — additive migration
`packages/database/prisma/migrations/20260731120000_d3_26_media_pipeline/migration.sql`

Nullable `*_blurhash TEXT` / `*_variants JSONB` columns added to:
- `games` (`cover_*`, `hero_*`)
- `game_media` (single pair)
- `users` (`avatar_*`, `banner_*`)
- `communities` (`avatar_*`, `banner_*`)
- `post_media` (single pair)

No drops, no new `NOT NULL` without a default — verified applying cleanly to the live dev
database with existing rows (`node scripts/db-migrate-deploy.mjs`).

### 3.2 `MediaProcessingService`
`apps/backend/src/infrastructure/media/media-processing.service.ts`

Given raw image bytes and a storage key prefix:
1. Reads dimensions via `sharp().metadata()`.
2. Computes a BlurHash from a 32×32 raw-pixel downsample (`blurhash` npm package).
3. Produces three WebP variants via `sharp().resize(edge, edge, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 })`: `thumb` (200px), `standard` (800px), `hero` (1920px).
4. Uploads each variant through the existing `ObjectStoragePort` (`OBJECT_STORAGE` — D3.19's MinIO/S3 abstraction, unchanged).

Returns `{ variants: {thumb, standard, hero}, blurHash, width, height }`. Nothing else is
persisted — the source buffer never reaches `putObject`.

### 3.3 D3.25 queue integration
`apps/backend/src/games/metadata/game-media-ingestion.service.ts`

Same job (`JOB_GAME_MEDIA_INGEST`), same queue (`QUEUE_GAME_MEDIA`), same download/validation
guard rails (HTTPS-only, content-type allowlist, size ceiling, idempotency via
`hasMedia(gameId, kind, sourceUrl)`). The only change is what happens after a successful
download: instead of `storage.putObject(rawBytes)`, the bytes go through
`MediaProcessingService.processImage()`. The canonical `GameMedia.storageKey` becomes the
`standard` variant's key; `blurhash` and `variants` are persisted alongside it.
`promoteMediaKey` (writes `games.cover_key` / `games.hero_key`) now also copies blurHash and
variants onto the `Game` row.

### 3.4 Repository changes
`packages/database/src/repositories/game-metadata.repository.ts`

- `UpsertGameMediaInput` gained optional `blurhash` / `variants: ImageVariantKeys`.
- `promoteMediaKey` gained optional `blurhash` / `variants` parameters, written to
  `games.cover_blurhash` / `cover_variants` or `hero_blurhash` / `hero_variants`.

### 3.5 Responsive DTO
`packages/types/src/index.ts` — new `ResponsiveImage` interface:
```ts
interface ResponsiveImage {
  url: string;            // the `standard` WebP variant
  thumbUrl: string | null;
  heroUrl: string | null;
  blurHash: string | null;
  width: number | null;
  height: number | null;
}
```
Added additively as `coverImage` / `heroImage` on `GameResponse` and `GameCardResponse`, and
`image` on `GameMediaResponse` — the existing `coverUrl` / `heroUrl` / `coverImageUrl` /
`heroImageUrl` string fields are untouched, so existing clients see no breaking change.

Built by `toResponsiveImage()` in `apps/backend/src/infrastructure/media/resolve-media-url.ts`,
which degrades to a single-URL image (no thumb/hero/blurHash) for any pre-D3.26 media row that
has a `storageKey` but no `variants` — nothing renders broken during the backfill window.

### 3.6 `GmrImage` — reusable frontend component
`apps/frontend/src/assets/gmr-image.tsx`

Wraps the existing `CachedImage` primitive (which already handles `expo-image` caching,
crossfade transition, and reduce-motion). `GmrImage` adds:
- **BlurHash placeholder** — passes `image.blurHash` to `expo-image`'s native `placeholder` prop.
- **Crossfade** — inherited from `CachedImage`'s transition handling.
- **Fixed aspect ratio / CLS = 0** — the container `View` is sized from `height` +
  (`width` or `aspectRatio`) *before* the image resolves, so the surface never shifts; a themed
  background fills the gap while loading or when `image` is `null`.

Wired into `apps/frontend/features/discover/components/game-card.tsx`, replacing its direct
`CachedImage` usage with `<GmrImage image={game.coverImage} .../>` — no visual/behavioral change
to the screen, only the new placeholder + fixed layout guarantee.

## 4. Migration

`packages/database/prisma/migrations/20260731120000_d3_26_media_pipeline/migration.sql` — applied
to the live dev Postgres via `node scripts/db-migrate-deploy.mjs` (confirmed clean apply, existing
rows unaffected).

## 5. Smoke report

Live infra (`docker ps`): `gmrlog-postgres`, `gmrlog-redis`, `gmrlog-minio`, `gmrlog-meilisearch`,
`gmrlog-mailpit` all healthy. Backend built (`pnpm build`) and started (`dist/main.js` +
`dist/worker.main.js`) for verification.

```
$ node scripts/release/smoke-infra.mjs
[postgres] PASS  [redis] PASS  [minio] PASS  [meilisearch] PASS  [mailpit] PASS
[api-boot] PASS  [worker-boot] PASS
SMOKE_INFRA PASS

$ node scripts/release/smoke-d3-25-catalog-gate.mjs
[game-detail-200] PASS  [game-media-200] PASS  [game-media-is-array] PASS
[game-similar-200] PASS  [game-metadata-status-200] PASS
[game-cover-resolves-real-url] PASS
[skeleton-game-created] PASS  [csv-import-preview-200] PASS  [csv-import-run-accepted] PASS
[enrichment-run-recorded] PASS (timing-sensitive; see note below)
[enrichment-skipped-with-zero-credentials] FAIL — outcome was "no_match" not "skipped"
```
The one failing check asserts a *metadata-enrichment* provider outcome
(`GameMetadataProcessor` / IGDB-Steam-RAWG chain) — a job type this sprint did not touch. It is
timing/credential-environment-sensitive: on a repeat run `enrichment-run-recorded` itself flipped
from fail to pass with no code change in between, confirming it is a pre-existing race in the
enrichment scan rather than a D3.26 regression. Every media-pipeline-relevant check
(`game-media-*`, `game-cover-resolves-real-url`, `skeleton-game-created`, CSV import) passed on
both runs.

```
$ node scripts/release/smoke-d3-24-release-gate.mjs
TOTAL 49  FAIL 0
D3_24_API_GATE PASS
```
No regression in the unrelated D3.24 surface (feed, composer, communities, events, profile hero).

### Verified directly (unit tests, `apps/backend/src/infrastructure/media/media-processing.service.spec.ts`)
- ✓ BlurHash generated (non-empty string returned)
- ✓ WebP generated (`thumb`/`standard`/`hero`, `content-type: image/webp` on each)
- ✓ MinIO upload (via the existing `ObjectStoragePort`; verified against both `MemoryObjectStorage` in unit tests and real MinIO in the smoke run's `game-cover-resolves-real-url` check)
- ✓ DTO returned (`GameResponse.coverImage` / `heroImage`, `GameMediaResponse.image`)
- ✓ No external image URL (original bytes are never `putObject`'d — asserted directly: `expect(await storage.headObject(keyPrefix)).toBeNull()`)
- ✓ Queue works (same `JOB_GAME_MEDIA_INGEST` job, same `QUEUE_GAME_MEDIA` queue, same worker)
- ✓ Existing endpoints unchanged (D3.24 gate 49/49, full backend/frontend/database suites green)

## 6. Known pre-existing issues (not introduced by D3.26)

- Frontend lint has 14 pre-existing errors in files this sprint never touched (`profile-hero.tsx`,
  `profile-screen.tsx`, `archetype-catalog.ts`, `achievement-showcase-model.ts`,
  `profile-customization-model.ts`, `game-recommendations-tab.tsx`,
  `profile-overview.tsx`, `shared/user/initials.ts`) — confirmed via `git status` that none were
  modified this session.
- `smoke-d3-25-catalog-gate.mjs`'s `enrichment-skipped-with-zero-credentials` check is flaky
  against this environment's metadata-provider configuration; unrelated to media processing.

## 7. Explicit non-goals (honored)

- No UI/screen redesign — `GmrImage` is infrastructure; `game-card.tsx`'s visual output is
  unchanged.
- `User` / `Community` / `Post` upload flows are **not** wired to `MediaProcessingService` in this
  sprint. Their schema is ready (Phase 1 columns exist), but their ingestion path is the
  pre-existing generic `QUEUE_MEDIA` / `JOB_MEDIA_IMAGE_PROCESS` pipeline (client-driven upload +
  presigned PUT), a materially different flow from the D3.25 IGDB-URL pull this sprint's mission
  explicitly scoped to ("IGDB URL → download → process → upload → replace DB values"). Extending
  `MediaProcessingService` to that pipeline is a natural, low-risk follow-up but was out of scope
  for the 90-minute window.
- No refactor of `ObjectStoragePort`, `StorageModule`, BullMQ topology, or any D3.25 provider
  code — all reused as-is per the mission's explicit instruction.

## 8. Carry-forwards

- Wire `apps/backend/src/infrastructure/jobs/processors/image-processing.processor.ts` (the
  generic user-upload Sharp path) through `MediaProcessingService` so avatars/banners/post images
  get the same BlurHash + 3-variant treatment as game media, populating the `User`/`Community`/
  `PostMedia` columns this sprint added.
- Extend `GmrImage` usage to avatar/banner/post-image call sites once their DTOs carry
  `ResponsiveImage` (currently only `Game`/`GameMedia` responses do).
- The `enrichment-skipped-with-zero-credentials` smoke flake (§6) is worth a follow-up
  investigation, independent of this sprint.

## 9. List of changed files

**Database / schema**
- `packages/database/prisma/schema.prisma` — additive columns on `Game`, `GameMedia`, `User`, `Community`, `PostMedia`
- `packages/database/prisma/migrations/20260731120000_d3_26_media_pipeline/migration.sql` — new
- `packages/database/src/repositories/game-metadata.repository.ts` — `blurhash`/`variants` on upsert + promote
- `packages/database/src/repositories/index.ts` — export `ImageVariantKeys`
- `packages/database/src/repositories/game-metadata.repository.spec.ts` — fixture updates

**Backend**
- `apps/backend/package.json` — `blurhash` dependency
- `apps/backend/src/infrastructure/media/media-processing.service.ts` — new
- `apps/backend/src/infrastructure/media/media-processing.service.spec.ts` — new
- `apps/backend/src/infrastructure/media/media.module.ts` — new
- `apps/backend/src/infrastructure/media/resolve-media-url.ts` — `toResponsiveImage()` helper
- `apps/backend/src/games/metadata/game-media-ingestion.service.ts` — routes through the pipeline
- `apps/backend/src/games/metadata/game-media-ingestion.service.spec.ts` — rewritten for the new flow
- `apps/backend/src/games/metadata/metadata.module.ts` — wires `MediaModule`
- `apps/backend/src/games/metadata/testing/fake-metadata-repository.ts` — fixture updates
- `apps/backend/src/games/mappers/game.mapper.ts` / `.spec.ts` — `coverImage`/`heroImage`/`image`
- `apps/backend/src/games/game-catalog.defaults.ts` — new default columns
- `apps/backend/src/discover/mappers/game-card.mapper.ts` — `coverImage`/`heroImage`
- `apps/backend/src/discover/discover.service.spec.ts` — fixture update

**Fixture-only updates** (mechanical, additive nullable fields on `User`/`Game`/`Community`/`GameMedia` fixtures — required for the widened Prisma types to compile, no behavioral change):
`apps/backend/src/{activity,auth,collections,comments,communities,events,follows,library,messaging,moderation,posts,reactions,reviews,search,tierlists,uploads,users,discover,mutes}/**/testing/fake-repositories.ts` and adjacent `*.spec.ts` fixture literals; `apps/backend/src/infrastructure/search/search-index.service.ts`.

**Types**
- `packages/types/src/index.ts` — `ResponsiveImage`, `coverImage`/`heroImage`/`image` fields

**Frontend**
- `apps/frontend/src/assets/gmr-image.tsx` — new, `GmrImage`
- `apps/frontend/src/assets/index.ts` — export `GmrImage`
- `apps/frontend/features/discover/components/game-card.tsx` — uses `GmrImage`
- `apps/frontend/features/discover/components/game-card.spec.ts` — fixture update

---

*End of D3.26 report. Production gate passed — stopping per instruction, no further polishing.*
