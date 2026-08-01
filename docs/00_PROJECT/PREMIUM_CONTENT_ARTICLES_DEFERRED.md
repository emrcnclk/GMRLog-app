# Premium Content Platform — Articles (Deferred)

**Document:** `docs/00_PROJECT/PREMIUM_CONTENT_ARTICLES_DEFERRED.md`  
**Date:** 2026-07-21  
**Status:** **Deferred after Backend MVP**  
**Classification:** Future product / Premium content — **not** Backend MVP · **not** Posts V1 · **not** Module 16 implementation scope  
**Related:** [`POSTS_PLATFORM_FREEZE_v1.md`](./POSTS_PLATFORM_FREEZE_v1.md) · Feature Matrix DOMAIN 16 (Premium) · [`POST_LAUNCH_BACKLOG.md`](./POST_LAUNCH_BACKLOG.md)

---

## Status

**Deferred after Backend MVP.**

Do **not** implement Articles in Posts sprints (16.2+), Backend MVP declare work, or Platform Freezes 10–15 reopen. No Prisma invent, no OpenAPI invent, and no Nest module for Articles until a future Premium / Articles Freeze unlocks this document.

---

## Description

Introduce **first-class long-form Articles** as a premium content type — separate from short-form Social Posts — for gaming culture essays and editorial content.

### Goals (product)

| Content form | Intent |
|--------------|--------|
| Gaming essays | Long-form cultural writing |
| Long-form reviews | Editorial depth beyond short Reviews/Posts |
| Guides / tutorials | How-to and skill content |
| Opinion pieces | Commentary |
| Hardware articles | Gear / platform culture |
| Devlogs | Creator / indie process writing |
| Retrospectives | Historical / franchise essays |

---

## Architecture constraints (normative when unlocked)

### Hard separation

| Rule | Meaning |
|------|---------|
| Articles **MUST NOT** replace Posts | Posts remain short-form UGC SoT ([`POSTS_PLATFORM_FREEZE_v1.md`](./POSTS_PLATFORM_FREEZE_v1.md)) |
| Separate **Article** aggregate | Own BC / tables / lifecycle — not `PostType` abuse |
| Premium-only publishing | Publish path gated by Premium (or equivalent entitlement) when product unlocks |
| Creator monetization compatible | Design must not preclude future creator payouts / paywall — details deferred |

### Shared content infrastructure (compose, do not duplicate)

Articles and Posts **must share** these pipelines via ports / events — not fork parallel stacks:

| Pipeline | Shared how |
|----------|------------|
| Feed | Fan-out into Feed inbox (`FeedItem` types for articles when amended) |
| Search | Index from article lifecycle events |
| Moderation | Report / queue / hide via Moderation + domain soft-delete port |
| Notification | Event-driven IN_APP (and later channels) for mentions/comments as defined later |
| Analytics | Allowlisted article events → Analytics ingest |

Platform remains storage / rate-limit / mail only. Articles must **not** own Users, Games, Reviews, GameLogs, Notifications, Search, Moderation, Analytics, Admin, or Platform.

### Relationship to Reviews

Short Reviews (Module Reviews BC) stay ratings + review SoT. Long-form “review essays” as Articles are a **different aggregate** — no dual SoT merge into `Review` without a future Freeze.

---

## Implementation shape (when unlocked — not now)

1. Articles Freeze + ADR (ownership, visibility, premium gate).  
2. Database / OpenAPI change-control for Article aggregate.  
3. Nest `articles` (or Premium content) module.  
4. Wire Feed / Search / Moderation / Notification / Analytics consumers.  
5. Premium entitlement check on publish.

**Out of this deferred note:** full monetization ledger, paywall UX, AI writing, CMS Admin Phase invent without Freeze.

---

## Explicit non-goals (until unlocked)

- Treating Articles as `Post` rows or `PostType` variants for MVP  
- Replacing Posts timelines with articles-only feed  
- Building Articles inside Backend MVP / Sprint 16.x Posts Core  
- Inventing Article tables in current Database Freeze without Premium unlock  

---

## Unlock criteria (future)

| Gate | Required |
|------|----------|
| Backend MVP declared | Yes |
| Posts V1 stable (short-form) | Yes |
| Premium / creator product Freeze | Yes |
| Articles Architecture + Event/Cache/Permission/Visibility matrices | Yes |

---

## Related

- Posts Freeze: Articles listed as deferred peer — not Posts scope  
- Feature Matrix DOMAIN 16 — Premium (badge/themes/etc.); Articles are premium **content**, scheduled after Backend MVP  
- Post Launch Backlog — Creator / editorial ideas may reference this note
