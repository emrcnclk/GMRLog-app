# Trending Engine (D3.22)

**Status:** LOCKED · **D3.24 R8 expansion PLANNED**  
**Windows:** `24h` · `7d` · `30d` (query `window`)

## Surfaces

| Entity | Signal |
|--------|--------|
| Games | Library adds · reviews · wishlist adds · game logs in window |
| Reviews | Reaction count · comment count · createdAt in window |
| Collections | Follows · likes · comments · clones in window |
| Users | Follows · friend accepts · public activity volume |
| Communities | Joins · posts · events in window |
| Posts | *(D3.24)* likes · comments · reposts · quotes in window |
| Events | *(D3.24)* RSVPs · attendance velocity in window |

## D3.24 R8 — ecosystem categories

Product trending vocabulary (maps to `entity` query):

| Category | Maps to | Purpose |
|----------|---------|---------|
| Posts | `posts` | Culture expression velocity |
| Reviews | `reviews` | Voice velocity |
| Collections | `collections` | Curation velocity |
| Games | `games` | Play / interest velocity |
| Communities | `communities` | Collective velocity |
| Events | `events` | Gathering velocity |
| Players | `users` (players facet) | Discoverable players — not vanity farm |
| Creators | `users` (creator facet) | Guides · collections · high-quality posts signal |

Players / Creators use deterministic formulas over existing graph + content counts — **no AI**. Anti-manipulation: no follower-buy / engagement-bait boosts.

## API

`GET /discover/trending?window=7d&entity=games`  
Default `window=7d`, `entity=games`.  
D3.24 allows `entity=posts|reviews|collections|games|communities|events|players|creators`.

Ranking = count / velocity of qualifying events in window, then `id` asc tie-break. No AI boost.
