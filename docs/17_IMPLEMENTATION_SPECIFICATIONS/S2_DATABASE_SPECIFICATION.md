# GMRLOG — Phase S2: Database Specification

**Document:** `docs/17_IMPLEMENTATION_SPECIFICATIONS/S2_DATABASE_SPECIFICATION.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** S2 (Database Specification — persistence implementation contract)  
**Last Updated:** July 2026  
**Owner:** Engineering Architecture Director  
**Classification:** Implementation Specification

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | Entire F1 |
| 4 | Entire F2 |
| 5 | Entire F3 |
| 6 | Entire F4 |
| 7 | Entire F5 (**LOCKED**) |
| 8 | Entire F6 (**LOCKED**) — especially [`F6_5_DATA_ARCHITECTURE.md`](../06_ENGINEERING/F6_5_DATA_ARCHITECTURE.md) |
| 9 | [`PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md`](./PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md) — Phase S charter |
| 10 | [`S1_API_SPECIFICATION.md`](./S1_API_SPECIFICATION.md) — API contract (DTOs project these entities) |
| 11 | [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) — subordinate projections |
| 12 | **This document** — persistence implementation contract for Version 1 |

Never contradict higher documents.

This document is **not** database architecture.

This document **is** the implementation contract for persistence.

**Every entity follows F5.1 ownership. Every entity has exactly one owner (F6.5 §3.1). Shared Destinations remain singular. No Version 2 entities.**

| Does | Does not |
|------|----------|
| Catalog aggregates · entities · Prisma models · relations · ownership · constraints · cascade · soft delete · audit/common fields · naming · enums · migration strategy · seed · index · search/cache/event mapping | SQL · Prisma schema code · migration code · CREATE TABLE · SQL indexes · optimization tutorials · implementation · Version 2 entities |

**Gate:** Stop after this specification. Do **not** continue to Sprint S3 in this deliverable.

---

## Scope

**In scope:** Persistence model for the MVP entities implied by F5.1 ownership and S1 resources.

**Out of scope:**

| Forbidden |
|-----------|
| SQL · DDL · `CREATE TABLE` · SQL index definitions |
| Prisma schema code · `model {}` blocks · migration files |
| Query optimization · tuning tutorials |
| Version 2 entities (Marketplace · Premium · Creator Economy · Publisher/Developer · Public API · Twitch · advanced AI engine) |
| Future F5.3 screens’ entities (Guides · Bookmarks destination · Article · Creator/Developer/Premium) |
| Rewriting F6.5 law or F5.1 ownership |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–3 | Mission · Relationship · Naming conventions |
| B | 4–6 | Common fields · Audit fields · Soft delete policy |
| C | 7–9 | Aggregate catalog · Entity catalog · Ownership matrix |
| D | 10–12 | Prisma model catalog · Relation catalog · Constraints |
| E | 13–14 | Cascade policy · Enum catalog |
| F | 15–18 | Index philosophy · Search projection · Cache mapping · Event emission mapping |
| G | 19–20 | Migration strategy · Seed philosophy |
| H | 21–22 | Anti-patterns · Audit checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Transform F5.1 ownership and F6.5 data architecture into a complete persistence specification that developers implement without re-deciding ownership, lifecycle, or projection boundaries.

| Prefer | Never |
|--------|-------|
| One owner per entity | Two aggregates writing one meaning |
| Rebuildable projections | Search/cache as source of truth |
| Honest soft delete · pending states | Silent hard deletes · fake success |
| Canonical identity everywhere | Competing identities in projections |

---

# 2. Relationship to Prior Law

| Prior law | S2 obligation |
|-----------|---------------|
| F5.1 | Entity ownership mirrors product ownership; Shared Destinations singular |
| F5.5 §20.1 | Only MVP entities persist |
| F6.5 §3.1 | Database authoritative · one owner · read≠write · events sync · canonical identity |
| F6.5 §4.1 | External (Steam/Discord) data subordinate — guest-origin, never redefining ownership |
| F6.5 §7.1 | Every durable entity owns exactly one canonical identifier |
| F6.5 §16–§18 | Soft delete · audit · versioning philosophy |
| S1 | DTOs are projections of these entities — field meaning must reconcile |

Existing `docs/07_DATABASE/*` materials are **inputs to reconcile**; on conflict, F5/F6 and this LOCKED-track S2 win.

---

# 3. Naming Conventions

| Element | Convention |
|---------|-----------|
| Model name (Prisma) | `PascalCase` singular (`GameLog`, `CommunityMember`) |
| Physical table mapping | `snake_case` plural via `@@map` (documented, not SQL here) |
| Field name (Prisma) | `camelCase` |
| Physical column mapping | `snake_case` via `@map` |
| Primary key | `id` · canonical identity · opaque (cuid/uuid class per stack) |
| Foreign key field | `{relation}Id` (`gameId`, `authorId`) |
| Enum name | `PascalCase` (`ReviewVisibility`) |
| Enum member | `SCREAMING_SNAKE` or product-closed lowercase — one policy globally |
| Join model | `{A}{B}` or meaning name (`CommunityMember`) |
| Timestamps | `createdAt` · `updatedAt` · `deletedAt` |
| Booleans | `is/has/can` prefix |

One canonical name per meaning (F6.5 · CODING_STANDARDS).

---

# PART B — COMMON STRUCTURE

---

# 4. Common Fields

Every durable entity includes:

| Field | Kind | Meaning |
|-------|------|---------|
| `id` | OpaqueId | Canonical identity (F6.5 §7.1) |
| `createdAt` | datetime | Insert time |
| `updatedAt` | datetime | Last mutation |

Ownership-bearing entities additionally carry their owning reference (`ownerId`/`authorId`/`userId`) per §9.

---

# 5. Audit Fields

| Field | Applies to | Meaning |
|-------|-----------|---------|
| `deletedAt` | Soft-deletable entities (§6) | Null = active |
| `createdBy` / `updatedBy` | Trust-sensitive & staff-affected entities | Actor canonical id (nullable for system) |
| `version` | Concurrency-sensitive entities (reviews · collections · tier lists · library entries) | Optimistic revision token |

Dedicated `AuditLog` entity (§8) records Trust-relevant actions (F6.5 §17). Audit is append-oriented; audit availability never gates product behaviour.

---

# 6. Soft Delete Policy

| Rule (F6.5 §16) |
|-----------------|
| Player-meaningful content uses **soft delete** (`deletedAt`) by default: posts · reviews · comments · collections · tier lists · communities · events · messages |
| Reference/lookup data (games · genres · platforms · achievements definitions) is not soft-deleted by players; lifecycle is catalog-managed |
| Join/state rows (memberships · participations · reactions · follows · library entries) prefer hard delete of the relationship row (relationship removal is honest), unless product requires history |
| Soft-deleted rows are excluded from normal reads and projections; references render tombstones or fail honestly |
| Hard delete is policy-gated (legal · staff · retention); projections purge as followers |

---

# PART C — OWNERSHIP MODEL

---

# 7. Aggregate Catalog

Aggregates are consistency boundaries under one owning domain (F6.5 §6).

| Aggregate root | Owning domain (F5.1) | Contains (child rows) |
|----------------|----------------------|-----------------------|
| User | Profile / Shared User | Profile fields · privacy · stats snapshot refs |
| AuthCredential/Session | Auth (gate) | Sessions · password credentials |
| ConnectedAccount | Settings (guest links) | Steam/Discord link state |
| Game | Shared Game (catalog) | Media refs · platform links · stats snapshot |
| LibraryEntry | Library | Player↔Game relationship + logs |
| Post | Shared Post | Media refs |
| Review | Shared Review | — |
| Comment | Host (Post/Review) | — |
| Collection | Shared Collection | Collection entries |
| TierList | Shared Tier | Tier slots |
| Community | Shared Community | Members · community feed refs · activity refs |
| Event | Shared Event | Participations |
| Achievement | Shared Achievement | Definition + per-user progress |
| Conversation | Messages | Messages · participants |
| Notification | Notifications | — |
| ActivityItem | Notifications/Home | — |
| ImportJob | Library task | Import items/resolutions |
| AccountLink (intent) | Task | — |
| Report | Task/Staff | — |
| Block | Profile/User | — |
| Follow | Profile/User | — |
| Reaction | Shared object | — |
| Upload | Media/task | — |
| ModerationCase | Staff | — |
| AdminActionRecord | Staff | — |
| AuditLog | Platform policy | — |

References across aggregates are by identity only (F6.5 §6).

---

# 8. Entity Catalog

MVP entities (owner in parentheses). No Version 2 entities.

| Entity | Owner | Purpose |
|--------|-------|---------|
| `User` | Profile/User | Player identity & profile |
| `Session` | Auth | Authenticated continuity |
| `AuthCredential` | Auth | Password/OAuth identity binding (no secrets specified here) |
| `ConnectedAccount` | Settings | Steam/Discord guest link state |
| `Genre` | Catalog | Reference taste facet |
| `Platform` | Catalog | Reference platform facet |
| `Franchise` | Catalog | Reference grouping |
| `Game` | Shared Game | Game catalog entity |
| `GameMedia` | Shared Game | Media reference rows |
| `GamePlatform` | Shared Game | Game↔Platform link |
| `LibraryEntry` | Library | Player↔Game relationship (status/source) |
| `GameLog` | Library | Play log events under a library entry |
| `Post` | Shared Post | Player post |
| `Review` | Shared Review | Game review |
| `Comment` | Host object | Comment on post/review |
| `Reaction` | Shared object | Reaction row |
| `Collection` | Shared Collection | Curated collection |
| `CollectionEntry` | Shared Collection | Ordered game entry |
| `TierList` | Shared Tier | Tier list |
| `TierSlot` | Shared Tier | Labeled slot |
| `TierSlotGame` | Shared Tier | Ordered game in slot |
| `Community` | Shared Community | Community room |
| `CommunityMember` | Shared Community | Membership state |
| `CommunityActivity` | Shared Community | Community-scoped activity ref |
| `Event` | Shared Event | Event (all MVP kinds) |
| `EventParticipation` | Shared Event | Participation state |
| `Achievement` | Shared Achievement | GMRLOG achievement definition |
| `AchievementProgress` | Shared Achievement | Per-user progress (GMRLOG only) |
| `Follow` | Profile/User | Follower relationship |
| `Block` | Profile/User | Block relationship |
| `Conversation` | Messages | DM/group conversation |
| `ConversationParticipant` | Messages | Participant row |
| `Message` | Messages | Message row |
| `Notification` | Notifications | Notification row |
| `ActivityItem` | Notifications/Home | Feed/activity source row |
| `FeedEntry` | Home (projection-backed) | Materialized feed membership (rebuildable) |
| `ImportJob` | Library task | Steam import job |
| `ImportItem` | Library task | Per-game import candidate/resolution |
| `AccountLink` | Task | OAuth link intent |
| `Report` | Task/Staff | Abuse report |
| `Upload` | Media/task | Upload grant/confirmation record |
| `UserSettings` | Settings | Preference bundle |
| `NotificationPreference` | Settings | Channel prefs |
| `ModerationCase` | Staff | Moderation workflow |
| `AdminActionRecord` | Staff | Admin action log |
| `AuditLog` | Platform | Trust-relevant audit |

`FeedEntry` is a materialized projection row: authoritative meaning lives in source aggregates; it must be rebuildable (F6.5 §10.1). Recommendation and search data are **not** authoritative entities (projections only — §16, §17).

---

# 9. Ownership Matrix

| Entity | Single owner | Written by | Read by (via contracts) |
|--------|--------------|-----------|--------------------------|
| User | Profile/User | Profile domain | Everywhere via UserPublic projection |
| Game | Shared Game | Catalog domain | All |
| LibraryEntry | Library | Library domain (player) | Player · Game view |
| Post/Review/Comment | Respective shared | Author via owning domain | Feed/Discover projections |
| Collection/TierList | Respective shared | Owner | Public per visibility |
| Community + children | Shared Community | Community domain | Discover/Home projections |
| Event + participation | Shared Event | Event domain | Discover/Home |
| Achievement + progress | Shared Achievement | Achievement domain | Profile index |
| ConnectedAccount | Settings | Settings domain | Self only |
| ImportJob/AccountLink | Task | Task domain (owner) | Owner only |
| Notification/Activity | Notifications | Notifications domain | Recipient |
| Conversation/Message | Messages | Messages domain | Participants |
| Staff entities | Staff | Staff domains | Staff only |

| Ownership law |
|---------------|
| Aggregation domains (Home feed · Discover) reference — never own — foreign entities |
| Guest-origin fields (`source = steam_import`) never overwrite player-authored meaning (F2.6 · F2.21) |
| Cross-owner writes require the owning domain’s service — no dual authoritative writes |

---

# PART D — MODELS · RELATIONS · CONSTRAINTS

---

# 10. Prisma Model Catalog

Each model listed with key fields (kinds, not code). Common fields (§4) implied. `deletedAt` present only where §6 marks soft-deletable.

## 10.1 Identity & settings

| Model | Key fields |
|-------|-----------|
| `User` | `handle` (unique) · `displayName` · `bio?` · `avatarKey?` · `bannerKey?` · `privacyId` |
| `Session` | `userId` · `expiresAt` · `revokedAt?` |
| `AuthCredential` | `userId` · `type` (enum) · provider ref (no secrets here) |
| `ConnectedAccount` | `userId` · `provider` (enum) · `status` (enum) · `linkedAt?` · `scopes[]` |
| `UserSettings` | `userId` (unique) · appearance/accessibility/locale fields |
| `NotificationPreference` | `userId` · `channel` (enum) · `category` (enum) · `enabled` |

## 10.2 Catalog & games

| Model | Key fields |
|-------|-----------|
| `Game` | `title` · `slug` (unique) · `coverKey?` · catalog metadata refs |
| `Genre` / `Platform` / `Franchise` | `name` · `slug` (unique) |
| `GameMedia` | `gameId` · `kind` (enum) · `storageKey` |
| `GamePlatform` | `gameId` · `platformId` |

## 10.3 Library

| Model | Key fields |
|-------|-----------|
| `LibraryEntry` | `userId` · `gameId` · `status` (enum) · `source` (enum) · `platformId?` · `note?` · `version` |
| `GameLog` | `libraryEntryId` · `kind` (enum) · `occurredAt` |

## 10.4 Content

| Model | Key fields |
|-------|-----------|
| `Post` | `authorId` · `gameId?` · `communityId?` · `body` · `visibility` (enum) · `deletedAt?` |
| `Review` | `authorId` · `gameId` · `rating` · `body?` · `containsSpoilers` · `visibility` (enum) · `version` · `deletedAt?` |
| `Comment` | `authorId` · `hostType` (enum) · `hostId` · `parentCommentId?` · `body` · `deletedAt?` |
| `Reaction` | `actorId` · `targetType` (enum) · `targetId` · `kind` (enum) |

## 10.5 Curation

| Model | Key fields |
|-------|-----------|
| `Collection` | `ownerId` · `title` · `description?` · `visibility` (enum) · `version` · `deletedAt?` |
| `CollectionEntry` | `collectionId` · `gameId` · `position` · `note?` |
| `TierList` | `ownerId` · `title` · `visibility` (enum) · `version` · `deletedAt?` |
| `TierSlot` | `tierListId` · `label` · `position` |
| `TierSlotGame` | `tierSlotId` · `gameId` · `position` |

## 10.6 Communities & events

| Model | Key fields |
|-------|-----------|
| `Community` | `name` · `slug` (unique) · `description?` · `avatarKey?` · `bannerKey?` · `deletedAt?` |
| `CommunityMember` | `communityId` · `userId` · `role` (enum) · `joinedAt` |
| `CommunityActivity` | `communityId` · `activityItemId` |
| `Event` | `title` · `kind` (enum) · `startsAt` · `endsAt?` · `gameId?` · `communityId?` · `deletedAt?` |
| `EventParticipation` | `eventId` · `userId` · `state` (enum) |

## 10.7 Achievements

| Model | Key fields |
|-------|-----------|
| `Achievement` | `key` (unique) · `title` · `description` · `criteriaRef` (opaque · not algorithm) |
| `AchievementProgress` | `achievementId` · `userId` · `current` · `target` · `state` (enum) · `awardedAt?` |

## 10.8 Social graph & messaging

| Model | Key fields |
|-------|-----------|
| `Follow` | `followerId` · `followeeId` |
| `Block` | `blockerId` · `blockedId` |
| `Conversation` | `kind` (enum) · `lastMessageAt?` |
| `ConversationParticipant` | `conversationId` · `userId` · `lastReadAt?` |
| `Message` | `conversationId` · `senderId` · `body` · `deletedAt?` |

## 10.9 Notifications & activity

| Model | Key fields |
|-------|-----------|
| `Notification` | `recipientId` · `kind` (enum) · `objectType` (enum) · `objectId` · `readAt?` |
| `ActivityItem` | `kind` (enum) · `actorId?` · `objectType` (enum) · `objectId` · `occurredAt` |
| `FeedEntry` | `userId` · `activityItemId` · `rank` · `insertedAt` (projection · rebuildable) |

## 10.10 Tasks & integration

| Model | Key fields |
|-------|-----------|
| `ImportJob` | `userId` · `provider` (enum) · `accountLinkId?` · `status` (enum) · `errorCode?` |
| `ImportItem` | `importJobId` · `externalRef` · `gameId?` · `resolution` (enum) |
| `AccountLink` | `userId` · `provider` (enum) · `purpose` (enum) · `status` (enum) |
| `Upload` | `ownerId` · `purpose` (enum) · `storageKey` · `status` (enum) |
| `Report` | `reporterId` · `targetType` (enum) · `targetId` · `reason` (enum) · `status` (enum) |

## 10.11 Staff & audit

| Model | Key fields |
|-------|-----------|
| `ModerationCase` | `reportId?` · `subjectType` (enum) · `subjectId` · `status` (enum) · `assignedTo?` |
| `AdminActionRecord` | `actorId` · `action` (enum) · `subjectType` · `subjectId` · `notes?` |
| `AuditLog` | `actorId?` · `action` · `entityType` · `entityId` · `at` |

---

# 11. Relation Catalog

| Relation | From → To | Cardinality |
|----------|-----------|-------------|
| User → Session | 1 → N | one user many sessions |
| User → ConnectedAccount | 1 → N (per provider unique) | |
| User → LibraryEntry | 1 → N | |
| LibraryEntry → GameLog | 1 → N | |
| Game ← LibraryEntry | 1 ← N | |
| User → Post/Review/Comment | 1 → N (author) | |
| Game → Review | 1 → N | |
| Post/Review → Comment | 1 → N (host) | |
| Collection → CollectionEntry → Game | 1→N→1 | |
| TierList → TierSlot → TierSlotGame → Game | 1→N→N→1 | |
| Community → CommunityMember ← User | N↔N via member | |
| Community → CommunityActivity → ActivityItem | 1→N→1 | |
| Event → EventParticipation ← User | N↔N via participation | |
| Achievement → AchievementProgress ← User | N↔N via progress | |
| User ↔ User (Follow / Block) | N↔N directed | |
| Conversation → ConversationParticipant ← User | N↔N | |
| Conversation → Message ← User(sender) | 1→N | |
| User → Notification | 1 → N (recipient) | |
| User → FeedEntry → ActivityItem | 1→N→1 | |
| User → ImportJob → ImportItem | 1→N→N | |
| ImportJob → AccountLink | N → 1 | |
| Report → ModerationCase | 1 → 0..1 | |

Uniqueness relations:

| Unique constraint | Fields |
|-------------------|--------|
| One library relationship per player/game | (`userId`,`gameId`) |
| One membership per player/community | (`communityId`,`userId`) |
| One participation per player/event | (`eventId`,`userId`) |
| One progress per player/achievement | (`achievementId`,`userId`) |
| One follow direction | (`followerId`,`followeeId`) |
| One block direction | (`blockerId`,`blockedId`) |
| One reaction per actor/target/kind | (`actorId`,`targetType`,`targetId`,`kind`) |
| One connected account per user/provider | (`userId`,`provider`) |
| Unique slugs | `Game.slug` · `Community.slug` · `User.handle` |

---

# 12. Constraints

| Constraint class | Rule |
|------------------|------|
| Required references | Owning FK non-null (e.g. `Review.authorId`, `Review.gameId`) |
| Optional references | Nullable where product allows (`Post.gameId?`) |
| Enum integrity | Values restricted to §14 catalog |
| Uniqueness | Per §11 |
| Immutability | `id`, `createdAt` never updated |
| Guest-origin honesty | `LibraryEntry.source` marks import; manual authorship protected |
| Range | `rating` within closed product bounds; `position` ≥ 0 |
| Referential validity | Cross-aggregate references validated by owning services + FK where same-store |

Database constraints are the last line of integrity — not the only line (F6.5 §20).

---

# PART E — CASCADE · ENUMS

---

# 13. Cascade Policy

| Parent delete | Policy |
|---------------|--------|
| User (account removal) | Policy-gated; player content soft-deleted or anonymized per privacy law — never silent hard purge without policy |
| Collection | Cascade delete `CollectionEntry` (structural children) |
| TierList | Cascade `TierSlot` → `TierSlotGame` |
| Community | Soft-delete community → memberships/activity become inaccessible; hard purge policy-gated |
| Event | Soft-delete → participations inaccessible |
| Conversation | Soft-delete messages with conversation per retention policy |
| LibraryEntry | Delete relationship cascades its `GameLog` rows |
| ImportJob | Cascade `ImportItem` |
| Post/Review | Soft-delete; comments become tombstoned per product law (not silently orphaned) |

| Cascade law |
|-------------|
| Structural children (entries · slots · items) cascade with their aggregate root |
| Cross-aggregate references never cascade-delete foreign aggregates |
| Projections (FeedEntry · search · cache) are cleaned by event-driven followers, not FK cascade of truth |

---

# 14. Enum Catalog

Closed sets; additive growth only via Amendment (F6.5 §18 · S1 alignment).

| Enum | Members |
|------|---------|
| `AuthCredentialType` | `password` · `oauth` |
| `ConnectedProvider` | `steam` · `discord` |
| `ConnectedAccountStatus` | `connected` · `disconnected` · `expired` |
| `LibraryStatus` | `owned` · `playing` · `completed` · `wishlist` · `backlog` · `hidden` |
| `LibrarySource` | `manual` · `steam_import` |
| `GameLogKind` | `status_change` · `session` · `note` |
| `GameMediaKind` | `screenshot` · `cover` · `banner` · `video` |
| `ContentVisibility` | `public` · `followers` · `private` |
| `CommentHostType` | `post` · `review` |
| `ReactionTargetType` | `post` · `review` · `comment` |
| `ReactionKind` | closed product reaction set |
| `CommunityRole` | `member` · `moderator` · `owner` |
| `EventKind` | `game` · `community` · `tournament` · `seasonal` |
| `EventParticipationState` | `interested` · `going` · `not_going` |
| `AchievementState` | `locked` · `in_progress` · `awarded` |
| `ConversationKind` | `direct` · `group` |
| `NotificationKind` | closed notification taxonomy |
| `ActivityKind` | closed F5.2 activity kinds incl. `community` · `event` · `achievement` · `library_import` |
| `ObjectType` | `game` · `post` · `review` · `comment` · `collection` · `tier_list` · `user` · `community` · `event` · `achievement` |
| `ImportJobStatus` | `pending` · `awaiting_provider` · `processing` · `needs_resolution` · `completed` · `cancelled` · `failed` |
| `ImportItemResolution` | `keep_manual` · `accept_import` · `skip` |
| `AccountLinkPurpose` | `login` · `connect` · `import` |
| `AccountLinkStatus` | `pending` · `awaiting_provider` · `completed` · `cancelled` · `failed` |
| `UploadPurpose` | `avatar` · `banner` · `post_media` · `message_media` · `community_banner` |
| `UploadStatus` | `granted` · `uploaded` · `confirmed` · `expired` |
| `ReportTargetType` | `user` · `post` · `review` · `comment` · `community` · `event` · `message` |
| `ReportReason` | closed moderation set |
| `ReportStatus` | `open` · `in_review` · `resolved` · `dismissed` |
| `ModerationStatus` | `open` · `assigned` · `actioned` · `closed` |
| `NotificationChannel` | `in_app` · `push` · `email` |

No enum encodes engagement/FOMO/streak meaning.

---

# PART F — PROJECTIONS & EVENTS

---

# 15. Index Philosophy

Philosophy only — no SQL indexes.

| Principle |
|-----------|
| Index to serve product journeys (F6.5 §21): profile · library · feed · game · search entry · notifications |
| Index owning foreign keys and unique constraints (§11) |
| Soft-delete-aware read paths assume `deletedAt IS NULL` filtering |
| Cursor pagination requires stable ordering keys (`createdAt` + `id` tiebreak) on listable entities |
| Indexes serve the authoritative store; heavy discovery/search load belongs to search projection (§16) |
| Concrete index definitions live in subordinate DB docs — never as SQL here |

---

# 16. Search Projection Mapping

Search (Meilisearch) is a **projection, never source of truth** (F6.5 §10). Rebuildable from authoritative entities.

| Search index | Source entity(ies) | Projected fields (meaning) |
|--------------|--------------------|-----------------------------|
| `games` | Game (+ Genre/Platform refs) | title · slug · genres · platforms |
| `users` | User | handle · displayName (public only) |
| `reviews` | Review (+ Game) | body excerpt · gameTitle |
| `posts` | Post | body excerpt |
| `collections` | Collection | title · description |
| `tier-lists` | TierList | title |
| `communities` | Community | name · description |
| `events` | Event | title · kind |

| Rule |
|------|
| Sensitive/private fields never projected (F6.7) |
| Index updates triggered by domain events (§18) |
| Loss of index → rebuild from source; no product truth lost |

Semantic Similarity Recommendation is an **assistive projection**, not a persisted authoritative entity — no generative memory store (F2.19).

---

# 17. Cache Mapping

Cache (Redis) is **disposable** (F6.5 §11). Cold start from authoritative store always legal.

| Cache purpose | Backed by | Rule |
|---------------|-----------|------|
| Session lookup | Session entity | Authoritative store wins on conflict |
| Hot feed slices | FeedEntry projection + sources | Rebuildable |
| Discover/trending slices | Aggregation over owned entities | Rebuildable |
| Rate-limit counters | Ephemeral | Not product truth |
| Realtime presence | Ephemeral | Not durable |

| Rule |
|------|
| No cache is a system of record |
| Cache keys/TTLs defined in ops/subordinate docs — not here |
| Immortal engagement caches banned |

---

# 18. Event Emission Mapping

Events synchronize projections (F6.5 §14). Emitted after authoritative commit. Names/payloads governed by F6.6 + `@gmrlog/websocket`/event adjuncts — not enumerated here.

| Authoritative change | Emits (meaning) | Consumers |
|----------------------|-----------------|-----------|
| Post/Review/Comment created | content.created | Feed projection · search index · notifications · realtime |
| Reaction added | reaction.changed | Counts projection · notifications |
| LibraryEntry upserted | library.changed | Feed (import/log activity) · game stats projection |
| ImportJob status change | import.progressed | Client via realtime · notification on completion |
| Community membership change | community.membership.changed | Community activity · notifications |
| Event participation change | event.participation.changed | Activity · notifications |
| AchievementProgress awarded | achievement.awarded | Feed activity · notification |
| Follow created | social.followed | Notification · suggestion projections |
| Message sent | message.created | Conversation realtime · notification |

| Rule |
|------|
| Handlers idempotent (F6.6 §16) keyed on canonical identity |
| Projection failure retries; authoritative truth already committed remains true |
| Analytics consumes events; never owns truth (F6.5 §14.1) |

---

# PART G — MIGRATION & SEED

---

# 19. Migration Strategy

Philosophy only — no migration code (F6.5 §19).

| Rule |
|------|
| Deliberate · reviewed · reversible where possible; no silent drift |
| Expand → migrate → contract preferred over big-bang rewrites |
| Additive enum growth (append members) — never silent narrowing |
| Backfills are observable jobs — not hidden deploy side effects |
| Projection rebuilds (search · feed) are first-class after structural change |
| Migrations never smuggle Version 2 entities under MVP |
| Migration tooling (Prisma Migrate) governance lives in subordinate DB docs; this spec defines what changes mean, not how scripts run |

---

# 20. Seed Philosophy

| Rule |
|------|
| Seed only reference/catalog data required for MVP to function: Genres · Platforms · Franchises · Achievement definitions · closed enum-backed lookups |
| Seeds never fabricate fake players, fake engagement, or manipulative content |
| Sensitive data never seeded with real secrets (F6.7) |
| Environment parity: same seed shape across environments; volume may differ (F6.9) |
| Seeds are idempotent and rebuildable |

---

# PART H — CLOSE

---

# 21. Anti-Patterns

| Banned |
|--------|
| SQL · Prisma schema code · migration code · CREATE TABLE · SQL indexes in this contract |
| Two owners for one entity · Shared Destination duplicated per tab |
| Search or cache as authoritative store |
| FeedEntry / recommendation / analytics treated as source of truth |
| Steam achievements persisted as GMRLOG `Achievement` truth |
| Discord social graph as core owned entities |
| Guest import overwriting player-authored library authorship |
| Version 2 / Future-screen entities |
| Silent hard delete of player content without policy |
| Enums encoding FOMO/streak/engagement meaning |
| Cross-aggregate FK cascades deleting foreign aggregates |
| Treating `docs/07_DATABASE` legacy specs as superior when they conflict with F5/F6/S2 |

---

# 22. Audit Checklist

- [ ] Every entity has exactly one owner mirroring F5.1  
- [ ] Shared Destinations singular · aggregates bounded  
- [ ] Common · audit fields · soft delete policy defined  
- [ ] Prisma model catalog · relations · constraints · uniqueness present (no code)  
- [ ] Cascade policy structural-only · no foreign aggregate cascade  
- [ ] Enum catalog closed · additive-only  
- [ ] Index · search projection · cache · event emission mappings present as philosophy  
- [ ] Search/cache disposable · rebuildable · database authoritative  
- [ ] Migration strategy · seed philosophy present without code  
- [ ] No Version 2 / Future entities  
- [ ] Reconciles with S1 DTOs · obeys F6.5  
- [ ] Gate: stop — do not continue to S3  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Phase S2 — Database Specification** delivered as **DRAFT**.

This document is the working persistence implementation contract for Version 1 under F1–F6 and the Phase S charter.

Stop.

Do **NOT** continue to Sprint S3 until S2 is explicitly advanced / **LOCKED** by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md`](./PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md) | Phase S charter |
| [`S1_API_SPECIFICATION.md`](./S1_API_SPECIFICATION.md) | DTOs projecting these entities |
| [`F6_5_DATA_ARCHITECTURE.md`](../06_ENGINEERING/F6_5_DATA_ARCHITECTURE.md) | Data law |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | Ownership |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | MVP scope boundary |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | PostgreSQL · Prisma · Redis · Meilisearch |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — S2 persistence contract: aggregates · entities · Prisma model catalog · relations · ownership matrix · constraints · cascade · soft delete · audit/common fields · enums · index/search/cache/event mappings · migration & seed philosophy; MVP-only · one owner per entity; no SQL/Prisma/migration code; gate before S3 |
