# Discovery Scores (D3.22)

**Status:** LOCKED — formula only, no AI  
**Table:** `discovery_scores` (1:1 with `games`)

## Score fields (0–100 floats stored as Decimal/Float)

| Field | Signal |
|-------|--------|
| `trendingScore` | Recent activity velocity (logs · reviews · wishlist adds · library adds) |
| `popularityScore` | Normalized `Game.popularity` + library count |
| `reviewScore` | Rating average × log(1+count) |
| `wishlistScore` | Wishlist shelf count |
| `completionScore` | Completed shelf count |
| `freshnessScore` | Decay from `releaseDate` (newer → higher) |
| `discoveryScore` | Weighted blend (below) |

## Blend (deterministic)

```
discoveryScore =
  0.22 * trendingScore +
  0.18 * popularityScore +
  0.18 * reviewScore +
  0.14 * wishlistScore +
  0.10 * completionScore +
  0.18 * freshnessScore
```

Weights are product constants in `DiscoveryScoreService` — not ML.

## Recompute

- On-demand via internal service method
- Batch-friendly; scores may lag slightly behind live counters
