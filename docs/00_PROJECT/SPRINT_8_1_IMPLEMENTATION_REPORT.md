# GMRLOG Sprint 8.1 — Tier Lists Core

**Sprint:** 8.1 — Tier Lists Core  
**Date:** 2026-07-18  
**Status:** **COMPLETE — Awaiting architectural review**  
**Contracts:** `TIERLIST_API.yaml` (SSOT path; brief said `TIER_LIST_API.yaml`) + Database Freeze v1.0.x + `API_ARCHITECTURE.md` + `SYSTEM_DESIGN.md` + `CACHE_STRATEGY.md`

**Architectural decision:** Tier Lists are an **independent bounded context**, not a Lists specialization. Composition over shared Container infrastructure; **no** copy of `ListService` business rules.

**Out of scope:** Sprint 8.2 (row/item ranking, drag-and-drop, discovery, social, templates HTTP, search).

---

## OpenAPI compliance

### Implemented (core only)

| Method | Path | Status |
|--------|------|--------|
| GET | `/tierlists` | ✅ owner list + cursor + visibility filter |
| POST | `/tierlists` | ✅ create + optional `rows` seed |
| GET | `/tierlists/{tierListId}` | ✅ UUID + visibility gate |
| PATCH | `/tierlists/{tierListId}` | ✅ title / description / visibility |
| DELETE | `/tierlists/{tierListId}` | ✅ soft delete |

**Total:** **5** HTTP operations.

### Explicitly deferred (Sprint 8.2+)

trending, featured, templates, rows CRUD, items CRUD, likes, comments, bookmark, clone, share, export, vote, `/search/tierlists`.

### Freeze ↔ OpenAPI mismatches (documented, not invented)

| OpenAPI field | Freeze | Sprint 8.1 handling |
|---------------|--------|---------------------|
| `TierList.slug` | **No column** | Omitted from entity/response |
| `TierList.coverImage` | **No column** | Always `null` |
| `bookmarks` | No TierList bookmark relation | Always `0` |
| `views` | No column | Always `0` |
| `likes` / `votes` | `likeCount` / `voteCount` | Mapped |
| `comments` | `TierComment` `_count` | Mapped |
| `rows[].items` | Exists but ranking is 8.2 | Always `[]` on core responses |

---

## Database Freeze compliance

| Check | Result |
|-------|--------|
| Schema / migrations | **None** |
| `prisma validate` | ✅ |
| Soft delete | `deletedAt` |
| Initial rows | `TierRow` created in same transaction on create |
| `slugExists` | Abstract contract stub → always `false` (no TierList slug) |

---

## Architecture reuse

| Collaborator | Use |
|--------------|-----|
| `AbstractContainerRepository` | `TierListRepository` |
| `ContainerPermissionService` | via `TierListPermissionService` |
| `ContainerVisibilityResolver` | via `TierListVisibilityService` |
| `DomainEventPublisher` | shared |
| Cursor encode/decode | shared container cursor utils |
| Redis | `TierListCacheService` |

**Not reused as inheritance:** `ListService` / List discovery / List ranking — Tier-specific services only.

### Reuse metrics

| Metric | Value |
|--------|-------|
| Reused services | Container permission, visibility, events, Redis |
| Duplicated LOC vs Lists | **~0 business-logic copy**; structural parallel (thin CRUD layers) ~150–200 LOC |
| Composition | ✅ |

---

## Module structure

```
tier-lists/
  tierlists.controller.ts
  tierlist.service.ts
  tierlist-query.service.ts
  tierlist.repository.ts
  tierlist-query.repository.ts
  tierlist.mapper.ts
  tierlist-cache.service.ts
  tierlist-visibility.service.ts
  tierlist-permission.service.ts
  + constants / entities / dto / cursor / exceptions / module
```

Wired in `AppModule` as `TierListsModule`.

---

## Cache strategy

| Key | Usage |
|-----|-------|
| `tierlist:{id}` | Detail — **PUBLIC only** on set |
| `tierlist:user:{userId}` | Owner first-page list |

Invalidation: create/update/delete → both keys for affected owner. No global flush. TTL: `TIERLIST_CACHE_TTL_SECONDS` (default 600).

---

## Event flow

| Event | When |
|-------|------|
| `tierlist.created.v1` | create |
| `tierlist.updated.v1` | update |
| `tierlist.visibility.changed.v1` | visibility change |
| `tierlist.deleted.v1` | soft delete |

Publish-only. No Feed / Notification / Analytics.

---

## Performance

- Single `findFirst` / `findMany` with `TIERLIST_DETAIL_INCLUDE` (owner + rows + comment count)
- Cursor pagination on owner list
- Create seeds rows in one `$transaction`
- No N+1

---

## Security review

| Concern | Handling |
|---------|----------|
| Ownership | `TierListPermissionService` → Container |
| Visibility | PUBLIC / FOLLOWERS / PRIVATE via Container resolver (+ Privacy/Block/Mute) |
| Controllers | Zero authz logic |
| Non-owner mutate | 403 |
| Private / ineligible | 404 |
| ProblemDetails | Global filter |

---

## Testing summary

| Layer | Result |
|-------|--------|
| Unit | service, query, permission — **8** tests |
| Integration | CRUD + rows + cache + events — **1** |
| E2E | CRUD, PUBLIC/PRIVATE/FOLLOWERS, ownership, cache — **1** |

Validation: `prisma validate` ✅ · typecheck ✅ · build ✅ · eslint ✅ · unit/integration ✅ · e2e ✅

---

## Known limitations

1. No slug / coverImage in Freeze — OpenAPI fields not persisted.  
2. Row/item ranking & drag-and-drop → Sprint 8.2.  
3. Discovery / social / templates / search → later sprints.  
4. `UpdateTierListRequest.rows` ignored (row structure mutations belong with ranking).  
5. Bookmarks / views always 0 until Freeze or generic entity counters are wired.

---

## Sprint boundary

Sprint 8.1 **stops here**. Do **not** begin Sprint 8.2 until architectural review approves Tier Lists core.
