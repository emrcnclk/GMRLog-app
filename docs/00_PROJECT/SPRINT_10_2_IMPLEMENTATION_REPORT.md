# Sprint 10.2 — Social Notifications Implementation Report

**Document:** `docs/00_PROJECT/SPRINT_10_2_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-19  
**Role:** Principal Software Architect / CTO  
**Scope:** Social Notification **consumers only** (Freeze v1.0 / Event Matrix Sprint 10.2)  
**Freeze:** [`NOTIFICATION_PLATFORM_FREEZE_v1.md`](./NOTIFICATION_PLATFORM_FREEZE_v1.md)

**SSOT precedence:** North Star → Freeze → OpenAPI → Architecture → Event Matrix

---

## Executive Summary

Sprint 10.2 delivers **IN_APP** social notification ingest by consuming existing domain events. No new endpoints, Prisma models, migrations, event names, queues, workers, Push, Email, or WebSocket.

| Item | Result |
|------|--------|
| Wired NotificationTypes | **FOLLOW**, **REVIEW_LIKE**, **REVIEW_COMMENT**, **REVIEW_REPLY** |
| Upstream events | `social.follow.created.v1`, `review.reaction.created.v1` (kind=`like`), `comment.created.v1` |
| New tables / migrations | **0** |
| New REST endpoints | **0** |
| Push / Email / Realtime | **Not implemented** (forbidden) |
| Quality gates | **Pass** |

---

## Implemented consumers

| NotificationType | Upstream event | Recipient resolution | Prefs gate |
|------------------|----------------|----------------------|------------|
| `FOLLOW` | `social.follow.created.v1` | `payload.followingId` / `targetUserId` | `follows` + `desktop` |
| `REVIEW_LIKE` | `review.reaction.created.v1` when `kind === 'like'` | Review author via id lookup | `likes` + `desktop` |
| `REVIEW_COMMENT` | `comment.created.v1` | Review author (not actor) | `comments` + `desktop` |
| `REVIEW_REPLY` | `comment.created.v1` with `parentId` | Parent comment author | `comments` + `desktop` |

### Behaviour

| Rule | Implementation |
|------|----------------|
| Consume only | `NotificationEventConsumer` + `NotificationIngestService` |
| No domain ownership | No Social/Review Nest service calls; Prisma id lookups only |
| Self-suppress | Actor === recipient → skip |
| Block suppress | `BlockedUser` either direction → skip |
| Idempotency | Redis `SET NX` on `notification:idempotency:{eventId}` |
| Cache | Targeted `invalidateUnread(userId)` only — no global flush |
| Downstream event | Publishes existing `notification.created.v1` after persist |
| Controllers | Unchanged; zero ingest logic |

Reply path: parent author gets `REVIEW_REPLY`; if review author differs from parent author and actor, review author also gets `REVIEW_COMMENT`.

---

## Explicitly deferred (SSOT / gap protocol)

| Source (kickoff list or matrix) | Why deferred |
|---------------------------------|--------------|
| Message Mention / Reaction / Like | Freeze + Event Matrix: Communication → **Phase 2**; no `NotificationType` |
| `REVIEW_MENTION` | No mention side-effect event published by Reviews — do not parse body |
| `FOLLOW_REQUEST` | Social rejects private follows; no request discriminant/event |
| Collection / List / TierList types | Outside this sprint’s allowed source list; matrix gaps remain for several likes |
| Gaming types | **Sprint 10.3** |
| Push / Email / queue | **Sprint 10.4+** |

---

## Files changed

### New

| File | Role |
|------|------|
| `notification-ingest.service.ts` | Event → prefs/block/self gates → persist |
| `notification-event.consumer.ts` | In-process `DomainEventPublisher` subscriptions |
| `notification-ingest.service.spec.ts` | Unit |
| `notification-ingest.integration.spec.ts` | Publisher → consumer → ingest wiring |
| `test/notifications-social.e2e-spec.ts` | Follow / like / comment / reply → inbox |

### Updated

| File | Change |
|------|--------|
| `notification.constants.ts` | Social source events, ingest event name, idempotency key/TTL |
| `notification-cache.service.ts` | `claimEventIdempotency` |
| `notification.repository.ts` | `createInboxItem`, author/block id lookups |
| `notifications.module.ts` | Wire ingest + consumer |

### Explicitly not changed

- Prisma schema / migrations  
- OpenAPI paths (no new endpoints)  
- Push tokens / queue / workers / WebSocket  
- New domain event names  
- Review/Social/Communication writers (still emit existing events only)

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ |
| `pnpm --filter @gmrlog/api typecheck` | ✅ |
| `pnpm --filter @gmrlog/api build` | ✅ |
| eslint `src/notifications/**` + social e2e | ✅ |
| Unit + integration (`vitest src/notifications`) | ✅ **18/18** |
| E2E inbox + social | ✅ **4/4** |

---

## Architecture compliance

| Requirement | Status |
|-------------|--------|
| Controllers thin | ✅ (unchanged) |
| Consume events only | ✅ |
| Repository persist + id lookups only | ✅ |
| Never SoT for upstream domains | ✅ |
| No sync `notify()` from Social/Review | ✅ |
| Targeted Redis invalidation | ✅ |
| No global flush | ✅ |
| No Push/Email/WS/workers | ✅ |
| No new models / migrations / event names | ✅ |
| Freeze 10.2 social ingest scope | ✅ |

---

## Gate

Sprint **10.2 Social Notifications complete.**

Do **not** continue to Sprint 10.3.
