# GMRLOG Sprint 4.5 — Review Moderation & Spoilers Implementation Report

**Sprint:** 4.5 — Review Moderation & Spoilers  
**Date:** 2026-07-14  
**Status:** **COMPLETE — Awaiting review before Sprint 4.6**  
**Contracts:** `REVIEW_API.yaml` (report) + `ADMIN_API.yaml` (reports, moderation queue) + documented OpenAPI gaps (hide/restore, spoiler list preview)  
**Schema:** unchanged (uses existing `Report`, `ReportReason`, `ModerationQueueItem`, `ModerationAction`, `Review.containsSpoilers`, `Review.deletedAt`)  
**Out of scope:** AI moderation, automatic bans/suspends, notification delivery, `/admin/moderation/batch-scan`, appeals endpoints (not documented as HTTP)

---

## Implemented endpoints

| Method | Path | Auth | Source |
|--------|------|------|--------|
| POST | `/api/v1/reviews/{reviewId}/report` | JWT | REVIEW_API (`202`) |
| GET | `/api/v1/admin/reports` | ADMIN/MODERATOR | ADMIN_API |
| PATCH | `/api/v1/admin/reports/{reportId}` | ADMIN/MODERATOR | ADMIN_API |
| GET | `/api/v1/admin/moderation/queue` | ADMIN/MODERATOR | ADMIN_API |
| GET | `/api/v1/admin/moderation/queue/{itemId}` | ADMIN/MODERATOR | ADMIN_API |
| POST | `/api/v1/admin/moderation/queue/{itemId}/resolve` | ADMIN/MODERATOR | ADMIN_API (`200`) |
| POST | `/api/v1/admin/reviews/{reviewId}/hide` | ADMIN/MODERATOR | **OpenAPI gap** (`200`) |
| POST | `/api/v1/admin/reviews/{reviewId}/restore` | ADMIN/MODERATOR | **OpenAPI gap** (`200`) |

Spoiler safety is applied on existing list/detail review endpoints (no new path).

---

## Architecture

```text
ReviewService                    ReviewQueryService
    │                                    │
    └──────── SpoilerService ────────────┘
                 (spoiler flag / list safety / warning)

ReviewModerationService   ← admin + report controllers
    │
    ├─ ReportService      (create / list / update reports)
    ├─ ReviewModerationRepository
    ├─ ReportRepository   (queue resolve closes reports)
    ├─ ReviewCacheService
    └─ DomainEventPublisher
```

- **ReviewService** owns content CRUD only; uses `SpoilerService` for spoiler annotation / `review.spoiler.updated.v1`.
- **ReviewModerationService** owns hide/restore, queue resolve, and is the only public façade for reporting (delegates to `ReportService`).
- Controllers never inject `ReportService` or put moderation inside `ReviewService`.
- Same moderation façade can later back comments / collections / lists.

---

## Moderation workflow

```text
Report created → Report.status = OPEN
               → ModerationQueueItem.status = PENDING

Admin PATCH report → OPEN | IN_REVIEW | RESOLVED | DISMISSED
                     (terminal statuses set resolvedBy / resolvedAt)

Queue resolve → ModerationAction row
             → QueueItem = RESOLVED
             → Linked OPEN/IN_REVIEW reports closed
             → REVIEW entity side-effects:
                  REJECT / BAN   → hide (deletedAt)
                  APPROVE        → restore if hidden
                  EDIT_APPROVE   → replace body + restore
                  WARN/SUSPEND   → action recorded only (no auto-ban)
```

Appeals: `Appeal` table exists in Freeze; **no HTTP surface** in REVIEW/ADMIN_API for this sprint.

---

## Spoiler strategy

| Surface | Behavior |
|---------|----------|
| Detail `GET /reviews/{id}` | Full body; `spoiler` + `spoilerWarning` when flagged |
| List (game/user) | Default **redacts** body to `[Spoiler content hidden]` when `spoiler=true` |
| `?includeSpoilers=true` | Reveals spoiler bodies (**OpenAPI gap** query) |
| Own reviews (`/users/me/reviews`) | Spoilers always included for author |
| Create/Update | Existing `spoiler` → `containsSpoilers`; flag change emits `review.spoiler.updated.v1` |

Cache stores **full** (non-redacted) list payloads; redaction is applied on read so `includeSpoilers` stays consistent.

---

## Reporting strategy

| API reason (`ReportReviewRequest`) | Seed `report_reasons.code` |
|------------------------------------|----------------------------|
| SPAM | `spam` |
| HARASSMENT | `harassment` |
| HATE | `hate_speech` |
| MISINFORMATION | `misinformation` |
| SPOILER | `spoiler` |
| NSFW | `nsfw` |
| COPYRIGHT | `copyright` |
| OTHER | `other` |

- Duplicate **active** reports blocked (`OPEN` / `IN_REVIEW`) for same reporter + review → `409 REPORT_ALREADY_EXISTS`
- Self-report forbidden → `403`
- Invalid / inactive reason → `400`
- HATE / HARASSMENT / NSFW → queue priority `HIGH`; others `MEDIUM`

---

## Persistence mapping

| Feature | Storage |
|---------|---------|
| Report | `reports` + `report_reasons` |
| Queue | `moderation_queue` (+ `moderation_actions` on resolve) |
| Hide / restore | `reviews.deletedAt` (same soft-delete column as user delete; Freeze has no `isHidden`) |
| Spoiler flag | `reviews.contains_spoilers` |
| Audit | `audit_logs` (`moderation.resolve`, `moderation.report.update`, hide/restore) |

---

## Cache invalidation

Invalidates `review:{id}`, `gameReviews:{gameId}`, `userReviews:{userId}` when:

- review hidden
- review restored
- spoiler flag changes
- EDIT_APPROVE rewrites body

---

## Events

| Event | When |
|-------|------|
| `review.reported.v1` | Report created |
| `review.hidden.v1` | Moderator hide / REJECT / BAN content hide |
| `review.restored.v1` | Moderator restore / APPROVE restore |
| `review.spoiler.updated.v1` | Author (or moderator helper) toggles spoiler flag |
| `moderation.resolved.v1` | Queue item resolved (ADMIN_ARCHITECTURE) |

Consumers not required.

---

## Validation / errors

| Rule | Response |
|------|----------|
| Duplicate active report | `409 REPORT_ALREADY_EXISTS` |
| Invalid reason | `400 VALIDATION_FAILED` |
| Self-report | `403` |
| Missing review / report / queue item | `404` |
| Non-moderator admin routes | `403` |
| Already hidden / not hidden | `409` |
| Queue already resolved | `409` |
| EDIT_APPROVE without `editedContent` | `400` |
| SUSPEND without `suspensionDays` | `400` (validated; user suspend not applied) |

ProblemDetails via existing filter.

---

## Test results

| Suite | Result |
|-------|--------|
| `report.service.spec.ts` | ✅ create, duplicate, self, missing, inactive reason |
| `review-moderation.service.spec.ts` | ✅ hide/restore, REJECT hide, already-resolved |
| `spoiler.service.spec.ts` | ✅ warning + list redaction |
| `review.service.spec.ts` / `review-query.service.spec.ts` | ✅ wired with SpoilerService |
| `reviews-moderation.e2e-spec.ts` | ✅ report, duplicate, authz, hide/restore + cache, spoiler list/detail, queue resolve, spoiler event, invalid reason |

---

## OpenAPI gaps

1. **`POST /admin/reviews/{id}/hide`** and **`/restore`** — sprint-required; not in ADMIN_API (catalog archive pattern mirrored).
2. **`includeSpoilers` query** on list endpoints — required for “unless explicitly requested”.
3. **`spoilerWarning` / `spoilerRedacted`** response fields — enrichment; not on Review schema.
4. **Self-report forbid** — product rule (like self-like in 4.4).
5. Sprint sample reasons “Offensive Content / Duplicate” are **not** in OpenAPI enum or seed — followed OpenAPI + seed.
6. **Get Report Status** for reporters — not documented; admin list/patch covers status.
7. **Appealed** state — Freeze `Appeal` model only; no HTTP this sprint.
8. **`/admin/moderation/stats`** / **batch-scan** — not implemented (batch-scan = AI; out of scope).

---

## Known limitations

1. Hide uses the same `deletedAt` as author soft-delete — cannot distinguish “user deleted” vs “moderator hidden” without Freeze change.
2. WARN / SUSPEND / BAN do **not** mutate `User.isSuspended` / `isBanned` (sprint: no automatic bans).
3. Queue SLA / `aiScore` always null (no AI).
4. Non-REVIEW entity types can be listed/resolved on admin queue, but content side-effects only apply for `entityType=REVIEW`.

---

## Deliverables checklist

- [x] Report Review (+ queue enqueue)
- [x] Admin report list / update
- [x] Moderation queue list / detail / resolve
- [x] Hide / restore (OpenAPI gap)
- [x] Spoiler flag + list-safe previews + warning
- [x] Cache invalidation
- [x] Domain events
- [x] Unit + e2e tests
- [x] This report

---

## Gate

**Do not begin Sprint 4.6 until Sprint 4.5 has been reviewed.**
