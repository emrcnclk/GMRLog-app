# D2.2 Completion Report — User Domain Foundation

**Status:** LOCKED
**Completed:** 2026-07-26
**Scope:** User domain only — D2.3 was not started.

---

## 1. Files created / modified

### Backend — `apps/backend/src/users/` (new domain)

| File | Role |
| --- | --- |
| `users.module.ts` | Domain module — binds `@gmrlog/database` repositories to DI tokens via `PrismaService` |
| `users.tokens.ts` | `USER_REPOSITORY` · `USER_SETTINGS_REPOSITORY` · `CONNECTED_ACCOUNT_REPOSITORY` |
| `users.service.ts` | Domain service — the only business layer |
| `me.controller.ts` | `GET /me` · `PATCH /me` |
| `settings.controller.ts` | `GET /settings` · `PATCH /settings/appearance` · `PATCH /settings/accessibility` |
| `connected-accounts.controller.ts` | `GET /connected-accounts` (read only) |
| `mappers/user.mapper.ts` | Persistence → S1 §15 projections (`UserSelfResponse` · `SettingsResponse` · `ConnectedAccountResponse`) |
| `dto/me-patch.dto.ts` · `dto/settings-patch.dto.ts` | Zod-backed transport DTOs (global pipe) |
| `identity.util.ts` | `playerIdOf` — guard-attached identity narrowing |
| `testing/fake-repositories.ts` | In-memory repository fakes (build-excluded) |
| `users.service.spec.ts` · `users.controller.spec.ts` | Domain tests |

### Packages

| File | Change |
| --- | --- |
| `packages/database/src/repositories/user-settings.repository.ts` | New `UserSettingsRepository` + Prisma implementation (`findByUser` / `upsertByUser`) |
| `packages/database/src/repositories/index.ts` | Export |
| `packages/database/src/repositories/repositories.spec.ts` | UserSettings repository interaction test (PGlite/PostgreSQL harness) |
| `packages/types/src/index.ts` | S1 §15.2 / §15.11 / §15.16 response contracts |
| `packages/validators/src/index.ts` | S1 §14.5 `mePatchSchema` · §14.23 appearance/accessibility patch schemas (single source of validation) |

### Infrastructure touches (no behavior redesign)

- `zod-validation.pipe.ts` — `createZodDto` instances now typed as parsed schema output; schema detection made structural (`safeParse` duck-type) because `@gmrlog/validators` (CJS build) and the ESM test runtime load two class identities of the same zod version (dual-package hazard). Production behavior unchanged.
- `app.module.ts` — mounts `UsersModule`.
- `tsconfig.build.json` — excludes `src/**/testing/**`.
- `package.json` — `@nestjs/testing` devDependency.

## 2. Endpoints implemented (S1 dialect)

| Method | Path | S1 source | Notes |
| --- | --- | --- | --- |
| GET | `/me` | §13.3 | Self profile — `UserSelfResponse` |
| PATCH | `/me` | §13.3 / §14.5 | `displayName` · `bio` (null clears) · upload id fields validated per contract |
| GET | `/settings` | §13.12 / §15.16 | Appearance + accessibility sections |
| PATCH | `/settings/appearance` | §13.12 / §14.23 | `theme` (closed enum) · `locale` |
| PATCH | `/settings/accessibility` | §13.12 / §14.23 | `reduceMotion` |
| GET | `/connected-accounts` | §13.12 / §15.11 | Read only — provider · status · linkedAt · scopes |

**Dialect correction:** the sprint brief named `GET/PATCH /me/settings` and `GET /me/connected-accounts`; S1 defines these surfaces as `/settings`, `/settings/{section}` and `/connected-accounts`. Per "never modify API dialect", the S1 paths were implemented.

## 3. Domain architecture

Controllers → `UsersService` → repository interfaces (`@gmrlog/database`) → Prisma. No Prisma access outside repositories; controllers are transport-only; mapping is a pure layer. All routes guarded by `JwtAuthGuard` + `CurrentUser`; guests receive the canonical S1 `authn`/`UNAUTHENTICATED` error envelope. A verified token whose subject is missing or soft-deleted fails closed as authn (F6.7).

## 4. Validation summary

- Single source: schemas live in `@gmrlog/validators`, consumed by DTOs through the existing global Zod pipe — no duplicated or controller-level validation.
- `.strict()` objects enforce S1 §14.23 "allowlisted fields only".
- `displayName` reuses the §14.2 rule (1–40 · trimmed); `bio` max 500 · null clears; `theme` is the closed `light|dark|system` vocabulary.
- Avatar/banner contract: `avatarUploadId`/`bannerUploadId` accepted per §14.5, but rejected honestly ("not a confirmed upload") because the uploads foundation (§13.14) is not mounted yet.

## 5. Test summary

- **Unit (`users.service.spec.ts`)** — 12 tests: mapping, fail-closed authn, bio null-clear, empty-patch no-op, upload rejection, settings defaults/upsert/clear, connected-account projection.
- **Controller/integration (`users.controller.spec.ts`)** — 11 tests: real Nest + Fastify pipeline (guards, global pipe, envelope interceptor, exception filter) over fake repositories via `app.inject`; asserts S1 §4 envelope, §7 error format, requestId presence, guest 401, stale-token 401, validation failures.
- **Repository interaction** — `UserSettingsRepository` upsert/read/clear against the D2.1 dual harness (PGlite locally, real PostgreSQL via `GMRLOG_TEST_DATABASE_URL`).
- Workspace: backend 37/37 · database 31/31 · all packages green.

## 6. Verification

`pnpm build` ✅ · `pnpm typecheck` ✅ · `pnpm lint` ✅ · `pnpm test` ✅ · `pnpm format:check` ✅

## 7. Deferred to D2.3+

- **Handle update** — S1 defines no handle-update surface (`§14.5` has no `handle` field); handle is set at registration only. Any handle-change contract requires an S1 amendment first.
- **Avatar/banner resolution** — uploads/storage foundation (§13.14, §14.24); until then media URLs project as `null` and upload ids cannot be confirmed.
- **`privacy` object on `UserSelfResponse`** — blocked by the S2 gap (no Privacy entity); shape must not be invented.
- **`PATCH /settings/account` · `/settings/privacy` · `/settings/notifications`** — belong to auth/privacy/notification domains.
- **`GET /settings/legal`** — content-ref surface, not user settings.
- **`DELETE /connected-accounts/{provider}`, account links, OAuth** — linking domain.
- **`/me/statistics` · `/me/achievements` · `/me/followers` · `/me/following`** — forbidden domains in D2.2.

---

## Lock statement

All acceptance criteria pass; endpoints follow the S1 envelope, error format and request-id propagation; layering follows F6.3 with no direct Prisma access outside repositories. **D2.2 is LOCKED.** D2.3 was not started.
