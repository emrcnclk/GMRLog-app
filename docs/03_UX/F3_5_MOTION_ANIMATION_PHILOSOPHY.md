# GMRLOG — Sprint F3.5: Motion & Animation Philosophy

**Document:** `docs/03_UX/F3_5_MOTION_ANIMATION_PHILOSOPHY.md`  
**Version:** 1.0  
**Status:** **LOCKED**  
**Sprint:** F3.5 (UX Motion & Animation Philosophy — architecture only)  
**Last Updated:** July 2026  
**Owner:** Product Design Director  
**Classification:** UX Motion Constitution

---

## Authority

| Priority | Document |
|----------|----------|
| 1 | [`NORTH_STAR.md`](../00_PROJECT/NORTH_STAR.md) |
| 2 | [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) |
| 3 | [`SPRINT_F1_FOUNDATION.md`](../02_DESIGN/SPRINT_F1_FOUNDATION.md) |
| 4 | Entire F2 Product Constitution — especially F2.18 Accessibility · F2.17 Trust · F2.29 |
| 5 | [`F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md`](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) |
| 6 | [`F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md`](./F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) |
| 7 | [`F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md`](./F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) |
| 8 | [`F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md`](./F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) |
| 9 | **This document** — Motion & Animation Philosophy |

Never contradict previous freezes.

Never modify F1 · F2 · F3.1–F3.4.

This sprint answers:

> “How should movement inside GMRLOG feel?”

rather than:

> “Which animation should we use?”

| Does | Does not |
|------|----------|
| Define motion philosophy | Specify durations · easing curves · Lottie · code |
| Support comprehension · orientation · continuity | Entertain · distract · increase engagement |
| Bind later `MOTION_GUIDELINES.md` | Invent spectacle as brand |

**Boundary with F3.4:** F3.4 = how interaction feels; **F3.5** = how movement that accompanies change should feel. Motion serves interaction — never the reverse (F3.4 law).

Subordinate: [`MOTION_GUIDELINES.md`](../02_DESIGN/MOTION_GUIDELINES.md).

---

## Scope

**In scope:** Motion principles · navigation/page transitions · shared element philosophy · modal/sheet/dialog motion · expand/collapse · loading/skeleton · state transitions · attention movement · spatial continuity · motion hierarchy · emotional pacing · Reduce Motion · accessibility implications · future reservations.

**Out of scope:**

| Forbidden in this freeze |
|--------------------------|
| Animation durations |
| Easing curves |
| Lottie specifications |
| UI implementation |
| Components |
| Backend |
| React Native |
| Motion code |
| Sprint F3.5.1+ |

**Gate:** Stop after freeze. Do **not** continue to Sprint F3.5.1.

---

## Deliverable map

| § | Section |
|---|---------|
| 1 | Mission |
| 2 | Motion Philosophy |
| 3 | Navigation Motion |
| 4 | Spatial Continuity |
| 5 | State Transition Philosophy |
| 6 | Loading Motion |
| 7 | Attention & Motion |
| 8 | Modal & Sheet Motion |
| 9 | Accessibility Relationship |
| 10 | Consistency Rules |
| 11 | Anti-Manipulation |
| 12 | Future Ready |
| 13 | Emotional Goal |
| 14 | Audit Checklist |

---

# 1. Mission

Define how motion should feel across GMRLOG.

Motion exists to support:

| Purpose |
|---------|
| Comprehension |
| Orientation |
| Continuity |

It never exists to:

| Anti-purpose |
|--------------|
| Entertain |
| Distract |
| Increase engagement |

Align calm premium gaming home (F3.1) — not social media feed motion culture.

---

# 2. Motion Philosophy

| Always | Never |
|--------|-------|
| Serve understanding | Decoration |
| Preserve orientation | Create spectacle |
| Reduce cognitive load | Increase cognitive load |
| Feel natural | Feel theatrical |
| Answer “What changed?” | Answer “Look what we can animate” |
| Reinforce premium gaming home | Imitate social feed / casino motion |

## Motion hierarchy (philosophy)

| Priority | Motion role |
|----------|-------------|
| 1 | Orientation (where did I go?) |
| 2 | Continuity (what is the same object?) |
| 3 | State clarity (what is open / closed / loading?) |
| 4 | Soft emphasis (rare · meaningful) |
| 5 | Ornament | **Forbidden as product goal** |

Premium motion = restraint.

Not ornament in time.

---

# 3. Navigation Motion

Navigation motion must honor F3.2: obvious · stable · predictable.

| Navigation transitions may | Must never |
|----------------------------|------------|
| Confirm tab/stack change calmly | Dramatize every tab switch |
| Preserve “room” identity of destinations | Morph Home into Discover theatrically |
| Support Back as return promise | Randomize enter/exit directions for delight |
| Keep Composer/action sheets distinct from tab roots | Make create feel like a sixth tab parade |

Page transitions explain place change.

They do not perform.

---

# 4. Spatial Continuity

Spatial continuity answers: **what is the same thing, moved?**

| Shared element philosophy | Meaning |
|---------------------------|---------|
| Continuity when identity is shared | Game · profile · card object feels carried |
| Break when meaning changes | Do not fake continuity across unrelated rooms |
| Support game graph honesty | Arrival at Game Detail feels like entering that room |

| Continuity should | Continuity must never |
|-------------------|-----------------------|
| Lower re-orientation cost | Become a magic trick that hides hierarchy (F3.3) |
| Respect reading corridors | Yank long-form mid-sentence for flair |

The house stays one house.

Motion does not teleport the furniture for show.

---

# 5. State Transition Philosophy

State transitions make **change legible**.

| States | Motion role |
|--------|-------------|
| Expand / collapse | Reveal depth without losing parent |
| Selection / press accompaniment | Confirm — subordinate to F3.4 feedback |
| Empty → content | Arrive honestly |
| Enabled → disabled | Clarity over flair |

Every transition should answer:

> “What changed?”

If the player cannot name the change, the motion failed — even if it looked expensive.

---

# 6. Loading Motion

Loading motion obeys F3.4 Loading Philosophy.

| Loading / skeleton motion may | Must never |
|-------------------------------|------------|
| Signal work in progress calmly | Create artificial anticipation |
| Preserve layout orientation (F3.3) | Pulse like a slot machine |
| Yield to real content without celebration | Reward the wait with dopamine |

Skeleton philosophy: structure first · motion minimal · honesty over shimmer theater.

Waiting is time.

Not a trailer.

---

# 7. Attention & Motion

Motion may guide attention only when hierarchy already decided what matters (F3.3).

| Attention motion may | Must never |
|----------------------|------------|
| Softly indicate a true state change | Compete with primary content |
| Support explainable suggestion arrival (sparse) | Loop to farm re-attention |
| Respect one starting point | Multi-element motion shouting |

Emotional pacing: curious — never anxious (F3.1).

Motion does not manufacture urgency (F2.18 · F2.9 kinship).

---

# 8. Modal & Sheet Motion

Modal / sheet / dialog motion obeys F3.4 interruption ethics.

| Appearance / dismissal may | Must never |
|----------------------------|------------|
| Make overlay feel temporary and reversible | Feel like a trap room entrance |
| Preserve sense of parent room underneath | Erase orientation on open |
| Match consequence weight (dialog vs sheet) | Use explosive entrances for soft upsell |
| Exit as calmly as enter | Punish dismiss with sticky re-entry motion |

Bottom sheets and dialogs are layers on the home.

Not stage curtains for a show.

---

# 9. Accessibility Relationship

**Reduce Motion must preserve meaning** (F2.18 · F3.1 · F3.4).

| Law |
|-----|
| Motion never becomes mandatory for comprehension |
| Alternate non-motion cues required for the same meaning |
| Vestibular / sensitivity respect is constitutional — not a niche toggle afterthought |
| Focus / state changes remain clear without movement |
| Parity across input modes: motion is enhancement, not gate |

If Reduce Motion users lose “What changed?”, the motion system is unconstitutional.

---

# 10. Consistency Rules

| Rule |
|------|
| Same navigation class · same transition grammar |
| Same overlay class · same enter/exit ethics |
| Loading motion language stable across tabs |
| Continuity used only when object identity is real |
| Motion intensity proportional to consequence (F3.4) |
| Desktop / mobile meaning unchanged — motion adapts, philosophy does not |

Consistency of motion is part of “moves exactly as I expected.”

---

# 11. Anti-Manipulation

Explicit bans:

| Ban |
|-----|
| Dopamine animations |
| Reward explosions |
| Addictive loops |
| Slot-machine motion |
| Casino psychology |
| Artificial anticipation loaders |
| Spectacle for engagement |
| Motion that increases cognitive load |
| Motion required to understand state |
| Streak / FOMO motion theater |
| Celebration motion for trivial actions |
| Feed-style infinite kinetic noise |

If motion’s best argument is “it feels more engaging,” it is illegitimate.

---

# 12. Future Ready

Reserve architecture only:

| Capability |
|------------|
| Motion Language bound to Interaction System (F3.4) |
| Reduce Motion alternate map |
| Shared-element continuity catalog by object type |
| Navigation transition grammar appendix |
| Haptics pairing philosophy (calm · rare) subordinate to F3.4 |

No durations · no curves · no Lottie · no implementation.

Later `MOTION_GUIDELINES.md` remains detail — must obey this constitution.

---

# 13. Emotional Goal

Motion should feel like:

> “The interface moves exactly as I expected.”

Never:

> “The app is showing off.”

Never:

> “The movement is trying to keep me engaged.”

---

# 14. Audit Checklist

- [ ] Answers how movement feels — not which animation to use  
- [ ] Motion serves comprehension · orientation · continuity — never entertainment/engagement  
- [ ] Every transition answers “What changed?”  
- [ ] Navigation/page motion preserves F3.2 orientation  
- [ ] Spatial continuity honest · state transitions legible  
- [ ] Loading/skeleton calm · no artificial anticipation  
- [ ] Modal/sheet motion reversible · non-trapping  
- [ ] Reduce Motion preserves meaning · motion never mandatory  
- [ ] Anti-manipulation bans explicit (dopamine · loops · casino)  
- [ ] Compatible with F1 · F2 · F3.1–F3.4 · never modifies them  
- [ ] No durations · easing · Lottie · UI impl · RN · F3.5.1  

---

## Final gate

### APPROVED

**Sprint F3.5 — Motion & Animation Philosophy LOCKED.**

Stop.

Do **NOT** continue to Sprint F3.5.1.

---

## Related documents

| Doc | Role |
|-----|------|
| [F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md](./F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md) | Interaction feel · loading · dialogs — motion serves these |
| [F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md](./F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md) | Attention order · reading corridors |
| [F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md](./F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) | Orientation · Back promise |
| [F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) | Calm home · Reduce Motion kinship |
| [MOTION_GUIDELINES.md](../02_DESIGN/MOTION_GUIDELINES.md) | Subordinate motion detail |
| [F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md](../04_UI/F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md) | **LOCKED** UI motion language · transitions (F4.9) |
| [SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) | Reduce Motion · calm UX |
| [SPRINT_F1_FOUNDATION.md](../02_DESIGN/SPRINT_F1_FOUNDATION.md) | Motion as understanding support |
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | Premium restraint · recognizability |
| [F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md](./F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md) | Loading/skeleton ethics · state honesty |

---

## Revision history

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | July 2026 | LOCK — Motion constitution: comprehension over spectacle; spatial continuity; Reduce Motion meaning; anti-dopamine/casino bans |
