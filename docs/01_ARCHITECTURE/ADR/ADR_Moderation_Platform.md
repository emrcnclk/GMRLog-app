# ADR — Moderation Platform

**ADR ID:** ADR-MOD-001  
**Date:** 2026-07-19  
**Status:** **Accepted** (Sprint 12.0 — Moderation Platform Freeze v1.0)  
**Deciders:** Architecture / API / Backend / Trust & Safety  
**Preceded by:** [`MODULE_12_SCOPE_REPORT.md`](../../00_PROJECT/MODULE_12_SCOPE_REPORT.md)

---

## Context

GMRLOG Feature Matrix (Domain 15) requires **Report Content / User / Review** (P0) and **Admin Queue + Audit** (P1). Database Freeze already provides Report / Queue / Action / Appeal / AuditLog tables. Runtime today nests platform moderation under **Reviews BC**, with Communication writing MESSAGE reports into the same tables. WARN/SUSPEND/BAN are **recorded but not applied**. There is no Moderation Nest module, no Appeals HTTP, and no AI assist.

North Star is **AI Native** long-term for moderation assist — Product Backlog and Scope Report place AI/toxicity/image/voice in **Phase 2**. Module 12 Scope Report (`APPROVED WITH MINOR CHANGES`) required locking: independent Moderation BC, domains as SoT, centralized queue, real user sanctions via Users, entity-type mapping without inventing schema.

## Decision

1. Treat **Moderation & Safety as its own bounded context** that **enforces policy** — not as a data owner for Users, Reviews, Communication, or Notifications.  
2. **Domains remain source of truth.** Content hide/restore/edit executes through **domain ports**. User warn/suspend/ban executes through a **Users port**.  
3. **Centralize the human queue** in `ModerationQueueItem` for all reportable entity types — one queue, many façades.  
4. **Extract** queue/report/resolve services out of Reviews into `apps/api/src/moderation/` across Module 12 sprints; keep domain report URLs as thin façades.  
5. **Reuse Freeze tables only** — no `Warning` / `Ban` / `Suspension` / `ReportTarget` / `ModerationLog` tables; use User flags + `ModerationAction` + `AuditLog`.  
6. **Entity mapping:** Social `USER` → store `PROFILE`; **defer `LIST`** reports until Database Freeze adds `LIST` (do not invent enum in Module 12).  
7. **Close Sprint 4.5 exception:** WARN/SUSPEND/BAN must **apply** Users flags with audit.  
8. **Human-in-the-loop MVP** — no AI, ML, toxicity, image, voice, trust score, or auto-escalation engines.  
9. **OpenAPI-first** for existing admin/report ops — do not invent undeclared endpoints; Appeals HTTP requires change-control before 12.3 coding.  
10. Prefer **reuse** of existing events (`review.reported.v1`, `review.hidden.v1`, `review.restored.v1`, `moderation.resolved.v1`); add only Freeze-listed Moderation/Users events.  
11. Match platform patterns: thin controllers, services, repositories, targeted Redis invalidation, append-only audit.

## Why Moderation is an independent BC

- Policy (who may report, dedupe, queue SLA, sanctions) is cross-cutting — not a Reviews concern.  
- MESSAGE reports already write shared tables from Communication; Reviews owning the queue creates ownership leaks.  
- Admin dashboard (`ADMIN_API` / `apps/admin`) needs a stable Moderation service owner.  
- Sanctions span Users + many UGC types; a single orchestrator prevents divergent ban semantics.

## Why domains remain SoT

- Visibility, soft-delete, and edit rules differ per BC (Reviews ≠ Messages ≠ Collections).  
- Duplicating entity copies inside Moderation would create sync bugs and privacy leaks.  
- Search / Auth already enforce `isSuspended` / `isBanned` from Users — Moderation must not fork those flags.

## Why the queue is centralized

- Staff need one inbox for Trust & Safety, not per-domain queues.  
- Schema already models a single `moderation_queue` with polymorphic `entityType` / `entityId`.  
- Priority/escalation/assignment are policy concerns, not entity CRUD.

## Why actions execute through domain / Users services

- Soft-delete semantics and cache invalidation belong to the owning BC (e.g. Review cache).  
- Auth login gates already read Users flags — Users must remain the writer of those fields.  
- Orchestration + ports preserve Freeze boundaries used by Communication, Notification, and Search.

## Consequences

- Sprint 12.1 can unify report intake without AI or new tables.  
- `reportList` / Social `LIST` stay unimplemented until Database Freeze amendment.  
- Appeals are product-MVP but HTTP-blocked until OpenAPI change-control.  
- Notifications may consume `moderation.*` / `user.*` events — never called synchronously from resolve hot paths as a SoT write.  
- Reviews keep SpoilerService; T&S queue moves out.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Keep platform moderation inside Reviews forever | Ownership leak; MESSAGE/PROFILE orphans |
| Moderation owns denormalized content copies | Violates SoT; privacy risk |
| Separate queues per domain | Staff UX fragmentation; schema already unified |
| Apply bans by writing User flags from Reviews service | Wrong BC; duplicates Auth/Users rules |
| Require AI scoring for MVP | Phase 2; North Star assistive AI later |
| Add Warning/Ban tables | Forbidden without Database Freeze; flags suffice |
| Invent `LIST` / `USER` enum values casually | Violates Database Freeze |

## Status

**Accepted** with Moderation Platform Freeze v1.0.
