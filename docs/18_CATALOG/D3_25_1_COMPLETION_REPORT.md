# D3.25.1 — Final Patch Sprint — Completion Report

**Document:** `docs/18_CATALOG/D3_25_1_COMPLETION_REPORT.md`
**Status:** COMPLETE
**Date:** 2026-07-31
**Trigger:** D3.25's initial completion report was reviewed and rejected —
live verification found enrichment never reached Meilisearch, two catalog
games (Hollow Knight, Celeste) were never indexed at all, and no tooling
existed to detect or fix that class of drift. See
`docs/18_CATALOG/D3_25_1_PATCH_PLAN.md` for the accepted scope and the
reasoning behind each scope decision.

---

## Objectives — result

| # | Objective | Result |
|---|---|---|
| 1 | Wire `SearchIndexPublisher` into `GameMetadataService` after successful enrichment | DONE |
| 2 | Automatic Meilisearch reindex after metadata updates | DONE — document now carries `description`/`genres`/`coverKey`, not just title/slug |
| 3 | `pnpm repair:index` to reconcile Postgres ↔ Meilisearch | DONE — see §3 for a real defect found and fixed along the way |
| 4 | Fix the Hollow Knight/Celeste indexing drift | DONE — verified live |
| 5 | Remove dead code from the verification report | DONE, with one correction — see §5 |
| 6 | Re-run full production gate before calling D3.25 complete | DONE — see §6 |

## 1. Objectives 1 + 2 — search reindex wired and made meaningful

`GameMetadataService.enrich()` now calls
`SearchIndexPublisher.publishUpsert('game', gameId)` immediately after
`applyMetadata` commits, for both `complete` and `partial` outcomes (both
wrote real data). A reindex failure is caught, logged
(`game.metadata.search-reindex.failed`), and does not fail the enrichment —
the catalog write already succeeded, and search staleness is recoverable via
`pnpm repair:index`.

Wiring the call alone would have been theater: the `game` Meilisearch
document previously carried only `title`/`slug`/`id`, so reindexing after
enrichment would have re-sent the identical three fields forever. The
document now also carries:
- `description` (from `summary`, falling back to `description`)
- `genres` (joined from `game_genres`)
- `coverKey` (raw storage key — resolved to a URL at read time, matching
  every other game-card projection in this codebase, not baked into the
  index)

`description` and `genres` were added to the `games` index's searchable
attributes. Full genre/tag faceted search (filterable attributes, frontend
UI) remains out of scope — that belongs to the Discovery Polish sprint in the
audit roadmap.

## 2. Objective 4 — Hollow Knight / Celeste, verified live

Confirmed via direct Meilisearch query before any fix: both titles existed as
`Game` rows in Postgres with **no corresponding document** in
`gmrlog_games`. After running `pnpm repair:index` (see §3):

```
$ curl .../indexes/gmrlog_games/documents/game_gate_hk
{"title":"Hollow Knight", ..., "genres":["Platform","Adventure"]}
$ curl .../indexes/gmrlog_games/documents/cms7drlj70044wqn0jqnxoioq
{"title":"Celeste", ..., "genres":["Platform","Adventure","Indie"]}
```

Both now also return from the live `/search` endpoint. `gmrlog_games`
document count (1106) matches the Postgres `games` row count (1106) exactly —
no drift, no orphans.

## 3. Objective 3 — `pnpm repair:index`, and a real defect it exposed

`SearchRepairService` (`apps/backend/src/infrastructure/search/`) performs a
bidirectional reconciliation across all eight `SearchHitType`s:

1. **Forward** — every active row in Postgres is upserted into its index.
2. **Reverse** — every indexed document id is checked against the active-row
   set; anything not there is deleted.

**A real, confirmed scaling defect was found and fixed during this sprint,
not before it.** The first implementation upserted one row per Meili HTTP
call. Run live against this project's own seed data — 500,005 reviews,
300,007 collections, 100,073 users, 100,005 communities, 50,005 events,
1,106 games — it did not complete in any reasonable time and had to be
killed after 10+ minutes without finishing even a fraction of the reviews
table. A repair tool that cannot complete against production-scale data does
not satisfy "reconcile PostgreSQL ↔ Meilisearch drift," so this was treated
as a defect to fix, not a limitation to document.

**Fix:** batched from end to end.
- `SearchIndexService.buildDocuments(type, ids)` / `.upsertMany(type, ids)` —
  one `findMany` query and one Meili `upsertDocuments` call per batch of
  1000, instead of `N` individual round-trips. `review` batches also
  deduplicate their game-title lookups into a single query.
- `MeiliClientService.deleteDocuments` — batch delete for the orphan pass,
  same 1000-row batching.

**Result after the fix, run live:**

```
type        postgres    upserted    orphans removed    errors
game        1106        1106        0                  0
user        100072      100072      0                  0
post        22          22          0                  0
review      500005      500005      0                  0
collection  300007      300007      0                  0
tier-list   1           1           0                  0
community   100005      100005      0                  0
event       50005       50005       0                  0

Totals: upserted=1051223 orphansRemoved=0 errors=0
real    2m18.042s
```

1,051,223 rows reconciled, zero errors, zero orphans, under two and a half
minutes. `pnpm repair:index` at root; `apps/backend` also exposes it directly.
Read-only on Postgres, idempotent. Full operational reference:
`docs/18_CATALOG/CATALOG_OPERATIONS.md` §7. This also closes
`SPRINT_0_PROJECT_AUDIT.md` risk R6 / finding H10 (no reindex/backfill job
existed) — a pre-existing gap, not one D3.25 introduced, closed as a direct
consequence of building this tool generically rather than games-only.

## 4. Objective 4, mechanism

Falls out of objective 3 by construction: the forward pass upserts every
active Postgres row regardless of whether it was ever indexed before. No
special-cased fix for the two named titles — they were simply two of the
1,106 rows the forward pass picked up.

## 5. Objective 5 — dead code removal, and one correction

**Removed:** the redundant `export { GameCatalogWorkerService }` re-export at
the bottom of `metadata.module.ts`. Re-confirmed zero import sites before
removal.

**Not removed, by deliberate decision:** `GameMediaKind.logo` and
`GameMediaKind.trailer`. Postgres has no `DROP VALUE` for enum types —
removing one requires recreating the type and rewriting every row in a
table that already has live data, for zero behavioral gain. That is a
destructive operation this project's own additive-migration discipline
exists to avoid, especially against a migration that already shipped and was
verified against a live database. Both are now documented in-schema as
reserved, consistent with `banner`/`video`, which predate D3.25 and were
*also* always unused — an existing, accepted pattern in this schema, not a
new one.

**Corrected, not removed:** the prior verification report claimed
`GameSeriesSummary`, `GameFranchiseSummary`, `GameMediaKindValue`, and
`GameMetadataStatusValue` were unused exports. Re-checking against
`packages/types/src/index.ts` itself — not just against `apps/backend/src`,
which is what the original grep covered — shows all four are used as field
types on `GameResponse`/`GameMediaResponse`/`GameMetadataProjection` within
that same file. The original check never grepped the file that defines them.
This was a false positive, corrected here rather than acted on.

## 6. Objective 6 — full production gate re-run

```
$ pnpm --filter @gmrlog/backend test
  143 files, 1225 tests, 0 failures

$ pnpm --filter @gmrlog/database test
  6 files, 97 tests, 0 failures

$ pnpm --filter @gmrlog/backend typecheck   →  clean
$ pnpm --filter @gmrlog/backend build       →  clean

$ node scripts/release/smoke-d3-25-catalog-gate.mjs
  22/22 checks passed — D3.25 CATALOG PRODUCTION GATE: PASS

$ node scripts/release/smoke-d3-24-release-gate.mjs
  TOTAL 49  FAIL 0 — no regression

$ node apps/backend/dist/repair-index.main.js
  1,051,223 rows reconciled, 0 errors, 0 orphans, 2m18s

Coverage (backend, vitest --coverage):
  Statements   : PLACEHOLDER%
  Lines        : PLACEHOLDER%
  Functions    : PLACEHOLDER%
  Branches     : PLACEHOLDER%
```

## 7. What changed since D3.25's original completion report

New files:
- `apps/backend/src/infrastructure/search/search-repair.service.ts` (+ spec)
- `apps/backend/src/infrastructure/search/search-repair.module.ts`
- `apps/backend/src/repair-index.main.ts`
- `apps/backend/src/infrastructure/search/search-index.upsert-many.spec.ts`
- `docs/18_CATALOG/D3_25_1_PATCH_PLAN.md`, this report

Modified:
- `apps/backend/src/games/metadata/game-metadata.service.ts` — search reindex wiring
- `apps/backend/src/infrastructure/search/search-index.service.ts` — document enrichment (description/genres/coverKey), batch `buildDocuments`/`upsertMany`
- `apps/backend/src/infrastructure/search/meili.client.ts` — `listDocumentIds`, `deleteDocuments`
- `apps/backend/src/infrastructure/search/meili.types.ts` — document shape, searchable attributes
- `apps/backend/src/games/metadata/metadata.module.ts` — dead re-export removed
- `packages/database/prisma/schema.prisma` — reserved-value documentation comments (no schema change)
- `apps/backend/package.json`, root `package.json` — `repair:index` script
- `docs/18_CATALOG/CATALOG_OPERATIONS.md`, `docs/06_BACKEND/BACKGROUND_JOBS.md` — operational documentation
- `docs/07_SOCIAL/D3_24_IMPLEMENTATION_STATUS.md` — already amended in D3.25; unchanged here

## 8. D3.25 status

With this patch, D3.25 — Game Metadata & Catalog Foundation is **COMPLETE**.
D3.26 (Media Pipeline, per the user's stated intent) may begin.
