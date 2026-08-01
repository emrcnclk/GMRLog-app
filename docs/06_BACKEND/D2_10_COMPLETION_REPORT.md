# D2.10 Completion Report — Notification Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-26  
**Scope:** Notification domain only — D2.11 was not started.

---

## Dialect note

The sprint brief listed:

- `PATCH /notifications/{id}/read`
- `PATCH /notifications/read-all`

**S1 §13.11** (LOCKED) defines:

- `GET /notifications` (P)
- `POST /notifications/read` (P) — body `NotificationsReadRequest` (`ids` and/or `all`)

Per “never invent endpoints / S1 wins”, **POST /notifications/read** was implemented. PATCH routes were not added.

List responses use S1 §4.2 / §5 cursor pagination (`cursor` · `limit` · `meta.hasMore`). Optional `from` / `to` filters are allowlisted in S1 §6.2 for notifications.

---

## 1. Files created

### Backend — `apps/backend/src/notifications/`

| File | Role |
| --- | --- |
| `notifications.module.ts` | Domain module |
| `notifications.tokens.ts` | DI tokens |
| `notifications.service.ts` | List · mark-read · cursor decode |
| `notifications.controller.ts` | `GET /notifications` · `POST /notifications/read` |
| `dto/notification.dto.ts` | Zod DTOs |
| `mappers/notification.mapper.ts` | → `NotificationResponse` |
| `testing/fake-repositories.ts` | Test fakes |
| `notifications.service.spec.ts` · `notifications.controller.spec.ts` | Tests |

### Infrastructure

| File | Change |
| --- | --- |
| `infrastructure/http/paginated-payload.ts` | S1 list marker |
| `infrastructure/http/envelope.ts` · `envelope.interceptor.ts` | Unwrap PaginatedPayload → cursor meta |

### Packages

| File | Change |
| --- | --- |
| `packages/database/.../notification.repository.ts` | `listByUser` · `markRead` · `markAllRead` · `markManyRead` |
| `packages/database/.../repositories.spec.ts` | Ordering · preserve readAt · mark-all |
| `packages/types/src/index.ts` | `NotificationResponse` · `ObjectTypeValue` |
| `packages/validators/src/index.ts` | list query · read request schemas |

`app.module.ts` mounts `NotificationsModule`.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| --- | --- | --- | --- |
| GET | `/notifications` | P | Cursor list · newest→oldest · optional `from`/`to` |
| POST | `/notifications/read` | P | Mark `ids` or `all` · 204 · preserves existing `readAt` |

Guests cannot access notifications.

---

## 3. Repository summary

`NotificationRepository`: `create` · `findById` · `listByUser` · `markRead` · `markAllRead` · `markManyRead` · `delete`

Persistence only. Mark operations update only rows with `readAt = null`. `markManyRead` / `markAllRead` use updateMany (transactional for many).

---

## 4. Service summary

`NotificationsService`:

- Recipient-scoped list with opaque cursor pagination
- Ownership checks on mark-by-ids (foreign/missing → 404)
- Mark-all for recipient unread only
- No notification generation · websocket · push · email · feed · jobs

---

## 5. Validation summary

`@gmrlog/validators`:

- List: `cursor?` · `limit?` (1–50, default 20) · `from?`/`to?` ISO datetime
- Read: `ids` non-empty **or** `all: true`
- `.strict()` — unknown fields rejected
- `NotificationKind` remains String placeholder (no invented enum members)

---

## 6. Test summary

- Repository: newest-first · preserve readAt · mark-all
- Service: pagination · invalid cursor · mark ids/all · foreign 404
- Controller: guest 401 · list envelope/cursor · 204 mark · validation
- Backend coverage increased — **148/148** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.11+)

- Notification generation from domain events
- `NotificationKind` closed member set (product amendment)
- `actor` on Notification (S2 has no actorId today)
- Settings notification preferences (`PATCH /settings/notifications`)
- Activity center (`GET /activity`)
- Push · email · digest · websocket · SSE · BullMQ workers
- Batching · recommendation · feed integration

---

## Lock statement

**D2.10 is LOCKED.**  
**D2.11 was not started.**
