# GMRLOG Sprint 6.3 — Collection Sharing & Discovery Implementation Report

**Sprint:** 6.3 — Collection Sharing & Discovery  
**Date:** 2026-07-16  
**Status:** **COMPLETE — Awaiting architectural review**  
**Contracts:** `COLLECTION_API.yaml` (HTTP) + Database Freeze v1.0.3 + ADR-0007  

**Out of scope (Sprint 6.4+):** members/collaboration workflow, comments, export, duplicate, statistics, activity, Lists, Search `/search/collections`, Social `POST /share`

---

## Implemented endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| GET | `/api/v1/collections/featured` | Public | Engagement proxy (no Freeze `featured` column) |
| GET | `/api/v1/collections/trending` | Public | LikeCount + recency proxy |
| POST | `/api/v1/collections/{id}/follow` | JWT | `204` idempotent |
| DELETE | `/api/v1/collections/{id}/follow` | JWT | `204` |
| POST | `/api/v1/collections/{id}/likes` | JWT | `204` |
| DELETE | `/api/v1/collections/{id}/likes` | JWT | `204` |
| GET | `/api/v1/collections/{id}/followers` | Optional JWT | Cursor `UserPage` |
| GET | `/api/v1/collections/{idOrSlug}` | Optional JWT | **Slug additive** on existing get path |

---

## Architecture

```text
CollectionsController
        │
        ├── CollectionDiscoveryService
        │      ├── CollectionDiscoveryRepository (follow/like tx + counters)
        │      ├── CollectionDiscoveryQueryRepository (featured/trending/followers/slug)
        │      ├── CollectionQueryService (visibility gate)
        │      ├── CollectionVisibilityService
        │      └── CollectionCacheService
        │
        ├── CollectionQueryService
        │      └── CollectionVisibilityService ← PrivacyService + SocialGraphService
        │
        └── CollectionService (visibility.changed event on update)
```

* Controllers remain thin.  
* CQRS preserved (discovery write vs query repositories).  
* Owner profile continues via `COLLECTION_DETAIL_INCLUDE` batch include (no N+1).

---

## Visibility & security

`CollectionVisibilityService` is the single gate:

| Rule | Behavior |
|------|----------|
| Owner | Always allowed |
| Block (either way) | Deny → `COLLECTION_NOT_FOUND` |
| Mute (viewer→owner) | Deny → `COLLECTION_NOT_FOUND` |
| PUBLIC | Allowed |
| PRIVATE | Owner only |
| FOLLOWERS | `PrivacyService.isFollowerOf` (no duplicated follow logic) |

Anti-enumeration: denied reads still return `404 COLLECTION_NOT_FOUND` (same as 6.1/6.2).

---

## Slug

* Freeze `slug` unique nullable.  
* `GET /collections/{collectionId}` accepts **UUID or slug** (slugify-normalized).  
* No new OpenAPI path invented (`/collections/slug/...` does not exist in contract).  
* Cache: `collection:slug:{slug}`.

---

## Cache

| Key | Use |
|-----|-----|
| `collection:{id}` | Detail |
| `collection:slug:{slug}` | Slug lookup |
| `userCollections:{userId}` | Owner list first page |
| `discoverCollections:{hash}` | Featured / trending (`hash` of `{ kind }`) |

Invalidation on create/update/delete/follow/like touches affected id, owner list, slug, and discovery hashes.

---

## Events

| Event | When |
|-------|------|
| `collection.created.v1` / `.updated.v1` / `.deleted.v1` | Existing |
| `collection.visibility.changed.v1` | Visibility field changes on PATCH |
| Follow/like | Emit `collection.updated.v1` with `action` payload (counter change) |

**Not emitted:** `collection.shared.v1` — share lives in `SOCIAL_API` (`POST /share`), not `COLLECTION_API`. Documented limitation.

No direct Feed / Notification calls.

---

## OpenAPI compliance

| Item | Status |
|------|--------|
| Featured / trending / follow / like / followers | ✅ |
| Empty 204 mutations | ✅ |
| CollectionPage / UserPage shapes | ✅ |
| Separate slug route | N/A (not in YAML) — additive resolve on get |
| `featured` response boolean | ❌ Freeze gap — omitted (not invented) |
| Search / share / user public lists | Out of COLLECTION_API — not in sprint |

---

## Database Freeze compliance

| Surface | Status |
|---------|--------|
| `CollectionFollower` / `CollectionLike` | ✅ used |
| No new migration / columns | ✅ |
| No `featured` column | ✅ heuristic proxy only |
| Counters `followerCount` / `likeCount` | ✅ transactional ±1 |
| ADR-0007 (no user game state) | ✅ unchanged |

---

## Performance

* Featured/trending: single query + owner include.  
* Followers: cursor pagination; profile selected in one query.  
* Discovery pages cached.

---

## Known limitations

1. **No Freeze `featured` flag** — featured = PUBLIC ranked by `followerCount`/`likeCount`.  
2. **No dedicated trending metric** — proxy via `likeCount` + `updatedAt`.  
3. **`collection.shared.v1`** deferred to Social share contract.  
4. **SEARCH `/search/collections`**, **user public collection lists**, members/comments/export/duplicate → Sprint 6.4+ or other APIs.  
5. Full-repo `lint` may still fail on pre-existing non-collections files.

---

## Test summary

| Suite | Focus | Result |
|-------|--------|--------|
| Unit visibility | PUBLIC/PRIVATE/FOLLOWERS + block/mute | ✅ |
| Unit discovery | featured cache, follow/like invalidate | ✅ |
| Unit query | private denial, slug resolve | ✅ |
| Unit service | `visibility.changed` event | ✅ |
| Integration | slug, counters, featured cache, followers page | ✅ |
| Collections suite | 33 unit+integration | ✅ |
| E2E discovery | private 404, slug, followers, follow/like, featured | ✅ |

### Verification (2026-07-16)

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `typecheck` / `build` | ✅ |
| eslint `src/collections/**` | ✅ |
| unit + integration | 33/33 |
| e2e discovery | 1/1 |

**Do not begin Sprint 6.4 until this report is reviewed.**
