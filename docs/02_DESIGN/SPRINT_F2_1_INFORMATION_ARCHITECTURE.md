# GMRLOG — Sprint F2.1: Navigation & Information Architecture Freeze

**Document:** `docs/02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.1 (Architecture Only)  
**Last Updated:** July 2026  
**Owner:** Lead UX Architecture / Information Architecture  
**Classification:** Frozen application navigation & IA

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | **This document** — locked nav + IA |
| 5 | `DESIGN_SYSTEM.md` · `COMPONENT_LIBRARY.md` · `DESIGN_TOKENS.md` · `SCREEN_SPECIFICATIONS.md` |

**Scope:** Architecture only. No final UI, Figma screens, React Native, colors, spacing, typography, or pixel layouts.

**Amendment note:** This document **amends Master §9** tab labels from `Games` / `Search` to **`Library` / `Discover`** (same pillars and destinations). Future tab changes require amending **this file** and Master §9 together.

**Gate:** Stop after freeze. Do **not** start Sprint F2.2 in this deliverable.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Navigation Philosophy |
| 2 | Navigation Graph |
| 3 | Information Architecture |
| 4 | Screen Inventory |
| 5 | User Flows |
| 6 | Stack Hierarchy |
| 7 | Modal Hierarchy |
| 8 | Deep Link Structure |
| 9 | Accessibility |
| 10 | Future Expansion |
| 11 | Architecture Audit Checklist |

---

# 1. Navigation Philosophy

## 1.1 Ecosystem, not a pile of screens

GMRLOG is one **culture operating system**. Navigation must make the six pillars feel connected:

Library · Logging · Social · Discovery · Identity · Communities

Users always know:

1. **Where they are** (tab + stack title + context)  
2. **Where they came from** (predictable back / dismiss)  
3. **Where they can go next** (consistent entry points)

## 1.2 Principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Orientation first** | Every surface declares place in the graph |
| 2 | **Pillar balance** | No tab is “Reviews-only”; Home mixes pillars |
| 3 | **Composer is an action, not a place** | No permanent Compose tab |
| 4 | **Stacks own domains** | Cross-cutting entities (Game, Post, Review) use shared stacks presented from the active tab |
| 5 | **Modals for tasks; screens for destinations** | Create/edit/filter/share → modal layers; browse/read → push |
| 6 | **Deep links restore context** | URL → tab + stack + screen, not orphan pages |
| 7 | **Roles add chrome, not a second app** | Admin/Mod/Premium/Dev enter via gates; same IA roots |
| 8 | **Adapt chrome, never IA** | Phone / tablet / desktop / foldable change presentation only |
| 9 | **Back is sacred** | Hardware back, gesture, header back, and dismiss are consistent |
| 10 | **Freeze = contract** | New screens must declare parent stack + entry + exit here first |

## 1.3 Composer decision (FAB vs contextual)

| Option | Verdict |
|--------|---------|
| Permanent 6th tab “Create” | **Rejected** — wastes primary navigation; Composer is not a destination |
| FAB only, everywhere | **Rejected** — noisy on Profile/Settings; fights content |
| **Hybrid (LOCKED)** | **FAB on Home** (primary compose hub) + **contextual create** on Library / Discover / Game / Profile (Log, Add to shelf, New collection, etc.) |

Compose sheet offers: Post · Log / Review · Collection · Tier List (permissions apply). Single entry mental model; multiple contextual shortcuts.

---

# 2. Navigation Graph

## 2.1 Root layers

```
RootNavigator
├── Boot
│     Splash
│     Loading / Session Restore
├── AuthGate
│     AuthenticationStack          (Guest)
│     OnboardingStack              (Authenticated, incomplete)
├── MainApp                        (Authenticated, onboarded)
│     TabNavigator                 (Bottom / Rail / Top — responsive)
│     └── per-tab StackNavigators
├── RoleOverlays                   (optional parallel roots)
│     AdminStack
│     ModeratorStack
├── ModalLayer                     (global)
├── FullScreenLayer                (global)
└── OverlayLayer                   (toasts, banners, tooltips)
```

### Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Splash** | Brand moment; no decisions |
| **Loading** | Session restore, token refresh, remote config; block Main until safe |
| **Authentication** | Login, register, OAuth, password reset — guest only |
| **Onboarding** | Taste/platforms/follows — once per account (skippable policy product-owned) |
| **Main App** | Primary ecosystem; tabs + stacks |
| **Modal Layer** | Task flows that return to same place (compose, filters, share, pickers) |
| **Full Screen Layer** | Immersive or multi-step (media viewer, tier editor, onboarding subflows) |
| **Overlay Layer** | Non-blocking feedback (toast, snackbar, system banner) |
| **Deep Link Entry** | Resolve URL → Boot/Auth/Main + target; queue if gated |

## 2.2 Audience flows (roots)

| Flow | Who | Root |
|------|-----|------|
| **Guest** | Signed out | AuthStack; limited public deep links (game/user preview → soft gate) |
| **Authenticated** | Player | MainApp |
| **Premium** (future) | Entitled player | Same MainApp; Premium surfaces via Profile/Settings/Creator — **no separate tab bar** |
| **Developer** (future) | Verified dev/studio | MainApp + Developer Hub entry (Profile / Settings); optional Dev stack push |
| **Moderator** | Staff mod | MainApp + Moderator Stack entry (overflow / Settings) |
| **Admin** | Staff admin | Admin Stack (may replace or sit above Main; never hijacks bottom tabs for players) |

Premium / Developer do **not** get extra bottom tabs.

## 2.3 Bottom Navigation (LOCKED)

### Tab order (left → right)

| Index | Tab ID | Label | Primary pillars | Root screen |
|------:|--------|-------|-----------------|-------------|
| 0 | `home` | Home | Social · Logging · Discovery | Activity Feed |
| 1 | `discover` | Discover | Discovery · Communities | Discover Hub |
| 2 | `library` | Library | Library · Logging | Library Hub |
| 3 | `notifications` | Notifications | Social · System | Notifications List |
| 4 | `profile` | Profile | Identity | Own Profile |

**Five tabs only.** Composer is not a tab.

### Icons (semantic, not assets)

| Tab | Icon concept | Selected |
|-----|--------------|----------|
| Home | Home / house | Filled |
| Discover | Compass / search-discover | Filled |
| Library | Grid / shelves | Filled |
| Notifications | Bell | Filled |
| Profile | Person | Filled |

Outline when unselected; filled when selected (F1 iconography). Pixel icons deferred to UI sprints.

### Labels

Short, localized later. English freeze: **Home · Discover · Library · Notifications · Profile**.

### Badge behavior

| Tab | Badge |
|-----|--------|
| Home | None (feed freshness is in-content) |
| Discover | None by default |
| Library | None by default |
| Notifications | Numeric unread (cap `99+`); clear on visit or per-item read policy |
| Profile | Dot only for critical account/security cues (rare) |

### Long-press behavior

| Tab | Long-press |
|-----|------------|
| Home | Jump to feed top / refresh affordance (architecture: “reset stack to root + scroll top”) |
| Discover | Focus Search field (push Search if not focused) |
| Library | Quick: Wishlist / Backlog shortcuts (action sheet) |
| Notifications | Mark all read (confirm if destructive volume) |
| Profile | Switch account (future) / QR or share profile (future) — v1: open own profile root |

### Selected state & animation (behavioral freeze only)

- Exactly one selected tab.  
- Reselect selected tab → **pop to tab root** (standard pattern).  
- Indicator / color uses F1 Primary (ember) — no motion redesign here; duration per F1 `motion.duration.slow` (~220ms) when UI ships.  
- Cross-tab switch preserves each tab’s stack state (unless memory policy later).

### Future scalability

- Adding a 6th player tab requires **amending this LOCK**.  
- Communities / Messages become hubs under Discover or Profile overflow first — not new tabs until amendment.  
- Desktop: same five destinations as **Navigation Rail** or top tabs; order preserved.

## 2.4 Cross-cutting entity presentation

Game, Post, Review, Collection, Tier List, User (other), Community open via **shared domain stacks** pushed **on the active tab’s stack** (or global FullScreen when immersive). Back returns to the tab context that opened them.

---

# 3. Information Architecture

## 3.1 Feature → home (every feature belongs somewhere)

| Feature | Primary home | Also reachable from |
|---------|--------------|---------------------|
| Activity feed | Home | — |
| Reviews (browse mixed) | Home · Game · Profile | Discover search |
| Posts | Home · Profile · Game | Discover search |
| Games / ownership | Library | Discover · Search · deep link |
| Backlog / Wishlist | Library | Profile library segment |
| Collections | Library · Profile | Game · Search · Home cards |
| Tier Lists | Profile · Library (lists segment) | Home · Search · Game |
| Achievements | Profile · Game | Home activity |
| Communities | Discover (Communities hub) | Home · Search · Profile · [`SPRINT_F2_11_COMMUNITIES_GUILDS.md`](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) |
| Notifications | Notifications tab | Push / deep link |
| Messages | Profile overflow → Messages (Alpha+) | Deep link; **not** a bottom tab in freeze |
| Settings | Profile → Settings stack | Deep link |
| Bookmarks | Profile / Library saved (Future) | — |
| Premium Articles | Content object future; entry Profile Creator / Discover Editorial (Future) | — |
| Search (universal) | Discover (primary) · optional Home header | Global deep link |
| GameLog Timeline | Profile · Game | — |
| Moderation tools | Moderator stack | Notifications (mod queue) |
| Admin tools | Admin stack | — |
| Developer hub | Profile / Settings (Future) | — |
| Premium management | Profile → Premium / Settings (Future) | — |

## 3.2 Home IA

- Magazine Activity Feed (mixed pillars)  
- Entry: FAB Compose  
- Optional: following / for-you segments (product; same stack)  

## 3.3 Discover IA

> **Authority:** [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) + [`SPRINT_F2_10_DISCOVER_SEARCH.md`](./SPRINT_F2_10_DISCOVER_SEARCH.md) (Discover & Search ecosystem).

- Discover Hub (trending, recommendations, friends activity summary)  
- Universal Search (one ecosystem; intentional scopes)  
- Communities hub (phased) — [`SPRINT_F2_11_COMMUNITIES_GUILDS.md`](./SPRINT_F2_11_COMMUNITIES_GUILDS.md)  
- Guides entry (future)  
- Same Discovery values as Home — taste-first, not popularity-first; Discover = denser exploration  

## 3.4 Library IA

> **Authority:** [`SPRINT_F2_6_LIBRARY_COLLECTIONS.md`](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) (personal gaming archive).

- Continue Playing → Current Journey → Favorites → Recently Logged / Completed → Backlog → Wishlist → Collections → Tier Lists → Hidden Archive → Statistics  
- Push → Game Stack  
- Collections = curated museum; Wishlist = aspiration (no storefront)  
- Profile = Digital Home; Library = operational archive (same objects, different jobs)
## 3.5 Notifications IA

> **Authority:** [`SPRINT_F2_8_SOCIAL_COMMUNICATION.md`](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) (social umbrella) + [`SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md`](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) (Notifications & Activity Center).

- Categorized list (see §3.8)  
- Deep link out to domain stacks  
- Never infinite engagement  
- Activity Center = interaction memory (not a new tab)  

### Messages (architecture reminder)

- Profile overflow / deep link — **not** a bottom tab  
- Calm DM philosophy — not Discord (F2.8)  

## 3.6 Profile IA (sections order — LOCKED)

> **Authority:** [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) (identity / journey first).

1. Hero  
2. Identity (Gaming Identity)  
3. Current Journey  
4. Favorites  
5. Statistics  
6. Activity  
7. Reviews  
8. Posts  
9. Collections  
10. Tier Lists  
11. Achievements  
12. Game Graph  
13. Friends / Social  
14. Creator  
15. Future Premium  
(+ Settings entry for self)  

> **Creator publishing:** [`SPRINT_F2_12_CREATOR_PLATFORM.md`](./SPRINT_F2_12_CREATOR_PLATFORM.md)  

Other-user profile: same story hierarchy minus Settings/Premium management; plus Follow / Message.

## 3.7 Game destination IA (hierarchy — LOCKED)

> **Authority:** [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) (relationship-first).

1. Hero  
2. Personal Status / Relationship  
3. Friends Activity  
4. Community  
5. Reviews  
6. Posts  
7. Collections  
8. Tier Lists  
9. Achievements  
10. Statistics  
11. Related Games  
12. Articles / Guides / Mods (future)  

## 3.8 Notification categories

| Category | Examples |
|----------|----------|
| Social | Follow, like, comment, mention, message |
| Games | Friend playing, wishlist discount cue (future) |
| Reviews | Reply, helpful, quote |
| Collections | Follow, collaborate (future) |
| Achievements | Unlock, completion |
| System | Security, policy, sync |
| Moderation | Reports, strikes, appeals |
| Admin | Staff ops |
| Creator (future) | Article stats, editorial |

Filters by category; default “All”.

## 3.9 Search architecture (universal)

Single Search experience under **Discover**, query types:

| Type | Now / phase |
|------|-------------|
| Games | Core MVP |
| Users | Core MVP |
| Posts | Alpha |
| Reviews | Alpha |
| Collections | Alpha |
| Tier Lists | Alpha |
| Communities | Future |
| Articles | Future |

Results use segmented or typed tabs; empty query shows recent + trending. Search is **universal**, not game-only.

---

# 4. Screen Inventory

**Inventory only — no design.**  
Phases: **Core MVP** · **Alpha** · **Beta** · **Future**

### Boot & auth

| Screen | Phase |
|--------|-------|
| Splash | Core MVP |
| Session Loading | Core MVP |
| Login | Core MVP |
| Register | Core MVP |
| OAuth bridge | Core MVP |
| Forgot / Reset password | Core MVP |
| Onboarding — taste | Core MVP |
| Onboarding — platforms | Core MVP |
| Onboarding — follow suggestions | Alpha |

### Tabs — roots

| Screen | Phase |
|--------|-------|
| Home — Activity Feed | Core MVP |
| Discover — Hub | Core MVP |
| Discover — Search | Core MVP |
| Discover — Search Results | Core MVP |
| Library — Hub | Core MVP |
| Library — Segment lists (Owned/Backlog/Wishlist) | Core MVP |
| Notifications — List | Core MVP |
| Profile — Self | Core MVP |
| Profile — Other user | Core MVP |

### Domain — Game

| Screen | Phase |
|--------|-------|
| Game Detail | Core MVP |
| Game Reviews list | Core MVP |
| Game Posts / discussion list | Alpha |
| Game media gallery | Alpha |
| Related / recommendations | Alpha |
| Guides list | Future |

### Domain — Logging & reviews

| Screen | Phase |
|--------|-------|
| Log Game (modal/sheet) | Core MVP |
| Write / Edit Review | Core MVP |
| Review Detail | Core MVP |
| GameLog Timeline (embedded + full) | Alpha |

### Domain — Social content

| Screen | Phase |
|--------|-------|
| Post Detail | Core MVP |
| Compose Post | Core MVP |
| Comment Thread | Core MVP |
| Media Viewer | Core MVP |
| Bookmarks | Future |
| Article Reader / Editor | Future |

### Domain — Library objects

| Screen | Phase |
|--------|-------|
| Collection Detail (Shelf) | Core MVP |
| Create / Edit Collection | Core MVP |
| Tier List Detail | Core MVP |
| Tier List Editor (fullscreen) | Alpha |

### Communities & messaging

| Screen | Phase |
|--------|-------|
| Communities Hub | Beta |
| Community Home | Beta |
| Discussion Detail | Beta |
| Messages Inbox | Alpha |
| Conversation | Alpha |

### Profile & settings

| Screen | Phase |
|--------|-------|
| Followers / Following | Core MVP |
| Achievements | Alpha |
| Statistics | Alpha |
| Edit Profile | Core MVP |
| Settings Hub | Core MVP |
| Settings — Account / Privacy / Notifications / Appearance | Core MVP–Alpha |
| Premium manage | Future |
| Creator Tools hub | Future |

### System

| Screen | Phase |
|--------|-------|
| Empty / Error (patterns) | Core MVP |
| Block / Report | Core MVP |
| Share sheet host | Core MVP |

### Staff

| Screen | Phase |
|--------|-------|
| Moderator Home / Queue | Beta |
| Report Detail | Beta |
| Admin Home | Future |
| Admin user / content tools | Future |

### Developer (future)

| Screen | Phase |
|--------|-------|
| Developer Hub | Future |
| Title insights | Future |

Any new screen → add row here before UI sprint.

---

# 5. User Flows

## 5.1 Guest → member

```
Splash → Loading → Auth
  → Register / Login / OAuth
  → Onboarding (if required)
  → MainApp · Home
```

Soft gate: public Game/User deep link → preview → Auth → return to target.

## 5.2 Player: discover & log

```
Home | Discover | Library
  → Game Detail
  → Log (sheet) → optional Review (modal/fullscreen)
  → Share (sheet)
  → optional Profile (own) to see Timeline
```

## 5.3 Player: social conversation

```
Home → Post Detail → Comments → (future) Community Discussion
  → Back stack to Home
```

## 5.4 Player: search → library

```
Discover → Search → Game → Add to Collection / Wishlist
  → Library (tab) reflects ownership / shelves
```

## 5.5 Player: identity

```
Profile → section (Reviews | Collections | Tiers | Achievements | Stats)
  → entity detail → Back to Profile
```

## 5.6 Notifications

```
Push | Notifications tab → item
  → domain screen (Post/Review/Game/User/…)
  → Back to Notifications or tab root policy
```

## 5.7 Compose

```
Home FAB | contextual Create
  → Compose Sheet (Post | Log/Review | Collection | Tier)
  → editor modal/fullscreen
  → dismiss → originating context (+ optimistic feed insert when Home)
```

## 5.8 Moderation / Admin

```
Settings | deep link | notif
  → ModeratorStack | AdminStack
  → queue → detail → action → back
```

## 5.9 Premium / Developer (future)

```
Profile → Premium | Creator Tools | Developer Hub
  → feature surfaces inside MainApp
  → never new bottom tabs
```

---

# 6. Stack Hierarchy

Each stack: **Entry · Exit · Modal attachments · Deep links**.

### Authentication Stack

| | |
|--|--|
| **Entry** | Guest root; logout; session expiry |
| **Exit** | Success → Onboarding or MainApp |
| **Modals** | Legal webview, OAuth in-app browser |
| **Deep links** | `…/login`, `…/register`, reset tokens |
| **UX freeze** | [`SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md`](./SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md) |

### Onboarding Stack

| | |
|--|--|
| **Entry** | First login incomplete flags |
| **Exit** | Complete/skip → MainApp Home |
| **Modals** | None critical |
| **Deep links** | Rare; usually blocked until done |
| **UX freeze** | F2.2 — personalization (genres/platforms/…); not a tutorial |

### Home Stack

| | |
|--|--|
| **Entry** | Tab `home` |
| **Root** | Activity Feed |
| **Pushes** | Post, Review, Game, Profile(other), Collection, Tier, Community (via shared patterns) |
| **Exit** | Tab change (state kept); logout |
| **Modals** | FAB Compose family; share; report |
| **Deep links** | `gmrlog://home` |
| **Feed freeze** | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) + [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) |

### Discover Stack (Search Stack)

| | |
|--|--|
| **Entry** | Tab `discover` |
| **Root** | Discover Hub |
| **Pushes** | Search, Results, Community, Game, User, … |
| **Modals** | Filters sheet |
| **Deep links** | `gmrlog://discover`, `gmrlog://search?q=` |
| **Discovery freeze** | [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) + [`SPRINT_F2_10_DISCOVER_SEARCH.md`](./SPRINT_F2_10_DISCOVER_SEARCH.md) |

### Library Stack

| | |
|--|--|
| **Entry** | Tab `library` |
| **Root** | Library Hub |
| **Pushes** | Segment lists, Collection, Tier, Game |
| **Modals** | Add/status sheets; create collection |
| **Deep links** | `gmrlog://library`, wishlist/backlog paths |
| **Experience freeze** | [`SPRINT_F2_6_LIBRARY_COLLECTIONS.md`](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) |

### Notifications Stack

| | |
|--|--|
| **Entry** | Tab `notifications` |
| **Root** | Notifications List |
| **Pushes** | Rare; usually hand off to domain on active tab or push on this stack |
| **Modals** | Mark-all confirm |
| **Deep links** | `gmrlog://notifications` |
| **Social freeze** | [`SPRINT_F2_8_SOCIAL_COMMUNICATION.md`](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) |
| **Notifications freeze** | [`SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md`](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) |

### Profile Stack

| | |
|--|--|
| **Entry** | Tab `profile` (self) or push other user from anywhere |
| **Root** | Self Profile |
| **Pushes** | Followers, section list screens, Settings, Messages, entity details |
| **Modals** | Edit avatar; follow confirmations |
| **Deep links** | `gmrlog://user/{username}` |
| **Experience freeze** | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) + [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) |

### Settings Stack

| | |
|--|--|
| **Entry** | Profile → Settings |
| **Exit** | Pop to Profile |
| **Modals** | Destructive confirms |
| **Deep links** | `gmrlog://settings`, `gmrlog://settings/{section}` |
| **Agency freeze** | [`SPRINT_F2_20_SETTINGS_PERSONALIZATION.md`](./SPRINT_F2_20_SETTINGS_PERSONALIZATION.md) |

### Game Stack (shared)

| | |
|--|--|
| **Entry** | Push from any tab |
| **Root** | Game Detail |
| **Pushes** | Reviews list, media, related |
| **Modals** | Log, rate, add-to-collection, share |
| **Deep links** | `gmrlog://game/{id}` |
| **Experience freeze** | [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) + [`SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md`](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) |

### Post Stack (shared)

| | |
|--|--|
| **Entry** | Feed / profile / notification |
| **Root** | Post Detail |
| **Modals** | Compose reply; share; report |
| **Deep links** | `gmrlog://post/{id}` |

### Review Stack (shared)

| | |
|--|--|
| **Entry** | Feed / game / profile |
| **Root** | Review Detail |
| **Modals** | Edit (owner); share; spoiler confirm |
| **Deep links** | `gmrlog://review/{id}` |

### Collection Stack (shared)

| | |
|--|--|
| **Entry** | Library / profile / game / feed |
| **Root** | Collection Detail |
| **Modals** | Edit; add games picker |
| **Deep links** | `gmrlog://collection/{id}` |

### Tier List Stack (shared)

| | |
|--|--|
| **Entry** | Profile / feed / search |
| **Root** | Tier Detail · Editor fullscreen |
| **Deep links** | `gmrlog://tierlist/{id}` |

### Messages Stack (Alpha+)

| | |
|--|--|
| **Entry** | Profile overflow / deep link — **not** a tab |
| **Deep links** | `gmrlog://messages`, `gmrlog://messages/{id}` |
| **Social freeze** | [`SPRINT_F2_8_SOCIAL_COMMUNICATION.md`](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) |

### Moderator Stack

| | |
|--|--|
| **Entry** | Role gate |
| **Deep links** | `gmrlog://mod/…` |
| **Trust freeze** | [`SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md`](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) |

### Admin Stack

| | |
|--|--|
| **Entry** | Role gate |
| **Deep links** | `gmrlog://admin/…` |
| **Trust freeze** | [`SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md`](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) |

---

# 7. Modal Hierarchy

## 7.1 Philosophy

| Pattern | When |
|---------|------|
| **Bottom Sheet** | Short tasks, pickers, filters, compose type chooser, share, log status — stays in context |
| **Dialog** | Confirms, destructive, permissions, errors needing decision |
| **Fullscreen Modal** | Long editors (review write, tier editor), media viewer, multi-step create |
| **Context Menu** | Long-press item actions (copy link, pin, report) |

Dismiss: swipe / scrim / close / hardware back → return to presenter. Nested modals: max practical depth **2**; prefer replace.

## 7.2 Action → pattern (LOCKED examples)

| Action | Pattern |
|--------|---------|
| Write / edit Review | Fullscreen Modal (editor) |
| Create Post | Fullscreen Modal or large Sheet (text-first) |
| Compose chooser (Post/Log/Collection/Tier) | Bottom Sheet |
| Log status / playtime quick | Bottom Sheet |
| Share | Bottom Sheet / system share sheet |
| Filters (search, library) | Bottom Sheet |
| Media Viewer | Fullscreen Modal |
| Game Picker | Bottom Sheet → optional fullscreen search |
| Report / Block | Dialog or Sheet → Dialog confirm |
| Delete content | Dialog |
| Mark all notifications read | Dialog if high count; else Sheet action |
| Image crop / avatar | Fullscreen Modal |
| Spoiler reveal confirm (optional) | Dialog |

---

# 8. Deep Link Structure

Architecture only — no implementation.

## 8.1 Scheme

Primary app scheme: `gmrlog://`  
HTTPS app links (future parity): `https://gmrlog.com/...` → same route map.

## 8.2 Route map (frozen)

| URI | Target |
|-----|--------|
| `gmrlog://home` | Home tab root |
| `gmrlog://discover` | Discover tab root |
| `gmrlog://search?q={query}` | Discover → Search Results |
| `gmrlog://library` | Library tab root |
| `gmrlog://library/wishlist` | Library Wishlist segment |
| `gmrlog://library/backlog` | Library Backlog segment |
| `gmrlog://notifications` | Notifications tab |
| `gmrlog://game/{id}` | Game Detail |
| `gmrlog://review/{id}` | Review Detail |
| `gmrlog://post/{id}` | Post Detail |
| `gmrlog://user/{username}` | Profile (self or other) |
| `gmrlog://collection/{id}` | Collection Detail |
| `gmrlog://tierlist/{id}` | Tier List Detail |
| `gmrlog://settings` | Settings Hub |
| `gmrlog://settings/{section}` | Settings section |
| `gmrlog://messages` | Messages Inbox (Alpha+) |
| `gmrlog://messages/{threadId}` | Conversation |
| `gmrlog://community/{id}` | Community Home (Beta+) |
| `gmrlog://mod/{path}` | Moderator (role-gated) |
| `gmrlog://admin/{path}` | Admin (role-gated) |
| `gmrlog://premium` | Premium surface (Future) |
| `gmrlog://auth/login` | Auth |
| `gmrlog://auth/reset?token=` | Reset password |

## 8.3 Resolution rules

1. Cold start → Splash/Loading → Auth if needed → then target.  
2. Warm start → switch tab if needed → push domain stack.  
3. Unauthorized role links → safe fallback + error toast.  
4. Unknown routes → Discover Hub or Home + non-blocking error.  
5. Compose intents (future): `gmrlog://compose?type=post` → Modal Layer.

---

# 9. Accessibility

| Area | Architecture rule |
|------|-------------------|
| **Back** | One clear path: gesture/header/hardware back = pop or dismiss modal; never trap |
| **Screen reader order** | Tab bar last or per platform convention; focus title/content first on push |
| **Focus order** | Header → primary content → primary CTA → secondary → tab bar |
| **Reachability** | Primary nav in thumb zone (bottom tabs mobile); FAB above tab bar, not obscuring critical content |
| **Gesture alternatives** | Every swipe-dismiss has Close control; every long-press has visible overflow menu equivalent |
| **Announcements** | Tab changes announce label; badge counts announced on Notifications tab |
| **Reduced motion** | Nav transitions respect F1 reduced-motion (instant/opacity) — no IA change |

---

# 10. Future Expansion

| Change | Allowed without IA amend? |
|--------|---------------------------|
| New screen under existing stack | **No** — add to §4 inventory + parent stack |
| New bottom tab | **No** — amend LOCK |
| Messages as tab | **No** — currently Profile entry |
| Communities as tab | **No** — Discover hub first |
| Premium / Creator / Dev hubs | Yes as Profile/Settings children |
| Desktop rail | Yes if same five destinations + order |
| Bookmarks, Articles | Future inventory rows; Discover/Profile homes |
| Compose types (article) | Extend compose sheet types; content architecture Master §10 |

**Stability contract:** Tab set, modal philosophy, deep link scheme, Profile section order, Game hierarchy order remain until explicit version bump of this document.

---

# 11. Architecture Audit Checklist

Before approving any later frontend sprint:

- [ ] Screen listed in §4 with phase  
- [ ] Parent stack declared in §6  
- [ ] Entry + exit + back behavior clear  
- [ ] Modal vs push choice matches §7  
- [ ] Deep link added or N/A  
- [ ] Feature has a home in §3  
- [ ] Does not add a bottom tab  
- [ ] Does not make Composer a tab  
- [ ] Pillar balance preserved (not review-only nav)  
- [ ] Role surfaces don’t fork a second player IA  
- [ ] Responsive chrome change doesn’t change hierarchy  
- [ ] A11y back + focus + gesture alternatives considered  
- [ ] Master six pillars still reflected  
- [ ] F1 components sufficient (else F1 amend first)  

---

## Success criteria

| Criterion | Status |
|-----------|--------|
| Every future screen knows where it belongs | Met via §3–§4 |
| How users reach / leave it | Met via §5–§7 |
| Integrates with ecosystem | Met via §2 graph |
| Navigation redesign not required later | Met — LOCKED tabs + stacks |
| No UI / code / Figma in this sprint | Met |

---

## Final gate

### APPROVED

Sprint F2.1 Information Architecture is **LOCKED**.

Do **not** continue to Sprint F2.2 in this output.  
Next sprint may begin only after explicit product go-ahead, consuming this graph unchanged.

---

## Related documents

| Doc | Role |
|-----|------|
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | SSOT — §9 amended by this freeze |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | Components / nav chrome atoms |
| [SCREEN_SPECIFICATIONS.md](./SCREEN_SPECIFICATIONS.md) | Screen detail (must align to this IA) |
| [F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md](../03_UX/F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) | Navigation experience (subordinate on structure) |
| [F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | **DRAFT** Product architecture elaboration (must obey this freeze) |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Nav graph, tabs Home/Discover/Library/Notifications/Profile, stacks, modals, deep links, inventory, flows |
