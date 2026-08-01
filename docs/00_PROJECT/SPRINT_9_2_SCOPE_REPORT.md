# Sprint 9.2 — Scope Report (Planning Audit)

**Document:** `docs/00_PROJECT/SPRINT_9_2_SCOPE_REPORT.md`  
**Date:** 2026-07-18  
**Status:** Planning only — **no code**  
**Sources compared:**  
- `docs/08_API/COMMUNICATION_API.yaml`  
- `docs/00_PROJECT/COMMUNICATION_PLATFORM_FREEZE_v1.md`  
- `docs/00_PROJECT/NORTH_STAR.md`

---

## Verdict — Real Sprint 9.2 scope

**Sprint 9.2 = Messaging Core (engagement on existing messages), not Conversation Groups.**

| Source | Says |
|--------|------|
| **OpenAPI** (`x-gmrlog-sprint: '9.2'`, not `future`) | **12 operations** — edit/delete message, like, emoji reaction, bookmark, report, mention inbox |
| **Freeze v1.0** | After 9.1, only ops for the active sprint are normative; Groups/Channels remain later; leave≠delete, block→404, O(N) cache ban still bind |
| **North Star** | Messaging engagement that deepens belonging / identity can pass the North Star Question; must stay gaming-culture chat transport, not generic social spam |

**Out of Sprint 9.2 (do not implement under this tag):**

- Conversation Groups / member add-remove (`future` + **9.3**)
- Channels, threads, pins, polls, voice, forward (`future` / 9.3+)
- Rich `MessageType`, WebSocket, read receipts, Notification delivery, Search indexing

---

## Inventory rule

Included: `x-gmrlog-sprint: '9.2'` **and** `x-gmrlog-status` ≠ `future`.  
Excluded: all other COMMUNICATION_API paths.

**Count: 12 operations.**

---

## Shared constraints (all 12 ops)

| Concern | Rule |
|---------|------|
| AuthN | Bearer JWT |
| AuthZ | Active `ConversationMember` (`leftAt` null); private deny → **404** (block either way included) |
| Controller | Zero business logic |
| Permission | `ConversationPermissionService` + Containers (`ContainerPermissionService` / `ContainerVisibilityResolver` / `BlockService`) — no `ownerId !==` in services |
| Cache | No message-history cache; no global flush; **no O(N)** `conversation:user:*` DEL |
| Events | Publish-only; no direct Notification/Search/AI calls |
| Migration default | Prefer **reuse** Social `Like` / `Reaction` / `Bookmark` / `Mention` / `Report` with `entityType=MESSAGE` |

---

## Operation catalog

### 1. `updateMessage`

| Field | Detail |
|-------|--------|
| **Endpoint** | `PATCH /conversations/{conversationId}/messages/{messageId}` |
| **Request DTO** | `UpdateMessageRequest` — required `body` (1–8000) |
| **Response DTO** | `Message` |
| **Event** | `message.updated.v1` |
| **Cache** | Invalidate `conversation:{id}`; DIRECT → both `conversation:user:{A\|B}`; N>2 → bump `inboxVersion` only. Do **not** cache message body. |
| **Permission** | **SENDER** only; within edit window (product rule in service). Non-participant / block → 404 |
| **Migration** | **No** — `Message.body` / `updatedAt` / `deletedAt` exist |

---

### 2. `deleteMessage`

| Field | Detail |
|-------|--------|
| **Endpoint** | `DELETE /conversations/{conversationId}/messages/{messageId}` |
| **Request DTO** | — (empty body) |
| **Response DTO** | `204` |
| **Event** | `message.deleted.v1` |
| **Cache** | Same as update (conversation + DIRECT inbox / GROUP inboxVersion) |
| **Permission** | **SENDER**, or GROUP_MOD/OWNER when Groups exist (9.3). Until then: sender-only for DIRECT. Private deny → 404 |
| **Migration** | **No** — soft delete via `Message.deletedAt` |

---

### 3. `likeMessage`

| Field | Detail |
|-------|--------|
| **Endpoint** | `POST /conversations/{conversationId}/messages/{messageId}/like` |
| **Request DTO** | — |
| **Response DTO** | `204` |
| **Event** | `message.liked.v1` |
| **Cache** | Prefer **no** inbox invalidate; optional `conversation:{id}` if `likeCount` on preview. Never O(N) user keys |
| **Permission** | Active **PARTICIPANT** (not blocked). 404 if no access |
| **Migration** | **No** — `Like` + `ContentEntityType.MESSAGE` |

---

### 4. `unlikeMessage`

| Field | Detail |
|-------|--------|
| **Endpoint** | `DELETE /conversations/{conversationId}/messages/{messageId}/like` |
| **Request DTO** | — |
| **Response DTO** | `204` |
| **Event** | None in EVENT_MATRIX (optional later `message.unliked.v1` requires Freeze amendment). **9.2 ship: no event or document omission**) |
| **Cache** | Same as like |
| **Permission** | PARTICIPANT; own like only |
| **Migration** | **No** |

---

### 5. `listMessageReactions`

| Field | Detail |
|-------|--------|
| **Endpoint** | `GET /conversations/{conversationId}/messages/{messageId}/reactions` |
| **Request DTO** | Query: `Cursor`, `Limit` |
| **Response DTO** | `MessageReactionPage` → items: `MessageReaction` |
| **Event** | — (read) |
| **Cache** | Do not cache reaction lists by default |
| **Permission** | PARTICIPANT; 404 otherwise |
| **Migration** | **No** — read `Reaction` where `entityType=MESSAGE` |

---

### 6. `addMessageReaction`

| Field | Detail |
|-------|--------|
| **Endpoint** | `POST /conversations/{conversationId}/messages/{messageId}/reactions` |
| **Request DTO** | `CreateMessageReactionRequest` — required `emoji` (1–32) |
| **Response DTO** | `MessageReaction` (`id`, `messageId`, `userId`, `emoji`, `createdAt`) |
| **Event** | `message.reacted.v1` |
| **Cache** | Prefer no inbox invalidate; optional conversation meta only |
| **Permission** | PARTICIPANT |
| **Migration** | **Likely no** if mapping `emoji` → existing `Reaction.emoji` + `ReactionType`. **Gap:** Prisma `ReactionType` is a fixed enum (LOVE/FIRE/…) while OpenAPI is freeform emoji — implementors must map or request Freeze/schema amendment before inventing tables |

---

### 7. `removeMessageReaction`

| Field | Detail |
|-------|--------|
| **Endpoint** | `DELETE /conversations/{conversationId}/messages/{messageId}/reactions/{reactionId}` |
| **Request DTO** | — |
| **Response DTO** | `204` |
| **Event** | None in matrix (optional `message.reaction.removed.v1` needs amendment). **9.2 ship: omit or amend** |
| **Cache** | Same as add |
| **Permission** | Reaction owner (or mod when Groups exist) |
| **Migration** | **No** |

---

### 8. `bookmarkMessage`

| Field | Detail |
|-------|--------|
| **Endpoint** | `POST /conversations/{conversationId}/messages/{messageId}/bookmark` |
| **Request DTO** | — |
| **Response DTO** | `204` |
| **Event** | None in EVENT_MATRIX — **side-effect only / amend later**; do not invent silently for Notification |
| **Cache** | No conversation inbox invalidate required (user-private bookmark list) |
| **Permission** | PARTICIPANT |
| **Migration** | **No** — `Bookmark` + `MESSAGE` |

---

### 9. `unbookmarkMessage`

| Field | Detail |
|-------|--------|
| **Endpoint** | `DELETE /conversations/{conversationId}/messages/{messageId}/bookmark` |
| **Request DTO** | — |
| **Response DTO** | `204` |
| **Event** | — |
| **Cache** | Invalidate optional `bookmark:user:{userId}` if introduced; not required by Freeze catalog |
| **Permission** | Own bookmark |
| **Migration** | **No** |

---

### 10. `listMessageBookmarks`

| Field | Detail |
|-------|--------|
| **Endpoint** | `GET /messages/bookmarks` |
| **Request DTO** | Query: `Cursor`, `Limit` |
| **Response DTO** | `MessagePage` |
| **Event** | — |
| **Cache** | Optional user bookmark page key; never cache other users’ bookmarks |
| **Permission** | Authenticated user — **own** bookmarks only; each message still filtered by conversation access (skip inaccessible → or 404 per item policy: prefer omit) |
| **Migration** | **No** |

---

### 11. `reportMessage`

| Field | Detail |
|-------|--------|
| **Endpoint** | `POST /conversations/{conversationId}/messages/{messageId}/report` |
| **Request DTO** | `ReportMessageRequest` — required `reasonId` (uuid); optional `description` (max 2000) |
| **Response DTO** | `MessageReportReceipt` — `reportId`, `createdAt` |
| **Event** | Not in Communication event catalog — Moderation domain may consume via its own pipeline; Communication **publish-only** if an event is added later. **9.2 minimum:** persist `Report` with `ModerationEntityType.MESSAGE` |
| **Cache** | None |
| **Permission** | PARTICIPANT (or authenticated with message visibility); 404 if no access |
| **Migration** | **No** — `Report` / `ReportReason` exist with `MESSAGE` |

---

### 12. `listMyMentions`

| Field | Detail |
|-------|--------|
| **Endpoint** | `GET /messages/mentions` |
| **Request DTO** | Query: `Cursor`, `Limit` |
| **Response DTO** | `MentionPage` → items: `Mention` |
| **Event** | — (read). Write path: EVENT_MATRIX “mentions side-effects” on message create/update in 9.2 — parse `@` / explicit mentions into `Mention` rows (`entityType=MESSAGE`). **No separate create-mention REST op in OpenAPI** |
| **Cache** | Optional `mention:user:{userId}` first page; invalidate on new mention write |
| **Permission** | Authenticated — **own** `targetId` only |
| **Migration** | **No** — `Mention` exists |

---

## Summary matrix

| # | operationId | Method | Path | Migration |
|---|-------------|--------|------|-----------|
| 1 | `updateMessage` | PATCH | `/conversations/{conversationId}/messages/{messageId}` | No |
| 2 | `deleteMessage` | DELETE | same | No |
| 3 | `likeMessage` | POST | `.../like` | No |
| 4 | `unlikeMessage` | DELETE | `.../like` | No |
| 5 | `listMessageReactions` | GET | `.../reactions` | No |
| 6 | `addMessageReaction` | POST | `.../reactions` | No* |
| 7 | `removeMessageReaction` | DELETE | `.../reactions/{reactionId}` | No |
| 8 | `bookmarkMessage` | POST | `.../bookmark` | No |
| 9 | `unbookmarkMessage` | DELETE | `.../bookmark` | No |
| 10 | `listMessageBookmarks` | GET | `/messages/bookmarks` | No |
| 11 | `reportMessage` | POST | `.../report` | No |
| 12 | `listMyMentions` | GET | `/messages/mentions` | No |

\*Emoji ↔ `ReactionType` mapping must be decided without inventing tables; if product requires arbitrary Unicode emoji as first-class keys beyond current enum, that is a **Freeze/schema amendment**, not silent migration scope creep.

---

## Events for Sprint 9.2 (normative)

| Event | Ops |
|-------|-----|
| `message.updated.v1` | `updateMessage` |
| `message.deleted.v1` | `deleteMessage` |
| `message.liked.v1` | `likeMessage` |
| `message.reacted.v1` | `addMessageReaction` |

Mention persistence is a **side-effect** of message write paths in 9.2 (per EVENT_MATRIX), not a new public write endpoint.

---

## North Star alignment

| Slice | North Star Question |
|-------|---------------------|
| Edit / soft-delete | Yes — trustworthy conversations |
| Like / reaction / bookmark | Yes — expression inside gaming conversations |
| Report | Yes — trust / community safety |
| Mention inbox | Yes — connection / belonging |

Must **not** turn Communication into a generic reaction farm or notification engine (publish-only; Notification stays a consumer).

---

## Explicit non-scope (reminder)

| Topic | Why excluded |
|-------|----------------|
| Group conversation create / member add-remove | OpenAPI **9.3** + `future` |
| Channels / Groups aggregates | Freeze + OpenAPI 9.3; DB Freeze amendment |
| `conversation.member.*` / `conversation.archived.v1` | Not in EVENT_MATRIX; archive/mute remain `conversation.updated.v1` (9.1) |
| Forward, threads, pins, polls, voice, rich cards | `future` / other sprints |

---

## Implementation readiness

| Gate | Status |
|------|--------|
| OpenAPI 9.2 surface defined | ✅ 12 ops |
| Prisma tables for engagement | ✅ Like / Reaction / Bookmark / Mention / Report |
| New Prisma models required | ❌ None for baseline 9.2 |
| Reaction emoji vs `ReactionType` | ⚠️ Design decision before coding |
| Unliked / unreacted / bookmark events | ⚠️ Missing in matrix — omit or amend Freeze |
| Prior false start (“Conversation Groups”) | ❌ Not Sprint 9.2 |

---

## Stop

This document is the **planning SSOT for Sprint 9.2 scope**.  
No code, migrations, or OpenAPI changes were made.

Next implementation sprint (when approved) must implement **exactly these 12 operations** and nothing else.
