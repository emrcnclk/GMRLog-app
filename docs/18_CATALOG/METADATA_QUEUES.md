# Metadata Queue Topology

**Document:** `docs/18_CATALOG/METADATA_QUEUES.md`
**Introduced:** D3.25
**Registry:** `docs/06_BACKEND/BACKGROUND_JOBS.md`

---

## 1. Queues

| Queue constant | Name | Concurrency | Purpose |
|---|---|---|---|
| `QUEUE_GAME_METADATA` | `game.metadata` | `GAME_METADATA_WORKER_CONCURRENCY` (default `2`) | Provider lookup + apply |
| `QUEUE_GAME_MEDIA` | `game.media` | `GAME_MEDIA_WORKER_CONCURRENCY` (default `4`) | Download + mirror artwork |

Metadata concurrency is deliberately low — it is bounded by the provider rate
limit, not by CPU. Media concurrency is higher because it is I/O against our own
object storage.

## 2. Jobs

| Job constant | Name | Queue | Trigger |
|---|---|---|---|
| `JOB_GAME_METADATA_ENRICH` | `game.metadata.enrich` | `game.metadata` | New skeleton game, backfill scan, refresh scan, operator force |
| `JOB_GAME_METADATA_BACKFILL_SCAN` | `game.metadata.backfill.scan` | `game.metadata` | Repeatable, hourly |
| `JOB_GAME_METADATA_REFRESH_SCAN` | `game.metadata.refresh.scan` | `game.metadata` | Repeatable, daily 02:20 |
| `JOB_GAME_MEDIA_INGEST` | `game.media.ingest` | `game.media` | Emitted by the applier after commit |

## 3. Enqueue contract

`GameMetadataPublisher` follows the publisher conventions already proven in
`search-index.publisher.ts` and `integration-jobs.publisher.ts`:

```
jobId:            toBullJobId(`game.metadata:enrich:${gameId}:${reason}`)
attempts:         5
backoff:          exponential, 5000ms base
removeOnComplete: { age: 86400, count: 1000 }
removeOnFail:     false          // DLQ inspection
```

Deterministic `jobId` means a game already queued for the same reason is not
queued twice.

**Divergence from the search publisher, and why:** `SearchIndexPublisher` falls
back to *synchronous* execution when Redis is unavailable. `GameMetadataPublisher`
does **not**. A synchronous fallback would put a third-party HTTP call on the
request path, violating the sprint's central constraint. When Redis is down the
publisher logs `game.metadata.enqueue.failed` and returns; the game stays
`pending` and the next backfill scan picks it up once Redis recovers. Losing an
enqueue is recoverable by design — blocking a request is not.

## 4. Backfill scan

Runs hourly. One bounded pass:

1. Select up to `METADATA_BACKFILL_BATCH_SIZE` (default `200`) games where
   `metadata_status IN ('pending','stale')`
   `OR (metadata_status = 'failed' AND metadata_attempts < METADATA_MAX_ATTEMPTS)`.
2. Order: `pending` first, then `stale`, then `failed` by ascending
   `metadata_attempts` — fresh work outranks repeated failures.
3. Enqueue each with `reason: 'backfill'`.

The scan itself never calls a provider. It only enqueues, so it completes in
milliseconds regardless of catalog size.

## 5. Refresh scheduler

Runs daily at 02:20 UTC. Marks games as `stale` when
`metadata_refreshed_at < now() - METADATA_REFRESH_INTERVAL_DAYS` (default `30`),
bounded to `METADATA_REFRESH_BATCH_SIZE` (default `500`) per pass, then enqueues
them with `reason: 'refresh'`.

Registered in `SchedulerService` as BullMQ repeatables with deterministic
`jobId`s, matching the existing maintenance repeatables — re-registration on
every boot is idempotent.

Refresh never demotes a `complete` game to `failed` on a transient error; the
existing record survives and `metadata_error` records the reason.

## 6. Failure handling

| Failure | Behaviour |
|---|---|
| Provider transport error | Job throws → BullMQ retries (5, exponential) → on final failure `metadata_status='failed'`, `metadata_attempts++`, job retained for DLQ |
| No provider matched | Not an error. `metadata_status='failed'`, `metadata_error='no provider match'`, attempts incremented; eligible for later retry |
| No provider enabled | `metadata_status` unchanged (stays `pending`), run row records `skipped`. Not a failure — this is the zero-credential configuration |
| Media download error | Only that media row is skipped; metadata already committed. Media job retries independently |
| Game deleted mid-flight | Processor no-ops on a missing game |

Every attempt writes a `game_metadata_runs` row regardless of outcome, so
coverage and failure rates are queryable without reading logs.

## 7. Metrics

Exposed through the existing `/metrics` endpoint:

| Metric | Meaning |
|---|---|
| `gmrlog_catalog_games_total` | Catalog size |
| `gmrlog_catalog_metadata_coverage` | Fraction with `metadata_status='complete'` |
| `gmrlog_catalog_metadata_status{status}` | Count per status |
| `gmrlog_catalog_media_total{kind}` | Mirrored media rows per kind |

## 8. Worker registration

Both queues run in the dedicated worker process (`worker.main.ts` →
`WorkerModule`), dispatched by `GameCatalogWorkerService`, mirroring the
`IntegrationsWorkerService` pattern. The API process **publishes only** — it
never starts a metadata worker.
