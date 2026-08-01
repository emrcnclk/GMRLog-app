# Collection Types (D3.22)

**Status:** LOCKED for D3.22  
**Owner:** Discovery / Social curation

## Closed vocabulary — `CollectionType`

| Member | Meaning |
|--------|---------|
| `manual` | Owner-curated ordered entries (legacy default) |
| `dynamic` | Membership resolved by a deterministic `ruleKey` at read time |
| `curated` | Editor/staff-curated snapshot (entries still stored) |
| `official` | Platform-owned official list |

## Dynamic `ruleKey` catalog (closed product set)

| ruleKey | Intent |
|---------|--------|
| `horror_under_5h` | Horror genre · short play signal |
| `soulslike` | Soulslike / difficult action tags + genres |
| `hidden_gems` | High review · low popularity |
| `steam_deck_verified` | Platform slug contains steam-deck signal |
| `cozy_games` | Cozy / chill genre+tag overlap |
| `under_10_usd` | Price band metadata when present; else popularity proxy skip |

Unknown `ruleKey` → empty membership (fail closed).

## Collection++ fields (additive on `collections`)

| Field | Notes |
|-------|-------|
| `type` | `CollectionType` |
| `ruleKey` | Nullable; required when `type=dynamic` |
| `bannerKey` · `coverKey` · `color` | Presentation |
| `tags` | String array (open labels, not closed enum) |
| Followers | `collection_followers` join |
| Likes / Comments | Existing reaction/comment hosts from D3.21 |
| Clone | `POST /collections/:id/clone` — copies title/entries as `manual` |

Visibility remains `ContentVisibility` (S2). Share is client deep-link; no invented share entity.
