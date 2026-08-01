# Sprint 12.1 — Moderation Reporting Core Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_12_1_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Reporting Core only — create + queue enqueue (Freeze v1.0)  
**Freeze:** [`MODERATION_PLATFORM_FREEZE_v1.md`](./MODERATION_PLATFORM_FREEZE_v1.md)  
**Architecture:** [`SPRINT_12_0_MODERATION_ARCHITECTURE.md`](./SPRINT_12_0_MODERATION_ARCHITECTURE.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 12.1 introduces the **Moderation BC** and unified **report create + PENDING queue enqueue**. Reviews and Communication keep thin façades; Social `POST /reports` covers PROFILE (via OpenAPI `USER`), REVIEW, COLLECTION, and TIERLIST. Domains remain SoT for target existence/ACL. No resolve, assign, WARN/SUSPEND/BAN, appeals, AI, Prisma, or OpenAPI edits.

| Item | Result |
|------|--------|
| Freeze 12.1 scope | **Reporting Core** |
| MVP types | `REVIEW`, `MESSAGE`, `PROFILE`, `COLLECTION`, `TIERLIST` |
| Deferred | `LIST`, `COMMENT`, `POST` |
| New tables / migrations / OpenAPI | **0** |
| Quality gates | **Pass** (scoped) |

---

## Implemented operations

| # | operationId | Method | Path | Notes |
|---|-------------|--------|------|-------|
| 1 | `reportReview` | POST | `/reviews/{reviewId}/report` | Façade → `ReportCreateService` |
| 2 | `reportMessage` | POST | `/conversations/.../messages/{messageId}/report` | Façade → `ReportCreateService` |
| 3 | `reportContent` | POST | `/reports` | New Social surface; `USER`→`PROFILE` |

### Behaviour

| Rule | Implementation |
|------|----------------|
| Unified create | `ReportCreateService` — reason resolve, self-report deny, duplicate OPEN/IN_REVIEW deny, create `Report` + `ModerationQueueItem` (PENDING) |
| Queue | **Enqueue only** — no resolve / assign / decision |
| Audit (create only) | `AuditLog` action `moderation.report.create` |
| Events | `moderation.report.created.v1`; review path dual-emits `review.reported.v1` |
| Visibility | Missing / non-visible targets → **404**; self-report → **403**; duplicate → **409** |
| LIST / COMMENT / POST | Rejected as unsupported (400) — no schema invent |
| Cache | No FLUSH; optional reasons cache not required — create path does not wipe namespaces |
| Controllers | Thin |
| Admin queue resolve | **Unchanged** (still Reviews BC — out of 12.1) |

---

## Files created

| File | Role |
|------|------|
| `apps/api/src/moderation/moderation.module.ts` | Nest module |
| `apps/api/src/moderation/moderation.constants.ts` | MVP types, reason map, events |
| `apps/api/src/moderation/moderation-report.repository.ts` | Create + queue + create audit |
| `apps/api/src/moderation/report-create.service.ts` | Unified create policy |
| `apps/api/src/moderation/report-target.service.ts` | Social target resolve (Users/Reviews/Collections/TierLists) |
| `apps/api/src/moderation/report.entities.ts` | Create DTOs |
| `apps/api/src/moderation/report.exceptions.ts` | Problem+json errors |
| `apps/api/src/moderation/report.dto.ts` | Social request DTO |
| `apps/api/src/moderation/social-reports.controller.ts` | `POST /reports` |
| `apps/api/src/moderation/report-create.service.spec.ts` | Unit |
| `apps/api/src/moderation/report-target.service.spec.ts` | Unit |
| `apps/api/src/communication/message-report.service.spec.ts` | Façade unit |
| `apps/api/test/moderation-reporting.e2e-spec.ts` | E2E reporting |
| `docs/00_PROJECT/SPRINT_12_1_IMPLEMENTATION_REPORT.md` | This report |

## Files updated

| File | Change |
|------|--------|
| `apps/api/src/app.module.ts` | Import `ModerationModule` (before Reviews/Communication) |
| `apps/api/src/reviews/reviews.module.ts` | Import `ModerationModule` |
| `apps/api/src/reviews/moderation/report.service.ts` | `reportReview` delegates to `ReportCreateService` |
| `apps/api/src/reviews/moderation/report.service.spec.ts` | Façade tests |
| `apps/api/src/communication/communication.module.ts` | Import `ModerationModule` |
| `apps/api/src/communication/message-engagement.service.ts` | `reportMessage` delegates to `ReportCreateService` |
| `apps/api/src/communication/message-engagement.service.spec.ts` | Constructor mock for create service |

---

## Events used

| Event | When |
|-------|------|
| `moderation.report.created.v1` | Every accepted report |
| `review.reported.v1` | Review reports (migration dual-emit) |

No invented events. No `moderation.resolved.v1` in this sprint.

---

## Cache behavior

- Targeted strategy respected: **no FLUSHALL / namespace wipe**.  
- Create path writes Postgres only; does not invalidate queue list caches (none required for 12.1).  
- Optional `moderation:reasons:active` left unused (reasons read via Prisma).

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint (Sprint 12.1 scoped files, `--max-warnings 0`) | ✅ |
| Unit (`src/moderation`, report façades, message report) | ✅ **20/20** |
| E2E `moderation-reporting` + `reviews-moderation` | ✅ **8/8** |

---

## Deferred (explicit)

| Item | Sprint / Phase |
|------|----------------|
| Queue resolve / assign / decisions | **12.2** |
| WARN / SUSPEND / BAN via Users | **12.3** |
| Appeals HTTP | **12.3** (+ OpenAPI change-control) |
| `LIST` reports | After Database Freeze enum amendment |
| `COMMENT` / `POST` reports | Later product priority |
| AI / toxicity / trust / voice | Phase 2 |
| Admin stats / batch-scan | Deferred |
| ModeratorNote productization | Optional polish |
| OpenAPI / Prisma edits | Forbidden this sprint |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Moderation Nest module | ✅ |
| Domains remain SoT | ✅ |
| Report create + queue enqueue | ✅ |
| No resolve / sanctions / appeals | ✅ |
| Event Matrix only | ✅ |
| No FLUSHALL | ✅ |
| `USER` → `PROFILE`; `LIST` deferred | ✅ |
| No Prisma / OpenAPI invent | ✅ |

---

## Gate

**SPRINT 12.1 COMPLETE**

Do **not** continue to Sprint 12.2.
