# GMRLOG Sprint 6.1 — Collections Core Implementation Report

**Sprint:** 6.1 — Collections Core  
**Date:** 2026-07-16  
**Status:** **COMPLETE — Approved**  
**Contracts:** `COLLECTION_API.yaml` (HTTP) + Database Freeze + System Design  

### Database Freeze v1.0.3 — Collections Patch

| Attribute | Value |
|-----------|--------|
| Label | **Database Freeze v1.0.3** Collections Patch |
| Report revision | **1.1.3** |
| Migration | `20260716_collections_freeze_patch` |
| Compatibility | **Backward Compatible** |
| Breaking changes | **No Breaking Changes** |

Additive columns only:

* `collections.slug` — `TEXT NULL`, **UNIQUE**, indexed (existing rows remain `NULL`)
* `collections.is_collaborative` — `BOOLEAN NOT NULL DEFAULT false`

No previous migrations were edited. Existing collections continue to load without backfill.

**Out of scope (unchanged):** games in collection, follow/like, members, comments, featured/trending, export/duplicate, Lists, Tier Lists

---

## Implemented endpoints

| Method | Path | Auth | Operation |
|--------|------|------|-----------|
| GET | `/api/v1/collections` | JWT | List my collections (cursor + visibility filter) |
| POST | `/api/v1/collections` | JWT | Create collection |
| GET | `/api/v1/collections/{collectionId}` | Optional JWT | Get collection (visibility-aware) |
| PATCH | `/api/v1/collections/{collectionId}` | JWT | Update collection (owner) |
| DELETE | `/api/v1/collections/{collectionId}` | JWT | Soft-delete collection (owner) → `204` |

---

## Architecture decisions

```text
CollectionsController
        │
        ├── writes → CollectionService
        │              ├── slugify / unique resolution
        │              ├── CollectionRepository
        │              ├── CollectionCacheService
        │              └── DomainEventPublisher
        │
        └── reads  → CollectionQueryService
                       ├── CollectionQueryRepository
                       └── CollectionCacheService
```

* Controllers contain no business logic.  
* Soft delete via Freeze `deletedAt` (queries filter `deletedAt: null`).  
* Field mapping: OpenAPI `name` ↔ Prisma `title`; `coverImage` ↔ `coverUrl`; `collaborative` ↔ `isCollaborative`; `slug` ↔ `slug`.  
* Slug: auto-generated from name (suffix on collision); optional explicit slug; **immutable after create** unless actor has `ADMIN`.

Full field mapping: `docs/00_PROJECT/COLLECTIONS_OPENAPI_FREEZE_MAPPING.md`.

---

## Repository strategy

| Layer | Role |
|-------|------|
| `CollectionRepository` | create / update / softDelete / ownership / `slugExists` |
| `CollectionQueryRepository` | findById, listByOwner (cursor), follow check for FOLLOWERS visibility |
| `CollectionMapper` | Prisma → OpenAPI-shaped entity |

---

## Cache strategy

| Key | Behavior |
|-----|----------|
| `collection:{id}` | Detail cache; **skipped for PRIVATE** |
| `userCollections:{userId}` | Default first page of owner list |

Invalidated on create / update / delete for the owner pair only.

---

## Event strategy

| Event | When |
|-------|------|
| `collection.created.v1` | After create |
| `collection.updated.v1` | After update |
| `collection.deleted.v1` | After soft delete |

No Feed / Notification direct calls.

---

## Visibility & security

| Visibility | Read rules |
|------------|------------|
| `PUBLIC` | Anyone |
| `FOLLOWERS` | Owner, or viewer follows owner |
| `PRIVATE` | Owner only (anonymous/other → `404`) |

Mutations require JWT + ownership (`403` for non-owner).

---

## OpenAPI ↔ Database Freeze Gaps

### Closed by Freeze v1.0.3

| OpenAPI | Freeze | Behavior |
|---------|--------|----------|
| `slug` | `slug` (nullable unique) | Generated / explicit; returned |
| `collaborative` | `is_collaborative` | Persisted + returned |

### Still open (not in this patch)

| OpenAPI | Status | Freeze v1.1+ candidate |
|---------|--------|-------------------------|
| `featured` | Omitted | Boolean |
| `verified` (collection) | Omitted | Boolean |
| `bannerImage` | Omitted | `banner_url` |
| `icon` | Omitted | `icon_url` |

---

## Test summary

| Suite | Result | Coverage |
|-------|--------|----------|
| `collection.service.spec.ts` | PASS | generated slug, duplicate explicit, collision suffix, admin slug change, ownership, delete |
| `collection-query.service.spec.ts` | PASS | private hide, owner view, list cache |
| `collection.integration.spec.ts` | PASS | slug + isCollaborative persist, duplicate reject, legacy null slug compatible, soft delete |
| `collections.e2e-spec.ts` | PASS | CRUD, slug/collaborative in response, ownership, visibility, pagination, cache, events |

---

## Known limitations

1. Featured / trending / games / social endpoints → later sprints.  
2. Remaining OpenAPI cosmetic fields (`bannerImage`, `icon`, `featured`, collection `verified`).  
3. Cover upload not in 6.1.  
4. Feed does not yet consume `collection.*` events.

---

## Checklist

- [x] Core lifecycle endpoints  
- [x] Repository / Query / Service / Mapper / Cache  
- [x] Soft delete + visibility + ownership  
- [x] Cursor pagination + cache + events  
- [x] **Freeze v1.0.3 additive patch** (`slug`, `is_collaborative`)  
- [x] Slug generation / uniqueness / immutability  
- [x] Docs + OpenAPI mapping report  
- [x] Unit + integration + e2e  
- [x] This report  

**Do not begin Sprint 6.2 until this report (post-patch) is reviewed if required; Sprint 6.1 was previously approved — patch is backward-compatible closure.**
