# GMRLOG Sprint 2.1 — User Profile Core Implementation Report

**Sprint:** 2.1 — User Profile Core  
**Date:** 2026-07-11  
**Status:** **COMPLETE — Awaiting review before Sprint 2.2**  
**Contract:** `docs/08_API/USER_API.yaml` + `docs/08_API/common/schemas/user-public-profile.yaml`  
**Schema:** unchanged (Database Freeze respected)  
**Storage:** `docs/06_BACKEND/STORAGE_ARCHITECTURE.md`

---

## Implemented Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/v1/users/me` | Bearer | Private profile |
| PATCH | `/api/v1/users/me` | Bearer | Update profile |
| DELETE | `/api/v1/users/me` | Bearer | Schedule account deletion (202 + 14-day grace) |
| GET | `/api/v1/users/{username}` | Public | Public profile |
| PUT | `/api/v1/users/me/avatar` | Bearer | Upload / replace avatar |
| DELETE | `/api/v1/users/me/avatar` | Bearer | Remove avatar |
| PUT | `/api/v1/users/me/banner` | Bearer | Upload / replace banner |
| DELETE | `/api/v1/users/me/banner` | Bearer | Remove banner |

**Not implemented (out of OpenAPI / sprint scope):**

| Item | Reason |
|------|--------|
| `GET /users/{userId}` | Not defined in USER_API paths |
| Username availability endpoint | Not in USER_API |
| Gaming identity / favorites | Explicitly deferred (Sprint 2.x+) |
| Followers, blocking, privacy, notification settings | Explicitly out of sprint |

---

## Implemented Services

```text
UsersController
  → UserProfileService
    → UserProfileRepository → Prisma (`users`, `profiles`, `user_settings`)
    → StorageService → S3/MinIO (or memory driver in test)
    → PasswordService / SessionRepository / RefreshTokenRepository / Redis
```

| Service | Responsibility |
|---------|----------------|
| `UserProfileService` | Profile CRUD, media replace/delete, deletion schedule |
| `UserProfileRepository` | Lookup by `userId` / `username` (existing unique indexes) |
| `StorageService` (extended) | `putObject`, `deleteObject`, deterministic keys, public URL |

---

## Profile Fields

### OpenAPI `UserPublicProfile`

`id`, `username`, `displayName`, `avatar`, `banner`, `bio`, `verified`, `developer`, `studio`, `createdAt`

### OpenAPI `UserPrivateProfile`

Public fields + `email`, `language`, `timezone`, `notificationEnabled`

### OpenAPI `UpdateUserRequest`

`displayName`, `bio`, `language`, `timezone`

### Prisma-backed extensions (documented OpenAPI gap)

Persisted on `profiles` for core CRUD requested by sprint brief:

| Field | Storage |
|-------|---------|
| `username` | `profiles.username` (unique, Citext) |
| `pronouns` | `profiles.pronouns` |
| `website` | `profiles.website` |
| `location` | `profiles.country` |
| `birthday` | `profiles.birthDate` |

**Not persisted this sprint:** favorite platform/genre/franchise/studio/developer/character/soundtrack — those belong to `GamingIdentity` / favorite tables and later sprints.

---

## Validation Rules

| Rule | Enforcement |
|------|-------------|
| Username 3–30, `[a-zA-Z0-9_]` | DTO `@Matches` + service `USERNAME_PATTERN` |
| Username uniqueness | Repository + Prisma P2002 → `409 USERNAME_TAKEN` |
| displayName max 50 | DTO |
| bio max 500 | DTO |
| website URL (protocol required) | DTO `@IsUrl` |
| Image MIME | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Avatar max size | **10 MB** (STORAGE_ARCHITECTURE) |
| Banner max size | **20 MB** (STORAGE_ARCHITECTURE) |
| Deletion password | Argon2 verify |

All failures return **ProblemDetails** (`application/problem+json`).

---

## Storage Integration

- Keys: `{avatar\|banner}/{userId}/{uuid}.{ext}` (never user filenames)
- Client receives public URL only (bucket credentials never exposed)
- Replace deletes previous object when key is recoverable from URL
- Drivers:
  - **S3-compatible** (`@aws-sdk/client-s3`) using existing `S3_*` env
  - **Memory** when `STORAGE_DRIVER=memory` or `NODE_ENV=test` (e2e without MinIO)
- Multipart via `@fastify/multipart` (file size capped at banner max)

---

## Account Deletion

`DELETE /users/me` with password:

1. Verifies password  
2. Writes Redis `account:deletion:{userId}` (TTL = 14 days)  
3. Revokes all refresh tokens + DB/Redis sessions  
4. Returns `202` `{ scheduled: true, deletionDate }`  

Hard delete / cancel-deletion (`/auth/account/*`) remain for later auth/account lifecycle wiring.

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit (incl. UserProfileService) | **85/85** (11 new user profile) |
| E2E users | **8/8** |
| Full e2e (auth + users + health) | **39/39** |
| Typecheck | ✅ |

Coverage includes: profile get/update, duplicate username, invalid username, public profile, unauthorized update, avatar upload/replace/delete, banner upload/delete.

---

## Known Limitations

1. **No `GET /users/{userId}`** — OpenAPI only defines username lookup.  
2. **No username availability route** — uniqueness enforced on PATCH only.  
3. **Favorites / gaming identity** — deferred; not in UpdateUserRequest.  
4. **Birthday privacy** — no privacy settings integration this sprint (privacy endpoints out of scope).  
5. **Deletion is soft-schedule in Redis** — no Prisma `deletedAt` until a purge job exists (avoids locking out users during grace via `deletedAt: null` queries).  
6. **Image processing** — no virus scan / WebP variants / CDN yet (STORAGE pipeline later).  
7. **UpdateUserRequest OpenAPI gap** — username/pronouns/website/location/birthday accepted beyond documented UpdateUserRequest; recommend docs pass.  
8. **Integration suite** — not separate; e2e covers cross-layer flows.

---

## Production Readiness Assessment

**Ready for Sprint 2.1 review.**

Ops notes before hard production:

- Ensure MinIO/R2 bucket + CORS for public avatar/banner reads  
- Wire account deletion purge worker + AUTH cancel-deletion  
- Align USER_API.yaml with extended PATCH fields  

**Do not begin Sprint 2.2 until this report is reviewed and approved.**
