# GMRLOG Sprint 4.3 — Review Comments Implementation Report

**Sprint:** 4.3 — Review Comments  
**Date:** 2026-07-13  
**Status:** **COMPLETE — Awaiting review before Sprint 4.4**  
**Contracts:** `REVIEW_API.yaml` (SSOT) + documented OpenAPI gaps  
**Schema:** unchanged (existing `Comment` model; Database Freeze intact)  
**Out of scope:** reactions, moderation, deeper than 1-level nesting

---

## Threading model

```text
Review
  └── Comment        (parentId = null)
        └── Reply    (parentId = Comment.id)
              ✗ no further nesting
```

Replies to replies return `400 INVALID_REPLY_TARGET`.

---

## Implemented endpoints

| Method | Path | Auth | Source |
|--------|------|------|--------|
| GET | `/api/v1/reviews/{reviewId}/comments` | Public | REVIEW_API |
| POST | `/api/v1/reviews/{reviewId}/comments` | JWT | REVIEW_API |
| GET | `/api/v1/comments/{commentId}/replies` | Public | REVIEW_API |
| POST | `/api/v1/comments/{commentId}/replies` | JWT | REVIEW_API |
| PATCH | `/api/v1/comments/{commentId}` | JWT (owner) | **OpenAPI gap** |
| DELETE | `/api/v1/comments/{commentId}` | JWT (owner) | **OpenAPI gap** (soft delete) |

### Ordering & pagination

- Query `sort=newest|oldest` (**OpenAPI gap**; default `newest`)
- Cursor pagination (`cursor`, `limit`) per common parameters

---

## Architecture

```text
ReviewCommentsController / CommentRepliesController / CommentsController
        │
        ├─ CommentService (writes)
        │     ├─ CommentRepository
        │     ├─ CommentCacheService
        │     └─ DomainEventPublisher
        │
        └─ CommentQueryService (reads)
              ├─ CommentQueryRepository
              └─ CommentCacheService
```

| Component | Responsibility |
|-----------|----------------|
| `CommentRepository` | Create / update / soft-delete + `Review.commentCount` |
| `CommentQueryRepository` | Top-level + reply lists (no N+1; `_count.replies`) |
| `CommentMapper` | Prisma → OpenAPI `Comment` |

---

## Cache strategy

| Key | Purpose |
|-----|---------|
| `reviewComments:{reviewId}` | First page (newest, limit=20) |
| `commentReplies:{commentId}` | First reply page |
| `review:{id}` + list keys | Review summary (`commentCount`) via `ReviewCacheService.invalidateReview` |

Invalidated on create / update / soft-delete.

---

## Events

| Event | When |
|-------|------|
| `comment.created.v1` | Top-level or reply create |
| `comment.updated.v1` | Edit |
| `comment.deleted.v1` | Soft delete |

---

## Validation

| Rule | Behavior |
|------|----------|
| Body 1–5000 chars | DTO + service |
| Reply target must be top-level | `400` |
| Deleted parent | `404` |
| Non-owner edit/delete | `403` |
| Missing review / comment | `404` |

---

## OpenAPI gaps

1. **PATCH/DELETE `/comments/{commentId}`** — required by sprint; not in REVIEW_API.  
2. **`sort=newest|oldest`** — not in REVIEW_API parameters.  
3. **`updatedAt` / `parentId` / `reviewId`** on Comment response — extras for clients; harmless.  
4. Soft-deleted comments are omitted from lists (no tombstone body in API).

---

## Test results

| Suite | Result |
|-------|--------|
| `comment.service.spec.ts` | ✅ create, reply, nested reject, edit, authz, delete |
| `comment-query.service.spec.ts` | ✅ list + pagination + replies |
| `reviews-comments.e2e-spec.ts` | ✅ create, reply, nested 400, edit, forbid, soft delete, pagination, cache invalidation |

---

## Known limitations

1. No reactions / likes on comments (later sprint).  
2. No moderation queue / report-on-comment.  
3. Soft-deleting a top-level comment does **not** cascade soft-delete its replies (replies remain orphaned under deleted parent; listing replies of deleted parent → 404).  
4. `Review.commentCount` includes replies; decremented on soft-delete with floor at 0.

---

## Deliverables checklist

- [x] REVIEW_API comment + reply endpoints  
- [x] Edit / soft-delete (OpenAPI gaps)  
- [x] 1-level threading only  
- [x] newest/oldest + cursor pagination  
- [x] CommentRepository / CommentQueryRepository  
- [x] Cache + events  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 4.4 until Sprint 4.3 has been reviewed and approved.**
