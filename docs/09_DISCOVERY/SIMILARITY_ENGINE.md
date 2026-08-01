# Similarity Engine (D3.22, signals updated D3.25)

**Status:** LOCKED — deterministic overlap, no AI
**Tables:** `game_similarity`, `user_similarity`

## Similar Games — dimensions

Weighted Jaccard / equality overlap. Weights are unchanged since D3.22; D3.25
(`docs/18_CATALOG/`) changed **what feeds three of these dimensions** — real
catalog tags and companies where the catalog has been enriched, falling back
to the original D3.22 proxies for games that have not:

| Dimension | Weight | D3.25 signal source |
|-----------|--------|----------------------|
| Genre | 0.22 | `game_genres` (unchanged) |
| Theme / tags | 0.12 | Real `game_tags` where `kind='theme'`; genre+franchise proxy when absent |
| Mechanics | 0.10 | Real `game_tags` (mode/perspective/keyword); genre proxy when absent |
| Developer / Franchise | 0.14 | Franchise **or** provider series match (either counts); franchise alone pre-D3.25 |
| Publisher | 0.08 | Real `game_companies` (publisher role, developer at half weight); franchise proxy when absent |
| Platform | 0.12 | `game_platforms` (unchanged) |
| Rating band overlap | 0.12 | Unchanged |
| Popularity band | 0.10 | Unchanged |

Because the fallback proxies stay in place, scores remain comparable across a
partially-enriched catalog — a game that hasn't been enriched yet doesn't
silently score zero on every real-signal dimension. Implementation:
`apps/backend/src/discover/scoring/similarity.engine.ts`; signal loading:
`apps/backend/src/discover/similarity.service.ts`.

Stored as directed or undirected pairs with `score` 0–1. Top-N queried for `GET /discover/similar-games/:id`.

## Similar Users — dimensions

| Dimension | Weight |
|-----------|--------|
| Library overlap | 0.28 |
| Genre overlap | 0.22 |
| Review rating similarity | 0.18 |
| Wishlist overlap | 0.18 |
| Completion overlap | 0.14 |

Surface: `GET /discover/similar-users/:id` → public user cards.

Privacy: only public-visible library/review signals; blocked users excluded.
