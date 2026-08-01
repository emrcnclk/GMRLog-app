# Sprint 9.3D — Communication Module Final Audit

**Document:** `docs/00_PROJECT/SPRINT_9_3D_FINAL_AUDIT.md`  
**Date:** 2026-07-18  
**Role:** Principal Software Architect / CTO  
**Type:** Audit only — no code, schema, OpenAPI, or feature changes  
**Subject:** `apps/api/src/communication/` (+ related e2e)

**SSOT precedence applied:**

1. `NORTH_STAR.md`  
2. `COMMUNICATION_PLATFORM_FREEZE_v1.md`  
3. `COMMUNICATION_FREEZE_V1_1_FINAL.md`  
4. `COMMUNICATION_API.yaml`  
5. `COMMUNICATION_ARCHITECTURE.md`  

Supporting: Event Matrix, Cache Strategy, Permission Matrix, Sprint 9.1–9.3C reports.

---

## Executive Summary

Communication is a coherent NestJS bounded context covering Sprint **9.1 Conversation Core**, **9.2 Message Engagement**, and **9.3 Groups & Channels** (threads / pins / polls). Layering, Leave ≠ Delete, soft-delete Groups/Channels, publish-only events, and write-path O(N) cache ban are largely in place. Quality gates are green.

Residual issues are **orchestrational and contract-hygiene** (inboxVersion read reconcile, GROUP block edge case, event aggregate typing on group join/leave, OpenAPI `future` vs live 9.3 routes, moderator delete gap). They do **not** require redesign of aggregates or BC boundaries.

| Dimension | Verdict |
|-----------|---------|
| Architecture / BC | Pass with minor notes |
| Security / AuthZ | Pass with minor gaps |
| Cache write path | Pass |
| Cache read path | Gap (inboxVersion) |
| Events | Pass with minor contract drift |
| OpenAPI / Freeze | Pass ops; change-control debt on 9.3 `future` |
| Tests / CI gates | Pass |
| North Star | Aligned |

---

## Architecture Review

| Check | Result | Evidence |
|-------|--------|----------|
| Bounded context independence | **Pass** | Module imports: Auth, Users, Containers only — no Notification / Feed / Search / Community |
| Aggregate map Group → Channel → Conversation | **Pass** | `Channel.conversationId` unique bridge; no `Conversation.groupId` (Freeze v1.1) |
| GroupMember SoT / ConversationMember derived | **Pass** | Sync on channel create / join / leave / kick |
| CQRS | **Partial pass** | `ConversationQueryService` + write services; no separate `MessageQueryService` name (reads folded into query service) |
| Controller = routing only | **Pass** | `ConversationsController`, `MessagesController`, `GroupsController` — JwtAuthGuard + delegate |
| Repository = persistence only | **Pass** | Prisma confined to `*repository.ts` |
| Service = business logic | **Pass** | Validation, authz orchestration, events, cache |
| Dependency direction | **Pass** | Inward to Prisma/Redis/events; Containers reused for Block/visibility helpers |
| Folder / naming | **Pass** | kebab-case files, PascalCase types, flat module (acceptable size) |
| Community coupling | **Pass** | None — Forums/Community remain out of BC |

**Note:** `ContainerPermissionService` is used as a membership→VIEWER facade for conversations. Architecture prefers participant/group-role semantics; GroupRole is correctly owned by `GroupPermissionService`. Container reuse is pragmatic, not Community merge.

---

## Security Review

| Rule | Result |
|------|--------|
| Block → 404 (DIRECT) | **Pass** — create/access map deny to `ConversationNotFoundException` |
| Leave ≠ Delete | **Pass** — `ConversationMember.leftAt`; no public conversation destroy |
| Group / Channel soft-delete | **Pass** — `deletedAt`; Channel→Conversation FK Restrict |
| DIRECT never uses GroupMember | **Pass** |
| Controllers zero authz | **Pass** |
| Private deny → 404 | **Pass** for non-members |
| Known-member role miss → 403 | **Pass** (pins, announcements, GENERAL delete, etc.) |

**Gaps (minor):**

1. **GROUP conversations apply DM-style block across all peers** (`ConversationVisibilityService.canAccess` loops `isBlockedEitherWay` for every peer). Correct for DIRECT; on large channels a single blocked peer can yield false 404. Should gate block checks to `type === DIRECT`.
2. **Message soft-delete is sender-only** — Permission Matrix expects MOD/OWNER delete on group-backed streams; not implemented.
3. **`discoverGroups`** OpenAPI allows anon (`security: []`); controller class uses `JwtAuthGuard` (authenticated discover only).

---

## Performance Review

| Area | Result |
|------|--------|
| Message list indexes | **Pass** — `(conversationId, createdAt DESC)` used |
| Thread index | **Pass** — `(conversationId, parentMessageId, createdAt)` from Freeze v1.1 |
| Pin / poll / group discover indexes | **Pass** — per migration 9.3B |
| Hot path | **Pass** — no sync Notification/Search/AI |
| Channel create event fan-out | **Note** — one `participant.joined` per seeded member (consumer load, not Redis O(N)) |
| Membership sync | **Note** — join/leave/kick not always single DB transaction (drift risk under failure) |

---

## Cache Review

| Check | Result |
|-------|--------|
| Documented keys present | **Pass** — `conversation:{id}`, `conversation:user:{id}`, `inboxVersion`, `group:*`, `channel:{id}`, `poll:{id}` |
| Write-path O(N) ban | **Pass** — `invalidateDirectFanout`: N>2 → `INCR inboxVersion` + `DEL conversation:{id}` only |
| Global flush | **Pass** — none |
| Message history never cached | **Pass** |
| Targeted group/channel/poll invalidate | **Pass** |

**Gap:** `ConversationQueryService.listMine` returns cached inbox without comparing `conversation:{id}:inboxVersion`. Cache Strategy requires lazy refresh when version advances — GROUP message writes can leave inbox previews stale until TTL (~300s).

---

## Event Review

| Check | Result |
|-------|--------|
| Publish-only | **Pass** — `DomainEventPublisher` only; no cross-BC service calls |
| Names match matrix | **Pass** for 9.1–9.3 set in `COMMUNICATION_EVENTS` |
| No invented events | **Pass** |
| Leave emits `participant.left` not `conversation.deleted` | **Pass** |
| Payload privacy (ids, no bodies) | **Pass** (spot-checked hot paths) |

**Gap:** Group join/leave publishes `conversation.participant.joined/left.v1` with `aggregateType: 'Group'` and `aggregateId: groupId`. Event Matrix defines these as **Conversation** aggregate events (ordering key `conversationId`). Channel-seed paths that use conversation ids are correct; group-level join/leave typing should be fixed for consumers.

---

## Permission Review

| Facade | Role |
|--------|------|
| `ConversationPermissionService` | Active `ConversationMember` + visibility → access/write |
| `GroupPermissionService` | GroupRole SoT (OWNER / MODERATOR / MEMBER) |
| `BlockService` / `ContainerVisibilityResolver` | Reused for private DM visibility |

Pin / participant manage / ANNOUNCEMENTS write / GENERAL delete restrictions align with Permission Matrix. Engagement (like/react/bookmark) correctly uses participant access.

---

## OpenAPI Parity

| Slice | Implemented routes | Accidental future? |
|-------|--------------------|--------------------|
| 9.1 (9 ops) | **9/9** | No |
| 9.2 (12 ops) | **12/12** | No |
| 9.3 (32 ops) | **32/32** | No |
| 9.4+ attachments / voice / WS | **Not implemented** | Correct |
| 9.5 mark read | **Not implemented** | Correct |
| 9.6 search / forward | **Not implemented** | Correct |

Every implemented `operationId` maps to OpenAPI. No voice/search/forward/attachment endpoints found in the module.

**Contract debt:** All 32 Sprint 9.3 operations remain `x-gmrlog-status: future` in YAML while runtime exposes them. Freeze v1.1 called for separate OpenAPI unlock. Treat as change-control follow-up, not missing product scope.

**DTO gaps (cosmetic):** `replyCount` / `pinned` often defaulted in mapper; Conversation DTO lacks optional `groupId`/`channelId` if clients need bridge metadata.

---

## Freeze Parity

| Freeze v1.0 / v1.1 rule | Status |
|-------------------------|--------|
| Leave ≠ Delete | ✅ |
| GroupMember → ConversationMember ownership | ✅ (sync present; strengthen atomicity) |
| O(N) inbox DEL banned on write | ✅ |
| Block → 404 | ✅ DIRECT; tighten GROUP |
| Soft-delete Group/Channel; Restrict on Conversation | ✅ |
| No `Conversation.groupId` | ✅ |
| No app hard-delete groups/channels | ✅ |
| Poll without `MessageType.POLL` | ✅ |
| TEXT-only client writes (core paths) | ✅ |
| OpenAPI `future` until unlock | ⚠️ Runtime ahead of YAML flags |

No Freeze violation requires aggregate redesign.

---

## Test Summary

### Quality gates (executed 2026-07-18)

| Gate | Result |
|------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint (`src/communication/**` + communication e2e) | ✅ |
| Unit + integration (`vitest src/communication/`) | ✅ **8 files / 24 tests** |
| E2E (`conversations`, `message-engagement`, `groups-channels`) | ✅ **3 files / 3 tests** |

### Coverage strengths

- DIRECT create / leave / block→404 / cache O(1) vs N>2  
- Engagement edit window / like / react  
- Group → channel → message → poll → pin → reply happy path  

### Coverage gaps (debt)

- `ChannelService` dedicated unit tests  
- InboxVersion read reconcile  
- GROUP + block interaction  
- Moderator message delete  
- Non-atomic join failure / rollback  
- Anon `discoverGroups`  

---

## Risks

| Risk | Severity | Mitigation (future sprint — not in this audit) |
|------|----------|-----------------------------------------------|
| Stale GROUP inbox preview | **High** (UX) | Compare `inboxVersion` on `listMine` |
| Block-all-peers on GROUP | **Medium** | DIRECT-only block loop |
| Membership drift under partial failure | **Medium** | Single transaction join/leave/kick |
| Event aggregate mistype on group join/leave | **Medium** | Emit per conversationId or rename payload |
| OpenAPI `future` vs live 9.3 | **Medium** (process) | Clear flags or feature-gate |
| MOD cannot delete abusive messages | **Medium** (moderation) | Align with Permission Matrix |
| Group soft-delete without soft-deleting channels | **Low** | App policy cascade on `deleteGroup` |

---

## Technical Debt

1. Duplicated `validateMessageWrite` / `requireBody` across three services  
2. Container permission facade for conversations (works; document or replace)  
3. Flat module file count (~40) — optional subfolders later  
4. Mapper defaults for `pinned` / `replyCount`  
5. E2E cleanup FK noise (non-blocking)  

---

## Recommended Future Improvements

*(Documentation only — not authorized here; do **not** start Sprint 9.4 from this list automatically.)*

1. InboxVersion lazy refresh on conversation list  
2. Scope social block checks to DIRECT  
3. Atomic GroupMember ↔ ConversationMember sync  
4. Fix participant event aggregate ids for group join/leave  
5. OpenAPI change-control: clear 9.3 `future` or gate routes  
6. Moderator/owner message soft-delete  
7. Soft-delete channels when group is soft-deleted  
8. Expand tests for channel service, GROUP authz, discover anon  
9. Deduplicate message write helpers  

Realtime / presence / search remain **Sprint 9.4–9.6** per architecture map.

---

## Final Score

**8.2 / 10**

Solid production foundation for Communication V1 (9.1–9.3). Score held back by inbox read-path gap, GROUP block edge case, and OpenAPI change-control lag — not by missing aggregates or BC contamination.

---

## Final Decision

**APPROVED WITH MINOR CHANGES**

---

## Declaration

**COMMUNICATION MODULE V1 COMPLETE**

Sprint 9.1 + 9.2 + 9.3 (schema 9.3B + implementation 9.3C) form the Communication Platform V1 surface under Freeze v1.0 / v1.1. Minor changes listed above should be tracked as follow-up hardening; they do not block declaring V1 complete for architecture sign-off.

---

## Stop

Audit complete. **Do not continue to Sprint 9.4.**  
No implementation, migrations, or OpenAPI edits performed in this sprint.
