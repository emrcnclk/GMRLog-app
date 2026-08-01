# GMRLOG Sprint 3.5 — External Catalog Providers Implementation Report

**Sprint:** 3.5 — External Catalog Providers  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting review before Sprint 3.6**  
**Contracts:** OpenAPI / Database Freeze / System Design (SSOT); admin import paths are **OpenAPI gaps** (same pattern as Sprint 3.4)  
**Schema:** unchanged (Database Freeze)  
**Out of scope:** scheduled sync workers, recommendation logic, additional providers beyond IGDB (+ mock)

---

## Sprint 3.4 follow-ups (included)

### Soft archive

| Field | Behavior |
|-------|----------|
| `isPublished` | Archive → `false`; restore → `true` |
| `isArchived` | Admin API computed alias: `!isPublished` |
| Physical delete | **Not used** — Review / GameLog / Collection FKs stay intact |

**Freeze note:** There is no `games.is_archived` column. A dedicated column requires an explicit Database Freeze exception. Until then soft-archive semantics are `isPublished=false` + `isArchived` in admin responses/events.

### Audit trail

`CatalogAuditService` writes `audit_logs` and emits `catalog.audit.recorded.v1` with **who / what / when** for every Catalog Admin and Import mutation.

---

## Implemented Endpoints

Base: `/api/v1/admin/catalog/import`  
Auth: `JwtAuthGuard` + `RolesGuard` — **ADMIN** or **MODERATOR**

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/search?q=&limit=` | Provider search hits |
| POST | `/by-id` | Import/sync by external (IGDB) id |
| POST | `/by-slug` | Import/sync by provider slug |
| POST | `/by-search` | Import selected search hit (validates id ∈ results) |

Body fields: `mode?: 'import' | 'sync'` (default `import`), `provider?: 'igdb' | 'mock'`.

---

## Provider architecture

```text
CatalogImportController
        │
        ▼
CatalogImportService
        │
        ├─ CatalogProviderRegistry ──► IgdbProvider | MockCatalogProvider
        │                                   │
        │                                   └─ IgdbClient (Twitch OAuth + Apicalypse)
        ├─ CatalogConflictService
        ├─ CatalogImportRepository   (isolated; NOT GameRepository)
        ├─ GameCacheService
        ├─ DomainEventPublisher
        └─ CatalogAuditService
```

| Component | Responsibility |
|-----------|----------------|
| `CatalogProvider` | Fetch/search contract — no persistence |
| `IgdbProvider` | IGDB v4 via Twitch client-credentials |
| `MockCatalogProvider` | Deterministic fixture (`CATALOG_PROVIDER_DRIVER=mock`) |
| `CatalogImportRepository` | Upsert metadata + create/update game + media/releases/websites |
| `CatalogConflictService` | Duplicate / conflict detection + merge warnings |

**Future providers** (stubs only in types): RAWG, Steam, Epic, PlayStation, Xbox, Nintendo.

**Isolation:** No IGDB types or HTTP calls inside `GameRepository`.

---

## Mapping strategy

Provider → `ProviderGamePayload` → internal entities.

| Provider field | Internal |
|----------------|----------|
| `id` | `Game.igdbId` |
| `slug` / `name` | `Game.slug` / `title` |
| `summary` / `storyline` | same |
| `cover` / screenshots / artworks | `Game.coverUrl` + `GameImage` (`COVER` / `SCREENSHOT` / `ARTWORK`) |
| `videos` | `GameVideo` (YouTube URL) |
| `genres` / `themes` / `platforms` / `game_modes` / `player_perspectives` / `franchises` | Named tables upserted by `igdbId` then slug |
| `involved_companies` | `Company` + `GameCompany` roles |
| `release_dates` | `GameRelease` |
| `websites` | `StoreAvailability` (`store` = category, `url`) — no dedicated website table |
| `aggregated_rating` / `total_rating` (0–100) | `Game.averageRating` on **0–10** scale |

---

## Conflict strategy

| Condition | `import` | `sync` |
|-----------|----------|--------|
| Existing `igdbId` | **Block** `DUPLICATE_EXTERNAL_ID` | Update that game |
| Slug owned by different `igdbId` | **Block** `DUPLICATE_SLUG` | **Block** |
| External id + slug resolve to different games | **Block** `CONFLICTING_METADATA` | **Block** |
| Title/summary differ on same game | — | Warning; **provider wins** |

Merge rule on sync: replace relation sets, images, videos, releases, store links with provider payload; overwrite scalar fields from provider.

---

## Cache & events

After successful import/sync:

- `GameCacheService.invalidateGame` + `invalidateLists`
- Events: `game.imported.v1` (create) / `game.synced.v1` (update)
- Audit: `catalog.game.import` / `catalog.game.sync` → `audit_logs` + `catalog.audit.recorded.v1`

Consumers are not required.

---

## Configuration

| Env | Purpose |
|-----|---------|
| `IGDB_CLIENT_ID` | Twitch/IGDB client id (optional until live IGDB use) |
| `IGDB_CLIENT_SECRET` | Twitch/IGDB secret |
| `CATALOG_PROVIDER_DRIVER` | `igdb` (default) \| `mock` |

---

## Test results

| Suite | Result |
|-------|--------|
| `catalog-admin.service.spec.ts` | ✅ (soft archive + audit) |
| `catalog-conflict.service.spec.ts` | ✅ |
| `igdb.mapper.spec.ts` | ✅ |
| `catalog-import.service.spec.ts` | ✅ import / duplicate / sync / search |
| `catalog-providers.e2e-spec.ts` (mock provider) | ✅ search, import, duplicate 409, sync + cache invalidation, by-search |

Coverage: successful import, duplicate import, mapping, conflict detection, cache invalidation.

---

## Known limitations

1. **No scheduled workers** (by design).  
2. **Live IGDB** requires Twitch credentials; CI/e2e uses `mock`.  
3. **Websites** mapped to `StoreAvailability` (schema has no `GameWebsite`).  
4. **OpenAPI gap** — import paths not yet in ADMIN_API / GAME_API YAML.  
5. **`isArchived` column** deferred under Database Freeze.  
6. Sync replaces provider-managed media/releases wholesale (manual admin media not preserved across sync).  
7. Age ratings / collections / engines still out of catalog tables (unchanged from 3.3).

---

## Deliverables checklist

- [x] Provider abstraction + IGDB + mock  
- [x] Import by id / slug / search  
- [x] Mapping + conflict detection  
- [x] Cache invalidation + events  
- [x] Unit + e2e (mock) tests  
- [x] Soft archive semantics + CatalogAdmin audit  
- [x] This report  

**Do not begin Sprint 3.6 until Sprint 3.5 has been reviewed and approved.**
