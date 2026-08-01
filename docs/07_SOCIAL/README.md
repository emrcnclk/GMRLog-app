# Social Domain (`docs/07_SOCIAL`)

**Status:** D3.21 **COMPLETE** · D3.24 **COMPLETE** (v1.3)  
**Authority chain:** S1/S2 → this folder → `docs/08_API/*` · Posts Platform Freeze (amendment for D3.24)  
**Mode:** Deterministic only — **no AI**

## Purpose

Gaming Social Platform — not a Twitter clone. Hybrid Timeline + Game Hub + reputation around lived play.

| Sprint | Focus |
|--------|--------|
| **D3.21** | Friends · Follow · profiles · archetypes · achievements · likes · comments |
| **D3.24** | Hybrid feed · FeedItem types · Game Hub · Creator · Review/Collection hubs · Reputation · LFG events · Composer++ |

## Documents

### D3.21 (LOCKED)

| Doc | Role |
|-----|------|
| `D3_21_COMPLETION_REPORT.md` | Delivery |
| `FRIEND_SYSTEM.md` | Bidirectional friends |
| `PLAYER_ARCHETYPES.md` | Archetypes |
| `ACHIEVEMENT_SYSTEM.md` | Achievements |
| `SOCIAL_GRAPH.md` | Follow · Friend · Block · Mute |
| `TIMELINE_EVENTS.md` | ActivityKind |
| `NOTIFICATION_MATRIX.md` | Notifications |

### D3.24 (COMPLETE v1.3)

| Doc | Role |
|-----|------|
| `D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md` | Master SSOT |
| `FEED_ENGINE_V2.md` | Ranking · filters · weights |
| `FEED_ITEM_TYPES.md` | PostItem · ActivityItem · RecommendationItem · Ad(future) |
| `GAME_HUB.md` | Per-game social hub |
| `SOCIAL_POSTS_V2.md` | User Generated |
| `COMPOSER.md` | Composer++ |
| `SOCIAL_ACTIONS.md` | Quote v2 · repost · bookmark · pin |
| `COMMUNITIES_2.md` | Magazine + badges |
| `EVENTS_V2.md` | LFG states |
| `REVIEW_FEED.md` | Letterboxd-style slices |
| `COLLECTION_HUB.md` | Discoverable collections |
| `REPUTATION.md` | Gaming reputation |
| `CREATOR_PROFILE.md` | Creator surfaces |
| `PROFILE_V2.md` | Profile Hero |
| `FEED_CACHE.md` | Redis |

## Explicit non-goals

AI · Discord chat · paid blue-check · live ads in D3.24 · new bottom tab · Twitter-clone identity

## Next

Implement D3.25 (Messaging / Chat / Voice / Presence) under change-control.
