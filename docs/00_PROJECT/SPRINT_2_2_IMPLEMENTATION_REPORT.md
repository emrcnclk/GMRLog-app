# GMRLOG Sprint 2.2 — Social Graph Implementation Report

**Sprint:** 2.2 — Social Graph  
**Date:** 2026-07-11  
**Status:** **COMPLETE — Awaiting review before Sprint 2.3**  
**Contract:** `docs/08_API/SOCIAL_API.yaml` (canonical owner per `API_ARCHITECTURE.md`)  
**Schema:** unchanged (Database Freeze respected)

> Note: Sprint brief referenced USER_API; architecture SSOT assigns follow/block/mute to **SOCIAL_API**. Routes match SOCIAL_API exactly under `/users/...`.

---

## Implemented Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/v1/users/{userId}/follow` | Bearer | Follow |
| DELETE | `/api/v1/users/{userId}/follow` | Bearer | Unfollow |
| GET | `/api/v1/users/{userId}/followers` | Public (optional Bearer) | Followers list |
| GET | `/api/v1/users/{userId}/following` | Public (optional Bearer) | Following list |
| POST | `/api/v1/users/{userId}/block` | Bearer | Block |
| DELETE | `/api/v1/users/{userId}/block` | Bearer | Unblock |
| GET | `/api/v1/users/me/blocked` | Bearer | Blocked users list |
| POST | `/api/v1/users/{userId}/mute` | Bearer | Mute |
| DELETE | `/api/v1/users/{userId}/mute` | Bearer | Unmute |
| GET | `/api/v1/users/{userId}/relationship` | Bearer | Relationship flags (mutual follow detection) |

**Not in this sprint:** friends / friend requests, feed, recommended/trending users, presence, mutual-friends (friendship graph).

---

## Architecture

```text
SocialGraphController (@Controller('users'))
  → SocialGraphService
    → SocialGraphRepository → Prisma (follows, blocked_users, muted_users, user_statistics)
```

Module: `apps/api/src/social/`

---

## Relationship Rules

| Rule | Behavior |
|------|----------|
| Follow | Creates `follows` row; increments `user_statistics.followingCount` / `followerCount` |
| Unfollow | Deletes row; decrements counters (floored at 0 via `gt: 0`) |
| Self-follow | `400 SELF_FOLLOW_FORBIDDEN` |
| Duplicate follow | `409 ALREADY_FOLLOWING` |
| Blocked either way | `403 BLOCKED_RELATIONSHIP` on follow/mute |
| Private profile (`privacy_settings.profileVisibility = PRIVATE`) | `403 PROFILE_PRIVATE` — no follow-request queue (no schema) |
| Mutual follow | Exposed via `GET .../relationship` (`isFollowing` + `followsYou`) |
| Block | Upserts block; **removes both follow directions**; clears related mutes |
| Unblock | Deletes block owned by actor |
| Mute | Does not remove follows; feed filtering later |

---

## Pagination

Cursor-only (`cursor` + `limit`). **No `page` / `pageSize`.**

Response shape (`UserCursorPage`):

```json
{
  "items": [ /* UserPublicProfile */ ],
  "hasNext": true,
  "nextCursor": "<base64url>"
}
```

- Cursor payload: `{ createdAt, id }` of the edge row (`follows` / `blocked_users`)
- Order: `createdAt DESC`, `id DESC`
- `limit` default 20, max 100
- Fetch `limit + 1` to compute `hasNext`

Blocked peers of the subject (and viewer, when authenticated) are excluded from followers/following lists.

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit (`SocialGraphService`) | **10/10** |
| E2E (`social.e2e-spec.ts`) | **9/9** |
| Typecheck | ✅ |

Covered: follow, duplicate, self-follow, unfollow, block, unblock, blocked follow attempt, followers/following lists, cursor pagination, mute/unmute.

---

## Known Limitations

1. **Follow requests** — no `FollowRequest` table under Freeze; private accounts reject follow with `PROFILE_PRIVATE` instead of queuing approval.  
2. **Friends / friend requests** — separate SOCIAL_API surface; deferred.  
3. **Mute list endpoint** — SOCIAL_API defines mute/unmute actions but no `GET /users/me/muted`; not invented.  
4. **Counter race** — counters updated in the same transaction as follow edges; no background reconcile job yet.  
5. **showFollowers / showFollowing privacy flags** — read from settings but not yet used to hide lists (privacy sprint).  
6. **Notification events** on follow/block — out of sprint scope.

---

## Production Readiness Assessment

**Ready for Sprint 2.2 review.**

Core social graph (follow / unfollow / lists / block / mute / relationship) is feature-complete against SOCIAL_API for this slice.

**Do not begin Sprint 2.3 until this report is reviewed and approved.**
