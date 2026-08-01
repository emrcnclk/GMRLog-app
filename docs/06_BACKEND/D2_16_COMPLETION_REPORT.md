# D2.16 Completion Report — Activity Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-27  
**Scope:** Activity center MVP — D2.17 was not started.

---

## Dialect note

S2 §10.9 documents `ActivityItem` + materialized `FeedEntry` rows as rebuildable projections. D2.16 implements the constitutional MVP per sprint authority: **player-owned activity center list only** — no ranking · recommendations · notifications generation · websocket · realtime · analytics · AI · caching · ML · feed scoring · personalization.

S1 v1.1 §13.11 defines a single activity center endpoint:

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/activity` | P | Activity center |

S1 §15.9 `ActivityItemResponse`: `id` · `kind` · `createdAt` · `readAt` · `actor` · `objectRef` `{ type, id }` · `messageKey`.

---

## 1. Files created

### Backend — `apps/backend/src/activity/`

| File | Role |
| ---- | ---- |
| `activity.module.ts` | Domain module · DI for repositories + visibility repos |
| `activity.tokens.ts` | DI tokens |
| `activity.service.ts` | Feed orchestration · cursor pagination · visibility gating · projection |
| `activity.controller.ts` | S1 §13.11 route (`@Controller('activity')`) |
| `dto/activity.dto.ts` | `ActivityQueryDto` |
| `mappers/activity.mapper.ts` | → `ActivityItemResponse` (S1 §15.9) |
| `testing/fake-repositories.ts` | Test fakes |
| `activity.service.spec.ts` · `activity.controller.spec.ts` | Tests |

### Packages

| File | Change |
| ---- | ------ |
| `packages/database/.../activity.repository.ts` | `listForUser` · `create` · `findById` · `createFeedEntry` |
| `packages/database/.../repositories/index.ts` | activity export |
| `packages/database/.../repositories.spec.ts` | `ActivityRepository` — ordering · cursor pagination |
| `packages/types/src/index.ts` | `ActivityKindValue` · `ActivityItemResponse` · `ActivityResponse` alias |
| `packages/validators/src/index.ts` | `activityQuerySchema` · `ACTIVITY_LIST_DEFAULT_LIMIT` (20) · `ACTIVITY_LIST_MAX_LIMIT` (50) |

`app.module.ts` mounts `ActivityModule`.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| ------ | ---- | ---- | -------- |
| GET | `/activity` | P | `ActivityItemResponse[]` — cursor pagination · newest `occurredAt` first · empty feed when none |

- `JwtAuthGuard` — guests rejected (**401** authn).
- `from` / `to` ISO datetime filters (S1 §6 allowlist).
- `readAt` projected as `null` (S2 has no column — notification dialect).
- `messageKey` mirrors `kind` as localization key.

---

## 3. Repository summary

**ActivityRepository** (`PrismaActivityRepository`) — persistence only:

| Responsibility | Detail |
| -------------- | ------ |
| `create` | Persist `ActivityItem` |
| `findById` | Load activity item |
| `createFeedEntry` | Materialize user feed row |
| `listForUser` | `FeedEntry` join `ActivityItem` + actor · `occurredAt` desc · `id` desc keyset cursor · `from`/`to` on `occurredAt` |

No ranking · no feed generation · no business rules.

---

## 4. Service summary

- **listActivity** — cursor encode/decode (base64url `occurredAt|id`) · `PaginatedPayload<ActivityItemResponse>`.
- **Visibility** — honors existing `canViewerRead*` rules for post · review · collection · tier-list · community · comment hosts; skips invisible or deleted objects.
- **Projection** — `toActivityItemResponse` maps feed rows to S1 §15.9 (`createdAt` = `occurredAt`).

No recommendations · no ranking · no notifications · no realtime.

---

## 5. Validation summary

| Schema | Rules |
| ------ | ----- |
| `activityQuerySchema` | `cursor`: optional trimmed string; invalid opaque cursor → **400** in service |
| | `limit`: optional int 1–50; default **20** in service |
| | `from` / `to`: optional ISO datetime strings |
| `ActivityQueryDto` | Zod pipe on `GET /activity` |

Invalid `from` / `to` → **400** validation.

---

## 6. Test summary

- **Repository:** newest-first ordering · cursor page 2
- **Service:** pagination · empty feed · invalid cursor **400** · private post hidden · actor projection
- **Controller:** guest **401** · list envelope · empty feed · invalid cursor **400** · invalid `from` **400**
- Backend coverage — **261/261** tests
- Database coverage — **48/48** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.17+)

- Activity center mark-read (no S1 route on `/activity`)
- Feed generation / projection jobs (S2 §8 rebuildable feed)
- `GET /feed` — Home activity feed (separate S1 resource)
- `GET /communities/{id}/activity` — community activity (D2.12 deferred)
- Realtime · websocket activity push
- Ranking · personalization · ML scoring
- Recommendations slot activity beyond visibility projection

---

## Lock statement

**D2.16 Activity Domain Foundation is LOCKED.**  
**D2.17 was not started.**
