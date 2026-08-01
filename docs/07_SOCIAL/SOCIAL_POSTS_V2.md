# Social Posts v2 (D3.24)

**Document:** `docs/07_SOCIAL/SOCIAL_POSTS_V2.md`  
**Status:** **PLANNED** — D3.24 v1.2  
**Authority:** Posts Platform Freeze v1.0 (**amendment unlock**) · [`D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`](./D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md) · Hybrid Timeline  
**Mode:** Deterministic — **no AI**

---

## Mission

Author **User Generated** culture objects. Game Activities remain ActivityKind projections (`FEED_ENGINE_V2.md`) — Posts BC does not own them.

GMRLOG is a Gaming Social Platform: posts are one pillar of living gaming identity, not the whole timeline.

---

## Freeze unlock

Posts Platform Freeze v1.0 §4 deferred: Bookmarks · Pinned posts · Polls · Quote · GIF/Video · Communities attachment.

D3.24 **formally amends** that freeze for the allowlist below. Long-form Articles / Premium / Stories / Reels remain deferred.

---

## User Generated types (closed catalog)

| Type | Meaning | SoT |
|------|---------|-----|
| `POST` | Original short-form post | Posts |
| `REPOST` | Amplify post without new body | Repost edge |
| `QUOTE` | Quote of Post / Review / Collection / Guide / Achievement / Screenshot / Tier List | Quotes |
| `REVIEW` | Review projection | Reviews |
| `COLLECTION` | Collection projection | Collections |
| `TIER_LIST` | Tier list projection | Tier lists |
| `SCREENSHOT` | Image-primary post | Posts + media |
| `VIDEO` | Video-primary post | Posts + media |
| `POLL` | Poll attachment | Polls |
| `GUIDE` | Guide post | Posts (`postKind=guide`) |
| `COMMUNITY_POST` | Community-scoped post | Posts |
| `NEWS` | Official news subtype | Posts — AuthZ gated |

Game Activities catalog lives in Feed Engine + `TIMELINE_EVENTS.md`.

---

## Post aggregate (logical)

| Field | Notes |
|-------|-------|
| `id` | cuid |
| `authorId` | Users port |
| `body` | Text; spoiler flag separate |
| `visibility` | PUBLIC / FOLLOWERS / COMMUNITY / PRIVATE |
| `gameId?` | Games port |
| `communityId?` | Required when visibility=COMMUNITY or community post |
| `postKind` | `text` · `screenshot` · `video` · `poll` · `guide` · `news` · … |
| `containsSpoilers` | boolean |
| `media[]` | Platform storage refs |
| `pollId?` | When kind=poll |
| `replyToPostId?` | Thread reply (distinct from Quote) |
| `deletedAt` | Soft-delete |

Physical table remains `posts` with additive columns — no parallel invent.

---

## Media

| Attachment | Rule |
|------------|------|
| Images | Platform upload refs via `post_media` |
| Videos | Refs only; transcoding deferred beyond basic allow |
| GIF | Provider URL/ref allowlist — no arbitrary remote fetch as SoT |

Bytes never stored in Posts BC.

---

## Polls

| Table | Role |
|-------|------|
| `polls` | Question · options · endsAt · postId |
| `poll_votes` | Unique (pollId, userId) |

One vote per user. Results visibility = post visibility.

---

## Lifecycle

```
create → edit → soft-delete
         ├── like / unlike (existing)
         ├── reply / comment (existing)
         ├── repost / quote v2 / bookmark / pin (SOCIAL_ACTIONS)
         └── attach game · community · poll · media
```

Events: extend `POSTS_EVENT_MATRIX.md` with quote/bookmark/poll — no sync notification writes.

---

## Explicit non-goals

AI writing · AI moderation · scheduling · translation · Stories · Articles-as-Posts · engagement stickers.
