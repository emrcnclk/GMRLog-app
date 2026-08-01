# GMRLOG Sprint 7.2 — List Ranking Engine

**Sprint:** 7.2 — List Ranking Engine  
**Date:** 2026-07-17  
**Status:** **COMPLETE — Awaiting architectural review**  
**Contracts:** `LIST_API.yaml` + Database Freeze + `API_ARCHITECTURE.md`  

**Architectural decision (carried from 7.1 review):** composition over inheritance — no `AbstractContainerService` subclassing.

**Out of scope:** Sprint 7.3 (discovery, social, comments, clone, export, etc.)

---

## OpenAPI compliance

| Method | Path | Status |
|--------|------|--------|
| GET | `/lists/{listId}/items` | ✅ |
| POST | `/lists/{listId}/items` | ✅ insert / append |
| PATCH | `/lists/{listId}/items/{gameId}` | ✅ move via `rank` + note |
| DELETE | `/lists/{listId}/items/{gameId}` | ✅ |
| PATCH | `/lists/{listId}/reorder` | ✅ bulk reorder |

**Not invented:** No separate `/move` endpoint — move is `UpdateListItemRequest.rank` per LIST_API.

---

## Ordering algorithm

**Sparse integer `sortOrder`** with gap `LIST_SORT_ORDER_GAP = 1024`.

| Operation | Strategy |
|-----------|----------|
| Append | `max(sortOrder) + GAP` — O(1) write |
| Insert / move | Midpoint between neighbors when gap exists — O(1) write |
| Gap exhausted | Full sparse rebalance of affected list — O(n) writes in one transaction |
| Bulk reorder | Assign `(index+1)*GAP` for entire permutation — O(n) writes, one transaction |

API `rank` is **1-based display position**. Internal storage is sparse `sortOrder`. Response `rank` is recomputed from ordered position.

Pure engine: `list-ordering.engine.ts` (unit-tested, no Prisma).

---

## Complexity / Performance

| Op | Typical | Worst |
|----|---------|-------|
| Append | O(1) | O(1) |
| Move / insert with gap | O(1) write | O(n) rebalance |
| Bulk reorder | O(n) | O(n) |

No O(n²). Updates batched via `Promise.all` inside a single Prisma `$transaction`.

---

## Transactions

Every mutate path uses `prisma.$transaction`:

* add (+ optional rebalance) + `itemCount++`
* update / move (+ optional rebalance) + touch `updatedAt`
* remove + `itemCount--`
* bulk reorder + touch `updatedAt`

No partial reorder states.

---

## Optimistic locking

**Limitation documented:** `LIST_API` `ReorderListRequest` / item update schemas expose **no** `version`, `updatedAt`, or `If-Match` precondition.

Freeze has `lists.updatedAt` but no API contract to honor it. **No invented schema.** Concurrent writers can last-write-win until OpenAPI adds a precondition.

---

## Cache

Item mutations invalidate **only**:

* `list:{id}`
* `userLists:{userId}`

No bulk flush / no discover keys.

---

## Events (domain publish only)

* `list.item.added.v1`
* `list.item.removed.v1`
* `list.reordered.v1` (move + bulk)

No Feed / Notification / Analytics calls.

---

## Architecture reuse

| Layer | Reuse |
|-------|-------|
| Permission | `ListPermissionService.assertCanManageItems` → `ContainerPermissionService` |
| Visibility | `ListItemQueryService` → `ListQueryService.getById` → `ContainerVisibilityResolver` |
| Ownership | `ContainerOwnershipResolver` via permission resolveRole |
| GameSummary mapping | Shared `GAME_SUMMARY_SELECT` / `toGameSummary` |
| Events | Shared `DomainEventPublisher` |
| List CRUD cache helper | `ListCacheService` |

### Architecture Reuse metrics

| Metric | Value |
|--------|-------|
| Reused Services | `ContainerPermissionService`, `ContainerVisibilityResolver` (via ListQuery), `DomainEventPublisher` |
| Reused Repository patterns | Prisma tx + GameSummary select (not Collection copy-paste) |
| Reused Permission | ✅ `assertCanManageItems` |
| Reused Visibility | ✅ via get-by-id gate on GET items |
| Duplicated LOC vs Collection items | **~0 intentional copy** — List-native ranking engine; Collection has no reorder API |
| Composition (not inheritance) | ✅ |

---

## Database Freeze

**No migration.** Uses existing `list_items.sort_order`, `note`, `game_id`, `lists.item_count`.

---

## Known limitations

1. **No optimistic locking precondition** in OpenAPI — last-write-wins.
2. **`rating`** on ListItem is OpenAPI-only — Freeze has no column; always returned as `null`; input silently ignored.
3. **GET items** has no cursor query params in OpenAPI — returns full ordered page (`hasNext: false`). Soft cap `LIST_ITEMS_MAX = 500` on add.
4. **No DB unique** on `(listId, gameId)` — uniqueness enforced in application layer.
5. **Owner-only** item management (no ListMember in Freeze).

---

## Test summary

| Suite | Coverage | Result |
|-------|----------|--------|
| Unit ordering engine | append, midpoint, rebalance, move first/last/middle | ✅ |
| Unit ListItemService | add, duplicate, move, bulk, permission | ✅ |
| Integration | move / bulk / cache / events / itemCount | ✅ |
| E2E | add, move, reorder, dup/invalid ids, 403, remove, cache, events | ✅ |

**Lists suite:** 23 unit+integration · **e2e ranking:** 1  

### Verification (2026-07-17)

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ (no new migration) |
| `typecheck` / `build` | ✅ |
| eslint `src/lists/**` | ✅ |
| unit + integration | 23/23 |
| e2e `list-ranking.e2e-spec.ts` | 1/1 |

---

**Do not begin Sprint 7.3 until architectural review is approved.**
