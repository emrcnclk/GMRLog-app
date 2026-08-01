# Sprint 9.1 — Conversation Core — Implementation Report

**Sprint:** 9.1 — Communication Module v1 — Conversation Core  
**Date:** 2026-07-18  
**Status:** **COMPLETE — Awaiting architecture review**  
**Authority:** Communication Platform Freeze v1.0  
**Next:** Do **not** start Sprint 9.2 until review approves

---

## Scope delivered (Freeze 9.1 slice only)

| operationId | Method / path | Status |
|-------------|----------------|--------|
| `listConversations` | GET `/conversations` | ✅ |
| `createConversation` | POST `/conversations` | ✅ DIRECT only |
| `getConversation` | GET `/conversations/{id}` | ✅ |
| `updateConversation` | PATCH `/conversations/{id}` | ✅ title / archived / muted |
| `leaveConversation` | DELETE `/conversations/{id}` | ✅ leave ≠ delete |
| `listConversationParticipants` | GET `.../participants` | ✅ |
| `listMessages` | GET `.../messages` | ✅ |
| `sendMessage` | POST `.../messages` | ✅ TEXT only |
| `getMessage` | GET `.../messages/{id}` | ✅ |

**Not implemented (correctly out of scope):** Groups, Channels, Threads, Reactions, Likes, Bookmarks, Mentions, Typing, Presence, WebSocket, Voice, Attachments, Rich MessageType, Polls, AI, Notifications, Search, message edit/delete REST.

---

## Module layout

`apps/api/src/communication/`

- `communication.module.ts` — registered in `AppModule`
- `conversations.controller.ts` — thin; zero authz
- `conversation.service.ts` / `conversation-query.service.ts`
- `conversation.repository.ts` / `conversation-query.repository.ts`
- `conversation-permission.service.ts` / `conversation-visibility.service.ts`
- `conversation-cache.service.ts`
- mapper / dto / entities / constants / cursor / exceptions

---

## Freeze decisions honored

| Decision | Implementation |
|----------|----------------|
| Leave ≠ Delete | `DELETE` sets `leftAt`; event `conversation.participant.left.v1`; no `conversation.deleted.v1` |
| Block → 404 | Create/access deny uses `CONVERSATION_NOT_FOUND` |
| O(N) cache ban | DIRECT: O(1) inbox keys; N>2 → `inboxVersion` bump only |
| TEXT only | `messageType` non-TEXT → 400 validation |
| Publish-only | `DomainEventPublisher`; no Notification/Search/AI calls |

### Events emitted (9.1)

- `conversation.created.v1`
- `conversation.updated.v1`
- `conversation.participant.left.v1`
- `message.created.v1`

**Not emitted** (Freeze / out of sprint): `conversation.deleted.v1`, `message.updated.v1`, `message.deleted.v1`, `conversation.left.v1` (alias rejected — use `participant.left`).

---

## AuthZ / Visibility

- `ConversationPermissionService` uses **`ContainerPermissionService.resolveRole`** (membership → `VIEWER`); missing access → **404** (never private 403).
- `ConversationVisibilityService` uses **`ContainerVisibilityResolver.canView`** with `PRIVATE` + `isMember: true`, plus **`BlockService`**.
- Shared fix: `ContainerVisibilityResolver` now evaluates **member before mute** so Communication mute semantics (read allowed, notify off) work.

---

## Schema patch

Migration `20260718050000_communication_member_flags`:

- `conversation_members.is_archived`
- `conversation_members.is_muted`

Required for OpenAPI `UpdateConversation` / per-user archive-mute (not inventing new aggregates).

---

## Cache keys

| Key | Use |
|-----|-----|
| `conversation:{id}` | Conversation DTO |
| `conversation:user:{userId}` | Inbox first page |
| `conversation:{id}:inboxVersion` | Lazy GROUP path (guard for N>2) |

Message history is **not** cached.

---

## Tests

| Suite | Result |
|-------|--------|
| Unit (`conversation.service`, `permission`, `cache`) | ✅ 10 |
| Integration (`conversation.integration.spec`) | ✅ 1 |
| E2E (`test/conversations.e2e-spec.ts`) | ✅ 1 |

---

## Quality gates

| Gate | Result |
|------|--------|
| `prisma validate` | ✅ |
| `prisma migrate deploy` (member flags) | ✅ |
| `@gmrlog/api` typecheck | ✅ |
| `@gmrlog/api` build | ✅ |
| ESLint (`src/communication/**`, e2e) | ✅ |
| Unit + integration + e2e (Communication) | ✅ |

**Note:** Full-repo `pnpm --filter @gmrlog/api lint` still reports **pre-existing** import/order and other errors outside Communication (e.g. achievements). Communication module lint is clean. Full monorepo lint cleanup is out of Sprint 9.1 scope.

---

## Explicit non-goals / deferred

- Sprint 9.2 Messaging (edit/delete/react/bookmark/report)
- Groups / Channels (9.3) — `GroupMember` → `ConversationMember` sync not exercised (DIRECT only)
- WebSocket (9.4), read receipts (9.5)

---

## Stop

Sprint 9.1 complete. **Await architecture review before Sprint 9.2.**
