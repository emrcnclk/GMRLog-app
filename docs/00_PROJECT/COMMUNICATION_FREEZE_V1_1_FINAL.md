# Communication Platform Freeze v1.1 — FINAL

**Document:** `docs/00_PROJECT/COMMUNICATION_FREEZE_V1_1_FINAL.md`  
**Date:** 2026-07-18  
**Status:** **LOCKED** (documentation) — awaiting architecture sign-off before migration  
**Preceded by:** Freeze v1.0 · Amendment proposal · Architecture Review (**APPROVED WITH MINOR CHANGES**)  
**Normative detail:** [`COMMUNICATION_FREEZE_V1_1_AMENDMENT.md`](./COMMUNICATION_FREEZE_V1_1_AMENDMENT.md)  
**Review:** [`COMMUNICATION_FREEZE_V1_1_REVIEW.md`](./COMMUNICATION_FREEZE_V1_1_REVIEW.md)

**SSOT precedence (unchanged):**

1. `NORTH_STAR.md`  
2. `COMMUNICATION_PLATFORM_FREEZE_v1.md` (v1.0 locked decisions remain in force)  
3. This Freeze v1.1 FINAL + finalized amendment  
4. `COMMUNICATION_ARCHITECTURE.md`  
5. `COMMUNICATION_API.yaml`

**Does not authorize:** migrations, Prisma schema changes, OpenAPI edits, endpoints, repositories, services, or Sprint 9.3 implementation.

---

## Executive Summary

Freeze v1.0 froze the Communication API & architecture bible and deferred Groups / Channels / Threads / Pins / Polls until a Database Freeze amendment.

The v1.1 amendment proposes the **minimum additive** Postgres surface for the Sprint 9.3 OpenAPI slice (32 `future` ops). Architecture Review approved the design **with minor locks**. Those locks are incorporated into the amendment and restated here as normative.

**What v1.1 adds (logical):** `Group`, `GroupMember`, `GroupInvite`, `Channel`, `ConversationPinnedMessage`, `Poll` / `PollOption` / `PollVote`, and nullable `Message.parentMessageId`.

**What v1.1 does not change:** DIRECT conversation shape, Leave ≠ Delete, GroupMember → ConversationMember ownership, O(N) cache ban, block → 404, shipped 9.1/9.2 APIs, OpenAPI `future` flags.

**Next gate after this document:** architecture approval → then (only when explicitly authorized) additive migration / Prisma — still no product endpoints until OpenAPI unlock.

---

## Locked Decisions

| # | Decision | Normative rule |
|---|----------|----------------|
| 1 | Soft-delete Group | Product delete sets `Group.deletedAt`. Active queries exclude deleted. |
| 2 | Soft-delete Channel | Product delete sets `Channel.deletedAt`. Must not destroy linked Conversation. |
| 3 | App hard-delete ban | Application code MUST NOT SQL-hard-delete `groups` or `channels` rows (9.3–9.6 product paths). |
| 4 | Channel bridge | `Channel.conversationId` UNIQUE → `Conversation`; no `Conversation.groupId` in v1.1. |
| 5 | Channel → Conversation FK | `onDelete: Restrict`. |
| 6 | Group.createdById → User | `onDelete: Restrict`. |
| 7 | GroupMember lifecycle | Same row for join → leave/kick (`leftAt`) → rejoin (clear `leftAt`); `UNIQUE(groupId, userId)`. |
| 8 | Pin entity name | `ConversationPinnedMessage` / `conversation_pinned_messages` only. |
| 9 | Thread column | `Message.parentMessageId` nullable; `onDelete: SetNull`. |
| 10 | Message product delete | Remains soft (`deletedAt`); does not break parent FK by row removal. |
| 11 | Ownership | `GroupMember` = membership/role SoT; `ConversationMember` = derived channel participation. |
| 12 | DIRECT isolation | DIRECT never uses `GroupMember` or `Channel`. |
| 13 | Leave ≠ Delete (v1.0) | Still in force for conversations; Channel/Group soft-delete aligns with durable message history. |
| 14 | Poll typing | No `MessageType.POLL` in v1.1; `Poll.messageId` optional. |
| 15 | Scope | DB surface for 9.3 contract only; voice-room tables, Forums/Community, OpenAPI unlock out of this Freeze. |
| 16 | Additive migration only | No renames, drops, or narrowing of existing messaging columns. |

Freeze v1.0 five locked decisions (Leave ≠ Delete, GroupMember ownership, O(N) cache ban, block → 404, 9.1 scope) **remain binding**.

---

## Locked Relations

```text
Group
 └── Channel ──conversationId (UNIQUE, Restrict)──► Conversation
                                                      ├── ConversationMember[]  (derived)
                                                      └── Message[]
                                                            └── parentMessageId ──► Message (SetNull)
```

| Relation | Cardinality | `onDelete` | Locked? |
|----------|-------------|------------|---------|
| `Group.createdBy` → `User` | N:1 | **Restrict** | Yes |
| `GroupMember` → `Group` | N:1 | Cascade* | Yes (*dormant under soft-delete ban) |
| `GroupMember` → `User` | N:1 | Cascade | Yes |
| `GroupInvite` → `Group` | N:1 | Cascade* | Yes |
| `GroupInvite.createdBy` → `User` | N:1 | Restrict | Yes |
| `Channel` → `Group` | N:1 | Cascade* | Yes |
| `Channel` → `Conversation` | **1:1** | **Restrict** | Yes |
| `Message.parent` → `Message` | N:1 | **SetNull** | Yes |
| `ConversationPinnedMessage` → `Conversation` / `Message` / `User` | N:1 | Cascade w/ conversation | Yes |
| `Poll` → `Conversation` | N:1 | Cascade | Yes |
| `Poll.message` → `Message` | N:1 | SetNull (optional FK) | Yes |
| `PollOption` → `Poll` | N:1 | Cascade | Yes |
| `PollVote` → `Poll` / `PollOption` / `User` | N:1 | Cascade | Yes |

\*Cascade on Group children must **not** be exercised by application hard-delete of Group.

---

## Locked Constraints

| Constraint | Layer |
|------------|--------|
| `UNIQUE(group_id, user_id)` on `group_members` | DB |
| Active member = `leftAt IS NULL` | App |
| Leave/kick sets `leftAt`; rejoin clears `leftAt` on same row | App |
| `UNIQUE(conversation_id)` on `channels` | DB |
| `Conversation.type = GROUP` iff a `Channel` references it; DIRECT has no Channel | App |
| `UNIQUE(conversation_id, message_id)` on pins | DB |
| Pin / poll / parent message share conversation | App |
| `UNIQUE(token)` on invites; `UNIQUE(poll_id, user_id)` on votes | DB |
| Poll options 2–10 | App (OpenAPI) |
| ≥ one active OWNER per non-deleted group | App |
| Block → 404 on private resources | App (Freeze v1.0) |
| No `Conversation.groupId` in v1.1 | Schema |

Indexes: as specified in the finalized amendment (discover, thread page, pin list, channel list, etc.).

---

## Locked Delete Strategy

| Entity | Product delete | SQL hard delete in app | Effect on Conversation / messages |
|--------|----------------|------------------------|-----------------------------------|
| `Group` | Set `deletedAt` | **Forbidden** | Conversations retained; Channels soft-deleted by app policy as needed |
| `Channel` | Set `deletedAt` | **Forbidden** | Conversation **retained** (`Restrict` prevents FK destroy) |
| `GroupMember` leave/kick | Set `leftAt` | Not the leave path | Sync: set `ConversationMember.leftAt` on channel conversations |
| `Conversation` leave | Set `ConversationMember.leftAt` (v1.0) | No public destroy | Messages durable |
| `Message` | Set `deletedAt` | Not product path | Parent FK unchanged; hard-delete parent → child `parentMessageId` **SetNull** |
| `ConversationPinnedMessage` | Row delete (unpin) | Allowed for unpin | — |
| `PollVote` | Row delete (retract) | Allowed for retract | — |

**Invariant:** Leave ≠ Delete and Channel/Group soft-delete together ensure message history is not destroyed by group/channel product deletes.

---

## Backward Compatibility

| Surface | Impact |
|---------|--------|
| Existing DIRECT conversations / members / TEXT messages | None |
| 9.1 leave / archive / mute | None |
| 9.2 engagement (Social `MESSAGE` tables) | None |
| `Message.parentMessageId` NULL for all existing rows | Additive |
| New tables empty at migrate | No backfill |
| `ConversationType.GROUP` already in enum | No Conversation enum migration |
| OpenAPI shipped ops | Unchanged; 9.3 remain `future` until separate unlock |
| Breaking schema renames/drops | None |

---

## Migration Readiness

| Item | Status |
|------|--------|
| Logical schema complete | Yes (finalized amendment) |
| Review locks incorporated | Yes |
| Additive-only migration design | Ready to author **when authorized** |
| Prisma / SQL files | **Not started — do not create yet** |
| OpenAPI unlock | **Not started — separate change-control** |
| Sprint 9.3 implementation | **Blocked** until migration + OpenAPI unlock |
| Suggested migrate order | Enums → groups → members/invites → channels → pins/polls → `messages.parent_message_id` |
| Prod note | Prefer `CREATE INDEX CONCURRENTLY` for large `messages` if needed |

**Authorization required before migration:** explicit architecture / project approval after this FINAL document.

---

## Architecture Decision

Freeze v1.1 documents the Database Freeze amendment for Communication Groups, Channels, Threads, Pins, and Polls as additive schema under Freeze v1.0 behavioral locks, with soft-delete and Restrict/SetNull rules fixed by Architecture Review.

This declaration freezes the **database amendment design**. It does not clear OpenAPI `future` flags and does not start implementation.

### Architecture Decision

**FREEZE V1.1 LOCKED**

---

## Stop

Documentation pass complete.

- Updated: `COMMUNICATION_FREEZE_V1_1_AMENDMENT.md`  
- Created: `COMMUNICATION_FREEZE_V1_1_FINAL.md`

No migration. No Prisma. No OpenAPI. No code.

**Await architecture approval before any migration or implementation.**
