# Sprint 11.1 — Search Core Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_11_1_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Search Core only — Global Search + Autocomplete (Freeze v1.0)  
**Freeze:** [`SEARCH_PLATFORM_FREEZE_v1.md`](./SEARCH_PLATFORM_FREEZE_v1.md)  
**Architecture:** [`SPRINT_11_0_SEARCH_ARCHITECTURE.md`](./SPRINT_11_0_SEARCH_ARCHITECTURE.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 11.1 delivers the **Search BC orchestration** surface: `GET /search` (global fan-out) and multi-type `GET /search/autocomplete`. Search delegates to existing Games / Collections / Lists / Tier Lists search services; domains remain source of truth. No AI/semantic/vector/recs, no Users/Reviews search, no Discover/recent/trending APIs, no new Prisma models/migrations, no OpenAPI edits.

| Item | Result |
|------|--------|
| Freeze 11.1 ops | **2 / 2** (`globalSearch`, `autocomplete`) |
| Domain integrations | Games, Collections, Lists, Tier Lists |
| Users / Reviews sections | Empty pages (deferred **11.2**) |
| New tables / migrations / OpenAPI | **0** |
| Quality gates | **Pass** (scoped as prior sprints) |

---

## Implemented operations

| # | operationId | Method | Path |
|---|-------------|--------|------|
| 1 | `globalSearch` | GET | `/search` |
| 2 | `autocomplete` | GET | `/search/autocomplete` |

### Behaviour

| Rule | Implementation |
|------|----------------|
| Orchestration only | `SearchService` fans out via domain services; no domain Prisma ownership queries |
| Partial failure | `Promise.allSettled` — failed branches become empty pages |
| Type allowlist | MVP: `GAME\|USER\|REVIEW\|COLLECTION\|LIST\|TIERLIST`; 11.1 executes GAME/COLLECTION/LIST/TIERLIST |
| USER / REVIEW | Empty `users` / `reviews` pages (no domain ports yet) |
| Metadata types | Ignored / empty arrays (`developers`, `publishers`, `franchises`) |
| Cursor | Forwarded only when a single implemented type is requested |
| Cache | Cache-aside `search:global:{hash}` / `search:autocomplete:{hash}` (TTL ~45s); `viewerBucket` anon\|auth |
| Analytics | Best-effort `SearchEvent` insert + `search.global.executed.v1` |
| Collection parity | `collection.search.executed.v1` on collection entity search |
| Auth | Optional JWT (`security: []`); viewerId for analytics / domain actor context |
| Controllers | Thin — zero business logic |
| Repository | `SearchEventRepository` persistence only |

Entity routes (`/search/games`, `/search/collections`, …) remain on domain controllers. Game-only autocomplete was **moved** from `GameSearchController` to `SearchController` so multi-type OpenAPI contract is owned by Search BC.

---

## Files changed

### New

| File | Role |
|------|------|
| `apps/api/src/search/search.constants.ts` | Limits, cache keys, events, type allowlists |
| `apps/api/src/search/search.exceptions.ts` | Validation errors |
| `apps/api/src/search/search.entities.ts` | Global / autocomplete response shapes |
| `apps/api/src/search/search.dto.ts` | Query DTOs |
| `apps/api/src/search/search-event.repository.ts` | `SearchEvent` persistence |
| `apps/api/src/search/search-cache.service.ts` | Targeted Redis get/set |
| `apps/api/src/search/search.service.ts` | Orchestration |
| `apps/api/src/search/search.controller.ts` | Thin HTTP |
| `apps/api/src/search/search.module.ts` | Nest wiring |
| `apps/api/src/search/search.service.spec.ts` | Unit |
| `apps/api/src/search/search.integration.spec.ts` | Integration (doubles) |
| `apps/api/test/search-core.e2e-spec.ts` | E2E |
| `docs/00_PROJECT/SPRINT_11_1_IMPLEMENTATION_REPORT.md` | This report |

### Updated

| File | Change |
|------|--------|
| `apps/api/src/app.module.ts` | Import `SearchModule` |
| `apps/api/src/games/search/game-search.controller.ts` | Remove autocomplete (owned by Search) |
| `apps/api/src/collections/collection.constants.ts` | `SearchExecuted` event name |
| `apps/api/src/collections/collection-discovery.service.ts` | Emit `collection.search.executed.v1` |
| `apps/api/src/collections/collection-search.controller.ts` | Optional JWT + viewerId |

### Explicitly not changed / not implemented

- Prisma schema / migrations  
- OpenAPI YAML  
- Users / Reviews search  
- `GET/DELETE /search/recent`, trending, Discover  
- Saved Searches CRUD  
- AI / semantic / vector / recommendations / personalized ranking  
- Global Redis flush  

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` (packages/database) | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint scoped to Sprint 11.1 files | ✅ |
| Unit + integration (`vitest src/search`) | ✅ **11/11** |
| E2E `test/search-core.e2e-spec.ts` | ✅ **1/1** |

Note: Full-repo `pnpm --filter @gmrlog/api lint` still reports pre-existing errors outside this sprint (same pattern as Module 10 reports).

---

## Remaining future / later sprint

| Area | Sprint |
|------|--------|
| Users + Reviews entity search | **11.2** |
| Recent + trending + Discover | **11.3** |
| Hardening + audit | **11.4** |
| Meilisearch / vector / AI | Phase 2 |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Search owns orchestration only | ✅ |
| Domains remain SoT for entity search | ✅ |
| Search never queries foreign domain DB as owner | ✅ |
| Global merges delegated results | ✅ |
| Controllers zero business logic | ✅ |
| Repositories persistence only | ✅ |
| Targeted cache; no global flush | ✅ |
| Freeze 11.1 scope lock | ✅ |
| No OpenAPI / Prisma invent | ✅ |

---

## Gate

Sprint **11.1 Search Core complete.**

Do **not** continue to Sprint 11.2.

**Waiting for architecture review.**
