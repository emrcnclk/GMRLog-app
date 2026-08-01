# GMRLOG — Sprint F5.4: Interaction & Component Behavior Specification

**Document:** `docs/05_PRODUCT_ARCHITECTURE/F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md`  
**Version:** 1.1  
**Status:** **LOCKED**  
**Sprint:** F5.4 (Interaction & Component Behavior Specification — architecture only) · amended by **MVP Final Integration Amendment** (§38.1 · §42.1)  
**Last Updated:** July 2026  
**Owner:** Product Architecture Director  
**Classification:** Interaction Specification

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | Entire F1 |
| 4 | Entire F2 |
| 5 | Entire F3 — especially F3.4 · F3.6 · F3.2 |
| 6 | Entire F4 — especially F4.7 · F4.8 · F4.9 |
| 7 | [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](./F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) |
| 8 | [`F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md`](./F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) |
| 9 | [`F5_3_SCREEN_SPECIFICATIONS.md`](./F5_3_SCREEN_SPECIFICATIONS.md) |
| 10 | **This document** |

Never contradict previous freezes.

Never redesign UI or UX philosophy.

Never introduce implementation.

This document answers:

> “How should every interaction behave?”

rather than:

> “How should it look?” · “How should it be implemented?”

| Does | Does not |
|------|----------|
| Define navigation · gesture · modal · selection · loading · empty · error · confirmation · component interaction consistency | Colors · typography · spacing · icons · animations (values) |
| Specify behavior contracts across the product | Backend · API · DB · network · RN · Expo · code |

**Gate:** Stop after this specification.

---

## Scope

**In scope:** Navigation · tap · long-press · swipe · scroll · refresh · modal · bottom sheet · fullscreen task · selection · multi-select · loading · error · empty · confirmation · Back · component interaction consistency for listed control families.

**Out of scope:** Colors · typography · spacing · icons · animation recipes · backend · API · database · networking · engineering · React Native · Expo · implementation.

---

## Deliverable map

| Part | Content |
|------|---------|
| A | Mission · Global principles · Interaction field template |
| B | Navigation & Back |
| C | Gestures (tap · long-press · swipe · scroll · refresh) |
| D | Layers (modal · sheet · fullscreen · overlays) |
| E | Selection · confirmation |
| F | Loading · empty · error · offline |
| G | Component family behavior contracts |
| H | Task-layer behaviors |
| I | Consistency · anti-patterns · audit |

---

# PART A — FOUNDATION

---

# 1. Mission

Specify how every interaction behaves across GMRLOG so that identical meanings produce identical outcomes everywhere.

Behavior projects F3.4 · F4.7 · F4.8 · F5.1–F5.3 — it does not invent new product structure or visual language.

---

# 2. Global Interaction Principles

Interaction must always be:

| Principle |
|-----------|
| Predictable |
| Fast (in meaning — acknowledge intent promptly) |
| Consistent |
| Reversible when possible |
| Respectful of user intent |
| Low friction |
| Never surprising |

| Never |
|-------|
| Engagement-first friction or traps |
| Hidden critical actions |
| Same affordance · different outcome by screen tribe |
| Gesture-only critical paths without alternatives (F2.18 · F2.1) |

---

# 3. Interaction Field Template

Unless noted, each interaction contract declares:

| Field |
|-------|
| Purpose |
| Trigger |
| Expected Behavior |
| Navigation Result |
| Cancellation Rules |
| Failure Behavior |
| Recovery Behavior |
| Consistency Rules |
| Expansion Policy |

---

# PART B — NAVIGATION & BACK

---

# 4. Navigation Behavior (global)

| Field | Specification |
|-------|----------------|
| Purpose | Move between destinations and tasks without losing place meaning (F5.1 · F3.2) |
| Trigger | Tab select · item open · deep link resolve · task open · programmatic return |
| Expected Behavior | Resolve to declared F5.3 screen/task; preserve ownership; announce place |
| Navigation Result | Push destination · switch tab · open task layer · replace only when gate success requires |
| Cancellation Rules | Back/dismiss where allowed; never cancel by inventing a new root |
| Failure Behavior | Stay put · show recoverable error · do not orphan |
| Recovery Behavior | Retry navigation · return to last stable destination |
| Consistency Rules | Same target type → same navigation class everywhere |
| Expansion Policy | New screens must declare nav class in F5.3 before new behaviors |

---

# 5. Back Navigation

## 5.1 Back behavior

| Field | Specification |
|-------|----------------|
| Purpose | Honor return promise (F2.1 · F3.2 · F4.9) |
| Trigger | System Back · header back · dismiss affordance · gesture back where platform provides |
| Expected Behavior | Reverse the last meaningful navigation step |
| Navigation Result | Previous destination · dismiss task · leave overlay |
| Cancellation Rules | Back itself is cancellation of forward move |
| Failure Behavior | If no history: stay on root or leave app per platform policy — never random tab |
| Recovery Behavior | N/A |
| Consistency Rules | Hardware · gesture · header Back agree on meaning |
| Expansion Policy | No screen invents private Back dialects |

## 5.2 Stack restoration

| Rule |
|------|
| Pop restores prior screen in the same stack |
| Tab stacks remain independent (F2.1) |
| Opening Shared Destination from a tab pushes in presentation context; Back returns toward that context |

## 5.3 Modal dismissal

| Rule |
|------|
| Dismiss / Back on modal closes task without committing destructive change unless already confirmed |
| Underlying destination remains |

## 5.4 Task completion return

| Rule |
|------|
| Successful task dismisses to **origin place** |
| Optional open of created Shared Destination is explicit — not silent replace of Home |

## 5.5 Deep-link return

| Rule |
|------|
| After soft-gate Auth, resume queued target (F5.1 · F5.3) |
| Back from deep target follows normal stack — does not invent fake history of unvisited tabs |

## 5.6 Tab restoration

| Rule |
|------|
| Switching tabs preserves each tab’s stack |
| Reselect selected tab → pop to that tab’s root (F2.1 · F5.2 Home) |
| Tab switch is not Back |

---

# PART C — GESTURES

---

# 6. Tap Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Primary activation of affordances |
| Trigger | Single tap / click on interactive target |
| Expected Behavior | Activate primary action of the control |
| Navigation Result | Per control contract (open · submit · toggle · navigate) |
| Cancellation Rules | Tap outside may dismiss overlays that allow it |
| Failure Behavior | No navigation · error feedback if action fails |
| Recovery Behavior | Retry tap after recovery |
| Consistency Rules | Same control type · same tap meaning everywhere |
| Expansion Policy | New controls declare tap meaning before ship |

---

# 7. Long Press Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Secondary / shortcut actions without hiding primary tap |
| Trigger | Long press on allowed targets (F2.1 tab long-press map; object overflow) |
| Expected Behavior | Open context menu / action sheet · or tab shortcut sheet |
| Navigation Result | Usually task layer — not a new destination |
| Cancellation Rules | Dismiss sheet · no commit |
| Failure Behavior | No menu · optional error |
| Recovery Behavior | Retry |
| Consistency Rules | Long press never replaces primary open on cards (tap still opens) |
| Expansion Policy | New long-press targets must not become gesture-only critical paths |

**Tab long-press (architecture — F2.1):** Home → feed root/refresh affordance · Discover → focus Search · Library → wishlist/backlog shortcuts · Notifications → mark-all (confirm if needed) · Profile → v1 own profile root (future switch/share).

---

# 8. Swipe Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Optional efficiency gestures · dismiss sheets · back gesture where platform-standard |
| Trigger | Horizontal/vertical swipe on allowed surfaces |
| Expected Behavior | Platform-consistent dismiss/back · optional list actions only if also available via buttons/menus |
| Navigation Result | Dismiss · Back · reveal secondary actions |
| Cancellation Rules | Incomplete swipe snaps back · no accidental delete |
| Failure Behavior | No destructive commit on failed swipe |
| Recovery Behavior | Undo when destructive swipe exists |
| Consistency Rules | Destructive swipe requires confirmation or undo · never swipe-only critical safety |
| Expansion Policy | No casino swipe-to-engage patterns |

---

# 9. Scroll Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Browse content within a destination |
| Trigger | Scroll gesture / wheel / scrollbar |
| Expected Behavior | Move content · preserve reading corridor ownership of the screen |
| Navigation Result | None by itself |
| Cancellation Rules | N/A |
| Failure Behavior | Overscroll must not navigate away unexpectedly |
| Recovery Behavior | N/A |
| Consistency Rules | Same list/feed family scrolls the same way |
| Expansion Policy | Nested scroll must not trap focus (a11y) |

### Feed scrolling (Home)

| Rule |
|------|
| Continuous feed scroll (F5.2) · sections are pacing not tabs |
| Infinite scroll philosophy: may extend content · must not invent addiction loops or fake bottom |
| Scroll restoration: returning via Back should restore meaningful position when continuity requires (F5.2 continuity) — not surprise jump without cause |
| Position memory: per Home stack rules · not a second Home |

### Nested scrolling

| Rule |
|------|
| Child scroll regions must not steal parent Back |
| Horizontal carousels (if any later) must not block vertical feed without clear affordance |

---

# 10. Refresh Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Re-synchronize destination meaning (F5.2) |
| Trigger | Pull-to-refresh where allowed · explicit refresh · Home reselect/long-press affordance |
| Expected Behavior | Enter refreshing state · update content honestly |
| Navigation Result | Stay on same destination |
| Cancellation Rules | User may scroll during non-blocking refresh if partial content remains |
| Failure Behavior | Keep prior content if possible · show recoverable error |
| Recovery Behavior | Retry refresh |
| Consistency Rules | Refresh never opens a new destination |
| Expansion Policy | No refresh-as-recommendation-spectacle |

---

# PART D — LAYERS

---

# 11. Modal / Dialog Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Focused confirmations and short blocking tasks (F5.1 · F5.3) |
| Trigger | Destructive intent · confirm · short gate |
| Expected Behavior | Block interaction with underlying UI until dismiss/confirm |
| Navigation Result | Dismiss → origin · confirm → declared result |
| Cancellation Rules | Cancel/dismiss without side effects when promised |
| Failure Behavior | Stay in dialog · show error · allow cancel |
| Recovery Behavior | Retry action inside dialog |
| Consistency Rules | Same severity → same dialog class |
| Expansion Policy | Dialogs never become destinations |

---

# 12. Bottom Sheet Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Short tasks: chooser · filters · share · pickers · quick log |
| Trigger | Compose · overflow · filter · share · tab long-press sheets |
| Expected Behavior | Present task options · dismissible |
| Navigation Result | Open child task · apply filters · dismiss to origin |
| Cancellation Rules | Swipe/dismiss/Back dismiss without commit |
| Failure Behavior | Sheet may show inline error · remain dismissible |
| Recovery Behavior | Retry inside sheet |
| Consistency Rules | Same sheet jobs behave the same across rooms |
| Expansion Policy | Sheets are tasks — not nav roots |

---

# 13. Fullscreen Task Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Immersive multi-step create/edit (review · post · tier editor · media) |
| Trigger | Compose path · edit actions |
| Expected Behavior | Occupy focus · explicit save/publish/discard |
| Navigation Result | Dismiss to origin · optional open Shared result |
| Cancellation Rules | Discard confirms if dirty · Back = dismiss intent |
| Failure Behavior | Keep draft when possible · show error · allow retry/discard |
| Recovery Behavior | Retry publish · edit draft |
| Consistency Rules | All editors share dismiss/save honesty |
| Expansion Policy | Never register as top-level destination |

---

# 14. Snackbars / Toasts Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Non-blocking feedback (F5.1 Overlay) |
| Trigger | Success/info/error ephemeral outcomes |
| Expected Behavior | Appear · auto-dismiss or soft dismiss · optional action |
| Navigation Result | Optional action may navigate · default none |
| Cancellation Rules | User dismiss · timeout |
| Failure Behavior | N/A (feedback itself) |
| Recovery Behavior | Action may retry prior failed op |
| Consistency Rules | Toasts do not replace Notifications for durable attention |
| Expansion Policy | No toast spam walls · no urgency addiction |

---

# PART E — SELECTION & CONFIRMATION

---

# 15. Selection Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Choose among options without always committing |
| Trigger | Tap on selectable row/chip/control |
| Expected Behavior | Update selection state visibly (not color-alone — F4.2/F4.7) |
| Navigation Result | None until confirm/apply when required |
| Cancellation Rules | Clear selection · dismiss sheet |
| Failure Behavior | Reject invalid selection · explain |
| Recovery Behavior | Reselect |
| Consistency Rules | Selection ≠ navigation unless control is a nav row |
| Expansion Policy | Per F4.8 Selection family |

---

# 16. Multi-Selection Rules

| Field | Specification |
|-------|----------------|
| Purpose | Operate on a set |
| Trigger | Enter multi-select mode · tap items |
| Expected Behavior | Show set ownership · bulk bar/actions |
| Navigation Result | Bulk action may open confirm task |
| Cancellation Rules | Exit mode clears ephemeral selection |
| Failure Behavior | Partial failure reports which items failed |
| Recovery Behavior | Retry failed subset |
| Consistency Rules | Destructive bulk always confirms |
| Expansion Policy | No silent select-all traps |

---

# 17. Confirmation Flows

| Field | Specification |
|-------|----------------|
| Purpose | Protect irreversible or high-impact actions |
| Trigger | Delete · block · mark-all large · discard dirty · leave gated flows |
| Expected Behavior | Explicit confirm/cancel |
| Navigation Result | Confirm proceeds · cancel returns |
| Cancellation Rules | Cancel default-safe |
| Failure Behavior | Remain on confirm · show error |
| Recovery Behavior | Retry confirm action |
| Consistency Rules | Same risk class → same confirm pattern |
| Expansion Policy | Confirm-shaming banned (F4.7 · F4.8) |

---

# PART F — LOADING · EMPTY · ERROR

---

# 18. Loading Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Honest wait while meaning loads (F5.2 · F4.8) |
| Trigger | Initial open · pagination · refresh · task submit |
| Expected Behavior | Show loading/skeleton/partial per situation |
| Navigation Result | Stay on screen |
| Cancellation Rules | User may Back out of initial load to prior place |
| Failure Behavior | Transition to error state |
| Recovery Behavior | Retry control |
| Consistency Rules | Same load class · same behavior family |
| Expansion Policy | No loading theater |

| Load class | Behavior |
|------------|----------|
| Initial loading | Destination not ready · structured wait |
| Partial loading | Existing content usable · region loading |
| Background refresh | Non-blocking when possible |
| Skeleton transitions | Preserve layout place identity · not fake completion |
| Offline | Honest unavailable · see §20 |

---

# 19. Empty Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Orient when no items (F5.2 · F3.6) |
| Trigger | Zero results / zero activity |
| Expected Behavior | Explain place · offer calm next steps |
| Navigation Result | Primary/secondary CTAs may navigate to allowed owners |
| Cancellation Rules | N/A |
| Failure Behavior | Empty ≠ Error |
| Recovery Behavior | CTA actions |
| Consistency Rules | Empty copy/actions match room job (Home ≠ Discover ≠ Library) |
| Expansion Policy | **Never engagement bait · FOMO strips · fake urgency** |

| Element | Rule |
|---------|------|
| Allowed actions | Room-appropriate · ownership-respecting |
| Suggested navigation | To Discover/Library/Compose action as fits — not ownership theft |
| Primary CTA | One clear next step |
| Secondary CTA | Optional alternate · quieter |

---

# 20. Error Behavior

| Field | Specification |
|-------|----------------|
| Purpose | Teach and recover (F3.1 · F3.6 · F5.2) |
| Trigger | Failed load · failed action · offline |
| Expected Behavior | Name problem class · offer next step |
| Navigation Result | Stay · or safe fallback root if blocking boot error |
| Cancellation Rules | Dismiss non-blocking errors |
| Failure Behavior | Error state persists until retry/dismiss |
| Recovery Behavior | Retry · offline recovery when available |
| Consistency Rules | Blocking vs recoverable distinguished |
| Expansion Policy | No error-as-marketing |

| Class | Behavior |
|-------|----------|
| Blocking errors | Halt primary use of surface · require retry/leave |
| Recoverable errors | Keep context · retry |
| Offline recovery | Honest state · retry when connectivity returns |
| Dismiss behavior | Allowed for non-critical banners/toasts |

---

# PART G — COMPONENT FAMILY CONTRACTS

Identical meaning → identical behavior. Families below are **behavior contracts**, not visual specs.

---

# 21. Buttons

| Field | Specification |
|-------|----------------|
| Purpose | Commit or propose an action |
| Trigger | Tap |
| Expected Behavior | Fire single primary job · disabled when unavailable with reason path |
| Navigation Result | Per action (submit · navigate · open task · dismiss) |
| Cancellation Rules | N/A mid-tap; tasks may cancel after |
| Failure Behavior | Remain · error feedback · do not double-submit silently |
| Recovery Behavior | Re-enable · retry |
| Consistency Rules | Primary vs secondary vs destructive meanings stable (F4.8 Actions) |
| Expansion Policy | No fake buttons |

---

# 22. Cards (generic)

| Field | Specification |
|-------|----------------|
| Purpose | Open or preview a domain object |
| Trigger | Tap body · optional long-press overflow |
| Expected Behavior | Tap opens Shared Destination or declared detail |
| Navigation Result | Push Shared / child screen |
| Cancellation Rules | Long-press menu dismiss |
| Failure Behavior | If open fails · error · stay |
| Recovery Behavior | Retry open |
| Consistency Rules | Card tap never randomly toggles unrelated settings |
| Expansion Policy | New cards declare open target in F5.3 |

---

# 23. Feed Items

| Field | Specification |
|-------|----------------|
| Purpose | Present Home activity · route to Shared (F5.2) |
| Trigger | Tap item · tap actor · tap game context · overflow |
| Expected Behavior | Open owned Shared Destination · not mutate Home ownership |
| Navigation Result | Shared Post/Review/Game/User/Collection/Tier/Community |
| Cancellation Rules | Overflow dismiss |
| Failure Behavior | Stay on feed · error toast/banner |
| Recovery Behavior | Retry |
| Consistency Rules | Same object class · same open targets across feed |
| Expansion Policy | Per F5.2 object declaration |

---

# 24. Game Cards

| Field | Specification |
|-------|----------------|
| Purpose | Enter Shared Game |
| Trigger | Tap |
| Expected Behavior | Open Game Detail |
| Navigation Result | Shared Game |
| Cancellation Rules | — |
| Failure Behavior | Error · stay |
| Recovery Behavior | Retry |
| Consistency Rules | Same in Discover · Library · Search · Feed |
| Expansion Policy | No storefront-only hijack of tap |

---

# 25. Review Cards

| Field | Specification |
|-------|----------------|
| Purpose | Enter Shared Review |
| Trigger | Tap |
| Expected Behavior | Open Review Detail |
| Navigation Result | Shared Review |
| Cancellation Rules | — |
| Failure Behavior | Error · stay |
| Recovery Behavior | Retry |
| Consistency Rules | Same everywhere |
| Expansion Policy | Edit via task — not in-card destination |

---

# 26. Post Cards

| Field | Specification |
|-------|----------------|
| Purpose | Enter Shared Post |
| Trigger | Tap |
| Expected Behavior | Open Post Detail |
| Navigation Result | Shared Post |
| Cancellation Rules | — |
| Failure Behavior | Error · stay |
| Recovery Behavior | Retry |
| Consistency Rules | Same everywhere |
| Expansion Policy | Compose remains task |

---

# 27. Collection Cards

| Field | Specification |
|-------|----------------|
| Purpose | Enter Shared Collection (detail) |
| Trigger | Tap |
| Expected Behavior | Open Collection Detail |
| Navigation Result | Shared Collection |
| Cancellation Rules | — |
| Failure Behavior | Error · stay |
| Recovery Behavior | Retry |
| Consistency Rules | Index rows in Library behave as open-detail |
| Expansion Policy | Create/edit = tasks |

---

# 28. Tier List Cards

| Field | Specification |
|-------|----------------|
| Purpose | Enter Shared Tier |
| Trigger | Tap |
| Expected Behavior | Open Tier List Detail |
| Navigation Result | Shared Tier |
| Cancellation Rules | — |
| Failure Behavior | Error · stay |
| Recovery Behavior | Retry |
| Consistency Rules | Same as Collection pattern |
| Expansion Policy | Editor = fullscreen task |

---

# 29. Search Results

| Field | Specification |
|-------|----------------|
| Purpose | Open typed result destinations |
| Trigger | Tap result row |
| Expected Behavior | Navigate to Shared destination matching type |
| Navigation Result | Game/User/Post/Review/Collection/Tier/Community |
| Cancellation Rules | — |
| Failure Behavior | Error · stay on results |
| Recovery Behavior | Retry |
| Consistency Rules | Type → same destination class as elsewhere |
| Expansion Policy | New types registered in F2.1/F5.1/F5.3 |

---

# 30. Profile Items / Rows

| Field | Specification |
|-------|----------------|
| Purpose | Open profile section or related Shared content |
| Trigger | Tap |
| Expected Behavior | Push child screen or Shared object |
| Navigation Result | Per F5.3 Profile children / Shared |
| Cancellation Rules | — |
| Failure Behavior | Error · stay |
| Recovery Behavior | Retry |
| Consistency Rules | Self vs other respect ownership |
| Expansion Policy | No Settings-as-row that becomes a tab |

---

# 31. Settings Rows

| Field | Specification |
|-------|----------------|
| Purpose | Open setting section or toggle preference |
| Trigger | Tap · toggle |
| Expected Behavior | Navigate to section or change pref with honesty |
| Navigation Result | Settings child · or none for toggle |
| Cancellation Rules | Toggle may be immediately reversible |
| Failure Behavior | Revert toggle if save fails · error |
| Recovery Behavior | Retry |
| Consistency Rules | Destructive settings confirm |
| Expansion Policy | Under Settings only |

---

# 32. Notifications Items

| Field | Specification |
|-------|----------------|
| Purpose | Deep-out to source object |
| Trigger | Tap notification |
| Expected Behavior | Open Shared Destination for source · mark read per policy |
| Navigation Result | Shared domain |
| Cancellation Rules | — |
| Failure Behavior | If source missing · explain · stay/list refresh |
| Recovery Behavior | Retry open |
| Consistency Rules | Category does not change open ownership rules |
| Expansion Policy | No notification → random Home rewrite |

---

# 33. Tabs · Bottom Navigation · Top Navigation

| Field | Specification |
|-------|----------------|
| Purpose | Switch among five roots (F5.1) |
| Trigger | Tap tab / rail / top item |
| Expected Behavior | Switch destination · preserve stacks · reselect pops to root |
| Navigation Result | Home/Discover/Library/Notifications/Profile |
| Cancellation Rules | — |
| Failure Behavior | Stay on current if switch fails (rare) |
| Recovery Behavior | Retry |
| Consistency Rules | Order/labels frozen · chrome adapts only (F4.11) |
| Expansion Policy | Sixth tab requires F2.1 amendment |

---

# 34. FAB

| Field | Specification |
|-------|----------------|
| Purpose | Primary Compose **action** entry on Home (F2.1 hybrid) |
| Trigger | Tap FAB |
| Expected Behavior | Open Compose Chooser sheet |
| Navigation Result | Task layer — not a destination |
| Cancellation Rules | Dismiss chooser |
| Failure Behavior | Error toast · stay on Home |
| Recovery Behavior | Retry |
| Consistency Rules | FAB not required on every tab · contextual create elsewhere |
| Expansion Policy | Never promote FAB to tab |

---

# 35. Context Menus / Dropdowns

| Field | Specification |
|-------|----------------|
| Purpose | Secondary actions |
| Trigger | Long-press · overflow · dropdown open |
| Expected Behavior | List actions · run one · dismiss |
| Navigation Result | Action-defined (task · navigate · toggle) |
| Cancellation Rules | Dismiss without action |
| Failure Behavior | Keep menu or dismiss with error |
| Recovery Behavior | Reopen · retry |
| Consistency Rules | Same object overflow actions consistent across surfaces |
| Expansion Policy | No mystery-meat only menus for critical actions |

---

# 36. Lists

| Field | Specification |
|-------|----------------|
| Purpose | Browse homogeneous peers (F4.8) |
| Trigger | Scroll · tap row |
| Expected Behavior | Row opens declared target |
| Navigation Result | Per row type |
| Cancellation Rules | — |
| Failure Behavior | List error/empty patterns |
| Recovery Behavior | Retry load |
| Consistency Rules | Peer rows behave as peers |
| Expansion Policy | No heterogeneous dialogs-as-rows |

---

# 37. Loading Indicators · Skeletons

| Field | Specification |
|-------|----------------|
| Purpose | Communicate wait without fake completion |
| Trigger | Loading states |
| Expected Behavior | Indicate progress/wait · preserve place |
| Navigation Result | None |
| Cancellation Rules | Back may leave |
| Failure Behavior | Yield to error |
| Recovery Behavior | Retry replaces indicator with content/error |
| Consistency Rules | Skeleton ≠ success content |
| Expansion Policy | No decorative infinite loaders as engagement |

---

# 38. Error States · Empty States (controls)

Behavior equals §19–§20. Controls hosting empty/error must expose Retry / Primary CTA consistently for their room.

---

# 38.1 MVP Component Families (Integration Amendment)

These families arrive with the MVP Final Integration Amendment. They are **variants of existing contracts** (§22 Cards · §36 Lists · §30 Rows), not a new component philosophy.

## 38.1.1 Community Cards / Rows

| Field | Specification |
|-------|----------------|
| Purpose | Enter Shared Community (detail) |
| Trigger | Tap · long press for overflow (share · mute per product rules) |
| Expected Behavior | Open Community Detail — membership is never changed by opening |
| Navigation Result | Shared Community |
| Cancellation Rules | Join / leave run as confirmable tasks · never as a tap side-effect |
| Failure Behavior | Error · stay in place · membership state unchanged |
| Recovery Behavior | Retry |
| Consistency Rules | Same open target from Communities Hub · Search · Home community activity · Game · Event |
| Expansion Policy | New community metadata does not change the open contract |

## 38.1.2 Event Cards / Rows

| Field | Specification |
|-------|----------------|
| Purpose | Enter Shared Event (detail) |
| Trigger | Tap · overflow for share |
| Expected Behavior | Open Event Detail; participation happens on the detail, not on the card |
| Navigation Result | Shared Event |
| Cancellation Rules | Participation is confirmable and reversible where the event allows |
| Failure Behavior | Error · stay · participation state unchanged |
| Recovery Behavior | Retry |
| Consistency Rules | Same open target from Events Hub · Home event activity · Community · Game · Notifications |
| Expansion Policy | Time information may be presented; urgency pressure, countdown coercion and streak mechanics are forbidden (F2.3 · F3.10) |

## 38.1.3 Achievement Cards / Rows · Progress Display

| Field | Specification |
|-------|----------------|
| Purpose | Enter Shared Achievement and communicate honest progress (F2.14) |
| Trigger | Tap |
| Expected Behavior | Open Achievement Detail · progress display states real progress only |
| Navigation Result | Shared Achievement |
| Cancellation Rules | — (achievements are not actions) |
| Failure Behavior | Error · stay · never show optimistic or inflated progress |
| Recovery Behavior | Retry |
| Consistency Rules | Same contract in Profile · Shared User · Home achievement activity · Notifications |
| Expansion Policy | New families reuse this contract · no scores · no leaderboards · no “almost there” manipulation |

## 38.1.4 Connected Account Rows

| Field | Specification |
|-------|----------------|
| Purpose | Show and control one external connection (Steam · Discord) |
| Trigger | Tap (open link task) · disconnect action |
| Expected Behavior | Connect opens Account Link task · disconnect confirms and states consequences honestly |
| Navigation Result | Task layer · returns to Connected Accounts |
| Cancellation Rules | Cancel at any step leaves state unchanged |
| Failure Behavior | Error · row shows unconnected/previous state truthfully |
| Recovery Behavior | Retry |
| Consistency Rules | Same row contract for every provider · state is never implied by decoration alone (F4.2 · F4.6) |
| Expansion Policy | New providers = new rows · never new sections or destinations |

## 38.1.5 Recommendation Slots (semantic)

| Field | Specification |
|-------|----------------|
| Purpose | Present semantically similar games · collections · reviews as an offer, not an instruction (F2.19) |
| Trigger | Tap item |
| Expected Behavior | Open the matching Shared destination — identical to any other card of that type |
| Navigation Result | Shared Game / Collection / Review / User |
| Cancellation Rules | Slot must be dismissible or ignorable without penalty |
| Failure Behavior | Slot degrades to absence — never to an error wall |
| Recovery Behavior | Silent retry or omission |
| Consistency Rules | A recommended object behaves exactly like the same object elsewhere |
| Expansion Policy | No assistant framing · no generative output · no autoplay chains · no infinite suggestion loops |

---

# PART H — TASK LAYER BEHAVIORS

Task Layers never become destinations (F5.1 · F5.3).

---

# 39. Compose (chooser + editors)

| Field | Specification |
|-------|----------------|
| Purpose | Create Post/Log/Review/Collection/Tier via actions |
| Trigger | FAB · contextual create · chooser selection |
| Expected Behavior | Sheet → editor task · publish/dismiss |
| Navigation Result | Origin · optional Shared open |
| Cancellation Rules | Dismiss/discard with confirm if dirty |
| Failure Behavior | Keep draft when possible · error · retry |
| Recovery Behavior | Retry publish |
| Consistency Rules | Same compose options meaning everywhere |
| Expansion Policy | Still tasks |

---

# 40. Edit

| Field | Specification |
|-------|----------------|
| Purpose | Modify owned object |
| Trigger | Edit action on detail |
| Expected Behavior | Open editor task with existing context |
| Navigation Result | Return to detail/origin |
| Cancellation Rules | Discard dirty confirm |
| Failure Behavior | Keep edits locally if possible · error |
| Recovery Behavior | Retry save |
| Consistency Rules | Edit never silent-overwrites without path |
| Expansion Policy | Task only |

---

# 41. Delete

| Field | Specification |
|-------|----------------|
| Purpose | Remove object |
| Trigger | Delete action |
| Expected Behavior | Confirmation dialog · then delete |
| Navigation Result | Prior list/parent · not orphan detail |
| Cancellation Rules | Cancel leaves intact |
| Failure Behavior | Object remains · error |
| Recovery Behavior | Retry delete |
| Consistency Rules | Always confirm destructive delete |
| Expansion Policy | Dialog task |

---

# 42. Share · Report · Image Picker · Selection Sheets · Confirmation Dialogs

Contracts mirror §12–§17 and F5.3 task screens:

| Task | Behavior essence |
|------|------------------|
| Share | Modal sheet · dismissible · no destination |
| Report | Modal · cancel-safe · Trust-aligned |
| Image Picker | Returns to caller task · cancel returns nothing |
| Selection Sheets | Apply/cancel · multi-select rules §16 |
| Confirmation Dialogs | §17 |

---

# 42.1 Account Link · Library Import (Integration Amendment)

## 42.1.1 Account Link (OAuth)

| Field | Specification |
|-------|----------------|
| Purpose | Link Steam or Discord from Settings · Onboarding · Library Import · optional Discord login (F2.2 · F2.21) |
| Trigger | Connect action on a Connected Account row or onboarding option |
| Expected Behavior | External authorization runs as a task and returns to the exact origin place with truthful connection state |
| Navigation Result | Origin place (never a new destination) · optional hand-off to Library Import |
| Cancellation Rules | Cancel at any point is safe and complete — no partial linked state presented as success |
| Failure Behavior | Explain what failed and what still works · the app remains fully usable unlinked |
| Recovery Behavior | Retry from the same row · never auto-retry loops · never re-prompt after refusal |
| Consistency Rules | Identical contract per provider · Discord grants identity only — no chat, presence or community behavior |
| Expansion Policy | New providers reuse this task; scope requests never expand silently |

## 42.1.2 Library Import (Steam Sync)

| Field | Specification |
|-------|----------------|
| Purpose | Import owned games into the personal archive (F2.6 · F2.21) |
| Trigger | Start import from Library Import · Connected Accounts · deferred onboarding |
| Expected Behavior | Long-running task with honest progress; the player may leave and continue using the app |
| Navigation Result | Library reflects imported games · dismissal returns to origin |
| Cancellation Rules | Cancellable and resumable · already-imported items remain valid |
| Failure Behavior | Partial results are stated as partial · nothing player-authored is destroyed or overwritten |
| Recovery Behavior | Resume or retry · conflicts resolved by the player, not silently by the system |
| Consistency Rules | Import never rewrites status · reviews · collections authored by the player; imported activity is summarized in Home (F5.2 §6.4) |
| Expansion Policy | Additional platforms reuse this contract · no auto-import without consent |

---

# PART I — CLOSE

---

# 43. Component Consistency Law

| Law |
|-----|
| Components with identical meaning always behave identically |
| The same interaction must never produce different outcomes in different parts of the app |
| Presentation context (which tab) does not change Shared open behavior |
| Device chrome differences do not change interaction meaning (F4.11) |

---

# 44. Anti-Patterns

| Banned |
|--------|
| Surprise navigation |
| Engagement bait empty states |
| Trap modals that block Back without safety reason |
| Swipe-only destructive actions |
| Double-submit without guard |
| Toast replacing durable Notifications |
| FAB/tab confusion |
| Inconsistent card open targets by surface |
| Loading/error theater |
| Confirm-shaming |
| Join / participate / link as an accidental tap side-effect |
| Countdown urgency or FOMO pressure on event surfaces |
| Achievement progress presented as score, rank or “almost there” pressure |
| Import that silently overwrites player-authored library meaning |
| Re-prompting a refused account connection |
| Recommendation slots that behave differently from the same object elsewhere |

---

# 45. Audit Checklist

- [ ] Every interaction family defines Trigger · Result · Recovery · Failure · Navigation · Consistency · Expansion  
- [ ] Back · stack · modal · task · deep-link · tab restoration defined  
- [ ] Scroll · refresh · infinite-scroll philosophy defined without addiction architecture  
- [ ] Task layers never destinations  
- [ ] Loading · empty · error · offline behaviors defined  
- [ ] Component families listed have behavior contracts  
- [ ] Consistency law explicit  
- [ ] No colors · type · spacing · icons · animation values  
- [ ] No backend · API · DB · network · RN · Expo · code  
- [ ] Compatible with F5.1 · F5.2 · F5.3 · F3.4 · F4.7 · F4.8  
- [ ] MVP families (community · event · achievement · connected account · recommendation slot) reuse existing card/row/list contracts  
- [ ] Membership · participation · linking · importing are confirmable tasks, never tap side-effects  
- [ ] Optional integrations degrade to absence, never to error walls  

---

## Final gate

### LOCKED — Product Architecture frozen

**Sprint F5.4 — Interaction & Component Behavior Specification** is **LOCKED** at Version 1.1 following the MVP Final Integration Amendment.

Future changes must be introduced via Amendment documents only.

---

## Related documents

| Doc | Role |
|-----|------|
| [F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md](./F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | Structure · layers |
| [F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md](./F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | Feed continuity · refresh |
| [F5_3_SCREEN_SPECIFICATIONS.md](./F5_3_SCREEN_SPECIFICATIONS.md) | Screens · tasks |
| [F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md](../03_UX/F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) | Interaction feel law |
| [F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md](../04_UI/F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md) | Object citizenship |
| [F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md](../04_UI/F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) | Component system law |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | Tab long-press · Back · stacks |
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Supreme product question |
| [F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md](./F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **DRAFT** Implementation constitution · F5 close |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Global interaction + component behavior contracts; Back/scroll/tasks/loading/empty/error; no UI/engineering |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §38.1 MVP component families (community · event · achievement · connected account · semantic recommendation slot) and §42.1 account-link / library-import task behaviors added; anti-patterns and audit extended; no renumbering of existing sections · no UI |
| 1.1 | July 2026 | Version 1.1 — MVP Final Integration Amendment verified. Product Architecture frozen. |
