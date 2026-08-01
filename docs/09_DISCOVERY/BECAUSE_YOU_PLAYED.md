# Because You Played (D3.24 v1.3)

**Document:** `docs/09_DISCOVERY/BECAUSE_YOU_PLAYED.md`  
**Status:** **PLANNED** — D3.24 discovery module  
**Authority:** D3.22 `recommendation_rules` (`reasonKey=because_you_played`) · [`RECOMMENDATION_RULES.md`](./RECOMMENDATION_RULES.md)  
**Mode:** Deterministic — **no AI**

---

## Mission

Discovery surface: from a game you played → related culture graph (players’ reviews · collections · builds · communities).

```
You played Dark Souls
  → Players also reviewed Lies of P
  → Top Collections
  → Best Builds / Guides
  → Communities
```

---

## Module composition

| Block | Source |
|-------|--------|
| Seed games | Viewer library (played / completed) |
| Also reviewed | Public reviews on rule-target games |
| Top Collections | Collections containing seed or targets |
| Best Builds / Guides | Guide posts tagged to seed/targets |
| Communities | Communities tagged to genre/game |

Uses `recommendation_rules` + existing similarity/trending formulas. Explainability: always show seed (“Because you played X”).

---

## API

`GET /discover/because-you-played?seedGameId?&cursor=`

Returns module sections (not a single ranked ML blob).

---

## Placement

Discover hub module / tab segment — **not** a new bottom tab. May insert sparse `RecommendationItem` into Home (F2.3 density).

---

## Explicit non-goals

Black-box embeddings · stealth personalization without reason string.
