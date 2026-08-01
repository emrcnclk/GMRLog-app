# Notification Platform Freeze v1.0

**Document:** `docs/00_PROJECT/NOTIFICATION_PLATFORM_FREEZE_v1.md`  
**Date:** 2026-07-19  
**Status:** **FROZEN**  
**Preceded by:** Module 10 Scope Report (`APPROVED WITH MINOR CHANGES`) + Sprint 10.0 architecture  
**Unlocks:** Sprint 10.1 Notification Core

---

## What is frozen

The Notification Platform documentation set below is the **normative SSOT** for Sprint 10.1+. Implementors must not reinterpret these decisions in code reviews.

| Artifact | Role |
|----------|------|
| [`docs/08_API/NOTIFICATION_API.yaml`](../08_API/NOTIFICATION_API.yaml) | REST contract (`info.version: 1.0.0`) |
| [`docs/01_ARCHITECTURE/NOTIFICATION_ARCHITECTURE.md`](../01_ARCHITECTURE/NOTIFICATION_ARCHITECTURE.md) | Bounded context & aggregates |
| [`docs/01_ARCHITECTURE/ADR/ADR_Notification_Platform.md`](../01_ARCHITECTURE/ADR/ADR_Notification_Platform.md) | ADR-NOTIF-001 Accepted |
| [`docs/03_EVENTS/NOTIFICATION_EVENT_MATRIX.md`](../03_EVENTS/NOTIFICATION_EVENT_MATRIX.md) | Ingest + emit events |
| [`docs/04_CACHE/NOTIFICATION_CACHE_STRATEGY.md`](../04_CACHE/NOTIFICATION_CACHE_STRATEGY.md) | Redis keys & invalidation |
| [`docs/05_SECURITY/NOTIFICATION_PERMISSION_MATRIX.md`](../05_SECURITY/NOTIFICATION_PERMISSION_MATRIX.md) | AuthZ |
| [`docs/05_SECURITY/NOTIFICATION_VISIBILITY_MATRIX.md`](../05_SECURITY/NOTIFICATION_VISIBILITY_MATRIX.md) | Privacy / suppression |

**Database schema:** Notification domain tables already exist in Database Freeze. This Freeze **does not authorize new tables or `NotificationType` enum values**. Communication message notification types require a future Database Freeze amendment.

---

## Six locked decisions (non-negotiable for 10.1+)

### 1. Notifications is never a source of truth

- Upstream domains own entities.  
- Notifications stores recipient inbox snapshots only.  
- No mutating Review/Game/User/Social/Communication state from this BC.

### 2. Event-driven create only

- Consume domain events; no sync `notify()` from Social/Review hot paths.  
- Temporary exception: Auth `SecurityNotificationService` may write `SYSTEM` until Sprint **10.4**.  
- No public HTTP create-notification API.

### 3. Preference dual-model

- OpenAPI coarse booleans = user contract.  
- `NotificationPreference` type×channel = worker SoT (derived on PATCH).  
- `marketing` default **false**.

### 4. Recipient privacy

- Non-recipient inbox access → **404**.  
- Block / private entity / pref-off → **suppress create** (Visibility Matrix).

### 5. Channels — IN_APP first

- **10.1–10.3:** IN_APP only.  
- **No Push vendor send**, **no Email send**, **no WebSocket** in Module 10 V1 implementation sprints.  
- PushToken REST + queue enqueue may start in **10.4**; send is later / Phase 2.

### 6. Sprint 10.1 scope lock

Implement **only** operations with `x-gmrlog-sprint: '10.1'` and without `x-gmrlog-status: future`:

| operationId | Method / path |
|-------------|----------------|
| `getNotifications` | GET `/notifications` |
| `unreadNotifications` | GET `/notifications/unread` |
| `getUnreadNotificationCount` | GET `/notifications/unread/count` |
| `markAllNotificationsRead` | PATCH `/notifications/read` |
| `getNotification` | GET `/notifications/{notificationId}` |
| `markNotificationRead` | PATCH `/notifications/{notificationId}/read` |
| `archiveNotification` | PATCH `/notifications/{notificationId}/archive` |
| `archivedNotifications` | GET `/notifications/archive` |
| `deleteNotification` | DELETE `/notifications/{notificationId}` |

**Already live (out of 10.1 coding need, but in Freeze):**

| operationId | Method / path |
|-------------|----------------|
| `notificationPreferences` | GET `/notifications/preferences` |
| `updateNotificationPreferences` | PATCH `/notifications/preferences` |

All other NOTIFICATION_API paths (push tokens, test send) are **non-normative appendix** until their sprint.

---

## Change control

Breaking changes to frozen decisions require:

1. ADR amendment (ADR-NOTIF-00x), and  
2. Bump Notification Platform Freeze minor/major, and  
3. Explicit note in the sprint report.

Cosmetic OpenAPI wording that does not change semantics may land without a new Freeze major.

New `NotificationType` enum values require **Database Freeze amendment** in addition to this Freeze.

---

## Explicit non-goals until later sprints

Push vendor integration, email template send, realtime badge sockets, `FRIEND_ONLINE`, Communication message/invite notifications, `GAME_DISCOUNT` marketing blasts, AI ranking, new Prisma models, inventing undeclared endpoints.

---

## Gate

**Sprint 10.1 Notification Core may begin** after this Freeze is accepted.

Do **not** start 10.2 Social ingest until Event Matrix runtime names for targeted types are confirmed in the 10.2 kickoff.
