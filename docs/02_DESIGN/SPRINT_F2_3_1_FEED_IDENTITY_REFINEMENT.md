# GMRLOG — Sprint F2.3.1: Feed Identity Refinement

**Document:** `docs/02_DESIGN/SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.3.1 (Product behavior / identity refinement only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Amendment to Home Feed SSOT (identity behaviors)

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md`](./SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md) + [`SPRINT_F2_2_1_AUTH_POLISH.md`](./SPRINT_F2_2_1_AUTH_POLISH.md) |
| 6 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) — **base Home Feed freeze** |
| 7 | **This amendment** — identity behaviors that make the feed unmistakably GMRLOG |

### Amendment rules

- **F2.3 remains the authority** for feed anatomy, rhythm hard rules, card priority, interactions, FAB, empty states, and composition mechanics.
- This document **refines product identity and behavior** so Home becomes “the only place gamers naturally return to.”
- On conflict of *identity / graph / explainability / mix philosophy*: **this amendment wins**.
- On conflict of *card specs / nav / stacks / F1 components*: **F2.3 + F1 + F2.1 win**.
- **Do not** redesign the Home Feed, add business features, invent algorithms, create UI, or continue to F2.4.

**Out of scope:** Visual redesign, React Native, backend, recommendation engine math, pixel Figma, new tabs.

---

## Goal

Transform Home from **“a good gaming feed”** into **“the place gamers naturally return to.”**

Still not: Twitter for gamers · Letterboxd for games · Steam Community · Discord · Reddit.  
Still yes: **best behaviors combined** into one culture OS (Master).

One screenshot should read **“This is GMRLOG”** without needing the logo — via Pulse + living activity + game graph + quiet momentum + explainable discovery.

---

# 1. Gaming Pulse

## 1.1 What it is

A **lightweight, always-changing surface** that answers immediately:

> What is happening in gaming right now?

**Not:** Stories · Breaking News · Large Hero Banner · store takeover.

**Is:** Small · alive · rotating · calm Story Ember energy.

## 1.2 Placement

| Placement | Rule |
|-----------|------|
| **Where** | Home viewport **top**, below chrome, **above** the magazine feed |
| **Height** | Compact — roughly one Activity/micro band, not a hero |
| **Persistence** | Always available when online and inventory exists; collapses gracefully when empty (do not leave a barren strip) |
| **Scroll** | May sticky-lite or scroll away with feed — product UI sprint decides; architecture: must not steal magazine rhythm below |

Does **not** replace the first feed card; it **frames** the feed.

## 1.3 Content examples (rotating slots)

Pulse shows **one primary signal** at a time (or a tiny horizontal set of 2–3 chips max — never a carousel circus):

- Most logged game today  
- Friends currently playing (count + exemplar)  
- Biggest review today (engagement or helpful — quality, not ragebait)  
- Trending collection  
- Hot discussion  
- (Future) Platform / culture highlight  

## 1.4 Behavior

| Behavior | Freeze |
|----------|--------|
| Rotation | Quietly advances on interval or on refresh — no flashy animation mandate |
| Tap | Deep-links to Game / Review / Collection / Discussion / filtered Presence |
| Dismiss | Optional “hide Pulse today” — not required for Core |
| Personalization | Soft: friends-weighted when possible; else platform pulse |
| Empty | Hide Pulse entirely; feed empty-state philosophy (F2.3 §8) handles hope |

## 1.5 Why it belongs

- Delivers the **Home question** in one glance before scroll.  
- Differentiates from Twitter (no pulse of *games culture*) and Letterboxd (not review-only).  
- Stays subtle — Master: alive without noise; F2.3: no marketing hero.

---

# 2. Living Activity

## 2.1 Principle

Friend Activity must not feel like **database entries**.

They are **tiny stories** — memory and presence in one line.

## 2.2 Formatting philosophy

| Prefer | Avoid |
|--------|-------|
| Human verbs + game identity | Raw status codes (`STATUS=COMPLETED`) |
| Specific moments when known | Generic “updated a game” |
| Time/context as story spice (hours, boss, trophy) | Metric spam |
| Actor + deed + object | Actor + icon + opaque entity id |

### Directional examples (not final copy)

- Ahmed finished Cyberpunk after 62h.  
- Sarah finally defeated Malenia.  
- John created a Souls Collection.  
- Emma reached Platinum Trophy.  

## 2.3 Rules

- Use **Activity Card** (F1); Ember Rail when the verb is a **log/story** deed.  
- One primary sentence; secondary meta stays tertiary.  
- Prefer **named game** over abstract “a game.”  
- Spoilers: boss/ending beats use Spoiler discipline when needed.  
- Still compact (F2.3 Compact class) — living ≠ long.

## 2.4 Why it belongs

Presence is how Home feels like a **world**, not a CMS. Inherits Discord/Spotify “friends playing” behavior without copying UI.

---

# 3. Gaming Graph Principle (mandatory)

## 3.1 Permanent product rule

**No isolated content.** The **gaming graph** is the product.

Every content object should **optionally (prefer: usually) connect** to one or more games.

| Object | Game connection |
|--------|-----------------|
| Review | **Required** → Game |
| Post | **Optional** → Game (encouraged when about play) |
| Article (future) | **One or many** Games |
| Collection | **Games** (shelf) |
| Tier List | **Games** |
| Achievement | **Game** |
| Recommendation | **Game** |
| Game Log | **Game** |
| Discussion | **Optional / community + game** when relevant |
| Friend Activity | **Object resolves to Game** when verb is play/log/complete |

## 3.2 UX implications (architecture)

- Cards expose a **game chip / cover / title** affordance → Game Stack (F2.1).  
- Feed composition prefers graph-connected items when ranking inventory (philosophy only).  
- Orphan social posts allowed but should not dominate the mix.  
- Aligns Master Content Architecture + Library/Logging pillars.

## 3.3 Why it belongs

Without the graph, GMRLOG collapses into generic social. With it, every scroll strengthens **discover · remember · discuss · identity**.

---

# 4. Social Momentum

## 4.1 Principle

The feed should quietly say: **people are playing.**

Not a dashboard. Not a noisy ticker.

## 4.2 Surfaces

| Surface | Examples | Noise rule |
|---------|----------|------------|
| **Pulse** | “4 friends playing Elden Ring” | One signal |
| **Micro / system row** (rare) | “27 friends active today” | Micro class; max rarity per F2.3 |
| **Inline on Presence** | “and 3 others” | Tertiary |
| **Reco reason** | “12 reviews today” only if explainable and calm | Never vanity walls |

Directional examples:

- 27 friends active today  
- 12 reviews today  
- 8 collections this week  
- 4 people started Elden Ring  

## 4.3 Why it belongs

Momentum creates **return gravity** without notifications spam. Steam/Discord life-signal behavior; Letterboxd quiet culture — combined, not copied.

---

# 5. Discovery Balance

## 5.1 Philosophy

**Following is not enough.** A culture OS must also widen the world — or Home becomes a private silo (and dies when the graph is small).

Suggested mix target (composition intent — **not** an algorithm):

| Bucket | Share | Meaning |
|--------|-------|---------|
| **Following** | ≈ **60%** | Friends / follows — your world |
| **Discovery** | ≈ **25%** | Taste-adjacent, graph expansion, soft recs |
| **Platform Highlights** | ≈ **15%** | Pulse-worthy culture moments, trending quality, editorial-light |

## 5.2 Why these ratios

- **60% Following** — belonging and daily return (identity home).  
- **25% Discovery** — prevents echo chamber; serves “what’s happening” beyond your circle.  
- **15% Highlights** — platform pulse without becoming Steam News or Reddit front page.

Still subject to F2.3 **rhythm hard rules** (max 2 consecutive same type, sparse recs). Balance is about *source*, rhythm about *type*.

## 5.3 Guardrails

- Highlights never outshout friends.  
- Discovery remains **explainable** (§6).  
- New users: Discovery/Highlights may temporarily rise until Following graph exists (hopeful empty → living feed).

---

# 6. Explainability (“Why am I seeing this?”)

## 6.1 Principle

**Trust > engagement.** No mysterious ranking.

Every **recommendation / discovery / highlight** insert should carry a calm reason.

### Directional examples

- Because you reviewed Persona.  
- 3 friends interacted.  
- Trending among RPG players.  
- You completed Silent Hill.  

## 6.2 Rules

| Rule | Freeze |
|------|--------|
| Visibility | Inline caption or expandable “Why” (F2.3 Recommendation secondary) |
| Tone | Helpful, not manipulative |
| Action | “Hide suggestion” / “Not interested” remains (F2.3) |
| Following-native content | No forced “why” on friend posts — obvious social context |
| Forbidden | Dark patterns, fake scarcity, unexplained boosts |

## 6.3 Why it belongs

Differentiates from opaque social feeds; aligns Creator Economy ethics and Master trust.

---

# 7. Content Object Philosophy (permanent)

## 7.1 Rule

Every content object should **strengthen the gaming ecosystem**.

Nothing exists **only** to increase screen time.

Everything should help at least one of:

| Purpose | Meaning |
|---------|---------|
| **Discover** | Find games, people, communities, taste |
| **Remember** | Logs, completions, shelves, timelines |
| **Discuss** | Posts, reviews, discussions, comments |
| **Express identity** | Profile-facing taste, tiers, collections, style |

## 7.2 Feed implication

If an insert cannot claim one purpose + graph connection (when applicable), it does not belong in Home.

This is a **product gate** for future types (articles, series, promos).

---

# 8. Creator Economy Readiness

**Do not implement.** Architecture only — no redesign later.

| Future type | How Home absorbs it without redesign |
|-------------|--------------------------------------|
| **Articles** | Content `format: article`; card class ≤ Review height; game graph multi-ref; editorial typography tokens (F1 reserved) |
| **Guides** | Communities/Discovery group; game-linked; rhythm as Discussion/medium |
| **Developer posts** | Post Card + Developer identity chip; Voice group; explainable when boosted as Highlight |
| **Creator Series** | Linked posts/articles as a thread affordance later; still graph-bound; never paywall others’ feed |

Premium enhances creators; **never** paywalls culture in the feed (Master / F2.3).

Composer chooser (F2.1/F2.3) gains types later without changing Home anatomy.

---

# 9. Feed Identity Audit

Before any Home UI implementation sign-off:

- [ ] Gaming Pulse present (or honestly absent when empty) — not Stories/News/Hero  
- [ ] Friend Activity reads as tiny stories, not DB rows  
- [ ] Gaming graph: content connects to games; no orphan-dominated feed  
- [ ] Social momentum is quiet life, not noisy chrome  
- [ ] Mix intent ≈ 60 / 25 / 15 (Following / Discovery / Highlights) without breaking rhythm  
- [ ] Recommendations explain “why”  
- [ ] Every object serves discover / remember / discuss / identity  
- [ ] Articles/Guides/Dev/Series can enter without Home redesign  
- [ ] Screenshot test: recognizable as GMRLOG without logo  
- [ ] Still not a clone of Twitter / Letterboxd / Steam / Discord / Reddit alone  
- [ ] F2.3 rhythm, card priority, FAB, empty-state hope preserved  
- [ ] No algorithm/API/RN in this amendment  

---

## Amendment summary vs F2.3

| Area | Change |
|------|--------|
| Gaming Pulse | **New** top lightweight surface |
| Living Activity | **Refine** Activity copy/behavior philosophy |
| Gaming Graph | **Mandatory** permanent rule |
| Social Momentum | **New** quiet life signals |
| Discovery Balance | **New** 60/25/15 source philosophy |
| Explainability | **Strengthen** trust rule |
| Content Object Philosophy | **Permanent** product rule |
| Creator Economy Ready | **Confirm** feed absorption paths |
| Card UI / nav / FAB | **Unchanged** |

---

## Final gate

### APPROVED

**Sprint F2.3.1 Feed Identity Refinement LOCKED**

Part of the **Home Feed SSOT** together with F2.3.

Stop. Do **not** continue to Sprint F2.4.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_3_HOME_FEED.md](./SPRINT_F2_3_HOME_FEED.md) | Base Home Feed freeze |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Culture OS · six pillars · Creator Economy |
| [SPRINT_F1_FOUNDATION.md](./SPRINT_F1_FOUNDATION.md) | Activity / signature cards |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Pulse, living activity, game graph, momentum, 60/25/15, explainability, content philosophy, creator-ready |
