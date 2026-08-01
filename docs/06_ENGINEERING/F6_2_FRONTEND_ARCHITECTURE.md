# GMRLOG — Sprint F6.2: Frontend Architecture

**Document:** `docs/06_ENGINEERING/F6_2_FRONTEND_ARCHITECTURE.md`  
**Version:** 1.0  
**Status:** **DRAFT**  
**Sprint:** F6.2 (Frontend Architecture — organization only)  
**Last Updated:** July 2026  
**Owner:** Engineering Architecture Director  
**Classification:** Engineering Architecture

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
| 7 | Entire F5 (**LOCKED** product architecture — F5.1–F5.5) |
| 8 | [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) — engineering organization constitution |
| 9 | [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) · [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) · [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) — subordinate engineering projections |
| 10 | **This document** — Frontend Architecture Specification (how the frontend is organized) |

Never contradict previous freezes.

Never redesign the product.

Never redesign UX or UI.

Never change Information Architecture.

Never introduce new MVP features or new screens.

This sprint specifies **HOW the frontend is organized**.

| Layer | Role relative to this document |
|-------|--------------------------------|
| F1–F4 | Constitutional product · UX · UI law |
| F5 | What exists · how it behaves · how implementation stays consistent — **LOCKED** |
| F6.1 | How engineering systems, packages, modules and boundaries are organized |
| **F6.2** | How the **frontend** projects F6.1 organization onto the client |

This sprint answers:

> “How is the frontend organized?”

rather than:

> “What does the product look like?” · “What features exist?” · “How does the backend work?”

| Does | Does not |
|------|----------|
| Define Expo / React Native application organization · Expo Router structure · feature modules · shared modules · Design System consumption · state philosophy · forms · theme · assets · a11y · localization readiness · dependency rules · scalability | UI redesign · UX redesign · new screens · new features · backend · API implementation · database · authentication logic · algorithms · recommendation logic · business logic |

**Gate:** Stop after this specification. Do **not** continue to Sprint F6.3 in this deliverable.

---

## Scope

**In scope:** Frontend mission and philosophy · relationship to prior constitutions · monorepo frontend position · Expo application architecture · Expo Router navigation structure · folder organization · feature modules · shared modules · Design System consumption · state management philosophy (server · local · draft) · form management philosophy · theme consumption · navigation implementation philosophy · offline-first frontend philosophy · error boundary philosophy · loading architecture · asset organization · localization readiness · accessibility implementation principles · package boundaries · code ownership · dependency direction · scalability.

**Out of scope:**

| Forbidden |
|-----------|
| Backend · platform services · infrastructure |
| API implementation · endpoint definitions · request/response schemas |
| Database · Prisma · persistence |
| Authentication logic · token internals · OAuth flows as implementation |
| Algorithms · ranking · recommendation logic · business logic |
| UI redesign · new screens · new features · IA changes |
| Source code · snippets · configuration values · syntax tutorials |

---

## Deliverable map

| Part | §§ | Title |
|------|----|-------|
| A | 1–4 | Mission · Frontend Philosophy · Relationship to Previous Constitutions · Monorepo Frontend Position |
| B | 5–9 | Expo Application Architecture · Feature Modules · Shared Modules · Design System Consumption · Routing Philosophy |
| C | 10–14 | State Management · Server State · Local State · Forms · Theme Consumption |
| D | 15–17 | Asset Organization · Accessibility · Localization Readiness |
| E | 18–21 | Dependency Rules · Scalability Rules · Anti-Patterns · Audit Checklist |

---

# PART A — FOUNDATION

---

# 1. Mission

Define the frontend organization that every client implementation must obey.

The frontend is a **projection surface**. It presents the frozen Product Architecture (F5) through the frozen Design System (F4) under the frozen engineering organization (F6.1).

The frontend never becomes a second Source of Truth for product meaning, business rules, or visual systems.

| Prefer | Never |
|--------|-------|
| Assembling F5.3 screens from shared systems | Inventing screens or destinations in route files |
| Consuming the Design System | Building private component kits inside features |
| Reflecting platform-confirmed truth honestly | Deciding business invariants on the client |
| Organization that mirrors F5.1 ownership | Folder trees that mirror team opinions |
| Calm, predictable structure | Clever structure that hides ownership |

---

# 2. Frontend Philosophy

## 2.1 The frontend is an honest window

The client is the player’s window into their Digital Home. Its architecture must guarantee that the window is:

| Quality | Architectural consequence |
|---------|---------------------------|
| Recognizable | One Design System · one theme pipeline · no visual forks |
| Oriented | Navigation structure mirrors F5.1 strata exactly |
| Honest | Loading · empty · error · pending states are first-class (F5.4) |
| Calm | No engagement machinery · no manipulation architecture |
| Resilient | Offline degrades honestly — never fakes success |
| Consistent | Same meaning renders the same way everywhere |

## 2.2 Frontend laws

| Law |
|-----|
| Every screen implemented must exist in the F5.3 catalog (or an amendment) |
| Every interaction implemented must obey its F5.4 behavior contract |
| Every visual decision consumes the Design System — never raw values |
| Every navigation path obeys F5.1 — the frontend never invents structure |
| Every remote meaning arrives through the shared API SDK — never ad-hoc transport |
| Every business invariant is platform-owned — the client reflects, it does not rule |

## 2.3 What frontend architecture optimizes for

In order:

1. Constitutional obedience (F1–F5 · F6.1)
2. Clear ownership and dependency direction
3. Reuse of shared packages and modules
4. Simplicity and readability
5. Scalability and maintainability
6. Local delivery speed

---

# 3. Relationship to Previous Constitutions

| Prior law | Frontend obligation |
|-----------|---------------------|
| F2.1 · F5.1 | Five player roots · Shared Destinations · gate/control/task/staff strata — route structure and modules mirror this map exactly; no sixth root |
| F5.2 | Home feature owns feed presentation only; feed objects open into Shared Destination modules |
| F5.3 | Screens are assemblies of cataloged specs — no uncataloged screens |
| F5.4 | Loading · empty · error · success · disabled · pressed states, Back behavior, scroll behavior, task behavior are binding contracts |
| F5.5 | Reuse over duplication · semantic tokens only · naming discipline · reusability gate · MVP scope boundary (§20.1) |
| F4.8 · F4.10 · F4.12 | Design System and token architecture never fork; components consume semantics |
| F4.9 | Motion is continuity — reduced motion respected; no engagement motion |
| F4.11 | Canvas adapts · identity does not — device adaptation never forks IA or meaning |
| F3 series | Experience law: orientation · calm attention · anti-manipulation govern all frontend behavior |
| F6.1 | Monorepo laws · module kinds · ownership mapping · dependency direction · offline/state/API philosophies |
| `TECH_STACK_DECISIONS.md` | Approved frontend stack (Expo · Expo Router · TanStack Query · Zustand · React Hook Form · Zod · MMKV · NativeWind · FlashList · Reanimated · Expo Image · Lucide) — this document organizes these choices; it does not re-select them; changes require ADR |
| `MONOREPO_STRUCTURE.md` | Concrete package inventory and `@gmrlog/*` aliases — consumed as-is |
| `CODING_STANDARDS.md` | Strict TypeScript · no `any` · naming · component size discipline |

On conflict, the higher law wins. Frontend convenience never overrides F5 ownership or F4 system law.

---

# 4. Monorepo Frontend Position

## 4.1 Where the frontend lives

The mobile client is `apps/mobile` — the primary player surface (per `MONOREPO_STRUCTURE.md`).

```
gmrlog/
├── apps/
│   ├── mobile/          ← THIS DOCUMENT’S PRIMARY SUBJECT
│   ├── web/             ← same laws · web projection (marketing · future client)
│   └── admin/           ← staff overlay · isolated · same Design System meaning
└── packages/
    ├── ui               ← Design System components (F4.8 obedience)
    ├── design-tokens    ← semantic token source (F4.10 obedience)
    ├── icons            ← icon system (F4.6 obedience)
    ├── api              ← shared API SDK (the only transport bridge)
    ├── types            ← shared contracts
    ├── validators       ← shared Zod schemas
    ├── constants        ← route names · feature IDs · enums
    ├── hooks            ← shared React hooks
    ├── utils            ← pure helpers
    ├── localization     ← translations · formatting helpers
    ├── auth             ← session capability helpers
    ├── websocket        ← realtime capability helpers
    ├── analytics        ← measurement capability helpers
    ├── storage          ← upload/CDN capability helpers
    └── testing          ← shared testing utilities
```

## 4.2 Position laws

| Law |
|-----|
| `apps/mobile` is an **assembly** — it composes packages; it is not a private ecosystem |
| Anything needed by two clients belongs in `packages/*` — never copied |
| The app consumes packages via `@gmrlog/*` aliases only — no long relative imports across boundaries |
| Packages never import from `apps/*` |
| The app contains feature composition, route projection, and app shell — nothing constitutional |

## 4.3 Package boundaries (frontend view)

| Package class | Frontend relationship |
|---------------|----------------------|
| `ui` · `design-tokens` · `icons` | Consumed for all visual construction — never bypassed, never forked |
| `api` · `types` · `validators` · `constants` | Consumed for all remote meaning and shared language |
| `hooks` · `utils` · `localization` | Consumed for shared capability — features do not re-implement |
| `auth` · `websocket` · `analytics` · `storage` | Capability packages — consumed through their public surface only |
| `testing` | Consumed by feature and app tests |

A frontend feature that needs something not offered by these packages first asks: *does this belong in a package (two consumers / foundational) or in the feature (single owner)?* — per F6.1 §8.2 admission rules.

---

# PART B — APPLICATION SHAPE

---

# 5. Expo Application Architecture

## 5.1 Framework posture

| Decision | Source | This document adds |
|----------|--------|--------------------|
| Expo SDK (latest stable) | `TECH_STACK_DECISIONS.md` | How the app is organized inside it |
| React Native + TypeScript strict | `TECH_STACK_DECISIONS.md` · `CODING_STANDARDS.md` | Layer and module discipline |
| Expo Router | `TECH_STACK_DECISIONS.md` | Route tree as projection of F5.1 — nothing more |

This document does not define Expo configuration, native module setup, or build profiles. Those are subordinate implementation concerns and must obey this organization.

## 5.2 Application shell

The app shell is the outermost assembly. It exists once and owns cross-cutting providers:

```
APP SHELL (outermost → innermost)
  Error boundary (root)
    → Theme provider (semantic tokens · light/dark)
      → Localization provider
        → Query client provider (server state)
          → Session / auth gate context
            → Navigation container (Expo Router)
              → Feature surfaces
```

| Shell law |
|-----------|
| Providers live in the shell — features never mount their own global providers |
| The shell owns app start orientation (session restore · theme resolve · locale resolve) |
| The shell never contains product logic — it wires capabilities |
| Provider order is architecture — changing it requires this document’s amendment |

## 5.3 Expo Router structure (projection of F5.1)

The route tree is a **projection** of the frozen IA. Route groups mirror the F5.1 strata:

```
app/
├── (gate)/            # Auth · Onboarding — F5.1 gate stratum
├── (tabs)/            # Five player roots — F2.1 / F5.1 frozen
│   ├── home/
│   ├── discover/
│   ├── library/
│   ├── notifications/
│   └── profile/
├── (shared)/          # Shared Destinations — Game · Post · Review · Collection
│                      #   · Tier · User · Community · Event · Achievement
├── (settings)/        # Control stratum — Settings · Connected Accounts
├── (messages)/        # Control stratum — Messages (Profile-entered)
├── (tasks)/           # Task layers — Compose · Import · Account Link · Report
└── (staff)/           # Admin / Moderator overlay — isolated (if present in client)
```

| Route law |
|-----------|
| Route groups map 1:1 to F5.1 strata — no group without a stratum |
| No route exists without an F5.3 screen (or amendment) |
| Shared Destination routes are singular — never duplicated per tab |
| Task routes present as overlays/sheets per F5.4 — they are not destinations |
| Deep links resolve into this tree per F5.1 §30 — links never create parallel structure |
| Tab state preservation and Back behavior obey F5.1 / F5.4 — the router projects, never redefines |

## 5.4 Folder organization (client)

Route files stay **thin**. Meaning lives in feature and shared modules:

```
apps/mobile/
├── app/                  # Expo Router tree — thin route assemblies only
├── features/             # Feature modules (F6.1 §9 module kinds)
│   ├── home/
│   ├── discover/
│   ├── library/
│   ├── notifications/
│   ├── profile/
│   ├── auth/  onboarding/
│   ├── settings/  messages/
│   └── tasks/            # compose · import · account-link · report
├── shared/               # Shared Destination modules
│   ├── game/  post/  review/  collection/  tier/
│   └── user/  community/  event/  achievement/
├── lib/                  # App-level wiring (shell providers · navigation helpers)
└── assets/               # Static assets (see §15)
```

| Folder law |
|-----------|
| `app/` contains route projection only — a route file imports a screen assembly and exports it |
| `features/` and `shared/` own screens · hooks · mappers · local state — grouped by ownership, then by layer (F6.1 §11) |
| No screen’s meaning is scattered across unrelated trees |
| No `common/` dump folder — shared meaning goes to `shared/` or `packages/*` |
| Staff modules (if present) remain isolated — never imported by player features |

## 5.5 Error boundary philosophy

Errors are honest states, not crashes and not silence.

| Level | Role |
|-------|------|
| Root boundary | Last resort — calm full-surface recovery · never a blank screen |
| Stratum boundary | Tab / group level — one broken root never kills the others |
| Screen boundary | A failed screen shows its F5.4 error contract with retry |
| Component boundary (where justified) | An optional slot (e.g. recommendation slot) fails silently into absence — never breaks the screen |

| Error law |
|-----------|
| Every boundary renders a Design System error state — never a stack trace |
| Optional module failure (integrations · recommendation slots) degrades to absence — absence is normal (F2.21) |
| Errors are reported to crash reporting through the analytics/reporting capability — never swallowed silently |
| Error states never guilt, pressure, or manipulate — they orient and offer recovery (F3 · F5.4) |

## 5.6 Loading architecture

Loading is orientation, not theater.

| Layer | Loading responsibility |
|-------|------------------------|
| App start | Shell resolves session · theme · locale before first surface — briefly and honestly |
| Screen | F5.4 loading contract — structure-preserving skeletons · no layout jumps |
| Section | Independent sections load independently — one slow slot never blocks a screen |
| Action | Pending states on the acting element — screen remains usable where the contract allows |
| List | Incremental rendering via the approved list system (FlashList) — calm pagination per F5.2 / F5.4 |

| Loading law |
|-------------|
| Skeletons reflect real structure — never fake content |
| No full-screen spinners where a section state suffices |
| No infinite novelty loaders as engagement (F3 anti-manipulation) |
| Cached content may render immediately with honest freshness (see §11) |

---

# 6. Feature Module Architecture

## 6.1 Definition

A feature module implements **one F5.1 ownership home** (F6.1 §9). Feature modules in the client:

| Module | Owns (presentation of) | Never owns |
|--------|------------------------|------------|
| `home` | Feed presentation · compose entry (F5.2) | Game/Post/Review meaning · other tabs’ surfaces |
| `discover` | Hub · search · communities hub · events hub · recommendation surfaces | Community/Event detail meaning (shared) |
| `library` | Archive indexes · import entry | Game detail meaning (shared) |
| `notifications` | Attention desk · activity center | The objects notifications point to |
| `profile` | Self identity · achievements index entry · overflow entries | Other-user profiles (shared) · achievement detail (shared) |
| `auth` / `onboarding` | Gate surfaces · readiness steps | Session invariants (platform + auth capability) |
| `settings` / `messages` | Control surfaces | Trust decisions (platform) |
| `tasks` | Compose · Import · Account Link · Report task surfaces | Becoming destinations |

## 6.2 Internal layering

Every feature module organizes by the same layer meaning (F6.1 §9.3):

```
feature/
├── screens/        # F5.3 assemblies — composition only
├── components/     # Feature-local composition of Design System parts
├── hooks/          # Orchestration — no transport · no datastore
├── api/            # Feature facade over @gmrlog/api — queries · mutations · mappers
└── store/          # Local UI/session slices if needed (see §12)
```

Exact folder names are projections. Layer meaning is not optional.

## 6.3 Feature laws

| Law |
|-----|
| One F5.3 screen → one primary feature (or shared) module — never two owners |
| Feature components compose `@gmrlog/ui` — they do not restyle or fork it |
| Features never deep-import another feature’s internals — they go through shared modules or packages |
| Features never perform raw transport — only through their API facade over the shared SDK |
| Optional integrations (Steam · Discord) are consumed as optional capabilities — every feature remains fully usable when they are absent |
| No feature module exists for Version 2 scope (F5.5 §20.1) |

---

# 7. Shared Module Architecture

## 7.1 Definition

Shared modules implement **Shared Destinations** (F5.1 §17): Game · Post · Review · Collection · Tier · User · Community · Event · Achievement.

They are the client’s answer to the constitutional rule: *one meaning · one room · many doors*.

## 7.2 Shared module laws

| Law |
|-----|
| A Shared Destination screen is implemented exactly once — in its shared module |
| Root features import shared modules — never the reverse (ownership inversion banned) |
| Presentation context (which tab pushed the screen) never changes the shared module’s behavior contract |
| Shared modules own their screens · hooks · mappers · states — roots only route into them |
| Community children (Feed · Members · Activity) live inside `shared/community` — never under Discover |
| Event detail lives in `shared/event` — Events Hub (Discover) only lists and routes |
| Achievement detail lives in `shared/achievement` — Profile only indexes and routes |

## 7.3 Shared vs package

| Belongs in a shared module | Belongs in a package |
|----------------------------|----------------------|
| A destination’s screens and orchestration | A reusable component family (`ui`) |
| Destination-specific mappers and cache keys | Transport client and generated types (`api` · `types`) |
| Destination-local composition | Cross-cutting hooks · utils · validators |

If two shared modules need the same thing, it belongs in a package — not copied.

---

# 8. Design System Consumption

## 8.1 Consumption model

The frontend **consumes** the Design System. It never authors visual law.

```
@gmrlog/design-tokens  (semantic tokens — F4.10)
        ↓
@gmrlog/ui  (component families — F4.8)  +  @gmrlog/icons  (F4.6)
        ↓
feature / shared module composition
        ↓
screens (F5.3 assemblies)
```

## 8.2 Consumption laws

| Law |
|-----|
| All visual construction starts from `@gmrlog/ui` families (cards · rows · lists · sheets · dialogs · inputs · states) |
| Components consume **semantic tokens** — raw color/spacing/type values in feature code are illegal (F4.10 · F5.5) |
| Styling utilities (NativeWind) express token semantics — they never become a side-channel for raw values |
| MVP surfaces (Community · Event · Achievement · Connected Account · Recommendation slot) are **variants of existing families** — never private kits (F5.4 §38.1 · F5.5 §5) |
| A component needed twice enters the Design System admission path (F5.5 §16 reusability gate) — never copy-paste |
| Feature-specific composition is allowed; feature-specific design systems are not |
| Design System gaps are reported and admitted through F4.12 governance — never patched locally in silence |

## 8.3 What features may do visually

| Allowed | Forbidden |
|---------|-----------|
| Compose existing components into F5.3 screens | Restyle component internals |
| Pass documented variants and semantic props | Hardcode values to “fix” a look |
| Request admission of a new variant | Fork a component into the feature |

---

# 9. Routing Philosophy

## 9.1 Navigation is projection

Expo Router **projects** F5.1. It holds zero structural authority.

| Navigation truth | Owner |
|------------------|-------|
| What tabs exist | F2.1 · F5.1 — frozen |
| What destinations exist | F5.1 · F5.3 — frozen |
| How Back behaves | F5.4 — contract |
| How tabs preserve state | F5.1 · F5.4 — contract |
| How deep links resolve | F5.1 §30 — law |
| File names in `app/` | This document — projection only |

## 9.2 Navigation implementation laws

| Law |
|-----|
| Each of the five tabs owns an independent stack — switching tabs preserves position (F5.1) |
| Back always means “up in the current stack, then to context” per F5.4 — never surprise exits |
| Shared Destinations push onto the current tab’s stack — the room is the same regardless of the door |
| Tasks present as modal/sheet layers per F5.4 — cancellable · non-trapping · never destinations |
| Gate surfaces (auth · onboarding) replace, they do not stack under, the main app |
| Route names come from `@gmrlog/constants` — one canonical name per destination |
| No navigation side effects that manipulate attention (forced detours · interstitial engagement) |

## 9.3 Navigation state

| Rule |
|------|
| Navigation state belongs to the router — it is not mirrored in business stores |
| State restoration serves continuity (return to where you were) — never engagement re-entry hooks |
| Deep links and notifications route to existing rooms — never to synthetic surfaces |

---

# PART C — STATE · FORMS · THEME

---

# 10. State Management

## 10.1 State classes (projection of F6.1 §15)

| Class | Owner in the frontend | Technology (per approved stack) |
|-------|----------------------|--------------------------------|
| Server state | Query/cache layer over the shared API SDK | TanStack Query |
| Session / auth state | Auth capability + gate context | `@gmrlog/auth` helpers |
| UI state | Component / screen local state | React local state |
| Draft / task state | Task modules | Local state · Zustand slice where a task spans screens |
| Preferences | Settings module · persisted locally · synced when applicable | MMKV persistence |
| Navigation state | Expo Router | Router only |

## 10.2 State laws

| Law |
|-----|
| One meaning → one state owner — never two stores for the same truth |
| Server state is never copied into global stores as a permanent bag |
| Business invariants never live only in client state |
| Global state (Zustand) is for genuinely global client concerns — session presentation · draft continuity · app-level UI — not a default habit |
| Feature stores never become cross-app event buses |
| Shared Destination state lives with the shared module — never re-owned by the presenting tab |
| Persisted state (MMKV) stores continuity and preferences — never authoritative product records |

## 10.3 State selection order

When placing state, prefer in order:

1. Component local state
2. Screen local state
3. Feature/shared module scope (hook or slice)
4. Global store (only with a documented global reason)
5. Persistence (only for continuity/preferences)

Escalating a level requires a reason. De-escalating never does.

---

# 11. Server State

## 11.1 Philosophy

Server state is **platform truth, cached for presentation**. The query layer is a mirror with memory — not a database.

| Is | Is not |
|----|--------|
| Declarative queries keyed by canonical cache keys | Ad-hoc fetches in components |
| Honest staleness with background refresh | Fake freshness theater |
| Mutations with visible pending state | Silent fire-and-forget writes |
| Cache invalidation aligned to product meaning | Manual cache surgery scattered in features |

## 11.2 Server state laws

| Law |
|-----|
| All server state flows through feature/shared API facades over `@gmrlog/api` |
| Cache keys are canonical per domain — defined with the module that owns the meaning |
| Query results are mapped into feature models at the facade — screens never parse transport shapes |
| Mutations express F5.4 action contracts — pending on the element · honest failure · no optimistic lies about Trust-sensitive outcomes |
| Optimistic updates are allowed only where being wrong is cheap and visibly corrected — never for permissions, ownership, or Trust |
| Refetch policy serves calm continuity (F5.2 feed rhythm) — never engagement polling |

## 11.3 Offline-first frontend

Projection of F6.1 §14 onto the client:

| Rule |
|------|
| Reading: cached slices remain readable offline where the product allows — with honest staleness, never pretended liveness |
| Writing: queued intents carry visible pending state — pending is distinguishable from confirmed, always |
| Failure: sync failure surfaces honestly with recovery — never silent loss, never fake success |
| Integrations: absence of Steam/Discord connectivity is a normal state — never an error wall |
| Identity: Trust · permissions · identity mutations wait for platform confirmation |
| Structure: offline never changes navigation — no sixth mode, no offline-only IA |

## 11.4 Realtime

Realtime updates (via the websocket capability) are **server state deliveries**, not a parallel state system. They land in the same query cache under the same keys, obeying the same honesty laws. Realtime never becomes attention manipulation (F5.2: no live-pressure theater in the feed).

---

# 12. Local State

## 12.1 Philosophy

Local state is **ephemeral presentation memory**. It should be boring.

| Kind | Examples of meaning | Rules |
|------|---------------------|-------|
| UI state | Open sheet · expanded section · selected filter chip | Dies with the screen unless F5.4 requires continuity |
| Draft state | Compose in progress · import step · link step | Owned by the task module · survives interruption honestly (F5.4 task contracts) · discarded intentionally, never silently |
| Preference state | Theme choice · notification presentation settings | Settings-owned · persisted (MMKV) · synced when product says so |

## 12.2 Local state laws

| Law |
|-----|
| Local state never shadows server truth — it references it |
| Draft continuity is honest: restored drafts announce themselves, never auto-publish |
| Scroll and selection continuity follow F5.4 — implemented once per pattern, not per screen |
| No local state machine may encode a product flow absent from F5.3/F5.4 |

---

# 13. Forms

## 13.1 Philosophy

Forms are **structured conversations** (F3.4 kinship): calm, forgiving, honest.

| Decision | Source |
|----------|--------|
| Form orchestration: React Hook Form | `TECH_STACK_DECISIONS.md` |
| Validation: Zod via `@gmrlog/validators` | `TECH_STACK_DECISIONS.md` — schemas shared with platform |

## 13.2 Form laws

| Law |
|-----|
| Validation schemas come from `@gmrlog/validators` — client and platform validate the same meaning; the client never invents looser or stricter truth |
| Client validation is a courtesy; platform validation is the law (F6.1 §18: never trust client input) |
| Error presentation obeys F5.4 form contracts — inline · specific · recoverable · never shaming |
| Submission obeys action contracts — pending on the control · no double-submit · honest failure |
| Drafts of long forms follow §12 draft laws |
| Form components come from the Design System input families — never bespoke inputs |
| Forms never dark-pattern: no pre-checked consent · no buried opt-outs · no guilt copy (F3 · F2.27) |

---

# 14. Theme Consumption

## 14.1 Pipeline

```
@gmrlog/design-tokens (primitive → semantic → component → theme — F4.10)
        ↓
Theme provider in the app shell (resolves active theme)
        ↓
@gmrlog/ui components consume semantic tokens
        ↓
Features see tokens only through components and semantic utilities
```

## 14.2 Theme laws

| Law |
|-----|
| One theme provider — mounted in the shell (§5.2) · never per-feature |
| Themes are token resolutions (F4.10) — never component forks |
| Light/dark (and any constitutional theme) switch at the semantic layer — features are theme-blind |
| Feature code never reads primitive tokens or hardcodes values |
| Theme preference is player-controlled preference state (§12) — persisted and honored at startup |
| System preference (including reduced motion — F4.9) is respected by default |
| No engagement theming: no seasonal manipulation skins outside F4/F2.15 law |

---

# PART D — ASSETS · ACCESS · LANGUAGE

---

# 15. Asset Organization

## 15.1 Asset classes

| Class | Home | Rules |
|-------|------|-------|
| Design System assets (icons · brand) | `@gmrlog/icons` · `@gmrlog/ui` | Never duplicated into the app |
| Static app assets (splash · app icon · fonts) | `apps/mobile/assets/` | Organized by type · registered once in the shell |
| Remote product media (covers · avatars · banners · screenshots) | Object storage via CDN | Never bundled · loaded through the approved image system (Expo Image) |
| Illustrations / empty-state art | Design System governance (F4.6) | Admitted like components — no ad-hoc art dumps |

## 15.2 Asset laws

| Law |
|-----|
| Icons come from the icon system (`@gmrlog/icons` — Lucide + admitted customs) — no inline one-off SVGs in features |
| Remote media loads through the shared image component with honest placeholders (F5.4) — never layout-jumping raw loads |
| Fonts are registered once and expressed only through typography tokens (F4.3 · F4.10) |
| No asset encodes text that must localize (see §17) |
| Media never autoplays into attention capture (F4 restraint) |

---

# 16. Accessibility

## 16.1 Position

Accessibility is constitutional (F3.10 kinship · WCAG AA per `TECH_STACK_DECISIONS.md`). It is architecture, not polish.

## 16.2 Implementation principles

| Principle |
|-----------|
| Accessibility props (role · label · state) are part of every Design System component’s contract — features inherit a11y by composing correctly |
| Every F5.4 state (loading · error · disabled · selected · pending) is announced, not just painted |
| Touch targets · focus order · reading order are component-family responsibilities — screens verify, they do not re-invent |
| Dynamic font scaling is honored — layouts built on tokens must tolerate scale (F4.3 · F4.4) |
| Reduced motion disables non-essential motion at the motion-token layer (F4.9) — features do nothing special |
| Color is never the only carrier of meaning (F4.2) — enforced at the component level |
| Screen reader journeys follow the same F5.1 orientation as visual journeys — no second-class navigation |
| Accessibility tests are part of the testing layers (F6.1 §20) — regressions are defects, not debt |

---

# 17. Localization Readiness

## 17.1 Position

Version 1 launches localization-ready (languages per `TECH_STACK_DECISIONS.md`; English default). Readiness is architectural — retrofitting is banned by design.

## 17.2 Readiness laws

| Law |
|-----|
| All player-facing strings live in the localization system (`@gmrlog/localization`) — zero hardcoded UI strings in features |
| String keys are semantic and owned by the feature/shared module that owns the meaning |
| Layouts tolerate expansion and contraction — token-based spacing (F4.4), no width-locked text truncation as a habit |
| Dates · numbers · plurals go through localization helpers — never manual formatting |
| Locale is resolved in the shell (§5.2) and is player-controllable preference state |
| Localization never changes meaning, tone law (F3.11), or IA — translation is projection, not redesign |
| Assets containing burned-in text are banned (§15) |

---

# PART E — DEPENDENCIES · SCALE · CLOSE

---

# 18. Dependency Rules

## 18.1 Allowed direction (frontend projection of F6.1 §12)

```
app/ (route projection)
  → features/* · shared/*
      → feature/shared internal layers (screens → hooks → api facade)
          → @gmrlog/* packages (ui · api · types · validators · hooks · …)
              → lower-level packages (design-tokens · types · utils · config)
```

## 18.2 Forbidden direction

| Forbidden |
|-----------|
| `packages/*` → `apps/mobile` |
| `shared/*` → `features/*` (ownership inversion) |
| Feature A → Feature B internals (peer deep import) |
| Route files containing meaning (logic in `app/` beyond assembly) |
| UI components → transport (`@gmrlog/ui` never calls `@gmrlog/api`) |
| Any client module → platform internals (client talks only to the API SDK surface) |
| Circular imports at any level |

## 18.3 Code ownership

| Area | Owner (per `MONOREPO_STRUCTURE.md`) |
|------|-------------------------------------|
| `apps/mobile` · `apps/web` · `packages/ui` | Frontend team |
| `packages/design-tokens` · `packages/icons` | Design System governance (F4.12) with frontend stewardship |
| `packages/api` · `packages/types` · `packages/validators` | Shared contract ownership — changes reviewed by both sides of the boundary |
| Feature / shared modules | One owning team per module — mirrors F5.1 ownership; no orphan modules |

| Ownership law |
|---------------|
| Every module has exactly one owner |
| Contract package changes require cross-boundary review |
| Design System changes flow through F4.12 admission — frontend does not unilaterally evolve `ui` |

## 18.4 Dependency admission

Before adding any external dependency to the frontend: the Technology Adoption Policy (`TECH_STACK_DECISIONS.md`) applies. Overlapping an approved tool (a second state library · a second form library · a second styling system) is banned without ADR.

---

# 19. Scalability Rules

## 19.1 Growing without breaking identity

| Rule |
|------|
| New surfaces enter as screens under existing ownership homes — after F5.3 amendment |
| New destination families enter as shared modules — after F5.1 amendment |
| New reusable UI enters the Design System via admission — never as feature forks |
| Hubs grow entries (Discover · Profile overflow) — tabs never multiply without F2.1 amendment |
| Version 2 features (Marketplace · Premium · Creator dashboards · Twitch · advanced AI) receive **zero** frontend scaffolding under MVP (F5.5 §20.1) |

## 19.2 Codebase scalability

| Rule |
|------|
| Modules stay within their layer discipline as they grow — a growing screen splits into composition, not into a private framework |
| Components respect size discipline (`CODING_STANDARDS.md` — max component size · hook naming) |
| Route tree growth mirrors documented IA growth only — the router never leads |
| Shared package extraction happens at two consumers — not speculatively, not never |
| Performance work optimizes journeys (F6.1 §19) — it never licenses architectural forks |

## 19.3 Team scalability

| Rule |
|------|
| Module ownership enables parallel work without file collisions |
| Contract packages decouple client and platform teams |
| Staff surfaces evolve independently — isolated from player modules |
| New engineers orient by reading F5.1 → this document → the folder tree — the tree must not surprise them |

---

# 20. Anti-Patterns

| Banned |
|--------|
| Screens or routes that do not exist in F5.3 |
| A sixth tab · new root · IA invention in the route tree |
| Copying a Shared Destination under a tab feature |
| Private component kits · restyled Design System forks |
| Raw colors · spacing · font values in feature code |
| Transport calls inside components or screens |
| Server data mirrored into global stores as permanent truth |
| Business invariants enforced only on the client |
| A second state library · form library · styling system without ADR |
| Optimistic success for Trust-sensitive actions |
| Offline fake-success · silent data loss · ghost sync |
| Hardcoded player-facing strings |
| Inline one-off icons / burned-in-text assets |
| Accessibility as a post-launch backlog |
| Engagement machinery: forced detours · attention traps · streak/pressure state · manipulation theming |
| Version 2 scaffolding under MVP naming |
| Route files that accumulate logic |
| “Temporary” structure that becomes permanent parallel architecture |
| Treating this document as authority over F5 or F6.1 |

---

# 21. Audit Checklist

- [ ] Defines how the frontend is organized — not what the product looks like or what features exist  
- [ ] Obeys F1–F5 and F6.1 without contradiction · no UI/UX redesign · no new screens · no new features  
- [ ] Expo application architecture · shell · provider order · error boundaries · loading architecture defined as philosophy  
- [ ] Expo Router structure is a pure projection of F5.1 strata — no structural authority in the router  
- [ ] Feature modules mirror F5.1 root ownership · shared modules implement Shared Destinations exactly once  
- [ ] Design System consumption: semantic tokens only · admission path for new components · no forks  
- [ ] State classes · server state honesty · offline-first · local state · draft laws defined  
- [ ] Forms: shared Zod schemas · RHF orchestration · honest error contracts · no dark patterns  
- [ ] Theme: single provider · token-layer switching · feature theme-blindness  
- [ ] Assets · accessibility · localization readiness defined as architecture, not polish  
- [ ] Package boundaries · code ownership · dependency direction · scalability rules explicit  
- [ ] No backend · no API implementation · no database · no auth logic · no algorithms · no business logic · no code  
- [ ] Compatible with `MONOREPO_STRUCTURE.md` · `CODING_STANDARDS.md` · `TECH_STACK_DECISIONS.md` as subordinate projections  
- [ ] Gate: stop — do not continue to F6.3 in this deliverable  

---

## Final gate

### DRAFT COMPLETE — pending LOCK

**Sprint F6.2 — Frontend Architecture** delivered as **DRAFT**.

This document is the working SSOT candidate for **frontend organization** under F1–F5 and F6.1.

Stop.

Do **NOT** continue to Sprint F6.3 until F6.2 is explicitly advanced / LOCKED by Engineering Architecture Director.

---

## Related documents

| Doc | Role |
|-----|------|
| [`F6_1_ENGINEERING_ARCHITECTURE.md`](./F6_1_ENGINEERING_ARCHITECTURE.md) | Engineering organization constitution |
| [`F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | **LOCKED** product structure · ownership |
| [`F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | **LOCKED** Home feed boundaries |
| [`F5_3_SCREEN_SPECIFICATIONS.md`](../05_PRODUCT_ARCHITECTURE/F5_3_SCREEN_SPECIFICATIONS.md) | **LOCKED** screen catalog |
| [`F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md`](../05_PRODUCT_ARCHITECTURE/F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | **LOCKED** interaction contracts |
| [`F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md`](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **LOCKED** implementation consistency · F5 close |
| [`F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md`](../04_UI/F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) | Component system law |
| [`F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md`](../04_UI/F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md) | Token architecture |
| [`F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md`](../04_UI/F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md) | Adaptation law |
| [`F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md`](../04_UI/F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md) | Anti-fork governance |
| [`MONOREPO_STRUCTURE.md`](../00_PROJECT/MONOREPO_STRUCTURE.md) | Concrete monorepo · package inventory · aliases |
| [`CODING_STANDARDS.md`](../00_PROJECT/CODING_STANDARDS.md) | Language · layer · quality discipline |
| [`TECH_STACK_DECISIONS.md`](../00_PROJECT/TECH_STACK_DECISIONS.md) | Approved frontend stack · ADR governance |
| [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) | Supreme product question |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | DRAFT — Frontend architecture: Expo app shell · Expo Router as F5.1 projection · feature/shared modules · Design System consumption · state (server/local/draft) · forms · theme · assets · a11y · localization readiness · dependency and scalability rules; no backend · no API implementation · no code; gate before F6.3 |
