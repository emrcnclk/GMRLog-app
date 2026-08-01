# D3.25.1 — Final Patch Sprint

**Document:** `docs/18_CATALOG/D3_25_1_PATCH_PLAN.md`
**Status:** IN PROGRESS → see `D3_25_1_COMPLETION_REPORT.md` on close
**Opened:** 2026-07-31
**Trigger:** `docs/18_CATALOG/D3_25_COMPLETION_REPORT.md` was reviewed and
**rejected** — live verification found D3.25 mechanically correct but
functionally incomplete: enrichment never reaches Meilisearch, two catalog
games were never indexed at all, and there was no tooling to detect or fix
that class of drift automatically.

## Objectives (verbatim from the review)

1. Wire `SearchIndexPublisher` into `GameMetadataService` after successful enrichment.
2. Implement automatic Meilisearch reindex after metadata updates.
3. Add `pnpm repair:index` to reconcile PostgreSQL ↔ Meilisearch drift.
4. Fix the existing Hollow Knight/Celeste indexing drift.
5. Remove all dead code identified in the verification report.
6. Re-run the full production gate and only mark D3.25 COMPLETE when all verification items pass.

## Scope decisions

**Objectives 1 and 2 are one change, not two.** Wiring the publish call alone
would reindex the same three-field skeleton document (`title`, `slug`, `id`)
forever — the reindex would fire, but nothing would actually change in
Meilisearch, which is the exact "metadata exists but search still shows old
data" failure this patch exists to prevent. So this patch also extends the
`game` document with a `description` field (sourced from `summary`, falling
back to `description`) and adds it to `games.searchableAttributes`. Full
genre/tag faceted search (filterable attributes, frontend UI) is out of scope
— that belongs to the Discovery Polish sprint in the audit roadmap, and adding
it here would be scope creep beyond "fix the sneaky bug."

**Objective 3 is scoped to all eight `SearchHitType`s, not just games.**
"Reconcile PostgreSQL ↔ Meilisearch drift" was stated generally, and the
Sprint 0 audit already flagged the absence of any reindex/backfill job as a
named risk (R6/H10). Closing it generically, once, is cheaper than closing it
twice.

**Objective 4 falls out of objective 3 by construction** — running the repair
script's forward pass (Postgres → Meili) picks up any active row missing from
its index, which is exactly Hollow Knight's and Celeste's condition. No
special-cased fix for those two titles.

**Objective 5 — one item is corrected, not just executed.** Re-verifying the
four "unused type export" findings from the prior report against
`packages/types/src/index.ts` itself (not just against `apps/backend/src`,
which is what the original grep covered) shows all four are used as field
types on `GameResponse`/`GameMediaResponse`/`GameMetadataProjection` *within
that same file*. That was a false positive in the prior audit — the original
check never grepped the file that defines them. This patch corrects the
record rather than silently deleting types that are actually load-bearing.

The two dead `GameMediaKind` enum values (`logo`, `trailer`) are **not**
removed. Postgres has no `DROP VALUE` for enum types — removing one requires
recreating the type and rewriting every row, a destructive, lock-heavy
operation for zero behavioral gain, and it would violate this project's own
additive-migration discipline for a migration that already shipped and was
verified against a live database. They're left in place as reserved,
forward-compatible taxonomy (consistent with `banner`/`video`, which predate
D3.25 and were *also* always unused — this is an existing, accepted pattern in
this schema, not a new one). Documented in-schema so a future reader doesn't
mistake it for an oversight.

The one genuinely dead, safely-removable item — the redundant
`export { GameCatalogWorkerService }` re-export in `metadata.module.ts` — is
removed.

## Work breakdown

| # | Item | Files |
|---|---|---|
| 1 | `GameMetadataService` calls `SearchIndexPublisher.publishUpsert('game', gameId)` after a successful (complete/partial) apply, non-fatal on failure | `game-metadata.service.ts` |
| 2 | Game Meili document gains `description`; `games` searchable attributes gain it too | `search-index.service.ts`, `meili.types.ts` |
| 3 | `MeiliClientService.listDocumentIds` — paginated doc-id listing per index | `meili.client.ts` |
| 3 | `SearchRepairService.repairAll()` — per-type forward (upsert active) + reverse (delete orphans) pass | new `search-repair.service.ts` |
| 3 | Standalone bootstrap + `pnpm repair:index` | new `repair-index.main.ts`, `search-repair.module.ts`, package.json scripts (root + backend) |
| 4 | Run the script live against the dev stack | — (operational step) |
| 5 | Remove redundant re-export; add reserved-value schema comments | `metadata.module.ts`, `schema.prisma` |
| 6 | Tests for all of the above; full suite + coverage; full production gate re-run | various `*.spec.ts` |

## Exit criteria

- `SearchRepairService` unit-tested; `repair:index` run live shows Hollow
  Knight and Celeste indexed afterward, verified directly against Meili.
- A live enrichment (real or simulated) results in the Meili document's
  `description` field changing — proven by an `orderedAt`/content diff, not
  just "the call was made."
- Full backend + database suites green, coverage threshold held.
- D3.24 gate re-run clean (no regression).
- D3.25 smoke gate re-run clean.
- `docs/18_CATALOG/D3_25_1_COMPLETION_REPORT.md` written, and only then does
  D3.25 move from "gate PASS, review rejected" to actually COMPLETE.
