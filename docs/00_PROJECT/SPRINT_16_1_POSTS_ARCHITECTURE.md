# Sprint 16.1 — Posts Architecture Freeze Report

**Document:** `docs/00_PROJECT/SPRINT_16_1_POSTS_ARCHITECTURE.md`  
**Date:** 2026-07-21  
**Role:** Principal Software Architect / CTO  
**Mode:** Architecture Freeze — **documentation only** (no code / Prisma / OpenAPI edits)  
**Scope:** [`MODULE_16_SCOPE_REPORT.md`](./MODULE_16_SCOPE_REPORT.md)  
**Freeze:** [`POSTS_PLATFORM_FREEZE_v1.md`](./POSTS_PLATFORM_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture → Implementation

---

## Executive Summary

Sprint 16.1 freezes **Social Posts** as a standalone Business Context for Backend MVP Alpha (ROADMAP Phase 1 Text Posts). Schema already contains `Post` / `PostMedia` / engagement primitives; Nest and OpenAPI lack `/posts` runtime. This sprint locks ownership, lifecycle, visibility, engagement models, and peer integrations **without** implementing code or inventing parallel Prisma tables.

Logical names from the sprint brief map onto Database Freeze physical models (`Visibility`, `Like`, `Comment`, `Mention`, `PostHashtag`). **Repost** and **Feed `POST_*` item types** are authorized as narrow Database amendments for implementation sprints.

---

## Artifacts created

| Artifact | Path |
|----------|------|
| Architecture | `docs/01_ARCHITECTURE/POSTS_ARCHITECTURE.md` |
| ADR | `docs/01_ARCHITECTURE/ADR/ADR_Posts.md` (ADR-POST-001) |
| Platform Freeze | `docs/00_PROJECT/POSTS_PLATFORM_FREEZE_v1.md` |
| Event Matrix | `docs/03_EVENTS/POSTS_EVENT_MATRIX.md` |
| Cache Strategy | `docs/04_CACHE/POSTS_CACHE_STRATEGY.md` |
| Permission Matrix | `docs/05_SECURITY/POSTS_PERMISSION_MATRIX.md` |
| Visibility Matrix | `docs/05_SECURITY/POSTS_VISIBILITY_MATRIX.md` |
| This report | `docs/00_PROJECT/SPRINT_16_1_POSTS_ARCHITECTURE.md` |

---

## Defined (locked)

| Topic | Lock |
|-------|------|
| Ownership matrix | Posts SoT for post aggregate; peers compose/consume |
| Post lifecycle | create → edit → soft-delete; counters transactional |
| Visibility rules | Shared `Visibility` PUBLIC/FOLLOWERS/PRIVATE; 404 oracle |
| Reply model | `Comment` + `postId` + `parentId` |
| Like model | `Like` `entityType=POST` |
| Repost model | MVP product; DB amendment gate; no quote |
| Mention / hashtag flows | `Mention` / `PostHashtag`; trending deferred |
| Feed integration | Consume `post.*` → FeedItem; enum amendment |
| Notification integration | Event-driven IN_APP |
| Moderation integration | Unlock `POST` reports; soft-delete port |
| Search / Analytics | Event index / ingest hooks |
| Cache / security / soft-delete / cursor | Matrices + architecture |

---

## Explicitly deferred (confirmed)

Bookmarks · Pinned · Polls · Communities · Quote · Drafts · Scheduling · Rich embeds · GIF provider · Video transcoding · Trending hashtags · Recommendations · AI moderation/writing · Translation · Story/Reels

---

## Compatibility

| Freeze / peer | Result |
|---------------|--------|
| Users / Feed / Reviews / GameLogs / Collections | **Preserved** |
| Notification / Search / Moderation / Admin / Analytics / Platform | **Preserved** — compose only |
| Module 16 Scope Option A (Posts) | **Accepted** |

---

## Implementation unlock

Sprint **16.2** may implement Posts Core **after** change-controlled OpenAPI registration and required DB amendments (Repost + FeedItemType as needed).

---

## Gate

**APPROVED**

**SPRINT 16.1 COMPLETE**

Stop. Do **not** start Sprint 16.2.
