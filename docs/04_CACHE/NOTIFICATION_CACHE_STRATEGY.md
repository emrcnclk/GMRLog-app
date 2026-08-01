# Notification Cache Strategy

**Document:** `docs/04_CACHE/NOTIFICATION_CACHE_STRATEGY.md`  
**Status:** **Frozen — Notification Platform Freeze v1.0** (Sprint 10.0)  
**Store:** Redis  
**Rule:** Targeted invalidation only — **no global flush**  
**Hard rule:** Never fan out O(N) Redis deletes when creating notifications for many recipients of an unrelated domain event (each recipient invalidate is O(1) per recipient processed — batch carefully; do not flush shared wildcards).

---

## Key catalog

| Key | Value | TTL (default) | Notes |
|-----|-------|---------------|-------|
| `notification:unread:{userId}` | Integer unread count | 120s | Badge; invalidate on create / mark-read / mark-all / delete |
| `notification-prefs:{userId}` | Coarse preference JSON | persistent / long | **Already used** by preference repository |
| `notification:inbox:{userId}:{hash}` | Optional first-page DTO | 60s | **Optional** — prefer skip if churn high |
| `notification:idempotency:{eventId}` | `1` | 7d | Processed upstream event id |

Suggested inbox hash: SHA-256 of stable JSON `{ cursor, limit, type, read, archived }` truncated to 32 hex.

---

## What never to cache

| Data | Reason |
|------|--------|
| Full multi-page inbox as durable SoT | High churn; privacy; cursor pagination |
| Another user’s unread count | AuthZ boundary |
| NotificationQueue payloads | Operational; DB is SoT |
| Push vendor responses | Ephemeral |

---

## Invalidation matrix

| Mutation | Invalidate |
|----------|------------|
| Notification create (ingest) | `notification:unread:{recipientId}`; optional inbox page keys for recipient |
| Mark one read / archive / delete | `notification:unread:{userId}`; that user’s inbox page keys |
| Mark all read | `notification:unread:{userId}`; inbox page keys |
| Preference PATCH | `notification-prefs:{userId}` (write-through already); no unread change |
| PushToken register/delete | None required for badge |

---

## Consistency

- Cache-aside for unread: miss → `COUNT` where `userId` + `isRead=false` + `isArchived=false` → set.  
- On write: update DB first, then invalidate (or write-through count decrement/increment when cheap and exact).  
- Idempotency keys: set **after** successful insert (or use SET NX before work with careful failure handling).

---

## Explicit bans

1. `FLUSHALL` / `FLUSHDB` / namespace-wide `notification:*` wipe on a single user action.  
2. Caching inbox pages across users.  
3. Using Communication `conversation:user:*` keys for notification badge.

---

## Sprint notes

| Sprint | Cache work |
|--------|------------|
| 10.1 | Implement unread key + invalidation on inbox mutations |
| 10.2–10.3 | Invalidate unread on ingest create |
| 10.4 | Keep prefs key; no new global keys for vendors |
