# Discovery API Surface (D3.22)

**Status:** Additive amendment to S1 §13.5 Discover  
**Transport:** `apps/backend/src/discover`

## Existing (unchanged)

| Method | Path |
|--------|------|
| GET | `/discover` |
| GET | `/discover/games` |
| GET | `/discover/communities` |
| GET | `/discover/events` |

## Additive (D3.22)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/discover/trending` | `window` · `entity` |
| GET | `/discover/popular` | Alias sort popular |
| GET | `/discover/hidden-gems` | High review · low popularity |
| GET | `/discover/recommended` | Rule + formula blend |
| GET | `/discover/similar-games/:id` | Top-N similar games |
| GET | `/discover/similar-users/:id` | Top-N similar users |
| GET | `/discover/collections` | Public collections discovery |

## Feed tabs (client modules over these APIs)

Discover · Trending · Popular · Recently Released · Hidden Gems · Top Rated · Most Reviewed · Most Wishlisted · Friends Playing · Friends Reviewed · Because You Played X · Community Picks

Mapped to query params / dedicated routes above — not separate microservices.

## Filters (games)

Genre · Platform · Release year · Play time proxy · Difficulty proxy · Price proxy · Tags · Language · Controller · Steam Deck · Multiplayer · Co-op · Singleplayer — applied where catalog columns exist; unsupported filters ignored (documented), not invented as false data.
