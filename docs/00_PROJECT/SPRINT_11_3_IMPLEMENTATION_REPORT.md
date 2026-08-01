# Sprint 11.3 — Discover, Recent & Trending Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_11_3_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Discover + Recent Searches + Trending Searches only (Freeze v1.0)  
**Freeze:** [`SEARCH_PLATFORM_FREEZE_v1.md`](./SEARCH_PLATFORM_FREEZE_v1.md)  
**Prior:** [`SPRINT_11_1_IMPLEMENTATION_REPORT.md`](./SPRINT_11_1_IMPLEMENTATION_REPORT.md), [`SPRINT_11_2_IMPLEMENTATION_REPORT.md`](./SPRINT_11_2_IMPLEMENTATION_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 11.3 delivers Discover composition, per-user Recent Searches, and SearchEvent-backed Trending Searches. Search remains orchestration-only; domains stay SoT. No Saved Searches, analytics APIs, AI/ML/Meilisearch/vector, no Prisma/OpenAPI changes.

| Item | Result |
|------|--------|
| Freeze 11.3 ops | **4 / 4** |
| Discover sections | 6 (games / reviews / collections / lists / tier lists / users) |
| New tables / migrations / OpenAPI | **0** |
| Quality gates | **Pass** (scoped) |

---

## Implemented operations

| # | operationId | Method | Path | Auth |
|---|-------------|--------|------|------|
| 1 | `discover` | GET | `/discover` | Public |
| 2 | `recentSearches` | GET | `/search/recent` | JWT **own only** |
| 3 | `clearRecentSearches` | DELETE | `/search/recent` | JWT **own only** → **204** |
| 4 | `trendingSearches` | GET | `/search/trending` | Public |

`popularSearches` left unimplemented (Freeze: trending only; duplicate deferred).

### Discover

| Section | Domain port | Ordering |
|---------|-------------|----------|
| Trending Games | `GameDiscoveryService.getTrending()` | Existing Games discovery |
| Popular Reviews | `ReviewDiscoveryService.listPopularPublic()` | `likeCount DESC` (PUBLIC only) |
| Featured Collections | `CollectionDiscoveryService.listFeatured()` | Existing |
| Featured Lists | `ListDiscoveryService.listFeatured()` | Existing |
| Featured Tier Lists | `TierListDiscoveryService.listFeatured()` | Existing |
| Recently Active Users | `UserDiscoveryService.listRecentlyActive()` | `lastActiveAt DESC` + PUBLIC searchVisibility |

Partial failure via `Promise.allSettled` → empty section. Cache: `search:discover:{hash}` TTL ~90s.

### Recent searches

| Rule | Implementation |
|------|----------------|
| Storage | Redis list `search:recent:{userId}` (cap 20) |
| Write | Authenticated `GET /search` → write-through |
| Read / clear | Caller only (`JwtAuthGuard`) |
| Event | `search.recent.cleared.v1` on DELETE |

### Trending searches

| Rule | Implementation |
|------|----------------|
| Source | `SearchEvent` groupBy query, rolling **7 days** |
| Threshold | `minCount >= 2` (reduces unique private query leak) |
| Cache | `search:trending:queries` TTL ~90s (Freeze key name) |
| No ML / AI / recs | ✅ |

---

## Files changed

### New

| File | Role |
|------|------|
| `discover.service.ts` / `discover.entities.ts` | Discover composition |
| `recent-search.service.ts` | Per-user recent list |
| `trending-search.service.ts` | SearchEvent aggregation |
| `review-discovery.repository.ts` / `.service.ts` | Popular PUBLIC reviews |
| `user-discovery.service.ts` | Recently active searchable users |
| `discover.integration.spec.ts` | Unit/integration for 11.3 services |
| `test/search-discover.e2e-spec.ts` | E2E |
| `SPRINT_11_3_IMPLEMENTATION_REPORT.md` | This report |

### Updated

| File | Change |
|------|--------|
| `search.constants.ts` / `search-cache.service.ts` | Discover / recent / trending keys + TTLs |
| `search-event.repository.ts` | `aggregateTrendingQueries` |
| `search.service.ts` | Recent write-through on global search |
| `search.controller.ts` | Recent / trending routes + `DiscoverController` |
| `search.module.ts` | Wire 11.3 providers |
| `redis.service.ts` | `listPushFront` / `listRange` / `listRemoveAll` |
| `users.module.ts` / `reviews.module.ts` | Export discovery services |
| Search specs | Constructor + recent hook |

### Explicitly not implemented

- Saved Searches / Search Analytics  
- `/search/popular`  
- AI / semantic / Meilisearch / pgvector / personalized ranking  
- Prisma schema / migrations / OpenAPI edits  
- Feed or Communication ownership  

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint (Sprint 11.3 scoped) | ✅ |
| Unit + integration (`vitest src/search`) | ✅ **11/11** |
| E2E `test/search-discover.e2e-spec.ts` | ✅ **1/1** |

---

## Remaining future / later sprint

| Area | Sprint |
|------|--------|
| Hardening + final audit | **11.4** |
| Meilisearch / vector / AI | Phase 2 |
| Saved Searches | Optional late / Phase 2 |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Discover composition only | ✅ |
| Domains remain SoT | ✅ |
| Recent own-only; no admin override | ✅ |
| Trending from SearchEvent only | ✅ |
| Controllers thin; repos persistence | ✅ |
| Targeted cache; no global flush | ✅ |
| Freeze 11.3 scope lock | ✅ |

---

## Gate

Sprint **11.3 Discover / Recent / Trending complete.**

Do **not** continue to Sprint 11.4.

**Waiting for architecture review.**
