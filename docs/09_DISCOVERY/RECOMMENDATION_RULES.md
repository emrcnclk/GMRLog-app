# Recommendation Rules (D3.22)

**Status:** LOCKED — rule engine only  
**Table:** `recommendation_rules`

## Model

| Column | Meaning |
|--------|---------|
| `seedGameId` | If user played / completed this game |
| `targetGameId` | Recommend this game |
| `weight` | Ordering weight (higher first) |
| `reasonKey` | Explainability key (e.g. `because_you_played`) |
| `isActive` | Soft disable |

## Seed examples (product data)

| Seed | Targets |
|------|---------|
| Elden Ring | Dark Souls · Lies of P · Lords of the Fallen |
| Hades | Dead Cells · Enter the Gunfire · Rogue Legacy |

Exact game rows depend on catalog seed; rules reference `gameId` FKs.

## Score for `GET /discover/recommended`

```
score =
  0.25 * genreSimilarity +
  0.20 * tagSimilarity +
  0.15 * wishlistSimilarity +
  0.15 * friendsActivity +
  0.15 * reviewSimilarity +
  0.10 * popularity
```

Plus rule-engine boost when seed matches library. Guest → popular + freshness fallback.
