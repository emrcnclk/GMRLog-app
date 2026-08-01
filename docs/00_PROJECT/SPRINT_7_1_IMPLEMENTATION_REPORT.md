# GMRLOG Sprint 7.1 — Lists Core

**Sprint:** 7.1 — Lists Core  
**Date:** 2026-07-17  
**Status:** **COMPLETE — Awaiting architectural review**  
**Contracts:** `LIST_API.yaml` + Database Freeze (Lists Patch) + `API_ARCHITECTURE.md` + `SYSTEM_DESIGN.md`

**Out of scope:** Sprint 7.2+ (items, reorder, social, discovery, comments, export, clone, statistics, activity)

---

## OpenAPI compliance (Sprint 7.1 core)

| Method | Path | Status |
|--------|------|--------|
| GET | `/lists` | ✅ Authenticated owner list + cursor |
| POST | `/lists` | ✅ Create |
| GET | `/lists/{listId}` | ✅ Get (+ additive slug resolve) |
| PATCH | `/lists/{listId}` | ✅ Update |
| DELETE | `/lists/{listId}` | ✅ Soft delete (204) |

**Not implemented (later sprints):** trending, featured, popular, items, likes, follow, bookmark, clone, comments, statistics, activity, share, export, report.

**Not invented:** No extra paths beyond LIST_API core scope.

---

## Database Freeze compliance

**Mismatch found → additive patch** `20260717120000_lists_freeze_patch`:

| OpenAPI field | Prisma column |
|---------------|---------------|
| `slug` | `lists.slug` (nullable, unique) |
| `coverImage` | `lists.cover_url` |
| `ranked` | `lists.is_ranked` |
| `collaborative` | `lists.is_collaborative` |

Existing Freeze fields reused:

| OpenAPI | Prisma |
|---------|--------|
| `title` | `title` |
| `description` | `description` |
| `visibility` | `visibility` |
| `gameCount` | `item_count` |
| `likes` | `like_count` |
| `followers` | `_count.followers` |
| `bookmarks` | `_count.bookmarks` |
| `comments` | `_count.comments` (non-deleted) |

---

## Architecture reuse

```
ContainersModule (Sprint 6.5)
├── ContainerVisibilityResolver  ← ListVisibilityService
├── ContainerPermissionService   ← ListPermissionService
├── ContainerOwnershipResolver
├── slugifyContainerTitle        ← list.slug generation
└── encode/decodeContainerCursor ← list pagination

ListsModule (Sprint 7.1 — second container consumer)
├── ListRepository extends AbstractContainerRepository
├── ListService / ListQueryService
├── ListPermissionService (owner-only; no ListMember yet)
└── ListCacheService
```

### Container reuse estimate

| Layer | Reuse |
|-------|-------|
| Visibility engine | **100%** — `ContainerVisibilityResolver` |
| Permission asserts | **100%** — `ContainerPermissionService` |
| Slug + cursor utilities | **100%** — shared `containers/` helpers |
| Repository contract | **100%** — `AbstractContainerRepository` |
| Domain service logic | **~0% copy** — List-specific write/read paths |
| Cache / mapper / DTO | **Domain-specific** (pattern-aligned, not duplicated) |

**Overall:** ~65–70% of cross-cutting container infrastructure reused; domain code is List-native with Collection used only as structural reference.

---

## Cache

| Key | Use |
|-----|-----|
| `list:{id}` | Detail |
| `list:slug:{slug}` | Slug lookup |
| `userLists:{userId}` | Owner default first page |

PRIVATE lists are not cached. Invalidation targets only affected keys on create/update/delete.

---

## Events (domain only)

* `list.created.v1`
* `list.updated.v1`
* `list.deleted.v1`
* `list.visibility.changed.v1`

No Feed / Notification / Analytics calls.

---

## Performance

* Cursor pagination on `GET /lists`
* `_count` batched in `LIST_DETAIL_INCLUDE` (no N+1 for social counts)
* Repository `listByOwner` uses single Prisma query with include
* Thin controller — all logic in services

---

## Security

* Ownership via `ListPermissionService` → `ContainerPermissionService`
* Visibility via `ListVisibilityService` → block/mute/privacy graph
* Hidden lists return 404 (not 403)
* ProblemDetails on all errors

---

## Known limitations

1. **Owner-only** — no `ListMember` in Freeze; `collaborative` flag stored but no collaborator access in 7.1.
2. **Slug** auto-generated from title on create; no explicit slug in `CreateListRequest` (OpenAPI-aligned).
3. **`coverImage`** column exists; upload/set not in 7.1 core.
4. **ListPage.total** from OpenAPI not returned (cursor page only).
5. **Discovery endpoints** deferred to Sprint 7.2+.

---

## Test summary

| Suite | Result |
|-------|--------|
| Unit (service, query, permission) | 8 ✅ |
| Integration | 1 ✅ |
| E2E core | 1 ✅ |

### Verification (2026-07-17)

| Check | Result |
|-------|--------|
| `prisma validate` / migrate deploy | ✅ |
| `typecheck` / `build` | ✅ |
| eslint `src/lists/**` | ✅ |
| unit + integration | 9/9 |
| e2e `lists.e2e-spec.ts` | 1/1 |

---

**Do not begin Sprint 7.2 until architectural review is approved.**
