# GMRLOG Sprint 2.3 — Gaming Identity & Player Profile Implementation Report

**Sprint:** 2.3 — Gaming Identity & Player Profile  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting review before Sprint 2.4**  
**Contract:** `docs/08_API/USER_API.yaml` (`GET/PATCH /users/me/gaming-identity`, schema `GamingIdentity`)  
**Schema:** unchanged (Database Freeze respected)  
**Events:** `docs/06_BACKEND/EVENT_ARCHITECTURE.md` (in-process publisher; no consumers)

---

## Implemented Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/users/me/gaming-identity` | Bearer | Own gaming identity (player summary) |
| PATCH | `/api/v1/users/me/gaming-identity` | Bearer | Update identity favorites / play status |

**Composition (not a new OpenAPI path):**

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/api/v1/users/{username}` | Nested `gamingIdentity` when profile visibility allows |

**Out of sprint:**

| Item | Reason |
|------|--------|
| Recommendation algorithms | Explicitly excluded |
| Achievements / badges / analytics modules | Explicitly excluded |
| `GET/PATCH /users/me/currently-playing` | Owned by `GAME_LOG_API` |
| Favorite games / studios / developers list resources | Separate USER_API endpoints |
| Privacy settings CRUD | Separate sprint |

---

## Implemented Services

```text
GamingIdentityController
  → GamingIdentityService
    → GamingIdentityRepository → Prisma + Redis
    → DomainEventPublisher (in-process)

UsersController (public profile only)
  → UserProfileService          (profile fields)
  → GamingIdentityService       (nested gamingIdentity; not merged into UserProfileService)
```

| Component | Responsibility |
|-----------|----------------|
| `GamingIdentityService` | Validation, singular favorites, currently/next play rules, events |
| `GamingIdentityRepository` | Joined reads, catalog resolve, FavoritePlatform/Genre writes, PLAYING→PAUSED archive |
| `DomainEventPublisher` | Emit versioned domain events for future Feed / Notification / Recommendation |

---

## Player Summary Fields

| Field | Persistence | Catalog resolution |
|-------|-------------|-------------------|
| `favoritePlatform` | `favorite_platforms` (singular replace) | OpenAPI enum ↔ `platforms.slug` |
| `favoriteGenre` | `favorite_genres` (singular replace) | `genres` by name/slug → store id, return name |
| `favoriteFranchise` | Redis prefs `favoriteFranchiseId` | `franchises` by name/slug |
| `favoriteStudio` | Redis prefs `favoriteStudioId` | `studios` by name/slug |
| `favoriteDeveloper` | Redis prefs `favoriteDeveloperId` | `developers` (+ company name) |
| `favoriteCharacter` | Redis prefs (string) | **No Character table** (see gaps) |
| `favoriteSoundtrack` | Redis prefs (string) | **No Soundtrack table** (see gaps) |
| `currentlyPlaying` | `user_presence.current_game_id` + `game_logs` | `games.id` required |
| `nextToPlay` | Redis prefs `nextToPlayGameId` | `games.id` required; optional |
| `completedThisYear` | Derived read | OpenAPI-required lightweight `GameLog` COMPLETED count |

No backlog/wishlist/gamesCompleted extensions. No recommendation logic.

---

## Playing Status Rules

1. **Single active Currently Playing** — at most one `UserPresence.currentGameId` and at most one `GameLog` with `status = PLAYING` per user.
2. **Archive on change** — when `currentlyPlaying` changes to another game (or null):
   - all user `GameLog` rows with `PLAYING` → `PAUSED`
   - new game upserted as `PLAYING` (if non-null)
   - presence updated
3. **Next To Play** — optional game UUID; validated against `games`; no GameLog mutation.
4. Documented source for archive semantics: GameLogStatus includes `PAUSED`; single-active identity rule from sprint + presence FK. Full play-session lifecycle remains `GAME_LOG_API`.

---

## Domain Events

Published via `DomainEventPublisher` after successful mutations (no consumers yet):

| Sprint name | Event type |
|-------------|------------|
| FavoritePlatformChanged | `user.gaming-identity.favorite-platform.changed.v1` |
| FavoriteGenreChanged | `user.gaming-identity.favorite-genre.changed.v1` |
| FavoriteFranchiseChanged | `user.gaming-identity.favorite-franchise.changed.v1` |
| FavoriteStudioChanged | `user.gaming-identity.favorite-studio.changed.v1` |
| FavoriteDeveloperChanged | `user.gaming-identity.favorite-developer.changed.v1` |
| FavoriteCharacterChanged | `user.gaming-identity.favorite-character.changed.v1` |
| FavoriteSoundtrackChanged | `user.gaming-identity.favorite-soundtrack.changed.v1` |
| CurrentGameChanged | `user.gaming-identity.current-game.changed.v1` |
| NextGameChanged | `user.gaming-identity.next-game.changed.v1` |

Payload shape follows `EVENT_ARCHITECTURE.md` (`id`, `type`, `occurredAt`, `aggregateId`, `aggregateType`, `actorId`, `correlationId`, `schemaVersion`, `payload`).

**Note:** No `outbox_events` table under Freeze — in-process emit after write. Transactional outbox deferred.

---

## Validation Rules

| Rule | Result |
|------|--------|
| Unknown platform enum / missing `platforms` slug row | `400 VALIDATION_FAILED` (`ENTITY_NOT_FOUND`) |
| Genre / franchise / studio / developer not in catalog | `400 VALIDATION_FAILED` (`ENTITY_NOT_FOUND`) |
| Unknown `currentlyPlaying` / `nextToPlay` game UUID | `400 VALIDATION_FAILED` (`INVALID_GAME`) |
| Invalid enum / non-UUID (class-validator) | `400 VALIDATION_FAILED` |
| Unauthenticated `me` routes | `401` |
| Private profile nested identity for strangers | nested `gamingIdentity: null` |
| Singular favorites | replace-all on platform/genre join tables (no multi-row identity) |
| Idempotent same-value PATCH | no-op (no duplicate row, no extra event) |

ProblemDetails used for all AppException paths.

---

## Repository / Read Strategy

`loadIdentitySources(userId)` parallelizes:

- `userPresence` (current game)
- `favoritePlatform` → `platform` (join select)
- `favoriteGenre` → `genre` (join select)
- `gameLog.count` for `completedThisYear`

Redis prefs + batched `resolvePrefsEntities` for franchise/studio/developer IDs.

Uses existing indexes (`favorite_* .user_id`, `game_logs (user_id, status)`). No N+1 on profile load. No schema denormalization.

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit `gaming-identity.service.spec.ts` | **8/8 passed** |
| E2E `gaming-identity.e2e-spec.ts` | **9/9 passed** |
| `pnpm typecheck` (`apps/api`) | **passed** |

### Coverage

- Update favorites (catalog-backed)
- Invalid entity / game references
- Duplicate platform rows prevented (singular replace + re-set)
- Current game replacement + PLAYING→PAUSED archive
- Next game update
- Public profile nested retrieval
- Authorization / validation failures

---

## OpenAPI Gaps

| Gap | Handling |
|-----|----------|
| `UserPublicProfile` has no `gamingIdentity` | Nested field added for sprint “Public Profile” goal — **documented, not a new path** |
| No `GET /users/{userId}/gaming-identity` | **Not implemented** (would be a silent path extension) |
| `favoritePlatform` is enum, DB is `platforms` UUID | Mapped via fixed slugs `pc|playstation|xbox|nintendo|mobile` |
| `favoriteGenre` etc. are strings, not UUIDs | Resolve name/slug → store entity id; return canonical name |
| No join tables for franchise/studio/developer favorites | Entity IDs in Redis prefs under Freeze |
| No Character / Soundtrack catalog tables | Free-text prefs only; cannot reference entities yet |
| `completedThisYear` vs “no statistics calculations” | Lightweight GameLog count only (OpenAPI-required); no analytics module |
| No transactional outbox table | In-process `DomainEventPublisher` |

---

## Known Limitations

1. Platform enum mapping requires seeded `platforms` rows with expected slugs.
2. Character / soundtrack remain free-text until catalog + join tables exist.
3. Franchise / studio / developer identity refs live in Redis (not Postgres join tables).
4. Archive rule (`PLAYING`→`PAUSED`) is identity-layer; full session UX is Game Log module.
5. Domain events are not durable across process restart (no outbox yet).
6. `UpdateGamingIdentityRequest` allOf includes read-only `completedThisYear` — ignored by whitelist DTO.

---

## Deliverables Checklist

- [x] Core identity CRUD with entity refs where schema allows  
- [x] Currently Playing (single active) + archive previous  
- [x] Next To Play (optional)  
- [x] Player summary on me + public profile composition  
- [x] Validation + ProblemDetails  
- [x] Optimized repository reads  
- [x] Dedicated `GamingIdentityService`  
- [x] Domain events (publisher only)  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin Sprint 2.4 until this sprint has been reviewed and approved.**
