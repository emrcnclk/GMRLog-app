# Sprint 10.4 — Notification Delivery Preferences Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_10_4_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Notification **Delivery Preferences** only (Freeze dual-model harden)  
**Freeze:** [`NOTIFICATION_PLATFORM_FREEZE_v1.md`](./NOTIFICATION_PLATFORM_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture

---

## Executive Summary

Sprint 10.4 hardens **delivery preference** behaviour on existing GET/PATCH `/notifications/preferences` and the existing `NotificationPreference` type×channel matrix. No Push/Email/SMS send, no workers, no queue redesign, no WebSocket, no new endpoints, models, migrations, or event names.

| Item | Result |
|------|--------|
| Coarse prefs API | Existing GET/PATCH — validated + mute semantics |
| Worker SoT matrix | Expanded category→type sync; marketing ≠ SYSTEM |
| IN_APP ingest gate | Coarse prefs **and** matrix row |
| SYSTEM / ADMIN_MESSAGE | IN_APP **always on** (security readable) |
| PushToken / vendor send | **Not implemented** (forbidden this kickoff) |
| Quality gates | **Pass** |

---

## Kickoff vs OpenAPI appendix

OpenAPI tags PushToken REST as `x-gmrlog-sprint: '10.4'` / `future`. This sprint kickoff **explicitly forbids** Push delivery, new endpoints, workers, and queue work.

| Area | This sprint |
|------|-------------|
| Preferences dual-model | **Done** |
| PushToken REST | **Deferred** — wait for architecture review |
| Queue enqueue / vendor send | **Deferred** (Phase 2 / later unlock) |
| Auth `SYSTEM` → events | **Deferred** (no new event names allowed) — Auth direct writer retained |

---

## Implemented behaviour

### Preference contract (unchanged paths)

| operationId | Method / path |
|-------------|----------------|
| `notificationPreferences` | GET `/notifications/preferences` |
| `updateNotificationPreferences` | PATCH `/notifications/preferences` |

### Dual-model sync

| Coarse category | Matrix `NotificationType` rows |
|-----------------|--------------------------------|
| `follows` | `FOLLOW`, `FOLLOW_REQUEST` |
| `likes` | `REVIEW_LIKE` |
| `comments` | `REVIEW_COMMENT`, `REVIEW_REPLY` |
| `mentions` | `REVIEW_MENTION` |
| `achievements` | `ACHIEVEMENT_UNLOCKED`, `BADGE_UNLOCKED`, `LEVEL_UP`, `GAME_COMPLETED` |
| `collections` | `COLLECTION_LIKE`, `COLLECTION_FOLLOW`, `COLLECTION_COMMENT` |
| `lists` | `LIST_LIKE`, `LIST_COMMENT` |
| `tierLists` | `TIERLIST_LIKE`, `TIERLIST_COMMENT` |
| `marketing` | `GAME_DISCOUNT` only (**not** `SYSTEM`) |
| (always-on) | `SYSTEM`, `ADMIN_MESSAGE` — **IN_APP always enabled** |

Channel masters (`push` / `email` / `desktop`) still AND into type×channel `enabled`.

### Validation

- Empty PATCH body → **400** `VALIDATION_FAILED`
- Boolean-only fields via DTO + service assert
- `marketing` default remains **false**

### Ingest

`NotificationIngestService` suppresses create when:

1. Self (except journey types), or  
2. Block either way, or  
3. Coarse category off, or  
4. `NotificationPreference` IN_APP row exists and `enabled=false`  

Missing matrix row → coarse prefs only (**backward compatible**).

### SYSTEM readability

Auth `SecurityNotificationService` continues temporary direct `SYSTEM` writes. Marketing mute does **not** disable SYSTEM IN_APP. Inbox GET by type remains recipient-only.

### Cache

- Preference Redis key `notification-prefs:{userId}` overwritten on write (targeted)  
- Profile user invalidate on PATCH (existing, user-scoped)  
- Unread badge: unchanged; **no global flush**

---

## Files changed

### New

| File | Role |
|------|------|
| `notification-preference.exceptions.ts` | Empty/invalid patch |
| `notification-preference.integration.spec.ts` | Matrix mute / SYSTEM always-on |
| `test/notifications-preferences.e2e-spec.ts` | GET/PATCH + matrix + SYSTEM list |

### Updated

| File | Change |
|------|--------|
| `notification-preference.constants.ts` | Category map, always-on types, patch keys |
| `notification-preference.repository.ts` | Full matrix sync; `isInAppEnabled`; `ensureDeliveryMatrix` |
| `notification-preference.service.ts` | Patch validation; ensure matrix on GET |
| `notification-ingest.service.ts` | IN_APP matrix gate |
| Specs | Prefs + ingest matrix cases |

### Explicitly not changed

- Prisma schema / migrations  
- OpenAPI paths (no PushToken unlock)  
- New domain event names  
- Push/Email/SMS vendors, workers, queues, WebSocket  
- Auth security email path (temporary dual-path retained)

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint `src/notifications/**` + prefs e2e | ✅ |
| Unit + integration (`vitest src/notifications`) | ✅ **29/29** |
| E2E `test/notifications-preferences.e2e-spec.ts` | ✅ **1/1** |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Controllers thin | ✅ |
| Repository persistence (+ matrix id lookups) | ✅ |
| Never SoT for upstream domains | ✅ |
| Prefer dual-model (coarse + type×channel) | ✅ |
| Targeted cache invalidation | ✅ |
| Recipient privacy / block / pref suppress | ✅ |
| No Push/Email send / workers / new endpoints | ✅ |
| Backward compatible prefs API | ✅ |

---

## Remaining (architecture review)

| Item | Note |
|------|------|
| PushToken REST | OpenAPI `10.4` / `future` — unlock only after review |
| Queue enqueue (no vendor send) | Architecture 10.4 appendix |
| Auth SYSTEM → event-driven | Needs approved event names / Freeze note |
| Vendor Push/Email send | Phase 2 |

---

## Gate

Sprint **10.4 Notification Delivery Preferences complete.**

Do **not** continue to Sprint 10.5.

**Wait for architecture review** before PushToken / queue / Auth migration work.
