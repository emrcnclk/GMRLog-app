# Sprint 9.3 — Scope Report (Planning Audit)

**Document:** `docs/00_PROJECT/SPRINT_9_3_SCOPE_REPORT.md`  
**Date:** 2026-07-18  
**Status:** Planning only — **no code**  
**Sprint working title (request):** Communication Message Experience  
**OpenAPI / Architecture title:** Groups & Channels (+ threads / pins / polls)

**SSOT precedence used:**

1. `NORTH_STAR.md`  
2. `COMMUNICATION_PLATFORM_FREEZE_v1.md`  
3. `COMMUNICATION_API.yaml`  
4. Existing implementation (9.1 + 9.2)

---

## Verdict

| Question | Answer |
|----------|--------|
| How many OpenAPI ops tagged `x-gmrlog-sprint: '9.3'`? | **32** |
| How many are `x-gmrlog-status: future`? | **32 / 32 (all)** |
| How many are implementable under Freeze v1.0 without DB amendment? | **0** |
| Existing code coverage of 9.3 ops | **0** (9.1 Conversation Core + 9.2 Message Engagement only) |
| Prisma models for Group / Channel / Pin / Poll / `parentMessageId` | **Absent** |

**Gate:** Sprint 9.3 **cannot** ship code until a **Database Freeze amendment** adds Group / GroupMember / GroupInvite / Channel / Pin / Poll (and Message thread column), and Freeze change-control clears or retains `future` flags intentionally.

This report inventories the OpenAPI 9.3 surface for review. It does **not** authorize implementation.

---

## Existing implementation vs OpenAPI (baseline)

| Area | Implemented today | OpenAPI 9.3 |
|------|-------------------|-------------|
| DIRECT conversations + TEXT messages | ✅ 9.1 | — |
| Message engagement (edit/delete/like/react/bookmark/report/mentions) | ✅ 9.2 | — |
| `POST/DELETE .../participants` (add/remove) | ❌ | 9.3 + **future** |
| Threads / pins / polls | ❌ | 9.3 + **future** |
| `/groups/**` + `/channels/**` | ❌ | 9.3 + **future** |

Leave ≠ delete, block → 404, O(N) cache ban, publish-only events remain binding for any future 9.3 work.

---

## Sprint 9.3 operation list (complete)

All rows: `x-gmrlog-sprint: '9.3'` **and** `x-gmrlog-status: future`.

### A. Conversation participants (group-backed)

| # | operationId | Method | Endpoint |
|---|-------------|--------|----------|
| 1 | `addConversationParticipant` | POST | `/conversations/{conversationId}/participants` |
| 2 | `removeConversationParticipant` | DELETE | `/conversations/{conversationId}/participants/{userId}` |

### B. Threads

| # | operationId | Method | Endpoint |
|---|-------------|--------|----------|
| 3 | `replyToMessage` | POST | `/conversations/{conversationId}/messages/{messageId}/replies` |
| 4 | `getMessageThread` | GET | `/conversations/{conversationId}/messages/{messageId}/thread` |

### C. Pins

| # | operationId | Method | Endpoint |
|---|-------------|--------|----------|
| 5 | `pinMessage` | POST | `/conversations/{conversationId}/messages/{messageId}/pin` |
| 6 | `unpinMessage` | DELETE | `/conversations/{conversationId}/messages/{messageId}/pin` |
| 7 | `listPinnedMessages` | GET | `/conversations/{conversationId}/pins` |

### D. Polls

| # | operationId | Method | Endpoint |
|---|-------------|--------|----------|
| 8 | `createPoll` | POST | `/conversations/{conversationId}/polls` |
| 9 | `getPoll` | GET | `/conversations/{conversationId}/polls/{pollId}` |
| 10 | `castPollVote` | POST | `/conversations/{conversationId}/polls/{pollId}/votes` |
| 11 | `retractPollVote` | DELETE | `/conversations/{conversationId}/polls/{pollId}/votes` |

### E. Groups

| # | operationId | Method | Endpoint |
|---|-------------|--------|----------|
| 12 | `listMyGroups` | GET | `/groups` |
| 13 | `createGroup` | POST | `/groups` |
| 14 | `discoverGroups` | GET | `/groups/discover` |
| 15 | `getGroup` | GET | `/groups/{groupId}` |
| 16 | `updateGroup` | PATCH | `/groups/{groupId}` |
| 17 | `deleteGroup` | DELETE | `/groups/{groupId}` |
| 18 | `joinGroup` | POST | `/groups/{groupId}/join` |
| 19 | `leaveGroup` | POST | `/groups/{groupId}/leave` |
| 20 | `listGroupInvites` | GET | `/groups/{groupId}/invites` |
| 21 | `createGroupInvite` | POST | `/groups/{groupId}/invites` |
| 22 | `acceptGroupInvite` | POST | `/groups/invites/{token}/accept` |
| 23 | `listGroupMembers` | GET | `/groups/{groupId}/members` |
| 24 | `updateGroupMemberRole` | PATCH | `/groups/{groupId}/members/{userId}` |
| 25 | `removeGroupMember` | DELETE | `/groups/{groupId}/members/{userId}` |

### F. Channels (+ channel messages)

| # | operationId | Method | Endpoint |
|---|-------------|--------|----------|
| 26 | `listChannels` | GET | `/groups/{groupId}/channels` |
| 27 | `createChannel` | POST | `/groups/{groupId}/channels` |
| 28 | `getChannel` | GET | `/groups/{groupId}/channels/{channelId}` |
| 29 | `updateChannel` | PATCH | `/groups/{groupId}/channels/{channelId}` |
| 30 | `deleteChannel` | DELETE | `/groups/{groupId}/channels/{channelId}` |
| 31 | `listChannelMessages` | GET | `/groups/{groupId}/channels/{channelId}/messages` |
| 32 | `sendChannelMessage` | POST | `/groups/{groupId}/channels/{channelId}/messages` |

---

## DTOs (OpenAPI schemas)

| Cluster | Request | Response (primary) |
|---------|---------|-------------------|
| Participants | `AddParticipantRequest` (`userId`) | `ConversationParticipant` / `204` |
| Thread reply | `CreateMessageRequest` (with `parentMessageId` future field) | `Message` |
| Thread list | Cursor + Limit | `MessagePage` |
| Pin | — | `204` / `PinnedMessagePage` |
| Poll | `CreatePollRequest` (`question`, `options` 2–10, `endsAt?`) | `Poll` / vote `204` |
| Group | `CreateGroupRequest` (`name`, `visibility`, …); `UpdateGroupRequest` | `Group` / pages |
| Invite | invite create schema (token flow) | invite / group |
| Member role | role update body (`OWNER` / `MODERATOR` / `MEMBER`) | member DTO / `204` |
| Channel | `CreateChannelRequest` (`kind`, `name`); `UpdateChannelRequest` | `Channel` |
| Channel messages | `CreateMessageRequest` | `Message` / `MessagePage` |

Enums (all marked future in contract): `GroupVisibility`, `GroupMemberRole`, `ChannelKind`.

---

## Permission (from Permission / Visibility matrices)

| Cluster | AuthZ summary |
|---------|----------------|
| Add/remove conversation participant | GROUP_MOD / GROUP_OWNER (not arbitrary PARTICIPANT); DIRECT fixed at 2 — reject |
| Thread reply / read | Active channel/conversation **PARTICIPANT** (derived `ConversationMember`); block → **404** |
| Pin / unpin / list pins | MOD/OWNER (member pin only if product flag); else 403 on role miss, 404 if non-member |
| Poll create/vote | PARTICIPANT where channel allows; close early → MOD/OWNER |
| Group CRUD / discover | OWNER for delete/transfer; PUBLIC join self; PRIVATE/INVITE_ONLY invite path; discover omits PRIVATE/HIDDEN |
| Group member role / kick | OWNER (role); MOD may kick MEMBER |
| Channel CRUD | MOD/OWNER create; delete GENERAL restricted |
| Channel messages | Membership + channel kind (ANNOUNCEMENTS write MOD/OWNER) |
| Cross-cutting | Controllers: zero authz; GroupRole via `GroupMember` SoT; `ConversationMember` derived per Freeze sync rules |

ContainerPermissionService / ContainerVisibilityResolver remain for container-like checks where mapped; **GroupRole is not Container OWNER/EDITOR/VIEWER** — domain permission facade required.

---

## Events (EVENT_MATRIX — Sprint 9.3)

| Event | Typical ops |
|-------|-------------|
| `conversation.participant.joined.v1` | add participant / channel seed / join sync |
| `conversation.participant.left.v1` | remove/kick (also leave — already 9.1) |
| `group.created.v1` / `group.updated.v1` / `group.deleted.v1` | group writes |
| `channel.created.v1` / `channel.deleted.v1` | channel writes |
| `message.thread.created.v1` | first reply / thread open |
| `message.pinned.v1` / `message.unpinned.v1` | pin ops |
| `poll.created.v1` / `poll.voted.v1` | poll ops |
| `message.created.v1` | channel send / reply (reuse) |

Publish-only; no direct Notification/Search/AI calls. Ordering key: `conversationId` where applicable.

---

## Cache

| Key / rule | Use in 9.3 |
|------------|------------|
| `group:{id}`, `group:list:{userId}` | Group mutations — bounded member list invalidate; **not** O(N) on every message |
| `channel:{id}` | Channel CRUD |
| `conversation:{id}` + `inboxVersion` | Channel-backed conversations; message send → **bump inboxVersion**, never O(N) `conversation:user:*` |
| `poll:{id}` | Poll create/vote |
| Pin / reaction-like | Prefer no inbox fan-out; bump version only if preview shows pins |
| Message history | **Still never cached** |

Global flush forbidden.

---

## Validation (contract-level)

| Area | Rules |
|------|--------|
| Group name | 2–80; visibility required on create |
| Channel name | 1–80; `ChannelKind` required |
| Poll | question 1–500; options 2–10; option length ≤ 200 |
| Participant add | UUID `userId`; conversation must be GROUP-backed |
| Thread | `parentMessageId` required for reply semantics; Freeze column missing today |
| Invites | token accept; PRIVATE/INVITE_ONLY join gates |
| Messages | TEXT (and later types per Freeze); same body max as 9.1/9.2 |
| Discover | PUBLIC only listing; anon allowed on discover path (`security: []`) — rate-limit scrape |

---

## Migration required?

| Artifact | In DB today? | Needed for 9.3? |
|----------|--------------|-----------------|
| `Conversation` / `ConversationMember` / `Message` | ✅ | Extend for threads |
| `Message.parentMessageId` (or Thread table) | ❌ | **Yes** |
| `Group`, `GroupMember`, `GroupInvite` | ❌ | **Yes** |
| `Channel` (`conversationId` bridge) | ❌ | **Yes** |
| Pin entity / junction | ❌ | **Yes** |
| `Poll`, `PollVote` | ❌ | **Yes** |
| Voice rooms | ❌ | Out of 9.3 REST list (separate future voice paths) |

**Conclusion:** Migration / Database Freeze amendment is **mandatory** before any 9.3 implementation. No silent Prisma model invention outside that amendment.

---

## Freeze uyumu

| Freeze rule | 9.3 implication |
|-------------|-----------------|
| Groups/Channels/Threads/Pins/Polls not in DB Freeze | **Blocked** until amendment |
| `x-gmrlog-status: future` on all 32 ops | Non-shippable appendix until status cleared via Freeze change-control |
| GroupMember → ConversationMember ownership | Channel create/join/leave **must** sync derived members |
| Leave ≠ Delete | Group/channel delete ≠ conversation leave semantics |
| Block → 404 | Private channel/DM access unchanged |
| O(N) cache ban | Channel message hot path uses `inboxVersion` |
| Architecture sprint map | “9.3 … Requires DB Freeze amendments” — confirmed |

North Star: Groups/channels/threads support “digital home” / communities **if** they stay gaming-culture spaces and do not become generic social spam; Forums as a separate Community product remain out of Communication transport (ADR).

---

## OpenAPI uyumu

| Check | Result |
|-------|--------|
| Operation count tagged 9.3 | 32 |
| All marked `future` | Yes |
| Normative (non-future) 9.3 ops | **0** |
| Voice room paths | Exist as future; **not** in 9.3 sprint tag set above |
| Forward / search / read receipts / WS | Other sprints (9.4–9.6) |

---

## Future olarak işaretlenen operationlar

**Entire Sprint 9.3 OpenAPI slice (32 ops)** — listed in the operation tables above.

Additionally future (not 9.3 sprint tag, or other tags): attachments, voice-room open/close, forwardMessage, message search, mark read, rich MessageType writes — **Sprint dışı** relative to 9.3.

---

## Sprint dışı operationlar (do not include in 9.3 implementation)

| Slice | Sprint / status |
|-------|-----------------|
| 9.1 Conversation Core (9 ops) | Done |
| 9.2 Message Engagement (12 ops) | Done |
| Realtime / typing / presence | 9.4–9.5 |
| Read receipts REST | 9.5 |
| Search / forward / audit | 9.6 |
| Voice rooms | future (not in 9.3 count) |
| Attachments API | future |
| Notification delivery / Feed / AI | Consumers only — never Communication write path |
| Invented “Message Experience” ops not in OpenAPI | Forbidden |

---

## Naming note (request vs SSOT)

Request title **“Communication Message Experience”** does **not** match OpenAPI/Architecture Sprint 9.3 (**Groups & Channels + threads/pins/polls**).  

Per precedence (Freeze → OpenAPI), this Scope Report treats **9.3 = Groups/Channels/Threads/Pins/Polls**. Any alternate “message experience” slice requires an explicit Freeze/OpenAPI amendment before planning code.

---

## Readiness checklist (for post-review implementation)

1. Database Freeze amendment (tables + indexes)  
2. Communication Platform Freeze bump (clear `future` or define phased 9.3.x)  
3. OpenAPI regenerate if schemas change  
4. Then implement only ops that are both tagged 9.3 **and** no longer `future` (or explicitly unlocked)

---

## Stop

Scope Report complete. **No code, migrations, OpenAPI edits, or Sprint 9.3 implementation.**

Await architecture / Freeze review.
