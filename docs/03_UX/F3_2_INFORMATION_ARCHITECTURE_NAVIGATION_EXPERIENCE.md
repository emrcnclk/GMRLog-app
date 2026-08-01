# GMRLOG — Sprint F3.2: Information Architecture & Navigation Experience

**Document:** `docs/03_UX/F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md`  
**Version:** 1.1  
**Status:** **LOCKED** · **Amended by MVP Final Integration Amendment** (§19)  
**Sprint:** F3.2 (UX Information Architecture & Navigation Experience — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UX Navigation Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution — especially [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) |
| 5 | [`SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md`](../02_DESIGN/SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md) |
| 6 | [`F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md`](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) |
| 7 | **This document** — Information Architecture & Navigation Experience |

Never contradict previous freezes.

This sprint **translates** product philosophy into navigation behavior.

| Does | Does not |
|------|----------|
| Define how users move through GMRLOG | Add features |
| Make F2.1 IA *feel* navigable | Change product structure |
| Extend F3.1 navigation mindset | Invent new pillars or tabs |

**Boundary with F2.1:** F2.1 freezes **structure** (tabs, stacks, deep links).  
**This freeze** defines **navigation experience** — orientation, movement, mental models. On structural conflict, **F2.1 wins**.

Subordinate: [`NAVIGATION_SPECIFICATION.md`](./NAVIGATION_SPECIFICATION.md), [`INFORMATION_ARCHITECTURE.md`](./INFORMATION_ARCHITECTURE.md), journeys, wireframes.

---

## Scope

**In scope:** Global navigation philosophy · primary navigation · information hierarchy · player movement · screen relationships · entry/exit · deep navigation · guest navigation experience.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Final UI designs |
| Components |
| Colors |
| Animations |
| Backend |
| Database |
| React Native implementation |
| Sprint F3.2.1+ |

**Placement:** Navigation affects Home · Discover · Library · Communities · Creator spaces · Profile · Settings · Notifications. **No new product pillar.** **No new bottom tab.**

**Gate:** Stop after freeze. Do **not** continue to Sprint F3.2.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Navigation Mission |
| 2 | Mental Model |
| 3 | Primary Navigation Philosophy |
| 4 | Player Journey |
| 5 | Home Navigation |
| 6 | Discover Navigation |
| 7 | Library Navigation |
| 8 | Identity / Profile Navigation |
| 9 | Community Navigation |
| 10 | Creator Navigation |
| 11 | Guest Experience |
| 12 | Deep Navigation Rules |
| 13 | Back Navigation Philosophy |
| 14 | Anti-Confusion Rules |
| 15 | Accessibility Navigation |
| 16 | Future Ready |
| 17 | Emotional Goal |
| 18 | Audit Checklist |

---

# 1. Navigation Mission

Define how GMRLOG feels navigable as a **premium gaming home**.

Navigation exists to answer:

| Question |
|----------|
| Where am I? |
| What can I do here? |
| How do I return to my gaming identity? |

Never:

| Anti-question |
|---------------|
| How do we maximize clicks? |

Align F3.1: calm · confident · predictable · human.  
Align F2.1: five tabs · Composer as action · no mystery primary paths.

---

# 2. Mental Model

**Navigation is a home layout.**

Not a content funnel.

| Always | Never |
|--------|-------|
| Clear orientation | Hidden navigation tricks |
| Calm movement | Engagement traps |
| Player identity as anchor | Infinite navigation loops |
| Discoverability without pressure | Forced exploration |
| Consistent mental models | Competing maps of the same place |

## The house metaphor

| Place | Mental role |
|-------|-------------|
| Home | Living room — culture now |
| Discover | Exploration wing |
| Library | Personal archive |
| Notifications | Attention desk |
| Profile | Digital Home / identity |
| Settings | Control panel (via Profile) |
| Game Detail | Room for one game relationship |
| Communities / Creator | Rooms entered from graph — not new front doors |

Players should always know which room they are in.

---

# 3. Primary Navigation Philosophy

Primary navigation is **stable shelter**.

| Law |
|-----|
| Five tabs only: **Home · Discover · Library · Notifications · Profile** (F2.1) |
| Composer is FAB + contextual — never a sixth tab |
| Messages · Communities hub · Creator tools · Premium · Dev/Mod enter via Profile / stacks / deep links — never new player tabs |
| Labels stay short, honest, and stable |
| Thumb-zone reachability on mobile; meaning unchanged on desktop |

## Orientation contract

At any primary root, the player can answer:

1. Which tab am I on?  
2. What is this tab for?  
3. How do I get back to Profile / Library / Home without inventing a path?

No hidden primary actions.

No gesture-only critical navigation (F3.1).

---

# 4. Player Journey

Movement should feel like walking through a home — not falling through a funnel.

| Journey quality | Meaning |
|-----------------|---------|
| Intentional | Player chooses the next room |
| Reversible | Back / tab switch restores orientation |
| Identity-returnable | Profile / Library always reachable as anchors |
| Graph-honest | Game-connected content leads to game nodes (F2.3–F2.4) |

## Typical calm loops (philosophy)

| Loop | Feel |
|------|------|
| Home → Game → Log / Review → Home | Culture heartbeat with return |
| Discover → Game / Creator / Community → Library or Profile | Exploration that can land in identity |
| Library → Game → Journey | Archive as relationship |
| Profile → Settings → Profile | Agency without exile |
| Notifications → destination → return | Attention without captivity |

Never design journeys that only end in “one more click.”

---

# 5. Home Navigation

Home is the **culture heartbeat** (F2.7) — not a retention casino.

| Home navigation may | Must never |
|---------------------|------------|
| Lead into games · posts · activity with clear exits | Trap in infinite same-type walls |
| Offer sparse, explainable suggestions (F2.19) | Force exploration of monetized paths |
| Preserve magazine rhythm orientation | Hide where “Home” is |

Entering Home should feel like returning to the living room.

Leaving Home should never feel like failure.

---

# 6. Discover Navigation

Discover is the **exploration wing** (F2.10).

| Discover navigation may | Must never |
|-------------------------|------------|
| Open search · taste paths · related culture | Become a slot-machine corridor |
| Land on games · creators · communities · collections | Sell ranking as navigation law (F2.16) |
| Stay interruptible | Infinite compulsive streams as the only path |

Discover answers “What might fit me?”

Not “How long can we keep you moving?”

---

# 7. Library Navigation

Library is the **personal archive** (F2.6) — not a launcher.

| Library navigation may | Must never |
|------------------------|------------|
| Move among shelves · collections · continue · wishlist | Convert into storefront checkout identity |
| Protect Hidden Archive as a sealed room | Expose private archive via surprise deep links |
| Deep-link into Game Detail as relationship | Force sync before browsing owned meaning (F2.21) |

Library is where identity keeps its objects.

Navigation must honor that ownership.

---

# 8. Identity / Profile Navigation

Profile is the **Digital Home** (F2.5.1) — identity anchor of the tab bar.

| Profile navigation may | Must never |
|------------------------|------------|
| Open Identity · Journey · Library mirrors · Creator vertical section · Settings | Turn Profile into a settings dump on first paint |
| Reach Messages / Premium / Dev hubs as children | Add those as bottom tabs |
| Distinguish self vs other with honest chrome | Force public performance to navigate |

**How do I return to my gaming identity?**

Answer: Profile tab — always present, always the same mental model.

Settings is control panel via Profile stack (F2.20) — not a rival home.

---

# 9. Community Navigation

Communities are culture hubs entered from the graph (F2.11) — **not** a sixth tab.

| Community navigation may | Must never |
|--------------------------|------------|
| Enter from Discover · Home · Profile · deep links | Own the bottom bar |
| Keep community-local orientation clear | Blur Guilds vs Communities |
| Exit to game graph / Profile without loss of place | Become Discord-replacement root navigation |

Community autonomy remains.

Platform IA remains supreme.

---

# 10. Creator Navigation

Creator spaces grow **vertically on Profile** (F2.12) — not as a separate player tab.

| Creator navigation may | Must never |
|------------------------|------------|
| Move among drafts · articles · guides · series from creator section | Relocate authorship off-platform as primary nav |
| Open long-form reading as first-class rooms (F3.1 · F2.18) | Interrupt reading with nav chrome wars |
| Return to Profile identity | Make Creator a competing product map |

Composer remains an **action** available in context — never a destination tab (F2.1).

---

# 11. Guest Experience

Guests may preview with dignity (F2.2 · F2.2.1).

| Guest navigation may | Must never |
|----------------------|------------|
| Browse allowed public game / culture previews | Hostage every doorway behind signup |
| Soft-gate when membership is required | Fake a full MainApp that collapses into guilt |
| Land in Auth with clear return intent | Dark-pattern re-entry loops |

Browse-first where freezes allow.

Signup is invitation to a home — not a toll booth on every hallway.

---

# 12. Deep Navigation Rules

Deep links and pushes must preserve orientation (F2.1 deep link map).

| Rule |
|------|
| Every deep destination declares its room |
| Stack pushes have obvious parents |
| Modals are temporary rooms — not secret roots |
| Shared Game Stack remains the relationship room from any tab |
| Staff / Mod / Admin overlays never hijack player bottom tabs |

Deep navigation is a shortcut into the house.

Not a wormhole that erases the map.

---

# 13. Back Navigation Philosophy

Back is a **promise of return**.

| Back should | Back must never |
|-------------|-----------------|
| Restore prior orientation | Randomly teleport to growth surfaces |
| Prefer predictable stack pop | Trap in modal → modal → dead end |
| Respect tab-root sanctity | Reset identity/library state as punishment |
| Feel calm and reversible (F3.1) | Use “back” as engagement bait |

If players fear going back, navigation has failed.

---

# 14. Anti-Confusion Rules

Explicit bans:

| Ban |
|-----|
| Hidden navigation tricks |
| Engagement traps |
| Infinite navigation loops |
| Forced exploration |
| Mystery primary actions |
| Gesture-only critical paths |
| Duplicate mental models for the same place |
| Tab that means different things on different days |
| Navigation that maximizes clicks over clarity |
| New bottom tabs without amending F2.1 |

Confusion is a Trust failure felt in the body of the product.

---

# 15. Accessibility Navigation

Navigation must remain usable across input and cognition modes (F2.18 · F3.1).

| Law |
|-----|
| Critical navigation not gesture-only |
| Focus order / reader paths reserved for later implementation — philosophy: complete and honest |
| Labels describe place and purpose |
| Calm motion — Reduce Motion must not break orientation (F2.18) |
| No urgency navigation theater |

Accessible navigation is part of Digital Home — not an afterthought route.

---

# 16. Future Ready

Reserve architecture only:

| Capability |
|------------|
| Richer wayfinding within large archives |
| Clearer cross-pillar breadcrumbs (philosophy) |
| Linked-app / extension exits that return to GMRLOG (F2.28) |
| Desktop chrome that preserves the same five-root mental model |
| Search-as-teleport that still names the destination room |

No new tabs.

No structure change.

No implementation.

---

# 17. Emotional Goal

Navigation should feel like:

> “I always know where I am in my gaming home.”

Never:

> “I am being led somewhere I didn’t choose.”

And never:

> “Every path exists to generate another click.”

---

# 18. Audit Checklist

- [ ] Answers Where am I? · What can I do? · How do I return to identity?  
- [ ] Home layout — not content funnel  
- [ ] Clear orientation · calm movement · identity anchor · pressure-free discoverability  
- [ ] Five tabs unchanged · Composer not a tab · no new pillar  
- [ ] Home / Discover / Library / Profile / Community / Creator navigation philosophies aligned to F2  
- [ ] Guest browse-first dignity · soft gates honest  
- [ ] Deep links preserve rooms · Back restores orientation  
- [ ] Anti-confusion bans explicit  
- [ ] Accessibility navigation: no gesture-only critical paths  
- [ ] Extends F3.1 · obeys F2.1 structure · never modifies F2 product philosophy  
- [ ] No UI · components · colors · animations · backend · RN · F3.2.1  
- [ ] MVP destinations and hubs (§19) preserve the five-tab mental model  

---

# 19. MVP Final Integration Amendment — Player Journey Extension (No Nav Change)

**Amendment:** MVP Final Integration Amendment (July 2026). Navigation experience law in §1–§18 is unchanged, and the F2.1 structural freeze is untouched. This section clarifies that MVP surfaces **extend the existing player journey** without changing the five-tab mental model.

## 19.1 Surfaces that extend the journey

| Surface | How it is reached | Mental-model rule |
|---------|-------------------|-------------------|
| Communities | Discover hub entry · culture references · deep link | A room you visit, not a tab you live in (§9) |
| Events | Discover Events Hub · Home activity · community and game context | An invitation you open, then leave calmly (§12) |
| Steam Import | Library hub child + task layer | A task that returns you to your archive (§12) |
| Connected Accounts | Profile entry → Settings account section | Control lives in Settings, never in the tab bar (§3) |

Related journey extensions (same laws):

| Surface | How it is reached | Mental-model rule |
|---------|-------------------|-------------------|
| Community Feed · Members · Activity | Inside the community room | Children of the room — Back always returns to it (§13) |
| Achievements | Profile section → achievement detail | Identity anchor path — return to Profile is always clear (§8) |
| Semantic Similarity Recommendation | Inside Discover · Home · Game · Collection | Presentation inside a room — never a destination (§6) |

## 19.2 Immutable navigation laws

| Law |
|-----|
| Five-tab mental model unchanged — Home · Discover · Library · Notifications · Profile |
| Navigation hierarchy remains unchanged — no new tab · no new pillar · no composer-like exception (§3) |
| Communities · Events · Steam Import · Connected Accounts extend the journey; they do not rewrite it |
| Tasks (linking · importing · joining · participating) always return to their origin room (§12) |
| Deep links resolve into a room with orientation, never into an orphan page (§12) |
| Back always restores orientation (§13) |

---

## Final gate

### APPROVED

**Sprint F3.2 — Information Architecture & Navigation Experience LOCKED.**

Stop.

Do **NOT** continue to Sprint F3.2.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [SPRINT_F2_1_INFORMATION_ARCHITECTURE.md](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) | Structural IA freeze (supreme on tabs/stacks) |
| [F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) | UX Constitution · navigation mindset |
| [NAVIGATION_SPECIFICATION.md](./NAVIGATION_SPECIFICATION.md) | Subordinate nav detail |
| [INFORMATION_ARCHITECTURE.md](./INFORMATION_ARCHITECTURE.md) | Subordinate IA detail |
| [SPRINT_F2_7_HOME_FEED.md](../02_DESIGN/SPRINT_F2_7_HOME_FEED.md) | Home as culture heartbeat |
| [SPRINT_F2_10_DISCOVER_SEARCH.md](../02_DESIGN/SPRINT_F2_10_DISCOVER_SEARCH.md) | Discover exploration |
| [SPRINT_F2_6_LIBRARY_COLLECTIONS.md](../02_DESIGN/SPRINT_F2_6_LIBRARY_COLLECTIONS.md) | Library archive |
| [SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md](../02_DESIGN/SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md) | Profile Digital Home |
| [SPRINT_F2_11_COMMUNITIES_GUILDS.md](../02_DESIGN/SPRINT_F2_11_COMMUNITIES_GUILDS.md) | Community entry without new tab |
| [SPRINT_F2_12_CREATOR_PLATFORM.md](../02_DESIGN/SPRINT_F2_12_CREATOR_PLATFORM.md) | Creator vertical on Profile |
| [SPRINT_F2_2_1_AUTH_POLISH.md](../02_DESIGN/SPRINT_F2_2_1_AUTH_POLISH.md) | Guest → member dignity |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Recognizability · pillars |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](./F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) | Attention order · layout organization |
| [F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md](./F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) | Gesture non-mandatory · back feel |
| [F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md](./F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md) | Same nav meaning across devices |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — UX Navigation Constitution: home-layout mental model; per-surface navigation experience; guest/deep/back rules; F2.1 structure unchanged |
| 1.1 | July 2026 | **MVP Final Integration Amendment** — §19 added: Communities · Events · Steam Import · Connected Accounts extend the player journey; five-tab mental model and navigation hierarchy unchanged |
