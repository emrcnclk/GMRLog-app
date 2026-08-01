# GMRLOG — Sprint F2.19: Intelligence, AI & Recommendation Ecosystem

**Document:** `docs/02_DESIGN/SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§16)  
**Sprint:** F2.19 (Intelligence, AI & Recommendation Ecosystem — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** Platform Intelligence Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) |
| 4 | [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_3_HOME_FEED.md`](./SPRINT_F2_3_HOME_FEED.md) + [`SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md`](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) + [`SPRINT_F2_7_HOME_FEED.md`](./SPRINT_F2_7_HOME_FEED.md) |
| 6 | [`SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md`](./SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md) + [`SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md`](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) |
| 7 | [`SPRINT_F2_10_DISCOVER_SEARCH.md`](./SPRINT_F2_10_DISCOVER_SEARCH.md) |
| 8 | [`SPRINT_F2_12_CREATOR_PLATFORM.md`](./SPRINT_F2_12_CREATOR_PLATFORM.md) |
| 9 | [`SPRINT_F2_13_REPUTATION_RECOGNITION.md`](./SPRINT_F2_13_REPUTATION_RECOGNITION.md) |
| 10 | [`SPRINT_F2_14_ACHIEVEMENT_LEGACY.md`](./SPRINT_F2_14_ACHIEVEMENT_LEGACY.md) |
| 11 | [`SPRINT_F2_16_PREMIUM_MEMBERSHIP.md`](./SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) |
| 12 | [`SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md`](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) |
| 13 | [`SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md`](./SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) |
| 14 | **This document** — Intelligence, AI & Recommendation |

Never contradict previous freezes.

This document **extends** without changing their philosophy:

| Domain | Freeze |
|--------|--------|
| Identity | F2.5 / F2.5.1 |
| Discover | F2.10 |
| Home Feed | F2.3 / F2.3.1 / F2.7 |
| Creator Platform | F2.12 |
| Reputation | F2.13 |
| Legacy | F2.14 |
| Trust & Safety | F2.17 |
| Accessibility | F2.18 |

**This freeze is constitutional:** misdesigned intelligence can poison Identity, Discover, Home, Creator, Reputation, Legacy, and Trust. Its primary job is to lock:

> **AI will never become the protagonist. The player always remains the protagonist.**

---

## Scope

**In scope:** How intelligence should exist inside GMRLOG — philosophy, boundaries, agency, explainability, assistance domains, ethics, privacy & consent.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| UI |
| Backend |
| APIs |
| Database |
| React Native |
| AI model implementation |
| Prompt engineering |
| ML algorithms |
| Recommendation algorithms |
| Ranking formulas |
| Technical architecture |
| Sprint F2.19.1+ |

**Placement:** Assists existing surfaces (Home · Discover · Library · Profile · Creator · Legacy · Settings). **No dedicated Intelligence / AI tab.** Controls inherit Settings where needed. No IA change (F2.1).

**Gate:** Stop after freeze. Do **not** continue to Sprint F2.19.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | AI Mission |
| 2 | Core Philosophy |
| 3 | Intelligence Philosophy |
| 4 | Recommendation Philosophy |
| 5 | Human Before AI |
| 6 | Explainable Recommendations |
| 7 | AI-assisted Discovery |
| 8 | AI-assisted Writing |
| 9 | AI-assisted Memory |
| 10 | Privacy & Consent |
| 11 | AI Ethics |
| 12 | Relationship Graph |
| 13 | Future Ready |
| 14 | Emotional Goal |
| 15 | Audit Checklist |

---

# 1. AI Mission

Intelligence exists so players can navigate gaming culture with **clarity**.

Not so the platform can decide who they are.

| Role | Owner |
|------|-------|
| Assist | AI |
| Author | People |
| Protagonist | Player · gaming culture |

Without disciplined intelligence:

| Risk |
|------|
| Identity becomes optimized |
| Taste becomes predicted away |
| Communities become engagement targets |
| Reputation becomes manufacturable |
| Trust becomes opaque |

Digital Home (F2.5.1) requires intelligence that **serves** the house — never rewires it.

---

# 2. Core Philosophy

Immutable order:

| Before | After |
|--------|-------|
| Identity | Optimization |
| Culture | Engagement |
| Craft | Automation |
| Human agency | Model output |
| Trust | Mystery |
| Taste | Popularity |

AI exists to **assist**.

Never replace:

| Must remain human |
|-------------------|
| Identity |
| Taste |
| Creators |
| Communities |
| Human relationships |

Quiet enhancement. Almost invisible when working well.

Aligns Master · F2.17 (safety before engagement) · F2.18 (calm, not demanding).

---

# 3. Intelligence Philosophy

Intelligence is a **support layer**.

Not a product personality.

Not a character that competes with players or creators.

## Always prioritize

| Priority |
|----------|
| Human agency |
| Clarity |
| Trust |
| Taste fidelity |
| Cultural respect |
| Explainability |

## Never prioritize

| Anti-priority |
|---------------|
| Engagement maximization |
| Time-on-platform |
| Virality |
| Manipulation |
| Opaque optimization |
| AI as brand hero |

## Presence rule

| When intelligence works | When it fails |
|-------------------------|---------------|
| Feels like better orientation | Feels like the feed deciding identity |
| Suggestions are dismissible | Suggestions demand compliance |
| Reasons are plain | Reasons are absent or theatrical |

---

# 4. Recommendation Philosophy

Recommendations exist to surface **relevant culture**.

Not to capture attention.

## Principles

| Principle |
|-----------|
| Taste before popularity |
| Identity before AI |
| Community before optimization |
| Craft before automation |
| Explainability before mystery |
| Sparse over endless |

## Alignments

| Freeze | Constraint honored |
|--------|--------------------|
| F2.10 | Taste-first discovery |
| F2.7 | Recommendation vocabulary · Home pacing |
| F2.3.1 | Trust > mystery · sparse recommendations |
| F2.16 | Sold “better recommendations” forbidden |

## Forbidden forms

| Never |
|-------|
| Addictive recommendation loops |
| Black-box recommendations |
| Hidden ranking systems presented as fate |
| Pay-to-rank / boosted discovery |
| Drama / outrage amplifiers |
| Engagement farms |

Discover remains an exploration engine — not a slot machine (F2.10).

---

# 5. Human Before AI

Human agency always wins.

| Human | AI |
|-------|-----|
| Chooses | Suggests |
| Authors | Assists |
| Owns taste | Reflects taste |
| Builds community | Helps find community |
| Creates reputation | Must not manufacture reputation |
| Forms relationships | Must not replace relationships |

## Agency rules

| Rule |
|------|
| Players may ignore, dismiss, mute, or refuse suggestions |
| Refusal is never treated as “failure to optimize” |
| No dark patterns that coerce acceptance of AI output |
| No urgency-first UX around intelligence (F2.18 · F2.9) |

The platform assists judgment.

It does not substitute judgment.

---

# 6. Explainable Recommendations

Every recommendation should answer, calmly:

> Why am I seeing this?

Explanations are **product truth** — not marketing copy.

## Required

| Requirement |
|-------------|
| Plain-language reasons |
| User-controllable feedback (hide / not interested where recommendations appear) |
| No mysterious punishment or boost systems |
| No black-box ranking presented as fate |

## Kinship

| Freeze | Shared law |
|--------|------------|
| F2.3.1 | Trust > mystery |
| F2.10 | Explainability on recommendations |
| F2.17 | Transparent platform actions · recommendation explanations |

If a recommendation cannot be explained in human terms, it does not belong in the product philosophy of GMRLOG.

---

# 7. AI-assisted Discovery

Discovery assistance helps players explore the **game graph**.

It must never decide taste for them.

## May assist

| Assist |
|--------|
| Map related games, creators, communities |
| Surface hidden gems **with reasons** |
| Respect declared mood / intent when offered |
| Reduce friction in exploration tools |
| Stay sparse and interruptible |

## Must never

| Never |
|-------|
| Force a monoculture feed |
| Optimize for outrage or conflict |
| Sell ranking or placement as Premium (F2.16) |
| Create infinite compulsive recommendation streams |
| Replace community curation with silent automation |

Home remains culture heartbeat (F2.7).  
Discover remains exploration (F2.10).  
Intelligence may help move between them — never fuse them into one addictive stream.

---

# 8. AI-assisted Writing

Writing assistance may help creators and players **express** themselves.

It must never replace authorship.

## Allowed intent

| Intent |
|--------|
| Clarify structure |
| Improve clarity |
| Suggest edits the human accepts |
| Summarize *user-owned* drafts |

## Forbidden intent

| Intent |
|--------|
| Ghostwrite identity |
| Generate fake reviews |
| Fabricate opinions |
| Publish as if human without clear human authorship |
| Mass-produce culture as an AI content mill |

## Craft rule

| Law |
|-----|
| Craft before automation |
| The byline remains human |
| Creator Economy (F2.12) stays human-led |

Assistance is optional scaffolding.

Voice remains the player’s or creator’s.

---

# 9. AI-assisted Memory

Memory assistance may help players revisit their **journey**.

It must never invent grind or rewrite legacy.

## May assist

| Assist |
|--------|
| Surface On This Day / seasons / arcs from player-owned history |
| Organize journey material the player already created |
| Help recall emotional moments **already logged** |

## Must never

| Never |
|-------|
| Fabricate achievements |
| Invent milestones for retention |
| Gamify nostalgia into streaks |
| Expose Hidden Archive without consent (F2.6) |
| Rewrite identity narrative against the player’s authorship |

Aligns F2.14 (memory not grind) · F2.17 (privacy) · F2.5.1 (Digital Home).

If reserved later: still subordinate to trust and anti-gamification.

---

# 10. Privacy & Consent

Intelligence features inherit **privacy by default** (F2.17 · F2.16: privacy not Premium).

## Principles

| Principle |
|-----------|
| Privacy is not a Premium unlock |
| Players control what activity and memory may inform suggestions |
| Private shelves, Hidden Archive, and private presence stay private |
| Explanations must not leak another user’s private data |
| Opt-out of optional intelligence assistance must remain available |
| Assistance that needs more signal must **ask clearly** — never harvest quietly |

## Consent posture

| Consent | Meaning |
|---------|---------|
| Default-safe | Minimal inference; calm defaults |
| Explicit expansion | More personal assistance only with clear permission |
| Reversible | Players can withdraw without losing Digital Home |

Align F2.18: calm interaction — not demanding.

---

# 11. AI Ethics

Immutable bans:

| Ban |
|-----|
| AI pretending to be human |
| AI-generated fake reviews |
| AI-generated fake personalities |
| AI reputation manipulation |
| AI engagement optimization as a product goal |
| AI replacing authentic gaming culture |
| Purchased or boosted “trust” via intelligence |
| Manipulative / addictive loops |
| Covert ranking or shadow scoring for punishment |
| Substituting community judgment with silent automation |

## Trust supremacy

| Rule |
|------|
| Intelligence never overrides F2.17 Trust constitution |
| Automated outcomes affecting people remain reviewable and appealable if reserved |
| No permanent black boxes (F2.17 Appeals kinship) |

## Reputation lock

Known For · Expertise · Community Trust · Creator Recognition remain **human contribution** (F2.13).  
Intelligence must not manufacture, inflate, or sell them.

---

# 12. Relationship Graph

Intelligence assists the graph.

It does **not** redefine it.

```
Identity
  ↓
Taste / Library
  ↓
Discover
  ↓
Home
  ↓
Creator
  ↓
Communities
  ↓
Legacy
  ↓
Trust
```

| Intelligence may | Intelligence must not |
|------------------|------------------------|
| Reduce friction between nodes | Replace any node with an automated substitute |
| Explain paths through culture | Become a parallel “AI social” layer |
| Quietly amplify players, creators, communities | Become the protagonist of the product |

Accessibility (F2.18) changes comfort of experiencing the graph.  
Intelligence changes **orientation** through the graph.  
Neither changes the graph’s meaning.

---

# 13. Future Ready

Reserve architecture for (philosophy only — no implementation):

| Capability |
|------------|
| Richer explainability surfaces |
| Taste-aware Discovery Assistant |
| Optional writing assist with clear human authorship |
| AI Memory Assistant (privacy-bound · anti-grind) |
| Multilingual intelligence assistance (F2.18) |
| User controls for intelligence intensity / opt-out |
| Transparency reporting covering intelligence use |
| Human review pathways for contested automated outcomes |
| Alignment with F2.17 AI Moderation Review reservation |

Architecture only.

---

# 14. Emotional Goal

Intelligence should feel like:

> “This helped me find something that feels like me.”

Never:

> “The feed is deciding who I am.”

And never:

> “I am talking to the product instead of belonging to gaming culture.”

AI should quietly enhance the player’s experience while remaining **almost invisible**.

---

# 15. Audit Checklist

- [ ] Player remains protagonist — AI never becomes protagonist  
- [ ] AI assists — never replaces identity, taste, creators, communities, or relationships  
- [ ] Identity before optimization · culture before engagement · craft before automation  
- [ ] Human agency always wins · refusal respected · no dark patterns  
- [ ] Recommendations explainable · sparse · taste-first · no black boxes  
- [ ] No addictive recommendation loops · no engagement optimization goal  
- [ ] No AI-generated fake reviews or personalities  
- [ ] No AI reputation manipulation  
- [ ] Discovery assist: exploration, not compulsion  
- [ ] Writing assist: human byline · craft before automation  
- [ ] Memory assist: honor journey · no invented grind · Hidden Archive respected  
- [ ] Privacy by default · clear consent · opt-out preserved · not Premium-gated  
- [ ] Compatible with Identity · Discover · Home · Creator · Reputation · Legacy · Trust · Accessibility freezes  
- [ ] No dedicated AI tab · no UI · backend · APIs · models · prompts · algorithms · ranking · RN · F2.19.1  
- [ ] MVP intelligence scope is **semantic similarity only** (§16) · no assistant · no generative AI  

---

# 16. MVP Final Integration Amendment — Semantic Similarity Recommendation

**Amendment:** MVP Final Integration Amendment (July 2026). This section declares which part of §1–§15 ships in MVP. It **replaces any implication of an AI assistant** with **Semantic Similarity Recommendation**. It adds no chat AI, no assistant, no generative system, and no implementation algorithm.

## 16.1 What ships in MVP

**Semantic Similarity Recommendation:** relevance derived from semantic similarity (including semantic embeddings as a meaning-similarity basis) across cultural objects and declared preferences.

| Similarity kind | Role |
|-----------------|------|
| Game similarity | Related games · Discover / Game surfaces |
| Collection similarity | Similar Collections |
| Review similarity | Kinship between reviews and taste signals |
| Preference / genre / tag affinity | Declared taste continuity (§4 · F2.10) |

| Is | Is not |
|----|--------|
| Semantic Similarity Recommendation | An AI assistant |
| Semantic embeddings as similarity basis | Chat AI · conversational agent |
| Sparse suggestion surface | Generative system · content author |
| Explainable in plain language (§6) | A black-box ranking authority |
| Ignorable and refusable (§5) | An engagement optimizer |
| Same-object-behavior presentation | A separate intelligence destination |

## 16.2 Where it appears

| Surface | Role |
|---------|------|
| Discover | Owner of recommendation surfaces (F2.10) |
| Home recommendation slots | Sparse presentation inside the heartbeat (F2.7 · F2.3.1) |
| Related Games (Game page) | Game similarity in the game's own context (F2.4.1) |
| Similar Collections (Collection detail) | Collection similarity between player-authored shelves (F2.6) |

## 16.3 MVP laws

| Law |
|-----|
| No chat AI · no assistant · no generative system |
| Suggestion is an offer, never an instruction (§5) |
| Sparse over endless — no infinite suggestion loops (§4) |
| Explainability in human language, without exposing internals (§6) |
| Absence is acceptable: an empty recommendation slot is better than a manufactured one |
| Recommendations never reorder or override player-authored meaning |
| No purchased placement · no pay-to-rank · never Premium-gated (F2.16) |

## 16.4 Version 2 (not MVP)

| Deferred |
|----------|
| Advanced AI recommendation engine |
| AI-assisted writing (§8) at product scale |
| AI-assisted memory automation (§9) beyond reflection |
| Any conversational or generative interface |

## 16.5 Architecture references

| Reference | Contains |
|-----------|----------|
| F5.2 §6.4 | Home recommendation slot as presentation only |
| F5.3 | Related Games · Similar Collections · Discover surfaces |
| F5.4 §38.1.5 | Recommendation slot behavior contract |

Implementation details of embeddings remain **out of scope** in F2 documents — only the product meaning (similarity, not assistant) is frozen here.

---

## Final gate

### APPROVED

**Sprint F2.19 — Intelligence, AI & Recommendation Ecosystem LOCKED.**

Stop.

Do **NOT** continue to Sprint F2.19.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_10_DISCOVER_SEARCH.md](./SPRINT_F2_10_DISCOVER_SEARCH.md) | Taste-first discovery · explainability |
| [SPRINT_F2_7_HOME_FEED.md](./SPRINT_F2_7_HOME_FEED.md) | Recommendation vocabulary · pacing |
| [SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md](./SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md) | Trust > mystery · feed explainability |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](./SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Identity / DNA before engines |
| [SPRINT_F2_12_CREATOR_PLATFORM.md](./SPRINT_F2_12_CREATOR_PLATFORM.md) | Human craft · publishing integrity |
| [SPRINT_F2_13_REPUTATION_RECOGNITION.md](./SPRINT_F2_13_REPUTATION_RECOGNITION.md) | Reputation unmanufacturable |
| [SPRINT_F2_14_ACHIEVEMENT_LEGACY.md](./SPRINT_F2_14_ACHIEVEMENT_LEGACY.md) | Memory assistant boundary |
| [SPRINT_F2_16_PREMIUM_MEMBERSHIP.md](./SPRINT_F2_16_PREMIUM_MEMBERSHIP.md) | Sold recommendations forbidden |
| [SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md](./SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md) | Transparency · appeals · integrity |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](./SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Calm UX · multilingual assistance |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Culture-first product philosophy |
| [SPRINT_F2_20_SETTINGS_PERSONALIZATION.md](./SPRINT_F2_20_SETTINGS_PERSONALIZATION.md) | Intelligence opt-out · preference agency |
| [SPRINT_F2_22_PLATFORM_INTELLIGENCE_OPERATIONS.md](./SPRINT_F2_22_PLATFORM_INTELLIGENCE_OPERATIONS.md) | Recommendation Observatory · anti-engagement stewardship |
| [SPRINT_F2_23_ANALYTICS_INSIGHTS_PRODUCT_INTELLIGENCE.md](./SPRINT_F2_23_ANALYTICS_INSIGHTS_PRODUCT_INTELLIGENCE.md) | Insights ≠ assistance · no vanity scoring |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Platform Intelligence constitution: player as protagonist; human before AI; explainable recommendations; discovery/writing/memory assistance boundaries; privacy & consent; ethics bans; graph unchanged |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §16 added: Semantic Similarity Recommendation (semantic embeddings · game · collection · review similarity) declared MVP scope; any AI-assistant implication replaced; no chat AI · no assistant · no generative system; advanced engine deferred to Version 2 |
