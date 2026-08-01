# GMRLOG — Phase S1: API Specification

**Document:** `docs/17_IMPLEMENTATION_SPECIFICATIONS/S1_API_SPECIFICATION.md`  
**Version:** 1.2  
**Status:** **DRAFT**  
**Sprint:** S1 (API Specification — implementation contract)  
**Last Updated:** July 2026  
**Owner:** Engineering Architecture Director  
**Classification:** Implementation Specification

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | Entire F1 |
| 4 | Entire F2 |
| 5 | Entire F3 |
| 6 | Entire F4 |
| 7 | Entire F5 (**LOCKED**) |
| 8 | Entire F6 (**LOCKED**) — especially [`F6_4_API_ARCHITECTURE.md`](../06_ENGINEERING/F6_4_API_ARCHITECTURE.md) |
| 9 | [`PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md`](./PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md) — Phase S charter |
| 10 | [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) — subordinate projections |
| 11 | **This document** — Player/Staff API implementation contract for Version 1 |

Never contradict higher documents.

This document is **not** architecture.

This document **is** the implementation contract for backend developers and OpenAPI / SDK generation.

| Does | Does not |
|------|----------|
| Catalog resources · endpoints · DTOs · pagination · filter/sort · authn/authz · errors · validation · uploads · websocket references · OpenAPI/SDK rules · versioning · deprecation | Product redesign · engineering redesign · schema redesign · endpoints outside F5 · Version 2 endpoints · NestJS/controller/TypeScript code · business algorithms |

**Gate:** Stop after this specification. Do **not** continue to Sprint S2 in this deliverable.

---

## Scope

**In scope:** Complete Version 1 player API contract under `/api/v1` · staff-isolated API under `/api/v1/staff` · integration callback surface references · websocket connection references · generation and evolution workflows.

**Out of scope:**

| Forbidden |
|-----------|
| Marketplace · Premium · Creator Economy · Publisher/Developer dashboards · Public third-party API · Twitch · advanced AI engine endpoints (F5.5 §20.1) |
| F5.3 screens marked Future (Creator Tools · Premium Manage · Developer Hub · Title Insights · Guides · Bookmarks destination · Article) |
| Business logic · ranking · recommendation algorithms |
| Database / Prisma models (S2) |
| Implementation code · decorators · controllers · middleware |
| Rewriting F6.4 dialect or F5.1 ownership |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Relationship · Naming · Global contracts |
| B | 5–8 | Pagination · Filter/Sort · Errors · Validation |
| C | 9–11 | Authentication · Authorization matrix · Idempotency & rate limit headers |
| D | 12–13 | Resource catalog · Endpoint catalog |
| E | 14–15 | Request DTO catalog · Response DTO catalog |
| F | 16–18 | Uploads · Websocket references · Staff surface |
| G | 19–22 | OpenAPI · SDK · Versioning · Deprecation |
| H | 23–24 | Anti-patterns · Audit checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Transform the constitutional API architecture (F6.4) into a complete implementation specification.

Every backend endpoint shipped for Version 1 must appear in this catalog (or in a formal Amendment to this document).

| Prefer | Never |
|--------|-------|
| One resource per F5.1 meaning | Tab-scoped duplicate trees |
| Cursor lists · honest errors | Engagement payload fields |
| Generated SDK consumption | Hand-rolled client transport |
| MVP-only surface | Version 2 scaffolding |

---

# 2. Relationship to Prior Law

| Prior law | S1 obligation |
|-----------|---------------|
| F5.1 | Resource families and nesting mirror ownership; Shared Destinations singular |
| F5.2 | Feed is aggregation read — does not own Game/Post/Review |
| F5.3 | No endpoint without a cataloged non-Future screen (or staff overlay) |
| F5.4 | Errors and pending states must be expressible |
| F5.5 §20.1 | MVP boundary binds the catalog |
| F6.4 | Dialect · envelopes · cursor-first · access outcomes · no third-party public API |
| F6.7 | Authn identifies · authz grants · validation ≠ authorization |
| Phase S | S1 LOCKED is required for Phase S completion |

---

# 3. Endpoint Naming Conventions

| Rule | Contract |
|------|----------|
| Base path | `/api/v1` for player API · `/api/v1/staff` for staff API |
| Resource segments | Plural nouns · `kebab-case` · English product names |
| Identifiers | Path params named `{id}` or `{parentId}` · value = OpaqueId (string) |
| Sub-resources | `/resources/{id}/children` for product containment only |
| Actions / intents | Noun intent collections: `/import-jobs`, `/account-links`, `/reports` — not verb RPC |
| Query params | `camelCase` |
| Headers | `kebab-case` with `X-Gmrlog-` prefix for product headers where needed |
| Fields in bodies | `camelCase` |
| Timestamps | ISO-8601 UTC strings |
| Booleans | `true` / `false` |
| Null | Absent optional field preferred; explicit `null` only where “cleared” differs from “omitted” |
| Expand | `?expand=field1,field2` allowlisted per resource |
| Idempotency | Header `Idempotency-Key` on non-idempotent writes listed in §11 |

Canonical resource segment names:

| Meaning | Segment |
|---------|---------|
| Session | `sessions` |
| Current player | `me` |
| Users | `users` |
| Games | `games` |
| Posts | `posts` |
| Reviews | `reviews` |
| Comments | `comments` |
| Collections | `collections` |
| Tier lists | `tier-lists` |
| Communities | `communities` |
| Events | `events` |
| Achievements | `achievements` |
| Feed | `feed` |
| Discover | `discover` |
| Search | `search` |
| Library | `library` |
| Notifications | `notifications` |
| Activity center | `activity` |
| Messages | `conversations` |
| Settings | `settings` |
| Connected accounts | `connected-accounts` |
| Uploads | `uploads` |
| Import jobs | `import-jobs` |
| Account links | `account-links` |
| Reports | `reports` |
| Blocks | `blocks` |
| Follows | `follows` |
| Reactions | `reactions` |
| Recommendations | `recommendations` |
| Onboarding | `onboarding` |
| Integration callbacks | `integrations/{provider}/callbacks` |

---

# 4. Global Response & Envelope Contract

## 4.1 Success envelope

Every successful JSON response uses one envelope:

| Field | Kind | Required | Meaning |
|-------|------|----------|---------|
| `data` | object \| array \| null | yes | Primary payload |
| `meta` | object | no | Pagination · freshness · warnings |
| `meta.cursor` | object | when list | See §5 |
| `meta.freshness` | enum string | no | `live` \| `cached` \| `stale` — honest only |
| `meta.requestId` | string | yes | Correlation id echoed from edge |

## 4.2 List envelope

| Field | Kind | Required |
|-------|------|----------|
| `data` | array | yes |
| `meta.cursor.next` | string \| null | yes |
| `meta.cursor.prev` | string \| null | no |
| `meta.hasMore` | boolean | yes |
| `meta.limit` | integer | yes |

## 4.3 Empty list

Empty list is HTTP 200 with `data: []` and `meta.hasMore: false` — never an error.

## 4.4 No content

Deletes and some intent cancels may return HTTP 204 with empty body.

---

# PART B — LIST & ERROR DIALECT

---

# 5. Pagination Contract

| Rule | Contract |
|------|----------|
| Default style | **Cursor** for all product lists |
| Query | `cursor` (opaque string, optional) · `limit` (integer) |
| Default `limit` | 20 |
| Max `limit` | 50 (staff lists may document higher max ≤ 100) |
| Cursor opacity | Clients never construct or parse cursors |
| Offset | Forbidden on player lists; staff-only exception: `offset` + `limit` on bounded moderation queues, documented per endpoint |
| Totals | `meta.total` only when truthful and cheap; otherwise omitted |

---

# 6. Filtering & Sorting Contract

## 6.1 Global query shape

| Param | Kind | Rule |
|-------|------|------|
| `filter[field]` | string \| enum \| OpaqueId | Allowlisted fields only per resource |
| `sort` | string | Comma-separated `field` or `-field` (desc); allowlisted |
| Default sort | Documented per list; must be product-honest (typically `-createdAt` or relevance for search) |

Invalid filter/sort → error category `validation` (§7).

## 6.2 Common filter fields (when allowlisted)

| Field | Used on |
|-------|---------|
| `status` | Library entries · import jobs · events participation |
| `platform` | Library · games search |
| `q` | Search only (see search resource) |
| `visibility` | Posts · profiles where product allows |
| `from` / `to` | Activity · notifications (ISO-8601) |

---

# 7. Error Catalogue

## 7.1 Error envelope

| Field | Kind | Required | Meaning |
|-------|------|----------|---------|
| `error.category` | enum | yes | See §7.2 |
| `error.code` | string | yes | Stable machine code `SCREAMING_SNAKE` |
| `error.message` | string | yes | Human-safe · non-leaky |
| `error.fields` | array of `{ path, code, message }` | when validation | Field paths in `camelCase` |
| `error.requestId` | string | yes | Correlation |
| `error.retryable` | boolean | yes | Client guidance |

## 7.2 Categories → HTTP status class

| Category | HTTP | Meaning |
|----------|------|---------|
| `validation` | 400 | Shape / allowlist / field rules |
| `authn` | 401 | Identity missing or invalid |
| `authz` | 403 | Identity valid · permission denied |
| `not_found` | 404 | Resource absent or privacy-indistinguishable per documented policy |
| `conflict` | 409 | State conflict · duplicate intent |
| `rate` | 429 | Rate limited |
| `unavailable` | 503 | Temporary dependency failure |
| `internal` | 500 | Unexpected · no internal detail leaked |

## 7.3 Canonical error codes (non-exhaustive governed vocabulary)

| Code | Category | Typical use |
|------|----------|-------------|
| `VALIDATION_FAILED` | validation | Generic field failure |
| `UNKNOWN_FIELD` | validation | Rejected unknown body field (global policy: reject) |
| `INVALID_CURSOR` | validation | Bad/expired cursor |
| `UNAUTHENTICATED` | authn | No/invalid session |
| `SESSION_EXPIRED` | authn | Refresh required |
| `FORBIDDEN` | authz | Generic deny |
| `SOFT_GATE_REQUIRED` | authz | Guest hit authenticated-only write |
| `NOT_FOUND` | not_found | Missing resource |
| `CONFLICT_STATE` | conflict | Illegal transition |
| `IDEMPOTENCY_REPLAY` | conflict | Key reused with different body |
| `RATE_LIMITED` | rate | Class exceeded |
| `INTEGRATION_UNAVAILABLE` | unavailable | Guest provider down — absence-normal for optional flows |
| `INTERNAL_ERROR` | internal | Fail closed |

---

# 8. Validation Rules

| Rule | Contract |
|------|----------|
| Shared schemas | `@gmrlog/validators` (Zod) are authoritative shapes; OpenAPI generated from the same source of truth |
| Unknown fields | **Rejected** on write bodies (`UNKNOWN_FIELD`) |
| String lengths | Soft max documented per DTO field; empty strings rejected where null means clear |
| OpaqueId | Non-empty string · charset restricted to URL-safe opaque form |
| Enums | Closed sets in this spec; additive growth only via Amendment |
| Client validation | Courtesy only — platform re-validates |
| Authz after validation | Well-shaped forbidden requests still `authz` |

---

# PART C — TRUST AT THE EDGE

---

# 9. Authentication Requirements

## 9.1 Identity classes

| Class | How established | Notes |
|-------|-----------------|-------|
| `guest` | No session | Soft-gated reads only |
| `player` | Valid session | Standard MVP |
| `staff_moderator` | Staff session | Staff namespace only |
| `staff_admin` | Staff session | Staff namespace only |

## 9.2 Session transport

| Concern | Contract |
|---------|----------|
| Access credential | Bearer access token in `Authorization` header **or** httpOnly session cookie — one policy chosen at OpenAPI generation; both must not fork resource paths |
| Refresh | `POST /api/v1/sessions/refresh` |
| Logout | `DELETE /api/v1/sessions/current` |
| OAuth start/finish | Via `account-links` intents + `integrations/{provider}/callbacks` — Discord/Steam are guests, never identity foundations (F6.7) |

## 9.3 Endpoint auth legend (used in §13)

| Symbol | Meaning |
|--------|---------|
| G | Guest allowed |
| P | Player required |
| S | Staff required (moderator or admin as matrix says) |
| P|G | Guest or player (soft-gate; writes still P) |

---

# 10. Authorization Matrix

Permissions are **resource × action × subject**. Default deny when uncertain (F6.7).

| Resource | Action | Guest | Player (self) | Player (other) | Staff |
|----------|--------|-------|---------------|----------------|-------|
| Public game catalog fields | read | allow | allow | allow | allow |
| Soft-gated game community surfaces | read | allow (limited) | allow | allow | allow |
| Feed | read | deny | allow (own context) | — | allow (ops) |
| Library entry | read | deny | own only | deny | policy |
| Library entry | write | deny | own only | deny | policy |
| Review / post | read | soft-gate | allow if visibility permits | same | allow |
| Review / post | create/update/delete | deny | author only | deny | moderate |
| Profile | read | soft-gate | self full · other per privacy | per privacy | allow |
| Profile | update | deny | self only | deny | limited admin |
| Follow | write | deny | self as actor | — | — |
| Community | read | soft-gate | allow | allow | allow |
| Community membership | write | deny | self | — | moderate |
| Community feed/members/activity | read | soft-gate | members/public per community policy | same | allow |
| Event | read | soft-gate | allow | allow | allow |
| Event participation | write | deny | self | — | moderate |
| Achievement | read | soft-gate | self progress · other per privacy | per privacy | allow |
| Messages | read/write | deny | participant only | — | limited |
| Notifications | read/write | deny | recipient only | — | — |
| Settings / connected accounts | read/write | deny | self only | — | — |
| Import jobs / account links | read/write | deny | owner only | — | — |
| Reports | create | deny | reporter | — | — |
| Reports (staff) | read/resolve | deny | deny | deny | allow |
| Recommendations slot | read | soft-gate | allow | allow | — |
| Staff tools | * | deny | deny | deny | allow |

Access outcomes use the same endpoints — never parallel trees per role (F6.4).

---

# 11. Idempotency & Rate Limit Headers

| Header | When | Contract |
|--------|------|----------|
| `Idempotency-Key` | POST create intents: posts · reviews · comments · import-jobs · account-links · reports · follows · reactions · messages | Replay returns original outcome; different body → `IDEMPOTENCY_REPLAY` |
| `X-Gmrlog-Request-Id` | Optional client-supplied; else edge assigns | Echoed in envelopes |
| Rate limit response headers | On `rate` errors | `Retry-After` (seconds) required |

Rate limit classes (thresholds in ops policy, not here): `auth` · `write` · `read` · `search` · `upload` · `integration`.

---

# PART D — CATALOGS

---

# 12. API Resource Catalog

| Resource family | Owner (F5.1 / F6.3) | Primary screens (F5.3) | Notes |
|-----------------|---------------------|------------------------|-------|
| Session | Gate / auth | Login · Register · OAuth · Splash · Session Loading | |
| Me / Profile self | Profile | Own Profile · Edit Profile · Statistics · Achievements index | |
| Users | Shared User | Other User Profile · Followers/Following | |
| Games | Shared Game | Game Detail · lists · Related | Ownership indicator fields |
| Posts | Shared Post | Post Detail · Game posts · Compose Post | |
| Reviews | Shared Review | Review Detail · Game reviews · Write Review | |
| Comments | Host object (Post/Review) | Comment Thread | |
| Collections | Shared Collection | Collection Detail · index · editor | |
| Tier lists | Shared Tier | Tier Detail · index · editor | |
| Communities | Shared Community | Detail · Feed · Members · Activity · Hub | |
| Events | Shared Event | Event Detail · Events Hub | kinds: game · community · tournament · seasonal |
| Achievements | Shared Achievement | Achievement Detail · Profile Achievements | GMRLOG only — not Steam |
| Feed | Home aggregation | Activity Feed | Projection |
| Discover | Discover | Discover Hub | Projection |
| Search | Discover | Search · Results | Meilisearch projection |
| Recommendations | Assistive slots | Related Games · Similar Collections · Discover slots | Semantic similarity — not chat AI |
| Library | Library | Hub · shelves · wishlist · backlog · hidden · import entry | |
| Notifications | Notifications | Notifications List | |
| Activity | Notifications | Activity Center | |
| Conversations | Messages | Inbox · Conversation | |
| Settings | Settings | Hub · Account · Privacy · Notification prefs · Appearance · Accessibility · About | |
| Connected accounts | Settings | Connected Accounts · Onboarding Connect | Steam · Discord guests |
| Onboarding | Onboarding | Taste · Platforms · Connect · Follow suggestions | |
| Uploads | Task / media | Media picker · avatars · covers | Grant-based |
| Import jobs | Library task | Library Import · Steam Library Import | Optional |
| Account links | Task | Account Link OAuth | Optional |
| Reports / Blocks | Task | Report/Block | |
| Reactions | Shared objects | Post/Review/Comment | |
| Follows | Profile / User | Follow actions | |
| Integrations | Guest adapters | Callbacks only | |
| Staff moderation | Staff | Moderator Home · Report Detail | Isolated |
| Staff admin | Staff | Admin Home · User/Content tools | Isolated |

---

# 13. Endpoint Catalog

Auth column uses §9.3. All paths prefixed by `/api/v1` unless noted.

## 13.1 Gate — Sessions & auth

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| POST | `/sessions` | G | Login (password/email class) | Login |
| POST | `/sessions/register` | G | Register | Register |
| POST | `/sessions/refresh` | G* | Refresh (*refresh credential) | Session Loading |
| DELETE | `/sessions/current` | P | Logout | Settings Account |
| POST | `/sessions/password/forgot` | G | Start reset | Forgot/Reset |
| POST | `/sessions/password/reset` | G | Complete reset | Forgot/Reset |
| GET | `/sessions/soft-gate` | G | Public preview capability map | Soft-Gate Bridge |

## 13.2 Onboarding

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/onboarding` | P | Readiness state | Onboarding steps |
| PATCH | `/onboarding/taste` | P | Save taste | Taste |
| PATCH | `/onboarding/platforms` | P | Save platforms | Platforms |
| POST | `/onboarding/complete` | P | Mark ready for main | — |
| GET | `/onboarding/follow-suggestions` | P | Suggestion list | Follow Suggestions |

## 13.3 Me — profile self

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/me` | P | Self profile | Own Profile |
| PATCH | `/me` | P | Edit profile | Edit Profile |
| GET | `/me/statistics` | P | Self stats | Statistics |
| GET | `/me/achievements` | P | Achievement index | Achievements |
| GET | `/me/followers` | P | Followers | Followers/Following |
| GET | `/me/following` | P | Following | Followers/Following |

## 13.4 Users

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/users/{id}` | P\|G | Other profile | Other User Profile |
| GET | `/users/{id}/statistics` | P\|G | Stats per privacy | Statistics |
| GET | `/users/{id}/achievements` | P\|G | Index per privacy | Achievements |
| GET | `/users/{id}/followers` | P\|G | List | Followers/Following |
| GET | `/users/{id}/following` | P\|G | List | Followers/Following |
| POST | `/follows` | P | Follow user | — |
| DELETE | `/follows/{userId}` | P | Unfollow | — |

## 13.5 Feed · Discover · Search · Recommendations

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/feed` | P | Home activity feed | Activity Feed |
| GET | `/discover` | P\|G | Discover hub modules | Discover Hub |
| GET | `/discover/games` | P\|G | Discover games catalog | Discover Games |
| GET | `/discover/communities` | P\|G | Communities hub | Communities Hub |
| GET | `/discover/events` | P\|G | Events hub | Events Hub |
| GET | `/search` | P\|G | Search (`q` required) | Search / Results |
| GET | `/recommendations/games` | P\|G | Semantic similarity games | Related / Discover |
| GET | `/recommendations/collections` | P\|G | Semantic similarity collections | Similar Collections |

## 13.6 Games

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/games/{id}` | P\|G | Game detail | Game Detail |
| GET | `/games/{id}/reviews` | P\|G | Reviews list | Game Reviews |
| GET | `/games/{id}/posts` | P\|G | Posts list | Game Posts |
| GET | `/games/{id}/media` | P\|G | Media gallery | Game Media |
| GET | `/games/{id}/recommendations` | P\|G | Related games slot | Related/Recommendations |

## 13.7 Posts · Reviews · Comments · Reactions

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/posts/{id}` | P\|G | Post detail | Post Detail |
| POST | `/posts` | P | Create post | Compose Post |
| PATCH | `/posts/{id}` | P | Edit own | Compose Post |
| DELETE | `/posts/{id}` | P | Delete own | Delete Confirmation |
| GET | `/reviews/{id}` | P\|G | Review detail | Review Detail |
| POST | `/reviews` | P | Create review | Write/Edit Review |
| PATCH | `/reviews/{id}` | P | Edit own | Write/Edit Review |
| DELETE | `/reviews/{id}` | P | Delete own | Delete Confirmation |
| GET | `/posts/{id}/comments` | P\|G | Comment thread | Comment Thread |
| GET | `/reviews/{id}/comments` | P\|G | Comment thread | Comment Thread |
| POST | `/comments` | P | Create comment | Comment Thread |
| DELETE | `/comments/{id}` | P | Delete own | Delete Confirmation |
| POST | `/reactions` | P | Add reaction | — |
| DELETE | `/reactions/{id}` | P | Remove reaction | — |

## 13.8 Collections · Tier lists

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/collections` | P | Own index (query `ownerId` for other when allowed) | Collections Index |
| GET | `/collections/{id}` | P\|G | Detail | Collection Detail |
| POST | `/collections` | P | Create | Create/Edit Collection |
| PATCH | `/collections/{id}` | P | Edit | Create/Edit Collection |
| DELETE | `/collections/{id}` | P | Delete | Delete Confirmation |
| PUT | `/collections/{id}/entries` | P | Replace/reorder entries | Editor |
| GET | `/tier-lists` | P | Own index | Tier Lists Index |
| GET | `/tier-lists/{id}` | P\|G | Detail | Tier List Detail |
| POST | `/tier-lists` | P | Create | Tier List Editor |
| PATCH | `/tier-lists/{id}` | P | Edit | Tier List Editor |
| DELETE | `/tier-lists/{id}` | P | Delete | Delete Confirmation |
| PUT | `/tier-lists/{id}/slots` | P | Replace slots | Editor |

## 13.9 Library

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/library` | P | Library hub summary | Library Hub |
| GET | `/library/entries` | P | Shelf/status lists (`filter[status]`) | Shelf / Wishlist / Backlog / Hidden |
| GET | `/library/entries/{gameId}` | P | Single relationship | Game + Library |
| PUT | `/library/entries/{gameId}` | P | Upsert status/log | Log Game |
| DELETE | `/library/entries/{gameId}` | P | Remove relationship | — |
| POST | `/import-jobs` | P | Start Steam library import | Library Import / Steam Import |
| GET | `/import-jobs/{id}` | P | Job status | Steam Import task |
| POST | `/import-jobs/{id}/cancel` | P | Cancel | Task cancellable |
| POST | `/import-jobs/{id}/resolve` | P | Resolve conflicts | Import review |

## 13.10 Communities · Events · Achievements

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/communities` | P\|G | List discoverable communities | Communities Hub |
| POST | `/communities` | P | Create community | — |
| GET | `/communities/{id}` | P\|G | Community detail | Community Home |
| PATCH | `/communities/{id}` | P (owner) | Update community | — |
| DELETE | `/communities/{id}` | P (owner) | Soft-delete community | — |
| GET | `/communities/{id}/feed` | P\|G | Community feed | Community Feed |
| GET | `/communities/{id}/members` | P\|G | Members | Community Members |
| GET | `/communities/{id}/activity` | P\|G | Activity | Community Activity |
| POST | `/communities/{id}/membership` | P | Join | — |
| DELETE | `/communities/{id}/membership` | P | Leave | — |
| GET | `/events/{id}` | P\|G | Event detail | Event Detail |
| POST | `/events/{id}/participation` | P | Participate | Event Detail |
| DELETE | `/events/{id}/participation` | P | Leave participation | Event Detail |
| GET | `/achievements/{id}` | P\|G | Achievement detail | Achievement Detail |

## 13.11 Notifications · Activity · Messages

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/notifications` | P | List | Notifications List |
| POST | `/notifications/read` | P | Mark read (body ids or `all`) | — |
| GET | `/activity` | P | Activity center | Activity Center |
| GET | `/conversations` | P | Inbox | Messages Inbox |
| GET | `/conversations/{id}` | P | Conversation | Conversation |
| POST | `/conversations` | P | Start conversation | — |
| POST | `/conversations/{id}/messages` | P | Send message | Conversation |
| GET | `/conversations/{id}/messages` | P | Message list | Conversation |

## 13.12 Settings · Connected accounts · Links

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/settings` | P | Settings hub aggregate | Settings Hub |
| PATCH | `/settings/account` | P | Account | Account |
| PATCH | `/settings/privacy` | P | Privacy | Privacy |
| PATCH | `/settings/notifications` | P | Notification prefs | Notification Preferences |
| PATCH | `/settings/appearance` | P | Appearance | Appearance |
| PATCH | `/settings/accessibility` | P | Accessibility | Accessibility |
| GET | `/settings/legal` | P\|G | About/legal content refs | About/Legal |
| GET | `/connected-accounts` | P | List links | Connected Accounts |
| DELETE | `/connected-accounts/{provider}` | P | Disconnect guest | Connected Accounts |
| POST | `/account-links` | P | Start OAuth link intent | Account Link / Onboarding Connect |
| GET | `/account-links/{id}` | P | Intent status | Account Link |
| POST | `/account-links/{id}/cancel` | P | Cancel | Non-trapping |

## 13.13 Reports · Blocks · Share metadata

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| POST | `/reports` | P | Create report | Report/Block |
| POST | `/blocks` | P | Block user | Report/Block |
| DELETE | `/blocks/{userId}` | P | Unblock | — |
| POST | `/share-intents` | P | Create share payload metadata | Share |

## 13.14 Uploads

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| POST | `/uploads/grants` | P | Request upload grant | Image/Media Picker |
| POST | `/uploads/confirmations` | P | Confirm completed upload | — |

## 13.15 Integration callbacks (adapter-owned)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/integrations/steam/callbacks` | Provider signature | Steam OAuth/import callback |
| POST | `/integrations/discord/callbacks` | Provider signature | Discord OAuth callback |

Players never call these as normal SDK resources; SDK may expose link **start** only via `account-links` / `import-jobs`.

## 13.16 Staff API (`/api/v1/staff`)

| Method | Path | Auth | Purpose | F5.3 |
|--------|------|------|---------|------|
| GET | `/staff/moderation/queue` | S mod+ | Moderator queue | Moderator Home |
| GET | `/staff/moderation/reports/{id}` | S mod+ | Report detail | Report Detail Staff |
| POST | `/staff/moderation/reports/{id}/resolution` | S mod+ | Resolve | Report Detail Staff |
| GET | `/staff/admin/overview` | S admin | Admin home | Admin Home |
| GET | `/staff/admin/users/{id}` | S admin | User tools | Admin User/Content |
| POST | `/staff/admin/users/{id}/actions` | S admin | Governed admin actions | Admin tools |
| GET | `/staff/admin/content/{type}/{id}` | S admin | Content tools | Admin tools |

---

# PART E — DTO CATALOGS

Field kinds: `OpaqueId` · `string` · `integer` · `number` · `boolean` · `datetime` · `enum` · `object` · `array`.

---

# 14. Request DTO Catalog

## 14.1 SessionCreateRequest

| Field | Kind | Required | Rules |
|-------|------|----------|-------|
| `email` | string | yes | Valid email · max 320 |
| `password` | string | yes | Min length per security policy · never logged |

## 14.2 SessionRegisterRequest

| Field | Kind | Required | Rules |
|-------|------|----------|-------|
| `email` | string | yes | |
| `password` | string | yes | |
| `displayName` | string | yes | 1–40 · trimmed |
| `handle` | string | yes | Unique · allowlisted charset |

## 14.3 OnboardingTastePatchRequest

| Field | Kind | Required |
|-------|------|----------|
| `genreIds` | array\<OpaqueId\> | yes |
| `franchiseIds` | array\<OpaqueId\> | no |

## 14.4 OnboardingPlatformsPatchRequest

| Field | Kind | Required |
|-------|------|----------|
| `platformIds` | array\<OpaqueId\> | yes |

## 14.5 MePatchRequest

| Field | Kind | Required | Rules |
|-------|------|----------|-------|
| `displayName` | string | no | |
| `bio` | string | no | Max 500 · null clears |
| `avatarUploadId` | OpaqueId | no | Confirmed upload |
| `bannerUploadId` | OpaqueId | no | |

## 14.6 PostCreateRequest

| Field | Kind | Required | Rules |
|-------|------|----------|-------|
| `body` | string | yes | Max per product |
| `gameId` | OpaqueId | no | |
| `communityId` | OpaqueId | no | |
| `mediaUploadIds` | array\<OpaqueId\> | no | |
| `visibility` | enum | no | `public` \| `followers` \| `private` |

## 14.7 ReviewCreateRequest

| Field | Kind | Required | Rules |
|-------|------|----------|-------|
| `gameId` | OpaqueId | yes | |
| `rating` | number | yes | Closed scale per product (document numeric bounds in OpenAPI) |
| `body` | string | no | |
| `containsSpoilers` | boolean | no | Default false |

## 14.8 CommentCreateRequest

| Field | Kind | Required |
|-------|------|----------|
| `hostType` | enum | yes — `post` \| `review` |
| `hostId` | OpaqueId | yes |
| `body` | string | yes |
| `parentCommentId` | OpaqueId | no |

## 14.9 LibraryEntryUpsertRequest

| Field | Kind | Required | Rules |
|-------|------|----------|-------|
| `status` | enum | yes | `owned` \| `playing` \| `completed` \| `wishlist` \| `backlog` \| `hidden` (+ product-closed set) |
| `platformId` | OpaqueId | no | |
| `note` | string | no | |
| `source` | enum | no | `manual` \| `steam_import` — server may override |

## 14.10 CollectionCreateRequest / CollectionPatchRequest

| Field | Kind | Required |
|-------|------|----------|
| `title` | string | create: yes · patch: no |
| `description` | string | no |
| `visibility` | enum | no |

## 14.11 CollectionEntriesPutRequest

| Field | Kind | Required |
|-------|------|----------|
| `entries` | array\<{ gameId, note? }\> | yes | Order = array order |

## 14.12 TierListCreateRequest / slots Put

| Field | Kind | Required |
|-------|------|----------|
| `title` | string | create yes |
| `slots` | array\<{ label, gameIds: OpaqueId[] }\> | put yes |

## 14.13 ImportJobCreateRequest

| Field | Kind | Required | Rules |
|-------|------|----------|-------|
| `provider` | enum | yes | `steam` only in MVP |
| `accountLinkId` | OpaqueId | no | Must be connected Steam |

## 14.14 ImportJobResolveRequest

| Field | Kind | Required |
|-------|------|----------|
| `resolutions` | array\<{ gameId, action: keep_manual \| accept_import \| skip }\> | yes |

## 14.15 AccountLinkCreateRequest

| Field | Kind | Required | Rules |
|-------|------|----------|-------|
| `provider` | enum | yes | `steam` \| `discord` |
| `purpose` | enum | yes | `login` \| `connect` \| `import` |
| `returnContext` | string | no | Opaque client continuation token — not a URL open redirect |

## 14.16 Membership / Participation

Empty body objects allowed; presence of POST/DELETE is the contract.

## 14.17 ReportCreateRequest

| Field | Kind | Required |
|-------|------|----------|
| `targetType` | enum | yes — `user` \| `post` \| `review` \| `comment` \| `community` \| `event` \| `message` |
| `targetId` | OpaqueId | yes |
| `reason` | enum | yes — closed moderation set |
| `details` | string | no |

## 14.18 BlockCreateRequest

| Field | Kind | Required |
|-------|------|----------|
| `userId` | OpaqueId | yes |

## 14.19 ReactionCreateRequest

| Field | Kind | Required |
|-------|------|----------|
| `targetType` | enum | yes — `post` \| `review` \| `comment` |
| `targetId` | OpaqueId | yes |
| `kind` | enum | yes — closed reaction set |

## 14.20 FollowCreateRequest

| Field | Kind | Required |
|-------|------|----------|
| `userId` | OpaqueId | yes |

## 14.21 ConversationCreateRequest / MessageCreateRequest

| Field | Kind | Required |
|-------|------|----------|
| `participantUserIds` | array\<OpaqueId\> | conversation create yes |
| `body` | string | message create yes |
| `mediaUploadIds` | array\<OpaqueId\> | no |

## 14.22 NotificationsReadRequest

| Field | Kind | Required |
|-------|------|----------|
| `ids` | array\<OpaqueId\> | no if `all` |
| `all` | boolean | no |

## 14.23 Settings patch requests

Each settings patch accepts only its allowlisted fields (booleans · enums · locale string). No nested secrets.

## 14.24 UploadGrantRequest

| Field | Kind | Required | Rules |
|-------|------|----------|-------|
| `purpose` | enum | yes | `avatar` \| `banner` \| `post_media` \| `message_media` \| `community_banner` |
| `contentType` | string | yes | Allowlisted MIME |
| `byteSize` | integer | yes | Max per purpose |

## 14.25 UploadConfirmRequest

| Field | Kind | Required |
|-------|------|----------|
| `grantId` | OpaqueId | yes |
| `storageKey` | string | yes — server-issued key echoed |

## 14.26 ShareIntentCreateRequest

| Field | Kind | Required |
|-------|------|----------|
| `targetType` | enum | yes |
| `targetId` | OpaqueId | yes |

## 14.27 Staff resolution / admin action

| Field | Kind | Required |
|-------|------|----------|
| `resolution` | enum | yes — closed staff set |
| `notes` | string | no |
| `action` | enum | admin actions — closed set |

## 14.28 CommunityCreateRequest / CommunityPatchRequest (S1.1)

**CommunityCreateRequest**

| Field | Kind | Required |
|-------|------|----------|
| `name` | string | yes |
| `slug` | string | yes — unique lowercase slug |
| `description` | string \| null | no |
| `visibility` | enum | yes — `public` \| `followers` \| `private` (S2 `ContentVisibility`) |

**CommunityPatchRequest**

| Field | Kind | Required |
|-------|------|----------|
| `name` | string | no |
| `description` | string \| null | no |
| `visibility` | enum | no — `public` \| `followers` \| `private` |

`PATCH` / `DELETE` `/communities/{id}` require community **owner** membership role.

---

# 15. Response DTO Catalog

## 15.1 SessionResponse (`data`)

| Field | Kind | Notes |
|-------|------|-------|
| `user` | UserSelfResponse | |
| `expiresAt` | datetime | Access expiry if applicable |

## 15.2 UserSelfResponse / UserPublicResponse

| Field | Kind | Self | Public |
|-------|------|------|--------|
| `id` | OpaqueId | yes | yes |
| `handle` | string | yes | yes |
| `displayName` | string | yes | yes |
| `bio` | string \| null | yes | per privacy |
| `avatarUrl` | string \| null | yes | yes |
| `bannerUrl` | string \| null | yes | per privacy |
| `createdAt` | datetime | yes | optional |
| `privacy` | object | yes | no |
| `connectedProviders` | array\<enum\> | yes — providers only, no tokens | no |

## 15.3 GameResponse

| Field | Kind | Notes |
|-------|------|-------|
| `id` | OpaqueId | |
| `title` | string | |
| `slug` | string | optional display aid — not ownership |
| `coverUrl` | string \| null | |
| `platforms` | array | |
| `library` | object \| null | Present for player: `{ status, source, ownershipIndicator }` |
| `stats` | object \| null | Public aggregates only |

`ownershipIndicator` values: `none` \| `manual` \| `imported` \| `manual_and_imported` — Steam never replaces GMRLOG authorship.

## 15.3.1 GameCardResponse (S1.2)

Discover games list projection — MVP card fields only. No recommendations · AI ranking · personalization.

| Field | Kind | Notes |
|-------|------|-------|
| `id` | OpaqueId | |
| `slug` | string | |
| `title` | string | |
| `coverImageUrl` | string \| null | |
| `releaseDate` | datetime \| null | |
| `genres` | array | `{ id, name, slug }` summaries |
| `platforms` | array | `{ id, name, slug }` summaries |
| `ratingSummary` | object | `{ average: number \| null, count: number }` — review aggregate only |
| `libraryCount` | integer | Library entry count — not a popularity score |

### GET `/discover/games` query

| Param | Kind | Rule |
|-------|------|------|
| `cursor` | string | Opaque cursor (§5) |
| `limit` | integer | Default 20 · max 50 |
| `sort` | enum | Optional: `popular` · `recent` · `featured` |
| `genreId` | OpaqueId | Optional filter |
| `platformId` | OpaqueId | Optional filter |
| `franchiseId` | OpaqueId | Optional filter |

Default ordering (when `sort` omitted): `featured` DESC · `popularity` DESC · `releaseDate` DESC · `id` ASC. No relevance or personalization.

## 15.4 PostResponse / ReviewResponse / CommentResponse

Shared content fields: `id` · `author` (UserPublic) · `body` · `createdAt` · `updatedAt` · `visibility` · `reactionSummary` · `viewerState` · `game` summary optional · `community` summary optional.

Review adds: `rating` · `containsSpoilers` · `gameId`.

## 15.5 FeedItemResponse

| Field | Kind | Notes |
|-------|------|-------|
| `id` | OpaqueId | Feed row id |
| `kind` | enum | Closed F5.2 activity kinds including community · event · achievement · library_import · recommendation_slot |
| `occurredAt` | datetime | |
| `actor` | UserPublic \| null | |
| `object` | polymorphic summary | Resolves to Shared Destination ids |
| `projection` | object \| null | Slot payload for recommendations — assistive only |

## 15.6 CommunityResponse / EventResponse / AchievementResponse

Community: `id` · `name` · `description` · `avatarUrl` · `bannerUrl` · `viewerMembership` · `counts`.

Event: `id` · `title` · `kind` (`game`\|`community`\|`tournament`\|`seasonal`) · `startsAt` · `endsAt` · `viewerParticipation` · related `gameId`/`communityId` optional — **no FOMO countdown fields**.

Achievement: `id` · `title` · `description` · `progress` `{ current, target, state }` · **never Steam achievement payloads**.

## 15.7 LibraryEntryResponse

| Field | Kind |
|-------|------|
| `gameId` | OpaqueId |
| `game` | Game summary |
| `status` | enum |
| `source` | enum |
| `updatedAt` | datetime |

## 15.8 CollectionResponse / TierListResponse

Include `id` · `title` · `owner` · `visibility` · `entries`/`slots` · `updatedAt`.

## 15.9 NotificationResponse / ActivityItemResponse

`id` · `kind` · `createdAt` · `readAt` · `actor` · `objectRef` `{ type, id }` · `messageKey` (localization key — not raw manipulated copy).

## 15.10 ConversationResponse / MessageResponse

Conversation: `id` · `participants` · `lastMessage` · `updatedAt` · `unreadCount`.

Message: `id` · `senderId` · `body` · `createdAt` · `media`.

## 15.11 ConnectedAccountResponse

| Field | Kind | Notes |
|-------|------|-------|
| `provider` | enum | `steam` \| `discord` |
| `status` | enum | `connected` \| `disconnected` \| `expired` |
| `linkedAt` | datetime \| null | |
| `scopes` | array\<string\> | Honest granted scopes — no secrets |

## 15.12 ImportJobResponse / AccountLinkResponse

`id` · `provider` · `status` (`pending`\|`awaiting_provider`\|`processing`\|`needs_resolution`\|`completed`\|`cancelled`\|`failed`) · `createdAt` · `updatedAt` · `errorCode` optional — pending distinguishable from confirmed.

## 15.13 UploadGrantResponse

| Field | Kind | Notes |
|-------|------|-------|
| `grantId` | OpaqueId | |
| `uploadUrl` | string | Short-lived · no long-term cloud secrets in client config |
| `storageKey` | string | |
| `expiresAt` | datetime | |
| `headers` | object | Required upload headers if any |

## 15.14 RecommendationItemResponse

`game` or `collection` summary · `score` optional opaque · `reasonKey` localization key — **no generative text assistant fields**.

## 15.15 SearchResponse

`data` discriminated hits: `{ type, id, summary }` for games · users · reviews · posts · collections · tier-lists · communities · events.

## 15.16 SettingsResponse

Nested objects matching settings sections; no credential fields.

## 15.17 SoftGateCapabilityResponse

Booleans/flags describing which write classes require auth — honest soft-gate map.

## 15.18 Staff ReportResponse / QueueItemResponse

Staff-only fields: `report` · `target snapshot` · `reporterId` · `status` · `assignedTo` — never leaked on player API.

---

# PART F — UPLOADS · REALTIME · STAFF

---

# 16. Upload Endpoints (normative summary)

Flow (F6.4 §16):

1. `POST /uploads/grants` → UploadGrantResponse  
2. Client uploads bytes to grant URL  
3. `POST /uploads/confirmations` → media id usable in create DTOs  

Failed confirm → media not authoritative. Processing variants are async (F6.6) — clients may see `processing` on media summaries.

---

# 17. Websocket Endpoint References

Realtime is a **delivery channel** (F6.4 §22 · F6.6) — not a second API dialect.

| Reference | Contract |
|-----------|----------|
| Connection URL | Same API host family · path `/realtime` (Socket.IO) — exact mount fixed in OpenAPI/realtime adjunct |
| Auth | Same identity classes as HTTP; ticket or cookie/session binding required before private rooms |
| Player rooms (examples of meaning, not event catalog) | User notification channel · conversation channel · optional feed hint channel |
| Forbidden | Authoritative writes over websocket · engagement ping channels · parallel resource CRUD |
| Correctness | Product must work with websocket disconnected |
| Event names & payloads | Governed in `@gmrlog/websocket` + OpenAPI realtime adjunct; must reuse §15 summary shapes |

This document does not enumerate Socket.IO event names (F6.6 ban on catalogs in architecture spirit — adjunct OpenAPI may list them after S1 LOCK without inventing product meaning).

---

# 18. Staff Surface Rules

| Rule |
|------|
| Only under `/api/v1/staff` |
| Never generated into the default player mobile SDK entry — separate staff SDK surface or explicit staff tag |
| Same envelopes · errors · pagination dialect |
| Offset pagination allowed on queues only |

---

# PART G — GENERATION & EVOLUTION

---

# 19. OpenAPI Generation Rules

| Rule | Contract |
|------|----------|
| Single OpenAPI 3.x document for `/api/v1` player + staff tagged | |
| Source of truth | This S1 catalog + shared Zod/`@gmrlog/validators` — OpenAPI is generated/projected, not hand-forked forever |
| OperationId | `method` + resource path in stable camelCase (`getGameById`) |
| Tags | Match §12 resource families |
| Security schemes | Documented once globally |
| Examples | Optional; must not invent fields absent from DTO catalogs |
| Output path | `docs/08_API/` bundle under Phase S governance — must not contradict this LOCKED/DRAFT S1 |
| Breaking changes | Forbidden without versioning workflow §21 |

---

# 20. SDK Generation Rules

| Rule | Contract |
|------|----------|
| Package | `@gmrlog/api` |
| Consumers | Mobile · Web · Admin (staff subset) |
| Transport | Only generated client — no hand-rolled duplicates |
| Types | Align with `@gmrlog/types` |
| Errors | Map to §7 categories |
| Pagination helpers | Cursor-aware |
| Idempotency | Auto-send `Idempotency-Key` on listed POSTs when caller provides key |
| Regeneration | Required on every contract Amendment before app release (F6.4 §23) |

---

# 21. Versioning Workflow

| Step | Rule |
|------|------|
| Current | `/api/v1` only for MVP |
| Additive | New optional fields · new endpoints · new enum values — Amendment to S1 + OpenAPI regen |
| Breaking | New major `/api/v2` — exceptional · architectural review · not used for Version 2 product features smuggled early |
| Compatibility | Clients must ignore unknown fields; enums treated as open for reads |

---

# 22. Deprecation Workflow

| Step | Rule |
|------|------|
| 1 Announce | `deprecated: true` in OpenAPI · `Sunset` / docs note · Revision History on S1 Amendment |
| 2 Grace | First-party apps migrate; endpoint keeps truthful behaviour |
| 3 Remove | Only after verified zero first-party use · Amendment removes from catalog |
| Never | Silent removal · repurposing fields in place · narrowing enums silently |

---

# PART H — CLOSE

---

# 23. Anti-Patterns

| Banned |
|--------|
| Endpoints for F5.3 Future / Version 2 scopes |
| NestJS/TypeScript/controller examples in this contract |
| Parallel `/home/games` vs `/games` ownership forks |
| Chat/assistant/generative recommendation endpoints |
| Steam achievements as GMRLOG achievement resources |
| Discord social graph as core resources |
| Websocket authoritative writes |
| Public third-party API under MVP |
| JSON sample payloads that invent fields beyond catalogs |
| Treating existing `docs/08_API` YAML as superior to F5/F6/S1 when they conflict |

---

# 24. Audit Checklist

- [ ] Resource catalog mirrors F5.1 / F5.3 non-Future screens  
- [ ] Endpoint catalog complete for MVP including Communities · Events · Steam import · Connected accounts · Semantic recommendations · Achievements  
- [ ] No Version 2 / Future screen endpoints  
- [ ] DTO catalogs cover listed requests/responses without code  
- [ ] Pagination cursor-first · filter/sort allowlist rules · error catalogue · validation rules present  
- [ ] Authn classes · authz matrix · idempotency/rate headers present  
- [ ] Upload grant flow · websocket references · staff isolation present  
- [ ] OpenAPI · SDK · versioning · deprecation workflows present  
- [ ] Naming conventions fixed  
- [ ] Obeys F6.4 · Phase S · F5.5 §20.1  
- [ ] Gate: stop — do not continue to S2 in this deliverable  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Phase S1 — API Specification** delivered as **DRAFT**.

This document is the working implementation contract for the Version 1 API under F1–F6 and the Phase S charter.

Stop.

Do **NOT** continue to Sprint S2 until S1 is explicitly advanced / **LOCKED** by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md`](./PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md) | Phase S charter · completion gate |
| [`F6_4_API_ARCHITECTURE.md`](../06_ENGINEERING/F6_4_API_ARCHITECTURE.md) | API dialect constitution |
| [`F6_7_SECURITY_ARCHITECTURE.md`](../06_ENGINEERING/F6_7_SECURITY_ARCHITECTURE.md) | Authn/authz laws |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | Ownership |
| [`F5_3_SCREEN_SPECIFICATIONS.md`](../05_PRODUCT_ARCHITECTURE/F5_3_SCREEN_SPECIFICATIONS.md) | Screen precondition |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | MVP scope boundary |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | REST · OpenAPI · Socket.IO |

---

## S1.1 Amendment — Community Management API

**Status:** Accepted · **Version:** S1.1

This amendment extends the Community API without changing Product Architecture (F5) or Engineering Architecture (F6). It exposes CRUD operations already defined by the product architecture.

### New endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/communities` | P\|G |
| POST | `/communities` | P |
| PATCH | `/communities/{id}` | P (owner only) |
| DELETE | `/communities/{id}` | P (owner only) |

### Membership (unchanged)

| Method | Path |
|--------|------|
| GET | `/communities/{id}/members` | P\|G |
| POST | `/communities/{id}/membership` | P |
| DELETE | `/communities/{id}/membership` | P |

### Authorization

- `POST /communities` — authenticated player only; creator becomes `owner`.
- `PATCH /communities/{id}` · `DELETE /communities/{id}` — owner only.

### Request DTOs

See §14.28. `CommunityResponse` (§15.6) is unchanged.

### Notes

Does not introduce feeds · moderation · invitations · realtime · events · or new entities. `visibility` is stored per S2 `ContentVisibility` (S2 amendment: `Community.visibility`).

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.2 | July 2026 | **Amendment accepted** — Discover Games (`GET /discover/games`); §15.3.1 `GameCardResponse`; catalog filters · sort · cursor pagination |
| 1.1 | July 2026 | **Amendment accepted** — Community Management CRUD (`GET/POST /communities`, `PATCH/DELETE /communities/{id}`); §14.28 create/patch DTOs; owner authz |
| 1.0 | July 2026 | DRAFT — S1 API implementation contract: resources · endpoints · DTOs · pagination/filter/sort · errors · validation · authn/authz · uploads · websocket refs · OpenAPI/SDK · versioning/deprecation; MVP-only; no code; gate before S2 |
