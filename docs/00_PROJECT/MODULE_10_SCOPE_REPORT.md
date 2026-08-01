# Module 10 — Notifications Platform Scope Report

**Document:** `docs/00_PROJECT/MODULE_10_SCOPE_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Type:** Architecture foundation only — **no code, no migrations, no Prisma edits, no OpenAPI edits, no endpoint implementation**  
**Product roadmap ref:** `docs/01_PRODUCT/ROADMAP.md` (Phase 1 includes Notifications; no separate `PROJECT_ROADMAP.md` in repo)

**SSOT precedence applied:**

1. `NORTH_STAR.md`  
2. Database Freeze / existing Prisma Notification domain  
3. `docs/08_API/NOTIFICATION_API.yaml`  
4. `docs/06_BACKEND/EVENT_ARCHITECTURE.md` + Communication Event Matrix (consumer side)  
5. Existing module implementation patterns (Feed / Achievements event consumers)

---

## Executive Summary

Notifications already have a **frozen database surface** and a **full OpenAPI contract**, but almost no **production notification platform**. What exists today is:

1. A thin **preferences** HTTP slice (coarse booleans + Redis).  
2. An Auth-owned **security SYSTEM notifier** that writes `Notification` rows + email **outside** a proper Notifications BC.  
3. **No inbox API**, **no event consumer**, **no queue worker**, **no push token lifecycle**, **no architecture / event / cache / permission matrices** for Module 10.

Upstream modules (Social, Reviews, Collections, Lists, Tier Lists, Achievements, Communication, Game Logs) **publish** domain events; Notifications **does not consume** them.

**Verdict path:** Document & freeze architecture → implement inbox core → wire social then gaming event ingest → harden delivery/preferences → audit. Prefer **no new tables** for MVP; reuse Freeze models. Prefer **no new `NotificationType` enum values** in MVP unless Communication messaging types are explicitly Freeze-amended later.

---

## Goals

### Primary

Build GMRLOG’s **Notifications bounded context**: the Activity Center that turns gaming-culture domain events into timely, preference-aware, privacy-respecting alerts — without becoming Discord/Steam spam.

### Success criteria (Module 10 complete)

| Criterion | Measure |
|-----------|---------|
| In-app Activity Center | OpenAPI inbox ops implemented (list / unread / read / archive / delete / badge) |
| Event-driven creation | Domain events → Notification rows via consumer (no sync calls from Social/Review write paths) |
| Preference respect | Channel + category gates before create / enqueue |
| Delivery foundation | Queue + at least IN_APP reliable; PUSH/EMAIL worker path defined |
| BC independence | Other modules publish only; Auth security path migrated or formally delegated |
| North Star | Gaming-meaningful types prioritized; marketing off by default; no Discord clone (presence spam deferred) |
| Latency target | In-app create visible under 2s after source commit (`PROJECT_SCOPE.md`) |

---

## 1. Current implementation status (codebase inspection)

### 1.1 What already exists

| Layer | Artifact | Status |
|-------|----------|--------|
| **DB models** | `Notification`, `NotificationPreference`, `PushToken`, `NotificationQueue` | **Present** (Database Freeze) |
| **Enums** | `NotificationType` (25), `NotificationChannel` (IN_APP/PUSH/EMAIL), `NotificationQueueStatus` | **Present** |
| **OpenAPI** | `docs/08_API/NOTIFICATION_API.yaml` | **Contract complete** (inbox + prefs + push tokens + test) |
| **Nest module** | `apps/api/src/notifications/` | **Partial** — preferences only |
| **Preferences API** | `GET/PATCH /notifications/preferences` | **Implemented** (production-usable for coarse prefs) |
| **Security in-app + email** | `SecurityNotificationService` (Auth) | **Partial production** — writes `type=SYSTEM` + `MailService` |
| **Seed catalog** | `packages/database/prisma/seed/notification-types.ts` | Reference catalog + optional pref seed helper |
| **UserSettings flags** | `emailNotifications`, `pushNotifications` | Used by preference repository |
| **Event bus** | `DomainEventPublisher` (in-process handlers) | Global; Feed/Achievements subscribe; **Notifications does not** |
| **Indexes** | `(userId, isRead, createdAt DESC)` etc. | Freeze-rated OK for inbox |

### 1.2 Endpoints — OpenAPI vs runtime

| operationId | OpenAPI | Runtime |
|-------------|---------|---------|
| `getNotifications` | Yes | No |
| `unreadNotifications` | Yes | No |
| `getUnreadNotificationCount` | Yes | No |
| `markAllNotificationsRead` | Yes | No |
| `getNotification` | Yes | No |
| `markNotificationRead` | Yes | No |
| `archiveNotification` | Yes | No |
| `archivedNotifications` | Yes | No |
| `deleteNotification` | Yes | No |
| `notificationPreferences` | Yes | Yes |
| `updateNotificationPreferences` | Yes | Yes |
| `getPushTokens` / `registerPushToken` / `deletePushToken` | Yes | No |
| `sendTestNotification` | Yes | No |

### 1.3 Which parts are placeholders vs production-ready

| Component | Classification | Notes |
|-----------|----------------|-------|
| Prisma Notification domain | **Production-ready schema** | Do not invent parallel tables |
| `NOTIFICATION_API.yaml` | **Production-ready contract** (docs) | Unlock/implement per sprint; no edits in this report phase |
| Preference GET/PATCH | **MVP-usable stub** | Coarse OpenAPI booleans; Redis SoT + partial `NotificationPreference` sync |
| `NotificationPreference` matrix rows | **Placeholder for workers** | Only a subset of types synced from category flags |
| `NotificationQueue` | **Schema placeholder** | No worker, no enqueue path |
| `PushToken` | **Schema placeholder** | No API, no FCM/APNs/Expo integration |
| Inbox CRUD | **Missing** | Tables unused except Auth SYSTEM writes |
| Notification event consumer | **Missing** | Unlike `FeedEventConsumer` / `AchievementEventConsumer` |
| BullMQ / outbox | **Documented, not wired for notifications** | `EVENT_ARCHITECTURE.md` describes outbox + BullMQ; runtime is in-process publish |
| Architecture docs for Module 10 | **Missing** | No `NOTIFICATION_ARCHITECTURE.md`, event matrix, cache, permission, visibility |

### 1.4 Events already published (upstream) — Notification not consuming

Representative publishers (non-exhaustive; names as implemented in constants):

| Domain | Example event types (code) | Expected Notification types (enum) |
|--------|----------------------------|-------------------------------------|
| Social | `social.follow.created.v1` | `FOLLOW` / `FOLLOW_REQUEST` |
| Reviews | `review.created.v1`, reaction/comment events | `REVIEW_*` |
| Collections / Lists / Tier lists | `collection.*`, `list.*`, `tierlist.*` | `COLLECTION_*`, `LIST_*`, `TIERLIST_*` |
| Achievements | `achievement.unlocked.v1` | `ACHIEVEMENT_UNLOCKED`, `BADGE_UNLOCKED`, `LEVEL_UP` |
| Game logs / progress | `gamelog.*`, `game.progress.*`, `playSession.*` | `GAME_COMPLETED` (and related) |
| Communication | `message.created.v1`, mentions, invites | **No matching `NotificationType` today** |
| Notifications prefs | `notification.preferences.updated.v1` | Self-meta only |
| Auth security | *(direct write, not domain event)* | `SYSTEM` |

**Naming debt:** `EVENT_ARCHITECTURE.md` / profile constants sometimes use `review.review.created.v1` while Review module emits `review.created.v1`. Module 10 Event Matrix must lock **actual runtime event strings**, not aspirational catalog alone.

### 1.5 Auth dual-path (important)

`SecurityNotificationService` persists `Notification` and sends email **inside Auth**. That works for security urgency but:

- Bypasses preference matrix / queue / idempotency patterns Module 10 will own.  
- Couples Auth to Notification persistence.  
- Module 10 must either **absorb** this path (Auth publishes `auth.security.*.v1` → Notification consumer) or document Auth as a **temporary privileged writer** until 10.4.

---

## 2. Missing architecture (to create in Sprint 10.0)

| Artifact | Status | Required content |
|----------|--------|------------------|
| `NOTIFICATION_ARCHITECTURE.md` | Missing | BC boundaries, aggregates, create/read paths, “publish-only upstream”, queue ownership |
| ADR Notifications | Missing | In-app vs push vs email; preference model; idempotency; Auth migration |
| `NOTIFICATION_EVENT_MATRIX.md` | Missing | Source event → NotificationType → channels → ACL/privacy |
| `NOTIFICATION_CACHE_STRATEGY.md` | Missing | Unread badge keys, inbox page cache (or none), invalidation rules — **no global flush** |
| `NOTIFICATION_PERMISSION_MATRIX.md` | Missing | Recipient-only reads; no cross-user inbox; admin/system rules |
| `NOTIFICATION_VISIBILITY_MATRIX.md` | Missing | Block/mute/privacy → suppress create; Communication mute; deleted actors |
| Preference Freeze note | Missing | OpenAPI coarse booleans vs `NotificationPreference` (type×channel) reconciliation |

**Must NOT own (same rule as Communication):** Social graph, Review bodies, Feed materialization, Search, Moderation UI. Notifications **hydrates** titles/bodies from ids with ACL-safe queries or stores denormalized snapshot fields already on `Notification` (`title`, `body`, `actionUrl`, `entityType`, `entityId`).

---

## 3. Missing API

OpenAPI already defines the surface. **Missing is implementation**, not invention.

**MVP implement set (recommended):**

- Inbox: list, unread, unread count, get one, mark one/all read, archive, list archived, delete  
- Preferences: already live — harden against Event Matrix  
- Push tokens: register / list / delete (even if send is stubbed)  
- `sendTestNotification`: **dev/staging only** or admin-gated — document in 10.0

**Do not add** undeclared endpoints (no WebSocket notification stream in Module 10 MVP — that belongs with Realtime / Sprint 9.5 adjacency).

---

## 4. Missing DB

| Concern | Assessment |
|---------|------------|
| Core tables | **Present** — no MVP migration required for inbox |
| New tables | **Forbidden for MVP** unless Freeze amendment |
| `NotificationType` gaps | No `MESSAGE_*` / invite types — Communication DM/group alerts **cannot** map cleanly without enum amendment |
| Outbox / `event_inbox` | Documented in Event Architecture; **not** in Notification Freeze tables — Module 10 should prefer **idempotency keys in Redis/queue** first; outbox is platform-wide Phase decision |
| Partitioning | Freeze notes `notifications` / `notification_queue` as future partition candidates — not MVP |

**Recommendation:** MVP ships on existing schema. Communication-originated notifications = **Phase 2** (after enum Freeze amendment) **or** temporary mapping to `SYSTEM`/`ADMIN_MESSAGE` only if product explicitly accepts (prefer **not** — too lossy).

---

## 5. Missing events

| Gap | Detail |
|-----|--------|
| Consumer handlers | No `NotificationEventConsumer` |
| Create pipeline | No “evaluate prefs → insert Notification → enqueue channels” |
| Emitted by Notifications | `notification.delivered.v1` (Event Architecture) — not implemented |
| Preference updated | Already published — unused by workers |
| Auth security | Should become events for uniformity |
| Idempotency | No `processed_event_ids` for notification side effects |
| Event name Freeze | Must reconcile doc vs code naming before wiring |

---

## 6. Missing cache strategy

| Gap | Detail |
|-----|--------|
| Unread badge cache | Not defined (`notification:unread:{userId}` candidate) |
| Inbox page cache | Likely **skip cache on list** (user-specific, high churn) or short TTL with invalidate-on-write |
| Preference cache | Exists (`notification-prefs:{userId}`) — document TTL / invalidate on PATCH |
| Forbidden | Global Redis flush; O(N) fan-out invalidate on create |

---

## 7. Missing permission & visibility rules

| Rule needed | Default recommendation (to lock in 10.0) |
|-------------|------------------------------------------|
| Read/update/delete | Recipient `userId === actor` only → else **404** (privacy) |
| Create | System/worker only — no public “create notification” API |
| Block | If recipient blocked actor (or vice versa per Social rules) → **suppress** |
| Private profile / follow request | Honor Social privacy (FOLLOW_REQUEST vs FOLLOW) |
| Muted conversation | Suppress Communication-derived alerts (when those types exist) |
| Soft-deleted actor | Show notification with null/anonymous actor snapshot; do not leak private data |
| Admin/system | `ADMIN_MESSAGE` / `SYSTEM` may bypass category prefs but still respect channel master switches where product requires |

No `NOTIFICATION_*` matrices exist under `docs/05_SECURITY/` today (only Communication mute mentions).

---

## 8. Dependencies on previous modules

| Module | Dependency | Why |
|--------|------------|-----|
| **Auth (1.x)** | Hard | JWT; security SYSTEM path; email outbox/`MailService` |
| **Users (2.x)** | Hard | Actor hydration, privacy, settings |
| **Social (2.2)** | Hard | FOLLOW / FOLLOW_REQUEST |
| **Reviews (4.x)** | Hard | REVIEW_* engagement |
| **Feed (4.6)** | Soft | Pattern reference for event consumers; **not** a runtime dependency |
| **Game Logs / Achievements (5.x)** | Hard for gaming slice | GAME_COMPLETED, ACHIEVEMENT_*, BADGE_*, LEVEL_UP |
| **Collections / Lists / Tier Lists (6–8)** | Hard for social slice | *_LIKE / *_COMMENT / COLLECTION_FOLLOW |
| **Communication (9.x)** | Soft for MVP / Hard for Phase 2 | Events exist; **types missing** |
| **Realtime (proposed 9.5)** | Soft | Push badge / live unread optional later |
| **Database Freeze** | Hard | Schema already frozen |

Module 10 must **not** call into Review/Social services on the hot path of those modules; it **subscribes** after publish (same discipline as Communication → Notification).

---

## Architecture (proposed)

```text
Upstream BCs (Auth, Social, Reviews, …)
        │ publish DomainEvent (after commit)
        ▼
DomainEventPublisher ──► NotificationEventConsumer
                              │
                              ├─ resolve recipients + ACL/privacy
                              ├─ map event → NotificationType
                              ├─ check NotificationPreference / coarse prefs
                              ├─ insert Notification (IN_APP row)
                              └─ enqueue NotificationQueue (PUSH / EMAIL)
                                        │
                                        ▼
                              Delivery workers (10.4)
                                        │
                                        ▼
                              notification.delivered.v1 (analytics)
```

**Aggregates**

| Aggregate | Root | Notes |
|-----------|------|-------|
| Notification | `Notification` | Per-recipient inbox item |
| NotificationPreference | `(userId, type, channel)` + coarse OpenAPI projection | Delivery gate |
| PushToken | `PushToken` | Device registration |
| NotificationQueue | `NotificationQueue` | Outbound delivery attempts |

**Layering (match platform):** Controller → Service → Repository; AuthZ in service; Prisma only in repository; publish-only outbound events.

---

## North Star validation

| NotificationType | Supports digital home of gamers? | MVP? |
|------------------|----------------------------------|------|
| FOLLOW / FOLLOW_REQUEST | Meaningful connections | **Yes** |
| REVIEW_LIKE / COMMENT / REPLY / MENTION / FEATURED | Share experiences / discussion | **Yes** |
| COLLECTION_* / LIST_* / TIERLIST_* | Taste, curation, identity | **Yes** |
| ACHIEVEMENT_* / BADGE_* / LEVEL_UP / GAME_COMPLETED | Journey & identity | **Yes** |
| GAME_RELEASE / UPDATE / REMINDER / DISCOUNT | Discovery (gaming-specific) | **Partial** — needs catalog/jobs; Phase 2 OK |
| FRIEND_ONLINE | Discord-like presence | **Future** — high spam / identity risk |
| ADMIN_MESSAGE / SYSTEM | Trust & safety | **Yes** (security already) |
| Marketing-shaped noise | Conflicts with North Star | **Off by default** (`marketing: false`) |

**Identity guardrails:** Not competing with Discord → defer presence; not generic social spam → rate limits + prefs + digests later; gaming culture first → prioritize review/social/gaming journey types over promo.

---

## Risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
| R1 | Preference dual model (Redis coarse vs type×channel rows) drifts | High | Freeze in 10.0: OpenAPI remains coarse; matrix is derived SoT for workers |
| R2 | Event name mismatches across docs/modules | High | Event Matrix locks **runtime** strings |
| R3 | Sync Auth writes bypass prefs/queue | Medium | Migrate in 10.4 or formal exception |
| R4 | Fan-out volume (popular reviews) | High | Async consumer; batching; never sync notify on write path |
| R5 | Missing MESSAGE types → incomplete “home” for chat | Medium | Phase 2 Freeze amendment — do not invent types in code early |
| R6 | Push vendor lock / mobile not ready | Medium | Implement token API + queue; stub sender until Expo/FCM ready |
| R7 | In-process bus loses events on crash | Medium | Document; align with platform outbox/BullMQ roadmap — don’t block inbox MVP |
| R8 | FRIEND_ONLINE / marketing spam | High | Keep Future; marketing default false |
| R9 | Actor PII in title/body snapshots | Medium | Visibility matrix + sanitize on create |

---

## Proposed sprint map

User example is **accepted** with one clarification: **10.0 is mandatory docs Freeze** before code; preferences already partially exist so **10.4 hardens delivery** rather than inventing prefs from zero.

| Sprint | Focus | Normative outcomes |
|--------|--------|-------------------|
| **10.0** | Documentation & Architecture | Architecture, ADR, Event Matrix, Cache, Permission, Visibility; preference model locked; Auth dual-path decision; MVP type whitelist |
| **10.1** | Notification Core | Inbox CRUD + unread count per OpenAPI; recipient AuthZ; targeted cache for badge; **no** upstream event wiring yet (manual/security rows readable) |
| **10.2** | Social Notifications | Consumer for follow + review engagement + collection/list/tierlist social types; idempotent create |
| **10.3** | Gaming Notifications | Achievements/badges/level + game completed (+ optional release/update if job exists); still IN_APP primary |
| **10.4** | Delivery & Preferences | PushToken API; queue worker; EMAIL/PUSH channels; reconcile Auth security into events; preference sync correctness; `notification.delivered.v1` |
| **10.5** | Final Audit | Architecture/security/performance/OpenAPI compliance; declare Module 10 V1 complete |

### Why not a different breakdown?

- **Preferences-first sprint** is unnecessary — prefs API already exists; putting delivery+prefs in **10.4** avoids rebuilding prefs twice.  
- **Combining 10.2+10.3** risks oversized PRs; Social vs Gaming map cleanly to dependency modules.  
- **Push-first** fails North Star/mobile readiness — Activity Center (IN_APP) is the MVP heart.  
- **Communication notifications in 10.2** blocked by enum Freeze — keep Phase 2.

---

## MVP scope (Module 10 V1)

**In:**

- Architecture Freeze docs (10.0)  
- Full in-app inbox OpenAPI surface (10.1)  
- Event-driven create for Social + Review + Collection/List/TierList engagement (10.2)  
- Event-driven create for Achievements / badges / level / game completed (10.3)  
- Preference gates (existing coarse API + derived matrix)  
- Push token registration API + queue enqueue for PUSH/EMAIL (worker may no-op send in early 10.4 if vendor not ready — must still be designed)  
- SYSTEM security notifications remain available (migrated or explicitly excepted)

**Out of MVP:**

- FRIEND_ONLINE  
- GAME_DISCOUNT / marketing digests  
- Communication MESSAGE/invite types (until enum amendment)  
- WebSocket live notification stream  
- AI-personalized notification ranking  
- Cross-user admin broadcast UI (beyond `ADMIN_MESSAGE` type support)  
- New Prisma models / migrations (unless Freeze amendment approved)

---

## Phase 2 scope

| Item | Notes |
|------|-------|
| Communication notifications | Freeze amendment for message/mention/invite types; consume Communication Event Matrix |
| Reliable GAME_RELEASE / UPDATE / REMINDER | Catalog jobs + wishlist follow graph |
| Real push delivery (Expo/FCM/APNs) | Complete 10.4 workers |
| Email digests | Reduce spam; North Star–aligned |
| Auth fully event-driven | Remove direct Notification writes from Auth |
| Platform outbox / BullMQ alignment | Match `EVENT_ARCHITECTURE.md` |
| Rate limits / bundling (“X and 5 others liked”) | Scale + UX |

---

## Future scope

| Item | Notes |
|------|-------|
| FRIEND_ONLINE / presence alerts | Only with Realtime + strict prefs — Discord-creep guard |
| Advanced Notifications (Roadmap Growth) | Smart batches, quiet hours, per-game follows |
| Notification analytics product | Beyond `notification.delivered.v1` |
| Multi-language templates | Localization platform |
| Rich media cards | Deep links into reviews/game pages with design system |

---

## Dependencies (summary diagram)

```text
Phase 0–1 Foundation (done)
  Auth · Users · Social · Games · Reviews · Feed
  Game Logs · Achievements · Collections · Lists · Tier Lists
  Communication V1 + Attachments
        │
        ▼
Module 10 Notifications (this report)
        │
        ├── MVP: Social + Gaming → In-app Activity Center
        ├── Phase 2: Chat alerts · real push · digests
        └── Future: Presence · advanced ranking
```

---

## Implementation readiness checklist (post–10.0)

Before **10.1** coding:

- [ ] Architecture + ADR + Event/Cache/Permission/Visibility docs merged  
- [ ] MVP NotificationType whitelist approved  
- [ ] Preference dual-model decision recorded  
- [ ] Auth dual-path decision recorded  
- [ ] Confirm **no migration** for 10.1–10.3 unless Freeze amendment  

Before **10.2** coding:

- [ ] Event Matrix rows for Social/Review/Collections/Lists/TierLists locked to **runtime** event names  

---

## Decision

Foundation is sound: Freeze schema + OpenAPI contract + partial preferences + proven event-consumer patterns in sibling modules. Gaps are documentation Freeze, inbox implementation, and event ingest — not a redesign of the data model.

Minor changes required in 10.0 (preference SoT, event naming reconciliation, Auth dual-path, Communication type gap deferred):

### APPROVED WITH MINOR CHANGES

---

## Stop

Module 10 Scope Report complete. **No code, migrations, Prisma changes, OpenAPI modifications, or endpoint implementation.**

Await authorization to start **Sprint 10.0 — Documentation & Architecture**.
