# Sprint 9.4 — Scope Report (Planning Audit)

**Document:** `docs/00_PROJECT/SPRINT_9_4_SCOPE_REPORT.md`  
**Date:** 2026-07-18 (amended 2026-07-19)  
**Status:** Planning only — **no code**  
**MVP amendment:** [`SPRINT_9_4_ARCHITECTURE_AMENDMENT.md`](./SPRINT_9_4_ARCHITECTURE_AMENDMENT.md)  
**OpenAPI slice:** Operations tagged `x-gmrlog-sprint: '9.4'`  
**Architecture sprint title:** Message Attachments (MVP)

**SSOT precedence used:**

1. `NORTH_STAR.md`  
2. `COMMUNICATION_FREEZE_V1_1_FINAL.md`  
3. `COMMUNICATION_API.yaml`  
4. `COMMUNICATION_ARCHITECTURE.md`  

Supporting (non-authoritative for inventing ops): Event Matrix, Cache Strategy, Permission / Visibility matrices, existing V1 implementation (9.1–9.3C).

---

## Executive Summary

| Question | Answer |
|----------|--------|
| How many OpenAPI ops tagged `x-gmrlog-sprint: '9.4'`? | **2** (Attachments only) |
| How many are `x-gmrlog-status: future`? | **2 / 2** |
| Voice Room ops | **Deferred after MVP** — tagged `x-gmrlog-sprint: 'phase-2'` |
| WebSocket / typing / presence REST ops tagged 9.4? | **0** |
| Existing runtime coverage of these 2 ops | **0** |
| `MessageAttachment` Prisma table | **Present** (pre–Freeze v1.1 messaging) |
| `VoiceRoom` Prisma model / tables | **Absent** — **out of Sprint 9.4** |
| Voice Database Freeze in 9.4? | **No** — later Phase |
| Implementable after amendment? | **Attachments path unblocked for planning** — still needs `future` unlock + AuthZ/events before code |

**Verdict (post-MVP amendment):** Sprint 9.4 = **Message Attachments only**. Voice and WebSocket are **out of this sprint**. Architecture sprint map aligns with OpenAPI Attachments tags. Do **not** implement Voice. Do **not** implement WebSocket under 9.4.

---

## Sprint Goal

Deliver list / attach media on an existing message (`MessageAttachment`), subject to OpenAPI unlock and AuthZ / Event Matrix follow-ups documented in the Architecture Amendment.

**Explicit non-goals:** Voice rooms, Voice DB Freeze, WebSocket gateway, SFU/WebRTC, presence/read-receipt REST.

---

## Operations (Sprint 9.4 MVP)

All rows: `x-gmrlog-sprint: '9.4'` **and** `x-gmrlog-status: future`.

### Attachments

| # | operationId | Method | Endpoint |
|---|-------------|--------|----------|
| 1 | `listMessageAttachments` | GET | `/conversations/{conversationId}/messages/{messageId}/attachments` |
| 2 | `addMessageAttachment` | POST | `/conversations/{conversationId}/messages/{messageId}/attachments` |

---

## Deferred after MVP — Voice Platform

| # | operationId | Method | Endpoint | Tag |
|---|-------------|--------|----------|-----|
| — | `getVoiceRoom` | GET | `/groups/{groupId}/channels/{channelId}/voice-room` | `phase-2` + `future` |
| — | `openVoiceRoom` | POST | `/groups/{groupId}/channels/{channelId}/voice-room` | `phase-2` + `future` |
| — | `closeVoiceRoom` | DELETE | `/groups/{groupId}/channels/{channelId}/voice-room` | `phase-2` + `future` |

No Voice implementation, migration, or Prisma change in Sprint 9.4.

---

## Proposed adjacent sprints (not 9.4)

| Sprint | Focus |
|--------|--------|
| **9.5** | Realtime Foundation (WebSocket gateway) |
| **9.6** | Presence + read receipts REST (OpenAPI today tags `markMessagesRead` as `9.5` — retag cascade) |
| **9.7** | Search / forward / audit |
| **Phase 2 / Voice Platform** | VoiceRoom REST + Voice Database Freeze |

---

## Operation detail

### 1. `listMessageAttachments`

| Field | Detail |
|-------|--------|
| **Endpoint** | `GET /conversations/{conversationId}/messages/{messageId}/attachments` |
| **HTTP Method** | GET |
| **Description** | List attachments for a message (cursor page). |
| **Auth** | JWT (conversation access) |
| **Prisma** | `MessageAttachment` exists |
| **Status** | `future` until change-control unlock |

### 2. `addMessageAttachment`

| Field | Detail |
|-------|--------|
| **Endpoint** | `POST /conversations/{conversationId}/messages/{messageId}/attachments` |
| **HTTP Method** | POST |
| **Description** | Attach media to message; prefer media presign pipeline. |
| **Auth** | JWT (conversation write / message author rules TBD in Permission Matrix) |
| **Prisma** | `MessageAttachment` exists |
| **Status** | `future` until change-control unlock |

---

## Dependencies & Freeze

| Concern | Status |
|---------|--------|
| Freeze v1.0 / v1.1 | Attachments table already present; Voice tables **forbidden** until dedicated Voice Freeze |
| Event Matrix | No attachment-specific events yet — amend or reuse before write path |
| Permission Matrix | Attachment author / member rules underspecified |
| Media storage | Presign outside Communication BC — do not invent storage APIs here |
| North Star | Not competing with Discord → Voice deferred supports scope discipline |

---

## Risks (Attachments-only)

1. Shipping attach write without AuthZ / rate limits → spam surface.  
2. Event Matrix gap → silent fan-out / notification miss.  
3. OpenAPI `future` still set — same unlock gate as prior sprints.  
4. Confusing product ROADMAP “Phase 2 Closed Beta” with Communication “Phase 2 / Voice Platform”.  
5. OpenAPI `markMessagesRead` still tagged `9.5` while Architecture proposes Realtime as 9.5.

---

## Blockers (post-amendment)

| ID | Blocker | Severity | For |
|----|---------|----------|-----|
| B1 | Architecture vs OpenAPI sprint meaning (WS vs Attachments) | **Resolved** | Amendment + Architecture map |
| B2 | VoiceRoom tables + Freeze | **Deferred** | Phase 2 / Voice — not a 9.4 blocker |
| B3 | Attachments ops still `x-gmrlog-status: future` | **Critical** for shipping | OpenAPI unlock before implementation |
| B4 | No Event Matrix entries for attachment mutations | **High** | Amend matrix or mandate reuse |
| B5 | Permission Matrix silent on who may attach | **High** | Document AuthZ before implementation |
| B6 | Media presign pipeline not defined in Communication Freeze | **Medium** | Point to storage SSOT |
| B7 | OpenAPI `9.5` = `markMessagesRead` vs proposed Realtime 9.5 | **Medium** | Retag cascade (docs only) |

**Rule:** Do not implement Attachments until B3–B5 cleared. Do not implement Voice in 9.4.

---

## Recommended Order

```text
0. Clear B3 (future unlock) + B4/B5 (events / AuthZ) for attachments
1. listMessageAttachments
2. addMessageAttachment (presign + AuthZ)
3. Separately schedule Sprint 9.5 Realtime Foundation (WebSocket)
4. Separately schedule Phase 2 / Voice Platform (Freeze → migration → REST)
```

---

## Architecture Notes

1. Sprint 9.4 = Message Attachments only (MVP).  
2. Voice = Deferred after MVP (`phase-2`).  
3. Realtime = Sprint 9.5 proposal (not OpenAPI REST under 9.4).  
4. V1 Communication module (9.1–9.3) remains complete; Leave ≠ Delete, O(N) cache ban, block → 404 unchanged.  
5. Community / Forums stay out of Communication.

---

## Explicit non-goals (this Scope Report)

- Implementing Attachment or Voice ops  
- WebSocket gateway coding  
- Voice SFU / WebRTC design  
- Voice Database Freeze / Prisma VoiceRoom  
- Inventing events, cache keys, or tables beyond documented amendments  

---

## Stop

Scope Report amended for MVP. **No code, migrations, Prisma changes, or endpoint implementation.**
