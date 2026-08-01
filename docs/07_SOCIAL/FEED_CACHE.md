# Feed Cache (D3.24)

**Document:** `docs/07_SOCIAL/FEED_CACHE.md`  
**Status:** **PLANNED** — D3.24  
**Store:** Redis  
**Authority:** [`FEED_ENGINE_V2.md`](./FEED_ENGINE_V2.md) · [`../04_CACHE/POSTS_CACHE_STRATEGY.md`](../04_CACHE/POSTS_CACHE_STRATEGY.md)

---

## Principles

1. Timeline cache is **viewer-sensitive** — never share one user’s home timeline key across users.  
2. Targeted `DEL` + TTL only — **no `FLUSHALL`**, **no `KEYS`**.  
3. Posts mutations publish events; Feed invalidates its own namespace.  
4. Cache is optional acceleration — Postgres/keyset remains source of truth for correctness.

---

## Key catalog

| Logical | Key pattern | Notes |
|---------|-------------|-------|
| Home / filter | `feed:home:{userId}:{filter}:{cursorHash}` | Auth only · filter = for_you\|following\|… |
| Discover | `feed:discover:{userId|anon}:{window}:{cursorHash}` | Anon only public |
| Community | `feed:community:{communityId}:{userId}:{cursorHash}` | Membership-aware |
| Game | `feed:game:{gameId}:{userId|anon}:{cursorHash}` | Visibility filter baked into build |

Product names from sprint brief map as:

| Brief | Redis logical |
|-------|---------------|
| `home_feed` | `feed:home:*` |
| `discover_feed` | `feed:discover:*` |
| `community_feed` | `feed:community:*` |
| `game_feed` | `feed:game:*` |

TTL: short (e.g. 15–60s) unless measured otherwise — document constants at implement.

---

## Invalidation matrix

| Mutation | Invalidate |
|----------|------------|
| Post create/update/delete | Author home keys (known) · community/game keys if scoped · rely on TTL for followers’ home (or async fan-out invalidation job) |
| Repost / quote | Actor + original author related keys |
| Bookmark | Bookmarks list only — **not** public feeds |
| Community join/leave | That user’s `feed:community:{id}:*` |
| Event RSVP | Event feed keys for actor |
| Visibility change | Broad TTL reliance + delete known object projection keys |

Prefer **write-through fan-out to follower inboxes** (existing Feed pattern) over giant cache graphs.

---

## Test Gate

Cache invalidation suite: create post → follower home miss/rebuild · community post → community feed refresh · no cross-user leakage.
