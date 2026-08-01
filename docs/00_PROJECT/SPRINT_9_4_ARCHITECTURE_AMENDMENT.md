# Sprint 9.4 — Architecture Amendment (MVP Scope)

**Document:** `docs/00_PROJECT/SPRINT_9_4_ARCHITECTURE_AMENDMENT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect  
**Type:** Architecture amendment — **docs only**  
**Status:** Review complete  

**SSOT precedence applied:**

1. `NORTH_STAR.md`  
2. `COMMUNICATION_PLATFORM_FREEZE_v1.md`  
3. `COMMUNICATION_FREEZE_V1_1_FINAL.md`  
4. `COMMUNICATION_API.yaml`  
5. `COMMUNICATION_ARCHITECTURE.md`  

Supporting: `SPRINT_9_4_SCOPE_REPORT.md`, Event Matrix, Cache Strategy, Permission / Visibility matrices, `docs/01_PRODUCT/ROADMAP.md`.

**Forbidden in this review:** code, migrations, Prisma schema edits, endpoint implementation.

---

## Executive Summary

MVP decision removes Voice from Communication Sprint 9.4. Sprint 9.4 is **Message Attachments only**. Voice Room REST stays `future` and is retagged to **Phase 2 / Voice Platform**. Architecture’s former “9.4 = Realtime WebSocket” label is replaced by **9.4 = Attachments** and a new proposed **Sprint 9.5 – Realtime Foundation**.

| Decision | Result |
|----------|--------|
| Sprint 9.4 scope | **Attachments only** (`listMessageAttachments`, `addMessageAttachment`) |
| Voice Room REST | **Deferred after MVP** — no implementation in 9.4 |
| Voice Database Freeze | **Later Phase** — not Freeze v1.1, not Sprint 9.4 |
| WebSocket Gateway | **Sprint 9.5 – Realtime Foundation** (proposed) |
| Voice product tranche | **Phase 2 / Voice Platform** (Communication naming; not product Closed Beta Phase 2) |

---

## 1. Controls checked

### North Star

| Check | Result |
|-------|--------|
| Digital home for gaming culture | Attachments support shared media in gaming spaces without Discord-scale voice |
| Not competing with Discord | **Pass** — Voice deferred reduces Discord-clone pressure |
| Meaningful community connections | Attachments remain in-scope for MVP messaging completeness |

### Freeze v1.0 (`COMMUNICATION_PLATFORM_FREEZE_v1.md`)

| Check | Result |
|-------|--------|
| Leave ≠ Delete | Unaffected |
| GroupMember → ConversationMember | Unaffected |
| O(N) cache ban | Unaffected — attach write must keep publish-only + invalidate patterns |
| Block → 404 | Unaffected |
| No inventing tables outside Freeze | **Pass** — Voice tables remain out; `MessageAttachment` already present |

### Freeze v1.1 Final

| Check | Result |
|-------|--------|
| Voice-room tables out of Freeze | **Confirmed** — Voice DB Freeze deferred |
| Groups / Channels / Pins / Polls surface | Complete for 9.3; not reopened by 9.4 |
| Soft-delete Group/Channel; Restrict FKs | Unaffected |

### OpenAPI (`COMMUNICATION_API.yaml`)

| Before amendment | After amendment |
|------------------|-----------------|
| 5 ops tagged `9.4` (2 Attachments + 3 Voice) | **2** ops tagged `9.4` (Attachments) |
| Voice tagged `9.4` + `future` | Voice tagged **`phase-2`** + `future` + `x-gmrlog-deferred: after-mvp` |
| Architecture name “Realtime” vs tags “Attachments/Voice” | Architecture **9.4 = Attachments**; Realtime proposed as **9.5** |

### Architecture (`COMMUNICATION_ARCHITECTURE.md`)

| Before | After |
|--------|-------|
| Sprint map: 9.4 Realtime WebSocket | **9.4 Message Attachments** |
| 9.5 Presence + read receipts | **9.5 Realtime Foundation** (proposed); presence/read → **9.6** with OpenAPI retag note |
| BC tree: VoiceRooms / Attachments `[future]` | Attachments **9.4 MVP**; VoiceRooms **Phase 2 deferred**; WS **9.5 proposed** |

### ROADMAP (`docs/01_PRODUCT/ROADMAP.md`)

| Clarification | Action |
|---------------|--------|
| Product **Phase 2 = Closed Beta** ≠ Voice Platform | Note added under Phase 2 Deliverables |
| Voice Platform placement | Listed under Phase 3 **Improved Messaging** as Communication Phase 2 deferred tranche |

---

## 2. Amended Sprint 9.4 Scope

### In scope (MVP)

| # | operationId | Method | Path |
|---|-------------|--------|------|
| 1 | `listMessageAttachments` | GET | `/conversations/{conversationId}/messages/{messageId}/attachments` |
| 2 | `addMessageAttachment` | POST | `/conversations/{conversationId}/messages/{messageId}/attachments` |

Constraints:

- No Voice code, schema, or Freeze work.  
- No WebSocket gateway under 9.4.  
- Reuse existing `MessageAttachment` model; no invented attachment tables.  
- Controllers thin; AuthZ in services; events publish-only; no O(N) fan-out on write cache path.

### Out of scope (explicit)

- `getVoiceRoom` / `openVoiceRoom` / `closeVoiceRoom`  
- Voice Database Freeze / Prisma `VoiceRoom`  
- SFU / WebRTC / LiveKit design  
- WebSocket gateway, typing/presence transport  
- Search / forward / read-receipt REST (other sprint tags)  
- Forums / Community ownership

---

## 3. Voice — Deferred after MVP

| Item | Normative stance |
|------|------------------|
| OpenAPI status | Remains `x-gmrlog-status: future` |
| OpenAPI sprint | `x-gmrlog-sprint: 'phase-2'` (no longer `9.4`) |
| Extension | `x-gmrlog-deferred: after-mvp` |
| Database | **No** Voice Freeze in Communication MVP; later Phase owns schema + migration authorization |
| Implementation | **Forbidden** until Phase 2 / Voice Platform is unlocked by Freeze + change-control |

Rationale (North Star): GMRLOG is not Discord; shipping channel voice before Attachments and Realtime foundation invites scope creep and Freeze invention risk.

---

## 4. Architecture ↔ OpenAPI alignment

| Layer | Sprint 9.4 meaning |
|-------|-------------------|
| OpenAPI | Attachments ops tagged `9.4` |
| Architecture sprint map | **Message Attachments** |
| Scope Report | Attachments-only inventory |

Historical conflict (“Architecture 9.4 = WebSocket”) is **closed** by this amendment.

---

## 5. Proposed Sprint 9.5 — Realtime Foundation

| Field | Proposal |
|-------|----------|
| **Name** | Sprint 9.5 – Realtime Foundation |
| **Goal** | WebSocket gateway / adapter that **subscribes** to existing Communication domain events |
| **Non-goals** | Inventing REST paths for typing/presence; Voice; Attachments (owned by 9.4) |
| **SSOT hooks** | Event Matrix (WS-only typing/presence); Architecture “realtime adapter”; no O(N) cache fan-out |
| **REST inventory** | **None required** for gateway itself in current OpenAPI |

### Tag collision (minor follow-up)

OpenAPI today tags `markMessagesRead` as `x-gmrlog-sprint: '9.5'`. Architecture previously called 9.5 “Presence + read receipts.”

**Recommended retag cascade (docs-only, not done in this review beyond documentation):**

| Op / theme | Current OpenAPI tag | Proposed after cascade |
|------------|---------------------|------------------------|
| WebSocket gateway | (untagged) | **Sprint 9.5** Realtime Foundation |
| `markMessagesRead` | `9.5` | **`9.6`** |
| `searchConversationMessages`, `forwardMessage` | `9.6` | **`9.7`** |

Until the cascade lands, treat **Realtime Foundation** as the Architecture name for the next post-Attachments sprint, and keep `markMessagesRead` as OpenAPI-tagged `9.5` work that must not be confused with the WS gateway.

---

## 6. Proposed Phase 2 / Voice Platform

| Field | Proposal |
|-------|----------|
| **Name** | Phase 2 / Voice Platform (Communication post-MVP) |
| **Includes** | Voice Database Freeze → migration → `VoiceRoom` Prisma → unlock OpenAPI Voice ops → implement get/open/close |
| **OpenAPI** | Ops already tagged `phase-2` + `future` + deferred |
| **Product ROADMAP** | **Not** Closed Beta Phase 2; track under Launch/Growth **Improved Messaging** (or later) |
| **North Star guardrail** | Minimal gaming-space voice — not a Discord competitor feature set |

---

## 7. Docs updated in this amendment pass

| Document | Change |
|----------|--------|
| `COMMUNICATION_ARCHITECTURE.md` | Sprint map + BC tree for Attachments / Realtime / Voice deferred |
| `COMMUNICATION_API.yaml` | Voice ops: `phase-2`, deferred descriptions; Attachments remain `9.4` |
| `SPRINT_9_4_SCOPE_REPORT.md` | Rewritten to Attachments-only MVP |
| `docs/01_PRODUCT/ROADMAP.md` | Clarified Phase 2 ≠ Voice; Voice Platform note under Improved Messaging |
| **This file** | Amendment + decision |

**Not changed:** Prisma, migrations, NestJS code, Event Matrix, Permission Matrix, Freeze lock texts (Voice remains out of v1.1 by existing Final).

---

## 8. Remaining work before Sprint 9.4 implementation

These are **not** blockers to accepting the MVP scope amendment; they **are** blockers to coding Attachments:

1. Clear `x-gmrlog-status: future` on the two Attachments ops (change-control).  
2. Amend Event Matrix (or document reuse of `message.updated.v1` / equivalent).  
3. Document Permission Matrix rules (who may list/attach; soft-deleted message behavior).  
4. Point attach write to existing media presign / storage SSOT.  
5. (Optional, parallel) OpenAPI retag cascade for 9.5/9.6/9.7 vs Realtime Foundation naming.

---

## 9. Decision

MVP scope amendment is accepted. Sprint 9.4 identity conflict is resolved. Voice is correctly deferred. Realtime and Voice Platform roadmaps are proposed. Residual items are OpenAPI unlock / AuthZ / events for Attachments, and the **9.5 tag collision** with `markMessagesRead`.

### APPROVED WITH MINOR CHANGES

**Minor changes (docs follow-ups — no code):**

1. Retag cascade: `markMessagesRead` `9.5` → `9.6`; search/forward `9.6` → `9.7` so Sprint **9.5** uniquely means Realtime Foundation.  
2. Event Matrix + Permission Matrix attachment rows before implementation kickoff.  
3. OpenAPI Attachments `future` unlock when ready to implement.  
4. Prefer naming “Communication Phase 2 / Voice Platform” in planning docs to avoid confusion with product ROADMAP Phase 2 Closed Beta.

---

## Stop

Architecture amendment review complete. **No code, migrations, Prisma changes, or endpoint implementation.** Await separate implementation authorization for Sprint 9.4 Attachments after minor follow-ups above.
