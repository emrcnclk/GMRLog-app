# Posts Platform Freeze v1.0

**Document:** `docs/00_PROJECT/POSTS_PLATFORM_FREEZE_v1.md`  
**Date:** 2026-07-21  
**Status:** **FROZEN**  
**Preceded by:** Module 16 Scope Report (`APPROVED WITH MINOR CHANGES`) + Sprint 16.1 architecture  
**Unlocks:** Sprint 16.2 Posts Core implementation (after OpenAPI + required DB amendments under change-control)

**Naming:** Module 16 = Backend MVP Completion track. This Freeze = **Social Posts BC**. Feature Matrix DOMAIN 16 (Premium) is **out of scope**.

---

## What is frozen

The Posts Platform documentation set below is the **normative SSOT** for Sprint 16.2+.

| Artifact | Role |
|----------|------|
| [`docs/01_ARCHITECTURE/POSTS_ARCHITECTURE.md`](../01_ARCHITECTURE/POSTS_ARCHITECTURE.md) | BC boundaries & lifecycle |
| [`docs/01_ARCHITECTURE/ADR/ADR_Posts.md`](../01_ARCHITECTURE/ADR/ADR_Posts.md) | ADR-POST-001 Accepted |
| [`docs/03_EVENTS/POSTS_EVENT_MATRIX.md`](../03_EVENTS/POSTS_EVENT_MATRIX.md) | Publisher / consumer allowlist |
| [`docs/04_CACHE/POSTS_CACHE_STRATEGY.md`](../04_CACHE/POSTS_CACHE_STRATEGY.md) | Redis `posts:*` keys |
| [`docs/05_SECURITY/POSTS_PERMISSION_MATRIX.md`](../05_SECURITY/POSTS_PERMISSION_MATRIX.md) | AuthZ |
| [`docs/05_SECURITY/POSTS_VISIBILITY_MATRIX.md`](../05_SECURITY/POSTS_VISIBILITY_MATRIX.md) | Read / 404 rules |

**OpenAPI / Prisma:** This Freeze **does not edit** OpenAPI or Prisma in Sprint 16.1. It **authorizes** change-controlled OpenAPI `/posts*` registration and minimal Database amendments required for Repost + Feed fan-out (`FeedItemType`) before/with implementation.

**Prior Freezes intact:** Users, Feed, Reviews, GameLogs, Collections, Notification, Search, Moderation, Admin, Analytics, Platform — **not reopened**.

---

## Locked decisions (non-negotiable for 16.2+)

### 1. Ownership — Posts BC only

Posts owns **only** post aggregates and post-scoped engagement (logical Post / media / visibility policy / like / reply / repost / hashtag / mention).

Posts **MUST NOT** own Users, Games, Reviews, GameLogs, Notifications, Search, Moderation, Analytics, Admin, or Platform.

### 2. Schema mapping (no parallel invent)

| Logical | Physical (existing) |
|---------|---------------------|
| Post | `Post` |
| PostMediaReference | `PostMedia` |
| PostVisibility | `Visibility` on `Post` |
| PostLike | `Like` (`entityType=POST`) |
| PostReply | `Comment` (`postId` set) |
| PostMention | `Mention` (`entityType=POST`) |
| PostHashtag | `PostHashtag` + `Hashtag` |
| PostRepost | **DB amendment required** (authorized) |

Do **not** invent `PostVisibility` enum or duplicate `PostLike` tables in V1.

### 3. MVP allowlist

| Capability | Notes |
|------------|-------|
| Create / edit / soft-delete / get post | Author AuthZ; soft-delete `deletedAt` |
| Timeline | Author timeline + hashtag timeline (home = Feed) |
| Replies | Nested via `parentId` |
| Likes | Like/unlike |
| Reposts | After DB amendment; **no quote** |
| Mentions / hashtags | Parse + persist relations |
| Visibility | PUBLIC / FOLLOWERS / PRIVATE |
| Media references | URL refs via Platform storage upload paths |
| Cursor pagination | `(createdAt, id)` |
| Events | Per Event Matrix |
| Feed / Notification / Moderation / Search / Analytics hooks | Compose / consume only |

### 4. Explicitly deferred

Bookmarks · Pinned posts · Polls · Communities · Quote posts · Drafts · Scheduling · Rich embeds · GIF provider · Video transcoding · Trending hashtags · Recommendations · AI content moderation · AI writing · Post translation · Story/Reels · Meilisearch invent · WebSocket live post stream · **Long-form Articles / Premium Content Platform** ([`PREMIUM_CONTENT_ARTICLES_DEFERRED.md`](./PREMIUM_CONTENT_ARTICLES_DEFERRED.md) — Articles MUST NOT replace Posts)

### 5. Compose boundaries

| Peer | Rule |
|------|------|
| Users | Identity + privacy/block ports only |
| Feed | Consumes `post.*` → inbox; never Post SoT |
| Search | Indexes from events |
| Moderation | Reports `POST`; hide via Posts soft-delete port |
| Notifications | Event-driven IN_APP only |
| Analytics | Event consumers only |
| Platform | Storage/rate-limit/mail only |
| Reviews | Own review comments; XOR with post comments |

### 6. PostType V1

Implement **TEXT** (+ image `PostMedia` refs). Other `PostType` enum values (`POLL`, `VIDEO`, …) remain deferred even if present in Prisma.

### 7. Events

Posts publishes `post.*.v1` only. No stolen `user.*` / `review.*` / `moderation.*` ownership.

### 8. Cache

Only `posts:*` keys; targeted `DEL` / TTL; **no FLUSHALL / KEYS**.

### 9. Security / visibility

Permission + Visibility matrices normative. Soft-deleted → public **404**. Block → **404**.

### 10. OpenAPI

No path invent in 16.1 docs-only sprint. Implementation sprints register operations under change-control aligned to this Freeze.

---

## Authorized Database / OpenAPI change-control (implementation gate)

Before or with first coding sprint, change-control **may** add:

1. Minimal **Repost** persistence (junction or equivalent).  
2. `FeedItemType` values for post fan-out (e.g. `POST_CREATED`, `POST_REPOSTED`).  
3. Optional `NotificationType` values for post mention/reply if existing types cannot map cleanly.  
4. OpenAPI `/posts*` (and related) operations.

No other business tables without a Freeze amendment.

---

## Compatibility checklist

| Source | Result |
|--------|--------|
| North Star | Belonging expression — **compatible** |
| ROADMAP Phase 1 Posts | **compatible** (Option A) |
| Module 16 Scope | **compatible** |
| Freezes 10–15 + domain | Ownership preserved — **compatible** |
| Database Freeze | Reuse + authorized narrow amendments — **compatible** |

---

## Unlock

| Sprint | May start after this Freeze? |
|--------|------------------------------|
| **16.2 Posts Core** | **Yes** — after OpenAPI + required DB amendments for chosen MVP slice |
| 16.3+ Hygiene / Backend MVP declare | After Posts Core gates (per Module 16 plan) |
| Premium DOMAIN 16 | **No** |
| AI / Reels / Communities | **No** |

---

## Status

**FROZEN — Posts Platform Freeze v1.0**

### Planned amendment — D3.24

Sprint **D3.24 — Social Feed, Communities & Events** (`docs/07_SOCIAL/D3_24_SOCIAL_FEED_COMMUNITIES_EVENTS.md`) is the planned formal unlock for §4 items: Quote · Bookmark · Pin · Poll · GIF/Video refs · Community-scoped posts — under change-control. Articles / Premium / Stories / scheduling / translation / AI remain deferred.
