# GMRLOG Sprint 8.2 — Tier Engine & Drag-and-Drop

**Sprint:** 8.2 — Tier Engine & Drag-and-Drop  
**Date:** 2026-07-18  
**Status:** **COMPLETE — Awaiting architectural review**  
**Contracts:** `TIERLIST_API.yaml` + Database Freeze v1.0.x + `API_ARCHITECTURE.md` + `SYSTEM_DESIGN.md`

**Out of scope:** Sprint 8.3 (discovery, search, likes/comments, engagement).

---

## OpenAPI compliance

| Method | Path | Status |
|--------|------|--------|
| POST | `/tierlists/{tierListId}/rows` | ✅ create + sparse `order` |
| PATCH | `/tierlists/{tierListId}/rows/{rowId}` | ✅ name/color/row order |
| DELETE | `/tierlists/{tierListId}/rows/{rowId}` | ✅ cascade items |
| POST | `/tierlists/{tierListId}/items` | ✅ add game into tier |
| PATCH | `/tierlists/{tierListId}/items/{itemId}` | ✅ move / same-tier reorder |
| DELETE | `/tierlists/{tierListId}/items/{itemId}` | ✅ remove |

**Not invented:** No separate bulk-reorder HTTP endpoint (none in OpenAPI). Bulk writes occur only as sparse **rebalance** inside a single Prisma transaction when gaps are exhausted.

---

## Ranking Engine / Sparse Ordering Review

| Aspect | Detail |
|--------|--------|
| Algorithm | **Shared** `common/ordering/sparse-ordering.engine.ts` |
| Gap | `TIERLIST_SORT_ORDER_GAP = 1024` (same as Lists) |
| Lists adapter | `list-ordering.engine.ts` re-exports shared engine with `LIST_SORT_ORDER_GAP` |
| Append | O(1) — `max + GAP` |
| Insert / move with gap | O(1) write — midpoint |
| Gap exhausted | O(n) rebalance assignments in one `$transaction` |
| Display `order` | **1-based** in API responses; storage is sparse `sortOrder` |

**Do not invent another ranking algorithm** — Tier Engine calls the same pure functions as Lists.

---

## Placement rules

1. **One game per Tier List** — enforced in app layer (`findGameOnList`). Freeze unique is only `(tierRowId, gameId)`.
2. **Move between tiers** (single transaction):
   - resolve target row ownership
   - compute target sparse position (exclude moved id)
   - update `tierRowId` + `sortOrder` (+ optional rebalance of target row)
   - touch `tierList.updatedAt`
3. **Same-tier reorder** — `MoveTierItem` with same `rowId` + `order` → `tierlist.reordered.v1`
4. **Cross-tier move** → `tierlist.item.moved.v1`

---

## Performance

| Op | Typical | Worst |
|----|---------|-------|
| Add / append | O(1) | O(n) rebalance |
| Move / reorder | O(1) | O(n) rebalance |
| Row create/reorder | O(1) | O(n) rebalance |

No N+1 on detail: `TIERLIST_DETAIL_INCLUDE` loads rows + items + `GameSummary` in one query.

---

## Cache

| Key | Behavior |
|-----|----------|
| `tierlist:{id}` | Invalidated on every row/item mutation |
| `tierlist:user:{userId}` | Invalidated with list |

No global flush. GET may re-warm PUBLIC detail cache after invalidation.

---

## Events

| Event | Trigger |
|-------|---------|
| `tierlist.item.added.v1` | add item |
| `tierlist.item.removed.v1` | remove item |
| `tierlist.item.moved.v1` | cross-tier move |
| `tierlist.reordered.v1` | same-tier item reorder; row create/reorder |

Publish-only. No Feed / Notification / Analytics.

---

## Architecture reuse

| Asset | Reuse |
|-------|-------|
| Sparse ordering | ✅ shared engine (Lists adapter unchanged behaviorally) |
| `ContainerPermissionService` | ✅ `assertCanManageItems` |
| `ContainerVisibilityResolver` | ✅ via GET detail |
| `TierListCacheService` | ✅ invalidate affected keys |
| `DomainEventPublisher` | ✅ |
| GameSummary | ✅ `GAME_SUMMARY_SELECT` / `toGameSummary` |

### Reuse metrics

| Metric | Value |
|--------|-------|
| New ranking algorithm LOC | **0** |
| Shared ordering engine | ✅ |
| Duplicated business logic vs Lists items | Structural parallel only; algorithm not copied |

---

## Security

- Controllers: zero authz
- Mutations: owner (via `assertCanManageItems`)
- Non-owner: 403
- Missing row/item/game: ProblemDetails 404 / 409 duplicate

---

## Testing summary

| Layer | Coverage |
|-------|----------|
| Unit | add / duplicate / move / reorder / remove + events |
| Integration | drag-and-drop path, row order, cache invalidate, events |
| E2E | HTTP engine flow + permission + duplicate |
| Regression | Lists `list-ordering.engine.spec` still green |

Validation: `prisma validate` ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit/integration ✅ · e2e ✅

---

## Known limitations

1. **No OpenAPI bulk reorder endpoint** — rebalance is internal only.  
2. **Freeze `(tierRowId, gameId)` unique** — list-wide uniqueness is app-enforced.  
3. **Row update response** returns `items: []` (full tree via GET detail).  
4. Discovery / search / likes / comments remain Sprint 8.3+.

---

## Sprint boundary

Sprint 8.2 **stops here**. Do **not** begin Sprint 8.3 until architectural review.
