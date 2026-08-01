# Admin Cache Strategy

**Document:** `docs/04_CACHE/ADMIN_CACHE_STRATEGY.md`  
**Status:** **Frozen — Admin Platform Freeze v1.0** (Sprint 13.0)  
**Store:** Redis  
**Rule:** Targeted invalidation only — **no global flush**, **no O(N) fan-out invalidation**

---

## Principles

1. Admin traffic is **staff-only and write-correlated** — prefer **short TTL** or **no cache** over complex graphs.  
2. Never use Feed / Search / Notification / player profile key namespaces for Admin list caches.  
3. Never `FLUSHALL` / `FLUSHDB` / `KEYS admin:*` wipe on a single mutation.  
4. Never invalidate “all admin pages for all staff” by scanning Redis (O(N)). Prefer TTL expiry or **single known keys**.  
5. Domain caches (Games catalog, Review, Moderation item) are **owned by those BCs** — Admin UI must not flush them with wildcards.

---

## Key catalog

| Key | Value | TTL (default) | Owner | Required in V1? |
|-----|-------|---------------|-------|-----------------|
| `admin:users:{hash}` | First page of admin user search JSON | 15–30s | Admin Platform | **Optional** |
| `admin:user:{userId}` | Admin user detail DTO (non-secret) | 15–30s | Admin Platform | **Optional** |
| `admin:audit:{hash}` | Filtered audit page JSON | 15–30s | Admin Platform | **Optional** |
| `admin:dashboard:home` | Shell counters / link metadata | 30–60s | Admin Platform | **Optional** (MVP may skip) |
| `admin:cms:{type}:{hash}` | CMS list page | 30–60s | Admin Platform | **Phase 2 only** |
| `admin:flags:all` | Feature flag list | 30–60s | Admin Platform | **Phase 2 only** |

Suggested `{hash}`: SHA-256 of stable JSON filter object truncated to 32 hex. Include **actor role bucket** if payloads differ by Moderator vs Admin (e.g. export-capable fields).

---

## What never to cache

| Data | Reason |
|------|--------|
| Refresh tokens / session secrets | Security |
| Full private DM bodies | Privacy |
| Cross-staff “all users unbounded” sets | Memory |
| Audit export files in Redis | Size + retention |
| Shared keys mixing Moderator and Admin PII views | AuthZ |

---

## Invalidation matrix

| Mutation | Invalidate |
|----------|------------|
| `adminUpdateUser` / sanctions | `DEL admin:user:{userId}`; rely on TTL for `admin:users:*` list keys **or** skip list cache in V1 |
| `adminUpdateUserRoles` | `DEL admin:user:{userId}` |
| `adminRevokeUserSessions` | No list cache required; do not flush Auth namespaces with wildcards |
| Audit append (any domain writer) | Do **not** scan `admin:audit:*`; short TTL only |
| Catalog mutation (Games) | Games owns catalog cache; Admin does not `KEYS` Games namespaces |
| Moderation resolve | Moderation Cache Strategy owns `moderation:item:*` |
| Feature flag update (Phase 2) | `DEL admin:flags:all` |
| CMS publish (Phase 2) | `DEL` known CMS hash key if present; else TTL |

**Preferred V1 approach:** implement **user detail** targeted deletes if cached; leave **list/audit** cache-aside with ≤30s TTL and **no** wildcard invalidation. Skipping Admin Redis entirely in 13.1–13.2 is acceptable.

---

## Consistency

- Cache-aside only.  
- Postgres / domain mutation succeeds first; cache delete is best-effort.  
- Stale staff list ≤ TTL is acceptable.

---

## Explicit bans

1. `FLUSHALL` / `FLUSHDB` / namespace-wide `admin:*` wipe on one action.  
2. `KEYS` / `SCAN` + delete-all as default invalidation (O(N)).  
3. Caching secrets or export blobs.  
4. Using Admin to flush Search / Notification / Moderation / Games caches via wildcard.

---

## Sprint notes

| Sprint | Cache work |
|--------|------------|
| 13.1 | Usually skip; optional dashboard TTL only |
| 13.2 | Optional `admin:user:{id}` |
| 13.3 | No domain wildcard flushes from UI layer |
| Phase 2 | Flags + CMS keys |
