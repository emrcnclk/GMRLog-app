# GMRLOG Sprint 3.4 — Catalog Administration Implementation Report

**Sprint:** 3.4 — Catalog Administration  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting review before Sprint 3.5**  
**Contracts:** ADMIN_API security model (Admin/Moderator JWT); catalog write paths are **OpenAPI gaps** (not yet in ADMIN_API / GAME_API)  
**Schema:** unchanged (Database Freeze)  
**Out of scope:** IGDB sync, scheduled jobs

---

## Implemented Endpoints

Base: `/api/v1/admin/catalog`  
Auth: `JwtAuthGuard` + `RolesGuard` — **ADMIN** or **MODERATOR**

### Games

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/games` | Create game (+ optional metadata links) |
| PATCH | `/games/{gameId}` | Update game + replace relation sets |
| POST | `/games/{gameId}/archive` | Unpublish (`isPublished=false`) |
| POST | `/games/{gameId}/restore` | Republish (`isPublished=true`) |

### Metadata CRUD

| Entity | POST | PATCH | DELETE |
|--------|------|-------|--------|
| genres | `/genres` | `/genres/{id}` | `/genres/{id}` |
| platforms | `/platforms` | `/platforms/{id}` | `/platforms/{id}` |
| themes | `/themes` | `/themes/{id}` | `/themes/{id}` |
| game-modes | `/game-modes` | `/game-modes/{id}` | `/game-modes/{id}` |
| player-perspectives | `/player-perspectives` | `/player-perspectives/{id}` | `/player-perspectives/{id}` |
| franchises | `/franchises` | `/franchises/{id}` | `/franchises/{id}` |

### Media management

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/games/{gameId}/media/images` | Add image |
| DELETE | `/games/{gameId}/media/images/{imageId}` | Remove image |
| PATCH | `/games/{gameId}/media/images/reorder` | Reorder images |
| POST | `/games/{gameId}/media/videos` | Add video |
| DELETE | `/games/{gameId}/media/videos/{videoId}` | Remove video |
| PATCH | `/games/{gameId}/media/videos/reorder` | Reorder videos |

---

## Architecture

```text
CatalogAdminController
        │
        ▼
CatalogAdminService
        │
        ├─ CatalogAdminRepository ($transaction)
        ├─ GameCacheService.invalidateGame / invalidateLists
        └─ DomainEventPublisher
```

| Component | Responsibility |
|-----------|----------------|
| `Roles` + `RolesGuard` | ADMIN/MODERATOR gate (shared auth) |
| `CatalogAdminRepository` | Prisma transactions for game + relations + media |
| `CatalogAdminService` | Validation, events, centralized cache invalidation |

---

## Validation

| Rule | Response |
|------|----------|
| Duplicate slug / igdbId | `409` ProblemDetails `GAME_CONFLICT` |
| Invalid metadata UUID refs | `400` `INVALID_REFERENCE` |
| Invalid slug format | `400` `INVALID_SLUG` |
| Missing game / media | `404` |
| Non-admin caller | `403` `AUTH_FORBIDDEN` |
| Unauthenticated | `401` |

Archive uses `isPublished` (no soft-delete column under Freeze).

---

## Events

| Event | When |
|-------|------|
| `game.created.v1` | Game created |
| `game.updated.v1` | Game updated / restored |
| `game.archived.v1` | Game archived |
| `game.media.updated.v1` | Image/video add/remove/reorder |

Consumers not required (prep for future IGDB sync).

---

## Cache Invalidation

After every admin write:

- `GameCacheService.invalidateGame(id, slug)` → clears `game:enriched:*`, `game:*`, slug mapping, discovery list keys  
- Metadata entity CRUD → `invalidateLists()`  
- Media writes → invalidate that game’s enriched detail  

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit `catalog-admin.service.spec.ts` | **8/8** |
| E2E `catalog-admin.e2e-spec.ts` | **8/8** |
| `pnpm typecheck` | **passed** |

### Coverage

- create / update / archive / restore  
- metadata create  
- media add + reorder  
- authorization (403 for USER)  
- duplicate slug + invalid genre ref  

---

## OpenAPI Gaps

| Gap | Handling |
|-----|----------|
| No catalog admin paths in ADMIN_API / GAME_API | Implemented under `/admin/catalog/*`; document for YAML sync |
| Archive vs hard delete | Mapped to `isPublished` |
| CMS `contentType` not used | Dedicated catalog admin surface instead |

---

## Known Limitations

1. No IGDB import/sync or cron (by design).  
2. No audit-log persistence this sprint (ADMIN_API audit endpoints separate).  
3. Company CRUD not included (only link existing developer/publisher IDs on games).  
4. OpenAPI YAML should be updated in a docs pass before external consumers.

---

## Deliverables Checklist

- [x] Create / update / archive / restore games (admin-only)  
- [x] Metadata CRUD (genres, platforms, themes, modes, perspectives, franchises)  
- [x] Media add / remove / reorder + cache invalidation  
- [x] Transactions + ProblemDetails validation  
- [x] Domain events  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 3.5 until Sprint 3.4 has been reviewed and approved.**
