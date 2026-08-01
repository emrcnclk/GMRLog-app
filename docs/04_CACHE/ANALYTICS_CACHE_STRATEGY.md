# Analytics Cache Strategy

**Document:** `docs/04_CACHE/ANALYTICS_CACHE_STRATEGY.md`  
**Status:** **Frozen — Analytics Platform Freeze v1.0** (Sprint 14.0)  
**Store:** Redis  
**Rule:** Targeted invalidation only — **no global flush**, **no O(N) fan-out invalidation**

---

## Principles

1. Analytics caches are **derived** — prefer short TTL + idempotent recompute over complex graphs.  
2. Never use Feed / Search / Notification / Admin / player profile namespaces for Analytics keys.  
3. Never `FLUSHALL` / `FLUSHDB` / `KEYS analytics:*` wipe on a single mutation or job tick.  
4. Never invalidate by scanning Redis (O(N)). Prefer **known keys** or TTL expiry.  
5. Domain caches remain owned by those BCs — Analytics must not flush them.

---

## Key catalog

| Key | Value | TTL (default) | Owner | Required in V1? |
|-----|-------|---------------|-------|-----------------|
| `analytics:daily:{date}` | UTC day bundle of allowlisted `DailyMetric` values (JSON) | 5–15 min | Analytics | **Yes** (recommended) |
| `analytics:dashboard:{hash}` | Staff dashboard DTO for filter set (`from`/`to`/dashboard id) | 30–60s | Analytics | **Yes** |
| `analytics:metric:{name}` | Single metric latest / rolling window snapshot | 1–5 min | Analytics | **Optional** |

Suggested `{date}`: `YYYY-MM-DD` UTC.  
Suggested `{hash}`: SHA-256 of stable JSON filter object truncated to 32 hex. Include **role bucket** if Moderator vs Admin payloads differ.  
Suggested `{name}`: Freeze `metricKey` (e.g. `dau_proxy`).

---

## What never to cache

| Data | Reason |
|------|--------|
| Raw `AnalyticsEvent` unbounded streams | Size / privacy |
| PII-bearing properties | Forbidden in store already; never cache if leaked |
| Cross-tenant “all users” sets | Memory |
| Search trending (`search:trending:queries`) | Search-owned |
| Admin `admin:dashboard:home` | Admin-owned — do not alias |

---

## Invalidation matrix

| Trigger | Invalidate |
|---------|------------|
| DailyMetric upsert for date `D` | `DEL analytics:daily:{D}`; `DEL analytics:metric:{name}` for touched keys |
| Dashboard read after aggregation | Prefer TTL; optional `DEL analytics:dashboard:{hash}` only if hash known |
| Single AnalyticsEvent append | **Do not** scan; rely on short dashboard TTL |
| User GDPR unlink job | No wildcard; targeted metric rebuild next job tick |
| Domain entity mutation | **Do not** flush Analytics keys from domain services |

**Preferred V1 approach:** cache-aside with short TTL; targeted `DEL` only for known `analytics:daily:{date}` / `analytics:metric:{name}` after aggregation writes.

---

## Forbidden operations

| Operation | Status |
|-----------|--------|
| `FLUSHALL` / `FLUSHDB` | **Forbidden** |
| `KEYS analytics:*` then delete | **Forbidden** |
| `SCAN` + bulk delete of analytics namespace as default invalidation | **Forbidden** |
| Wildcard `DEL analytics:dashboard:*` | **Forbidden** |

---

## Related

- Freeze: [`ANALYTICS_PLATFORM_FREEZE_v1.md`](../00_PROJECT/ANALYTICS_PLATFORM_FREEZE_v1.md)  
- Admin cache (do not conflate): [`ADMIN_CACHE_STRATEGY.md`](./ADMIN_CACHE_STRATEGY.md)
