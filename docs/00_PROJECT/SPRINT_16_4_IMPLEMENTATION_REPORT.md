# Sprint 16.4 — Backend MVP Hygiene & Consistency Report

**Document:** `docs/00_PROJECT/SPRINT_16_4_IMPLEMENTATION_REPORT.md`  
**Date:** 2026-07-21  
**Role:** Principal Software Architect / CTO  
**Mode:** Implementation (hygiene only — **no new features, no schema expansion, no Phase 2 / Premium**)  
**Preceded by:** [`SPRINT_16_3_IMPLEMENTATION_REPORT.md`](./SPRINT_16_3_IMPLEMENTATION_REPORT.md)  
**Scope SSOT:** [`MODULE_16_SCOPE_REPORT.md`](./MODULE_16_SCOPE_REPORT.md)

**Outcome:** Backend MVP surface is **feature-frozen**. Remaining work is engineering-only in [`POST_MVP_PRODUCTION_BACKLOG.md`](./POST_MVP_PRODUCTION_BACKLOG.md).

---

## OpenAPI parity

| Check | Result |
|-------|--------|
| Domain YAML inventory (`docs/08_API/*.yaml`) | 16 domain specs + `common/` + frozen `openapi/bundle.yaml` |
| Posts path/method/status vs Nest | **Parity** (create/get/patch/delete/timeline/user/replies/like/reply/repost) |
| Undocumented runtime ops routes (`/health*`, Admin shell, appeals, catalog-admin) | **Explicitly deferred** → Production Backlog (not invented this sprint) |
| Documented-ahead stubs (`AI_API`, SOCIAL discover/trending) | **Deferred** — no Nest invent |
| Dual source (`@Api*` vs frozen YAML) | Documented: runtime `/docs/spec` = frozen bundle; decorators metadata-only |
| Docs layout | `openapi/README.md` updated — includes `POSTS_API.yaml` + deferral pointer |

---

## DTO parity

| Check | Result |
|-------|--------|
| class-validator on BC DTOs | Present for MVP write paths |
| Nullable / optional / defaults | Aligned with OpenAPI for Posts and peer Freezes |
| Enum mappings | Prisma ↔ DTO ↔ OpenAPI for Posts visibility/media; NotificationType `POST_*` |
| Problem Details | Global `ProblemDetailsExceptionFilter` |
| Cursor query DTOs | `cursor` + `limit` with max clamps |

---

## Pagination consistency

| Check | Result |
|-------|--------|
| Wire format | Canonical `base64url(JSON)` across cursor BCs |
| `limit+1` / `hasNext` / `nextCursor` | Consistent on list surfaces |
| Soft-fail invalid cursor (Social / Profile activity) | **Hardened** → throw Problem Details 400 |
| Named limit constants | Added for Social / Profile activity |
| Posts `resolvePostLimit` | Aligned to finite-check clamp (OpenAPI max **50** intentional) |
| Admin / Moderation offset pages | Intentional (not cursor) — documented as deferred unify |
| Remaining unify (shared helper, exception family A/B) | Production Backlog only |

---

## Error consistency

| Check | Result |
|-------|--------|
| Problem Details only (client-facing) | Global filter maps all exceptions to `application/problem+json` |
| Analytics Nest `NotFound`/`BadRequest` | **Replaced** with `AppException` (`analytics.exceptions.ts`) |
| OAuth provider pipe | **Replaced** with `OAuthUnsupportedProviderException` |
| Feed UUID assert | Uses `InvalidFeedFieldException` (not cursor) |
| Status vocabulary | 400 / 401 / 403 / 404 / 409 / 429 (+ 410/502/503 domain-specific); **422 unused** (validation→400 — Freeze-compatible) |

---

## Event consistency

| Check | Result |
|-------|--------|
| `*.v1` naming | Dominant convention |
| Profile statistics consumer types | **Fixed** — now match publishers (`review.created.v1`, `collection.created.v1`, `list.created.v1`, `tierlist.created.v1`) |
| Envelope | `DomainEventPublisher` supplies `id`, `occurredAt`, `schemaVersion`, `actorId` |
| Rename campaigns (`playSession.*`, `game.game.*`) | Production Backlog — no silent client break |

---

## Cache consistency

| Check | Result |
|-------|--------|
| `FLUSHALL` / Redis `KEYS` | **Absent** |
| Invalidation | Targeted `RedisService.del` only |
| Auth vs PlaySession key collision (`session:`) | **Fixed** → `playsession:{id}` / `playsession:user:{id}` |
| Games vs Search prefix overlap | **Fixed** → `game:search:` / `game:discover:` / `game:autocomplete:` |
| Broad list invalidation / TTL-only pages | Acceptable V1; Production Backlog polish |

---

## Authorization consistency

| Check | Result |
|-------|--------|
| PlatformRole on Admin/Analytics/Moderation staff routes | Guards present |
| Visibility / Permission matrices | Composed via Privacy + SocialGraph (Posts 16.3; peers unchanged) |
| Ownership validation | BC services retain author/owner checks |
| 404 oracle protection | Soft-delete / invisible → 404 pattern retained |

---

## Documentation consistency

| Check | Result |
|-------|--------|
| Module 16 Scope vs Posts Option A delivered | Consistent (16.2–16.3 implemented Posts) |
| Production Backlog expanded | All residual engineering / OpenAPI / flake / Phase 2 items relocated |
| Freeze / ADR / Implementation Reports | No conflicting “open MVP Major” statements after 16.4 |
| Feature freeze statement | Backend MVP endpoints/entities frozen — no further product invent until post-MVP scheduling |

---

## Hardening applied this sprint (hygiene)

1. Play-session Redis key namespace (Auth session collision).  
2. Games catalog cache key namespace (Search collision).  
3. Profile statistics event type alignment.  
4. Social + Profile activity invalid cursor → 400 Problem Details.  
5. Analytics dashboard → `AppException`.  
6. OAuth provider pipe → `AppException`.  
7. Feed UUID field exception.  
8. OpenAPI README + Production Backlog refresh.

**Not done (by design):** new endpoints, Prisma migrations, Premium/AI/Recommendations, Meili, Push, Friends.

---

## Validation results

| Check | Result |
|-------|--------|
| `prisma validate` | **Pass** |
| `typecheck` (`@gmrlog/api`) | **Pass** |
| `build` (`@gmrlog/api`) | **Pass** |
| ESLint (Sprint 16.4 touched files) | **Pass** |
| Unit (+ integration in unit config) | **Pass** — 142 files / **575** tests |
| E2E smoke (`health` + notification prefs) | **Pass** |
| Full E2E | Known non-MVP flakes (moderation history pagination, catalog mock) → Production Backlog |

---

## Remaining Critical Debt

**NONE**

---

## Remaining Major Debt

**NONE**

---

## Remaining MVP Minor Debt

**NONE**

---

## Remaining Production Engineering Debt

**Only** [`docs/00_PROJECT/POST_MVP_PRODUCTION_BACKLOG.md`](./POST_MVP_PRODUCTION_BACKLOG.md)

---

## Gate

Backend MVP is **feature-frozen** after this sprint. Formal declare phrase remains Sprint **16.5** (`BACKEND MVP COMPLETE`).

**SPRINT 16.4 COMPLETE**

Stop. Do **not** continue to Sprint 16.5.
