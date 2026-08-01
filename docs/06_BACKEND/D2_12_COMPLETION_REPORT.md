# D2.12 Completion Report — Community Domain Foundation

**Status:** LOCKED  
**Completed:** 2026-07-27  
**Scope:** Community domain MVP — D2.13 was not started at D2.12 lock.  
**S1 alignment:** **S1.1 Community Management Amendment** applied post-lock (same sprint window); see historical note below.

---

## Dialect note

### D2.12 original lock (S1 v1.0 §13.10)

The sprint brief listed community CRUD and `/members` mutation paths. **S1 v1.0 §13.10** (LOCKED at D2.12) defined only detail · members · self membership:


| Method | Path                           | Auth |
| ------ | ------------------------------ | ---- |
| GET    | `/communities/{id}`            | P\|G |
| GET    | `/communities/{id}/members`    | P\|G |
| POST   | `/communities/{id}/membership` | P    |
| DELETE | `/communities/{id}/membership` | P    |


Per “never invent endpoints / S1 wins”, `POST/DELETE …/membership` were implemented at D2.12 lock. Community list/create/patch/delete were **not** in S1 v1.0 and were deferred.

Brief paths **not** in S1 v1.0: `POST/DELETE …/members` (membership uses `/membership`). Hub discovery remains `GET /discover/communities` (Discover domain, deferred).

### S1.1 Amendment — Community Management (post–D2.12 lock)

**Accepted** as S1 v1.1. Adds community CRUD without changing F5/F6 architecture:


| Method | Path                   | Auth           |
| ------ | ---------------------- | -------------- |
| GET    | `/communities`         | P\|G           |
| POST   | `/communities`         | P              |
| PATCH  | `/communities/{id}`    | P (owner only) |
| DELETE | `/communities/{id}`    | P (owner only) |


Membership endpoints above are **unchanged**. `CommunityResponse` (§15.6) unchanged. Request DTOs: §14.28 `CommunityCreateRequest` / `CommunityPatchRequest` (`name` · `slug` · `description?` · `visibility`).

**Historical note:** CRUD routes · create/patch validators · `Community.visibility` persistence · owner authz · list/discoverability were added **after** D2.12 LOCK, in implementation of this amendment—not as a reopen of the D2.12 sprint scope. D2.12 foundation (repositories · membership · projections) was extended, not replaced.

---

## 1. Files created

### Backend — `apps/backend/src/communities/`


| File                                                             | Role (D2.12 + S1.1)                                                                 |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `communities.module.ts`                                          | Domain module · `FollowsModule` for visibility gate (S1.1)                          |
| `communities.tokens.ts`                                          | DI tokens                                                                           |
| `communities.service.ts`                                         | List · create · update · delete · detail · members · join · leave                   |
| `communities.controller.ts`                                      | S1 §13.10 + S1.1 CRUD routes                                                        |
| `dto/community.dto.ts`                                           | Path · create · patch DTOs (S1.1)                                                   |
| `mappers/community.mapper.ts`                                    | → `CommunityResponse` / `CommunityMemberResponse` · `canViewerReadCommunity` (S1.1) |
| `testing/fake-repositories.ts`                                   | Test fakes                                                                          |
| `communities.service.spec.ts` · `communities.controller.spec.ts` | Tests (extended post–S1.1)                                                          |


### Packages


| File                                                   | Change (D2.12 + S1.1)                                                                                                |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `packages/database/.../community.repository.ts`        | `create` · `findById` · `findBySlug` · `findActiveById` · `listPublic` · `listDiscoverableForMemberCommunityIds` · `update` · `softDelete` |
| `packages/database/.../community-member.repository.ts` | `create` · `findByCommunityAndUser` · `listByCommunity` · `listCommunityIdsByUser` · `countByCommunity` · `delete` · `deleteByCommunityAndUser` |
| `packages/database/prisma/schema.prisma`               | `Community.visibility` (`ContentVisibility`, default `public`) — S1.1 / S2 alignment                               |
| `packages/database/prisma/migrations/…_community_visibility/` | `visibility` column migration                                                        |
| `packages/database/.../repositories.spec.ts`           | Soft-delete · public/discoverable list · slug · membership ordering · hard-delete leave                              |
| `packages/database/.../factories.ts`                   | `createCommunity` test helper                                                                                        |
| `packages/types/src/index.ts`                          | `CommunityResponse` · `CommunityMemberResponse` · role/count types (unchanged §15.6)                                 |
| `packages/validators/src/index.ts`                     | `communityIdParamSchema` · `communityCreateSchema` · `communityPatchSchema` (S1.1)                                   |


`app.module.ts` mounts `CommunitiesModule`.

---

## 2. Endpoint summary

**Current contract (S1 v1.1 §13.10 + amendment):**


| Method | Path                           | Auth           | Behavior                                                                 |
| ------ | ------------------------------ | -------------- | ------------------------------------------------------------------------ |
| GET    | `/communities`                 | P\|G           | Discoverable communities · `CommunityResponse[]` (S1.1)                  |
| POST   | `/communities`                 | P              | Create · actor → `owner` · 201 (S1.1)                                    |
| GET    | `/communities/{id}`            | P\|G           | `CommunityResponse` · visibility gate · `viewerMembership` · counts      |
| PATCH  | `/communities/{id}`            | P (owner)      | Patch allowlisted fields · 200 (S1.1)                                    |
| DELETE | `/communities/{id}`            | P (owner)      | Soft-delete · 204 (S1.1)                                                 |
| GET    | `/communities/{id}/members`    | P\|G           | `CommunityMemberResponse[]` · oldest→newest · visibility gate          |
| POST   | `/communities/{id}/membership` | P              | Join as `member` · 204 · empty body (§14.16)                               |
| DELETE | `/communities/{id}/membership` | P              | Hard-delete membership · 204                                             |


Guests: list (public only) · public community detail/members. Authenticated: member private communities in list. Non-member private → 404. PATCH/DELETE non-owner → 403.

---

## 3. Repository summary

**CommunityRepository:** `create` · `findById` · `findBySlug` · `findActiveById` · `listPublic` · `listDiscoverableForMemberCommunityIds` · `update` · `softDelete`

**CommunityMemberRepository:** `create` · `findByCommunityAndUser` · `listByCommunity` · `listCommunityIdsByUser` · `countByCommunity` · `delete` · `deleteByCommunityAndUser`

- Membership lists: `joinedAt` asc, `id` asc
- Leave = hard delete of membership row (S2 §6)
- Soft-deleted communities → `findActiveById` null → API 404
- `visibility` stored on `Community` (`content_visibility` enum); not projected on `CommunityResponse` (§15.6 unchanged)

---

## 4. Service summary

`CommunitiesService`:

- **S1.1:** `listCommunities` · `createCommunity` (owner membership) · `updateCommunity` · `deleteCommunity` · slug conflict → 409 · owner-only mutation → 403
- Projects S1 §15.6 `CommunityResponse` (`viewerMembership` for authenticated members)
- Visibility gate: `public` · `followers` (follow owner) · `private` (members only); members always read
- Lists members with user + role
- Join: duplicate → 409 · unknown community/user → 404
- Leave: not a member → 404
- No feed · activity · events · moderation · invitations · notifications · realtime

---

## 5. Validation summary

`@gmrlog/validators`:

- `communityIdParamSchema` — path `{id}` · `.strict()`
- **S1.1** `communityCreateSchema` — `name` · `slug` · `description?` · `visibility` (required)
- **S1.1** `communityPatchSchema` — `name?` · `description?` · `visibility?`
- Membership POST/DELETE — no body (§14.16 empty body contract)

---

## 6. Test summary

**D2.12 lock baseline:** repository soft-delete · member ordering · hard-delete leave · service detail/members/join/leave · controller guest read · 401/409/404 · **183/183** backend tests.

**S1.1 amendment (post-lock):** extended service/controller specs — list · create · patch · delete · owner 403 · slug 409 · private visibility 404 · repository public/discoverable list · `listCommunityIdsByUser` · slug lookup.

---

## 7. Verification

**D2.12 lock:** `pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

**S1.1 amendment:** same suite re-verified after CRUD merge.

---

## 8. Deferred (D2.13+)

- `GET /communities/{id}/feed` · `GET /communities/{id}/activity`
- `GET /discover/communities` (Discover domain hub — distinct from `GET /communities` list)
- Events · moderation · roles beyond MVP usage · invitations
- Recommendations · notifications · realtime · community chat
- Post `communityId` association (Posts service still rejects until wired)
- Avatar/banner uploads (`avatarUrl`/`bannerUrl` null until uploads foundation)
- `visibility` on `CommunityResponse` (response shape unchanged per §15.6)

---

## Lock statement

**D2.12 Community Domain Foundation is LOCKED.**  
**D2.13 was not started** at D2.12 lock.

S1 v1.1 Community Management CRUD was applied post-lock as a formal API amendment; it does not reopen D2.12 scope.
