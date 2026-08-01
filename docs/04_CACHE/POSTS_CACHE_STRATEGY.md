# Posts Cache Strategy

**Document:** `docs/04_CACHE/POSTS_CACHE_STRATEGY.md`  
**Status:** **Frozen — Posts Platform Freeze v1.0** (Sprint 16.1)  
**Store:** Redis  
**Rule:** Targeted invalidation only — **no `FLUSHALL`**, **no `KEYS posts:*` wipe**

---

## Principles

1. Post reads are author/visibility sensitive — never cache one user’s private post under a public key.  
2. Prefer **short TTL** + known-key `DEL` over graph fan-out invalidation.  
3. Never touch `feed:*`, `search:*`, `notification:*`, `admin:*`, `analytics:*`, `platform:*` namespaces from Posts mutations except by publishing events (peers invalidate themselves).  
4. Counters live in Postgres; cache is optional DTO cache-aside.

---

## Key catalog

| Key | Value | TTL (default) | Required in V1? |
|-----|-------|---------------|-----------------|
| `posts:post:{postId}` | Public/safe post DTO (visibility-aware variants **forbidden** in one key) | 30–60s | **Optional** |
| `posts:user:{userId}:timeline:{cursorHash}` | Author timeline page | 15–30s | **Optional** |
| `posts:hashtag:{tag}:timeline:{cursorHash}` | Hashtag timeline page | 15–30s | **Optional** |
| `posts:replies:{postId}:{cursorHash}` | Reply page | 15–30s | **Optional** |

Suggested `{cursorHash}`: truncated hash of `{ cursor?, limit }`.

**V1 recommendation:** skip list caches initially; cache single post DTO only if measured hot.

---

## Invalidation matrix

| Mutation | Invalidate |
|----------|------------|
| Create post | No list SCAN; optional skip |
| Update / soft-delete post | `DEL posts:post:{postId}`; rely on TTL for timeline keys **or** `DEL` known timeline key if request context has it |
| Like / unlike | `DEL posts:post:{postId}` (counts) |
| Reply create / delete | `DEL posts:post:{postId}`; optional reply page keys if known |
| Repost | `DEL posts:post:{originalPostId}` |
| Hashtag attach | Optional hashtag timeline keys if known — **no** `KEYS` |

---

## Explicit bans

1. `FLUSHALL` / `FLUSHDB` / namespace-wide `posts:*` wipe on one action.  
2. `KEYS` / `SCAN` + bulk delete as default.  
3. Caching FOLLOWERS/PRIVATE payloads in ANON-shared keys.  
4. Invalidating Feed inbox keys from Posts (Feed owns `feed:*`).

---

## Related

- Freeze: [`POSTS_PLATFORM_FREEZE_v1.md`](../00_PROJECT/POSTS_PLATFORM_FREEZE_v1.md)
