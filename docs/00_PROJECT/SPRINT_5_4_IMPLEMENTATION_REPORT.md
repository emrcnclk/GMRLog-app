# GMRLOG Sprint 5.4 — Play Timeline Implementation Report

**Sprint:** 5.4 — Play Timeline  
**Date:** 2026-07-15  
**Status:** **COMPLETE — Awaiting review before Sprint 5.5**  
**Contracts:** `GAME_LOG_API.yaml` + Database Freeze + System Design  
**Migration:** none (read-time derivation; Freeze `game_log_timeline_entries` reserved, unused)  
**Out of scope:** statistics HTTP, Feed consumers for `play.timeline.*`

---

## Implemented endpoints

| Method | Path | Auth | Operation |
|--------|------|------|-----------|
| GET | `/api/v1/logs/timeline` | JWT | Play Timeline (+ `status` / cursor / limit filters) |

Controller is registered **before** `GameLogsController` so `timeline` is not captured by `:logId`.

---

## Timeline architecture

```text
PlayTimelineController  GET /logs/timeline
        │
        ▼
PlayTimelineService
        │
        ├── PlayTimelineCacheService (default first page only)
        └── PlayTimelineRepository.listDerivedEvents (UNION)
                    │
                    ├── game_logs → LOG_CREATED / STATUS_CHANGED / COMPLETED
                    ├── play_sessions → SESSION_STARTED / SESSION_ENDED
                    └── game_progress → PROGRESS_UPDATED
        │
        └── findGamesByIds (batch) → PlayTimelineMapper
```

| Layer | Responsibility |
|-------|----------------|
| `PlayTimelineRepository` | Optimized UNION + status/cursor filters; batch game load |
| `PlayTimelineService` | Pagination, default-page cache, mapping orchestration |
| `PlayTimelineMapper` | Deterministic entry ids + metadata |
| `PlayTimelineEventConsumer` | Consume source domain events → invalidate + publish |
| `PlayTimelineCacheService` | `timeline:{userId}` |

Independent from `GameLogService` (query-only module slice).

---

## Query strategy

* **No duplicate storage** — timeline rows are derived at read time from existing entities.
* One SQL `UNION ALL` (no N+1 on source tables).
* Game summaries loaded once via `IN (...)`.
* Entry `id` = deterministic UUIDv5-style hash of `type:sourceId` (stable across regenerations).
* Ordering: `occurred_at DESC, sort_key DESC` (newest first).
* Cursor: `(occurredAt, sortKey)` base64url; exclusive page boundary.
* Filter `status`: related GameLog status.

| Type | Source |
|------|--------|
| `LOG_CREATED` | `game_logs.created_at` |
| `COMPLETED` | `game_logs` where `status = COMPLETED` (`finished_at` / `updated_at`) |
| `STATUS_CHANGED` | logs with `updated_at > created_at` and not `COMPLETED` (last-touch approximation; no status history table) |
| `SESSION_STARTED` | `play_sessions.started_at` |
| `SESSION_ENDED` | `play_sessions.ended_at` + `durationMin` metadata |
| `PROGRESS_UPDATED` | `game_progress.updated_at` (+ `completionPercentage`) |

`game_log_timeline_entries` remains unused — Freeze projection reserved for a future materialization if status-history fidelity is required.

---

## Cache strategy

| Key | Behavior |
|-----|----------|
| `timeline:{userId}` | Caches **default** first page (`limit=20`, no cursor/status) |

Invalidated by `PlayTimelineEventConsumer` when any of:

* `gamelog.created|updated|deleted|status.changed.v1`
* `playSession.started|ended|updated.v1`
* `game.progress.updated|completed.v1`

---

## Event strategy

| Direction | Event |
|-----------|--------|
| Consume | `gamelog.*`, `playSession.*`, `game.progress.*` (v1 set above) |
| Publish | `play.timeline.updated.v1` after invalidate (`payload.userId`, `sourceEventType`) |

No Feed wiring in 5.4.

---

## Validation / auth

* JWT required → `401`
* Invalid cursor → ProblemDetails `INVALID_CURSOR`
* Invalid `status` → ValidationPipe / ProblemDetails
* Scope = authenticated user only (`/logs/timeline` uses JWT `sub`)

---

## Test results

| Suite | Result | Coverage |
|-------|--------|----------|
| `play-timeline.service.spec.ts` | PASS (5) | generation, ordering helpers, cursor skip-cache, hasNext, status filter |
| `play-timeline-event.consumer.spec.ts` | PASS (2) | invalidate + `play.timeline.updated.v1` |
| `play-timeline.e2e-spec.ts` | PASS (4) | 401, generation, pagination, status filter, auth isolation, cache invalidate |

---

## Known limitations

1. `STATUS_CHANGED` is last-update approximation (no per-transition history without materializing Freeze table).  
2. `PROGRESS_UPDATED` reflects current progress row only (not every historical patch).  
3. Filtered / paginated responses are not cached (only default first page).  
4. Statistics HTTP → Sprint 5.5+.

---

## Checklist

- [x] GET `/logs/timeline` + filters  
- [x] Derived timeline types (OpenAPI enum)  
- [x] `PlayTimelineRepository` / `Service` / `Mapper`  
- [x] Newest-first cursor pagination  
- [x] Cache `timeline:{userId}` + event invalidation  
- [x] Consume source events; publish `play.timeline.updated.v1`  
- [x] Unit + e2e  
- [x] This report  

**Do not begin Sprint 5.5 until this report is reviewed and approved.**
