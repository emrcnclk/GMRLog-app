# GMRLOG Sprint 8.4 — Tier List Engagement

**Sprint:** 8.4 — Tier List Engagement  
**Date:** 2026-07-18  
**Status:** **COMPLETE — Awaiting architectural review**  
**Contracts:** `TIERLIST_API.yaml` + Database Freeze v1.0.x + `API_ARCHITECTURE.md` + `CACHE_STRATEGY.md`

**Out of scope:** Sprint 8.5; discovery/ranking/AI (already in 8.3).

---

## OpenAPI review

### Implemented (Freeze-backed)

| Method | Path | Status |
|--------|------|--------|
| GET/POST | `/tierlists/{id}/comments` | ✅ |
| POST | `/tierlists/{id}/clone` | ✅ always `PRIVATE` |
| POST | `/tierlists/{id}/vote` | ✅ presence vote + `voteCount` |

### Documented but Freeze-blocked (not stubbed)

| Path | Blocker |
|------|---------|
| `POST/DELETE /tierlists/{id}/likes` | No `TierLike` junction (only `likeCount` denorm — cannot enforce uniqueness / idempotent unlike) |
| `POST/DELETE /tierlists/{id}/bookmark` | No `TierBookmark` table |
| `POST /tierlists/{id}/share` | No share-token / expiry persistence |
| `GET /tierlists/{id}/export` | No export job / signed-URL pipeline |
| Comment DELETE | Not in TIERLIST_API (only GET/POST); soft-delete column used as list filter only |
| `GET …/statistics` | Not in TIERLIST_API |

### Vote rating gap

OpenAPI `VoteTierListRequest.rating` (1–5) is **validated** and included in `tierlist.voted.v1` payload. Freeze `TierVote` has **no rating column** — rating is **not persisted**. Duplicate votes are idempotent via `@@unique([tierListId, userId])`.

---

## Database Freeze review

| Check | Result |
|-------|--------|
| Schema / migrations | **None** |
| `prisma validate` | ✅ |
| Used tables | `TierComment`, `TierVote`, clone via `TierList` / `TierRow` / `TierItem` |
| Soft delete | `TierComment.deletedAt` filtered on list |
| Like / bookmark | **Absent** — documented blockers |

---

## Architecture reuse

| Layer | Pattern |
|-------|---------|
| Comments | Mirror Lists (`TierListComment*`); not Review `Comment` table |
| Vote | `TierListEngagementRepository` + transactional `voteCount` |
| Clone | Single `$transaction` in `TierListRepository.clone` |
| Visibility | `TierListVisibilityService` → `ContainerVisibilityResolver` |
| Permission | Unchanged Container path for ownership writes |
| Controllers | Thin — zero authorization logic |
| Discovery | Unchanged; engagement invalidates discovery keys via `TierListCacheService` |

### Reuse metrics

| Metric | Value |
|--------|-------|
| Reused services | `ContainerVisibilityResolver`, `DomainEventPublisher`, `TierListQueryService`, `TierListCacheService`, `DiscoveryCacheService` |
| Reused patterns | List comment/clone txn shapes; ProblemDetails |
| Visibility/permission duplication | **0 LOC** |
| Structural parallel vs Lists engagement | **~120–160 LOC** (comments + engagement + clone) |

---

## Security review

| Surface | Rule |
|---------|------|
| Comment / vote / clone | Must `canView` (block/mute/visibility) else 404 |
| Private engagement | Denied for non-owner |
| Controllers | No authz logic |
| Errors | ProblemDetails |

---

## Cache review

| Key | Invalidation |
|-----|----------------|
| `tierlist:{id}` | Comment create, vote, clone create, existing CRUD |
| `tierlist:user:{userId}` | Same |
| `tierlist:featured` / `discover:{hash}` | Via `invalidateKinds` on mutation |

Only PUBLIC detail is cached on set (unchanged).

---

## Event review

| Event | When |
|-------|------|
| `tierlist.comment.created.v1` | Comment create |
| `tierlist.voted.v1` | First vote only (`created`) |
| `tierlist.cloned.v1` | Successful clone |

No Feed / Notification / Analytics calls.

---

## Performance review

- Comment list: single `findMany` + user include; cursor pagination.
- Vote: one transaction (create + increment).
- Clone: one transaction loading source rows/items then nested create — no N+1 after clone (detail include once).

---

## Known limitations

1. **Like / bookmark** OpenAPI endpoints blocked until Freeze adds junction tables.
2. **Vote rating** not stored.
3. **Share / export** deferred (same as Lists 7.4).
4. **No comment DELETE** route in OpenAPI.
5. **No statistics** endpoint in TIERLIST_API.
6. `bookmarks` / `views` on `TierList` entity remain documented zeros.

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `typecheck` | ✅ |
| `build` | ✅ |
| `eslint` (tier-lists + engagement e2e) | ✅ |
| Unit / integration (`src/tier-lists`) | ✅ 31 tests |
| E2E (`tierlist-engagement.e2e-spec.ts`) | ✅ |

---

## Stop

Sprint 8.4 complete. **Do not begin Sprint 8.5** until architectural review.
