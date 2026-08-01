# Sprint 9.3B — Communication Freeze v1.1 Migration Report

**Document:** `docs/00_PROJECT/SPRINT_9_3B_MIGRATION_REPORT.md`  
**Date:** 2026-07-18  
**Status:** Complete — schema + migration only  
**Authority:** `COMMUNICATION_FREEZE_V1_1_FINAL.md` (**FREEZE V1.1 LOCKED**)

**Out of scope (not done):** endpoints, services, repositories, controllers, events, cache, permission changes, OpenAPI edits, Communication product implementation.

---

## Summary

Additive Database Freeze v1.1 surface landed in Prisma and PostgreSQL. Existing DIRECT / 9.1 / 9.2 messaging rows are untouched. No Communication API implementation.

| Artifact | Result |
|----------|--------|
| Prisma schema | Updated |
| Migration | `20260718210000_communication_freeze_v1_1` applied |
| DROP / RENAME / data backfill | **None** |
| OpenAPI | Unchanged (`future` flags remain) |

---

## Gap closed (pre → post)

| Freeze v1.1 requirement | Before | After |
|-------------------------|--------|-------|
| `GroupVisibility` / `GroupMemberRole` / `ChannelKind` | Absent | Enums present |
| `Group` + soft `deletedAt` | Absent | `groups` |
| `GroupMember` + `leftAt` lifecycle | Absent | `group_members` |
| `GroupInvite` | Absent | `group_invites` |
| `Channel` + `conversationId` UNIQUE Restrict | Absent | `channels` |
| `ConversationPinnedMessage` | Absent | `conversation_pinned_messages` |
| `Poll` / `PollOption` / `PollVote` | Absent | Present |
| `Message.parentMessageId` SetNull | Absent | Nullable column + FK + indexes |
| `Conversation.groupId` | Must stay absent | Still absent |

---

## Locked FK / delete behavior (as migrated)

| Relation | onDelete |
|----------|----------|
| `Group.createdBy` → User | Restrict |
| `Channel.conversation` → Conversation | Restrict |
| `Message.parent` → Message | SetNull |
| `Poll.message` → Message | SetNull |
| Group children (members, invites, channels) | Cascade (dormant under app soft-delete ban) |
| Pins → Conversation / Message | Cascade |
| Pin / Poll / Invite creators → User | Restrict |

App hard-delete of `groups` / `channels` remains **forbidden** (Freeze v1.1); product delete = `deletedAt`.

---

## Indexes added

- `groups`: unique `slug`; `(visibility, created_at DESC)`; `deleted_at`
- `group_members`: unique `(group_id, user_id)`; `(user_id, left_at)`; `(group_id, role)`
- `group_invites`: unique `token`; `(group_id, created_at DESC)`
- `channels`: unique `conversation_id`; `(group_id, deleted_at)`
- `conversation_pinned_messages`: unique `(conversation_id, message_id)`; `(conversation_id, pinned_at DESC)`
- `polls`: `(conversation_id, created_at DESC)`
- `poll_options`: `(poll_id, sort_order)`
- `poll_votes`: unique `(poll_id, user_id)`; `option_id`
- `messages`: `parent_message_id`; `(conversation_id, parent_message_id, created_at)`

**Not migrated (optional in amendment):** partial unique `(group_id, name) WHERE deleted_at IS NULL` — deferred to app uniqueness among active channels.

---

## Backward compatibility

| Check | Result |
|-------|--------|
| Existing DIRECT conversations | Unaffected |
| `ConversationMember` flags / leave | Unaffected |
| 9.2 Social engagement tables | Unaffected |
| Existing messages | `parent_message_id` NULL |
| New tables | Empty — no backfill |
| Breaking renames/drops | None |

---

## Validation

| Step | Result |
|------|--------|
| `prisma validate` | ✅ (with `DATABASE_URL` + `DIRECT_URL`) |
| `prisma migrate deploy` | ✅ Applied `20260718210000_communication_freeze_v1_1` |
| `prisma migrate status` | ✅ Database schema is up to date |
| `pnpm --filter @gmrlog/database typecheck` | ✅ |
| `pnpm --filter @gmrlog/database build` | ✅ |

---

## Files touched

| Path | Change |
|------|--------|
| `packages/database/prisma/schema.prisma` | Enums + models + Message/Conversation/User relations |
| `packages/database/prisma/migrations/20260718210000_communication_freeze_v1_1/migration.sql` | Additive SQL |
| `docs/00_PROJECT/SPRINT_9_3B_MIGRATION_REPORT.md` | This report |

---

## Explicit non-goals (still blocked)

- Sprint 9.3 endpoint / service / repository implementation  
- Clearing OpenAPI `x-gmrlog-status: future`  
- Events, cache, permission matrix code changes  
- Voice-room tables, Forums/Community aggregates  

---

## Gate

**Migration complete.**

Next (only after architecture review / explicit authorization): OpenAPI unlock (if any) → Communication Groups & Channels implementation.

**Do not proceed to Communication implementation in this sprint slice.**

Await architecture review.
