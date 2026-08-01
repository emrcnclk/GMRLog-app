# Sprint 9.0 — Communication Platform Bible

**Sprint:** 9.0 — COMMUNICATION_API Bible  
**Date:** 2026-07-18  
**Status:** **COMPLETE — Superseded for implementation gating by Sprint 9.0.1 / Freeze v1.0**  
**Code / migrations / endpoints implemented:** **None** (documentation only)

**See instead:**

- [`SPRINT_9_0_1_BIBLE_REVISION.md`](./SPRINT_9_0_1_BIBLE_REVISION.md)
- [`COMMUNICATION_PLATFORM_FREEZE_v1.md`](./COMMUNICATION_PLATFORM_FREEZE_v1.md)

---

## Deliverables

| File | Purpose |
|------|---------|
| [`docs/08_API/COMMUNICATION_API.yaml`](../08_API/COMMUNICATION_API.yaml) | OpenAPI 3.1 REST contract |
| [`docs/01_ARCHITECTURE/COMMUNICATION_ARCHITECTURE.md`](../01_ARCHITECTURE/COMMUNICATION_ARCHITECTURE.md) | Bounded context & aggregates |
| [`docs/01_ARCHITECTURE/ADR/ADR_Communication_Platform.md`](../01_ARCHITECTURE/ADR/ADR_Communication_Platform.md) | Why Communication ≠ Messaging |
| [`docs/03_EVENTS/COMMUNICATION_EVENT_MATRIX.md`](../03_EVENTS/COMMUNICATION_EVENT_MATRIX.md) | Domain events |
| [`docs/04_CACHE/COMMUNICATION_CACHE_STRATEGY.md`](../04_CACHE/COMMUNICATION_CACHE_STRATEGY.md) | Redis keys & invalidation |
| [`docs/05_SECURITY/COMMUNICATION_PERMISSION_MATRIX.md`](../05_SECURITY/COMMUNICATION_PERMISSION_MATRIX.md) | AuthZ matrix |
| [`docs/05_SECURITY/COMMUNICATION_VISIBILITY_MATRIX.md`](../05_SECURITY/COMMUNICATION_VISIBILITY_MATRIX.md) | Visibility / privacy |
| `scripts/generate_communication_api.py` | Regenerator for the YAML bible |

**Not created:** `MESSAGE_API.yaml` (explicitly rejected).

---

## OpenAPI summary (as of 9.0; revised in 9.0.1)

- **Auth:** Bearer JWT
- **Errors:** ProblemDetails via `./common/responses.yaml`
- **Pagination:** Cursor + Limit
- **Extensions:** `x-gmrlog-status`, `x-gmrlog-sprint`, `x-rate-limit`, `x-idempotent`

### Domains covered

Conversations, Participants, Messages, ReadReceipts, Reactions, Threads, Groups, GroupMembers, Channels, Polls, Mentions, Pins, Bookmarks, Attachments (future), VoiceRooms (future).

---

## Sprint roadmap (locked)

| Sprint | Scope |
|--------|--------|
| **9.0** | Bible (this sprint) |
| **9.0.1** | Bible revision + Freeze v1.0 |
| **9.1** | Conversation Core |
| **9.2** | Messaging Core |
| **9.3** | Groups & Channels |
| **9.4** | Realtime |
| **9.5** | Presence + Read Receipts |
| **9.6** | Audit / search / forward |

---

## Explicit non-goals (this sprint)

- Backend code, Nest modules, Prisma migrations
- WebSocket implementation
- Notification/Feed wiring
- Creating `MESSAGE_API.yaml`

---

## Historical note

Sprint 9.0 delivered the initial bible. Architecture Audit required five Must Fix items before coding. Those landed in **Sprint 9.0.1**; implementation gating is **Communication Platform Freeze v1.0**, not raw 9.0 drafts.
