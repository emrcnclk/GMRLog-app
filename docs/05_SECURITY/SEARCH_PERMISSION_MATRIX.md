# Search Permission Matrix

**Document:** `docs/05_SECURITY/SEARCH_PERMISSION_MATRIX.md`  
**Status:** **Frozen — Search Platform Freeze v1.0** (Sprint 11.0)  
**AuthN:** Bearer JWT (optional on public search routes per OpenAPI `security: []`)  
**AuthZ model:** Public keyword search for visible content; **own-only** for recent/saved

---

## Roles

| Role | Scope |
|------|--------|
| `ANON` | Unauthenticated |
| `USER` | Authenticated |
| `PLATFORM_ADMIN` | Admin tooling (`ADMIN_API` / search analytics) — not required for V1 public Search |

---

## Public search & discover

| Action | ANON | USER | PLATFORM_ADMIN |
|--------|------|------|----------------|
| `GET /search` (global) | ✅ rate-limited | ✅ | ✅ |
| `GET /search/autocomplete` | ✅ rate-limited | ✅ | ✅ |
| `GET /search/games` (and other MVP entity paths) | ✅ rate-limited | ✅ | ✅ |
| `GET /discover` | ✅ rate-limited | ✅ | ✅ |
| `GET /search/trending` | ✅ rate-limited | ✅ | ✅ |

Rate limiting is mandatory for anon scrape protection (platform edge / API gateway).

---

## Recent searches

| Action | ANON | USER |
|--------|------|------|
| `GET /search/recent` | — | ✅ **own only** |
| `DELETE /search/recent` | — | ✅ **own only** |
| Read another user’s recent | — | — |

---

## Trending

| Action | ANON | USER |
|--------|------|------|
| Read trending **query strings** (public aggregates) | ✅ | ✅ |
| Force rebuild / admin trending config | — | Admin only (deferred) |

---

## Saved searches (out of V1 MVP; AuthZ locked for later)

| Action | ANON | USER |
|--------|------|------|
| List / create / delete saved searches | — | ✅ own only |

---

## Analytics

| Action | ANON | USER | PLATFORM_ADMIN |
|--------|------|------|----------------|
| `GET /search/analytics` | — | — | ✅ (deferred OpenAPI op) |
| Write `SearchEvent` from search execution | system | system | system |

End users never read raw `SearchEvent` tables via public Search API in V1.

---

## Explicit denials

| Action | Rule |
|--------|------|
| Cross-user recent/saved access | Forbidden → 404/empty (never confirm existence with 403 if pattern matches platform) |
| Admin search of private content without admin tooling | Forbidden on public Search routes |
| Bypass domain visibility via Search | Forbidden — Visibility Matrix applies |

---

## Controllers

Controllers must not embed AuthZ beyond passing `user?.sub`. Search services enforce own-only recent and visibility filters.
