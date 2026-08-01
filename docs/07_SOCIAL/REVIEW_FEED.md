# Review Feed (D3.24 v1.3)

**Document:** `docs/07_SOCIAL/REVIEW_FEED.md`  
**Status:** **PLANNED**  
**Authority:** Home Reviews filter · Letterboxd-like taste · [`FEED_ENGINE_V2.md`](./FEED_ENGINE_V2.md)

---

## Mission

Home **Reviews** filter is the entry. Deeper Letterboxd-style slices make taste navigable.

---

## Filters

| Filter | Meaning |
|--------|---------|
| Only Reviews | Home filter alias — review PostItems / review projections |
| Latest Reviews | Chronological public reviews |
| Friends Reviews | Friendship edge authors only |
| Popular Reviews | Velocity / helpful signals in window (deterministic) |
| Negative Reviews | Rating below threshold (product constant) |
| Hidden Gems Reviews | Low-popularity game + high review quality signals (D3.22 hidden-gems style) |

---

## API

```
GET /feed?filter=reviews
GET /feed/reviews?slice=latest|friends|popular|negative|hidden_gems
```

Cursor pagination. AuthZ + blocks apply.

---

## Ranking

Latest = time. Friends = time among friends. Popular / Hidden Gems = documented formulas — **no AI**.

---

## Explicit non-goals

Review bombing boosts · paid review placement.
