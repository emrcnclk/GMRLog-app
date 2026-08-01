# Search Cache Strategy

**Document:** `docs/04_CACHE/SEARCH_CACHE_STRATEGY.md`  
**Status:** **Frozen — Search Platform Freeze v1.0** (Sprint 11.0)  
**Store:** Redis  
**Rule:** Targeted invalidation only — **no global flush**

---

## Key catalog

| Key | Value | TTL (default) | Owner |
|-----|-------|---------------|-------|
| `search:global:{hash}` | First-page `GlobalSearchResponse` JSON | 30–60s | Search BC |
| `search:autocomplete:{hash}` | Autocomplete DTO | 30–60s | Search BC |
| `search:recent:{userId}` | Ordered recent query strings (list) | persistent / long + max length cap | Search BC |
| `search:trending:queries` | Top query strings + counts | 60–120s | Search BC |
| `search:discover:{hash}` | Discover sections DTO | 60–120s | Search BC |
| Existing `game` search / autocomplete / discovery keys | Domain DTOs | per Games cache strategy | **Games** |
| Existing collection/list/tierlist discovery keys | Domain DTOs | per domain / `common/discovery` | **Domains** |

Suggested hash: SHA-256 of stable JSON `{ q, types, limit, cursor?, viewerBucket }` truncated to 32 hex.  
`viewerBucket`: `anon` | `auth` (do not put raw userId into shared public caches).

---

## What never to cache

| Data | Reason |
|------|--------|
| Another user’s recent searches | AuthZ boundary |
| Private review / private profile cards in public keys | Visibility |
| Full multi-page SERP as durable SoT | Churn + privacy |
| Personalized recommendation payloads | Not in V1; would be user-scoped if ever |
| Meilisearch/vendor raw responses as SoT | Ephemeral |

---

## Invalidation matrix

| Mutation / event | Invalidate |
|------------------|------------|
| Global / autocomplete cache | TTL expiry primarily; optional bust on deploy config only |
| Recent push | Write-through list update for that `userId` only |
| Clear recent | `DEL search:recent:{userId}` |
| Trending rebuild | Replace `search:trending:queries` (targeted set) |
| Discover | TTL; optionally invalidate when domain discovery caches invalidate **if** Search listens — prefer short TTL over fan-out |
| Domain entity create/update/delete | Domain owns its discovery/search keys; Search **does not** FLUSH `search:*` namespace |

---

## Consistency

- Cache-aside for global/autocomplete/discover: miss → compute → set TTL.  
- Recent: write-through on authenticated search.  
- Trending: rebuild from `SearchEvent` aggregates on interval or on cache miss.  
- Viewer-aware review/user results: **do not** serve auth-specific pages from `anon` cache keys.

---

## Explicit bans

1. `FLUSHALL` / `FLUSHDB` / namespace-wide `search:*` wipe on a single user action.  
2. Caching one user’s recent list under a shared key.  
3. Using Feed or Notification cache keys for Search.  
4. Global flush when a single game title updates.

---

## Sprint notes

| Sprint | Cache work |
|--------|------------|
| 11.1 | Optional global + autocomplete keys; keep domain game caches |
| 11.2 | Ensure user/review results not leaked into anon caches |
| 11.3 | Recent + trending + discover keys |
| Phase 2 | Meilisearch may add index-side caching — separate strategy amendment |
