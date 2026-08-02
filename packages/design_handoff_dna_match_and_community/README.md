# Handoff: Gamer DNA Match + Community Detail (Moderators / Leaderboard / Top Members)

## Overview

Two connected additions to GMRLOG:

1. **Gamer DNA Match** — a compatibility read between the signed-in player and any _individual_ player they view: a single headline percentage, **five** breakdown dimensions, a one-line verdict, trait pills, and a shared-games rail. Match tokens surface wherever people are listed, so the whole app becomes a friend-finding surface. **Individual accounts only** — studio / publisher / brand accounts never show a match.
2. **Community detail → Members tab** — restructured into three stacked layers: Moderators & contributors, a 90-day Contribution board, and a Top members list carrying DNA match tokens.

## About the design files

`GMRLOG.dc.html` (+ `support.js`) in this bundle are **design references authored in HTML** — a working prototype of look and behaviour, not production code to copy. The task is to **recreate these designs inside the existing GMRLog app**, which already has the right environment for it.

**Do not port the HTML, the inline styles, or the hex values literally.** Every visual below already exists as a token or primitive in `@gmrlog/ui` — see _Token mapping_.

## Target environment

- **One codebase, both platforms.** `apps/frontend` is Expo + `expo-router`, rendering native iOS/Android and web through React Native Web. Build each screen once in the feature folder; do not fork a separate web implementation.
- **UI primitives:** `packages/ui/src/components/*`, re-exported from `@gmrlog/ui`. Compose from these — do not hand-roll views that duplicate them.
- **Theming:** `useTheme()` from `@gmrlog/ui`. Components consume **semantic token names only** (`color.accent.default`, `space.4`, `radius.lg`) — never raw hex, never primitives. The prototype's violet `#9184d9` is the `plasma` accent; it must resolve through `color.accent.*` so it follows the player's accent choice and collapses to monochrome on `neutral`.
- **Types & API:** `packages/types`, `packages/validators`, `packages/api-sdk`.
- **Data:** TanStack Query hooks in each feature's `hooks/` folder, matching the existing `use-communities.ts` shape.

## Fidelity

**High-fidelity.** Layout, hierarchy, spacing rhythm, type scale and interaction states are final. Reproduce them faithfully _through the token system_.

The app's current palette is zinc (`#09090B` / `#3F3F46` borders / white accent); the prototype is cool navy with near-invisible hairlines. **THEME_MIGRATION.md closes that gap in one values file** — apply it before any feature work, and every screen in the app moves at once. After it lands, the token names below resolve to the prototype's values automatically.

---

## Read these in order

1. **HOW_TO_RUN.md** — how to actually run this (one sentence per session, not a prompt per step)
2. **CLAUDE.md** — copy to the repo root; the standing rules every session inherits
3. **TASKS.md** — the ordered checklist; this is where the work lives
4. **THEME_MIGRATION.md** — what the app is _made of_ (colour, type, radius)
5. **SCREEN_REDESIGNS.md** — the twelve core screens
6. **SCREEN_REDESIGNS_2.md** — the remaining twelve
7. **OAUTH.md** — sign-up with Google, Steam, Discord
8. **BACKEND_CHANGES.md** — the API and scoring gaps
9. **README.md** (this file) — the DNA match and community feature spec

THEME_MIGRATION and SCREEN_REDESIGNS are the two halves of "make it look like the prototype". The palette alone will make the app darker and cleaner but still flat — flatness is a layout property.

---

# What already exists in the codebase (read this first)

Much of the plumbing is in place. **Extend it — do not build a parallel system.**

> **0.1 — every file and symbol named in the table below was verified present.** `public-profile-screen.tsx`, `app/(app)/user/[id].tsx`, `similar-users-section.tsx`, `community-members-screen.tsx`, `community-member-card.tsx`, `empty-members.tsx`, `archetype-card.tsx`, `archetypes-strip.tsx`, `discover-hub-screen.tsx`, `use-discover.ts`, `useSimilarUsers`, `HIDDEN_FROM_ASSISTIVE_TECH`, `MOTION_DURATION`, and the `Rail` / `StatTile` / `RarityBadge` / `DistributionBars` / `SegmentedTabs` / `Chip` / `Card` / `Avatar` / `EmptyState` / `Skeleton` / `ListItem` / `NavHeader` / `AspectBox` / `ProgressBar` / `FadeInView` primitives all exist as described. The "extend, don't rebuild" framing holds throughout — **no path in this document was found stale.**

| Already there                                                                                    | Where                                                                                                                                                                                        | Gap to close                                                                                                                                           |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Similarity **score** per user pair, computed server-side                                         | `SimilarUserResponse { user, score }` in `packages/types/src/index.ts` **L1212** (0.1: was written as ~L1181), served to `useSimilarUsers()` (`features/discover/hooks/use-discover.ts:362`) | The score exists and is **never rendered**. Surface it as the headline percentage.                                                                     |
| "Similar players" list on another player's profile                                               | `features/discover/components/similar-users-section.tsx`, mounted in `features/profile/screens/public-profile-screen.tsx`                                                                    | Rows show avatar + name + handle only. Add the match token; this component becomes the shared row.                                                     |
| Public profile screen with identity block, stats grid, achievements, archetypes, gaming insights | `features/profile/screens/public-profile-screen.tsx`                                                                                                                                         | **Do not build a new Player screen.** The DNA panel is a new section inserted into this screen, under the identity block and above `ProfileStatsGrid`. |
| Route `/(app)/user/[id]` wired to `PublicProfileScreen`                                          | `app/(app)/user/[id].tsx`                                                                                                                                                                    | Nothing — already correct.                                                                                                                             |
| Friend request action, relationship state                                                        | `useSendFriendRequest`, `UserRelationshipResponse`                                                                                                                                           | Nothing — the Follow/Message row already exists.                                                                                                       |
| Community members screen and member card                                                         | `features/communities/screens/community-members-screen.tsx`, `components/community-member-card.tsx`, `empty-members.tsx`                                                                     | Add the three-layer structure (moderators rail, contribution board, top members) and the match token on the row.                                       |
| Archetype cards / strip                                                                          | `features/profile/components/premium/archetype-card.tsx`, `components/archetypes-strip.tsx`                                                                                                  | Trait pills should reuse these, not new `Chip`s, if the vocabulary matches.                                                                            |

**So the genuinely new work is:**

1. Extending `SimilarUserResponse` with the **five dimension scores, band, verdict sentence, traits, shared games** — the engine already computes the dimensions internally and discards them (BACKEND_CHANGES.md §1).
2. The **DNA match panel** component (ring + breakdown bars) inserted into `PublicProfileScreen`.
3. The **match token**, added to `similar-users-section.tsx`, the friends list rows, and community member rows.
4. The **"Plays like you" rail** on Discover — `useSimilarUsers` already returns the data; it needs the card treatment and a self-scoped variant.
5. **Moderators / contribution board** in the community Members tab — fully new, including the leaderboard endpoint.

Everything in the _Screens_ section below describes the intended result; read it as "what this section should look like once extended", not as a licence to create new screens beside the existing ones.

---

## 1. Player screen — DNA match

**This screen exists**: `features/profile/screens/public-profile-screen.tsx`, routed from `app/(app)/user/[id].tsx`. The DNA panel is a **new section inside it**, placed under the identity block and above `ProfileStatsGrid`. Do not create a second player screen.

New files only:

```
features/dna-match/
  components/dna-match-panel.tsx
  components/dna-match-ring.tsx
  components/dna-match-token.tsx      // reused in similar-users, friends, community members
  hooks/use-dna-match.ts
  index.ts
```

**Purpose:** decide whether to follow / message someone by seeing how their play overlaps yours.

**Layout, top to bottom:**

| Block                                                                    | Build with                                | Notes                                            |
| ------------------------------------------------------------------------ | ----------------------------------------- | ------------------------------------------------ |
| Header, identity block, stats grid, achievements, archetypes, insights   | **already built**                         | Leave as is                                      |
| **DNA match panel** — new, between identity block and `ProfileStatsGrid` | `Card` with an accent hairline border     | See below                                        |
| "Both of you played" rail — new                                          | `Rail` + `AspectBox name="cover"`         | Horizontal scroll, 88px covers, title under each |
| "Similar players" list                                                   | `SimilarUsersSection` — **already built** | Add the match token to each row                  |

### DNA match panel

Card, `radius.xl`, surface `color.surface.card`, border `color.accent.muted`, with a short accent hairline flush to the top-left corner (a 34×1 rule — the system's "premium plate" mark, same one used on sponsored cards). Section label `role="meta"`, uppercase: **GAMER DNA MATCH**.

Three presentation modes exist in the prototype behind a `dnaMatchStyle` variant. **Ship `ring` as the default**; the other two were exploration and only need building if you want the A/B:

- **ring** — 104px circular gauge, `conic-gradient(accent <pct×3.6deg>, border 0)` with an 86px background-coloured hole and the percentage centred at `role="display"` weight 300. To the right: band label (`role="body"`) and verdict line (`role="body"`, `color.text.secondary`). Ring glow is rarity-style: ≥85% gets an ambient accent shadow, 70–84% a faint one, below that none.
  _RN note:_ there is no `conic-gradient` in React Native. Build the ring with `react-native-svg` — a background `Circle` at `color.border.default` plus a foreground `Circle` with `strokeDasharray` / `strokeDashoffset` and `strokeLinecap="butt"`, rotated −90°. Same component renders on web.
- **number** — percentage at 62px weight 200, band + verdict stacked under it.
- **bars only** — no gauge, breakdown bars carry it.

**Breakdown bars** (always shown except in `number` mode) — five rows, `space.3` gap, separated from the gauge by a hairline and `space.4` of padding. **These are exactly the five signals the production similarity engine already computes** — see BACKEND_CHANGES.md §1:

| Dimension        | Engine signal                                        | Weight |
| ---------------- | ---------------------------------------------------- | ------ |
| Shared library   | `library` — Jaccard over owned game ids              | 0.28   |
| Genre overlap    | `genre` — Jaccard over genre ids                     | 0.22   |
| Rating agreement | `reviewRating` — average agreement on shared reviews | 0.18   |
| Wishlist overlap | `wishlist` — Jaccard over wishlisted ids             | 0.18   |
| Completion style | `completion` — Jaccard over completed ids            | 0.14   |

Each row: label left (`role="label"`), percentage right (`role="meta"`), 2px track underneath. Use **`DistributionBars`** — it already renders exactly this. Track `color.border.default`, fill `color.accent.default`.

**Trait pills** below: `Chip` components, 2–3 per player, e.g. "Completionist", "Night owl", "Route runner".

**Bands** (copy, derived from the headline percentage):

- ≥ 85 — "Near-identical DNA"
- 70–84 — "Strong overlap"
- 55–69 — "Partial overlap"
- < 55 — "Different shelf"

**Verdict line** is authored per pair by the backend, one sentence, plain and specific — "You both finish what you start, and you both do it after midnight." Never a generic template string.

**Empty / non-applicable states:**

- **Organisation account** (studio, publisher, brand): omit the panel entirely. Not a zero-percent state — the concept does not apply. Elsewhere the token slot reads "Organisation" in `color.text.tertiary`.
- **Too few shared logs:** show the panel with an `EmptyState` body — "Not enough shared logs yet — follow to sharpen the read." No fabricated percentage.
- **Blocked account:** panel frozen, muted, no live numbers.
- **Loading:** `Skeleton` for the gauge and **five** bar rows.

### Headline score

The weighted sum the engine already produces — `USER_SIMILARITY_WEIGHTS` in `similarity.engine.ts`, rendered as a percentage. **Computed server-side only**; the client must never derive it or two devices will disagree.

---

## 2. Community detail — Members tab

**Files:** `features/communities/screens/community-detail-screen.tsx` (tab content) and `community-members-screen.tsx` (full list). Existing `community-member-card.tsx` and `empty-members.tsx` get reused.

The Members tab becomes three sections in one scroll, in this order:

**a. Moderators & contributors** — horizontal `Rail` of plates. Each plate: 138px wide, `radius.sm` (deliberately squarer than the rest of the app — geometry, not colour, marks rank), 38px avatar, name, and an uppercase role label in the accent. Moderators get an accent border plus ambient glow; contributors get a plain hairline and no glow. This is the same rarity-by-geometry language as `RarityBadge` — reuse `rarityColorToken` rather than inventing a moderator colour.

**b. Contribution board** — top 5 by 90-day contribution points. Row: two-digit rank in monospace (`role="meta"`; rank 01 in the accent, the rest in `color.text.tertiary`), 26px avatar, name with a 2px `ProgressBar` underneath scaled to the leader, points right-aligned. Header row: "CONTRIBUTION BOARD" + "90 days".
Points are a backend-owned figure — posts, replies, accepted guides, event hosting. Surface it, do not compute it client-side.

**c. Top members** — the existing member list, plus a **DNA match token** on the second line beside the role: `· 81% match`, monospace, in the accent when ≥70% and `color.text.tertiary` below that. Tapping the row or avatar opens the Player screen. Organisation members show "Organisation" instead.

---

## 3. Discover — "Plays like you" rail

**Files:** `features/discover/discover-hub-screen.tsx`, new `features/discover/components/dna-peer-card.tsx`

New section directly under the genre chips, above the main results. Header "PLAYS LIKE YOU" with "DNA match" right-aligned. Horizontal `Rail` of 136px cards; each card has a 52px avatar wrapped in the same SVG match ring, name, handle, then a hairline rule and the percentage at `role="title"` weight 300 with a small uppercase "match" label. Sorted descending by match. Tapping opens `/(app)/user/[id]`.

Data already exists — `useSimilarUsers` returns `{ user, score }`. This is a card treatment over data you are already fetching, not a new pipeline.

---

## 4. Friends / followers list

**Files:** `features/friends/components/*`, `features/friends/screens/*`

Under the existing `@handle · note` line, add a tappable match token: a 14×1 accent rule, then `81% match`. Tapping opens the Player screen. The row's overflow menu "View profile" action must point at the same route — in the prototype it wrongly pointed at the user's own profile; do not carry that over.

---

# Interactions & behaviour

- **Follow** is optimistic — flip the label and variant immediately, roll back with an `ErrorBanner` on failure.
- **Navigation** to the Player screen is `router.push('/user/[id]')`, so back returns to whatever list you came from. The prototype's `userBack` state is a prototype artefact — expo-router handles this.
- **Blocking** from the Player screen removes the follow relationship and freezes the match panel.
- **Ring animation:** sweep from 0 to the value once on mount, `MOTION_DURATION.medium`, standard easing, wrapped so it respects reduce-motion via `MotionProvider`. Never re-animate on re-render.
- **Screen entry:** `FadeInView`, matching the rest of the app.

# Responsive — web and native

Native is a single column at phone width. On web, above the tablet breakpoint:

- Player screen: `Container` caps content width; the identity row and DNA panel sit side by side, gauge left, breakdown right.
- Rails become wrapping grids rather than horizontal scrollers where a full row fits.
- Every tap target stays ≥44px on both platforms; hover states only on web (`Pressable` hover props are already handled inside `Button` / `Card`).

# State & data

Client state is minimal — follow toggles and the active community tab. Everything else is server state via TanStack Query.

```ts
// packages/types — see BACKEND_CHANGES.md §3 for the full shape
export interface DnaDimension {
  key: 'library' | 'genre' | 'reviewRating' | 'wishlist' | 'completion';
  score: number; // 0–100
}
```

Endpoints — prefer **extending the existing similarity endpoint** over adding a parallel one:

- Extend `SimilarUserResponse` to `{ user, score, band, dimensions }` so lists can render the token from data they already fetch
- `GET /users/:id/dna-match` → full `DnaMatch` (verdict, traits, shared games) for the panel
- `GET /discover/dna-peers?limit=` — or reuse `useSimilarUsers` scoped to the signed-in user
- `GET /communities/:id/leaderboard?window=90d` → ranked contributors with points
- Community members response gains `role` (`moderator` | `contributor` | `member`) and the embedded score

Hooks: `useDnaMatch(userId)` new; `useSimilarUsers` already exists and should be reused for the rail and list rows. Mirror the caching and error handling in `features/discover/hooks/use-discover.ts`.

# Token mapping

The prototype's literals, and what they must become:

| Prototype                                | Token                                                                                                                                                                                                                         |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#9184d9` accent line/glow               | `color.accent.default` (plasma)                                                                                                                                                                                               |
| `#d2cefd` accent text                    | `color.accent.muted`                                                                                                                                                                                                          |
| `#f3f5fe` / `#e9e9ed`                    | `color.text.primary`                                                                                                                                                                                                          |
| `#b2b6ca` / `#9397ab`                    | `color.text.secondary`                                                                                                                                                                                                        |
| `#75798c` / `#595d6c`                    | `color.text.tertiary`                                                                                                                                                                                                         |
| `rgba(35,37,50,.5)` card fill            | `color.surface.card`                                                                                                                                                                                                          |
| `rgba(233,233,237,.07)` hairline         | `color.border.default`                                                                                                                                                                                                        |
| `#161826` / `#181a29`                    | `color.background.primary` / `.elevated`                                                                                                                                                                                      |
| Inter 300/400/500 at 10–32px             | `typography` roles: `display`, `title`, `body`, `label`, `meta` — **but see `THEME_MIGRATION.md` §4b: the existing 7 roles do not cover the range `SCREEN_REDESIGNS.md` asks for, and weight 300 is not yet expressible**     |
| Monospace micro-labels, `.14em` tracking | `role="meta"` (as `letterSpacing: 1.4` — RN takes px, not em)                                                                                                                                                                 |
| 4 / 8 / 11 / 14 / 20 / 22px padding      | `space.1` … `space.6` — **0.1: this row overstates the fit.** `space.1…6` is `4 / 8 / 12 / 16 / 20 / 24`, so 11→12, 14→16 and 22→24 are roundings, not mappings. Round to the grid deliberately; do not inline the odd values |
| 4 / 8 / 12 / 14px radii                  | `radius.sm` / `md` / `lg` / `xl` (post-migration `lg`=11, `xl`=14)                                                                                                                                                            |
| Ambient violet glow                      | `shadow.md` tinted through `color.accent.muted`                                                                                                                                                                               |

**Rule the prototype follows and the implementation must keep:** the accent appears only as **lines, rings and glows** — never as a filled block behind content. Rank and rarity are encoded by _geometry_ (square plate + glow = highest; circle + hairline = ordinary), so the whole system still reads correctly on the `neutral` monochrome accent.

# Assets

None. Covers and avatars in the prototype are CSS gradient placeholders standing in for real artwork from the existing catalogue and CDN.

# Accessibility

- Announce the match as a sentence, not a bare number: `accessibilityLabel="81 percent DNA match with Tomas Vieira, strong overlap"`.
- The ring is decorative once the percentage is read — mark it with `HIDDEN_FROM_ASSISTIVE_TECH`.
- Breakdown bars need `accessibilityRole="progressbar"` with `accessibilityValue`.
- Never encode match strength by colour alone — the percentage and band text always accompany it.

# Files in this bundle

- `HOW_TO_RUN.md` — the working rhythm
- `CLAUDE.md` — **copy to the repo root**; standing rules for every session
- `TASKS.md` — the ordered checklist
- `THEME_MIGRATION.md` — palette, typography, radius, accent and rarity values
- `SCREEN_REDESIGNS.md` — composition spec for the twelve core screens
- `SCREEN_REDESIGNS_2.md` — composition spec for the remaining twelve
- `OAUTH.md` — Google / Steam / Discord sign-in and sign-up
- `BACKEND_CHANGES.md` — engine, schema, DTO and endpoint changes
- `GMRLOG.dc.html` — the full 24-screen prototype
- `support.js` — prototype runtime only. Nothing here ships.

To view: open `GMRLOG.dc.html` in a browser and use the screen switcher.
