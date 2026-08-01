# Notification Event Matrix

**Document:** `docs/03_EVENTS/NOTIFICATION_EVENT_MATRIX.md`  
**Status:** **Frozen — Notification Platform Freeze v1.0** (Sprint 10.0)  
**Contract:** `NOTIFICATION_API.yaml`  
**Bus:** `DomainEventPublisher` (in-process v1; platform outbox/BullMQ later)  
**Rule:** Notifications **consumes** upstream events and **publishes** only Notifications-owned events.

---

## Rules

1. Upstream BCs **publish only** — no direct Notification service calls (except temporary Auth `SYSTEM` writer until 10.4).  
2. Notification ingest is **idempotent** on `(event.id)` — store processed ids (Redis TTL ≥ 7d) before side effects.  
3. Prefer **ids in payloads**; hydrate title/body with ACL-safe queries or write denormalized snapshots at create time.  
4. Never include secrets, raw email, or private message bodies in Notification payloads or snapshots beyond what the recipient is allowed to see.  
5. Self-actions do **not** notify the actor (no “you liked your own review”).  
6. Preference + Visibility gates run **before** insert.  
7. Sprint **10.1–10.3**: create **IN_APP** `Notification` only. Queue enqueue for PUSH/EMAIL starts **10.4** (send still deferred).  
8. **Runtime event names win** over historical docs (`review.review.created.v1` in older catalogs is **non-normative**).

---

## Events published by Notifications

| Versioned name | When | Consumers |
|----------------|------|-----------|
| `notification.created.v1` | After successful IN_APP insert | Analytics, future Realtime badge |
| `notification.preferences.updated.v1` | Preference PATCH (already emitted) | Cache / workers |
| `notification.delivered.v1` | After successful PUSH/EMAIL send | Analytics — **not before send exists** |
| `notification.read.v1` | Optional on mark-read | Analytics — optional 10.1+ |

---

## Ingest catalog — Social (Sprint 10.2)

| NotificationType | Upstream event (runtime) | Recipient | Notes |
|------------------|--------------------------|-----------|-------|
| `FOLLOW` | `social.follow.created.v1` | `payload.followingId` / `targetUserId` | Skip if private→request flow uses FOLLOW_REQUEST |
| `FOLLOW_REQUEST` | `social.follow.created.v1` (when privacy requires approval) **or** dedicated request event if added | Target user | Confirm Social payload discriminant in 10.2 kickoff |
| `REVIEW_LIKE` | `review.reaction.created.v1` when like semantics apply **or** dedicated like event if split | Review author | Map reaction-as-like per Reviews engagement rules |
| `REVIEW_COMMENT` | `comment.created.v1` | Review author (not commenter) | Parent comment author may get `REVIEW_REPLY` |
| `REVIEW_REPLY` | `comment.created.v1` (parentCommentId set) | Parent comment author | |
| `REVIEW_MENTION` | Mention side-effect event if published; else skip until emitted | Mentioned user | Do not invent mentions from body parse in Notifications |
| `REVIEW_FEATURED` | Moderation/feature event when exists | Review author | If unpublished, defer |
| `COLLECTION_FOLLOW` | `collection.updated.v1` with `payload.action = 'followed'` **(current runtime)** | Collection owner | Prefer dedicated event later |
| `COLLECTION_LIKE` | Collection like publish (verify `collection.updated.v1` action or engagement event at 10.2) | Owner | Gap until dedicated event |
| `COLLECTION_COMMENT` | When collection comments emit a versioned event | Owner | Gap if not emitted |
| `LIST_LIKE` / `LIST_COMMENT` | List engagement events when present; else **gap** | Owner | May require upstream emit before wiring |
| `TIERLIST_LIKE` | Prefer like event; `tierlist.voted.v1` is **vote** not like — map only if product equates them | Owner | Clarify in 10.2 |
| `TIERLIST_COMMENT` | `tierlist.comment.created.v1` | Owner | |

**Gap protocol:** If a Social NotificationType has no reliable upstream event, **do not fake it** from unrelated updates. File upstream emit work or defer the type.

---

## Ingest catalog — Gaming (Sprint 10.3)

| NotificationType | Upstream event (runtime) | Recipient | Notes |
|------------------|--------------------------|-----------|-------|
| `ACHIEVEMENT_UNLOCKED` | `achievement.unlocked.v1` | Unlocking user | Self-notify OK (journey) |
| `BADGE_UNLOCKED` | Same or badge-specific payload discriminant | User | |
| `LEVEL_UP` | When emitted by gamification; else defer | User | |
| `GAME_COMPLETED` | `gamelog.status.changed.v1` (status COMPLETED) and/or `game.progress.completed.v1` | User | Dedupe if both fire |
| `GAME_RELEASE` / `GAME_UPDATE` / `GAME_REMINDER` | Catalog/job events when exist | Followers / wishlist users | Optional 10.3; else Phase 2 |
| `GAME_DISCOUNT` | Phase 2 | — | Marketing-adjacent |

---

## Ingest catalog — System

| NotificationType | Source | Sprint |
|------------------|--------|--------|
| `SYSTEM` | Auth `SecurityNotificationService` (direct write) until 10.4; then `auth.security.*.v1` | Readable 10.1; migrate 10.4 |
| `ADMIN_MESSAGE` | Admin tooling event when exists | When admin emits |

---

## Explicit non-ingest (Freeze v1.0)

| Upstream | Why |
|----------|-----|
| `message.created.v1` / Communication matrix | No `NotificationType`; Phase 2 |
| Presence / typing / FRIEND_ONLINE | Realtime Future |
| Feed item created | Feed is parallel projection — do not double-notify from feed |
| Preference updated | Meta only — no inbox row |

---

## Payload guidelines (created notification event)

```json
{
  "type": "notification.created.v1",
  "aggregateId": "<notificationId>",
  "aggregateType": "Notification",
  "actorId": "<actorUserId|null>",
  "payload": {
    "notificationId": "...",
    "userId": "<recipientId>",
    "notificationType": "FOLLOW",
    "entityType": "USER",
    "entityId": "..."
  }
}
```

---

## Sprint availability

| Sprint | Ingest live |
|--------|-------------|
| 10.1 | None (inbox reads existing rows only) |
| 10.2 | Social catalog rows that have locked runtime events |
| 10.3 | Gaming catalog |
| 10.4 | Auth security events; queue enqueue; `notification.delivered.v1` when send exists |
| Phase 2 | Communication + catalog release jobs + vendor delivery |
