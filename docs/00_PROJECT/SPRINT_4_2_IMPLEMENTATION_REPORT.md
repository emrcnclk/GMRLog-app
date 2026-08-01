# GMRLOG Sprint 4.2 — Review Editing & History Implementation Report

**Sprint:** 4.2 — Review Editing & History  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting review before Sprint 4.3**  
**Contracts:** `REVIEW_API.yaml` (SSOT for public API) + Database Freeze exception for `ReviewRevision`  
**Out of scope:** comments, reactions, public revision endpoints

---

## Implemented behavior

| Capability | Behavior |
|------------|----------|
| Update review | `PATCH /api/v1/reviews/{reviewId}` (owner only) |
| Edit metadata | title, body, rating, mood, dimensional scores |
| Edit spoiler | `spoiler` → `containsSpoilers` |
| Edit visibility | `visibility` (OpenAPI gap; Prisma-backed) |
| Timestamps | Prisma `updatedAt` on successful edit |
| Soft-delete restore | Unchanged from 4.1 (revive on re-create) |

---

## Revision history architecture

```text
PATCH /reviews/{id}
        │
        ▼
ReviewService.update
        │
        ▼
ReviewRepository.updateWithRevision  ($transaction)
        │
        ├─1─ ReviewRevisionRepository.create  ← previous title/body/rating (+ snapshot)
        │
        └─2─ review.update                    ← current version only after history saved
```

### `ReviewRevision` (new table)

| Column | Purpose |
|--------|---------|
| `revision` | Monotonic per-review sequence (1, 2, …) |
| `title` / `body` / `rating` | **Previous** values before the edit |
| `containsSpoilers` / `visibility` / `mood` | Prior metadata |
| `scoresSnapshot` | Prior dimensional scores (JSON) |
| `editorId` | Who performed the edit |
| `createdAt` | When the revision was captured |

**Internal only** — no public history endpoint (not in `REVIEW_API.yaml`).

### Database Freeze exception

- Migration: `packages/database/prisma/migrations/20260712220000_review_revisions`
- Additive only (new table + FKs/indexes)
- Documented in `DATABASE_FREEZE_REPORT.md` v1.0.2

---

## Events

| Event | When |
|-------|------|
| `review.edited.v1` | After successful edit (payload includes `revisionId`) |
| `review.revision.created.v1` | After revision row insert |

`review.updated.v1` remains defined for compatibility but is **not** emitted on the edit path anymore (4.2 uses `edited`).

---

## Cache

On every successful edit, invalidate:

- `review:{id}`
- `gameReviews:{gameId}`
- `userReviews:{userId}`

---

## Validation

Same rules as create (rating, title/body length, spoiler, visibility, language/play fields when present, scores).  
Empty PATCH body → `400 VALIDATION_FAILED`.

---

## OpenAPI gaps

| Item | Notes |
|------|-------|
| `visibility` on Update/Create | Persisted; not in `CreateReviewRequest` / `UpdateReviewRequest` |
| `GET /users/me/reviews` | From 4.1; still not in REVIEW_API |
| Public revision history API | **Intentionally omitted** until documented |
| `language` / `playStatus` / `playTime` / pros / cons / tags | Still validate-only (no columns) — **must close in Freeze v1.1 before Sprint 4.7** |

---

## Test results

| Suite | Result |
|-------|--------|
| `review.service.spec.ts` | ✅ edit + revision mock, empty payload, authz |
| `review-revision.repository.spec.ts` | ✅ revision numbering + create |
| `review-query.service.spec.ts` | ✅ |
| `reviews-core.e2e-spec.ts` | ✅ edit, multiple revisions, cache invalidation, forbid non-owner |

---

## Known limitations

1. No public “edited” badge / diff API yet (revision data is ready for moderation/rollback later).  
2. FOLLOWERS visibility still author-only for reads (4.1 limitation).  
3. Validate-but-don’t-persist fields remain until Freeze v1.1.  
4. `review.updated.v1` no longer fired on edit — consumers should prefer `review.edited.v1`.

---

## Deliverables checklist

- [x] Safe edit workflow (history before mutate)  
- [x] Separate `ReviewRevision` table + repository  
- [x] Events + cache invalidation  
- [x] Unit + e2e coverage  
- [x] This report + Freeze exception note  

**Do not begin Sprint 4.3 until Sprint 4.2 has been reviewed and approved.**
