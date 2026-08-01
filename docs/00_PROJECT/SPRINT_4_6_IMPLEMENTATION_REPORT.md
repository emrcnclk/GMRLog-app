# GMRLOG Sprint 4.6 — Activity Feed Implementation Report

**Sprint:** 4.6 — Activity Feed  
**Date:** 2026-07-14  
**Status:** **COMPLETE — Awaiting review before Sprint 4.7**  
**Contracts:** `SOCIAL_API.yaml` (`GET /feed`, FeedItem / FeedPage) + OpenAPI gap for `GET /feed/users/{userId}`  
**Schema:** existing `feed_items` / `FeedItemType` (Database Freeze — no migration)  
**Out of scope:** recommendation algorithms, personalized ranking, notification delivery, discover/trending ranking endpoints

---

## Domain boundary

```text
Review Module ── domain events ──► Feed Module ──► Timeline API
 (ReviewService)                   (no ReviewService import)
```

Feed lives in `apps/api/src/feed/` — **not** under Reviews. Future Game Log / Collection / List / Achievement / Follow / Badge writers call `FeedAggregationService.ingestGeneric(...)`.

Legacy live-aggregate `GET /users/{userId}/activity` (ProfileStatisticsService) stays for older activity sources until those emit into `feed_items`.

---

## Implemented endpoints

| Method | Path | Auth | Source |
|--------|------|------|--------|
| GET | `/api/v1/feed` | JWT | SOCIAL_API `getHomeFeed` |
| GET | `/api/v1/feed/users/{userId}` | Optional JWT | **OpenAPI gap** (User Feed via `feed_items`) |

**Not exposed (incomplete / ranking):** `/feed/discover`, `/feed/trending`, `/feed/following` — architecture ready; no empty stubs.

---

## Feed architecture

```text
FeedController / FeedUserController
        │
        └─ FeedService
              ├─ FeedRepository              (inbox + user timeline reads)
              ├─ FeedCacheService
              ├─ SocialGraphService          (mute / block / followers)
              └─ PrivacyService              (showActivity / private profiles)

FeedEventConsumer (OnModuleInit)
        │
        └─ FeedAggregationService
              ├─ FeedAggregationRepository   (createMany fan-out, deleteByTarget)
              ├─ SocialGraphService.listFollowerIds
              ├─ FeedCacheService.invalidate
              └─ DomainEventPublisher → feed.item.created.v1
```

---

## Aggregation strategy

1. On relevant review events → resolve review meta **via Prisma** (not ReviewService).  
2. Write:
   - one row with `userId = actorId` (user timeline)
   - `createMany` fan-out to follower inboxes (`userId = followerId`)
3. Home feed = `WHERE userId = viewer` (inbox), newest `occurredAt` first.  
4. User feed = `WHERE userId = actorId AND actorId = targetUser` (own timeline).  
5. Review delete → `deleteMany` by `targetType=REVIEW, targetId` (not visible after soft-delete).

### Wired activity types (4.6)

| Activity | Source event | FeedItemType |
|----------|--------------|--------------|
| Review Created | `review.created.v1` | `REVIEW_CREATED` |
| Review Updated | `review.edited.v1` / `review.updated.v1` | `REVIEW_UPDATED` |
| Review Deleted | `review.deleted.v1` | feed rows removed |
| Review Reaction / Like | `review.reaction.created.v1` | `REVIEW_LIKED` |

### Prepared (ingest API only — no HTTP / no consumer yet)

`GAME_STARTED`, `GAME_COMPLETED`, `COLLECTION_CREATED`, `LIST_CREATED`, … via `FeedAggregationService.ingestGeneric`.

---

## Feed item shape

OpenAPI fields + sprint aliases:

| Sprint | Mapping |
|--------|---------|
| actor | `UserPublicProfile` |
| entity | `{ id, type }` from targetId/targetType |
| activityType | same as `type` |
| timestamp | `occurredAt` ISO (also as `createdAt`) |
| visibility | `PUBLIC` \| `FOLLOWERS` \| `PRIVATE` |
| metadata | `{}` bag (OpenAPI gap) |

---

## Cache strategy

| Key | TTL | Invalidate when |
|-----|-----|-----------------|
| `feed:home:{userId}` | ~120s | inbox owners touched by ingest / delete |
| `feed:user:{userId}` | ~180s | same |

First page (`limit=20`, no cursor) only.

---

## Event flow

```text
review.created.v1
review.edited.v1 / review.updated.v1
review.deleted.v1
review.reaction.created.v1   (likes now also emit this for feed)
        │
        ▼
FeedEventConsumer
        │
        ▼
FeedAggregationService → feed_items + feed.item.created.v1
```

Like path: small Reviews engagement change so `POST .../likes` publishes `review.reaction.created.v1` (feed consumer requirement).

---

## Visibility / safety

| Rule | Behavior |
|------|----------|
| Mute | Home excludes muted actors |
| Block (either way) | Home excludes; user feed empty if blocked |
| Private profile / `showActivity` | `PrivacyService.assertActivityVisible` on user feed |
| Item visibility | User feed filters PUBLIC / FOLLOWERS / PRIVATE by viewer relation |
| Auth | Home requires JWT |

---

## Test results

| Suite | Result |
|-------|--------|
| `feed-aggregation.service.spec.ts` | ✅ fan-out, skip deleted, clear on delete |
| `feed.service.spec.ts` | ✅ home mute, pagination, privacy, block |
| `feed.e2e-spec.ts` | ✅ create→home/user, mute, cache invalidate, auth, delete cleanup |

---

## OpenAPI gaps

1. **`GET /feed/users/{userId}`** — User Feed over `feed_items`; SOCIAL maps “activity” to `/users/{id}/activity` (legacy live aggregate retained).  
2. **`activityType` / `entity` / `timestamp` / `metadata`** — sprint fields; not on SOCIAL `FeedItem` schema.  
3. **Discover / trending / following** — documented paths not implemented (ranking / incomplete).  
4. **Game/Collection/List activities** — enum + ingest hooks only.

---

## Known limitations

1. Fan-out capped at 5_000 followers per write (alpha).  
2. Legacy `/users/:id/activity` still merges game log / collection / list live sources — not yet dual-written to `feed_items`.  
3. No outbox — in-process `DomainEventPublisher` only.  
4. Reaction updates/removals do not amend feed history (created-only materialization).

---

## Deliverables checklist

- [x] Separate Feed domain module  
- [x] Home + User feed (cursor, newest first)  
- [x] FeedRepository + FeedAggregationRepository  
- [x] FeedService + FeedAggregationService + FeedMapper  
- [x] Event consumers (review.*) without ReviewService dependency  
- [x] Cache + invalidation  
- [x] Mute / block / privacy  
- [x] Unit + e2e tests  
- [x] This report  

---

## Gate

**Do not begin Sprint 4.7 until Sprint 4.6 has been reviewed.**
