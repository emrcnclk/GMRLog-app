# Feed Item Types (D3.24 v1.3)

**Document:** `docs/07_SOCIAL/FEED_ITEM_TYPES.md`  
**Status:** **PLANNED**  
**Authority:** [`FEED_ENGINE_V2.md`](./FEED_ENGINE_V2.md) · Posts Freeze compose rules

---

## Why

Product Hybrid Timeline mixes User Generated and Game Activities. Technically they must not share one ambiguous blob — future ads/recs need a clean slot.

---

## Discriminated union

```
FeedItem
├── PostItem            # User Generated authored objects
├── ActivityItem        # Game Activities / graph heartbeats
├── RecommendationItem  # Deterministic discovery inserts (sparse)
└── AdvertisementItem   # FUTURE ONLY — not implemented in D3.24
```

| Kind | `contentClass` | Examples |
|------|----------------|----------|
| `post_item` | `user_generated` | Post · Review · Screenshot · Collection · Guide · Tier List · Poll · Quote |
| `activity_item` | `game_activity` | Started Playing · Finished · Achievement · Sync · etc. |
| `recommendation_item` | n/a | Because You Played card · similar player · collection suggest |
| `advertisement_item` | n/a | **Reserved** — no emit in D3.24 |

---

## Wire shape (logical)

```json
{
  "feedItemId": "...",
  "kind": "post_item",
  "score": 12.4,
  "createdAt": "...",
  "payload": { }
}
```

- `PostItem.payload` references Posts/Reviews/… SoT ids — Feed does not own body.  
- `ActivityItem.payload` references `ActivityItem` row / ActivityKind.  
- `RecommendationItem.payload` references rule engine / discovery module ids.  
- Clients switch renderers on `kind`.

---

## Ranking & rhythm

All kinds may enter the same Home stream subject to F2.3 rhythm.  
`recommendation_item`: sparse (F2.3 rec density).  
`advertisement_item`: **zero** until formal monetization amendment.

---

## Anti-patterns

Storing review body inside Feed as SoT · emitting ads without amendment · collapsing Activity into PostKind enums.
