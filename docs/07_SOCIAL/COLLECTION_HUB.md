# Collection Hub (D3.24 v1.3)

**Document:** `docs/07_SOCIAL/COLLECTION_HUB.md`  
**Status:** **PLANNED**  
**Authority:** D3.22 Collections · Discover · [`D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`](./D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md)

---

## Mission

Collections are not profile-only shelves. They are **discoverable culture objects**.

Example hub theme: **Soulslikes** — 150k followers · Top · Newest · Trending.

---

## Surfaces

| Surface | Notes |
|---------|-------|
| Collection page | Existing collection detail + follower count |
| Theme / tag hub | Aggregate by tag (e.g. Soulslike) |
| Top Collections | Followers / saves velocity |
| Newest | createdAt |
| Trending | Windowed follows · clones · likes (D3.22 trending) |

---

## API

```
GET /collections/discover?sort=top|newest|trending&tag=soulslike
GET /collections/:id
GET /collections/:id/followers
```

Reuse D3.22 collection follow / clone where present.

---

## Feed

Publishing or updating a public collection may emit `PostItem` / `ActivityItem`; Collection Hub indexes the collection aggregate itself.

---

## Explicit non-goals

Paid collection boost · AI-generated shelves as SoT.
