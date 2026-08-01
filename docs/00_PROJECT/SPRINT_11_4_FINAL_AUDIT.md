# Sprint 11.4 — Search Module Final Audit

**Document:** `docs/00_PROJECT/SPRINT_11_4_FINAL_AUDIT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Production-readiness audit of **Search Module V1** (implementation frozen — audit only)  
**Freeze:** [`SEARCH_PLATFORM_FREEZE_v1.md`](./SEARCH_PLATFORM_FREEZE_v1.md)

**SSOT precedence applied:** North Star → Freeze → OpenAPI → Architecture → Implementation

> **No code, Prisma, OpenAPI, migrations, or feature changes were made in this sprint.**  
> Issues are listed for awareness only — **not fixed**.  
> **Do not continue to Module 12 from this sprint.**

---

## Executive Summary

Module 11 delivers a coherent **SQL-first Search orchestration BC**: Global + Autocomplete (11.1), Users & Reviews entity search with privacy (11.2), and Discover / Recent / Trending (11.3). Implementation respects Freeze non-negotiables: Search never owns entity data, domains remain SoT, Discover is composition only, no Meilisearch/AI/vector/recommendations, no Feed/Communication ownership, no invented endpoints or schema changes.

Privacy gates (`searchVisibility`, blocks, suspended/banned/deleted, review visibility, spoilers) are enforced on hot paths. Cache keys and TTLs match Search Cache Strategy with viewer-bucket isolation and **no FLUSHALL**. Events follow the Event Matrix; trending aggregates from `SearchEvent` only.

Gaps are **known / deferred** (Saved Searches, advanced/AI/metadata ops, Phase 2 engines) or **minor operational debt** (Redis privacy N-lookups, SearchEvent write path limited to global, GameSearch OptionalJwt gap, Discover cursor no-op, trending username hygiene). Nothing found requires architectural redesign of the Search BC.

**Decision: APPROVED WITH MINOR CHANGES**

---

## Audit method

| Layer | Sources |
|-------|---------|
| North Star | Digital home for gaming culture; Search as discovery home, not Discord/Feed |
| Freeze / ADR / Architecture | Ten locked decisions; SQL-first MVP; orchestration BC |
| OpenAPI | `SEARCH_API.yaml` ops — runtime subset only; **no OpenAPI edits** |
| Event / Cache / Security matrices | Executed events; Redis keys; public vs own-only AuthZ; visibility |
| Implementation | `apps/api/src/search/**` + domain search/discovery ports |
| Sprint reports | 11.0–11.3 |
| Gates | prisma validate, typecheck, build, eslint (scoped), unit/integration, e2e (re-run 2026-07-19) |

---

## Architecture Review

| Check | Result | Notes |
|-------|--------|-------|
| Search orchestration only | **Pass** | `SearchService` / `DiscoverService` fan out to domain ports; no entity ownership |
| Domains remain SoT | **Pass** | Games / Users / Reviews / Collections / Lists / Tier Lists own query SQL |
| No ownership leaks | **Pass** | Search-owned persistence = `SearchEvent` only via `SearchEventRepository` |
| Controllers thin | **Pass** | DTO + guards + delegate; no business rules in controllers |
| Repositories persistence only | **Pass** | `SearchEventRepository` create + groupBy; domain repos own entity SQL |
| Discover composition only | **Pass** | Six public domain discovery sections; no invented ranking |
| Controllers / BC boundaries | **Pass** | Entity paths live in owning modules under `/search/*` |

**Verdict:** Architecture Freeze V1 **met**. Search is an orchestration BC, not a second catalog.

---

## Security Review

| Check | Result | Notes |
|-------|--------|-------|
| Anonymous public search | **Pass** | `GET /search`, autocomplete, entity paths, trending, discover — no JWT required |
| Auth-only recent | **Pass** | `GET/DELETE /search/recent` → `JwtAuthGuard`; keyed by `user.sub` only |
| Recent own-only | **Pass** | No cross-user id parameter; Redis `search:recent:{userId}` |
| Discover public content only | **Pass** | Featured / trending / popular-public / recently-active + PUBLIC searchVisibility |
| No privacy AuthZ bypass via Search | **Pass** | Visibility filters in domain search; Search does not widen ACL |
| Optional JWT on viewer-aware routes | **Pass with debt** | Global / autocomplete / users / reviews use `OptionalJwtAuthGuard`; **`GET /search/games` lacks OptionalJwt** (actor/analytics only — public catalog unchanged) |
| Platform rate limit (Permission Matrix) | **Known gap** | No Nest `Throttler` in API Search layer; matrix expects edge/gateway rate limits — platform concern |

**Verdict:** Permission Matrix V1 satisfied for implemented ops. Own-only recent is correct.

---

## Privacy Review

| Rule | Result | Evidence |
|------|--------|----------|
| User `searchVisibility === PUBLIC` | **Pass** | `PrivacyRepository.filterPublicSearchableIds` in user search + discover |
| Block either-way | **Pass** | `listBlockedRelationIds` on user + review search for authenticated viewers |
| Suspended / banned users | **Pass** | SQL `isSuspended: false`, `isBanned: false` |
| Soft-deleted users | **Pass** | `deletedAt: null` (+ missing profile omitted) |
| Review visibility | **Pass** | PUBLIC / own / FOLLOWERS+following in `ReviewSearchRepository` |
| Spoiler policy | **Pass** | `SpoilerService.applyListSafetyToPage` on search + discover review cards |
| UGC PUBLIC-only in Search MVP | **Pass** | Collections / lists / tierlists domain search PUBLIC alive |
| Viewer cache isolation | **Pass** | `resolveSearchViewerBucket` → `anon` \| `auth` \| `u:{sha16}` when USER/REVIEW |
| Trending string hygiene | **Debt** | Matrix “strip non-searchable usernames when feasible” **not implemented**; mitigated by `minCount >= 2` |

**Verdict:** No material privacy bypass on SERP / Discover paths. Residual risk is trending query-string leakage (low; aggregate threshold helps).

---

## Performance Review

| Check | Result | Notes |
|-------|--------|-------|
| Fan-out bounded | **Pass** | Fixed MVP type set (≤6); `Promise.allSettled` — failure → empty section/page |
| Pagination | **Pass** | Domain cursors; global cursor only when single implemented type |
| Merge strategy deterministic | **Pass** | Fixed type order; typed pages; cache payload sorts `types` |
| N+1 SQL | **Pass** | Review includes / selected profiles; no classic ORM N+1 on SERP |
| User privacy filter cost | **Debt** | Oversample + up to N Redis GETs per candidate batch (`filterPublicSearchableIds`) |
| Discover users | **Debt** | Same Redis-per-id pattern after SQL oversample |
| Cache hit ratio | **Acceptable by design** | Short TTLs (45s / 90s); no prod metrics in this audit — keys/hash isolation correct |
| Recent write | **OK** | Cap 20; O(n) dedupe with n≤20 |

**Verdict:** MVP performance is production-acceptable. Primary hardening target is batched privacy Redis reads.

---

## Cache Review

| Check | Result | Notes |
|-------|--------|-------|
| Targeted invalidation only | **Pass** | TTL expiry; recent clear = `DEL search:recent:{userId}` only |
| No FLUSHALL / namespace wipe | **Pass** | None in Search or Redis helpers used by Search |
| Viewer bucket isolation | **Pass** | USER/REVIEW results not shared under bare `auth` |
| Key catalog vs strategy | **Pass** | `search:global|autocomplete|discover:{hash}`, `search:trending:queries`, `search:recent:{userId}` |
| TTLs consistent | **Pass** | Global/autocomplete ~45s (30–60); discover/trending ~90s (60–120) |
| Docs drift | **Minor** | Strategy text still says `anon|auth`; code correctly uses per-viewer hash for USER/REVIEW |

**Keys in use:**

| Key | TTL (default) |
|-----|----------------|
| `search:global:{hash}` | 45s |
| `search:autocomplete:{hash}` | 45s |
| `search:discover:{hash}` | 90s |
| `search:trending:queries` | 90s |
| `search:recent:{userId}` | Persistent list, max 20 |

---

## Event Review

| Check | Result | Notes |
|-------|--------|-------|
| Event names match matrix | **Pass** | No invented business-state events |
| `SearchEvent` usage | **Pass with debt** | Written on **global** search (best-effort); entity paths emit bus events only |
| Trending uses `SearchEvent` only | **Pass** | 7-day `groupBy`, `minCount >= 2`, deterministic tie-break |
| Optional meta events | **Pass** | `search.recent.cleared.v1` emitted; `search.trending.refreshed.v1` skipped (on-read OK) |

### Runtime publisher map (V1)

| Versioned name | Publisher |
|----------------|-----------|
| `search.global.executed.v1` | Search BC |
| `search.recent.cleared.v1` | Search BC |
| `game.search.executed.v1` | Games |
| `user.search.executed.v1` | Users |
| `review.search.executed.v1` | Reviews |
| `collection.search.executed.v1` | Collections |
| `list.search.executed.v1` | Lists |
| `tierlist.search.executed.v1` | Tier Lists |

---

## OpenAPI Parity

Runtime matches **existing** `SEARCH_API.yaml` for the Freeze V1 allowlist. **OpenAPI was not modified.**

### Implemented

| operationId | Method / path | Auth |
|-------------|---------------|------|
| `globalSearch` | GET `/search` | Optional JWT |
| `autocomplete` | GET `/search/autocomplete` | Optional JWT |
| `searchGames` | GET `/search/games` | Public |
| `searchUsers` | GET `/search/users` | Optional JWT |
| `searchReviews` | GET `/search/reviews` | Optional JWT |
| `searchCollections` | GET `/search/collections` | Optional JWT |
| `searchLists` | GET `/search/lists` | Optional JWT |
| `searchTierLists` | GET `/search/tierlists` | Optional JWT |
| `recentSearches` | GET `/search/recent` | JWT own-only |
| `clearRecentSearches` | DELETE `/search/recent` | JWT own-only → 204 |
| `trendingSearches` | GET `/search/trending` | Public |
| `discover` | GET `/discover` | Public |

### Explicitly not implemented (correct — Freeze / Phase 2)

`advancedSearch`, `suggestions`, `savedSearches`, `saveSearch`, `deleteSavedSearch`, `popularSearches`, `searchRecommendations`, `searchFilters`, `searchAnalytics`, metadata entity searches (`searchDevelopers` … `searchCompanies`), `explore`.

### Parity notes (non-blocking)

| Item | Notes |
|------|-------|
| Discover `cursor` | Query accepted; **ignored** (`void query.cursor`) — sections are first-page composition |
| Global metadata buckets | Empty arrays for non-MVP types — schema-compatible placeholders |
| Response shapes | Domain pages / Discover sections / trending `{query,count}` align with sprint contracts |

---

## Quality gates (re-run 2026-07-19)

| Check | Result |
|-------|--------|
| `prisma validate` (`@gmrlog/database`) | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint (Search + related domain/e2e paths, `--max-warnings 0`) | ✅ |
| Unit + integration (search / user-search / review-search / discover) | ✅ **21/21** |
| E2E `search-core` + `search-users-reviews` + `search-discover` | ✅ **3/3** |

Note: Full-repo API lint may still report pre-existing errors outside Search (same pattern as prior module reports).

---

## Known Technical Debt

### Medium

| ID | Issue | Impact | Disposition |
|----|-------|--------|-------------|
| M1 | `filterPublicSearchableIds` = N parallel Redis GETs | User search / Discover users latency under load | Batch `MGET` / pipeline in polish |
| M2 | `SearchEvent` only written on global search | Entity-only traffic underfeeds trending | Optional: write from entity paths or accept global-as-source |
| M3 | Trending does not strip non-searchable usernames | Low risk of private-ish username strings in public trending | Hygiene filter when feasible |
| M4 | Platform rate limits not enforced in Nest Search | Anon scrape if edge missing | Gateway / platform Throttler |

### Low

| ID | Issue | Disposition |
|----|-------|-------------|
| L1 | `GameSearchController` missing `OptionalJwtAuthGuard` | Actor id always null on direct `/search/games` |
| L2 | Discover `cursor` no-op | Document or implement section pagination later |
| L3 | Cache strategy doc vs `u:{sha16}` bucket | Docs amendment only |
| L4 | Global → collection search omits `viewerId` | Analytics actor only |
| L5 | `search.trending.refreshed.v1` not emitted | Optional; on-read rebuild OK |
| L6 | Multi-type global has no cross-type cursor | Intentional MVP |

### Deferred Phase 2 / post–V1 (Freeze)

| Item | Source |
|------|--------|
| Meilisearch / hybrid keyword index | Freeze §4 / Phase 2 |
| Vector / semantic search | `VECTOR_SEARCH.md` |
| AI natural-language / rerank | Freeze §5 |
| Recommendations / personalized SERP | Freeze §7 |
| Saved Searches CRUD | OpenAPI + AuthZ locked later |
| `popularSearches`, analytics admin API | Deferred ops |
| Metadata entity search types | Non-MVP allowlist |
| Feed / Communication search ownership | Freeze §9–10 |

---

## Recommendations

1. **Do not redesign** Search BC boundaries — orchestration model is correct.  
2. Polish (non-blocking): batch privacy Redis reads (M1); OptionalJwt on `GameSearchController` (L1); optional entity `SearchEvent` writes (M2).  
3. Ops: confirm edge rate limiting for anon search (M4).  
4. Docs-only: align Cache Strategy viewerBucket wording with `u:{sha16}` (L3).  
5. Phase 2 engines only under a new Freeze unlock — not Module 12 scope by default.

---

## Freeze compliance scorecard

| Freeze decision | V1 status |
|-----------------|-----------|
| 1. Search never owns entity data | ✅ |
| 2. Search composes results | ✅ |
| 3. Domains remain SoT | ✅ |
| 4. SQL-first MVP | ✅ |
| 5. AI deferred | ✅ |
| 6. Semantic deferred | ✅ |
| 7. Recommendation deferred | ✅ |
| 8. Discover composition only | ✅ |
| 9. No Feed ownership | ✅ |
| 10. No Communication ownership | ✅ |
| No new Prisma models / migrations | ✅ |
| No OpenAPI invent in implementation | ✅ |

---

## Sprint delivery rollup

| Sprint | Outcome |
|--------|---------|
| 11.0 | Architecture + Search Platform Freeze SSOT |
| 11.1 | Search Core — Global + Autocomplete |
| 11.2 | Entity Search — Users & Reviews (+ privacy) |
| 11.3 | Discover + Recent + Trending |
| 11.4 | Final audit (this document) |

---

## Decision

**APPROVED WITH MINOR CHANGES**

Minor changes are **tracked debt** (M1–M4, L1–L6) and **Phase 2 / Freeze-deferred** items — not blockers for declaring Search Module V1 complete against Search Platform Freeze v1.0. No redesign required.

---

# SEARCH MODULE V1 COMPLETE

SQL-first Global / Autocomplete / MVP entity search / Discover / Recent / Trending are production-ready under Search Platform Freeze v1.0, subject to the issue register above.

**Stop.** Do **not** continue to Module 12 from this sprint.
