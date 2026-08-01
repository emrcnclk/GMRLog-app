# Game Media Ingestion

**Document:** `docs/18_CATALOG/MEDIA_INGESTION.md`
**Introduced:** D3.25
**Code:** `apps/backend/src/games/metadata/game-media-ingestion.service.ts`

---

## 1. Rule

Provider artwork is **mirrored into GMRLOG object storage**. Nothing is
hotlinked. The one exception is `Game.trailerUrl` — see `METADATA_LICENSING.md` §5.

Rationale (audit §10 Sprint 2 item 4): GMRLOG hotlinks nothing today, so this is
a build-it-right-once opportunity. Mirroring buys availability independence, a
bounded takedown path, and no third-party CDN visibility into user traffic.

## 2. Key layout

```
games/{gameId}/{kind}/{sha256(sourceUrl)[0..15]}.{ext}
```

- Content-addressed by **source URL**, not by bytes — re-running ingestion for
  the same provider asset produces the same key and overwrites in place.
- `kind` is the `GameMediaKind` value (`cover`, `hero`, `screenshot`, `artwork`,
  `logo`, `banner`).
- Extension is derived from the validated response `Content-Type`, never from
  the URL, so a mislabelled URL cannot smuggle an unexpected type.

Keys live under `games/`, which is a **public-readable prefix** — game artwork is
public catalog data by nature. This is compatible with the audit's S1 finding:
the fix there is to scope public read to specific prefixes rather than the whole
bucket, and `games/` is exactly such a prefix.

## 3. Pipeline

```
ProviderMediaRef
  → (skip if game_media row exists for (gameId, kind, sourceUrl))
  → fetch with timeout MEDIA_INGEST_TIMEOUT_MS (default 15000)
  → assert Content-Type ∈ allowlist
  → assert Content-Length ≤ MEDIA_INGEST_MAX_BYTES (default 8 MiB)
  → putObject(key, buffer, contentType)
  → upsert game_media row (provider, sourceUrl, sortOrder, width, height)
  → if kind = 'cover'  → set games.cover_key
    if kind = 'hero'   → set games.hero_key
```

Content-type allowlist: `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
Anything else is rejected and logged; it is not a job failure.

Per-game caps: `MEDIA_INGEST_MAX_SCREENSHOTS` (default `12`), plus one cover,
one hero, and up to `MEDIA_INGEST_MAX_ARTWORKS` (default `4`). A provider
returning 60 screenshots cannot inflate storage without bound.

## 4. Idempotency

The unique index on `game_media (game_id, kind, source_url)` is the enforcement
point. The service checks first to avoid a wasted download, and the index
guarantees correctness under concurrency.

Re-ingesting a game that already has all its media is a no-op that performs zero
network I/O.

## 5. Cover / hero promotion

`Game.cover_key` and `Game.hero_key` are denormalized pointers so that card
projections need no join. They are set only when the corresponding media row is
successfully stored, and only when currently null **or** when the new asset comes
from a higher-priority provider than the one that set it.

`resolveMediaUrl(coverKey)` (existing, `infrastructure/media/resolve-media-url.ts`)
turns the key into a public URL. This is what replaces the hardcoded `null` in
`discover/mappers/game-card.mapper.ts`.

## 6. Failure isolation

Media ingestion runs on its own queue, after the metadata transaction has
committed. A failed download never rolls back metadata and never fails the
enrichment job. Each media asset is one job, so one bad URL does not poison the
rest of a game's gallery.

## 7. Deletion

`GameMedia` rows carry `provider` and `storage_key`. Purging a provider is:

```sql
SELECT storage_key FROM game_media WHERE provider = $1;
```

…followed by `deleteMany(keys)` against the object storage port and a row delete.
See `CATALOG_OPERATIONS.md` §4.
