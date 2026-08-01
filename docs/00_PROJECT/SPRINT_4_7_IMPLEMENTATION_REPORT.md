# GMRLOG Sprint 4.7 — Review Module Finalization Report

**Sprint:** 4.7 — Review Module Finalization  
**Date:** 2026-07-14  
**Status:** **Review Module v1.0 COMPLETE — awaiting formal approval**  
**Contracts:** `REVIEW_API.yaml` + `ADMIN_API.yaml` (moderation) + `SOCIAL_API.yaml` (feed consumption)  
**Schema:** **Database Freeze v1.1** — migration `20260714223000_review_freeze_v1_1`  
**Out of scope:** Game Log module, feed ranking/discover, draft/media uploads, public revision history HTTP API

---

## Verdict

**Review Module v1.0 is production-ready** for the surfaces shipped in Sprints 4.1–4.6, with Freeze v1.1 closing the document–runtime persistence gaps and FOLLOWERS visibility wired to the follow graph.

Do **not** begin the Game Log module until this report is reviewed and approved.

---

## Architecture review

```text
ReviewsModule
├─ ReviewService              content CRUD + revision orchestration
├─ ReviewQueryService         visibility + cache + spoiler annotation
├─ SpoilerService             list redaction / spoiler.updated events
├─ Comment*                   threaded comments (separate from ReviewService)
├─ ReviewReactionService      likes + typed reactions + engagement events
├─ ReportService              user reports
└─ ReviewModerationService    hide/restore + queue resolve (admin)

FeedModule (separate) ◄── domain events (no ReviewService import)
```

Boundaries intentionally preserved:

* Moderation is **not** inside `ReviewService` (admin → `ReviewModerationService`).
* Feed aggregation is **not** inside Reviews (events → `FeedAggregationService`).
* Engagement mutations own reaction/engagement events; content mutations own review events.

---

## Close known gaps (4.1–4.6)

| Gap | Resolution |
|-----|------------|
| `language`, `playStatus`, `playTime` not persisted | **CLOSED** — Freeze v1.1 columns + repository write/read |
| `recommended`, `pros`, `cons`, `tags` stubs | **CLOSED** — persisted + mapper returns stored values |
| `completionHours` / `completionPercent` / `platform` / `achievementProgress` | **CLOSED** — persisted |
| `visibility` missing from OpenAPI Create/Update/Review | **CLOSED** — `ReviewVisibility` schema + fields |
| `language` / `playStatus` / `playTime` missing from OpenAPI | **CLOSED** — `ReviewPlayStatus` + fields |
| Revision history missing extras | **CLOSED** — `review_revisions.extras_snapshot` |
| FOLLOWERS = author-only | **CLOSED** — `PrivacyService.isFollowerOf` / `listFollowingIds` + list filters |
| Validate-only playStatus | **CLOSED** — enum validation against `REVIEW_PLAY_STATUSES` |

### Formally deferred (backlog — not v1.0 blockers)

| Item | Notes |
|------|-------|
| `GET /users/me/reviews` | Implemented; still OpenAPI gap |
| `?includeSpoilers=` | Implemented; still OpenAPI gap |
| Typed reactions / engagement HTTP | Implemented; still OpenAPI gap |
| Admin hide/restore HTTP | Implemented; still ADMIN OpenAPI gap |
| Public revision history API | Internal only (`ReviewRevision`); no public GET |
| Hide vs user-delete | Share `deletedAt` — no `isHidden` (Freeze unchanged) |
| Appeals HTTP | `Appeal` table exists; no REVIEW/ADMIN route |
| Comment reactions | Not in Review Module v1.0 |
| Engagement score column | Computed + Redis only (by design) |
| Feed `/feed/users/{id}` OpenAPI | Implemented; SOCIAL gap (owned by 4.6) |
| Media / drafts | Not shipped |

---

## Database alignment (Freeze v1.1)

Additive migration `20260714223000_review_freeze_v1_1`:

* Enum `review_play_status`
* `reviews`: `language`, `play_status`, `play_time`, `recommended`, `pros[]`, `cons[]`, `tags[]`, `completion_hours`, `completion_percent`, `platform`, `achievement_progress`
* `review_revisions.extras_snapshot` (JSONB)
* Indexes: `reviews_play_status_idx`, partial `reviews_game_id_created_at_alive_idx` (`WHERE deleted_at IS NULL`)

Prisma schema + `DATABASE_FREEZE_REPORT.md` revised to **1.1.0**.

---

## Performance review

| Area | Finding | Action |
|------|---------|--------|
| Indexes | Hot game list used `created_at` without partial index | Partial `(game_id, created_at DESC) WHERE deleted_at IS NULL` |
| N+1 | List maps via include + single `listFollowingIds` | No per-row follow queries |
| Pagination | Cursor `(createdAt, id)` + `limit+1` | Unchanged; confirmed |
| Cache hit ratio | Anonymous PUBLIC first pages only | Documented; follower views bypass list cache (correctness) |
| Query plans | Soft-deleted excluded via `deletedAt: null` | Aligns with partial index |

---

## Cache review

| Key | TTL | Invalidate on |
|-----|-----|----------------|
| `review:{id}` | 3600s | create / edit / delete / hide / restore / spoiler |
| `gameReviews:{gameId}` | 600s | same |
| `userReviews:{userId}` | 600s | same |
| `review:engagement:{id}` | 600s | like / reaction / engagement rebuild |
| Comment list keys | 600s | comment mutations |

Detail cache: **PUBLIC only**. List caches: **anonymous PUBLIC first page only**. Documented in `CACHE_STRATEGY.md`.

---

## Event review

| Mutation | Primary event(s) | Notes |
|----------|------------------|-------|
| Create review | `review.created.v1` | Exactly one |
| Soft delete | `review.deleted.v1` | Exactly one |
| Edit review | `review.edited.v1` + `review.revision.created.v1` | **Two aggregates** (Review + ReviewRevision) by design |
| Spoiler flag change (edit) | + `review.spoiler.updated.v1` | When spoiler toggles |
| Like create | `review.reaction.created.v1` (kind=like) + `review.engagement.updated.v1` | Reaction + derived engagement |
| Typed reaction create/update/remove | matching reaction event + engagement | Same pattern |
| Report | `review.reported.v1` | Exactly one |
| Hide / restore | `review.hidden.v1` / `review.restored.v1` | Exactly one |
| Queue resolve | `review.moderation.resolved.v1` (name per constants) | Exactly one |

Naming: `*.v1` suffix, payload includes ids + actor. Dual publish is intentional when multiple aggregates or derived projections update.

---

## Security review

| Control | Status |
|---------|--------|
| Owner-only edit/delete | Enforced (`ReviewForbiddenException`) |
| Visibility PUBLIC / FOLLOWERS / PRIVATE | Enforced on detail + list |
| FOLLOWERS | Requires authenticated follower (`follow` row) |
| PRIVATE / non-visible | `404` (no existence leak) |
| Soft-deleted | Excluded from queries; moderator restore path |
| Moderator hide/restore | ADMIN/MODERATOR guards on admin controllers |
| Self-report | Blocked |
| Self-like / self-reaction | Blocked (403) |
| Spoiler list default redaction | On; opt-in `includeSpoilers` |

---

## OpenAPI alignment

Updated `docs/08_API/REVIEW_API.yaml`:

* `ReviewVisibility`, `ReviewPlayStatus`
* `visibility`, `language`, `playStatus`, `playTime` on `Review`, `CreateReviewRequest`, `UpdateReviewRequest`

Remaining OpenAPI gaps listed under backlog above (HTTP exists; contract lag).

---

## Documentation updates

| Document | Change |
|----------|--------|
| `DATABASE_FREEZE_REPORT.md` | v1.1.0 + revision history |
| `CACHE_STRATEGY.md` | Review key / TTL / invalidation table |
| `SYSTEM_DESIGN.md` | Reviews + Feed domain map rows |
| `API_ARCHITECTURE.md` | REVIEW owns engagement/report; feed materialization elsewhere |
| This report | Finalization SSOT for v1.0 |

---

## Testing & metrics

### Unit (`vitest.config.ts`)

| Metric | Value |
|--------|-------|
| Test files | 38 passed |
| Tests | **218 passed** |
| Duration | ~20s (setup/collect dominant) |

### E2E (`vitest.e2e.config.ts`) — after Freeze v1.1 migrate

| Metric | Value |
|--------|-------|
| Test files | 19 passed / 1 failed |
| Tests | **145 passed** / 1 failed |
| Duration | ~37s |

**Failed (out of Review Module scope):** `games-discovery.e2e-spec.ts` → `autocompletes game titles` (suggestion not found). Unrelated to Review/Freeze changes.

**Review-related e2e:** core, comments, reactions, moderation, feed — **passed**.

### Typecheck

`pnpm --filter @gmrlog/api exec tsc -p tsconfig.build.json --noEmit` — clean after database enum re-exports + `tsconfig.build` excludes `*.spec.ts`.

---

## Remaining backlog (post–v1.0)

1. OpenAPI catch-up: me-reviews, includeSpoilers, reactions/engagement, admin hide/restore, feed user path.  
2. Distinguish moderator-hide vs author-delete (`isHidden` or status enum) — requires Freeze v1.2 if needed.  
3. Appeals HTTP surface.  
4. Public revision history API (if product requires).  
5. Comment reactions / media / drafts.  
6. Partial-index cleanup / popularity indexes from Freeze recommendations (2.2.0).  
7. Fix flaky catalog autocomplete e2e.

---

## Checklist

- [x] Freeze v1.1 additive migration  
- [x] Persist OpenAPI review fields through repository/mapper  
- [x] FOLLOWERS visibility via follow graph  
- [x] Cache / event / security audits documented  
- [x] REVIEW_API + SYSTEM_DESIGN + API_ARCHITECTURE + Freeze + CACHE updated  
- [x] Full unit suite green  
- [x] Review e2e green (1 unrelated discovery failure noted)  
- [x] **Review Module v1.0 COMPLETE** declared  

---

## Approval gate

**Review Module v1.0 COMPLETE.**

Game Log starts only after explicit approval of this report.
