# Catalog Operations Runbook

**Document:** `docs/18_CATALOG/CATALOG_OPERATIONS.md`
**Introduced:** D3.25
**Updated:** D3.25.1 — added `pnpm repair:index` (§7)

---

## 1. Health checks

**Coverage** — what fraction of the catalog is enriched:

```sql
SELECT metadata_status, count(*) FROM games GROUP BY metadata_status ORDER BY 2 DESC;
```

Also exposed as `gmrlog_catalog_metadata_coverage` on `/metrics`.

**Recent enrichment outcomes:**

```sql
SELECT provider, outcome, count(*), avg(duration_ms)::int
FROM game_metadata_runs
WHERE created_at > now() - interval '24 hours'
GROUP BY 1, 2 ORDER BY 3 DESC;
```

**Queue depth** — BullMQ `game.metadata` / `game.media` waiting + failed counts,
via the queue smoke script or a Redis client.

## 2. Common situations

### Catalog stuck at `pending`, nothing progressing

1. Is any provider enabled? `IGDB_CLIENT_ID`/`IGDB_CLIENT_SECRET` present in the
   **worker** environment, not just the API's? A fully unconfigured chain leaves
   everything `pending` by design and writes `outcome = 'skipped'` run rows.
2. Is the worker process running? Metadata workers run only in `worker.main.ts`.
3. Is Redis reachable? The publisher does not fall back to synchronous work
   (`METADATA_QUEUES.md` §3); enqueues are dropped and logged as
   `game.metadata.enqueue.failed` until Redis returns. The hourly backfill scan
   recovers everything once it does.

### High `failed` count

```sql
SELECT metadata_error, count(*) FROM games
WHERE metadata_status = 'failed' GROUP BY 1 ORDER BY 2 DESC LIMIT 20;
```

- `no provider match` on obscure titles is expected, not a defect. If it exceeds
  10% of the catalog, that is condition (1) in `METADATA_LICENSING.md` §4 for
  reconsidering RAWG.
- Transport errors clustered in time indicate a provider outage — no action
  needed; backfill retries.

### Games exceeded `METADATA_MAX_ATTEMPTS`

They are intentionally left alone. To retry after fixing the root cause:

```sql
UPDATE games SET metadata_attempts = 0, metadata_status = 'pending'
WHERE metadata_status = 'failed' AND metadata_attempts >= 5;
```

The next backfill scan picks them up.

### Force a refresh for one game

```sql
UPDATE games SET metadata_status = 'stale' WHERE id = '<gameId>';
```

Picked up by the next backfill scan (hourly). There is intentionally **no HTTP
endpoint** that triggers a provider call — that would reintroduce a request-path
dependency on a third party.

## 3. Rate limiting

IGDB is capped at `IGDB_RATE_LIMIT_RPS` (default `4`) inside each worker process.
This is a **per-process** bucket. Running N worker replicas multiplies effective
request rate by N. Before scaling workers horizontally, divide
`IGDB_RATE_LIMIT_RPS` by the replica count.

## 4. Provider purge / takedown

To remove all data sourced from one provider:

```sql
-- 1. Identify affected media
SELECT storage_key FROM game_media WHERE provider = 'rawg';
-- 2. Delete objects via the storage port (deleteMany), then:
DELETE FROM game_media WHERE provider = 'rawg';
-- 3. Reset affected games for re-enrichment from remaining providers
UPDATE games SET metadata_status = 'pending', metadata_provider = NULL,
       cover_key = NULL, hero_key = NULL
WHERE metadata_provider = 'rawg';
```

Then disable the provider in the worker environment and let backfill re-enrich
from the remaining chain.

## 5. Scaling the backfill

The default hourly batch of 200 with 4 rps clears roughly 4,800 games/day. To go
faster on a one-off catalog load, raise `METADATA_BACKFILL_BATCH_SIZE` — but the
provider rate limit, not the batch size, is the real ceiling. Raising the batch
above what the rate limit can drain in an hour simply grows queue depth.

## 6. Environment variables

All catalog variables are documented in
`docs/00_PROJECT/ENVIRONMENT_VARIABLES.md` under "Game catalog metadata (D3.25)".
Every one has a safe default; none is required for boot, tests, or CI.

## 7. Search reindexing and `pnpm repair:index` (D3.25.1)

**Automatic path:** a successful enrichment (`complete` or `partial`) now
triggers `SearchIndexPublisher.publishUpsert('game', gameId)` immediately
after the metadata transaction commits — no separate action needed. The
Meilisearch document gains `description` (from summary), `genres`, and
`coverKey`, and `description`/`genres` are searchable. A reindex failure is
logged (`game.metadata.search-reindex.failed`) and does not fail the
enrichment job — the catalog write already succeeded, and search staleness is
recoverable via the tool below.

**Manual reconciliation — `pnpm repair:index`:**

```bash
pnpm repair:index
```

Runs a full bidirectional reconciliation between Postgres and every
Meilisearch index (games, users, posts, reviews, collections, tier lists,
communities, events):

1. **Forward** — every active row in Postgres is upserted into its index.
   Fixes rows that were never indexed (this is what closed the Hollow
   Knight/Celeste drift found in the D3.25 review) and rows whose document is
   stale.
2. **Reverse** — every indexed document id is checked against the active-row
   set; anything not there (deleted, or never existed) is removed.

Read-only on Postgres, writes only to Meilisearch, safe to run repeatedly.
Prints a per-type summary and exits non-zero if any individual upsert/delete
failed (the run itself still completes — failures are per-row, not fatal to
the pass).

**When to run it:**
- After restoring Postgres from a backup that predates the last search sync.
- After a Meilisearch outage that coincided with catalog writes.
- As a periodic sanity check — it is cheap and idempotent, so there is no
  harm in scheduling it (not currently automated; a cron entry is a
  reasonable follow-up once there's evidence drift recurs).
- Closes `docs/00_PROJECT/SPRINT_0_PROJECT_AUDIT.md` risk R6/H10 (no
  reindex/backfill job existed).
