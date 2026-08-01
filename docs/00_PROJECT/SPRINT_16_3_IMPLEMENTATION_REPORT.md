# Sprint 16.3 — Social Posts Hardening & Integration Report

**Document:** `docs/00_PROJECT/SPRINT_16_3_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-21  
**Role:** Principal Software Architect / CTO  
**Mode:** Implementation  
**Freeze:** [`POSTS_PLATFORM_FREEZE_v1.md`](./POSTS_PLATFORM_FREEZE_v1.md)  
**Preceded by:** [`SPRINT_16_2_IMPLEMENTATION_REPORT.md`](./SPRINT_16_2_IMPLEMENTATION_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture → Implementation

**Scope:** Eliminate Sprint 16.2 Major Debt only. No Phase 2 / Premium Articles / Recommendations.

---

## Architecture summary

Posts remains a standalone Nest BC (`apps/api/src/posts/**`). Sprint 16.3 hardens peer composition without transferring ownership:

| Peer | Integration |
|------|-------------|
| **Moderation** | `PostsModerationAdapter.hidePost` / `restorePost`; queue resolve APPROVE → restore + `post.restored.v1`; REJECT/BAN → hide; append-only `moderation.resolve` audit unchanged |
| **Privacy / Social** | `PostsQueryService.canView` + timelines compose `SocialGraphService` block/mute ports (no block logic owned by Posts) |
| **Notifications** | `POST_MENTION` / `POST_REPLY` / `POST_LIKE` / `POST_REPOST` mapped in preference matrix; `createIfAllowed` gates inbox on coarse prefs + IN_APP matrix |
| **Feed** | Consumes `post.restored.v1` → rematerialize `POST_CREATED` via `ingestGeneric` |
| **Analytics** | `post.restored.v1` on allowlist |

Articles, bookmarks, pins, quotes, polls, communities, trending, Meili indexing, AI, translation, stories, Premium — **not implemented**.

---

## Moderation restore integration

1. Soft-hide sets `Post.deletedAt` and publishes `post.deleted.v1` (cache invalidate).  
2. Staff APPROVE on `entityType=POST` calls `restorePost` → clears `deletedAt`, invalidates cache, publishes **`post.restored.v1`** (`postId`, `authorId`, `visibility`, `restoredAt`).  
3. Feed rematerializes timeline visibility; public GET again respects visibility matrix (soft-deleted still 404 until restore).  
4. Queue resolve continues to write append-only audit (`moderation.resolve`) — Posts does not own Moderation audit storage.

---

## Privacy / block integration

`PostsQueryService` injects `SocialGraphService` (via `SocialModule`):

- **`canView`:** before visibility class checks — if viewer ≠ author and `isBlockedEitherWay` **or** `isMuted` → deny (public surface → **404**).  
- **Home timeline:** exclude blocked + muted author ids from follow set (self retained).  
- **User timeline:** blocked/muted peer → empty page (no existence leak beyond empty list).  

Posts does **not** duplicate block tables or policies.

---

## Notification preference integration

| Type | Coarse category |
|------|-----------------|
| `POST_LIKE`, `POST_REPOST` | `likes` |
| `POST_REPLY` | `comments` |
| `POST_MENTION` | `mentions` |

`NotificationIngestService.createIfAllowed` skips inbox create when category off or IN_APP matrix row disabled (same path as Review types). Unit coverage: POST_LIKE muted when `likes=false`; matrix sync integration covers POST_* rows.

---

## DTO / OpenAPI parity

Reviewed against `docs/08_API/POSTS_API.yaml`:

| Contract | Runtime |
|----------|---------|
| Body max 5000 | `POST_BODY_MAX_LENGTH = 5000` |
| Visibility enum | `PUBLIC` \| `FOLLOWERS` \| `PRIVATE` |
| Cursor | `{ createdAt, id }` base64url (`posts.cursor.ts`) |
| Delete / unlike | HTTP **204** |
| Soft-deleted GET | **404** |
| List limit | default 20 / max 50 |

No schema drift vs Freeze-authorized OpenAPI for MVP routes.

---

## Migration verification

**Migration:** `packages/database/prisma/migrations/20260721010000_posts_sprint_16_2`

| Check | Result |
|-------|--------|
| `prisma validate` | Pass |
| Schema ↔ migration tokens (`POST_*` enums, `post_reposts`) | Aligned — no drift |
| `prisma migrate deploy` (local `gmrlog`) | Applied successfully |
| `prisma migrate status` | Database schema up to date |

Pre-apply symptom: notification preference sync 500 (unknown enum) — resolved after deploy.

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | **Pass** |
| `typecheck` (`@gmrlog/api`) | **Pass** |
| `build` (`@gmrlog/api`) | **Pass** |
| ESLint (posts + moderation/feed touchpoints) | **Pass** |
| Unit (+ integration specs in vitest unit config) | **Pass** — 142 files / **575** tests |
| E2E health | **Pass** — 3/3 |
| E2E prefs (post-migrate) | **Pass** |
| Full E2E suite | **211 / 215 pass** — 4 failures outside Posts MVP: catalog mock search, moderation queue history list pagination, appeals/review-queue workflow flakes (pre-existing / non-Posts) |

---

## Remaining Critical Debt

**NONE**

---

## Remaining Major Debt

**NONE**

---

## Remaining Minor Debt

1. Multi-node cron / transactional outbox — Platform Freeze-deferred.  
2. Search real Meilisearch indexing — Freeze-deferred.  
3. Home Posts timeline is follow+self SQL — Feed inbox remains home activity SoT.  
4. Hashtag `useCount` decrement on soft-delete optional.  
5. Moderation queue e2e “RESOLVED history contains item” assertion flaky under large history pages.  
6. Catalog / discovery e2e mock provider flakes (non-Posts).  
7. Vitest forces rate-limit off (suite convention).

---

## Explicitly not implemented

Bookmarks · Pinned · Quote · Polls · Communities · Drafts · Scheduling · GIF provider · Video · Recommendations · Trending hashtags · Search indexing · AI · Translation · Stories · **Premium Articles**

---

## Gate

**SPRINT 16.3 COMPLETE**

Stop. Do **not** continue to Sprint 16.4.
