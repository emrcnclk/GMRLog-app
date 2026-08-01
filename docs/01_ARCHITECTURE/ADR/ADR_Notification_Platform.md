# ADR — Notification Platform

**ADR ID:** ADR-NOTIF-001  
**Date:** 2026-07-19  
**Status:** **Accepted** (Sprint 10.0 — Notification Platform Freeze v1.0)  
**Deciders:** Architecture / API / Backend  
**Preceded by:** [`MODULE_10_SCOPE_REPORT.md`](../../00_PROJECT/MODULE_10_SCOPE_REPORT.md)

---

## Context

GMRLOG Phase 1 Roadmap includes Notifications. Database Freeze already defines `Notification`, `NotificationPreference`, `PushToken`, and `NotificationQueue`. OpenAPI `NOTIFICATION_API.yaml` already describes the Activity Center. Runtime today only exposes coarse preferences plus Auth-owned security writes.

Module 10 Scope Report (`APPROVED WITH MINOR CHANGES`) required locking: preference dual-model, event naming, Auth dual-path, and deferral of Communication / presence / vendor push-email.

## Decision

1. Treat Notifications as its **own bounded context** (Activity Center), not a helper inside Social or Auth.  
2. Notifications is **never a source of truth** for domain entities — **consume domain events only**.  
3. **IN_APP first:** Sprint 10.1–10.3 deliver inbox + event ingest; **no Push vendor send**, **no Email send**, **no realtime** in those sprints.  
4. Prefer **OpenAPI-first** existing `NOTIFICATION_API.yaml` — do not invent undeclared endpoints.  
5. **Preference model:** OpenAPI coarse booleans remain the user contract; `NotificationPreference` type×channel rows are the **worker SoT**, derived on write.  
6. **Auth dual-path:** Temporary privileged `SYSTEM` writes by Auth allowed until Sprint **10.4**; then migrate to events.  
7. **No new `NotificationType` values** in Module 10 V1 without a Database Freeze amendment (blocks Communication chat alerts).  
8. **`FRIEND_ONLINE` and marketing-heavy types** deferred (North Star — not Discord; anti-spam).  
9. Match platform patterns: thin controllers, services, repositories, targeted Redis invalidation, idempotent consumers.  
10. Emit Notifications-owned events: `notification.created.v1`, `notification.preferences.updated.v1` (exists), `notification.delivered.v1` (when delivery exists).

## Why a separate BC?

- Different AuthZ (recipient-only inbox vs content ownership).  
- Independent failure domain from Social/Review write paths.  
- Multi-channel delivery lifecycle (queue, retries) does not belong in Review services.

## Why event-driven?

Keeps upstream hot paths fast; allows preference/ACL checks off the write path; aligns with Communication/Feed/Achievements consumer patterns.

## Why IN_APP before Push/Email?

Mobile clients and vendor credentials are not Module 10 blockers for Activity Center value. Token registration can land in 10.4 without sending. Auth already has a mail path for security.

## Why not absorb Auth security writes immediately?

Security email+in-app already works for trust. Rewiring Auth mid-inbox sprint risks regressions. Formal exception until 10.4 is cheaper.

## Consequences

- Sprint 10.1 may implement inbox without consumers (security SYSTEM rows still visible).  
- Sprint 10.2/10.3 must lock **runtime** event names in the Event Matrix (docs vs code debt).  
- Upstream modules that only publish coarse `*.updated.v1` with `action` discriminators must be mapped explicitly or fixed upstream before reliable social alerts.  
- Communication messaging notifications wait for enum Freeze amendment (Phase 2).  
- Push/Email **send** is Phase 2 / post–10.4 even if queue rows exist.

## Alternatives considered

| Alternative | Rejected because |
|-------------|------------------|
| Sync `notify()` calls from Social/Review | Couples domains; violates publish-only; hurts latency |
| New notification tables | Freeze already has models |
| Per-type OpenAPI preference API now | Coarse contract already shipped; dual UX confusing |
| Full Push/Email in 10.1 | Scope/product unreadiness; North Star spam risk |
| Map DM alerts to `SYSTEM` | Lossy; hides product semantics |

## Status

**Accepted** with Notification Platform Freeze v1.0.
