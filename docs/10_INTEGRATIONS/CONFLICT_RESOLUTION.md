# Conflict Resolution (D3.23)

**Status:** LOCKED

## Conflict kinds

| Kind | Meaning |
|------|---------|
| `existing` | Local library row already exists for mapped game |
| `imported` | Pure import candidate |
| `conflict` | Divergent status / playtime / ownership signals |

## Resolution actions — `SyncConflictResolution`

| Member | Behavior |
|--------|----------|
| `keep_local` | Preserve GMRLOG shelf; keep Steam mapping |
| `keep_steam` | Prefer Steam-derived status/playtime |
| `newest_wins` | Compare `updatedAt` / Steam last played |
| `ask_user` | Park in `sync_conflicts` until resolved |

Maps to S1 `ImportItemResolution` where applicable:

| S1 | D3.23 |
|----|-------|
| `keep_manual` | `keep_local` |
| `accept_import` | `keep_steam` |
| `skip` | leave unresolved / ignore |

Default for unattended sync: `newest_wins` for playtime, `keep_local` for shelf status when both exist.
