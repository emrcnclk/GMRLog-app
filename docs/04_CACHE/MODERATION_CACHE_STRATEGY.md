# Moderation Cache Strategy

**Document:** `docs/04_CACHE/MODERATION_CACHE_STRATEGY.md`  
**Status:** **Frozen — Moderation Platform Freeze v1.0** (Sprint 12.0)  
**Store:** Redis  
**Rule:** Targeted invalidation only — **no global flush**, **no O(N) fan-out invalidation**

---

## Principles

1. Moderation traffic is **staff-heavy and write-correlated** — prefer **short TTL** or **no cache** over complex invalidation graphs.  
2. Never use Feed / Search / Notification key namespaces.  
3. Never `FLUSHALL` / `FLUSHDB` / `KEYS moderation:*` wipe on a single resolve.  
4. Never invalidate “all queue pages for all moderators” by scanning Redis (O(N)). Prefer TTL expiry or **single known keys**.

---

## Key catalog

| Key | Value | TTL (default) | Owner | Required in V1? |
|-----|-------|---------------|-------|-----------------|
| `moderation:queue:{hash}` | First page of filtered queue JSON | 15–30s | Moderation BC | **Optional** |
| `moderation:item:{itemId}` | Queue item detail DTO | 15–30s | Moderation BC | **Optional** |
| `moderation:report:{reportId}` | Admin report detail | 30–60s | Moderation BC | **Optional** |
| `moderation:stats` | Aggregate stats DTO | 30–60s | Moderation BC | **Only if** `adminGetModerationStats` implemented (deferred) |
| `moderation:reasons:active` | Active `ReportReason` list | 5–15 min | Moderation BC | **Optional** (seed rarely changes) |

Suggested `{hash}`: SHA-256 of stable JSON `{ status?, entityType?, priority?, page, pageSize }` truncated to 32 hex.

---

## What never to cache

| Data | Reason |
|------|--------|
| Another user’s appeals under a shared key | AuthZ |
| Full private message bodies in shared cache | Privacy |
| Cross-user report lists under anon keys | Staff-only |
| “All open reports” unbounded sets | Memory + staleness |

---

## Invalidation matrix

| Mutation | Invalidate |
|----------|------------|
| Report create | Optional: bump/ignore queue list TTL; **do not** scan all `moderation:queue:*` |
| Queue assign / status change | `DEL moderation:item:{id}`; rely on short TTL for list keys **or** `DEL` only the hash key if request context knows it |
| Resolve | `DEL moderation:item:{id}`; `DEL moderation:stats` if present; list keys expire via TTL |
| Report status update | `DEL moderation:report:{id}` |
| Reason catalog admin change | `DEL moderation:reasons:active` |
| Domain content hide | Domain owns its caches (Review cache etc.) — Moderation **does not** flush domain namespaces |

**Preferred V1 approach:** implement **item + stats** targeted deletes; leave **queue list** cache-aside with ≤30s TTL and **no** wildcard invalidation.

---

## Consistency

- Cache-aside only.  
- Resolve path must succeed in Postgres first; cache delete is best-effort.  
- Stale queue list ≤ TTL is acceptable for staff UX.

---

## Explicit bans

1. `FLUSHALL` / `FLUSHDB` / namespace-wide `moderation:*` wipe on one user action.  
2. `KEYS` / `SCAN` + delete-all as default invalidation (O(N)).  
3. Caching reporter PII in public keys.  
4. Using Moderation resolve to flush Search or Notification caches.

---

## Sprint notes

| Sprint | Cache work |
|--------|------------|
| 12.1 | Optional reasons cache; usually skip queue cache |
| 12.2 | Optional queue/item short TTL; targeted item delete on resolve |
| 12.3 | Unchanged pattern for appeals (prefer no cache or own-user keys only if needed) |
| Phase 2 | AI result caches — separate strategy amendment |
