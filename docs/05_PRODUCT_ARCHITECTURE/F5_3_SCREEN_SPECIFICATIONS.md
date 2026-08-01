# GMRLOG — Sprint F5.3: Screen Specifications

**Document:** `docs/05_PRODUCT_ARCHITECTURE/F5_3_SCREEN_SPECIFICATIONS.md`  
**Version:** 1.1  
**Status:** **LOCKED**  
**Sprint:** F5.3 (Screen Specification — product architecture only) · amended by **MVP Final Integration Amendment**  
**Last Updated:** July 2026  
**Owner:** Product Architecture Director  
**Classification:** Screen Specification

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | Entire F1 |
| 4 | Entire F2 — especially [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | Entire F3 |
| 6 | Entire F4 |
| 7 | [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](./F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) |
| 8 | [`F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md`](./F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) |
| 9 | **This document** |

Never contradict previous freezes.

Never redesign UX or UI.

Never introduce engineering.

This document answers:

> “What screens exist?”

rather than:

> “How do they look?” · “How are they implemented?” · “What components build them?”

| Does | Does not |
|------|----------|
| Catalog every screen · ownership · parent/children · entry/exit · navigation · required context · allowed/forbidden responsibilities · expansion | UI · components · spacing · type · animation · color |
| Complete hierarchy under F5.1 | Backend · API · DB · network · RN · Expo · algorithms · code |

**Gate:** Stop after this Screen Specification. Do **not** continue to the next F5 sprint in this deliverable.

---

## Scope

**In scope:** Every product screen · ownership · purpose · hierarchy · entry/exit · navigation relationships · required context · responsibilities · future expansion.

**Out of scope:** UI · components · spacing · typography · animations · colors · backend · API · database · networking · React Native · Expo · algorithms · implementation.

**Phases** (from F2.1 inventory; architecture may list Future screens): Core MVP · Alpha · Beta · Future.

---

## Laws

| Law |
|-----|
| Each screen has **exactly one** Primary Owner |
| Presentation never changes ownership |
| Shared Destinations remain shared (F5.1) |
| No duplicate ownership |
| Task layers are **not** destinations |
| Back / dismiss / replace / modal / fullscreen declared per screen |
| Compatible with F5.1 · F5.2 · F2.1 |

---

## Field template (every screen)

| # | Field |
|---|--------|
| 1 | Screen Name |
| 2 | Purpose |
| 3 | Primary Owner |
| 4 | Parent |
| 5 | Children |
| 6 | Entry Points |
| 7 | Exit Points |
| 8 | Navigation Targets |
| 9 | Required Context |
| 10 | Allowed Actions |
| 11 | Forbidden Responsibilities |
| 12 | Future Expansion Rules |

**Nav mechanics legend:** `Back` · `Replace` · `Modal` · `Fullscreen Task` · `Tab switch` · `Dismiss`

---

## Complete hierarchy (product)

```
PRODUCT
├── SYSTEM
│   ├── Splash
│   ├── Session Loading
│   ├── Overlay Host (toast/banner — non-destination host)
│   ├── Admin Stack …
│   └── Moderator Stack …
├── AUTH
│   ├── Login
│   ├── Register
│   ├── OAuth Bridge
│   ├── Forgot / Reset Password
│   └── Soft-Gate / Public Preview Bridge
├── ONBOARDING
│   ├── Onboarding — Taste
│   ├── Onboarding — Platforms
│   ├── Onboarding — Connect Accounts (optional · skippable)
│   └── Onboarding — Follow Suggestions
├── MAIN APP
│   ├── HOME
│   │   └── Activity Feed
│   ├── DISCOVER
│   │   ├── Discover Hub
│   │   ├── Search
│   │   ├── Search Results
│   │   ├── Communities Hub
│   │   └── Events Hub
│   ├── LIBRARY
│   │   ├── Library Hub
│   │   ├── Shelf / Status Lists
│   │   ├── Wishlist
│   │   ├── Backlog
│   │   ├── Collections Index
│   │   ├── Tier Lists Index
│   │   ├── Library Import
│   │   └── Hidden Archive
│   ├── NOTIFICATIONS
│   │   ├── Notifications List
│   │   └── Activity Center
│   └── PROFILE
│       ├── Own Profile
│       ├── Edit Profile
│       ├── Followers / Following
│       ├── Achievements
│       ├── Statistics
│       ├── Messages Inbox → Conversation
│       ├── Creator Tools Hub (Future)
│       ├── Premium Manage (Future)
│       ├── Developer Hub (Future)
│       └── → SETTINGS
├── SETTINGS
│   ├── Settings Hub
│   ├── Account
│   ├── Privacy
│   ├── Notification Preferences
│   ├── Appearance
│   ├── Accessibility
│   ├── Connected Accounts (Steam · Discord)
│   └── About / Legal
├── SHARED DESTINATIONS
│   ├── GAME …
│   ├── POST …
│   ├── REVIEW …
│   ├── COLLECTION …
│   ├── TIER LIST …
│   ├── USER (Other) …
│   ├── COMMUNITY (Detail · Feed · Members · Activity) …
│   ├── EVENT …
│   └── ACHIEVEMENT …
└── TASK LAYERS (non-destinations)
    ├── Compose Chooser
    ├── Compose Post
    ├── Log Game
    ├── Write / Edit Review
    ├── Create / Edit Collection
    ├── Tier List Editor
    ├── Share
    ├── Report / Block
    ├── Delete Confirmation
    ├── Image / Media Picker
    ├── Filters / Sort
    ├── Account Link (OAuth)
    ├── Steam Library Import
    └── Media Viewer
```

---

# GROUP: AUTH

### Login

| Field | Specification |
|-------|----------------|
| Purpose | Authenticate returning guest |
| Primary Owner | Authentication |
| Parent | Authentication Stack |
| Children | — |
| Entry | Boot guest · soft-gate · logout · deep gate |
| Exit | Success → Onboarding or Main Home; Back may leave app/guest policy |
| Navigation Targets | Register · OAuth · Reset · Onboarding · Home |
| Required Context | Guest session |
| Allowed Actions | Submit credentials · OAuth start · navigate register/reset |
| Forbidden | Main App browsing · Compose · owning Shared Destinations |
| Expansion | New auth methods remain Auth children |
| Mechanics | Back: platform policy · Replace: to Main on success · Modal: no |

### Register

| Field | Specification |
|-------|----------------|
| Purpose | Create account |
| Primary Owner | Authentication |
| Parent | Authentication Stack |
| Children | — |
| Entry | Login · marketing soft paths · deep gate |
| Exit | Success → Onboarding; to Login |
| Navigation Targets | Login · OAuth · Onboarding |
| Required Context | Guest |
| Allowed Actions | Register · OAuth |
| Forbidden | Main App as incomplete bypass without policy |
| Expansion | Same as Login |
| Mechanics | Back: yes to Login · Replace: on success · Modal: no |

### OAuth Bridge

| Field | Specification |
|-------|----------------|
| Purpose | Continue third-party auth |
| Primary Owner | Authentication |
| Parent | Authentication Stack |
| Children | — |
| Entry | Login/Register OAuth start |
| Exit | Success → Onboarding/Home · failure → Login |
| Navigation Targets | Login · Onboarding · Home |
| Required Context | In-flight OAuth |
| Allowed Actions | Complete / cancel OAuth |
| Forbidden | Treat as destination tab |
| Expansion | Providers add under Auth |
| Mechanics | Back: cancel · Replace: on success · Modal: no |

### Forgot / Reset Password

| Field | Specification |
|-------|----------------|
| Purpose | Recover account access |
| Primary Owner | Authentication |
| Parent | Authentication Stack |
| Children | — |
| Entry | Login · deep reset token |
| Exit | Login |
| Navigation Targets | Login |
| Required Context | Guest · optional reset token |
| Allowed Actions | Request/reset |
| Forbidden | Main App entry without auth completion |
| Expansion | Additional recovery methods under Auth |
| Mechanics | Back: yes · Replace: optional to Login · Modal: no |

### Soft-Gate / Public Preview Bridge

| Field | Specification |
|-------|----------------|
| Purpose | Bridge public preview → Auth → queued target |
| Primary Owner | Authentication |
| Parent | Authentication Stack |
| Children | — |
| Entry | Restricted action on public Game/User preview |
| Exit | Auth success → queued Shared Destination · cancel → preview |
| Navigation Targets | Login/Register · queued Game/User/etc. |
| Required Context | Queued destination id |
| Allowed Actions | Continue to Auth · dismiss |
| Forbidden | Steal Shared ownership |
| Expansion | More preview types still Auth-owned bridge |
| Mechanics | Back: dismiss · Replace: after auth · Modal: may host prompt |

---

# GROUP: ONBOARDING

### Onboarding — Taste

| Field | Specification |
|-------|----------------|
| Purpose | Capture initial taste readiness |
| Primary Owner | Onboarding |
| Parent | Onboarding Stack |
| Children | — |
| Entry | Post-auth incomplete |
| Exit | Next onboarding step · skip per policy · Main Home |
| Navigation Targets | Platforms · Follow suggestions · Home |
| Required Context | Authenticated incomplete |
| Allowed Actions | Select taste · continue · skip (policy) |
| Forbidden | Product tour theater · Premium wall · tab bar |
| Expansion | Step content may change; placement fixed |
| Mechanics | Back: limited · Replace: forward · Modal: no |

### Onboarding — Platforms

| Field | Specification |
|-------|----------------|
| Purpose | Capture platforms readiness |
| Primary Owner | Onboarding |
| Parent | Onboarding Stack |
| Children | — |
| Entry | After taste (or policy order) |
| Exit | Next step · Home |
| Navigation Targets | Follow suggestions · Home |
| Required Context | Authenticated incomplete |
| Allowed Actions | Select platforms · continue · skip |
| Forbidden | Same as Taste |
| Expansion | Same |
| Mechanics | Back: prior step · Replace: forward · Modal: no |

### Onboarding — Connect Accounts (optional)

| Field | Specification |
|-------|----------------|
| Purpose | Offer optional account connection (Steam Sync · Discord identity) during readiness (F2.2 · F2.21) |
| Primary Owner | Onboarding |
| Parent | Onboarding Stack |
| Children | — (Account Link task · Steam Library Import task) |
| Entry | After platforms (or policy order) |
| Exit | Next step · skip · Main Home |
| Navigation Targets | Task Account Link · Task Steam Library Import (deferrable) · next onboarding step · Home |
| Required Context | Authenticated incomplete |
| Allowed Actions | Connect Steam · connect Discord · skip · continue |
| Forbidden | Blocking onboarding on any connection · implying GMRLOG requires Steam · importing without consent |
| Expansion | New providers appear as options on this one step — never as extra onboarding stages |
| Mechanics | Back: prior step · Replace: forward · Modal: link / import tasks |

### Onboarding — Follow Suggestions

| Field | Specification |
|-------|----------------|
| Purpose | Optional social seeding |
| Primary Owner | Onboarding |
| Parent | Onboarding Stack |
| Children | — |
| Entry | Prior onboarding · Alpha+ |
| Exit | Main Home |
| Navigation Targets | Home · Shared User (preview only) |
| Required Context | Authenticated incomplete/finishing |
| Allowed Actions | Follow · skip · finish |
| Forbidden | Become Discover replacement |
| Expansion | Phase Alpha |
| Mechanics | Back: prior · Replace: to Home · Modal: no |

---

# GROUP: HOME

### Activity Feed

| Field | Specification |
|-------|----------------|
| Purpose | Culture heartbeat — what happened in my gaming world (F5.2 · F2.7) |
| Primary Owner | Home |
| Parent | Main App · Home tab |
| Children | — (objects route to Shared; Compose is task) |
| Entry | Tab home · reselect root · post-auth · deep home |
| Exit | Tab switch · Shared opens · Compose task · Back leaves app per platform |
| Navigation Targets | Shared Game/Post/Review/Collection/Tier/User/Community · Discover Search (affordance) · Task Compose |
| Required Context | Authenticated ready (full) |
| Allowed Actions | Open objects · Compose action · refresh · scroll |
| Forbidden | Own Shared domains · Search ownership · second Home · ranking algorithms |
| Expansion | New feed object classes per F5.2 declaration |
| Mechanics | Back: platform · Replace: no for root · Modal: Compose · Fullscreen: editors |

---

# GROUP: DISCOVER

### Discover Hub

| Field | Specification |
|-------|----------------|
| Purpose | Exploration wing root — what to explore next (F2.10 · F5.1) |
| Primary Owner | Discover |
| Parent | Main App · Discover tab |
| Children | Search · Search Results · Communities Hub · Events Hub |
| Entry | Tab discover · deep discover |
| Exit | Children · Shared · tab switch |
| Navigation Targets | Search · Communities Hub · Events Hub · Shared Game/User/Collection/Community/Event |
| Required Context | Main App |
| Allowed Actions | Browse hub · open Search · open communities · open events · open shared · open semantic recommendation surfaces |
| Forbidden | Become Home heartbeat · storefront OS · own Game detail |
| Expansion | New hub modules nest under Discover |
| Mechanics | Back: platform · Modal: filters |

### Search

| Field | Specification |
|-------|----------------|
| Purpose | Universal search entry surface |
| Primary Owner | Discover |
| Parent | Discover |
| Children | Search Results |
| Entry | Discover · Home long-press focus affordance (ownership still Discover) · deep search |
| Exit | Results · Back to Discover Hub · Shared |
| Navigation Targets | Search Results · Shared by type |
| Required Context | Query optional |
| Allowed Actions | Query · clear · open recent/trending empty state |
| Forbidden | Game-only search architecture · separate top-level Search tab |
| Expansion | More query types per F2.1 phases |
| Mechanics | Back: yes · Modal: no |

### Search Results

| Field | Specification |
|-------|----------------|
| Purpose | Typed/segmented results of universal search |
| Primary Owner | Discover |
| Parent | Search |
| Children | — |
| Entry | Search submit · deep query |
| Exit | Shared destinations · Back to Search |
| Navigation Targets | Game · User · Post · Review · Collection · Tier · Community (by phase) |
| Required Context | Query |
| Allowed Actions | Open result · change type segment · refine |
| Forbidden | Own result detail objects |
| Expansion | New result types under Discover |
| Mechanics | Back: yes · Modal: filters/sort |

### Communities Hub

| Field | Specification |
|-------|----------------|
| Purpose | Directory/entry to communities (F2.11) — not a tab |
| Primary Owner | Discover |
| Parent | Discover |
| Children | — (Community Detail is Shared) |
| Entry | Discover Hub · deep communities · Beta |
| Exit | Shared Community · Back |
| Navigation Targets | Shared Community · Search |
| Required Context | Main App · Beta+ |
| Allowed Actions | Browse · open community · search communities |
| Forbidden | Bottom tab · steal Community detail ownership |
| Expansion | Hub growth until F2.1 amendment for tab |
| Mechanics | Back: yes · Modal: filters |

### Events Hub

| Field | Specification |
|-------|----------------|
| Purpose | Directory/entry to events — upcoming and ongoing gatherings (F2.15) — not a tab |
| Primary Owner | Discover |
| Parent | Discover |
| Children | — (Event Detail is Shared) |
| Entry | Discover Hub · deep events · Home event activity (open-through) |
| Exit | Shared Event · Back |
| Navigation Targets | Shared Event · Shared Community · Shared Game · Search |
| Required Context | Main App |
| Allowed Actions | Browse events · filter by kind (game · community · tournament · seasonal) · open event |
| Forbidden | Bottom tab · calendar-app identity · countdown urgency architecture · own Event detail |
| Expansion | New event kinds are filters/segments here — not new hubs |
| Mechanics | Back: yes · Modal: filters |

---

# GROUP: LIBRARY

### Library Hub

| Field | Specification |
|-------|----------------|
| Purpose | Personal archive root (F2.6 · F5.1) |
| Primary Owner | Library |
| Parent | Main App · Library tab |
| Children | Shelf lists · Wishlist · Backlog · Collections Index · Tier Lists Index · Library Import · Hidden Archive |
| Entry | Tab library · deep library |
| Exit | Children · Shared Game · tab switch · contextual create tasks |
| Navigation Targets | Children · Shared Game/Collection/Tier · Task create · Library Import |
| Required Context | Authenticated owner |
| Allowed Actions | Browse archive · open children · contextual create · open import entry |
| Forbidden | Store launcher identity · own Collection/Tier **detail** |
| Expansion | New shelf types as children |
| Mechanics | Back: platform · Modal: quick wishlist/backlog sheet (F2.1 long-press) |

### Shelf / Status Lists (Owned & related segments)

| Field | Specification |
|-------|----------------|
| Purpose | Segmented personal library lists |
| Primary Owner | Library |
| Parent | Library Hub |
| Children | — |
| Entry | Library Hub · deep segments |
| Exit | Shared Game · Back |
| Navigation Targets | Shared Game · Task Log |
| Required Context | Owner |
| Allowed Actions | Open game · change segment · log shortcuts |
| Forbidden | Duplicate Discover |
| Expansion | New statuses as segments |
| Mechanics | Back: yes |

### Wishlist

| Field | Specification |
|-------|----------------|
| Purpose | Wishlist archive view |
| Primary Owner | Library |
| Parent | Library Hub |
| Children | — |
| Entry | Hub · long-press shortcut · deep |
| Exit | Shared Game · Back |
| Navigation Targets | Shared Game |
| Required Context | Owner |
| Allowed Actions | Open · remove/add via tasks |
| Forbidden | Commerce casino Home |
| Expansion | Under Library |
| Mechanics | Back: yes · Modal: confirmations |

### Backlog

| Field | Specification |
|-------|----------------|
| Purpose | Backlog archive view |
| Primary Owner | Library |
| Parent | Library Hub |
| Children | — |
| Entry | Hub · shortcut · deep |
| Exit | Shared Game · Back |
| Navigation Targets | Shared Game · Task Log |
| Required Context | Owner |
| Allowed Actions | Open · status tasks |
| Forbidden | Same as Wishlist |
| Expansion | Under Library |
| Mechanics | Back: yes |

### Collections Index

| Field | Specification |
|-------|----------------|
| Purpose | Index of user’s collections |
| Primary Owner | Library |
| Parent | Library Hub |
| Children | — (detail = Shared Collection) |
| Entry | Hub · Profile section jump |
| Exit | Shared Collection · Task Create/Edit Collection · Back |
| Navigation Targets | Shared Collection · Task Create Collection |
| Required Context | Owner (or public indexes via Profile — still Collection Shared for detail) |
| Allowed Actions | Open detail · create |
| Forbidden | Own Collection Detail |
| Expansion | Index only under Library/Profile entry |
| Mechanics | Back: yes · Fullscreen/Modal: create/edit tasks |

### Tier Lists Index

| Field | Specification |
|-------|----------------|
| Purpose | Index of tier lists |
| Primary Owner | Library |
| Parent | Library Hub |
| Children | — |
| Entry | Hub · Profile |
| Exit | Shared Tier · Task Tier Editor · Back |
| Navigation Targets | Shared Tier · Task Editor |
| Required Context | Owner / visibility |
| Allowed Actions | Open · create/edit task |
| Forbidden | Own Tier Detail |
| Expansion | Same pattern as Collections Index |
| Mechanics | Back: yes · Fullscreen: editor |

### Library Import

| Field | Specification |
|-------|----------------|
| Purpose | Entry surface for bringing owned games into the personal archive (Steam Sync — F2.6 · F2.21) |
| Primary Owner | Library |
| Parent | Library Hub |
| Children | — (import runs in Steam Library Import task) |
| Entry | Library Hub · Settings Connected Accounts (after linking) · Onboarding deferred import |
| Exit | Task Steam Library Import · Settings Connected Accounts (to link first) · Back |
| Navigation Targets | Task Steam Library Import · Task Account Link · Settings Connected Accounts · Shelf lists |
| Required Context | Authenticated owner · connected account required only for the import action itself |
| Allowed Actions | Start import · review previous import result · stop/skip |
| Forbidden | Becoming a second Library Hub · presenting Steam as required · silent import without consent · overwriting player-authored library meaning |
| Expansion | Additional platforms appear as sources on this one screen — not as new Library children |
| Mechanics | Back: yes · Modal/Fullscreen: import task |

### Hidden Archive

| Field | Specification |
|-------|----------------|
| Purpose | Gated personal archive subset |
| Primary Owner | Library |
| Parent | Library Hub |
| Children | — |
| Entry | Hub (gated) |
| Exit | Shared Game · Back |
| Navigation Targets | Shared Game |
| Required Context | Owner + unlock/gate |
| Allowed Actions | Browse gated items |
| Forbidden | Public exposure without privacy law |
| Expansion | Remains Library child |
| Mechanics | Back: yes · Modal: unlock confirm |

---

# GROUP: NOTIFICATIONS

### Notifications List

| Field | Specification |
|-------|----------------|
| Purpose | Attention desk root (F2.9 · F5.1) |
| Primary Owner | Notifications |
| Parent | Main App · Notifications tab |
| Children | Activity Center |
| Entry | Tab · deep notifications |
| Exit | Shared deep-out · Activity Center · tab switch |
| Navigation Targets | Shared domains · Activity Center · Task mark-all |
| Required Context | Authenticated |
| Allowed Actions | Open item · filter categories · mark read |
| Forbidden | Sixth-tab Activity · engagement addiction rails · own Shared objects |
| Expansion | New categories map into list |
| Mechanics | Back: platform · Modal: mark-all confirm · Replace: no |

### Activity Center

| Field | Specification |
|-------|----------------|
| Purpose | Activity memory mode — child of Notifications (not a tab) |
| Primary Owner | Notifications |
| Parent | Notifications List |
| Children | — |
| Entry | Notifications · Profile-adjacent entry if product allows — ownership stays Notifications |
| Exit | Shared · Back to Notifications List |
| Navigation Targets | Shared destinations |
| Required Context | Authenticated |
| Allowed Actions | Browse memory activity · open sources |
| Forbidden | Become Home feed duplicate · new top-level destination |
| Expansion | Under Notifications only |
| Mechanics | Back: yes |

---

# GROUP: PROFILE

### Own Profile

| Field | Specification |
|-------|----------------|
| Purpose | Digital Home / self identity root (F2.5 · F5.1) |
| Primary Owner | Profile |
| Parent | Main App · Profile tab |
| Children | Edit Profile · Followers/Following · Achievements · Statistics · Messages · Settings entry (incl. Connected Accounts) · future hubs · section surfaces per F2.5 order |
| Entry | Tab profile (always self) · deep self |
| Exit | Children · Shared from sections · Settings · tab switch |
| Navigation Targets | Settings · Settings Connected Accounts · Messages · Shared Collection/Tier/Review/Post/Game/Achievement · Edit Profile · hubs |
| Required Context | Authenticated self |
| Allowed Actions | Browse identity · open sections · overflow entries · edit |
| Forbidden | Open other users as this root · Messages as tab · Settings as tab |
| Expansion | Hubs as children · section set per F2.5 |
| Mechanics | Back: platform · Modal: overflow |

### Edit Profile

| Field | Specification |
|-------|----------------|
| Purpose | Edit own identity fields |
| Primary Owner | Profile |
| Parent | Own Profile |
| Children | — (Image Picker is task) |
| Entry | Own Profile |
| Exit | Own Profile · Task Image Picker |
| Navigation Targets | Own Profile · Task Picker |
| Required Context | Self |
| Allowed Actions | Edit · save · cancel · pick media |
| Forbidden | Edit others · Settings privacy substitute wholesale |
| Expansion | Fields expand under Profile |
| Mechanics | Back: yes · Modal/Fullscreen: per task policy · Replace: no |

### Followers / Following

| Field | Specification |
|-------|----------------|
| Purpose | Social graph lists for a user |
| Primary Owner | Profile (self) or Shared User (other) — **Primary Owner follows subject**: self → Profile; other → Shared User |
| Parent | Own Profile or Other User Profile |
| Children | — |
| Entry | Profile/User |
| Exit | Shared User · Own Profile · Back |
| Navigation Targets | Shared User · Own Profile |
| Required Context | Subject user id · visibility |
| Allowed Actions | Open users · follow/unfollow per rules |
| Forbidden | Messages tab substitute |
| Expansion | Under Profile/User |
| Mechanics | Back: yes |

### Achievements

| Field | Specification |
|-------|----------------|
| Purpose | GMRLOG achievement surfaces for identity — index + progress presentation (F2.14) |
| Primary Owner | Profile (self) / Shared User (other) |
| Parent | Own Profile or Other User |
| Children | — (detail = Shared Achievement) |
| Entry | Profile section · Home achievement activity · notification deep-out |
| Exit | Shared Achievement · Back · related Shared Game optional |
| Navigation Targets | Shared Achievement · Shared Game |
| Required Context | Subject user · visibility per privacy law |
| Allowed Actions | Browse achievements · open achievement detail · view own progress |
| Forbidden | New top-level Achievements tab · Steam achievement mirroring · leaderboard/score economy · own Achievement Detail |
| Expansion | New achievement families (logging · collecting · exploring · backlog) appear here — never as new destinations |
| Mechanics | Back: yes |

### Statistics

| Field | Specification |
|-------|----------------|
| Purpose | Identity statistics (Alpha+) |
| Primary Owner | Profile / Shared User |
| Parent | Own Profile or Other User |
| Children | — |
| Entry | Profile section |
| Exit | Back |
| Navigation Targets | Related Shared optional |
| Required Context | Subject user |
| Allowed Actions | Browse |
| Forbidden | Dashboard Home |
| Expansion | Under Profile/User |
| Mechanics | Back: yes |

### Messages Inbox

| Field | Specification |
|-------|----------------|
| Purpose | Calm DM inbox (Alpha+) — not a tab (F2.8 · F5.1) |
| Primary Owner | Profile (entry ownership) · Messages Stack |
| Parent | Own Profile overflow → Messages Stack |
| Children | Conversation |
| Entry | Profile overflow · deep messages |
| Exit | Conversation · Back to Profile |
| Navigation Targets | Conversation · Shared User |
| Required Context | Authenticated |
| Allowed Actions | Open conversation · compose message task |
| Forbidden | Bottom tab · Discord-like second app IA |
| Expansion | Under Profile-entered Messages Stack |
| Mechanics | Back: yes · Modal: compose sheet optional |

### Conversation

| Field | Specification |
|-------|----------------|
| Purpose | One conversation thread |
| Primary Owner | Messages Stack (Profile-entered) |
| Parent | Messages Inbox |
| Children | — |
| Entry | Inbox · deep conversation · notification deep-out |
| Exit | Inbox · Shared User · Back |
| Navigation Targets | Inbox · Shared User · Task Report |
| Required Context | Conversation id |
| Allowed Actions | Send · read · report |
| Forbidden | Own Notifications list |
| Expansion | Under Messages Stack |
| Mechanics | Back: yes |

### Creator Tools Hub (Future)

| Field | Specification |
|-------|----------------|
| Purpose | Creator tools entry (Future) |
| Primary Owner | Profile |
| Parent | Own Profile |
| Children | Future creator tools |
| Entry | Profile · Creator section |
| Exit | Back · tool children |
| Navigation Targets | Children · Shared content |
| Required Context | Creator-capable account |
| Allowed Actions | Open tools |
| Forbidden | Extra bottom tab · paywall culture feed |
| Expansion | Children under hub |
| Mechanics | Back: yes |

### Premium Manage (Future)

| Field | Specification |
|-------|----------------|
| Purpose | Manage premium entitlement (Future) |
| Primary Owner | Profile / Settings child |
| Parent | Own Profile or Settings |
| Children | — |
| Entry | Profile/Settings |
| Exit | Back |
| Navigation Targets | Settings |
| Required Context | Account |
| Allowed Actions | Manage entitlement |
| Forbidden | Premium tab · culture paywall Home |
| Expansion | Under Profile/Settings |
| Mechanics | Back: yes |

### Developer Hub (Future)

| Field | Specification |
|-------|----------------|
| Purpose | Verified developer/studio hub (Future) |
| Primary Owner | Profile |
| Parent | Own Profile / Settings |
| Children | Title insights (Future) |
| Entry | Profile/Settings |
| Exit | Children · Back |
| Navigation Targets | Title insights · Shared Game |
| Required Context | Verified dev |
| Allowed Actions | Open hub tools |
| Forbidden | Extra player tab |
| Expansion | Children under hub |
| Mechanics | Back: yes |

### Title Insights (Future)

| Field | Specification |
|-------|----------------|
| Purpose | Developer title insights |
| Primary Owner | Profile (Developer Hub child) |
| Parent | Developer Hub |
| Children | — |
| Entry | Developer Hub |
| Exit | Back · Shared Game |
| Navigation Targets | Shared Game |
| Required Context | Title access |
| Allowed Actions | Browse insights |
| Forbidden | Player Home metrics addiction |
| Expansion | Under Developer Hub |
| Mechanics | Back: yes |

---

# GROUP: SETTINGS

### Settings Hub

| Field | Specification |
|-------|----------------|
| Purpose | Control panel root (F2.20 · F5.1) |
| Primary Owner | Settings |
| Parent | Own Profile → Settings Stack |
| Children | Account (→ Connected Accounts) · Privacy · Notification Preferences · Appearance · Accessibility · About/Legal |
| Entry | Profile · deep settings |
| Exit | Children · Back to Profile · logout → Auth |
| Navigation Targets | Children · Auth on logout |
| Required Context | Authenticated self |
| Allowed Actions | Open sections · logout |
| Forbidden | Player top-level Settings tab |
| Expansion | New sections as children |
| Mechanics | Back: yes to Profile |

### Account

| Field | Specification |
|-------|----------------|
| Purpose | Account controls |
| Primary Owner | Settings |
| Parent | Settings Hub |
| Children | Connected Accounts |
| Entry | Settings Hub |
| Exit | Children · Back · Auth flows if delete/switch future |
| Navigation Targets | Connected Accounts · Settings Hub · Auth |
| Required Context | Self |
| Allowed Actions | Account management actions per product · open connected accounts |
| Forbidden | Edit Profile wholesale duplicate without need |
| Expansion | Under Settings |
| Mechanics | Back: yes · Modal: destructive confirms |

### Connected Accounts

| Field | Specification |
|-------|----------------|
| Purpose | See and control external account connections — Steam (library source) · Discord (identity provider) — F2.21 |
| Primary Owner | Settings |
| Parent | Account |
| Children | — (linking runs in Account Link task) |
| Entry | Account section · Profile connected-accounts entry · Library Import (link-first path) · Onboarding deferred connect |
| Exit | Task Account Link · Task Steam Library Import · Library Import · Back |
| Navigation Targets | Task Account Link · Task Steam Library Import · Library Import · Privacy |
| Required Context | Authenticated self |
| Allowed Actions | Connect · disconnect · view what a connection does · start import |
| Forbidden | Hiding disconnect · re-prompt dark patterns · treating Discord as a content/chat surface · implying connections are mandatory |
| Expansion | New providers are rows on this screen — never new Settings sections or destinations |
| Mechanics | Back: yes · Modal: link / disconnect confirm |

### Privacy

| Field | Specification |
|-------|----------------|
| Purpose | Privacy & visibility controls |
| Primary Owner | Settings |
| Parent | Settings Hub |
| Children | — |
| Entry | Settings Hub |
| Exit | Back |
| Navigation Targets | Settings Hub |
| Required Context | Self |
| Allowed Actions | Change privacy prefs |
| Forbidden | Dark-pattern re-prompts as architecture |
| Expansion | Under Settings |
| Mechanics | Back: yes |

### Notification Preferences

| Field | Specification |
|-------|----------------|
| Purpose | Notification preference controls |
| Primary Owner | Settings |
| Parent | Settings Hub |
| Children | — |
| Entry | Settings Hub |
| Exit | Back |
| Navigation Targets | Settings Hub · Notifications (optional jump — ownership stays Settings for prefs) |
| Required Context | Self |
| Allowed Actions | Toggle categories |
| Forbidden | Replace Notifications List |
| Expansion | Under Settings |
| Mechanics | Back: yes |

### Appearance

| Field | Specification |
|-------|----------------|
| Purpose | Appearance preferences (theme choice etc. — values not specified here) |
| Primary Owner | Settings |
| Parent | Settings Hub |
| Children | — |
| Entry | Settings Hub |
| Exit | Back |
| Navigation Targets | Settings Hub |
| Required Context | Self |
| Allowed Actions | Select appearance prefs |
| Forbidden | Invent parallel Design System |
| Expansion | Under Settings |
| Mechanics | Back: yes |

### Accessibility

| Field | Specification |
|-------|----------------|
| Purpose | Accessibility preferences |
| Primary Owner | Settings |
| Parent | Settings Hub |
| Children | — |
| Entry | Settings Hub |
| Exit | Back |
| Navigation Targets | Settings Hub |
| Required Context | Self |
| Allowed Actions | Adjust a11y prefs |
| Forbidden | Optionalize constitutional a11y |
| Expansion | Under Settings |
| Mechanics | Back: yes |

### About / Legal

| Field | Specification |
|-------|----------------|
| Purpose | About · legal · policy surfaces |
| Primary Owner | Settings |
| Parent | Settings Hub |
| Children | — |
| Entry | Settings Hub |
| Exit | Back · external policy readers as future children if needed |
| Navigation Targets | Settings Hub |
| Required Context | Self or guest-limited about if product allows — still Settings-owned if entered from Settings |
| Allowed Actions | Read · open policy |
| Forbidden | Marketing wall as Home |
| Expansion | Under Settings |
| Mechanics | Back: yes |

---

# GROUP: GAME (Shared)

### Game Detail

| Field | Specification |
|-------|----------------|
| Purpose | Relationship-first game room (F2.4 · F5.1) |
| Primary Owner | Shared Game |
| Parent | Shared Game Stack (presented from active tab) |
| Children | Game Reviews List · Game Posts List · Game Media Gallery · Related · Guides List (Future) · embedded hierarchy sections |
| Entry | Feed · Discover · Library · Search · deep game · Profile/Collection links |
| Exit | Children · Task Log/Review · Back to presenter |
| Navigation Targets | Children · Shared Review/Post/Collection/Tier/User/Community/Event · Task Log/Review/Share |
| Required Context | Game id · optional connected-account ownership state |
| Allowed Actions | Browse relationship hierarchy · log · review · share · open children · see own platform ownership indicator (Steam — F2.21) |
| Forbidden | Become storefront-only · Home ownership · Library index ownership · ownership indicator as purchase pressure or as a substitute for player-authored library meaning |
| Expansion | Modules obey F2.1/F2.4 hierarchy order |
| Mechanics | Back: yes · Modal: log/share · Fullscreen: review |

### Game Reviews List

| Field | Specification |
|-------|----------------|
| Purpose | Reviews for one game |
| Primary Owner | Shared Game |
| Parent | Game Detail |
| Children | — (Review Detail shared) |
| Entry | Game Detail |
| Exit | Shared Review · Task Write Review · Back |
| Navigation Targets | Shared Review · Task Write/Edit Review |
| Required Context | Game id |
| Allowed Actions | Open review · write |
| Forbidden | Own Review Detail |
| Expansion | Under Game |
| Mechanics | Back: yes |

### Game Posts / Discussion List

| Field | Specification |
|-------|----------------|
| Purpose | Posts/discussion for one game (Alpha+) |
| Primary Owner | Shared Game |
| Parent | Game Detail |
| Children | — |
| Entry | Game Detail |
| Exit | Shared Post · Back |
| Navigation Targets | Shared Post · Task Compose Post |
| Required Context | Game id |
| Allowed Actions | Open post · compose |
| Forbidden | Own Post Detail · Community substitute without link |
| Expansion | Under Game |
| Mechanics | Back: yes |

### Game Media Gallery

| Field | Specification |
|-------|----------------|
| Purpose | Media for one game (Alpha+) |
| Primary Owner | Shared Game |
| Parent | Game Detail |
| Children | — |
| Entry | Game Detail |
| Exit | Task Media Viewer · Back |
| Navigation Targets | Media Viewer task |
| Required Context | Game id |
| Allowed Actions | Open media |
| Forbidden | Autoplay addiction as purpose |
| Expansion | Under Game |
| Mechanics | Back: yes · Fullscreen: viewer |

### Related / Recommendations (Game)

| Field | Specification |
|-------|----------------|
| Purpose | Related games presentation (Alpha+) — semantic similarity between games · reviews · genres · tags (F2.19); no algorithm specified |
| Primary Owner | Shared Game |
| Parent | Game Detail |
| Children | — |
| Entry | Game Detail |
| Exit | Shared Game · Back |
| Navigation Targets | Shared Game |
| Required Context | Game id |
| Allowed Actions | Open related game |
| Forbidden | Define ranking/ML here · casino upsell wall · assistant / generative-AI framing · presenting suggestions as authority |
| Expansion | Under Game |
| Mechanics | Back: yes |

### Guides List (Future)

| Field | Specification |
|-------|----------------|
| Purpose | Guides/articles/mods list (Future) |
| Primary Owner | Shared Game |
| Parent | Game Detail |
| Children | Future article/guide detail if added as Shared or child |
| Entry | Game Detail |
| Exit | Guide detail · Back |
| Navigation Targets | Future guide destination |
| Required Context | Game id |
| Allowed Actions | Browse · open |
| Forbidden | New player tab |
| Expansion | Declare new screens before UI |
| Mechanics | Back: yes |

---

# GROUP: POST (Shared)

### Post Detail

| Field | Specification |
|-------|----------------|
| Purpose | Social post destination |
| Primary Owner | Shared Post |
| Parent | Shared Post Stack |
| Children | Comment Thread |
| Entry | Home · Notifications · Profile · Community · Game posts · deep post |
| Exit | Comment Thread · Shared User/Game/Community · Task Report/Share · Back |
| Navigation Targets | Comment Thread · User · Game · Community · Tasks |
| Required Context | Post id |
| Allowed Actions | Read · engage · comment · report · share |
| Forbidden | Home ownership of post domain |
| Expansion | Under Shared Post |
| Mechanics | Back: yes · Modal: share/report |

### Comment Thread

| Field | Specification |
|-------|----------------|
| Purpose | Comment conversation on a post (or review if attached pattern) |
| Primary Owner | Shared Post (or Shared Review when review-threaded — owner = host object stack) |
| Parent | Post Detail or Review Detail |
| Children | — |
| Entry | Parent detail |
| Exit | Back · Shared User · Task Report |
| Navigation Targets | User · Report task |
| Required Context | Host object id |
| Allowed Actions | Read · comment · report |
| Forbidden | Independent social network root |
| Expansion | Under host Shared stack |
| Mechanics | Back: yes |

---

# GROUP: REVIEW (Shared)

### Review Detail

| Field | Specification |
|-------|----------------|
| Purpose | Review as cultural object |
| Primary Owner | Shared Review |
| Parent | Shared Review Stack |
| Children | Comment Thread (if enabled) |
| Entry | Feed · Game Reviews · Profile · Search · deep review |
| Exit | Shared Game/User · Task Edit · Back |
| Navigation Targets | Game · User · Edit Review task · Comment Thread |
| Required Context | Review id |
| Allowed Actions | Read · edit (owner) · engage · report |
| Forbidden | Reviews tab · Home ownership |
| Expansion | Under Shared Review |
| Mechanics | Back: yes · Fullscreen: edit |

---

# GROUP: COLLECTION (Shared)

### Collection Detail

| Field | Specification |
|-------|----------------|
| Purpose | Collection shelf object detail |
| Primary Owner | Shared Collection |
| Parent | Shared Collection Stack |
| Children | — (Similar Collections is a presentation slot inside this screen — F2.19) |
| Entry | Library index · Profile · Feed · Search · deep collection |
| Exit | Shared Game/User · Shared Collection (similar) · Task Edit Collection · Back |
| Navigation Targets | Game · User · Collection (similar) · Edit task |
| Required Context | Collection id |
| Allowed Actions | Browse · open games · open similar collections · edit (owner) · share |
| Forbidden | Own Library index · Discover hub |
| Expansion | Under Shared Collection |
| Mechanics | Back: yes · Modal/Fullscreen: edit |

---

# GROUP: TIER LIST (Shared)

### Tier List Detail

| Field | Specification |
|-------|----------------|
| Purpose | Tier list object detail |
| Primary Owner | Shared Tier |
| Parent | Shared Tier Stack |
| Children | — |
| Entry | Library index · Profile · Feed · Search · deep |
| Exit | Shared Game/User · Task Tier Editor · Back |
| Navigation Targets | Game · User · Editor task |
| Required Context | Tier list id |
| Allowed Actions | Browse · edit (owner) · share |
| Forbidden | Own Library index |
| Expansion | Under Shared Tier |
| Mechanics | Back: yes · Fullscreen: editor |

---

# GROUP: USER (Shared — other)

### Other User Profile

| Field | Specification |
|-------|----------------|
| Purpose | Another player’s identity room |
| Primary Owner | Shared User |
| Parent | Shared User Stack |
| Children | Followers/Following · Achievements · Statistics · public section surfaces (F2.5 minus self-only) |
| Entry | Feed · Search · Followers · deep user · Notifications |
| Exit | Children · Shared content · Messages (if allowed) · Back · Task Report/Block |
| Navigation Targets | Children · Post/Review/Collection/Game · Conversation · Report/Block |
| Required Context | User id ≠ self |
| Allowed Actions | Browse · follow · message · report/block |
| Forbidden | Load into Profile tab root · Settings of others |
| Expansion | Same hierarchy as Profile minus self management |
| Mechanics | Back: yes · Modal: report/block |

---

# GROUP: COMMUNITY (Shared)

### Community Home / Detail

| Field | Specification |
|-------|----------------|
| Purpose | Community/guild room (F2.11) |
| Primary Owner | Shared Community |
| Parent | Shared Community Stack |
| Children | Community Feed · Community Members · Community Activity · Discussion Detail (Beta+) |
| Entry | Communities Hub · Search · deep · Post links · Home community activity · Shared Event |
| Exit | Children · Shared Post/User/Game/Event · Back · membership tasks |
| Navigation Targets | Community Feed · Community Members · Community Activity · Discussion · Post · User · Game · Event · Discover Hub |
| Required Context | Community id · visibility/membership |
| Allowed Actions | Browse · join/leave per rules · open children · open discussions/posts |
| Forbidden | Bottom tab · Admin tools leakage · owning Post/User/Game/Event detail |
| Expansion | Children under Shared Community |
| Mechanics | Back: yes · Modal: join/share |

### Community Feed

| Field | Specification |
|-------|----------------|
| Purpose | Community-scoped culture stream — what this room is talking about (F2.11 · F5.2) |
| Primary Owner | Shared Community |
| Parent | Community Home / Detail |
| Children | — |
| Entry | Community Home · deep community feed |
| Exit | Shared Post/Review/User/Game · Back |
| Navigation Targets | Shared Post · Review · User · Game · Task Compose (community-scoped) |
| Required Context | Community id · visibility/membership |
| Allowed Actions | Browse · open objects · compose into community (per membership rules) |
| Forbidden | Becoming a second Home · owning Post/Review detail · ranking architecture |
| Expansion | New community object kinds declare like F5.2 feed classes |
| Mechanics | Back: yes · Modal/Fullscreen: compose tasks |

### Community Members

| Field | Specification |
|-------|----------------|
| Purpose | The people of the room (F2.11) |
| Primary Owner | Shared Community |
| Parent | Community Home / Detail |
| Children | — |
| Entry | Community Home |
| Exit | Shared User · Back · Report task |
| Navigation Targets | Shared User · Task Report/Block |
| Required Context | Community id · visibility/membership |
| Allowed Actions | Browse members · open user · follow per rules · report |
| Forbidden | Owning user identity · exposing private membership against privacy law · moderation tooling for non-staff |
| Expansion | Role presentation stays here; moderation tools stay in Moderator stack |
| Mechanics | Back: yes · Modal: report |

### Community Activity

| Field | Specification |
|-------|----------------|
| Purpose | What happened inside this room — community-scoped activity record (F2.11 · F2.9) |
| Primary Owner | Shared Community |
| Parent | Community Home / Detail |
| Children | — |
| Entry | Community Home |
| Exit | Shared objects · Back |
| Navigation Targets | Shared Post · User · Game · Event · Community Feed |
| Required Context | Community id · visibility/membership |
| Allowed Actions | Browse activity · open source object |
| Forbidden | Replacing Notifications (attention desk stays F2.9) · engagement pressure metrics |
| Expansion | New activity kinds remain here — no new destination |
| Mechanics | Back: yes |

### Discussion Detail

| Field | Specification |
|-------|----------------|
| Purpose | Community discussion thread (Beta+) |
| Primary Owner | Shared Community |
| Parent | Community Home |
| Children | — |
| Entry | Community Home |
| Exit | Shared Post/User · Back · Report |
| Navigation Targets | User · Post · Report task |
| Required Context | Discussion id |
| Allowed Actions | Read · reply · report |
| Forbidden | Independent forum product IA |
| Expansion | Under Community |
| Mechanics | Back: yes |

---

# GROUP: EVENT (Shared)

### Event Detail

| Field | Specification |
|-------|----------------|
| Purpose | One time-bound gathering — game event · community event · tournament · seasonal event (F2.15) |
| Primary Owner | Shared Event |
| Parent | Shared Event Stack (presented from active tab) |
| Children | — (participants and related objects resolve to Shared destinations) |
| Entry | Events Hub · Home event activity · Shared Community · Shared Game · Notifications · deep event |
| Exit | Shared Community/Game/User/Post · Back to presenter · participation task |
| Navigation Targets | Shared Community · Game · User · Post · Task Share · Task participation confirm |
| Required Context | Event id · visibility (public · community-scoped) |
| Allowed Actions | Read event meaning · participate / withdraw · share · open related objects |
| Forbidden | Bottom tab · calendar product IA · countdown/FOMO pressure architecture · owning Community or Game detail · paid access mechanics (V2) |
| Expansion | New event kinds are variants of this screen — never new destinations |
| Mechanics | Back: yes · Modal: participate / share confirms |

---

# GROUP: ACHIEVEMENT (Shared)

### Achievement Detail

| Field | Specification |
|-------|----------------|
| Purpose | Meaning of one GMRLOG achievement — what it recognizes and current progress (F2.14) |
| Primary Owner | Shared Achievement |
| Parent | Shared Achievement Stack |
| Children | — |
| Entry | Profile Achievements · Shared User Achievements · Home achievement activity · Notifications · deep achievement |
| Exit | Related Shared Game/Review/Collection · Profile · Back |
| Navigation Targets | Profile · Shared User · Shared Game/Review/Collection · Task Share |
| Required Context | Achievement id · subject user for progress · visibility per privacy law |
| Allowed Actions | Read meaning · view own progress · share (owner) |
| Forbidden | Steam achievement mirroring · points/leaderboard economy · streak pressure · purchasable progress (V2 forbidden) · becoming a destination index |
| Expansion | New achievement families reuse this screen |
| Mechanics | Back: yes · Modal: share |

---

# GROUP: SEARCH

Search screens are owned by **Discover** (see Discover · Search · Search Results). No separate Search top-level owner.

---

# GROUP: TASK LAYERS (non-destinations)

Task layers return to origin. They are **not** Feature → Home destinations.

### Compose Chooser

| Field | Specification |
|-------|----------------|
| Purpose | Choose compose type |
| Primary Owner | Task Layer (entry primarily Home) |
| Parent | Modal Layer |
| Children | — (routes to editors) |
| Entry | Home compose · contextual create |
| Exit | Dismiss · open editor task |
| Navigation Targets | Compose Post · Log Game · Write Review · Create Collection · Tier Editor |
| Required Context | Authenticated · origin place |
| Allowed Actions | Select type · dismiss |
| Forbidden | Become Compose tab/destination |
| Expansion | Options per F2.1 permissions |
| Mechanics | Modal · Back/Dismiss: yes · Replace: no |

### Compose Post

| Field | Specification |
|-------|----------------|
| Purpose | Create post |
| Primary Owner | Task Layer |
| Parent | Fullscreen/Modal Task |
| Children | Image Picker task |
| Entry | Compose Chooser · contextual |
| Exit | Dismiss to origin · success may deep-open Shared Post optional |
| Navigation Targets | Origin · Shared Post (optional) · Image Picker |
| Required Context | Auth · origin |
| Allowed Actions | Draft · publish · attach · discard |
| Forbidden | Own Post Detail permanently |
| Expansion | Under tasks |
| Mechanics | Fullscreen Task · Dismiss: yes |

### Log Game

| Field | Specification |
|-------|----------------|
| Purpose | Quick log / status task |
| Primary Owner | Task Layer |
| Parent | Modal/Sheet Task |
| Children | — (may continue to Write Review) |
| Entry | Game · Library · Compose Chooser |
| Exit | Dismiss · optional Write Review task |
| Navigation Targets | Origin · Write Review · Shared Game |
| Required Context | Game id · auth |
| Allowed Actions | Log · set status |
| Forbidden | Replace Library Hub |
| Expansion | Under tasks |
| Mechanics | Modal · Dismiss: yes |

### Write / Edit Review

| Field | Specification |
|-------|----------------|
| Purpose | Author or edit review |
| Primary Owner | Task Layer |
| Parent | Fullscreen Task |
| Children | — |
| Entry | Compose · Game · Review Detail edit |
| Exit | Dismiss · Shared Review on success |
| Navigation Targets | Shared Review · Shared Game · Origin |
| Required Context | Auth · game id and/or review id |
| Allowed Actions | Write · edit · publish · discard |
| Forbidden | Reviews destination tab |
| Expansion | Under tasks |
| Mechanics | Fullscreen · Dismiss: yes |

### Create / Edit Collection

| Field | Specification |
|-------|----------------|
| Purpose | Create/edit collection |
| Primary Owner | Task Layer |
| Parent | Modal/Fullscreen Task |
| Children | — |
| Entry | Library index · Compose · Collection Detail |
| Exit | Dismiss · Shared Collection |
| Navigation Targets | Shared Collection · Library Index · Origin |
| Required Context | Auth · collection id if edit |
| Allowed Actions | Create · edit · save · discard |
| Forbidden | Own Collection Detail as task |
| Expansion | Under tasks |
| Mechanics | Modal/Fullscreen · Dismiss: yes |

### Tier List Editor

| Field | Specification |
|-------|----------------|
| Purpose | Create/edit tier list |
| Primary Owner | Task Layer |
| Parent | Fullscreen Task |
| Children | — |
| Entry | Compose · Library index · Tier Detail |
| Exit | Dismiss · Shared Tier |
| Navigation Targets | Shared Tier · Origin |
| Required Context | Auth · tier id if edit |
| Allowed Actions | Edit tiers · save · discard |
| Forbidden | Tier tab |
| Expansion | Under tasks |
| Mechanics | Fullscreen · Dismiss: yes |

### Account Link (OAuth)

| Field | Specification |
|-------|----------------|
| Purpose | Link an external account — Steam (library source) or Discord (identity provider) — F2.2 · F2.21 |
| Primary Owner | Task Layer |
| Parent | Modal / Fullscreen Task |
| Children | — (may hand off to Steam Library Import task) |
| Entry | Settings Connected Accounts · Onboarding Connect Accounts · Library Import (link-first) · Auth (Discord as optional login method) |
| Exit | Dismiss to origin place · success returns to origin with updated connection state |
| Navigation Targets | Origin · Task Steam Library Import (optional next step) · Settings Connected Accounts |
| Required Context | Origin place · provider identity · authenticated (except Discord-as-login during Auth) |
| Allowed Actions | Authorize · cancel · retry |
| Forbidden | Becoming a destination · blocking the app on failure · requesting more scope than the declared purpose · Discord chat/community surfaces · silent linking |
| Expansion | New providers reuse this one task |
| Mechanics | Modal/Fullscreen · Dismiss: yes · Replace: no |

### Steam Library Import

| Field | Specification |
|-------|----------------|
| Purpose | Bring owned games from a connected Steam account into the personal archive (F2.6 · F2.21) |
| Primary Owner | Task Layer |
| Parent | Modal / Fullscreen Task |
| Children | — |
| Entry | Library Import · Settings Connected Accounts · Onboarding Connect Accounts (deferrable) |
| Exit | Dismiss to origin · completion returns to Library with imported state · interrupted import remains resumable |
| Navigation Targets | Origin · Library Hub / Shelf lists · Shared Game |
| Required Context | Connected Steam account · authenticated owner |
| Allowed Actions | Start · review what will be imported · resolve conflicts with existing library entries · cancel · dismiss while it continues |
| Forbidden | Blocking navigation while running · destroying player-authored library meaning (status · reviews · collections) · importing without explicit consent · one feed item per imported game |
| Expansion | Additional platforms reuse this task pattern |
| Mechanics | Modal/Fullscreen · Dismiss: yes (task continues in background per product policy) · Replace: no |

### Share

| Field | Specification |
|-------|----------------|
| Purpose | Share sheet host |
| Primary Owner | Task Layer |
| Parent | Modal Layer |
| Children | — |
| Entry | Any shareable Shared/Home object |
| Exit | Dismiss |
| Navigation Targets | Origin · external share targets (non-IA) |
| Required Context | Shareable object ref |
| Allowed Actions | Share · copy · dismiss |
| Forbidden | Become destination |
| Expansion | Under tasks |
| Mechanics | Modal · Dismiss: yes |

### Report / Block

| Field | Specification |
|-------|----------------|
| Purpose | Safety report/block flows |
| Primary Owner | Task Layer (Trust/Safety) |
| Parent | Modal Layer |
| Children | — |
| Entry | Objects · users · posts |
| Exit | Dismiss · optional confirmation |
| Navigation Targets | Origin |
| Required Context | Target ref |
| Allowed Actions | Report · block · cancel |
| Forbidden | Admin queue substitute for players |
| Expansion | Under tasks · staff detail separate |
| Mechanics | Modal · Dismiss: yes |

### Delete Confirmation

| Field | Specification |
|-------|----------------|
| Purpose | Confirm destructive delete |
| Primary Owner | Task Layer |
| Parent | Dialog Modal |
| Children | — |
| Entry | Delete intents |
| Exit | Confirm → origin without object · cancel |
| Navigation Targets | Origin |
| Required Context | Target ref |
| Allowed Actions | Confirm · cancel |
| Forbidden | Silent delete without confirm when destructive |
| Expansion | Under tasks |
| Mechanics | Dialog · Dismiss: cancel |

### Image / Media Picker

| Field | Specification |
|-------|----------------|
| Purpose | Pick media for tasks |
| Primary Owner | Task Layer |
| Parent | Modal/Fullscreen Task |
| Children | — |
| Entry | Edit Profile · Compose · editors |
| Exit | Return media to caller task · dismiss |
| Navigation Targets | Caller task |
| Required Context | Caller task |
| Allowed Actions | Pick · crop handoff · cancel |
| Forbidden | Media social network root |
| Expansion | Under tasks |
| Mechanics | Modal/Fullscreen · Dismiss: yes |

### Filters / Sort

| Field | Specification |
|-------|----------------|
| Purpose | Filter/sort task for lists/search |
| Primary Owner | Task Layer (presented from Discover/Library/etc.) |
| Parent | Modal Layer |
| Children | — |
| Entry | Search Results · Library lists · other indexes |
| Exit | Apply to presenter · dismiss |
| Navigation Targets | Presenter list/search |
| Required Context | Presenter |
| Allowed Actions | Apply · reset · dismiss |
| Forbidden | Own Search |
| Expansion | Under tasks |
| Mechanics | Modal · Dismiss: yes |

### Media Viewer

| Field | Specification |
|-------|----------------|
| Purpose | Immersive media view |
| Primary Owner | Task Layer |
| Parent | Fullscreen Layer |
| Children | — |
| Entry | Game gallery · posts · profile media |
| Exit | Dismiss to origin |
| Navigation Targets | Origin |
| Required Context | Media ref |
| Allowed Actions | View · dismiss · optional share task |
| Forbidden | Destination tab · autoplay feed takeover |
| Expansion | Under tasks |
| Mechanics | Fullscreen · Dismiss: yes |

### Bookmarks (Future destination note)

| Field | Specification |
|-------|----------------|
| Purpose | Bookmarks (Future) — if introduced, declare owner before UI (likely Profile or Library child — **must not** invent tab) |
| Primary Owner | TBD at amendment · must register here first |
| Parent | TBD |
| Children | — |
| Entry | TBD |
| Exit | TBD |
| Navigation Targets | Shared objects |
| Required Context | Auth |
| Allowed Actions | Browse · open |
| Forbidden | Ship without parent/owner row |
| Expansion | Requires this catalog update |
| Mechanics | TBD |

### Article Reader / Editor (Future)

| Field | Specification |
|-------|----------------|
| Purpose | Article surfaces (Future) |
| Primary Owner | TBD Shared or Creator child — register before UI |
| Parent | TBD |
| Children | — |
| Entry | TBD |
| Exit | TBD |
| Navigation Targets | TBD |
| Required Context | TBD |
| Allowed Actions | Read/edit per role |
| Forbidden | Silent IA fork |
| Expansion | Catalog first |
| Mechanics | TBD |

---

# GROUP: SYSTEM / STAFF

### Splash

| Field | Specification |
|-------|----------------|
| Purpose | Brand/start moment — no decisions |
| Primary Owner | System Boot |
| Parent | Boot |
| Children | — |
| Entry | App launch |
| Exit | Session Loading |
| Navigation Targets | Session Loading |
| Required Context | Cold start |
| Allowed Actions | None material |
| Forbidden | Auth decisions · browse |
| Expansion | Remains Boot |
| Mechanics | Replace: to Loading · Back: no |

### Session Loading

| Field | Specification |
|-------|----------------|
| Purpose | Restore session safely |
| Primary Owner | System Boot |
| Parent | Boot |
| Children | — |
| Entry | Splash · resume |
| Exit | Auth or Main or Onboarding |
| Navigation Targets | Auth · Onboarding · Home |
| Required Context | Session restore |
| Allowed Actions | Wait · fail to Auth |
| Forbidden | Fake Main content |
| Expansion | Remains Boot |
| Mechanics | Replace: yes · Back: no |

### Moderator Home / Queue

| Field | Specification |
|-------|----------------|
| Purpose | Moderation entry (Beta+) |
| Primary Owner | Moderator Stack |
| Parent | Role Overlay |
| Children | Report Detail |
| Entry | Role gate · Settings/overflow |
| Exit | Report Detail · leave overlay · Main |
| Navigation Targets | Report Detail · Main |
| Required Context | Moderator role |
| Allowed Actions | Open queues |
| Forbidden | Player tab · replace five roots for players |
| Expansion | Under Mod stack |
| Mechanics | Back: leave overlay |

### Report Detail (Staff)

| Field | Specification |
|-------|----------------|
| Purpose | Staff report handling |
| Primary Owner | Moderator Stack |
| Parent | Moderator Home |
| Children | — |
| Entry | Queue |
| Exit | Queue · Shared object preview |
| Navigation Targets | Queue · Shared preview |
| Required Context | Report id · role |
| Allowed Actions | Moderate actions per Trust law |
| Forbidden | Player Report task substitute |
| Expansion | Under Mod |
| Mechanics | Back: yes |

### Admin Home

| Field | Specification |
|-------|----------------|
| Purpose | Admin ops home (Future) |
| Primary Owner | Admin Stack |
| Parent | Role Overlay |
| Children | Admin user/content tools |
| Entry | Role gate |
| Exit | Children · Main |
| Navigation Targets | Admin tools · Main |
| Required Context | Admin role |
| Allowed Actions | Open admin tools |
| Forbidden | Player tab bar hijack |
| Expansion | Under Admin |
| Mechanics | Back: leave overlay |

### Admin User / Content Tools

| Field | Specification |
|-------|----------------|
| Purpose | Admin tool surfaces (Future) |
| Primary Owner | Admin Stack |
| Parent | Admin Home |
| Children | — |
| Entry | Admin Home |
| Exit | Back |
| Navigation Targets | Admin Home · Shared previews |
| Required Context | Admin role |
| Allowed Actions | Staff operations |
| Forbidden | Leak into player IA |
| Expansion | Under Admin |
| Mechanics | Back: yes |

---

# Empty / Error patterns

Empty and Error are **state patterns** hosted by destination screens (F5.2 Home states; F3.6 globally). They are not separate owned destinations unless a dedicated blocking system error screen is required:

### Blocking System Error (optional host)

| Field | Specification |
|-------|----------------|
| Purpose | Unrecoverable session/bootstrap failure messaging |
| Primary Owner | System |
| Parent | Boot / System |
| Children | — |
| Entry | Boot failure |
| Exit | Retry → Loading · Auth |
| Navigation Targets | Loading · Auth |
| Required Context | Failure reason |
| Allowed Actions | Retry |
| Forbidden | Replace Notifications |
| Expansion | System only |
| Mechanics | Replace: retry · Back: no |

---

## Ownership matrix (summary)

| Owner | Screens (abbrev.) |
|-------|-------------------|
| System Boot | Splash · Session Loading · Blocking Error |
| Authentication | Login · Register · OAuth · Reset · Soft-Gate |
| Onboarding | Taste · Platforms · Connect Accounts (optional) · Follow Suggestions |
| Home | Activity Feed |
| Discover | Hub · Search · Results · Communities Hub · Events Hub |
| Library | Hub · Shelves · Wishlist · Backlog · Collections Index · Tier Index · Library Import · Hidden Archive |
| Notifications | List · Activity Center |
| Profile | Own Profile · Edit · (self) social/stats/achievements · Messages entry · future hubs |
| Settings | Hub + sections (incl. Connected Accounts under Account) |
| Shared Game | Detail + game children lists/galleries/related/guides |
| Shared Post | Detail · Comment Thread (post host) |
| Shared Review | Detail · Comment Thread (review host) |
| Shared Collection | Detail |
| Shared Tier | Detail |
| Shared User | Other Profile + other-subject lists |
| Shared Community | Home · Feed · Members · Activity · Discussion |
| Shared Event | Event Detail |
| Shared Achievement | Achievement Detail |
| Messages Stack | Inbox · Conversation |
| Task Layer | All compose/edit/share/report/picker/filter/viewer confirms · Account Link · Steam Library Import |
| Moderator / Admin | Staff stacks |

---

## Audit Checklist

- [ ] Every listed screen has one owner · one purpose · parent · children · entry · exit · navigation · expansion  
- [ ] Hierarchy complete under Main / Auth / Onboarding / Shared / Tasks / Staff  
- [ ] Shared Destinations remain shared · Home does not own them (F5.2)  
- [ ] Compose and editors are tasks · not destinations  
- [ ] No Search/Messages/Communities/Events/Achievements/Settings/Admin player tabs  
- [ ] MVP integrations (Steam · Discord) remain optional: no screen requires a connected account to exist  
- [ ] Import and account-link flows are task layers that return to origin  
- [ ] Community sub-surfaces stay children of Shared Community · Event and Achievement stay single shared destinations  
- [ ] Compatible with F5.1 · F5.2 · F2.1 inventory  
- [ ] No UI · components · spacing · type · animation · color  
- [ ] No backend · API · DB · network · RN · Expo · algorithms · code  
- [ ] Future screens (Bookmarks · Articles · Guides · Admin tools) require catalog update before UI  

---

## Final gate

### LOCKED — Product Architecture frozen

**Sprint F5.3 — Screen Specifications** is **LOCKED** at Version 1.1 following the MVP Final Integration Amendment.

Future changes must be introduced via Amendment documents only.

---

## Related documents

| Doc | Role |
|-----|------|
| [F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md](./F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | Structure · ownership homes |
| [F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md](./F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | Home feed boundaries |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | Locked inventory · stacks · modals |
| [F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md](../04_UI/F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md) | F4 close · F5 authorized |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |
| [F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md](./F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | **DRAFT** Interaction & component behavior |
| [F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md](./F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **DRAFT** Implementation constitution · F5 close |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Full screen catalog: groups · 12-field specs · hierarchy · task layers · ownership matrix; no UI/engineering |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — catalog extended: Onboarding Connect Accounts · Events Hub · Library Import · Settings Connected Accounts · Community Feed/Members/Activity · Shared Event · Shared Achievement · Account Link and Steam Library Import tasks; Game/Collection/Profile specs clarified for ownership indicator, semantic similarity slots and GMRLOG achievements; no new tabs · no UI |
| 1.1 | July 2026 | Version 1.1 — MVP Final Integration Amendment verified. Product Architecture frozen. |
