# GMRLOG Sprint 5.3 — Game Progress Tracking Implementation Report

**Sprint:** 5.3 — Game Progress Tracking  
**Date:** 2026-07-15  
**Status:** **COMPLETE — Awaiting review before Sprint 5.4**  
**Contracts:** `GAME_LOG_API.yaml` + Database Freeze (additive 5.3) + System Design  
**Migration:** `20260715153000_game_progress_sprint_5_3`  
**Out of scope:** timeline HTTP, statistics HTTP, Feed consumers for progress events

---

## Implemented endpoints

| Method | Path | Auth | Operation |
|--------|------|------|-----------|
| GET | `/api/v1/users/me/games/{gameId}/progress` | JWT | Get Progress |
| PATCH | `/api/v1/users/me/games/{gameId}/progress` | JWT | Update Progress |

Ownership is implicit via `/users/me` (JWT `sub`). Missing progress → `404`. Unpublished / unknown game → `404`.

---

## Progress architecture

```text
GameProgressController
        │
        ├── GET  → GameProgressQueryService
        │              ├── GameProgressCacheService
        │              └── GameProgressQueryRepository
        │
        └── PATCH → GameProgressService
                       ├── validate + regression checks
                       ├── transaction
                       │     ├── GameProgressRepository.ensureGameLog / upsert
                       │     └── GameLogAggregationService.applyProgressUpdated
                       ├── GameProgressCacheService.invalidate + set
                       └── DomainEventPublisher
```

| Layer | Responsibility |
|-------|----------------|
| `GameProgressRepository` | Write-side upsert, ensure GameLog, transactions |
| `GameProgressQueryRepository` | Read-side lookups |
| `GameProgressService` | Validation, regression rules, orchestration, events |
| `GameProgressQueryService` | Cached GET |
| `GameProgressMapper` | Prisma → OpenAPI `GameProgress` (+ optional GameLog sync fields) |
| `GameLogAggregationService` | Sync denormalized GameLog fields (no duplicated CRUD) |

**Fields:** `completionPercentage`, `currentChapter`, `achievementsUnlocked`, `achievementsTotal`, `lastPlayedAt`, `updatedAt`, optional `game` summary. Response also enriches `hoursPlayed` / `status` from GameLog (read-side sync visibility; hours remain owned by play sessions).

---

## Synchronization strategy

```text
Progress Update
        │
        ▼
GameProgressService (transaction)
        │
        ├── upsert GameProgress
        └── GameLogAggregationService.applyProgressUpdated
                    │
                    ├── game_logs.completion = completionPercentage
                    ├── game_logs.lastPlayedAt = touchedAt
                    ├── status → COMPLETED when 100% and transition allowed
                    └── finishedAt set when status becomes COMPLETED
```

* **hoursPlayed** is not recomputed here — Play Sessions → `applySessionEnded` remains the sole hours owner.
* Session end still upserts `GameProgress.lastPlayedAt` (Sprint 5.2); progress PATCH also refreshes `lastPlayedAt`.
* Controllers never write GameLog rows for progress sync.

---

## Cache strategy

| Key | Action on progress mutation |
|-----|-----------------------------|
| `progress:{userId}:{gameId}` | Delete then warm with fresh entity |
| `gameLogStats:user:{userId}` | Invalidate |
| `gamelog:{gameLogId}`, `userGameLogs:{userId}`, `gameLogs:{gameId}` | Via `GameLogCacheService.invalidateLog` |

---

## Event strategy

| Event | When |
|-------|------|
| `game.progress.updated.v1` | Every successful PATCH |
| `game.progress.completed.v1` | When GameLog status becomes `COMPLETED` (100% + allowed transition) |

No Feed consumers in 5.3 (event-only; Feed stays decoupled).

---

## Validation

* `completionPercentage` integer 0–100  
* `achievementsUnlocked` / `achievementsTotal` ≥ 0; unlocked ≤ total when both set  
* `currentChapter` max length 200  
* No decrease of `completionPercentage` or `achievementsUnlocked` (`PROGRESS_REGRESSION`)  
* Empty body → `VALIDATION_FAILED`  
* Errors return ProblemDetails  

---

## Database (Freeze additive)

| Change | Purpose |
|--------|---------|
| `game_progress.achievements_unlocked` | OpenAPI `achievementsUnlocked` |
| `game_progress.achievements_total` | OpenAPI `achievementsTotal` |

`current_chapter` already present from Freeze baseline.

---

## OpenAPI notes (5.3 alignment)

* `GameProgress.currentChapter` documented  
* `UpdateGameProgressRequest.achievementsTotal` documented  

---

## Test results

| Suite | Result | Coverage |
|-------|--------|----------|
| `game-progress.service.spec.ts` | PASS (4) | update+sync, completion event, regression, empty body |
| `game-log-aggregation.service.spec.ts` | PASS (2) | session end + progress → COMPLETED |
| `game-progress.e2e-spec.ts` | PASS (5) | 401, 404 missing, update+GameLog sync+cache, ownership, regression, 100% complete |

---

## Known limitations

1. Timeline / statistics HTTP → later sprints.  
2. Feed does not yet consume `game.progress.*` events.  
3. Completion at 100% only auto-sets `COMPLETED` when status transition matrix allows (e.g. not from `DROPPED` / `WISHLIST` directly).  
4. Response includes optional `hoursPlayed` / `status` enrichment beyond strict OpenAPI required props (additive, non-breaking).

---

## Checklist

- [x] GET / PATCH progress endpoints  
- [x] Repository + QueryRepository  
- [x] Service + QueryService + Mapper  
- [x] Sync via `GameLogAggregationService.applyProgressUpdated`  
- [x] Cache invalidation (progress, gamelog, statistics)  
- [x] Events `game.progress.updated.v1` / `completed.v1`  
- [x] Validation + ProblemDetails  
- [x] Unit + e2e  
- [x] This report  

**Do not begin Sprint 5.4 until this report is reviewed and approved.**
