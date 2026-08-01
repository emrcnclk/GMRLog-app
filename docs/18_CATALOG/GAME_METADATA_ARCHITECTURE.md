# Game Metadata Architecture

**Document:** `docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md`
**Introduced:** D3.25

---

## 1. Problem

Before D3.25 the only code path that created a `Game` row was
`library-sync.service.ts → resolveOrCreateGame()`, which wrote `title` and `slug`
and nothing else. Everything downstream that needed genres, tags, artwork, or
companies read empty columns.

## 2. Shape of the solution

```
                         (never on the request path)
 ┌──────────────┐  enqueue   ┌─────────────────┐   ┌──────────────────────┐
 │ library-sync │ ─────────► │  game.metadata  │──►│ GameMetadataProcessor│
 │ csv import   │            │     (BullMQ)    │   └──────────┬───────────┘
 │ backfill scan│            └─────────────────┘              │
 │ refresh scan │                                             ▼
 └──────────────┘                                  ┌─────────────────────┐
                                                   │  ProviderRegistry   │
                                                   │  igdb → steam → rawg│
                                                   └──────────┬──────────┘
                                                              │ ProviderGameMetadata
                                                              ▼
                                                   ┌─────────────────────┐
                                                   │ GameMetadataApplier │
                                                   │  (single tx write)  │
                                                   └──────────┬──────────┘
                                              enqueue media   │
                                                              ▼
                                                   ┌─────────────────────┐
                                                   │   game.media queue  │
                                                   │  → object storage   │
                                                   └─────────────────────┘
```

Read endpoints (`GET /games/:id`, discover, game hub) project **whatever is
already persisted**. They never await a provider. A read of a `pending` game may
fire-and-forget an enqueue, but returns immediately either way.

## 3. Data model

### 3.1 `Game` — added columns

| Column | Type | Meaning |
|---|---|---|
| `igdb_id` | `INTEGER UNIQUE NULL` | IGDB game id — catalog identity |
| `steam_app_id` | `INTEGER UNIQUE NULL` | Steam appid |
| `rawg_id` | `INTEGER UNIQUE NULL` | RAWG id (unused while RAWG is off) |
| `summary` | `TEXT NULL` | Short blurb — card / hub subtitle |
| `description` | `TEXT NULL` | Long-form storyline / detailed description |
| `hero_key` | `TEXT NULL` | Object-storage key for the hero/banner image |
| `trailer_url` | `TEXT NULL` | Third-party video URL (not mirrored) |
| `external_rating` | `DOUBLE PRECISION NULL` | Provider aggregate rating, 0–100 |
| `external_rating_count` | `INTEGER NULL` | Provider rating sample size |
| `series_id` | `TEXT NULL` | FK → `game_series` |
| `metadata_status` | `game_metadata_status NOT NULL DEFAULT 'pending'` | Lifecycle |
| `metadata_provider` | `metadata_provider NULL` | Winning provider for the current record |
| `metadata_version` | `INTEGER NOT NULL DEFAULT 0` | Increments on every successful apply |
| `metadata_refreshed_at` | `TIMESTAMP NULL` | Drives the staleness window |
| `metadata_attempts` | `INTEGER NOT NULL DEFAULT 0` | Consecutive failures; reset on success |
| `metadata_error` | `TEXT NULL` | Last failure reason (truncated) |

`cover_key`, `release_date`, `franchise_id`, `popularity` already existed and are
now written by the applier.

### 3.2 New tables

| Table | Purpose |
|---|---|
| `tags` / `game_tags` | Themes, game modes, player perspectives, keywords. `tags.kind` distinguishes them. |
| `companies` / `game_companies` | Developers and publishers. `game_companies.role` is `company_role`. |
| `game_series` | Provider "collection"/series grouping, distinct from `franchises`. |
| `game_related_games` | Provider-declared relationships (`similar`, `dlc`, `expansion`, `remake`, `prequel`, `sequel`). Stores `related_external_id` so an unmatched target can be resolved on a later pass. |
| `game_metadata_runs` | One row per enrichment attempt: provider, outcome, duration, fields written, error. Observability + coverage reporting. |

### 3.3 `game_media` — extended

Added `provider`, `source_url`, `sort_order`, `width`, `height`, plus a unique
index on `(game_id, kind, source_url)` making ingestion idempotent. `game_media_kind`
gains `hero`, `artwork`, `logo`, `trailer` alongside the existing `screenshot`,
`cover`, `banner`, `video`.

### 3.4 Relationship to `ExternalGame`

`ExternalGame` maps a **user's** third-party library entry to an internal game.
It is per-integration and per-user. Catalog identity (`igdb_id`, `steam_app_id`)
is a property of the game itself. The two are complementary and D3.25 does not
merge them — but the Steam library sync now passes the observed `appId` through
so the catalog can adopt it as `steam_app_id` on first enrichment.

## 4. Metadata lifecycle

```
 pending ──enqueue──► enriching ──success──► complete
    ▲                     │                    │
    │                     ├─partial match────► partial
    │                     └─error────────────► failed
    │                                            │
    └────────── backfill scan (failed, bounded attempts) ◄┘

 complete/partial ── refresh scan (refreshed_at older than window) ──► enriching
```

- **pending** — created, never enriched. Every skeleton game starts here.
- **enriching** — claimed by a worker. Guards against duplicate concurrent work.
- **complete** — a provider matched with high confidence and the required core
  fields were written.
- **partial** — matched below the confidence threshold, or the winning provider
  supplied only some core fields. Still eligible for refresh; never overwritten
  by a *lower*-confidence result.
- **failed** — no provider matched, or all providers errored. `metadata_attempts`
  increments; the backfill scan retries with decreasing priority until
  `METADATA_MAX_ATTEMPTS`, after which the game is left alone until an operator
  forces a refresh.
- **stale** — set by the refresh scan when `metadata_refreshed_at` exceeds the
  window; functionally an enqueue trigger.

## 5. Invariants

1. **A read never awaits a provider.** Enforced by construction: no controller,
   service or mapper on a request path imports the provider registry.
2. **The applier is atomic.** Every field, join-table row, and status transition
   for one game lands in a single `$transaction`. Media enqueue happens *after*
   commit (the `integrations.service.ts:166-227` reference pattern).
3. **Enrichment is idempotent.** Deterministic BullMQ `jobId` per
   `(gameId, reason)`; join rows upserted on natural keys; media deduped on
   `(gameId, kind, sourceUrl)`.
4. **Never downgrade.** An apply pass with lower confidence than the persisted
   `metadata_provider` may fill `NULL` fields but may not overwrite populated ones.
5. **Provenance is always recoverable.** `metadata_provider` on the game,
   `provider` on each media row, and a `game_metadata_runs` audit row per attempt.
6. **Absent credentials are a valid configuration.** The chain degrades to
   "no provider enabled", games stay `pending`, and every existing behaviour is
   preserved.

## 6. Consumers wired in this sprint

| Consumer | Before | After |
|---|---|---|
| `discover/mappers/game-card.mapper.ts` | `coverImageUrl` hardcoded `null` | resolves `cover_key` through `resolveMediaUrl` |
| `games/mappers/game.mapper.ts` | title, slug, cover, platforms | + summary, description, hero, trailer, genres, tags, developers, publishers, franchise, series, external rating, metadata status |
| `discover/scoring/similarity.engine.ts` | genre + franchise-as-publisher proxy | real `tagIds`, `developerIds`, `publisherIds`, `seriesId` |
| `discover/scoring/recommendation.engine.ts` | tag weight over empty data | real `game_tags` |
| `game-hub` | bare title | full metadata projection |

## 7. What D3.25 deliberately leaves alone

Feed ranking's zeroed game signals, `Post.gameId` optionality, and
`Community.gameId` are all audit-Sprint-3 items. They consume this sprint's
output but are out of scope here.
