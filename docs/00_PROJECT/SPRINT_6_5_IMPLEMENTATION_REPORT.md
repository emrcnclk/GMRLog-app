# GMRLOG Sprint 6.5 — Collection Discovery & Reusable Container Architecture

**Sprint:** 6.5 — Collection Discovery & Reusable Container Architecture  
**Date:** 2026-07-17  
**Status:** **COMPLETE — Awaiting architectural review**  
**Contracts:** `COLLECTION_API.yaml` + `SEARCH_API.yaml` (search only) + Database Freeze v1.0.3  
**SSOT also consulted:** `API_ARCHITECTURE.md`, `SYSTEM_DESIGN.md`

**Out of scope:** Sprint 7 Lists, Tier Lists, comments/export/duplicate/statistics/activity, Elasticsearch, AI ranking  

---

## Architecture

Reusable container layer lives under `apps/api/src/containers/`. Collection is the first consumer via facades; Lists / Tier Lists import `ContainersModule` and extend abstracts without reimplementing visibility or permission engines.

```
ContainersModule
├── AbstractContainerRepository
├── AbstractContainerService
├── AbstractContainerQueryService
├── ContainerVisibilityResolver   (PUBLIC | FOLLOWERS | PRIVATE + MEMBER bypass)
├── ContainerOwnershipResolver
├── ContainerPermissionService
├── BlockService / MuteService    (SocialGraph facades)
└── (domain-agnostic types)

CollectionsModule
├── CollectionVisibilityService → ContainerVisibilityResolver
├── CollectionPermissionService → ContainerPermissionService
├── CollectionDiscoveryService
│   ├── CollectionDiscoveryRepository
│   ├── CollectionDiscoveryQueryRepository
│   ├── CollectionSearchRepository
│   └── CollectionDiscoveryMapper
└── CollectionSearchController → GET /search/collections
```

---

## OpenAPI compliance

| Method | Path | Source | Status |
|--------|------|--------|--------|
| GET | `/collections/featured` | COLLECTION_API | ✅ |
| GET | `/collections/trending` | COLLECTION_API | ✅ |
| GET | `/collections/{idOrSlug}` | COLLECTION_API | ✅ slug on existing path |
| GET | `/search/collections` | SEARCH_API | ✅ SQL ILIKE + cursor |

**Not invented:** `/collections/recent`, `/collections/public`, dedicated `/collections/slug/...`.

Controllers stay thin; authorization centralized in `CollectionPermissionService`.

---

## Database Freeze compliance

* No new migrations in Sprint 6.5  
* Visibility enum remains `PUBLIC` | `FOLLOWERS` | `PRIVATE`  
* **MEMBER** is an access mode (collaborator row), not a stored visibility value  
* No Freeze `featured` column — featured discovery remains engagement proxy  

---

## Reusable abstractions

| Abstraction | Collection usage | Future Lists / Tier Lists |
|-------------|------------------|---------------------------|
| `AbstractContainerRepository` | Contract for owned/slug/softDelete | Extend |
| `AbstractContainerService` | Write-side skeleton | Extend |
| `AbstractContainerQueryService` | Read + visibility gate skeleton | Extend |
| `ContainerVisibilityResolver` | Via `CollectionVisibilityService` | Direct / facade |
| `ContainerOwnershipResolver` | Role vs owner resolution | Direct |
| `ContainerPermissionService` | Via `CollectionPermissionService` | Direct / facade |
| `BlockService` / `MuteService` | Visibility path | Same |

Abstracts contain **zero** Collection-specific code.

---

## Discovery

* `CollectionDiscoveryService` — featured, trending, follow/like, search  
* `CollectionDiscoveryRepository` / `CollectionDiscoveryQueryRepository` — batched Prisma, no N+1  
* `CollectionSearchRepository` — PUBLIC + `deletedAt: null`, ILIKE on title/slug/description, cursor pagination  
* `CollectionDiscoveryMapper` — record → API entity mapping  

Service-side filtering is not used for discovery lists; repositories apply predicates.

---

## Visibility

Supported access:

* `PUBLIC` — anyone  
* `FOLLOWERS` — owner followers (via PrivacyService / social graph)  
* `PRIVATE` — owner (+ MEMBER collaborators)  
* `MEMBER` — collaborator bypass (not persisted enum)

Reuses: `PrivacyService`, `BlockService`, `MuteService`, `ContainerVisibilityResolver`.

---

## Slug

* Slug is authoritative for public lookup on `GET /collections/{idOrSlug}`  
* Cache: `collection:slug:{slug}`  
* Lookup + invalidation on update/delete via `CollectionCacheService`  

---

## Cache

| Key | Use |
|-----|-----|
| `collection:{id}` | Detail |
| `collection:slug:{slug}` | Slug lookup |
| `collection:user:{userId}` | Owner list (replaces legacy `userCollections:`) |
| `collection:discover:{hash}` | Trending / hashed discover pages |
| `collection:featured` | Featured page |

Invalidation targets only affected keys (id, slug, owner, featured/discover).

---

## Events

Published (domain only — no Feed / Notification / Analytics calls):

* `collection.created.v1` / `updated.v1` / `deleted.v1`  
* `collection.visibility.changed.v1`  
* item / member events from prior sprints  

**Not emitted** (no Freeze editorial flag / product hook):

* `collection.featured.v1`  
* `collection.discovered.v1`  

---

## Search

* SQL-only (`Prisma` `contains` + `mode: 'insensitive'` → ILIKE)  
* Cursor pagination (`createdAt` + `id`)  
* No Elasticsearch, no AI ranking  

---

## Performance

* Repository batching for discovery queries  
* Cursor pagination on list/search paths  
* No duplicate ownership queries in permission path when role already resolved  
* Cache short-circuits featured/trending  

---

## Security

* All write/manage checks go through `CollectionPermissionService` → `ContainerPermissionService`  
* Controllers contain zero business logic  
* PRIVATE collections omitted from search; visibility enforced on get-by-id/slug  

---

## Known limitations

1. Featured remains engagement proxy (no `featured` column in Freeze).  
2. `collection.featured.v1` / `collection.discovered.v1` not published.  
3. Abstract container services are thin skeletons — domain services still own Nest DI write flows (intentional).  
4. `CollectionSearchController` shares the `search` route prefix with other search controllers (Nest merges by path).  
5. Root `.env` may use placeholder DB credentials; local validation used `gmrlog:gmrlog` against running Postgres.

---

## Test summary

| Suite | Coverage | Result |
|-------|----------|--------|
| Unit (containers + collections) | visibility, permissions, discovery, search, CRUD, items, collab | ✅ 39 |
| Integration | slug, cache, discovery, items, collaboration | ✅ 4 |
| E2E | visibility, slug, featured, trending, **search**, collab, items, core | ✅ 6 |

**Totals:** 43 unit+integration · 6 e2e  

### Verification (2026-07-17)

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ (schema valid with DATABASE_URL/DIRECT_URL) |
| `typecheck` / `build` | ✅ |
| eslint `src/collections/**` + `src/containers/**` | ✅ |
| unit + integration | 43/43 |
| e2e collection\* | 6/6 |

---

**Do not begin Sprint 7 (Lists) until architectural review is approved.**
