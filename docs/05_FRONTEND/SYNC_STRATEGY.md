# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/05_FRONTEND/SYNC_STRATEGY.md`

**Status:** Approved

**Owner:** Mobile Team

**Classification:** Internal Engineering Documentation

---

# Sync Strategy

## Purpose

This document defines how GMRLOG clients reconcile local state with server state after offline periods, concurrent edits, or multi-device usage.

Sync applies to mobile (primary), web client state, and coordinates with backend versioning fields documented in `VERSIONING.md`.

---

## Scope

| Layer | Mechanism |
|-------|-----------|
| Mobile offline write queue | Flush + conflict resolution |
| TanStack Query cache | Background refetch + merge |
| Draft entities | Last-write-wins (local until publish) |
| Realtime (Socket.IO) | Server-push invalidation |
| Multi-device | Server authoritative on conflict |

---

## Sync Topology

```text
                    ┌──────────────┐
                    │   PostgreSQL  │  ← authoritative
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         REST API    Socket.IO     Webhooks
              │            │            │
    ┌─────────┴───┐   ┌────┴────┐      │
    │ Mobile App  │   │ Web App │      │
    │ write queue │   │ Query   │      │
    │ MMKV cache  │   │ cache   │      │
    └─────────────┘   └─────────┘      │
```

---

## Sync Triggers

| Trigger | Action |
|---------|--------|
| Network reconnect | Flush write queue, refetch stale queries |
| App foreground (`AppState: active`) | Refetch queries with `refetchOnWindowFocus` |
| Pull-to-refresh | Force refetch active screen queries |
| Socket event | Targeted `queryClient.invalidateQueries` |
| Periodic background | See intervals table below |
| Manual "Sync now" (Settings) | Full user-scoped refetch |

---

## Sync Intervals

### Foreground polling (fallback when Socket disconnected)

| Data domain | Interval | Condition |
|-------------|----------|-----------|
| Notifications badge | 60s | Socket disconnected > 30s |
| Messages (active thread) | 15s | User viewing thread, no socket |
| Feed | None | Socket + invalidation only |
| Profile stats | 120s | On profile tab |

### Background fetch (Expo)

| Task | Interval | Platform |
|------|----------|----------|
| Queue flush attempt | On `background-fetch` event | iOS / Android |
| Notification badge sync | Minimum 15 min | iOS BGAppRefresh |

Background sync never runs AI or media upload jobs—those require foreground.

### Reconnect burst

On `offline → online` within 5s:

1. Refresh access token if within 5 min of expiry.
2. Flush write queue (FIFO).
3. `queryClient.invalidateQueries({ queryKey: ['notifications'] })`.
4. Refetch active route queries.
5. Reconnect Socket.IO with exponential backoff (1s–30s).

---

## Versioning Fields

Server entities that participate in conflict detection expose:

```typescript
interface SyncableEntity {
  id: string;
  updatedAt: string;   // ISO 8601, server clock
  version: number;     // monotonic integer, incremented per write
}
```

Clients send `If-Match: {version}` on `PATCH`/`PUT` where the API supports optimistic concurrency (`REVIEW_API.yaml`, `COLLECTION_API.yaml`, `USER_API.yaml` profile updates).

---

## Conflict Resolution Policies

### Policy matrix

| Entity | Strategy | Rationale |
|--------|----------|-----------|
| Review (published) | Server wins + merge UI | Public content integrity |
| Review (draft) | Last-write-wins (client) | Single-device draft until publish |
| Post | Server wins | Feed consistency |
| Message (sent) | Append-only | No edits; duplicates deduped by `idempotencyKey` |
| Like / Follow | Last-write-wins | Commutative |
| Collection metadata | Version conflict → user choice | User-owned creative content |
| Collection membership | Server wins | Ordering owned by server |
| Tier list structure | Version conflict → user choice | Complex nested state |
| Game log session | Server wins | Playtime is authoritative |
| Profile fields | Field-level merge | Independent fields |
| Notification read state | Max(client, server) read cursor | Read is idempotent |

---

## Last-Write-Wins (LWW) Rules

LWW applies when `updatedAt` (server) or queue `createdAt` (client) determines the winner.

### Clock authority

Server `updatedAt` always wins over client timestamps. Client clocks are not trusted for merge decisions.

### LWW-eligible operations

- `LIKE_REVIEW` / `UNLIKE_REVIEW` — final state = last operation in flush order.
- `FOLLOW_USER` / `UNFOLLOW_USER` — same.
- `UPDATE_PROFILE_BIO` — full field replacement; latest `version` wins.
- `MUTE_USER` — latest wins.

### LWW algorithm (client)

```text
1. Dequeue write W for entity E
2. GET E from server (or use cached version + etag)
3. If W.version < server.version:
     a. If LWW-eligible → re-apply W intent on top (e.g. toggle)
     b. If not eligible → surface ConflictResolutionSheet
4. Else → submit W with If-Match header
5. On 409 → branch to conflict handler for entity type
```

---

## Conflict UI — User Choice

Shown for `Collection`, `TierList`, and `Review` body edits when server `version` advanced during offline editing.

`ConflictResolutionSheet` options:

| Option | Behavior |
|--------|----------|
| Keep mine | `PUT` with force flag `?strategy=client` (server logs audit) |
| Keep server | Discard local, invalidate query |
| Merge | Open diff view (reviews/collections only) |

Merge is unavailable for tier list row ordering—user must pick one version.

---

## Duplicate Prevention

| Mechanism | Scope |
|-----------|-------|
| `Idempotency-Key` header | All queued writes |
| Client-generated UUID for messages | Dedup on server unique index |
| `event.id` dedup | Backend event consumers |
| TanStack `mutationKey` | Prevent double-tap duplicate mutations |

---

## Realtime Sync Integration

Socket events map to query invalidation:

| Event | Invalidation keys |
|-------|-------------------|
| `notification.new` | `['notifications']` |
| `message.received` | `['messages', threadId]` |
| `feed.item` | `['feed']` |
| `review.updated` | `['reviews', reviewId]` |
| `presence.update` | `['presence']` |

Realtime takes precedence over polling. When socket is connected, foreground polling is disabled.

---

## Multi-Device Scenarios

| Scenario | Resolution |
|----------|------------|
| Edit review on phone, publish on web | Web publish wins; phone shows updated on next fetch |
| Offline likes on two devices | Both apply; final count is sum of unique operations |
| Draft on phone, draft on tablet | Separate draft IDs; publish first wins; second shows conflict |
| Delete account on web while mobile offline | Next API call returns `401`; queue cleared, force logout |

---

## Error Handling

| HTTP status | Client action |
|-------------|---------------|
| `409 Conflict` | Entity-specific resolver |
| `412 Precondition Failed` | Refetch + retry once with new version |
| `422` validation | Remove from queue, rollback, show inline errors |
| `429` | Pause flush 60s, retry with jitter |
| `5xx` | Retry with backoff, keep in queue |

---

## Server Responsibilities

Backend must:

- Increment `version` on every mutating write to syncable entities.
- Return `409` with `ProblemDetails` including `serverEntity` snapshot for conflict UI.
- Honor `Idempotency-Key` for 24 hours.
- Emit Socket events after transaction commit (never before).

See `BACKEND_ARCHITECTURE.md` and `EVENT_ARCHITECTURE.md`.

---

## Observability

| Metric | Target |
|--------|--------|
| Queue flush success rate | > 99.5% |
| Conflict rate per DAU | < 0.1% |
| Mean time to sync after reconnect | < 3s (p95 < 10s) |
| Duplicate message rate | 0% |

PostHog: `sync_conflict_resolved`, `sync_queue_flushed`, `sync_policy_server_wins`.

---

## Acceptance Criteria

- No data loss for queued writes under normal reconnect.
- Conflict resolution UI appears within 500ms of detected `409`.
- LWW operations converge without user intervention.
- Multi-device published content is consistent within one refetch cycle.

---

## Related Documents

- [OFFLINE_MODE.md](OFFLINE_MODE.md)
- [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)
- [VERSIONING.md](../00_PROJECT/VERSIONING.md)
- [REALTIME_ARCHITECTURE.md](../06_BACKEND/REALTIME_ARCHITECTURE.md)
- [EVENT_ARCHITECTURE.md](../06_BACKEND/EVENT_ARCHITECTURE.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
