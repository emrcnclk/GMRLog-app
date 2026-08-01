# Posts Architecture

**Document:** `docs/01_ARCHITECTURE/POSTS_ARCHITECTURE.md`  
**Status:** **Frozen — Posts Platform Freeze v1.0** (Sprint 16.1)  
**ADR:** [`ADR_Posts.md`](./ADR/ADR_Posts.md) (ADR-POST-001)  
**Scope:** [`MODULE_16_SCOPE_REPORT.md`](../00_PROJECT/MODULE_16_SCOPE_REPORT.md)

**Naming:** Sprint Module **16** tracks Backend MVP completion; this BC is **Social Posts** (UGC). Feature Matrix DOMAIN 16 (Premium) is unrelated.

---

## Purpose

Define the **Posts** bounded context that owns user-generated short-form posts for GMRLOG’s digital home — share moments, reactions, and conversation around gaming culture — without becoming a generic social network SoT for identity, games, or moderation policy.

North Star: Posts strengthen **belonging and expression**; they do not invent AI feeds, reels, or community products in V1.

---

## Hard rule

**Posts owns post aggregates and post-scoped engagement only. Posts NEVER owns foreign business entities.**

| Posts MAY own (logical) | Physical SoT (Database Freeze — no invent in 16.1) | Posts MUST NOT own |
|-------------------------|------------------------------------------------------|--------------------|
| Post | `Post` | Users / profiles / `PlatformRole` |
| PostMediaReference | `PostMedia` | Games catalog |
| PostVisibility policy | Shared `Visibility` on `Post` | Reviews / GameLogs |
| PostLike | `Like` where `entityType = POST` | Notifications inbox |
| PostReply | `Comment` where `postId` set | Search index engine |
| PostRepost | **Amendment-gated** minimal repost store | Moderation queue/policy |
| PostHashtag relation | `PostHashtag` + `Hashtag` | Analytics DailyMetric |
| PostMention relation | `Mention` where `entityType = POST` | Admin audit semantics / Platform infra |

---

## Context map

```text
                         ┌──────────────────────┐
                         │        Posts         │
                         │  Post · media · like │
                         │  reply · repost · tag│
                         └──────────┬───────────┘
      ┌───────────┬─────────┬───────┼───────┬─────────┬──────────┐
      ▼           ▼         ▼       ▼       ▼         ▼          ▼
   Users       Feed      Search  Moderation  Notif  Analytics  Platform
 (identity)  (inbox)   (index)  (reports)  (hooks) (events)  (storage)
```

Prior Freezes remain intact. Posts **extends** Backend MVP Alpha surface; it does not reopen Review/Feed/Notification ownership.

---

## Ownership matrix

| Concern | Source of Truth | Posts role |
|---------|-----------------|------------|
| Author identity / bans / privacy defaults | **Users** | Read ACL ports; never mutate profile |
| Post body, type, visibility, soft-delete | **Posts** | Write SoT |
| Media bytes | **Platform** storage | Posts stores `PostMedia` URL refs only |
| Optional `gameId` reference | **Games** owns Game | Posts may attach id; no catalog mutate |
| Home / follower inbox rows | **Feed** | Consume `post.*` events → `FeedItem` |
| Keyword / entity search docs | **Search** | Consume index hooks; Posts not query engine |
| Report / queue / hide-via-policy | **Moderation** | Domain soft-delete port; report `entityType=POST` |
| Mention / reply alerts | **Notifications** | Consume events; no sync inbox write |
| KPI counts | **Analytics** | Consume allowlisted events |
| Rate limit / SMTP | **Platform** | Cross-cutting only |

---

## Post lifecycle

```text
create → (optional edit) → soft-delete
                │
                ├── like / unlike
                ├── reply (+ nested reply)
                ├── repost (after DB amendment)
                ├── mention resolve
                └── hashtag attach
```

| Transition | Rule |
|------------|------|
| Create | Authenticated USER; body and/or media per validation; default `visibility=PUBLIC` unless set; `postType` V1 allowlist: **TEXT** (+ IMAGE media refs); other `PostType` enum values deferred |
| Edit | Author only; may update body / visibility / media set within policy; emit `post.updated.v1` |
| Soft-delete | Author or staff hide port; set `deletedAt`; emit `post.deleted.v1`; public GET **404** |
| Restore | Staff/moderation path only if Freeze later unlocks; not required in first implementation sprint |

Counters (`likeCount`, `commentCount`, `shareCount`) update in the same transaction as engagement writes.

---

## Visibility rules

Reuse shared `Visibility` (logical PostVisibility):

| Value | Who can read post GET / appear on public timelines |
|-------|-----------------------------------------------------|
| `PUBLIC` | ANON (if product allows) + USER + followers + self |
| `FOLLOWERS` | Author + accepted followers (Users/Social graph port) |
| `PRIVATE` | Author only (+ staff via Moderation/Admin ports) |

Blocked relationships: treat as non-visible (**404**), consistent with Social/Notification patterns.  
Suspended/banned authors: suppress from public timelines (Users flags port).

---

## Reply model

- Physical: `Comment` with `postId` NOT NULL, `reviewId` NULL (XOR).  
- Threading: `parentId` → parent must belong to same `postId`.  
- Soft-delete: `Comment.deletedAt`; public omit/404.  
- Posts BC owns create/list/delete for **post** comments; Reviews BC retains review comments.  
- Emit `post.reply.created.v1` / `post.reply.deleted.v1`.

---

## Like model

- Physical: `Like` unique `(userId, entityType=POST, entityId=postId)`.  
- Unlike = delete like row; adjust `Post.likeCount`.  
- Do not dual-write SOCIAL `/reactions` as second SoT for the same post like in V1 — Reactions OpenAPI may remain for other entities; Posts likes go through Posts API.  
- Emit `post.liked.v1` / `post.unliked.v1`.

---

## Repost model

- Product MVP includes reposts; **quote posts deferred**.  
- Physical store **absent** in current schema → **Database Freeze amendment** required (minimal junction or `originalPostId` on a repost row) before implementation.  
- Until amendment lands, implementation sprint must not fake reposts via Reviews or invent undeclared tables outside change-control.  
- On success: increment original `shareCount`; emit `post.reposted.v1`; Feed may fan-out a repost item type once enum exists.

---

## Mention flow

1. On create/edit, parse `@username` (or structured mention ids from client).  
2. Resolve via Users port; insert `Mention` rows (`entityType=POST`).  
3. Emit `post.mention.created.v1` per target (or batched).  
4. Notifications consume → IN_APP (Notification Freeze); suppress on block/pref-off.  
5. Never embed emails or secrets in events.

---

## Hashtag flow

1. Parse `#tag` on create/edit; normalize citext.  
2. Upsert `Hashtag`; link `PostHashtag`; maintain `useCount` carefully (decrement on soft-delete optional V1).  
3. Timeline by hashtag = Posts query (not Search engine ownership).  
4. **Trending hashtags deferred.**

---

## Feed integration

| Step | Owner |
|------|-------|
| Publish `post.created.v1` / `post.deleted.v1` / `post.updated.v1` | Posts |
| Fan-out to author timeline + follower inboxes | **Feed** consumer |
| Persist `FeedItem` | Feed (`targetType`/`targetId` → post) |
| New `FeedItemType` values | **Database amendment** authorized (e.g. `POST_CREATED`, `POST_REPOSTED`) |

Feed never becomes Post body SoT. Discover/trending ranking algorithms deferred.

---

## Notification integration

| Event | Notification role |
|-------|-------------------|
| `post.mention.created.v1` | Create IN_APP for target |
| `post.reply.created.v1` | Notify post author (and parent reply author if nested) |
| `post.liked.v1` | Optional; prefer throttle / Phase preference — Freeze allows but may ship muted defaults |
| `post.reposted.v1` | Notify original author |

No sync `notify()` from Posts services.

---

## Moderation integration

| Concern | Owner |
|---------|-------|
| `POST /reports` with `entityType=POST` | Moderation (allowlist **unlocked** for Posts MVP) |
| Soft-hide post | Posts soft-delete port invoked by Moderation resolve |
| Sanctions | Users BC |
| AI toxicity | **Deferred** |

---

## Search integration

| Concern | Owner |
|---------|-------|
| Index/update/delete post docs | Search consumer on `post.created/updated/deleted.v1` |
| Query DSL / ranking | Search |
| Posts HTTP search-by-hashtag | Posts (simple filter) — not Meilisearch invent |

---

## Analytics integration

Allowlisted consumers may ingest `post.created.v1`, `post.deleted.v1`, engagement events per Analytics Event Matrix amendment when implemented. Posts does not write `AnalyticsEvent` directly.

---

## Soft delete policy

- Author delete → `deletedAt=now()`.  
- Cascading media: keep rows or orphan-clean via job (implementation detail); URLs must not be publicly resolved for deleted posts.  
- Replies under deleted posts: not publicly listable.  
- Staff may still resolve reports with redacted preview (Moderation Visibility).

---

## Cursor pagination

- Timelines (user posts, home is Feed-owned, hashtag, replies): cursor = `(createdAt, id)` descending.  
- No offset pagination for hot paths.  
- Limit caps via Platform rate limit + DTO max page size.

---

## Module layout (target runtime)

Suggested Nest locus (implementation): `apps/api/src/posts/**` (preferred) or `social/posts/**` — **Posts BC**, not Social graph services. SocialModule remains graph-only.

---

## Related

- Freeze: [`POSTS_PLATFORM_FREEZE_v1.md`](../00_PROJECT/POSTS_PLATFORM_FREEZE_v1.md)  
- Events: [`POSTS_EVENT_MATRIX.md`](../03_EVENTS/POSTS_EVENT_MATRIX.md)  
- Cache: [`POSTS_CACHE_STRATEGY.md`](../04_CACHE/POSTS_CACHE_STRATEGY.md)  
- Permission / Visibility: `docs/05_SECURITY/POSTS_*`  
- Deferred long-form: [`PREMIUM_CONTENT_ARTICLES_DEFERRED.md`](../00_PROJECT/PREMIUM_CONTENT_ARTICLES_DEFERRED.md) — separate Article aggregate; shared Feed/Search/Moderation/Notification/Analytics pipelines; **not** Backend MVP
