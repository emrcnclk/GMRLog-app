# Game Hub (D3.24 v1.3)

**Document:** `docs/07_SOCIAL/GAME_HUB.md`  
**Status:** **PLANNED**  
**Authority:** F2.4 Game Experience · F5.1 (Game destination — **not** a new bottom tab) · [`D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`](./D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md)

---

## Mission

Steam game pages are thin. Every GMRLOG game becomes a **social hub** — the culture museum for that title.

Example: **ELDEN RING** hub gathers everything players create and live around that game.

---

## Hub tabs

| Tab | Content |
|-----|---------|
| Timeline | Hybrid feed filtered to `gameId` (PostItem + ActivityItem) |
| Reviews | Reviews for the game |
| Screenshots | Screenshot / media posts |
| Guides | Guide posts |
| Collections | Collections that include the game |
| Tier Lists | Tier lists that include the game |
| Events | Events with `gameId` |
| Communities | Communities tagged / linked to the game |
| Players | Players with library/activity on the game (privacy-aware) |

---

## Automatic fan-in

Any feed-eligible object with `gameId` (or collection/tier membership containing the game) **projects into** that Game Hub timeline/sections.

Composer attach Game · Review create · Achievement unlock · Event create → hub inventory updates via existing domain events (no second SoT).

---

## API (planned)

| Method | Path |
|--------|------|
| GET | `/games/:id/hub` — hub summary + tab counts |
| GET | `/games/:id/feed` — hub timeline (cursor) |
| GET | `/games/:id/reviews` · `/screenshots` · `/guides` · `/collections` · `/tier-lists` · `/events` · `/communities` · `/players` |

Reuse existing game routes where present; hub is a composition facade.

---

## Ranking on hub Timeline

Same FeedScore signals scoped to the game; Following/Friend weights still apply for social rows.

---

## Explicit non-goals

Separate Game app tab · Steam store replacement · realtime chat rooms per game.
