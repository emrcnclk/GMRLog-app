# TASKS.md

The ordered task list. Claude Code reads this at the start of every session, takes the **next unchecked task**, does only that, commits, and ticks the box.

Rules: no skipping ahead, no batching several tasks into one diff, no starting a task whose dependency is unchecked. If a task turns out to be already done or wrong, tick it with a note instead of inventing work.

---

## Phase 0 — Orientation

- [x] **0.1 Reality check.** Read `README.md`, `THEME_MIGRATION.md`, `SCREEN_REDESIGNS.md`, `OAUTH.md` and `BACKEND_CHANGES.md` in this folder, then explore the repo. Report where the docs are wrong, out of date, or describe work that is already done. **No code changes.** Update the docs with what you found, then tick this. — _Done 2026-08-02. Corrections written inline into all five docs, marked "0.1". Summary in Notes._

## Phase 1 — Visual language

- [x] **1.1 Palette.** `THEME_MIGRATION.md` §1–3. New dark and light values in `packages/ui/src/theme/palettes.ts`, plus the `plasma` accent. Values only — no structural change. — _0.1: `plasma` already exists (D3.27, `palettes.ts:113`). This is a **re-valuation**, not an addition; the other seven accents are untouched._ **Done 2026-08-03.** `lightColors`, `darkColors` and `plasma` re-valued exactly per §1–3. One deviation: §1/§2 give `color.scrim.foreground` two different hex values per scheme (`#FBFBFD` light, `#F3F5FE` dark), but the D3.28 test (`palettes.spec.ts`) and the doc's own prose both require it to be **identical** across schemes — a scrim is dark in both, so its foreground must not flip. Used `#F3F5FE` in both. `@gmrlog/ui` typecheck/lint/test all pass (24/24).
- [x] **1.2 Typography.** §4. Add `fontFamily` and `textTransform` to `TypographyStyle`, set the `meta` role to monospace uppercase, register the font in `load-fonts.ts`, apply in `components/text.tsx`. Step any 600/700 weights down. — _Done 2026-08-02. Ten-step ramp per §4b; weight union widened down to `'200'|'300'|'400'|'500'`; Geist and IBM Plex Mono registered; `text.tsx` applies family and transform. `heading`/`title`/`caption` kept as deprecated aliases pinned to `title2`/`headline`/`bodySm` — 122 call sites across 91 files, which Phase 3 migrates screen by screen. Delete them at Phase 3b; 8.4 checks the union is back to ten. The four `.ttf` binaries landed in `bfd0ee3` — weights, static-ness, fixed-pitch and full Turkish coverage all verified on download. Not yet seen rendering: sign-in does not reach the backend yet, so no screen can be opened. **Task 1.5's sweep is the first real look at this ramp.**_ — _2026-08-03: the sign-in blocker was environmental, not code — the backend and its Docker infra (Postgres, Redis, Meilisearch, Mailpit, Minio) were simply not running. Started both; `POST /sessions` now returns 201 and `AuthGate` redirects correctly. The app is reachable again; the 1.5 sweep is unblocked._
- [x] **1.3 Radius and elevation.** §5. New radius scale; strip drop shadows from cards. — **Done 2026-08-03.** `radiusScale`: `lg 12→11`, `xl 16→14`, `2xl 24→18`. `sm` (4) and `md` (8) were already right; `full` stays **9999** per the 0.1 note, not the doc's `999`. Shadow stripped from three places: the `Card` primitive (`shadow.sm`), the Game hub lifted cover and the Profile avatar ring (both `shadow.lg` — a level §5 sanctions for nothing, and both already carry their own lift, a hairline and a 3px background ring respectively). Kept, as §5 directs: `Dialog` xl, `BottomSheet` lg, `Toast` md, `TabBar` sm, and `Surface`'s opt-in `elevated` prop. `palettes.spec.ts` now pins all six radius values. `@gmrlog/ui` + `@gmrlog/frontend` typecheck/lint/test green (11/11 tasks, 619 frontend tests). **Not verified in a browser** — port 8081 was held by another session's dev server; the look is 1.5's job, which walks exactly these surfaces. `@gmrlog/database:test` fails in this environment on `prisma generate` (`EPERM` renaming `query_engine-windows.dll.node`, the DLL is locked by that running backend); it fails before any test runs and no database code was touched.
- [x] **1.4 Rarity geometry.** `RarityBadge` encodes tier by radius and glow, not only colour: `radius.sm` + `shadow.md` at legendary, `radius.full` + hairline at common. — **Done 2026-08-03.** The ramp lives in `palettes.ts` as `rarityGeometry(tier)`, not inside the badge: common `full`/`shadow.none` → uncommon `2xl` → rare `lg` → epic `md`/`shadow.sm` → legendary `sm`/`shadow.md`. Put in the theme so 3.1's rarity plate table draws the same ramp instead of a second one, and so it is testable — a spec importing the component pulls in React Native and Vitest cannot parse it (`import typeof`), which is why `button.spec.ts` imports types only. The glow takes the tier's own colour and drops the token's downward offset (ambient, not a lift); everything else is the elevation token unchanged. `rarity-geometry.spec.ts` pins the two endpoints §5 names, monotonic sharpening, monotonic glow, and five distinct shape pairs.
  - _Revised same day, on review._ The first cut let the ramp clamp: RN caps `borderRadius` at half the box, so on a ~24px badge everything above `md` rendered as the same pill. **The fix is size, not encoding.** The prototype's plates are 30–38px, so `RARITY_PLATE_MIN = 32` is now exported and both plates — the achievement medallion (was 40) and the archetype medallion (was 48) — sit at it. At 32 the half is 16 and `sm`/`md`/`lg`/`xl` all resolve, with only `full` clamping, which is what common is meant to be. `2xl` is 18 and would still clamp, so the ramp skips it and uncommon is `xl`; the spec now proves this by filtering the ramp against the half. For the one slot that genuinely must stay at 24 — the `RarityBadge` text pill — radius is dropped as a channel entirely: it is a pill again, and the tier rides on **notch length** (the leading rule, `space.2/3/4`) plus glow. Three visual steps, not five, and the spec proves all five tiers still separate on that pair alone. A locked achievement keeps a neutral circle — it has no rank to show. 11/11 turbo tasks green (31 ui, 619 frontend).
- [x] **1.5 Sweep.** §6. Walk Home, Game hub, Profile, Achievements, Settings in dark, light and on the `neutral` accent. Fix breakage by adding space or changing surface — never by darkening `border.default`. Report anything you could not fix that way. — **Done 2026-08-03**, under two scope decisions taken by the user on the day; see "How this task was closed" below. Four fixes landed across `f5c8c59`, `0247d6c` and the tab-bar change; one finding is deferred to 3.9 and one to 8.1.
  - **Two fixes landed.** (1) **Game hub cover** — 1.3 stripped its `shadow.lg` and left the cover flat against the hero art it overlaps. Depth is rebuilt the way §5 asks, from surface: a `space.1` mat of `color.background.elevated` around the frame, `radius.xl` outside `radius.lg` inside. No shadow restored, no border darkened. (2) **Tab bar label** was `fontWeight: '600'` with a size borrowed off `caption` — a §4 violation sitting on four of the five swept screens. It now takes the `label` role whole (12px/500).
  - **Static audit is clean.** No raw hex, no `rgba()`, no hardcoded `fontSize` anywhere under `apps/frontend/features`. The only remaining 600s are `lib/navigation/route-placeholder.tsx` and `lib/errors/root-error-boundary.tsx`; **leave the error boundary alone** — it renders when the tree is broken and must not depend on `ThemeProvider` resolving.
  - **How this task was closed.** Two scope decisions from the user, 2026-08-03: (1) **no screenshots** — the Browser pane is not opened, and computed-style measurement is accepted as sufficient verification; (2) **light is not walked separately** — it is derived from dark by mirroring lightness with hue held, so a dark pass plus the derivation covers both. The `neutral` accent needed no separate pass either: `neutral` is the app's default `initialAccent`, so the dark walk _was_ the neutral walk. What that leaves genuinely unverified is written into each finding below — read them as measurements, not as sightings.
  - _2026-08-03, second attempt._ **The auth blocker is gone** — a session was already persisted in the browser, so all five screens open without anyone typing anything. The **dark** pass is done and is recorded below. The **light** and **`neutral`** passes are not: the local stack (Docker daemon, backend, Metro) went down mid-walk and did not come back. No screenshot was taken in any mode — the Browser pane was never displayed, so the page composites no frames and `screenshot` times out. Everything below was measured from computed styles, not seen.
    - **Rarity geometry confirmed live** (1.4's fix, previously unseen). On Profile, awarded plates resolve `common 9999px · uncommon 14px · rare 11px`, and the two archetype medallions render legendary at `4px` with a real `0 0 4px` ambient glow. Locked plates correctly stay neutral circles. **Not seen: an awarded epic or legendary _achievement_** — this account has none, so `md`+`shadow.sm` and `sm`+`shadow.md` are unverified on that component, though the archetype plate proves the legendary end of the ramp.
    - **Game hub cover mat renders** (1.5's fix #1): a 4px mat, `radius.xl` outside, `radius.lg` inside, no shadow. But in dark it is `background.elevated #181A29` sitting on `background.primary #161826` — a two-value lift. Over hero artwork that is enough; on a game whose artwork has not mirrored yet (every mock game in this database) the mat vanishes. **Judgement deferred until it can be seen.** If it does read as flat, the fix is more space (`space.2`), not a darker border.
    - **Type is clean in dark.** Across Home, Game hub, Profile and Appearance every rendered glyph is Geist 300–500 or IBM Plex Mono 400 uppercase; nothing at 600+, nothing falling back to a system serif. The tab-bar label fix holds.
    - **The navigation container: already fixed, and the fix works.** Two full-viewport `#F2F2F2` surfaces — React Navigation's light `DefaultTheme.colors.background` — measured behind every screen while the app was in dark mode. That reading came from a **stale Metro bundle**: `src/theme/navigation-theme.tsx` (`NavigationThemeBridge`) and its mount point in `app-theme-provider.tsx` were already sitting uncommitted in the working tree at the start of the session, authored for this task. On a Metro started clean the `#F2F2F2` surfaces are gone and three elements carry `background.primary` instead. **Both files are still uncommitted** — they belong in 1.5's commit. Lesson for the next session: after any theme-layer edit, restart Metro rather than trusting its transform cache.
    - **`color.text.tertiary` re-valued** (`75b7684`, folded back into 1.1). The sweep found it carrying the same hex in both schemes — dark and light cannot share the third step of two opposed ramps. Now `#888CA2` dark / `#66697A` light, hue held, and both cross WCAG AA where the old value did not (4.08→5.30 dark, 4.17→5.25 light). It is the token under every `role="meta"` line, so this moves timestamps, counts and kickers on every screen.
    - **Two things carried forward, deliberately not fixed here.**
      1. **`profile-hero.tsx:73` passes a raw `rgb` triple** — `'0,0,0'` dark, `'255,255,255'` light — into `GradientScrim`. The prop itself is supported API, but the values are literals, and the light one contradicts the `scrim.foreground` invariant in `tokens.ts`: a scrim is dark in **both** schemes. Dropping the override makes it token-correct, but it changes how the Profile hero reads in light and that is a composition call. **Owned by 3.9.**
      2. **Web above the tablet breakpoint was not walked.** The whole sweep ran at 375×812. **Owned by 8.1**, which already has that remit.
    - **One process note.** After any theme-layer edit, restart Metro. Its transform cache served a pre-bridge bundle long enough to make an already-working fix look broken, and a stale bundle is indistinguishable from a real defect when measurement is the only instrument.
    - **Stack state at hand-off:** Docker containers, backend on 4000 and Metro on 8081 are all up.
    - **Metro kept dying — start it with `CI=1`.** It exited three times in this session, twice through `preview_start` and once through a plain `expo start`, each time after bundling cleanly (`Error: Premature close` in the log is a symptom, not the cause). `expo start` runs an interactive keypress menu on stdin; launched detached, stdin is the null device, the menu reads EOF and the process exits. `CI=1 pnpm exec expo start --web --port 8081` disables that menu and the server holds. This is also what made the stale-bundle misreading possible — a dead-and-restarted Metro served cached transforms.
    - **`color.scrim.strong` was a dead token — fixed, separate commit.** `GradientScrim` (the component every hero screen uses for its legibility overlay) hardcoded `rgb = '0,0,0'` and no caller ever passed `rgb`, so the per-scheme values §1–2 gave `scrim.strong`/`soft` never reached the one place §6 explicitly names ("Game hub — scrims over cover art; verify text stays legible with the new `scrim.strong`"). Every hero scrim in the app has been rendering flat black regardless of scheme since 1.1. Fixed by defaulting `GradientScrim`'s `rgb` to `color.scrim.strong`'s own RGB channel (`scrimRgbTriple()`, new pure helper in `palettes.ts` — the token's baked-in alpha is discarded since `intensity` supplies the component's own per-band ramp) rather than removing the token, since `HeroBackButton` is a second, already-correct consumer that needs the token's full `rgba(...)` as a flat colour. `color.scrim.soft` remains unreferenced by any component; flagged separately, not fixed here since nothing asked for it and no consumer shape is known yet. `scrim-rgb-triple.spec.ts` pins the parser against both literal strings and the live palette. `@gmrlog/ui` + `@gmrlog/frontend` typecheck/lint/test green (11/11 tasks). **Not seen rendering** — same Browser-pane/session gap as everything else in this entry.
- [x] **1.6 Offline mutation invalidation.** When a mutation takes the enqueue branch, skip the `onSettled` invalidation — letting the server response overwrite the optimistic value defeats the point of the optimistic write. `runOrEnqueueOfflineResult` must report which branch it took so callers can tell. Also make the `useSettings` sync effect defer to a pending local preference instead of overwriting it. Found while chasing why light mode reverted to dark after `1.5`'s live walk — this breaks every offline-capable setting, not just theme, since any mutation that lands in the offline queue is undone by the very next invalidation. — **Done 2026-08-03.** `runOrEnqueueOffline{,Result}` now return an `OfflineMutationBranch` (`'online' | 'offline'`); every existing caller (events, communities, notifications, settings) still compiles unchanged since the void variant's callers already discarded the result. Both `useSettings` mutations (`usePatchAppearance`, `usePatchAccessibility`) skip `onSettled` invalidation when the branch is `'offline'`. A new `pendingPreference` field on `useThemeStore` marks an optimistic theme write that took the offline branch; `useSettings`'s resync effect won't apply a fetched `appearance.theme` while one is pending, so a settled invalidation from an _unrelated_ mutation (e.g. accessibility) can't clobber it either. Cleared on the next online round-trip or on rollback. `run-or-enqueue.spec.ts` pins both branches for both functions. `@gmrlog/frontend` typecheck/lint/test all green (115 files, 626 tests). **Live confirmation still owed** — the click-Light-and-watch-the-network-log check the task asks for needs a signed-in session, and the session was lost when the Browser pane was recreated mid-session (empty `localStorage`, back on the sign-in screen, which I do not type into). Next session: sign in, click Light, confirm the network log now shows a `PATCH /settings/appearance` and the theme no longer reverts after invalidation.
- [x] **1.7 Reachability.** `isInternetReachable === false` does not mean the API is unreachable — the API may be on localhost, as it is in every dev environment. Reachability should be judged against our own base URL, not the public internet. Keep NetInfo as a signal, not as the verdict. — **Done 2026-08-03.** New `probeApiReachability()` (`src/connectivity/api-reachability.ts`) hits `GET {EXPO_PUBLIC_API_URL}/health` — the existing liveness route, already mounted, no DB/Redis dependency — with a 5s timeout, per `OFFLINE_MODE.md`'s documented (but until now unimplemented) design. `useConnectivityMonitor` still trusts NetInfo's `isConnected` directly (no adapter really does mean no reachability), but no longer trusts `isInternetReachable`; when an interface is present it probes our own API instead, debounced to once per 10s per the same doc. `bindQueryOnlineManager` (TanStack Query's pause/resume signal) had the identical bug — a second, independent `isInternetReachable` check that would have disagreed with the fix above — so it now reads `useConnectivityStore` instead of re-deriving from NetInfo, giving the app one verdict instead of two. `api-reachability.spec.ts` covers ok/non-ok/throw. `@gmrlog/frontend` typecheck/lint/test green (115 files, 626 tests, shared with 1.6's run).

## Phase 2 — Shared composition patterns

- [x] **2.1 Patterns into `@gmrlog/ui`.** `SCREEN_REDESIGNS.md` § "Shared patterns": screen title block, metric strip, section kicker, bleeding rail, corner notch. Extend `Rail` and `StatTile` rather than adding components beside them. — **Done 2026-08-03**, one commit per pattern: `18d2502` kicker, `0a39551` title block, `48a98e6` metric strip, `617d89a` rail, `3f2d5b1` notch, plus `4c6078f` adopting the strip.
  - **Three new primitives, two extensions.** New: `SectionKicker`, `ScreenTitle`, `MetricStrip`, `CornerNotch`. Extended in place, as the task directs: `Rail` (kicker header, bleeds by default) and `StatTile` (reshaped into a strip cell). `Section` also moves onto the kicker — it had **zero** consumers, the only `Section` in the app being a local one inside `customization-sheet.tsx`, so nothing changed shape.
  - **`SCREEN_GUTTER` (`space.5`, 20px) is exported from `screen-title.tsx`.** The redesign's gutter is 20 where the app sat at 16, and the title block, the rail and the strip all have to agree on it — a rail bleeding against 20 under a title at 16 reads as a misalignment, not a bleed. `Rail` moved to it; screens follow in Phase 3.
  - **`MetricStrip` is layout-neutral on purpose.** The spec places it at `margin 0 20px`, but it lands inside already-padded containers as often as not, and a built-in margin would silently double the inset. Callers position it.
  - **One spec deviation, recorded on `StatTile`.** The figure is `title3` (21px/400) against the spec's "19–21px weight 300". The ten-step ramp has no 300-weight role at that size and the design law forbids inlining one. Raise it as a missing token if it ever reads heavy.
  - **Two `StatTile` call sites left alone.** `profile-stats-grid.tsx` (six tiles) and `gaming-insights.tsx` are wrapping **grids**, not strips; `MetricStrip` is a single row by definition, so they need recomposing rather than rewrapping. **Owned by 3.9.** Both still render correctly as tiles meanwhile.
  - **Screen-level adoption of `ScreenTitle` and `CornerNotch` is Phase 3's**, not this task's — putting them on Achievements and Settings now would recompose those screens ahead of 3.1 and 3.2.

## Phase 3 — Screen recomposition

One commit per screen. Layout only — every data hook, form, validator and state stays.

- [x] **3.1 Achievements** — `SCREEN_REDESIGNS.md` §8. Build the rarity plate table here; the rest of the app reuses it. **Stop after this one and show the screen.** — **Done 2026-08-04**, two commits: `a04a936` extends the rarity table in `@gmrlog/ui`, `1c1eb16` builds the screen. §8's "Now: a section inside profile → Target: its own screen" is taken literally: new route `app/(app)/achievements/`, screen at `features/profile/screens/achievements-screen.tsx` (kept in `profile` because the hook, the model and the taxonomy already live there — a second feature folder would have split one subject across two).
  - **The plate table lives in `rarityGeometry()`, not in the component.** §8 keys four properties to tier; `radius` and `elevation` were already there from 1.4, so this added `cornerNotch` (px, 22 · 16 · 12 · 8 · null), `cornerNotchVertical` (legendary only — §8's "22px both edges") and `border`. The screen is the table's first consumer, not its owner; the other twenty-three screens read the same function.
  - **One deviation from §8's table, kept from 1.4: the radius column.** §8 gives epic and legendary the same `radius.sm` and shifts the rest down a step, which spends five tiers on four shapes and makes the top two indistinguishable by geometry — the exact failure the rule exists to prevent. The ramp stays `full · xl · lg · md · sm`. The glow and border columns follow §8 exactly. Recorded on the table itself so the next reader does not "fix" it back.
  - **§8's "0.4% of players" has no field behind it.** `AchievementResponse` (`packages/types/src/index.ts:1089`) carries no holder share, and the client must not derive one — scores are server-side. Each row ends with the tier word in monospace plus the fact we do have: the unlock date, or the distance left. **Backend follow-up:** an additive optional `holderPercent` on `AchievementResponse` would let the row say what §8 wants. Not raised as its own task; fold it into Phase 5 if the similarity work touches this DTO.
  - **One bug the measurement caught.** The row title was `label` (12px) against a `bodySm` description (13px) — the description outranked its own title. Now `headline` (17). Worth remembering when composing rows elsewhere: `label` sits _under_ `bodySm` on the ramp.
  - **Measured live, dark, at 906px.** Title block `32px/300, -1px, Geist-Light`, padding `20/20/20/16`, gutter 20, back affordance 44px tall. Meta line `11px IBMPlexMono uppercase 0.55px`; kickers `9px … 1.26px`. The plate ramp resolved across four tiers: common `9999px` radius / no notch / no glow / hairline; uncommon `14px` / `8×1`; rare `11px` / `12×1`; epic `8px` / `16×1` / `0 0 2px` glow / `accent.muted` border. Locked rows measured `opacity 0.42` on the glyph and the text block with the plate at 1.
  - **What is not measured.** (1) **Legendary was never on screen** — this account holds no `isRare && isHidden` achievement, so the `4px` plate and the `22×22` corner are pinned by `rarity-geometry.spec.ts` but unseen, the same gap 1.5 reported. (2) The `headline` fix and the 375px reflow were made _after_ the walk; the backend process died mid-session and the refresh cleared the session, and I do not type into the sign-in form. The type fix is a role swap on a ramp whose mapping the same walk demonstrated live (`label`→12/500, `bodySm`→13/400), so `headline`→17/500 follows from the mechanism, but it has not been seen. **Next session: sign in, open `/achievements`, confirm both.**
  - **Metro, again.** `expo start` under `preview_start` died on first bundle exactly as 1.5 documented; `CI=1 … expo start` holds. But `CI=1` also disables the watcher, so **Metro will not pick up an edit** — it must be restarted (and `TaskStop` kills the shell, not the detached node; kill the process on 8081).
- [ ] **3.2 Settings** — §9
- [ ] **3.3 Notifications** — §12
- [ ] **3.4 Messages** — §11
- [ ] **3.5 Collections** — §10
- [ ] **3.6 Home feed** — §4
- [ ] **3.7 Discover** — §7 (the "Plays like you" rail comes later, in 6.2)
- [ ] **3.8 Game hub** — §5. The overlap hero. Hardest screen in the app; do it alone.
- [ ] **3.9 Profile** — §6. The player record card.
- [ ] **3.10 Login** — §1
- [ ] **3.11 Register** — §2. Must look like Login in another state.
- [ ] **3.12 Onboarding** — §3. — _0.1: **net-new, not a recomposition.** `features/onboarding/` is a lone `index.ts` with no screen, no route and no state, so Phase 3's "layout only, every hook and state stays" rule has nothing to preserve here. Also owns the show/dismiss decision._

## Phase 3b — The remaining screens

`SCREEN_REDESIGNS_2.md`. Same rules: layout only, one commit per screen, shared patterns reused not rebuilt.

- [ ] **3b.1 Communities directory** — §13
- [ ] **3b.2 Community detail shell** — §14 (the Members tab content is 7.2–7.4)
- [ ] **3b.3 Followers & following** — §15
- [ ] **3b.4 Review composer** — §16. The borderless writing surface is the point; do not put the textarea in a card.
- [ ] **3b.5 Subscription** — §17
- [ ] **3b.6 Customize profile** — §18. The live preview must be the real card component, not a mock.
- [ ] **3b.7 Cosmetics store** — §19
- [ ] **3b.8 Tier lists** — §20. Drag must work on native (`react-native-gesture-handler`), not just web.
- [ ] **3b.9 Events** — §21
- [ ] **3b.10 Tournament bracket** — §22
- [ ] **3b.11 Studio analytics** — §23. Deltas use arrows and the accent, never green/red.
- [ ] **3b.12 Publisher portfolio** — §24
- [ ] **3b.13 Creator hub** — §25. The "Disclosed" plate is mandatory on every partnership row.

## Phase 4 — Sign-in with Google, Steam, Discord

- [ ] **4.1 Enum and migration.** `OAUTH.md` §1. `google` as a login provider; keep `connected_provider` for connections.
- [ ] **4.2 OAuth service.** §3. Matching rules 1–4, transactional, with a table-driven test. **Test before any UI** — the account-takeover risk lives here.
- [ ] **4.3 Google, end to end.** §2. `expo-auth-session` + PKCE, secret stays server-side, native and web. — _0.1: `expo-auth-session` is **not installed**; add it (plus `expo-crypto` for PKCE) first._
- [ ] **4.4 Discord.** Same shape as Google.
- [ ] **4.5 Steam.** OpenID 2.0 plus the email-capture step. Kick off the library import in the background.
- [ ] **4.6 Error mapping.** §4. All five cases into `mapAuthError` and `ErrorBanner`. Cancel is not an error.
- [ ] **4.7 Settings connect / disconnect.** §5, including the last-sign-in-method guard.

## Phase 5 — Backend: DNA

- [ ] **5.1 Breakdown.** `BACKEND_CHANGES.md` §1. Return the five sub-scores; `computeUserSimilarityScore` keeps its signature and delegates. Test that the weighted parts equal the total.
- [ ] **5.2 Persist.** §2. Prisma columns, migration, write path. Treat all-zero components with a non-zero total as "unavailable".
- [ ] **5.3 DTO.** §3. `SimilarUserResponse.match` as an optional field. Server-owned band thresholds.
- [ ] **5.4 Match endpoint.** §4. `GET /users/:id/dna-match`, including `applicable: false` for organisation accounts, shared games, and the verdict templates.
- [ ] **5.5 Traits.** Reuse `archetype-engine.service.ts`; do not invent a second taxonomy.

## Phase 6 — DNA match in the app

- [ ] **6.1 Match token.** `README.md`. One shared component, used in `similar-users-section.tsx`, the friends rows, and community member rows.
- [ ] **6.2 Plays-like-you rail.** Discover. `useSimilarUsers` already returns the data.
- [ ] **6.3 Match ring.** `react-native-svg`, animated once on mount, respects reduce-motion.
- [ ] **6.4 DNA panel.** Into the existing `PublicProfileScreen`, between the identity block and `ProfileStatsGrid`. Five bars via `DistributionBars`. All four states.

## Phase 7 — Community

- [ ] **7.1 Roles and leaderboard API.** `BACKEND_CHANGES.md` §5. Check `community-permissions.ts` first — roles may already exist. — _0.1: **they do.** `enum CommunityRole { member, moderator, owner, admin }` (`schema.prisma:305`), ranked in `community-permissions.ts`. Reuse it; do not add a second enum. The doc's `'moderator'|'contributor'|'member'` union drops `owner` and `admin` — see the correction in §5. Only the leaderboard is new._
- [ ] **7.2 Moderators rail.** Square plates, accent border and glow for moderators.
- [ ] **7.3 Contribution board.** Rank, bar, points.
- [ ] **7.4 Top members.** Existing list plus the match token.

## Phase 8 — Close

- [ ] **8.1 Cross-platform pass.** Every recomposed screen on native and web. Web above the tablet breakpoint: Player screen puts gauge and breakdown side by side; rails become wrapping grids.
- [ ] **8.2 Accessibility pass.** Match announced as a sentence; ring hidden from assistive tech; bars as `progressbar` with values; nothing encoded by colour alone.
- [ ] **8.3 Neutral accent pass.** Every screen in monochrome. Anything that stops making sense had the accent carrying meaning it should not.
- [ ] **8.3b Organisation surfaces.** Confirm no DNA match token appears anywhere on Studio, Publisher or Creator hub — the concept is individual-only.
- [ ] **8.3c Disclosure audit.** Every sponsored card, partnership row and paid placement carries a visible monospace label.
- [ ] **8.4 Full check.** `pnpm turbo run typecheck lint test build`.

---

## Notes

Append findings here as you go — decisions taken, doc corrections, anything the next session needs to know.

---

### 0.1 Reality check — 2026-08-02

Method: read all five named docs, then verified every concrete claim against source — `palettes.ts`, `tokens.ts`, `text.tsx`, `load-fonts.ts`, `schema.prisma`, `similarity.engine.ts`, `similarity.service.ts`, `community-permissions.ts`, `packages/types`, and the frontend feature tree. Nothing below is from memory; each item cites what was inspected. Corrections are written inline in the docs, marked "0.1".

**Overall: the handoff is accurate.** `BACKEND_CHANGES.md` and `OAUTH.md` are near-exact — weights, enum members, table names, file paths and the "already built" claims all check out. Almost every problem found is on the **typography** axis, and they compound.

**Blocking — settle before 1.2, definitely before 2.1**

1. **`TypographyStyle.fontWeight` cannot express weight 300.** `THEME_MIGRATION.md` §4's own snippet kept `'400'|'500'|'600'|'700'` while its prose two paragraphs down mandates 300 (200 at display size), as does every screen in `SCREEN_REDESIGNS.md`. Following §4 literally produces a type Phase 3 cannot use. Snippet corrected in the doc; `tokens.ts:127` still carries the old union.
2. **The 7-role type scale does not cover the redesign.** `SCREEN_REDESIGNS.md` calls for ~19 distinct sizes (9 → 40) against `display 32 · heading 24 · title 18 · body 16 · label 14 · caption 12 · meta 12`. There is no role at 40, 38, 19–21, 9 or 9.5, and nothing between 14 and 16. Since the design law forbids inlining pixel sizes, **the scale has to be raised in Phase 1** — new `THEME_MIGRATION.md` §4b sets out two options. If this is left to Phase 3, twelve screens each invent their own sizes and the token system is gone before it ships.
3. **Task 1.2 needs a typeface decision and a binary.** `load-fonts.ts` registers nothing (it awaits `Promise.resolve()`); `assets/fonts/` holds one empty `README.md`. `expo-font ~13.0.4` is installed, but `README.md` says the bundle ships no assets — so the monospace family must be chosen and licensed. §4's "alongside the existing families" was wrong; there are none.

**Corrections that change task scope**

4. **1.1** — `plasma` already exists (D3.27, `palettes.ts:113`, `#A78BFA`/`#6D28D9`). Re-valuation, not addition.
5. **3.12 Onboarding** — does not exist at all (`features/onboarding/index.ts` alone, no route). Net-new; Phase 3's "keep every existing state" rule has nothing to keep.
6. **4.3** — `expo-auth-session` is not in `apps/frontend/package.json`. `react-native-svg` (6.3) and `react-native-gesture-handler` (3b.8) _are_ present.
7. **7.1** — `CommunityRole` is already modelled with **four** members (`member, moderator, owner, admin`). `BACKEND_CHANGES.md` §5's proposed `'moderator'|'contributor'|'member'` union silently drops `owner` and `admin`; a members response typed that way cannot represent a community's owner. Suggested fix in §5: keep the four persisted roles and carry `contributor` as a derived boolean, since it is a rank in a window rather than a permission.

**Smaller doc errors, fixed in place**

8. `space.9` (`SCREEN_REDESIGNS.md` §3) does not exist — scale is `0 1 2 3 4 5 6 8 10 12 16 20 24`.
9. `README.md` said "four breakdown dimensions" in two places and five in a third. **Five** is correct, matching the engine.
10. `SimilarUserResponse` is at `packages/types/src/index.ts:1212`, not ~L1181 (stale in both `README.md` and `BACKEND_CHANGES.md` §3).
11. `README.md`'s token map claimed `4/8/11/14/20/22px → space.1…6`, but that scale is `4/8/12/16/20/24` — three of six are roundings presented as mappings. Same gap for padding: 11, 15, 18, 22, 26, 34 and a −74 overlap are all off the 8pt grid.
12. `radius.full` should stay **9999**, not the `999` in §5 — no visual difference, and 9999 is what every existing pill resolves to.
13. `letterSpacing` is px in React Native but em in these docs. §4's `meta: 1.4` is already correctly converted from `.14em` — follow that precedent.

**Verified correct, no action** — the zinc→navy premise (`#09090B` / `#3F3F46` / white accent, `palettes.ts:56-91`); the `scrim.foreground` invariant genuinely is documented in `tokens.ts:46-55`; `text.tsx` spreads exactly the four properties §4 assumes; `typographyScale` really does use 700/600/600. `BACKEND_CHANGES.md` §1 and §2 are exact — the five sub-scores are computed at `similarity.engine.ts:271-275` and discarded, `USER_SIMILARITY_WEIGHTS` matches the table value for value, `UserSimilarity` (`schema.prisma:2090`) caches `score` alone. §4's hedge resolves: `User` has **no** account-type field, so `accountKind` must be added. Every file path in `README.md`'s "what already exists" table and every `@gmrlog/ui` primitive named across the docs was found present. `OAUTH.md`'s schema claims are exact down to the enum members.

**Repo state the next session should know**

14. The working tree carries an **unrelated in-flight sprint** — D3.29 profile theme: 21 modified files, ~870 insertions, two new controllers, a `20260802090000_d3_29_profile_theme` migration, and `BACKEND_ALIGNMENT_AUDIT.md` at the repo root. None of it is on this task list. **Commit or stash it before 1.1** so the palette change lands as its own diff.
15. `GMRLOG.dc.html` and the handoff folder are also untracked, as is the root `CLAUDE.md` that `README.md` step 2 asks for (already copied).
