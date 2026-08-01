# GMRLOG — Sprint F2.4.1: Game Identity Refinement

**Document:** `docs/02_DESIGN/SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F2.4.1 (Product identity refinement only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Amendment to Game Detail SSOT (emotional identity)

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) |
| 5 | [`SPRINT_F2_4_GAME_EXPERIENCE.md`](./SPRINT_F2_4_GAME_EXPERIENCE.md) — **base Game Detail freeze** |
| 6 | **This amendment** — living journey / identity behaviors |

### Amendment rules

- **F2.4 remains the authority** for section hierarchy, personal/friends/community layers, actions, empty states, and structural composition.
- This document **refines emotional identity** so Game Detail becomes a living memory — not a catalog.
- On conflict of *journey / pulse / memory / Known For / return hooks*: **this amendment wins**.
- On conflict of *section order / stacks / F1 components / primary actions list*: **F2.4 + F2.1 + F1 win**.
- **Do not** change layout, redesign UI, touch React Native, Figma pixels, or backend. No Sprint F2.5 in this deliverable.

---

## Goal

Turn Game Detail from **“a game information page”** into **“a living memory of the player’s journey.”**

### Product principle (permanent on this surface)

The page is **never only about the game**.

It is about:

**Player + Community + Game**

Every refinement reinforces that triad. Aligns F2.4 “what does this game mean to me?” and F2.3.1 gaming graph.

**Screenshot test:** Without the logo, the page reads as GMRLOG — a living relationship, not a game database.

---

# 1. Journey Philosophy

## 1.1 Journey, not History

| Prefer | Avoid |
|--------|-------|
| **Journey** — continuous relationship | **History** — cold archive / log dump |
| Ongoing bond with the title | One-off “played once” ledger energy |
| Moments that accumulate meaning | Status fields as the whole story |

F2.4 Personal Relationship and GameLog Timeline remain the **vehicles**. This amendment names the **emotional frame**: Journey.

## 1.2 Philosophy (architecture only — do not design the timeline)

A player’s relationship is a **sequence of meaningful moments**, not a single status enum.

### Example journey moments (illustrative)

- Added to Wishlist  
- Bought / Owned  
- Started Playing  
- First Session  
- Played 10 Hours  
- Beat First Boss  
- Finished Main Story  
- Completed 100%  
- Wrote Review  
- Added to Favorites  
- Recommended  

Moments may be system-derived (status, playtime thresholds) or player-authored (review, recommend). **No new UI timeline redesign** — philosophy guides how Personal / Log surfaces speak.

## 1.3 Why it belongs

Steam pages sell; databases list fields. GMRLOG narrates **continuity** — Goodreads/Letterboxd journey behavior without copying UI.

---

# 2. Game Pulse

## 2.1 What it is

A **lightweight, title-scoped** alive surface:

> What is happening **with this game** right now?

**Not** global Gaming Pulse (Home F2.3.1). **Not** breaking news. **Not** a hero banner.

## 2.2 Placement (architecture)

- Within Game Detail — typically near Hero / above or beside Community sampler  
- Compact; one primary signal or a tiny set of calm chips  
- Collapses when no signal (no empty chrome)

## 2.3 Examples (this game only)

- People playing now  
- Reviews today  
- Logs today  
- Collections this week  
- Friends currently active on this title  

## 2.4 Behavior

| Behavior | Freeze |
|----------|--------|
| Scope | **Only this game’s graph** |
| Tap | Filtered community / friends / reviews / logs for this title |
| Tone | Quiet life (F2.3.1 Social Momentum) |
| Rotation | Soft refresh; no flashy mandate |

## 2.5 Why it belongs

Makes the destination feel **alive** between personal visits — Discord/Steam presence behavior scoped to one node of the graph.

---

# 3. Emotional Moments

## 3.1 Philosophy

**Dates become memories.**

Absolute ISO timestamps are for systems and rare precision needs — not the default human voice of Journey.

| Prefer | Avoid (as default) |
|--------|---------------------|
| Yesterday | 2026-04-17 |
| Last weekend | 2026-04-12T18:03:00Z |
| 2 years ago | Raw epoch |
| First played 3 years ago | “Created at” jargon |
| Completed 6 months ago | Unrelatable precision |

## 3.2 Rules

- Relative / autobiographical phrasing for Personal Journey and Living Activity on this page.  
- Exact date available on demand (detail, accessibility, long-press/overflow) — architecture allows precision without leading with it.  
- Consistency with F2.3.1 Living Activity story tone.  
- Locales later; principle is **memory-first**.

## 3.3 Why it belongs

Memory language is how the page becomes an **archive of feeling**, not a CRM record.

---

# 4. Living Community

## 4.1 Principle

Community is **not only reviews**.

Lightweight **cultural signals** express how players live inside the title.

## 4.2 Example signals (architecture only)

- Most discussed boss  
- Favorite companion  
- Most common ending  
- Most used tag  
- Most shared screenshot  
- Most replayed chapter  

## 4.3 Rules

- Appear as calm chips / micro facts under Community — never a noisy wiki dump.  
- Spoiler-sensitive signals respect Spoiler discipline (F1 / F2.4).  
- Optional / phased when data exists; hide when empty.  
- **No AI requirement** — player- and community-derived signals only for this freeze.  
- No implementation in this sprint.

## 4.4 Why it belongs

Reddit/Letterboxd culture density without thread-wall UI — **Player + Community + Game**.

---

# 5. Game Identity (“Known For”)

## 5.1 Principle

A game should have **personality** beyond metadata rows.

Genre · Platform · Developer remain necessary — they are not sufficient.

## 5.2 Known For

Player-created (and community-amplified) identity tags, e.g.:

- Difficult Bosses  
- Emotional Story  
- Amazing OST  
- Relaxing Exploration  
- Fast Combat  

## 5.3 Rules

| Rule | Freeze |
|------|--------|
| Source | **Player-created identity** — community taste language |
| AI | **No AI** generation in this architecture freeze |
| Implementation | None now — reserve chip row / section near Hero or under Community |
| Relationship | Complements genres; does not replace them |
| Moderation | Future trust & safety — out of scope here |

## 5.4 Why it belongs

Identity language is GMRLOG’s taste layer — Letterboxd “vibes” behavior for games, original surface.

---

# 6. Return Hooks

## 6.1 Principle

Game Detail should invite **natural return** — never guilt, streaks, or dark patterns.

## 6.2 Example hooks (directional)

- 3 new reviews since your last visit  
- 2 friends started playing  
- Community activity increased  
- Your last session was 5 days ago  
- Continue your journey  

## 6.3 Principles only

| Principle | Meaning |
|-----------|---------|
| **Informative** | State what changed — explainable (trust > engagement) |
| **Actionable** | One calm CTA (Continue journey / Log / See reviews) |
| **Scoped** | About *this* game + *your* relationship |
| **Quiet** | Appear sparingly (banner/chip) — not every scroll |
| **Opt-soft** | Dismissible; never block browsing |
| **No panic** | Security-calm tone from Auth polish; no FOMO spam |

## 6.4 Why it belongs

Return gravity without notification addiction — Home Pulse’s cousin on a single graph node.

---

# 7. Player Memory

## 7.1 Principle

The page is a **personal archive** of the journey — not only current status.

## 7.2 Memory facets (architecture only)

| Facet | Intent |
|-------|--------|
| **Milestones** | Journey moments unlocked along the way |
| **Favorite moments** | Player-marked memories (future authoring) |
| **Longest session** | Lived intensity signal |
| **Most active month** | Temporal identity with the title |
| **Anniversary** | First played / completed anniversary cue |
| **Replay history** | New Game+ / replay cycles as journey chapters |

## 7.3 Rules

- Lives inside **Personal Relationship** conceptually (F2.4 § Personal).  
- Surface selectively — archive ≠ dump every statistic.  
- Emotional Moments date language applies.  
- No charts required; no UI redesign in this sprint.

## 7.4 Why it belongs

“My history with this game” becomes tangible memory, not a progress bar alone.

---

# 8. Creator Expansion

Reserve without redesign (extends F2.4 creator-ready):

| Reserved | Role on Game Detail |
|----------|---------------------|
| Developer Diaries | Dev identity + pinned community slot |
| Community Guides | Guides section |
| Video Essays | Media-forward editorial family |
| Walkthroughs | Guides subtype |
| Lore | Guide/article flavor |
| Strategies | Guide subtype |

Same Content object family; graph-linked to this game; Premium enhances creators — never paywalls reading culture.

---

# 9. Gaming Graph

## 9.1 Strengthen the rule

Everything on this page stays **linked**. Nothing exists in isolation.

| Connected | To |
|-----------|-----|
| Reviews · Posts · Logs | This Game |
| Collections · Tier Lists | This Game (+ owner) |
| Achievements | This Game (+ player) |
| Articles · Guides | This Game (one or many) |
| Developers / Studios | This Game |
| Characters (future) | This Game |

## 9.2 Continuity

- Inbound from Home / Profile / Search preserves graph context.  
- Outbound taps use F2.1 shared stacks.  
- Aligns F2.3.1 mandatory game graph + F2.4 hub-node role.

---

# 10. Identity Audit

Before Game Detail UI sign-off:

- [ ] Framed as **Journey**, not cold History  
- [ ] Player + Community + Game triad visible in composition intent  
- [ ] Game Pulse present or honestly absent — title-scoped only  
- [ ] Emotional / relative moments preferred over raw dates  
- [ ] Living Community signals beyond reviews (when data exists)  
- [ ] Known For reserved as player-created identity — no AI in this freeze  
- [ ] Return hooks calm, explainable, non-coercive  
- [ ] Player Memory facets architected under Personal  
- [ ] Creator slots (diaries, guides, essays, walkthroughs, lore, strategies) reserved  
- [ ] Full gaming graph — no isolated objects  
- [ ] Screenshot reads GMRLOG without logo  
- [ ] Feels like living relationship, not database  
- [ ] F2.4 hierarchy / actions / empty states unchanged  
- [ ] No layout / RN / Figma / backend in this amendment  

---

## Amendment summary vs F2.4

| Area | Change |
|------|--------|
| Journey philosophy | **Refine** Personal/Log emotional frame |
| Game Pulse | **New** title-scoped alive surface |
| Emotional Moments | **New** memory-first time language |
| Living Community | **Expand** beyond reviews |
| Known For | **New** player-created game personality |
| Return Hooks | **New** natural revisit principles |
| Player Memory | **Expand** personal archive facets |
| Creator Expansion | **Confirm** richer reserved types |
| Gaming Graph | **Strengthen** mandatory linking |
| Section layout / actions | **Unchanged** |

---

## Final gate

### APPROVED

**Sprint F2.4.1 Game Identity Refinement LOCKED**

Part of the **Game Detail SSOT** together with F2.4.

Stop. Do **not** continue to Sprint F2.5.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_4_GAME_EXPERIENCE.md](./SPRINT_F2_4_GAME_EXPERIENCE.md) | Base Game Detail freeze |
| [SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) | Pulse / graph / living activity kinship |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Culture OS · identity |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Journey, Game Pulse, emotional moments, living community, Known For, return hooks, memory, creator, graph |
