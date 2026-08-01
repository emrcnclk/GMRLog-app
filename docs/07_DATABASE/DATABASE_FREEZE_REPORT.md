# GMRLOG OS — Database Freeze Report

**Version:** 1.1.0  
**Document:** `docs/07_DATABASE/DATABASE_FREEZE_REPORT.md`  
**Review Date:** 2026-07-14  
**Reviewer:** Database Architecture Review (Freeze v1.1 — Sprint 4.7)  
**Schema:** `packages/database/prisma/schema.prisma`  
**Migration:** `20260714223000_review_freeze_v1_1` (latest additive; prior: `20260710210000_init`, patches, `20260712220000_review_revisions`)

---

## Executive Summary

The Phase 2.1 Prisma schema is **architecturally sound**, domain-complete, and aligned with `DATABASE_SPECIFICATION.md` and OpenAPI entity definitions.

**Patch v2.1.1 (`20260710_database_freeze_patch`) resolved all blocking issues:**

1. ✅ `SavedSearch` model + `SearchEntityType` enum (SEARCH_API-aligned)
2. ✅ All 8 loose FK columns wired with explicit Prisma relations and DB constraints

**Validation:** `prisma format` ✅ · `prisma validate` ✅ · `pnpm build` ✅

Non-blocking recommendations (partial indexes, FTS, partitioning) remain scheduled for migration `2.2.0`.

---

## Schema Metrics (Post-Patch v2.1.1)

| Metric | Pre-Patch | Post-Patch |
|--------|----------:|-----------:|
| Prisma models | 139 | **140** |
| Prisma enums | 36 | **37** |
| Prisma `@relation` fields | 215 | **229** |
| Explicit `onDelete` rules | 189 | **200** |
| `@@index` declarations | 216 | **221** |
| `@@unique` declarations | 56 | **56** |
| Migration folders | 1 | **2** |
| Seed modules | 8 | 8 |
| PostgreSQL extensions | `pgcrypto`, `citext` | unchanged |
| Migration indexes (CREATE INDEX + UNIQUE) | **~314** |
| Seed modules | **8** |
| Domains covered | **16** |

---

## 1. Naming Review

### Verdict: **PASS** (minor notes)

| Area | Status | Notes |
|------|--------|-------|
| Model names | ✅ | PascalCase, domain-prefixed where needed (`GameLog`, `UserProfile`, `TierListTemplate`) |
| Field names | ✅ | camelCase in Prisma, snake_case via `@map` |
| Table names | ✅ | snake_case via `@@map` |
| FK columns | ✅ | Consistent `{entity}Id` pattern (`userId`, `gameId`, `collectionId`) |
| Relation names | ✅ | Disambiguated where needed (`UserBlocks` / `UserBlockedBy`, `GameDlcs` / `DlcParent`) |
| Enum names | ✅ | PascalCase types; SCREAMING_SNAKE values (OpenAPI-aligned) |

**Minor inconsistencies (accepted, documented):**

| Item | Detail | Resolution |
|------|--------|------------|
| `AdminRole` values | `User`, `Moderator`, `Admin` (PascalCase) vs `PlatformRole` SCREAMING_SNAKE | Matches ADMIN_API OpenAPI — **keep** |
| `CmsContentType` values | snake_case (`announcements`, `legal_pages`) | Matches ADMIN_API — **keep** |
| `ModerationQueueItem` → `moderation_queue` | Model name ≠ table name | Acceptable; table name matches DATABASE_SPEC |
| `GameGameMode` | Double "Game" prefix | Clear disambiguation from `GameMode` catalog — **keep** |

**No abbreviations found** in model or field names. No casing drift across domains.

---

## 2. Index Review

### Verdict: **PASS WITH RECOMMENDATIONS**

#### Strengths

- Every explicit Prisma relation field has a supporting index or composite unique that covers the FK column.
- Hot paths have composite indexes with correct column order (equality → sort):
  - `Review(gameId, publishedAt DESC)`
  - `Notification(userId, isRead, createdAt DESC)`
  - `FeedItem(userId, occurredAt DESC)`
  - `GameLog(gameId, createdAt DESC)` / `GameLog(userId, status)`
  - `ModerationQueueItem(status, priority, createdAt DESC)`

#### Redundant indexes (~15–20 instances)

Composite uniques already cover leading-column lookups. Safe to drop standalone indexes in a future cleanup migration:

| Table | Redundant index | Covered by |
|-------|-----------------|------------|
| `game_platforms` | `gameId` | `@@unique([gameId, platformId])` |
| `game_genres` | `gameId` | `@@unique([gameId, genreId])` |
| `game_tags` | `gameId`, `tagId` | unique composite |
| `collection_likes` | `collectionId` | `@@unique([collectionId, userId])` |
| `favorite_games` | `userId` | `@@unique([userId, gameId])` |
| `review_votes` | `reviewId` | `@@unique([reviewId, userId])` |
| Similar junction tables | FK-only index | composite unique prefix |

**Impact:** Write amplification on high-churn junction tables. Non-blocking; schedule cleanup in `2.2.0`.

#### Missing indexes (recommended)

| Table | Recommended index | Query |
|-------|-------------------|-------|
| `reviews` | `(game_id, like_count DESC) WHERE deleted_at IS NULL` | Popular reviews on game page |
| `reviews` | `(game_id, created_at DESC) WHERE deleted_at IS NULL` | Partial — replaces plain composite |
| `posts` | `(user_id, created_at DESC) WHERE deleted_at IS NULL` | Profile feed |
| `game_logs` | `(game_id, created_at DESC) WHERE is_public = true` | Public game activity |
| `feed_items` | `(user_id, visibility, occurred_at DESC)` | Visibility-filtered home feed |
| `games` | GIN `search_vector` | Full-text search (INDEXING_STRATEGY) |
| `games` | GIN `title gin_trgm_ops` | Autocomplete |
| `profiles` | GIN `username gin_trgm_ops` | User search |
| `collections` | `(visibility, created_at DESC) WHERE deleted_at IS NULL` | Discover collections |

#### Standalone `deletedAt` indexes

Present on `users`, `reviews`, `posts`, `comments`, `collections`, `lists`, `tier_lists`. Low selectivity alone — **prefer partial composites** over standalone `deleted_at` B-trees per INDEXING_STRATEGY.

#### Missing FK indexes (blocking subset)

See Section 5 — columns without relations lack DB-level FK indexes enforced by Prisma.

---

## 3. Query Performance Analysis

| Query pattern | Primary table(s) | Index support | Rating |
|---------------|------------------|---------------|--------|
| **Home feed** | `feed_items` | `(userId, occurredAt DESC)` | ⚠️ Good; add visibility composite |
| **User profile** | `profiles`, `game_logs`, `reviews`, `collections` | username unique; per-entity userId indexes | ✅ |
| **Game page** | `games`, `game_platforms`, `reviews`, `game_logs` | slug unique; gameId composites | ✅ |
| **Review list** | `reviews` | `(gameId, publishedAt)` | ⚠️ Add partial + popularity index |
| **Search** | `games`, `profiles`, `search_events` | title index only | ❌ FTS/trigram deferred (expected) |
| **Notifications inbox** | `notifications` | `(userId, isRead, createdAt)` | ✅ |
| **Followers / following** | `follows` | `(followingId, createdAt)`, `(followerId)` | ✅ |
| **Collections** | `collections`, `collection_games` | `(userId)`, `(collectionId, sortOrder)` | ✅ |
| **Game logs (user)** | `game_logs` | `(userId, status)` | ✅ |
| **Game logs (public/game)** | `game_logs` | `(gameId, createdAt)` | ⚠️ Add `isPublic` partial |
| **Timeline** | `game_log_timeline_entries` | `(userId, occurredAt DESC)` | ✅ |
| **Play sessions** | `play_sessions` | `(userId, startedAt DESC)` | ✅ |
| **Moderation queue** | `moderation_queue` | `(status, priority, createdAt)` | ✅ |
| **Conversation messages** | `messages` | `(conversationId, createdAt DESC)` | ✅ |
| **Polymorphic likes** | `likes` | `(entityType, entityId)` | ✅ |

**Denormalized counters** (`likeCount`, `commentCount`, `followerCount` on Review/Post/Collection/UserStatistics) correctly avoid hot-path `COUNT(*)` at scale. Repository layer must maintain via transactional increments.

---

## 4. Normalization Review

### Verdict: **PASS** (3NF where practical)

| Pattern | Assessment |
|---------|------------|
| User / Profile / Settings / Privacy | ✅ Properly decomposed 1:1 |
| Catalog vs junction | ✅ Platform, Genre, Tag normalized; M2M via explicit junctions |
| Polymorphic Like/Bookmark/Reaction | ✅ Acceptable; alternative (separate tables per type) rejected for maintainability |
| Comment on Review OR Post | ✅ Single table with nullable FKs; check constraint deferred to API |
| Denormalized statistics | ✅ Intentional (`UserStatistics`, `GameStatistics`, counter columns) |
| FeedItem activity cache | ✅ Denormalized fan-out; source tables remain normalized |
| GameCompany + DeveloperGame | ✅ Different concerns: IGDB sync vs developer portal ownership |

**Potential overlap (non-blocking):** `GameCompany(DEVELOPER)` and `DeveloperGame` may duplicate developer–game links. Accept if IGDB import populates `GameCompany` and portal uses `DeveloperGame`. Document ownership in repository layer.

**Friendship storage:** Single directed row `(userId, friendId)`. Listing all friends requires `(userId = $1 OR friendId = $1)`. Standard pattern; consider canonical ordering `(LEAST, GREATEST)` at application layer to prevent duplicate inverse rows.

**Missing lookup table:** `SavedSearch` should exist per OpenAPI — see blocking issues.

---

## 5. Cascade Rules Review

### Verdict: **PASS WITH POLICY NOTE**

| Parent | Child | Rule | Assessment |
|--------|-------|------|------------|
| `User` | Auth tokens, sessions | Cascade | ✅ |
| `User` | Reviews, posts, logs | Cascade | ⚠️ See policy note |
| `Game` | GameLog, Review, TierItem | **Restrict** | ✅ Protects user content |
| `Game` | Catalog junctions | Cascade | ✅ |
| `Review` | Votes, media, comments | Cascade | ✅ |
| `Conversation` | Messages, members | Cascade | ✅ |
| `Message` | Soft delete only | — | ✅ |
| `Collection` | Games, members | Cascade | ✅ |
| `ReportReason` | Reports | **Restrict** | ✅ |
| `Developer` | Company | **Restrict** | ✅ |

### Policy note: User deletion

`DATABASE_SPECIFICATION.md` specifies **anonymize content**, not hard delete. Current FK rules **cascade hard delete** all user content if `User` row is removed.

**Required application policy (non-schema change for v1):**

- Never hard-delete `User` rows in production.
- Soft-delete via `users.deleted_at` + anonymize PII fields in profile.
- Hard delete reserved for GDPR erasure jobs with explicit runbook.

Optional v2 migration: change content FKs from `Cascade` to `Restrict` + anonymization worker.

### Referential integrity gaps — **RESOLVED (v2.1.1)**

All previously loose FK columns now have explicit Prisma relations and DB constraints:

| Model | Column | Relation | onDelete |
|-------|--------|----------|----------|
| `NotificationQueue` | `userId` | → `User` | Cascade |
| `GameView` | `gameId`, `userId?` | → `Game`, `User?` | Cascade / SetNull |
| `ReviewView` | `reviewId`, `userId?` | → `Review`, `User?` | Cascade / SetNull |
| `PatchNote` | `gameId?` | → `Game?` | SetNull |
| `ModerationQueueItem` | `reportId?`, `assignedTo?` | → `Report?`, `User?` | SetNull |
| `FeatureFlagApproval` | `approverId` | → `User` | Restrict |
| `UserAdminRole` | `grantedBy?` | → `User?` | SetNull |

---

## 6. Soft Delete Review

### Verdict: **PASS**

| Model | `deletedAt` | Per DATABASE_SPEC |
|-------|:-----------:|:-----------------:|
| `User` | ✅ | ✅ |
| `Review` | ✅ | ✅ |
| `Post` | ✅ | ✅ |
| `Message` | ✅ | ✅ |
| `Comment` | ✅ | ✅ |
| `Collection` | ✅ | ✅ |
| `TierList` | ✅ | ✅ |
| `List` | ✅ | (extends spec — acceptable) |
| `CollectionComment` | ✅ | (extends spec) |
| `ListComment` | ✅ | (extends spec) |
| `TierComment` | ✅ | (extends spec) |

**Correctly without soft delete:** `GameLog`, `PlaySession`, `GameProgress`, auth tokens, junction tables, analytics events — immutable/historical records.

**Repository requirement (mandatory for backend):**

```typescript
// All soft-deletable repositories must default-filter:
where: { deletedAt: null }
```

Document in `@gmrlog/database` repository base or Prisma middleware extension.

---

## 7. Audit Fields Review

### Verdict: **PASS**

| Pattern | Coverage |
|---------|----------|
| `createdAt` | All 139 models except none missing entirely |
| `updatedAt` | All mutable entities; correctly omitted on append-only (LoginHistory, MessageRead, analytics events, junction inserts) |
| `deletedAt` | 11 content models — see Section 6 |
| `createdBy` / `updatedBy` | CMS (`authorId`, `editorId`), FeatureFlag (`createdById`), UserAdminRole (`grantedBy`) |

**Owner vs auditor:** User-generated content uses `userId` as owner (not `createdBy`) — consistent with OpenAPI schemas. No change needed.

**Minor gaps (non-blocking):**

- `UserStatistics` — only `updatedAt` (counter table; acceptable)
- `TypingStatus` — only `updatedAt` (ephemeral state; acceptable)
- `PostMedia`, `ReviewMedia` — no `updatedAt` (immutable after create; acceptable)

---

## 8. Future Scalability Review

### Verdict: **PASS** (partitioning deferred)

| Workload | Table | Scale target | Readiness |
|----------|-------|--------------|-----------|
| Users | `users`, `profiles` | Millions | ✅ UUID, indexed lookups |
| Reviews | `reviews` | Tens of millions | ✅ Partial indexes needed |
| Game logs | `game_logs`, `play_sessions` | Hundreds of millions | ⚠️ Partition candidate |
| Feed | `feed_items` | Billions | ⚠️ **Primary partition candidate** |
| Notifications | `notifications`, `notification_queue` | Billions | ⚠️ Partition candidate |
| Messages | `messages` | Billions | ⚠️ Partition candidate |
| Analytics | `analytics_events`, `game_views` | Billions | ⚠️ Partition + archive |

### Partition candidates (monthly, per DATABASE_SPEC)

1. **`feed_items`** — highest write volume; fan-out on every activity
2. **`notifications`** — inbox + TTL archival
3. **`messages`** — conversation history
4. **`game_logs`** / **`play_sessions`** — gameplay telemetry
5. **`analytics_events`** / **`game_views`** / **`search_events`**

### Archive candidates

- `login_history` (> 90 days → cold storage)
- `notification_queue` (processed rows)
- `audit_logs` (retain 90 days online, then archive)
- `ai_usage_logs` (billing aggregates → `daily_metrics`, then purge)

### Read-heavy optimizations (Phase 2.2+)

- Materialized views: trending games, popular reviews (refresh hourly)
- Redis cache: `GameStatistics`, `UserStatistics`, feed pages
- Read replicas for game page + search
- `pg_trgm` + `tsvector` indexes per INDEXING_STRATEGY

---

## 9. OpenAPI Mapping Review

### Verdict: **PASS WITH ONE BLOCKING GAP**

#### Fully mapped domains (✅)

AUTH, USER, GAME, GAME_LOG, REVIEW, COLLECTION, LIST, TIERLIST, NOTIFICATION, SOCIAL (feed/reaction), ADMIN (moderation/CMS/flags/audit), AI (`PromptTemplate`, usage via `AiUsageLog`)

#### Prisma ahead of OpenAPI (acceptable — DATABASE_SPEC authority)

These models exist for documented platform features not yet exposed in OpenAPI v1:

`Post`, `Message`, `Conversation`, `Developer*`, `Studio*`, `Report`, `Appeal`, `Hashtag`, `Like`, `Bookmark`, interaction tables (CollectionLike, TierVote, etc.), auth internals.

**Not orphan Prisma models** — they are spec-driven placeholders for upcoming API modules.

#### OpenAPI ahead of Prisma — **RESOLVED**

| OpenAPI entity | Status |
|----------------|--------|
| **`SavedSearch`** | ✅ Mapped to `SavedSearch` model (patch v2.1.1) |

#### OpenAPI entities intentionally without tables

`ProfileVisitor`, `ExportJob`, `AIModel`, `Edition`, `GameEngine`, `HowLongToBeat` — DTO/derived/external; correct to omit until spec promoted.

#### Enum alignment spot-check

| OpenAPI | Prisma | Match |
|---------|--------|-------|
| `GameLogStatus` (7) | `GameLogStatus` | ✅ |
| `NotificationType` (25) | `NotificationType` | ✅ |
| `Visibility` (3) | `Visibility` | ✅ |
| `ReviewMood` (10) | `ReviewMood` | ✅ |
| `ReactionType` (8) | `ReactionType` | ✅ |
| `ReportStatus` (4) | `ReportStatus` | ✅ |
| `FeedItemType` (22) | `FeedItemType` | ✅ |
| `PlatformRole` / `AdminRole` | Separate enums | ✅ (by design) |

---

## 10. Potential Bottlenecks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Feed fan-out write amplification | **High** | Async queue; partition `feed_items`; cache |
| Polymorphic Like/Reaction lookups | Medium | `(entityType, entityId)` index exists; monitor cross-entity hot spots |
| Friendship bidirectional query | Medium | Canonical pair ordering; optional `friend_pairs` view |
| Counter denormalization drift | Medium | Transactional updates; periodic reconciliation job |
| Missing partial indexes on soft-delete tables | Medium | Migration `2.2.0` |
| No FTS indexes | Medium (search SLA) | Migration `2.2.0` with `pg_trgm` |
| `NotificationQueue` without FK | **High** (integrity) | Patch migration `2.1.1` |
| User hard-delete cascade | Medium | Application soft-delete policy |
| `game_logs` table size | **High** at scale | Monthly partitioning by `created_at` |

---

## 11. Recommendations Summary

### Mandatory before backend implementation (Migration `2.1.1`) — **COMPLETED**

| # | Action | Status |
|---|--------|--------|
| 1 | Add `SavedSearch` model | ✅ Done |
| 2 | Wire FK relations (8 columns) | ✅ Done |
| 3 | Document user deletion policy | Docs (backend runbook, TBD) |

### Recommended before production traffic (Migration `2.2.0`)

| # | Action |
|---|--------|
| 4 | Partial indexes on soft-deleted content tables |
| 5 | FTS + trigram indexes per INDEXING_STRATEGY |
| 6 | Remove redundant junction-table indexes |
| 7 | `CREATE EXTENSION pg_trgm` in migration |
| 8 | Monthly partitioning for `feed_items`, `notifications`, `messages` |

### Backend implementation guidelines

| # | Guideline |
|---|-----------|
| 9 | Prisma middleware or repository base: default `deletedAt: null` |
| 10 | Never hard-delete `User` in production |
| 11 | Maintain denormalized counters in same transaction as source event |
| 12 | Canonical friendship pair ordering on insert |

---

## 12. Final Verdict

| Criterion | Status |
|-----------|--------|
| Naming consistency | ✅ Pass |
| Index coverage | ⚠️ Pass with recommendations |
| Query performance readiness | ⚠️ Pass (FTS deferred) |
| Normalization (3NF) | ✅ Pass |
| Cascade rules | ⚠️ Pass with application policy |
| Soft delete consistency | ✅ Pass |
| Audit fields | ✅ Pass |
| Scalability design | ✅ Pass (partitioning planned) |
| OpenAPI mapping | ✅ Pass |
| Referential integrity | ✅ Pass (v2.1.1) |

---

### Decision (Updated — Post Patch v2.1.1)

> ## Database Freeze v1.0 — **APPROVED** ✅
>
> All blocking issues resolved in migration `20260710_database_freeze_patch`:
>
> | Issue | Resolution |
> |-------|------------|
> | `SavedSearch` missing | `SavedSearch` model + `SearchEntityType` enum + `saved_searches` table |
> | 8 loose FK columns | Explicit `@relation` + `ALTER TABLE … ADD CONSTRAINT` FK wiring |
>
> **Validation:** `prisma format` ✅ · `prisma validate` ✅ · `pnpm build` ✅
>
> **Backend (NestJS) implementation may now begin.**

---

### Decision (Original — Superseded)

> ## Database Freeze v1.0 — **NOT YET APPROVED**
>
> The schema is **95% freeze-ready**. Architecture, domain coverage, naming, and scale design meet production standards.
>
> **Two patch items block unconditional approval:**
> 1. Add `SavedSearch` model (OpenAPI SSOT requirement)
> 2. Wire 7 loose FK columns to Prisma relations (referential integrity requirement)
>
> Upon completion of migration **`20260710211000_integrity_patch`** (~1 model + relation wiring, no domain restructuring):
>
> ## → **Database Freeze v1.0 Approved**
>
> Backend (NestJS) implementation may begin **in parallel** on non-Search domains (Auth, Games, Reviews, GameLogs) while the patch migration is prepared. **Search module** must wait for `SavedSearch`.

---

## Related Documents

- [DATABASE_SPECIFICATION.md](./DATABASE_SPECIFICATION.md)
- [PRISMA_SCHEMA.md](./PRISMA_SCHEMA.md)
- [INDEXING_STRATEGY.md](./INDEXING_STRATEGY.md)
- [DATABASE_MIGRATIONS.md](./DATABASE_MIGRATIONS.md)
- [packages/database/DATABASE_VALIDATION_REPORT.md](../packages/database/DATABASE_VALIDATION_REPORT.md)
- [packages/database/ER_DIAGRAM.md](../packages/database/ER_DIAGRAM.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial freeze review |
| 1.0.1 | 2026-07-10 | Patch v2.1.1 applied — **Database Freeze v1.0 Approved** |
| 1.0.2 | 2026-07-12 | **Freeze exception (Sprint 4.2):** additive `ReviewRevision` / `review_revisions` — migration `20260712220000_review_revisions`. No destructive changes. Full Review field closure (`language`, `playStatus`, `playTime`, pros/cons/tags) deferred to **Database Freeze v1.1** (target: before Sprint 4.7). |
| 1.1.0 | 2026-07-14 | **Database Freeze v1.1 (Sprint 4.7):** additive Review field closure — enum `ReviewPlayStatus`, columns `language`, `play_status`, `play_time`, `recommended`, `pros`, `cons`, `tags`, `completion_hours`, `completion_percent`, `platform`, `achievement_progress` on `reviews`; `extras_snapshot` on `review_revisions`; indexes `reviews_play_status_idx`, partial `reviews_game_id_created_at_alive_idx`. Migration `20260714223000_review_freeze_v1_1`. |
| 1.1.1 | 2026-07-15 | **Freeze additive (Sprint 5.2):** `game_logs.session_count`, `game_logs.last_played_at`; `play_sessions.is_paused`; partial unique indexes for one active session per user / per game log. Migration `20260715001000_play_sessions_sprint_5_2`. |
| 1.1.2 | 2026-07-15 | **Freeze additive (Sprint 5.3):** `game_progress.achievements_unlocked`, `game_progress.achievements_total` (OpenAPI alignment). Migration `20260715153000_game_progress_sprint_5_3`. |
| 1.1.3 | 2026-07-16 | **Freeze additive (Collections Patch / labeled Database Freeze v1.0.3):** `collections.slug` (nullable, unique, indexed); `collections.is_collaborative` (default false). Migration `20260716_collections_freeze_patch`. Backward compatible — existing rows keep `slug = NULL`, `is_collaborative = false`. No breaking changes. |
