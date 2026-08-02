# Screen redesigns — composition

THEME_MIGRATION.md changes what the app is _made of_. This document changes how it is _arranged_. Applying the palette alone will make the app darker and cleaner but still flat, because flatness is a layout property, not a colour one.

Twelve screens, full recomposition. Everything below is already in the prototype — open `GMRLOG.dc.html` and switch between screens with the chips at the top.

> **0.1 reality check — read before starting 2.1 or any Phase 3 task.**
>
> **The pixel values in this document have no tokens yet.** This doc specifies ~19 distinct font sizes against the 7 typography roles that exist, and padding values (11, 15, 18, 22, 26, 34) that are not on the 8pt space scale. The design law forbids inlining them. **`THEME_MIGRATION.md` §4b** (added by this audit) sets out what has to be raised in Phase 1 first; without it, every screen here invents its own inline sizes.
>
> Read every `38px`, `15.5px`, `0.14em` and `22px 20px` below as _intent about relative scale_, not as a literal to type into a stylesheet.

---

## Why the current app reads flat

Five habits, all of them defensible individually, that together drain the hierarchy. Fixing these five fixes most screens before you touch a specific layout:

**1. Every type size is close to every other.** Titles are 18–20px, body is 15–16px, labels are 13–14px. Nothing is far enough apart to create a first, second and third read. The prototype runs `38px weight 300` screen titles against `10px monospace` labels — a 4× range. Big things must get much bigger and light; small things must get much smaller and tracked out.

**2. Weight is used for emphasis instead of size and colour.** Bolding a 15px label next to a 15px value produces two things that look equally important. The prototype never goes above `500`; hierarchy comes from size, from `color.text.primary` vs `tertiary`, and from space.

**3. Cards are outlined boxes.** Nearly every list item sits in a bordered container. When everything has an edge, edges stop meaning anything and the screen reads as a grid of equal cells. In the prototype most lists have **no card at all** — rows separated by a hairline, with padding doing the work. Cards are reserved for things that are genuinely a unit (a collection, a workshop item, a settings group).

**4. No monospace counterpoint.** Every string is set in the same sans. The prototype puts all _metadata_ — counts, timestamps, ranks, platforms, section kickers — in tracked-out uppercase monospace. This single move separates content from chrome and is most of what makes it look engineered rather than generic.

**5. Nothing is ever full-bleed.** Content sits inside a uniform horizontal padding all the way down. The prototype breaks the margin constantly: key art runs edge to edge, rails scroll out past the gutter (`margin: 0 -20px; padding: 0 20px`), and cover art overlaps the hero above it. That rhythm of contained → bleed → contained is what makes a screen feel designed.

**A rule to hold onto:** on any screen, one element should be unmistakably the largest thing. If you cannot say which, the screen is flat.

---

## Shared patterns

Build these once; nine of the twelve screens use them.

### Screen title block

```
<back chevron + label>       ← 12px sans, color.text.tertiary, only on pushed screens
<H1>                         ← 32px, weight 300, letterSpacing -0.03em
<meta line>                  ← 12px monospace, tertiary, e.g. "412 of 1,208 unlocked · 34%"
[optional 2px progress rule]
```

Padding `22px 20px 16px`. This is the top of Achievements, Collections, Notifications, Messages, Settings, Events. **Do not** put these titles in a nav bar — the title belongs to the content, and it scrolls away with it. Reserve `NavHeader` for pushed detail screens.

### Metric strip

Three or four values in a row, separated by hairline verticals, the whole strip bounded by a hairline above and below, margin `0 20px`. Value `19–21px weight 300`; label `9px monospace uppercase, 0.13em tracking`, `space.2` beneath. Used on Profile, Game hub, Player, Community detail. `StatTile` should be reshaped to this.

### Section kicker

`10px monospace, uppercase, 0.14em tracking, color.text.tertiary`, `space.3` below it. Optionally with a right-aligned counter or a text link ("All 412 →"). Every section on every screen opens with one of these. No 18px bold section headings anywhere.

### Bleeding rail

```css
display: flex;
gap: 11px;
overflow-x: auto;
margin: 0 -20px;
padding: 0 20px;
```

Cards run off the right edge of the screen — that overflow is the point. Never centre a rail or pad it symmetrically. `Rail` should do this by default.

### Corner notch

A 22×1 accent rule at the top-left of a container, sometimes paired with a 1×22 vertical. Used on cover art, sponsored cards, the DNA panel, the player card. It is the system's signature mark — cheap, unmistakable, and it costs no colour.

---

## 1. Login

**Now:** centred form — `Container`, email field, password field, submit, OAuth buttons below.

**Target:** a full-height flex column with two zones, no card, no centring.

- **Top zone (`flex: 1`, centred vertically):** the rotated-square logo mark with a violet glow, `space.12` of air, then a `40px weight 300` headline with `-0.038em` tracking, then a `15.5px` body paragraph capped at `280px` width in `color.text.secondary`. Nothing else. This zone is _mostly empty_ — that emptiness is the design.
- **Bottom zone:** the provider buttons stacked, `50px` tall, `radius.md`, `space.2` apart, each with an icon and a label. Primary provider gets the accent border; the rest get plain hairlines. Legal line centred underneath at `11px`.
- Screen padding `0 26px 34px`. No safe-area top padding — the headline should sit high.

**Email/password:** not on the first screen. Continue with email is one of the buttons; tapping it swaps the bottom zone for two fields and a submit, keeping the headline in place. This keeps first paint calm and is a smaller change than it sounds — the form already exists, it just moves into a second state.

Keep `useAppForm`, the Zod schema, `mapAuthError` and `ErrorBanner` exactly as they are. This is layout only. The banner mounts above the bottom zone.

## 2. Register

Same shell as Login, different headline and a three-field bottom zone. The two screens must look like one screen in two states — same logo position, same headline size, same button geometry. If Register grows a card or a different title size, the flow breaks.

Progressive disclosure: handle → email → password as three steps sharing the top zone, with the dot indicator from Onboarding underneath. Validation errors appear under the field in `color.status.error` at `11px`; the submit stays disabled, as it does now.

## 3. Onboarding

**Now:** doesn't really exist as a designed surface.

> **0.1 correction — it does not exist _at all_.** `apps/frontend/features/onboarding/` contains a single `index.ts` and nothing else; there is no screen, no route under `apps/frontend/app/`, and no state. Task 3.12 is therefore **net-new construction**, and Phase 3's standing rule ("layout only — every data hook, form, validator and state stays") does not apply to it: there is nothing to preserve. Scope 3.12 accordingly, and note that it also owns whatever decides when onboarding is shown and when it is done.

**Target:** the Login shell, three times, with a dot rail.

- Same two-zone column. Top zone carries a `40px weight 300` title and a `15.5px` body.
- **Progress is three 2px bars, not dots** — the active one is `20px` wide and accent, the rest are `8px` and `border.default`. They are tappable. `space.9` below the body. — **0.1: `space.9` does not exist.** The scale is `0 1 2 3 4 5 6 8 10 12 16 20 24`; the nearest steps are `space.8` (32) and `space.10` (40). Use `space.10` if the intent was the ~36px gap the prototype shows.
- Bottom zone is a single full-width continue button plus a "Skip" text button.
- Three panels, verbatim from the prototype:
  1. "Every game you finish becomes part of the record." — logging is two taps
  2. "Your profile answers one question: what kind of gamer are you?" — DNA, completion, archetype
  3. "Find the next one from people who play like you." — taste overlap, not trending

Transition between panels is a horizontal slide of the top zone only; the bottom zone stays put.

## 4. Home feed

**Now:** cards in a scroll.

**Target:** a bordered-row feed with a sticky header and a real post composition.

- **Sticky header:** wordmark left (rotated square + `GMRLOG` at `13px weight 500`, `0.28em` tracking), search and bell right as 44px icon buttons, bell with a 5px accent dot. Under it, a tab row — Following / For you / Friends — as **underlined tabs**, not pills: 40px tall, 2px bottom border on the active one, no background. Whole header `backdrop-filter: blur(18px)` over 82% background.
- **Each post:** `18px 20px` padding, hairline separator at the bottom. **No card, no border, no radius.** Three parts:
  1. _Attribution row_ — 30px avatar, name at `13.5px weight 500`, handle in tertiary, a verb line beneath at `11.5px` ("finished · 62 hours"), timestamp right in monospace.
  2. _Game block_ — cover 78×104 at `radius.sm` with a 16×1 accent notch, beside it the title at `16.5px weight 500`, a star row, and platform · hours in monospace. This is the editorial variant; it should be the default.
  3. _Body copy_ at `14.5px / 1.62` in `color.text.secondary`, then an action row of icon+count buttons at 36px, pulled 8px left so the first icon optically aligns with the avatar.
- The prototype ships two alternates — **poster** (full-bleed 172px cover with a scrim and the rating over it) and **compact** (36×48 thumbnail in a small bordered row). Build editorial; keep the other two behind the same variant switch if you want the option later.

## 5. Game hub

**Now:** standard detail screen.

**Target:** cinematic. This is the most dramatic recomposition in the app and the one that most sells the product.

- **330px full-bleed key art** at the top — no padding, no radius, running under the status bar. A diagonal hatch overlay at 4.5% and a bottom-up scrim that lands fully opaque on the background colour. Back / share / overflow are 36px circular glass buttons floating on it at `space.4`.
- **The cover overlaps the art.** A 106×142 cover at `radius.lg` with a heavy drop shadow and a hairline, pulled up `-74px` into the key art, with the title and studio beside it _bottom-aligned to the cover_. This overlap is the single move that makes the screen feel like a product page rather than a list.
- Metric strip (Rating / Hours / Players), then the action row: a full-width outlined accent "Log & review" button with a pencil icon, and two 44px square icon buttons beside it.
- **Five underlined tabs** — About / Reviews / Community / Workshop / Players — horizontally scrollable, same treatment as the feed tabs.
- About: summary paragraph, wrapping tag pills, then a **Screenshots rail** of 206×116 frames that bleeds off the right edge.
- Reviews: a 5-row rating distribution (3px accent bars) above the review list.
- Community: four stacked sections — Friends playing (50px avatars with pulsing accent presence dots), Popular clips (206×116 with duration chips), Top collections (4-strip cover mosaic rows), Live now (a dot + one-line activity feed).
- Workshop: filter pills, then cards with a 34×34 outlined icon, title, description, and a right-aligned rank numeral for ranked items.

## 6. Profile (self)

**Now:** `ProfilePremiumHero` + stats grid + tabs. _(0.1: both confirmed present — `ProfilePremiumHero` lives in `features/profile/components/premium/profile-hero.tsx`, not a file of its own name; `ProfileStatsGrid` in `profile-stats-grid.tsx` beside it.)_

**Target:** the prototype ships three hero variants; **build the card**, which is the strongest and the one the whole product is named after.

**Player record card** — `radius.xl`, a subtle diagonal-hatch overlay, accent notch in both corners, `20px` padding, sitting in `22px 20px` of screen padding:

- Header row: `PLAYER RECORD` in `9.5px monospace, 0.2em` tracking, and `№ 0042` right-aligned.
- Identity: 56px avatar with an accent hairline, name at `23px`, handle in monospace.
- Divider, then **Archetype**: kicker, title at `20px`, one sentence of evidence at `12.5px`, then trait pills each carrying a value in accent monospace ("Completionist 94").
- Divider, then **three badge slots** as equal-width columns — a 30px icon plate whose _radius encodes rarity_ (`radius.sm` + glow for legendary, `radius.full` + hairline for common), label centred beneath. Tapping opens the badge case.
- Divider, then three card stats in a plain row.

Below the card: the metric strip (Games / Platinum / Followers / Following, each tappable), pill tabs, then the sections — **Platinum case** (98px covers, each with an accent hairline, ambient glow, a trophy chip and a `100%` label — the only artwork in the app allowed a glow), **Rarest unlocks**, **Genre DNA** bars, and the play history.

The two alternates — monolith (a `38px weight 300` name on plain background, no card) and banner (a 158px gradient banner with an overlapping 80px avatar) — are worth keeping behind the variant switch.

## 7. Discover

**Now:** hub screen with lists.

**Target:** search-first, then a rhythm of rails.

- Screen title, then a 44px search field with a leading icon and a clearing ✕, at `radius.md` on `surface.secondary`.
- Genre chips row, horizontally scrolling, 32px pills.
- **"Plays like you" rail** — see README. This is the first content on the screen, deliberately: people before games.
- Sponsored card — full-width, a 62×83 cover, a `SPONSORED` micro-label in a hairline box, title, one line of reason copy, accent notch, accent-tinted border. Disclosure is explicit and never styled to hide.
- Then result rows: cover, title, meta, rating.

## 8. Achievements

**Now:** a section inside profile.

**Target:** its own screen, and the clearest demonstration of rarity-by-geometry.

- Title block with "412 of 1,208 unlocked · 34%" and a 2px progress rule beneath.
- Each achievement is a **plate**, not a card: 15px padding, `radius.lg`, and _every visual property keyed to tier_:

  | Tier      | Icon plate             | Notch           | Glow           | Border       |
  | --------- | ---------------------- | --------------- | -------------- | ------------ |
  | Legendary | `radius.sm` (square)   | 22px both edges | ambient accent | accent       |
  | Epic      | `radius.sm`            | 16px            | faint          | accent muted |
  | Rare      | `radius.md`            | 12px            | none           | hairline     |
  | Uncommon  | `radius.lg`            | 8px             | none           | hairline     |
  | Common    | `radius.full` (circle) | none            | none           | hairline     |

- Locked achievements: `opacity 0.42` on the icon and text block only — the plate geometry stays at full strength, so you can still read what tier you are missing.
- Each row ends with tier name in monospace and "0.4% of players" — rarity as a fact, not a colour.

## 9. Settings

**Now:** a functional list.

**Target:** same information, three changes.

- The screen title scrolls; no nav bar title.
- **A Pro card at the top** — gradient surface, accent notch, diamond icon, two lines of copy, chevron. It is the only coloured thing on the screen.
- Groups are **grouped cards**: a monospace kicker outside the card, then a `radius.lg` container holding the rows with hairlines _between_ them and none at the outer edge. Rows are 48px minimum, icon at 17px in tertiary, label at 14px, value + chevron or a toggle on the right.
- Toggle: 40×23 track, 17px knob, accent track when on, hairline when off.
- Footer in monospace at `11px / 1.7` in a dimmed tertiary: version, build, signed-in handle. Small, factual, no styling.

## 10. Collections

**Now:** cards in a list.

**Target:** cover-mosaic cards.

- Title block with count, and a 40px circular accent-outlined `+` button aligned to its baseline.
- A single "Tier lists" entry row above the list — accent-tinted border, icon, two lines, chevron.
- Sort pills.
- **Each collection: a 96px strip of four covers with 2px gaps, edge to edge across the card top**, then a content block with the title at `15.5px weight 500`, count right-aligned in monospace, a description line, and a footer of likes + updated in monospace with inline icons. Card is `radius.lg`, hairline, and on hover lifts to an accent border with a drop shadow.

The cover mosaic is what makes the list scannable — a collection is recognisable by its art before its name.

## 11. Messages

**Now:** thread list.

**Target:** presence first.

- Title, then a 42px search field.
- **A presence rail** — 48px avatars with a 11px status dot ringed in the background colour, name beneath at 10px, scrolling and bleeding off the edge. Online friends first.
- Thread rows: 44px avatar, name at `14px weight 500`, timestamp right in monospace, preview line beneath in tertiary — or `color.text.primary` when unread — and an unread count as a small pill with an accent hairline. Hairline separators, no cards.

## 12. Notifications

**Now:** flat list.

**Target:** grouped, with typed icons.

- Title with a "Mark all read" text button on the baseline.
- **Grouped by time** — `TODAY`, `THIS WEEK`, `EARLIER` as monospace kickers.
- Each row: a 32px **outlined circular icon** whose colour and glyph are keyed to the event type (follow, like, achievement, mention, event). Text is one sentence with the actor's name in `color.text.primary weight 500` and the rest in secondary — never a bold label plus a separate description.
- Timestamp in monospace beneath. Unread rows get a faintly tinted background and a 5px accent dot at the right.

---

## Order

Do them in this order — each one teaches the patterns the next one needs:

1. **Achievements** — smallest surface, and it forces you to build the rarity geometry that the rest of the app reuses
2. **Settings** — grouped cards and the toggle, low risk
3. **Notifications** and **Messages** — the row-and-kicker pattern
4. **Collections** — the cover mosaic
5. **Home feed** — the sticky header and post composition
6. **Discover** — rails
7. **Game hub** — the overlap hero; the hardest and most valuable
8. **Profile** — the player record card
9. **Login / Register / Onboarding** — one shell, three screens; last because the flow needs the rest to exist

## Rules for every screen

- No raw hex. Every value resolves through `useTheme()`.
- No new primitives without checking `@gmrlog/ui` first — `Rail`, `StatTile`, `RarityBadge`, `DistributionBars`, `SegmentedTabs`, `Chip`, `Card`, `EmptyState`, `Skeleton` cover most of this.
- Every screen keeps its existing loading, empty and error states. Restyle them; do not drop them.
- Tap targets ≥44px on both platforms.
- Check each screen on the `neutral` accent before moving on. If it stops making sense in monochrome, the accent was carrying meaning it should not.
- One screen per commit.
