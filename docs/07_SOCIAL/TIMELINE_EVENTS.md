# D3.21 — Timeline Events

**Status:** LOCKED for D3.21 + D3.23 amendments · D3.24 Hybrid Timeline **PLANNED** (`FEED_ENGINE_V2.md`)  
**Storage:** `ActivityItem.kind` (`ActivityKind`) + feed projections

## ActivityKind (closed + D3.21 additives)

### Pre-existing (F5.2 / S2)

`review` · `post` · `collection` · `game_log` · `tier_list` · `friend` · `recommendation_slot` · `community` · `event` · `achievement` · `library_import`

### D3.21 additives (documented S2 enum amendment)

| Kind | Emitted when |
|------|----------------|
| `like` | Reaction `kind=like` created |
| `comment` | Comment created (root or reply) |
| `wishlist` | Library entry status → wishlist |
| `profile_pin` | Profile pin upserted |
| `milestone` | Profile milestone (e.g. completion %, friend count thresholds) |

### D3.23 additives (`docs/10_INTEGRATIONS/API.md`)

| Kind | Emitted when |
|------|----------------|
| `library_synced` | Scheduled/manual sync completed without new imports |
| `achievement_synced` | External achievement row reconciled to internal progress |
| `playtime_updated` | Steam/CSV playtime applied to library metadata |
| `integration_connected` | Provider connected (`UserIntegration` upsert) |
| `integration_disconnected` | Provider disconnected |

## Product event → kind mapping

| Product moment | Kind | objectType |
|----------------|------|------------|
| Friend accepted | `friend` | `user` |
| Achievement unlocked | `achievement` | `achievement` |
| Collection created | `collection` | `collection` |
| Tier list published | `tier_list` | `tier_list` |
| Review edited | `review` | `review` (updated activity or new item — implementation emits on meaningful edit) |
| Profile milestone | `milestone` | `user` |
| Community joined | `community` | `community` |
| Wishlist update | `wishlist` | `game` |
| Pin update | `profile_pin` | pin object type |
| Like received | `like` | target object |
| Comment / reply received | `comment` | `comment` |
| Library sync completed | `library_synced` | `game` |
| Library imported (CSV / first import) | `library_import` | `game` |
| Playtime updated from integration | `playtime_updated` | `game` |
| Integration connected / disconnected | `integration_connected` / `integration_disconnected` | `user` or `game` (integration id) |
| External achievement reconciled | `achievement_synced` | `achievement` |

## D3.24 Hybrid Timeline — Game Activities labels (v1.2)

Auto-projected into the same timeline as User Generated (`FEED_ENGINE_V2.md`). Not authored posts.

| Feed label | ActivityKind / rule |
|------------|---------------------|
| Started Playing | `game_log` when status → playing / in-progress |
| Finished Game | `game_log` when status → completed |
| Platinum Earned | `achievement` / `achievement_synced` when platinum rule matches |
| Achievement Unlocked | `achievement` |
| Wishlist Added | `wishlist` |
| Collection Completed | `collection` with completion metadata |
| Library Imported | `library_import` |
| Steam Sync Completed | `library_synced` |
| Playtime Milestone | `playtime_updated` and/or `milestone` (threshold catalog) |
| Review Published | `review` on create (edits may suppress duplicate noise) |

## Pagination

Cursor pagination on `/activity` and `/feed` (createdAt|id / rank keysets). D3.24 Feed Engine adds `filter` + score keysets.
