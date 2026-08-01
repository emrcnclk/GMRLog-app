# GMRLOG Sprint 3.3 — Game Media & Metadata Implementation Report

**Sprint:** 3.3 — Game Media & Metadata  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting review before Sprint 3.4**  
**Contract:** `docs/08_API/GAME_API.yaml`  
**Schema:** unchanged (Database Freeze respected)  
**Dependencies:** Sprint 3.1–3.2 approved

---

## Implemented Endpoints

### Media

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/games/{gameId}/cover` | Cover URL |
| GET | `/api/v1/games/{gameId}/screenshots` | Screenshots (cursor, display order) |
| GET | `/api/v1/games/{gameId}/artworks` | Artworks (display order) |
| GET | `/api/v1/games/{gameId}/videos` | Videos |
| GET | `/api/v1/games/{gameId}/trailers` | Trailers |
| GET | `/api/v1/games/{gameId}/media` | Full media bundle (+ logos) |

### Metadata (catalog lists)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/platforms` | Platform list |
| GET | `/api/v1/platforms/{platformId}` | Platform by UUID or IGDB id |
| GET | `/api/v1/genres` | Genre list |
| GET | `/api/v1/themes` | Theme list |
| GET | `/api/v1/game-modes` | Game mode list |
| GET | `/api/v1/player-perspectives` | Perspective list |
| GET | `/api/v1/franchises` | Franchise list |
| GET | `/api/v1/catalog/collections` | IGDB collections (empty — no table) |

### Metadata (per game)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/games/{gameId}/developers` | Developers |
| GET | `/api/v1/games/{gameId}/publishers` | Publishers |
| GET | `/api/v1/games/{gameId}/supporting-studios` | Supporting studios |
| GET | `/api/v1/games/{gameId}/releases` | Release dates |
| GET | `/api/v1/games/{gameId}/links` | Websites / store links |
| GET | `/api/v1/games/{gameId}` | **Fully enriched** detail |

**Out of sprint:** reviews, UGC, IGDB sync jobs, engine/credits/achievements/stores/news.

---

## Implemented Metadata on Detail

| Field | Source |
|-------|--------|
| genres, themes, gameModes, playerPerspectives, platforms | Join tables |
| developers, publishers, supportingStudios | `GameCompany` + `CompanyRole` |
| franchises | `GameFranchise` |
| releaseDates | `GameRelease` |
| websites / links | Company websites + URL heuristics |
| externalIds | `igdbId`, `gameId`, `slug` |
| logos | Company `logoUrl` (no LOGO media kind) |
| coverMedia | `COVER` image or `coverUrl` |
| screenshots / artworks / videos | `GameImage` / `GameVideo` by kind + sortOrder |
| collections | `[]` (no catalog collection table) |
| ageRatings | `[]` (no AgeRating model) |

---

## Media Loading Strategy

1. Single enriched Prisma load via centralized `GAME_ENRICHED_INCLUDE`.  
2. Images/videos ordered by `sortOrder` (DB `orderBy` + in-mapper sort for safety).  
3. Trailers: videos whose title matches `/trailer/i`; else all videos.  
4. Video provider/videoId parsed from YouTube/Vimeo URLs.  
5. Logos: company logos exposed on media bundle and detail (documented; no dedicated LOGO kind).

---

## Repository Optimization

```text
GAME_ENRICHED_INCLUDE  ← single include graph
        │
        ├─ GameRepository.findById / findBySlug
        └─ GameMetadataRepository.loadEnriched (same include)
```

- No duplicated include objects.  
- One query with nested includes — no N+1.  
- Catalog list endpoints use lightweight `select` only.  
- Mapping centralized in `game-metadata.mapper.ts` → `toEnrichedGameDetail` / `toMediaBundle`.

---

## Cache Strategy

| Key | Contents | TTL |
|-----|----------|-----|
| `game:enriched:{id}` | Fully enriched detail | `GAME_DETAIL_CACHE_TTL_SECONDS` (24h) |
| `game:{id}` | Same payload (compat) | same |
| `game:slug:{slug}` | → gameId | same |

`invalidateGame(id, slug?)` clears enriched + legacy detail keys and discovery list keys — ready for metadata change hooks (no sync jobs this sprint).

---

## Events

| Event | When |
|-------|------|
| `game.metadata.viewed.v1` | Enriched detail / metadata slice reads |
| `game.media.viewed.v1` | Media endpoint reads |

Consumers not required.

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit `game-media-metadata.service.spec.ts` | **9/9** |
| Unit search/discovery (regression) | **11/11** |
| E2E `games-media-metadata.e2e-spec.ts` | **6/6** |
| E2E `games-catalog.e2e-spec.ts` (regression) | **9/9** |
| `pnpm typecheck` | **passed** |

### Coverage

- Enriched detail  
- Metadata retrieval (lists + developers/links)  
- Media ordering  
- Cache write/invalidation  
- Invalid identifiers  

---

## OpenAPI Gaps

| Gap | Handling |
|-----|----------|
| Screenshot/Artwork/Video `id` as integer | UUID strings (Prisma) |
| No AgeRating / IGDB Collection tables | Empty arrays / empty page |
| No dedicated LOGO media kind | Company logos on `logos` |
| width/height/artist/duration | null placeholders |
| Platform/Genre OpenAPI integer ids | UUID or IGDB int resolution |
| `GET .../external-ids` | Embedded on detail only |

---

## Known Limitations

1. No write path / sync — cache invalidation helper exists for future jobs.  
2. Catalog collections always empty under Freeze.  
3. Link store fields inferred from company website URL patterns.  
4. Engine, credits, critic scores, achievements deferred.

---

## Deliverables Checklist

- [x] Media endpoints + display order  
- [x] Metadata lists + per-game metadata  
- [x] Fully enriched `GET /games/{id}`  
- [x] Centralized include + mapper  
- [x] Enriched detail cache + invalidation API  
- [x] Domain events  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 3.4 until Sprint 3.3 has been reviewed and approved.**
