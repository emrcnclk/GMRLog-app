# D3.27 — Game Hub + Premium Profile Experience · Completion Report

**Document:** `docs/05_FRONTEND/D3_27_COMPLETION_REPORT.md`
**Status:** **COMPLETE** (one pre-existing environment failure, documented below)
**Authority:** [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) · [`GAME_HUB.md`](../07_SOCIAL/GAME_HUB.md) · [`PROFILE_V2.md`](../07_SOCIAL/PROFILE_V2.md) · [`PLAYER_ARCHETYPES.md`](../07_SOCIAL/PLAYER_ARCHETYPES.md) · [`ACHIEVEMENT_SYSTEM.md`](../07_SOCIAL/ACHIEVEMENT_SYSTEM.md)

---

## Phase 0 — Audit findings

### The root cause of the "CRUD feel"

D3.25 shipped a fully enriched `GameResponse` — `heroUrl`, `coverUrl`,
`externalRating`, `releaseDate`, `genres`, `tags`, `developers`, `publishers`,
`screenshots`, `trailerUrl`, `summary`, `description` — and backend routes
`GET /games/:id`, `/games/:id/media`, `/games/:id/similar`, `/games/:id/metadata`.

**None of them existed in `apps/frontend/src/api/axios-client.ts`.** The Game Hub
only ever called `/games/:id/hub`, which returns `{ gameId, title, tabCounts }`.
That is why the screen was a stack of grey buttons — the data was already there
and simply unreachable from the client.

Same for `GET /me/statistics/history`, which the backend serves and the client
never called. That read is what makes the profile heatmap possible.

### Stack correction

The brief asked for "Framer Motion everywhere". The frontend is Expo /
React Native (`expo-router` 4 · `react-native` 0.76 · `reanimated` 3.16), where
Framer Motion does not run. All motion uses the existing `@gmrlog/ui/motion`
package — `MOTION_DURATION` / `MOTION_EASING` tokens, `useReduceMotion`, and
`Animated` with the native driver. No second motion system was introduced.

### Duplication removed

`features/profile/components/profile-tabs.tsx` and the Game Hub's ad-hoc tab
chrome were the same component written twice. Both now consume a single
`SegmentedTabs` primitive from the design system.

---

## What shipped

### Design system (`@gmrlog/ui`) — new primitives, built once

| Primitive | Purpose |
|-----------|---------|
| `AspectBox` | Reserves artwork space at a fixed ratio **before** the image measures — the mechanism behind zero layout shift |
| `GradientScrim` | Legibility scrim over artwork, built from eased alpha bands (no gradient dependency added) |
| `SegmentedTabs` | The single tab strip for every tabbed surface; keeps the active tab scrolled into view |
| `StatTile` | One number and what it means — the atom behind every statistics grid |
| `ProgressBar` | Determinate track with real `progressbar` a11y values |
| `RarityBadge` | Rarity marker that always carries the tier word (colour is never the only channel) |
| `ActivityHeatmap` | GitHub-style contribution grid |
| `Rail` | Titled horizontal shelf — every "Currently playing" / "Screenshots" row |
| `DistributionBars` | Horizontal histogram scaled to the largest bucket |
| `FadeInView` | Enter transition using opacity + transform only, so it cannot cause CLS |

Extended rather than duplicated: `Chip` gained `interactive={false}` for
read-only tags (a genre chip should not announce itself as a button); `Avatar`
gained `xl` / `2xl` for the profile hero.

### Token families

Added `color.accent.*`, `color.rarity.*`, `color.scrim.*`. The accent is
remappable at runtime through `ThemeProvider`, which is exactly the "remap values
under the same semantic token names" contract the provider already documented.

**Invariant, enforced by test:** an accent remaps `color.accent.*` and *nothing
else*. `packages/ui/src/theme/accent.spec.ts` asserts that for all 8 accents × 2
schemes, every non-accent token is byte-identical to the neutral palette. An
accent therefore cannot degrade contrast anywhere in the app. `neutral` is the
default and reproduces the frozen monochrome system exactly.

### Phase 1 — Game Hub

`GET /games/:id` + `/media` + `/similar` wired into the client. Hero artwork with
a documented fallback chain (`heroUrl` → banner → artwork → screenshot → cover),
scrim, overlapping cover, and the full identity block: title · release year ·
critic score · community rating on the documented 1–10 scale · library count ·
platforms · genres · developers · publishers · attribution.

Tabs: **Overview · Reviews · Activity · Screenshots · Videos · Collections ·
Recommendations**, rendered in place over one virtualized `FlatList`. The
existing `app/(app)/game/[id]/*` sub-routes are retained, so every deep link
established in D3.16 still resolves.

### Phase 2 — Premium profile

Hero (blurred banner · large avatar · level · rank · progress · member since),
six headline statistics, and Gaming Insights: completion rate, average rating,
hours, favourite platform, most played studio, favourite genres, activity
heatmap, most active year.

**Level and rank are derived, not stored.** GMRLOG has no XP column, so
`derivePlayerLevel` projects platform counts through documented weights
(`XP_WEIGHTS`) into a quadratic level curve. It is deterministic — same inputs,
same level, on any device — and the code says so rather than implying a persisted
balance.

### Phase 3 — Archetypes

Primary + secondary from the two highest-scoring awarded badges. Card carries
icon, rarity band, explanation, strengths and weaknesses. The engine stays
server-side and locked; the client adds presentation copy for the twelve locked
keys and computes nothing but ordering. A test asserts the catalog covers exactly
those twelve keys and invents none.

### Phase 4 — Achievements

Grouped, rarity-coloured showcase with unlock dates, live progress bars, and a
spring entrance for awarded badges. Hidden achievements stay redacted until
awarded — including from their own owner, so the surprise survives.

### Phase 5 — Customization

Accent · card style · banner style · favourite platform · console generation ·
widget order · pinned widgets · hidden widgets. Persisted device-locally; see
[`PROFILE_CUSTOMIZATION.md`](../07_SOCIAL/PROFILE_CUSTOMIZATION.md) for the full
contract and the backend shape needed to sync it.

Reordering ships as press-and-hold drag **plus** explicit up/down controls. Drag
alone is unusable with switch control or a screen reader, so the buttons are the
accessible path, not a fallback.

### Phase 6 — Collections

Steam-style shelves over the closed `LibraryStatus` vocabulary, in grid and list
modes, with a shelf filter. `hidden` is excluded from the showcase by the model
and a test enforces it.

### Phase 7 — Timeline

One `TimelineCard` behind every feed row, shared by Home, Profile and the Game
Hub activity tab, with a matching skeleton. Every one of the 21 locked
`ActivityKind` members maps to a tone and a message — asserted by test.

### Phases 8–9 — Motion and performance

Reduce-motion honoured throughout (`useReduceMotion` gates every animation).
Transitions are opacity/transform only. `memo` on all new list and card
components; `useMemo` on all derived models; `FlatList` virtualization with tuned
`initialNumToRender` / `windowSize`; image `priority` tiered so only above-the-fold
artwork is fetched eagerly; every artwork surface wrapped in `AspectBox`.

---

## Verification

| Gate | Result |
|------|--------|
| `pnpm lint` (ui · types · validators · api-sdk · config · frontend · backend) | **pass** |
| `pnpm typecheck` (all packages incl. backend) | **pass** |
| `pnpm test` — frontend | **526 passed** (109 files) |
| `pnpm test` — `@gmrlog/ui` | **20 passed** (4 files) |
| `pnpm test` — backend | **1249 passed** (146 files) |
| `@gmrlog/database#build` | **fails — pre-existing, see below** |

**91 new tests** were added across six new spec files, covering every pure model
introduced by this sprint: game detail presentation, profile insights and level
derivation, archetype catalog, achievement showcase, customization
parse/normalize/reorder, timeline mapping, avatar initials, and the accent token
invariant.

### Known failure — not caused by this sprint

`@gmrlog/database#build` fails at `prisma generate`:

```
EPERM: operation not permitted, rename
'node_modules/.prisma/client/query_engine-windows.dll.node.tmpNNNN' ->
'.../query_engine-windows.dll.node'
```

A Windows file lock on the Prisma query engine DLL. Eleven orphaned `.tmpNNNN`
files dating to **29 and 31 July** show this has been failing on this machine for
days, before this sprint began. D3.27 changed no file under `packages/database`
or `apps/backend`, and backend lint, typecheck and all 1249 backend tests pass
against the already-generated client. Resolution is environmental: close
processes holding the DLL, delete the orphaned `.tmp*` files, re-run
`pnpm --filter @gmrlog/database build`.

---

## Honest gaps — spec asked, platform cannot yet answer

These were **not** faked. Each is omitted from the UI, with the backend change
that would enable it.

| Brief item | Why it is absent | Needed |
|-----------|------------------|--------|
| **Country** on profile header | No country field exists anywhere in the schema or DTOs | `User.country` column + projection |
| **Review distribution** histogram | No endpoint returns per-rating buckets; there is no user reviews list (`GET /reviews/{id}` and `GET /games/{id}/reviews` only) | `ratingDistribution` on `UserStatisticsResponse`, or `GET /users/{id}/reviews` |
| **"Platform" / "Founder"** achievement groups | The locked taxonomy in `ACHIEVEMENT_SYSTEM.md` has no such categories | New locked categories + seeded definitions |
| **Quote / Repost** timeline cards | `QuoteResponse` and `RepostResponse` exist, but no `ActivityKind` member emits them | `quote` / `repost` added to the closed `ActivityKind` vocabulary |
| **Cross-device customization** | No customization columns; backend under FEATURE FREEZE | `GET`/`PATCH /me/profile-theme` per `PROFILE_CUSTOMIZATION.md` |
| **BlurHash** progressive loading | Backend emits no blurhash strings on `GameMediaResponse` | `blurhash` field on media rows; `expo-image` already supports it, and `AspectBox` already prevents the CLS that blurhash would otherwise mask |

Where the brief's showcase names conflicted with a **LOCKED** document, the
locked document won and the brief's names were applied as presentation groupings
only. The achievement wire contract is unchanged.
