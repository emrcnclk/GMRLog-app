# Communication Event Matrix

**Document:** `docs/03_EVENTS/COMMUNICATION_EVENT_MATRIX.md`  
**Status:** **Frozen — Communication Platform Freeze v1.0** (Sprint 9.0.1)  
**Contract:** `COMMUNICATION_API.yaml`  
**Bus:** domain events via `DomainEventPublisher` (v1 naming `*.v1`)

---

## Rules

1. Communication services **publish only** — no direct Notification / Feed / Analytics calls.
2. One primary mutation → one primary domain event (visibility/role changes may emit a second).
3. WebSocket gateway **subscribes** to the same events (Sprint 9.4); REST never emits sockets directly.
4. Payloads must not include secrets; DM bodies may be referenced by id for private consumers.
5. **Ordering key:** consumers that need per-conversation order MUST partition on `conversationId` (payload field).
6. **Idempotency:** consumers MUST treat `(type, aggregateId, occurredAt|eventId)` as idempotent; at-least-once delivery assumed.
7. **Hot path:** Search / AI MUST NOT run synchronously inside the publisher call; enqueue only.

---

## Leave vs delete events (Freeze v1.0)

| User action | Emit | Do NOT emit |
|-------------|------|-------------|
| Leave conversation (`DELETE /conversations/{id}`) | `conversation.participant.left.v1` | `conversation.deleted.v1` |
| Kick / remove participant (9.3) | `conversation.participant.left.v1` | `conversation.deleted.v1` |
| Archive / mute (PATCH) | `conversation.updated.v1` | leave / deleted |
| System/admin destroys conversation aggregate (no public API) | `conversation.deleted.v1` | — |

---

## Event catalog

| Event (logical) | Versioned name | Aggregate | Emitted when | Consumers (planned) |
|-----------------|----------------|-----------|--------------|---------------------|
| conversation.created | `conversation.created.v1` | Conversation | Create DM / channel conversation | Notification (optional), Search |
| conversation.updated | `conversation.updated.v1` | Conversation | Title / archive / mute | Clients via WS |
| conversation.deleted | `conversation.deleted.v1` | Conversation | **Aggregate destroy only** (system/admin) | Cache, WS |
| participant.joined | `conversation.participant.joined.v1` | Conversation | Member added | Notification, WS |
| participant.left | `conversation.participant.left.v1` | Conversation | Member left / kicked | WS, Cache |
| message.created | `message.created.v1` | Message | Send message | Notification, Search*, WS, AI* |
| message.updated | `message.updated.v1` | Message | Edit body | WS, Search* |
| message.deleted | `message.deleted.v1` | Message | Soft delete | WS, Search* |
| message.liked | `message.liked.v1` | Message | Like created | WS (optional), Notification |
| message.reacted | `message.reacted.v1` | Message | Emoji reaction | WS |
| message.pinned | `message.pinned.v1` | Message | Pin | WS |
| message.unpinned | `message.unpinned.v1` | Message | Unpin | WS |
| thread.created | `message.thread.created.v1` | Message | First reply / thread open | WS |
| group.created | `group.created.v1` | Group | Create group | Search, Notification |
| group.updated | `group.updated.v1` | Group | Metadata change | Search |
| group.deleted | `group.deleted.v1` | Group | Delete | Search, Cache |
| channel.created | `channel.created.v1` | Channel | Create channel | WS |
| channel.deleted | `channel.deleted.v1` | Channel | Delete channel | WS |
| poll.created | `poll.created.v1` | Poll | Create poll | WS |
| poll.voted | `poll.voted.v1` | Poll | Cast vote | WS |

\* Async queue consumers only.

---

## Payload guidelines

```json
{
  "type": "message.created.v1",
  "aggregateId": "<messageId>",
  "aggregateType": "Message",
  "actorId": "<senderId>",
  "payload": {
    "messageId": "...",
    "conversationId": "...",
    "messageType": "TEXT",
    "hasBody": true
  }
}
```

Prefer ids over full bodies for cross-domain consumers. Notification / AI workers fetch via internal query if needed (participant-scoped ACL).

---

## Explicit non-events (REST era)

| Concern | Transport |
|---------|-----------|
| typing started/stopped | WebSocket only |
| presence online/offline | WebSocket / presence service |
| delivery ACK | WebSocket |

---

## Sprint availability

| Sprint | Events live |
|--------|-------------|
| 9.1 | `conversation.created`, `conversation.updated`, `conversation.participant.left`, `message.created` |
| 9.2 | `message.updated` / `deleted` / `liked` / `reacted` + mentions side-effects |
| 9.3 | `group.*`, `channel.*`, `thread.*`, pin.*, `poll.*`, `participant.joined` |
| 9.4+ | WS projections of the same matrix |
