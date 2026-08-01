# Search Architecture

**Document:** `docs/01_ARCHITECTURE/SEARCH_ARCHITECTURE.md`  
**Status:** **Frozen — Search Platform Freeze v1.0** (Sprint 11.0)  
**SSOT contract:** [`SEARCH_API.yaml`](../08_API/SEARCH_API.yaml)  
**Freeze declaration:** [`SEARCH_PLATFORM_FREEZE_v1.md`](../00_PROJECT/SEARCH_PLATFORM_FREEZE_v1.md)  
**Related:** [ADR_Search_Platform.md](./ADR/ADR_Search_Platform.md)  
**Scope:** [`MODULE_11_SCOPE_REPORT.md`](../00_PROJECT/MODULE_11_SCOPE_REPORT.md)

---

## Purpose

GMRLOG Search is the **orchestration bounded context** for finding and discovering gaming-culture content: games, people, reviews, and player-created collections / lists / tier lists.

Search **never owns** entity aggregates. Domains remain the source of truth. Search **composes** SERP cards, autocomplete suggestions, recent/trending query history, and a basic Discover home by **delegating** queries to domain search/discovery services.

---

## Bounded context

```text
Search
  ├── Global Search orchestration          [Sprint 11.1]
  ├── Autocomplete orchestration           [Sprint 11.1]
  ├── Recent searches (per-user)           [Sprint 11.3]
  ├── Trending searches (heuristic)        [Sprint 11.3]
  ├── Discover composition                 [Sprint 11.3]
  ├── SearchEvent analytics writes         [Sprint 11.1+]
  └── SavedSearch CRUD                     [Phase 2 / optional late]

Does NOT own
  ├── Game / User / Review / Collection / List / TierList aggregates
  ├── Feed ranking or Feed discover
  ├── Communication message / group search
  ├── AI embeddings / vector index
  ├── Recommendation engine
  └── Ads / sponsored ranking
```

**Must delegate:** Entity keyword queries to Games, Users, Reviews, Collections, Lists, Tier Lists.  
**May reuse:** `apps/api/src/common/discovery/` builders and cache helpers for Discover sections.

---

## Entity ownership (delegation)

| Entity | Query owner | Search BC role |
|--------|-------------|----------------|
| Game | Games (`GameSearchService` / discovery) | Call / proxy; merge into global |
| User | Users (+ Privacy) | Call after gap implementation (11.2) |
| Review | Reviews | Call after gap implementation (11.2) |
| Collection | Collections | Call existing `/search/collections` service |
| List | Lists | Call existing list search |
| Tier List | Tier Lists | Call existing tierlist search |
| Metadata (genre, platform, …) | Games catalog | **Out of MVP** |

HTTP routes under `/search/{entity}` may continue to live in domain controllers; Search BC owns **global**, **autocomplete (multi-type)**, **recent**, **trending**, and **`/discover`**.

---

## Orchestration model

```text
Client
  │
  ▼
Search HTTP (thin controllers)
  │
  ▼
SearchApplicationService
  ├── Privacy / block gates (Visibility + Permission matrices)
  ├── Fan-out to domain search ports (parallel, limited)
  ├── Merge + per-type caps + cursor handling
  ├── Write SearchEvent (+ emit *.search.executed.v1)
  └── Targeted Redis cache get/set/invalidate
```

**Ports:** Search depends on domain **query interfaces** (Nest injectable services already exported, or thin adapters). Search must **not** import Prisma models of other BCs for business writes.

---

## Global search flow

```text
GET /search?q=&types=&cursor=&limit=
        │
        ├─ validate q (min/max length)
        ├─ resolve type allowlist (MVP: GAME, USER, REVIEW, COLLECTION, LIST, TIERLIST)
        ├─ optional cache: search:global:{hash}
        │
        ├─ Promise.allSettled([
        │     games.search(q, viewer),
        │     users.search(q, viewer),   // 11.2+
        │     reviews.search(q, viewer), // 11.2+
        │     collections.search(q),
        │     lists.search(q, viewer),
        │     tierlists.search(q, viewer),
        │   ])  // skip types not requested; timeout per branch
        │
        ├─ merge sections into GlobalSearchResponse
        ├─ record SearchEvent + emit search.global.executed.v1
        └─ push recent (if authenticated)
```

**Partial failure:** Prefer returning successful sections with empty failed types over failing the whole request (document in API errors only when `q` invalid).

---

## Autocomplete flow

```text
GET /search/autocomplete?q=&types=&limit=
        │
        ├─ short-circuit if q below min length
        ├─ cache: search:autocomplete:{hash}
        ├─ fan-out capped suggestions per type (MVP entities)
        ├─ Games path may reuse existing game autocomplete
        └─ no AI / no “suggestions” ML endpoint in V1
```

OpenAPI `suggestions` (`/search/suggestions`) is **out of Freeze V1 MVP** (AI-ish / ranking).

---

## Discover flow

```text
GET /discover
        │
        ├─ compose sections from domain discovery ports:
        │     games trending/popular/recent/upcoming (existing)
        │     collections featured/trending
        │     lists featured/trending/popular
        │     tierlists featured/trending
        ├─ optional cache: search:discover:{hash}
        └─ NEVER re-rank Feed; NEVER pull Communication groups
```

Discover is **composition only** — no new popularity algorithm in Search BC for V1.

---

## Recent searches

| Concern | Rule |
|---------|------|
| Storage | Redis list `search:recent:{userId}` (primary); optional mirror via `SearchEvent` |
| AuthZ | Authenticated caller **own** history only |
| Write | On successful global/entity search (authenticated) |
| Clear | `DELETE /search/recent` deletes caller’s list only |
| Cap | Fixed max entries (e.g. 20); newest first |

Anonymous: no recent persistence.

---

## Trending searches

| Concern | Rule |
|---------|------|
| Source | Heuristic aggregates over `SearchEvent` (and/or Redis counters) |
| Not ML | No personalized / learned ranking in V1 |
| Privacy | Never publish private/authenticated-only query strings that identify individuals; filter blocked/toxic terms via moderation policy hooks later |
| Cache | `search:trending:queries` short TTL |
| API | Prefer `trendingSearches`; `popularSearches` deferred as duplicate |

---

## SearchEvent lifecycle

```text
Search executed (global or entity)
        │
        ▼
Insert SearchEvent { userId?, query, resultCount, filters? }
        │
        ▼
Emit analytics domain event (*.search.executed.v1)
        │
        ▼
Trending aggregator (async or on-read rollup) reads SearchEvent
```

- `SearchEvent` is **analytics / history infrastructure**, not entity SoT.  
- `SavedSearch` table exists but CRUD is **out of V1 MVP** unless a later sprint unlocks it.  
- No invented business events that mutate Games/Users/Reviews.

---

## Engine strategy (normative)

| Phase | Engine |
|-------|--------|
| **V1 MVP** | **SQL-first** (Prisma / PostgreSQL `ILIKE` / existing domain queries) |
| Later | Meilisearch keyword index (optional upgrade; requires infra Freeze) |
| Phase 2 | pgvector + AI Search (`AI_API` / `VECTOR_SEARCH.md`) |

See ADR-SEARCH-001.

---

## Sprint map (implementation after Freeze)

| Sprint | Deliverable |
|--------|-------------|
| 11.0 | This architecture + Freeze SSOT |
| 11.1 | Global + multi-type autocomplete orchestration |
| 11.2 | Users + Reviews entity search gaps |
| 11.3 | Discover + recent + trending |
| 11.4 | Hardening + audit |

---

## Explicit exclusions

Feed ownership, Communication search, Recommendations, AI/semantic/hybrid/voice/OCR search, sponsored results, metadata entity search pack (developers/genres/…), `/explore`, `/search/advanced`, `/search/recommendations`, `/search/analytics`.
