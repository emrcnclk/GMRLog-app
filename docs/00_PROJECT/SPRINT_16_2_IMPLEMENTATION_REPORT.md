# Sprint 16.2 — Social Posts Core Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_16_2_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-21  
**Role:** Principal Software Architect / CTO  
**Mode:** Implementation  
**Freeze:** [`POSTS_PLATFORM_FREEZE_v1.md`](./POSTS_PLATFORM_FREEZE_v1.md)  
**ADR:** ADR-POST-001  
**Preceded by:** [`SPRINT_16_1_POSTS_ARCHITECTURE.md`](./SPRINT_16_1_POSTS_ARCHITECTURE.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture → Implementation

---

## Architecture summary

Posts is a standalone Nest BC (`apps/api/src/posts/**`). Owns `Post` / `PostMedia` / likes (`Like`+`POST`) / replies (`Comment`+`postId`) / mentions / hashtags / `PostRepost`. Composes peers **only** via domain events + thin adapters (no Feed/Notification/Search/Moderation/Analytics ownership).

**DB amendments (authorized):** `PostRepost` table; `FeedItemType` `POST_CREATED`/`POST_REPOSTED`; `NotificationType` `POST_MENTION`/`POST_REPLY`/`POST_LIKE`/`POST_REPOST`.

**Articles:** not implemented — shared pipeline design preserved for future Premium Articles.

---

## Endpoints

| Method | Path |
|--------|------|
| `POST` | `/posts` |
| `GET` | `/posts/{id}` |
| `PATCH` | `/posts/{id}` |
| `DELETE` | `/posts/{id}` |
| `GET` | `/posts/timeline` |
| `GET` | `/posts/user/{userId}` |
| `GET` | `/posts/{id}/replies` |
| `POST` | `/posts/{id}/like` |
| `DELETE` | `/posts/{id}/like` |
| `POST` | `/posts/{id}/reply` |
| `POST` | `/posts/{id}/repost` |

OpenAPI: `docs/08_API/POSTS_API.yaml` (bundled). Cursor pagination on list routes. Visibility: `PUBLIC` | `FOLLOWERS` | `PRIVATE`. Soft-delete → public **404**.

---

## Events

| Event | Publisher |
|-------|-----------|
| `post.created.v1` | Posts |
| `post.updated.v1` | Posts |
| `post.deleted.v1` | Posts |
| `post.liked.v1` / `post.unliked.v1` | Posts |
| `post.replied.v1` | Posts |
| `post.reposted.v1` | Posts |
| `post.visibility.changed.v1` | Posts |
| `post.mention.created.v1` | Posts |

---

## Feed integration

`FeedEventConsumer` ingests create/repost → `POST_CREATED` / `POST_REPOSTED` via `ingestGeneric`; delete → `handlePostDeleted`.

---

## Notification integration

IN_APP ingest for mention / reply / like / repost (`POST_*` types). No Notification ownership in Posts.

---

## Search integration

`SearchPostEventConsumer` logs index requests on create/update/delete — **no Meilisearch** (Freeze).

---

## Moderation integration

Social report `entityType=POST` unlocked; queue soft-delete sets `Post.deletedAt`. Restore of non-REVIEW types remains limited (pre-existing queue path).

---

## Analytics integration

`post.*` events added to `ANALYTICS_CONSUMED_EVENTS` (+ `postId` property keys). No counters in Posts.

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | **Pass** |
| `typecheck` (`@gmrlog/api`) | **Pass** |
| `build` (`@gmrlog/api`) | **Pass** |
| ESLint (`src/posts/**` + post consumers) | **Pass** |
| Unit (full suite) | **Pass** — 141 files / **569** tests (incl. posts 13) |
| E2E health | **Pass** — 3/3 |
| Full E2E / migrate deploy | Not blocking this report — apply migration `20260721010000_posts_sprint_16_2` in target envs |

---

## Remaining Critical Debt

1. **Multi-node cron / transactional outbox** — Platform Freeze-deferred (unchanged).  
2. **Apply Posts migration in all environments** before production traffic.

---

## Remaining Major Debt

1. Moderation **restore** path for POST (soft-delete only today on non-REVIEW hide).  
2. Social **block** check not composed into Posts `canView` (PrivacyService has no block port).  
3. Full `RATE_LIMITING` progressive abuse classes / trusted-proxy (Platform).  
4. Search real indexing (Meili) deferred.  
5. Notification preference matrix rows for new `POST_*` types may need seed defaults.

---

## Remaining Minor Debt

1. Adapter `notifyLifecycle` is intentional noop documentation hooks.  
2. Home timeline is follow+self SQL filter — not Feed inbox projection (Feed remains home SoT for activity feed).  
3. Hashtag `useCount` decrement on soft-delete optional.  
4. OpenAPI vs runtime DTO field polish.  
5. Vitest forces rate-limit off (suite convention).

---

## Explicitly not implemented

Bookmarks · Pinned · Quote · Polls · Communities · Drafts · Scheduling · GIF provider · Video · Recommendations · Trending hashtags · AI · Translation · Stories · **Premium Articles**

---

## Gate

**SPRINT 16.2 COMPLETE**

Stop. Do **not** continue to Sprint 16.3.
