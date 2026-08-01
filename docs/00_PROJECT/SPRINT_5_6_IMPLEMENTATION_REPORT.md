# GMRLOG Sprint 5.6 — Achievements & Badge Integration Implementation Report

**Sprint:** 5.6 — Achievements & Badge Integration  
**Date:** 2026-07-15  
**Status:** **COMPLETE — Awaiting review before Sprint 5.7**  
**Contracts:** `BADGE_SYSTEM.md` + Database Freeze (`badges` / `user_badges`) + Game Log domain events  
**Migration:** none (existing tables reused)  
**Out of scope:** HTTP badge list endpoints, review/social/auth badge rules, XP award side-effects, Notification/Feed consumers

---

## Integration architecture

```text
GameLog / PlaySession / GameProgress services
        │  publish domain events (userId in payload)
        ▼
DomainEventPublisher
        │
        └── AchievementEventConsumer          (AchievementsModule)
                ▼
          AchievementIntegrationService
                ├── AchievementRuleEngine     (subset rules by event)
                ├── AchievementRepository     (metrics + idempotent tryAward)
                ├── AchievementCacheService   (userBadges:* only)
                └── publish achievement.unlocked.v1
```

* `GameLogsModule` does **not** import Achievements.  
* Achievements does **not** import GameLogs — **events only**.  
* Platform badges (`badges` / `user_badges`) ≠ game catalog trophies (`achievements` table).

---

## Event flow

### Consume (Game Log → unlock eval)

| Event | Rules evaluated (subset) |
|-------|--------------------------|
| `gamelog.created.v1` | Milestone log counts |
| `gamelog.updated.v1` | Milestone log counts + Completionist (if `status=COMPLETED`) |
| `gamelog.status.changed.v1` | Completionist (requires `COMPLETED`) |
| `playSession.ended.v1` | Milestone log counts |
| `game.progress.updated.v1` | Achievement Hunter |
| `game.progress.completed.v1` | Achievement Hunter + Completionist |

### Publish (unlock → downstream)

| Event | When | Purpose |
|-------|------|---------|
| `achievement.unlocked.v1` | Each new `user_badges` row | NotificationModule / FeedModule consume later — **no direct notify/feed calls** |

Payload includes: `userId`, `badgeId`, `badgeSlug`, `badgeName`, `userBadgeId`, `unlockedAt`, `sourceEventType`, `sourceAggregateId`.

---

## Unlock strategy (documented only)

Rules from `docs/01_PRODUCT/BADGE_SYSTEM.md` + seed catalog (`packages/database/prisma/seed/badges.ts`):

| Slug | Metric | Threshold |
|------|--------|-----------|
| `first-steps` | game logs | 1 |
| `getting-started` | game logs | 10 |
| `game-library` | game logs | 50 |
| `century-club` | game logs | 100 |
| `thousand-strong` | game logs | 1000 |
| `completionist` | COMPLETED logs | 25 |
| `achievement-hunter` | progress rows with `completionPct ≥ 100` | 10 |

**Intentionally omitted** (sprint examples not in product SSOT / not Game Log–wired):  
100 Hours Played, First Completed Game (as separate badge), First Review after Completion.

---

## Idempotency & concurrency

1. Prefetch owned slugs → skip already owned.  
2. `user_badges` `@@unique([userId, badgeId])` — concurrent inserts → one wins, other `P2002` → `tryAward` returns `null`.  
3. Only successful awards publish `achievement.unlocked.v1`.

---

## Cache strategy

| Key | Action on unlock |
|-----|------------------|
| `userBadges:{userId}` | Invalidate |
| `achievements:user:{userId}` | Invalidate |

Game Log / timeline / stats caches are **not** touched.

---

## Performance notes

* Evaluate **only rules whose `eventTypes` include the incoming event** (not full catalog).  
* Load **only required metrics** (`gameLogs` / `completedLogs` / `fullProgressGames`) via aggregate SQL + one count.  
* Batch: one metrics query + one owned-slugs query + badge catalog lookup per event; then award loop.

---

## Persistence

* Reused: `badges`, `user_badges`.  
* No new progress / unlock tables.  
* No Freeze migration required.

---

## Test results

| Suite | Result | Coverage |
|-------|--------|----------|
| `achievement-rule.engine.spec.ts` | PASS (5) | event subset, status gate, multi-unlock, owned skip, metric selection |
| `achievement-integration.service.spec.ts` | PASS (4) | first unlock + event, idempotent null award, multi unlock, missing userId |
| `achievement-event.consumer.spec.ts` | PASS (1) | session ended + progress completed wiring |
| `achievement-integration.integration.spec.ts` | PASS (1) | concurrent award → single row + cache invalidate + event |
| `achievements.e2e-spec.ts` | PASS (3) | first log unlock, duplicate prevention, actor isolation |

---

## Known limitations

1. Review / social / streak / platform badges not evaluated (other domain events).  
2. XP bonus on unlock (`BADGE_SYSTEM` diagram) not implemented.  
3. NotificationModule / FeedModule do not yet consume `achievement.unlocked.v1`.  
4. HTTP `GET /users/{id}/badges` still unimplemented (OpenAPI exists).  
5. Badge rarity/category columns not in Freeze schema — seed is slug/name/description only.

---

## Checklist

- [x] Event consumers for required Game Log events  
- [x] `AchievementIntegrationService` / `AchievementRuleEngine` / `AchievementEventConsumer`  
- [x] Documented rules only; seed-aligned slugs  
- [x] Idempotent unlock via unique constraint  
- [x] `achievement.unlocked.v1` (no direct Notification/Feed)  
- [x] Achievement-only cache invalidation  
- [x] Unit + integration + e2e  
- [x] This report  

**Do not begin Sprint 5.7 until this report is reviewed and approved.**
