# GMRLOG — Sprint F3.3: Visual Hierarchy & Layout System

**Document:** `docs/03_UX/F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F3.3 (UX Visual Hierarchy & Layout System — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UX Visual Organization Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution — especially F2.1 IA · F2.18 · F2.29 |
| 5 | [`F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md`](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) |
| 6 | [`F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md`](./F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) |
| 7 | **This document** — Visual Hierarchy & Layout System |

Never contradict previous freezes.

Never modify F1 · F2 · F3.1 · F3.2.

This sprint answers:

> “What should users notice first?”

rather than:

> “What should the UI look like?”

| Does | Does not |
|------|----------|
| Define visual organization philosophy | Specify colors · type tokens · components |
| Reduce cognitive load via hierarchy | Design for engagement shouting |
| Support F3.2 navigation & F2 IA | Change tabs · stacks · product structure |

**Boundary:** F1 owns tokens/signatures; Master owns brand/recognizability; this freeze owns **order of attention and layout organization** before visual design.

---

## Scope

**In scope:** Visual hierarchy · layout principles · reading flow · information density · whitespace · scan patterns · content prioritization · card/section hierarchy · grouping · progressive disclosure · attention management · visual balance · page rhythm · premium spacing philosophy · gaming-first aesthetic hierarchy · consistency · accessibility implications · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| UI mockups |
| Component design |
| Colors |
| Icons |
| Typography tokens |
| Design system details |
| Animations |
| Backend |
| React Native |
| Implementation |
| Sprint F3.3.1+ |

**Gate:** Stop after freeze. Do **not** continue to Sprint F3.3.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Visual Hierarchy Philosophy |
| 3 | Layout Philosophy |
| 4 | Reading Flow |
| 5 | Information Density |
| 6 | Whitespace Philosophy |
| 7 | Content Prioritization |
| 8 | Section Hierarchy |
| 9 | Card Hierarchy |
| 10 | Progressive Disclosure |
| 11 | Attention Management |
| 12 | Consistency Rules |
| 13 | Accessibility Relationship |
| 14 | Future Ready |
| 15 | Emotional Goal |
| 16 | Audit Checklist |

---

# 1. Mission

Define how every GMRLOG screen should be **visually organized** before any UI components or visual design are created.

Hierarchy exists to:

| Purpose |
|---------|
| Reduce cognitive load |
| Improve readability |
| Reinforce a calm premium gaming home |

It must remain fully compatible with North Star · Master · Entire F1 · Entire F2 · F3.1 · F3.2.

Align F3.1: calm · confident · predictable · one primary purpose per screen.

---

# 2. Visual Hierarchy Philosophy

Visual hierarchy serves **comprehension**.

Never engagement.

| Always | Never |
|--------|-------|
| One obvious starting point | Everything is important |
| Clear primary → secondary → tertiary | Equal-level visual competition |
| Restraint as premium signal | Ornament as premium signal |
| Gaming identity as visual anchor | Clout / metric walls as anchors |
| Support navigation orientation (F3.2) | Compete with “Where am I?” |

## Attention order (philosophy)

| Order | Role |
|-------|------|
| 1 | Place / identity / primary content |
| 2 | Primary action related to that place |
| 3 | Supporting context |
| 4 | Secondary tools |
| 5 | Chrome / metadata |

If level-1 and level-2 shout equally, hierarchy has failed.

---

# 3. Layout Philosophy

Layout is the **quiet architecture** of Digital Home.

| Principle |
|-----------|
| Structure before decoration |
| Rooms (screens) have a clear focal wall |
| Columns / stacks express relationship — not collage chaos |
| Mobile-first organization; desktop expands without changing meaning (Master) |
| Compose F1 signature behaviors — do not invent parallel layout dialects |

Layout answers orientation together with F3.2 navigation.

A new layout system that fights the five-tab mental model is illegitimate.

---

# 4. Reading Flow

Reading should feel **effortless** (F3.1 · F2.18 · F2.12).

| Flow law |
|----------|
| Eye path is predictable: start → meaning → action |
| Long-form (reviews · guides · articles · collections) gets uninterrupted reading corridors |
| Metadata yields to prose when the job is reading |
| Spoilers remain gated — never used as visual bait |

| Never |
|-------|
| Sacrifice readability for density |
| Interrupt reading spine with competing modules |
| Force scan-bait above comprehension |

Scan patterns may support discovery surfaces.

They must not turn reading rooms into feed casinos.

---

# 5. Information Density

Density should communicate **confidence**.

Never overwhelm.

| Dense when | Sparse when |
|------------|-------------|
| Player is in archive / tools mode (Library) | First orientation of a room |
| Comparing structured objects intentionally | Recommendations / suggestions (F2.19 sparse law) |
| Expert continuation after disclosure | Emotional / identity first paint (Profile · Game) |

Magazine rhythm on Home remains law (F2.3): not walls of same-type shouting.

Density is a dial the layout philosophy respects — not a flex of how much fits.

---

# 6. Whitespace Philosophy

Whitespace is **intentional**.

Never empty decoration.

| Whitespace does | Whitespace must not |
|-----------------|---------------------|
| Separate meaning groups | Inflate for “premium” emptiness without purpose |
| Give reading measure and breath | Hide missing hierarchy |
| Signal calm confidence | Create sparse anxiety or sparse neglect |

Premium feeling comes from **restraint**.

Not ornament.

Not accidental void.

---

# 7. Content Prioritization

Every screen declares what matters **first**.

| Prioritize | Defer |
|------------|-------|
| Player relationship / identity / primary content | Vanity metrics |
| Game graph meaning | Engagement chrome |
| Primary action | Secondary tools clusters |
| Authored culture | Imported signal noise (F2.21) |

## Forbidden prioritization

| Ban |
|-----|
| “Everything is important” |
| Monetization modules outranking culture core (F2.26) |
| Notification FOMO outranking place meaning (F2.9) |
| Org / ad modules outranking player protagonism (F2.24) |

Gaming identity remains the visual anchor of Profile and related identity surfaces (F2.5.1).

---

# 8. Section Hierarchy

Sections express **one job** (Master / F3.1 kinship).

| Section level | Role |
|---------------|------|
| Page title / place identity | Where am I? |
| Primary section | What matters here? |
| Supporting sections | Context in order |
| Utility sections | Tools · filters · overflow |

| Rule |
|------|
| Section headers earn their weight by meaning — not by decoration |
| Adjacent sections must not claim equal primacy |
| Section order matches mental model of the room (F3.2) |

No section collage where every block is a hero.

---

# 9. Card Hierarchy

Cards (when interaction requires a container — Master card discipline) follow attention order:

| Card layer | Contains |
|------------|----------|
| Primary signal | Title / game / identity that justifies the card |
| Secondary | Essential context only |
| Tertiary | Metadata · timestamps · soft actions |
| Quaternary | Overflow · rare actions |

| Law |
|-----|
| Hero media never hosts detached promo stickers as competing hierarchy (Master kinship) |
| Signature compositions (F1) keep internal hierarchy stable across surfaces |
| Feed cards obey magazine height / type rhythm — not equal shout |

A card is a sentence.

Not a billboard.

---

# 10. Progressive Disclosure

Progressive disclosure should **simplify**.

Never hide critical functionality.

| Disclose progressively | Must remain findable |
|------------------------|----------------------|
| Advanced filters · rare tools · deep stats | Primary purpose actions |
| Optional personalization depth (F2.20) | Safety · privacy · back · primary compose intents |
| Expert density | Critical navigation (F3.2) |

| Good disclosure | Bad disclosure |
|-----------------|----------------|
| Calm “more” after orientation | Dark-pattern nesting of consent / leave |
| Tools behind clear entry | Critical Report/Block/Privacy buried as clutter control |
| Reading footnotes after prose | Spoiler / safety behind engagement gates |

Simplification without loss of agency.

---

# 11. Attention Management

Attention is a **scarce trust resource**.

| Manage by | Never by |
|-----------|----------|
| Hierarchy · spacing · order | Urgency theater |
| One starting point | Multi-hero competition |
| Sparse suggestion inserts | Continuous interruption |
| Honest labels | Fake scarcity · badge storms |

Align F3.1 emotional design: curious — never anxious.  
Align F2.22 / F2.25: no addiction layout.

If everything shouts, nothing is heard.

---

# 12. Consistency Rules

| Rule |
|------|
| Same content type · same hierarchical grammar |
| Same room type · same starting-point logic |
| Page rhythm repeats enough to feel like home — not enough to bore into blindness |
| Visual balance: weight follows meaning, not trend |
| Desktop expansion preserves mobile meaning order (Master) |
| Hierarchy supports F3.2 answers: Where am I? · What can I do? · How do I return to identity? |

Consistency of hierarchy is part of recognizability.

Novelty that breaks attention order is not innovation (F2.29).

---

# 13. Accessibility Relationship

Hierarchy is an accessibility instrument (F2.18 · F3.1).

| Implication (philosophy) |
|--------------------------|
| Meaning order must not rely on color alone |
| Starting points must be perceivable without ornament |
| Reading corridors remain first-class under larger text / denser needs |
| Reduce Motion must not collapse hierarchy into chaos |
| Cognitive load: one primary purpose remains layout law |

Detailed a11y implementation remains out of scope here.

The organization must be capable of being accessible.

---

# 14. Future Ready

Reserve architecture only:

| Capability |
|------------|
| Explicit hierarchy levels in future layout specs |
| Reading-mode organization variants (F2.18 kinship) |
| Density presets (calm / standard) as agency (F2.20) |
| Desktop multi-column rules that preserve mobile priority order |
| Signature-card internal hierarchy appendices |

No tokens · no components · no mockups.

---

# 15. Emotional Goal

Hierarchy should feel like:

> “I immediately understand what matters.”

Never:

> “I don’t know where to look.”

Never:

> “Everything is shouting for attention.”

---

# 16. Audit Checklist

- [ ] Answers what users notice first — not what UI looks like  
- [ ] Hierarchy serves comprehension — never engagement  
- [ ] One obvious starting point · no equal-level shouting · no “everything important”  
- [ ] Whitespace intentional · density confident · premium = restraint  
- [ ] Reading flow effortless · long-form corridors protected  
- [ ] Section / card hierarchies clear · progressive disclosure simplifies without hiding critical actions  
- [ ] Attention managed calmly · gaming identity remains visual anchor  
- [ ] Supports F3.2 navigation & F2 IA · never modifies prior freezes  
- [ ] Accessibility implications acknowledged  
- [ ] Compatible with F1 · F2 · F3.1 · F3.2  
- [ ] No mockups · colors · icons · type tokens · components · design-system details · RN · F3.3.1  

---

## Final gate

### APPROVED

**Sprint F3.3 — Visual Hierarchy & Layout System LOCKED.**

Stop.

Do **NOT** continue to Sprint F3.3.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) | Calm home · one purpose · reading first-class |
| [F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md](./F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) | Orientation hierarchy must support |
| [SPRINT_F1_FOUNDATION.md](../02_DESIGN/SPRINT_F1_FOUNDATION.md) | Signatures · spacing grid kinship |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Recognizability · card discipline · mobile-first |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Reading · cognitive calm |
| [SPRINT_F2_3_HOME_FEED.md](../02_DESIGN/SPRINT_F2_3_HOME_FEED.md) | Magazine rhythm |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](../02_DESIGN/SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Identity as visual anchor |
| [WIREFRAMES.md](./WIREFRAMES.md) | Subordinate structure sketches (must obey this) |
| [F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md](./F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) | Feedback & gesture feel under hierarchy |
| [F3_5_MOTION_ANIMATION_PHILOSOPHY.md](./F3_5_MOTION_ANIMATION_PHILOSOPHY.md) | Motion under hierarchy · no spectacle |
| [DESIGN_SYSTEM.md](../02_DESIGN/DESIGN_SYSTEM.md) | Later visual patterns (subordinate) |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Visual organization constitution: attention order, density/whitespace, section/card hierarchy, progressive disclosure; no visual design specs |
