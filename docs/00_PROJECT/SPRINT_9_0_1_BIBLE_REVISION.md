# Sprint 9.0.1 — Communication Bible Revision

**Sprint:** 9.0.1 — Documentation Revision  
**Date:** 2026-07-18  
**Status:** **COMPLETE**  
**Code / migrations / endpoints implemented:** **None** (documentation only)

---

## Purpose

Apply Architecture Audit “Must Fix Before Sprint 9.1” decisions into the Communication SSOT, then declare **Communication Platform Freeze v1.0**.

```text
Sprint 9.0 (bible)
      ↓
Architecture Audit
      ↓
Sprint 9.0.1 (this revision)
      ↓
Communication Freeze v1.0
      ↓
Sprint 9.1 Conversation Core
```

---

## Locked decisions (written into docs)

| # | Decision | Primary docs |
|---|----------|--------------|
| 1 | Leave ≠ Delete | ARCHITECTURE, ADR, OpenAPI, EVENT_MATRIX, PERMISSION |
| 2 | GroupMember → ConversationMember ownership | ARCHITECTURE, ADR, PERMISSION |
| 3 | O(N) inbox cache invalidation ban | CACHE_STRATEGY, ADR |
| 4 | DM / block → always 404 | VISIBILITY, PERMISSION, OpenAPI createConversation |
| 5 | Sprint 9.1 scope lock + TEXT-only writes | FREEZE_v1, ARCHITECTURE, OpenAPI |

---

## Files updated

| File | Change |
|------|--------|
| `docs/08_API/COMMUNICATION_API.yaml` | Regenerated: `info.version 1.0.0`, leave semantics, block 404, 9.1 TEXT lock |
| `scripts/generate_communication_api.py` | Regenerator source for above |
| `docs/01_ARCHITECTURE/COMMUNICATION_ARCHITECTURE.md` | Normative decisions + 9.1 non-goals |
| `docs/01_ARCHITECTURE/ADR/ADR_Communication_Platform.md` | Status Accepted + Freeze amendments |
| `docs/03_EVENTS/COMMUNICATION_EVENT_MATRIX.md` | Leave vs deleted; ordering/idempotency/async |
| `docs/04_CACHE/COMMUNICATION_CACHE_STRATEGY.md` | O(N) ban + inboxVersion |
| `docs/05_SECURITY/COMMUNICATION_PERMISSION_MATRIX.md` | Leave/kick/destroy; PLATFORM_MOD; 404 |
| `docs/05_SECURITY/COMMUNICATION_VISIBILITY_MATRIX.md` | Unified 404 block policy |
| `docs/00_PROJECT/COMMUNICATION_PLATFORM_FREEZE_v1.md` | **NEW** — Freeze declaration |
| `docs/00_PROJECT/SPRINT_9_0_COMMUNICATION_ARCHITECTURE.md` | Status → superseded by 9.0.1 / Freeze |
| `docs/00_PROJECT/SPRINT_9_1_BLOCKER_REPORT.md` | Unblocked for 9.1 under Freeze |

---

## Explicit non-goals (this sprint)

- Backend code, Nest modules, Prisma migrations
- WebSocket implementation
- Database Freeze amendments for Groups/Channels
- Creating `MESSAGE_API.yaml`

---

## Stop / next

Sprint 9.0.1 complete. **Communication Platform Freeze v1.0 is declared.**

Next: **Sprint 9.1 — Conversation Core** against the frozen 9.1 operation slice only.
