# GMRLOG Sprint 4.1 — Review Core Implementation Report

**Sprint:** 4.1 — Review Core  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting review before Sprint 4.2**  
**Contracts:** `REVIEW_API.yaml` + Database Freeze + System Design (SSOT)  
**Schema:** unchanged (Database Freeze)  
**Out of scope:** likes, comments, reports, share, ratings breakdown endpoints, pros/cons/tags persistence, scheduled jobs

---

## Implemented Endpoints

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| POST | `/api/v1/reviews` | JWT | Create |
| GET | `/api/v1/reviews/{reviewId}` | Optional JWT | Detail |
| PATCH | `/api/v1/reviews/{reviewId}` | JWT (owner) | Update |
| DELETE | `/api/v1/reviews/{reviewId}` | JWT (owner) | Soft delete (`deletedAt`) |
| GET | `/api/v1/games/{gameId}/reviews` | Optional JWT | Cursor page |
| GET | `/api/v1/users/{userId}/reviews` | Optional JWT | Cursor page |
| GET | `/api/v1/users/me/reviews` | JWT | **OpenAPI gap** — sprint “Get My Reviews” |

---

## Architecture

```text
ReviewsController / GameReviewsController / UserReviewsController
        │
        ├─ ReviewService (writes)
        │     ├─ ReviewRepository
        │     ├─ ReviewCacheService
        │     └─ DomainEventPublisher
        │
        └─ ReviewQueryService (reads)
              ├─ ReviewQueryRepository
              ├─ ReviewCacheService
              └─ ReviewMapper
```

| Component | Responsibility |
|-----------|----------------|
| `ReviewRepository` | Create / update / soft-delete / uniqueness |
| `ReviewQueryRepository` | Detail + list queries with `include` (no N+1) |
| `ReviewMapper` | Prisma → OpenAPI `Review` shape |
| `ReviewCacheService` | `review:{id}`, `gameReviews:{gameId}`, `userReviews:{userId}` |

---

## Model mapping (OpenAPI ↔ Prisma)

| OpenAPI | Prisma |
|---------|--------|
| `rating` (0.5–5) | `overallScore` |
| `spoiler` | `containsSpoilers` |
| `scores.*` | `storyScore` … `replayabilityScore` |
| `mood` | `mood` |
| `title` / `body` | `title` / `body` |
| `likes` / `comments` | `likeCount` / `commentCount` |
| `visibility` | `visibility` (**OpenAPI gap** on Create/Update; persisted) |
| `author` / `game` | nested `user.profile` / `game` |

**One review per user per game:** `@@unique([userId, gameId])`. Soft-deleted rows are **revived** on re-create (unique constraint cannot free under Freeze).

---

## Validation strategy

| Rule | Enforcement |
|------|-------------|
| Rating 0.5–5 | DTO + `INVALID_RATING` |
| Title ≤ 200, body ≤ 10_000 | DTO + `REVIEW_TOO_LONG` |
| Spoiler boolean | DTO |
| Visibility enum | DTO + `INVALID_VISIBILITY` |
| Language (BCP-47) | Service; **not persisted** (no column) |
| playStatus / playTime | Validated; **not persisted** |
| Dimensional scores 0–100 int | DTO + service |
| Duplicate active review | `409 REVIEW_ALREADY_EXISTS` |

Errors use ProblemDetails (`AppException`).

---

## Cache strategy

| Key | TTL | When set | Invalidated |
|-----|-----|----------|-------------|
| `review:{id}` | 1h | Public detail | create / update / delete |
| `gameReviews:{gameId}` | 10m | First public page (limit=20, no cursor) | same |
| `userReviews:{userId}` | 10m | Public list page | same |

---

## Event strategy

| Event | When |
|-------|------|
| `review.created.v1` | After create / revive |
| `review.updated.v1` | After update |
| `review.deleted.v1` | After soft delete |

Consumers not required.

---

## Test results

| Suite | Result |
|-------|--------|
| `review.service.spec.ts` | ✅ create, duplicate, invalid rating/visibility, update, forbid, delete |
| `review-query.service.spec.ts` | ✅ detail cache, private hide, pagination |
| `reviews-core.e2e-spec.ts` | ✅ create, duplicate, invalid rating/visibility, lists, update + cache invalidation, soft delete |

---

## Known limitations

1. **Database Freeze:** `language`, `playStatus`, `playTime`, `recommended`, `pros`, `cons`, `tags`, `completionHours`, `platform`, `achievementProgress` accepted/validated where applicable but **not stored**; response returns empty/null for non-persisted OpenAPI fields.  
2. **`GET /users/me/reviews`** not in `REVIEW_API.yaml` (documented OpenAPI gap).  
3. **`visibility`** on create/update is an OpenAPI gap but required by sprint + Prisma.  
4. **FOLLOWERS** visibility behaves like author-only in 4.1 (follow-graph check deferred).  
5. Likes / comments / report / share / metadata endpoints deferred to later sprints.  
6. Soft delete + unique: re-create **revives** the soft-deleted row.

---

## Deliverables checklist

- [x] Core REVIEW_API CRUD + game/user lists + my reviews  
- [x] ReviewRepository / ReviewQueryRepository  
- [x] ReviewService / ReviewQueryService / ReviewMapper  
- [x] Cache + events  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 4.2 until Sprint 4.1 has been reviewed and approved.**
