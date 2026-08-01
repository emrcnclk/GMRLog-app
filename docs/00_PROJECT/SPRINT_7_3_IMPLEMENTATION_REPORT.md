# GMRLOG Sprint 7.3 — List Discovery & Public Browsing

**Sprint:** 7.3 — List Discovery & Public Browsing  
**Date:** 2026-07-17  
**Status:** **COMPLETE — Awaiting architectural review**  
**Contracts:** `LIST_API.yaml` + `SEARCH_API.yaml` + Database Freeze + `API_ARCHITECTURE.md` + `CACHE_STRATEGY.md` + `SYSTEM_DESIGN.md`

**Architectural decision (carried from 7.1/7.2):** composition over inheritance — no `AbstractContainerService` subclassing. Discovery mirrors Collections via shared Container collaborators, not duplicated visibility/permission logic.

**Out of scope:** Sprint 7.4 (follow/like/bookmark/social writes, clone, export, comments, etc.)

---

## OpenAPI compliance

### LIST_API.yaml

| Method | Path | Status |
|--------|------|--------|
| GET | `/lists/featured` | ✅ |
| GET | `/lists/trending` | ✅ |
| GET | `/lists/popular` | ✅ |
| GET | `/lists/{listId}` (UUID or slug) | ✅ (7.1 + `list.viewed.v1`) |

### SEARCH_API.yaml

| Method | Path | Status |
|--------|------|--------|
| GET | `/search/lists` | ✅ SQL ILIKE + cursor |

### Not invented (explicitly skipped)

| Endpoint / feature | Reason |
|--------------------|--------|
| `/lists/recent` | Not in LIST_API |
| User public lists by username | Not in USER_API / LIST_API for this sprint |
| Autocomplete for lists | Not documented |
| Elasticsearch / AI ranking / recommendations | Forbidden by sprint brief |

---

## Database Freeze compliance

| Check | Result |
|-------|--------|
| Schema / migrations | **No changes** — Freeze authoritative |
| `prisma validate` | ✅ Valid |
| Featured column | **Absent** — engagement proxies used (documented) |
| MEMBER visibility | **N/A** — no `ListMember` in Freeze |
| ListItem `rating` | Still OpenAPI-only; not used in discovery |

---

## Architecture reuse

Discovery is **composition**, not copy-paste of Collection discovery into Lists.

| Collaborator | Reuse |
|--------------|-------|
| `ContainerVisibilityResolver` | ✅ via `ListVisibilityService` → slug/id gate |
| `ContainerPermissionService` | ✅ via `ListPermissionService` (CRUD paths; discovery is PUBLIC-only) |
| `PrivacyService` / `BlockService` / `MuteService` | ✅ inside visibility resolver (not reimplemented) |
| `DomainEventPublisher` | ✅ shared |
| `ListCacheService` / Redis helpers | ✅ extended for discovery keys |
| Cursor utilities | ✅ `list.cursor` (same pattern as collections) |
| `AbstractContainerRepository` | Not required for read-only discovery queries |

### Architecture reuse metrics

| Metric | Value |
|--------|-------|
| Reused services | `ContainerVisibilityResolver`, `ListVisibilityService`, `ListQueryService`, `ListPermissionService`, `DomainEventPublisher`, `ListCacheService` |
| Reused repositories / patterns | Prisma include (`LIST_DETAIL_INCLUDE`), cursor encode/decode, GameSummary-style owner mapping via `mapListRecord` |
| Reused permission logic | ✅ manage/view paths unchanged; discovery endpoints are PUBLIC-scoped queries |
| Reused visibility logic | ✅ slug/id access; search/featured/trending/popular filter `visibility: PUBLIC` at SQL |
| Duplicated LOC estimate vs Collections discovery | **~80–120 LOC structural parallel** (query repo + search repo + thin service) — **0 LOC** of visibility/permission duplication |
| Composition (not inheritance) | ✅ |

---

## Services / repositories introduced

| Component | Role |
|-----------|------|
| `ListDiscoveryService` | Featured / trending / popular / search + domain events |
| `ListDiscoveryQueryRepository` | PUBLIC discovery Prisma queries |
| `ListSearchRepository` | SQL ILIKE search + cursor |
| `ListDiscoveryMapper` | Thin map over `mapListRecord` |
| `ListDiscoveryRepository` | Stub for 7.4+ social writes (`isPublicListAlive`) |
| `ListSearchController` | Thin `GET /search/lists` |

Controllers remain thin; authorization stays out of controllers.

---

## Discovery algorithms (engagement proxies)

Freeze has no `featured` / `trending` columns. Proxies:

| Endpoint | Order |
|----------|-------|
| Featured | `followers._count DESC`, `likeCount DESC`, `id DESC` |
| Trending | `likeCount DESC`, `updatedAt DESC`, `id DESC` |
| Popular | `itemCount DESC`, `likeCount DESC`, `followers._count DESC`, `id DESC` |
| Search | ILIKE on `title` / `slug` / `description`, `createdAt DESC` + cursor |

All discovery queries: `deletedAt: null` + `visibility: PUBLIC`. Limit: `LIST_DISCOVERY_LIMIT = 20`.

No N+1: single `findMany` with `LIST_DETAIL_INCLUDE` (owner profile batched via include).

---

## Cache strategy

| Key | Usage |
|-----|-------|
| `list:{id}` | Detail cache — **PUBLIC only** after set |
| `list:slug:{slug}` | Slug resolve — **PUBLIC only** |
| `list:user:{userId}` | Owner list page (canonical; replaces legacy `userLists:`) |
| `list:featured` | Featured discovery page |
| `list:discover:{hash}` | Trending / popular (and featured hash mirror) |

**Invalidation:** list CRUD invalidates list + user + featured + discover hashes for featured/trending/popular. Item mutations invalidate only `list:{id}` + `list:user:{userId}` (unchanged from 7.2).

**Hardening:** `getDiscoveryPage` rejects malformed cache payloads (missing `items` array) so stale test/corrupt JSON does not poison responses.

**Privacy:** `setList` caches only `visibility === 'PUBLIC'` (FOLLOWERS/PRIVATE never written).

No global flush.

---

## Event flow

| Event | When |
|-------|------|
| `list.discovered.v1` | Featured / trending / popular page materialised (cache miss → DB) |
| `list.viewed.v1` | `GET /lists/{listId}` (id or slug) |
| `list.search.executed.v1` | `GET /search/lists` |

Publish-only via `DomainEventPublisher`. **No** Feed / Notifications / Analytics calls.

---

## Security review

| Concern | Handling |
|---------|----------|
| Authorization | Controllers have zero authz logic; ownership via `ListPermissionService` → `ContainerPermissionService` |
| Visibility | `ContainerVisibilityResolver` + Privacy / Block / Mute |
| Discovery surface | SQL-enforced PUBLIC only |
| Private / followers | Not returned by search or discovery pages |
| Errors | ProblemDetails (existing filter) |

---

## Performance analysis

| Concern | Approach |
|---------|----------|
| N+1 | Single query + include; mapper is pure |
| Pagination | Cursor on search; fixed-limit pages on featured/trending/popular |
| Over-fetch | Discovery uses same detail include as list detail (acceptable for OpenAPI List summary shape) |
| Cache | Redis TTL (`LIST_CACHE_TTL_SECONDS`, default 600) |

---

## Tests

| Layer | Coverage |
|-------|----------|
| Unit | `list-discovery.service.spec.ts` — search validation, events, cache hit/miss |
| Integration | Featured cache, slug, private denial, search PUBLIC filter, events |
| E2E | Featured / trending / popular / search, visibility (PRIVATE / FOLLOWERS / block path via resolver), slug, cache invalidation, events |

Validation run (local):

* `prisma validate` ✅  
* `typecheck` (api + monorepo packages) ✅  
* `build` (`@gmrlog/api`) ✅  
* `eslint` on `src/lists/**` ✅  
* unit + integration (`src/lists`) ✅ 28 tests  
* e2e (`list-discovery.e2e-spec.ts`) ✅  

Note: monorepo-wide `pnpm run lint` may fail on unrelated packages (e.g. `@gmrlog/ui`); Lists sprint lint scope is `apps/api` lists module.

---

## Known limitations

1. **No `featured` Freeze column** — engagement proxies only; editorial featured requires a future Freeze change.  
2. **`ListDiscoveryRepository`** is a read stub; follow/like/bookmark belong to Sprint 7.4.  
3. **No user public lists endpoint** — not in OpenAPI for this sprint.  
4. **MEMBER visibility** — not applicable (no ListMember).  
5. **`list.discovered.v1`** is per discovery *page* load (cache miss), not per-list impression.  
6. **Optimistic locking** — still absent from OpenAPI (carried from 7.2).  
7. **FOLLOWERS lists** — correctly excluded from discovery/search; detail access still via visibility resolver.

---

## Sprint boundary

Sprint 7.3 **stops here**. Do **not** begin Sprint 7.4 until architectural review approves this discovery layer for reuse by Tier Lists (Sprint 8).
