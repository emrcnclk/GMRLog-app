# Sprint 10.1 — Notification Inbox Core Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_10_1_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Notification Inbox Core only (Freeze v1.0 / OpenAPI `x-gmrlog-sprint: '10.1'`)  
**Freeze:** [`NOTIFICATION_PLATFORM_FREEZE_v1.md`](./NOTIFICATION_PLATFORM_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 10.1 delivers the **IN_APP Activity Center** REST surface: list, unread, badge count, get, mark read (one/all), archive, list archived, delete. Reuses existing `Notification` table. No Push/Email/WebSocket, no workers, no new Prisma models/migrations, no new event names, no Social/Gaming ingest.

| Item | Result |
|------|--------|
| Freeze 10.1 ops | **9 / 9** |
| Preferences (pre-existing) | Unchanged |
| New tables / migrations | **0** |
| Push / Email / Realtime | **Not implemented** (forbidden) |
| Quality gates | **Pass** (scoped as prior sprints) |

---

## Implemented operations

| # | operationId | Method | Path |
|---|-------------|--------|------|
| 1 | `getNotifications` | GET | `/notifications` |
| 2 | `unreadNotifications` | GET | `/notifications/unread` |
| 3 | `getUnreadNotificationCount` | GET | `/notifications/unread/count` |
| 4 | `markAllNotificationsRead` | PATCH | `/notifications/read` |
| 5 | `getNotification` | GET | `/notifications/{notificationId}` |
| 6 | `markNotificationRead` | PATCH | `/notifications/{notificationId}/read` |
| 7 | `archiveNotification` | PATCH | `/notifications/{notificationId}/archive` |
| 8 | `archivedNotifications` | GET | `/notifications/archive` |
| 9 | `deleteNotification` | DELETE | `/notifications/{notificationId}` |

### Behaviour

| Rule | Implementation |
|------|----------------|
| Recipient-only | Non-owner → **404** (`NOTIFICATION_NOT_FOUND`) |
| Default list | `isArchived=false`; optional `type` / `read` filters |
| Unread list | `isRead=false` ∧ `isArchived=false` |
| Unread count | Cache-aside `notification:unread:{userId}` (TTL 120s) |
| Archive | Sets `isArchived=true` and marks read |
| Cursor pagination | `createdAt` + `id` desc |
| Events | **None new** (ingest is 10.2+) |
| Cache | Targeted `invalidateUnread` only — no global flush |

Existing Auth `SYSTEM` rows (security notifications) are readable via this inbox.

---

## Files changed

### New

| File | Role |
|------|------|
| `notification.constants.ts` | Limits, types, unread cache key |
| `notification.exceptions.ts` | 404 / validation / cursor |
| `notification.entities.ts` | Response entities |
| `notification.dto.ts` | List / cursor query DTOs |
| `notification.cursor.ts` | Cursor encode/decode |
| `notification.mapper.ts` | Prisma → OpenAPI shape (`read`/`archived`/`image`) |
| `notification.repository.ts` | Persistence only |
| `notification-cache.service.ts` | Unread badge cache |
| `notification.service.ts` | Business rules |
| `notifications.controller.ts` | Thin HTTP routes |
| `notification.service.spec.ts` | Unit |
| `notification.integration.spec.ts` | Integration (doubles) |
| `test/notifications-inbox.e2e-spec.ts` | E2E |

### Updated

| File | Change |
|------|--------|
| `notifications.module.ts` | Wire inbox services + controller |
| Preference files | ESLint import/order autofix only |

### Explicitly not changed

- Prisma schema / migrations  
- Push tokens / queue / workers  
- Event consumers (10.2+)  
- New domain event names  
- Auth `SecurityNotificationService` (still temporary writer)

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` (with project `.env`) | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint `src/notifications/**` + inbox e2e | ✅ |
| Unit + integration (`vitest src/notifications`) | ✅ **10/10** |
| E2E `test/notifications-inbox.e2e-spec.ts` | ✅ |

---

## Remaining future / later sprint

| Area | Sprint |
|------|--------|
| Social event ingest | **10.2** |
| Gaming event ingest | **10.3** |
| PushToken REST + queue enqueue | **10.4** |
| Vendor Push/Email send | Post–10.4 / Phase 2 |
| Realtime badge | Out of Module 10 |
| Communication message types | Phase 2 enum Freeze |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Controllers thin | ✅ |
| Service AuthZ / rules | ✅ |
| Repository persistence only | ✅ |
| Never SoT for upstream domains | ✅ |
| No sync notify from Social/Review | ✅ (no ingest yet) |
| Targeted Redis invalidation | ✅ |
| No global flush | ✅ |
| No Push/Email/WS/workers | ✅ |
| No new models / migrations / events | ✅ |
| Freeze 10.1 scope lock | ✅ |

---

## Gate

Sprint **10.1 Notification Inbox Core complete.**

Do **not** continue to Sprint 10.2.
