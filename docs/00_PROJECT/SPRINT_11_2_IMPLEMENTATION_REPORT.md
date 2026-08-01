# Sprint 11.2 — Entity Search (Users & Reviews) Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_11_2_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Users Search + Reviews Search only (Freeze v1.0)  
**Freeze:** [`SEARCH_PLATFORM_FREEZE_v1.md`](./SEARCH_PLATFORM_FREEZE_v1.md)  
**Prior:** [`SPRINT_11_1_IMPLEMENTATION_REPORT.md`](./SPRINT_11_1_IMPLEMENTATION_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 11.2 closes the Users and Reviews entity-search gaps: domain-owned `GET /search/users` and `GET /search/reviews`, wired into Global Search and multi-type Autocomplete. Domains remain SoT; Search only orchestrates. Visibility / blocks / spoilers follow the Search Visibility Matrix. No Discover/recent/trending, no AI, no new Prisma models/migrations, no OpenAPI edits.

| Item | Result |
|------|--------|
| Freeze 11.2 ops | **2 / 2** (`searchUsers`, `searchReviews`) |
| Global + autocomplete integration | ✅ USER + REVIEW |
| New tables / migrations / OpenAPI | **0** |
| Quality gates | **Pass** (scoped as prior sprints) |

---

## Implemented operations

| # | operationId | Method | Path | Owner BC |
|---|-------------|--------|------|----------|
| 1 | `searchUsers` | GET | `/search/users` | Users |
| 2 | `searchReviews` | GET | `/search/reviews` | Reviews |

Plus: Global `GET /search` and `GET /search/autocomplete` now fan out to USER / REVIEW.

### Users behaviour

| Rule | Implementation |
|------|----------------|
| `searchVisibility === PUBLIC` | Redis privacy extras via `PrivacyRepository.filterPublicSearchableIds` (default PUBLIC) |
| Soft-deleted / suspended / banned | SQL exclude |
| Block either-way | `UserSearchRepository.listBlockedRelationIds` for authenticated viewers |
| SERP card | Minimal `UserPublicProfile` fields only |
| Event | `user.search.executed.v1` |

### Reviews behaviour

| Rule | Implementation |
|------|----------------|
| Published only | `publishedAt IS NOT NULL` |
| Soft-deleted | `deletedAt IS NULL` |
| Visibility | Same OR rules as `ReviewQueryRepository` (PUBLIC / own / FOLLOWERS via follow graph) |
| Author suppressed | Soft-deleted / suspended / banned authors excluded; blocked authors excluded for viewer |
| Spoilers | `SpoilerService.applyListSafetyToPage(..., false)` — body redacted in SERP |
| Event | `review.search.executed.v1` |

### Cache (11.2 hardening)

When types include `USER` or `REVIEW` and a viewer is present, global/autocomplete cache keys use hashed viewer bucket `u:{sha16}` so auth-specific results never share a single `auth` bucket or leak into `anon`.

---

## Files changed

### New (Users)

| File | Role |
|------|------|
| `user-search.constants.ts` | Limits + `user.search.executed.v1` |
| `user-search.entities.ts` | Page / candidate types |
| `user-search.exceptions.ts` | Validation / cursor |
| `user-search.cursor.ts` | Cursor encode/decode |
| `user-search.repository.ts` | SQL candidates + block ids |
| `user-search.service.ts` | Privacy filter + orchestration |
| `user-search.controller.ts` | Thin `GET /search/users` |
| `user-search.service.spec.ts` / `.integration.spec.ts` | Tests |

### New (Reviews)

| File | Role |
|------|------|
| `review-search.repository.ts` | SQL keyword + visibility + blocks |
| `review-search.service.ts` | Follow graph + spoiler safety + event |
| `review-search.controller.ts` | Thin `GET /search/reviews` |
| `review-search.service.spec.ts` / `.integration.spec.ts` | Tests |

### Updated

| File | Change |
|------|--------|
| `users.module.ts` / `reviews.module.ts` | Wire controllers + export services |
| `privacy.repository.ts` | `filterPublicSearchableIds` |
| `review.constants.ts` | `SearchExecuted` event |
| `search.constants.ts` | USER/REVIEW in implemented types; `resolveSearchViewerBucket` |
| `search.entities.ts` / `search.service.ts` / `search.module.ts` | Fan-out + autocomplete |
| `search.service.spec.ts` / `search.integration.spec.ts` | 11.2 coverage |
| `test/search-users-reviews.e2e-spec.ts` | E2E |

### Explicitly not implemented

- Discover / trending / recent  
- Saved searches / analytics APIs  
- AI / semantic / recommendations  
- New Prisma models / migrations / OpenAPI edits  

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint (Sprint 11.2 scoped files) | ✅ |
| Unit + integration (user/review/search specs) | ✅ **15/15** |
| E2E `test/search-users-reviews.e2e-spec.ts` | ✅ **1/1** |

---

## Remaining future / later sprint

| Area | Sprint |
|------|--------|
| Recent + trending + Discover | **11.3** |
| Hardening + audit | **11.4** |
| Meilisearch / vector / AI | Phase 2 |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Search orchestration only | ✅ |
| Users / Reviews remain SoT | ✅ |
| Search never owns user/review entities | ✅ |
| Visibility / blocks / spoilers | ✅ |
| Controllers thin; repos persistence only | ✅ |
| Targeted cache; no global flush | ✅ |
| No privacy bypass | ✅ |
| Freeze 11.2 scope lock | ✅ |

---

## Gate

Sprint **11.2 Entity Search (Users & Reviews) complete.**

Do **not** continue to Sprint 11.3.

**Waiting for architecture review.**
