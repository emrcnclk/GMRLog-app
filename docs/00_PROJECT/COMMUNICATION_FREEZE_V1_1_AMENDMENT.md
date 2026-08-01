# Communication Platform — Freeze v1.1 Database Amendment (Proposal)

**Document:** `docs/00_PROJECT/COMMUNICATION_FREEZE_V1_1_AMENDMENT.md`  
**Date:** 2026-07-18  
**Status:** **FINALIZED** — Architecture Review locks incorporated (`COMMUNICATION_FREEZE_V1_1_REVIEW.md` → `COMMUNICATION_FREEZE_V1_1_FINAL.md`)  
**Scope:** Database Freeze gaps for Sprint 9.3 OpenAPI surface only  
**Does not authorize:** migrations, Prisma code, endpoints, repositories, services, OpenAPI edits

**SSOT precedence:**

1. `NORTH_STAR.md`
2. `COMMUNICATION_PLATFORM_FREEZE_v1.md` (v1.0)
3. `COMMUNICATION_API.yaml`
4. `SPRINT_9_3_SCOPE_REPORT.md`
5. Existing Prisma messaging models (9.1 / 9.2 runtime)

**Related (normative context, not rewritten here):**

- `docs/01_ARCHITECTURE/COMMUNICATION_ARCHITECTURE.md` — Group → Channel → Conversation bridge; GroupMember → ConversationMember sync
- `docs/07_DATABASE/DATABASE_FREEZE_REPORT.md` — global DB Freeze; messaging tables already listed without Groups/Channels/Threads/Pins/Polls

---

## Purpose

Freeze v1.0 froze the Communication **API & architecture bible**, explicitly deferring Groups / Channels / Threads / Pins / Polls until a **Database Freeze amendment**.

Sprint 9.3 Scope Report found **32** operations tagged `x-gmrlog-sprint: '9.3'`, all `x-gmrlog-status: future`, and **zero** implementable under Freeze v1.0 without new schema.

This document proposes the **minimum additive database surface** required to unlock that 9.3 contract **without breaking** existing DIRECT + engagement models.

---

## Non-goals (this amendment)

| Out of scope | Reason |
|--------------|--------|
| Migration SQL / Prisma model files | Review gate first |
| Endpoint / service / repository design | Post–Architecture Review |
| Clearing OpenAPI `future` flags | Separate Freeze + OpenAPI change-control |
| Voice room tables / WebSocket presence | Not in 9.3 REST set |
| Attachments API, forward graph, message search, read-receipt REST | Other sprints |
| Forums / Community product aggregates | North Star communities ≠ inventing Forums inside Communication |
| Changing Leave ≠ Delete, O(N) cache ban, block → 404 | Locked Freeze v1.0 decisions |

---

## Baseline (today)

| Artifact | State |
|----------|--------|
| `Conversation` / `ConversationMember` / `Message` / `MessageRead` / `MessageAttachment` / `TypingStatus` | Present |
| `ConversationType` enum | `DIRECT`, `GROUP` (GROUP unused in product paths) |
| `Message.parentMessageId` | **Absent** (OpenAPI field marked `future`) |
| `Group` / `GroupMember` / `GroupInvite` / `Channel` | **Absent** |
| Pin entity | **Absent** |
| `Poll` / `PollOption` / `PollVote` | **Absent** |
| Engagement (Like / Reaction / Bookmark / Mention / Report @ `MESSAGE`) | Present — **reuse; do not duplicate** |

---

## Normative design principles (carried forward)

1. **Channel bridges Conversation** — `Channel.conversationId` → `Conversation`; DIRECT has no Group/Channel.
2. **GroupMember owns identity & roles** — `OWNER` / `MODERATOR` / `MEMBER`.
3. **ConversationMember is derived** for channel-backed streams (`leftAt`, inbox); role changes do not rewrite membership rows.
4. **Leave ≠ Delete** — soft membership / soft message delete; no public conversation destroy.
5. **Additive only** — nullable columns + new tables; no renames, no type narrowing, no drop of 9.1/9.2 columns.
6. **App invariants where Postgres CHECK cannot span rows** — e.g. pin/poll/thread parent must share `conversationId` — enforced in service layer; document as required.
7. **Group / Channel soft-delete is mandatory** — product paths set `deletedAt`; SQL hard `DELETE` of Group/Channel is **forbidden** in application code (dormant Prisma Cascades must never fire via app hard-delete).
8. **Channel → Conversation `onDelete: Restrict`** — channel soft-delete must not destroy the Conversation aggregate or messages.
9. **GroupMember `leftAt` lifecycle is mandatory** — join / leave / rejoin on the same unique `(groupId, userId)` row.

---

## Operation → schema gap matrix (all 32)

### A. Conversation participants

| Op | Missing tables | Missing relations | Missing indexes / constraints | Breaks current model? | Backward compatible? |
|----|----------------|-------------------|-------------------------------|----------------------|----------------------|
| `addConversationParticipant` | `Group`, `GroupMember`, `Channel` (to prove GROUP-backed + role) | `Channel.conversationId` → `Conversation`; `GroupMember` → `Group`/`User` | Active membership unique; role enum | No — additive | Yes — DIRECT paths unchanged |
| `removeConversationParticipant` | Same | Same + set `ConversationMember.leftAt` (exists) | — | No | Yes |

**Notes:** OpenAPI AuthZ requires GROUP_MOD / GROUP_OWNER. Without `GroupMember` + Channel bridge, participant mutation cannot be authorized or scoped. DIRECT remains fixed at 2 members (reject in app).

---

### B. Threads

| Op | Missing tables | Missing relations | Missing indexes / constraints | Breaks current model? | Backward compatible? |
|----|----------------|-------------------|-------------------------------|----------------------|----------------------|
| `replyToMessage` | — (extend `Message`) | `Message.parentMessageId` → `Message.id` (self-FK) | FK + indexes below; same-`conversationId` invariant | No — nullable column | Yes — all existing rows `NULL` |
| `getMessageThread` | — | Same | `(conversationId, parentMessageId, createdAt)` | No | Yes |

**Proposed column:** `messages.parent_message_id UUID NULL REFERENCES messages(id)`.

**Not proposed:** separate `Thread` aggregate table (OpenAPI models replies as `Message` with `parentMessageId`).

---

### C. Pins

| Op | Missing tables | Missing relations | Missing indexes / constraints | Breaks current model? | Backward compatible? |
|----|----------------|-------------------|-------------------------------|----------------------|----------------------|
| `pinMessage` | `ConversationPinnedMessage` | → `Conversation`, `Message`, `User` (pinnedBy) | `UNIQUE(conversation_id, message_id)` | No | Yes |
| `unpinMessage` | Same | Same | PK / unique for delete | No | Yes |
| `listPinnedMessages` | Same | Same | `(conversation_id, pinned_at DESC)` | No | Yes |

**Not proposed:** boolean `Message.isPinned` alone (loses `pinnedBy` / `pinnedAt`; OpenAPI `PinnedMessage` requires both).

---

### D. Polls

| Op | Missing tables | Missing relations | Missing indexes / constraints | Breaks current model? | Backward compatible? |
|----|----------------|-------------------|-------------------------------|----------------------|----------------------|
| `createPoll` | `Poll`, `PollOption` | → `Conversation`; optional → `Message`; options → poll | options 2–10 app rule; `conversation_id` index | No | Yes |
| `getPoll` | Same | Same | PK | No | Yes |
| `castPollVote` | `PollVote` | → `Poll`, `PollOption`, `User` | `UNIQUE(poll_id, user_id)` (one active vote) | No | Yes |
| `retractPollVote` | `PollVote` | Same | Same unique for delete | No | Yes |

**Not proposed:** new `MessageType.POLL` in this amendment (current enum has no `POLL`; OpenAPI allows `Poll.messageId` nullable). Optional message link without enum expansion preserves 9.1 TEXT write lock. If product later requires a poll card message type, that is a **separate** enum amendment.

---

### E. Groups

| Op | Missing tables | Missing relations | Missing indexes / constraints | Breaks current model? | Backward compatible? |
|----|----------------|-------------------|-------------------------------|----------------------|----------------------|
| `listMyGroups` | `Group`, `GroupMember` | Member → User/Group | `(user_id)` / `(user_id, left_at)` | No | Yes |
| `createGroup` | `Group`, `GroupMember` (seed OWNER) | Creator → User | `visibility` enum; optional unique `slug` | No | Yes |
| `discoverGroups` | `Group` | — | `(visibility, created_at DESC)` or similar | No | Yes |
| `getGroup` / `updateGroup` / `deleteGroup` | `Group` | **Mandatory soft-delete** (`deletedAt`); hard SQL delete forbidden in app | — | No | Yes |
| `joinGroup` / `leaveGroup` | `GroupMember` | **Mandatory `leftAt` lifecycle** (leave/kick sets `leftAt`; rejoin clears `leftAt` on same row) | `UNIQUE(group_id, user_id)` — one row per user | No | Yes |
| `listGroupInvites` / `createGroupInvite` | `GroupInvite` | → Group, creator User | `UNIQUE(token)`; `expires_at` | No | Yes |
| `acceptGroupInvite` | `GroupInvite` + `GroupMember` | Token lookup; maxUses/useCount | Token unique | No | Yes |
| `listGroupMembers` / `updateGroupMemberRole` / `removeGroupMember` | `GroupMember` | Role enum | `(group_id, role)`; kick sets `left_at` | No | Yes |

---

### F. Channels (+ channel messages)

| Op | Missing tables | Missing relations | Missing indexes / constraints | Breaks current model? | Backward compatible? |
|----|----------------|-------------------|-------------------------------|----------------------|----------------------|
| `listChannels` / `createChannel` / `getChannel` / `updateChannel` / `deleteChannel` | `Channel` (+ uses `Group`, `Conversation`) | `Channel.groupId` → Group; **`conversationId` UNIQUE** → Conversation **`onDelete: Restrict`**; mandatory Channel soft-delete | `(group_id)`; unique conversation bridge | No — new `Conversation.type=GROUP` rows only | Yes — existing DIRECT untouched |
| `listChannelMessages` / `sendChannelMessage` | Same bridge | Messages already on `Conversation` | Existing `(conversation_id, created_at DESC)` | No | Yes |

**Sync (architecture, not new tables):** channel create seeds `ConversationMember`; join/leave/kick group updates `leftAt` on channel conversations.

---

## Proposed schema (logical)

### New enums

| Enum | Values (OpenAPI-aligned) |
|------|--------------------------|
| `GroupVisibility` | `PUBLIC`, `PRIVATE`, `INVITE_ONLY`, `HIDDEN` |
| `GroupMemberRole` | `OWNER`, `MODERATOR`, `MEMBER` |
| `ChannelKind` | `GENERAL`, `ANNOUNCEMENTS`, `MEDIA`, `STRATEGY`, `LFG`, `VOICE` |

`ChannelKind.VOICE` is included for contract parity; **voice-room session tables remain out of this amendment**.

### New / extended entities (logical fields)

#### Extend `Message`

| Field | Type | Notes |
|-------|------|--------|
| `parentMessageId` | UUID? | Self-FK; **`onDelete: SetNull` (locked)** |

**Deletion strategy (locked):** Product message delete remains soft (`Message.deletedAt`) and does **not** remove the row, so parent FKs stay valid. Soft-deleted parents may still be referenced; visibility is an app concern. Rare SQL hard-delete of a parent message sets children’s `parentMessageId` to `NULL` via `SetNull`. Do **not** use `Cascade` on the self-FK.

#### `Group`

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID PK | |
| `name` | String(80) | |
| `slug` | String(80)? | Unique when present; generated if omitted at create |
| `description` | String(2000)? | |
| `rules` | String(8000)? | |
| `visibility` | `GroupVisibility` | |
| `avatarUrl` / `bannerUrl` | String? | |
| `tags` | String[] | max 20 app-level |
| `memberCount` | Int | denormalized ≥ 0 |
| `createdById` | UUID | FK User; **`onDelete: Restrict` (locked)** |
| `createdAt` / `updatedAt` | DateTime | |
| `deletedAt` | DateTime? | **Mandatory soft-delete** — product `deleteGroup` sets this; SQL hard delete forbidden in app |

#### `GroupMember`

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID PK | |
| `groupId` / `userId` | UUID | FKs |
| `role` | `GroupMemberRole` | |
| `joinedAt` | DateTime | Set on first join; preserved across leave/rejoin unless product resets |
| `leftAt` | DateTime? | **Mandatory lifecycle** — see below |
| `createdAt` | DateTime | |

**SoT:** group role & membership. **Not** inbox participation (that stays on `ConversationMember`).

**`leftAt` lifecycle (locked):**

| Event | Effect on `GroupMember` row |
|-------|----------------------------|
| Join (first time) | Insert row; `leftAt = NULL` |
| Leave / kick | Set `leftAt = now()` (do **not** delete the row) |
| Rejoin | Same `UNIQUE(groupId, userId)` row; clear `leftAt`; refresh `joinedAt` if product requires |
| Active member query | `leftAt IS NULL` |

Hard-delete of `GroupMember` rows is **not** the leave/kick path.

#### `GroupInvite`

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID PK | |
| `groupId` | UUID | FK |
| `token` | String | unique, unguessable |
| `createdById` | UUID | FK User; `onDelete: Restrict` |
| `createdAt` / `expiresAt` | DateTime | |
| `maxUses` | Int? | from `CreateGroupInviteRequest` (store even if response schema omits) |
| `useCount` | Int | default 0 |
| `revokedAt` | DateTime? | optional safety |

#### `Channel`

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID PK | |
| `groupId` | UUID | FK Group (`onDelete: Cascade` dormant while Group soft-delete is mandatory) |
| `kind` | `ChannelKind` | |
| `name` | String(80) | |
| `description` | String(500)? | |
| `conversationId` | UUID | **UNIQUE** FK → `Conversation`; **`onDelete: Restrict` (locked)** |
| `createdAt` / `updatedAt` | DateTime | |
| `deletedAt` | DateTime? | **Mandatory soft-delete** — product `deleteChannel` sets this; must **not** hard-delete Conversation |

On create: insert `Conversation` with `type = GROUP`, then `Channel`.

**Hard-delete ban (locked):** Application code MUST NOT issue SQL/`DELETE` that hard-removes `groups` or `channels` rows in product paths (9.3–9.6). Soft-delete via `deletedAt` only. Prisma `Cascade` from Group → Channel therefore must not fire via app hard-delete.

#### `ConversationPinnedMessage` (name locked)

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID PK | |
| `conversationId` / `messageId` | UUID | FKs |
| `pinnedById` | UUID | FK User |
| `pinnedAt` | DateTime | |

Table map: `conversation_pinned_messages`. No alternate pin table name.

#### `Poll`

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID PK | |
| `conversationId` | UUID | FK |
| `messageId` | UUID? | optional FK Message |
| `question` | String(500) | |
| `createdById` | UUID | FK User |
| `endsAt` | DateTime? | |
| `createdAt` / `updatedAt` | DateTime | |

#### `PollOption`

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID PK | |
| `pollId` | UUID | FK Cascade |
| `label` | String(200) | |
| `sortOrder` | Int | stable ordering (API array order) |
| `voteCount` | Int | denormalized ≥ 0 |

#### `PollVote`

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID PK | |
| `pollId` / `optionId` / `userId` | UUID | FKs |
| `createdAt` | DateTime | |

---

## Explicit non-changes to existing messaging tables

| Keep as-is | Rationale |
|------------|-----------|
| `ConversationMember` columns (`leftAt`, `isArchived`, `isMuted`, …) | 9.1 contract |
| No `Conversation.groupId` column in v1.1 | Avoid dual SoT; resolve group via `Channel` where `conversationId` matches (**locked out** of v1.1) |
| Engagement social tables | Already polymorphic on `MESSAGE` |
| `MessageAttachment` / `TypingStatus` | Unchanged; attachments API still future |
| Leave conversation semantics | Unchanged |

---

## Required Tables

| Table (logical / `@@map`) | Purpose | Ops unlocked |
|---------------------------|---------|--------------|
| `groups` | Community aggregate | E (12–25), A (authz), F (parent) |
| `group_members` | Membership + role SoT | E, A, F sync |
| `group_invites` | Invite tokens | 20–22 |
| `channels` | Channel + conversation bridge | F (26–32), A |
| `conversation_pinned_messages` | Pins | 5–7 |
| `polls` | Poll header | 8–11 |
| `poll_options` | Options + voteCount | 8–11 |
| `poll_votes` | Cast / retract | 10–11 |
| **Extend** `messages` | `parent_message_id` | 3–4 |

**Enums:** `GroupVisibility`, `GroupMemberRole`, `ChannelKind`.

---

## Required Relations

| From | To | Cardinality / delete | Notes |
|------|-----|----------------------|--------|
| `Group.createdBy` | `User` | N:1 **`onDelete: Restrict` (locked)** | |
| `GroupMember` | `Group` | N:1 Cascade | Dormant while Group soft-delete mandatory |
| `GroupMember` | `User` | N:1 Cascade | |
| `GroupInvite` | `Group` | N:1 Cascade | Dormant while Group soft-delete mandatory |
| `GroupInvite.createdBy` | `User` | N:1 Restrict | |
| `Channel` | `Group` | N:1 Cascade | Dormant while Group soft-delete mandatory |
| `Channel` | `Conversation` | **1:1** (`conversationId` unique); **`onDelete: Restrict` (locked)** | Bridge — never destroy Conversation via Channel |
| `Message.parent` | `Message` | N:1 self; **`onDelete: SetNull` (locked)** | `parentMessageId` |
| `ConversationPinnedMessage` | `Conversation` / `Message` / `User` | N:1; Cascade with conversation | Name locked |
| `Poll` | `Conversation` | N:1 Cascade | |
| `Poll.message` | `Message` | N:1 SetNull optional | |
| `PollOption` | `Poll` | N:1 Cascade | |
| `PollVote` | `Poll` / `PollOption` / `User` | N:1 Cascade | |

**User model:** additive reverse relations only (`groupsCreated`, `groupMembers`, `groupInvitesCreated`, `pinnedMessages`, `pollsCreated`, `pollVotes`, …).

**No new relation** that rewrites existing `Conversation` ↔ `ConversationMember` ↔ `Message` graph semantics.

---

## Required Indexes

| Location | Index / unique | Why |
|----------|----------------|-----|
| `group_members` | `UNIQUE(group_id, user_id)` | One membership row per user (rejoin updates `leftAt`) |
| `group_members` | `(user_id, left_at)` or `(user_id)` | `listMyGroups` |
| `group_members` | `(group_id, role)` | moderation queries |
| `groups` | `UNIQUE(slug)` WHERE slug NOT NULL (partial if used) | discover / vanity |
| `groups` | `(visibility, created_at DESC)` | `discoverGroups` |
| `groups` | `(deleted_at)` | soft-delete filters |
| `group_invites` | `UNIQUE(token)` | accept by token |
| `group_invites` | `(group_id, created_at DESC)` | list invites |
| `channels` | `UNIQUE(conversation_id)` | 1:1 bridge |
| `channels` | `(group_id, deleted_at)` | list channels |
| `channels` | optional `UNIQUE(group_id, name)` WHERE deleted null | name clash |
| `messages` | `(parent_message_id)` | reply fan-in |
| `messages` | `(conversation_id, parent_message_id, created_at)` | thread page |
| `conversation_pinned_messages` | `UNIQUE(conversation_id, message_id)` | idempotent pin |
| `conversation_pinned_messages` | `(conversation_id, pinned_at DESC)` | list pins |
| `polls` | `(conversation_id, created_at DESC)` | list by conversation (future) |
| `poll_options` | `(poll_id, sort_order)` | ordered options |
| `poll_votes` | `UNIQUE(poll_id, user_id)` | one vote / retract |
| `poll_votes` | `(option_id)` | recount / integrity |

Existing `messages(conversation_id, created_at DESC)` remains the channel message list index — **no replacement**.

---

## Constraints & invariants (DB + app)

| Rule | Layer |
|------|--------|
| `Conversation.type = GROUP` iff a `Channel` points at it (DIRECT never has Channel) | App (+ optional deferred check) |
| Pin / poll / parent message share `conversationId` | App |
| Poll options count 2–10 | App (OpenAPI) |
| At least one active `OWNER` per non-deleted group | App |
| `GENERAL` channel delete restricted | App (Permission matrix) |
| Invite accept: not expired; `useCount < maxUses` if set; visibility gates | App |
| GroupMember leave/kick → set `leftAt`; rejoin → clear `leftAt` on same row | App + `UNIQUE(group_id, user_id)` **(locked)** |
| Group / Channel product delete → set `deletedAt` only | App **(locked)** |
| Application MUST NOT hard-delete `groups` / `channels` rows | App **(locked)** |
| Block → 404 on private resources | App (unchanged) |

---

## Backward Compatibility

| Check | Result |
|-------|--------|
| Existing DIRECT conversations / members / TEXT messages | Unaffected |
| 9.1 leave / archive / mute | Unaffected |
| 9.2 engagement via Social tables | Unaffected |
| Nullable `parentMessageId` default NULL | Additive |
| New tables empty at migrate | No backfill required |
| `ConversationType.GROUP` already in enum | No enum migration for Conversation |
| API clients of shipped 9.1/9.2 | No response shape change from this DB amendment alone |
| Breaking renames / drops | **None proposed** |

**Verdict:** Fully **backward compatible** with production messaging data if migration is additive-only as specified.

---

## Migration Risk

| Risk | Severity | Mitigation |
|------|----------|------------|
| Large multi-table migration in one deploy | Medium | Single transactional migration OK for empty new tables; keep ordering: enums → groups → members/invites → conversations already exist → channels → pins/polls → message column |
| `ALTER TABLE messages ADD parent_message_id` | Low–Medium | Nullable, no default rewrite; add FK/indexes; prefer `CREATE INDEX CONCURRENTLY` in prod playbook if table is large |
| Accidental hard-delete cascades from Group → Conversation | High if mis-modeled | No Group→Conversation FK; Channel→Conversation **Restrict**; Group/Channel **mandatory soft-delete**; app hard-delete **forbidden** |
| Dual membership SoT drift | Medium | Document sync rules; no `GroupMember` writes from DIRECT paths |
| Partial unique for “one active OWNER” | Low | Enforce in service; skip fragile partial uniques initially |
| `ChannelKind.VOICE` confusion with voice rooms | Low | Comment in schema: enum parity only; no voice session tables |

**Data backfill:** none for greenfield tables. No rewrite of existing DIRECT rows.

**Rollback:** reverse migration drops new tables/column; safe only if no 9.3 writes have occurred.

---

## Rollout Strategy

```text
1. Architecture Review — DONE (APPROVED WITH MINOR CHANGES)
2. Incorporate review locks into this amendment + COMMUNICATION_FREEZE_V1_1_FINAL.md — DONE
3. Architecture approval of Freeze v1.1 FINAL (gate)
4. Database Freeze follow-up note / migration ticket (still no product endpoints)
5. Land additive migration + Prisma models only (after explicit authorization)
6. OpenAPI change-control: clear `future` on unlocked ops (phased or all-9.3)
7. Implement Sprint 9.3 code against unlocked ops only
```

**Recommended implementation phasing after schema lands** (code still blocked until step 6):

| Phase | Schema already present | Product slice |
|-------|------------------------|---------------|
| 9.3a | Groups + members + invites | Ops 12–25 |
| 9.3b | Channels + ConversationMember sync | Ops 26–32 + 1–2 |
| 9.3c | parentMessageId + pins + polls | Ops 3–11 |

Schema migration may ship **all tables in one release** even if API unlock is phased — prefers FK integrity and avoids thrash.

**Cache / events:** no schema dependency beyond existing publish-only + `inboxVersion` rules; group/channel cache keys already sketched in Scope Report.

---

## Sprint Impact

| Sprint | Impact |
|--------|--------|
| 9.1 / 9.2 | None (additive) |
| **9.3** | **Unblocked at DB layer** after Freeze v1.1 FINAL approval + migration; OpenAPI `future` still blocks shipping until cleared |
| 9.4–9.6 | Unrelated tables; voice still separate |
| Database Freeze Report | Requires amendment entry when migration exists |
| ADR-COMM-001 | Follow-up note: DB tables locked in Freeze v1.1; sync rules unchanged |

**Gate reminder:** This amendment does **not** authorize Sprint 9.3 coding. Await architecture approval of `COMMUNICATION_FREEZE_V1_1_FINAL.md`, then migration authorization, then OpenAPI unlock, then code.

---

## OpenAPI Impact

| Item | Impact of this DB amendment |
|------|-----------------------------|
| Path / operationId set | **No change** in this proposal |
| `x-gmrlog-status: future` on 32 ops | **Remains** until explicit unlock |
| `Message.parentMessageId` | Already in contract as `future` — DB column enables it later |
| `Group` / `Channel` / `Poll` / `PinnedMessage` schemas | Already sketched — map 1:1 to proposed tables |
| Gaps to fix in a **later** OpenAPI PR (not this doc) | `GroupInvite.maxUses` / `useCount` on response; `Group.slug` generation rules; optional `sortOrder` on `PollOption`; soft-delete representation |
| `info.version` | Bump only when contract unlocks (Freeze change-control) |

**This amendment does not edit `COMMUNICATION_API.yaml`.**

---

## North Star alignment

Groups/channels/threads support “build communities” and a gaming-culture digital home **only** as Communication transport for group spaces. They must not expand into generic non-gaming social spam, Forums-as-product, or Discord-clone scope creep outside the frozen Communication boundary (ADR: Forums remain separate Community product).

---

## Approval checklist (Architecture Review)

- [x] Required tables / enums accepted
- [x] No `Conversation.groupId` (Channel bridge only) locked
- [x] `GroupMember.leftAt` lifecycle locked (join → leave → rejoin)
- [x] Pin entity name locked: `ConversationPinnedMessage`
- [x] Poll without `MessageType.POLL` accepted for v1.1
- [x] Soft-delete on Group/Channel mandatory; app hard-delete forbidden
- [x] `Channel.conversationId` → Conversation `onDelete: Restrict`
- [x] `Group.createdById` → User `onDelete: Restrict`
- [x] `Message.parentMessageId` `onDelete: SetNull`
- [x] Migration risk / rollout phasing accepted
- [ ] Architecture approval of `COMMUNICATION_FREEZE_V1_1_FINAL.md` (gate — wait)
- [ ] Authorization to land migration / Prisma (still no endpoints)

---

## Stop

**Amendment finalized with review locks.** Normative Freeze declaration: `COMMUNICATION_FREEZE_V1_1_FINAL.md`.

No migration, Prisma, OpenAPI, endpoint, repository, or service work performed.

**Await architecture approval of Freeze v1.1 FINAL. Do not proceed to migration.**
