# GMRLOG Sprint 5.5 — Game Log Statistics Implementation Report

**Sprint:** 5.5 — Game Log Statistics  
**Date:** 2026-07-15  
**Status:** **COMPLETE — Awaiting review before Sprint 5.6**  
**Contracts:** `GAME_LOG_API.yaml` + Database Freeze + System Design  
**Migration:** none (derived read model)  
**Out of scope:** Feed consumers for `statistics.updated.v1`; undocumented metrics not in OpenAPI

---

## Implemented endpoints

| Method | Path | Auth | Operation |
|--------|------|------|-----------|
| GET | `/api/v1/logs/stats` | JWT | Authenticated user statistics (all logs) |
| GET | `/api/v1/users/{userId}/game-log-statistics` | Public | Public profile statistics (`is_public = true` only); `404` if user missing |

`GET /logs/stats` is registered on `GameStatisticsController` **before** `:logId` routes.

---

## OpenAPI field scope

Response follows **`GameLogStatistics` exactly**:

| Field | Source |
|-------|--------|
| `userId` | Request target |
| `totalGamesLogged` | `COUNT(*)` on `game_logs` |
| `totalHoursPlayed` | `SUM(hours_played)` — denormalized by `GameLogAggregationService` on session end |
| `completedCount` / `playingCount` / `backlogCount` / `droppedCount` | `COUNT(*) FILTER (status = …)` |
| `platformBreakdown[]` | `SUM(hours_played)` grouped by `platforms.slug` |

Sprint bullet items **not** in OpenAPI (`wishlist`, `averageRating`, `completionRate`, `favoriteGenres`) were **not** added — “use only documented fields” + OpenAPI SSOT.

---

## Architecture

```text
GameStatisticsController / UserGameStatisticsController
        │
        ▼
GameStatisticsService          (independent of GameLogService)
        │
        ├── GameStatisticsCacheService
        ├── GameStatisticsRepository   (aggregate SQL)
        ├── GameLogAggregationService.normalizeTotalHours
        └── GameStatisticsMapper
```

| Layer | Responsibility |
|-------|----------------|
| `GameStatisticsRepository` | Aggregate SQL; user existence |
| `GameStatisticsService` | Cache orchestration, public vs full scope |
| `GameStatisticsMapper` | SQL rows → OpenAPI entity |
| `GameStatisticsEventConsumer` | Source events → invalidate + publish |

---

## Aggregation strategy

1. **Write path (existing):** session end → `GameLogAggregationService.applySessionEnded` increments `game_logs.hours_played`.  
2. **Read path (5.5):** statistics **SUM** that denormalized column — no re-sum of session durations, no duplicated hour math.  
3. Shared helper: `GameLogAggregationService.normalizeTotalHours` for consistent 2-decimal rounding.

---

## Query strategy

* Two aggregate queries (`Promise.all`), no entity hydration, no N+1.  
* Status counts via PostgreSQL `FILTER`.  
* Platform breakdown: `INNER JOIN platforms` (logs without platform omitted).  
* Public endpoint adds `is_public = true`.

---

## Cache strategy

| Key | Scope |
|-----|--------|
| `stats:{userId}` | Owner full stats (`/logs/stats`) |
| `stats:{userId}:public` | Public projection |

Invalidated by:

* `GameStatisticsEventConsumer` on `gamelog.*` / `playSession.*` / `game.progress.*`  
* Direct deletes from play-session / progress cache services (same keys)  

Alias: former `gameLogStats:user:{userId}` now maps to `stats:{userId}` for Sprint 5.2 call sites.

---

## Event strategy

| Direction | Event |
|-----------|--------|
| Consume | `gamelog.created|updated|deleted|status.changed.v1`, `playSession.started|ended|updated.v1`, `game.progress.updated|completed.v1` |
| Publish | `statistics.updated.v1` (`payload.userId`, `sourceEventType`) |

---

## Test results

| Suite | Result | Coverage |
|-------|--------|----------|
| `game-statistics.service.spec.ts` | PASS (4) | aggregate+cache, hit cache, public scope, 404 user |
| `game-statistics-event.consumer.spec.ts` | PASS (1) | invalidate + `statistics.updated.v1` |
| `game-log-statistics.e2e-spec.ts` | PASS (3) | 401, generation after log/session, public endpoint, cache invalidate, 404 |

---

## Known limitations

1. Wishlist / average rating / completion rate / favorite genres require OpenAPI extension before HTTP exposure.  
2. Platform hours use GameLog platform (not per-session platform split when they differ).  
3. Feed does not consume `statistics.updated.v1`.

---

## Checklist

- [x] `/logs/stats` + `/users/{userId}/game-log-statistics`  
- [x] `GameStatisticsRepository` / `Service` / `Mapper`  
- [x] Aggregation via denormalized hours + `GameLogAggregationService`  
- [x] Cache `stats:{userId}` (+ public suffix)  
- [x] Event consume + `statistics.updated.v1`  
- [x] Aggregate SQL, no N+1  
- [x] Unit + e2e  
- [x] This report  

**Do not begin Sprint 5.6 until this report is reviewed and approved.**
