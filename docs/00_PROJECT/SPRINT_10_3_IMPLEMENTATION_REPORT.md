# Sprint 10.3 — Gaming Notifications Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_10_3_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Gaming Notification **consumers only** (Freeze v1.0 / Event Matrix Sprint 10.3)  
**Freeze:** [`NOTIFICATION_PLATFORM_FREEZE_v1.md`](./NOTIFICATION_PLATFORM_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture → Event Matrix

---

## Executive Summary

Sprint 10.3 delivers **IN_APP** gaming (+ gaming-adjacent Collection / Tier List engagement) notification ingest by consuming **existing** domain events only. No new endpoints, Prisma models, migrations, event names, queues, workers, Push, Email, WebSocket, recommendation, or AI.

| Item | Result |
|------|--------|
| Wired NotificationTypes | **ACHIEVEMENT_UNLOCKED**, **GAME_COMPLETED**, **COLLECTION_FOLLOW**, **COLLECTION_LIKE**, **TIERLIST_COMMENT** |
| Upstream events | `achievement.unlocked.v1`, `gamelog.status.changed.v1`, `game.progress.completed.v1`, `collection.updated.v1`, `tierlist.comment.created.v1` |
| New tables / migrations | **0** |
| New REST endpoints | **0** |
| New event names | **0** |
| Push / Email / Realtime | **Not implemented** (forbidden) |
| Quality gates | **Pass** |

---

## Implemented consumers

| NotificationType | Upstream event | Recipient | Prefs gate |
|------------------|----------------|-----------|------------|
| `ACHIEVEMENT_UNLOCKED` | `achievement.unlocked.v1` | Unlocking user (**self OK**) | `achievements` + `desktop` |
| `GAME_COMPLETED` | `gamelog.status.changed.v1` when `status=COMPLETED` **and/or** `game.progress.completed.v1` | User (**self OK**) | `achievements` + `desktop` |
| `COLLECTION_FOLLOW` | `collection.updated.v1` `action=followed` | Collection owner | `collections` + `desktop` |
| `COLLECTION_LIKE` | `collection.updated.v1` `action=liked` | Collection owner | `collections` + `desktop` |
| `TIERLIST_COMMENT` | `tierlist.comment.created.v1` | Tier list owner | `tierLists` + `desktop` |

### Behaviour

| Rule | Implementation |
|------|----------------|
| Consume only | Extended `NotificationEventConsumer` + `NotificationIngestService` |
| No domain ownership | Prisma id lookups only (collection / tier list owner) |
| Self-suppress | Default skip; **allowSelf** for achievement / game completed |
| Block suppress | Engagement types (collection / tier list) blocked either way |
| Idempotency | Redis `notification:idempotency:{eventId}` |
| GAME_COMPLETED dedupe | Redis `notification:dedupe:GAME_COMPLETED:{userId}:{gameId}` (TTL 24h) — status + progress may both fire |
| Cache | Targeted `invalidateUnread(userId)` only |
| Downstream | Existing `notification.created.v1` after persist |
| Controllers | Unchanged |

Collection / Tier List engagement was deferred in 10.2; Event Matrix documents the runtime events under Social catalog. This sprint wires them because kickoff **Allowed sources** include Collection and Tier List and events already exist — without inventing new event names.

---

## Explicitly deferred (SSOT / gap protocol)

| Source (kickoff / matrix) | Why deferred |
|---------------------------|--------------|
| `BADGE_UNLOCKED` | Same `achievement.unlocked.v1` payload — map once as `ACHIEVEMENT_UNLOCKED` to avoid double inbox |
| `LEVEL_UP` | No gamification `level.up` (or equivalent) event emitted |
| `GAME_RELEASE` / `GAME_UPDATE` / `GAME_REMINDER` | Catalog/job events absent (matrix: optional → Phase 2) |
| `GAME_DISCOUNT` | Phase 2 / marketing |
| Wishlist-driven alerts | No wishlist release/reminder event |
| Friend Activity / `FRIEND_ONLINE` | Freeze: Realtime Future; presence out of Module 10 |
| `TIERLIST_LIKE` | `tierlist.voted.v1` is **vote**, not like — do not equate |
| `COLLECTION_COMMENT` | `CollectionComment` table exists; **no** versioned comment-created publish |
| `LIST_LIKE` / `LIST_COMMENT` | Outside this sprint’s allowed source list (events exist via `list.updated.v1` — future) |
| Push / Email / queue | **Sprint 10.4+** |

---

## Files changed

### Updated

| File | Change |
|------|--------|
| `notification.constants.ts` | Gaming source events, GAME_COMPLETED dedupe key/TTL, entity type alias |
| `notification-cache.service.ts` | `claimGameCompletedDedupe` |
| `notification.repository.ts` | `findCollectionOwnerId`, `findTierListOwnerId`; wider `entityType` |
| `notification-ingest.service.ts` | Gaming handlers + self-journey / prefs expansion |
| `notification-event.consumer.ts` | Subscribe gaming events |
| `notification-ingest.service.spec.ts` | Gaming unit cases |
| `notification-ingest.integration.spec.ts` | Gaming wiring |

### New

| File | Role |
|------|------|
| `test/notifications-gaming.e2e-spec.ts` | Game completed / achievement / collection like / tierlist comment → inbox |

### Explicitly not changed

- Prisma schema / migrations  
- OpenAPI paths  
- Push tokens / queue / workers / WebSocket  
- Domain event publishers in Game Log / Achievements / Collections / Tier Lists (consume only)

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint `src/notifications/**` + gaming e2e | ✅ |
| Unit + integration (`vitest src/notifications`) | ✅ **23/23** |
| E2E `test/notifications-gaming.e2e-spec.ts` | ✅ **3/3** |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Controllers thin | ✅ |
| Consume events only | ✅ |
| Never SoT for upstream domains | ✅ |
| Respect prefs | ✅ |
| Respect block / self / visibility gates | ✅ |
| Targeted Redis invalidation | ✅ |
| No global flush | ✅ |
| No Push/Email/WS/workers | ✅ |
| No new models / migrations / event names | ✅ |
| Freeze 10.3 gaming ingest scope | ✅ |

---

## Gate

Sprint **10.3 Gaming Notifications complete.**

Do **not** continue to Sprint 10.4.
