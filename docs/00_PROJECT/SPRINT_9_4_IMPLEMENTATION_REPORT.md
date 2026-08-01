# Sprint 9.4 — Message Attachments Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_9_4_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Message Attachments MVP only  
**Amendment:** [`SPRINT_9_4_ARCHITECTURE_AMENDMENT.md`](./SPRINT_9_4_ARCHITECTURE_AMENDMENT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 9.4 delivers **list** and **add** message attachments on existing messages. Reuses Freeze `MessageAttachment` / `MediaType`. No Voice, no WebSocket, no new tables, no new migrations, no new event names.

| Item | Result |
|------|--------|
| Operations shipped | **2 / 2** |
| New Prisma models / migrations | **0** |
| Voice / Realtime | **Not implemented** (forbidden) |
| Quality gates (scoped as 9.3C) | **Pass** |

---

## Implemented operations

| # | operationId | Method | Path | Status |
|---|-------------|--------|------|--------|
| 1 | `listMessageAttachments` | GET | `/conversations/{conversationId}/messages/{messageId}/attachments` | ✅ |
| 2 | `addMessageAttachment` | POST | `/conversations/{conversationId}/messages/{messageId}/attachments` | ✅ |

### Behaviour (SSOT-aligned)

| Rule | Implementation |
|------|----------------|
| AuthZ list | `ConversationPermissionService.assertCanAccess` (active participant) |
| AuthZ add | Access + **sender-only** (same pattern as message edit) |
| Soft-deleted message | `404` via `findAliveMessage` |
| `mediaType` | Freeze enum only: `IMAGE` \| `VIDEO` \| `GIF` \| `AUDIO` |
| Event | Existing **`message.updated.v1`** only (no new event names) |
| Cache | `invalidateDirectFanout` — no global flush |
| Persistence | Existing `message_attachments` table |

OpenAPI: Attachments ops and schemas unlocked (removed `x-gmrlog-status: future`); Voice remains `phase-2` / deferred.

---

## Files changed

### New

| File | Role |
|------|------|
| `apps/api/src/communication/message-attachment.dto.ts` | Request / list query DTOs |
| `apps/api/src/communication/message-attachment.entities.ts` | Response entities |
| `apps/api/src/communication/message-attachment.repository.ts` | Prisma persistence only |
| `apps/api/src/communication/message-attachment.service.ts` | Business rules |
| `apps/api/src/communication/message-attachment.service.spec.ts` | Unit |
| `apps/api/src/communication/message-attachment.integration.spec.ts` | Integration (doubles) |
| `apps/api/test/message-attachments.e2e-spec.ts` | E2E |

### Updated

| File | Change |
|------|--------|
| `apps/api/src/communication/conversations.controller.ts` | Thin list/add routes |
| `apps/api/src/communication/communication.module.ts` | Wire service + repository |
| `apps/api/src/communication/conversation.constants.ts` | `MESSAGE_MEDIA_TYPES` |
| `docs/08_API/COMMUNICATION_API.yaml` | Unlock Attachments; cursor/limit on list; MediaType enum |

### Explicitly not changed

- Prisma schema / migrations  
- Voice Room paths  
- Event Matrix event inventory (reused `message.updated.v1`)  
- WebSocket / typing / presence / read receipts / search / forward  

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` (with project `.env`) | ✅ Schema valid |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint `src/communication/**` + attachment e2e | ✅ |
| Unit + integration (`vitest src/communication`) | ✅ **29/29** |
| Attachment unit/integration | ✅ **5/5** |
| E2E `test/message-attachments.e2e-spec.ts` | ✅ sender add / peer list / non-sender 403 |

**Note:** Full-package `pnpm --filter @gmrlog/api lint` currently reports large **pre-existing** errors outside Communication (same scoping approach as Sprint 9.3C). Sprint 9.4 files and the communication module lint clean.

---

## Remaining future endpoints (out of Sprint 9.4)

| Area | OpenAPI | Status |
|------|---------|--------|
| Voice rooms (`get` / `open` / `close`) | `phase-2` + `future` + deferred after MVP | **Do not implement** |
| Realtime WebSocket gateway | Proposed Sprint **9.5** | **Do not start** |
| Read receipts (`markMessagesRead`) | tagged `9.5` today | Out of scope |
| Search / forward | tagged `9.6` | Out of scope |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Controllers thin (no business logic) | ✅ |
| Services own AuthZ + rules | ✅ |
| Repository = persistence only | ✅ |
| Existing permission services | ✅ `ConversationPermissionService` |
| Existing events only | ✅ `message.updated.v1` |
| Targeted Redis invalidation | ✅ `invalidateDirectFanout` |
| No global cache flush | ✅ |
| No new tables / Prisma models / migrations | ✅ |
| No Voice / Realtime / typing / presence | ✅ |
| Freeze MediaType reuse | ✅ |
| Leave ≠ Delete / block → 404 / O(N) ban | Unchanged ✅ |

---

## Gate

Sprint **9.4 Message Attachments complete.**

Do **not** continue to Sprint 9.5 (Realtime Foundation).

Do **not** implement Voice Platform.
