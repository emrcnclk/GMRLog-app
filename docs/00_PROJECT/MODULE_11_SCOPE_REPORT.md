# Module 11 — Search & Discovery Scope Report

**Document:** `docs/00_PROJECT/MODULE_11_SCOPE_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Type:** Architecture discovery only — **no code, no migrations, no Prisma edits, no OpenAPI edits, no endpoint implementation**  
**Product roadmap ref:** `docs/01_PRODUCT/ROADMAP.md` (Phase 1 Internal Alpha includes **Search**; no separate `PROJECT_ROADMAP.md` in repo)  
**Backlog ref:** `docs/00_PROJECT/PRODUCT_BACKLOG.md` (AI/semantic search = Phase 2 backlog — not MVP)

**SSOT precedence applied:**

1. `NORTH_STAR.md`  
2. `docs/01_PRODUCT/ROADMAP.md` + Product Backlog (post-MVP AI deferred)  
3. `docs/08_API/SEARCH_API.yaml` (+ entity OpenAPI where search is delegated)  
4. Existing module architecture (Games, Reviews, Collections, Lists, Tier Lists, Users)  
5. `docs/00_PROJECT/DISCOVERY_COMMON_LAYER.md` + `docs/09_AI/VECTOR_SEARCH.md` (future / AI boundary)

---

## Executive Summary

Search & Discovery is **partially built inside domain modules** (Games, Collections, Lists, Tier Lists) but there is **no Search bounded-context Nest module**, **no global `/search` aggregator**, and **no User/Review search**. Database Freeze already provides `SavedSearch`, `SearchEvent`, and `SearchEntityType`. OpenAPI `SEARCH_API.yaml` is a **full contract** spanning MVP keyword search through advanced/recommendation surfaces.

**Module 11 MVP** must deliver a **keyword / deterministic Activity Center–style discovery home** for gaming culture:

- Global Search  
- Per-entity search: Games, Users, Reviews, Collections, Lists, Tier Lists  
- Basic Discovery (featured / trending / recent-style surfaces composed into `/discover`)

**Explicitly out of Module 11 MVP (Phase 2 / AI):** AI Search, semantic/vector search, recommendation engine, trending ML, personalized ranking, hybrid Meilisearch+pgvector, voice search, OCR/image search.

**Recommended path:** Introduce a thin **Search BC** that **owns** global orchestration, recent/trending search history, and `/discover` composition — while **delegating** entity query execution to existing domain search services (and adding missing Users/Reviews search there or via Search adapters). Prefer **no new Prisma models** for MVP; reuse `SearchEvent` / optional Redis for recent queries. Prefer **no OpenAPI edits** in discovery/architecture sprints — unlock ops with sprint tags later if needed.

---

## Goals

### Primary

Make GMRLOG searchable and discoverable as a **digital home for gaming culture**: find games, people, and player-created content quickly — without becoming a generic social search engine or shipping AI ranking prematurely.

### Success criteria (Module 11 MVP complete)

| Criterion | Measure |
|-----------|---------|
| Global search | `GET /search` returns multi-type results with cursor/limit |
| Entity search | Games, Users, Reviews, Collections, Lists, Tier Lists each queryable via SEARCH_API entity paths |
| Basic discovery | `GET /discover` (and/or composed browse) surfaces public featured/trending content |
| Privacy | User search respects `searchVisibility` / profile visibility; content respects PUBLIC (and documented visibility rules) |
| North Star | Gaming-first targets; no Discord-style presence search; no marketing spam ranking |
| Deterministic only | Keyword / SQL (or future Meilisearch keyword) — **no** vector/AI in MVP |
| BC clarity | Search orchestrates; domains remain SoT for entities |
| Latency | Competitive autocomplete + search for Internal Alpha (align with platform API SLOs) |

### Non-goals (this module MVP)

- AI / semantic / hybrid vector search (`AI_API.yaml`, `VECTOR_SEARCH.md`)  
- Personalized feed ranking / recommendation engine  
- Saved-search product depth, analytics dashboards, admin search config  
- Communication message search / group discover (Communication BC)  
- Metadata-only catalogs as first-class MVP (developers, genres, …) — Phase 2 or thin alias to Games catalog  
- Replacing existing entity discovery routes under `/games`, `/collections`, etc.

---

## Domain boundaries

```text
Search & Discovery (Module 11)
  ├── Global query orchestration
  ├── Autocomplete orchestration (multi-type)
  ├── Recent / trending search queries (history)
  ├── Discover composition (sections over domain discovery)
  └── Privacy gates at search edge (esp. users)

Does NOT own
  ├── Game / Review / Collection / List / TierList / User aggregates
  ├── Feed materialization
  ├── Notifications
  ├── Communication message search
  ├── AI embeddings / vector index
  └── Ads / sponsored ranking
```

**Rule:** Upstream domains remain source of truth. Search returns **snapshots / summaries** suitable for SERP cards; detail pages stay on domain APIs.

---

## Bounded context ownership

| Concern | Owner | Notes |
|---------|-------|-------|
| Global `/search`, `/search/autocomplete` (multi-type), `/search/recent*`, `/search/trending`, `/discover` | **Search BC** | New Nest module recommended |
| `GET /search/games` | Games (existing) | Search may proxy |
| `GET /search/collections|lists|tierlists` | Collections / Lists / Tier Lists (existing) | Search may proxy |
| `GET /search/users` | Users (+ Privacy) or Search adapter | **Missing today** |
| `GET /search/reviews` | Reviews or Search adapter | **Missing today** |
| Featured/trending browse under `/games`, `/collections`, … | Domain modules | Already live; Discover composes |
| `SavedSearch` CRUD | Search BC (post-MVP or late sprint) | Schema ready; not MVP-required by kickoff list |
| `SearchEvent` analytics writes | Search BC | Prefer write on global/entity search for trending |
| Vector / AI search | AI BC | `POST /ai/search` — Phase 2 |
| Shared discovery builders/cache | `apps/api/src/common/discovery/` | Reuse; do not reinvent |

---

## Search targets (MVP)

| Target | OpenAPI | Runtime today | MVP action |
|--------|---------|---------------|------------|
| **Games** | `searchGames` | **Implemented** (`GameSearchService`, cache, events) | Harden + wire into global |
| **Users** | `searchUsers` | **Missing** | Implement + `PrivacyService.isSearchable` |
| **Reviews** | `searchReviews` | **Missing** | Implement (published + visibility) |
| **Collections** | `searchCollections` | **Implemented** (ILIKE, PUBLIC) | Wire into global; optional cache/event parity |
| **Lists** | `searchLists` | **Implemented** | Wire into global |
| **Tier Lists** | `searchTierLists` | **Implemented** | Wire into global |
| **Global** | `globalSearch` | **Missing** | Fan-out + merge + per-type cursors/limits |

### Deferred targets (not MVP)

Developers, publishers, franchises, genres, platforms, tags, companies — OpenAPI exists; treat as **Phase 2 metadata search** or thin Games-catalog aliases after core MVP.

---

## Discovery surfaces

### Basic Discovery (MVP)

| Surface | Intent | Suggested implementation |
|---------|--------|--------------------------|
| `GET /discover` | Homogeneous discovery home | Compose sections from existing domain featured/trending/popular/recent |
| Domain browse (already live) | Deep links | Keep `/games/trending`, `/collections/featured`, `/lists/*`, `/tierlists/*` |
| Autocomplete | Typeahead | Extend beyond games-only; cap types to MVP entities |
| Trending searches | Query popularity | Aggregate from `SearchEvent` (or Redis counters) — **heuristic counts, not ML** |
| Recent searches | Per-user history | Redis list and/or `SearchEvent` for authenticated users |

### Explicitly not Basic Discovery MVP

| Surface | Why deferred |
|---------|--------------|
| `GET /explore` | Static/UI section catalog — polish / later |
| `searchRecommendations` | Rec engine |
| `popularSearches` vs `trendingSearches` split | Duplicate product surface — pick one for MVP (`trendingSearches`) |
| Feed `/feed/discover`, `/feed/trending` | Social Feed BC — compose links only, do not absorb |
| Groups discover | Communication BC |

---

## Existing dependencies

### Already production-usable (partial)

| Layer | Artifact |
|-------|----------|
| OpenAPI | `docs/08_API/SEARCH_API.yaml` (complete contract) |
| DB | `SearchEntityType`, `SavedSearch`, `SearchEvent` |
| Games | `/search/games`, `/search/autocomplete` (games-only), discovery browse + Redis |
| Collections / Lists / Tier Lists | `/search/{entity}`, featured/trending (+ popular where present) |
| Shared | `common/discovery` builders + cache |
| Privacy | `searchVisibility` extras + `PrivacyService.isSearchable` |
| Events (partial) | `game.search.executed.v1`, `list.search.executed.v1`, `tierlist.search.executed.v1` |

### Missing for MVP

| Gap | Impact |
|-----|--------|
| Nest `SearchModule` / global search | No unified SERP |
| User search endpoint | Cannot find people |
| Review search endpoint | Cannot find reviews |
| Recent / trending search APIs | No query history UX |
| `/discover` aggregator | No SEARCH_API discover home |
| Collection search events / cache parity | Inconsistent observability |
| Meilisearch runtime | Docs mention Meilisearch; **code is Prisma ILIKE today** — MVP should assume **SQL-first** unless a Freeze unlocks Meilisearch infra |

### Related docs (boundary)

| Doc | Role |
|-----|------|
| `VECTOR_SEARCH.md` | Semantic / pgvector — **Phase 2** |
| `AI_API.yaml` `/ai/search` | NL search — **Phase 2** |
| `DISCOVERY_COMMON_LAYER.md` | Shared infra already approved |

---

## Required events

### Consume / emit (MVP)

| Event | Direction | Purpose |
|-------|-----------|---------|
| `game.search.executed.v1` | Emit (exists) | Analytics / trending |
| `list.search.executed.v1` | Emit (exists) | Parity |
| `tierlist.search.executed.v1` | Emit (exists) | Parity |
| `collection.search.executed.v1` | Emit (**add if missing**) | Parity — **prefer existing naming patterns; do not invent in discovery sprint without Event Matrix row** |
| `*.search.executed.v1` for users/reviews/global | Emit | Optional in MVP; document in Event Matrix before coding |
| Domain visibility/content updates | Consume (later) | Only if external index (Meilisearch) is introduced — **not required for SQL MVP** |

**Rule:** Module 11 MVP does **not** invent AI embed job events (`search.embed.*`). Those belong to Phase 2 vector pipeline.

### Indexing

For SQL MVP: **no separate search index sync**. For optional Meilisearch Phase 1.5+: consume domain `*.created/updated/deleted` events — architecture amendment required.

---

## Required cache strategy

| Key / pattern | Use | Invalidation |
|---------------|-----|--------------|
| Existing game search / autocomplete / discovery keys | Keep | Existing game cache services |
| Existing collection/list/tierlist discovery keys | Keep | Existing discovery caches |
| `search:global:{hash}` (optional) | Short TTL first-page global merge | Query-hash only; **targeted**; no global flush |
| `search:recent:{userId}` | Recent queries | On new search / clear |
| `search:trending:queries` | Top queries window | TTL refresh from `SearchEvent` aggregates |

**Hard rules:** No `FLUSHALL`; no caching private user hits into public trending; respect privacy on cached user cards.

---

## Required permissions

| Action | ANON | USER |
|--------|------|------|
| Global / entity search (public content) | ✅ (rate-limited) | ✅ |
| User search | ✅ only `searchVisibility=PUBLIC` profiles | ✅ same |
| Recent searches | — | ✅ own |
| Clear recent | — | ✅ own |
| Discover public sections | ✅ | ✅ |
| Saved searches | — | ✅ own (if unlocked later) |
| Search analytics admin | — | Admin only (deferred) |

Controllers remain thin; Search service enforces privacy; never return another user’s recent searches.

---

## Required visibility rules

| Entity | Search visibility (MVP) |
|--------|-------------------------|
| Games | Published / searchable catalog rules (existing Games BC) |
| Users | `searchVisibility === PUBLIC` (+ not suspended/deleted); profile card fields minimized if needed |
| Reviews | Published; respect review visibility (PUBLIC / followers / private) — **viewer-aware** |
| Collections / Lists / Tier Lists | **PUBLIC** only for anonymous & default search (match current entity search) |
| Soft-deleted | Suppress |

Block relationships: do not surface blocked users in user search when viewer is authenticated (align with Social block matrix).

---

## Existing OpenAPI coverage

**Contract:** `docs/08_API/SEARCH_API.yaml` (v1.0.0)

### MVP-relevant ops (implement / unlock)

| operationId | Path | Runtime |
|-------------|------|---------|
| `globalSearch` | `GET /search` | ❌ |
| `autocomplete` | `GET /search/autocomplete` | ⚠️ games-only |
| `recentSearches` / `clearRecentSearches` | `GET|DELETE /search/recent` | ❌ |
| `trendingSearches` | `GET /search/trending` | ❌ |
| `searchGames` | `GET /search/games` | ✅ |
| `searchUsers` | `GET /search/users` | ❌ |
| `searchReviews` | `GET /search/reviews` | ❌ |
| `searchCollections` | `GET /search/collections` | ✅ |
| `searchLists` | `GET /search/lists` | ✅ |
| `searchTierLists` | `GET /search/tierlists` | ✅ |
| `discover` | `GET /discover` | ❌ |

### OpenAPI present but **out of Module 11 MVP**

`advancedSearch`, `suggestions`, `savedSearches` / `saveSearch` / `deleteSavedSearch`, `popularSearches`, `searchRecommendations`, `searchFilters`, `searchAnalytics`, metadata entity searches, `explore`.

**This report does not modify OpenAPI.** Sprint Freeze may later tag MVP vs `future` for clarity.

---

## Future features (clearly separated)

### Phase 2 — AI / advanced (Product Backlog + VECTOR_SEARCH)

- AI Search / natural language (`AI_API`)  
- Semantic / vector KNN (pgvector)  
- Hybrid Meilisearch + vector ranking  
- Recommendation engine / personalized ranking  
- Trending ML (vs heuristic query counts)  
- Voice search  
- OCR / image search  

### Phase 2 — Product depth (still Search BC)

- Saved searches (schema ready)  
- Advanced filters UI API  
- Search analytics product  
- Metadata entity search (genres, platforms, …)  
- Meilisearch as primary keyword engine (infra Freeze)  
- `/explore` curated sections  

### Explicit non-goals forever for Module 11 alone

- Owning Feed ranking  
- Owning Communication message search  
- Sponsored result injection without Ads BC  

---

## Risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R1 | Fragmented ownership (entity search vs global) | High | Thin Search BC + explicit delegate table |
| R2 | SQL `ILIKE` does not scale | High | Cursor limits, indexes, cache; plan Meilisearch as Phase 1.5/2 without blocking MVP API |
| R3 | User search leaks private profiles | High | Hard gate `isSearchable` + block checks + tests |
| R4 | Review search leaks private/spoiler content | High | Visibility + spoiler policy at edge |
| R5 | Global fan-out latency (N parallel queries) | Medium | Per-type limits; timeouts; partial results |
| R6 | Trending queries surface toxic/PII strings | Medium | Allowlist entity types; moderation/filter; no private query text in public trending |
| R7 | Doc/runtime engine mismatch (Meilisearch vs Prisma) | Medium | Scope Freeze: **SQL-first MVP** written into Sprint 11.0 |
| R8 | Duplicate discovery with Feed/Social trending | Low | Discover composes; does not re-rank Feed |

---

## Blockers

| Blocker | Status | Unlock |
|---------|--------|--------|
| OpenAPI contract | ✅ Exists | Sprint tagging optional |
| DB models for history/analytics | ✅ `SearchEvent` / `SavedSearch` | Prefer reuse; no new tables for MVP |
| Games/Collections/Lists/TierLists search | ✅ Partial | Wire + gaps |
| Users / Reviews search | ❌ Missing | Required for MVP completeness |
| Privacy search gate | ⚠️ Ready unused | Wire into user search |
| Search architecture / Event Matrix / Cache / Permission docs | ❌ Missing | **Sprint 11.0** before heavy coding |
| Meilisearch / Redis infra for “production search” | Optional | Not a hard blocker if SQL MVP accepted |

**No Database Freeze amendment required** for MVP if no new models/enums.

---

## Recommended sprint breakdown

| Sprint | Name | Outcome |
|--------|------|---------|
| **11.0** | Search Architecture Freeze | ADR + architecture + Event/Cache/Permission/Visibility matrices; lock SQL-first MVP; tag OpenAPI MVP vs future (docs-only if process allows) |
| **11.1** | Search Core — Global + Autocomplete | `SearchModule`; `globalSearch`; multi-type autocomplete; fan-out to existing game/collection/list/tierlist search |
| **11.2** | Entity Gaps — Users + Reviews | `searchUsers` + `searchReviews` with visibility/block; wire into global |
| **11.3** | Basic Discovery + Query History | `discover` composition; recent searches; trending searches (heuristic via `SearchEvent`/Redis) |
| **11.4** | Hardening & Audit | Rate limits, cache, parity events, e2e, final audit; declare Module 11 MVP complete |

Optional stretch (only if 11.0 unlocks): SavedSearch CRUD using existing table — **not** required by kickoff MVP list.

Do **not** schedule AI/vector sprints inside Module 11 MVP.

---

## Alignment checks

| Source | Alignment |
|--------|-----------|
| North Star | Gaming discovery home; AI Native deferred to Phase 2 backlog |
| ROADMAP Phase 1 “Search” | Covered by Module 11 MVP |
| ROADMAP Phase 3 “Discover / Trending / Search Improvements” | Basic Discover in MVP; ML trending later |
| Product Backlog AI Search | Explicitly Phase 2 — not MVP |
| Module 10 complete | Notifications independent; search may emit analytics events only |

---

## Decision

**APPROVED WITH MINOR CHANGES**

Minor changes to lock before coding:

1. **SQL-first MVP** (document Meilisearch as optional upgrade, not blocker).  
2. **Ownership:** Search BC owns global/recent/trending/discover; domains keep entity search SoT.  
3. **Users + Reviews search** are mandatory MVP gaps — schedule in 11.2.  
4. **Sprint 11.0 Freeze** required (architecture + matrices) before endpoint implementation.  
5. Autocomplete expansion must not pull AI suggestions into MVP.

No redesign of existing Games/Collections/Lists/Tier Lists search is required; composition over rewrite.

---

## Gate

**Module 11 Scope Report complete.**

- No code  
- No Prisma changes  
- No OpenAPI changes  
- No migrations  
- No endpoint implementation  

**Stop.** Do not start Sprint 11.0 implementation until this report is accepted and architecture Freeze work is authorized.
