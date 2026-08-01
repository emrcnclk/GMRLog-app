# GMRLOG — Sprint F1: Foundation & Signature Components

**Document:** `docs/02_DESIGN/SPRINT_F1_FOUNDATION.md`  
**Version:** 1.0  
**Status:** **LOCKED — Design Foundation**  
**Sprint:** F1 (Design Only)  
**Last Updated:** July 2026  
**Owner:** Lead Product Design / Design System Architecture  
**Classification:** Complete visual foundation for all future screens

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) (**SSOT**) |
| 3 | **This document** — F1 foundation detail |
| 4 | `DESIGN_TOKENS.md` · `COMPONENT_LIBRARY.md` · `DESIGN_SYSTEM.md` · `MOTION_GUIDELINES.md` · `ACCESSIBILITY.md` |

This sprint is **DESIGN ONLY**. No screens. No code. No React Native.  
When F1 is complete, every future screen must be buildable **only** from this system. Inventing a new component for a screen means F1 failed — amend this doc first.

**Quality bar:** Apple · Linear · Spotify · Arc · Discord — custom for GMRLOG, never generic UI kits.

**Filters:** North Star Question · *Does this make GMRLOG more recognizable?*

---

## Deliverable map

| § | Deliverable |
|---|-------------|
| 1 | Foundation |
| 2 | Design Tokens |
| 3 | Typography |
| 4 | Color System |
| 5 | Spacing System |
| 6 | Motion System |
| 7 | Component Library |
| 8 | Signature Components |
| 9 | Responsive Rules |
| 10 | Accessibility |
| 11 | Design Audit Checklist |

---

# 1. Foundation

## 1.1 Purpose

F1 establishes the **visual operating system** of GMRLOG: surfaces, type, space, motion, and reusable components — including eight **signature** organisms that make a screenshot instantly readable as GMRLOG.

## 1.2 Visual language

**Story Ember** (Master): late-night cinematic dark, warm ember accents (less than 8% of screen), quiet premium, six equal pillars.

## 1.3 Surface hierarchy (OLED)

| Level | Token | HEX | Role |
|-------|-------|-----|------|
| Canvas | `surface.0` / `bg.base` | `#0E0F12` | App background — never pure black |
| Subtle | `surface.1` | `#14161B` | Alternating sections |
| Base card | `surface.2` | `#1A1C22` | Default cards, lists |
| Raised | `surface.3` | `#22252D` | Inputs, elevated cards, ledger band |
| Overlay chrome | `surface.4` | `#2A2E38` | Sheets, menus |
| Peak | `surface.5` | `#343944` | Toast, popover, critical chrome |

Borders separate more than shadows. OLED: prefer hairline `border.subtle` over large soft shadows.

## 1.4 Grid

- **Base unit:** 4pt  
- **Layout grid:** 8pt (all spacing tokens except fine 4pt)  
- **Mobile columns:** single content column; gutter `space.4` (16)  
- **Alignment:** all edges snap to 4pt; text baselines consistent within a row  

## 1.5 Iconography

| Property | Value |
|----------|-------|
| Style | Outline, rounded joins |
| Default size | 24 |
| Action row | 20 |
| Meta / badge | 16 |
| Nav | 24 |
| Stroke | 1.5–2px constant |
| Color | `icon.primary` / `icon.secondary` / `icon.tertiary` / `icon.onBrand` |
| Filled | Only selected tab / active like / selected segment |

No childish gaming icons. No neon icon treatments.

## 1.6 Borders

| Token | Value | Use |
|-------|-------|-----|
| `border.width.hairline` | 1 | Default |
| `border.width.thick` | 2 | Focus ring outer / ember rail |
| `border.subtle` | `#2C303A` | Card edges, dividers |
| `border.default` | `#3A4050` | Inputs |
| `border.strong` | `#525A6B` | Active / hover outline |
| `border.focus` | `interactive.focus` | Focus ring |
| `border.error` | `danger.border` | Invalid |

## 1.7 Shadows (subtle)

| Token | Value | Use |
|-------|-------|-----|
| `shadow.none` | — | Feed cards default |
| `shadow.sm` | `0 1px 2px rgba(0,0,0,0.24)` | Raised controls |
| `shadow.md` | `0 4px 12px rgba(0,0,0,0.32)` | Menus, sheets |
| `shadow.lg` | `0 8px 24px rgba(0,0,0,0.40)` | Rare; dialogs |

No glow. No colored shadows.

## 1.8 Blur

| Token | Radius | Use |
|-------|--------|-----|
| `blur.none` | 0 | Default |
| `blur.sm` | 8 | Light glass |
| `blur.md` | 16 | Cover Ember Badge, optional tab bar |
| `blur.lg` | 24 | Rare sheet glass |

Glass **only where meaningful** — not everywhere.

## 1.9 Dark Mode / OLED

- Dark Mode First.  
- `surface.0` = `#0E0F12` (warm-neutral dark, not blue-grey corporate).  
- Large black letterboxing avoided; use `surface.0` full bleed.  
- Large pure-white fills forbidden; text `text.primary` on dark.  
- Light theme: semantic remap later; F1 locks dark.

---

# 2. Design Tokens

## 2.1 Hierarchy

```
Primitive → Semantic → Component → Theme(dark) → Screen
```

Components **never** reference primitive HEX directly — only semantic / component tokens.

## 2.2 Naming

`category.property.variant`  
Examples: `color.text.primary`, `space.4`, `radius.md`, `motion.duration.normal`, `font.body.md`

## 2.3 Token categories (complete set)

| Category | Tokens |
|----------|--------|
| Color | See §4 |
| Font | See §3 |
| Space | See §5 |
| Radius | `none` `sm` `md` `lg` `xl` `2xl` `full` |
| Shadow | `none` `sm` `md` `lg` |
| Blur | `none` `sm` `md` `lg` |
| Motion | See §6 |
| Icon size | `12` `16` `20` `24` `28` `32` `40` `48` |
| Avatar size | `xs` `sm` `md` `lg` `xl` `2xl` |
| Z-index | `content` `sticky` `tabBar` `sheet` `dialog` `toast` |
| Opacity | `disabled` `scrim` `overlay` `hover` |
| Breakpoint | `mobile` `tablet` `desktop` `large-desktop` `foldable` |

## 2.4 Radius values

| Token | px |
|-------|-----|
| `radius.none` | 0 |
| `radius.sm` | 8 |
| `radius.md` | 12 |
| `radius.lg` | 16 |
| `radius.xl` | 24 |
| `radius.2xl` | 32 |
| `radius.full` | 9999 |

## 2.5 Z-index

| Token | Value |
|-------|-------|
| `z.content` | 0 |
| `z.sticky` | 10 |
| `z.tabBar` | 20 |
| `z.sheet` | 30 |
| `z.dialog` | 40 |
| `z.toast` | 50 |

## 2.6 Opacity

| Token | Value |
|-------|-------|
| `opacity.disabled` | 0.4 |
| `opacity.hover` | 0.92 |
| `opacity.pressed` | 0.88 |
| `opacity.scrim` | 0.56 |
| `opacity.overlay` | 0.72 |
| `opacity.mediaScrim` | 0.45 (cover bottom gradient max) |

---

# 3. Typography

## 3.1 Families

| Role | Font | Token |
|------|------|-------|
| UI / Body | Inter (fallback: SF Pro / Roboto) | `font.family.sans` |
| Display | Satoshi or Geist | `font.family.display` |
| Mono | JetBrains Mono / SF Mono | `font.family.mono` |

## 3.2 Scale (mobile default)

| Token | Size | Weight | Line | Tracking | Usage |
|-------|------|--------|------|----------|-------|
| `font.display.xl` | 40 | Semibold (600) | 48 | −1% | Brand splash, rare heroes |
| `font.display.lg` | 34 | Semibold | 40 | −1% | Game hero title, major identity |
| `font.heading.xl` | 28 | Semibold | 34 | −0.5% | Profile name (`display.md` Master map) |
| `font.heading.lg` | 22 | Semibold | 28 | −0.5% | Section titles |
| `font.heading.md` | 18 | Semibold | 24 | 0 | Card titles, sheet titles |
| `font.title` | 16 | Semibold | 22 | 0 | List headers, nav titles |
| `font.body.lg` | 17 | Regular (400) | 26 | 0 | **Reviews / long reading** |
| `font.body.md` | 15 | Regular | 22 | 0 | **Posts / default body** |
| `font.body.sm` | 13 | Regular | 18 | 0 | Meta, secondary paragraphs |
| `font.label.lg` | 15 | Medium (500) | 20 | 0 | Large buttons |
| `font.label.md` | 13 | Medium | 16 | 0 | Buttons, chips, tabs |
| `font.label.sm` | 11 | Medium | 14 | +1% | Badges, overlines |
| `font.caption` | 11 | Regular | 14 | 0 | Timestamps, hints |
| `font.mono` | 13 | Regular | 18 | 0 | Playtime, scores, IDs |
| `font.stat` | 24 | Semibold | 28 | −1% | Profile primary stats |
| `font.editorial.lg` | 18 | Regular | 28 | 0 | Future articles (reserved) |

## 3.3 Weight tokens

`font.weight.regular` 400 · `medium` 500 · `semibold` 600 · `bold` 700  

(Thin/Light unused in product UI.)

## 3.4 Rules

- Hierarchy: **Size → Weight → Color**.  
- Posts: `body.md`. Reviews: `body.lg`.  
- Never use Display fonts for body.  
- Dynamic Type: scales; layouts must not clip (see §10).

---

# 4. Color System

## 4.1 Primitive brand (reference only — not used in components)

| Primitive | HEX |
|-----------|-----|
| `primitive.ember.400` | `#FF8B4A` |
| `primitive.ember.500` | `#F0732E` |
| `primitive.ember.600` | `#D45F1F` |
| `primitive.purple.400` | `#7A56B0` |
| `primitive.purple.500` | `#5B3A8C` |
| `primitive.blue.400` | `#6BA4FF` |
| `primitive.blue.500` | `#3D8BFF` |
| `primitive.emerald` | `#2FBF7A` |
| `primitive.amber` | `#E5A832` |
| `primitive.softRed` | `#E05B5B` |

## 4.2 Semantic — Brand & status

| Token | Value | Use |
|-------|-------|-----|
| `color.primary` | ember.500 | CTA fill, stars fill, selected, progress, Ember Rail |
| `color.primary.hovered` | ember.400 | Hover (pointer) |
| `color.primary.pressed` | ember.600 | Pressed |
| `color.primary.on` | `#0E0F12` | Text/icon on primary |
| `color.secondary` | purple.500 | Identity / creator / premium soft |
| `color.secondary.muted` | purple.500 @ 16% | Soft identity wash |
| `color.interactive` | blue.400 | Links, focus, unread |
| `color.interactive.strong` | blue.500 | Strong interactive |
| `color.success` | emerald | Success |
| `color.success.muted` | emerald @ 16% | Success wash |
| `color.warning` | amber | Spoiler, caution |
| `color.warning.muted` | amber @ 16% | Spoiler wash |
| `color.danger` | softRed | Error / destructive |
| `color.danger.muted` | softRed @ 16% | Danger wash |
| `color.info` | blue.500 | Informational (non-link) |

## 4.3 Semantic — Surfaces & chrome

| Token | Maps to |
|-------|---------|
| `color.surface.0` … `5` | §1.3 |
| `color.border.subtle` / `default` / `strong` | §1.6 |
| `color.overlay` | black @ `opacity.overlay` |
| `color.scrim` | black @ `opacity.scrim` |

## 4.4 Semantic — Text & icon

| Token | HEX |
|-------|-----|
| `color.text.primary` | `#F2F3F5` |
| `color.text.secondary` | `#A8AEB8` |
| `color.text.tertiary` | `#6F7683` |
| `color.text.disabled` | `#4A505C` |
| `color.text.link` | `color.interactive` |
| `color.text.onPrimary` | `color.primary.on` |
| `color.icon.primary` | `#F2F3F5` |
| `color.icon.secondary` | `#A8AEB8` |
| `color.icon.tertiary` | `#6F7683` |
| `color.icon.disabled` | `#4A505C` |
| `color.icon.onPrimary` | `#0E0F12` |

## 4.5 Semantic — Interactive & disabled

| Token | Use |
|-------|-----|
| `color.interactive.focus` | Focus ring (blue.400) |
| `color.interactive.pressed.bg` | surface.3 |
| `color.disabled.bg` | surface.2 |
| `color.disabled.border` | border.subtle |
| `color.disabled.text` | text.disabled |

## 4.6 Discipline

- Accents **less than 8%** of visible screen.  
- Orange = action/story · Purple = identity · Blue = system interaction.  
- Never Orange + Purple + Blue fills on one component.  
- Accessibility: contrast pairs verified (§10).

---

# 5. Spacing System

| Token | px | Usage |
|-------|-----|--------|
| `space.1` | 4 | Icon gaps, hairline padding adjust |
| `space.2` | 8 | Compact inline; feed activity gaps |
| `space.3` | 12 | Chip padding; compact card pad |
| `space.4` | 16 | **Default** screen gutter, card padding |
| `space.5` | 20 | Featured breath (tight) |
| `space.6` | 24 | Section gaps; sheet padding large |
| `space.8` | 32 | Major section separation |
| `space.10` | 40 | Profile header blocks |
| `space.12` | 48 | Hero vertical rhythm |
| `space.16` | 64 | Page-level separation |
| `space.20` | 80 | Rare marketing / empty state |
| `space.24` | 96 | Extreme empty / onboarding |
| `space.32` | 128 | Desktop-only large rhythm |

**Rules:** No arbitrary values. Stack vertically with consistent tokens. Hit targets ≥ 44 (prefer 48) including padding.

---

# 6. Motion System

## 6.1 Principles

Fast, elegant, purposeful. **No bounce. No overshoot. No flashy easing.**  
Core product motion: **180–250ms**.

## 6.2 Duration tokens

| Token | ms | Use |
|-------|-----|-----|
| `motion.duration.fast` | 120 | Micro opacity |
| `motion.duration.press` | 180 | Buttons, toggles |
| `motion.duration.normal` | 200 | Likes, cards, chips |
| `motion.duration.slow` | 250 | Tabs, toast enter |
| `motion.duration.feed` | 220 | Feed insert |
| `motion.duration.list` | 200 | List reorder / highlight |
| `motion.duration.page` | 300 | Stack push/pop |
| `motion.duration.modal` | 320 | Dialog |
| `motion.duration.sheet` | 340 | Bottom sheet |
| `motion.duration.hero` | 360 | Hero image / shared element (rare) |

## 6.3 Easing tokens

| Token | Curve | Use |
|-------|-------|-----|
| `motion.easing.standard` | cubic-bezier(0.2, 0.0, 0, 1) | Default |
| `motion.easing.emphasized` | cubic-bezier(0.2, 0.0, 0, 1) | Page / modal |
| `motion.easing.exit` | cubic-bezier(0.3, 0, 1, 1) | Dismiss |

**Forbidden:** spring bounce, elastic, bounce keyframes.

## 6.4 Semantic motion presets

| Preset | Duration | Transform | Notes |
|--------|----------|-----------|-------|
| `motion.press` | press | scale 0.98 | Buttons |
| `motion.cardPress` | normal | scale 0.985 | Cards |
| `motion.like` | normal | icon fill | No particles |
| `motion.feedInsert` | feed | opacity + translateY 4 | |
| `motion.page` | page | shared axis | |
| `motion.modal` | modal | fade + scale 0.98→1 | |
| `motion.sheet` | sheet | translateY | |
| `motion.hero` | hero | opacity / clip | Rare |
| `motion.list` | list | opacity | |

`prefers-reduced-motion`: opacity only or instant.

---

# 7. Component Library

Every component below is **approved for composition**. Screens in F2+ may only use these (plus signatures in §8). Spec format is mandatory.

**Global a11y defaults (all components):** touch ≥ 44×44; contrast AA; labels for icons; focus ring `color.interactive.focus` 2px offset 2; honor reduced motion.

**Global motion defaults:** `motion.press` / `motion.cardPress` as applicable.

---

## 7.1 Buttons

### Button / Primary

| Field | Spec |
|-------|------|
| **Purpose** | Primary CTA (ember) |
| **Variants** | `sm` `md` `lg`; `fullWidth` |
| **States** | default, pressed, disabled, loading |
| **Sizing** | sm h32 · md h44 · lg h52; pad x `space.4`/`space.5` |
| **Radius** | `radius.md` |
| **Elevation** | none (fill carries weight) |
| **Typography** | `label.md` / lg→`label.lg` |
| **Color** | bg `primary` · text `primary.on` · disabled `disabled.*` |
| **Motion** | `motion.press` |
| **A11y** | role button; loading announces busy |
| **Usage** | Save log, Publish, Follow (primary contexts) |

### Button / Secondary

bg `surface.3` · border `border.default` · text `text.primary` · same sizes.

### Button / Ghost

bg transparent · text `text.secondary` · pressed `surface.2`.

### Button / Danger

bg `danger.muted` · text `danger` · or outline `danger` — never ember.

### Button / Icon

44×44 hit · icon 20/24 · ghost or secondary surface.

### Button / FAB

56×56 · `radius.full` · bg `primary` · icon `onPrimary` · elevation `shadow.md` · `z` above content · single compose action.

---

## 7.2 Inputs

### TextField

| Field | Spec |
|-------|------|
| **Purpose** | Single-line text |
| **Variants** | default, error, success |
| **States** | empty, filled, focused, disabled, readOnly |
| **Sizing** | h48 · pad `space.3`/`space.4` |
| **Radius** | `radius.md` |
| **Elevation** | none |
| **Typography** | `body.md` · label `label.md` · helper `caption` |
| **Color** | bg `surface.3` · border `border.default` · focus `interactive.focus` · error `danger` |
| **Motion** | border 180ms |
| **A11y** | labelledby; error linked |
| **Usage** | Forms, profile edit |

### SearchField

h48 · leading search icon 20 · clear trailing · bg `surface.3` · radius `radius.lg` · cancel ghost on focus (iOS pattern).

### PasswordField

TextField + reveal toggle (icon button) · secure by default.

### OTPField

Segmented cells · mono · auto-advance · paste support · 44 min cell.

### Dropdown / Select

Closed: TextField affordance · Open: menu `surface.4` + `shadow.md` · items h48.

### Checkbox · Radio

24 control + label · selected fill `primary` · hit 44.

### Switch

Track 52×32 · thumb 28 · on=`primary` · off=`surface.4` · motion 180ms.

### Slider / RatingSlider

Track 4px · thumb 20 · active `primary` · for 0–10 or star mapping.

---

## 7.3 Cards (non-signature base + domain)

Base **Card** atom: bg `surface.2` · border `border.subtle` · radius `radius.md` · pad `space.4` · elevation none in feed.

Domain cards (compose signatures / atoms):

| Card | Notes |
|------|-------|
| **Activity Card** | See §8.7 |
| **Recommendation Card** | Game Card featured + reason line `caption` |
| **Comment Card** | Avatar sm · `body.md` · actions row |
| **Notification Card** | Actor · verb · object · time |
| **Discussion Card** | Title `title` · community chip · reply count |
| **Achievement Card** | Icon · title · thin progress |
| **Message Bubble** | In/out surfaces · radius `lg` asymmetric |

Collection Card / Tier Card → prefer **Collection Shelf** / **Tier List Card** signatures (§8).

---

## 7.4 Containers & feedback

### Bottom Sheet

`surface.4` · radius top `radius.xl` · handle 32×4 · scrim · `motion.sheet` · swipe dismiss · `z.sheet`.

### Modal / Dialog

Max width mobile 100%−32 · desktop tokenized · `surface.4` · radius `radius.lg` · `shadow.md` · scrim · title `heading.md` · actions Primary+Ghost.

### Toast

`surface.5` · radius `radius.md` · pad `space.3`/`space.4` · auto-dismiss 3–5s · `z.toast` · slide+fade `motion.duration.slow`.

### Snackbar

Toast + optional action Ghost · bottom inset above tab bar.

### Tabs

Underline indicator `primary` 2px · `label.md` · selected `text.primary` · unselected `text.tertiary` · `motion` 220ms.

### Segmented Control

Container `surface.3` · active segment `surface.5` or soft primary wash · radius `radius.md` · h40.

---

## 7.5 Navigation

### Bottom Navigation

5 items (**F2.1 LOCKED**): Home · Discover · Library · Notifications · Profile · h56 + safe area · `surface.0`/`blur.md` optional · active icon filled + `primary` · label `label.sm`.  
Composer is **not** a tab — Home FAB + contextual create (see F2.1).

### Top Navigation / Stack Header

h56 · title `title` · back icon button · trailing actions max 2.

### Navigation Rail (future)

Desktop-ready shell: 72–80 width · same destinations · **not required for mobile F2** · token + component reserved.

---

## 7.6 Profile atoms

| Component | Spec summary |
|-----------|----------------|
| **Avatar** | xs24 sm32 md40 lg56 xl72 2xl96 · `radius.full` · status ring 2 · verified badge |
| **Identity Chip** | h28 · radius `full` · `label.sm` · purple muted for Premium/Creator · neutral otherwise |
| **Completion Arc** | §8.6 |
| **Achievement Badge** | 40–48 · icon + optional rarity stroke subtle |
| **Rating Badge** | Cover Ember Badge §8.1 / standalone pill |
| **Spoiler Badge** | Outline amber · `label.sm` · “Spoiler” |
| **Platform Badge** | 14–16 icon · tertiary · max 3 +N |

---

## 7.7 Media

| Component | Spec |
|-----------|------|
| **Image** | Progressive · placeholder `surface.3` · radius inherited |
| **Cover** | Game aspect 2:3 or 16:9 hero · center crop · bottom scrim token |
| **Carousel** | Page dots tertiary · snap · reduced motion = buttons |
| **Gallery** | Grid gap `space.2` · radius `radius.sm` |

---

## 7.8 Loading & empty

| Component | Spec |
|-----------|------|
| **Skeleton** | `surface.3` pulse opacity 0.4↔0.7 · 1200ms · respect reduced motion (static) |
| **Empty State** | Icon 48 tertiary · `heading.md` · `body.sm` · optional Secondary CTA |
| **Error State** | Same + danger icon · Retry Primary |
| **Infinite Loader** | 24 spinner · `primary` stroke · foot of lists |
| **Pagination** | Desktop-ready; mobile prefers infinite · buttons Secondary |

---

## 7.9 Completeness gate

If F2+ needs a control not listed in §7–§8, **stop** → amend F1 → then implement.

---

# 8. Signature Components

Spend maximum craft here. These are GMRLOG’s recognizability set.

---

## 8.1 Game Card

| Field | Spec |
|-------|------|
| **Purpose** | Cinematic library/discovery unit; premium ownership feel |
| **Pillar** | Library · Discovery |
| **Variants** | `compact` `standard` `featured` `horizontal` `grid` |
| **States** | default, pressed, disabled (unavailable), loading (skeleton) |
| **Anatomy** | Cover (72–78% height) → Cover Ember Badge (rating) → Meta band (title, meta, platforms) → optional Completion Arc ownership |
| **Sizing** | Standard grid: width flexible; cover aspect **2:3**; meta band 22–28% of card height · Featured: wider, same ratios |
| **Spacing** | Meta pad `space.3` · badge inset `space.2` from cover edges |
| **Radius** | Card `radius.md` · cover top matches · meta bottom matches · badge `radius.sm` |
| **Elevation** | Feed: none + `border.subtle` · Featured optional `shadow.sm` |
| **Typography** | Title `title` 1 line · Meta `caption` · Rating in badge `label.sm` / `mono` |
| **Color** | Surface `surface.2` · badge glass `surface.5` @ 60% + `blur.md` · stars/rating `primary` · platforms `icon.tertiary` |
| **Motion** | `motion.cardPress` |
| **A11y** | Label: “{title}, rating {n}”; ownership state announced |
| **Responsive** | Mobile 2-col grid gap `space.3` · Tablet 3–4 · Desktop 5–6; same card, more columns |
| **Usage** | Library grids, search results, recommendations, shelf items |

**Recognizability:** Large cover + in-art ember rating badge + tight meta band.

---

## 8.2 Review Card

| Field | Spec |
|-------|------|
| **Purpose** | Collectible logging review — heart of logging pillar, not app center |
| **Pillar** | Logging |
| **Variants** | `feed` `compact` `detail-preview` |
| **States** | default, pressed, spoiler-hidden, spoiler-revealed |
| **Anatomy** | **Ember Rail** 2px `primary` · **Ledger Band** (mini cover 40 · ★★★★★ · Spoiler Badge · playtime `mono` · completion) · Body `body.lg` 3–6 lines · Footer (Avatar sm · name · date · like · comment · helpful) |
| **Sizing** | Full width − gutters · Ledger height 48–56 fixed · Rail width 2 |
| **Spacing** | Pad `space.4` · band internal `space.2`/`space.3` · body top `space.3` |
| **Radius** | Card `radius.md` · mini cover `radius.sm` · spoiler `radius.sm` |
| **Elevation** | none + border subtle |
| **Typography** | Stars as icon row · body `body.lg` · meta `caption` · counts `label.sm` |
| **Color** | Card `surface.2` · Ledger `surface.3` · stars `primary` · spoiler `warning` outline · rail `primary` |
| **Motion** | `motion.cardPress` · spoiler reveal fade 200ms |
| **A11y** | Spoiler state; rating value; “Helpful {n}” |
| **Responsive** | Body max measure ~68ch on desktop; card still single column in feed |
| **Usage** | Activity feed, game page, profile logging tab |

**Recognizability:** Ember Rail + Ledger Band + stars.

---

## 8.3 Post Card

| Field | Spec |
|-------|------|
| **Purpose** | Typography-first social micro-content |
| **Pillar** | Social |
| **Variants** | `text` `text+media` `with-game-ref` |
| **States** | default, pressed |
| **Anatomy** | Author row · body · optional media · optional game ref inset · action row |
| **Sizing** | Full width · media max height 180–220 · **no Ember Rail** (differentiates from review/log) |
| **Spacing** | Pad `space.4` · vertical rhythm `space.3` |
| **Radius** | `radius.md` · media `radius.md` |
| **Elevation** | none |
| **Typography** | Body `body.md` · author `label.md` · time `caption` |
| **Color** | `surface.2` · link `interactive` · actions `icon.secondary` |
| **Motion** | `motion.cardPress` · like `motion.like` |
| **A11y** | Author, time, media alt |
| **Responsive** | Media scales down; body measure on desktop |
| **Usage** | Feed, profile posts, permalink preview |

**Recognizability:** Quiet type-first card without ember rail.

---

## 8.4 Collection Shelf

| Field | Spec |
|-------|------|
| **Purpose** | Physical game-shelf metaphor for collections |
| **Pillar** | Library |
| **Variants** | `preview` (feed) `row` (profile) `hero` |
| **States** | default, pressed |
| **Anatomy** | Shelf plank (contact shadow) · 3–7 standing covers with 8pt overlap · title · count pill · owner |
| **Sizing** | Preview height ~120–160 · cover width ~56–72 standing |
| **Spacing** | Overlap `space.2` · pad `space.4` |
| **Radius** | Covers `radius.sm` · shelf container `radius.md` |
| **Elevation** | Soft contact `shadow.sm` under covers only |
| **Typography** | Title `title` · count `label.sm` |
| **Color** | Plank `surface.3` · count pill `surface.5` |
| **Motion** | `motion.cardPress` |
| **A11y** | “Collection {title}, {n} games” |
| **Responsive** | More covers visible on tablet/desktop; same metaphor |
| **Usage** | Feed, profile, game “appears in” |

**Recognizability:** Standing covers on a plank — not a flat mosaic grid.

---

## 8.5 Tier List Card

| Field | Spec |
|-------|------|
| **Purpose** | Native tier canvas preview (not a screenshot editor) |
| **Pillar** | Identity · Social |
| **Variants** | `compact` `expanded` |
| **States** | default, pressed |
| **Anatomy** | Title · author · rows S–D (custom labels OK) · game thumbs in rows · S-tier **ember underline** only |
| **Sizing** | Compact: show top 3 tiers clipped · row h40–48 |
| **Spacing** | Row gap `space.1` · pad `space.3` |
| **Radius** | Container `radius.md` · thumbs `radius.sm` |
| **Elevation** | none |
| **Typography** | Tier letter `label.md` · title `title` |
| **Color** | Rows alternating `surface.2`/`surface.3` · S underline `primary` |
| **Motion** | `motion.cardPress` |
| **A11y** | Tier name + game names list |
| **Responsive** | Expanded uses width; drag editor is full screen later |
| **Usage** | Feed, profile, game mentions |

---

## 8.6 Completion Arc

| Field | Spec |
|-------|------|
| **Purpose** | Signature progress / completion identity mark |
| **Pillar** | Identity · Logging · Library |
| **Variants** | `xs` `sm` `md` `lg` (24 / 32 / 40 / 56 ring outer) |
| **States** | 0–100%, indeterminate (rare) |
| **Anatomy** | Track stroke 3–4 · value stroke `primary` · optional center content (avatar, %, icon) |
| **Sizing** | Ring sits outside avatar or standalone |
| **Color** | Track `border.default` · value `primary` · center per context |
| **Motion** | Value animates `motion.duration.slow` ease-out on change |
| **A11y** | “Completion {n} percent” |
| **Usage** | Profile header, owned game, favorites strip, stats |

**Recognizability:** Thin ember arc — not a thick pie chart.

---

## 8.7 Activity Card

| Field | Spec |
|-------|------|
| **Purpose** | Friend / network activity — keeps Home alive without noise |
| **Pillar** | Social · Discovery · Logging |
| **Variants** | `playing` `completed` `posted` `reviewed` `shelved` `tiered` `achieved` |
| **States** | default, pressed |
| **Anatomy** | Avatar · verb phrase `body.sm` · object thumb · time `caption` · optional Ember Rail if logging verb |
| **Sizing** | Compact height ~64–72 |
| **Spacing** | Pad `space.3`/`space.4` · gap `space.2` |
| **Radius** | `radius.md` |
| **Elevation** | none |
| **Typography** | Verb `body.sm` · emphasis name `label.md` |
| **Color** | `surface.2` · rail if log/review |
| **Motion** | `motion.cardPress` |
| **A11y** | Full sentence label |
| **Usage** | Feed rhythm starter rows |

---

## 8.8 Gamer Identity Header

| Field | Spec |
|-------|------|
| **Purpose** | Answers “What kind of gamer?” — profile signature |
| **Pillar** | Identity · Creator Economy ready |
| **Variants** | `self` `other` · `compact` (nested) |
| **States** | loading, default |
| **Anatomy** | Banner (`surface.1` or art + scrim) · Avatar `xl`/`2xl` + optional Completion Arc · Name `heading.xl` · Identity Chips · Bio `body.sm` 2 lines · Stat row (1 primary `stat` + 2 secondary) · Favorite games strip (covers + arcs) · Actions (Follow Primary / Message Secondary) |
| **Sizing** | Banner h120–160 mobile · avatar overlap −24 |
| **Spacing** | Pad `space.4` · stats gap `space.6` · strip gap `space.2` |
| **Radius** | Banner bottom none (edge-to-edge) · chips `full` |
| **Elevation** | none |
| **Typography** | As anatomy |
| **Color** | Creator/Premium chip `secondary.muted` · stats `text.primary`/`tertiary` |
| **Motion** | Follow button `motion.press` |
| **A11y** | Name heading · stats as list · favorites as list |
| **Responsive** | Desktop: wider banner, stats inline, strip shows more covers — same components |
| **Usage** | Profile tops only (organism); do not fork per screen |

**Recognizability:** Arc + favorites strip + taste chips — not a review-count hero.

---

## 8.9 Signature set rules

1. Equal craft investment across all eight (Reviews do not outshine Shelf/Timeline-adjacent Activity).  
2. Ember Rail only on **story/log** surfaces (Review, logging Activity) — never Posts.  
3. No new signature without Master amendment.  
4. GameLog Timeline (Master) composes: vertical list of Activity-like nodes + Ember Rail — use Activity Card patterns + divider atoms in F2 screens; **Timeline organism** = composition of Completion Arc + Activity rows + Rail (approved composition, not a ninth one-off visual language).

### GameLog Timeline (composition spec)

| Field | Spec |
|-------|------|
| **Purpose** | Journey spine on Profile / Game Page |
| **Composition** | Vertical rail + node dots + session/status/review rows (Activity Card DNA) |
| **Not a separate brand language** | Same tokens as Activity + Completion Arc |

---

# 9. Responsive Rules

## 9.1 Principle

**Mobile-first.** Adapt **layout**, never redesign meaning, pillars, or signatures (Master §1.7).

## 9.2 Breakpoints

| Token | Intent | Layout notes |
|-------|--------|--------------|
| `breakpoint.mobile` | Default | 1-col feed; bottom nav; gutters 16 |
| `breakpoint.tablet` | Wider | 2-pane optional (list/detail); shelves show more covers; grid +1 col |
| `breakpoint.desktop` | Large | Max content width token; optional nav rail (future); multi-col library |
| `breakpoint.large-desktop` | XL | Magazine breath; wider measure for `body.lg` |
| `breakpoint.foldable` | Continuity | Avoid hinge dead zone; same components |

Exact px in implementation tokens; F1 locks **behavior**.

## 9.3 Scaling rules

| Element | Adaptation |
|---------|------------|
| Signatures | Same anatomy; width/columns change |
| Type | Slight step-up optional on desktop for Display only; body measure capped |
| Spacing | Gutters → `space.6` on desktop edges |
| Navigation | Bottom tabs mobile → rail/top later; **same destinations** |
| Pointer | Hover = border/elevation nudge; never required |
| Touch | Targets remain ≥44 even on desktop |

## 9.4 Forbidden

- Desktop-only workflows  
- Platform-forked components  
- Different brand colors per breakpoint  

---

# 10. Accessibility

## 10.1 Requirements (every component)

| Area | Rule |
|------|------|
| **Touch** | ≥ 44×44 (prefer 48) |
| **Contrast** | Text 4.5:1; large 3:1; UI 3:1 |
| **Dynamic Type** | Layout reflows; no clipped primary actions |
| **Screen reader** | name, role, state, value; spoiler states; ratings; % arcs |
| **Keyboard / focus** | Visible focus ring `interactive.focus`; logical order |
| **Motion** | `prefers-reduced-motion` honored |
| **Color** | Not sole indicator (success = icon + text) |

## 10.2 Critical pairs (dark)

| Foreground | Background | Status |
|------------|------------|--------|
| `text.primary` | `surface.0`–`2` | Pass |
| `text.secondary` | `surface.0`–`2` | Pass |
| `primary.on` | `primary` | Pass |
| `text.link` | `surface.2` | Pass |
| Stars `primary` on cover | Ensure badge glass behind | Pass |

## 10.3 Signature-specific

- Spoiler Badge + hidden body announced.  
- Completion Arc percentage announced.  
- Shelf: collection name + count.  
- Tier: tier labels + game names.  

Detail reference: `ACCESSIBILITY.md`.

---

# 11. Design Audit Checklist

Before approving any F1 component or F2 screen composition:

### Brand & SSOT

- [ ] Follows Master Product & Design Direction  
- [ ] Recognizability: feels unique to GMRLOG  
- [ ] Does not make Reviews the center of the product  
- [ ] Accent colors less than 8% of screen  
- [ ] No RGB, glow, neon, oversized gradients, glass-everywhere  

### System

- [ ] Only semantic tokens (no raw HEX in components)  
- [ ] 8pt spacing (4pt only as defined)  
- [ ] Radius from scale  
- [ ] Elevation from scale  
- [ ] Typography from scale + correct usage  
- [ ] Motion 180–250ms core; no bounce  

### Component

- [ ] Purpose / variants / states / sizing fully specified  
- [ ] Reusable in ≥2 contexts  
- [ ] Would meet Apple/Linear quality bar  
- [ ] A11y: touch, contrast, SR, focus, reduced motion  
- [ ] Responsive: layout adapts, meaning unchanged  

### Signatures

- [ ] Game Card: cinematic cover + ember rating badge  
- [ ] Review Card: rail + ledger  
- [ ] Post Card: type-first, no rail  
- [ ] Collection Shelf: physical shelf metaphor  
- [ ] Tier List Card: native rows, S underline  
- [ ] Completion Arc: thin ember track  
- [ ] Activity Card: compact alive row  
- [ ] Gamer Identity Header: taste over vanity counts  

### Completeness

- [ ] Future screen can be built without inventing components  
- [ ] Creator Economy: no paywall chrome on core actions  
- [ ] Mobile-first; desktop-ready notes present  

If any item fails → refine before LOCK use in F2.

---

## Sprint F1 success criteria

| Criterion | Met when |
|-----------|----------|
| Foundation complete | §§1–6 locked |
| Component coverage | §7 covers buttons, inputs, containers, nav, media, loading |
| Signatures unforgettable | §8 fully specified |
| No screen work | No Home/Profile/Review pages in this sprint |
| F2-ready | Any screen = composition of F1 only |

**F1 Status: LOCKED** for design foundation.  
**Next:** Sprint F2 — compose screens from this system only (implementation / screen design as scoped).

---

## Related documents

| Doc | Role |
|-----|------|
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | SSOT |
| [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) | Token tables (align to F1) |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | Catalog (align to F1) |
| [MOTION_GUIDELINES.md](./MOTION_GUIDELINES.md) | Extended motion |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | Extended a11y |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](./SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Accessibility constitution |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | Sprint F1 LOCK — complete foundation + signatures; design only |
