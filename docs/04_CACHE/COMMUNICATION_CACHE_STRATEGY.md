# Communication Cache Strategy

**Document:** `docs/04_CACHE/COMMUNICATION_CACHE_STRATEGY.md`  
**Status:** **Frozen — Communication Platform Freeze v1.0** (Sprint 9.0.1)  
**Store:** Redis  
**Rule:** Targeted invalidation only — **no global flush**  
**Hard rule:** **O(N) per-message inbox key deletion is banned**

---

## Key catalog

| Key | Value | TTL (default) | Notes |
|-----|-------|---------------|-------|
| `conversation:{id}` | Conversation DTO / meta | 600s | Participant-scoped reads; never cache for non-members |
| `conversation:{id}:inboxVersion` | Integer / timestamp | none / long | Bumped on messages that affect inbox preview; cheap shared signal |
| `conversation:user:{userId}` | Inbox page (default first page) | 300s | **DIRECT only** fan-out invalidate on create/leave/message; see ban below |
| `group:{id}` | Group DTO | 600s | Future |
| `group:list:{userId}` | Membership list page | 300s | Future (`group:list` namespace) |
| `channel:{id}` | Channel DTO | 600s | Future |
| `search:{hash}` | Conversation search page | 120s | Future message search |
| `poll:{id}` | Poll DTO | 120s | Future |

Suggested hash: SHA-256 of stable JSON `{ conversationId, q, cursor, limit }` truncated to 32 hex.

---

## What never to cache

| Data | Reason |
|------|--------|
| Full private message history pages | High churn + privacy; prefer DB + cursor |
| Typing / presence | Ephemeral |
| Another user’s inbox | Authorization boundary |
| Per-message DTOs as default | High churn — do **not** introduce `message:{id}` as hot-path cache |

---

## Normative decision — O(N) invalidation ban (Freeze v1.0)

### Forbidden

On `message.created` / update / delete for a **GROUP-backed** conversation (or any conversation with `participantCount > 2`):

- Iterating all participants and `DEL conversation:user:{eachUserId}`
- Any O(members) Redis write fan-out on the message hot path

### Required pattern

| Conversation shape | On message write |
|--------------------|------------------|
| **DIRECT** (exactly 2 active members) | Invalidate `conversation:{id}` + `conversation:user:{userA}` + `conversation:user:{userB}` (O(1)) |
| **GROUP / channel** (or N > 2) | Invalidate `conversation:{id}` and **bump** `conversation:{id}:inboxVersion` only. Do **not** touch per-user inbox keys on the write path. |

### Inbox read (GROUP)

1. Load `conversation:user:{userId}` if present.
2. For each conversation preview that is group-backed, compare cached preview version to `conversation:{id}:inboxVersion`.
3. On mismatch: refresh that row from DB (lazy), rewrite inbox cache.

Clients on WebSocket (9.4+) may also observe `message.created.v1` and refresh locally without waiting for inbox cache.

### Why

1K–10K member channels would otherwise issue thousands of Redis DELs per message → latency, CPU, thundering herd on next inbox reads.

---

## Invalidation matrix

| Mutation | Invalidate / bump |
|----------|-------------------|
| conversation create (DIRECT) | `conversation:{id}`, `conversation:user:{both}` |
| conversation leave (self) | `conversation:{id}`, `conversation:user:{caller}` (+ peer for DIRECT) |
| conversation archive/mute (PATCH) | `conversation:user:{caller}` only |
| message create/update/delete | `conversation:{id}`; DIRECT → both user inbox keys; GROUP → **bump inboxVersion only** |
| reaction / like / pin | Prefer no inbox invalidate; bump inboxVersion only if preview shows reaction counts |
| group create/update/delete | `group:{id}`, `group:list:{affected}` (bounded; not message hot path) |
| channel create/delete | `channel:{id}`, `group:{id}` |
| poll create/vote | `poll:{id}` |

---

## Consistency

- Cache-aside: read miss → DB → set.
- On write: invalidate / bump first (or write-through for conversation metadata only).
- Unread counters: prefer DB/`lastReadAt` derivation; if cached, invalidate on read receipts (9.5) without O(N) member loops on send.

---

## Alignment with RATE_LIMITING

Hot write path `POST /conversations/*/messages` is rate-limited (120/min). Cache reduces inbox/list read pressure, not send pressure. Cache must not amplify write cost via O(N) DEL.
