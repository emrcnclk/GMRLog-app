# Sprint 10.0 — Notifications Architecture

**Document:** `docs/00_PROJECT/SPRINT_10_0_NOTIFICATION_ARCHITECTURE.md`  
**Date:** 2026-07-19  
**Status:** **COMPLETE**  
**Code / migrations / Prisma / endpoints implemented:** **None** (documentation only)

---

## Purpose

Produce the complete Notification Platform SSOT and declare **Notification Platform Freeze v1.0**, unlocking Sprint **10.1 Notification Core**.

```text
Module 10 Scope Report
      ↓
Sprint 10.0 (this architecture)
      ↓
Notification Platform Freeze v1.0
      ↓
Sprint 10.1 Notification Core
```

---

## Documents produced

| Document | Path |
|----------|------|
| Architecture | `docs/01_ARCHITECTURE/NOTIFICATION_ARCHITECTURE.md` |
| ADR | `docs/01_ARCHITECTURE/ADR/ADR_Notification_Platform.md` |
| Event Matrix | `docs/03_EVENTS/NOTIFICATION_EVENT_MATRIX.md` |
| Cache Strategy | `docs/04_CACHE/NOTIFICATION_CACHE_STRATEGY.md` |
| Permission Matrix | `docs/05_SECURITY/NOTIFICATION_PERMISSION_MATRIX.md` |
| Visibility Matrix | `docs/05_SECURITY/NOTIFICATION_VISIBILITY_MATRIX.md` |
| OpenAPI (Freeze annotations) | `docs/08_API/NOTIFICATION_API.yaml` |
| Freeze declaration | `docs/00_PROJECT/NOTIFICATION_PLATFORM_FREEZE_v1.md` |
| This report | `docs/00_PROJECT/SPRINT_10_0_NOTIFICATION_ARCHITECTURE.md` |

---

## Locked decisions (summary)

1. Notifications BC — never source of truth; event-driven create.  
2. Preference dual-model (coarse API + type×channel worker SoT).  
3. Recipient-only AuthZ → **404**.  
4. IN_APP first; no Push/Email **send**; no realtime in 10.1–10.3.  
5. Auth SYSTEM writer temporary until 10.4.  
6. No new NotificationType / tables without Database Freeze amendment.  
7. `FRIEND_ONLINE` / Communication alerts / marketing discount deferred.

---

## Sprint map (confirmed)

| Sprint | Focus |
|--------|--------|
| 10.0 | Architecture Freeze — **done** |
| 10.1 | Inbox Core (REST) |
| 10.2 | Social Notifications (ingest) |
| 10.3 | Gaming Notifications (ingest) |
| 10.4 | Delivery foundation (tokens, queue enqueue, Auth migration) — **still no vendor send required** |
| 10.5 | Final Audit |

---

## Architecture Review Summary

### Strengths

- Reuses existing Freeze schema and OpenAPI — no speculative tables.  
- Aligns with Communication/Feed/Achievements patterns (publish-only upstream, consumer BC).  
- North Star guardrails explicit (anti-spam, no Discord presence, gaming-meaningful types).  
- Clear channel phasing avoids premature Push/Email complexity.  
- Preference dual-model resolves Scope Report minor change R1.

### Residual risks (accepted)

| Risk | Handling |
|------|----------|
| Upstream event name / discriminant gaps (collections/lists likes) | Event Matrix gap protocol — no faking; fix upstream or defer type |
| In-process bus durability | Documented; outbox is platform Phase — not blocking 10.1 inbox |
| Auth dual-path | Time-boxed to 10.4 |
| Communication types missing | Phase 2 enum amendment |

### Compliance check

| Requirement | Status |
|-------------|--------|
| Docs only / no code | Pass |
| No migrations / Prisma | Pass |
| No endpoint implementation | Pass |
| No Push/Email/realtime implementation | Pass (deferred by Freeze) |
| North Star | Pass |
| Module 10 Scope Report alignment | Pass |

### Review decision

**APPROVED** — Freeze v1.0 declared; Sprint **10.1** may begin.

---

## Stop

Sprint 10.0 complete. **No implementation.** Await Sprint 10.1 authorization.
