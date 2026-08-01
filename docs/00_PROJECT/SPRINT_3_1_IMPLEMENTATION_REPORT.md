# GMRLOG Sprint 3.1 — Game Catalog Core Implementation Report

**Sprint:** 3.1 — Game Catalog Core  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting review before Sprint 3.2**  
**Contracts:**  
- Catalog / discovery: `docs/08_API/GAME_API.yaml`  
- Game search: `docs/08_API/SEARCH_API.yaml` → `GET /search/games`  
- Cross-cutting list paths: `docs/08_API/API_SPECIFICATION.md` (documented gaps)  
**Schema:** unchanged (Database Freeze respected)

---

## Implemented Endpoints

| Method | Path | Auth | Contract | Purpose |
|--------|------|------|----------|---------|
| GET | `/api/v1/games/{gameId}` | Public | GAME_API | Game detail |
| GET | `/api/v1/games/trending` | Public | GAME_API | Trending list |
| GET | `/api/v1/games/upcoming` | Public | GAME_API | Upcoming releases |
| GET | `/api/v1/games/recent` | Public | GAME_API | Recently released |
| GET | `/api/v1/search/games` | Public | SEARCH_API | Full-text search + filters |
| GET | `/api/v1/games` | Public | **OpenAPI gap** (API_SPEC / sprint) | Catalog list + filters |
| GET | `/api/v1/games/slug/{slug}` | Public | **OpenAPI gap** (sprint) | Exact slug lookup |
| GET | `/api/v1/games/popular` | Public | **OpenAPI gap** (API_SPEC / sprint) | Popular list |

**Out of sprint:** reviews, game logs, recommendations, AI, achievements, news, store/price, HLTB, nested GAME_API sub-resources as separate routes (media/companies nested on detail instead).

---

## Architecture

```text
GamesController / GameSearchController (thin)
        │                    │
        ▼                    ▼
GameCatalogService    GameSearchService
        │                    │
        ▼                    ▼
GameRepository        GameSearchRepository
        │                    │
        └────────┬───────────┘
                 ▼
              Prisma
                 +
          GameCacheService (Redis)
```

| Component | Responsibility |
|-----------|----------------|
| `GameCatalogService` | Detail by id/slug, discovery lists, filtered pagination |
| `GameSearchService` | Search orchestration; exact-slug short-circuit; `GameSearched` event |
| `GameRepository` | Efficient Prisma selects/includes; filter/sort/cursor queries |
| `GameSearchRepository` | Search-only reads (exact slug); independent of detail includes |
| `GameCacheService` | `game:{id}`, `game:slug:{slug}`, list keys |

Search is independent from catalog retrieval at the service/repository boundary (`GameSearchService` / `GameSearchRepository`).

---

## Game Entity Retrieval

`GET /games/{gameId}` and `GET /games/slug/{slug}` return OpenAPI `Game` fields plus **catalog enrichment** (documented OpenAPI gap):

| Field | Source |
|-------|--------|
| title, slug, summary→description, storyline, cover | `Game` |
| releaseDate, releaseStatus | `Game.releaseDate` |
| ratings / averageRating / communityRating / popularity | `Game` |
| aggregatedRatings | `GameStatistics` |
| screenshots / artworks | `GameImage` by `GameMediaKind` |
| videos | `GameVideo` |
| releaseDates | `GameRelease` |
| genres, themes, gameModes, platforms | join tables |
| developers / publishers | `GameCompany` + `CompanyRole` |
| franchises | `GameFranchise` |
| websites | company `website` values (deduped) |
| ageRatings | empty — no Prisma model |
| metacritic / opencritic / hltb* | null — no columns under Freeze |
| IGDB collections | not mapped — no catalog collection table |

No user-specific data is included.

---

## Repository Strategy

- **Detail:** single `findFirst` with `include` for images, videos, releases, statistics, genres, themes, modes, platforms, companies, franchises — avoids N+1.
- **Lists / search:** `select` summary columns only; relation filters via `some` on join tables.
- **Indexes used:** `games.title`, `games.release_date`, `games.popularity`, unique `slug`.
- Methods are cache-friendly (pure reads; caching in service layer).

---

## Search Implementation

- **Contract:** `GET /search/games?q=` (SEARCH_API).
- **Engine:** PostgreSQL via Prisma — case-insensitive `contains` on `title` / `summary`, exact `slug` match. **No Elasticsearch.**
- **Exact slug:** `GameSearchRepository.findExactSlug` short-circuits when no relation filters.
- **Filters:** `platform`, `genre`, `developer`, `publisher`, `franchise` (UUIDs), `releaseYear`, `rating` (min).
- **Sort:** `RELEVANCE` \| `POPULARITY` \| `RECENT` \| `RATING` \| `TITLE` (RELEVANCE ≈ popularity under DB FTS limits).
- **Pagination:** cursor `(sortValue, id)` base64url; `limit` 1–100 default 20.

Filter IDs are **UUIDs** (Prisma). OpenAPI genre/platform path params use integers elsewhere — documented gap.

---

## Cache Strategy

| Key | TTL (configurable) | Default |
|-----|--------------------|---------|
| `game:{id}` | `GAME_DETAIL_CACHE_TTL_SECONDS` | 86400 (24h) |
| `game:slug:{slug}` → gameId | same | 86400 |
| `game:popular` | `GAME_LIST_CACHE_TTL_SECONDS` | 600 |
| `game:trending` | same | 600 |
| `game:upcoming` | same | 600 |
| `game:recent` | same | 600 |

`invalidateGame(id, slug?)` clears detail + discovery list keys (ready for IGDB sync / `game.updated.v1` consumers).

---

## Events

Published (consumers not required):

| Event | When |
|-------|------|
| `game.game.viewed.v1` | Cache hit on detail |
| `game.game.opened.v1` | Detail loaded from DB |
| `game.game.searched.v1` | Search executed |

Naming follows `{context}.{aggregate}.{action}.v{n}`. These types are **not** yet listed in `EVENT_ARCHITECTURE.md` core set — documented as sprint-driven analytics hooks.

---

## Validation

ProblemDetails via global filter + `AppException`:

- Invalid UUID (`gameId` / filters)
- Invalid slug pattern
- Invalid cursor
- Invalid sort / rating / releaseYear
- Missing `q` on search

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit `game-catalog.service.spec.ts` | **7/7 passed** |
| Unit `game-search.service.spec.ts` | **3/3 passed** |
| E2E `games-catalog.e2e-spec.ts` | **9/9 passed** |
| `pnpm typecheck` | **passed** |

### Coverage

- Game retrieval + slug retrieval  
- Search + filters + sorting + pagination  
- Invalid slug / invalid filter  
- Discovery endpoints  
- Cache write + manual invalidation  

---

## OpenAPI Gaps

| Gap | Handling |
|-----|----------|
| `GET /games` list | Implemented (API_SPEC + sprint) |
| `GET /games/slug/{slug}` | Implemented (sprint) |
| `GET /games/popular` | Implemented (API_SPEC + sprint) |
| Nested catalog relations on `Game` | Enriched response beyond thin GAME_API schema |
| Search under SEARCH_API not GAME_API | Followed ownership (`/search/games`) |
| Integer genre/platform IDs in OpenAPI | UUID filters (schema SSOT) |
| Age ratings / metacritic / HLTB columns | Null or empty |
| GameViewed/Opened/Searched in EVENT_ARCHITECTURE | Published with convention; docs sync pending |

---

## Known Limitations

1. Trending is popularity + `updatedAt` proxy (no analytics window yet).  
2. Full-text is ILIKE/contains — not Postgres `tsvector` / Elasticsearch.  
3. Separate GAME_API nested routes (screenshots page, developers page, etc.) not exposed as standalone endpoints this sprint — data available on detail.  
4. Platforms/genres/franchises **list** endpoints (`GET /platforms`, …) deferred.  
5. No write/sync/admin catalog APIs.  
6. Cache invalidation on catalog updates awaits IGDB sync events.

---

## Deliverables Checklist

- [x] Core GAME_API discovery + detail  
- [x] Search (SEARCH_API) with filters/sort/cursor  
- [x] Slug / list / popular (documented gaps)  
- [x] `GameCatalogService` + `GameSearchService`  
- [x] `GameRepository` + `GameSearchRepository`  
- [x] Redis cache with configurable TTL  
- [x] Domain events (no consumers required)  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 3.2 until Sprint 3.1 has been reviewed and approved.**
