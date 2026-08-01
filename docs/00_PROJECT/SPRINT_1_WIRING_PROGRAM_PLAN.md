# GMRLOG — Wiring Program Plan

**Author:** Lead Staff Engineer / Technical Co-Founder
**Date:** 2026-07-31
**Status:** PROPOSED — awaiting scope + credential decision
**Predecessor:** `SPRINT_0_PROJECT_AUDIT.md`

**Mandate:** turn every existing system into a working ecosystem. No placeholder logic, no TODO implementations, no fake data, no dead code.

---

## 0. Scope Reality Check — read this first

The seven priorities are **not one sprint.** Grounded in the file-level inventory below, this is a **7-sprint, ~13-week program**. I am not padding — here is the arithmetic:

| Priority | Real size | Why |
|---|---|---|
| 1. Game Metadata | **2.5 wks** | New provider layer, 5 new tables, new queue, artwork ingestion, backfill, rate limiting, 95% coverage gate |
| 2. Media System | **2 wks** | Multi-variant pipeline, blurhash, 3 net-new schema surfaces (Post/Event/Guide media), frontend rendering across 8 surfaces |
| 3. Discovery Wiring | **2 wks** | 6 zeroed scores, 4 unpopulated tables, N+1 rewrites, new recompute queue |
| 4. Game Hub | **2 wks** | 12 tabs, 4 of which have no data path at all today |
| 5. Onboarding | **1.5 wks** | Greenfield end-to-end: no files, no routes, no tables, no gate |
| 6. Profile Completeness | **1.5 wks** | Reputation/archetype triggering, real playtime, 4 mislabeled fields |
| 7. Feed Game Context | **1.5 wks** | Depends on 1+2+3 landing first |

Trying to land all seven at once produces exactly the failure mode the audit diagnosed: **surfaces that compile but aren't wired.** I will not repeat that pattern.

**What I propose:** execute them in dependency order, one sprint at a time, each ending in a verified end-to-end demo. This document specifies **Sprint 1 in full implementation detail** and outlines 2–7. Sprint 1 is Priority 1, because Priorities 3, 4, 6, and 7 are all *blocked on it* — they read data that does not exist yet.

---

## 1. Pre-Flight Blockers

These must be resolved before or during the first hours of Sprint 1.

### B1 — The repository still has zero commits 🔴
`git log` → *"your current branch 'main' does not have any commits yet."* Sprint 1 touches ~60 files including a schema migration. **Without a baseline commit there is no rollback.** First action of Sprint 1, before any code: `git add -A && git commit`. Non-negotiable.

### B2 — IGDB requires credentials I cannot provision 🔴
IGDB authenticates via Twitch OAuth (`IGDB_CLIENT_ID` + `IGDB_CLIENT_SECRET` from dev.twitch.tv). **You must create these.** The architecture below degrades cleanly without them (fixture provider, exactly like the existing `MeiliClientService.isAvailable()` pattern), so I can build and fully test the pipeline before credentials land — but **no real metadata flows until you supply them.** See §7.

### B3 — Coverage gate is 95% statements / 95% lines / 90% functions 🟠
`apps/backend/vitest.config.ts:47-52`. Every new file in Sprint 1 is subject to this. This is roughly **40% of the sprint's effort** and it is why the estimate is 2.5 weeks and not 1. I am not proposing we lower the gate.

### B4 — `resolveMediaUrl` percent-encodes path separators 🟠
`apps/backend/src/infrastructure/media/resolve-media-url.ts:18` does `encodeURIComponent(key)`, which turns `games/abc/cover.webp` into `games%2Fabc%2Fcover.webp` (verified in node). Every existing upload key already contains slashes (`uploads/{ownerId}/{purpose}/{uuid}`, `uploads.service.ts:159`). Whether this resolves correctly depends entirely on how MinIO/nginx handle `%2F` in a path — S3 decodes it, but nginx and many CDNs normalize or reject it. **There is no spec file for this function.** Sprint 1 writes slash-bearing keys at scale, so we verify this against the live stack and add a regression test before we depend on it.

---

## 2. Architecture

### 2.1 Metadata provider layer

Follows the codebase's established external-client convention (interface + `Symbol` token + Http impl + Mock impl + factory, `typeof fetch` constructor-injected — see `steam-web-api.client.ts:22-28,156-160`), but **improves on it in one way**: config comes from `@Inject(ENV)` like `MeiliClientService` (`infrastructure/search/meili.client.ts:24-40`), not a raw `process.env` read. The Steam client's `process.env.STEAM_WEB_API_KEY` (`steam-web-api.client.ts:227`) bypasses boot validation; we do not copy that mistake.

```
GameMetadataProvider (port)
├── IgdbMetadataProvider          primary   — genres, tags, companies, media, rating, franchise
├── SteamStoreMetadataProvider    secondary — steamAppId/steamUrl, screenshots for Steam titles
├── RawgMetadataProvider          fallback  — DEFERRED to Sprint 2+ (see §7)
└── FixtureMetadataProvider       dev/test  — active when no credentials configured

GameMetadataResolver   → provider chain, first-wins-per-field merge, never throws
GameMetadataNormalizer → provider payload → NormalizedGameMetadata (single internal shape)
GameMetadataWriter     → idempotent upsert: Game + genres + platforms + tags + companies + media
ArtworkIngestService   → download remote URL → sharp → MinIO → coverKey/heroKey
```

**Why a resolver + normalizer split:** providers disagree on shape and coverage. Normalizing at the edge means the writer, the engines, and every downstream consumer see exactly one contract, and adding RAWG later touches one file.

### 2.2 Asynchronous by construction

**No user request ever blocks on a provider call.** New BullMQ queue `metadata`:

| Job | Trigger | Purpose |
|---|---|---|
| `metadata.game.enrich` | enqueued after `resolveOrCreateGame` (`library-sync.service.ts:325`) | enrich one game |
| `metadata.catalog.backfill` | scheduled cron | sweep `metadataStatus='pending'` + stale rows |

The enqueue hook uses the codebase's existing best-effort pattern — the same `@Optional()` + try/catch used for `searchIndex.publishUpsert` and `discoveryScores.recomputeForGame` at `library-sync.service.ts:334-358`. A metadata failure must never fail a library import.

**Rate limiting:** IGDB caps at 4 req/s. We use **BullMQ's built-in worker limiter** (`limiter: { max, duration }`) rather than building outbound throttling infrastructure — it is exactly the right tool and costs us nothing. Provider responses are cached in Redis (30d TTL; metadata is slow-changing), keyed by `provider:externalId`, with `Game.metadataFetchedAt` driving staleness re-enrichment.

### 2.3 Artwork: mirror, never hotlink

Providers return remote CDN URLs. We **download once, transcode with sharp (already a dependency, `apps/backend/package.json:46`), store in MinIO**, and persist a storage key. We never serve IGDB or Steam CDN URLs to users — that is a ToS, availability, and rate-limit exposure we are not taking.

Key scheme: `games/{gameId}/{kind}/{contentHash}.webp`. Content-hashed so re-enrichment is idempotent and cacheable forever.

Sprint 1 ingests **cover + hero** only, reusing the existing `ImageProcessingProcessor` approach. Full multi-size variants, blurhash, and srcset land in Sprint 2 — deliberately, so Sprint 1 stays shippable.

### 2.4 Schema strategy: additive only

Five new tables, no destructive changes, no column drops. Critically, **`ExternalGame` is NOT reused** — it is library-ownership-shaped (`schema.prisma:1889-1912`), keyed on `IntegrationProvider` (`steam|xbox|playstation|epic|nintendo|csv`), with `@@unique([provider, externalId])`. Overloading it for catalog metadata would collide with Steam library rows on the same appId. We add a separate `GameExternalRef`.

**Two schema additions exist solely to unblock Priority 3**, and this is the whole reason metadata goes first:

- **`Tag` + `GameTag`** — there is no tag model anywhere. Today `similarity.engine.ts:119-120` fakes it: `mechanics = genre` and `theme = 0.7*genre + 0.3*franchise`. **44% of the game-similarity weight is a duplicate of the genre term.** And `recommendation.service.ts:162` does `tagSimilarity = genreOverlap`, aliasing 0.20 of the recommendation blend to a value already counted at 0.25.
- **`Company` + `GameCompany`** — there is no publisher/developer column. `similarity.service.ts:249` sets `publisherProxyId: game.franchiseId`, so the 0.08 publisher weight is mathematically identical to the franchise weight and contributes zero information. `statistics.service.ts:114` hardcodes `favoritePublisher: null`; `:113` labels a *franchise* as `favoriteDeveloper`.

Populating these is what makes "every score becomes real" achievable in Sprint 3.

---

## 3. Sprint 1 — Complete File Manifest

### 3.1 Database (`packages/database`)

**MODIFIED — `prisma/schema.prisma`**

New enums:
```prisma
enum MetadataProvider    { igdb steam_store rawg }
enum GameMetadataStatus  { pending enriched partial failed skipped }
enum CompanyRole         { developer publisher }
enum TagKind             { theme mechanic perspective mode player_count misc }
```

Additive columns on `Game` (currently `:658-692`):
`summary String?`, `description String?`, `heroKey String?`, `trailerUrl String?`, `externalRating Float?`, `externalRatingCount Int?`, `steamAppId Int?`, `steamUrl String?`, `metadataStatus GameMetadataStatus @default(pending)`, `metadataFetchedAt DateTime?`, `metadataAttempts Int @default(0)`
New index: `@@index([metadataStatus, metadataFetchedAt])` — drives the backfill sweep.

Additive columns on `GameMedia` (currently `:746-758`): `position Int @default(0)`, `sourceUrl String?`, `width Int?`, `height Int?`, `blurhash String?`
New: `@@unique([gameId, kind, storageKey])`, `@@index([gameId, kind, position])`

New models: `Company`, `GameCompany`, `Tag`, `GameTag`, `GameExternalRef` (shapes per §2.4).

**NEW — `prisma/migrations/20260731HHMMSS_d4_1_game_metadata/migration.sql`** (naming per existing convention)

**NEW repositories** — note `genre`, `platform`, and `franchise` repositories **do not exist today**; `library-sync.service.ts` bypasses the repository layer entirely with raw `PrismaService`. We fix that here:
- `src/repositories/genre.repository.ts`
- `src/repositories/platform.repository.ts`
- `src/repositories/franchise.repository.ts`
- `src/repositories/company.repository.ts`
- `src/repositories/tag.repository.ts`
- `src/repositories/game-media.repository.ts`
- `src/repositories/game-external-ref.repository.ts`

**MODIFIED**
- `src/repositories/game.repository.ts` — add `upsertMetadata`, `findByExternalRef`, `listStaleMetadata`, `findWithMetadata`
- `src/repositories/index.ts` — export the 7 new repositories
- `src/repositories/discover-games.repository.ts` — extend `DiscoverGameRecord` with tags + companies

### 3.2 Backend — metadata module (all NEW)

`apps/backend/src/games/metadata/`
| File | Responsibility |
|---|---|
| `metadata.tokens.ts` | DI symbols |
| `game-metadata.port.ts` | `GameMetadataProvider`, `NormalizedGameMetadata`, `ProviderLookupKey` |
| `igdb.client.ts` | IGDB + Twitch OAuth token management, `isAvailable()` |
| `steam-store.client.ts` | `store.steampowered.com/api/appdetails` — net new, no existing caller |
| `fixture-metadata.provider.ts` | credential-free dev/test provider |
| `game-metadata.resolver.ts` | provider chain + field-level merge |
| `game-metadata.normalizer.ts` | provider payload → normalized shape |
| `game-metadata.writer.ts` | idempotent transactional upsert of game + all links |
| `game-metadata-cache.service.ts` | Redis provider-response cache |
| `artwork-ingest.service.ts` | download → sharp → MinIO → key |
| `game-metadata.module.ts` | wiring |
| `testing/fake-metadata-provider.ts` | test double |

Plus a `.spec.ts` for each of: `igdb.client`, `steam-store.client`, `game-metadata.resolver`, `game-metadata.normalizer`, `game-metadata.writer`, `game-metadata-cache.service`, `artwork-ingest.service`.

### 3.3 Backend — jobs infrastructure

**NEW**
- `infrastructure/jobs/metadata.publisher.ts` (+ spec) — models on `search-index.publisher.ts:26-70`, including the `@Optional()` Redis-absent synchronous fallback
- `infrastructure/jobs/processors/game-metadata.processor.ts` (+ spec)
- `infrastructure/jobs/processors/metadata-backfill.processor.ts` (+ spec)

**MODIFIED**
- `queue-names.ts` — add `QUEUE_METADATA = 'metadata'`
- `job-names.ts` — add `JOB_METADATA_GAME_ENRICH`, `JOB_METADATA_CATALOG_BACKFILL`
- `jobs.module.ts` — register/export `MetadataPublisher`
- `worker.module.ts` — register both processors + `GameMetadataModule`
- `worker-runner.service.ts` — new `metadata` worker with `limiter`, and **convert `dispatchMedia` (`:140-148`) from single-processor if/throw to the array-loop pattern** already used by maintenance (`:120-128`)
- `scheduler.service.ts` — register `metadata.catalog.backfill` repeatable

### 3.4 Backend — integration & exposure

**MODIFIED**
- `integrations/library-sync.service.ts` — enqueue enrichment after `resolveOrCreateGame` (`:325`), best-effort, matching the existing `@Optional()` pattern at `:334-358`
- `integrations/integrations.module.ts` — import `MetadataPublisher`
- `games/games.service.ts`, `games.module.ts` — expose metadata
- `games/mappers/game.mapper.ts` — emit the new fields
- `games/testing/fake-repositories.ts` — `makeGame()` (`:29-43`) enumerates every Game column and will not type-check until updated
- **`discover/mappers/game-card.mapper.ts` — delete the hardcoded `return null` (`:8-11`) and call `resolveMediaUrl`.** One line; every game card in Discover is blank because of it.
- `infrastructure/media/resolve-media-url.ts` (+ **new spec**) — resolve B4
- `infrastructure/config/env.schema.ts` (+ spec) — `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`, `STEAM_STORE_ENABLED`, `METADATA_CACHE_TTL_SECONDS`, `METADATA_BACKFILL_BATCH_SIZE`, `METADATA_RATE_LIMIT_PER_SECOND`
- `infrastructure/storage/s3-object-storage.ts` — add `CacheControl` to `putObject` (`:98-108`); artwork is immutable and content-hashed

### 3.5 Shared packages & config

- `packages/types/src/index.ts` — extend `GameResponse` (`:573-582`) and `GameCardResponse` (`:602-612`); add `GameCompanySummary`, `GameTagSummary`, `GameMediaSummary`
- `packages/validators/src/index.ts` — metadata admin/query schemas
- `apps/backend/.env.example`, `.env.example`, `infrastructure/docker/.env.production.example`

### 3.6 Frontend (minimal — no redesign, per mandate)

Strictly data plumbing so the new fields render in existing components. **No new screens, no styling changes, no animations.**
- `src/api/axios-client.ts` — types flow through from `@gmrlog/types`
- `features/discover/components/game-card.tsx` — renders `coverImageUrl`, which stops being null
- `features/content/hooks/game-hub-model.ts` — surface genres/companies in existing layout

**Totals: ~34 new files, ~26 modified.**

---

## 4. Sprints 2–7 (outline)

| Sprint | Theme | Headline scope | Depends on |
|---|---|---|---|
| **2** | Media System | Multi-size variants + blurhash + `Upload` dimension columns; wire the two **defined-but-orphaned** models `PostMedia` (`schema.prisma:852`) and `GameMedia`; net-new media for Events and Guides; `expo-image` `placeholder={{blurhash}}` (no new frontend dep); fix `image-processing.processor.ts:59-66` swallowing all errors, which makes `attempts: 4` dead config | 1 |
| **3** | Discovery Wiring | Kill all six zeros at `activity.service.ts:669-674`; real tags/publisher into `similarity.engine.ts:119-120` + `similarity.service.ts:249`; **fix the `wishlistSimilarity` logic bug** (`recommendation.service.ts:163` is structurally always 0 — wishlist games are excluded as owned at `:134`, so 0.15 of the blend is dead); write the **never-written** `recommendation_rules` table; new `discovery` recompute queue (no scheduled recompute exists today) | 1, 2 |
| **4** | Game Hub | Overview payload with real metadata; wire `GameMedia` to the screenshots tab (never queried today); real `CommunityGame` link replacing the string heuristic at `game-hub.service.ts:317-336`; per-game achievements (`Achievement` has **no `gameId`** — schema change); fix in-memory pagination at `:177-192` | 1, 2, 3 |
| **5** | Onboarding | Greenfield: `UserTastePreference` + `User.onboardingCompletedAt`; `(onboarding)` route group; extend `auth-gate-decision.ts:9-34` **and** the independent redirect at `app/(auth)/_layout.tsx:18-20` that would otherwise bypass it; seed feed/recs/communities | 1, 3 |
| **6** | Profile Completeness | Reputation `recalculate()` is wired to **one manual endpoint** with no cron and no write-path hook — badges are empty for every user; real playtime column (`GameLog` has no duration, so `totalHours` is a session *count* rendered as `3h`); `favoritePublisher` (`statistics.service.ts:114`) and `indie_hunter` (`archetype-engine.service.ts:123`) unstubbed by Sprint 1 data | 1, 3 |
| **7** | Feed Game Context | Game cards in feed items, Because-You-Played + interest-overlap badges, game-aware filters surfaced | 1–4 |

---

## 5. Definition of Done (every sprint)

A sprint is **not** complete until, in order:

1. `pnpm db:migrate:deploy` applies cleanly against a fresh database
2. `pnpm lint` and `pnpm typecheck` pass repo-wide
3. `pnpm test` passes **and** coverage holds at 95/95/90/70
4. `pnpm release:smoke` passes end-to-end
5. **Manual end-to-end verification with real data**, evidenced in the completion report

For Sprint 1 specifically, item 5 means: trigger a Steam import → observe enrichment jobs drain → query `GET /games/:id` and see real cover, genres, description, developer, publisher → confirm the artwork byte-serves from MinIO, not a provider CDN → confirm Discover game cards render covers.

**No sprint is marked COMPLETE on "the code compiles."** That standard is what produced the current state.

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| IGDB credentials unavailable | Fixture provider keeps the pipeline fully testable; live flow gated behind `isAvailable()` |
| IGDB rate limit (4 req/s) throttles backfill | BullMQ worker limiter + batch sizing; backfill is background and resumable by design |
| Provider title-matching produces wrong games | `mappingConfidence` scoring, `metadataStatus='partial'` for low confidence, never overwrite a higher-confidence match |
| Coverage gate blocks the merge | Tests written alongside, not after — reflected in the 2.5-week estimate |
| 95%-coverage pressure invites `vitest.config.ts` exclusions | Explicitly disallowed. `library-sync.service.ts` is already excluded (`:44`); we do not extend that list |
| `%2F` key encoding (B4) breaks artwork URLs | Verified against live MinIO/nginx in the first hours, regression spec added |

---

## 7. Decisions I Need From You

1. **Scope** — confirm the 7-sprint sequencing, or tell me to compress (and I'll tell you exactly what quality we trade).
2. **IGDB credentials** — do you have a Twitch dev app, or should I build fixture-first and wire live provider on delivery?
3. **RAWG** — I recommend **deferring**. Its data is noisier than IGDB's, and "rawg" in this codebase today is only a CSV export format the parser recognises (`csv-import.parser.ts:10`), not an API. Adding a third provider before the first two are proven adds merge complexity for no coverage we can currently measure. Revisit once we can quantify IGDB's gaps.

---

*Awaiting approval. No code will be written until scope and credentials are settled.*
