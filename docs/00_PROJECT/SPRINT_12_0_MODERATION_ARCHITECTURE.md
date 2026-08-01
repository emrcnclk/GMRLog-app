# Sprint 12.0 — Moderation Platform Architecture & Freeze

**Document:** `docs/00_PROJECT/SPRINT_12_0_MODERATION_ARCHITECTURE.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Type:** Documentation only — **no code, no Prisma, no migrations, no OpenAPI edits, no endpoint implementation**  
**Freeze:** [`MODERATION_PLATFORM_FREEZE_v1.md`](./MODERATION_PLATFORM_FREEZE_v1.md)  
**Scope precursor:** [`MODULE_12_SCOPE_REPORT.md`](./MODULE_12_SCOPE_REPORT.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 12.0 establishes **Moderation Platform Freeze v1.0**: Moderation is an independent **policy-enforcement BC** with a **centralized human queue**. Domains remain SoT for content; Users remain SoT for warn/suspend/ban flags. Reporting intake is immutable after create; audit is append-only; AI/ML/trust/toxicity/voice are **Phase 2**.

Entity-type gap resolved without schema invent: map OpenAPI `USER` → `PROFILE`; **defer `LIST`**. Appeals stay MVP for 12.3 pending OpenAPI change-control.

Implementation unlock: **Sprint 12.1 Reporting Core only**.

---

## Artifacts generated

| # | Document | Role |
|---|----------|------|
| 1 | `docs/01_ARCHITECTURE/MODERATION_ARCHITECTURE.md` | BC, lifecycles, delegation |
| 2 | `docs/01_ARCHITECTURE/ADR/ADR_Moderation_Platform.md` | ADR-MOD-001 |
| 3 | `docs/00_PROJECT/MODERATION_PLATFORM_FREEZE_v1.md` | Normative freeze |
| 4 | `docs/03_EVENTS/MODERATION_EVENT_MATRIX.md` | Reuse + required events |
| 5 | `docs/04_CACHE/MODERATION_CACHE_STRATEGY.md` | Targeted Redis / bans |
| 6 | `docs/05_SECURITY/MODERATION_PERMISSION_MATRIX.md` | AuthZ |
| 7 | `docs/05_SECURITY/MODERATION_VISIBILITY_MATRIX.md` | Privacy / 404 vs 403 |
| 8 | This report | Validation + approval |

**Not modified:** Prisma, OpenAPI, code, migrations.

---

## Architecture

| Topic | Decision |
|-------|----------|
| Ownership | Moderation owns Report / Queue / Action / Appeal policy + audit writes |
| Non-ownership | Users, Reviews, Communication, Notifications, Feed, Search |
| Queue | Centralized `ModerationQueueItem` |
| Actions | Domain ports for content; Users port for sanctions |
| Engine | Human-in-the-loop only |
| Schema | Reuse Freeze tables; no Warning/Ban/LIST enum invent |
| Events | Reuse review.* + `moderation.resolved.v1`; add `moderation.report.created.v1` + appeal/user sanction events |
| Cache | Optional short TTL; no FLUSHALL; no O(N) wipe |

Moderation **only enforces policy**.

---

## Freeze Decisions (locked)

| Decision | Lock |
|----------|------|
| Reporting lifecycle | Immutable intake; dedupe OPEN; always enqueue |
| Appeal lifecycle | Schema SoT; own-only; staff resolve; HTTP after change-control |
| Moderation queue | PENDING → IN_REVIEW → ESCALATED → RESOLVED |
| Audit | Append-only `AuditLog` + `ModerationAction` |
| Suspend | `isSuspended=true` (+ metadata days) |
| Ban | `isBanned=true` (+ content hide when applicable) |
| Warning | `strikeCount += 1` |
| Ownership | Policy BC vs domain SoT (ADR-MOD-001) |
| Visibility | Soft-delete 404; staff redacted previews |
| Permission | JWT roles; Senior Mod = process title under MODERATOR |
| Cache | Targeted only |
| Events | Matrix only |
| No AI / ML / Trust Score / Toxicity / Voice | Phase 2 |

Scope Report blockers **C1** (no Freeze) and matrix gap **M1** are closed by this sprint. **C2** (`LIST`/`USER`) disposition locked: map `USER`→`PROFILE`, defer `LIST`.

---

## Compatibility

| Source | Result |
|--------|--------|
| North Star | Safety enables belonging; AI assist deferred — **compatible** |
| ROADMAP / FEATURE_MATRIX | Report P0 Beta; Queue/Audit P1; AI P2 — **compatible** |
| Communication Freeze | Comm ACL + report façade; admin queue outside Comm — **compatible** |
| Notification Freeze | Consume events only — **compatible** |
| Search Freeze | Reads Users flags; no Moderation SERP — **compatible** |
| OpenAPI | Existing admin/report ops; LIST/Appeals gaps documented — **no OpenAPI edit** |
| Prisma / Database Freeze | No new tables/enums — **compatible** |
| Sprint 4.5 | Auto-apply sanctions now unlocked by Freeze (closes “record only”) — **compatible intentional change** |

**No Freeze conflicts** requiring redesign.

---

## OpenAPI consistency review (read-only)

| Area | Assessment |
|------|------------|
| Admin queue/reports/resolve | Align with Freeze V1 |
| `reportReview` / `reportMessage` | Align |
| `reportContent` entity `USER` | Map → `PROFILE` in implementation |
| `reportList` / `LIST` | **Deferred** — schema mismatch |
| Appeals | **No paths** — change-control before 12.3 |
| `adminBatchScanModeration` / `moderateContent` | Phase 2 |
| `adminUpdateUser` | Required adjacent for sanctions (12.3) |
| Hide/restore review | Runtime exists; OpenAPI gap — docs debt, no edit this sprint |

---

## Risks

| Risk | Severity | Mitigation in Freeze |
|------|----------|----------------------|
| Ownership leak if Reviews keeps queue forever | High | Extract Moderation module 12.1+ |
| BAN overreach | High | Mandatory audit; Admin preferred |
| Report spam | High | Dedupe + rate limit |
| Private preview leak | Medium | Redaction rules in Visibility Matrix |
| Appeals blocked on OpenAPI | Medium | Explicit change-control gate |
| LIST pressure to invent enum | Medium | Deferred until Database Freeze amendment |

---

## Residual Debt

| ID | Item | Disposition |
|----|------|-------------|
| D1 | Appeals HTTP missing from OpenAPI | Change-control before 12.3 |
| D2 | `LIST` enum missing | Defer `reportList` |
| D3 | Hide/restore OpenAPI gap | Later hygiene |
| D4 | MESSAGE resolve port not wired | Sprint 12.2 |
| D5 | Users sanction port / `adminUpdateUser` runtime missing | Sprint 12.3 |
| D6 | `ModeratorNote` unused | Optional polish |
| D7 | Dual emit `review.reported` + `moderation.report.created` during migration | 12.1 cleanup |
| D8 | Senior Moderator not in schema | Process title — OK |

---

## Sprint unlock

| Sprint | May start after Freeze accept? |
|--------|--------------------------------|
| **12.1 Reporting Core** | **Yes** (this Freeze) |
| 12.2 Queue & cross-entity resolve | After 12.1 |
| 12.3 Actions & Appeals | After ports + OpenAPI change-control for appeals |
| 12.4 Hardening | After 12.3 |
| 12.5 Final Audit | After 12.4 |
| AI / ML | **No** under Module 12 V1 |

---

## Approval

**APPROVED**

Moderation Platform Freeze v1.0 is complete and consistent with North Star, prior Freezes, OpenAPI (as-is), and Database Freeze. Minor residual debt (D1–D8) is tracked — not a reason to withhold Freeze acceptance.

---

## Gate

**Sprint 12.0 Architecture & Freeze complete.**

- No code  
- No Prisma changes  
- No OpenAPI changes  
- No migrations  
- No endpoint implementation  

**Stop.** Do **not** start Sprint 12.1 until this Freeze is explicitly accepted by stakeholders; when accepted, 12.1 may begin **Reporting Core only**.
