# GMRLOG Sprint 2.4 — User Statistics & Activity Implementation Report

**Sprint:** 2.4 — User Statistics & Activity  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting review before Sprint 2.5**  
**Contracts:**  
- Statistics: `docs/08_API/USER_API.yaml` → `GET /users/{userId}/stats`  
- Activity: `docs/08_API/SOCIAL_API.yaml` → `GET /users/{userId}/activity` (owner per `API_ARCHITECTURE.md`)  
**Schema:** unchanged (Database Freeze respected)

---

## Implemented Endpoints

| Method | Path | Auth | Contract | Purpose |
|--------|------|------|----------|---------|
| GET | `/api/v1/users/{userId}/stats` | Public (optional Bearer) | USER_API | User statistics |
| GET | `/api/v1/users/{userId}/activity` | Public (optional Bearer) | SOCIAL_API | Activity timeline (cursor) |
| GET | `/api/v1/users/{userId}/summary` | Public (optional Bearer) | **OpenAPI gap** | Profile summary composition |
| GET | `/api/v1/users/{username}` | Public (optional Bearer) | USER_API + composition | Nested `gamingIdentity` + `statistics` |

**Out of sprint:** recommendation algorithms, analytics dashboards, developer/studio admin.

---

## Implemented Services

```text
UsersController / ProfileStatisticsController / ActivityController (thin)
        │
        ▼
ProfileStatisticsService
        │
        ├──────────────────┐
        ▼                  ▼
StatisticsRepository  ActivityRepository
        │                  │
        └────────┬─────────┘
                 ▼
              Prisma
                 +
        ProfileCacheService (Redis)
```

| Component | Responsibility |
|-----------|----------------|
| `ProfileStatisticsService` | Orchestration only: stats, activity, summary, enrich public profile, cache invalidation |
| `StatisticsRepository` | Prisma aggregations + `user_statistics` counters |
| `ActivityRepository` | Parallel source-table activity reads |
| `ProfileCacheService` | `profile:*` / `profile:summary:*` / `profile:activity:*` |

**Not** inside `UserProfileService` or controllers: aggregation, merge, or cache writes.

`ActivityController` (SOCIAL_API path) is a thin adapter → `ProfileStatisticsService.getActivity`.

---

## Aggregation Strategy

### Statistics

Parallel `count` / `aggregate` queries on indexed columns:

| Sprint field | Derivation |
|--------------|------------|
| Total Reviews | `reviews` where `publishedAt IS NOT NULL` |
| Total Game Logs | `game_logs` count |
| Total Completed Games | `game_logs` `COMPLETED` ∪ `user_statistics.gamesCompleted` (max) |
| Total Collections | `collections` (not deleted) |
| Total Lists | `lists` (not deleted) — **OpenAPI gap field `lists`** |
| Total Tier Lists | `tier_lists` |
| Followers / Following | `user_statistics` counters (maintained by social graph) |
| Friends | `friendships` count |

Additional OpenAPI `UserStatistics` fields that are not analytics dashboards are returned as **0 / null** (streaks, DNA scores, profile views, etc.) unless cheaply derived (`joinedAt`, `accountAgeDays`, `backlogSize`, `wishlistSize`, year counts, `completionRate`).

### Activity

Live merge from source tables (newest first), **not** recommendation ranking:

| Activity | Source | Feed type |
|----------|--------|-----------|
| Review Published | `reviews.publishedAt` | `REVIEW_CREATED` |
| Review Updated | `reviews.updatedAt` > publish + 60s | `REVIEW_UPDATED` |
| Game Logged | `game_logs` | `GAME_LOG_CREATED` |
| Collection Created | `collections` | `COLLECTION_CREATED` |
| List Created | `lists` | `LIST_CREATED` |
| Tier List Created | `tier_lists` | `TIERLIST_CREATED` |
| Followed User | `follows` (as follower) | `FOLLOWED_USER` |

Only `PUBLIC` content is exposed. Cursor: `(createdAt, id)` base64url. `feed_items` table exists but is not required for reads under Freeze (no durable outbox consumers yet).

---

## Cache Strategy

| Key | TTL | Contents |
|-----|-----|----------|
| `profile:{userId}` | 120s | Reserved / profile blob |
| `profile:summary:{userId}` | 120s | Profile summary JSON |
| `profile:activity:{userId}:first` | 60s | Default first activity page (`limit=20`) |

**Invalidation** on:

- `user.profile.updated.v1`
- `social.follow.created.v1`
- All Sprint 2.3 gaming-identity change events
- Wired hooks ready for `review.review.created.v1`, `gamelog.log.created.v1`, `collection.collection.created.v1`, `list.list.created.v1`, `tierlist.tierlist.created.v1` (publish when those modules land)

---

## Event Usage

| Event | Producer (this sprint) | Consumer |
|-------|------------------------|----------|
| `social.follow.created.v1` | `SocialGraphService.follow` | Cache invalidation |
| `user.profile.updated.v1` | `UserProfileService.updateMe` | Cache invalidation |
| Gaming identity `*.changed.v1` | Sprint 2.3 | Cache invalidation |

No new event type families invented beyond naming already aligned with `EVENT_ARCHITECTURE.md`. No event consumers for Feed projections yet (document limitation).

---

## Privacy & Authorization

- `profileVisibility = PRIVATE` → stats / summary / activity return `404` for non-owners (ProblemDetails).
- Public profile by username still loads; nested stats omitted if aggregation fails privacy.
- Unauthenticated access allowed for public profiles.

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit `profile-statistics.service.spec.ts` | **5/5 passed** |
| Unit `activity.service.spec.ts` | **4/4 passed** |
| Unit social + profile (regression) | **passed** |
| E2E `statistics-activity.e2e-spec.ts` | **7/7 passed** |
| `pnpm typecheck` | **passed** |

### Coverage

- Statistics retrieval  
- Profile summary  
- Activity timeline + pagination  
- Cache invalidation on profile update  
- Authorization / privacy filtering  

---

## OpenAPI Gaps

| Gap | Handling |
|-----|----------|
| `GET /users/{userId}/summary` | Implemented for Search/Discovery/Feed preview; documented |
| Nested `statistics` on `UserPublicProfile` | Composition on `GET /users/{username}` |
| `lists` on `UserStatistics` | Returned; not in USER_API schema today |
| Activity path under SOCIAL_API (not USER_API) | Followed architecture SSOT |
| USER_API `Activity` enum vs SOCIAL `FeedItemType` | Mapped to SOCIAL types on activity endpoint |
| Analytics-heavy UserStatistics fields | Zeroed placeholders (no dashboards) |

---

## Known Limitations

1. Activity is aggregated live; `feed_items` not populated by a durable outbox worker yet.
2. First-page activity cache only for default `limit=20`.
3. Review/collection/list modules not implemented — activity for those types appears once data exists.
4. `lists` count is a sprint requirement beyond current OpenAPI property set.
5. No recommendation ranking or analytics dashboards.

---

## Deliverables Checklist

- [x] Statistics endpoint (USER_API)  
- [x] Activity timeline (SOCIAL_API) + cursor pagination  
- [x] Profile summary object  
- [x] Caching + invalidation  
- [x] Dedicated `ProfileStatisticsService` → `StatisticsRepository` + `ActivityRepository`  
- [x] Consume/publish existing domain events for invalidation  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 2.5 until this sprint has been reviewed and approved.**
