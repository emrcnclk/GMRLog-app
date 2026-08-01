# D2.13 Completion Report — Messaging Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-27  
**Scope:** Messaging domain MVP — D2.14 was not started.

---

## Dialect note

The sprint brief listed optional `DELETE message` and implied unread/attachment flows.

**S1 §13.11** (LOCKED) defines only:


| Method | Path                           | Auth |
| ------ | ------------------------------ | ---- |
| GET    | `/conversations`               | P    |
| GET    | `/conversations/{id}`          | P    |
| POST   | `/conversations`               | P    |
| POST   | `/conversations/{id}/messages` | P    |
| GET    | `/conversations/{id}/messages` | P    |


There is **no** `DELETE` message route in S1. Per “never invent endpoints / S1 wins”, message delete was not mounted (S2 soft-delete column exists for future governance).

Brief constraints honored: no websocket · realtime · notifications · typing · read receipts · attachments · edit · reactions · V2.

---

## 1. Files created

### Backend — `apps/backend/src/messaging/`


| File                                                             | Role                                           |
| ---------------------------------------------------------------- | ---------------------------------------------- |
| `messaging.module.ts`                                            | Domain module · exports repositories           |
| `messaging.tokens.ts`                                          | DI tokens                                      |
| `messaging.service.ts`                                           | Inbox · detail · create · list · send          |
| `messaging.controller.ts`                                        | S1 §13.11 routes (`@Controller('conversations')`) |
| `dto/messaging.dto.ts`                                           | Zod DTOs                                       |
| `mappers/messaging.mapper.ts`                                    | → `ConversationResponse` / `MessageResponse`   |
| `testing/fake-repositories.ts`                                   | Test fakes                                     |
| `messaging.service.spec.ts` · `messaging.controller.spec.ts`     | Tests                                          |


### Packages


| File                                                          | Change                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `packages/database/.../conversation.repository.ts`            | `create` · `findById` · `listByParticipant` · `touchLastMessage`       |
| `packages/database/.../conversation-participant.repository.ts` | `create` · `findByConversationAndUser` · `listByConversation`          |
| `packages/database/.../message.repository.ts`                 | `create` · `findActiveById` · `listByConversation` · `findLatestActiveByConversation` |
| `packages/database/.../repositories/index.ts`                   | exports                                                                |
| `packages/database/.../repositories.spec.ts`                    | Conversation · participant · message ordering / soft-delete          |
| `packages/types/src/index.ts`                                 | `MessageSummary` · `ConversationResponse` · `MessageResponse`        |
| `packages/validators/src/index.ts`                            | `conversationCreateSchema` · `messageCreateSchema` · path param      |


`app.module.ts` mounts `MessagingModule`.

---

## 2. Endpoint summary


| Method | Path                           | Auth | Behavior                                                                 |
| ------ | ------------------------------ | ---- | ------------------------------------------------------------------------ |
| GET    | `/conversations`               | P    | `ConversationResponse[]` inbox · `lastMessageAt` order                   |
| POST   | `/conversations`               | P    | Start conversation · actor + `participantUserIds` · 201                  |
| GET    | `/conversations/{id}`          | P    | `ConversationResponse` · participant-only · non-participant **404**      |
| GET    | `/conversations/{id}/messages` | P    | `MessageResponse[]` · active rows oldest→newest · `media: null`          |
| POST   | `/conversations/{id}/messages` | P    | Send message · returns updated `ConversationResponse` (S1) · 201         |


---

## 3. Repository summary

- **ConversationRepository** — create; findById; listByParticipant (inbox: `lastMessageAt` → `updatedAt` → `id` desc); touchLastMessage.
- **ConversationParticipantRepository** — create; findByConversationAndUser; listByConversation (createdAt asc).
- **MessageRepository** — create; findActiveById; listByConversation (active only, createdAt asc); findLatestActiveByConversation.

Persistence only — no notification or unread counter writes.

---

## 4. Service summary

- **listConversations** — actor inbox; projects participants · lastMessage · `unreadCount: 0`.
- **getConversation** — participant gate; fail-closed 404 for unknown or non-member.
- **createConversation** — dedupe actor + `participantUserIds`; min two participants; `direct` vs `group` kind; validate users exist.
- **listMessages** — participant gate; excludes soft-deleted messages.
- **sendMessage** — rejects `mediaUploadIds`; creates message; touches `lastMessageAt`; returns conversation projection.

---

## 5. Validation summary

| Schema                     | Rules                                                                 |
| -------------------------- | --------------------------------------------------------------------- |
| `conversationCreateSchema` | `participantUserIds`: min 1 OpaqueId                                  |
| `messageCreateSchema`      | `body`: trim · min 1 · max 5000; `mediaUploadIds` optional (rejected in service) |
| `conversationIdParamSchema` | `{ id }` OpaqueId path param                                          |

---

## 6. Test summary

- Repository: inbox ordering · participant ordering · message ordering · soft-delete exclusion · latest message
- Service: inbox isolation · participant-only 404 · create direct · self-only 400 · unknown user 404 · list/send · media rejection
- Controller: 401 guests · envelope/`requestId` · 201 create/send · 400 validation/media · 404 non-participant
- Backend coverage — **210/210** tests
- Database coverage — **43/43** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.14+)

- `DELETE` message (not in S1 §13.11)
- Unread counter generation · `lastReadAt` product logic
- Message `media` / `mediaUploadIds` (uploads foundation)
- Websocket · realtime delivery · typing indicators · read receipts
- Message edit · reactions · attachments
- Notification generation on new messages
- Duplicate direct-conversation prevention (unless product-governed)
- `GET /activity` (Activity domain — separate S1 resource)

---

## Lock statement

**D2.13 Messaging Domain Foundation is LOCKED.**  
**D2.14 was not started.**
