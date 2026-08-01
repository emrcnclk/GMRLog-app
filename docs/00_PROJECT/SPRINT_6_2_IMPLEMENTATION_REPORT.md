# GMRLOG Sprint 6.2 — Collection Items Implementation Report

**Sprint:** 6.2 — Collection Items  
**Date:** 2026-07-16  
**Status:** **COMPLETE — Awaiting review**  
**Contracts:** `COLLECTION_API.yaml` (HTTP) + Database Freeze v1.0.3 + System Design  

**Out of scope (Sprint 6.3+):** follow/like, members, collaboration workflow, sharing, discovery, export/duplicate, Lists, Tier Lists  

---

## Implemented endpoints

| Method | Path | Auth | Operation |
|--------|------|------|-----------|
| GET | `/api/v1/collections/{collectionId}/games` | Optional JWT | List games (`GameSummaryPage`, cursor) |
| POST | `/api/v1/collections/{collectionId}/games` | JWT | Add game → `201` (empty body) |
| DELETE | `/api/v1/collections/{collectionId}/games/{gameId}` | JWT | Remove game → `204` |

No reorder or update-item endpoints exist in OpenAPI — none implemented.

---

## Architecture decisions

```text
CollectionsController
        │
        ├── writes → CollectionItemService
        │              ├── ownership via CollectionRepository
        │              ├── CollectionItemRepository ($transaction)
        │              ├── CollectionItemCacheService
        │              └── DomainEventPublisher
        │
        └── reads  → CollectionItemQueryService
                       ├── CollectionQueryService.getById (visibility)
                       ├── CollectionItemQueryRepository
                       └── CollectionItemCacheService
```

* Controllers stay thin.  
* Persistence model: Prisma **`CollectionGame`** (`collection_games`).  
* OpenAPI `order` ↔ Freeze `sortOrder`; `note` ↔ `note`; insertion time ↔ `createdAt`.  
* List response is **`GameSummary` only** — junction `note`/`sortOrder` are not exposed (not in OpenAPI response).

### Architectural Decision — `favorite` / `completed`

`AddGameRequest` documents `favorite` and `completed`, but **Database Freeze has no columns** on `CollectionGame`.

**Decision:** accept on the wire (DTO) for OpenAPI client compatibility; **do not persist**.  
These belong to other domains:

| Field | Owning domain |
|-------|----------------|
| `favorite` | Gaming Identity / User favorites |
| `completed` | Game Log / Game Progress |

Duplicating play-state inside Collections would violate SSOT and create inconsistency.

**Recommendation:** next OpenAPI revision should remove `favorite`/`completed` from `AddGameRequest`, or document them as request-only enrichment hooks that never write CollectionGame. If responses need them later, enrich from Game Log / Identity — never mirror into `collection_games`.

---

## Repository strategy

| Layer | Role |
|-------|------|
| `CollectionItemRepository` | `gameExists`, membership check, max `sortOrder`, transactional add (+`gameCount`), transactional remove (−`gameCount`) |
| `CollectionItemQueryRepository` | Cursor list by `(sortOrder asc, id asc)` with Game batched via `include` (`GAME_SUMMARY_SELECT`) |
| `CollectionItemMapper` | `CollectionGame` + Game → OpenAPI `GameSummary` via `toGameSummary` |

Duplicate prevention: unique `(collectionId, gameId)` + pre-check + `P2002` → `GAME_ALREADY_IN_COLLECTION` (409).

Ordering: explicit `order` if provided; otherwise append `max(sortOrder)+1`. No invented ranking algorithm. No separate reorder API.

---

## Cache strategy

| Key | Behavior |
|-----|----------|
| `collectionItems:{collectionId}` | Default first page (`limit=20`, no cursor) |
| `collection:{id}` / `userCollections:{userId}` | Invalidated on add/remove (gameCount changes) |

Invalidation targets only the affected collection + owner list keys.

---

## Event strategy

| Event | When |
|-------|------|
| `collection.item.added.v1` | After successful add |
| `collection.item.removed.v1` | After successful remove |

Payload includes `collectionId`, `gameId`, `userId` (+ `sortOrder` on add).  
No Feed / Notification / Analytics direct calls.  
`collection.item.reordered.v1` not emitted — no reorder endpoint in contract.

---

## Visibility & security

| Operation | Rules |
|-----------|--------|
| GET games | Same visibility policy as get collection (`PUBLIC` / `FOLLOWERS` / `PRIVATE` → non-viewer gets `404`) |
| POST / DELETE | JWT + **owner only** (`403` for non-owner) |
| Game ref | Must exist and `isPublished: true` → else `GAME_NOT_FOUND` |

ProblemDetails codes used: `COLLECTION_NOT_FOUND`, `COLLECTION_FORBIDDEN`, `GAME_NOT_FOUND`, `GAME_ALREADY_IN_COLLECTION`, `VALIDATION_FAILED`, `INVALID_CURSOR`.

---

## OpenAPI compliance

| Contract element | Status |
|------------------|--------|
| Three item endpoints | ✅ |
| Cursor + limit on GET | ✅ (`sortOrder`+`id` cursor) |
| `GameSummaryPage` response | ✅ |
| Add `gameId` / `note` / `order` | ✅ persisted |
| Add `favorite` / `completed` | ⚠️ accepted, **not persisted** (OpenAPI modeling issue) |
| POST `201` empty | ✅ |
| DELETE `204` | ✅ |
| Reorder / PATCH item | N/A (not documented) |

---

## Database Freeze compliance

| Freeze surface | Status |
|----------------|--------|
| `CollectionGame` columns only | ✅ |
| No new migration | ✅ |
| No new Prisma fields | ✅ |
| `@@unique([collectionId, gameId])` | ✅ enforced |
| `gameCount` denormalized counter | ✅ ±1 in same transaction |
| `createdAt` preserved on insert | ✅ |
| Soft-delete parent still filters lists | ✅ via alive collection checks |

---

## Test summary

| Suite | Coverage | Result |
|-------|----------|--------|
| Unit `CollectionItemService` | add, order, duplicate, missing game, auth, remove, events; favorite/completed not written | ✅ |
| Unit `CollectionItemQueryService` | visibility gate, GameSummary shape, cache hit, cursor | ✅ |
| Integration | note/sortOrder persistence, duplicate, gameCount, cache invalidation, events | ✅ |
| E2E | add/list/duplicate 409 / non-owner 403 / private 404 / remove / gameCount | ✅ |
| Collections suite total | 22 unit+integration + 1 e2e file | ✅ |

### Verification commands (2026-07-16)

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint `src/collections/**` + `test/collection-items.e2e-spec.ts` | ✅ |
| full `pnpm --filter @gmrlog/api lint` | ❌ pre-existing errors outside Sprint 6.2 (reviews/social/users e2e, etc.) |

---

## Known limitations

1. **OpenAPI `favorite` / `completed`** — modeling issue; not Freeze fields; ignored on write.  
2. **No reorder / update-item HTTP ops** — not in `COLLECTION_API.yaml`.  
3. **List does not return `note` or `order`** — response is `GameSummary` only.  
4. **`COLLECTION_PRIVATE` error code** — not returned; private visibility still uses `COLLECTION_NOT_FOUND` (same anti-enumeration policy as Sprint 6.1).  
5. Sprint 6.3 features intentionally omitted.

**Do not begin Sprint 6.3 until this report is reviewed and approved.**
