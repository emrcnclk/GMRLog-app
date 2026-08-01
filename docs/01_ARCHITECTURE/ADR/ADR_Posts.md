# ADR — Social Posts Platform

**ADR ID:** ADR-POST-001  
**Date:** 2026-07-21  
**Status:** **Accepted** (Sprint 16.1 — Posts Platform Freeze v1.0)  
**Deciders:** Architecture / Backend / Product / Security  
**Preceded by:** [`MODULE_16_SCOPE_REPORT.md`](../../00_PROJECT/MODULE_16_SCOPE_REPORT.md) (`APPROVED WITH MINOR CHANGES`)

---

## Context

Roadmap Phase 1 (Internal Alpha) lists **Text Posts**. Prisma already defines `Post`, `PostMedia`, polymorphic `Like` / `Mention`, `Comment` (post-capable), `Hashtag` / `PostHashtag`, and shared `Visibility`. Nest runtime has **no** Post HTTP surface; Feed consumers only review events; `FeedItemType` has no `POST_*` values; `SOCIAL_API.yaml` has no `/posts` CRUD.

Module 16 Scope Report identified Posts as the primary Alpha API gap and recommended Option A: implement Social Text Posts + Feed fan-out under a Freeze.

Risk: absorbing Posts into Users, Reviews, or Feed as SoT would reopen Freezes and duplicate UGC ownership. Inventing parallel tables (`PostLike`, `PostVisibility`) when polymorphic models exist would violate Database Freeze without change-control.

## Decision

1. **Posts is a standalone Business Context** — owns Post aggregate lifecycle and post-scoped engagement semantics.  
2. **Posts NEVER owns** Users, Games, Reviews, GameLogs, Notifications, Search, Moderation, Analytics, Admin, or Platform aggregates.  
3. **Compose via ports / events only** — Feed, Search, Notifications, Moderation, Analytics **consume**; Platform provides storage helpers only.  
4. **Physical schema reuse (no invent in 16.1):**  
   - Logical `PostMediaReference` → `PostMedia`  
   - Logical `PostVisibility` → shared `Visibility` enum (`PUBLIC` | `FOLLOWERS` | `PRIVATE`)  
   - Logical `PostLike` → `Like` where `entityType = POST`  
   - Logical `PostReply` → `Comment` where `postId` set (`parentId` for threads)  
   - Logical `PostMention` → `Mention` where `entityType = POST`  
   - `PostHashtag` / `Hashtag` as today  
5. **Repost:** first-class MVP product feature; **no `PostRepost` table today** — implementation requires a **minimal Database Freeze amendment** (authorized by this ADR) before/with first Posts implementation sprint. Quote posts remain deferred.  
6. **Events:** `post.{action}.v1` naming (Posts BC publisher), not domain lifecycle stolen from other BCs.  
7. **OpenAPI:** authorize `/posts*` surface via change-controlled OpenAPI (extend Social or dedicated Posts YAML) — **not edited in 16.1**.  
8. **Feed:** authorize `FeedItemType` values for post fan-out via Database amendment; Feed remains inbox SoT.  
9. **Moderation:** unlock `POST` entity reports for Posts MVP (was deferred in Moderation MVP allowlist).  
10. **MVP allowlist only** — bookmarks, polls, communities, quote, drafts, scheduling, GIF provider, video transcode, trending hashtags, AI moderation/writing, stories/reels explicitly deferred.  
11. Soft-delete via `Post.deletedAt` / reply `Comment.deletedAt`; public GET → **404**.  
12. Cursor pagination on timelines (createdAt + id).

## Why a separate BC?

- Distinct AuthZ (author vs audience visibility vs staff hide).  
- Independent failure domain from Reviews/GameLogs.  
- Feed/Search/Notification are consumers — not owners of post bodies.

## Why reuse polymorphic Like/Comment/Mention?

Database Freeze already shipped these models. Duplicating `PostLike` / dedicated Reply tables without need violates “no invent” and splits engagement SoT. Logical ownership remains Posts BC; physical rows stay shared tables filtered by post identity.

## Why authorize DB amendments for Repost + FeedItemType?

Repost and feed fan-out cannot be honest without storage. Freeze documents the amendment **gate** without applying migrations in 16.1.

## Consequences

- Sprint 16.2+ may implement Posts HTTP after OpenAPI + required DB amendments land under change-control.  
- Reviews keep owning `Comment` rows with `reviewId`; Posts owns rows with `postId` (XOR enforced in service).  
- Social graph module remains follow/block/mute — Posts is not graph SoT.  
- NotificationType gaps for mentions may need enum amendment or map to an existing allowlisted type — Event Matrix locks the contract.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Posts inside Feed BC | Feed is inbox projection, not UGC SoT |
| Posts inside Users | Users = identity/privacy SoT |
| Invent `PostVisibility` / `PostLike` tables now | Duplicates Database Freeze; no Prisma in 16.1 |
| Defer all Posts to Beta | Conflicts with ROADMAP Phase 1 + Module 16 Option A |
| Sync notify()/feed write from PostService | Breaks Notification/Feed Freezes |

## Status

**Accepted** with Posts Platform Freeze v1.0.
