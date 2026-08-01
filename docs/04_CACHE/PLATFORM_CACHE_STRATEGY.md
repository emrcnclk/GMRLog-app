# Platform Cache Strategy

**Document:** `docs/04_CACHE/PLATFORM_CACHE_STRATEGY.md`  
**Status:** **Frozen — Platform Infrastructure Freeze v1.0** (Sprint 15.1)  
**Store:** Redis  
**Rule:** Targeted invalidation only — **no global flush**, **no O(N) namespace wipes**

---

## Principles

1. Platform cache helpers are **infrastructure** — rate-limit counters, short-lived ops blobs — not domain read models.  
2. Never use or flush Feed / Search / Notification / Admin / Analytics / profile namespaces.  
3. Never `FLUSHALL` / `FLUSHDB` / `KEYS platform:*` then delete.  
4. Prefer TTL expiry; `DEL` only known keys.  
5. Domain BCs own their cache strategies (unchanged by this Freeze).

---

## Key catalog (V1)

| Key | Value | TTL | Owner | Required in V1? |
|-----|-------|-----|-------|-----------------|
| `platform:ratelimit:{class}:{id}` | Sliding-window counter / bucket | Per policy window | Platform | **Yes** (with rate limiting) |
| `platform:health:probe:{name}` | Optional cached probe snapshot | ≤ 30s | Platform | **Optional** |
| `platform:config:hash` | Optional boot config fingerprint (non-secret) | Until restart | Platform | **Optional** |

`{class}` examples: `auth`, `upload`, `write`.  
`{id}`: user id, IP hash, or anonymous bucket — **never** store raw passwords/tokens.

---

## Namespaces Platform must never touch

| Prefix | Owner |
|--------|-------|
| `analytics:*` | Analytics |
| `admin:*` | Admin |
| `search:*` | Search |
| `feed:*` / notification prefs / session: | Owning BCs |
| `account:deletion:*` | Users |

---

## Invalidation matrix

| Trigger | Action |
|---------|--------|
| Rate-limit window elapse | TTL only |
| Manual ops unblock (future) | `DEL` known `platform:ratelimit:…` key only |
| Deploy / config change | Prefer process restart; optional `DEL platform:config:hash` |
| Domain entity mutation | **Do not** flush platform keys from domains |

---

## Forbidden operations

| Operation | Status |
|-----------|--------|
| `FLUSHALL` / `FLUSHDB` | **Forbidden** |
| `KEYS platform:*` then bulk delete | **Forbidden** |
| Wildcard `DEL platform:ratelimit:*` as default | **Forbidden** |
| Using platform keys for business entity caches | **Forbidden** |

---

## Related

- Freeze: [`PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`](../00_PROJECT/PLATFORM_INFRASTRUCTURE_FREEZE_v1.md)  
- Rate limiting SSOT (subset): `docs/06_BACKEND/RATE_LIMITING.md`
