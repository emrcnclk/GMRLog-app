# GMRLOG — Phase S4: Component Specification

**Document:** `docs/17_IMPLEMENTATION_SPECIFICATIONS/S4_COMPONENT_SPECIFICATION.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** S4 (Component Specification — Design System implementation contract)  
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
| 5 | Entire F3 — especially F3.6 · F3.12 |
| 6 | Entire F4 — especially F4.7 · F4.8 · F4.9 · F4.10 · F4.11 · F4.12 |
| 7 | Entire F5 (**LOCKED**) — especially F5.4 · F5.5 |
| 8 | Entire F6 (**LOCKED**) — especially F6.2 |
| 9 | [`PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md`](./PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md) |
| 10 | [`S3_SCREEN_SPECIFICATION.md`](./S3_SCREEN_SPECIFICATION.md) — screen composition consumers |
| 11 | Subordinate projections: [`COMPONENT_LIBRARY.md`](../02_DESIGN/COMPONENT_LIBRARY.md) · [`DESIGN_TOKENS.md`](../02_DESIGN/DESIGN_TOKENS.md) — on conflict, F4/F5/S4 win |
| 12 | **This document** — Design System implementation contract for Version 1 |

Never contradict higher documents.

This document is **not** a redesign of the Design System.

This document **is** the implementation contract for reusable UI citizens that screens (S3) assemble.

| Does | Does not |
|------|----------|
| Catalog atoms · molecules · organisms · layout · navigation · form · feedback · empty/error/loading/skeleton · overlay rules · a11y · variants · token usage · naming · folder mapping | React · JSX · Tailwind · NativeWind · implementation snippets · visual redesign · Version 2 components · HEX/px values · motion ms |

**Gate:** After this specification, Phase S content delivery is complete. Formal LOCK of S1–S4 may still proceed as governance hygiene.

---

## Scope

**In scope:** Version 1 MVP Design System citizens required by F5.3 / S3 screens and F5.5 family rules.

**Out of scope:**

| Forbidden |
|-----------|
| Creator / Premium / Developer / Publisher / Marketplace component kits (V2) |
| Guides · Bookmarks destination · Article editor kits (Future) |
| Engagement / casino / streak / FOMO components |
| Feature-private component forks |
| Theme-specific component trees |
| Code, classNames, style objects |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Relationship · Naming · Token usage |
| B | 5–7 | Taxonomy · State classes · Accessibility contract |
| C | 8–11 | Atoms · Molecules · Organisms · Layout |
| D | 12–15 | Navigation · Form · Feedback · Empty/Error/Loading/Skeleton |
| E | 16–17 | Modal · Bottom sheet · Fullscreen task rules |
| F | 18–19 | Variant catalog · Folder mapping |
| G | 20–21 | Anti-patterns · Audit checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Create the implementation contract for the Design System so engineers implement `@gmrlog/ui` (and kin) without re-deciding taxonomy, SRP, tokens, states, or admission.

| Prefer | Never |
|--------|-------|
| Reuse existing family · variant | Fork “SpecialXForScreenY” |
| Semantic tokens | Hardcoded values · primitive-first in components |
| F5.4 behaviour | Invented interaction dialects |
| Honest states | Loading theater · FOMO empty |

---

# 2. Relationship to Prior Law

| Prior law | S4 obligation |
|-----------|---------------|
| F4.8 | Taxonomy · SRP · composition · admission governance |
| F4.7 | Function before form · predictability |
| F4.10 | primitive → semantic → component → theme; components consume semantics |
| F4.12 | No silent forks · breaking-change review |
| F5.4 | Interaction & state behaviour contracts |
| F5.5 | Reuse · naming · token usage · MVP family variants |
| F6.2 | `@gmrlog/ui` consumption · folder ownership · a11y |
| S3 | Screens compose only catalogued citizens |

---

# 3. Naming Rules

| Kind | Rule |
|------|------|
| Component export name | `PascalCase` · responsibility-first (`PrimaryButton`, `GameCard`, `EmptyState`) |
| File name | `kebab-case` matching export (`primary-button.tsx` projected in engineering — not specified as code here) |
| Variant prop names | `variant` · `size` · `tone` · `density` — closed enums per §18 |
| State props | `is/has/can/should` booleans (`isDisabled`, `isLoading`, `hasError`) |
| Event/intent names | Verb-first (`onPress`, `onDismiss`, `onRetry`) — intents, not domain writes |
| Token references | Semantic path names (`color.text.primary`, `space.section`) — never raw |
| Icon names | Role semantic (`action.compose`, `nav.home`) — not appearance nicknames |
| Forbidden names | `Misc*` · `Custom*` · `Special*` · `Temp*` · feature-prefixed DS forks (`HomeOnlyButton`) |

One meaning → one citizen name (F4.12 · F5.5).

---

# 4. Token Usage Rules

| Rule (F4.10 · F5.5 §7) |
|------------------------|
| Components consume **semantic** or **component-semantic** tokens only |
| Do not hardcode colors · spacing · type sizes · radii · elevation · motion values inside component responsibilities |
| Do not expose primitive tokens as the public API of a component |
| Themes remap values under the same semantic names — components do not fork per theme |
| State classes map to semantic state tokens (disabled · error · success · selected) — color alone never carries meaning (F4.2) |
| Motion tokens express continuity roles (F4.9) — no engagement motion; reduced-motion path mandatory |
| One meaning → one token path · no synonym sprawl |

Values live in subordinate token packages/docs — not in this contract.

---

# PART B — SYSTEM LAW

---

# 5. Taxonomy & Composition Levels

## 5.1 Primary taxonomic family (F4.8)

Every citizen declares exactly one primary family:

| Family | Role |
|--------|------|
| Navigation | Move between rooms / structures |
| Actions | Commit or propose change |
| Content | Present cultural meaning |
| Input | Capture player intent |
| Selection | Choose among options |
| Feedback | Report system / outcome state |
| Containers | Group related meaning |
| Overlays | Temporary focus layers |
| Discovery | Find & filter culture |
| System | Platform housekeeping |
| Community | Social / guild structure presentation |
| Library | Memory & collection structure presentation |

## 5.2 Composition levels

| Level | Meaning | DS status |
|-------|---------|-----------|
| Atomic | Smallest reusable responsibility | Citizen |
| Molecule | Legal composition of atoms | Citizen pattern |
| Organism | Domain-meaningful composition | Citizen pattern |
| Template / Screen | Page assembly (S3) | **Not** a DS citizen by default |

Levels do not license SRP breaches (F4.8 §3.5).

## 5.3 Responsibility contract (required per citizen)

| Element |
|---------|
| Primary job |
| Owns / must not own |
| Valid parents · valid children |
| State classes |
| Primary family |
| Token roles consumed |
| A11y role & name source |

---

# 6. Universal State Classes

Every interactive or content-hosting citizen participates in the relevant subset (F5.4 · F5.5 §13):

| State | Law |
|-------|-----|
| Rest | Default honest appearance |
| Hover/Pressed/Focused | Platform-appropriate · focus visible |
| Selected | Explicit selection semantics |
| Disabled | Honest · not dark-pattern coercion |
| Loading | Structure-preserving · not fake completion |
| Empty | Calm absence · never FOMO |
| Error | Recoverable · stay put when possible |
| Pending | In-flight action · prevent double-submit |
| Success | Ephemeral or inline · not dopamine theater |
| Soft-deleted / Tombstone | Honest absence of content meaning |

Same state class → same behavioural treatment across families.

---

# 7. Accessibility Contract

| Requirement |
|-------------|
| Every interactive citizen has an accessible name (label · `accessibilityLabel` role equivalent — specified as obligation, not code) |
| Icon-only actions require visible or accessible text equivalent (F4.6 — icon alone forbidden for critical meaning) |
| Focus order follows reading order · overlays trap focus while open · restore focus on dismiss |
| Disabled / loading / error / pending announced — not paint-only |
| Color / motion alone never convey state |
| Hit targets meet platform minimums via density tokens — not ad-hoc |
| Lists expose roles and item counts when known |
| Forms: label ↔ control association · error text linked to control |
| Reduced motion: essential meaning remains without motion (F4.9) |
| Contrast via semantic theme tokens — not ad-hoc hex (F4.2) |

Screen-level a11y in S3 composes these citizen contracts.

---

# PART C — CATALOG: ATOMS · MOLECULES · ORGANISMS · LAYOUT

---

# 8. Atomic Components

Smallest reusable citizens. Primary family in parentheses.

| Citizen | Family | Primary job | Must not | Key variants (§18) |
|---------|--------|-------------|----------|-------------------|
| `Text` | Content | Render semantic type role | Invent shouting styles | `role`: display/heading/body/meta/label |
| `Icon` | System | Render semantic symbol | Meaning alone without label context when critical | `name` semantic · `size` |
| `Spacer` | Containers | Apply spacing token gap | Arbitrary magic spacing | `space` token key |
| `Divider` | Containers | Separate peer groups | Decorative noise | `orientation` |
| `Surface` | Containers | Provide place surface/elevation role | Fake power hierarchy | `elevation` semantic |
| `PrimaryButton` | Actions | Primary commit | Multiple CTAs in one atom | `size` · destructive? no — use Destructive |
| `SecondaryButton` | Actions | Secondary commit | Look like primary | `size` |
| `GhostButton` | Actions | Low-emphasis action | Replace primary in critical flows | `size` |
| `DestructiveButton` | Actions | Irreversible / destructive commit | Casual use | `size` |
| `IconButton` | Actions | Compact labeled action | Unlabeled critical action | `size` · requires a11y name |
| `TextLink` | Actions/Navigation | Inline navigational/action text | Fake button rows | `tone` |
| `TextField` | Input | Single-line text capture | Own form orchestration | `hasError` · `isDisabled` |
| `TextArea` | Input | Multi-line capture | Own publish policy | same |
| `Switch` | Selection | Binary preference | Silent remote mutation surprise | `isOn` |
| `Checkbox` | Selection | Multi option membership | — | `isChecked` · indeterminate |
| `Radio` | Selection | Exclusive option in group | — | `isSelected` |
| `Avatar` | Content | Person/image identity mark | Status-only via color | `size` |
| `Badge` | Feedback | Compact semantic status mark | Marketing spam / engagement bait | `tone` semantic |
| `Tag` / `Chip` | Selection/Discovery | Filter or facet token | FOMO clusters | `isSelected` |
| `ProgressIndicator` | Feedback | Honest progress (import · achievement · upload) | Gamified meters · fake motion | `value` determinate/indeterminate |
| `Spinner` | Feedback | Indeterminate wait (local) | Page-level theater | `size` |
| `SkeletonBone` | Feedback | Single placeholder shape | Fake content text | shape roles |

---

# 9. Molecular Components

Legal compositions of atoms.

| Citizen | Family | Composes | Primary job | Must not |
|---------|--------|----------|-------------|----------|
| `ButtonGroup` | Actions | Buttons | Related action cluster | Mix primary+destructive without confirm pattern |
| `IconLabel` | Content | Icon+Text | Paired meaning | Icon-alone critical status |
| `SearchField` | Discovery | TextField+Icon+Clear | Query entry | Own search results architecture |
| `PasswordField` | Input | TextField+reveal | Credential entry | Log values |
| `FormField` | Input | Label+Control+Helper/Error | Labeled field unit | Own submit |
| `FilterChipGroup` | Discovery | Chips | Multi/single facet select | Engagement chip walls |
| `SegmentedControl` | Selection | Segments | Mutual exclusive view mode | Replace tabs/IA |
| `ListRow` | Containers | Text+meta+optional trailing | Generic row | Domain policy |
| `UserRow` | Content | Avatar+names+meta | Person preview row | Own follow policy permanently |
| `SettingRow` | System | Label+control/chevron | Settings line item | Invent settings IA |
| `ConnectedAccountRow` | System | Provider mark+status text+action | Provider-agnostic link status | Color-alone status · Discord/Steam bespoke kits |
| `OwnershipIndicator` | Library | Text (+optional icon) | Library relationship honesty (manual/import) | Shame/pressure copy |
| `RatingDisplay` | Content | Stars/score text | Show rating meaning | Editable unless Input variant |
| `RatingInput` | Input | Selectable rating | Capture rating | Own review publish |
| `SpoilerGate` | Protective/Content | Surface+action | Reveal spoiler intentionally | Auto-reveal |
| `Toast` | Feedback | Text+optional action | Ephemeral outcome | Blocking errors |
| `InlineAlert` | Feedback | Tone+text+optional action | Inline status | Replace ErrorState |
| `PaginationControl` | Navigation | Prev/next or load-more | Move within list | Invent infinite engagement bait |
| `ComposeFAB` | Actions | IconButton elevated | Home compose entry | Become a tab |

---

# 10. Organism Components

Domain-meaningful compositions. MVP variants of shared card/row/list families — **no bespoke per-feature organisms** (F5.5 §5).

| Citizen | Family | Primary job | Opens / emits | Must not |
|---------|--------|-------------|----------------|----------|
| `GameCard` | Content | Game preview | → Shared Game | Own library writes |
| `ReviewCard` | Content | Review preview | → Shared Review | Bypass spoiler law |
| `PostCard` / `FeedItem` | Content | Post/activity preview | → Shared object per F5.2 class | Own feed ranking |
| `CollectionCard` | Content | Collection preview | → Shared Collection | — |
| `TierListCard` | Content | Tier list preview | → Shared Tier | — |
| `UserCard` | Content | User preview | → Shared User / Profile | Load into Profile tab for others |
| `CommunityCard` | Content/Community | Community preview | → Shared Community | Bespoke community kit |
| `EventCard` | Content | Event preview | → Shared Event | Countdown FOMO organism |
| `AchievementRow` / `AchievementCard` | Content | Achievement preview | → Shared Achievement | Steam achievement mirror · points economy |
| `NotificationRow` | Feedback/Content | Notification preview | → deep target | Attention dark patterns |
| `ConversationRow` | Content | Inbox preview | → Conversation | — |
| `MediaThumb` | Content | Media preview | → Media Viewer task | — |
| `LibraryEntryRow` | Library | Shelf entry row | → Game · Log task | — |
| `CommentItem` | Content | Comment unit | Author · Report | Own thread policy |
| `RecommendationSlot` | Containers | Optional similar-object region | Hosts object cards | New object language · error wall on failure → **absence** |
| `FeedList` | Containers | Homogeneous feed/activity list | Item opens | Second Home identity |
| `ObjectList` | Containers | Homogeneous object list | Item opens | Mixed peer types without segments |

Creator / Developer / Studio / Premium cards from legacy library notes are **Version 2** — not admitted in V1 S4.

---

# 11. Layout Components

| Citizen | Family | Primary job | Must not |
|---------|--------|-------------|----------|
| `ScreenChrome` | Navigation/System | Safe area · header · Back · overflow host | Own destination meaning |
| `TabRootChrome` | Navigation | Five-root tab shell | Sixth tab · reorder roots |
| `Section` | Containers | Group with optional heading | Crowding engagement |
| `Stack` | Containers | Directional spacing composition | Arbitrary one-off spacing cultures |
| `Inset` | Containers | Reading corridor inset | Break F4.4 corridors casually |
| `Grid` | Containers | Peer tile layout | Device-specific product forks (F4.11) |
| `ScrollRegion` | Containers | Scrollable region with F5.4 scroll law | Nested scroll traps without need |
| `StickyHeader` | Containers | Stick header within scroll | Hide critical actions permanently |
| `SplitPane` (adaptive) | Containers | Wide-canvas peer regions | Different IA per device class |

Layout adapts canvas — meaning/identity does not (F4.11).

---

# PART D — NAVIGATION · FORM · FEEDBACK · STATES

---

# 12. Navigation Components

| Citizen | Family | Primary job | Rules |
|---------|--------|-------------|-------|
| `TabBar` | Navigation | Five player roots only | Order frozen (F2.1 · F5.1) · no Communities/Events/Messages/Search tabs |
| `TopBar` / `Header` | Navigation | Title · Back · actions | Back obeys F5.4 |
| `BackButton` | Navigation | Pop/dismiss | Never rewrite stack creatively |
| `OverflowMenu` | Navigation/Overlays | Secondary actions | Menu ≠ destination |
| `BottomNavItem` | Navigation | One root item | Badge only for honest attention counts — not engagement bait |
| `Breadcrumb` (if used) | Navigation | Hierarchy hint | Rare · never replaces Back |
| `LinkableTitle` | Navigation | Title that routes | Same target as card open behaviour |

Navigation components never invent IA.

---

# 13. Form Components

| Citizen | Primary job | Rules |
|---------|-------------|-------|
| `Form` | Group fields · submit intent | Orchestrates validation display — domain rules stay in feature/Zod schemas |
| `FormField` | Label+control+error | Error text associated |
| `FormActions` | Submit/cancel cluster | Primary right/platform-appropriate · destructive separated |
| `TextField` / `TextArea` / `PasswordField` | Capture | See atoms |
| `Select` / `PickerTrigger` | Open selection overlay | Selection in sheet/modal — not new IA |
| `SwitchField` / `CheckboxField` | Labeled selection | Revert on failed save when settings |
| `ErrorSummary` | Optional form-level errors | Not a dunk tank |

Forms keep drafts when possible (F5.4 · F6.2). Double-submit prevented via pending state.

---

# 14. Feedback Components

| Citizen | Primary job | Rules |
|---------|-------------|-------|
| `Toast` | Ephemeral success/info/error | Non-blocking · short · dismissible |
| `Banner` | Persistent-until-dismiss inline notice | Not marketing |
| `InlineAlert` | Contextual status | Tone semantic |
| `ProgressIndicator` | Honest long-running progress | Import · OAuth · upload · achievement — no fake easing theater |
| `Spinner` | Local indeterminate | Prefer skeletons for page loads |
| `ConfirmPattern` | Protective confirm | Used inside Modal — see §16 |

---

# 15. Empty · Error · Loading · Skeleton

## 15.1 Empty states

| Citizen | Job | Rules |
|---------|-----|-------|
| `EmptyState` | Calm absence | One optional primary CTA · never FOMO/guilt · never fake suggestions as bait |
| Variants | `EmptyState.Feed` · `.List` · `.Search` · `.Inbox` · `.Library` · `.Notifications` | Same organism · copy/CTA slots differ — not separate philosophies |

## 15.2 Error states

| Citizen | Job | Rules |
|---------|-----|-------|
| `ErrorState` | Recoverable failure | Retry action · optional leave · no stack traces · no guilt |
| `InlineError` | Field/region error | Linked to control when form |
| `BlockingError` | Boot/root halt | SYS-03 composition |

Optional slots (recommendations · integrations) **degrade to absence** — never ErrorState walls (F6.2 · S3).

## 15.3 Loading components

| Citizen | Job | Rules |
|---------|-----|-------|
| `Spinner` | Local wait | Not for full destination identity |
| `LoadingRegion` | Partial region wait | Keep surrounding content |
| Full destination wait | Prefer skeletons | Preserve place identity (F5.4) |

## 15.4 Skeleton rules

| Rule |
|------|
| Skeletons preserve layout place identity of the target citizen (`GameCard` → `GameCardSkeleton`, etc.) |
| Skeleton ≠ success content · no readable fake titles that look real |
| Transition from skeleton to content must not jump layout violently |
| No loading theater · no prolonged branded distraction beyond boot Splash |
| List skeletons show a small honest count of placeholder rows — not infinite fake richness |
| Skeleton tokens use neutral surface semantics — not accent engagement colors |

| Citizen | Mirrors |
|---------|---------|
| `GameCardSkeleton` | `GameCard` |
| `FeedItemSkeleton` | `FeedItem` |
| `ListRowSkeleton` | `ListRow` / domain rows |
| `ProfileHeaderSkeleton` | Profile header organism |
| `DetailSkeleton` | Shared detail chrome+body |
| `FormSkeleton` | Form hydrate |

---

# PART E — OVERLAYS

---

# 16. Modal Rules

| Rule |
|------|
| Primary family: Overlays |
| Use for short blocking tasks · confirmations · soft-gate · destructive confirms |
| Not destinations · not editors that need fullscreen immersion (those use Fullscreen Task) |
| Focus trapped · Scrim dismiss per F5.4 · Back dismisses |
| One primary action · destructive separated |
| Failure: stay open · show error · allow cancel |
| Compose: `Modal` → optional title · body · `FormActions` / confirm pattern |
| Never use for marketing popups or engagement nag |

Citizens: `Modal` · `ConfirmModal` (specialized protective).

---

# 17. Bottom Sheet · Fullscreen Task Rules

## 17.1 Bottom sheet

| Rule |
|------|
| Task layer only (F5.5 · F5.1) |
| Use for choosers · filters · log game · share · report · overflow |
| Dismissible · non-trapping · keep host context visible per platform |
| Inline error allowed · remain dismissible |
| Do not become a fake tab or permanent dock |

Citizen: `BottomSheet`.

## 17.2 Fullscreen task

| Rule |
|------|
| Editors · OAuth bridge · import progress · media viewer · immersive compose |
| Not Feature → Home destinations |
| Dismiss returns to origin · success may optionally deep-open Shared object |
| Keep draft on error when possible |
| Cancel always reachable for OAuth/import (non-trapping) |

Citizen: `FullscreenTask`.

## 17.3 Overlay shared laws

| Law |
|------|
| Overlays never rewrite player five roots |
| Staff overlays stay in staff chrome — never leak |
| Motion: continuity · interruptible · reduced-motion safe (F4.9) |
| Z-layering via elevation semantics — not ad-hoc stacking wars |

---

# PART F — VARIANTS · FOLDERS

---

# 18. Variant Catalog

Closed variant axes. Additive growth requires F4.12 / F5.5 admission — not silent screen forks.

| Axis | Allowed values (conceptual) | Applies to |
|------|----------------------------|------------|
| `size` | `sm` · `md` · `lg` | Buttons · IconButton · Avatar · Spinner |
| `typeRole` | `display` · `heading` · `body` · `meta` · `label` | Text |
| `tone` | `neutral` · `info` · `success` · `warning` · `danger` | Badge · Alert · Toast |
| `emphasis` | `primary` · `secondary` · `ghost` · `destructive` | Actions (prefer distinct citizens over one mega-Button when SRP clearer) |
| `elevation` | semantic elevation steps | Surface · Sheet · Modal |
| `density` | `comfortable` · `compact` | Lists · Rows (adaptive — not new products) |
| `selected` | boolean | Chips · Segments · Rows |
| `orientation` | `horizontal` · `vertical` | Stack · Divider |
| Object card `context` | `feed` · `shelf` · `search` · `recommendation` | Same card citizen — layout density only |

| Variant law |
|-------------|
| Variants change presentation within one responsibility — they do not smuggle a second job |
| No `variant="engagement"` · `variant="premiumUpsell"` · `variant="streak"` in V1 |
| Community/Event/Achievement cards are **object-class variants of the card family**, not new families |

---

# 19. Folder Mapping

Engineering projection of ownership (F5.5 §15 · F6.2). Paths are organizational — not code.

| Location | Contains |
|----------|----------|
| `packages/ui/` (`@gmrlog/ui`) | All DS citizens: atoms · molecules · organisms · layout · overlays · states |
| `packages/ui/src/actions/` | Buttons · FAB · links |
| `packages/ui/src/content/` | Cards · rows · domain previews · text · media thumbs |
| `packages/ui/src/input/` | Fields · form field |
| `packages/ui/src/selection/` | Chips · checkbox · radio · switch · segmented |
| `packages/ui/src/feedback/` | Toast · alert · progress · spinner · badge |
| `packages/ui/src/containers/` | Surface · stack · section · lists · recommendation slot |
| `packages/ui/src/overlays/` | Modal · sheet · fullscreen task · menus |
| `packages/ui/src/navigation/` | Tab bar · header · back |
| `packages/ui/src/states/` | Empty · error · skeleton |
| `packages/ui/src/system/` | Setting row · connected account row · chrome utilities |
| `packages/tokens/` (`@gmrlog/tokens`) | Semantic token definitions (values subordinate) |
| `packages/icons/` (`@gmrlog/icons`) | Semantic icon set (F4.6) |
| `apps/mobile/features/*/ui/` | Screen assemblies only — **compose** `@gmrlog/ui` · do not fork |
| `apps/mobile/shared/*/ui/` | Shared Destination assemblies — compose DS |
| `apps/mobile/app/` | Expo Router thin projections — no DS definitions |

| Folder law |
|------------|
| No per-feature private DS kits |
| No second `components/` dump that bypasses `@gmrlog/ui` |
| `@gmrlog/ui` never depends on `@gmrlog/api` or feature modules |
| Screens import DS; DS never imports screens |

---

# PART G — CLOSE

---

# 20. Anti-Patterns

| Banned |
|--------|
| React · JSX · Tailwind · NativeWind · implementation snippets in this contract |
| Visual redesign · new Design System philosophy |
| Version 2 components (Creator/Premium/Developer/Marketplace/Article/Guides kits) |
| Feature-owned forks of buttons/cards/sheets |
| Bespoke Community/Event/Achievement component philosophies |
| Steam/Discord “integration UI” forking tokens or nav |
| Recommendation mini-product language |
| Engagement · casino · streak · FOMO · upsell variants |
| Hardcoded values · primitive-first component APIs |
| Theme-specific component trees |
| Skeleton fake content · empty FOMO · error guilt |
| Icon-alone critical status · color-alone status |
| Sixth tab components · Search/Messages/Communities as tab citizens |
| Treating templates/screens as DS citizens without admission |

---

# 21. Audit Checklist

- [ ] Atomic · molecular · organism · layout catalogs present  
- [ ] Navigation · form · feedback citizens specified  
- [ ] Empty · error · loading · skeleton rules present  
- [ ] Modal · bottom sheet · fullscreen task rules present  
- [ ] Accessibility contract universal  
- [ ] Variant catalog closed · no V2/engagement variants  
- [ ] Token usage rules obey F4.10 (semantic consumption)  
- [ ] Naming rules · folder mapping to `@gmrlog/ui` present  
- [ ] MVP surfaces are variants of existing families (F5.5)  
- [ ] No React/JSX/Tailwind/NativeWind · no redesign  
- [ ] Compatible with S3 composition vocabulary  
- [ ] Gate: Phase S content delivery complete  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Phase S4 — Component Specification** delivered as **DRAFT**.

This document is the working Design System implementation contract for Version 1 under F3–F6 and the Phase S charter.

---

# PHASE S COMPLETE

S1 API Specification · S2 Database Specification · S3 Screen Specification · S4 Component Specification are delivered as implementation contracts (DRAFT — pending formal LOCK passes).

Architecture (F1–F6) remains **LOCKED**. Phase S removes remaining implementation ambiguity.

# READY FOR DEVELOPMENT D1

Development Phase **D1 — Foundation** is authorized to begin under F1–F6 and Phase S contracts (S1–S4), subject to Amendment rules and Implementation Authority in the Phase S charter.

D1 scope (planning reminder): monorepo · frontend · backend · shared packages · API SDK · auth foundation · environments · CI/CD · Docker — without inventing Version 2 scope.

---

## Related documents

| Doc | Role |
|-----|------|
| [`PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md`](./PHASE_S_IMPLEMENTATION_SPECIFICATIONS.md) | Phase S charter |
| [`F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md`](../04_UI/F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) | Component system law |
| [`F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md`](../04_UI/F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md) | Token law |
| [`F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | Behaviour |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | Implementation rules |
| [`F6_2_FRONTEND_ARCHITECTURE.md`](../06_ENGINEERING/F6_2_FRONTEND_ARCHITECTURE.md) | Package · folder projection |
| [`S3_SCREEN_SPECIFICATION.md`](./S3_SCREEN_SPECIFICATION.md) | Screen composition consumers |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — S4 Design System contract: atoms · molecules · organisms · layout · navigation · form · feedback · empty/error/loading/skeleton · modal/sheet/task rules · a11y · variants · tokens · naming · folder mapping; no code · no redesign · no V2; Phase S content complete · D1 authorized |
