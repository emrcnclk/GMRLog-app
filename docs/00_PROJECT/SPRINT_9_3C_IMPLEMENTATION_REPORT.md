# Sprint 9.3C — Communication Groups & Channels Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_9_3C_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-18  
**Status:** Complete  
**Authority:** Freeze v1.1 LOCKED + Sprint 9.3 Scope Report  
**Preceded by:** Sprint 9.3B Migration

**Out of scope (not done):** Voice, search, attachments, rich cards beyond TEXT, analytics, moderation extras, OpenAPI `future` flag clearance, Sprint 9.3D.

---

## Summary

Implemented all **32** Sprint 9.3 OpenAPI operations (Groups, Channels, participants, threads, pins, polls) on top of Freeze v1.1 schema. Architecture layers preserved: Controller → Service → Repository; GroupRole facade; publish-only events; targeted cache + `inboxVersion` for group-backed writes.

| Area | Ops | Status |
|------|-----|--------|
| A. Participants | 2 | ✅ |
| B. Threads | 2 | ✅ |
| C. Pins | 3 | ✅ |
| D. Polls | 4 | ✅ |
| E. Groups | 14 | ✅ |
| F. Channels + channel messages | 7 | ✅ |
| **Total** | **32** | ✅ |

---

## Architecture

| Layer | Artifacts |
|-------|-----------|
| Controllers | `GroupsController`, extended `ConversationsController` (zero authz) |
| Services | `GroupService`, `ChannelService`, `ConversationExperienceService` |
| Permission | `GroupPermissionService` (GroupRole SoT); reuses `ConversationPermissionService` / visibility / Block |
| Repositories | `GroupRepository`, `ChannelRepository`, `ConversationExperienceRepository`; extends `ConversationRepository` |
| Cache | `GroupCacheService` + existing `ConversationCacheService.invalidateDirectFanout` (N>2 → inboxVersion) |
| Events | Publish-only via `DomainEventPublisher` |

**Sync rules applied:** Channel create seeds `ConversationMember`; group join/leave/kick syncs `leftAt` on channel conversations; role change does not rewrite `ConversationMember`.

**Delete strategy:** Group/Channel soft-delete (`deletedAt`); app hard-delete forbidden; Channel → Conversation Restrict preserved at DB.

---

## Events implemented

| Event | Trigger |
|-------|---------|
| `group.created.v1` / `group.updated.v1` / `group.deleted.v1` | Group writes |
| `channel.created.v1` / `channel.deleted.v1` | Channel writes |
| `conversation.participant.joined.v1` | Channel seed / join sync / add participant |
| `conversation.participant.left.v1` | Kick / remove participant |
| `message.created.v1` | Channel send / reply |
| `message.thread.created.v1` | First reply |
| `message.pinned.v1` / `message.unpinned.v1` | Pin ops |
| `poll.created.v1` / `poll.voted.v1` | Poll create / vote |

---

## Cache

| Key | Use |
|-----|-----|
| `group:{id}`, `group:list:{userId}` | Group mutations — targeted invalidate |
| `channel:{id}` | Channel CRUD |
| `poll:{id}` | Poll create/vote |
| `conversation:{id}` + `inboxVersion` | Group-backed message writes (no O(N) user inbox DEL) |

No global flush. Message history pages still never cached.

---

## AuthZ highlights

- DIRECT participant add/remove → 400  
- Non-member private resources → 404  
- Wrong role (known member) → 403  
- Pin / participant manage → MOD/OWNER  
- ANNOUNCEMENTS write → MOD/OWNER  
- GENERAL channel delete → forbidden  
- PUBLIC join / discover; PRIVATE/INVITE_ONLY via invite  

---

## Validation

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint (`src/communication/**`, e2e file) | ✅ |
| Unit (`group-permission`, `group.service`, `conversation-experience`) | ✅ 7/7 |
| Existing communication unit/integration suite | Run with `vitest src/communication/` |
| E2E `test/groups-channels.e2e-spec.ts` | ✅ group → channel → message → poll → pin → reply |

---

## Files (primary)

**New:** `group.*`, `channel.*`, `group-permission.*`, `group-cache.*`, `conversation-experience.*`, `groups.controller.ts`, specs, `test/groups-channels.e2e-spec.ts`

**Updated:** `communication.module.ts`, `conversations.controller.ts`, `conversation.constants.ts`, `conversation.repository.ts`, `conversation.mapper.ts`, `conversation.entities.ts`

**Not changed:** OpenAPI YAML (`future` flags remain until separate change-control), Prisma migrations (9.3B already landed).

---

## Gate

Sprint **9.3C implementation complete.**

Do **not** proceed to 9.3D.

Await architecture review / product unlock for OpenAPI `future` clearance if shipping publicly.
