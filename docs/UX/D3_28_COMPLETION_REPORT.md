# D3.28 — Experience, Discover & Production Polish · Completion Report

**Document:** `docs/UX/D3_28_COMPLETION_REPORT.md`
**Status:** **COMPLETE** — all frontend phases implemented; three items explicitly deferred with reasons (§8)
**Date:** 2026-08-01
**Authority:** [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) · [`PRODUCT_POLISH_AUDIT.md`](../../PRODUCT_POLISH_AUDIT.md) · [`D3_27_COMPLETION_REPORT.md`](../05_FRONTEND/D3_27_COMPLETION_REPORT.md) · [`D3_26_COMPLETION_REPORT.md`](../18_CATALOG/D3_26_COMPLETION_REPORT.md)

---

## 1. Production gate

| Area | Result |
|---|---|
| Repo lint (`pnpm lint`, 14 packages) | **PASS — 14/14, 0 errors** |
| Repo typecheck (`pnpm typecheck`, 14 packages) | **PASS — 14/14, 0 errors** |
| Frontend tests | **PASS — 113 files / 619 tests** (baseline 109 / 526) |
| `@gmrlog/ui` tests | **PASS — 4 files / 21 tests** (baseline 20) |
| `@gmrlog/database` tests | PASS — 6 files / 97 tests |
| `@gmrlog/api-sdk` tests | PASS — 2 files / 5 tests |
| Backend tests | 145/146 files · 1246/1249 tests. **3 environmental failures — see §1.1** |
| Backend source changed | **None.** Feature freeze honoured; `git status apps/backend` is empty. |
| Prisma migrations added | **None.** |
| API contract changes | **None.** Every new surface maps to a route that already existed. |

**+93 frontend tests, +1 UI test. Zero new lint errors against a zero baseline.**

### 1.1 The three backend failures are environmental, not regressions

All three are in `apps/backend/src/integrations/integrations.controller.spec.ts` and all fail
identically:

```
Error: Connection is closed.
  at EventEmitter.connectionCloseHandler (node_modules/ioredis/built/Redis.js:220:28)
Error: Test timed out in 5000ms.
```

They require a live Redis. Redis is not running in this environment. D3.26 recorded the same
suite at 146/146 with infrastructure up. **No backend file was modified in this sprint** —
`git status --porcelain apps/backend` returns nothing — so these cannot be attributable to
D3.28. They will pass again under `pnpm docker:up`.

---

## 2. Screens changed

| Screen | What changed |
|---|---|
| **Discover hub** | Rebuilt from a vertical link menu into 10 artwork rails over one virtualized list |
| **Discover games/communities/events/collections** (7 screens) | Poster grid replaces the 64px thumbnail row; all four list wrappers collapsed into `EntityList` |
| **Search** | Entity facet tabs, trending terms, grouped instant suggestions, keyboard-aware lists |
| **Notifications** | `SectionList` grouped by Today / Yesterday / This week / Earlier |
| **Review detail** | **Placeholder → real page.** Rich prose, spoiler gate, action bar, threading, share, copy link, author card, reading time, related reviews |
| **Public profile** | **Placeholder → real page.** Identity, stats, archetypes, insights, achievements, relationship, similar players |
| **Game Hub** | Reconstructed composition root (§3) |
| **Collections index** | Cover mosaics, grid/list toggle, sorting |
| **Collection detail** | Hero artwork, statistics, entry sorting |
| **Home · Friends · Messages · Tier lists · Bookmarks · Communities · Events · Settings ×10 · Composers** | Header chrome migrated to `ScreenHeader`; empty states rebuilt |

### 2.1 The Game Hub reconstruction

`apps/frontend/features/content/screens/game-hub-screen.tsx` was destroyed mid-sprint by a
`git checkout` against an index that predated D3.27 (the repository had **no commit history** —
see §7). Its components, hooks, models and specs survived only because they were untracked.

It was rebuilt from those survivors, not simplified. Verified against D3.27 §"Phase 1 — Game Hub"
line by line:

| D3.27 requirement | Present |
|---|---|
| `GET /games/:id` · `/media` · `/similar` wired | ✅ `useGameDetail` · `useGameMedia` · `useGameRelated` · `useSimilarGames` |
| Hero artwork with documented fallback chain | ✅ `GameHero` → `resolveHeroArtwork` |
| Gradient scrim | ✅ `GradientScrim` inside `GameHero` |
| Overlapping cover | ✅ `GameHero`, now via `GmrImage` (BlurHash) |
| Identity block (title · year · critic · community 1–10 · library · platforms · genres · studios) | ✅ `GameHero` + `ScoreRow` + `ChipRow` |
| Attribution | ✅ `GameOverviewTab` → `formatAttribution` |
| 7 tabs in order: Overview · Reviews · Activity · Screenshots · Videos · Collections · Recommendations | ✅ `buildGameHubTabs` over `GAME_HUB_TAB_ORDER` |
| Rendered over **one** virtualized `FlatList` | ✅ single list; hero + `SegmentedTabs` as `ListHeaderComponent` |
| `app/(app)/game/[id]/*` sub-routes retained | ✅ all 10 intact; every D3.16 deep link still resolves |
| Floating back button | ✅ now the shared `HeroBackButton` primitive |
| `memo` on cards, `useMemo` on models, tuned virtualization, tiered image priority, `AspectBox` | ✅ |

Two things are *better* than the original: the floating back button is now a design-system
primitive instead of a hand-rolled circle, and its glyph uses the new `color.scrim.foreground`
token rather than the hardcoded `#FFFFFF` the original carried (§4.2).

---

## 3. Components added

**Design system (`@gmrlog/ui`) — 3 new, 3 extended:**

| Primitive | Purpose |
|---|---|
| `EntityList` | The one virtualized list. Scroll physics, refresh tint, pagination threshold, footer, and list semantics defined once |
| `HeroBackButton` | Scrim-backed back control for screens opening on full-bleed artwork |
| `HIDDEN_FROM_ASSISTIVE_TECH` | The three-flag spread that actually removes decoration from the a11y tree on both platforms |
| `NavHeader` *(extended)* | Gained `topInset`, `subtitle`, `titleRole`, chevron back, `accessibilityRole="header"` |
| `EmptyState` *(extended)* | Gained `icon`, `secondaryAction`, `fill` — absorbing the medallion layout that 14 features had each rebuilt |
| `Icon` *(extended)* | Gained `decorative` |

**Frontend — 18 new files:**

`src/navigation/screen-header.tsx` · `discover/hooks/discover-sections-model.ts` ·
`discover/hooks/use-discover-rails.ts` · `discover/components/game-poster-card.tsx` ·
`search/hooks/search-facets-model.ts` · `search/hooks/use-trending-searches.ts` ·
`search/components/trending-searches.tsx` · `search/components/search-suggestions.tsx` ·
`notifications/components/notification-section-header.tsx` ·
`content/hooks/review-detail-model.ts` · `content/hooks/use-review-comments.ts` ·
`content/screens/review-detail-screen.tsx` · `content/components/review/` (4 components) ·
`profile/hooks/use-public-profile.ts` · `profile/screens/public-profile-screen.tsx` ·
`collections/hooks/collection-view-model.ts` · `collections/components/collection-toolbar.tsx`
· 5 new spec files.

## 4. Components removed

| File | Why |
|---|---|
| `search/components/detail-placeholder-screen.tsx` | Both consumers became real screens. **No placeholder UI remains in the app.** |
| `discover/components/discover-module-card.tsx` | The link-menu tile the rail rebuild replaced; zero consumers |
| `discover/components/community-card.tsx` *(body)* | Was an independently written, degraded duplicate (F11). Now a one-line re-export of the communities original |
| `discover/components/discover-skeleton.tsx` → `DiscoverHeader` | Hand-rolled header; deleted in favour of `ScreenHeader` |

---

## 5. Reused UI primitives — no new duplication

Every new surface composes existing primitives. Nothing in this sprint re-implements a card,
a list, a header, or an empty state.

- `Rail` — was used by 6 Profile/Game Hub files and **zero** Discover files; Discover's ten shelves now use it
- `SegmentedTabs` — now also Search facets and the Game Hub tab strip
- `EntityList` — Discover ×4, Collections
- `EmptyState` — 15 feature empty states, all on the primitive
- `AspectBox` · `GradientScrim` · `StatTile` · `Skeleton` · `Chip` · `Badge` · `ListItem` · `Avatar` · `IconButton` · `Icon` · `Divider` · `TextField` · `Button`
- `ProfileStatsGrid` · `GamingInsights` · `AchievementShowcase` · `ArchetypeSection` — D3.27 components reused verbatim by the new public profile
- `pressableMotionStyle` + `useReduceMotion` — every new pressable

### 5.1 Header consolidation (audit F1)

`NavHeader` shipped in D3.1 and had **zero consumers**; 28 files hand-rolled the bar. The
reason was structural, not neglect: `@gmrlog/ui` takes no safe-area peer dependency, so
`NavHeader` could not consume `insets.top` and every screen had to rebuild it. `topInset` +
the app-layer `ScreenHeader` adapter closed that gap.

| | Before | After |
|---|---|---|
| Screens using the shared header | 0 | **23** |
| Files hand-rolling `paddingTop: insets.top` | 28 | **7** |

The 7 remaining are not header bars and correctly do not use one: two auth screens
(keyboard-avoiding content padding), `profile-screen` and two hero headers (artwork that
bleeds under the status bar), `game-picker` (a sheet with an inline search field), and
`search-bar` (a search field, not a title bar).

---

## 6. Accessibility

| Item | Before | After |
|---|---|---|
| Decorative elements hidden from AT | **0 uses app-wide** | 20 files |
| Decorative medallions announcing "…illustration placeholder" | 14 | **0** |
| Section/empty-state titles as `accessibilityRole="header"` | ad hoc | every one |
| Back controls | text "Back" vs chevron, inconsistent | one `IconButton` chevron, 48pt, labelled |
| Keyboard on search results | keyboard swallowed taps | `keyboardShouldPersistTaps="handled"` + `keyboardDismissMode="on-drag"` |
| Reduce Motion | honoured | honoured on all new pressables |
| Contrast on scrims | `#FFFFFF` hardcoded to dodge a token bug | `color.scrim.foreground`, test-enforced |

**The dark-mode contrast bug found and fixed.** `color.scrim.strong` is dark in *both* schemes,
but `color.text.inverse` flips — so a glyph over a scrim rendered near-black on near-black in
dark mode. The original Game Hub back button avoided this with a hardcoded `#FFFFFF` (audit
F13): the right instinct, the wrong tool. D3.28 adds `color.scrim.foreground`, constant across
schemes, and `palettes.spec.ts` asserts the invariant so a future "fix" cannot silently
reintroduce it.

## 7. Performance

| Item | State |
|---|---|
| Virtualization | Every list virtualized. Discover rails tuned down (`initialNumToRender: 2`) because each rail is 12 images |
| Parallel reads | Discover's 7 reads and the profile's 6 issue in one `useQueries` round, not a waterfall |
| Partial failure | A failing rail costs that shelf, not the screen — `error` only when *every* read fails |
| Image priority | Tiered: first rail eager, everything else `low` |
| Layout shift | `AspectBox` reserves artwork height before measure on every new card |
| BlurHash reach | 1 component → 4, including the Game Hub cover |
| Memoization | `memo` on every new card/section; `useMemo` on every derived model |
| Request discipline | Search facets filter loaded pages client-side — switching tabs issues no request |

---

## 8. Deferred, with reasons

Three brief items are **not** shipped. Each is a real constraint, not an omission:

1. **Collection sorting by Rating and Release Date.** `CollectionEntryResponse` is
   `{ gameId, position, note, game }` and `LibraryGameSummary` is `{ id, title, slug, coverUrl }` —
   neither rating nor release date exists in the payload. Delivering these needs a wider entry
   DTO (backend, frozen) or an N-request fan-out to `GET /games/:id` per entry, which on a
   200-game shelf is a request storm. Newest / Oldest / Alphabetical ship and are real;
   controls that would silently do nothing were not added. Documented in
   `collection-view-model.ts`.

2. **"Trending searches" are trending *games*.** There is no query-frequency endpoint. Rather
   than fabricate one, the section is sourced from `GET /discover/trending` and labelled
   **"Trending on GMRLOG"** — the claim matches the data.

3. **Voice search is architecture only.** `SearchQuerySource` threads provenance
   (`typed | recent | trending | suggestion | voice`) through a single `submitQuery` seam, so a
   speech entry point is a new call site rather than a refactor. No speech recognition ships;
   that needs a native module and a permissions flow beyond a frontend sprint.

**Four Discover rails are client-side projections, not server rankings** — Highest Rated,
Upcoming Releases, Recently Released, Indie Spotlight. No endpoint serves them and the backend
is frozen, so they are derived from one fetched page of `GET /discover/games`. Their subtitles
say so in the UI ("Best reviewed in the current catalog page"), and `isProjection` marks them in
the model. This follows the precedent D3.27 set with `derivePlayerLevel`: derive honestly, and
say that you derived.

## 9. Known issues

| Issue | Severity | Note |
|---|---|---|
| 3 backend integration tests need Redis | None for D3.28 | Environmental; no backend file was touched (§1.1) |
| `@shopify/flash-list` still an unused dependency | Low | Audit F12. Every list is a tuned `FlatList`; adopting or dropping it is a perf sprint decision, not a polish one |
| `useDiscoverHub` / `hubHrefToRoute` now unused by any screen | Low | Tested wrappers around the live `GET /discover` registry; kept rather than deleted |
| Drag-reordering remains in the entries editor only | Low | Unchanged from D3.27; the detail surface offers explicit sort instead |
| No on-device verification | Medium | Every gate is static (lint/type/test). Rails, mosaics, and the spoiler gate have not been seen on a physical device |

---

## 10. Toolchain fixes required to commit

The repository had **no commit history** — `HEAD` on an unborn branch, 1877 files staged and
never committed, with the index stale against the working tree. That is what made a routine
`git checkout <path>` destructive (§2.1). Creating the baseline commit surfaced three gate
defects, all cases where root-level `lint-staged` and the per-package `lint` scripts disagreed
about the same file:

- **`tooling/eslint-config/base.js`** — `.mjs`/`.js` under `scripts/` and `tooling/` sits outside
  every tsconfig, so `projectService: true` could not parse it. Now linted with type-aware rules
  off, Node globals declared, CommonJS `require` permitted: **190 phantom errors cleared, 17 real
  ones found and fixed**, none hidden behind an ignore.
- **`testing/**` override** moved from `apps/backend/eslint.config.mjs` into the shared base —
  package-local, it applied to `pnpm lint` but not to the root-run hook.
- **`.husky/pre-commit`** — lint-staged fans out in parallel and was OOM-killed on 1877 files.
  Now serial with a raised heap.

---

*D3.28 complete. Every production screen has loading, error, and empty states; no placeholder UI
remains; the design system is the single source of truth for headers, lists, and empty states.*
