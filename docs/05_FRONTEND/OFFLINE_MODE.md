# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/05_FRONTEND/OFFLINE_MODE.md`

**Status:** Approved

**Owner:** Mobile Team

**Classification:** Internal Engineering Documentation

---

# Offline Mode

## Purpose

This document defines how the GMRLOG mobile application (Expo) behaves when network connectivity is unavailable, degraded, or intermittent.

Offline mode is a first-class product capability—not a fallback. Players must be able to browse cached content, compose drafts, queue mutations, and resume seamlessly when connectivity returns.

---

## Scope

| In scope | Out of scope |
|----------|--------------|
| Expo mobile (`apps/mobile`) | Web SSR offline (PWA is future) |
| Read cache (TanStack Query + MMKV) | Full offline game catalog sync |
| Write queue (optimistic + durable) | Peer-to-peer sync |
| Draft persistence | Admin dashboard offline |
| Image/media cache | Background fetch on iOS (future) |
| Reconnect sync orchestration | |

---

## Design Principles

1. **Read-first resilience** — Cached data is shown immediately; stale indicators are honest.
2. **Never lose user intent** — Writes are queued durably before the network attempt.
3. **Optimistic by default** — UI reflects user action instantly; rollback on hard failure.
4. **Bounded cache** — Storage limits prevent unbounded growth on low-end devices.
5. **Security preserved** — Sensitive tokens never enter the offline write queue in plaintext beyond existing secure storage.

---

## Connectivity Detection

### Source of truth

`@react-native-community/netinfo` wrapped in `packages/utils/src/network/use-network-status.ts`.

```typescript
interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
}
```

### App-level states

| State | Condition | UI behavior |
|-------|-----------|-------------|
| `online` | `isConnected && isInternetReachable !== false` | Normal operation |
| `degraded` | Connected but API health check fails 2× within 30s | Banner: "Slow connection" |
| `offline` | `!isConnected` or `isInternetReachable === false` | Offline banner + cached reads |
| `syncing` | Queue draining after reconnect | Subtle sync indicator |

Health check: `GET /api/v1/health` with 5s timeout, debounced 10s between probes.

---

## Storage Architecture

```text
┌─────────────────────────────────────────────────────────┐
│                    Expo Mobile App                       │
├─────────────────────────────────────────────────────────┤
│  TanStack Query Cache (in-memory)                        │
│       ↕ persistQueryClient                               │
│  MMKV — query persistence layer                          │
│       ↕                                                  │
│  MMKV — offline_write_queue (durable mutations)          │
│  MMKV — drafts (reviews, posts, messages)                │
│  MMKV — auth tokens (via expo-secure-store for secrets)  │
│  FileSystem — image/media cache (expo-file-system)       │
└─────────────────────────────────────────────────────────┘
```

### MMKV namespaces

| Namespace | Key pattern | TTL | Max size |
|-----------|-------------|-----|----------|
| `query-cache` | TanStack persisted keys | Per query `gcTime` | 50 MB |
| `write-queue` | `queue:{uuid}` | 7 days | 500 entries |
| `drafts` | `draft:{entity}:{id}` | 30 days | 100 drafts |
| `media-cache` | `media:{url-hash}` | 14 days | 200 MB |

Eviction: LRU within each namespace when limits are exceeded.

---

## Read Cache Strategy

TanStack Query persistence via `@tanstack/query-async-storage-persister` backed by MMKV.

### Persisted query domains

| Domain | Persist | `staleTime` (offline) | `gcTime` |
|--------|---------|----------------------|----------|
| Current user profile | Yes | 24h | 7d |
| Feed (following) | Yes | 1h | 3d |
| Notifications (last page) | Yes | 30m | 1d |
| Game detail (visited) | Yes | 24h | 7d |
| Messages (active threads) | Yes | 15m | 1d |
| Search results | No | — | — |
| Realtime presence | No | — | — |

### Offline read rules

- On screen mount: render persisted cache immediately, then skip fetch if `offline`.
- Display `CachedDataBadge` when `dataUpdatedAt` is older than `staleTime`.
- Infinite queries persist only the first three pages to cap storage.
- Sensitive endpoints (`/auth/me` with private fields) persist only after explicit opt-in in query meta: `meta: { persist: true }`.

### Image cache

`expo-image` with `cachePolicy="memory-disk"`. Cover art, avatars, and feed attachments use CDN URLs with cache-busting only on explicit invalidation.

---

## Write Queue

All mutating operations that support offline enqueue through `OfflineWriteQueue` in `apps/mobile/src/lib/offline-write-queue.ts`.

### Queue entry schema

```typescript
interface QueuedWrite {
  id: string;                    // UUID v7
  createdAt: string;               // ISO 8601
  retryCount: number;
  maxRetries: number;            // default 5
  operation: OfflineOperation;
  idempotencyKey: string;        // sent as Idempotency-Key header
  optimisticRollback: () => void;
}

type OfflineOperation =
  | { type: 'CREATE_REVIEW_DRAFT'; payload: CreateReviewPayload }
  | { type: 'PUBLISH_REVIEW'; payload: PublishReviewPayload }
  | { type: 'CREATE_POST'; payload: CreatePostPayload }
  | { type: 'SEND_MESSAGE'; payload: SendMessagePayload }
  | { type: 'LIKE_REVIEW'; payload: LikeReviewPayload }
  | { type: 'FOLLOW_USER'; payload: FollowUserPayload }
  | { type: 'LOG_GAME_SESSION'; payload: LogSessionPayload }
  | { type: 'UPDATE_COLLECTION'; payload: UpdateCollectionPayload };
```

### Enqueue flow

```text
User action
    ↓
Optimistic UI update (TanStack Query setQueryData)
    ↓
Persist to MMKV write-queue
    ↓
If online → flush immediately
If offline → wait for NetInfo reconnect event
```

### Flush policy

- Process FIFO per entity type to reduce ordering conflicts.
- Parallel flush across unrelated entity types (e.g. likes + messages).
- Exponential backoff: 1s, 2s, 4s, 8s, 16s (cap 60s).
- On `401`: pause queue, trigger token refresh, resume.
- On `409` / conflict: delegate to `SYNC_STRATEGY.md` resolver.
- On permanent `4xx` (except 409): remove from queue, rollback optimistic state, show error toast.

### Idempotency

Every queued write carries `Idempotency-Key: {queueEntry.id}`. Backend honors duplicate keys for 24h (see `API_ARCHITECTURE.md`).

---

## Draft Persistence

Drafts are separate from the write queue—user-authored content that may never be submitted.

| Entity | Storage key | Auto-save interval | Sync on publish |
|--------|-------------|-------------------|-----------------|
| Review | `draft:review:{gameId}` | 3s debounce | `POST /reviews` |
| Post | `draft:post:{draftId}` | 3s debounce | `POST /social/posts` |
| Message | `draft:message:{threadId}` | 1s debounce | Cleared on send |
| Collection note | `draft:collection:{id}` | 5s debounce | `PATCH /collections/{id}` |

Drafts sync to server only when the user explicitly saves or publishes. Server-side draft endpoints (`REVIEW_API.yaml`) are authoritative after successful sync; local draft is deleted on `201`/`200`.

---

## Blocked Offline Actions

These actions require live connectivity and show an explanatory modal:

- OAuth login / registration
- Password reset
- MFA setup and verification
- Media upload (images queue locally; upload starts on reconnect)
- Realtime messaging subscription (queued sends still work)
- AI features (`AI_API.yaml` — all endpoints)
- Payment and subscription flows
- Account deletion

---

## UI Components

| Component | Responsibility |
|-----------|----------------|
| `OfflineBanner` | Persistent top banner when `offline` |
| `CachedDataBadge` | "Cached · 2h ago" on stale screens |
| `SyncProgressIndicator` | Queue depth during `syncing` |
| `OfflineActionSheet` | Explains why action is blocked |
| `QueuedWriteToast` | "Saved offline — will sync when connected" |

Copy is localized via `apps/mobile/locales/`. Default English strings live in `en/offline.json`.

---

## Expo Configuration

### Required packages

- `expo-network` — supplemental reachability
- `react-native-mmkv` — durable storage
- `@tanstack/react-query-persist-client`
- `@react-native-community/netinfo`

### OTA considerations

Offline queue schema version is stored as `write-queue:schema-version`. On breaking schema changes, migration runs at app boot; incompatible entries are exported to a user-visible "failed sync" log before purge.

---

## Observability

| Event | PostHog event name |
|-------|-------------------|
| Went offline | `offline_mode_entered` |
| Reconnected | `offline_mode_exited` |
| Queue flush start/complete | `offline_queue_flush` |
| Queue item failed permanently | `offline_queue_failed` |
| Draft recovered | `offline_draft_recovered` |

Sentry breadcrumbs include queue depth and connectivity state on crash.

---

## Testing Requirements

| Test type | Coverage |
|-----------|----------|
| Unit | Queue serialization, idempotency key generation, eviction |
| Integration | Optimistic update + rollback on 4xx |
| E2E (Detox) | Airplane mode → compose review → reconnect → verify server state |
| Manual QA matrix | iOS + Android, low storage, token expiry during queue |

---

## Acceptance Criteria

- Cached feed and game pages render within 300ms offline.
- No queued write is lost across app kill and restart.
- Optimistic UI rolls back correctly on permanent failure.
- Storage stays under configured caps on a 30-minute offline session.
- All blocked actions show clear user messaging.

---

## Related Documents

- [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md)
- [SYNC_STRATEGY.md](SYNC_STRATEGY.md)
- [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)
- [CACHE_STRATEGY.md](../06_BACKEND/CACHE_STRATEGY.md)
- [API_ARCHITECTURE.md](../08_API/API_ARCHITECTURE.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
