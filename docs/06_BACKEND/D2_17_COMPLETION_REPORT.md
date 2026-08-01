# D2.17 Completion Report — Event Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-27  
**Scope:** Event domain MVP — D2.18 was not started.

---

## Dialect note

S2 §10.6 documents `Event` as a Shared Destination with soft-delete and `EventParticipation` as a hard-deletable join row (`state`: `interested` · `going` · `not_going`). D2.17 implements the constitutional MVP per sprint authority: **event detail + participation only** — no create/patch/list HTTP on `/events` · recommendations · notifications · websocket · realtime · reminders · calendar sync · invitations · AI · analytics · ranking · caching · ML.

S1 v1.1 §13.10 defines exactly three Event resource endpoints (Discover hub list remains D2.14):

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/events/{id}` | P\|G | Event detail |
| POST | `/events/{id}/participation` | P | Participate |
| DELETE | `/events/{id}/participation` | P | Leave participation |

S1 §14.16: empty body objects allowed — presence of POST/DELETE is the contract.  
S1 §15.6 `EventResponse`: `id` · `title` · `kind` · `startsAt` · `endsAt` · `viewerParticipation` · optional `gameId`/`communityId` — **no FOMO countdown fields**.

**Not invented (S1 has no such routes/DTOs):** `POST /events` · `PATCH /events/{id}` · `GET /events` · `eventCreateSchema` · `eventPatchSchema` · `eventQuerySchema`.

---

## 1. Files created

### Backend — `apps/backend/src/events/`

| File | Role |
| ---- | ---- |
| `events.module.ts` | Domain module · DI for event / participation / user repos |
| `events.tokens.ts` | DI tokens |
| `events.service.ts` | Detail · join · leave · projection |
| `events.controller.ts` | S1 §13.10 routes (`@Controller('events')`) |
| `dto/events.dto.ts` | `EventIdParamDto` · `ParticipationDto` |
| `mappers/event.mapper.ts` | → `EventResponse` / participation summary (S1 §15.6) |
| `testing/fake-repositories.ts` | Test fakes |
| `events.service.spec.ts` · `events.controller.spec.ts` | Tests |

### Packages

| File | Change |
| ---- | ------ |
| `packages/database/.../event.repository.ts` | `create` · `update` · `softDelete` · `findById` · `findActiveById` · `listPublic` |
| `packages/database/.../event-participation.repository.ts` | `create` · `findByEventAndUser` · `listByEvent` · `updateState` · leave (hard delete) |
| `packages/database/.../repositories/index.ts` | event exports |
| `packages/database/.../repositories.spec.ts` | Event + participation repository tests |
| `packages/types/src/index.ts` | `EventParticipationStateValue` · `EventParticipationSummary` · `EventParticipationResponse` · `viewerParticipation` typed |
| `packages/validators/src/index.ts` | `eventIdParamSchema` · `participationSchema` (empty) |

`app.module.ts` mounts `EventsModule`. Discover re-exports the shared event mapper.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| ------ | ---- | ---- | -------- |
| GET | `/events/{id}` | P\|G | `EventResponse` — active only; soft-deleted → **404** |
| POST | `/events/{id}/participation` | P | Join · default state `going` · empty body · **204** · duplicate → **409** |
| DELETE | `/events/{id}/participation` | P | Leave · hard-delete row · **204** · missing → **404** |

- `OptionalGuestGuard` on detail; `JwtAuthGuard` on participation writes.
- Guests see `viewerParticipation: null`; authenticated participants get `{ state, createdAt }`.
- Unknown participation body fields → **400** (strict empty schema).

---

## 3. Repository summary

**EventRepository** (`PrismaEventRepository`) — persistence only:

| Responsibility | Detail |
| -------------- | ------ |
| `create` / `update` / `softDelete` | Persist Event lifecycle |
| `findById` / `findActiveById` | Load including / excluding soft-deleted |
| `listPublic` | Active rows · `startsAt` desc · `id` desc keyset cursor |

No owner column on S2 Event — `listByOwner` not applicable. No visibility column — active Shared Events are publicly readable.

**EventParticipationRepository** — persistence only:

| Responsibility | Detail |
| -------------- | ------ |
| `create` | Join row with `state` |
| `findByEventAndUser` · `listByEvent` | Lookups |
| `delete` / `deleteByEventAndUser` | Leave = hard delete |

---

## 4. Service summary

- **getEvent** — active event required · projects `viewerParticipation` when authenticated and joined.
- **joinEvent** — requires active event + active user · default `going` · conflict if already participating.
- **leaveEvent** — requires existing participation row.

No create/list HTTP · no ranking · no notifications · no realtime.

---

## 5. Validation summary

| Schema | Rules |
| ------ | ----- |
| `eventIdParamSchema` | `id`: opaque id |
| `participationSchema` | empty strict object (S1 §14.16) |
| `EventIdParamDto` / `ParticipationDto` | Zod pipes on Event routes |

`eventCreateSchema` · `eventPatchSchema` · `eventQuerySchema` **not added** — S1 defines no create/patch/list request catalog for `/events`.

---

## 6. Test summary

- **Repository:** public list newest-first · cursor page 2 · soft-delete hides from active · join/leave hard-delete
- **Service:** guest detail · viewerParticipation · soft-deleted **404** · join going · duplicate **409** · leave · deleted event join **404**
- **Controller:** guest envelope · auth participation · guest **401** · duplicate **409** · leave **404** · unknown body field **400**
- Backend coverage — **274/274** tests
- Database coverage — **51/51** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.18+)

- Event create / patch / staff admin (no S1 routes)
- `GET /events` list (Discover remains the hub list)
- Participation state transitions beyond default `going` (would need S1 body amendment)
- Community-scoped event visibility soft-gates
- Reminders · calendar sync · invitations
- Notifications / activity emission on participation change (S2 §18)
- Realtime · websocket · ranking · ML

---

## Lock statement

**D2.17 Event Domain Foundation is LOCKED.**  
**D2.18 was not started.**
