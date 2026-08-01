# D3.21 — Player Archetypes

**Status:** LOCKED for D3.21  
**Storage:** `UserArchetype` (multi-badge per user)  
**Recalc:** Automatic via `ArchetypeEngineService.recalculate(userId)` after library / social / achievement deltas and on profile/stats reads (lazy refresh).

## Badge keys

| Key | Signal (high level) |
|-----|---------------------|
| `collector` | Many owned / wishlist / collection entries |
| `completionist` | High completed / library completion % |
| `tryhard` | High session log density |
| `explorer` | Broad genre diversity |
| `reviewer` | Review count + length |
| `speedrunner` | Fast complete cycles (completed vs play sessions) |
| `backlog_hoarder` | Large backlog relative to completed |
| `competitive` | Event participations / community density |
| `story_lover` | Story-leaning genre affinity (RPG/Adventure proxies) |
| `indie_hunter` | Indie publisher/developer affinity when catalog tags exist; else low-score skip |
| `achievement_hunter` | Awarded GMRLOG achievements |
| `social_gamer` | Friends + follows + communities + comments |

Multiple badges may be active. Score is comparative within the engine; thresholded awards only.

## API

- `GET /me/archetypes`
- `GET /users/{id}/archetypes`

## Non-goals

No AI classification. No Premium-gated badges. No Steam achievement import as archetype truth.
