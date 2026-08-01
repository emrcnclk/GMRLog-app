# GMRLOG Sprint 5.1 — Game Log Core Implementation Report

**Sprint:** 5.1 — Game Log Core  
**Date:** 2026-07-14  
**Status:** **COMPLETE — Awaiting review before Sprint 5.2**  
**Contracts:** `GAME_LOG_API.yaml` (SSOT) + Database Freeze (`GameLog`) + System Design  
**Schema:** unchanged (Freeze — no soft-delete column on `game_logs`)  
**Out of scope:** play sessions, progress endpoints, timeline, statistics, currently-playing

---

## Implemented endpoints

| Method | Path | Auth | Operation |
|--------|------|------|-----------|
| POST | `/api/v1/logs` | JWT | Create Game Log |
| GET | `/api/v1/logs/{logId}` | JWT | Get Game Log |
| PATCH | `/api/v1/logs/{logId}` | JWT | Update Game Log |
| DELETE | `/api/v1/logs/{logId}` | JWT | Delete Game Log (**hard** delete) |
| GET | `/api/v1/logs` | JWT | Get My Game Logs |
| GET | `/api/v1/logs/user/{userId}` | JWT | Get User Game Logs (public unless self) |
| GET | `/api/v1/logs/game/{gameId}` | JWT | Get my log for a game |
| GET | `/api/v1/games/{gameId}/logs` | Public | Get Game Logs for a Game (public only) |

---

## OpenAPI ↔ Freeze field mapping

| OpenAPI (`GAME_LOG_API`) | Prisma `GameLog` | Notes |
|--------------------------|------------------|-------|
| `status` | `status` (`GameLogStatus`) | Includes `REPLAYING` |
| `startedAt` | `startedAt` | |
| `finishedAt` | `finishedAt` | Sprint brief `completedAt` alias → API uses `finishedAt` |
| `hoursPlayed` | `hoursPlayed` | Sprint brief `playtimeMinutes` → API uses hours |
| `isPrivate` | `isPublic` (inverted) | Sprint brief `visibility` → boolean privacy |
| `completionPercentage` | `completion` | |
| `platform` (slug string) | `platformId` FK | Resolved by catalog slug/name |
| `rating` | `rating` (0–10) | |
| `notes` | `notes` | max 5000 |

**Soft delete:** not supported by Freeze (`Database Freeze Report`: GameLog correctly without soft delete). Delete is **hard** (`DELETE` → 204).

**One log per user per game:** `@@unique([userId, gameId])` → `409 GAME_LOG_ALREADY_EXISTS`.

---

## Repository strategy

```text
GameLogService  → GameLogRepository       (writes)
GameLogQueryService → GameLogQueryRepository (reads)
GameLogMapper   → mapGameLogRecord + GAME_LOG_DETAIL_INCLUDE
```

* Write/read split mirrors Review Module.
* Centralized `GAME_LOG_DETAIL_INCLUDE` avoids N+1 (game + user profile + platform slug).
* Cursor pagination: `(createdAt DESC, id DESC)` + `limit+1`.
* List filters ready for future stats (`userId+status`, `gameId+isPublic`).

---

## Validation strategy

| Rule | Behavior |
|------|----------|
| Status enum | OpenAPI / Freeze enum |
| Status transitions | `GAME_LOG_STATUS_TRANSITIONS` graph (same status always allowed) |
| Rating | 0–10 |
| `finishedAt >= startedAt` | When both present (create + merged update) |
| `hoursPlayed` | ≥ 0 |
| `isPrivate` | boolean |
| Ownership | Non-owner update/delete → `403` |
| Private read | Non-owner → `403` |
| Problems | `AppException` → `application/problem+json` |

---

## Cache strategy

| Key | TTL | Notes |
|-----|-----|-------|
| `gamelog:{id}` | 3600s | Public logs only |
| `userGameLogs:{userId}` | 600s | Public first page (`limit=20`, no status filter) |
| `gameLogs:{gameId}` | 600s | Public first page |

Invalidation on create / update / delete for all three keys.

---

## Event strategy

| Event | When |
|-------|------|
| `gamelog.created.v1` | Create |
| `gamelog.updated.v1` | Every successful update |
| `gamelog.status.changed.v1` | Update when `status` actually changes |
| `gamelog.deleted.v1` | Delete (`soft: false`) |

No consumers required in 5.1. Profile activity constant aligned to `gamelog.created.v1`.

---

## Architecture layout

```text
apps/api/src/game-logs/
├── game-logs.module.ts
├── game-logs.controller.ts
├── game-game-logs.controller.ts
├── game-log.service.ts
├── game-log-query.service.ts
├── game-log.repository.ts
├── game-log-query.repository.ts
├── game-log.mapper.ts
├── game-log-cache.service.ts
├── game-log.dto.ts / .entities.ts / .constants.ts / .exceptions.ts / .cursor.ts
└── *.spec.ts
```

Registered in `AppModule` as `GameLogsModule`.

---

## Test results

### Unit

| Suite | Result |
|-------|--------|
| `game-log.service.spec.ts` | 8 passed |
| `game-log-query.service.spec.ts` | 4 passed |
| **Total** | **12 passed** |

Coverage: create, update, delete, duplicate, invalid transition, invalid dates, authorization, status.changed event, private visibility, cursor pagination.

### E2E (`test/game-logs-core.e2e-spec.ts`)

| Result | **6 passed** |
|--------|--------------|
| Covers | create, duplicate 409, get/list surfaces, update + cache invalidation, invalid transition/dates, forbid other user, delete 204 |

---

## Known limitations

1. Play sessions / progress / timeline / stats / currently-playing → Sprint 5.2+.
2. No soft-delete revive (Freeze). Re-create after delete is a new row.
3. Status transition graph is product-defined in code (not yet a separate OpenAPI artifact).
4. `GET /logs/timeline` etc. will match `:logId` until those routes are added — register static routes first in later sprints.
5. Platform must exist in catalog when provided; unknown slug → 400.
6. Sprint brief aliases (`visibility` / `playtimeMinutes` / `completedAt`) deferred to OpenAPI names.

---

## Checklist

- [x] Core GAME_LOG_API log endpoints  
- [x] Repository read/write split + mapper  
- [x] Validation + ProblemDetails  
- [x] Cache keys + invalidation  
- [x] Domain events  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 5.2 until this report is reviewed and approved.**
