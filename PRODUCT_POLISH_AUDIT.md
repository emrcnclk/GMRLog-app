# GMRLOG — Product Polish Audit (D3.28 · Phase 0)

**Document:** `PRODUCT_POLISH_AUDIT.md`
**Sprint:** D3.28 — Experience, Discover & Production Polish
**Date:** 2026-08-01
**Status:** Phase 0 complete — baseline recorded, implementation authorised
**Authority:** [`NORTH_STAR.md`](docs/00_PROJECT/NORTH_STAR.md) · [`SPRINT_0_PROJECT_AUDIT.md`](docs/00_PROJECT/SPRINT_0_PROJECT_AUDIT.md) · [`D3_27_COMPLETION_REPORT.md`](docs/05_FRONTEND/D3_27_COMPLETION_REPORT.md) · [`D3_26_COMPLETION_REPORT.md`](docs/18_CATALOG/D3_26_COMPLETION_REPORT.md) · [`D3_25_COMPLETION_REPORT.md`](docs/18_CATALOG/D3_25_COMPLETION_REPORT.md) · `docs/03_UX/**` · `docs/04_UI/**`

---

## 0. How to read this document

This is an audit, not a plan. Every claim below is a statement about code that exists
today at `main`, and every one of them was verified by reading the file or running the
listed command. Where a claim is a judgement rather than a fact, it is marked
**(judgement)**.

The sprint brief asks for "every screen should feel intentional." The honest summary of
this codebase is that **the engineering is in far better shape than the experience**. The
design system is real, the state machines are complete, the tests pass, and the token
discipline is close to perfect. What is missing is that several of the best pieces of
that system were built and then never adopted, and two production routes are still
literal placeholders.

---

## 1. Verified baseline (pre-implementation)

Run at `main`, 2026-08-01, before any D3.28 code change:

| Gate                 | Command                                        | Result                                               |
| -------------------- | ---------------------------------------------- | ---------------------------------------------------- |
| Frontend lint        | `pnpm --filter @gmrlog/frontend run lint`      | **PASS — 0 errors, 0 warnings** (`--max-warnings 0`) |
| Frontend typecheck   | `pnpm --filter @gmrlog/frontend run typecheck` | **PASS — 0 errors**                                  |
| UI package typecheck | `pnpm --filter @gmrlog/ui run typecheck`       | **PASS — 0 errors**                                  |
| Frontend tests       | `pnpm --filter @gmrlog/frontend run test`      | **PASS — 109 files / 526 tests**                     |

> Note: `D3_26_COMPLETION_REPORT.md` §6 recorded "14 pre-existing frontend lint errors."
> Those are gone — lint is clean at `main`. The D3.28 gate is therefore **zero regression
> from zero**, not "no new errors on top of 14."

**Surface size:** 297 `.tsx` files across `app/`, `features/`, `shared/`; 74 route files;
21 feature modules; 40 `@gmrlog/ui` primitives.

---

## 2. Headline findings

Ordered by how much each one costs the product, not by how hard it is to fix.

### F1 — `NavHeader` was built, exported, and never used by a single screen

`packages/ui/src/components/nav-header.tsx` is exported from `@gmrlog/ui`.

```
$ grep -rln "NavHeader" apps/frontend/features apps/frontend/app
(no matches)
```

Instead, **28 files hand-roll the same header**: a `View` with `paddingTop: insets.top`,
a `borderBottomWidth: 1`, a back affordance, a title, and an optional trailing action.

<details><summary>All 28 files (verified)</summary>

`features/auth/login-screen.tsx` · `features/auth/register-screen.tsx` ·
`features/boards/shared/game-picker.tsx` · `features/bookmarks/screens/bookmarks-screen.tsx` ·
`features/collections/components/collection-header.tsx` ·
`features/collections/screens/collections-screen.tsx` ·
`features/communities/components/community-header.tsx` ·
`features/communities/screens/communities-screen.tsx` ·
`features/communities/screens/community-members-screen.tsx` ·
`features/content/components/composer-header.tsx` ·
`features/content/components/game-hub-tab-shell.tsx` ·
`features/content/screens/game-hub-screen.tsx` ·
`features/content/screens/game-posts-screen.tsx` ·
`features/content/screens/game-reviews-screen.tsx` ·
`features/content/screens/post-detail-screen.tsx` ·
`features/discover/components/discover-skeleton.tsx` ·
`features/events/components/event-header.tsx` ·
`features/friends/screens/friends-screen.tsx` ·
`features/home/components/home-header.tsx` ·
`features/messages/components/conversation-header.tsx` ·
`features/messages/screens/conversations-screen.tsx` ·
`features/messages/screens/new-conversation-screen.tsx` ·
`features/notifications/components/notification-header.tsx` ·
`features/profile/profile-screen.tsx` · `features/search/components/search-bar.tsx` ·
`features/settings/components/settings-screen-chrome.tsx` ·
`features/tier-lists/components/tier-list-header.tsx` ·
`features/tier-lists/screens/tier-lists-screen.tsx`

</details>

**Consequences.** The back affordance is inconsistent: `collections-screen.tsx` renders a
text button reading "Back"; other screens render a chevron `IconButton`. Header heights
drift between `space.12` (48) and content-derived heights. Every future header change is a
28-file edit.

**This is the single largest design-consistency defect in the app** and it is exactly what
Phase 11 exists to fix.

---

### F2 — BlurHash shipped in D3.26 and reaches one component

D3.26 built the whole pipeline: Sharp → 3 WebP variants → BlurHash → `ResponsiveImage`
DTO → `GmrImage`. The frontend consumer of that work is:

```
$ grep -rln "GmrImage" apps/frontend --include=*.tsx
apps/frontend/features/discover/components/game-card.tsx
apps/frontend/src/assets/gmr-image.tsx
```

**One** feature component. Meanwhile nine components still render artwork through
`CachedImage`, which has no BlurHash placeholder and no variant selection:

`features/communities/components/community-card.tsx` ·
`features/content/components/game-hub/game-hero.tsx` ·
`features/content/components/game-hub/game-media-grid.tsx` ·
`features/content/components/game-hub/game-overview-tab.tsx` ·
`features/content/components/game-hub/game-recommendations-tab.tsx` ·
`features/profile/components/library-section.tsx` ·
`features/profile/components/premium/game-shelves.tsx` ·
`features/profile/components/premium/profile-hero.tsx` ·
`features/profile/components/premium/profile-overview.tsx`

Phase 7 says "BlurHash everywhere." Today it is BlurHash almost nowhere — including the
Game Hub hero, which is the largest image in the product.

---

### F3 — Two production routes are placeholders

This violates the sprint's own hard rule _"No placeholder UI."_

| Route          | File                              | Renders                                                |
| -------------- | --------------------------------- | ------------------------------------------------------ |
| Review detail  | `app/(app)/review/[id]/index.tsx` | `DetailPlaceholderScreen entityLabel="Review Details"` |
| Public profile | `app/(app)/user/[id].tsx`         | `DetailPlaceholderScreen entityLabel="User Profile"`   |

`DetailPlaceholderScreen` renders the literal copy _"Detail view placeholder. Full review
details experience arrives later."_ plus the raw entity id.

**These are not dead ends — they are reachable from four directions each:**
`hrefForNotificationObject()` routes `review` and `user` object refs straight to them
(`notification-model.ts`), `routeForSearchHit()` routes review and user hits to them, the
Game Hub reviews tab links to review detail, and the home feed links to both.

So the two most-linked-to detail surfaces in the social graph are stubs. The backend has
served `GET /reviews/{id}`, `GET /reviews/{id}/comments`, `GET /users/{id}/hero`,
`GET /users/{id}/statistics`, and `GET /users/{id}/relationship` since D3.21–D3.24. As in
D3.27's finding about the Game Hub, **the data is already there and simply unreachable
from the client.**

---

### F4 — Discover is a menu of links, not a discovery surface

`features/discover/discover-hub-screen.tsx` renders one line of body copy and a vertical
stack of `DiscoverModuleCard`s — a table of contents. Tapping one pushes to a separate
full-screen list.

The brief asks for ten sections. Current state:

| Brief section       | Endpoint that can serve it                                 | Exists in app today        |
| ------------------- | ---------------------------------------------------------- | -------------------------- |
| Trending            | `GET /discover/trending?window=`                           | Yes — as a separate screen |
| Popular This Week   | `GET /discover/popular`                                    | Yes — as a separate screen |
| Highest Rated       | derivable from `GET /discover/games` (`ratingSummary`)     | **No**                     |
| Upcoming Releases   | derivable from `GET /discover/games` (`releaseDate`)       | **No**                     |
| Recently Released   | derivable from `GET /discover/games` (`releaseDate`)       | **No**                     |
| Recommended For You | `GET /discover/recommended`                                | Yes — as a separate screen |
| Friends Are Playing | `GET /feed` (`ActivityKind` `game_log`/`playtime_updated`) | **No**                     |
| Hidden Gems         | `GET /discover/hidden-gems`                                | Yes — as a separate screen |
| Indie Spotlight     | derivable from `GET /discover/games` (`genres`)            | **No**                     |
| Continue Playing    | `GET /library/entries?status=playing`                      | **No**                     |

Six of ten missing, and the four that exist are one tap away rather than on the surface.

**Backend-freeze note.** Four of the six missing sections have no dedicated endpoint. They
are derivable client-side from `GameCardResponse`, which since D3.25 carries `releaseDate`,
`genres`, `ratingSummary`, and `libraryCount`. Any such section must be labelled honestly
in code and in the completion report as a **client-side projection over a fetched page**,
not a server ranking — the same discipline D3.27 applied to `derivePlayerLevel`.

---

### F5 — Discover's game card is a 64-pixel thumbnail row

`features/discover/components/game-card.tsx` sets `coverSize = theme.space('space.16')`,
which `palettes.ts` defines as **64**. The card is a 64×64 cover, a two-line title, a genre
line, and a rating line, separated by hairline borders.

The brief asks for "Large artwork. Premium cards." A 64px cover on a 390pt-wide phone is a
settings-row thumbnail. **(judgement)** This is the difference between Discover reading as
a database browser and reading as Steam.

Related: `Rail` — the horizontal shelf primitive built in D3.27 precisely for this — has
six consumers, all in Profile and Game Hub. **Discover uses it zero times.**

---

### F6 — Four near-identical list wrappers in one file

`features/discover/components/discover-lists.tsx` (219 lines) defines `GameCardList`,
`CommunityCardList`, `EventCardList`, and `CollectionCardList`. Each is ~50 lines. They
differ only in the item type, the card component, and the press handler. The
`FlatList` props — `onEndReachedThreshold={0.4}`, the `RefreshControl` tint pair, the
`ListFooterComponent` skeleton-or-spacer ternary, `windowSize={9}`,
`maxToRenderPerBatch={12}`, `initialNumToRender={10}`, `removeClippedSubviews`,
`accessibilityRole="list"` — are byte-identical across all four.

The same prop block is copy-pasted again in `notifications-screen.tsx` and
`collections-screen.tsx` with `initialNumToRender` drifting to 12 and 10 respectively.

---

### F7 — The empty-state medallion is duplicated 14 times, and it is an accessibility bug

There are 19 `empty-*.tsx` components. Four are one-line re-export shims (good). The rest
each re-implement the identical layout:

```tsx
<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.6 }}>
  <View
    accessibilityLabel="Discover illustration placeholder"   // ← see below
    style={{ width: space.16, height: space.16, borderRadius: radius.full,
             backgroundColor: surface.secondary, alignItems: 'center', justifyContent: 'center' }}
  >
    <Compass size={36} color={text.secondary} strokeWidth={1.5} />
  </View>
  <EmptyState title={...} description={...} />
</View>
```

Two defects fall out of this:

1. **Drift.** Some use `flex: 1`, others `flexGrow: 1`. Some space the medallion with
   `marginBottom: space.4`, others with a parent `gap: space.4`. `size={36}` is a raw
   number in all 14 — the only place in `features/` where an icon size bypasses the scale.

2. **Accessibility defect (real, user-facing).** Fourteen decorative medallions carry an
   `accessibilityLabel`, which makes them _focusable, announced_ elements. VoiceOver and
   TalkBack read the string aloud. Nine of the fourteen labels end in the word
   **"placeholder"** — so a blind user on the home feed hears _"Discover illustration
   placeholder"_ before hearing the actual empty-state message. A decorative view must be
   `accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"`, not
   labelled.

   ```
   $ grep -rn 'accessibilityLabel=".*illustration' apps/frontend/features --include=*.tsx | wc -l
   14
   $ grep -rn "accessible={false}|importantForAccessibility" apps/frontend/features --include=*.tsx | wc -l
   0
   ```

   **`importantForAccessibility` and `accessibilityElementsHidden` appear zero times in the
   entire feature layer.** No decorative element anywhere in the app is hidden from
   assistive technology.

The `EmptyState` primitive itself supports only `title`, `description`, `action` — it has
no `icon` and no secondary action, which is _why_ every feature re-wraps it.

---

### F8 — Search returns one undifferentiated list

`features/search/search-screen.tsx` renders a single `SearchResultsList` under one
"Results" header. `SearchHit` is a ten-member discriminated union (`game`, `user`,
`review`, `post`, `collection`, `tier-list`, `community`, `event`, `achievement`, `tag`)
and all ten are flattened into one stream.

Missing against the brief: entity grouping/filtering, trending searches, instant
suggestions, keyboard navigation. Present and working: debounce, recent searches with
remove/clear-all, cursor pagination, offline-aware error state, empty state.

`SearchGameHitSummary` already carries `coverImageUrl`, `summary`, and `genres` (D3.25
enrichment) — the search result card renders none of them.

---

### F9 — Notifications are not grouped

`notifications-screen.tsx` renders one flat `FlatList`. The brief asks for Today /
Yesterday / This Week. `SectionList` appears **zero times** in the codebase.

Everything else in this screen is in good shape and should be preserved: `useMarkNotificationRead`
and `useMarkAllNotificationsRead` both implement full optimistic updates with
`cancelQueries` → snapshot → `setQueryData` → rollback `onError`, routed through the
offline durable queue. `resolveNotificationMessage` covers 16 message keys and
`NotificationIcon` maps 12 kinds to distinct icons. **Phase 3 is grouping and presentation
only — the data layer is already correct.**

---

### F10 — Collections render a grey box where the cover art is

`CollectionResponse` carries `coverUrl`, `bannerUrl`, and `color`. `collection-card.tsx`
renders a `View` with `accessibilityLabel="Cover placeholder"` — a literal grey rectangle —
and ignores all three fields.

Also missing against Phase 5: grid/list toggle, any sorting control (Newest / Oldest /
Alphabetical / Rating / Release Date), collection statistics. Drag ordering exists in the
entries editor (`collection-entries-screen.tsx`) but not on the detail surface.

---

### F11 — One genuine duplicated card

Most apparent card duplication is benign — `profile/collection-card.tsx`,
`profile/review-card.tsx`, `profile/tier-list-card.tsx`, `profile/empty-collections.tsx`,
and `discover/event-card.tsx` are all **one-line re-export shims**, which is the correct
pattern.

The exception: `features/discover/components/community-card.tsx` is an independently
written, _worse_ copy of `features/communities/components/community-card.tsx`. The
discover version lacks the joined-state `Badge`, the `CachedImage` avatar, and
`pressableMotionStyle` press feedback that the communities version has. Same entity, two
renderings, one of them degraded.

---

### F12 — `FlashList` is a dependency with zero imports

`@shopify/flash-list@^2.3.2` is declared in `apps/frontend/package.json`.

```
$ grep -rn "FlashList" apps/frontend/features apps/frontend/app apps/frontend/src
(no matches)
```

Every list in the app is a `FlatList`. This is dead weight in the bundle and a Phase 9
bundle-audit finding. Either adopt it for the heavy artwork grids or drop the dependency —
**(judgement)** shipping an unused list library is worse than either.

---

### F13 — Minor token escapes

| Issue                                                                         | Location                                                                                                                |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Hardcoded `#FFFFFF`                                                           | `features/content/screens/game-hub-screen.tsx:332` — the only hardcoded hex in `features/`                              |
| `<Screen style={{ paddingTop: 0, paddingBottom: 0 }}>` repeated **30+ times** | Every screen with a custom in-body header. The idiom is copy-pasted because `Screen` has no "custom header" affordance. |
| Raw `size={36}` on empty-state icons                                          | 14 files (see F7)                                                                                                       |

Otherwise **token discipline is excellent**: zero hardcoded `fontSize` anywhere in
`features/`, and spacing/radius/colour all go through `theme.space()` / `theme.radius()` /
`theme.color()`.

---

## 3. Screen-by-screen state matrix

Legend: ✅ present and correct · ⚠️ present but weak · ❌ missing

| Screen                |        Loading         |          Error           |      Empty      | Notes                                                                                        |
| --------------------- | :--------------------: | :----------------------: | :-------------: | -------------------------------------------------------------------------------------------- |
| **Feed** (`home`)     |      ✅ skeleton       | ✅ offline-aware + retry | ✅ CTA→Discover | Strongest screen in the app. `TimelineCard` shared with Profile + Game Hub.                  |
| **Discover hub**      |      ✅ skeleton       |            ✅            |       ✅        | States correct; the _surface_ is the problem (F4, F5).                                       |
| **Discover lists** ×7 |           ✅           |            ✅            |       ✅        | Four duplicate wrappers (F6).                                                                |
| **Search**            |      ✅ skeleton       |            ✅            | ✅ query-aware  | No grouping/trending/suggestions (F8).                                                       |
| **Notifications**     |           ✅           |            ✅            |       ✅        | Optimistic updates already correct. No grouping (F9).                                        |
| **Library**           |           ✅           |            ✅            |       ✅        | Module is a 4-line re-export of Profile components.                                          |
| **Collections**       |           ✅           |            ✅            |    ✅ 2 CTAs    | Grey placeholder covers (F10). Hand-rolled header.                                           |
| **Collection detail** |           ✅           |            ✅            |       ✅        | No stats, no grid/list, no sorting.                                                          |
| **Profile (self)**    |           ✅           |            ✅            |      ✅ ×4      | D3.27 premium work — hero, insights, archetypes, achievements, shelves. Best-looking screen. |
| **Profile (public)**  |           ❌           |            ❌            |       ❌        | **Placeholder (F3).**                                                                        |
| **Game Hub**          |           ✅           |            ✅            |      ✅ ×2      | D3.27. Uses `CachedImage` not `GmrImage` for the hero (F2). One hardcoded hex (F13).         |
| **Review detail**     |           ❌           |            ❌            |       ❌        | **Placeholder (F3).**                                                                        |
| **Review composer**   |           ✅           |            ✅            |       n/a       | Fine.                                                                                        |
| **Communities**       |           ✅           |            ✅            |       ✅        | Duplicate card (F11).                                                                        |
| **Events**            |           ✅           |            ✅            |       ✅        | Fine.                                                                                        |
| **Messages**          |           ✅           |            ✅            |      ✅ ×2      | Fine.                                                                                        |
| **Friends**           |           ✅           |            ✅            |       ✅        | Fine.                                                                                        |
| **Bookmarks**         | ⚠️ `ActivityIndicator` |            ✅            |       ✅        | Raw spinner — Phase 7 target.                                                                |
| **Tier lists**        |           ✅           |            ✅            |       ✅        | Fine.                                                                                        |
| **Settings** ×10      |           ✅           |            ✅            |       n/a       | Consistent via `settings-screen-chrome`.                                                     |
| **Auth**              |           ✅           |            ✅            |       n/a       | Hand-rolled header.                                                                          |

**Spinners remaining (Phase 7):** three `ActivityIndicator` sites —
`features/bookmarks/screens/bookmarks-screen.tsx`,
`features/content/screens/game-timeline-screen.tsx`,
`features/uploads/components/upload-progress-overlay.tsx` (the upload overlay is a
legitimate indeterminate-progress case and should stay). Plus three `<Loading>` sites in
the three `_layout.tsx` files, which are pre-hydration app-boot states — also legitimate.

**Verdict on states:** every production screen except the two placeholders already has all
three states wired through an explicit `status` view-model. This is genuinely good and is
the reason this sprint can be about polish rather than repair.

---

## 4. Accessibility audit

| Area                                         | Status        | Detail                                                                                                                                                                      |
| -------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Screen-reader labels on interactive elements | ✅ Good       | `accessibilityRole` + `accessibilityLabel` are near-universal on `Pressable`.                                                                                               |
| **Decorative elements hidden**               | ❌ **Fails**  | Zero uses of `accessibilityElementsHidden` / `importantForAccessibility` app-wide; 14 decorative medallions are labelled and announced, 9 with the word "placeholder" (F7). |
| Touch targets                                | ✅ Good       | `MIN_TOUCH_TARGET` exported from `@gmrlog/ui/motion`; headers use `space.12` (48) minimums.                                                                                 |
| Reduce Motion                                | ✅ Good       | `useReduceMotion` gates animation; `motion-fallback.spec.ts` covers it.                                                                                                     |
| Contrast                                     | ✅ Good       | `accent.spec.ts` proves all 8 accents × 2 schemes leave every non-accent token byte-identical, so an accent cannot degrade contrast.                                        |
| Dynamic Type                                 | ⚠️ Unverified | Typography goes through `theme.typography()`, but no test asserts layout survives large text. Fixed-height rows (`minHeight: space.16`) are the risk.                       |
| Focus order                                  | ⚠️ Unverified | No explicit `accessibilityViewIsModal` on the bottom sheet / dialog paths.                                                                                                  |
| List semantics                               | ✅ Good       | `accessibilityRole="list"` on every `FlatList`.                                                                                                                             |

---

## 5. Performance baseline

| Signal         | State                                                                                                             |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| Virtualization | All lists `FlatList` with tuned windows. `FlashList` unused (F12).                                                |
| Memoization    | `memo` on all card components; `useMemo` on derived models. Good.                                                 |
| Query layer    | TanStack Query v5 with `queryKeys` factory, cursor `useInfiniteQuery`, AsyncStorage persistence. Good.            |
| Images         | `expo-image` with cache policy; BlurHash reaches 1 of 10 artwork surfaces (F2).                                   |
| Layout shift   | `AspectBox` reserves artwork space — but only on D3.27 surfaces. Discover/Collections/Search cards do not use it. |
| Lazy imports   | None. All routes eagerly bundled.                                                                                 |
| Bundle         | No size budget enforced; `bundle-policy.ts` exists but is advisory.                                               |

---

## 6. What this audit does **not** find

Recording these so the completion report does not claim credit for fixing them:

- No hardcoded typography anywhere in `features/`.
- No missing loading/error/empty state on any non-placeholder screen.
- No broken optimistic updates — notifications, reactions, and bookmarks all snapshot and roll back.
- No god components: the largest feature file is 219 lines.
- No prop drilling past two levels; state is Zustand + Query, cleanly split.
- No `any` escapes and no `@ts-expect-error` in the feature layer.
- Colour is never the only channel — `RarityBadge` always carries the tier word.

---

## 7. Implementation order

Sequenced by dependency, not by brief order. Phase 11 moves first because Phases 1–8 all
consume the primitives it fixes.

| Order | Phase      | Work                                                                                                                                                                                                                                   |
| ----- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **11**     | Adopt `NavHeader` across 28 files; extend `EmptyState` with `icon` + `secondaryAction`; collapse the 4 `*CardList` wrappers into one generic virtualized list; delete `discover/community-card.tsx`; hide decorative elements from AT. |
| 2     | **6**      | Rewrite all 15 empty states on the extended primitive — teach / guide / convert.                                                                                                                                                       |
| 3     | **1**      | Discover as rails: 10 sections, honest client-side projections where no endpoint exists, `Rail` + large-artwork cards + `AspectBox`.                                                                                                   |
| 4     | **2**      | Search: entity grouping via `SegmentedTabs`, trending searches, instant suggestions, keyboard nav.                                                                                                                                     |
| 5     | **3**      | Notifications: `SectionList` day grouping. Preserve the existing optimistic layer.                                                                                                                                                     |
| 6     | **4**      | Review detail — replace placeholder.                                                                                                                                                                                                   |
| 7     | **4b**     | Public profile — replace placeholder.                                                                                                                                                                                                  |
| 8     | **5**      | Collections: real covers, grid/list, sorting, statistics.                                                                                                                                                                              |
| 9     | **7, 8**   | `GmrImage` everywhere; stagger + press/like/follow motion behind `useReduceMotion`.                                                                                                                                                    |
| 10    | **9, 10**  | Perf + a11y sweep; resolve the `FlashList` question.                                                                                                                                                                                   |
| 11    | **12, 13** | Gates + `docs/UX/D3_28_COMPLETION_REPORT.md`.                                                                                                                                                                                          |

---

## 8. Constraints acknowledged

- **Backend is frozen.** No route, DTO, schema, or migration changes. Every new section
  maps to an endpoint that exists today, or is a documented client-side projection.
- **Expo / React Native**, not web. `expo-router` 4 · `react-native` 0.76 ·
  `reanimated` 3.16. Framer Motion does not run here; all motion uses
  `@gmrlog/ui/motion`. (Same correction D3.27 had to make.)
- **No new UI component may be created where a `@gmrlog/ui` primitive can be extended.**
- **Zero TypeScript errors, zero new lint errors** against the clean baseline in §1.

---

_Phase 0 complete. Findings F1–F13 are the D3.28 work list._
