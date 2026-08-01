# GMRLOG — Sprint F5.1: Information Architecture & Navigation Specification

**Document:** `docs/05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`  
**Version:** 1.1  
**Status:** **LOCKED**  
**Sprint:** F5.1 (Information Architecture & Navigation Specification — product architecture only) · amended by **MVP Final Integration Amendment** (§34)  
**Last Updated:** July 2026  
**Owner:** Product Architecture Director  
**Classification:** Product Architecture Specification

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution — especially [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) (**LOCKED** structural freeze) |
| 5 | Entire F3 UX Constitution — especially [`F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md`](../03_UX/F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) |
| 6 | Entire F4 UI Constitution — especially [`F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md`](../04_UI/F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md) |
| 7 | **This document** — Product Architecture Specification (structure of what exists) |

Never contradict previous freezes.

Never modify F1 · F2 · F3 · F4.

Never redefine navigation philosophy (F2.1 · F3.2).

Never redesign UX or UI.

This sprint specifies **PRODUCT STRUCTURE** only.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F2.1 | Locked navigation & IA contract — **structure law** |
| F3.2 | How navigation *feels* — experience law |
| F4 | How the UI *looks / systems* — visual law |
| **F5.1** | What exactly **exists** as product architecture — specification SSOT for structure |

On structural conflict with subordinate UX docs (`NAVIGATION_SPECIFICATION.md`, `INFORMATION_ARCHITECTURE.md`), **F2.1 wins**. This document must remain compatible with F2.1; it elaborates product ownership and architecture maps without inventing new primary destinations.

This sprint answers:

> “What exactly exists inside GMRLOG?”

rather than:

> “How should it look?”

| Does | Does not |
|------|----------|
| Define entire product IA · navigation hierarchy · screen ownership · grouping · deep-link *philosophy* · access · expansion | UI · colors · spacing · components · animations |
| Specify product structure as architecture SSOT | Engineering · React Navigation · Expo Router · URLs · folder structure · implementation |

**Gate:** Stop after this specification. Do **not** continue to Sprint F5.2.

---

## Scope

**In scope:** Entire product information architecture · top-level navigation · hierarchy · root destinations · global navigation model · screen ownership · parent–child relationships · entry/exit points · deep linking philosophy · screen & feature grouping · route *organization* (logical) · navigation state philosophy · modal navigation · global overlays · placement of Auth · Onboarding · Settings · Profile · Search · Notifications · Library · Reviews · Community · Lists · Game · User · Collection · Discovery · Activity · Admin isolation · future extensibility.

**Out of scope:**

| Forbidden |
|-----------|
| UI · colors · spacing · components · animations |
| Engineering · React Navigation · Expo Router · URLs · folder structure · code |
| New bottom tabs without F2.1 amendment |
| Sprint F5.2 |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Position · Laws · Product strata |
| B | 5–8 | Global model · Hierarchy tree · Navigation map · Ownership map |
| C | 9–16 | Core · Discovery · Personal · Social · Auth · Settings · System · Future reserved areas |
| D | 17–24 | Shared destinations · Modals · Overlays · Deep links · Nav state · Access · Consistency · Anti-fragmentation |
| E | 25–33 | Expansion · Diagrams · Placement summary · Screen catalog · Journeys · Logical routes · Pillar map · Audit · Gate |

Every product area (§9–16, §17 shared) defines:

| Field |
|-------|
| Purpose |
| Responsibilities |
| Owned features |
| Connected areas |
| Navigation rules |
| Access rules |
| Future expansion policy |

---

# PART A — FOUNDATION

---

# 1. Mission

Specify the complete product information architecture of GMRLOG so that every feature, screen, and destination has **exactly one architectural home**.

This document is the **Single Source of Truth for product structure** under F1–F4 law.

Implementation projects this structure.

Implementation must never invent parallel structure.

---

# 2. Architectural Position

| Question | Answered by |
|----------|-------------|
| What should GMRLOG be? | F2 |
| How should it feel? | F3 |
| How should it look / systematize visually? | F4 |
| **What exactly exists, and how is it organized?** | **F5.1 (this document)** |
| How is it produced / engineered? | Later F5 · frontend docs (subordinate) |

F5 begins where F4 ends ([F4.13](../04_UI/F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md)).

F5.1 is the first production-architecture specification: **structure before screens of paint**.

---

# 3. Immutable Structural Laws (inherited)

These laws are not redefined here — they are **binding inputs**:

| Law | Source |
|-----|--------|
| Five player destinations only: Home · Discover · Library · Notifications · Profile | F2.1 · Master §9 |
| Composer is an action, not a place — no Compose tab | F2.1 |
| Hybrid compose: primary compose hub on Home + contextual create elsewhere | F2.1 |
| Stacks own cross-cutting domains (Game, Post, Review, Collection, Tier, User, Community) | F2.1 |
| Modals for tasks; screens for destinations | F2.1 |
| Adapt chrome, never IA (F3.10 · F4.11) | F2.1 · F3 · F4 |
| Roles add chrome, not a second app | F2.1 |
| Back / dismiss remain sacred | F2.1 · F3.2 |
| Every screen declares one parent | F2.1 freeze contract · this spec |
| No duplicate architectural homes | This spec + F2.1 feature→home |

F5.1 **may not** invent a sixth player tab, a Create tab, or device-split IA.

---

# 4. Product Strata

The architecture separates the product into mutually exclusive **strata**. Every screen belongs to exactly one stratum (shared domain destinations are a special stratum that is *presented from* a tab but *owned* as shared).

| Stratum | Role |
|---------|------|
| **Core Product** | Primary player ecosystem — five roots + their tab stacks |
| **Discovery** | Explore / search / communities entry surfaces |
| **Personal** | Library · identity · collections · lists · memory |
| **Social** | Feed · posts · messages · activity attention |
| **Settings** | Control panel (entered via Profile) |
| **Authentication** | Guest gate · account formation |
| **System** | Boot · session · overlays · role tools |
| **Future Reserved** | Named expansion slots without premature destinations |

### Stratum diagram (text)

```
                    ┌─────────────────────────┐
                    │   SYSTEM (Boot/Session) │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
      AUTHENTICATION      MAIN APP (Core)    ROLE OVERLAYS
      (Guest gate)        five roots         (Admin / Mod)
                                │
        ┌───────────┬───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼           ▼
      HOME      DISCOVER    LIBRARY   NOTIFICATIONS  PROFILE
   (Social+)   (Discovery) (Personal)   (Social+)   (Personal+
                                                     Settings entry)
                                │
                    SHARED DOMAIN DESTINATIONS
              Game · Post · Review · Collection · Tier · User · Community
                                │
                    MODAL / FULLSCREEN / OVERLAY LAYERS
```

---

# PART B — GLOBAL MODEL

---

# 5. Global Navigation Model

## 5.1 Root layers (product architecture)

| Layer | Purpose | Audience |
|-------|---------|----------|
| Boot | Session restore / safe start | All |
| Authentication | Establish identity | Guest |
| Onboarding | Minimal account readiness | Authenticated, incomplete |
| Main App | Primary Digital Home | Authenticated, ready |
| Role Overlays | Staff tools | Role-gated |
| Modal Layer | Task flows returning to place | Player / staff |
| Fullscreen Layer | Immersive multi-step tasks | Player / staff |
| Overlay Layer | Non-blocking feedback | All |

## 5.2 Top-level navigation (player)

| Order | Destination ID | Label | Root surface |
|------:|----------------|-------|--------------|
| 0 | `home` | Home | Activity Feed |
| 1 | `discover` | Discover | Discover Hub |
| 2 | `library` | Library | Library Hub |
| 3 | `notifications` | Notifications | Notifications List |
| 4 | `profile` | Profile | Own Profile |

Presentation may be bottom tabs / rail / top (F4.11) — **order and meaning frozen**.

## 5.3 Parent–child law

| Law |
|-----|
| Every screen has **exactly one parent** architectural group |
| No screen belongs to two strata as primary owner |
| Shared domain destinations have one **owner stack**; presentation context may be any active tab |
| No duplicate navigation paths to the same responsibility with competing homes |
| No hidden feature clusters outside Feature → Home map |

## 5.4 Entry and exit (global)

| Concept | Rule |
|---------|------|
| Entry | Declared: tab root · stack push · modal open · deep-link resolve · role gate |
| Exit | Declared: back · dismiss · tab change · logout · role leave |
| Orphan screens | Forbidden |
| Dead ends without exit | Forbidden for player-critical paths |

---

# 6. Complete Hierarchy Tree

```
PRODUCT
├── SYSTEM
│   ├── Boot / Splash
│   ├── Session Restore
│   ├── Overlay Layer (toast / banner)
│   └── Role Overlays
│       ├── Admin Stack
│       └── Moderator Stack
│
├── AUTHENTICATION
│   ├── Login
│   ├── Register
│   ├── OAuth continuation
│   ├── Password reset
│   └── Soft-gate / public preview bridge
│
├── ONBOARDING
│   ├── Readiness steps (taste / platforms / follows — product-owned skip policy)
│   └── Optional connect step (Steam Sync · skippable — never a wall)
│
├── CORE PRODUCT — MAIN APP
│   ├── HOME (tab)
│   │   ├── Activity Feed (root)
│   │   ├── Home stack pushes (contextual)
│   │   └── Compose entry (primary hub — action, not child tab)
│   │
│   ├── DISCOVER (tab)
│   │   ├── Discover Hub (root)
│   │   ├── Universal Search
│   │   ├── Filters / sort (task surfaces)
│   │   ├── Communities Hub entry
│   │   ├── Events Hub entry
│   │   ├── Recommendation surfaces (semantic similarity presentation)
│   │   └── Discovery result → shared destinations
│   │
│   ├── LIBRARY (tab)
│   │   ├── Library Hub (root)
│   │   ├── Shelves / status views
│   │   ├── Wishlist
│   │   ├── Backlog
│   │   ├── Collections index
│   │   ├── Tier lists index
│   │   ├── Library Import entry (Steam Sync → import task layer)
│   │   └── Hidden Archive (access-gated)
│   │
│   ├── NOTIFICATIONS (tab)
│   │   ├── Notifications List (root)
│   │   ├── Activity Center (segment / stack child — not a new tab)
│   │   └── Deep-out to shared destinations
│   │
│   └── PROFILE (tab)
│       ├── Own Profile (root)
│       ├── Profile sections (identity hierarchy — F2.5 order)
│       ├── Achievements section (GMRLOG achievements — F2.14)
│       ├── Connected Accounts entry (Steam · Discord → Settings account section)
│       ├── Other User (via User destination)
│       ├── Messages entry (overflow — not a tab)
│       ├── Creator / Premium / Developer hub entries (future — children)
│       └── Settings entry → SETTINGS stratum
│
├── SETTINGS
│   └── Settings Stack (sections: account → Connected Accounts, privacy, notifications prefs, accessibility, about, …)
│
├── SHARED DOMAIN DESTINATIONS
│   ├── Game
│   ├── Post
│   ├── Review
│   ├── Collection
│   ├── Tier List
│   ├── User (other)
│   ├── Community (detail · feed · members · activity)
│   ├── Event (game · community · tournament · seasonal)
│   └── Achievement (GMRLOG achievement detail)
│
└── FUTURE RESERVED
    ├── Additional hubs under Discover / Profile (not new tabs)
    ├── Enterprise / Studio surfaces (F2.24) as gated children
    └── Extensibility surfaces (F2.28) as gated children
```

---

# 7. Navigation Map

## 7.1 Primary paths (player)

| From | To | Mechanism |
|------|----|-----------|
| Any tab root | Another tab root | Top-level navigation switch (stack state preserved per F2.1) |
| Tab content | Shared domain | Push shared destination in active presentation context |
| Home | Compose task | Action → modal / fullscreen task |
| Discover | Search / Communities / Game / User | Push / task |
| Library | Game / Collection / Tier | Push shared or library child |
| Notifications | Source object | Deep-out to shared destination |
| Profile | Settings / Messages / hubs | Push child stacks |
| Guest deep link | Auth → queued target | Soft gate |
| Incomplete account | Onboarding → Home | Gate |

## 7.2 Forbidden maps

| Forbidden |
|-----------|
| Compose as sixth destination |
| Messages / Communities / Settings / Admin as player top-level destinations |
| Parallel “mobile IA” vs “desktop IA” |
| Two parents claiming the same screen |
| Engagement funnel that traps Back |

---

# 8. Feature Ownership Map

Every feature has one **home**.

| Feature cluster | Architectural home | Notes |
|-----------------|--------------------|-------|
| Activity feed / culture heartbeat | Home | F2.7 |
| Compose (post / log / review / collection / tier) | Action from Home (+ contextual) | Not a place |
| Universal search | Discover | F2.10 |
| Taste discovery hubs | Discover | |
| Communities / Guilds hub | Discover (entry) | F2.11 — not a tab |
| Events hub / upcoming events | Discover (entry) | F2.15 — not a tab |
| Semantic recommendation surfaces | Discover (owner) · Home / Game / Collection (presentation slots) | F2.19 — similarity presentation only · no algorithm here |
| Library archive / shelves | Library | F2.6 |
| Library import (Steam Sync) | Library (entry) → task layer | F2.21 — optional · never required |
| Wishlist / backlog | Library | |
| Collections / tier lists (indexes) | Library | Detail = shared stacks |
| Notifications list | Notifications | F2.9 |
| Activity Center | Notifications child | Not a tab |
| Own identity / Digital Home | Profile | F2.5 |
| GMRLOG achievements (own progress) | Profile section | F2.14 · detail = Shared Achievement |
| Connected Accounts (Steam · Discord) | Settings → account section (entry from Profile) | F2.21 · linking = task layer |
| Other user identity | Shared User destination | |
| Messages | Profile overflow → Messages stack | Alpha+ · not a tab |
| Settings | Profile → Settings | |
| Game relationship surfaces | Shared Game | F2.4 |
| Post / Review detail | Shared Post / Review | |
| Auth / OAuth / reset | Authentication | F2.2 |
| Onboarding readiness | Onboarding | F2.2 |
| Admin tools | Admin stack | Isolated |
| Moderation tools | Moderator stack | Isolated |
| Premium / Creator / Developer hubs | Profile / Settings children | Future · no new tabs |

---

# PART C — PRODUCT AREAS

---

# 9. Core Product — Home

### Purpose

The living room of Digital Home: culture heartbeat — *what happened / what matters in my gaming world* (F2.7 · F3.8).

### Responsibilities

| Owns |
|------|
| Activity Feed root |
| Primary compose hub entry (action) |
| Orientation into shared social/logging objects |

### Owned features

Feed surfaces · compose chooser entry · contextual jumps into Post / Review / Game / User.

### Connected areas

Discover (explore further) · Notifications (attention) · Profile (identity) · Shared domains.

### Navigation rules

| Rule |
|------|
| Root = Activity Feed |
| Reselect Home → return to feed root (F2.1) |
| Compose opens task layer — does not navigate to a Compose place |
| Cross-links push shared destinations |

### Access rules

Authenticated + onboarded for full feed. Guest may soft-gate on restricted actions.

### Future expansion policy

New feed modules attach to Home ownership — they do not create tabs.

---

# 10. Discovery Area — Discover

### Purpose

Exploration wing: *what to explore next?* (F2.10) — distinct from Home’s *what happened?*.

### Responsibilities

| Owns |
|------|
| Discover Hub |
| Universal Search |
| Discovery filters / sort tasks |
| Communities Hub **entry** |

### Owned features

Search · discovery collections · community directory entry · taste-first browse surfaces.

### Connected areas

Shared Game / User / Community / Collection · Library (save / shelf actions) · Home.

### Navigation rules

| Rule |
|------|
| Root = Discover Hub |
| Search is primary discovery instrument — not a separate top-level destination |
| Communities entered from Discover (or deep link) — not a bottom destination |
| Results resolve into shared destinations |

### Access rules

Browse may allow broader guest preview; write/join actions may soft-gate (F2.2).

### Future expansion policy

New discovery surfaces nest under Discover. A Communities **tab** requires F2.1 amendment.

---

# 11. Personal Area — Library

### Purpose

Personal gaming archive and memory — shelves, not a store launcher (F2.6 · F3.7).

### Responsibilities

| Owns |
|------|
| Library Hub |
| Status / shelf views |
| Wishlist · Backlog |
| Collections index · Tier lists index |
| Hidden Archive (gated) |

### Owned features

Personal library states · collection/tier indexes · archive privacy surfaces.

### Connected areas

Shared Game / Collection / Tier · Profile (identity reflection) · Discover (add from explore).

### Navigation rules

| Rule |
|------|
| Root = Library Hub |
| Detail of a game/collection/tier uses shared destinations |
| Contextual create (collection / log) allowed — still actions |

### Access rules

Own library requires authenticated owner. Others’ collections appear via shared Collection / Profile paths.

### Future expansion policy

New shelf types remain Library children. Do not invent a second archive destination.

---

# 12. Social Area — Notifications & Activity

### Purpose

Attention desk and reconnect — not addiction rails (F2.9 · F3.9).

### Responsibilities

| Owns |
|------|
| Notifications List root |
| Activity Center as child / segment |
| Category organization of attention |

### Owned features

Unread attention · activity memory mode · deep-out to source objects.

### Connected areas

All shared domains · Home · Profile · System (security cues may also surface on Profile).

### Navigation rules

| Rule |
|------|
| Root = Notifications List |
| Opening an item exits to owning shared destination |
| Activity Center is **not** a sixth tab |
| Badge semantics per F2.1 (notifications unread) |

### Access rules

Authenticated. Staff categories remain role-gated if present.

### Future expansion policy

New notification classes map into existing categories / ownership — not new roots.

---

# 13. Personal + Identity — Profile

### Purpose

Digital Home / gamer identity — *who I am in gaming culture* (F2.5 · F3.7).

### Responsibilities

| Owns |
|------|
| Own Profile root |
| Locked section hierarchy (F2.5) |
| Entries to Settings · Messages · future hubs |

### Owned features

Identity surfaces · journey / reputation presentations (as owned by product freezes) · overflow entries.

### Connected areas

Settings · Messages · Shared User (others) · Library · Creator/Premium/Dev (future children).

### Navigation rules

| Rule |
|------|
| Tab Profile always opens **own** profile root |
| Other users use Shared User destination |
| Settings is a child stack — not a tab |
| Messages via overflow / deep link — not a tab |

### Access rules

Own profile: authenticated owner. Other profiles: visibility per privacy (F2.27 · F2.20).

### Future expansion policy

Hubs attach as Profile/Settings children. No Premium/Dev bottom tabs (F2.1).

---

# 14. Authentication Area

### Purpose

Establish and recover account identity; soft-gate public previews (F2.2).

### Responsibilities

| Owns |
|------|
| Login · Register · OAuth continuation · Password reset |
| Soft-gate bridge from public preview |

### Owned features

Credential / OAuth flows · reset · guest-limited preview handoff.

### Connected areas

Onboarding · Main App Home · queued deep-link targets.

### Navigation rules

| Rule |
|------|
| Lives **outside** Main App |
| Success → Onboarding or Main App Home per readiness |
| Soft gate: preview → Auth → resume queued destination |
| Not a tab · not a Home section |

### Access rules

Guest only for Auth stack. Authenticated users should not live in Auth roots.

### Future expansion policy

New auth methods remain Authentication children. No marketing wall as Auth replacement (F2.2 ethics).

---

# 15. Settings Area

### Purpose

Control panel of agency — privacy, preferences, account, accessibility (F2.20).

### Responsibilities

| Owns |
|------|
| Settings stack and sections |
| Preference destinations |

### Owned features

Account · privacy · notification preferences · accessibility · about / legal · session controls.

### Connected areas

Profile (entry) · System (security) · Auth (logout / account switch future).

### Navigation rules

| Rule |
|------|
| Entered from Profile (and deep link) |
| Never a player top-level destination |
| Sections are Settings children — one parent |

### Access rules

Authenticated owner. Some sections may be role-extended later without forking Settings into Admin.

### Future expansion policy

New preferences add sections — not new top-level nav.

---

# 16. System Area — Boot, Overlays, Admin Isolation

## 16.1 Boot / Session

### Purpose

Safe start and restore.

### Responsibilities

Splash · loading · session restore blocking Main until safe (F2.1).

### Navigation rules

No player browsing decisions on Splash. Exit → Auth or Main per session.

## 16.2 Global overlays

### Purpose

Non-blocking system communication (F4.8 Feedback kinship · F2.1 Overlay layer).

### Responsibilities

Toasts · banners · non-modal system notices.

### Navigation rules

Do not own destinations. Must not replace Notifications for durable attention.

## 16.3 Admin / Moderator isolation

### Purpose

Staff operations without hijacking player IA (F2.1 · F2.17).

### Purpose (Admin)

Staff ops home and tools.

### Purpose (Moderator)

Moderation queues and actions.

### Responsibilities

Role-gated stacks parallel to Main — chrome addition, not a second consumer product.

### Navigation rules

| Rule |
|------|
| Never replace player five destinations for ordinary players |
| Entry via role gate / overflow / Settings — not a player tab |
| Deep destinations role-gated |
| Player Back must not trap users in staff tools |

### Access rules

Role-required. Absence of role → inaccessible.

### Future expansion policy

New staff tools nest under Admin/Mod stacks. Do not leak into player tabs.

---

# PART D — SHARED DESTINATIONS & MECHANICS

---

# 17. Shared Domain Destinations

Shared destinations are first-class product rooms with **one owner stack** each. They are presented from the active tab context but are not owned by that tab.

## 17.1 Game

| Field | Specification |
|-------|----------------|
| Purpose | Relationship with one game (F2.4 · F3.8) |
| Responsibilities | Game detail hierarchy (LOCKED order in F2.1 / F2.4) |
| Owned features | Game meaning surfaces · library actions entry · social proof entry |
| Connected areas | Library · Discover · Home · Review · Collection · Community |
| Navigation rules | Push shared Game; back returns to presenter |
| Access rules | Public preview possible; actions may soft-gate |
| Future expansion | New game modules obey relationship-first hierarchy — no new tab |

## 17.2 Post

| Field | Specification |
|-------|----------------|
| Purpose | Social post destination |
| Responsibilities | Post detail · thread entry points |
| Owned features | Post read · engage · report paths |
| Connected areas | Home · Profile · Notifications · User · Community |
| Navigation rules | Shared Post stack |
| Access rules | Visibility + auth for write |
| Future expansion | Remains shared — not Home-only |

## 17.3 Review

| Field | Specification |
|-------|----------------|
| Purpose | Review as cultural object |
| Responsibilities | Review detail · edit tasks via modal/fullscreen |
| Owned features | Review read · authorship tasks |
| Connected areas | Game · Profile · Library · Home |
| Navigation rules | Shared Review stack |
| Access rules | Read per visibility; write authenticated |
| Future expansion | No Reviews tab |

## 17.4 Collection

| Field | Specification |
|-------|----------------|
| Purpose | Collection as cultural shelf object |
| Responsibilities | Collection detail |
| Owned features | View · edit tasks · share |
| Connected areas | Library index · Profile · Discover |
| Navigation rules | Shared Collection stack; indexes live in Library |
| Access rules | Owner vs public visibility |
| Future expansion | Indexes stay Library-owned |

## 17.5 Tier List

| Field | Specification |
|-------|----------------|
| Purpose | Tier list object |
| Responsibilities | Tier detail · editor as fullscreen task |
| Owned features | View · edit |
| Connected areas | Library · Profile · Game |
| Navigation rules | Shared Tier stack |
| Access rules | Owner vs public |
| Future expansion | Same pattern as Collection |

## 17.6 User (other)

| Field | Specification |
|-------|----------------|
| Purpose | Another player’s identity room |
| Responsibilities | Other-user profile surfaces |
| Owned features | Public identity · follow relations · entry to their content |
| Connected areas | Profile tab (self) · Home · Discover · Messages |
| Navigation rules | Never overload Profile tab root with other users |
| Access rules | Privacy-governed |
| Future expansion | Remains shared User |

## 17.7 Community

| Field | Specification |
|-------|----------------|
| Purpose | Community / guild room (F2.11) |
| Responsibilities | Community surfaces: Community Detail (root) · Community Feed · Community Members · Community Activity |
| Owned features | Community home · membership tasks · community-scoped feed and activity presentation |
| Connected areas | Discover hub entry · Home (community activity in feed) · Post · User · Game · Event |
| Navigation rules | Not a bottom destination; hub under Discover · sub-surfaces are children of Shared Community, never new roots |
| Access rules | Membership + visibility |
| Future expansion | Hub growth under Discover until F2.1 amendment |

Community sub-surfaces (MVP):

| Sub-surface | Role |
|-------------|------|
| Community Detail | Room identity + orientation |
| Community Feed | Community-scoped culture stream (objects remain shared) |
| Community Members | People of the room → Shared User |
| Community Activity | What happened in this room (no separate notification centre) |

## 17.8 Event

| Field | Specification |
|-------|----------------|
| Purpose | Time-bound cultural gathering (F2.15) — game event · community event · tournament · seasonal event |
| Responsibilities | Event Detail + participation state presentation |
| Owned features | Event meaning surfaces · participation tasks · related object entry |
| Connected areas | Discover (Events Hub) · Home (event activity) · Shared Community · Shared Game · Notifications |
| Navigation rules | Push Shared Event from presenter; never a bottom destination · never a parallel calendar app |
| Access rules | Public visibility possible; participation may soft-gate; community events follow community visibility |
| Future expansion | New event kinds are variants of one Event destination — not new destinations |

## 17.9 Achievement

| Field | Specification |
|-------|----------------|
| Purpose | Meaning of one GMRLOG achievement (F2.14) — never Steam achievements |
| Responsibilities | Achievement Detail: what it means · progress state · related objects |
| Owned features | Achievement meaning · progress presentation |
| Connected areas | Profile (Achievements section) · Home (achievement activity) · Shared User · Notifications |
| Navigation rules | Push Shared Achievement; index lives in Profile · no achievements tab |
| Access rules | Own progress private-by-default per F2.5 privacy law; public display is user-governed |
| Future expansion | New achievement families reuse the same destination — no new stratum |

---

# 18. Modal Navigation Philosophy (architecture)

| Pattern | Product role |
|---------|----------------|
| Bottom sheet / task sheet | Short tasks: compose chooser, filters, pickers, share, quick log |
| Dialog | Confirm / destructive / bulk attention actions |
| Fullscreen modal | Immersive multi-step: review editor, post create, tier editor, media, crop |
| Overlay | Non-blocking feedback |

| Law |
|-----|
| Tasks return to the same place |
| Destinations use push screens |
| Modal stacks do not become hidden parallel apps |
| Compose sheet options (architecture): Post · Log/Review · Collection · Tier List |

---

# 19. Global Overlays

| Owns | Does not own |
|------|----------------|
| Ephemeral feedback | Durable attention (Notifications) |
| System banners | Primary navigation |

Overlays must remain interruptible and non-trapping (F4.9 · F4.8).

---

# 20. Deep Linking Philosophy (no URLs)

Deep links are **destination resolutions**, not orphan pages.

| Law |
|-----|
| Resolve to: layer + tab/stack + screen + optional queued target |
| If gated → Auth / Onboarding → resume queue |
| Restore context — do not invent a sixth root |
| Role links stay role-gated |
| Exact URL schemes live in F2.1 / later engineering projections — **not redefined here** |

Logical destination families (architecture IDs, not URLs):

| Family | Examples of targets |
|--------|---------------------|
| Roots | home · discover · library · notifications · profile |
| Shared | game · post · review · collection · tierlist · user · community · event · achievement |
| Control | settings · messages · connected-accounts |
| Gate | login · register · onboarding |
| Staff | admin · mod |

---

# 21. Navigation State Philosophy

| Law |
|-----|
| Each top-level destination preserves its stack unless memory policy says otherwise (F2.1) |
| Reselect selected destination → pop to that root |
| Tab change is not Back |
| Modal dismiss restores underlying place |
| Logout clears Main ownership; Boot decides next root |
| Soft-gate queue is temporary state — not a destination |

---

# 22. Access Rules (architecture summary)

| Audience | Structural access |
|----------|-------------------|
| Guest | Auth + limited public shared previews |
| Player | Main five + shared + settings/messages per phase |
| Premium / Creator / Developer | Same Main; hub children — no extra top-level destinations |
| Moderator | Main + Moderator overlay |
| Admin | Admin overlay / stack — isolated |

---

# 23. Consistency Rules

| Rule |
|------|
| Same feature → same home |
| Same object type → same shared destination |
| Same task type → same modal class |
| Same audience → same root rules |
| Chrome adapts · IA does not (F4.11) |
| Naming of destinations matches F2.1 English freeze |

---

# 24. Anti-Fragmentation Rules

| Banned |
|--------|
| Second IA for desktop/web |
| Feature teams owning private roots |
| Duplicate homes for one feature |
| Hidden clusters reachable only by tribal knowledge |
| Stale five-tab models with Create center / without Library |
| Staff tools in player top-level nav |
| Forked “temporary” destinations that never declare parent |

---

# PART E — EXPANSION, DIAGRAMS, CLOSE

---

# 25. Future Extensibility & Expansion Rules

| Prefer | Require amendment of F2.1 + Master §9 |
|--------|--------------------------------------|
| Nest under Discover / Profile / Settings / Shared | New player top-level destination |
| New shared object stack with Feature→Home row | Parallel consumer app IA |
| Role overlay growth | Player tab for Admin/Mod |

Expansion checklist for any new screen:

1. Declare stratum  
2. Declare single parent  
3. Declare Feature → Home  
4. Declare entry / exit  
5. Declare access audience  
6. Declare modal vs destination  
7. Pass F2.29 · F3.12 · F4.12 gates where applicable  
8. Update this document  

---

# 26. Architecture Diagrams (text)

## 26.1 Audience → root

```
Guest ───────────────► AUTHENTICATION ──► (soft gate queue)
Auth complete, incomplete ► ONBOARDING ──► HOME
Auth complete, ready ─────► MAIN APP (five roots)
Staff role ───────────────► MAIN + ROLE OVERLAY
```

## 26.2 Feature → home (compact)

```
Feed/Compose hub ──────────────► HOME
Search/Communities entry ──────► DISCOVER
Archive/Shelves/Indexes ───────► LIBRARY
Attention list/Activity Center ► NOTIFICATIONS
Identity/Self + overflow ──────► PROFILE
Preferences ───────────────────► SETTINGS (via Profile)
Entities (Game/Post/…) ────────► SHARED
Account gate ──────────────────► AUTHENTICATION
Staff ─────────────────────────► ADMIN / MOD
```

## 26.3 Ownership vs presentation

```
OWNERSHIP (who is responsible)
    Library owns Collection INDEX
    Shared Collection owns Collection DETAIL

PRESENTATION (where it appears)
    Detail may open from Discover, Profile, Home, or Library
    Active tab context preserved; ownership unchanged
```

---

# 27. Architecture Audit Checklist

### Completeness
- [ ] Answers what exactly exists inside GMRLOG  
- [ ] Five player destinations only · Composer not a destination  
- [ ] Complete hierarchy tree present  
- [ ] Navigation map · feature ownership map present  
- [ ] Every area has Purpose · Responsibilities · Owned features · Connected · Nav · Access · Expansion  

### Separation
- [ ] Core · Social · Discovery · Personal · Settings · Authentication · System · Future Reserved separated  
- [ ] Admin isolated  
- [ ] Shared domains specified  

### Integrity
- [ ] Every screen has exactly one parent  
- [ ] No duplicate homes  
- [ ] No hidden clusters  
- [ ] Compatible with F2.1 · F3.2 · F4.11 · F4.13  
- [ ] Does not redefine UX/UI philosophy  
- [ ] No UI · colors · components · animations · URLs · folder structure · engineering  

### Readiness
- [ ] Expansion rules explicit  
- [ ] Anti-fragmentation explicit  
- [ ] Deep-link philosophy without URL invention  
- [ ] Ready for F5.2 (when opened)  

---

# 28. Onboarding Placement (dedicated)

| Field | Specification |
|-------|----------------|
| Purpose | Bring authenticated users to minimal readiness |
| Responsibilities | Readiness steps only — not product tour theater |
| Owned features | Taste / platforms / follows (as product-owned) |
| Connected areas | Auth success · Main Home |
| Navigation rules | Outside Main; blocks incomplete users per policy |
| Access rules | Authenticated incomplete |
| Future expansion | Steps may change; placement does not become a tab |

---

# 29. Reviews · Lists · Activity · Search Placement (summary table)

| Concept | Placement |
|---------|-----------|
| Search | Discover (primary); optional contextual focus from Home long-press behavior per F2.1 — still Discover-owned |
| Reviews (detail) | Shared Review |
| Reviews (create/edit) | Task layers; not a Reviews root |
| Lists / shelves indexes | Library |
| Activity Center | Notifications child |
| Game pages | Shared Game |
| User pages | Profile (self) · Shared User (other) |
| Collection pages | Shared Collection (detail) · Library (index) |
| Discovery pages | Discover |
| Community pages | Shared Community · Discover hub entry |

---

# 30. Screen Inventory by Parent (architecture catalog)

This catalog lists **architectural screens** (destinations and task surfaces), not UI layouts. Each row has one parent.

## 30.1 System parents

| Screen | Parent | Kind |
|--------|--------|------|
| Splash | Boot | System |
| Session Restore / Loading | Boot | System |
| Toast / Banner host | Overlay Layer | System |
| Admin Home | Admin Stack | System / Staff |
| Admin tool surfaces | Admin Stack | System / Staff |
| Moderator Home | Moderator Stack | System / Staff |
| Moderator queues | Moderator Stack | System / Staff |

## 30.2 Authentication & Onboarding parents

| Screen | Parent | Kind |
|--------|--------|------|
| Login | Authentication | Gate |
| Register | Authentication | Gate |
| OAuth continuation | Authentication | Gate |
| Password reset | Authentication | Gate |
| Public preview bridge | Authentication | Gate |
| Onboarding readiness steps | Onboarding | Gate |
| Optional connect step (Steam) | Onboarding | Gate (skippable) |
| Account link (OAuth) task | Authentication / Settings → Modal | Task |

## 30.3 Home parents

| Screen | Parent | Kind |
|--------|--------|------|
| Activity Feed | Home | Root destination |
| Home-contextual pushes (none owned exclusively) | Home stack context | Presentation only |

Compose chooser / editors are **task layer** children of Modal/Fullscreen — not Home destinations.

## 30.4 Discover parents

| Screen | Parent | Kind |
|--------|--------|------|
| Discover Hub | Discover | Root destination |
| Universal Search | Discover | Destination |
| Search results | Discover | Destination |
| Filter / sort sheet | Discover → Modal | Task |
| Communities Hub | Discover | Destination (hub) |
| Events Hub | Discover | Destination (hub) |
| Recommendation surfaces (semantic) | Discover | Presentation within destinations |

## 30.5 Library parents

| Screen | Parent | Kind |
|--------|--------|------|
| Library Hub | Library | Root destination |
| Shelf / status views | Library | Destination |
| Wishlist | Library | Destination |
| Backlog | Library | Destination |
| Collections index | Library | Destination |
| Tier lists index | Library | Destination |
| Library Import entry | Library | Destination (entry) |
| Steam import task (progress · review · resolve) | Library → Task layer | Task |
| Hidden Archive | Library | Destination (gated) |

## 30.6 Notifications parents

| Screen | Parent | Kind |
|--------|--------|------|
| Notifications List | Notifications | Root destination |
| Activity Center | Notifications | Destination (child) |
| Category filtered lists | Notifications | Destination |

## 30.7 Profile parents

| Screen | Parent | Kind |
|--------|--------|------|
| Own Profile | Profile | Root destination |
| Profile section surfaces (per F2.5 order) | Profile | Destination sections |
| Achievements section (index + progress) | Profile | Destination section |
| Overflow sheet (Messages / hubs entry) | Profile → Modal | Task entry |
| Creator / Premium / Developer hub shells (future) | Profile or Settings | Destination children |

## 30.8 Settings parents

| Screen | Parent | Kind |
|--------|--------|------|
| Settings root | Settings | Destination |
| Account | Settings | Section |
| Privacy | Settings | Section |
| Notification preferences | Settings | Section |
| Accessibility | Settings | Section |
| Connected Accounts (Steam · Discord) | Settings → Account | Section |
| About / legal | Settings | Section |
| Session / security controls | Settings | Section |

## 30.9 Shared destination parents

| Screen | Parent | Kind |
|--------|--------|------|
| Game Detail (+ locked hierarchy children) | Shared Game | Destination |
| Post Detail | Shared Post | Destination |
| Review Detail | Shared Review | Destination |
| Collection Detail | Shared Collection | Destination |
| Tier List Detail | Shared Tier | Destination |
| Other User Profile | Shared User | Destination |
| Community Detail | Shared Community | Destination |
| Community Feed | Shared Community | Destination (child) |
| Community Members | Shared Community | Destination (child) |
| Community Activity | Shared Community | Destination (child) |
| Event Detail | Shared Event | Destination |
| Achievement Detail | Shared Achievement | Destination |

## 30.10 Messages (phase Alpha+)

| Screen | Parent | Kind |
|--------|--------|------|
| Messages inbox | Messages Stack (entered from Profile) | Destination |
| Conversation | Messages Stack | Destination |

Messages Stack’s architectural home remains **Profile overflow** — not a top-level destination.

---

# 31. Canonical User Journeys (structure only)

These journeys validate ownership; they do not specify UI.

### 31.1 Guest → member

```
Public shared preview (optional)
  → soft gate
  → Authentication
  → Onboarding (if incomplete)
  → Main App · Home
  → (resume queued shared destination if any)
```

### 31.2 Explore → relationship → memory

```
Discover Hub / Search
  → Shared Game
  → contextual library action (task)
  → Library reflects ownership (Library home)
```

### 31.3 Culture heartbeat → conversation

```
Home · Activity Feed
  → Shared Post or Review
  → Shared User (optional)
  → back preserves Home stack
```

### 31.4 Attention → source

```
Notifications List
  → deep-out Shared domain
  → back to Notifications or continue in domain per Back law
```

### 31.5 Identity → control

```
Profile (self)
  → Settings stack
  → section
  → back to Profile
```

### 31.6 Compose

```
Home compose action (or contextual create)
  → compose chooser (modal)
  → editor (fullscreen task)
  → dismiss to origin place
```

### 31.7 Staff

```
Role gate
  → Admin or Moderator stack
  → tool surface
  → leave overlay without rewriting player five roots
```

---

# 32. Route Organization (logical, not URLs)

Routes are organized by **destination family**, matching Feature → Home and Shared ownership.

| Family | Contains |
|--------|----------|
| `root.*` | home · discover · library · notifications · profile |
| `gate.*` | auth.* · onboarding.* |
| `settings.*` | settings sections |
| `messages.*` | inbox · conversation (Profile-entered) |
| `shared.game.*` | game detail hierarchy |
| `shared.post.*` | post |
| `shared.review.*` | review |
| `shared.collection.*` | collection detail |
| `shared.tier.*` | tier detail |
| `shared.user.*` | other user |
| `shared.community.*` | community detail · feed · members · activity |
| `shared.event.*` | event detail |
| `shared.achievement.*` | achievement detail |
| `discover.hub.*` | communities hub · events hub · search |
| `library.index.*` | wishlist · backlog · collections index · tiers index · archive · import entry |
| `notifications.*` | list · activity center |
| `staff.admin.*` | admin tools |
| `staff.mod.*` | moderation tools |
| `task.*` | modal/fullscreen tasks (compose, filters, editors) |

| Law |
|-----|
| Logical families must not cross ownership homes |
| Engineering URL schemes project these families — they do not invent new families here |
| `task.*` never becomes a top-level player destination family |

---

# 33. Six Pillars → Architecture Mapping

Pillars are product meaning (F2.1); they are **not** tabs.

| Pillar | Primary architectural expression |
|--------|----------------------------------|
| Library | Library tab + shared Collection/Tier/Game |
| Logging | Compose/log tasks + Home/Library reflections + Review/Game |
| Social | Home feed + Post + Messages + Notifications |
| Discovery | Discover + Search + shared Game/User/Community |
| Identity | Profile + Shared User |
| Communities | Discover Communities Hub + Shared Community |

A pillar may span multiple screens — it must not demand its own top-level destination without F2.1 amendment.

---

# 34. MVP Integration Amendment — Structural Placement

**Amendment scope:** MVP Final Integration Amendment (July 2026). This section places six MVP features inside the existing structure. It does **not** change the five top-level destinations, the F2.1 structural freeze, navigation philosophy, UX or UI law. No feature below earns a tab.

## 34.1 Placement map

| MVP feature | Architectural home | Structural expression | Not |
|-------------|--------------------|-----------------------|-----|
| Steam Sync | Library (entry) · Settings → Connected Accounts · Onboarding optional step | Import task layer · ownership indicator on Shared Game · imported-game feed activity | Not a destination · not required · not a Steam client |
| Discord Account Linking | Settings → Connected Accounts · Authentication (optional login method) | OAuth task flow | Not chat · not Discord communities · not a social graph import |
| Semantic Smart Recommendations | Discover (owner) | Presentation slots: Home recommendation slot · Related Games (Shared Game) · Similar Collections (Shared Collection) | Not an assistant · not generative AI · not a new destination · not feed identity |
| Communities | Discover Communities Hub (entry) · Shared Community (room) | Detail · Feed · Members · Activity as children of Shared Community | Not a tab · not a parallel social app |
| Events | Discover Events Hub (entry) · Shared Event (room) | One Event destination for game · community · tournament · seasonal variants | Not a tab · not a calendar app · not a countdown engine |
| GMRLOG Achievement System | Profile Achievements section · Shared Achievement (detail) | Progress presentation · achievement activity in Home feed | Not Steam achievements · not points/leaderboard economy · not a tab |

## 34.2 Structural laws for this amendment

| Law |
|-----|
| Every MVP feature resolves to an existing stratum: root tab · shared destination · task layer · settings section |
| Optional integrations must never gate core structure — GMRLOG is fully navigable with zero connected accounts |
| Community and Event sub-surfaces are children of their shared destination, never new roots |
| Achievements have an index (Profile) and a detail (Shared) — the same index/detail law as Collections and Tier Lists |
| Recommendation slots are presentation inside existing destinations; they never own a place |
| Import and account-link flows are **task layer** — they return to their origin place |
| Hub entries under Discover may grow; the number of player destinations may not |

## 34.3 Journey extensions (structure only)

```
Onboarding (optional connect step)
  → account link task (skippable)
  → Onboarding continues → Home
```

```
Library Hub → Library Import entry
  → import task layer (progress · resolve)
  → dismiss to Library (imported games appear in shelves)
```

```
Discover Hub → Events Hub
  → Shared Event
  → Shared Community or Shared Game (related)
  → back preserves Discover stack
```

```
Profile → Achievements section
  → Shared Achievement
  → back to Profile
```

## 34.4 Explicitly out of scope (Version 2)

Marketplace · Premium · Creator Economy · Publisher Dashboard · Developer Dashboard · Public API · Twitch integration · advanced AI recommendation engine. These remain future-reserved (§25) and receive no structural placement here.

---

## Final gate

### LOCKED — Product Architecture frozen

**Sprint F5.1 — Information Architecture & Navigation Specification** is **LOCKED** at Version 1.1 following the MVP Final Integration Amendment.

This document is the frozen SSOT for product structure under F1–F4 and F2.1.

Future changes must be introduced via Amendment documents only.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | **LOCKED** structural navigation freeze |
| [F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md](../03_UX/F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) | Nav experience law |
| [F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md](../04_UI/F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md) | F4 close · F5 authorized |
| [F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md](../04_UI/F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md) | Chrome adapts · IA does not |
| [F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md](../04_UI/F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md) | Anti-fork kinship |
| [SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md) | Auth / onboarding |
| [SPRINT_F2_4_GAME_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_4_GAME_EXPERIENCE.md) | Game destination |
| [SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md](../02_DESIGN/SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) | Profile |
| [SPRINT_F2_6_LIBRARY_COLLECTIONS.md](../02_DESIGN/SPRINT_F2_6_LIBRARY_COLLECTIONS.md) | Library |
| [SPRINT_F2_7_HOME_FEED.md](../02_DESIGN/SPRINT_F2_7_HOME_FEED.md) | Home |
| [SPRINT_F2_8_SOCIAL_COMMUNICATION.md](../02_DESIGN/SPRINT_F2_8_SOCIAL_COMMUNICATION.md) | Social / messages placement |
| [SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md](../02_DESIGN/SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) | Notifications |
| [SPRINT_F2_10_DISCOVER_SEARCH.md](../02_DESIGN/SPRINT_F2_10_DISCOVER_SEARCH.md) | Discover / search |
| [SPRINT_F2_11_COMMUNITIES_GUILDS.md](../02_DESIGN/SPRINT_F2_11_COMMUNITIES_GUILDS.md) | Communities |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT · §9 tabs |
| [F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md](./F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | Product structure · Home stratum |
| [F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md](./F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | **DRAFT** Home Feed product architecture |
| [F5_3_SCREEN_SPECIFICATIONS.md](./F5_3_SCREEN_SPECIFICATIONS.md) | **DRAFT** Screen catalog |
| [F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md](./F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | **DRAFT** Interaction & component behavior |
| [F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md](./F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **DRAFT** Design System & Implementation Rules · F5 close |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Product architecture IA & navigation specification: strata · hierarchy · ownership · shared destinations · anti-fragmentation; obeys F2.1; no UI/URLs/implementation |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — Steam Sync · Discord linking · semantic recommendations · Communities · Events · GMRLOG achievements placed into existing strata (§6 · §8 · §17.7–17.9 · §20 · §30 · §32 · new §34); no new tabs · no IA/navigation philosophy change |
| 1.1 | July 2026 | Version 1.1 — MVP Final Integration Amendment verified. Product Architecture frozen. |
