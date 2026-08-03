# Theme migration — GMRLog → prototype visual language

The app today is a **zinc** system: `#09090B` background, `#3F3F46` borders, white accent. The prototype is a **cool navy** system: near-invisible hairlines, monospace micro-labels, accent used only as line and glow.

The structural token system is already correct — nothing needs restructuring. This is a **values-only migration** in `packages/ui/src/theme/palettes.ts`, plus one addition to the typography type. Every screen picks it up for free.

Do this migration **first**, before any feature work. It is one file; the whole app moves at once.

---

## 1. Dark palette — replace `darkColors` in `palettes.ts`

```ts
const darkColors: SemanticColorPalette = {
  'color.background.primary': '#161826',
  'color.background.secondary': '#1B1D2E',
  'color.background.tertiary': '#232532',
  'color.background.elevated': '#181A29',

  'color.surface.primary': '#1B1D2E',
  'color.surface.secondary': '#232532',
  'color.surface.card': '#202234',
  'color.surface.dialog': '#232532',

  'color.text.primary': '#F3F5FE',
  'color.text.secondary': '#B2B6CA',
  'color.text.tertiary': '#888CA2',
  'color.text.disabled': '#595D6C',
  'color.text.inverse': '#161826',

  'color.border.default': 'rgba(233,233,237,0.08)',
  'color.border.focus': '#9184D9',
  'color.border.error': '#F87171',

  'color.status.success': '#6EE7A8',
  'color.status.warning': '#E9C46A',
  'color.status.error': '#F87171',
  'color.status.info': '#8FB4F5',

  'color.interactive.primary': '#E9E9ED',
  'color.interactive.secondary': '#B2B6CA',
  'color.interactive.disabled': '#595D6C',

  'color.accent.default': '#E9E9ED', // neutral stays monochrome
  'color.accent.muted': 'rgba(233,233,237,0.14)',
  'color.accent.onAccent': '#161826',

  'color.rarity.common': '#75798C',
  'color.rarity.uncommon': '#9397AB',
  'color.rarity.rare': '#B2B6CA',
  'color.rarity.epic': '#D2CEFD',
  'color.rarity.legendary': '#F3F5FE',

  'color.scrim.strong': 'rgba(22,24,38,0.86)',
  'color.scrim.soft': 'rgba(22,24,38,0.42)',
  'color.scrim.foreground': '#F3F5FE',
};
```

**The two changes that carry the whole look:**

- **`border.default` drops from `#3F3F46` to `rgba(233,233,237,0.08)`.** In the prototype a hairline is a whisper; structure is carried by _space_, not by drawn lines. This single value is the difference between "admin panel" and "premium". Expect the app to look emptier at first — that is correct; do not compensate by adding more borders.
- **Rarity goes tonal.** The current green/blue/purple/gold set reads as a status system. The prototype encodes rarity by **geometry** — a legendary plate is square with an ambient glow, a common one is a circle with a hairline — so the colour ramp only needs to get _brighter_ as it gets rarer. `RarityBadge` and `rarityColorToken` keep working; only the values change. Keep the shape logic in the component: `radius.sm` + `shadow.md` at legendary, `radius.full` + no shadow at common.

## 2. Light palette — replace `lightColors`

The prototype is dark-only, so this is a faithful inversion rather than a copy. Keep the same cool cast so both schemes feel like one product.

```ts
const lightColors: SemanticColorPalette = {
  'color.background.primary': '#FBFBFD',
  'color.background.secondary': '#F3F4F8',
  'color.background.tertiary': '#E9EAF1',
  'color.background.elevated': '#FFFFFF',

  'color.surface.primary': '#FFFFFF',
  'color.surface.secondary': '#F3F4F8',
  'color.surface.card': '#FFFFFF',
  'color.surface.dialog': '#FFFFFF',

  'color.text.primary': '#16182A',
  'color.text.secondary': '#4A4E63',
  'color.text.tertiary': '#66697A',
  'color.text.disabled': '#A5A8B8',
  'color.text.inverse': '#FBFBFD',

  'color.border.default': 'rgba(22,24,42,0.10)',
  'color.border.focus': '#6F5FD0',
  'color.border.error': '#DC2626',

  'color.status.success': '#15803D',
  'color.status.warning': '#A16207',
  'color.status.error': '#DC2626',
  'color.status.info': '#1D4ED8',

  'color.interactive.primary': '#16182A',
  'color.interactive.secondary': '#4A4E63',
  'color.interactive.disabled': '#A5A8B8',

  'color.accent.default': '#16182A',
  'color.accent.muted': 'rgba(22,24,42,0.12)',
  'color.accent.onAccent': '#FBFBFD',

  'color.rarity.common': '#8A8DA0',
  'color.rarity.uncommon': '#6C7085',
  'color.rarity.rare': '#4A4E63',
  'color.rarity.epic': '#6F5FD0',
  'color.rarity.legendary': '#16182A',

  'color.scrim.strong': 'rgba(22,24,42,0.82)',
  'color.scrim.soft': 'rgba(22,24,42,0.38)',
  'color.scrim.foreground': '#FBFBFD',
};
```

`color.scrim.foreground` stays light in both schemes — that invariant is already documented in `tokens.ts` and must not change.

**What "inversion" means here, precisely.** The light palette mirrors the dark one in _lightness_ with the hue held constant, and re-picks the semantic families per scheme. It is not a channel-wise RGB inversion, and must never become one: inverting `status.success` `#6EE7A8` gives a dark red, and inverting `rarity.epic` `#D2CEFD` gives olive. Neutral ramps flip; status, accent and rarity are chosen for each scheme against that scheme's background. Both palettes above already satisfy this.

**`color.text.tertiary` re-valued 2026-08-03** — dark `#75798C → #888CA2`, light `#75798C → #66697A`, hue preserved (~229–231° in both). The old value was **the same hex in both schemes**, the one slot where the mirror was broken: a single mid-grey cannot be the third step of a ramp descending from `#F3F5FE` and of one descending from `#16182A` at the same time. On its own background the old value scored 4.08:1 in dark and 4.17:1 in light — under WCAG AA for body text, on the token that carries timestamps, counts and every `role="meta"` line. The new pair scores **5.30:1 dark** and **5.25:1 light**. Dark `color.rarity.common` keeps `#75798C`; it shared the value by coincidence, not by rule.

## 3. Accent — `plasma` is the prototype's violet

The prototype's `#9184d9` is the `plasma` identity.

> **0.1 correction.** `plasma` **already exists** — it shipped in D3.27 as one of eight accents in `accentPalettes` (`palettes.ts:113`), currently `#A78BFA` dark / `#6D28D9` light. This section is a **re-valuation of an existing accent, not an addition.** Task 1.1's wording ("plus the `plasma` accent") reads as new work; it is not. Nothing structural changes and the other seven accents stay as they are.

Set its dark values to:

```ts
plasma: { default: '#9184D9', muted: 'rgba(145,132,217,0.16)', onAccent: '#141527' }
```

and its light values to `{ default: '#6F5FD0', muted: 'rgba(111,95,208,0.12)', onAccent: '#FFFFFF' }`.

**Usage rule, enforced in review:** accent appears only as **lines, rings, glows and text** — never as a filled block behind content. A filled accent button is the one exception (primary CTA), and even there the prototype prefers an outlined treatment. This is why the design still reads correctly on `neutral`, where the accent collapses to plain light grey. Any screen that becomes illegible on `neutral` has misused the accent.

## 4. Typography — two families, ten roles

> **Decided 2026-08-02.** §4 and §4b below were rewritten from the original handoff after the 0.1 audit surfaced three problems: the weight union could not express 300, no typeface was ever selected, and the role scale did not cover the redesign. All three are settled here. This is the spec task 1.2 implements.

### 4.0 The families

Both are shipped as **static files** committed to `apps/frontend/assets/fonts/`. No variable fonts — RN's `fontWeight` does not drive a variable axis on Android, so a variable file silently renders one weight everywhere.

|          | Family            | Weights       | Used by                                |
| -------- | ----------------- | ------------- | -------------------------------------- |
| **Sans** | **Geist**         | 300, 400, 500 | everything except the two `meta` roles |
| **Mono** | **IBM Plex Mono** | 400 only      | `meta`, `metaSm`                       |

**Why the sans is not optional.** `load-fonts.ts` registers nothing today, so the app falls back to whatever the platform provides — and weight 300 is not the same thing across platforms. Roboto Light is markedly lighter than SF Light, so a design whose entire hierarchy rests on "large, light, and quiet" renders differently on Android than on iOS. Shipping one family removes the variable. Geist is free (SIL OFL), and its figures and tight tracking are the closest free match to the prototype.

**Why IBM Plex Mono specifically.** GMRLog is a Turkish product: handles, community names and labels have to render `ğ ı ş İ ç ö ü` correctly, including the dotted/dotless capital-I pair. IBM Plex Mono ships full Latin Extended-A, so `İ` and `ı` are real glyphs rather than fallback substitutions from a second font — a substitution is immediately visible in monospace, where every glyph is on the same advance. Space Mono and JetBrains Mono, both suggested in the original handoff, have weaker Turkish coverage. Only weight 400 is needed because the mono roles are the only consumers and neither is ever emphasised.

**Files to commit** — exactly four:

```
apps/frontend/assets/fonts/
  Geist-Light.ttf          300
  Geist-Regular.ttf        400
  Geist-Medium.ttf         500
  IBMPlexMono-Regular.ttf  400
```

`expo-font ~13.0.4` is already a dependency, so nothing needs installing.

### 4.1 The type change

`TypographyStyle` currently has no font-family field, so this needs a small type change:

```ts
export interface TypographyStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '200' | '300' | '400' | '500'; // CORRECTED — see 0.1 note below
  letterSpacing: number;
  fontFamily?: string; // NEW — undefined means the app's sans
  textTransform?: 'uppercase'; // NEW — meta labels only
}
```

> **0.1 correction.** This snippet originally kept the current union `'400' | '500' | '600' | '700'` while the prose below mandates weight 300 (and 200 at display size). Those contradict: as originally written, task 1.2 would have produced a type that task 3.x cannot use. The union above is the corrected one. `200` is kept for headroom even though the ramp in §4b does not currently use it.

`load-fonts.ts` must become a real loader — it is a no-op stub today (`loadApplicationFonts()` awaits `Promise.resolve()`), and its comment about typefaces being deliberately unselected is now out of date. Then apply `fontFamily` and `textTransform` in `components/text.tsx`, which today spreads only `fontSize`, `lineHeight`, `fontWeight` and `letterSpacing`.

**Where the mono roles are used and where they are not:** `meta` and `metaSm` are for labels _about_ content — stat captions, ranks, timestamps, section kickers, platforms, the match token. Never body copy, never a name. Sentences stay in `body` / `bodySm`; names stay in `label` / `headline` / the title roles.

Weight discipline from the prototype: **300–500 only.** Large numbers are light (`300`), body is `400`, emphasis is `500`. Nothing is `600` or `700` — the prototype never shouts.

## 4b. The ten-step ramp

The 0.1 audit found that `SCREEN_REDESIGNS.md` asks for roughly nineteen distinct font sizes (9 · 9.5 · 10 · 11 · 11.5 · 12.5 · 13.5 · 14 · 14.5 · 15.5 · 16.5 · 19–21 · 23 · 32 · 38 · 40) against the seven roles that exist. Since the design law forbids inlining pixel sizes, the scale has to grow.

**But not to nineteen.** Those nineteen values are an artefact of the prototype being authored freehand with inline styles — the difference between 13.5 and 14, or 15.5 and 16.5, is drift, not intent. Reproducing it as nineteen tokens would encode someone's improvisation as a design system. **Round the redesign onto ten steps instead:**

| Role       | Size / weight | Family   | Tracking       | Used for                                        |
| ---------- | ------------- | -------- | -------------- | ----------------------------------------------- |
| `display`  | 40 / 300      | sans     | −1.5           | auth headlines, the large match percentage      |
| `title1`   | 32 / 300      | sans     | −1             | screen titles                                   |
| `title2`   | 25 / 300      | sans     | −0.5           | hero names, tournament titles                   |
| `title3`   | 21 / 400      | sans     | 0              | card titles, archetype                          |
| `headline` | 17 / 500      | sans     | 0              | game titles, section leads                      |
| `body`     | 15 / 400      | sans     | 0              | paragraphs                                      |
| `bodySm`   | 13 / 400      | sans     | 0              | row labels, secondary copy                      |
| `label`    | 12 / 500      | sans     | 0.1            | buttons, tabs                                   |
| `meta`     | 11 / 400      | **mono** | 0.55 (`.05em`) | inline metadata — counts, timestamps, platforms |
| `metaSm`   | 9 / 400       | **mono** | 1.26 (`.14em`) | section kickers, ranks, micro-labels            |

**Two mono roles, not one.** The original §4 specified a single `meta` at `.14em`. That tracking is right for a 9px kicker sitting alone above a section, and unreadable for 11px metadata inside a sentence-like row — the letters stop forming words. Splitting them is what makes "metadata is monospace" survive contact with real rows.

**Mapping rule for the redesign docs.** When `SCREEN_REDESIGNS.md` or `SCREEN_REDESIGNS_2.md` names a size, round it onto the ramp:

| Doc says       | Use                                                     |
| -------------- | ------------------------------------------------------- |
| 38, 40         | `display`                                               |
| 32             | `title1`                                                |
| 27, 25, 23     | `title2`                                                |
| 21, 20, 19     | `title3`                                                |
| 17, 16.5, 15.5 | `headline` (or `body` if it is a paragraph, not a name) |
| 15, 14.5       | `body`                                                  |
| 13.5, 13, 12.5 | `bodySm`                                                |
| 12, 11.5       | `label`                                                 |
| 11, 10         | `meta`                                                  |
| 9.5, 9         | `metaSm`                                                |

**If a screen genuinely cannot work on this ramp, stop and raise it — do not inline a size.** That is the whole point of having the ramp.

### What this replaces

The old roles `heading` (24/600), `title` (18/600) and `caption` (12/400) are **not** in the ramp. They have 122 usages across 91 files, so 1.2 keeps them as **deprecated aliases** rather than renaming every call site:

```
heading → title2 (25/300)   title → headline (17/500)   caption → bodySm (13/400)
```

Phase 3 recomposes every screen anyway; each of those commits swaps its own screen's old role names for the new ones. **Delete the three aliases when Phase 3b lands** — that is the removal condition, and 8.4 should verify the union is back to ten.

**Note the `meta` change is visible everywhere at once.** `meta` goes from 12px sans sentence-case to 11px mono uppercase, and it has many existing call sites that were written against the old meaning. Task 1.5's sweep is where that fallout gets caught; expect some current `meta` usages to want `bodySm` instead.

**Two related unit notes:**

- **`letterSpacing` is px in React Native, em in these docs.** Multiply by the size at authoring time; never store em. The ramp above is already converted — `metaSm` is `.14em × 9 = 1.26`, `meta` is `.05em × 11 = 0.55`, `title1` is `−0.03em × 32 ≈ −1`.
- **The 8pt space scale does not cover the redesign's padding either.** `SCREEN_REDESIGNS.md` uses 11, 15, 18, 22, 26, 34 and a `-74` overlap; `spaceScale` is 0/4/8/12/16/20/24/32/40/48/64/80/96. `README.md`'s token-mapping table claims `4 / 8 / 11 / 14 / 20 / 22px → space.1 … space.6`, but `space.1…6` is 4/8/12/16/20/24 — so 11→12, 14→16 and 22→24 are **silent roundings presented as mappings**. Round deliberately to the grid and say so, or add the steps; do not inline the odd values.

## 5. Radius and elevation

```ts
radiusScale = { none: 0, sm: 4, md: 8, lg: 11, xl: 14, '2xl': 18, full: 999 };
```

The prototype's cards are `11–14px`; chips and pills are `full`; **rarity plates are deliberately `sm`** so squareness reads as rank.

> **0.1 note.** Current scale is `sm:4 md:8 lg:12 xl:16 2xl:24 full:9999` — so `sm` and `md` are already correct and only `lg`/`xl`/`2xl` move. Keep `full` at **9999**, not the `999` written above; the change is meaningless at any real size and `9999` is what every existing pill already resolves to.

Elevation: the prototype uses almost no drop shadows. Depth comes from surface lightness and hairlines. Keep `shadow.sm`/`md` for dialogs and sheets, and reserve tinted glows for accent moments (legendary plates, ≥85% match rings). If a card currently has a shadow, remove it and let the surface do the work.

## 6. What to check after the swap

Before touching any feature code, run the app and walk these screens — the palette change alone will have altered every one:

1. **Home feed** — cards should feel like they float on the background, separated by space, not outlined.
2. **Game hub** — scrims over cover art; verify text stays legible with the new `scrim.strong`.
3. **Profile (self)** — `ProfilePremiumHero`, `ProfileStatsGrid`; the stat dividers will now be nearly invisible, which is intended.
4. **Achievements** — `RarityBadge` in every tier; confirm the tonal ramp still distinguishes tiers, and add the geometry rule if it does not.
5. **Settings** — the densest list surface; if hairlines now feel too faint here specifically, add `space` between groups rather than raising the border opacity globally.
6. **Light mode** on all five, and **`neutral` accent** on all five.

Anything that relied on `#3F3F46` being visible will surface immediately in this pass. Fix those by adding space or a surface change — never by darkening the border token back.
