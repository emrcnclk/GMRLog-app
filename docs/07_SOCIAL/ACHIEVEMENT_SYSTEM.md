# D3.21 — Achievement System

**Status:** LOCKED for D3.21  
**Authority:** S2 §10.7 + this document (GMRLOG-owned achievements only — never Steam).

## Categories

`logging` · `reviewing` · `friends` · `collections` · `tier_lists` · `communities` · `playtime` · `consistency` · `milestones` · `rare` · `hidden`

## Schema additives

| Column | Meaning |
|--------|---------|
| `category` | Taxonomy above |
| `isHidden` | Hidden until awarded (title/description redacted for others while locked) |
| `isRare` | Showcase emphasis |
| `target` | Progress target |

## Progress

`AchievementProgress`: `current` · `target` · `state` (`locked` \| `in_progress` \| `awarded`) · `awardedAt`

Recalculation is deterministic from platform counts (library, reviews, friendships, collections, tier lists, communities, session logs).

## API

- `GET /me/achievements`
- `GET /users/{id}/achievements`
- `GET /achievements/{id}`

## Side effects on award

- Notification `achievement_unlocked`
- ActivityItem `achievement`
- Profile showcase via awarded list + rare flag

## Non-goals

Steam sync as GMRLOG achievement truth · Premium achievements · Admin crafting UI (seeded definitions only).
