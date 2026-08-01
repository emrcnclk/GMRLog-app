# GMRLOG Sprint 8.3 — Tier List Discovery & Search

**Sprint:** 8.3 — Tier List Discovery & Search  
**Date:** 2026-07-18  
**Status:** **COMPLETE — Awaiting architectural review**  
**Contracts:** `TIERLIST_API.yaml` + `SEARCH_API.yaml` + Database Freeze v1.0.x + `API_ARCHITECTURE.md` + `SYSTEM_DESIGN.md` + `CACHE_STRATEGY.md` + `DISCOVERY_COMMON_LAYER.md`

**Out of scope:** Sprint 8.4 (engagement / social writes / clone / etc.)

---

## OpenAPI compliance

### TIERLIST_API.yaml

| Method | Path | Status |
|--------|------|--------|
| GET | `/tierlists` | ✅ owner list (8.1; unchanged) |
| GET | `/tierlists/featured` | ✅ |
| GET | `/tierlists/trending` | ✅ |
| GET | `/tierlists/templates` | ✅ |
| GET | `/tierlists/{tierListId}` | ✅ + `tierlist.viewed.v1` |

### SEARCH_API.yaml

| Method | Path | Status |
|--------|------|--------|
| GET | `/search/tierlists` | ✅ SQL ILIKE + cursor |

### Not invented (explicitly skipped)

| Endpoint / feature | Reason |
|--------------------|--------|
| `/tierlists/popular` | Not in TIERLIST_API |
| Slug lookup `GET /tierlists/{slug}` | Freeze has **no** `slug` column; UUID-only |
| User public tier lists by username | Not in USER_API / TIERLIST_API |
| Autocomplete for tier lists | Not documented |
| Elasticsearch / AI ranking / recommendations | Forbidden by sprint brief |

---

## Database Freeze compliance

| Check | Result |
|-------|--------|
| Schema / migrations | **No changes** — Freeze authoritative |
| `prisma validate` | ✅ Valid |
| Featured / trending columns | **Absent** — engagement proxies (`voteCount` / `likeCount`) |
| Slug | **Absent** — OpenAPI `slug` remains omitted/`null` (8.1) |
| Templates | `TierListTemplate` + `TierTemplateRow` used as-is |

---

## Architecture reuse

Composition over inheritance — Tier discovery does **not** subclass `AbstractDiscoveryRepository` or `AbstractContainerService`.

### Shared discovery package (`common/discovery`) — first consumer

| Component | Usage |
|-----------|--------|
| `DiscoveryModule` | Imported by `TierListsModule` |
| `VisibilityQueryBuilder` | `publicAlive()` for featured/trending/search |
| `DiscoveryQueryBuilder` | featured / trending orderBy proxies |
| `DiscoveryCacheService` | `tierlist:featured` + `tierlist:discover:{hash}` |
| `CursorBuilder` | search limit + cursor where fragment |

### Container / existing Tier collaborators

| Collaborator | Reuse |
|--------------|-------|
| `ContainerVisibilityResolver` | ✅ via `TierListVisibilityService` (detail gates) |
| `ContainerPermissionService` | ✅ via `TierListPermissionService` (CRUD; discovery is PUBLIC SQL) |
| `PrivacyService` / `BlockService` / `MuteService` | ✅ inside visibility resolver |
| `DomainEventPublisher` | ✅ shared |
| `TierListCacheService` | ✅ invalidates discovery kinds on mutation |
| `TIERLIST_DETAIL_INCLUDE` | ✅ single include tree — no N+1 |
| `SparseOrderingEngine` | Not needed for discovery reads |

### Architecture reuse metrics

| Metric | Value |
|--------|-------|
| Reused services | `DiscoveryCacheService`, `DiscoveryQueryBuilder`, `VisibilityQueryBuilder`, `CursorBuilder`, `TierListVisibilityService`, `TierListQueryService`, `DomainEventPublisher`, `TierListCacheService` |
| Reused repositories / patterns | `TIERLIST_DETAIL_INCLUDE`, `mapTierListRecord`, domain cursor encode/decode |
| Reused permission logic | ✅ manage paths unchanged; discovery endpoints PUBLIC-scoped |
| Reused visibility logic | ✅ detail access; search/featured/trending filter `visibility: PUBLIC` at SQL |
| Duplicated LOC estimate vs List discovery | **~90–130 LOC structural parallel** (query + search + thin service) — **0 LOC** of visibility/permission duplication; builders live in `common/discovery` |
| Composition (not inheritance) | ✅ |
| Collections / Lists migrated | ❌ deferred (dedicated sprint after review) |

---

## Services / repositories introduced

| Component | Role |
|-----------|------|
| `TierListDiscoveryService` | Featured / trending / templates / search + domain events |
| `TierListDiscoveryQueryRepository` | PUBLIC discovery Prisma queries + templates |
| `TierListSearchRepository` | SQL ILIKE search + cursor |
| `TierListDiscoveryMapper` | Thin map over `mapTierListRecord` / template labels |
| `TierListSearchController` | Thin `GET /search/tierlists` |

Controllers remain thin; authorization stays out of controllers.

---

## Discovery algorithms (engagement proxies)

Freeze has no `featured` / `trending` columns. Proxies:

| Endpoint | Order |
|----------|-------|
| Featured | `voteCount DESC`, `likeCount DESC`, `id DESC` |
| Trending | `likeCount DESC`, `updatedAt DESC`, `id DESC` |
| Search | ILIKE on `title` / `description`, `createdAt DESC` + cursor |
| Templates | `isSystem DESC`, `name ASC` — rows as label strings |

All discovery list queries: `deletedAt: null` + `visibility: PUBLIC`. Limit: `TIERLIST_DISCOVERY_LIMIT = 20`.

No N+1: single `findMany` with `TIERLIST_DETAIL_INCLUDE`.

---

## Cache strategy

| Key | Usage |
|-----|-------|
| `tierlist:{id}` | Detail — **PUBLIC only** on set |
| `tierlist:user:{userId}` | Owner list page |
| `tierlist:featured` | Featured discovery page |
| `tierlist:discover:{hash}` | Featured / trending discover hashes |

- Cache only PUBLIC discovery pages.
- Never cache PRIVATE/FOLLOWERS discovery pages (those surfaces do not exist as browse pages).
- Invalidate on create/update/delete: entity + user page + featured/trending kinds via `DiscoveryCacheService.invalidateKinds`.
- TTL: `TIERLIST_CACHE_TTL_SECONDS` (default 600).

---

## Event flow

| Event | When |
|-------|------|
| `tierlist.discovered.v1` | Featured/trending cache miss → page built |
| `tierlist.viewed.v1` | Successful `GET /tierlists/{id}` |
| `tierlist.search.executed.v1` | `GET /search/tierlists` |

No direct Feed / Notification / Analytics calls — publish only.

---

## Security review

| Concern | Handling |
|---------|----------|
| Authorization | `ContainerPermissionService` on writes; discovery reads are PUBLIC SQL |
| Visibility | `ContainerVisibilityResolver` on detail (PUBLIC / FOLLOWERS / PRIVATE) |
| Block / mute | Resolver short-circuits → `TIERLIST_NOT_FOUND` (404 ProblemDetails) |
| Controllers | Zero authorization logic |
| Errors | ProblemDetails |

---

## Performance analysis / repository optimization

- Discovery and search use one Prisma `findMany` + shared include.
- Templates load rows in the same query (`select.rows`).
- Cursor pagination on search (`limit + 1`).
- Featured/trending fixed-size pages (`hasNext: false`).
- Redis discovery cache avoids repeated PUBLIC ranking queries.

---

## Known limitations

1. **No slug** — Freeze mismatch with OpenAPI; UUID-only lookups (documented since 8.1).
2. **No `/popular`** — not in OpenAPI.
3. **No user public browse by username** — not in contracts.
4. **Featured/trending** are engagement proxies, not editorial flags.
5. **Templates** returned as a single page (OpenAPI has no cursor query params on the route).
6. **Collections/Lists** still on hand-rolled discovery — migrate later if approved.
7. Discovery SQL does not apply block/mute filters at query time (same as Lists); social gates apply on **detail** access.

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `typecheck` | ✅ |
| `build` | ✅ |
| `eslint` (tier-lists + discovery e2e) | ✅ |
| Unit (`tier-lists` + `common/discovery`) | ✅ |
| Integration (discovery) | ✅ |
| E2E (`tierlist-discovery.e2e-spec.ts`) | ✅ |

---

## Stop

Sprint 8.3 complete. **Do not begin Sprint 8.4** until architectural review.
