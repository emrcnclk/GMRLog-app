# Feed Engine v2 (D3.24)

**Document:** `docs/07_SOCIAL/FEED_ENGINE_V2.md`  
**Status:** **PLANNED** — D3.24 v1.3  
**Authority:** [`D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`](./D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md) · [`FEED_ITEM_TYPES.md`](./FEED_ITEM_TYPES.md) · F2.3 · F5.2  
**Mode:** Deterministic — **no AI**

---

## Mission

Hybrid Timeline: User Generated + Game Activities as a living gaming identity feed. Technical kinds: see FeedItem taxonomy.

---

## Relationships → weights

| Edge | Weight signal | Rule |
|------|---------------|------|
| Friend (bidirectional) | `friendWeight` | **Highest** social proximity |
| Follow (unidirectional) | `followWeight` | `friendWeight > followWeight` |
| Block | — | Hard exclude |
| Mute | — | Soft exclude for viewer |

See [`SOCIAL_GRAPH.md`](./SOCIAL_GRAPH.md).

---

## Hybrid content

**User Generated:** Post · Review · Screenshot · Collection · Guide · Tier List · Poll · Quote  
**Game Activities:** Started Playing · Finished · Platinum · Achievement · Wishlist · Collection Completed · Library Imported · Steam Sync Completed · Playtime Milestone · Review Published  

Emitted as `PostItem` vs `ActivityItem` ([`FEED_ITEM_TYPES.md`](./FEED_ITEM_TYPES.md)).

---

## Ranking v1.3

```
score =
  freshness
  + friendWeight
  + followWeight
  + communityWeight
  + gameWeight
  + interactionVelocity
  + discoveryBoost
  + userSimilarity
  + interestOverlap
```

`interestOverlap` example: Elden Ring / Lies of P / Sekiro library → Elden Ring build from non-follow → For You eligible.

Sparse `RecommendationItem` allowed (Because You Played). `AdvertisementItem` = future only.

---

## Home filters

For You · Following · Games · Reviews · Media · Communities · Events  

Reviews deep-slices: [`REVIEW_FEED.md`](./REVIEW_FEED.md).

---

## Game Hub fan-out

Items with `gameId` also appear on [`GAME_HUB.md`](./GAME_HUB.md) timeline.

---

## Cursor

`cursor` · `before` · `after` · `take` · `direction`

---

## Anti-patterns

ML For You · collapsing Friend into Follow · ads without amendment · posts-only feed.
