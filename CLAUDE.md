# CLAUDE.md

Project instructions for GMRLog. Read automatically at the start of every session — the rules below apply to all work in this repo without being restated.

## What this project is

GMRLog is a gaming identity product, not a game tracker. A player's profile answers one question: _what kind of gamer are you?_ Everything — the DNA match, archetypes, the platinum case, rarity — serves that. Features that only add numbers to a dashboard do not belong.

## Design authority

`packages/design_handoff_dna_match_and_community/` is the design source of truth:

| Doc                     | Governs                                                             |
| ----------------------- | ------------------------------------------------------------------- |
| `THEME_MIGRATION.md`    | Colour, typography, radius, accent, rarity values                   |
| `SCREEN_REDESIGNS.md`   | Composition for the twelve core screens                             |
| `SCREEN_REDESIGNS_2.md` | Composition for the remaining twelve                                |
| `OAUTH.md`              | Sign-in and sign-up with Google, Steam, Discord                     |
| `BACKEND_CHANGES.md`    | Similarity engine, DNA endpoints, community leaderboard             |
| `README.md`             | DNA match and community feature spec                                |
| `TASKS.md`              | The ordered task list — the current state of the work               |
| `GMRLOG.dc.html`        | The visual prototype. **A reference, never a source to copy from.** |

When code and these docs disagree, the docs win — unless the code reveals the doc was written against something that has since moved, in which case say so before changing anything.

## Design law

**Tokens only.** Every colour, space, radius and type value resolves through `useTheme()` from `@gmrlog/ui`. A raw hex, a hardcoded pixel font size, or a literal `rgba()` in feature code is a bug. If a value has no token, the token is missing — raise it, do not inline it.

**The accent is a line, never a flood.** `color.accent.*` appears as borders, rings, glows, rules and text. It never fills a block behind content. The one exception is a primary CTA, and even there an outlined treatment is preferred. Test: switch to the `neutral` accent — if a screen stops making sense in monochrome, the accent was carrying meaning it should not.

**Rarity is geometry, not colour.** Legendary is a square plate with an ambient glow; common is a circle with a hairline. The colour ramp only brightens. This is why the system survives monochrome.

**Anything drawn on a scrim takes `color.scrim.foreground`.** A scrim is dark in _both_ schemes — that is the whole point of it, and `color.scrim.foreground` (`#F3F5FE`) is the one token deliberately identical in light and dark. Every `color.text.*` flips with the scheme, so a glyph over a scrim that takes `text.primary` renders near-black on near-black in light, and `text.inverse` does the same in dark. It is invisible, and no test catches it: typecheck, lint and unit tests were all green over the one instance that shipped (§14's glass buttons, found only by looking at the screen in light). The pair is `color.scrim.strong` for the plate and `color.scrim.foreground` for what sits on it — the pattern `HeroBackButton` establishes. **Measuring dark-first is what produces this**, so check a scrim in light before calling it done. Geometry alone is not the test: an opaque surface between the glyph and the scrim (an avatar, §13's emblem ring) breaks the relationship, and those glyphs correctly keep their normal tokens.

**Hairlines are whispers.** `color.border.default` is barely visible on purpose. Structure comes from space, not from drawn lines. If a layout feels loose after the palette change, add space or change surface — never darken the border.

**Weight 300–500 only.** Hierarchy comes from size, colour and space. Large numbers are light; nothing is bold to shout.

**Metadata is monospace.** Counts, timestamps, ranks, platforms, section kickers, the match token — all `role="meta"`, uppercase, tracked out. Sentences stay in `body`; names stay in `label` or `title`.

**One codebase, two platforms.** `apps/frontend` renders native and web from the same source through React Native Web. Never fork a web-only implementation. Tap targets ≥44px on both.

## Engineering rules

- **Compose from `@gmrlog/ui`.** Check the package before writing any new component. `Rail`, `StatTile`, `RarityBadge`, `DistributionBars`, `SegmentedTabs`, `Chip`, `Card`, `Avatar`, `EmptyState`, `Skeleton`, `ListItem`, `NavHeader` cover most needs. A new primitive needs a reason you can state.
- **Never delete a state.** Loading, empty, error and offline states already exist on every screen. Restyle them; do not drop them in a recomposition.
- **Scores are server-side.** The client never computes a match percentage, a rank or a points total. Two devices must never disagree.
- **Types flow through `packages/types`,** validation through `packages/validators`, API access through `packages/api-sdk`. No ad-hoc fetch in a feature folder.
- **Additive DTO changes.** New response fields are optional so existing consumers keep working.
- **One screen, one commit.** Even when several screens share a session.

## Known platform traps

React Native Web silently drops things rather than failing. Each of these was found by measuring a live screen, then rediscovered on a later one — they are written here so the third screen does not pay for them again. **None of them is a reason to fork a web-only implementation:** keep the correct cross-platform prop, which native reads, and record what the web build does with it.

- **`accessibilityValue` does not reach the DOM on a `View`.** A `progressbar` renders its `role` and `aria-label` but no `aria-valuenow`. Measured on the auth step rail (3.11). Put the value in the label as well, so the state is announced on both platforms.
- **`accessibilityState` does not reach the DOM on a `Pressable`.** The element renders `role="button"`, `aria-label` and `tabindex="0"`, but no `aria-selected` / `aria-checked`. Measured on the same rail once its bars became tappable (3.12). Same remedy: say it in the label.
- **`Animated.timing` driving `interpolate(transform)` never advances.** The completion callback does not fire, with `useNativeDriver` true or false; colour changes still work because those are plain re-renders. Measured twice — the `Toggle` knob (3.2, fixed by computing the transform directly and snapping) and the reason §3's Onboarding panel slide was not built (3.12). Do not spend a session rediscovering it: either compute the value directly, or reach for a mechanism that is not `Animated` (a paged `ScrollView` gives horizontal panel movement with no animation API at all).
- **`Icon name="..."` resolved to `undefined` on web** until 3.3 replaced the dynamic `require` with a static map. Fixed — listed so the symptom (a neutral placeholder box where a glyph should be) is recognisable if it returns.

The a11y entries are input to **8.2**, the accessibility pass; the `Animated` entry is input to **6.3**, the only task in the list that animates anything.

## Known environment traps

The local stack fails quietly in ways that look like application bugs. Check these before debugging code.

- **Redis dies on its own, and the backend does not recover.** Third silent drop in three sessions (3.13, 3b.1, 3b.1a). The container simply stops; the backend's ioredis client deferred its connect at boot and never retries, so every rate-limited route answers `503 INTEGRATION_UNAVAILABLE` (`RATE_LIMIT_REDIS_UNAVAILABLE`, "redis not ready") — which reads as an auth bug until you look at the log. **Restarting the container is not enough: restart the backend after it.** Check `docker exec gmrlog-redis redis-cli ping` before blaming sign-in.
- **The backend loads `@gmrlog/database` from `dist`, and its watcher does not cover `packages/`.** Editing a repository under `packages/database/src` changes nothing at runtime until `pnpm --filter @gmrlog/database run build` **and** a backend restart. Worse, that build runs `prisma generate`, which fails with `EPERM … query_engine-windows.dll.node` while a backend is running — so the order is: stop the backend → build → start it. A source edit that silently does nothing is indistinguishable from a wrong fix.
- **Metro is started with `CI=1`,** which disables the watcher along with the interactive menu. Every frontend edit needs a Metro restart, and it must not start before `@gmrlog/ui` finishes building.
- **The release-gate script leaves data behind.** `scripts/release/smoke-d3-24-release-gate.mjs` creates a `Gate Community <timestamp>` on every run and never removes it; the local database holds ~100k of them. They have no owner membership row, so they are invisible to the app but they are real rows in every unpaginated query.

## Working rhythm

`TASKS.md` holds the ordered checklist. At the start of a session, read it, take the next unchecked task, and do only that task. When it is done and committed, tick the box and stop.

Do not skip ahead, do not batch several tasks into one diff, and do not start a task whose dependency is still unchecked.

If a task turns out to be wrong or already done, say so and tick it with a note rather than inventing work.

## Commands

```bash
pnpm turbo run typecheck lint test        # before every commit
pnpm --filter frontend exec expo start    # native
pnpm --filter frontend exec expo start --web
pnpm --filter @gmrlog/database exec prisma migrate dev --name <name>
```

## What not to do

- Do not copy anything out of `GMRLOG.dc.html`. It is HTML with inline styles; every value in it has a token equivalent. Read it to understand intent, then write React Native.
- Do not add a colour, font family, spacing value or radius that is not in the theme.
- Do not create a new screen when a doc says extend an existing one.
- Do not use emoji in the product UI.
- Do not add analytics, tooltips, onboarding hints or empty-state illustrations that were not asked for.
