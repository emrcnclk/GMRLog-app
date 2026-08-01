# GMRLOG — Sprint F5.2: Home Feed Product Architecture Specification

**Document:** `docs/05_PRODUCT_ARCHITECTURE/F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md`  
**Version:** 1.1  
**Status:** **LOCKED**  
**Sprint:** F5.2 (Home Feed Product Architecture Specification — architecture only) · amended by **MVP Final Integration Amendment** (§6.4)  
**Last Updated:** July 2026  
**Owner:** Product Architecture Director  
**Classification:** Product Architecture Specification

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | Entire F1 ([`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md)) |
| 4 | Entire F2 — especially [`SPRINT_F2_7_HOME_FEED.md`](../02_DESIGN/SPRINT_F2_7_HOME_FEED.md) · [`SPRINT_F2_3_HOME_FEED.md`](../02_DESIGN/SPRINT_F2_3_HOME_FEED.md) · [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | Entire F3 — especially [`F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md`](../03_UX/F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md) |
| 6 | Entire F4 ([`F4_13`](../04_UI/F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md) closes F4) |
| 7 | [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](./F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) |
| 8 | **This document** — Home Feed Product Architecture Specification |

Never contradict previous freezes.

Never redesign UX.

Never redesign UI.

Never redefine Information Architecture.

This sprint specifies only the **architectural specification of Home**.

This document answers:

> “What exactly exists inside Home?”

rather than:

> “How should Home look?”  
> “How is Home implemented?”  
> “What should maximize engagement?”

| Does | Does not |
|------|----------|
| Define Home ownership · feed hierarchy · object taxonomy · sections · states · compose entry · navigation relationships | UI · visual design · components · animations · spacing · color · type |
| Specify feed continuity · empty/loading/error architecture · expansion | Ranking · recommendation algorithms · ML · caching · networking · backend · API · DB · RN · Expo · code |

**Gate:** Stop after this specification. Do **not** continue to Sprint F5.3.

---

## Scope

**In scope:** Home ownership · feed architecture · hierarchy · sections · object taxonomy · responsibilities · entry/exit · relationships · navigation ownership · contextual compose ownership · feed state architecture · refresh · loading · empty · error recovery · continuity · future extensibility · anti-patterns · audit.

**Out of scope:** UI · visual design · components · animations · spacing · colors · typography · ranking · recommendation algorithms · ML · caching · networking · backend · API · database · engineering · Expo · React Native · implementation · Sprint F5.3.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Home Purpose |
| 3 | Architectural Responsibilities |
| 4 | Ownership Boundaries |
| 5 | Feed Hierarchy |
| 6 | Feed Object Taxonomy |
| 7 | Feed Sections |
| 8 | Feed States |
| 9 | Refresh Philosophy |
| 10 | Loading Philosophy |
| 11 | Empty State Philosophy |
| 12 | Error Recovery Philosophy |
| 13 | Feed Continuity |
| 14 | Contextual Compose Architecture |
| 15 | Navigation Relationships |
| 16 | Feed Interaction Architecture |
| 17 | Ownership Rules |
| 18 | Access Rules |
| 19 | Future Expansion Policy |
| 20 | Anti-Patterns |
| 21 | Audit Checklist |

Every feed object (§6) declares: Purpose · Owner · Entry · Exit · Connected Destinations · Expansion Policy.

---

# 1. Mission

Specify the complete product architecture of the **Home** destination so that Activity Feed ownership, object taxonomy, and routing responsibilities are unambiguous.

Home exists to maintain **Digital Home continuity** through culture heartbeat — not to maximize session length.

Align F2.7 · F3.8 · F5.1 §9.

---

# 2. Home Purpose

Home represents:

> “What happened in my gaming world?”

| Home is | Home is not |
|---------|-------------|
| Today’s culture heartbeat | Library (memory archive) |
| Living room of Digital Home | Discover (possibility / explore-next) |
| Orientation into shared culture objects | A destination for Game / Post / Review ownership |
| Primary architectural entry for Compose **action** | A Compose **place** or sixth tab |

| Never |
|-------|
| “What should maximize engagement?” |
| “Endless content consumption.” |
| Dashboard · casino · widget wall |

---

# 3. Architectural Responsibilities

Home is responsible for:

| Responsibility |
|----------------|
| Owning the Activity Feed as the Home root surface |
| Presenting culture activity in a continuous feed |
| Declaring feed object types and their routing to Shared Destinations |
| Providing the primary Compose **action** entry (F2.1 hybrid) |
| Preserving feed continuity across leave/return within Home stack rules |
| Expressing loading · empty · error · refresh as Home-owned state architecture |
| Keeping one feed identity across device classes (F4.11 · F5.1) |

Home is **not** responsible for:

| Not responsible |
|-----------------|
| Owning Shared Destinations (Game · Post · Review · Collection · Tier · User · Community) |
| Ranking / recommendation algorithms |
| Network / cache / persistence engineering |
| Discover hub ownership |
| Library archive ownership |
| Notifications list ownership |

---

# 4. Ownership Boundaries

## 4.1 Home owns

| Owns |
|------|
| Activity Feed (root of `home`) |
| Feed sections as **pacing structure** (not tabs) |
| Feed presentation slots for activity objects |
| Primary Compose action entry on Home |
| Home stack presentation context when pushing Shared Destinations |
| Home-level refresh / loading / empty / error states for the feed surface |

## 4.2 Home does not own

| Does not own | Owner |
|--------------|-------|
| Game | Shared Game (F5.1) |
| Review | Shared Review |
| Post | Shared Post |
| Collection | Shared Collection (detail) · Library (index) |
| Tier List | Shared Tier (detail) · Library (index) |
| User (other) | Shared User |
| Community | Shared Community · Discover hub entry |
| Search | Discover |
| Settings | Settings via Profile |
| Notifications list | Notifications |

**Home presents activity and routes toward those destinations.**

Presentation ≠ ownership.

---

# 5. Feed Hierarchy

```
HOME (destination)
└── Activity Feed (root surface)
    ├── Feed chrome (orientation only — not a rival feed)
    ├── Continuous feed body
    │   ├── Pacing sections (logical, not navigational tabs)
    │   └── Feed objects (typed activity items)
    ├── Compose action entry (action — not child destination)
    └── Home-owned states (loading · empty · error · refreshing)
```

| Law |
|-----|
| Exactly one Activity Feed root under Home |
| Sections influence pacing — they are **not** top-level destinations (F2.7) |
| Objects route out; they do not create parallel Homes |
| No secondary “Home mode” that becomes a second architecture |

---

# 6. Feed Object Taxonomy

Feed objects are **activity presentations**. Their detail destinations remain Shared (or task layers).

Align F2.7 six equal content pillars as **taxonomy of activity kinds** — not as six feeds, not as six tabs, not as ranking logic.

## 6.1 Object classes

| Object class | Purpose | Owner (presentation) | Detail owner | Entry (into feed) | Exit (from item) | Connected destinations | Expansion policy |
|--------------|---------|----------------------|--------------|-------------------|------------------|------------------------|------------------|
| Review activity | Surface review culture in heartbeat | Home feed | Shared Review | Feed insertion | → Shared Review · optional Shared Game / User | Review · Game · User | New review-adjacent modules remain this class or Shared Review — not a new Home |
| Post activity | Surface social post culture | Home feed | Shared Post | Feed insertion | → Shared Post · User · Community | Post · User · Community · Game | Same |
| Collection activity | Surface collection culture | Home feed | Shared Collection | Feed insertion | → Shared Collection · User | Collection · User · Game | Indexes stay Library |
| GameLog / logging activity | Surface play/log culture | Home feed | Shared Game (+ log tasks) | Feed insertion | → Shared Game · task layers | Game · Library | Logging tasks remain actions |
| Tier List activity | Surface tier culture | Home feed | Shared Tier | Feed insertion | → Shared Tier · User | Tier · User · Game | Indexes stay Library |
| Friend / network activity | Surface relational gaming activity | Home feed | Shared User / domain | Feed insertion | → Shared User · Game · Post | User · Game · Post | Must not become stalker dashboard |
| Creator-integrated activity | Creator culture inside same rhythm | Home feed | Shared destinations | Feed insertion | → Post / Review / User / Game | Same graph as peers | No paywalled culture feed (F2.7 · F2.16) |
| Recommendation placeholder activity | Taste-forward suggestion **presentation slot** | Home feed (presentation only) | Typically Shared Game / User / Collection | Feed insertion | → Shared destination | Discover kinship · Shared | **No algorithm defined here**; ethics from F2.7 · F3.8; must not become feed identity |
| Community activity | Surface culture of rooms the player belongs to (F2.11) | Home feed | Shared Community (+ children) | Feed insertion | → Shared Community · Post · User | Community · Post · User · Game · Event | Community-scoped streams stay under Shared Community — Home never becomes a communities tab |
| Event activity | Surface time-bound gatherings (F2.15) | Home feed | Shared Event | Feed insertion | → Shared Event · Community · Game | Event · Community · Game | New event kinds reuse this class — no event dashboard, no countdown urgency layer |
| Achievement activity | Surface GMRLOG achievement moments (F2.14) | Home feed | Shared Achievement | Feed insertion | → Shared Achievement · Profile / Shared User | Achievement · Profile · User · Game | GMRLOG achievements only — never Steam achievements · never score/leaderboard pressure |
| Library import activity | Surface games entering a library through import (F2.6 · F2.21) | Home feed | Shared Game (+ Library) | Feed insertion (own or followed activity, per privacy) | → Shared Game · Library | Game · Library · User | Import bursts must be summarized, never spammed as one item per game |

## 6.2 Object declaration law

Every feed object must declare:

| Field | Required |
|-------|----------|
| Purpose | Why it appears in Home heartbeat |
| Owner | Home for presentation; Shared/task for detail |
| Entry | How it enters the feed body |
| Exit | Where player goes next |
| Connected Destinations | Shared / task targets |
| Expansion Policy | How future variants attach |

Undeclared object types may not ship into Home.

## 6.3 Equality law

No object class permanently dominates the feed architecture (F2.7 · F2.3).

Dominance via ranking engines is **out of scope** here — but architectural monoculture (a Home that only knows one object class) is forbidden.

## 6.4 MVP Integration Amendment — object placement (July 2026)

Six MVP features touch Home. Home gains **presentation classes**, not ownership.

| Feature | Home expression | Ownership stays with | Constraint |
|---------|-----------------|----------------------|------------|
| Steam Sync | Library import activity class (summarized) | Library (F2.6) · integration layer (F2.21) | Optional feature — a player with no Steam link sees a complete Home |
| Discord Account Linking | **None** | Settings → Connected Accounts | Identity provider only — no Discord content, no chat, no presence in the feed |
| Semantic Smart Recommendations | Recommendation presentation slot (semantic similarity between games · reviews · genres · tags · declared preferences) | Discover (F2.10 · F2.19) | Not an assistant · not generative AI · no algorithm in this document · never feed identity |
| Communities | Community activity class | Shared Community | Respects community visibility and membership; joining is a task, not a feed action |
| Events | Event activity class | Shared Event | No urgency manipulation, no FOMO countdown architecture (F3.10 · F2.3) |
| Achievements | Achievement activity class | Profile index + Shared Achievement | Reflection of a player's own history — not competitive scoring |

| Amendment law |
|---------------|
| All new classes obey §6.2 declaration law and §6.3 equality law |
| No new class may claim a permanent slot, fixed position or guaranteed share of the feed |
| Optional-integration classes must degrade silently when the integration is absent |
| No new Home section becomes a destination because of these features (§7) |

---

# 7. Feed Sections

Sections are **pacing structures** inside one continuous feed — not navigation tabs (F2.7).

| Law |
|-----|
| One continuous feed body |
| Sections may group or pace object kinds |
| Sections must not become separate Home destinations |
| Sections must not fork mobile vs desktop Home architectures |
| Section labels (if any later) are presentation — ownership remains Home |

Architectural section roles (meaning, not UI):

| Section role | Meaning |
|--------------|---------|
| Primary heartbeat | Core culture activity stream |
| Relational accent | Friend / network activity pacing |
| Taste accent | Suggestion presentation slots (ethics-bound · no algo here) |
| Creator-integrated accent | Creator activity inside same rhythm — not a gated silo |

Sections may be empty; emptiness does not invent a second feed.

---

# 8. Feed States

Home owns the following **feed surface states** (align F3.6 · F4.8 state classes — architecture only):

| State | Meaning for Home |
|-------|------------------|
| Resting | Feed ready · scrollable culture body |
| Loading (initial) | First paint of feed meaning in transit |
| Refreshing | Explicit or implicit refresh in progress |
| Partially available | Some objects present · some regions recovering |
| Empty | No activity yet · orientation + next step |
| Error | Feed failed · recovery path required |
| Offline-aware (future) | Honesty about connectivity — no fake heartbeat |

| Law |
|-----|
| States describe condition of the Home feed surface |
| States must not invent a rival destination |
| Error must not redirect ownership to Discover/Library as a silent Home replacement |

---

# 9. Refresh Philosophy

| Law |
|-----|
| Refresh re-synchronizes Home heartbeat meaning |
| Refresh must not trap players in loading theater |
| Refresh must not wipe orientation without cause |
| Pull/reselect behaviors project F2.1 Home long-press / reselect roots — architecture: return to feed root + refresh affordance is Home-owned |
| Refresh is not a recommendation reseed spectacle |

---

# 10. Loading Philosophy

| Law |
|-----|
| Loading protects trust while feed meaning is unknown |
| Prefer structured waiting that preserves Home place identity |
| Never fake completion of culture activity |
| Never use loading as engagement entertainment |
| Region honesty preferred when partial feed remains usable |

Align F4.8 · F4.9 loading meaning — no timings here.

---

# 11. Empty State Philosophy

| Law |
|-----|
| Empty Home is orientation — not failure shame |
| Explain what Home is for · offer calm next steps (compose action · Discover · Library — as routes, not ownership theft) |
| Invite without FOMO strips (F3.8 · F3.11) |
| Do not fill emptiness with unrelated engagement modules or widget walls |
| Empty ≠ Error |

---

# 12. Error Recovery Philosophy

| Law |
|-----|
| Errors teach and recover (F3.1 · F3.6) |
| Offer retry without blaming the player for system failure |
| Distinguish blocking vs partial failure |
| Never use error chrome as marketing urgency |
| Recovery returns to Home feed ownership — not a random tab |

---

# 13. Feed Continuity

| Law |
|-----|
| Leaving to a Shared Destination and returning should feel like leaving a room and coming back (F3.2 · F4.9) |
| Home stack preserves feed place per F5.1 / F2.1 stack rules |
| Continuity is Digital Home continuity — not infinite scroll addiction |
| Device class changes adapt chrome — not a different Home product (F4.11) |
| One feed identity worldwide |

---

# 14. Contextual Compose Architecture

Compose is an **ACTION**.

Never a destination.

Never a tab.

| Law |
|-----|
| Home is the **primary architectural entry** for Compose (F2.1 hybrid) |
| Contextual create may exist on Library / Discover / Game / Profile — still actions |
| Compose chooser / editors live in Modal / Fullscreen **task layers** (F5.1) |
| Compose options (architecture): Post · Log/Review · Collection · Tier List |
| Completing compose returns to origin place · may result in future feed activity — Home does not own the created Shared object |

```
Home
  └── Compose action
        → task layer (chooser)
        → task layer (editor)
        → dismiss → Home (or origin)
        → created object owned by Shared / Library indexes as applicable
```

---

# 15. Navigation Relationships

## 15.1 Entries into Home

| Entry | Rule |
|-------|------|
| Top-level `home` | Opens Activity Feed root |
| Reselect Home | Pop to feed root (F2.1) |
| Deep-link root home | Resolves to Home feed |
| Post-auth / post-onboarding | Lands Main App · Home (F5.1) |
| Back from Shared opened via Home | Returns toward Home stack |

## 15.2 Exits from Home

| Exit | Target class |
|------|----------------|
| Feed object open | Shared Destination |
| Compose | Task layer (not a place) |
| Tab change | Other top-level destinations |
| Contextual jump to Search | Discover-owned Search (presentation may start from Home affordance — ownership remains Discover) |

## 15.3 Compatibility with F5.1

| Rule |
|------|
| Home remains Core Product stratum |
| Feature → Home map: feed + compose hub stay Home-owned |
| No new top-level destination created by feed features |
| Shared destinations remain shared |

---

# 16. Feed Interaction Architecture

Interactions on feed objects are **routing and task intents**, not Home ownership of domains.

| Interaction class | Architectural meaning |
|-------------------|------------------------|
| Open object | Navigate to Shared Destination |
| Open actor | Navigate to Shared User (or Profile if self — rare from feed) |
| Open game context | Navigate to Shared Game |
| Quick react / lightweight social | May complete in place or confirm via task — must not invent a Social root under Home |
| Overflow / more | Task sheet — not a new Home section destination |
| Compose | Action → task layer |

| Law |
|-----|
| In-place interactions must not silently become hidden destinations |
| Destructive or heavy create/edit uses task layers |
| Interaction meaning stays predictable (F4.7 · F4.8) |

---

# 17. Ownership Rules

| Rule |
|------|
| Home owns the Activity Feed |
| Home does not own Game · Review · Post · Collection · Tier · User · Community · Event · Achievement |
| Home does not own integrations, import tasks or connected-account state (F2.21 · Settings) |
| Presentation slots ≠ domain ownership |
| Compose remains an action owned as entry from Home — editors are tasks |
| Recommendation presentation slots do not transfer algorithm ownership into this document |
| No duplicated ownership with Discover for “what happened” vs “what to explore” |

---

# 18. Access Rules

| Audience | Home access |
|----------|-------------|
| Guest | Soft-gate on restricted actions; limited public preview policy per F2.2 — Home full heartbeat is authenticated |
| Authenticated + onboarded | Full Home feed |
| Authenticated incomplete | Onboarding gate before Main Home (F5.1) |
| Premium / Creator / Developer | Same Home architecture — hubs are not alternate Homes |
| Staff | Same player Home; staff tools stay Admin/Mod overlays |

---

# 19. Future Expansion Policy

| Allowed | Forbidden without higher-law amendment |
|---------|------------------------------------------|
| New feed object classes with full §6 declaration | New Home tab / second Home root |
| New pacing section roles inside one feed | Desktop-only or mobile-only Home architecture |
| New contextual compose shortcuts (still actions) | Compose destination / Compose tab |
| Ethics-bound suggestion slots | Engagement-first feed identity |
| Seasonal/events entry continuity (F2.15) without takeover | Widget dashboard Home |

Expansion must update this document’s taxonomy and F5.1 Feature → Home if needed.

---

# 20. Anti-Patterns

Explicitly forbid:

| Banned |
|--------|
| Dashboard behavior |
| Casino engagement |
| Infinite feature dumping into Home |
| Recommendation-first architecture (Home becomes Discover-as-addiction) |
| Widget walls |
| Multiple feed identities |
| Desktop-specific feed architecture |
| Mobile-specific feed architecture |
| Multiple Home architectures |
| Duplicated ownership of Shared Destinations |
| FOMO urgency strips as “culture” |
| Autoplay / novelty pressure as feed foundation (F3.8) |
| Paywalled culture heartbeat |
| Loading / refresh theater |
| Treating Compose as a place |

If a Home change’s best argument is engagement metrics, it is architecturally illegitimate (F2.22 · F2.29 · F3.8).

---

# 21. Audit Checklist

### Responsibility
- [ ] Home has exactly one architectural responsibility: culture heartbeat Activity Feed  
- [ ] Answers “What exactly exists inside Home?”  
- [ ] Feed ownership unambiguous  

### Boundaries
- [ ] Shared Destinations remain shared  
- [ ] Compose remains an action · never destination/tab  
- [ ] Search remains Discover-owned  
- [ ] Library / Notifications / Profile ownership untouched  

### Structure
- [ ] Feed hierarchy · taxonomy · sections · states defined  
- [ ] Every object class declares Purpose · Owner · Entry · Exit · Connected · Expansion  
- [ ] Navigation relationships compatible with F5.1 · F2.1  
- [ ] Continuity · refresh · loading · empty · error architectures present  

### Purity
- [ ] No UI · visual · component · animation · spacing · color · type decisions  
- [ ] No ranking · recommendation algorithm · ML · cache · network · backend · API · DB  
- [ ] No engineering · Expo · RN · implementation  
- [ ] Compatible with F1 · F2 (esp. F2.7 · F2.3 · F2.1) · F3 (esp. F3.8) · F4 · F5.1  
- [ ] Anti-patterns explicit  
- [ ] Ready for F5.3 (when opened)  

---

## Final gate

### LOCKED — Product Architecture frozen

**Sprint F5.2 — Home Feed Product Architecture Specification** is **LOCKED** at Version 1.1 following the MVP Final Integration Amendment.

Future changes must be introduced via Amendment documents only.

---

## Related documents

| Doc | Role |
|-----|------|
| [F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md](./F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | **DRAFT** Interaction & component behavior |
| [F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md](./F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **DRAFT** Implementation constitution · F5 close |
| [SPRINT_F2_7_HOME_FEED.md](../02_DESIGN/SPRINT_F2_7_HOME_FEED.md) | Home heartbeat constitution |
| [SPRINT_F2_3_HOME_FEED.md](../02_DESIGN/SPRINT_F2_3_HOME_FEED.md) | Feed rhythm continuity |
| [SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md](../02_DESIGN/SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) | Feed identity amendment |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | Home tab · compose hybrid |
| [F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md](../03_UX/F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md) | Home UX experience |
| [F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md](../04_UI/F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md) | F4 close · F5 authorized |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Design SSOT |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Home Feed product architecture: ownership boundaries; object taxonomy; sections as pacing; compose as action; states; anti-patterns; no UI/algo/engineering |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — feed taxonomy extended with community · event · achievement · library-import activity classes; semantic recommendation slot clarified; new §6.4 placement law; ownership rules extended; no new Home root/section destinations |
| 1.1 | July 2026 | Version 1.1 — MVP Final Integration Amendment verified. Product Architecture frozen. |
