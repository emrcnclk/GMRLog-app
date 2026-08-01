# D3.21 — Notification Matrix

**Status:** LOCKED for D3.21 + D3.23 amendments · **D3.24 kinds PLANNED**  
**Storage:** `Notification.kind` (string, product-governed — S2 gap) · `objectType` · `objectId`

## Kinds (D3.21)

| kind | Recipient | object | Trigger |
|------|-----------|--------|---------|
| `friend_request` | receiver | `user` (sender) | Friend request created |
| `friend_accepted` | sender | `user` (accepter) | Request accepted |
| `achievement_unlocked` | awardee | `achievement` | Progress → awarded |
| `comment` | host owner | `comment` | Root comment on owned content |
| `reply` | parent author | `comment` | Nested reply |
| `like` | target owner | target type | Reaction kind=`like` |
| `collection_follow` | collection owner | `collection` | Reserved for collection follow (if mounted) |
| `community_activity` | members (fan-in later) | `community` | Community join / notable activity |
| `tier_list_interaction` | owner | `tier_list` | Comment/like on tier list |
| `review_interaction` | owner | `review` | Comment/like on review |

## Kinds (D3.23 — integrations)

| kind | Recipient | object | Trigger |
|------|-----------|--------|---------|
| `library_imported` | owner | `game` | CSV or first import completed |
| `sync_completed` | owner | `game` | Sync job completed |
| `sync_failed` | owner | `game` | Sync job failed |
| `achievement_synced` | owner | `achievement` | External achievement reconciled |
| `new_games_found` | owner | `game` | Sync discovered new titles |
| `library_updated` | owner | `game` | Library rows updated from sync |

## Kinds (D3.24 — planned · v1.2)

| kind | Recipient | object | Trigger | Default |
|------|-----------|--------|---------|---------|
| `mention` | mentioned user | `post` / `comment` | Someone mentioned you | **ON** |
| `quote` | target owner | target type | Someone quoted you (any quote target) | **ON** |
| `repost` | original author | `post` | Repost created | ON |
| `bookmark` | original author | `post` | Bookmark | **OFF** |
| `event_reminder` | RSVP user | `event` | Reminder job | ON (prefs) |
| `event_invite` | invitee | `event` | Invite friends to event | ON |
| `event_lfg` | LFG peers | `event` | Looking for team / need players / hosting | ON |
| `community_invite` | invitee | `community` | Someone invited you | ON |
| `community_accept` | inviter / applicant | `community` | Join approved | ON |
| `community_role` | member | `community` | Role changed | ON |
| `community_badge` | member | `community` | Community flair badge awarded | ON |
| `community_wiki` | community owner | `community` | Wiki page upsert by non-owner | ON |
| `community_event` | members | `event` | Community event | ON / digest |
| `community_milestone` | members | `community` | Community reached milestone | digest preferred |
| `post_pinned` | content owner | `post` / `community` | Community pin of owned content | ON |
| `reputation_awarded` | awardee | `user` | Gaming Reputation badge newly awarded | ON |
| `creator_featured` | creator | `user` | Creator eligibility / featured flag | ON |
| `friend_wishlist_play` | wishlist owner | `game` | Friend started a wishlist game | ON / rate-limit |

## Client API (unchanged)

- `GET /notifications` — cursor pagination
- `POST /notifications/read` — ids or `all: true`

## Rules

- Never notify the actor about their own action.
- Respect block: no notifications across blocked pairs.
- `messageKey` mirrors `kind` for localization (no manipulative copy in API).
- **Defaults:** Mention + Quote **ON**; Bookmark **OFF**.
- Large fan-out: digest / batch (`community_milestone`).

## Explicit non-goals

Push/email delivery · preference matrix expansion beyond existing NotificationPreference · admin broadcast.
