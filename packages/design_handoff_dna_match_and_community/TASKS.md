# TASKS.md

The ordered task list. Claude Code reads this at the start of every session, takes the **next unchecked task**, does only that, commits, and ticks the box.

Rules: no skipping ahead, no batching several tasks into one diff, no starting a task whose dependency is unchecked. If a task turns out to be already done or wrong, tick it with a note instead of inventing work.

---

## Phase 0 — Orientation

- [x] **0.1 Reality check.** Read `README.md`, `THEME_MIGRATION.md`, `SCREEN_REDESIGNS.md`, `OAUTH.md` and `BACKEND_CHANGES.md` in this folder, then explore the repo. Report where the docs are wrong, out of date, or describe work that is already done. **No code changes.** Update the docs with what you found, then tick this. — _Done 2026-08-02. Corrections written inline into all five docs, marked "0.1". Summary in Notes._

## Phase 1 — Visual language

- [ ] **1.1 Palette.** `THEME_MIGRATION.md` §1–3. New dark and light values in `packages/ui/src/theme/palettes.ts`, plus the `plasma` accent. Values only — no structural change. — _0.1: `plasma` already exists (D3.27, `palettes.ts:113`). This is a **re-valuation**, not an addition; the other seven accents are untouched._
- [x] **1.2 Typography.** §4. Add `fontFamily` and `textTransform` to `TypographyStyle`, set the `meta` role to monospace uppercase, register the font in `load-fonts.ts`, apply in `components/text.tsx`. Step any 600/700 weights down. — _Done 2026-08-02. Ten-step ramp per §4b; weight union widened down to `'200'|'300'|'400'|'500'`; Geist and IBM Plex Mono registered; `text.tsx` applies family and transform. `heading`/`title`/`caption` kept as deprecated aliases pinned to `title2`/`headline`/`bodySm` — 122 call sites across 91 files, which Phase 3 migrates screen by screen. Delete them at Phase 3b; 8.4 checks the union is back to ten._ **⚠ The four `.ttf` files are not in the repo — see `apps/frontend/assets/fonts/README.md`. Metro will not bundle the app until they are added.**
- [ ] **1.3 Radius and elevation.** §5. New radius scale; strip drop shadows from cards.
- [ ] **1.4 Rarity geometry.** `RarityBadge` encodes tier by radius and glow, not only colour: `radius.sm` + `shadow.md` at legendary, `radius.full` + hairline at common.
- [ ] **1.5 Sweep.** §6. Walk Home, Game hub, Profile, Achievements, Settings in dark, light and on the `neutral` accent. Fix breakage by adding space or changing surface — never by darkening `border.default`. Report anything you could not fix that way.

## Phase 2 — Shared composition patterns

- [ ] **2.1 Patterns into `@gmrlog/ui`.** `SCREEN_REDESIGNS.md` § "Shared patterns": screen title block, metric strip, section kicker, bleeding rail, corner notch. Extend `Rail` and `StatTile` rather than adding components beside them.

## Phase 3 — Screen recomposition

One commit per screen. Layout only — every data hook, form, validator and state stays.

- [ ] **3.1 Achievements** — `SCREEN_REDESIGNS.md` §8. Build the rarity plate table here; the rest of the app reuses it. **Stop after this one and show the screen.**
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
