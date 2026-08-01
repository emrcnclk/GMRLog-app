# ADR — Admin Platform

**ADR ID:** ADR-ADM-001  
**Date:** 2026-07-20  
**Status:** **Accepted** (Sprint 13.0 — Admin Platform Freeze v1.0)  
**Deciders:** Architecture / API / Backend / Platform Ops / Trust & Safety  
**Preceded by:** [`MODULE_13_SCOPE_REPORT.md`](../../00_PROJECT/MODULE_13_SCOPE_REPORT.md)

---

## Context

`ADMIN_API.yaml` already describes a wide internal API (moderation, CMS, users, jobs, analytics, feature flags, audit). Runtime is uneven: **Moderation Module V1** shipped queue/appeals/sanctions; **Games** shipped `/admin/catalog` (OpenAPI gap); **Reviews** still hosts report admin + hide/restore; **Users admin HTTP**, **audit read**, **CMS**, **feature flags**, and **jobs** are largely missing. `apps/admin` is a Next.js stub.

`docs/15_ADMIN/ADMIN_ARCHITECTURE.md` sketched a full admin product (CMS/users/jobs in V1; flags/analytics/MFA in V1.5) without an orchestration Freeze. Module 13 Scope Report (`APPROVED WITH MINOR CHANGES`) required locking: Admin as orchestration-only, domains as SoT, narrowed MVP allowlist, `PlatformRole` vs `UserAdminRole` disposition, and BAN policy consistency with Moderation Freeze.

North Star: Admin is **not** a player product — it is infrastructure that protects a digital home for gaming culture.

## Decision

1. Treat **Admin Platform as an orchestration & presentation BC** — dashboard, management façades, operations, monitoring, configuration coordination — **not** a data owner for Users, Games, Moderation policy, Notifications, or Search.  
2. **Domains remain source of truth.** Admin controllers/UI **delegate** to Users, Games, Moderation, Reviews, Auth ports.  
3. **Do not reimplement Moderation.** Module 12 remains SoT for reports/queue/appeals/resolve policy; Admin **composes** those APIs in `apps/admin`.  
4. **MVP allowlist (narrow):** Admin shell; Users admin (`list`/`get`/`update`/`roles`/`sessions/revoke`); Audit **read** (+ export if cheap); compose T&S + Catalog; lock Roles/Permissions.  
5. **Out of MVP:** CMS, Feature Flags runtime, Jobs console, Analytics embeds, System Settings invent, Notification/Search admin suites, AI batch-scan, Enterprise MFA/four-eyes.  
6. **JWT AuthZ SoT = `PlatformRole`.** `AdminRole` / `UserAdminRole` must not become a second engine — mirror or leave unused.  
7. **BAN policy:** Align with Moderation Permission Matrix — `MODERATOR` may BAN with **mandatory audit**; Admin-only for role assign, CMS, flags, job control, audit export.  
8. **Reuse schema only** — no `SystemSetting` / Job tables in Module 13 V1; CMS/FeatureFlag tables already exist for Phase 2.  
9. **OpenAPI-first** for documented ADMIN_API ops — **do not invent** undeclared endpoints in implementation sprints; catalog paths already live remain OpenAPI **change-control** hygiene (not blocking compose).  
10. **Events:** Prefer reuse of `user.*` / `moderation.*` / domain events; do not invent Admin analytics spam; Phase 2 may add flag/CMS config events per Event Matrix.  
11. **Cache:** Targeted Redis only; no `FLUSHALL` / `KEYS` wipes.  
12. **Historical doc:** `docs/15_ADMIN/ADMIN_ARCHITECTURE.md` is non-normative when it conflicts with this ADR + Freeze.

## Why Admin is orchestration-only

- Operator UX needs one shell; entity rules differ per BC.  
- Duplicating Users/Games/Moderation data in Admin would fork SoT and break Freezes.  
- Moderation V1 already owns T&S policy — rebuilding it under Admin would regress Module 12.

## Why MVP is narrower than full ADMIN_API

- Shipping CMS + jobs + flags + analytics as “V1” recreates the Scope Report explosion risk.  
- Feature Matrix P1 for Admin after Moderation is **Audit Logs** + operational Users — not full CMS.  
- Schema-ready CMS/Flags can wait Phase 2 without blocking operator basics.

## Why PlatformRole wins

- Existing Nest guards already authorize on `PlatformRole`.  
- Dual writes without a lock cause privilege bugs (admin in one table, not in JWT).

## Consequences

- Sprint 13.1 can build shell + audit read without CMS.  
- Catalog UI may ship against live `/admin/catalog` before OpenAPI registration.  
- Feature Flags remain schema-only until Phase 2.  
- Notifications/Search stay untouched as SoT.  
- `docs/15_ADMIN` phases (V1 CMS/jobs) are **rephased** under this Freeze.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Admin owns Users/Games copies | Violates SoT; sync/privacy risk |
| Rebuild Moderation under Admin | Undoes Module 12 Freeze |
| Implement full ADMIN_API as Module 13 MVP | Scope explosion; contradicts Scope Report |
| `UserAdminRole` as primary AuthZ | Diverges from JWT guards already in production paths |
| Invent SystemSettings in V1 | No model; flags cover kill-switches later |
| Require OpenAPI catalog registration before UI compose | Runtime exists; hygiene is change-control, not MVP blocker |
| Admin-only BAN (ignore Moderation Freeze) | Breaks shipped T&S; dual policy confusion |

## Status

**Accepted** with Admin Platform Freeze v1.0.
