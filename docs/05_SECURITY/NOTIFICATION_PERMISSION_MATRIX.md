# Notification Permission Matrix

**Document:** `docs/05_SECURITY/NOTIFICATION_PERMISSION_MATRIX.md`  
**Status:** **Frozen — Notification Platform Freeze v1.0** (Sprint 10.0)  
**AuthN:** Bearer JWT  
**AuthZ model:** **Recipient-only** for inbox; no cross-user access

---

## Roles

| Role | Scope |
|------|--------|
| `ANON` | Unauthenticated |
| `USER` | Authenticated |
| `RECIPIENT` | `Notification.userId === caller` |
| `PLATFORM_ADMIN` | Admin tooling (ADMIN_API) — not Notification public REST for inbox of others |

---

## Inbox actions

| Action | ANON | USER | RECIPIENT | PLATFORM_ADMIN |
|--------|------|------|-----------|----------------|
| List own notifications | — | ✅ (own only) | ✅ | ✅ (admin tooling only) |
| List unread / unread count | — | ✅ own | ✅ | ✅ admin |
| Get notification by id | — | — | ✅ | ✅ admin |
| Mark one / all read | — | — | ✅ | ✅ admin |
| Archive / list archived | — | — | ✅ | ✅ admin |
| Delete notification | — | — | ✅ | ✅ admin |
| Create notification (HTTP) | — | — | — | — (**no public API**) |
| Read another user’s inbox | — | — | — | admin only |

Non-recipient access to a notification id → **404** (never 403 that confirms existence).

---

## Preferences

| Action | ANON | USER |
|--------|------|------|
| GET `/notifications/preferences` | — | ✅ own |
| PATCH `/notifications/preferences` | — | ✅ own |

---

## Push tokens (Sprint 10.4 REST; no send)

| Action | ANON | USER |
|--------|------|------|
| List / register / delete own tokens | — | ✅ own tokens only |
| Register token for another user | — | — |

---

## Ingest / workers

| Action | Who |
|--------|-----|
| Create Notification row | Notification ingest worker / temporary Auth security writer |
| Enqueue NotificationQueue | Notification delivery service (10.4+) |
| Send PUSH/EMAIL | Delivery workers — **not in 10.1–10.3**; not required for Freeze v1 gate |

Workers are not end-user roles; they run with service credentials and must still apply Visibility Matrix before insert.

---

## Test notification

`sendTestNotification` — **staging/dev or admin-gated only**; never unrestricted production self-spam. Document environment gate in 10.4.

---

## Controllers

Controllers must not embed AuthZ beyond passing `user.sub`. Services enforce recipient checks.
