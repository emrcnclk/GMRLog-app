# D2.14 Completion Report — Discover Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-27  
**Scope:** Discover domain MVP — D2.15 was not started.

---

## Dialect note

The sprint brief listed:

| Method | Path |
| ------ | ---- |
| GET | `/discover/games` |
| GET | `/discover/reviews` |
| GET | `/discover/posts` |
| GET | `/discover/communities` |

**S1 v1.1 §13.5** (LOCKED) defines:

| Method | Path | Auth | Purpose |
| ------ | ---- | ---- | ------- |
| GET | `/discover` | P\|G | Discover hub modules |
| GET | `/discover/communities` | P\|G | Communities hub |
| GET | `/discover/events` | P\|G | Events hub |

There are **no** `/discover/games`, `/discover/reviews`, or `/discover/posts` routes in S1. Per “never invent endpoints / S1 wins”, only S1 §13.5 routes were mounted. Games, reviews, and posts remain on their canonical S1 resources (`/games/{id}/…`, etc.).

Brief constraints honored: no ranking · recommendations · personalization · search scoring · ML · caching · feed generation · realtime · websocket · notifications · V2.

---

## 1. Files created

### Backend — `apps/backend/src/discover/`

| File | Role |
| ---- | ---- |
| `discover.module.ts` | Domain module · DI for `DiscoverRepository` + `CommunityMemberRepository` |
| `discover.tokens.ts` | DI tokens |
| `discover.service.ts` | Hub · communities list · events list · cursor pagination |
| `discover.controller.ts` | S1 §13.5 routes (`@Controller('discover')`) |
| `dto/discover.dto.ts` | `DiscoverListQueryDto` |
| `mappers/discover.mapper.ts` | → `DiscoverHubResponse` |
| `mappers/event.mapper.ts` | → `EventResponse` (`viewerParticipation: null`) |
| `testing/fake-repositories.ts` | Test fakes |
| `discover.service.spec.ts` · `discover.controller.spec.ts` | Tests |

### Packages

| File | Change |
| ---- | ------ |
| `packages/database/.../discover.repository.ts` | `listDiscoverCommunities` · `listDiscoverEvents` |
| `packages/database/.../repositories/index.ts` | discover export |
| `packages/database/.../repositories.spec.ts` | `DiscoverRepository` — visibility · ordering · cursor |
| `packages/types/src/index.ts` | `DiscoverHubResponse` · `DiscoverHubModule` · `EventResponse` · `EventKindValue` |
| `packages/validators/src/index.ts` | `discoverListQuerySchema` · `DISCOVER_LIST_DEFAULT_LIMIT` (20) · `DISCOVER_LIST_MAX_LIMIT` (50) |

`app.module.ts` mounts `DiscoverModule`.

---

## 2. Endpoint summary

| Method | Path | Auth | Behavior |
| ------ | ---- | ---- | -------- |
| GET | `/discover` | P\|G | `DiscoverHubResponse` — static modules `communities` · `events` |
| GET | `/discover/communities` | P\|G | `CommunityResponse[]` — public communities only · `updatedAt` desc · cursor pagination |
| GET | `/discover/events` | P\|G | `EventResponse[]` — active events (`deletedAt` null) · `startsAt` desc · cursor pagination |

- `OptionalGuestGuard` on all discover routes — guests and authenticated users allowed.
- Communities projection reuses `communities/mappers` · includes `memberCount` · `viewerMembership` when authenticated member.
- Events projection sets `viewerParticipation: null` (Event participation domain deferred).

---

## 3. Repository summary

**DiscoverRepository** (`PrismaDiscoverRepository`) — persistence only, no ranking:

| Method | Filters | Order | Cursor key |
| ------ | ------- | ----- | ---------- |
| `listDiscoverCommunities` | `deletedAt` null · `visibility: public` | `updatedAt` desc · `id` desc | `updatedAt` + `id` keyset |
| `listDiscoverEvents` | `deletedAt` null | `startsAt` desc · `id` desc | `startsAt` + `id` keyset |

No `listDiscoverGames` · `listDiscoverReviews` · `listDiscoverPosts` — not in S1 §13.5.

---

## 4. Service summary

- **getHub** — static module registry (`/discover/communities`, `/discover/events`); no dynamic ranking.
- **listCommunities** — repository public filter · cursor encode/decode (base64url `orderedAt|id`) · `CommunityMemberRepository` for `memberCount` / `viewerMembership` projection.
- **listEvents** — repository active-event filter · same cursor pattern · `toEventResponse` projection only.

No business intelligence · no feed generation · no recommendation slots · no personalization.

---

## 5. Validation summary

| Schema | Rules |
| ------ | ----- |
| `discoverListQuerySchema` | `cursor`: optional trimmed string (min 1); invalid opaque cursor rejected in service → **400** |
| | `limit`: optional int 1–50; default **20** in service |
| `DiscoverListQueryDto` | Zod pipe on list endpoints |

---

## 6. Test summary

- **Repository:** public-only communities · private excluded · events `startsAt` order · keyset cursor page 2
- **Service:** hub modules · guest public list · authenticated `viewerMembership` · pagination · invalid cursor **400** · events order · `viewerParticipation: null`
- **Controller:** guest hub envelope · communities list + cursor meta · authenticated membership · invalid cursor **400** · events list envelope
- **Communities service fix:** join test scopes membership by `communityId` (isolation with multi-community fixtures)
- Backend coverage — **239/239** tests
- Database coverage — **45/45** tests

---

## 7. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

---

## 8. Deferred (D2.15+)

- `GET /discover/games` · `/discover/reviews` · `/discover/posts` (S1 amendment required)
- `GET /feed` — Home activity feed (separate S1 resource)
- `GET /search` — Meilisearch projection (separate S1 resource)
- `GET /recommendations/games` · `/recommendations/collections` — semantic similarity slots
- Dynamic Discover hub content · ranking · trending
- Event domain full mount — `viewerParticipation` · `POST/DELETE /events/{id}/participation`
- Caching layer · personalization · ML · collaborative filtering
- Realtime · websocket · notification generation from discover

---

## Lock statement

**D2.14 Discover Domain Foundation is LOCKED.**  
**D2.15 was not started.**
