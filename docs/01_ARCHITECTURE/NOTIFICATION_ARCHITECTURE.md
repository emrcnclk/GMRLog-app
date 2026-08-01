# Notification Architecture

**Document:** `docs/01_ARCHITECTURE/NOTIFICATION_ARCHITECTURE.md`  
**Status:** **Frozen — Notification Platform Freeze v1.0** (Sprint 10.0)  
**SSOT contract:** [`NOTIFICATION_API.yaml`](../08_API/NOTIFICATION_API.yaml)  
**Freeze declaration:** [`NOTIFICATION_PLATFORM_FREEZE_v1.md`](../00_PROJECT/NOTIFICATION_PLATFORM_FREEZE_v1.md)  
**Related:** [ADR_Notification_Platform.md](./ADR/ADR_Notification_Platform.md)  
**Scope:** [`MODULE_10_SCOPE_REPORT.md`](../00_PROJECT/MODULE_10_SCOPE_REPORT.md)

---

## Purpose

GMRLOG Notifications is the **Activity Center bounded context**: it materializes preference-aware, privacy-respecting inbox items from **upstream domain events**.

It is **not** a source of truth for social graph, reviews, games, achievements, or messages. Those domains remain authoritative; Notifications stores **denormalized alert snapshots** for the recipient only.

---

## Bounded context

```text
Notifications
  ├── Inbox (Notification rows — IN_APP Activity Center)
  ├── Preferences (coarse OpenAPI projection + derived type×channel matrix)
  ├── PushToken registry          [Sprint 10.4 — registration only; no send]
  ├── NotificationQueue           [Sprint 10.4 — enqueue; send workers later]
  └── Event consumer pipeline     [Sprint 10.2 Social · 10.3 Gaming]
```

**Must NOT own:** Review/Game/User/Social/Collection/List/TierList/Communication aggregates, Feed materialization, Search indexing, Moderation admin UI, realtime sockets, marketing CRM.

**Must consume:** Domain events published by Auth, Social, Reviews, Collections, Lists, Tier Lists, Achievements, Game Logs (and later Communication after enum Freeze amendment).

---

## Aggregate map

| Aggregate | Root | Notes |
|-----------|------|--------|
| Notification | `Notification` | Per-recipient inbox item; snapshot fields `title`/`body`/`actionUrl`/`entityType`/`entityId` |
| NotificationPreference | `(userId, type, channel)` | Worker gate; derived from coarse prefs |
| PushToken | `PushToken` | Device token registry (no vendor send in Freeze v1 MVP path) |
| NotificationQueue | `NotificationQueue` | Outbound delivery attempts (PUSH/EMAIL) |

```text
Upstream BC ──publish──► DomainEvent
                              │
                              ▼
                   NotificationEventConsumer
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ACL / block     Preference gate   Idempotency
              │               │               │
              └───────────────┴───────────────┘
                              │
                              ▼
                    Insert Notification (IN_APP)
                              │
                              ▼
              Enqueue NotificationQueue (PUSH/EMAIL)   [10.4+]
```

---

## Normative decision — Never a source of truth (Freeze v1.0)

| Concern | Source of truth | Notifications role |
|---------|-----------------|--------------------|
| Follow relationship | Social `Follow` | Creates `FOLLOW` / `FOLLOW_REQUEST` inbox row |
| Review / like / comment | Reviews + Social engagement tables | Creates `REVIEW_*` rows |
| Achievement unlock | Achievements | Creates `ACHIEVEMENT_*` / `BADGE_*` / `LEVEL_UP` |
| Game completion | Game Log / Progress | Creates `GAME_COMPLETED` |
| Message body | Communication `Message` | **Out of MVP** — no matching `NotificationType` until Freeze amendment |
| Security incident | Auth | `SYSTEM` (temporary Auth writer allowed until 10.4 migration) |

Notifications **never** mutates upstream aggregates. Deletes/archives affect only the recipient’s inbox row.

---

## Normative decision — Event-driven create only (Freeze v1.0)

1. Upstream modules **publish only** — no `NotificationsService.create` calls from Social/Review hot paths.  
2. Notifications **subscribes** via `NotificationEventConsumer` (same pattern as Feed / Achievements).  
3. Exception (temporary): `SecurityNotificationService` may write `SYSTEM` rows until Sprint **10.4** migrates Auth to events.  
4. No public HTTP “create notification” API.  
5. IN_APP insert is the MVP delivery channel; PUSH/EMAIL enqueue is **10.4+**; actual vendor send is **post–10.4 / Phase 2**.

---

## Normative decision — Preference model (Freeze v1.0)

| Layer | Role |
|-------|------|
| OpenAPI coarse booleans (`push`, `email`, `desktop`, `follows`, `likes`, …) | **User-facing contract** (already implemented) |
| Redis `notification-prefs:{userId}` + `UserSettings.emailNotifications/pushNotifications` | Read cache / channel masters |
| `NotificationPreference` rows `(userId, type, channel)` | **Worker SoT** for type×channel enablement |

On preference PATCH: update coarse projection, then **derive/sync** matrix rows for mapped types. Workers MUST read the matrix (with channel masters). Do not invent a second preference API.

`marketing` defaults **false** (North Star — anti-spam).

---

## Normative decision — Channels (Freeze v1.0)

| Channel | Sprint availability |
|---------|---------------------|
| `IN_APP` | **10.1+** (Activity Center) |
| `PUSH` | Token registry **10.4**; **no vendor send** in Freeze v1 implementation sprints |
| `EMAIL` | Queue design **10.4**; **no template/send** in Freeze v1 implementation sprints (Auth security email remains Auth/`MailService` until migrated) |
| Realtime / WebSocket badge push | **Out of Module 10** — Realtime Foundation (proposed Communication 9.5) |

---

## Notification type groups

### Social (Sprint 10.2)

`FOLLOW`, `FOLLOW_REQUEST`, `REVIEW_LIKE`, `REVIEW_COMMENT`, `REVIEW_REPLY`, `REVIEW_MENTION`, `REVIEW_FEATURED`, `COLLECTION_LIKE`, `COLLECTION_FOLLOW`, `COLLECTION_COMMENT`, `LIST_LIKE`, `LIST_COMMENT`, `TIERLIST_LIKE`, `TIERLIST_COMMENT`

### Gaming (Sprint 10.3)

`ACHIEVEMENT_UNLOCKED`, `LEVEL_UP`, `BADGE_UNLOCKED`, `GAME_COMPLETED`  
Optional later in 10.3 only if catalog jobs exist: `GAME_RELEASE`, `GAME_UPDATE`, `GAME_REMINDER`  
`GAME_DISCOUNT` — Phase 2 / marketing-adjacent (default off)

### System (10.1 readable; Auth today / 10.4 events)

`SYSTEM`, `ADMIN_MESSAGE`

### Explicitly deferred

| Type | Reason |
|------|--------|
| `FRIEND_ONLINE` | Discord-like presence spam — Future + Realtime |
| Communication message/invite types | No enum values — Phase 2 Freeze amendment |

---

## Layering

| Layer | Responsibility |
|-------|----------------|
| Controller | HTTP routing only — JWT; no AuthZ business rules beyond user id |
| Query service | Inbox list / unread / badge |
| Command service | Mark read / archive / delete; preference write |
| Ingest service | Event → ACL → prefs → create Notification (+ enqueue 10.4) |
| Repository | Prisma only |
| Cache | Unread badge + preference keys — targeted invalidate |

---

## Sprint map (scope-locked)

| Sprint | Focus | Normative for implementors |
|--------|--------|----------------------------|
| **10.0** | Architecture Freeze (this set) | Docs only |
| **10.1** | Notification Core (inbox REST) | Ops tagged `x-gmrlog-sprint: '10.1'` and not `future` |
| **10.2** | Social Notifications | Event Matrix Social rows → IN_APP |
| **10.3** | Gaming Notifications | Event Matrix Gaming rows → IN_APP |
| **10.4** | Delivery foundation & preferences harden | PushToken REST; queue enqueue; Auth dual-path migration plan; **no vendor push/email send required** |
| **10.5** | Final Audit | Module 10 V1 complete |

### Sprint 10.1 explicit non-goals

Event consumers for Social/Gaming, PushToken API, NotificationQueue workers, FCM/APNs/Expo, email templates, WebSocket, Communication alerts, `FRIEND_ONLINE`, new Prisma models/migrations.

---

## Integrations

| Producer | Notifications interest |
|----------|------------------------|
| Social | Follow / follow request |
| Reviews | Like / reaction→like mapping / comments / mentions / featured |
| Collections / Lists / Tier Lists | Like / follow / comment (via published events or payload discriminators) |
| Achievements / Game Logs | Unlock / complete |
| Auth | Security SYSTEM |
| Communication | Phase 2 only |
| Analytics | Consumes `notification.created.v1` / `notification.delivered.v1` (Notifications emits) |

---

## Reference — Communication Module

Communication **publishes** events and must not call Notifications. Notifications may later consume `message.created.v1` only after `NotificationType` Freeze amendment. Until then, Communication events are **non-normative** for Module 10 V1.
