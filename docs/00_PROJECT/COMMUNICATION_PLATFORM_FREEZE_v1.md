# Communication Platform Freeze v1.0

**Document:** `docs/00_PROJECT/COMMUNICATION_PLATFORM_FREEZE_v1.md`  
**Date:** 2026-07-18  
**Status:** **FROZEN**  
**Preceded by:** Sprint 9.0 bible + Architecture Audit + Sprint 9.0.1 revision  
**Unlocks:** Sprint 9.1 Conversation Core

---

## What is frozen

The Communication Platform documentation set below is the **normative SSOT** for Sprint 9.1+. Implementors must not reinterpret these decisions in code reviews.

| Artifact | Role |
|----------|------|
| [`docs/08_API/COMMUNICATION_API.yaml`](../08_API/COMMUNICATION_API.yaml) | REST contract (`info.version: 1.0.0`) |
| [`docs/01_ARCHITECTURE/COMMUNICATION_ARCHITECTURE.md`](../01_ARCHITECTURE/COMMUNICATION_ARCHITECTURE.md) | Bounded context & aggregates |
| [`docs/01_ARCHITECTURE/ADR/ADR_Communication_Platform.md`](../01_ARCHITECTURE/ADR/ADR_Communication_Platform.md) | ADR-COMM-001 Accepted |
| [`docs/03_EVENTS/COMMUNICATION_EVENT_MATRIX.md`](../03_EVENTS/COMMUNICATION_EVENT_MATRIX.md) | Domain events |
| [`docs/04_CACHE/COMMUNICATION_CACHE_STRATEGY.md`](../04_CACHE/COMMUNICATION_CACHE_STRATEGY.md) | Redis keys & invalidation |
| [`docs/05_SECURITY/COMMUNICATION_PERMISSION_MATRIX.md`](../05_SECURITY/COMMUNICATION_PERMISSION_MATRIX.md) | AuthZ |
| [`docs/05_SECURITY/COMMUNICATION_VISIBILITY_MATRIX.md`](../05_SECURITY/COMMUNICATION_VISIBILITY_MATRIX.md) | Privacy / visibility |

**Not frozen as Database schema:** Groups/Channels/Threads/Pins/Polls remain future until a Database Freeze amendment. This document freezes the **Communication API & architecture bible**, not the full Postgres schema.

---

## Five locked decisions (non-negotiable for 9.1+)

### 1. Leave ≠ Delete

- `DELETE /conversations/{id}` = leave (`ConversationMember.leftAt`).
- Event: `conversation.participant.left.v1`.
- Archive/mute = PATCH only.
- No public conversation destroy API in sprints 9.1–9.6.

### 2. GroupMember → ConversationMember ownership

- `GroupMember` = source of truth for membership & roles.
- `ConversationMember` = derived participation on channel conversations.
- Sync rules documented in COMMUNICATION_ARCHITECTURE.
- DIRECT chats never use `GroupMember`.

### 3. O(N) cache invalidation banned

- Message writes on group-backed conversations must **not** `DEL conversation:user:{eachParticipant}`.
- Use `conversation:{id}:inboxVersion` bump + lazy inbox refresh.
- DIRECT (2 members) may invalidate both user inbox keys (O(1)).

### 4. DM privacy / block policy

- Private resource denies (including Social block either direction) → **404**.
- Never 403 that reveals conversation existence or block relationship.
- Friend-gate not required in 9.1; rate limits are primary spam control.

### 5. Sprint 9.1 scope lock

Implement **only** operations with `x-gmrlog-sprint: '9.1'` and without `x-gmrlog-status: future`:

| operationId | Method / path |
|-------------|----------------|
| `listConversations` | GET `/conversations` |
| `createConversation` | POST `/conversations` |
| `getConversation` | GET `/conversations/{conversationId}` |
| `updateConversation` | PATCH `/conversations/{conversationId}` |
| `leaveConversation` | DELETE `/conversations/{conversationId}` |
| `listConversationParticipants` | GET `/conversations/{conversationId}/participants` |
| `listMessages` | GET `/conversations/{conversationId}/messages` |
| `sendMessage` | POST `/conversations/{conversationId}/messages` |
| `getMessage` | GET `/conversations/{conversationId}/messages/{messageId}` |

**Message write:** `messageType = TEXT` only (`SYSTEM` server-emitted).

All other COMMUNICATION_API paths are **non-normative appendix** until their sprint.

---

## Change control

Breaking changes to frozen decisions require:

1. New ADR amendment (or ADR-COMM-00x), and  
2. Bump Communication Platform Freeze minor/major, and  
3. Explicit note in the sprint report.

Cosmetic OpenAPI wording that does not change semantics may land without a new Freeze major.

---

## Explicit non-goals until later sprints

Groups, channels, threads, pins, polls, reactions, likes, bookmarks, mentions UI/API, rich MessageType cards, message search, read-receipt REST, WebSocket, voice, forward, Notification/Feed wiring, creating `MESSAGE_API.yaml`.

---

## Gate

**Sprint 9.1 Conversation Core may begin.**

Do not invent endpoints, tables, or authz rules outside this Freeze.
