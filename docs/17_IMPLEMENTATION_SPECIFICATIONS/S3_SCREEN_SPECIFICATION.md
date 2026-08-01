# GMRLOG — Phase S3: Screen Specification

**Document:** `docs/17_IMPLEMENTATION_SPECIFICATIONS/S3_SCREEN_SPECIFICATION.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** S3 (Screen Specification — implementation contract)  
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
| 7 | Entire F5 (**LOCKED**) — especially F5.1 · F5.2 · F5.3 · F5.4 · F5.5 |
| 8 | Entire F6 (**LOCKED**) — especially F6.2 · F6.4 · F6.6 · F6.7 |
| 9 | [`PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md`](./PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md) |
| 10 | [`S1_API_SPECIFICATION.md`](./S1_API_SPECIFICATION.md) · [`S2_DATABASE_SPECIFICATION.md`](./S2_DATABASE_SPECIFICATION.md) |
| 11 | **This document** — screen implementation contract for Version 1 MVP |

Never contradict higher documents.

This document is **not** UI/UX redesign.

This document **is** the implementation contract for every MVP screen: what each screen loads, mutates, states, navigates, and composes — projecting F5.3 without inventing rooms.

| Does | Does not |
|------|----------|
| Specify purpose · route · owner · API · queries · mutations · states · permissions · navigation · realtime · offline · analytics · a11y · component composition for every MVP screen | Visual redesign · Figma · IA changes · new screens · Version 2 screens · spacing/color/type values · algorithms |

**Gate:** Stop after this specification. Do **not** continue to Sprint S4 in this deliverable.

---

## Scope

**In scope:** Every F5.3 screen that is **not** marked Future / Version 2, including MVP amendment surfaces and staff stacks.

**Explicitly out of scope (do not specify as implementable V1 destinations):**

| Excluded (F5.3 Future / V2) |
|-----------------------------|
| Creator Tools Hub · Premium Manage · Developer Hub · Title Insights |
| Guides List · Bookmarks destination · Article Reader / Editor |
| Marketplace · Public API · Twitch · advanced AI surfaces |

Discussion Detail remains catalogued as **Beta+** (F5.3) — specified here as phase-gated, not Version 2.

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–3 | Mission · Relationship · Field template |
| B | 4–6 | Common state · offline · realtime contracts |
| C | 7–8 | Analytics · accessibility · composition vocabulary |
| D | 9 | Screen index |
| E | 10–19 | Per-group screen contracts |
| F | 20–21 | Anti-patterns · Audit checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Create the implementation specification for every MVP screen so frontend developers assemble F5.3 rooms from S1 contracts and Design System objects without re-deciding ownership, IA, or behaviour.

| Prefer | Never |
|--------|-------|
| Project F5.3 · F5.4 · F5.1 · S1 | Redesign UI/UX · invent screens |
| Honest loading · empty · pending · error | Loading theater · engagement empty bait |
| Singular Shared Destinations | Duplicate Game/Community per tab |
| Tasks return to origin | Tasks as destinations |

---

# 2. Relationship to Prior Law

| Prior law | S3 obligation |
|-----------|---------------|
| F5.3 | Screen catalog · purpose · owner · parent/children — frozen |
| F5.1 §32 | Logical route families — projected to Expo Router paths (F6.2 §5.3) |
| F5.4 | Loading · empty · error · pending · Back · task mechanics — binding |
| F5.2 | Home feed object classes — Activity Feed only hosts, never owns |
| F5.5 | Design System consumption · MVP scope |
| F6.2 | Route tree · server state (TanStack Query) · offline-first · a11y |
| S1 | Queries/mutations = listed endpoints only |
| S2 | Entities behind those endpoints |

---

# 3. Field Template (every screen)

Every screen below specifies:

| Field | Meaning |
|-------|---------|
| Purpose | Product purpose (from F5.3 — not rewritten) |
| Route | Logical family (F5.1 §32) · Expo projection (F6.2) |
| Owner | Primary Owner (F5.1 / F5.3) |
| API dependencies | S1 resource families required |
| Queries | Read endpoints (TanStack Query keys implied by path) |
| Mutations | Write endpoints |
| Loading state | F5.4 initial/partial/skeleton contract |
| Empty state | Honest absence · primary recovery action |
| Pending state | In-flight mutation · non-trapping |
| Error state | Recoverable / blocking · retry |
| Permission requirements | Guest · Player · Staff · membership/privacy |
| Navigation | Entry · exit · targets (F5.3) |
| Realtime dependencies | Optional Socket.IO rooms/events (F6.6) — never required for correctness |
| Offline behaviour | Readable cache · blocked writes · honest staleness (F6.2) |
| Analytics events | Orientation events only — no engagement bait |
| Accessibility requirements | Roles · focus · announcements (F4 · F6.2 §16) |
| Component composition | F5.4 families + DS objects — no visual invention |

---

# PART B — COMMON CONTRACTS

---

# 4. Common State Contracts

Apply unless a screen overrides.

| State | Default contract (F5.4) |
|-------|-------------------------|
| Loading | Structure-preserving skeleton · preserve place identity · no fake completion |
| Empty | Calm absence · one primary CTA when action exists · never FOMO copy |
| Pending | Disable double-submit · keep draft · progress honest for long tasks (import · OAuth) |
| Error | Stay put · recoverable retry · optional leave · no stack traces · no guilt |
| Soft-deleted / privacy | Tombstone or indistinguishability per S1/F6.7 — never leak |

Optional slots (recommendations · connected-account banners) **degrade to absence** — never break the screen (F6.2 §5.5).

---

# 5. Offline Behaviour (global)

| Rule (F6.2) |
|-------------|
| Cached reads remain readable with honest staleness |
| Mutations queue only when product law allows draft persistence; otherwise block with offline error |
| Navigation structure unchanged offline — no offline-only IA |
| Auth/session refresh failures route to gate honestly |
| Import / OAuth / realtime require network — show pending or offline error |

---

# 6. Realtime Dependencies (global)

| Rule (F6.6) |
|-------------|
| Realtime is optional for correctness — REST remains source of truth |
| Screens may subscribe for live updates; poll/refetch remains valid fallback |
| Presence and typing are ephemeral — never durable product truth |
| Staff stacks may use separate staff channels — never leak into player rooms |

---

# PART C — ANALYTICS · A11Y · COMPOSITION

---

# 7. Analytics Events (global vocabulary)

Orientation only. No streak/FOMO/engagement-score events.

| Event class | When |
|-------------|------|
| `screen_view` | Screen mounts with `{ screenId, owner }` |
| `navigation` | Intentional destination change `{ from, to }` |
| `query_error` | Blocking load failure `{ screenId, code }` |
| `mutation_success` / `mutation_error` | User-initiated writes |
| `task_open` / `task_dismiss` / `task_complete` | Task layer lifecycle |
| `gate_soft` | Soft-gate shown |
| `import_progress` | Import job status transitions (coarse) |
| `account_link_progress` | OAuth link status transitions (coarse) |
| `offline_block` | Write blocked by offline |

Recommendation slot impressions are **not** engagement bait — if logged, log absence-capable `slot_shown` / `slot_absent` only.

---

# 8. Accessibility · Composition Vocabulary

## 8.1 Accessibility defaults

| Requirement |
|-------------|
| One main landmark per destination · headings announce screen purpose |
| Focus moves to title/primary heading on push; restored on Back |
| Loading/empty/error/pending announced (live regions) — not paint-only |
| Interactive controls have accessible names matching visible labels |
| Lists expose item count when known · infinite lists announce load-more |
| Reduced motion respected (F4.9) — no essential info in motion alone |
| Color alone never conveys status (F4.2) |
| Tasks trap focus while open · dismissible via Back/Escape equivalent |

## 8.2 Component composition vocabulary (F5.4 families)

| Token | Meaning |
|-------|---------|
| `ScreenChrome` | Safe area · header · Back · overflow |
| `TabRootChrome` | Five-root tab shell |
| `List` / `FlashList` | Primary scrolling lists |
| `Skeleton` | Structure-preserving loading |
| `EmptyState` / `ErrorState` | Honest absence / recovery |
| `FeedItem` | Home/community activity row |
| `GameCard` / `UserRow` / `CommunityCard` / `EventCard` | Object previews |
| `CollectionCard` / `TierListCard` / `AchievementRow` | Curation/identity previews |
| `PrimaryButton` / `SecondaryButton` / `IconButton` | Actions |
| `TextField` / `Form` | Inputs (RHF+Zod projection) |
| `SegmentedControl` / `FilterChip` | Segments/filters |
| `BottomSheet` / `Modal` / `FullscreenTask` | Task hosts |
| `Toast` / `Banner` | Ephemeral feedback |
| `RecommendationSlot` | Optional semantic similarity region (absence OK) |
| `OwnershipIndicator` | Library ownership mark on Game (Steam/manual honesty) |
| `ProgressIndicator` | Import/OAuth/achievement progress (non-gamified) |
| `ComposeFAB` | Home compose entry |
| `MediaThumb` / `MediaViewer` | Media |

Composition lists name these families — they do **not** invent new visual systems (S4 owns component implementation contracts).

---

# PART D — INDEX

---

# 9. Screen Index (MVP)

| ID | Screen | Owner | Route family |
|----|--------|-------|--------------|
| SYS-01 | Splash | System Boot | `root.boot.splash` |
| SYS-02 | Session Loading | System Boot | `root.boot.session` |
| SYS-03 | Blocking System Error | System Boot | `root.boot.error` |
| AUTH-01 | Login | Authentication | `gate.auth.login` |
| AUTH-02 | Register | Authentication | `gate.auth.register` |
| AUTH-03 | OAuth Bridge | Authentication | `gate.auth.oauth` |
| AUTH-04 | Forgot / Reset Password | Authentication | `gate.auth.reset` |
| AUTH-05 | Soft-Gate / Public Preview Bridge | Authentication | `gate.auth.soft-gate` |
| ONB-01 | Onboarding — Taste | Onboarding | `gate.onboarding.taste` |
| ONB-02 | Onboarding — Platforms | Onboarding | `gate.onboarding.platforms` |
| ONB-03 | Onboarding — Connect Accounts | Onboarding | `gate.onboarding.connect` |
| ONB-04 | Onboarding — Follow Suggestions | Onboarding | `gate.onboarding.follows` |
| HOME-01 | Activity Feed | Home | `root.home` → `(tabs)/home` |
| DIS-01 | Discover Hub | Discover | `root.discover` → `(tabs)/discover` |
| DIS-02 | Search | Discover | `discover.hub.search` |
| DIS-03 | Search Results | Discover | `discover.hub.search.results` |
| DIS-04 | Communities Hub | Discover | `discover.hub.communities` |
| DIS-05 | Events Hub | Discover | `discover.hub.events` |
| LIB-01 | Library Hub | Library | `root.library` → `(tabs)/library` |
| LIB-02 | Shelf / Status Lists | Library | `library.index.shelf` |
| LIB-03 | Wishlist | Library | `library.index.wishlist` |
| LIB-04 | Backlog | Library | `library.index.backlog` |
| LIB-05 | Collections Index | Library | `library.index.collections` |
| LIB-06 | Tier Lists Index | Library | `library.index.tiers` |
| LIB-07 | Library Import | Library | `library.index.import` |
| LIB-08 | Hidden Archive | Library | `library.index.hidden` |
| NOT-01 | Notifications List | Notifications | `root.notifications` → `(tabs)/notifications` |
| NOT-02 | Activity Center | Notifications | `notifications.activity` |
| PRO-01 | Own Profile | Profile | `root.profile` → `(tabs)/profile` |
| PRO-02 | Edit Profile | Profile | `profile.edit` |
| PRO-03 | Followers / Following | Profile / Shared User | `profile.social` / `shared.user.social` |
| PRO-04 | Achievements | Profile / Shared User | `profile.achievements` / `shared.user.achievements` |
| PRO-05 | Statistics | Profile / Shared User | `profile.statistics` / `shared.user.statistics` |
| MSG-01 | Messages Inbox | Messages Stack | `messages.inbox` |
| MSG-02 | Conversation | Messages Stack | `messages.conversation` |
| SET-01 | Settings Hub | Settings | `settings.hub` |
| SET-02 | Account | Settings | `settings.account` |
| SET-03 | Connected Accounts | Settings | `settings.account.connected` |
| SET-04 | Privacy | Settings | `settings.privacy` |
| SET-05 | Notification Preferences | Settings | `settings.notifications` |
| SET-06 | Appearance | Settings | `settings.appearance` |
| SET-07 | Accessibility | Settings | `settings.accessibility` |
| SET-08 | About / Legal | Settings | `settings.legal` |
| SHG-01 | Game Detail | Shared Game | `shared.game.[id]` |
| SHG-02 | Game Reviews List | Shared Game | `shared.game.[id].reviews` |
| SHG-03 | Game Posts / Discussion List | Shared Game | `shared.game.[id].posts` |
| SHG-04 | Game Media Gallery | Shared Game | `shared.game.[id].media` |
| SHG-05 | Related / Recommendations (Game) | Shared Game | `shared.game.[id].related` |
| SHP-01 | Post Detail | Shared Post | `shared.post.[id]` |
| SHP-02 | Comment Thread | Shared Post/Review | `shared.{post\|review}.[id].comments` |
| SHR-01 | Review Detail | Shared Review | `shared.review.[id]` |
| SHC-01 | Collection Detail | Shared Collection | `shared.collection.[id]` |
| SHT-01 | Tier List Detail | Shared Tier | `shared.tier.[id]` |
| SHU-01 | Other User Profile | Shared User | `shared.user.[id]` |
| SHCM-01 | Community Home / Detail | Shared Community | `shared.community.[id]` |
| SHCM-02 | Community Feed | Shared Community | `shared.community.[id].feed` |
| SHCM-03 | Community Members | Shared Community | `shared.community.[id].members` |
| SHCM-04 | Community Activity | Shared Community | `shared.community.[id].activity` |
| SHCM-05 | Discussion Detail | Shared Community | `shared.community.[id].discussion.[id]` (Beta+) |
| SHE-01 | Event Detail | Shared Event | `shared.event.[id]` |
| SHA-01 | Achievement Detail | Shared Achievement | `shared.achievement.[id]` |
| TSK-01 | Compose Chooser | Task Layer | `task.compose.chooser` |
| TSK-02 | Compose Post | Task Layer | `task.compose.post` |
| TSK-03 | Log Game | Task Layer | `task.log-game` |
| TSK-04 | Write / Edit Review | Task Layer | `task.review.edit` |
| TSK-05 | Create / Edit Collection | Task Layer | `task.collection.edit` |
| TSK-06 | Tier List Editor | Task Layer | `task.tier.edit` |
| TSK-07 | Account Link (OAuth) | Task Layer | `task.account-link` |
| TSK-08 | Steam Library Import | Task Layer | `task.steam-import` |
| TSK-09 | Share | Task Layer | `task.share` |
| TSK-10 | Report / Block | Task Layer | `task.report-block` |
| TSK-11 | Delete Confirmation | Task Layer | `task.delete-confirm` |
| TSK-12 | Image / Media Picker | Task Layer | `task.media-picker` |
| TSK-13 | Filters / Sort | Task Layer | `task.filters-sort` |
| TSK-14 | Media Viewer | Task Layer | `task.media-viewer` |
| STF-01 | Moderator Home / Queue | Moderator | `staff.mod.queue` |
| STF-02 | Report Detail (Staff) | Moderator | `staff.mod.report.[id]` |
| STF-03 | Admin Home | Admin | `staff.admin.home` |
| STF-04 | Admin User / Content Tools | Admin | `staff.admin.tools` |

---

# PART E — SCREEN CONTRACTS

---

# 10. System Boot

### SYS-01 Splash

| Field | Spec |
|-------|------|
| Purpose | Brand presence while boot begins |
| Route | `root.boot.splash` → `(gate)/splash` |
| Owner | System Boot |
| API | None (local) |
| Queries | — |
| Mutations | — |
| Loading | Brand hold until session probe starts |
| Empty | N/A |
| Pending | Transition to Session Loading |
| Error | Escalate to SYS-03 if boot fails |
| Permissions | None |
| Navigation | → Session Loading |
| Realtime | None |
| Offline | Proceed to session probe with cached session if present |
| Analytics | `screen_view` |
| A11y | Decorative brand · announce “Starting GMRLOG” once |
| Composition | `ScreenChrome`(minimal) · brand mark (DS) |

### SYS-02 Session Loading

| Field | Spec |
|-------|------|
| Purpose | Resolve session · route to gate/main/queued deep link |
| Route | `root.boot.session` |
| Owner | System Boot |
| API | Sessions |
| Queries | `POST /sessions/refresh` (credential) · `GET /me` · `GET /onboarding` when authed |
| Mutations | — |
| Loading | Structure-preserving wait · no fake main UI |
| Empty | N/A |
| Pending | Refresh in flight |
| Error | Recoverable retry · else Soft-Gate/Login · blocking → SYS-03 |
| Permissions | Refresh credential or none |
| Navigation | → Auth · Onboarding · Main Home · queued Shared |
| Realtime | Connect after main ready (optional) |
| Offline | Use cached session honestly · fail writes later |
| Analytics | `screen_view` · `query_error` |
| A11y | Announce “Checking session” |
| Composition | `Skeleton` · `ErrorState` |

### SYS-03 Blocking System Error

| Field | Spec |
|-------|------|
| Purpose | Calm last-resort recovery when boot/root fails |
| Route | `root.boot.error` |
| Owner | System Boot |
| API | Optional health ping (if defined in ops — not product redesign) |
| Queries | — |
| Mutations | Retry boot |
| Loading | N/A |
| Empty | N/A |
| Pending | Retry in flight |
| Error | This screen *is* the error |
| Permissions | None |
| Navigation | Retry → Splash/Session · Leave app |
| Realtime | None |
| Offline | Show offline-capable copy |
| Analytics | `screen_view` · `query_error` |
| A11y | Assertive live region · focus on Retry |
| Composition | `ErrorState` · `PrimaryButton` |

---

# 11. Authentication

### AUTH-01 Login

| Field | Spec |
|-------|------|
| Purpose | Authenticate returning guest |
| Route | `gate.auth.login` → `(gate)/login` |
| Owner | Authentication |
| API | Sessions |
| Queries | — |
| Mutations | `POST /sessions` · optional OAuth start via Account Link task |
| Loading | Form ready immediately |
| Empty | N/A |
| Pending | Submit disabled double-post |
| Error | Inline field + form error · stay |
| Permissions | Guest |
| Navigation | Success → Onboarding or Main · → Register · → Reset · → OAuth Bridge |
| Realtime | None |
| Offline | Block submit · `offline_block` |
| Analytics | `screen_view` · `mutation_*` |
| A11y | Labeled fields · error linked to inputs |
| Composition | `ScreenChrome` · `Form` · `TextField` · `PrimaryButton` |

### AUTH-02 Register

| Field | Spec |
|-------|------|
| Purpose | Create player account |
| Route | `gate.auth.register` |
| Owner | Authentication |
| API | Sessions |
| Queries | — |
| Mutations | `POST /sessions/register` |
| Loading | Form ready |
| Empty | N/A |
| Pending | Submit pending |
| Error | Inline uniqueness/validation errors |
| Permissions | Guest |
| Navigation | Success → Onboarding · → Login |
| Realtime | None |
| Offline | Block submit |
| Analytics | `screen_view` · `mutation_*` |
| A11y | Same as Login |
| Composition | `Form` · `TextField` · `PrimaryButton` |

### AUTH-03 OAuth Bridge

| Field | Spec |
|-------|------|
| Purpose | Complete provider auth handoff (login method — not social graph) |
| Route | `gate.auth.oauth` |
| Owner | Authentication |
| API | Account links / provider bridge (S1) |
| Queries | `GET /account-links/{id}` poll |
| Mutations | `POST /account-links` (purpose=login) · cancel |
| Loading | Waiting for provider |
| Empty | N/A |
| Pending | Awaiting provider · cancellable |
| Error | Failed/expired · return to Login |
| Permissions | Guest or linking context |
| Navigation | Success → session establish · Cancel → origin |
| Realtime | Optional status push; poll OK |
| Offline | Block start |
| Analytics | `account_link_progress` · `task_*` |
| A11y | Announce pending · Cancel always reachable |
| Composition | `FullscreenTask` · `ProgressIndicator` · `SecondaryButton`(Cancel) |

### AUTH-04 Forgot / Reset Password

| Field | Spec |
|-------|------|
| Purpose | Start and complete password reset |
| Route | `gate.auth.reset` |
| Owner | Authentication |
| API | Sessions |
| Queries | — |
| Mutations | `POST /sessions/password/forgot` · `POST /sessions/password/reset` |
| Loading | Form ready |
| Empty | N/A |
| Pending | Submit pending |
| Error | Inline · no email enumeration theater beyond S1 policy |
| Permissions | Guest |
| Navigation | Back Login · success → Login |
| Realtime | None |
| Offline | Block |
| Analytics | `mutation_*` |
| A11y | Clear step titles (request vs reset) |
| Composition | `Form` · `TextField` · `PrimaryButton` |

### AUTH-05 Soft-Gate / Public Preview Bridge

| Field | Spec |
|-------|------|
| Purpose | Invite guest into auth when action requires membership |
| Route | `gate.auth.soft-gate` |
| Owner | Authentication |
| API | Soft-gate |
| Queries | `GET /sessions/soft-gate` |
| Mutations | — (navigates to Login/Register) |
| Loading | Capability map skeleton |
| Empty | N/A |
| Pending | N/A |
| Error | Fail open to Login with message |
| Permissions | Guest with queued target |
| Navigation | → Login · Register · Dismiss to preview if allowed |
| Realtime | None |
| Offline | Show cached soft-gate policy if any |
| Analytics | `gate_soft` |
| A11y | Focus primary continue |
| Composition | `Modal`/`FullscreenTask` · `PrimaryButton` · `SecondaryButton` |

---

# 12. Onboarding

### ONB-01 Taste

| Field | Spec |
|-------|------|
| Purpose | Capture initial taste (non-trapping) |
| Route | `gate.onboarding.taste` |
| Owner | Onboarding |
| API | Onboarding |
| Queries | `GET /onboarding` · taste catalog facets via games/genres as needed |
| Mutations | `PATCH /onboarding/taste` |
| Loading | Skeleton chips |
| Empty | No facets → skip allowed with explanation |
| Pending | Save pending |
| Error | Retry · allow skip forward per product law |
| Permissions | Authenticated · onboarding incomplete |
| Navigation | → Platforms · Back limited per F5.4 |
| Realtime | None |
| Offline | Keep local draft · block advance if must save |
| Analytics | `mutation_*` |
| A11y | Multi-select announced |
| Composition | `Form` · `FilterChip` · `PrimaryButton` |

### ONB-02 Platforms

| Field | Spec |
|-------|------|
| Purpose | Capture platforms |
| Route | `gate.onboarding.platforms` |
| Owner | Onboarding |
| API | Onboarding |
| Queries | `GET /onboarding` |
| Mutations | `PATCH /onboarding/platforms` |
| Loading | Skeleton |
| Empty | Skip allowed |
| Pending | Save pending |
| Error | Retry |
| Permissions | Authenticated · onboarding |
| Navigation | → Connect Accounts (optional) or Follow Suggestions |
| Realtime | None |
| Offline | Draft local |
| Analytics | `mutation_*` |
| A11y | Same as Taste |
| Composition | `FilterChip` · `PrimaryButton` |

### ONB-03 Connect Accounts (optional)

| Field | Spec |
|-------|------|
| Purpose | Optional Steam/Discord link during onboarding — skippable |
| Route | `gate.onboarding.connect` |
| Owner | Onboarding |
| API | Connected accounts · Account links |
| Queries | `GET /connected-accounts` |
| Mutations | Open `TSK-07` · never required |
| Loading | List skeleton |
| Empty | “Not connected” is normal — Skip primary |
| Pending | While link task open |
| Error | Non-blocking · Skip remains |
| Permissions | Authenticated · onboarding |
| Navigation | Skip/Continue → Follow Suggestions · → Account Link task |
| Realtime | Link status optional |
| Offline | Skip only · block link start |
| Analytics | `account_link_progress` · skip event via `task_dismiss` |
| A11y | Announce optional |
| Composition | `List` · `PrimaryButton`(Continue) · `SecondaryButton`(Skip) · `ProgressIndicator` |

### ONB-04 Follow Suggestions

| Field | Spec |
|-------|------|
| Purpose | Optional follows before main |
| Route | `gate.onboarding.follows` |
| Owner | Onboarding |
| API | Onboarding · Follows |
| Queries | `GET /onboarding/follow-suggestions` |
| Mutations | `POST /follows` · `POST /onboarding/complete` |
| Loading | Suggestion skeleton |
| Empty | Skip/Finish allowed |
| Pending | Follow toggles pending |
| Error | Per-row error · Finish still allowed |
| Permissions | Authenticated · onboarding |
| Navigation | Finish → Replace Main Home |
| Realtime | None |
| Offline | Block follows · allow finish if complete endpoint cached policy permits; else block with honesty |
| Analytics | `mutation_*` |
| A11y | User rows named |
| Composition | `UserRow` · `PrimaryButton` |

---

# 13. Home · Discover · Library · Notifications · Profile

### HOME-01 Activity Feed

| Field | Spec |
|-------|------|
| Purpose | Culture heartbeat — what happened in my gaming world |
| Route | `root.home` → `(tabs)/home` |
| Owner | Home |
| API | Feed · Recommendations (slot) |
| Queries | `GET /feed` (cursor) · optional `GET /recommendations/games` slot |
| Mutations | Open tasks only (compose) · reactions via object screens |
| Loading | Feed skeletons |
| Empty | Calm empty · CTA Explore Discover / Compose |
| Pending | Refresh / pagination pending |
| Error | Keep prior page if any · retry banner |
| Permissions | Authenticated ready |
| Navigation | Shared objects · Search affordance · `TSK-01` · tab switch |
| Realtime | Optional feed invalidation events |
| Offline | Show cached page · pull-to-refresh blocked honestly |
| Analytics | `screen_view` · `slot_shown`/`slot_absent` |
| A11y | List · “End of feed” |
| Composition | `TabRootChrome` · `FlashList`+`FeedItem` · `ComposeFAB` · `RecommendationSlot` · `Skeleton` · `EmptyState` · `ErrorState` |

### DIS-01 Discover Hub

| Field | Spec |
|-------|------|
| Purpose | Exploration wing root |
| Route | `root.discover` |
| Owner | Discover |
| API | Discover · Recommendations |
| Queries | `GET /discover` · optional recommendation modules |
| Mutations | — |
| Loading | Hub module skeletons |
| Empty | Modules absent OK · Search still entry |
| Pending | Module refresh |
| Error | Per-module degrade · hub remains |
| Permissions | Main App (guest preview per soft-gate policy) |
| Navigation | Search · Communities Hub · Events Hub · Shared |
| Realtime | None required |
| Offline | Cached hub |
| Analytics | `screen_view` |
| A11y | Section headings per module |
| Composition | `TabRootChrome` · module `List`s · `GameCard` · `CommunityCard` · `EventCard` · `RecommendationSlot` |

### DIS-02 Search

| Field | Spec |
|-------|------|
| Purpose | Universal search entry |
| Route | `discover.hub.search` |
| Owner | Discover |
| API | Search |
| Queries | Recent/local only until submit; optional trending empty aids (non-engagement) |
| Mutations | — |
| Loading | Instant field |
| Empty | Recent/trending empty aids — never FOMO |
| Pending | N/A |
| Error | N/A until results |
| Permissions | Main / guest per policy |
| Navigation | → Results · Back Hub · open Shared from recent |
| Realtime | None |
| Offline | Local recent only |
| Analytics | `screen_view` |
| A11y | Search field is primary focus |
| Composition | `ScreenChrome` · `TextField` · `List` |

### DIS-03 Search Results

| Field | Spec |
|-------|------|
| Purpose | Typed/segmented results |
| Route | `discover.hub.search.results` |
| Owner | Discover |
| API | Search |
| Queries | `GET /search?q=` + type segment |
| Mutations | — |
| Loading | Results skeleton |
| Empty | No matches · refine CTA |
| Pending | Segment change reload |
| Error | Retry |
| Permissions | Query required |
| Navigation | Shared by type · Filters task · Back Search |
| Realtime | None |
| Offline | Cached last query if any |
| Analytics | `screen_view` |
| A11y | Segment control labeled · result counts |
| Composition | `SegmentedControl` · `FlashList` · type cards · `EmptyState` · `TSK-13` entry |

### DIS-04 Communities Hub

| Field | Spec |
|-------|------|
| Purpose | Directory/entry to communities — not a tab |
| Route | `discover.hub.communities` |
| Owner | Discover |
| API | Discover communities |
| Queries | `GET /discover/communities` |
| Mutations | — |
| Loading | List skeleton |
| Empty | Calm · Search communities CTA |
| Pending | Pagination |
| Error | Retry |
| Permissions | Main App |
| Navigation | `SHCM-01` · Search · Back |
| Realtime | None |
| Offline | Cached list |
| Analytics | `screen_view` |
| A11y | Community names |
| Composition | `List` · `CommunityCard` · `FilterChip` |

### DIS-05 Events Hub

| Field | Spec |
|-------|------|
| Purpose | Directory/entry to events — not a tab |
| Route | `discover.hub.events` |
| Owner | Discover |
| API | Discover events |
| Queries | `GET /discover/events` |
| Mutations | — |
| Loading | List skeleton |
| Empty | Calm absence |
| Pending | Pagination |
| Error | Retry |
| Permissions | Main App |
| Navigation | `SHE-01` · Back |
| Realtime | None |
| Offline | Cached list |
| Analytics | `screen_view` |
| A11y | Event titles · times textual |
| Composition | `List` · `EventCard` |

### LIB-01 Library Hub

| Field | Spec |
|-------|------|
| Purpose | Player’s game home — shelves entry |
| Route | `root.library` |
| Owner | Library |
| API | Library |
| Queries | `GET /library` |
| Mutations | Open import / log tasks |
| Loading | Hub skeleton |
| Empty | CTA add/log · Import optional |
| Pending | Refresh |
| Error | Retry |
| Permissions | Authenticated |
| Navigation | Shelves · Wishlist · Backlog · Collections · Tiers · Import · Hidden · Shared Game |
| Realtime | Optional library.changed invalidation |
| Offline | Cached summary |
| Analytics | `screen_view` |
| A11y | Section headings |
| Composition | `TabRootChrome` · shelf previews · `PrimaryButton` · Import entry |

### LIB-02 / LIB-03 / LIB-04 / LIB-08 — Shelf · Wishlist · Backlog · Hidden

| Field | Spec |
|-------|------|
| Purpose | Status-segmented library lists (Hidden = archive) |
| Route | `library.index.shelf` · `.wishlist` · `.backlog` · `.hidden` |
| Owner | Library |
| API | Library entries |
| Queries | `GET /library/entries?filter[status]=…` |
| Mutations | `PUT/PATCH` via Log Game task · `DELETE` remove |
| Loading | List skeleton |
| Empty | Per-status calm empty |
| Pending | Status change pending on row |
| Error | Retry · revert optimistic failure |
| Permissions | Owner only |
| Navigation | Shared Game · Filters · Log Game · Back Hub |
| Realtime | library.changed optional |
| Offline | Cached entries · block writes |
| Analytics | `screen_view` · `mutation_*` |
| A11y | Status in row name |
| Composition | `FlashList` · `GameCard` · `OwnershipIndicator` · `TSK-13` |

### LIB-05 Collections Index

| Field | Spec |
|-------|------|
| Purpose | Index of player collections |
| Route | `library.index.collections` |
| Owner | Library (index) · Shared Collection owns detail |
| API | Collections |
| Queries | `GET /collections` |
| Mutations | Open create task |
| Loading | Skeleton |
| Empty | Create CTA |
| Pending | Pagination |
| Error | Retry |
| Permissions | Owner (other via query when allowed) |
| Navigation | `SHC-01` · `TSK-05` · Back |
| Realtime | None required |
| Offline | Cached index |
| Analytics | `screen_view` |
| A11y | Titles |
| Composition | `List` · `CollectionCard` |

### LIB-06 Tier Lists Index

| Field | Spec |
|-------|------|
| Purpose | Index of player tier lists |
| Route | `library.index.tiers` |
| Owner | Library (index) · Shared Tier owns detail |
| API | Tier lists |
| Queries | `GET /tier-lists` |
| Mutations | Open editor task |
| Loading | Skeleton |
| Empty | Create CTA |
| Pending | Pagination |
| Error | Retry |
| Permissions | Owner |
| Navigation | `SHT-01` · `TSK-06` · Back |
| Realtime | None |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Titles |
| Composition | `List` · `TierListCard` |

### LIB-07 Library Import

| Field | Spec |
|-------|------|
| Purpose | Entry to Steam import task (not destination permanence) |
| Route | `library.index.import` |
| Owner | Library |
| API | Import jobs · Connected accounts |
| Queries | `GET /connected-accounts` · last job if any |
| Mutations | Start `TSK-08` |
| Loading | Status skeleton |
| Empty | Connect account CTA optional · never required for Library existence |
| Pending | While task runs |
| Error | Non-blocking |
| Permissions | Authenticated |
| Navigation | → `TSK-08` / `TSK-07` · Back Hub |
| Realtime | import.progressed |
| Offline | Block start |
| Analytics | `import_progress` |
| A11y | Announce optional integration |
| Composition | `EmptyState`/`ProgressIndicator` · `PrimaryButton` |

### NOT-01 Notifications List

| Field | Spec |
|-------|------|
| Purpose | Attention desk — notifications |
| Route | `root.notifications` |
| Owner | Notifications |
| API | Notifications |
| Queries | `GET /notifications` |
| Mutations | `POST /notifications/read` |
| Loading | Skeleton |
| Empty | Calm empty |
| Pending | Mark-read pending |
| Error | Retry |
| Permissions | Authenticated |
| Navigation | Deep to Shared/origin · Activity Center · tab switch |
| Realtime | notification.created optional |
| Offline | Cached list · block mark-all if needed |
| Analytics | `screen_view` |
| A11y | Unread announced |
| Composition | `TabRootChrome` · `List` · notification rows |

### NOT-02 Activity Center

| Field | Spec |
|-------|------|
| Purpose | Broader activity record (not Home) |
| Route | `notifications.activity` |
| Owner | Notifications |
| API | Activity |
| Queries | `GET /activity` |
| Mutations | — |
| Loading | Skeleton |
| Empty | Calm |
| Pending | Pagination |
| Error | Retry |
| Permissions | Authenticated |
| Navigation | Shared objects · Back |
| Realtime | Optional |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Activity kinds textual |
| Composition | `List` · `FeedItem`-like rows |

### PRO-01 Own Profile

| Field | Spec |
|-------|------|
| Purpose | Self identity home |
| Route | `root.profile` |
| Owner | Profile |
| API | Me |
| Queries | `GET /me` · summary slices as needed |
| Mutations | — (edit via PRO-02) |
| Loading | Profile skeleton |
| Empty | N/A (self always exists) |
| Pending | Refresh |
| Error | Retry |
| Permissions | Authenticated self |
| Navigation | Edit · Followers · Achievements · Statistics · Messages · Settings · Shared content |
| Realtime | None required |
| Offline | Cached me |
| Analytics | `screen_view` |
| A11y | Heading = displayName |
| Composition | `TabRootChrome` · profile header · section rows · overflow for Messages |

### PRO-02 Edit Profile

| Field | Spec |
|-------|------|
| Purpose | Edit self profile |
| Route | `profile.edit` |
| Owner | Profile |
| API | Me · Uploads |
| Queries | `GET /me` |
| Mutations | `PATCH /me` · upload grant/confirm for avatar/banner |
| Loading | Form hydrate |
| Empty | N/A |
| Pending | Save pending · upload pending |
| Error | Inline · keep draft |
| Permissions | Self |
| Navigation | Back Profile · Media Picker |
| Realtime | None |
| Offline | Keep draft · block save |
| Analytics | `mutation_*` |
| A11y | Labeled fields |
| Composition | `Form` · `TextField` · `MediaThumb` · `PrimaryButton` |

### PRO-03 Followers / Following

| Field | Spec |
|-------|------|
| Purpose | Social graph lists for self or other (privacy-gated) |
| Route | `profile.social` / `shared.user.[id].social` |
| Owner | Profile (self) · Shared User (other) |
| API | Followers/Following |
| Queries | `GET /me/followers|following` or `/users/{id}/…` |
| Mutations | `POST/DELETE /follows` |
| Loading | Skeleton |
| Empty | Calm |
| Pending | Follow toggle |
| Error | Retry · privacy empty indistinguishability |
| Permissions | Per privacy |
| Navigation | Shared User · Back |
| Realtime | None |
| Offline | Cached · block follow writes |
| Analytics | `mutation_*` |
| A11y | User names |
| Composition | `List` · `UserRow` |

### PRO-04 Achievements

| Field | Spec |
|-------|------|
| Purpose | GMRLOG achievement index (not Steam) |
| Route | `profile.achievements` / `shared.user.[id].achievements` |
| Owner | Profile / Shared User (index) · Shared Achievement owns detail |
| API | Achievements |
| Queries | `GET /me/achievements` or `/users/{id}/achievements` |
| Mutations | — |
| Loading | Skeleton |
| Empty | Calm — no pressure |
| Pending | Pagination |
| Error | Retry |
| Permissions | Per privacy |
| Navigation | `SHA-01` · Back |
| Realtime | achievement.awarded optional invalidate |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Progress textual · not color-alone |
| Composition | `List` · `AchievementRow` · `ProgressIndicator` |

### PRO-05 Statistics

| Field | Spec |
|-------|------|
| Purpose | Honest play/culture stats |
| Route | `profile.statistics` / `shared.user.[id].statistics` |
| Owner | Profile / Shared User |
| API | Statistics |
| Queries | `GET /me/statistics` or `/users/{id}/statistics` |
| Mutations | — |
| Loading | Skeleton |
| Empty | Zero states calm |
| Pending | Refresh |
| Error | Retry |
| Permissions | Per privacy |
| Navigation | Back · related Shared optional |
| Realtime | None |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Stats as text |
| Composition | `List`/stat rows · no engagement charts theater |

### MSG-01 Messages Inbox

| Field | Spec |
|-------|------|
| Purpose | Conversation list (Profile-entered — not a tab) |
| Route | `messages.inbox` → `(messages)/inbox` |
| Owner | Messages Stack |
| API | Conversations |
| Queries | `GET /conversations` |
| Mutations | `POST /conversations` |
| Loading | Skeleton |
| Empty | Calm · start conversation if allowed |
| Pending | Pagination |
| Error | Retry |
| Permissions | Authenticated |
| Navigation | `MSG-02` · Back Profile |
| Realtime | conversation/message events optional |
| Offline | Cached inbox · block send |
| Analytics | `screen_view` |
| A11y | Unread counts |
| Composition | `List` · conversation rows |

### MSG-02 Conversation

| Field | Spec |
|-------|------|
| Purpose | Message thread |
| Route | `messages.conversation` |
| Owner | Messages Stack |
| API | Messages |
| Queries | `GET /conversations/{id}` · `GET …/messages` |
| Mutations | `POST …/messages` |
| Loading | Message skeleton |
| Empty | Empty thread OK |
| Pending | Send pending |
| Error | Keep draft · retry send |
| Permissions | Participant |
| Navigation | Shared User · Media · Report · Back Inbox |
| Realtime | message.created preferred · refetch OK |
| Offline | Cached messages · block send |
| Analytics | `mutation_*` |
| A11y | Message list · composer labeled |
| Composition | `FlashList` · composer `TextField` · `PrimaryButton` |

---

# 14. Settings

### SET-01 Settings Hub

| Field | Spec |
|-------|------|
| Purpose | Control stratum root |
| Route | `settings.hub` |
| Owner | Settings |
| API | Settings |
| Queries | `GET /settings` |
| Mutations | — |
| Loading | Skeleton rows |
| Empty | N/A |
| Pending | Refresh |
| Error | Retry |
| Permissions | Authenticated |
| Navigation | All SET-* · Back Profile |
| Realtime | None |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Row names |
| Composition | `List` settings rows |

### SET-02 Account

| Field | Spec |
|-------|------|
| Purpose | Account controls · logout · security entry |
| Route | `settings.account` |
| Owner | Settings |
| API | Settings · Sessions |
| Queries | `GET /settings` |
| Mutations | `PATCH /settings/account` · `DELETE /sessions/current` |
| Loading | Form hydrate |
| Empty | N/A |
| Pending | Save / logout pending |
| Error | Retry |
| Permissions | Self |
| Navigation | Connected Accounts · Login after logout |
| Realtime | None |
| Offline | Block mutating |
| Analytics | `mutation_*` |
| A11y | Destructive logout confirmed |
| Composition | `Form` · `PrimaryButton` · link to SET-03 |

### SET-03 Connected Accounts

| Field | Spec |
|-------|------|
| Purpose | Steam · Discord guest links (optional) |
| Route | `settings.account.connected` |
| Owner | Settings |
| API | Connected accounts · Account links |
| Queries | `GET /connected-accounts` |
| Mutations | `DELETE /connected-accounts/{provider}` · start `TSK-07` |
| Loading | Skeleton |
| Empty | Disconnected is normal |
| Pending | Link/disconnect pending |
| Error | Non-blocking |
| Permissions | Self |
| Navigation | `TSK-07` · Back Account |
| Realtime | Link status optional |
| Offline | Block link/disconnect |
| Analytics | `account_link_progress` |
| A11y | Provider status textual |
| Composition | `List` · status rows · `PrimaryButton`/`SecondaryButton` |

### SET-04 Privacy · SET-05 Notification Preferences · SET-06 Appearance · SET-07 Accessibility

| Field | Spec |
|-------|------|
| Purpose | Respective preference sections (F5.3) |
| Route | `settings.privacy` · `.notifications` · `.appearance` · `.accessibility` |
| Owner | Settings |
| API | Settings |
| Queries | `GET /settings` |
| Mutations | `PATCH /settings/{privacy\|notifications\|appearance\|accessibility}` |
| Loading | Form hydrate |
| Empty | N/A |
| Pending | Toggle/save pending · revert on failure |
| Error | Inline · revert |
| Permissions | Self |
| Navigation | Back Hub |
| Realtime | None |
| Offline | Block saves · keep local UI optimism only if revert-safe |
| Analytics | `mutation_*` |
| A11y | Toggles named · appearance ≠ color-alone meaning |
| Composition | `Form` · toggles/rows · `PrimaryButton` if explicit save |

### SET-08 About / Legal

| Field | Spec |
|-------|------|
| Purpose | Legal/about references |
| Route | `settings.legal` |
| Owner | Settings |
| API | Legal |
| Queries | `GET /settings/legal` |
| Mutations | — |
| Loading | Skeleton |
| Empty | Offline cached legal refs |
| Pending | N/A |
| Error | Retry |
| Permissions | Player or guest |
| Navigation | External docs per policy · Back |
| Realtime | None |
| Offline | Cached content |
| Analytics | `screen_view` |
| A11y | Document titles |
| Composition | `List` links |

---

# 15. Shared Destinations — Game · Post · Review · Collection · Tier · User

### SHG-01 Game Detail

| Field | Spec |
|-------|------|
| Purpose | Singular game room |
| Route | `shared.game.[id]` |
| Owner | Shared Game |
| API | Games · Library entry · Recommendations |
| Queries | `GET /games/{id}` · `GET /library/entries/{gameId}` (auth) · recommendations slot |
| Mutations | Open Log Game / Review / Share tasks · library upsert via task |
| Loading | Detail skeleton |
| Empty | N/A (404 → error) |
| Pending | Library action pending |
| Error | not_found / retry |
| Permissions | Public/guest per soft-gate · mutations Player |
| Navigation | Reviews · Posts · Media · Related · User reviews · tasks |
| Realtime | None required |
| Offline | Cached detail · block library writes |
| Analytics | `screen_view` · `slot_*` |
| A11y | Title heading · ownership status textual |
| Composition | `ScreenChrome` · header · `OwnershipIndicator` · action row · `RecommendationSlot` · child entry rows |

### SHG-02 Game Reviews · SHG-03 Game Posts · SHG-04 Game Media · SHG-05 Related

| Field | Spec |
|-------|------|
| Purpose | Game children lists/gallery/related (F5.3) |
| Route | `shared.game.[id].{reviews\|posts\|media\|related}` |
| Owner | Shared Game |
| API | Games subresources · Recommendations for related |
| Queries | `GET /games/{id}/reviews|posts|media|recommendations` |
| Mutations | Compose/Review tasks from reviews/posts |
| Loading | List/gallery skeleton |
| Empty | Calm · CTA write/post when allowed |
| Pending | Pagination |
| Error | Retry · related slot → absence |
| Permissions | Per visibility |
| Navigation | Review/Post Detail · Media Viewer · Back Game |
| Realtime | None |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Lists named by child purpose |
| Composition | `FlashList`/`MediaThumb` · `RecommendationSlot`(related) · `EmptyState` |

### SHP-01 Post Detail

| Field | Spec |
|-------|------|
| Purpose | Singular post room |
| Route | `shared.post.[id]` |
| Owner | Shared Post |
| API | Posts · Reactions · Comments |
| Queries | `GET /posts/{id}` |
| Mutations | `POST/DELETE /reactions` · edit/delete own · Report |
| Loading | Skeleton |
| Empty | N/A |
| Pending | Reaction/edit pending |
| Error | not_found / retry |
| Permissions | Visibility · author for edit |
| Navigation | Comment Thread · Author · Game · Community · tasks |
| Realtime | Optional reaction counts |
| Offline | Cached · block writes |
| Analytics | `mutation_*` |
| A11y | Article-like structure |
| Composition | `ScreenChrome` · body · action bar · comment entry |

### SHP-02 Comment Thread

| Field | Spec |
|-------|------|
| Purpose | Comments for post or review host |
| Route | `shared.{post|review}.[id].comments` |
| Owner | Host Shared Post/Review |
| API | Comments |
| Queries | `GET /posts|reviews/{id}/comments` |
| Mutations | `POST /comments` · `DELETE /comments/{id}` |
| Loading | Skeleton |
| Empty | Calm · composer if allowed |
| Pending | Send pending |
| Error | Keep draft |
| Permissions | Visibility · auth to comment |
| Navigation | Author · Report · Back host |
| Realtime | Optional |
| Offline | Cached · block send |
| Analytics | `mutation_*` |
| A11y | Thread semantics |
| Composition | `FlashList` · composer · `TextField` |

### SHR-01 Review Detail

| Field | Spec |
|-------|------|
| Purpose | Singular review room |
| Route | `shared.review.[id]` |
| Owner | Shared Review |
| API | Reviews · Reactions · Comments |
| Queries | `GET /reviews/{id}` |
| Mutations | Reactions · edit/delete own |
| Loading | Skeleton |
| Empty | N/A |
| Pending | Mutation pending |
| Error | not_found / retry |
| Permissions | Visibility · spoiler gating UX per F5.4 |
| Navigation | Game · Author · Comments · tasks |
| Realtime | Optional |
| Offline | Cached · block writes |
| Analytics | `screen_view` |
| A11y | Spoiler controls announced |
| Composition | `ScreenChrome` · rating/body · spoiler gate · actions |

### SHC-01 Collection Detail

| Field | Spec |
|-------|------|
| Purpose | Singular collection room |
| Route | `shared.collection.[id]` |
| Owner | Shared Collection |
| API | Collections · Recommendations (similar) |
| Queries | `GET /collections/{id}` · optional similar collections |
| Mutations | Owner edit via task · Share |
| Loading | Skeleton |
| Empty | Empty collection calm |
| Pending | — |
| Error | not_found / retry |
| Permissions | Visibility |
| Navigation | Games · Owner · Similar slot · Edit task · Back |
| Realtime | None |
| Offline | Cached |
| Analytics | `slot_*` |
| A11y | Ordered list |
| Composition | `List` · `GameCard` · `RecommendationSlot` |

### SHT-01 Tier List Detail

| Field | Spec |
|-------|------|
| Purpose | Singular tier list room |
| Route | `shared.tier.[id]` |
| Owner | Shared Tier |
| API | Tier lists |
| Queries | `GET /tier-lists/{id}` |
| Mutations | Owner edit via task |
| Loading | Skeleton |
| Empty | Empty slots calm |
| Pending | — |
| Error | not_found |
| Permissions | Visibility |
| Navigation | Games · Owner · Editor · Back |
| Realtime | None |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Tier labels as headings |
| Composition | Slot sections · `GameCard` |

### SHU-01 Other User Profile

| Field | Spec |
|-------|------|
| Purpose | Other player identity room — not Profile tab |
| Route | `shared.user.[id]` |
| Owner | Shared User |
| API | Users · Follows |
| Queries | `GET /users/{id}` |
| Mutations | `POST/DELETE /follows` · Report/Block tasks |
| Loading | Skeleton |
| Empty | N/A |
| Pending | Follow pending |
| Error | privacy/not_found policy |
| Permissions | Per privacy |
| Navigation | Their lists/achievements/stats · Message if allowed · Back |
| Realtime | None |
| Offline | Cached · block follow |
| Analytics | `mutation_*` |
| A11y | Heading = displayName |
| Composition | Profile header · section rows · `PrimaryButton`(Follow) |

---

# 16. Shared Community · Event · Achievement

### SHCM-01 Community Home / Detail

| Field | Spec |
|-------|------|
| Purpose | Community/guild room |
| Route | `shared.community.[id]` |
| Owner | Shared Community |
| API | Communities |
| Queries | `GET /communities/{id}` |
| Mutations | `POST/DELETE …/membership` |
| Loading | Skeleton |
| Empty | N/A |
| Pending | Join/leave pending |
| Error | not_found / retry |
| Permissions | Visibility/membership |
| Navigation | Feed · Members · Activity · Discussion (Beta+) · Post/User/Game/Event · Back |
| Realtime | Optional membership/activity |
| Offline | Cached · block membership writes |
| Analytics | `mutation_*` |
| A11y | Community name heading |
| Composition | `ScreenChrome` · header · child entry rows · join button |

### SHCM-02 Community Feed

| Field | Spec |
|-------|------|
| Purpose | Community-scoped culture stream |
| Route | `shared.community.[id].feed` |
| Owner | Shared Community |
| API | Community feed |
| Queries | `GET /communities/{id}/feed` |
| Mutations | Compose task (membership-gated) |
| Loading | Feed skeleton |
| Empty | Calm · compose CTA if member |
| Pending | Pagination |
| Error | Retry |
| Permissions | Visibility/membership |
| Navigation | Shared objects · Compose · Back Home |
| Realtime | Optional |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Same as Home feed patterns |
| Composition | `FlashList`+`FeedItem` · `ComposeFAB`(contextual) |

### SHCM-03 Community Members

| Field | Spec |
|-------|------|
| Purpose | People of the room |
| Route | `shared.community.[id].members` |
| Owner | Shared Community |
| API | Members |
| Queries | `GET /communities/{id}/members` |
| Mutations | Follow via user · Report |
| Loading | Skeleton |
| Empty | Calm |
| Pending | Pagination |
| Error | Retry |
| Permissions | Visibility/membership |
| Navigation | Shared User · Report · Back |
| Realtime | None |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Roles textual |
| Composition | `List` · `UserRow` |

### SHCM-04 Community Activity

| Field | Spec |
|-------|------|
| Purpose | Room-scoped activity record |
| Route | `shared.community.[id].activity` |
| Owner | Shared Community |
| API | Community activity |
| Queries | `GET /communities/{id}/activity` |
| Mutations | — |
| Loading | Skeleton |
| Empty | Calm |
| Pending | Pagination |
| Error | Retry |
| Permissions | Visibility/membership |
| Navigation | Shared objects · Back |
| Realtime | Optional |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Activity kinds textual |
| Composition | `List` activity rows |

### SHCM-05 Discussion Detail (Beta+)

| Field | Spec |
|-------|------|
| Purpose | Community discussion thread (Beta+) |
| Route | `shared.community.[id].discussion.[id]` |
| Owner | Shared Community |
| API | Community discussions (when phase enables — must not invent V2; align S1 when amended) |
| Queries | Discussion detail + comments when endpoint admitted |
| Mutations | Reply · Report |
| Loading | Skeleton |
| Empty | Empty thread OK |
| Pending | Reply pending |
| Error | Retry |
| Permissions | Membership/visibility · Beta+ gate |
| Navigation | User · Report · Back |
| Realtime | Optional |
| Offline | Cached · block reply |
| Analytics | `mutation_*` |
| A11y | Thread semantics |
| Composition | Same as Comment Thread family |
| Note | Do not ship as V1 if S1 lacks endpoint — requires Amendment before implementation |

### SHE-01 Event Detail

| Field | Spec |
|-------|------|
| Purpose | One time-bound gathering (all MVP kinds) |
| Route | `shared.event.[id]` |
| Owner | Shared Event |
| API | Events |
| Queries | `GET /events/{id}` |
| Mutations | `POST/DELETE …/participation` · Share |
| Loading | Skeleton |
| Empty | N/A |
| Pending | Participation pending |
| Error | not_found / retry |
| Permissions | Visibility |
| Navigation | Community · Game · User · Post · Back presenter |
| Realtime | Optional participation counts |
| Offline | Cached · block participation |
| Analytics | `mutation_*` |
| A11y | Times textual · no countdown FOMO requirement |
| Composition | `ScreenChrome` · event header · participation controls · related rows |

### SHA-01 Achievement Detail

| Field | Spec |
|-------|------|
| Purpose | Meaning of one GMRLOG achievement + progress |
| Route | `shared.achievement.[id]` |
| Owner | Shared Achievement |
| API | Achievements |
| Queries | `GET /achievements/{id}` (with subject user context) |
| Mutations | Share (owner) |
| Loading | Skeleton |
| Empty | N/A |
| Pending | — |
| Error | not_found / privacy |
| Permissions | Per privacy |
| Navigation | Profile · related Game/Review/Collection · Back |
| Realtime | Optional award invalidate |
| Offline | Cached |
| Analytics | `screen_view` |
| A11y | Progress textual · no points economy UI |
| Composition | `ScreenChrome` · meaning body · `ProgressIndicator` · `AchievementRow` |

---

# 17. Task Layers

Tasks: `Modal` / `BottomSheet` / `FullscreenTask` · return to origin · `task_open`/`task_dismiss`/`task_complete`.

### TSK-01 Compose Chooser

| Field | Spec |
|-------|------|
| Purpose | Choose compose type |
| Route | `task.compose.chooser` |
| Owner | Task Layer |
| API | None |
| Queries | — |
| Mutations | — |
| Loading | Instant |
| Empty | N/A |
| Pending | N/A |
| Error | N/A |
| Permissions | Authenticated |
| Navigation | → Post / Log / Review / Collection / Tier editors · Dismiss |
| Realtime | None |
| Offline | Allow open · editors may block publish |
| Analytics | `task_open` |
| A11y | Action sheet labels |
| Composition | `BottomSheet` · action rows |

### TSK-02 Compose Post

| Field | Spec |
|-------|------|
| Purpose | Create/edit post |
| Route | `task.compose.post` |
| Owner | Task Layer |
| API | Posts · Uploads |
| Queries | Optional draft hydrate |
| Mutations | `POST/PATCH /posts` · upload grant/confirm |
| Loading | Editor ready / hydrate |
| Empty | N/A |
| Pending | Publish pending · Idempotency-Key |
| Error | Keep draft · retry |
| Permissions | Authenticated · community scope if any |
| Navigation | Dismiss origin · optional open Post |
| Realtime | None |
| Offline | Keep draft · block publish |
| Analytics | `task_*` · `mutation_*` |
| A11y | Form labels · discard confirm |
| Composition | `FullscreenTask` · `Form` · `TextField` · `MediaThumb` · `TSK-12` |

### TSK-03 Log Game

| Field | Spec |
|-------|------|
| Purpose | Quick log / status |
| Route | `task.log-game` |
| Owner | Task Layer |
| API | Library |
| Queries | `GET /library/entries/{gameId}` |
| Mutations | Upsert library entry / log |
| Loading | Sheet hydrate |
| Empty | N/A |
| Pending | Save pending |
| Error | Keep sheet · retry |
| Permissions | Authenticated · game id |
| Navigation | Dismiss · optional Review task |
| Realtime | None |
| Offline | Block save |
| Analytics | `mutation_*` |
| A11y | Status options named |
| Composition | `BottomSheet` · status controls · `PrimaryButton` |

### TSK-04 Write / Edit Review

| Field | Spec |
|-------|------|
| Purpose | Create/edit review |
| Route | `task.review.edit` |
| Owner | Task Layer |
| API | Reviews |
| Queries | Existing review if edit |
| Mutations | `POST/PATCH /reviews` |
| Loading | Hydrate |
| Empty | N/A |
| Pending | Publish pending · Idempotency-Key |
| Error | Keep draft |
| Permissions | Authenticated · game context |
| Navigation | Dismiss · optional Review Detail |
| Realtime | None |
| Offline | Draft · block publish |
| Analytics | `mutation_*` |
| A11y | Rating · spoiler toggle labeled |
| Composition | `FullscreenTask` · `Form` · rating control · spoiler toggle |

### TSK-05 Create / Edit Collection · TSK-06 Tier List Editor

| Field | Spec |
|-------|------|
| Purpose | Collection / tier editors |
| Route | `task.collection.edit` · `task.tier.edit` |
| Owner | Task Layer |
| API | Collections / Tier lists |
| Queries | GET by id when edit |
| Mutations | `POST/PATCH` respective resources |
| Loading | Hydrate |
| Empty | Empty entries OK |
| Pending | Save pending |
| Error | Keep draft |
| Permissions | Owner |
| Navigation | Dismiss · optional Detail |
| Realtime | None |
| Offline | Draft · block save |
| Analytics | `mutation_*` |
| A11y | Reorder announced |
| Composition | `FullscreenTask` · `Form` · ordered `GameCard` lists · game picker |

### TSK-07 Account Link (OAuth)

| Field | Spec |
|-------|------|
| Purpose | OAuth link intent (connect/login/import purpose) |
| Route | `task.account-link` |
| Owner | Task Layer |
| API | Account links |
| Queries | `GET /account-links/{id}` |
| Mutations | `POST /account-links` · cancel |
| Loading | Pending provider |
| Empty | N/A |
| Pending | awaiting_provider · cancellable (non-trapping) |
| Error | failed · dismiss to origin |
| Permissions | Authenticated (or login purpose guest) |
| Navigation | Return origin · never trap |
| Realtime | Status optional · poll OK |
| Offline | Block start |
| Analytics | `account_link_progress` · `task_*` |
| A11y | Cancel always available |
| Composition | `FullscreenTask` · `ProgressIndicator` · Cancel |

### TSK-08 Steam Library Import

| Field | Spec |
|-------|------|
| Purpose | Import job progress · conflict resolution |
| Route | `task.steam-import` |
| Owner | Task Layer |
| API | Import jobs |
| Queries | `GET /import-jobs/{id}` |
| Mutations | `POST /import-jobs` · cancel · resolve |
| Loading | Progress |
| Empty | N/A |
| Pending | processing · needs_resolution UI |
| Error | failed honest · retry/cancel |
| Permissions | Owner · Steam connected or link first |
| Navigation | Dismiss → Library · never trap |
| Realtime | `import.progressed` preferred |
| Offline | Block |
| Analytics | `import_progress` · `task_*` |
| A11y | Status textual · resolution actions named |
| Composition | `FullscreenTask` · `ProgressIndicator` · resolution `List` · Cancel |

### TSK-09 Share

| Field | Spec |
|-------|------|
| Purpose | Share payload metadata + system share |
| Route | `task.share` |
| Owner | Task Layer |
| API | Share intents |
| Queries | — |
| Mutations | `POST /share-intents` |
| Loading | Brief |
| Empty | N/A |
| Pending | Creating intent |
| Error | Dismissible error |
| Permissions | Per object visibility |
| Navigation | System sheet · Dismiss |
| Realtime | None |
| Offline | Block or local-only system share without intent per policy |
| Analytics | `task_*` |
| A11y | Share actions labeled |
| Composition | `BottomSheet` · share actions |

### TSK-10 Report / Block

| Field | Spec |
|-------|------|
| Purpose | Abuse report and/or block |
| Route | `task.report-block` |
| Owner | Task Layer |
| API | Reports · Blocks |
| Queries | — |
| Mutations | `POST /reports` · `POST /blocks` |
| Loading | Form ready |
| Empty | N/A |
| Pending | Submit pending · Idempotency-Key |
| Error | Stay · retry |
| Permissions | Authenticated |
| Navigation | Dismiss origin |
| Realtime | None |
| Offline | Block |
| Analytics | `mutation_*` |
| A11y | Reasons labeled · confirm block |
| Composition | `BottomSheet`/`Modal` · reason list · confirm |

### TSK-11 Delete Confirmation

| Field | Spec |
|-------|------|
| Purpose | Confirm destructive delete |
| Route | `task.delete-confirm` |
| Owner | Task Layer |
| API | Target resource DELETE |
| Queries | — |
| Mutations | `DELETE` on posts/reviews/comments/collections/tier-lists/etc. |
| Loading | Instant |
| Empty | N/A |
| Pending | Delete pending |
| Error | Stay on confirm · retry |
| Permissions | Owner / policy |
| Navigation | Success dismiss · refresh origin |
| Realtime | None |
| Offline | Block |
| Analytics | `mutation_*` |
| A11y | Assertive confirm · focus Cancel safe default |
| Composition | `Modal` · `PrimaryButton`(destructive) · Cancel |

### TSK-12 Image / Media Picker

| Field | Spec |
|-------|------|
| Purpose | Select media · obtain upload grant |
| Route | `task.media-picker` |
| Owner | Task Layer |
| API | Uploads |
| Queries | — |
| Mutations | `POST /uploads/grants` · confirm after upload |
| Loading | Picker |
| Empty | Permission denied calm |
| Pending | Upload pending |
| Error | Retry · keep parent draft |
| Permissions | Authenticated |
| Navigation | Return URIs/keys to parent task |
| Realtime | None |
| Offline | Block upload |
| Analytics | `mutation_*` |
| A11y | Permission rationales |
| Composition | System picker bridge · `ProgressIndicator` |

### TSK-13 Filters / Sort

| Field | Spec |
|-------|------|
| Purpose | Apply filter/sort to host list |
| Route | `task.filters-sort` |
| Owner | Task Layer |
| API | None (local query params to host) |
| Queries | — |
| Mutations | — (host refetches) |
| Loading | Instant |
| Empty | N/A |
| Pending | N/A |
| Error | N/A |
| Permissions | Same as host |
| Navigation | Apply → host · Dismiss |
| Realtime | None |
| Offline | Local apply on cached |
| Analytics | `task_*` |
| A11y | Selected filters announced |
| Composition | `BottomSheet` · `FilterChip` · sort rows |

### TSK-14 Media Viewer

| Field | Spec |
|-------|------|
| Purpose | Fullscreen media inspection |
| Route | `task.media-viewer` |
| Owner | Task Layer |
| API | None (URLs from parent) |
| Queries | — |
| Mutations | — |
| Loading | Image load |
| Empty | Broken media error |
| Pending | — |
| Error | Retry image |
| Permissions | Same as parent object |
| Navigation | Dismiss · share optional |
| Realtime | None |
| Offline | Cached image if any |
| Analytics | `task_open` |
| A11y | Alt text from parent · dismiss control |
| Composition | `FullscreenTask` · `MediaViewer` |

---

# 18. Staff Stacks

Isolated `(staff)/` — never imported by player features (F6.2).

### STF-01 Moderator Home / Queue

| Field | Spec |
|-------|------|
| Purpose | Moderation queue |
| Route | `staff.mod.queue` |
| Owner | Moderator |
| API | Staff moderation |
| Queries | `GET /api/v1/staff/moderation/queue` |
| Mutations | — (open report) |
| Loading | Skeleton |
| Empty | Queue empty calm |
| Pending | Pagination |
| Error | Retry · authz denial → leave staff |
| Permissions | Staff mod+ |
| Navigation | STF-02 · leave overlay |
| Realtime | Optional staff channel |
| Offline | Cached queue · block resolutions |
| Analytics | `screen_view` (staff) |
| A11y | Queue items named |
| Composition | `List` queue rows |

### STF-02 Report Detail (Staff)

| Field | Spec |
|-------|------|
| Purpose | Resolve a report |
| Route | `staff.mod.report.[id]` |
| Owner | Moderator |
| API | Staff moderation |
| Queries | `GET /staff/moderation/reports/{id}` |
| Mutations | `POST …/resolution` |
| Loading | Skeleton |
| Empty | N/A |
| Pending | Resolve pending |
| Error | Stay · retry |
| Permissions | Staff mod+ |
| Navigation | Subject Shared (read) · Back queue |
| Realtime | Optional |
| Offline | Block resolve |
| Analytics | `mutation_*` |
| A11y | Actions labeled |
| Composition | Detail · action form |

### STF-03 Admin Home · STF-04 Admin User / Content Tools

| Field | Spec |
|-------|------|
| Purpose | Admin overview and governed tools |
| Route | `staff.admin.home` · `staff.admin.tools` |
| Owner | Admin |
| API | Staff admin |
| Queries | `GET /staff/admin/overview` · users/content GETs |
| Mutations | `POST /staff/admin/users/{id}/actions` (governed) |
| Loading | Skeleton |
| Empty | Overview empty sections OK |
| Pending | Action pending |
| Error | Authz · retry |
| Permissions | Staff admin |
| Navigation | Tool surfaces · leave overlay without rewriting player roots |
| Realtime | Optional |
| Offline | Block admin mutations |
| Analytics | staff `mutation_*` |
| A11y | Destructive confirms |
| Composition | Admin chrome · forms · lists |

---

# PART F — CLOSE

---

# 19. Cross-Cutting Permission Matrix (summary)

| Class | Screens |
|-------|---------|
| Guest (preview) | Soft-Gate · public Shared reads · Discover preview per policy |
| Player | All main roots · tasks · settings · messages |
| Optional integrations | Never gate core screens (Library · Home · Discover · Profile usable with zero connections) |
| Community membership | Community write/compose · some reads |
| Staff mod/admin | Staff stack only |
| Privacy | Other user lists/stats/achievements may indistinguishably empty |

---

# 20. Anti-Patterns

| Banned |
|--------|
| Visual / Figma / UX redesign in this contract |
| IA changes · sixth tab · new screens · Version 2 screens |
| Duplicating Shared Destinations under tabs |
| Treating tasks as destinations |
| Requiring Steam/Discord to use the product |
| Engagement bait empty/loading/error copy |
| Countdown FOMO architecture on Events |
| Steam achievements as GMRLOG Achievement screens |
| Realtime required for correctness |
| Analytics that score / streak / shame |
| Inventing API endpoints not in S1 (except SHCM-05 note → Amendment first) |
| Component visual invention beyond F5.4 / DS families (S4 owns implementation contracts) |

---

# 21. Audit Checklist

- [ ] Every MVP (non-Future) F5.3 screen has a contract with all required fields  
- [ ] Routes project F5.1 §32 / F6.2 strata — no invented families  
- [ ] Owner matches F5.3 / F5.1 ownership matrix  
- [ ] Queries/mutations reference S1 only  
- [ ] Loading · empty · pending · error specified per F5.4 honesty  
- [ ] Permissions · navigation · realtime · offline · analytics · a11y · composition present  
- [ ] Shared Destinations singular · tasks return to origin  
- [ ] Optional integrations never gate core navigation  
- [ ] Future/V2 screens excluded  
- [ ] No UI redesign · no Figma · no IA change  
- [ ] Gate: stop — do not continue to S4  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Phase S3 — Screen Specification** delivered as **DRAFT**.

This document is the working screen implementation contract for Version 1 MVP under F1–F6 and the Phase S charter.

Stop.

Do **NOT** continue to Sprint S4 until S3 is explicitly advanced / **LOCKED** by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md`](./PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md) | Phase S charter |
| [`F5_3_SCREEN_SPECIFICATIONS.md`](../05_PRODUCT_ARCHITECTURE/F5_3_SCREEN_SPECIFICATIONS.md) | Screen catalog SSOT |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | Routes · ownership |
| [`F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | State · component behaviour |
| [`F6_2_FRONTEND_ARCHITECTURE.md`](../06_ENGINEERING/F6_2_FRONTEND_ARCHITECTURE.md) | Expo Router · offline · a11y |
| [`S1_API_SPECIFICATION.md`](./S1_API_SPECIFICATION.md) | Endpoints |
| [`S2_DATABASE_SPECIFICATION.md`](./S2_DATABASE_SPECIFICATION.md) | Persistence behind screens |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — S3 screen implementation contracts for all MVP F5.3 screens: purpose · route · owner · API · queries · mutations · loading/empty/pending/error · permissions · navigation · realtime · offline · analytics · a11y · composition; Future/V2 excluded; no UI/UX/IA redesign; gate before S4 |
