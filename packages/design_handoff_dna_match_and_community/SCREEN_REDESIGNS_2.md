# Screen redesigns, part 2 — the remaining twelve

`SCREEN_REDESIGNS.md` covers the twelve core screens. This covers the rest of the prototype. Same rules: tokens only, accent as line and glow, weight 300–500, metadata in monospace, and the shared patterns from part 1 (title block, metric strip, section kicker, bleeding rail, corner notch) reused everywhere rather than rebuilt.

These screens are lower traffic but they are where the product's ambition shows. A tier list that looks like a spreadsheet undoes the work the profile does.

---

## 13. Communities (directory)

Title block "Circles" with a count. Filter pills. Then cards:

- 96px banner strip edge to edge across the card top, with a diagonal hatch at 5% and a bottom scrim.
- Overlapping the banner by `-22px`: a 44px squircle emblem at `radius.md` with a 3px background-coloured ring.
- Name at `16px weight 500`, one-line description in secondary, then a monospace footer: members · posts today · a live dot when active.
- Joined circles get an accent hairline instead of the neutral one; not a badge, not a filled chip.

Sections in order: **Your circles** (list), **Active now** (bleeding rail of 148px cards with a pulsing dot), **Suggested** (list, each with a one-line reason in accent monospace — "3 friends here").

## 14. Community detail

Covered in `README.md` for the Members tab. The shell around it:

- 168px full-bleed banner, back and overflow as glass buttons, emblem overlapping by `-30px`.
- Name, then a monospace meta line: members · created · privacy.
- Join button — outlined accent when not a member, plain hairline "Joined" when a member.
- Metric strip: Members / Posts / Events.
- Underlined tabs: Feed / Members / Events / About.

## 15. Followers & following (People)

- Sticky header with a title, a 40px search field and **three underlined tabs**: Followers / Following / Blocked, each with a count in monospace beside the label.
- Rows: 44px avatar, name, handle + note line, the DNA match token beneath (see `README.md`), and a right-side action button — Follow / Following / Unblock, all outlined, never filled.
- Overflow menu per row: View profile, Mute, Block, Report. A sheet on native, a popover on web.
- Blocked rows render at `opacity 0.42` with the action reading "Unblock". No red, no warning styling — blocking is a normal action, not an error.

## 16. Review composer

The one screen where the app should feel like a writing tool.

- Sticky bar: Cancel left, "Review" centred, Publish right as an outlined accent pill, disabled until a rating exists.
- Game strip: 52×70 cover, title, platform in monospace.
- **Rating**: five 34px stars, tappable, accent when set, hairline when not. The numeric value appears beside them in monospace once set — never before.
- **Body**: a borderless auto-growing textarea on the background, `15px / 1.7`, minimum 180px, placeholder "What stayed with you?". No card, no visible field chrome. The absence of a box is what makes it feel like paper.
- Below: a monospace character count, and toggle chips for Contains spoilers / Finished it / Replay.
- Attachments row: add screenshot, add clip — 44px outlined squares with icons.

## 17. Subscription

- A radial accent glow from the top of the screen, at very low opacity. The only gradient in the app besides key art.
- Title "GMRLOG Pro" at `32px weight 300`, one-line value proposition beneath.
- **Two plan cards**, stacked, selectable: monthly and annual. Selected gets an accent border and a corner notch; unselected gets a hairline. Annual carries a small monospace "2 months free" in accent. Price at `26px weight 300`, period in monospace.
- Feature list: hairline-separated rows, each a 16px outlined check icon plus a label. No ticks in coloured circles.
- Sticky bottom CTA, full width, outlined accent, with the price restated.
- Fine print in monospace at `10.5px`: renews, cancel any time, restore purchases.
- **Never sell anything that affects standing.** Cosmetics and tooling only — the copy should say so plainly, once.

## 18. Customize profile

Live preview at the top, controls beneath — the preview must update as options are tapped, and it must be the real card component, not a mock.

- Sticky bar: Cancel / "Customize" / Save (outlined accent).
- **Live preview**: the player record card at reduced size, with the corner notches, avatar glow, name, archetype and equipped badge pills.
- **Accent**: a row of 38px swatch circles; the selected one gets a ring plus a 4px halo. Labels in monospace beneath. Include `neutral` first — monochrome is a legitimate choice, not an absence.
- **Card style**: a three-column grid of 52px preview tiles; Pro-only styles carry a small diamond icon.
- **Banner**: full-width 56px preview rows; locked ones show a price pill with a lock; animated ones show a pulsing dot.
- Footer: a link row through to the cosmetics store.

## 19. Cosmetics store

- Back link to Customize, title, and a one-line honesty statement: cosmetic only, nothing that changes standing.
- Category pills.
- Grid of 2 columns: preview tile, name, price in monospace. Owned items show "Owned" in tertiary instead of a price and are not tappable.
- A single featured item at the top, full width, with a corner notch and an outlined accent Reserve button.

## 20. Tier lists

The most interactive screen in the app, and the one most likely to be built as a boring table.

- Back to Collections, title at `27px weight 300`, then a monospace byline: author · likes · forks.
- **Tier rows**: a 44px-wide label plate on the left at `radius.sm` — S / A / B / C / D — with the letter at `18px weight 500`. The plate's border and text brighten as the tier rises; **no coloured tier bands.** The rest of the row is a wrapping grid of 54×72 covers with 6px gaps, on a surface a step above the background.
- Drag to reorder between tiers. On native use `react-native-gesture-handler`; on web, pointer events. The lifted cover gets a shadow and a slight scale; the target row gets an accent hairline.
- An "Unranked" tray at the bottom, horizontally scrolling.
- Action row: Fork, Like, Share — outlined, equal width.

## 21. Events

- Back to Circles, title "Events".
- Filter pills: All / Tournaments / Watch parties / Launches.
- **Event rows**: a left date plate — day at `20px weight 300`, month in monospace uppercase, on a hairline-bordered square at `radius.md`. Beside it: title, circle name, and a monospace line of time · attendees. Live events replace the date plate with a pulsing accent dot and "LIVE".
- Rows separated by hairlines, no cards.
- Section kickers group by This week / Later.

## 22. Tournament

- 186px full-bleed gradient header with hatch and scrim, glass back button, a pulsing accent dot with "LIVE · QUARTER-FINALS" in monospace, and the title at `25px weight 300`.
- Metric strip: Seats / Prize / Round.
- **Bracket**: a horizontally scrolling set of 180px round columns, bleeding off the right edge. Each round has a monospace header with a hairline under it. Matches are two stacked side rows in a `radius.md` container; the winning side gets a faintly tinted background and the score in `weight 500`; the loser's name drops to tertiary. The live match's container gets an accent border.
- **Watch party card**: a 40px outlined broadcast icon, title, "412 watching · voice on" in monospace, and a Join pill.

## 23. Studio analytics (developer)

- Sticky header: "STUDIO · ANALYTICS" kicker, studio name at `25px weight 300`, a close button.
- Time-range pills.
- **KPI grid**, 2×2: label in monospace, value at `24px weight 300`, delta beneath in accent or tertiary — **never green or red.** Direction is carried by an arrow glyph and a sign, so the screen stays readable in monochrome.
- **Sentiment**: a five-row distribution using `DistributionBars`.
- **Player funnel**: horizontal bars with counts, each a step in the funnel.
- **Cohort retention**: a small grid where cell opacity — not hue — encodes retention. Header row in monospace.
- Everything is read-only. No actions on this screen except the range pills.

## 24. Publisher portfolio

- Same header pattern as Studio, kicker "PUBLISHER · PORTFOLIO".
- KPI grid, 2×2.
- **Titles list**: 42×56 cover, title, monospace meta, a 2px health bar, and a right-aligned DAU figure with a delta. Tapping opens that title's Studio view.
- **Cross-game migration**: a card of rows — from title → to title with an arrow glyph and a percentage in accent monospace. This is the publisher's most valuable view; give it room.
- **Market opportunity**: cards with an accent hairline, an icon, a monospace kicker and one sentence of plain-language insight. No charts here — it is a reading surface.

## 25. Creator hub

- 132px gradient header with hatch and scrim.
- 72px avatar overlapping by `-34px`, with an accent ring.
- Name at `24px` with a verified seal in accent beside it, handle plus "Verified creator since 2024" in monospace, then a one-line bio at `14px / 1.62`.
- Metric strip: Followers / Lists / Reviews / Partners.
- **Featured lists**: bleeding rail of 168px cards, each with a three-cover mosaic strip on top.
- **Partnerships**: rows with a 36px cover, title, kind in monospace, and a **"Disclosed" plate** on the right — a hairline box in monospace uppercase. This label is mandatory and never styled to be quiet.
- **Creator milestones**: a three-column grid of badge plates using the same rarity geometry as achievements.

---

## Notes that apply to all of these

**Publisher, Studio and Creator hub are organisation surfaces.** No DNA match anywhere on them — the concept is individual-only. If a match token appears on one of these, something is wired wrong.

**Disclosure is never subtle.** Sponsored cards, partnership rows and paid placements always carry a visible monospace label. It is part of the design, not a legal afterthought bolted to the bottom.

**Deltas and directions avoid green and red.** Use the accent for positive, tertiary for negative, and always pair with an arrow and a sign. This keeps every analytics surface working in monochrome and readable for colour-blind users.

**Anything that can be dragged needs a touch story.** Tier lists and badge slots are drag surfaces; on native they need `react-native-gesture-handler`, a lifted state, and a clear drop target. A web-only drag implementation is a broken screen on phones.
