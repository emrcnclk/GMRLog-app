# GMRLOG Sprint 2.5 — Privacy & Preferences Implementation Report

**Sprint:** 2.5 — Privacy & Preferences (User Module Final)  
**Date:** 2026-07-12  
**Status:** **COMPLETE — Awaiting User Module review**  
**Contracts:**  
- Privacy / Preferences / Language / Theme: `docs/08_API/USER_API.yaml`  
- Notification preferences: `docs/08_API/NOTIFICATION_API.yaml`  
**Schema:** unchanged (Database Freeze respected)

---

## Implemented Endpoints

| Method | Path | Auth | Contract | Purpose |
|--------|------|------|----------|---------|
| GET | `/api/v1/users/me/privacy` | Bearer | **OpenAPI gap** | Read privacy settings |
| PATCH | `/api/v1/users/me/privacy` | Bearer | USER_API | Update privacy settings |
| GET | `/api/v1/users/me/preferences` | Bearer | **OpenAPI gap** | Read preferences |
| PATCH | `/api/v1/users/me/preferences` | Bearer | USER_API | Update preferences |
| GET | `/api/v1/users/me/language` | Bearer | **OpenAPI gap** | Read language/region/timezone |
| PATCH | `/api/v1/users/me/language` | Bearer | USER_API | Update language settings |
| GET | `/api/v1/users/me/theme` | Bearer | **OpenAPI gap** | Read theme |
| PATCH | `/api/v1/users/me/theme` | Bearer | USER_API | Update theme |
| GET | `/api/v1/notifications/preferences` | Bearer | NOTIFICATION_API | Read notification prefs |
| PATCH | `/api/v1/notifications/preferences` | Bearer | NOTIFICATION_API | Update notification prefs |

**Out of sprint:** notification delivery, recommendation algorithms, Search module, Game module.

---

## Architecture

```text
PrivacyController / PreferenceController / NotificationPreferenceController (thin)
        │                    │                         │
        ▼                    ▼                         ▼
 PrivacyService      PreferenceService      NotificationPreferenceService
        │                    │                         │
        ▼                    ▼                         ▼
 PrivacyRepository   PreferenceRepository   NotificationPreferenceRepository
        │                    │                         │
        └──────────┬─────────┴─────────────┬───────────┘
                   ▼                       ▼
                Prisma                  Redis extras
                   +
          ProfileCacheService.invalidateUser
```

`PrivacyService` and `PreferenceService` are **independent** of `UserProfileService`.  
Public read paths call `PrivacyService.assert*` — they do not embed privacy rules.

| Component | Responsibility |
|-----------|----------------|
| `PrivacyService` | Load/update privacy; visibility checks; search/birthday helpers |
| `PreferenceService` | Preferences, language, theme; locale/timezone validation |
| `NotificationPreferenceService` | User-facing notification toggles only (no delivery) |
| `PrivacyRepository` | `PrivacySettings` + `UserSettings` + Redis extras |
| `PreferenceRepository` | Redis preferences + `UserProfile` / `UserSettings` language/theme |
| `NotificationPreferenceRepository` | Redis prefs + sync `UserSettings` email/push + `NotificationPreference` rows |

---

## Implemented Preferences

### USER_API `UserPreferences`

| Field | Persistence |
|-------|-------------|
| `autoplayVideos` | Redis `user-preferences:{userId}` |
| `showAdultContent` | Redis (NSFW preference) |
| `spoilerProtection` | Redis |
| `defaultFeed` | Redis (`FOR_YOU` \| `FOLLOWING` \| `FRIENDS`) |
| `defaultPlatform` | Redis |

### Language

| Field | Persistence |
|-------|-------------|
| `language` | `UserProfile.language` + `UserSettings.locale` |
| `region` | `UserProfile.country` |
| `timezone` | `UserProfile.timezone` |

Validated: locale tag pattern, IANA/UTC timezone, region length.

### Theme

| Field | Persistence |
|-------|-------------|
| `appTheme` | `UserSettings.theme` |
| `accentColor` | Redis (hex `#RRGGBB`) |

### Notification preferences (NOTIFICATION_API)

| Field | Notes |
|-------|-------|
| `likes`, `comments`, `follows`, `mentions` | Documented |
| `collections`, `lists`, `tierLists` | Collection / list / tier-list interaction toggles |
| `marketing` | Documented |
| `push`, `email`, `desktop` | Channel toggles; email/push synced to `UserSettings` |
| `achievements`, `recommendations` | Documented |

**Not in OpenAPI — not invented:** dedicated `messages` or `reviews` notification toggles.  
Message gate uses privacy `allowMessages` (EVERYONE / FRIENDS / NOBODY).

### Content preferences

| Sprint ask | Status |
|------------|--------|
| Mature content filtering | Via `showAdultContent` preference |
| Spoiler filtering | Via `spoilerProtection` preference |
| Hidden platforms / genres | **Not in USER_API** — skipped |

---

## Privacy Fields

| Field | Storage | OpenAPI |
|-------|---------|---------|
| `profileVisibility` | Prisma `PrivacySettings` (`FRIENDS` ↔ `FOLLOWERS`) | Yes |
| `showGameLibrary` | Prisma | Yes |
| `showActivity` | Prisma + `UserSettings` | Yes |
| `allowMessages` | Prisma | Yes |
| `showFollowers` / `showFollowing` | Prisma | Gap (schema-backed) |
| `searchVisibility` | Redis `privacy-extras:{userId}` | Gap (sprint) |
| `birthdayVisibility` | Redis extras | Gap (sprint) |
| `gamingIdentityVisibility` | Redis extras | Gap (sprint) |

---

## Privacy Enforcement Strategy

Central API on `PrivacyService`:

| Rule | Method | Applied on |
|------|--------|------------|
| Profile visibility | `assertProfileVisible` | Public profile, stats, summary, activity (via activity assert), gaming identity, followers/following |
| Activity | `assertActivityVisible` | `GET /users/{userId}/activity` |
| Gaming identity | `assertGamingIdentityVisible` | Public gaming identity / nested on profile |
| Followers list | `assertFollowersVisible` | `GET /users/{userId}/followers` |
| Following list | `assertFollowingVisible` | `GET /users/{userId}/following` |
| Birthday | `canShowBirthday` | Helper ready; `UserPublicProfile` has no birthday field |
| Search | `isSearchable` | Helper for Search module (`GET /search/users` not in this sprint) |

Visibility semantics:

- `PUBLIC` — anyone  
- `PRIVATE` — owner only → `404` ProblemDetails (`ProfileUnavailable`)  
- `FRIENDS` — viewer follows target **or** friendship edge  

Boolean flags (`showActivity`, `showFollowers`, `showFollowing`): non-owners get `404` when false.

---

## Cache Invalidation

`ProfileCacheService.invalidateUser(userId)` on:

| Change | Event |
|--------|-------|
| Privacy update | `user.privacy.updated.v1` |
| Preferences update | `user.preferences.updated.v1` |
| Language update | `user.language.updated.v1` |
| Theme update | `user.theme.updated.v1` |
| Notification prefs update | `notification.preferences.updated.v1` |

---

## Validation

- Invalid visibility / feed / theme enums → `400` ProblemDetails (class-validator)  
- Invalid locale / timezone / accent color → `InvalidPreferenceValueException` → ProblemDetails  
- Unauthenticated mutations → `401`

---

## Test Results

| Suite | Result |
|-------|--------|
| Unit `privacy.service.spec.ts` | **6/6 passed** |
| Unit `preference.service.spec.ts` | **4/4 passed** |
| Unit `notification-preference.service.spec.ts` | **2/2 passed** |
| Unit full suite (`vitest.config.ts`) | **121+ passed** (19 files; +2 privacy cases after report draft) |
| E2E `privacy-preferences.e2e-spec.ts` | **8/8 passed** |
| E2E full suite (`vitest.e2e.config.ts`) | **72/72 passed** (10 files) |
| `pnpm typecheck` | **passed** |

### E2E coverage

- Privacy update  
- Preference / language / theme update  
- Notification preference update  
- Public profile visibility (`PRIVATE` → 404 for stranger)  
- Gaming identity visibility (`PRIVATE` → nested null)  
- Invalid enum → 400  
- Authorization → 401  

Search visibility is covered at unit level via `isSearchable` (Search HTTP surface not implemented yet).

---

## OpenAPI Gaps

| Gap | Handling |
|-----|----------|
| GET for privacy / preferences / language / theme | Implemented for client round-trip |
| `searchVisibility`, `birthdayVisibility`, `gamingIdentityVisibility` | Accepted on privacy DTO; Redis extras |
| `showFollowers` / `showFollowing` on privacy DTO | Prisma-backed; enforced on social lists |
| Nested birthday on public profile | Not in `UserPublicProfile` schema — helper only |

---

## Known Limitations

1. **No notification delivery** — preference layer only (by design).  
2. **No recommendation algorithms** — `recommendations` is a toggle only.  
3. **Search enforcement** — `PrivacyService.isSearchable` is ready; `SEARCH_API` `/search/users` is not implemented in this module.  
4. **Birthday on public profile** — setting stored; public schema has no birthday field.  
5. **Hidden platforms / genres** — not documented in USER_API; not persisted.  
6. **Messages / review notification toggles** — not in NOTIFICATION_API schemas; not invented.  
7. No Prisma schema changes (Freeze).

---

## Deliverables Checklist

- [x] Privacy endpoints + enforcement across public surfaces  
- [x] Preferences / language / theme  
- [x] Notification preference layer (no delivery)  
- [x] `PrivacyService` + `PreferenceService` independent of `UserProfileService`  
- [x] Cache invalidation on privacy / preference changes  
- [x] ProblemDetails validation  
- [x] Unit + e2e tests  
- [x] This report  

**Do not begin the Game module until the User module has been reviewed and approved.**

---

# User Module v1.0 — COMPLETE

**Declaration:** After Sprints 2.1–2.5, the User module is **feature complete** for v1.0 against documented contracts (with documented OpenAPI gaps).

## Scope completed

| Sprint | Focus |
|--------|--------|
| 2.1 | Profile CRUD, avatar/banner, deletion |
| 2.2 | Social graph (follow/block/mute/relationship) |
| 2.3 | Gaming identity |
| 2.4 | Statistics, activity, profile summary |
| 2.5 | Privacy, preferences, notification prefs |

## Totals

| Metric | Count |
|--------|-------|
| **User-module HTTP endpoints** | **33** |
| **Unit tests (api)** | **123** (after Sprint 2.5 privacy additions) |
| **E2E tests (api)** | **72** |
| **OpenAPI compliance** | USER_API / SOCIAL_API / NOTIFICATION_API preference surfaces implemented; gaps documented (GET helpers, extended privacy fields, summary composition) |
| **Schema migrations this module** | **0** (Database Freeze) |

### Endpoint breakdown (User module)

| Area | Count |
|------|-------|
| Profile (`/users/me*`, public username) | 8 |
| Social graph | 10 |
| Gaming identity | 2 |
| Statistics / activity / summary | 3 |
| Privacy / preferences / language / theme | 8 |
| Notification preferences | 2 |
| **Total** | **33** |

Auth/OAuth/MFA/device/session endpoints remain under the Auth module (Sprint 1.x) and are not double-counted here.

## Production readiness assessment

| Criterion | Assessment |
|-----------|------------|
| Typed NestJS services + repositories | Ready |
| ProblemDetails errors | Ready |
| JWT + optional JWT on public reads | Ready |
| Privacy consistency on public reads | Ready (Search birthday surfaces pending their modules) |
| Redis cache + invalidation | Ready |
| Domain events for profile/privacy/prefs | Ready (consumers beyond cache TBD) |
| Notification **delivery** | Not in scope — prefs only |
| Load / chaos / observability SLOs | Outside this sprint — follow platform standards before prod traffic |
| OpenAPI drift | Acceptable with documented gaps; recommend syncing YAML in a docs pass |

**Verdict:** User Module v1.0 is **implementation-complete and review-ready**. Suitable as a foundation for dependent modules once product/architecture review approves. Harden Search integration and OpenAPI gap sync before high-traffic production launch.

---

**Next:** User Module review & approval → then Game module may begin.
