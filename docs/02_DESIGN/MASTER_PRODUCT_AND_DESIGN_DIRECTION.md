# GMRLOG — Master Product & Design Direction

**Document:** `docs/02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`  
**Version:** 1.0  
**Status:** **LOCKED — Single Source of Truth (SSOT)**  
**Last Updated:** July 2026  
**Owner:** Lead Product Design / Creative Direction  
**Classification:** Permanent Product & Design Direction (until explicit amendment)

---

## Authority

This document is the **Single Source of Truth** for all GMRLOG **UI, UX, and frontend** work.

It **overrides** every previous UI instruction, informal design chat, and conflicting guidance in subordinate design docs.

| Conflict | Winner |
|----------|--------|
| This document vs any `docs/02_DESIGN/*` detail doc | **This document** |
| This document vs screen mockups / Figma exploration | **This document** (update Figma) |
| This document vs implementation convenience | **This document** |
| This document vs `docs/00_PROJECT/NORTH_STAR.md` | **North Star** (product purpose); this document must never contradict it |

**Subordinate docs** (tokens, components, motion, accessibility, screens) implement and detail this direction. They must not invent a competing visual identity or product model.

**North Star Question (always):**  
*Does this make GMRLOG a better digital home for gaming culture?*

**Design Question (always):**  
*Does this make GMRLOG more recognizable?*  
If the answer is NO, do not make that change.

---

## Document map

| § | Section |
|---|---------|
| 1 | Design Principles |
| 2 | Brand Identity |
| 3 | Color System |
| 4 | Typography |
| 5 | Spacing |
| 6 | Motion |
| 7 | Design Tokens |
| 8 | Component Library |
| 9 | Navigation System |
| 10 | Content Architecture |
| 11 | Screen Inventory |
| 12 | Accessibility |
| 13 | Future Expansion Strategy |

---

# 1. Design Principles

## 1.1 First principle — not a clone

Stop framing GMRLOG as:

- Letterboxd for Games  
- Steam Clone  
- Gaming Twitter / Reddit / Discord  
- Backloggd Clone  

GMRLOG is **not** inspired by one platform. It is the **evolution** of the strongest behaviors across gaming culture tools — without copying any UI.

## 1.2 Product vision

GMRLOG is the **operating system of gaming culture**.

A gamer should spend hours inside GMRLOG without switching between Steam, X, Discord, Reddit, Backloggd, Letterboxd, and Goodreads for culture, identity, logging, and conversation.

We do **not** replace those businesses.  
We replace the **need to constantly switch** between them.

Inherit **behaviors only**. Never copy UI.

| Source | Inherit |
|--------|---------|
| Steam | Library, ownership, playtime, achievements, store-quality game pages |
| Letterboxd | Review culture, logging, taste identity, beautiful review reading |
| Twitter/X | Fast posting, micro content, following, viral conversation |
| Reddit | Long discussions, communities, guides, discovery through people |
| Discord | Gaming identity, friend activity, community feeling, presence |
| Spotify | Friend activity, social discovery, beautiful minimal UI |
| Goodreads | Progress, collections, game journey |

## 1.3 Six equal pillars

Reviews are **not** the center. Six pillars are **equally important**. Everything must visually communicate this balance.

1. **Library** — Games, ownership, backlog, wishlist, collections  
2. **Logging** — Game logs, progress, play sessions, completion, reviews  
3. **Social** — Posts, comments, likes, conversations, following  
4. **Discovery** — Recommendations, trending, communities, friends, search  
5. **Identity** — Profile, achievements, favorites, taste, statistics, history  
6. **Communities** — Groups, discussions, guides, events  

Do **not** let Reviews dominate the application.

## 1.4 Feeling

Opening GMRLOG must feel: **“I’m entering my gaming world.”**  
Not: **“I’m reading reviews.”**

The app feels **alive**: friends playing, discussions, posts, reviews, collections updating, completions, tier lists — never empty, never noisy.

## 1.5 Core design principles

| # | Principle | Meaning |
|---|-----------|---------|
| 1 | **Culture OS** | Not a single-pillar niche app |
| 2 | **Enter a world** | Destination energy, not a review inbox |
| 3 | **Behaviors, not UI clones** | Patterns only |
| 4 | **Six pillars, one language** | Equal visual investment |
| 5 | **Reviews equal, not central** | Signature yes; monopoly no |
| 6 | **Alive without noise** | Rhythm and presence; no RGB/glow |
| 7 | **Quiet premium** | Precision, breath, cinematic covers |
| 8 | **Content over chrome** | Art, people, text first |
| 9 | **One system forever** | Tokens → components → screens; no one-offs |
| 10 | **Recognizable or reject** | Brand filter on every change |
| 11 | **Accessible by default** | WCAG 2.2 AA minimum |
| 12 | **Architecture before novelty** | Future formats without redesign |
| 13 | **Creator Economy** | See §1.6 |
| 14 | **Mobile-first, Desktop-ready** | See §1.7 |

## 1.6 Creator Economy

Creators are first-class citizens of gaming culture — reviewers, curators, guides authors, community leads, developers who write in public.

**Principles**

- **Enhance, never lock the core.** Premium and creator tools deepen expression, publishing, and insights. They must not gate posting, logging, reviewing, messaging, discovery fairness, or feed reach.
- **Never feel paywalled.** Upsells are contextual and optional. No dark patterns, countdown guilt, or blocked culture loops.
- **Creators build identity portfolios.** Profiles, collections, tier lists, GameLog timelines, and future long-form are the creator’s public craft — designed as proud surfaces, not afterthoughts.
- **Architecture before monetization UI.** Long-form articles, editorial, guides, developer blogs, creator profiles, enhanced collections, custom themes, advanced stats — **not implemented now**; content and token architecture must already support them (see §10, §13).
- **Visual restraint.** Creator / Premium signals use **Deep Purple** identity accents at low saturation — never loud paywall chrome, never orange spam.
- **Align with product monetization.** Entitlements follow `docs/14_MONETIZATION/MONETIZATION.md`. **Constitutional Premium ethics:** [`SPRINT_F2_16_PREMIUM_MEMBERSHIP.md`](./SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) (**LOCKED**). **Commerce constitution:** [`SPRINT_F2_26_MONETIZATION_COMMERCE_SUSTAINABLE_ECONOMY.md`](./SPRINT_F2_26_MONETIZATION_COMMERCE_SUSTAINABLE_ECONOMY.md) (**LOCKED**) — revenue serves culture; commerce never becomes the product center.

**Anti-patterns**

- Pay-to-win visibility  
- Review-count as the only creator flex  
- Gated reading of community culture  
- “Premium” as glitter / RGB / exclusive glow UI  

## 1.7 Mobile-first, Desktop-ready

GMRLOG ships as a **mobile-first** culture OS (React Native / Expo, phones primary). The same design system must be **desktop-ready** without a second visual identity.

**Principles**

- **Design for the hand first.** Touch targets, thumb zones, bottom navigation, one-column feed, and portrait game heroes are the default truth.
- **One component system, many densities.** Atoms and signatures scale; do not fork “mobile components” vs “desktop components.”
- **Adapt layout, not meaning.** Breakpoints change columns, shelf width, and chrome placement — not pillar balance, brand DNA, or interaction semantics.
- **Pointer is additive.** Hover and keyboard on tablet/web enhance; they never become the only way to complete a task.
- **Performance budgets prefer mobile.** Stricter mobile budgets win when trade-offs appear (`docs/10_DEVOPS/PERFORMANCE_BUDGET.md`).
- **Desktop is a first-class future surface**, not a stretch goal that rewrites the product. Tokens, signatures, and content architecture must already assume large screens.

**Breakpoints (logical)**

| Token | Intent |
|-------|--------|
| `mobile` | Primary; default compositions |
| `tablet` | Wider shelves, optional two-pane where documented |
| `desktop` | Multi-column destinations; persistent chrome later |
| `large-desktop` | Max content width; generous magazine rhythm |
| `foldable` | Continuity; avoid dead zones; same components |

Exact px values live in `DESIGN_TOKENS.md` / implementation packages and must remain subordinate to this principle.

**Anti-patterns**

- Desktop-only hover workflows  
- Shrinking a desktop dashboard into a phone  
- Different brand colors per platform  
- Rebuilding signatures per breakpoint  

## 1.8 Style constraints

**Be:** Premium, minimal, cinematic, modern, confident, timeless.  
**Avoid:** RGB, cyberpunk clichés, huge gradients, glow, glass everywhere, loud color fields.

**References (inspiration only — never copy):** Apple, Linear, Notion, Arc, Spotify, Discord, Material 3, HIG.

---

# 2. Brand Identity

## 2.1 Name & promise

**GMRLOG** — *Every Game Has a Story.*

## 2.2 Brand essence

**Story Ember** — Late-night play, warm ember, cinematic dark, quiet confidence.

## 2.3 Positioning

| Not | Is |
|-----|-----|
| Launcher / store | Culture operating system |
| Single-pillar product | Six-pillar ecosystem |
| Competitor clone | Behavior evolution + original language |
| Review site | Identity + library + social + discovery + community |

## 2.4 Signature visual DNA

1. Layered dark (never pure black) + Warm Ember Orange (**less than 8%** of screen)  
2. Cinematic game artwork dominance  
3. **Ember Rail** — 2px story/log accent on logging & collectible story cards  
4. **Review Ledger** — collectible review band  
5. **Completion Arc** — progress as identity  
6. **Collection Shelf** — physical shelf metaphor  
7. **GameLog Timeline** — journey spine  
8. **Magazine Activity Feed** — mixed heights, six-pillar rhythm  

## 2.5 Voice

Short, human, confident. UI slang restrained. No gaming-cliché microcopy.

---

# 3. Color System

## 3.1 Roles

| Role | Name | Use |
|------|------|-----|
| Primary | Warm Ember Orange | CTA, ratings/stars, selected, progress, Ember Rail |
| Identity | Deep Purple | Premium/creator identity, taste accents |
| Interaction | Electric Blue | Links, focus, unread, interactive highlight (not primary CTA fill) |
| Success | Emerald | Completed, positive confirm |
| Warning | Amber | Spoiler, pending |
| Error | Soft Red | Validation, destructive (calm) |

## 3.2 Dark surfaces (never `#000`)

| Token | HEX | Role |
|-------|-----|------|
| `bg.base` | `#0E0F12` | Canvas |
| `bg.subtle` | `#14161B` | Alternating |
| `surface.1` | `#1A1C22` | Cards / lists |
| `surface.2` | `#22252D` | Inputs / elevated |
| `surface.3` | `#2A2E38` | Sheets / menus |
| `surface.4` | `#343944` | Toast / popover |
| `border.subtle` | `#2C303A` | Hairline |
| `border.default` | `#3A4050` | Controls |
| `border.strong` | `#525A6B` | Active |

## 3.3 Brand primitives

| Token | HEX |
|-------|-----|
| `ember.500` | `#F0732E` |
| `ember.400` | `#FF8B4A` |
| `ember.600` | `#D45F1F` |
| `purple.500` | `#5B3A8C` |
| `purple.400` | `#7A56B0` |
| `blue.500` | `#3D8BFF` |
| `blue.400` | `#6BA4FF` |
| `success` | `#2FBF7A` |
| `warning` | `#E5A832` |
| `error` | `#E05B5B` |

## 3.4 Text

| Token | HEX |
|-------|-----|
| `text.primary` | `#F2F3F5` |
| `text.secondary` | `#A8AEB8` |
| `text.tertiary` | `#6F7683` |
| `text.disabled` | `#4A505C` |
| `text.onBrand` | `#0E0F12` |
| `text.link` | `blue.400` |

## 3.5 Discipline

- Accents occupy **less than 8%** of visible screen.  
- Orange CTA + Purple fill + Blue fill together: **forbidden**.  
- Orange = action/story · Purple = identity/creator · Blue = system interaction.  
- Light mode: same semantic map later; architecture ready now.

---

# 4. Typography

Readable first. Modern. Elegant hierarchy. No futuristic gamer fonts.

| Role | Recommendation |
|------|----------------|
| UI / Body | Inter or platform SF / Roboto |
| Display | Satoshi or Geist (hero, game title, profile name) |
| Mono / stats | SF Mono / JetBrains Mono |

## Scale

| Token | Size | Weight | Line | Use |
|-------|------|--------|------|-----|
| `display.lg` | 34 | Semibold | 40 | Game hero, brand |
| `display.md` | 28 | Semibold | 34 | Profile name |
| `heading.lg` | 22 | Semibold | 28 | Section |
| `heading.md` | 18 | Semibold | 24 | Card title |
| `heading.sm` | 16 | Semibold | 22 | List header |
| `body.lg` | 17 | Regular | 26 | Reviews / long read |
| `body.md` | 15 | Regular | 22 | Posts |
| `body.sm` | 13 | Regular | 18 | Meta |
| `editorial.lg` | 18 | Regular | 28 | Future articles (reserved) |
| `label.md` | 13 | Medium | 16 | Buttons, chips |
| `label.sm` | 11 | Medium | 14 | Badges |
| `stat` | 20–28 | Semibold | tight | Identity numbers |

**Hierarchy:** Size → Weight → Color.  
Posts effortless · Reviews enjoyable · Articles editorial (tokens reserved; UI later).

On large breakpoints, measure width for long reading; do not inflate display sizes into noise.

---

# 5. Spacing

**8pt grid.** No arbitrary spacing. `4` only for fine icon/padding adjustment.

```
0 · 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96
```

| Use | Value |
|-----|-------|
| Screen gutter (mobile) | 16 |
| Card padding | 16 (compact 12) |
| Feed item gap | 8–16 by type |
| Section gap | 24–32 |
| Featured breath | 20–24 |
| Hit target | ≥ 44×44 (prefer 48) |
| Desktop content max width | Tokenized; centered; gutters scale |

---

# 6. Motion

Apple + Linear quality. Core **180–250ms**. No bounce, overshoot, or flashy motion.

| Kind | Duration | Easing |
|------|----------|--------|
| Press / toggle | 180ms | ease-out |
| Like / bookmark | 200ms | ease-out |
| Card press | 200ms | scale ≈ 0.985 |
| Tab indicator | 220ms | ease-out |
| Toast / chip | 220–250ms | ease-out |
| Screen push | 280–320ms | shared-axis feel |
| Sheet | 300–360ms | decelerate in |

`prefers-reduced-motion` → opacity or instant. Max UI animation ~400ms. Detail: `MOTION_GUIDELINES.md` (subordinate).

---

# 7. Design Tokens

```
Primitive → Semantic → Component → Theme(dark|light) → Screen
```

**Categories:** `color.*` · `space.*` · `radius.*` · `shadow.*` · `blur.*` · `font.*` · `icon.size.*` · `avatar.size.*` · `motion.*` · `zIndex.*` · `opacity.*` · `breakpoint.*`

## Radius

| Token | px | Typical |
|-------|-----|---------|
| `sm` | 8 | Chips, badges |
| `md` | 12 | Cards, inputs |
| `lg` | 16 | Sheets, featured |
| `xl` | 24 | Hero containers |
| `full` | 9999 | Avatar, switch |

## Elevation (layers over blurry shadow)

| Level | Surface | Shadow | Use |
|-------|---------|--------|-----|
| 0 | bg | none | Canvas |
| 1 | surface.1 | none / hairline | Feed cards |
| 2 | surface.2 | sm | Elevated / search |
| 3 | surface.3 | md | Menus |
| 4 | surface.4 | md + scrim | Dialog / sheet / toast |

Glass only where meaningful (e.g. Cover Ember Badge; optional tab blur).

## Z-index

content `0` · sticky `10` · tabBar `20` · sheet `30` · dialog `40` · toast `50`

No hardcoded values in components. Canonical token tables: `DESIGN_TOKENS.md`.

---

# 8. Component Library

Everything reusable. No one-off screen components without explicit approval.

## Foundations & controls

Avatar · Badge · Icon (outline) · Divider · Skeleton · Spinner · Scrim  
TextField · TextArea · SearchBar · Checkbox · Switch · Radio · SegmentedControl · Select · Rating  
Primary / Secondary / Tertiary / Destructive buttons · FAB  
Toast · Snackbar · Dialog · BottomSheet · Banner · Progress · Empty / Error  
BottomTabBar · TopAppBar · StackHeader · Tabs  

## Signature organisms (GMRLOG-only)

### 1. Game Card — Library / Discovery

Large cinematic artwork; **Cover Ember Badge** (rating in-art); metadata band; ownership / Completion Arc; premium ownership feel.

### 2. Review Card — Logging

**Ember Rail** + **Ledger Band** (mini cover · stars · spoiler); playtime; completion; date; collectible; `body.lg`; metrics (like, comment, helpful).

### 3. Post Card — Social

No Ember Rail; typography first; restrained media; X-like behavior; premium reading.

### 4. Profile Header — Identity

Hero; Completion Arc; favorites; stats hierarchy answering **“What kind of gamer?”** (not review-count hero); taste signals; creator-ready identity chrome (purple, restrained).

### 5. Collection Shelf — Library

Physical shelf metaphor; standing covers; spine rhythm — not a flat mosaic dump.

### 6. Tier List Canvas — Identity / Social

Native rows; not a screenshot editor; S-tier subtle ember underline only.

### 7. GameLog Timeline — Logging

Vertical journey of sessions, status, completion, linked reviews/achievements; Ember Rail + nodes. Same language on Profile and Game Page.

### 8. Activity Feed — All pillars

Magazine rhythm; varied heights; mixed types; alive. Never review-only stacks.

**Feed rhythm example**

Friend Activity → Review → Post → Collection → Discussion → Tier List → Recommendation → Achievement → Review → Community → Guide → Game Update → Post  

Breathing space between types; max two identical types stacked before inserting another.

## Domain cards

CommentCard · NotificationCard · MessageBubble · DiscussionCard · CommunityCard · GuideCard (future shell) · AchievementCard · RecommendationCard · FriendActivityRow  

Full props/variants: `COMPONENT_LIBRARY.md` (must stay aligned with this section).

---

# 9. Navigation System

> **LOCKED detail:** [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md)  
> Tab labels amended (F2.1): **Library** (was Games), **Discover** (was Search). Same pillars.

```
AppTabs
├── HomeStack          → Activity Feed (mixed pillars)
├── DiscoverStack      → Discover Hub + Universal Search
├── LibraryStack       → Library hub → Game Page
├── NotificationsStack
└── ProfileStack       → Identity
```

| Tab | Primary pillars |
|-----|-----------------|
| Home | Social + Logging + Discovery |
| Discover | Discovery + Communities |
| Library | Library (+ Logging entry) — archive per F2.6 |
| Notifications | Social / system |
| Profile | Identity (+ shelves, tiers, timeline) |

Composer is **not** a tab (Home FAB + contextual create). Nested stacks + modal compose (Post / Log / Review / Collection / Tier).  
Communities: Discover hub / deep link — **do not add a bottom tab** without amending F2.1 + this section.

**Mobile-first chrome:** bottom tabs.  
**Desktop-ready:** same five destinations as rail/top; order preserved.

Deep links restore tab + stack — see F2.1 §8.

---

# 10. Content Architecture

One **Content** family evolves without app redesign:

```
Content
├── format: post | review | article | editorial | guide | developer_blog
├── body / blocks
├── media[]
├── game_refs[]
├── community_ref?
├── visibility
├── spoiler
└── metrics
```

| Format | Now | Design language |
|--------|-----|-----------------|
| `post` | Yes | Post Card |
| `review` | Yes | Review Ledger |
| `article` | No | `editorial.*` tokens + long-read template reserved |
| `editorial` | No | Same family; staff/creator flag |
| `guide` | No | Structured blocks; Communities pillar |
| `developer_blog` | No | Dev/studio identity later |

**Logging objects:** GameLog · Session · Status · Progress → GameLog Timeline.  
**Library objects:** Ownership · Wishlist · Backlog · Collection · Shelf.  
**Creator Economy:** formats and profile surfaces ready; monetization UI deferred.  
**Premium:** enhances creators; never paywalled culture core. See `MONETIZATION.md`.

---

# 11. Screen Inventory

Screens are **not** designed in this document; inventory gates future UI work.

### System

Splash · Onboarding · Auth · Settings · Privacy · Block/Report · Empty/Error  

### Home / Social

Activity Feed · Post Detail · Compose Post · Comment Thread · Media Viewer · Bookmarks  

### Library / Games

Games Hub · Library · Backlog · Wishlist · Collections · Collection Shelf detail · Game Detail (destination) · Related / Recommendations  

### Logging

Log Game · GameLog Timeline · Write Review · Review Detail · Sessions (if exposed)  

### Discovery

Search · Results · Trending · Recommendations · Friends-playing surfaces  

### Identity

Profile (self/other) · Edit Profile · Followers/Following · Favorites · Stats · Achievements · Tier Lists · Taste/genres · Creator profile enhancements (future)  

### Communities

Communities hub · Community home · Discussion detail · Events (future) · Guides (future)  

### Communication (phased)

Chat list · Conversation  

### Notifications

List → deep-link targets  

### Explicitly not designed now

Premium Article editor/reader · Light mode screens · Desktop chrome polish · Paywall UI · Creator payout surfaces  

### Game Page IA (premium destination)

> **LOCKED detail:** [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) — relationship-first.

Hero → **Personal Status / Relationship** → Friends Activity → Community → Reviews → Posts → Collections → Tier Lists → Achievements → Statistics → Related Games → Articles / Guides / Mods (future)  

### Profile answers

**“What kind of gamer is this?”** — taste, genres, developers, platforms, achievements, activity, friends, communities, collections, tier lists, reviews, posts — **not** “how many reviews” or follower vanity.

> **LOCKED detail:** [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) — identity / journey first.

---

# 12. Accessibility

- WCAG 2.2 AA minimum; AAA where practical  
- Text contrast 4.5:1; large 3:1; UI components 3:1  
- Focus: Electric Blue ring 2px — no glow  
- Touch ≥ 44×44 (prefer 48)  
- Dynamic Type / font scaling  
- Spoiler states exposed to assistive tech  
- Color alone ≠ meaning  
- `prefers-reduced-motion`  
- Labels on signature controls (rating badge, completion arc, shelf items)  
- Keyboard and pointer paths on desktop-ready surfaces  

Constitution: `SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md`. Detail: `ACCESSIBILITY.md`.

---

# 13. Future Expansion Strategy

| Horizon | What |
|---------|------|
| **Now** | Dark tokens · 8 signatures · six-pillar feed · Game IA · `post`/`review` · Creator Economy + Mobile-first principles locked |
| **Next** | Communities surfaces · Chat · Light theme map · richer GameLog · tablet densification |
| **Ready, unbuilt** | `article` / `guide` / `editorial` / `developer_blog` · Creator profiles · Premium enhancements · custom themes · advanced stats · desktop chrome |
| **Later** | Large-desktop magazine layouts · events · marketplace-adjacent without becoming a store · wider gaming culture verticals, same language |
| **Never without amendment** | New brand primary · bounce motion · RGB · one-offs · making Reviews the center · paywalled core culture · platform-forked design systems |

**Stability contract:** Themes, formats, and breakpoints expand. Token hierarchy, signature DNA, six pillars, Creator Economy ethics, and Mobile-first/Desktop-ready do not flip casually.

---

## Recognizability checklist

A screenshot reads as GMRLOG when **≥2** of these are visible:

- Ember surfaces + restrained orange  
- Cinematic Game Card + Cover Ember Badge  
- Review Ledger **or** GameLog Timeline **or** Collection Shelf  
- Magazine feed mix (not review-only)  
- Profile as taste identity (arc + shelf + favorites)  

---

## Amendment process

1. Propose change against North Star + Recognizability questions.  
2. Record explicit amendment in this file (version bump).  
3. Cascade to subordinate `02_DESIGN` docs and tokens packages.  
4. Only then update screens / Figma / code.

**Unlocked for screen design:** Yes — after this LOCK. Individual screens still require specs aligned to §8–§11 before implementation.

---

## Related documents (subordinate)

| Document | Role |
|----------|------|
| [NORTH_STAR.md](../00_PROJECT/NORTH_STAR.md) | Permanent product purpose (wins on purpose conflicts) |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | **LOCKED** complete design foundation & signatures (F1) |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | **LOCKED** navigation & IA (F2.1) |
| [SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md](./SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md) | **LOCKED** authentication UX (F2.2) |
| [SPRINT_F2_2_1_AUTH_POLISH.md](./SPRINT_F2_2_1_AUTH_POLISH.md) | **LOCKED** auth polish amendment (F2.2.1) |
| [SPRINT_F2_3_HOME_FEED.md](./SPRINT_F2_3_HOME_FEED.md) | **LOCKED** Home Feed architecture (F2.3) |
| [SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) | **LOCKED** feed identity amendment (F2.3.1) |
| [SPRINT_F2_4_GAME_EXPERIENCE.md](./SPRINT_F2_4_GAME_EXPERIENCE.md) | **LOCKED** Game Detail experience (F2.4) |
| [SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md](./SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md) | **LOCKED** game identity amendment (F2.4.1) |
| [SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) | **LOCKED** Gamer Identity Profile (F2.5) |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | **LOCKED** profile identity amendment (F2.5.1) |
| [SPRINT_F2_6_LIBRARY_COLLECTIONS.md](./SPRINT_F2_6_LIBRARY_COLLECTIONS.md) | **LOCKED** Library & Collections (F2.6) |
| [SPRINT_F2_7_HOME_FEED.md](./SPRINT_F2_7_HOME_FEED.md) | **LOCKED** Home Feed & Discovery (F2.7) |
| [SPRINT_F2_8_SOCIAL_COMMUNICATION.md](./SPRINT_F2_8_SOCIAL_COMMUNICATION.md) | **LOCKED** Social & Communication (F2.8) |
| [SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md](./SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md) | **LOCKED** Notifications & Activity Center (F2.9) |
| [SPRINT_F2_10_DISCOVER_SEARCH.md](./SPRINT_F2_10_DISCOVER_SEARCH.md) | **LOCKED** Discover & Search (F2.10) |
| [SPRINT_F2_11_COMMUNITIES_GUILDS.md](./SPRINT_F2_11_COMMUNITIES_GUILDS.md) | **LOCKED** Communities & Guilds (F2.11) |
| [SPRINT_F2_12_CREATOR_PLATFORM.md](./SPRINT_F2_12_CREATOR_PLATFORM.md) | **LOCKED** Creator Platform (F2.12) |
| [SPRINT_F2_13_REPUTATION_RECOGNITION.md](./SPRINT_F2_13_REPUTATION_RECOGNITION.md) | **LOCKED** Reputation & Recognition (F2.13) |
| [SPRINT_F2_14_ACHIEVEMENT_LEGACY.md](./SPRINT_F2_14_ACHIEVEMENT_LEGACY.md) | **LOCKED** Achievement, Legacy & Journey (F2.14) |
| [SPRINT_F2_15_EVENTS_SEASONAL.md](./SPRINT_F2_15_EVENTS_SEASONAL.md) | **LOCKED** Events & Seasonal (F2.15) |
| [SPRINT_F2_16_PREMIUM_MEMBERSHIP.md](./SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) | **LOCKED** Premium & Membership ethics (F2.16) |
| [SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) | **LOCKED** Trust, Safety & Governance (F2.17) |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](./SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | **LOCKED** Accessibility, Inclusivity & Global Experience (F2.18) |
| [SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md](./SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md) | **LOCKED** Intelligence, AI & Recommendation (F2.19) |
| [SPRINT_F2_20_SETTINGS_PERSONALIZATION.md](./SPRINT_F2_20_SETTINGS_PERSONALIZATION.md) | **LOCKED** Settings, Personalization & User Control (F2.20) |
| [SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md](./SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md) | **LOCKED** External Integrations & Ecosystem (F2.21) |
| [SPRINT_F2_22_PLATFORM_INTELLIGENCE_OPERATIONS.md](./SPRINT_F2_22_PLATFORM_INTELLIGENCE_OPERATIONS.md) | **LOCKED** Platform Intelligence & Operational Excellence (F2.22) |
| [SPRINT_F2_23_ANALYTICS_INSIGHTS_PRODUCT_INTELLIGENCE.md](./SPRINT_F2_23_ANALYTICS_INSIGHTS_PRODUCT_INTELLIGENCE.md) | **LOCKED** Analytics, Insights & Product Intelligence (F2.23) |
| [SPRINT_F2_24_ENTERPRISE_STUDIO_ORGANIZATION.md](./SPRINT_F2_24_ENTERPRISE_STUDIO_ORGANIZATION.md) | **LOCKED** Enterprise, Studio & Organization (F2.24) |
| [SPRINT_F2_25_GROWTH_ADOPTION_ECOSYSTEM_EXPANSION.md](./SPRINT_F2_25_GROWTH_ADOPTION_ECOSYSTEM_EXPANSION.md) | **LOCKED** Growth, Adoption & Ecosystem Expansion (F2.25) |
| [SPRINT_F2_26_MONETIZATION_COMMERCE_SUSTAINABLE_ECONOMY.md](./SPRINT_F2_26_MONETIZATION_COMMERCE_SUSTAINABLE_ECONOMY.md) | **LOCKED** Monetization, Commerce & Sustainable Economy (F2.26) |
| [SPRINT_F2_27_SECURITY_PRIVACY_DATA_GOVERNANCE.md](./SPRINT_F2_27_SECURITY_PRIVACY_DATA_GOVERNANCE.md) | **LOCKED** Security, Privacy & Data Governance (F2.27) |
| [SPRINT_F2_28_DEVELOPER_PLATFORM_API_EXTENSIBILITY.md](./SPRINT_F2_28_DEVELOPER_PLATFORM_API_EXTENSIBILITY.md) | **LOCKED** Developer Platform, API & Extensibility (F2.28) |
| [SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md](./SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) | **LOCKED** Final Product Constitution · F2 series close (F2.29) |
| [F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md](../03_UX/F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) | **LOCKED** UX Foundations & Interaction Principles (F3.1) |
| [F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md](../03_UX/F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) | **LOCKED** IA & Navigation Experience (F3.2) |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](../03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) | **LOCKED** Visual Hierarchy & Layout System (F3.3) |
| [F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md](../03_UX/F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) | **LOCKED** Interaction & Microinteraction Philosophy (F3.4) |
| [F3_5_MOTION_ANIMATION_PHILOSOPHY.md](../03_UX/F3_5_MOTION_ANIMATION_PHILOSOPHY.md) | **LOCKED** Motion & Animation Philosophy (F3.5) |
| [F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md](../03_UX/F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md) | **LOCKED** Components, Forms, States & Search (F3.6) |
| [F3_7_PROFILE_IDENTITY_LIBRARY_EXPERIENCE.md](../03_UX/F3_7_PROFILE_IDENTITY_LIBRARY_EXPERIENCE.md) | **LOCKED** Profile, Identity & Library Experience (F3.7) |
| [F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md](../03_UX/F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md) | **LOCKED** Home, Discover & Game Experience (F3.8) |
| [F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md](../03_UX/F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md) | **LOCKED** Community, Creator & Social Experience (F3.9) |
| [F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md](../03_UX/F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md) | **LOCKED** Responsive, Desktop & Cross-Platform (F3.10) |
| [F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md](../03_UX/F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md) | **LOCKED** UX Writing, Voice & Localization (F3.11) |
| [F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md](../03_UX/F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md) | **LOCKED** UX Governance · F3 series close (F3.12) |
| [F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md](../04_UI/F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md) | **LOCKED** UI Foundation & Visual Design Philosophy (F4.1) |
| [F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md](../04_UI/F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md) | **LOCKED** Color Philosophy & Semantic Color System (F4.2) |
| [F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md](../04_UI/F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md) | **LOCKED** Typography Philosophy & Type System (F4.3) |
| [F4_4_GRID_LAYOUT_SPACING_SYSTEM.md](../04_UI/F4_4_GRID_LAYOUT_SPACING_SYSTEM.md) | **LOCKED** Grid, Layout & Spacing System (F4.4) |
| [F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md](../04_UI/F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md) | **LOCKED** Surface, Elevation & Layering System (F4.5) |
| [F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md](../04_UI/F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md) | **LOCKED** Iconography, Illustration & Visual Symbol Language (F4.6) |
| [F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md](../04_UI/F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md) | **LOCKED** Interaction Components Philosophy (F4.7) |
| [F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md](../04_UI/F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) | **LOCKED** Component Design System Constitution (F4.8) |
| [F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md](../04_UI/F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md) | **LOCKED** Motion Language & Transition System (F4.9) |
| [F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md](../04_UI/F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md) | **LOCKED** Design Token Architecture & Semantic Foundation (F4.10) |
| [F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md](../04_UI/F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md) | **LOCKED** Responsive UI & Adaptive Layout Constitution (F4.11) |
| [F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md](../04_UI/F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md) | **LOCKED** Design System Governance & Evolution Constitution (F4.12) |
| [F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md](../04_UI/F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md) | **LOCKED** UI Constitution Finalization · F4 series close (F4.13) |
| [F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md](../05_PRODUCT_ARCHITECTURE/F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md) | **DRAFT** F5.1 Product IA & Navigation Specification |
| [F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md](../05_PRODUCT_ARCHITECTURE/F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md) | **DRAFT** F5.2 Home Feed Product Architecture |
| [F5_3_SCREEN_SPECIFICATIONS.md](../05_PRODUCT_ARCHITECTURE/F5_3_SCREEN_SPECIFICATIONS.md) | **DRAFT** F5.3 Screen Specifications |
| [F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md](../05_PRODUCT_ARCHITECTURE/F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md) | **DRAFT** F5.4 Interaction & Component Behavior |
| [F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md](../05_PRODUCT_ARCHITECTURE/F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md) | **DRAFT** F5.5 Design System & Implementation Rules · F5 close |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Patterns implementing this direction |
| [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) | Token tables |
| [COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md) | Component specs |
| [MOTION_GUIDELINES.md](./MOTION_GUIDELINES.md) | Motion detail |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | A11y detail (subordinate to F2.18) |
| [SCREEN_SPECIFICATIONS.md](./SCREEN_SPECIFICATIONS.md) | Screen specs |
| [MONETIZATION.md](../14_MONETIZATION/MONETIZATION.md) | Premium / entitlements (subordinate to F2.16 · F2.26) |
| [FRONTEND_ARCHITECTURE.md](../05_FRONTEND/FRONTEND_ARCHITECTURE.md) | Frontend structure |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | Initial LOCK. Six pillars, Story Ember, 8 signatures, Creator Economy, Mobile-first/Desktop-ready. Declared SSOT for UI/UX/frontend. |
| 1.0.1 | July 2026 | §9 tab labels aligned to F2.1 IA freeze: Discover, Library (was Search, Games). |
| 1.0.2 | July 2026 | §11 Game Page IA aligned to F2.4 relationship-first hierarchy. |
| 1.0.3 | July 2026 | Profile IA aligned to F2.5 identity / journey-first hierarchy. |
| 1.0.4 | July 2026 | Related docs: F2.16–F2.29 constitutional series; F2 Product Design Constitution closed via F2.29; next phase F3 UX & Interaction Design. |
| 1.0.5 | July 2026 | Related docs: F3.1–F3.12; F3 UX Constitution closed via F3.12; next phase F4 UI Design. |
| 1.0.6 | July 2026 | Related docs: F4.1 UI Foundation & Visual Design Philosophy opens F4 (philosophy only). |
| 1.0.7 | July 2026 | Related docs: F4.2 Color Philosophy & Semantic Color System (meaning before HEX). |
| 1.0.8 | July 2026 | Related docs: F4.3 Typography Philosophy & Type System (reading before fonts). |
| 1.0.9 | July 2026 | Related docs: F4.4 Grid, Layout & Spacing System (space before measurements). |
| 1.0.10 | July 2026 | Related docs: F4.5 Surface, Elevation & Layering System (depth meaning before materials). |
| 1.0.11 | July 2026 | Related docs: F4.6 Iconography, Illustration & Visual Symbol Language (symbols before assets). |
| 1.0.12 | July 2026 | Related docs: F4.7 Interaction Components Philosophy (objects before specs). |
| 1.0.13 | July 2026 | Related docs: F4.8 Component Design System Constitution (system law before COMPONENT_LIBRARY). |
| 1.0.14 | July 2026 | Related docs: F4.9 Motion Language & Transition System (movement before timings). |
| 1.0.15 | July 2026 | Related docs: F4.10 Design Token Architecture & Semantic Foundation (meaning before values). |
| 1.0.16 | July 2026 | Related docs: F4.11 Responsive UI & Adaptive Layout Constitution (adapt canvas · preserve identity). |
| 1.0.17 | July 2026 | Related docs: F4.12 Design System Governance & Evolution Constitution (stewardship · anti-fork). |
| 1.0.18 | July 2026 | Related docs: F4.1–F4.13; F4 UI Constitution closed via F4.13; next phase F5 Production & Design Implementation. |
| 1.0.19 | July 2026 | Related docs: F5.1 Product IA & Navigation Specification (DRAFT structure SSOT under F2.1). |
| 1.0.20 | July 2026 | Related docs: F5.2 Home Feed Product Architecture Specification (DRAFT). |
| 1.0.21 | July 2026 | Related docs: F5.3 Screen Specifications (DRAFT catalog). |
| 1.0.22 | July 2026 | Related docs: F5.4 Interaction & Component Behavior Specification (DRAFT). |
| 1.0.23 | July 2026 | Related docs: F5.5 Design System & Implementation Rules (DRAFT · F5 close upon LOCK). |
