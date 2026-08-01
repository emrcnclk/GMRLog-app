# GMRLOG Sprint 3.2 — Search & Discovery Implementation Report

**Sprint:** 3.2 — Search & Discovery  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting review before Sprint 3.3**  
**Contracts:**  
- Discovery: `docs/08_API/GAME_API.yaml`  
- Search / autocomplete: `docs/08_API/SEARCH_API.yaml`  
**Schema:** unchanged (Database Freeze respected)  
**Dependencies:** Sprint 3.1 Game Catalog Core (approved)

---

## Implemented Endpoints

| Method | Path | Auth | Contract | Purpose |
|--------|------|------|----------|---------|
| GET | `/api/v1/search/games` | Public | SEARCH_API | Game search + filters/sort/cursor |
| GET | `/api/v1/search/autocomplete` | Public | SEARCH_API | Game title/slug autocomplete |
| GET | `/api/v1/games` | Public | Gap (API_SPEC) | Filtered browsing |
| GET | `/api/v1/games/trending` | Public | GAME_API | Trending |
| GET | `/api/v1/games/upcoming` | Public | GAME_API | Upcoming |
| GET | `/api/v1/games/recent` | Public | GAME_API | Recently released |
| GET | `/api/v1/games/popular` | Public | Gap (API_SPEC) | Popular |
| GET | `/api/v1/genres/{genreId}/games` | Public | GAME_API | Browse by genre |
| GET | `/api/v1/franchises/{franchiseId}/games` | Public | GAME_API | Browse by franchise |

**Out of sprint:** Elasticsearch, AI recommendations, personalized ranking, global multi-entity `/search`, saved/recent searches, search analytics, non-game entity search.

---

## Architecture

```text
GamesController / GameSearchController / GameBrowseController
        │                  │                      │
        ▼                  ▼                      ▼
GameCatalogService   GameSearchService    GameDiscoveryService
 (detail only)              │                      │
                            └──────────┬───────────┘
                                       ▼
                            GameSearchRepository
                                       │
                          game-query.builder (shared WHERE/ORDER/cursor)
                                       ▼
                                    Prisma
                                       +
                     GameSearchCacheService + GameCacheService
```

| Component | Responsibility |
|-----------|----------------|
| `game-query.builder` | Single source of truth for filter/sort/cursor Prisma clauses |
| `GameSearchRepository` | All list/search/autocomplete/discovery SQL |
| `GameDiscoveryService` | Reusable discovery queries (no duplicated Prisma) |
| `GameSearchService` | Search + autocomplete + `search:{hash}` cache + events |
| `GameCatalogService` | Detail by id/slug only (Sprint 3.1) |

---

## Search Strategy

- **Engine:** PostgreSQL via Prisma — no Elasticsearch.
- **Match fields:** `title` (ILIKE contains), `slug` (contains / exact), `summary` as **alternative-name proxy** (no `GameAlternativeName` table under Freeze).
- **Autocomplete:** `title` / `slug` **startsWith**, ordered by popularity then title.
- **Exact slug:** short-circuit when no relation filters.
- **Filters:** platform, genre, developer, publisher, franchise, gameMode, theme, releaseYear / from–to, min rating.
- **Sort:** `RELEVANCE`, `POPULARITY`, `RECENT`, `RATING`, `TITLE`, `ALPHABETICAL` (alias of title asc).
- **Pagination:** cursor `(sortValue, id)` base64url; limit 1–100.

Genre/franchise path params accept **UUID or IGDB integer** (resolve via `igdbId`) to bridge OpenAPI integer ids and Prisma UUIDs.

---

## Caching Strategy

| Key | TTL env | Default |
|-----|---------|---------|
| `search:{hash}` | `SEARCH_CACHE_TTL_SECONDS` | 600 |
| `discover:{hash}` | `DISCOVER_CACHE_TTL_SECONDS` | 600 |
| `autocomplete:{query}` | `AUTOCOMPLETE_CACHE_TTL_SECONDS` | 300 |

Hash = SHA-256 prefix of normalized payload (filters, sort, cursor, limit, q).  
Legacy Sprint 3.1 keys (`game:popular`, etc.) still written for compatibility.

---

## Events

| Event | When |
|-------|------|
| `game.search.executed.v1` | Search executed (includes `cacheHit`) |
| `game.filter.applied.v1` | Filtered browse / filtered search |

Consumers not required.

---

## Performance Considerations

1. Summary `select` only on list paths — no N+1 includes.  
2. Shared builder avoids divergent filter SQL.  
3. ILIKE `contains` uses `games_title_idx` for prefix-friendly cases; leading-wildcard queries remain sequential-scan risk at large scale (acceptable until FTS / Elasticsearch in a later sprint).  
4. Autocomplete uses `startsWith` (better index behavior than contains).  
5. First-page discover/search results cached; cursor pages bypass discover cache.  
6. Parallel `findMany` + `count` for paginated totals.

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit `game-catalog.service.spec.ts` | **4/4** |
| Unit `game-search.service.spec.ts` | **6/6** |
| Unit `game-discovery.service.spec.ts` | **5/5** |
| E2E `games-discovery.e2e-spec.ts` | **9/9** |
| E2E `games-catalog.e2e-spec.ts` (regression) | **9/9** |
| `pnpm typecheck` | **passed** |

### Coverage

- Search, autocomplete, filters, sorting, pagination  
- Invalid filters, empty results  
- Cache hits (unit + e2e Redis keys)  
- Genre browse path  

---

## OpenAPI Gaps

| Gap | Handling |
|-----|----------|
| No alternative-names table | Search `summary` + slug variants as proxy |
| Autocomplete game-only | Implements SEARCH_API shape; other entity types not searched |
| `GET /games`, `/games/popular` | Documented gaps from 3.1 / API_SPEC |
| OpenAPI genre/franchise **integer** ids | Accept UUID or IGDB int |
| `ALPHABETICAL` sort | Sprint requirement; alias of `TITLE` |
| Global `/search`, advanced POST, recommendations | Deferred (multi-entity / AI) |

---

## Known Limitations

1. No true alternative-name entity.  
2. Relevance ≈ popularity (no BM25 / vector rank).  
3. Trending still popularity + `updatedAt` proxy.  
4. Autocomplete ignores non-`GAME` types.  
5. Cache invalidation on catalog sync still awaits IGDB update events.

---

## Deliverables Checklist

- [x] SEARCH_API game search + autocomplete  
- [x] GAME_API discovery + genre/franchise browse  
- [x] Shared discovery query builder  
- [x] Dedicated `GameSearchRepository`  
- [x] `search:` / `discover:` / `autocomplete:` cache  
- [x] Domain events (no consumers)  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 3.3 until Sprint 3.2 has been reviewed and approved.**
