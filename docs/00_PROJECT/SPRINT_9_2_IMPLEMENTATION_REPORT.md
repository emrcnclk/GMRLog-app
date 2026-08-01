# Sprint 9.2 — Message Engagement — Implementation Report

**Sprint:** 9.2 — Communication Message Engagement  
**Date:** 2026-07-18  
**Status:** **COMPLETE — Awaiting architecture review**  
**Authority:** [`SPRINT_9_2_SCOPE_REPORT.md`](./SPRINT_9_2_SCOPE_REPORT.md)  
**Next:** Do **not** start Sprint 9.3 until review approves

---

## Scope delivered (12 / 12 Scope Report ops)

| operationId | Status |
|-------------|--------|
| `updateMessage` | ✅ |
| `deleteMessage` | ✅ |
| `likeMessage` | ✅ |
| `unlikeMessage` | ✅ (no event — Scope Report) |
| `listMessageReactions` | ✅ |
| `addMessageReaction` | ✅ |
| `removeMessageReaction` | ✅ (no event — Scope Report) |
| `bookmarkMessage` | ✅ |
| `unbookmarkMessage` | ✅ |
| `listMessageBookmarks` | ✅ |
| `reportMessage` | ✅ |
| `listMyMentions` | ✅ |

**Mention side-effect:** `@username` parsed on `sendMessage` / `updateMessage` → `Mention` rows (`entityType=MESSAGE`).

---

## Implementation notes

| Topic | Decision |
|-------|----------|
| Storage | Polymorphic Social tables: `Like` / `Reaction` / `Bookmark` / `Mention` / `Report` + `MESSAGE` |
| Migration | **None** (no new models) |
| Emoji ↔ ReactionType | Fixed map to Freeze enum only; unknown emoji → 400 |
| Events | `message.updated.v1`, `message.deleted.v1`, `message.liked.v1`, `message.reacted.v1` only |
| Cache | Edit/delete use existing DIRECT fan-out / inboxVersion rules; like/react prefer no inbox DEL |
| AuthZ | Participant access via existing permission/visibility; sender-only edit/delete; block → 404 |
| Controllers | `ConversationsController` + `MessagesController` (`/messages/bookmarks`, `/messages/mentions`) |

### New / updated files

- `message-engagement.service.ts` / `.repository.ts` / `.dto.ts` / `.spec.ts`
- `messages.controller.ts`
- Extended: `conversations.controller.ts`, `conversation.service.ts`, `conversation.repository.ts`, `conversation.constants.ts`, `conversation.exceptions.ts`, `communication.module.ts`
- E2E: `test/message-engagement.e2e-spec.ts`

---

## Explicit non-goals (honored)

Groups/Channels, threads, pins, polls, voice, rich messages, WebSocket, Notification wiring, future events (`unliked`, `member.*`), new Prisma enums/tables.

---

## Quality gates

| Gate | Result |
|------|--------|
| typecheck | ✅ |
| build | ✅ |
| eslint (`src/communication/**`, engagement e2e) | ✅ |
| unit + integration (communication) | ✅ 17 |
| e2e (`message-engagement.e2e-spec.ts`) | ✅ |
| prisma validate | ✅ (with project `.env`) |
| New migrations | None |

---

## Stop

Sprint 9.2 complete. **Await architecture review before Sprint 9.3.**
