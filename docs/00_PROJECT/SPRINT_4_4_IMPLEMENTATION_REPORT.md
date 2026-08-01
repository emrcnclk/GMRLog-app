# GMRLOG Sprint 4.4 — Review Reactions & Engagement Implementation Report

**Sprint:** 4.4 — Review Reactions & Engagement  
**Date:** 2026-07-14  
**Status:** **COMPLETE — Awaiting review before Sprint 4.5**  
**Contracts:** `REVIEW_API.yaml` (likes) + documented OpenAPI gaps (typed reactions / engagement)  
**Schema:** unchanged (uses existing `ReviewVote`, `ReviewReaction`, `Review.likeCount`)  
**Out of scope:** moderation, notifications delivery, recommendation algorithms

---

## Implemented endpoints

| Method | Path | Auth | Source |
|--------|------|------|--------|
| POST | `/api/v1/reviews/{reviewId}/likes` | JWT | REVIEW_API (`204`) |
| DELETE | `/api/v1/reviews/{reviewId}/likes` | JWT | REVIEW_API (`204`) |
| POST | `/api/v1/reviews/{reviewId}/reactions` | JWT | **OpenAPI gap** |
| PUT | `/api/v1/reviews/{reviewId}/reactions` | JWT | **OpenAPI gap** (replace) |
| DELETE | `/api/v1/reviews/{reviewId}/reactions` | JWT | **OpenAPI gap** |
| GET | `/api/v1/reviews/{reviewId}/reactions` | Optional JWT | **OpenAPI gap** |
| GET | `/api/v1/reviews/{reviewId}/engagement` | Optional JWT | **OpenAPI gap** |

---

## Architecture

```text
ReviewLikesController / ReviewReactionsController
        │
        ├─ ReviewReactionService
        │     ├─ ReviewReactionRepository   (votes + reactions writes)
        │     ├─ ReviewEngagementService
        │     ├─ ReviewEngagementCacheService
        │     └─ DomainEventPublisher
        │
        └─ ReviewEngagementService
              ├─ ReviewEngagementRepository (aggregation)
              └─ ReviewReactionRepository   (reads / groupBy)
```

Engagement logic is **not** inside `ReviewService`.

---

## Persistence mapping

| Feature | Storage | Rule |
|---------|---------|------|
| Like | `ReviewVote` (`UPVOTE`) + `Review.likeCount` | One like per user; transactional increment/decrement |
| Reaction | `ReviewReaction` | App-level **one active reaction per user/review**; `PUT` deletes prior rows then inserts |
| Reaction types | Prisma `ReactionType` | LOVE, FIRE, RELATABLE, INSIGHTFUL, FUNNY, HELPFUL, SURPRISED, EMOTIONAL |

Schema unique is `@@unique([reviewId, userId, reactionType])` (allows multi-type). Sprint rule enforced in the write path via `deleteMany` + `create` in a transaction.

---

## Engagement strategy

```text
engagementScore =
  likeCount      * 2
+ reactionCount  * 1
+ commentCount   * 1
```

- `likeCount` / `commentCount` from `Review` denormalized counters  
- `reactionCount` via `COUNT` on `review_reactions` (`reviewId` index)  
- Per-type breakdown via `groupBy(reactionType)` — no full table scan  

No `engagementScore` column (Database Freeze); value is computed + cached.

---

## Cache strategy

| Key | Behavior |
|-----|----------|
| `review:{id}` | Invalidated on like/reaction change |
| `gameReviews:{gameId}` | Invalidated |
| `userReviews:{userId}` | Invalidated (author) |
| `review:engagement:{reviewId}` | Invalidated then **rewarmed** with anonymous summary after write |

---

## Events

| Event | When |
|-------|------|
| `review.reaction.created.v1` | New typed reaction |
| `review.reaction.updated.v1` | Reaction type replaced |
| `review.reaction.removed.v1` | Reaction deleted |
| `review.engagement.updated.v1` | After like or reaction mutation (payload includes counts + score) |

Consumers not required.

---

## Validation

| Rule | Response |
|------|----------|
| Duplicate like | `409 LIKE_ALREADY_EXISTS` |
| Duplicate same reaction | `409 REACTION_ALREADY_EXISTS` |
| Existing different reaction on POST | `409` (use PUT) |
| Invalid reaction type | `400` |
| Self-like / self-reaction | `403` (product rule; OpenAPI gap) |
| Missing review / like / reaction | `404` |
| Unauthenticated mutate | `401` |

---

## Test results

| Suite | Result |
|-------|--------|
| `review-reaction.service.spec.ts` | ✅ like, duplicate, self, add/update/remove reaction |
| `review-engagement.repository.spec.ts` | ✅ score formula |
| `reviews-reactions.e2e-spec.ts` | ✅ like, duplicate, self, reaction CRUD, list, engagement, cache, invalid type |

---

## OpenAPI gaps

1. Typed reaction endpoints (`/reactions`) not in REVIEW_API — only `/likes` is documented.  
2. `/engagement` summary endpoint not documented.  
3. Self-reaction forbidden — not specified in OpenAPI; implemented as product default.  
4. Schema allows multi-type reactions per user; runtime enforces single active reaction.

---

## Known limitations

1. No notification delivery / feed consumers yet.  
2. `engagementScore` not persisted (computed + Redis).  
3. Reaction list capped at 50 most recent (no cursor yet).  
4. DOWNVOTE path unused (likes only use UPVOTE).  
5. Schema unique on `(reviewId, userId, reactionType)` still permits DB-level multi-type if bypassed — service path is the SSOT for “one reaction”.

---

## Deliverables checklist

- [x] REVIEW_API like/unlike  
- [x] Typed reactions add/update/remove/list  
- [x] Engagement aggregation + score  
- [x] Separate reaction / engagement repositories & services  
- [x] Cache + events  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 4.5 until Sprint 4.4 has been reviewed and approved.**
