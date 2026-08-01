# Discovery Domain (`docs/09_DISCOVERY`)

**Status:** ACTIVE — D3.22 COMPLETE · D3.24 discovery modules **PLANNED** (`BECAUSE_YOU_PLAYED`)  
**Authority chain:** S1/S2 → this folder → `docs/08_API/*`  
**Mode:** Deterministic only — **no AI**

## Purpose

Move GMRLOG from “games I logged” to:

- “It suggests new games for me.”
- “I discover people’s lists.”
- “I find players with similar taste.”
- “Because I played X → culture around Y.” (D3.24)

AI recommendation layers may consume these tables later; discovery remains **rule-based / formula-based**.

## Documents

| Doc | Role |
|-----|------|
| `D3_22_COMPLETION_REPORT.md` | Sprint delivery + verification |
| `COLLECTION_TYPES.md` | Manual · Dynamic · Curated · Official |
| `DISCOVERY_SCORES.md` | Formula scores (no AI) |
| `SIMILARITY_ENGINE.md` | Similar games / similar users |
| `TRENDING_ENGINE.md` | 24h · 7d · 30d windows |
| `RECOMMENDATION_RULES.md` | Seed → targets rule engine |
| `BECAUSE_YOU_PLAYED.md` | D3.24 module — seed → reviews · collections · guides · communities |
| `WISHLIST_METADATA.md` | Priority · wait status · notes |
| `DISCOVERY_API.md` | Additive `/discover/*` surface |
| `SEARCH_PLUS.md` | Multi-entity search surface |

## Explicit non-goals

AI ranking · Premium · Marketplace · Vector/embedding search as primary path · Invented S1 resources that contradict constitutional Discover Hub