# Sprint 10.5 — Notification Platform Final Audit

**Document:** `docs/00_PROJECT/SPRINT_10_5_FINAL_AUDIT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Production-readiness audit of **Notification Platform V1** (implementation frozen — audit only)  
**Freeze:** [`NOTIFICATION_PLATFORM_FREEZE_v1.md`](./NOTIFICATION_PLATFORM_FREEZE_v1.md)

**SSOT precedence applied:** North Star → Freeze → OpenAPI → Architecture → Implementation

> **No code, Prisma, OpenAPI, or feature changes were made in this sprint.**  
> Issues are listed for awareness only — **not fixed**.

---

## Executive summary

Module 10 delivers a coherent **IN_APP Activity Center**: recipient-only inbox (10.1), Social + Gaming event ingest (10.2–10.3), and preference dual-model hardening (10.4). Implementation respects Freeze non-negotiables: never SoT, consume events only (Auth SYSTEM temporary exception), no vendor Push/Email send, no WebSocket, no invented types/endpoints.

Gaps are **known / deferred** (PushToken, queue, Auth event migration, Communication types) or **minor operational debt** (Auth unread invalidation, in-process bus limits, preference upsert cost). Nothing found requires architectural redesign of the Notification BC.

---

## Audit method

| Layer | Sources |
|-------|---------|
| North Star | Gaming-first Activity Center; anti-spam; not Discord presence |
| Freeze / ADR / Architecture | Six locked decisions; IN_APP first; dual-model prefs |
| OpenAPI | `NOTIFICATION_API.yaml` ops + `future` appendix |
| Event / Cache / Security matrices | Ingest catalog; Redis keys; recipient-only AuthZ |
| Implementation | `apps/api/src/notifications/**`, Auth `SecurityNotificationService` |
| Sprint reports | 10.0–10.4 |
| Gates | prisma validate, typecheck, build, eslint, unit, integration, e2e (re-run 2026-07-19) |

---

## 1. Architecture

| Check | Result | Notes |
|-------|--------|-------|
| Consumer-only | **Pass** | `NotificationEventConsumer` → `NotificationIngestService`; no Social/Review `notify()` |
| Never owns business state | **Pass** | Inbox snapshots + prefs matrix only; no Follow/Review/Game mutations |
| Bounded context respected | **Pass** | Dedicated Nest module; thin controllers |
| Domain boundaries | **Pass** | Repository Prisma id lookups only (review/comment/collection/tierlist owner, block) |
| Cross-context leakage | **Pass with note** | Auth writes `SYSTEM` directly (Freeze temporary exception; not migrated in 10.4 kickoff) |

**Verdict:** Architecture Freeze V1 **met** for Activity Center scope.

---

## 2. API

| Check | Result | Notes |
|-------|--------|-------|
| OpenAPI compatibility | **Pass** | All `x-gmrlog-sprint: '10.1'` inbox ops + prefs GET/PATCH live |
| No undocumented endpoints | **Pass** | Controllers expose only documented inbox + preferences |
| No future endpoint implemented | **Pass** | Push tokens / test send remain `future` — not coded |
| Backward compatibility | **Pass** | Prefs coarse contract unchanged; empty PATCH now 400 (stricter, correct) |

**Implemented ops:** 9 inbox (10.1) + 2 preferences (10.0).  
**Not implemented (correct):** `getPushTokens`, `registerPushToken`, `deletePushToken`, `sendTestNotification`.

---

## 3. Events

| Check | Result | Notes |
|-------|--------|-------|
| Existing events only | **Pass** | Runtime names only; no invented upstream types |
| Publish/consume consistency | **Pass** | Publishes `notification.created.v1`, `notification.preferences.updated.v1` |
| No invented event names | **Pass** | `notification.delivered.v1` / `read.v1` not emitted (send/optional) |
| Idempotency | **Pass with debt** | Redis `SET NX` on `event.id`; GAME_COMPLETED cross-event dedupe |
| Dead-letter risks | **Known** | In-process bus; errors logged/swallowed; no DLQ/retry |
| Ordering assumptions | **Known** | No total order; handlers may run in parallel |

### Wired ingest map (V1)

| Type | Upstream |
|------|----------|
| FOLLOW | `social.follow.created.v1` |
| REVIEW_LIKE | `review.reaction.created.v1` (`kind=like`) |
| REVIEW_COMMENT / REVIEW_REPLY | `comment.created.v1` |
| ACHIEVEMENT_UNLOCKED | `achievement.unlocked.v1` |
| GAME_COMPLETED | `gamelog.status.changed.v1` (COMPLETED) + `game.progress.completed.v1` |
| COLLECTION_FOLLOW / COLLECTION_LIKE | `collection.updated.v1` |
| TIERLIST_COMMENT | `tierlist.comment.created.v1` |
| SYSTEM | Auth direct write (exception) |

### Explicitly unwired (gap protocol / Phase 2)

FOLLOW_REQUEST, REVIEW_MENTION, REVIEW_FEATURED, LIST_*, TIERLIST_LIKE, COLLECTION_COMMENT, BADGE_UNLOCKED (deduped into ACHIEVEMENT), LEVEL_UP, GAME_RELEASE/UPDATE/REMINDER/DISCOUNT, FRIEND_ONLINE, Communication message types.

---

## 4. Cache

| Check | Result | Notes |
|-------|--------|-------|
| Targeted invalidation only | **Pass** | Per-user unread / prefs keys |
| No global cache flush | **Pass** | No FLUSHALL / wildcard wipe |
| Unread counter consistency | **Pass with debt** | Ingest + inbox mutations invalidate; **Auth SYSTEM create does not** |
| Archive/Delete consistency | **Pass** | Invalidate unread on archive/delete |

**Keys in use:** `notification:unread:{userId}`, `notification:idempotency:{eventId}`, `notification:dedupe:GAME_COMPLETED:{userId}:{gameId}`, `notification-prefs:{userId}`.  
**Optional inbox page cache:** not implemented (allowed skip).

**Cache strategy note:** Docs prefer idempotency SET after successful insert; runtime claims **before** insert (failure after claim → silent drop until TTL). Documented as Medium debt.

---

## 5. Security

| Check | Result | Notes |
|-------|--------|-------|
| Recipient-only access | **Pass** | Non-owner → 404 `NOTIFICATION_NOT_FOUND` |
| Block rules | **Pass** | Either-direction block suppress on engagement ingest |
| Privacy rules | **Pass with gap** | Private-entity suppress mostly N/A (owner recipients); **actor embed lacks private-profile minimization** |
| Permission matrix | **Pass** | Own prefs + own inbox only; no public create API |
| Visibility matrix | **Mostly pass** | Pref-off / self / block / marketing isolation; soft-deleted sources suppressed via null owner lookup |

---

## 6. Preferences

| Check | Result | Notes |
|-------|--------|-------|
| Dual-model consistency | **Pass** | Coarse OpenAPI ↔ derived type×channel matrix on PATCH; lazy ensure on GET |
| Category ↔ type matrix | **Pass** | Expanded maps (follows/likes/comments/achievements/collections/lists/tierLists) |
| SYSTEM guarantees | **Pass** | IN_APP always-on for SYSTEM / ADMIN_MESSAGE; marketing does not mute SYSTEM |
| Marketing isolation | **Pass** | `marketing` → `GAME_DISCOUNT` only |

Auth security writer bypasses prefs for SYSTEM (correct for trust). Auth security **email** also bypasses prefs (pre-existing Auth path; out of Notification BC send scope).

---

## 7. Performance

| Check | Result | Notes |
|-------|--------|-------|
| N+1 query risks | **Pass** | List uses single query + actor `include` |
| Pagination | **Pass** | Cursor `createdAt` + `id` desc; limit capped |
| Inbox scalability | **Pass** | Indexed `userId+isRead+createdAt`, `userId+isArchived` |
| Redis usage | **Pass** | Badge + idempotency + prefs; O(1) per recipient |
| Database indexes | **Pass** | Notification / NotificationPreference indexes present |
| Event fan-out | **Acceptable V1** | One recipient per social event; no mass fan-out jobs |
| Pref matrix sync cost | **Debt** | ~60 sequential upserts per PATCH |

---

## 8. Code quality

| Check | Result | Notes |
|-------|--------|-------|
| Controller thinness | **Pass** | JWT + DTO pass-through |
| Service responsibilities | **Pass** | Inbox rules vs ingest vs prefs split |
| Repository purity | **Pass** | Persistence + id lookups; no Nest BC calls |
| DTO consistency | **Pass** | class-validator; OpenAPI-aligned booleans |
| Error handling | **Pass** | Problem-details style AppExceptions |
| Logging | **Pass** | Ingest debug; consumer warn on failure |
| Validation | **Pass** | UUID / cursor / empty prefs patch |

---

## 9. Testing (verified this audit)

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint `src/notifications/**` + notification e2e specs | ✅ |
| Unit + integration (`vitest src/notifications`) | ✅ |
| E2E inbox + social + gaming + preferences | ✅ |

**Coverage present:** inbox CRUD/badge, social ingest, gaming ingest, prefs mute/matrix/SYSTEM read.  
**Coverage gaps (debt):** Auth SYSTEM → unread cache; claim-before-insert failure path; private actor presentation; bus failure/retry.

---

## 10. North Star alignment

| Principle | Assessment |
|-----------|------------|
| Gaming first | Social + gaming journey alerts (follow, review engagement, achievements, completion, collections/tier lists) |
| Digital home | Activity Center inbox + preferences |
| Community before monetization | `marketing` default false; GAME_DISCOUNT isolated |
| Not Discord | No FRIEND_ONLINE / presence / realtime badge |
| Not Steam spam | No discount blasts; catalog release jobs deferred |
| Premium / trust | SYSTEM security rows remain readable |

---

## Issue register (do not fix in 10.5)

### Critical

*None.* No security AuthZ hole that exposes another user’s inbox; no SoT violation; no undocumented production endpoint.

### High

| ID | Issue | Impact | Disposition |
|----|-------|--------|-------------|
| H1 | Auth `SecurityNotificationService` creates SYSTEM without unread cache invalidation | Badge may be stale up to TTL (~120s) after MFA/login/security events | Accept for V1; fix in follow-up polish / Auth migration |
| H2 | In-process `DomainEventPublisher`: no DLQ / durable retry; failures swallowed after log | Lost notifications on transient DB/Redis errors | Platform-wide pattern; outbox/BullMQ is Phase 2 / architecture track |

### Medium

| ID | Issue | Impact | Disposition |
|----|-------|--------|-------------|
| M1 | Idempotency claim **before** insert (vs cache strategy “after insert”) | Claim + failed insert → suppress until TTL | Documented risk; improve when outbox lands |
| M2 | Actor profile embed without private-profile minimization | Possible over-exposure of private actor fields on inbox cards | Align with Visibility Matrix in polish sprint |
| M3 | Preference matrix sync ~60 sequential upserts | Slow prefs PATCH under load | Batch/transaction later |
| M4 | Auth SYSTEM still dual-path (not event-driven) | Freeze wanted migration by 10.4; kickoff deferred Push/events | Phase 2 / approved unlock |
| M5 | Private-entity visibility gate not generalized | Low practical risk for current owner-centric types | Needed if non-owner recipients added |

### Low

| ID | Issue | Disposition |
|----|-------|-------------|
| L1 | Optional inbox page cache unused | OK |
| L2 | No `notification.read.v1` | Optional analytics |
| L3 | Generic “Someone…” copy / no i18n | Product polish |
| L4 | FOLLOW always FOLLOW (no FOLLOW_REQUEST discriminant) | Matches current Social behavior |
| L5 | Test gaps listed above | Expand in polish |

### Technical debt

1. Temporary Auth SYSTEM writer + security email outside Notification delivery prefs.  
2. In-process event bus (shared platform debt).  
3. Preference matrix write amplification.  
4. Collection/List engagement still uses coarse `*.updated.v1` + `action` (upstream dedicated events preferred later).  
5. OpenAPI PushToken / queue appendix ahead of implementation (intentional `future`).

### Deferred Phase 2 / post–V1 items

| Item | Source |
|------|--------|
| Communication message / mention / invite notification types | Freeze enum amendment |
| PushToken REST + NotificationQueue enqueue | Architecture 10.4 appendix; OpenAPI `future` |
| Vendor Push / Email send + digests | Freeze non-goals; Phase 2 |
| `GAME_RELEASE` / `UPDATE` / `REMINDER` jobs | Event Matrix |
| `GAME_DISCOUNT` marketing delivery | Phase 2; marketing default false |
| `FRIEND_ONLINE` / realtime badge sockets | Future / North Star guard |
| AI ranking / personalization | Forbidden in Module 10 |
| LIST_* / TIERLIST_LIKE / REVIEW_MENTION / LEVEL_UP | Gap protocol |
| Platform outbox / BullMQ alignment | EVENT_ARCHITECTURE |
| Auth fully event-driven SYSTEM | ADR dual-path close-out |

---

## Freeze compliance scorecard

| Freeze decision | V1 status |
|-----------------|-----------|
| 1. Never SoT | ✅ |
| 2. Event-driven create (+ Auth exception) | ✅ (exception still open — debt M4) |
| 3. Preference dual-model | ✅ |
| 4. Recipient privacy | ✅ |
| 5. IN_APP first; no vendor send / WS | ✅ |
| 6. 10.1 ops only (+ live prefs) | ✅ |
| No new NotificationType / tables | ✅ |

---

## Sprint delivery rollup

| Sprint | Outcome |
|--------|---------|
| 10.0 | Architecture + Freeze SSOT |
| 10.1 | Inbox Core (9 ops) |
| 10.2 | Social ingest |
| 10.3 | Gaming (+ collection/tierlist engagement) ingest |
| 10.4 | Delivery preferences dual-model harden |
| 10.5 | Final audit (this document) |

---

## Decision

**APPROVED WITH MINOR CHANGES**

Minor changes are **tracked debt** (H1–H2, M1–M5) and **Phase 2 / unlock** items — not blockers for declaring Notification Platform V1 complete against Freeze IN_APP Activity Center scope. No redesign required.

---

# NOTIFICATION MODULE V1 COMPLETE

IN_APP Activity Center + Social/Gaming consumers + preference dual-model are production-ready under Notification Platform Freeze v1.0, subject to the issue register above.

**Stop.** Do **not** continue to Module 11 from this sprint.
