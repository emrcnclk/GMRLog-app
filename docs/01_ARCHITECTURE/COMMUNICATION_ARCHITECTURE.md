# Communication Architecture

**Document:** `docs/01_ARCHITECTURE/COMMUNICATION_ARCHITECTURE.md`  
**Status:** **Frozen — Communication Platform Freeze v1.0** (Sprint 9.0.1)  
**SSOT contract:** [`COMMUNICATION_API.yaml`](../08_API/COMMUNICATION_API.yaml)  
**Freeze declaration:** [`COMMUNICATION_PLATFORM_FREEZE_v1.md`](../00_PROJECT/COMMUNICATION_PLATFORM_FREEZE_v1.md)  
**Related:** [ADR_Communication_Platform.md](./ADR/ADR_Communication_Platform.md)

---

## Purpose

GMRLOG Communication is the **platform communication bounded context**: direct messages, group chats, channels, rich messages, threads, reactions, polls, LFG, and future WebSocket / AI surfaces.

It is **not** a thin “Messaging” feature bolted onto Social.

---

## Bounded context

```text
Communication
  ├── Conversations (DIRECT | GROUP-backed)
  ├── Participants (ConversationMember)
  ├── Messages (+ soft delete)
  ├── Engagement (like, reaction, bookmark, mention, report)
  ├── Threads / Pins / Polls          [Freeze v1.1 / Sprint 9.3]
  ├── Groups / Members / Invites      [Freeze v1.1 / Sprint 9.3]
  ├── Channels (+ LFG, announcements) [Freeze v1.1 / Sprint 9.3]
  ├── Attachments API                 [Sprint 9.4 MVP]
  ├── Realtime WebSocket adapter      [Sprint 9.5 — proposed]
  └── VoiceRooms                      [Deferred after MVP — Phase 2 / Voice Platform]
```

**Must NOT own:** Notification delivery, Feed materialization, Search indexing, Moderation admin UI, User profile editing. Those consume **domain events**.

---

## Aggregate map

| Aggregate | Root | Notes |
|-----------|------|--------|
| Conversation | `Conversation` | Contains members + message stream |
| Message | `Message` | Belongs to one conversation |
| Group | `Group` (future) | Owns channels; each channel links a Conversation |
| Channel | `Channel` (future) | `conversationId` bridge |
| Poll | `Poll` (future) | Optionally linked to a Message |

```text
Group
 └── Channel ──conversationId──► Conversation
                                   ├── ConversationMember[]
                                   └── Message[]
                                         ├── reads / attachments (DB Freeze)
                                         └── likes / reactions / bookmarks / mentions (shared social tables)
```

DIRECT chats: `Conversation.type=DIRECT`, no Group/Channel.

---

## Normative decision — Leave ≠ Delete (Freeze v1.0)

| Operation | HTTP | Effect | Event |
|-----------|------|--------|-------|
| **Leave** | `DELETE /conversations/{id}` | Sets caller `ConversationMember.leftAt` | `conversation.participant.left.v1` |
| **Archive / mute** | `PATCH /conversations/{id}` | Per-user flags only | `conversation.updated.v1` |
| **Soft-delete message** | `DELETE .../messages/{id}` | Sets `Message.deletedAt` | `message.deleted.v1` |
| **Destroy conversation** | — | **No public API** in 9.1–9.6 | `conversation.deleted.v1` reserved for rare system/admin cleanup only |

Implementors MUST NOT treat leave as aggregate delete. Messages remain durable for remaining participants.

---

## Normative decision — GroupMember → ConversationMember ownership (Freeze v1.0)

| Concern | Source of truth | Derived |
|---------|-----------------|---------|
| Group membership & roles (`OWNER` / `MODERATOR` / `MEMBER`) | **`GroupMember`** | — |
| Channel write eligibility by role / channel kind | **GroupRole + Channel policy** | — |
| Message stream participation (`leftAt`, inbox presence) | — | **`ConversationMember`** on the channel’s Conversation |

**Sync rules (9.3+):**

1. Channel create → create Conversation + seed `ConversationMember` for current group members who can access that channel.
2. User joins group → add `ConversationMember` to accessible channel conversations.
3. User leaves / is kicked from group → set `leftAt` on all of that group’s channel conversations for that user.
4. Role change → does **not** rewrite `ConversationMember`; authorization re-reads `GroupMember.role` at write time.
5. DIRECT conversations never use `GroupMember`.

Until Groups land, 9.1 only manages `ConversationMember` directly for DIRECT chats.

---

## Normative decision — Engagement ownership

| Entity | Table owner | Communication role |
|--------|-------------|-------------------|
| Like / Reaction / Bookmark / Mention / Report (`entityType=MESSAGE`) | Shared Social tables | Communication **writes** on message engagement paths; Social owns non-message entities |
| Rich share cards (`REVIEW_SHARE`, …) | Foreign aggregate ids in payload | Communication stores transport only — never loads Review/List domain into this BC |

---

## Layering (implementation target)

Same modular monolith pattern as Lists / Tier Lists:

```text
Controller (thin)
  → QueryService / Service
    → Repository / QueryRepository
      → Prisma
Mapper (DTO boundary)
Cache (targeted keys — see cache strategy; O(N) fan-out banned)
DomainEventPublisher (publish only)
```

Authorization uses a **participant / group-role** model — not Container owner semantics.

---

## CQRS shape

| Side | Responsibility |
|------|----------------|
| Write | `ConversationService`, `MessageService`, group/channel services |
| Read | `ConversationQueryService`, `MessageQueryService`, discover queries |
| Projection | Optional later for unread badges / search via events |

---

## Composition

- Reuse `UserSummary` schema and shared ProblemDetails.
- Reuse social `Like` / `Reaction` / `Bookmark` / `Mention` / `Report` where `entityType=MESSAGE`.
- Do **not** subclass Collection/List container services for DM.
- Realtime is a **separate adapter** (Sprint 9.4) subscribed to the same events.

---

## DB Freeze vs contract

| DB Freeze today | Contract today |
|-----------------|----------------|
| Conversation, ConversationMember, Message, MessageRead, MessageAttachment, TypingStatus | Core REST in COMMUNICATION_API |
| — | Groups, Channels, Threads, Pins, Polls, Voice (`x-gmrlog-status: future`) |

TypingStatus has **no REST** path — WebSocket only.

---

## Sprint map (scope-locked)

Amended by [`SPRINT_9_4_ARCHITECTURE_AMENDMENT.md`](../00_PROJECT/SPRINT_9_4_ARCHITECTURE_AMENDMENT.md) (MVP scope). OpenAPI `x-gmrlog-sprint` tags remain normative for REST ops.

| Sprint | Focus | Normative for implementors |
|--------|--------|----------------------------|
| 9.0 | Bible + OpenAPI | Docs only |
| **9.0.1** | Bible revision + Freeze v1.0 | Docs only |
| **9.1** | Conversation Core | **Only** ops with `x-gmrlog-sprint: '9.1'` and not `future`; message write = TEXT |
| 9.2 | Messaging core (edit/delete/react/bookmark/report/mentions) | See tags |
| 9.3 | Groups & channels (+ threads/pins/polls) | Freeze v1.1 + OpenAPI 9.3 tags |
| **9.4** | **Message Attachments** | **Only** Attachments ops with `x-gmrlog-sprint: '9.4'` (MVP); Voice **out of scope** |
| **9.5** | **Realtime Foundation** (WebSocket gateway) | Proposed — adapter subscribes to domain events; typing/presence WS-only |
| 9.6 | Presence + read receipts (REST) | OpenAPI currently tags `markMessagesRead` as `9.5` — retag cascade required (see amendment) |
| 9.7 | Search / forward / audit | Was Architecture 9.6; OpenAPI `searchConversationMessages` / `forwardMessage` today tagged `9.6` |
| **Phase 2** | **Voice Platform** | Deferred after MVP; VoiceRoom REST stays `future`; no Voice DB Freeze in Communication MVP |

### Sprint 9.1 explicit non-goals

Groups, channels, threads, pins, polls, reactions, likes, bookmarks, mentions, rich `MessageType`, message search, read receipts REST, WebSocket, attachments API, forward, voice.

### Sprint 9.4 explicit non-goals (MVP)

Voice rooms (get/open/close), Voice DB Freeze / Prisma VoiceRoom, WebSocket gateway, SFU/WebRTC, presence/read-receipt REST, inventing attachment events beyond Event Matrix amendment.

---

## Integrations (event-driven)

| Consumer | Interest |
|----------|----------|
| Notification | `message.created`, mentions, invites |
| Feed | Optional group announcement posts — never DM bodies |
| Search | Message body indexing (privacy-scoped); async queue — not sync on write |
| AI | Moderation / assist — async hydrate + ACL; never on hot path |
| Community / Indie Hub / Browser Games / Dev Portal | Share cards via rich `MessageType` (post-9.1) |
