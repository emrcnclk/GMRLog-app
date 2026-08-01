# GMRLOG — Sprint F2.3: Home Feed Architecture & Screen Composition

**Document:** `docs/02_DESIGN/SPRINT_F2_3_HOME_FEED.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.3 (Home Feed architecture & composition only)  
**Last Updated:** July 2026  
**Owner:** Lead Product Design / Feed Experience  
**Classification:** Frozen Home Feed architecture

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md`](./SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md) + [`SPRINT_F2_2_1_AUTH_POLISH.md`](./SPRINT_F2_2_1_AUTH_POLISH.md) |
| 6 | **This document** — Home Feed freeze |
| 6a | [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) — **LOCKED amendment** (Pulse, living activity, game graph, momentum, discovery balance, explainability) |

**Home Feed SSOT** = this document + F2.3.1 identity refinement + [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) (Discovery architecture & heartbeat framing).

**Scope:** Home Feed architecture and screen composition only.  
**Out of scope:** React Native, backend, algorithms, recommendation engine implementation, pixel-perfect Figma, Discover/Library/Profile screens, Sprint F2.4+.

**Placement (F2.1):** `HomeStack` root = Activity Feed · FAB compose · tab `home`.

**Gate:** Stop after freeze. Do **not** continue to the next sprint in this deliverable.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Feed Philosophy |
| 2 | Content Hierarchy |
| 3 | Feed Composition |
| 4 | Content Rhythm |
| 5 | Card Priority |
| 6 | Interaction Model |
| 7 | Creation Entry |
| 8 | Empty States |
| 9 | Personalization Principles |
| 10 | Future Expansion |
| 11 | Audit Checklist |

---

# 1. Feed Philosophy

## 1.1 Role

The Home Feed is the **heart of GMRLOG** — not “another timeline.”

It is where gamers naturally spend hours because it answers:

> **What is happening in gaming right now?**

Not:

> What reviews were written today?

## 1.2 Optimize for

| Optimize for | Do not optimize for |
|--------------|---------------------|
| Daily engagement | Review volume |
| Six-pillar life | Single-pillar monoculture |
| Friend + taste presence | Pure chronological dump |
| Magazine rhythm | Infinite identical cards |
| “Enter my gaming world” | “Open a social inbox” |

## 1.3 Recognizability

After this freeze, Home must be impossible to confuse with Twitter, Reddit, Steam, Letterboxd, or Discord alone.

It should read instantly as **GMRLOG** via:

- Mixed pillar types + varied card heights  
- Ember Rail on story/log cards only  
- Review Ledger · Collection Shelf · Tier preview · Activity rows  
- Quiet Story Ember energy — alive, not noisy  

## 1.4 What the feed is not

- Not a review river  
- Not a chat log  
- Not a store feed  
- Not an algorithmic casino  
- Not a notification center (that is the Notifications tab)

---

# 2. Content Hierarchy

## 2.1 Allowed content types (mix)

| Type | Pillar | Signature / card | Phase |
|------|--------|------------------|-------|
| Friend Activity | Social · Logging | Activity Card | Core |
| Posts | Social | Post Card | Core |
| Reviews | Logging | Review Card | Core |
| Game Logs | Logging | Activity Card (log) / compact log row | Core |
| Collections | Library | Collection Shelf | Core |
| Tier Lists | Identity · Social | Tier List Card | Core |
| Achievements | Identity | Achievement / micro Activity | Alpha |
| Recommendations | Discovery | Recommendation Card (Game Card featured + reason) | Core |
| Discussion | Communities | Discussion Card | Beta |
| Developer Posts | Social · Discovery | Post Card + identity chip | Future |
| Communities | Communities | Community Card preview | Future |
| Premium Articles | Social · Creator | Editorial reserved (`contentFormat: article`) | Future |
| System Activity | System | Micro row | Rare |

**No content type dominates.** Reviews are equal citizens with taller cards when shown — not majority share.

## 2.2 Semantic groups (for composition)

| Group | Types | Role in “what’s happening” |
|-------|-------|----------------------------|
| **Presence** | Friend Activity, Game Log | Who is playing / just finished |
| **Voice** | Post, Discussion | What people are saying |
| **Taste** | Review, Collection, Tier List | What people value |
| **Progress** | Achievement, Completion signals | What people accomplished |
| **Discovery** | Recommendation | What you might enter next |
| **World** | Developer / Community / Article | Broader culture (phased) |

---

# 3. Feed Composition

## 3.1 Screen anatomy (Home root)

```
┌─────────────────────────────┐
│ Top chrome (title / optional search affordance → Discover)
├─────────────────────────────┤
│ Optional: soft composer prompt strip (dismissible)
├─────────────────────────────┤
│ Feed viewport (vertical magazine)
│   [cards with rhythm gaps]
├─────────────────────────────┤
│ FAB (compose) · Tab bar
└─────────────────────────────┘
```

No permanent Stories rail in Core (Master future). No second nav inside Home.

## 3.2 Hero spacing

| Zone | Rule | Why |
|------|------|-----|
| Top inset | `space.4` under chrome | Calm entry; not a marketing hero dump |
| First card | May be Presence or Voice — not forced Review | Answers “what’s happening” immediately |
| No full-bleed promo hero in Core | Avoid store energy | Home is culture, not campaign wall |
| Pull-to-refresh | Standard; preserves scroll intent | Freshness without reshuffling identity |

“Hero” in Home = **first meaningful activity**, not a branded billboard.

## 3.3 Section rhythm

- Prefer **implicit rhythm** (card type changes) over heavy section headers.  
- Headers only for rare inserts: “Suggested for you”, “Because you play…”, “From communities you follow” (Future).  
- Between groups: breathing gap tokens from F1 (`space.2`–`space.5` by card class — see §4).

## 3.4 Card ordering principles (architecture — not an algorithm)

Ordering is a **composition contract** for product/engineering. Exact ranking math is out of scope.

| Factor | Priority intent | Why |
|--------|-----------------|-----|
| **Friend weighting** | Strong boost for people you follow / friends | Home feels like *your* world (Discord/Spotify social presence without copying UI) |
| **Freshness** | Recency matters within a type | “Right now” promise |
| **Social signals** | Soft boost for meaningful engagement (comments, helpful) — not raw like-bait | Quality conversation over virality spam |
| **Pillar diversity** | Hard constraint: avoid same-type streaks (§4) | Magazine + six pillars |
| **Recommendation weighting** | Sparse inserts; never wall of games | Discovery without Steam-store feel |
| **Current games / taste** | Soft affinity from onboarding + library signals | Personal without noisy personalization |
| **Self posts** | Appear naturally; do not pin own content at top forever | Honesty |

**Why not pure chrono:** Chronology alone recreates Twitter and lets one type flood.  
**Why not pure algo noise:** Violates Master trust and “never algorithmically noisy.”

## 3.5 Feed modes (same stack)

| Mode | Intent | Phase |
|------|--------|-------|
| **Home (default)** | Mixed “what’s happening” | Core |
| Following-only | Friends/presence emphasis | Alpha optional segment |
| Discover-tinged inserts | Recs inside Home | Core sparse |

Segments must not become separate apps — same composition rules.

---

# 4. Content Rhythm

## 4.1 Hard rules

1. **Never** allow Review → Review → Review → Review (or any single type ×4).  
2. **Max same type consecutive:** **2**.  
3. After 2 identical, insert a different **group** (Presence / Voice / Taste / Progress / Discovery).  
4. In any window of **10** cards, at least **4 distinct types** when inventory allows.  
5. Recommendations: at most **1 per ~8–12** cards in Core (sparse).  
6. System micro rows: never cluster; at most 1 in a short viewport.

If inventory is thin, prefer Empty/hopeful inserts (§8) over breaking rhythm with filler spam.

## 4.2 Example rhythm (canonical)

```
Friend Activity
  → Review
  → Post
  → Collection
  → Recommendation
  → Achievement
  → Game Log
  → Tier List
  → Discussion
  → Review
  → Post
```

## 4.3 Height & breath (magazine)

| Card class | Approx. visual weight | Gap after (token intent) |
|------------|----------------------|---------------------------|
| Largest | Tall | `space.4`–`space.5` |
| Medium | Mid | `space.3`–`space.4` |
| Compact | Short | `space.2`–`space.3` |
| Micro | Minimal | `space.2` |

Varied heights are **mandatory** for recognizability. Flat identical rows feel like Twitter/Reddit.

## 4.4 Ember Rail rhythm

- **With rail:** Review, Game Log (story), logging Friend Activity  
- **Without rail:** Post, Recommendation, most Friend Activity, Discussion  
- Pattern of rail / no-rail becomes a GMRLOG signature in scroll

---

# 5. Card Priority (visual)

Visual size ≠ content dominance. Large cards appear less often; compact cards keep the feed alive.

| Priority | Types | Composition notes |
|----------|-------|-------------------|
| **Largest** | Review | Review Card / Ledger; `body.lg` excerpt; Ember Rail |
| **Medium** | Collection · Recommendation · Game Log | Shelf / featured Game Card + reason / log row with cover |
| **Compact** | Post · Friend Activity | Type-first Post; Activity ~64–72h |
| **Micro** | Achievement · System Activity | Single-line / thin; low chrome |

### Mapping to F1 signatures

| Type | F1 component |
|------|----------------|
| Review | Review Card |
| Post | Post Card |
| Collection | Collection Shelf |
| Tier List | Tier List Card |
| Recommendation | Recommendation Card |
| Friend Activity / Game Log | Activity Card (+ rail if log) |
| Achievement | Achievement Card or micro Activity variant |

No one-off Home-only cards without F1 amend.

---

# 6. Interaction Model

## 6.1 Per-card entry points

| Card | Primary tap | Secondary tap | Overflow (⋯) |
|------|-------------|---------------|--------------|
| **Friend Activity** | Object (Game / Post / Profile per verb) | Actor → Profile | Hide · Report · Unfollow (if applicable) |
| **Post** | Post Detail | Avatar → Profile; game chip → Game | Share · Save · Report · Hide · Copy link |
| **Review** | Review Detail | Avatar → Profile; cover → Game; spoiler control | Share · Save · Report · Hide · Spoiler prefs |
| **Game Log** | Game Detail or Timeline entry | Actor → Profile | Hide · Report |
| **Collection** | Collection Detail | Owner → Profile | Share · Save · Report · Hide |
| **Tier List** | Tier Detail | Owner → Profile | Share · Save · Report · Hide |
| **Recommendation** | Game Detail | “Why” expand (inline) | Hide suggestion · Not interested · Save |
| **Achievement** | Game or Profile achievements | Actor → Profile | Hide |
| **Discussion** | Discussion Detail | Community → Community Home | Share · Report · Hide |
| **Article (future)** | Article Reader | Author → Profile | Share · Save · Report |

### Global actions

| Action | Behavior |
|--------|----------|
| **Share** | System / Share sheet (F2.1 modal) |
| **Save / Bookmark** | Future Bookmarks home; optimistic save on card |
| **Report** | Report flow (Dialog/Sheet) |
| **Hide** | Remove from *this* feed view; does not delete content |
| **Like** | Toggle on card; count update; no navigation |
| **Comment** | Primary opens detail focused on composer when from action bar |

Navigation always returns via stack back to Home position (F2.1).

## 6.2 Microinteractions (behavior only — F1 motion)

| Action | Behavior |
|--------|----------|
| **Like** | Fill icon; count +1; `motion.like`; no particles |
| **Bookmark** | Stroke → fill; toast optional first time |
| **Comment** | Opens detail; optional inline preview count |
| **Expand / Collapse** | Activity or “why recommended” inline; 200ms |
| **Read More** | Review/Post excerpt → expand in place **or** detail if long; prefer detail for reviews |
| **Spoiler** | Tap reveal with confirm if needed; state announced |
| **Media Preview** | Tap → Media Viewer fullscreen; swipe dismiss |

No bounce. No flashy effects.

---

# 7. Creation Entry

Users should **naturally** create without pressure.

## 7.1 Entry points

| Entry | When | Opens |
|-------|------|-------|
| **FAB** | Always on Home (F2.1) | Compose chooser sheet: Post · Log/Review · Collection · Tier |
| **Soft prompt strip** | New/low-activity users; dismissible | Same chooser or deep to Log |
| **Contextual card CTA** | Rare — e.g. after finishing a game signal | “Log this?” / “Write a review” — max one soft prompt, easy dismiss |
| **Empty state CTAs** | §8 | Hopeful create / follow |

## 7.2 Prompt directions (not final copy)

Inspiration aligned with F2.2.1 identity voice:

- “What are you playing?”  
- “What happened in your games today?”  
- “Capture a moment — post or log”  
- “Write a review” (never the only prompt)

**Not intrusive:** no modal on every cold start; no blocking nags; no guilt streaks.

## 7.3 After create

Optimistic insert near top **with rhythm respect** (may sit under one Presence card). Return focus to Home.

---

# 8. Empty States

Philosophy: **hopeful, never barren.** Always a next step into the world.

| Situation | Feeling | Content strategy |
|-----------|---------|------------------|
| **Brand new user** | Welcome to your world | Seed: recommendations + onboarding taste recs + “Follow players” + soft “What are you playing?” |
| **Few friends** | Still alive | Taste-based recs + trending posts/reviews (Discovery) + follow suggestions — not a blank void |
| **No activity** | Quiet evening, not broken | Recs + “Log a game” + rediscover shelves; gentle copy |
| **Offline** | Understood | Cached last feed if any + Offline state (F2.2 tone) + Retry |
| **No recommendations** | Honest | Friend/presence emphasis + create entry + Discover tab nudge |

Never show a stark empty rectangle with only “No posts yet.”

Guest preview (F2.2.1): Public Home Preview may show public/global rhythm; interaction → soft auth gate.

---

# 9. Personalization Principles

## 9.1 Prioritize (soft)

1. Friends / following  
2. Current games / recently played  
3. Favorite genres · developers · platforms (identity discovery)  
4. Communities (future)  
5. Sparse recommendations  

## 9.2 Guardrails

| Guardrail | Why |
|-----------|-----|
| Diversity hard rules (§4) | Prevent monoculture |
| No engagement bait ranking as primary | Trust / culture OS |
| Transparent sparse “Suggested” labels | User control |
| Hide / Not interested | Local correction |
| Never noisy | Master: alive without noise |
| No pay-to-boost in feed | Creator Economy ethics |

**Out of scope here:** ranking formulas, ML, backend jobs.

---

# 10. Future Expansion

| Addition | How it enters Home |
|----------|-------------------|
| Developer Posts | Voice group; identity chip; rhythm rules apply |
| Communities / Discussions | Already in rhythm example; denser when Beta |
| Premium Articles | Editorial card height ≤ Review; never paywall others’ feed |
| Following segment | Same composition engine |
| Live presence | Compact Presence rows — not a chat takeover |
| Ads / sponsored | **Not in Home Core vision** without Master amend; if ever, must not break rhythm or trust |

New types require: F1 component (or composition) + this doc amend + rhythm class assignment.

---

# 11. Audit Checklist

- [ ] Answers “What is happening in gaming right now?”  
- [ ] Not review-optimized / not review river  
- [ ] All Core types representable; no type dominates  
- [ ] Max 2 consecutive same type; magazine heights  
- [ ] Friend weighting + freshness + sparse recs explained  
- [ ] Card priority Largest→Micro mapped to F1 signatures  
- [ ] Primary / secondary / overflow defined per card  
- [ ] FAB + non-intrusive create prompts  
- [ ] Empty states hopeful, never barren  
- [ ] Personalization soft; not algorithmically noisy  
- [ ] Microinteractions within F1 motion  
- [ ] Ember Rail only on story/log  
- [ ] Unmistakably GMRLOG vs Twitter/Reddit/Steam/Letterboxd/Discord  
- [ ] No RN / backend / algo / pixel Figma in this sprint  
- [ ] F2.1 Home stack + FAB respected  

---

## Success criteria

| Criterion | Met |
|-----------|-----|
| Daily engagement architecture | Yes — presence + voice + taste + discovery mix |
| Impossible to confuse with single-platform clones | Yes — signatures + rhythm + rail pattern |
| Reviews equal, not central | Yes — largest card, not majority rule |
| F2.4+ can compose Home from this + F1 | Yes |

---

## Final gate

### APPROVED

Sprint F2.3 Home Feed Architecture & Screen Composition is **LOCKED**.

Stop. Do **not** continue to the next sprint in this output.

---

## Related documents

| Doc | Role |
|-----|------|
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Six pillars, magazine feed DNA |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | Signature cards |
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | HomeStack, FAB, modals |
| [SPRINT_F2_2_1_AUTH_POLISH.md](./SPRINT_F2_2_1_AUTH_POLISH.md) | Guest public Home preview |
| [SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) | Identity refinement amendment |
| [SPRINT_F2_7_HOME_FEED.md](./SPRINT_F2_7_HOME_FEED.md) | Discovery architecture & heartbeat framing |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Feed philosophy, mix, rhythm, composition, interactions, create, empty, personalization |
