# GMRLOG OS — Components Index

**Version:** 1.0.0 Alpha

**Document:** `docs/04_COMPONENTS/README.md`

**Status:** Approved

**Owner:** Design System Team

**Classification:** Internal Engineering Documentation

---

# Components Documentation

## Purpose

The `docs/04_COMPONENTS/` folder is the **navigation entry point** for UI component documentation in GMRLOG.

Component specifications—including props, variants, states, accessibility, and motion behavior—are maintained in a single canonical document to prevent drift.

---

## Canonical Source

**Product & design SSOT (UI / UX / frontend direction):**

### [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md)

**LOCKED.** Overrides conflicting UI guidance. All component and screen work must pass its principles (six pillars, Story Ember, Creator Economy, Mobile-first/Desktop-ready).

**Component specifications:**

### [COMPONENT_LIBRARY.md](../02_DESIGN/COMPONENT_LIBRARY.md)

That document defines:

- Atomic Design hierarchy (Atoms → Molecules → Organisms → Templates → Pages)
- Nine component categories (Foundations, Inputs, Buttons, Navigation, Cards, Social, Gaming, Feedback, Layout)
- Props, variants, and states for every approved component
- Accessibility and motion requirements per component
- Rules for when screen-specific components require approval

---

## Why This Folder Exists

GMRLOG documentation is organized by engineering discipline (`00_PROJECT` … `16_CURSOR`). The `04_COMPONENTS` discipline maps to **reusable UI building blocks**, but the design system team owns the authoritative spec under `02_DESIGN/` alongside tokens, motion, and screen specifications.

```text
02_DESIGN/
  ├── MASTER_PRODUCT_AND_DESIGN_DIRECTION.md  ← ★ SSOT (LOCKED)
  ├── SPRINT_F1_FOUNDATION.md                 ← ★ Foundation & signatures (LOCKED)
  ├── SPRINT_F2_1_INFORMATION_ARCHITECTURE.md ← ★ Nav & IA (LOCKED)
  ├── SPRINT_F2_2_AUTHENTICATION_EXPERIENCE.md ← ★ Auth UX (LOCKED)
  ├── SPRINT_F2_2_1_AUTH_POLISH.md            ← ★ Auth polish amendment (LOCKED)
  ├── SPRINT_F2_3_HOME_FEED.md               ← ★ Home Feed architecture (LOCKED)
  ├── SPRINT_F2_3_1_FEED_IDENTITY_REFINEMENT.md ← ★ Feed identity amendment (LOCKED)
  ├── SPRINT_F2_4_GAME_EXPERIENCE.md          ← ★ Game Detail experience (LOCKED)
  ├── SPRINT_F2_4_1_GAME_IDENTITY_REFINEMENT.md ← ★ Game identity amendment (LOCKED)
  ├── SPRINT_F2_5_GAMER_IDENTITY_PROFILE.md   ← ★ Gamer Identity Profile (LOCKED)
  ├── SPRINT_F2_5_1_GAMER_IDENTITY_REFINEMENT.md ← ★ Profile identity amendment (LOCKED)
  ├── SPRINT_F2_6_LIBRARY_COLLECTIONS.md      ← ★ Library & Collections (LOCKED)
  ├── SPRINT_F2_7_HOME_FEED.md               ← ★ Home Feed & Discovery (LOCKED)
  ├── SPRINT_F2_8_SOCIAL_COMMUNICATION.md    ← ★ Social & Communication (LOCKED)
  ├── SPRINT_F2_9_NOTIFICATIONS_ACTIVITY_CENTER.md ← ★ Notifications & Activity Center (LOCKED)
  ├── SPRINT_F2_10_DISCOVER_SEARCH.md         ← ★ Discover & Search (LOCKED)
  ├── SPRINT_F2_11_COMMUNITIES_GUILDS.md      ← ★ Communities & Guilds (LOCKED)
  ├── SPRINT_F2_12_CREATOR_PLATFORM.md       ← ★ Creator Platform (LOCKED)
  ├── SPRINT_F2_13_REPUTATION_RECOGNITION.md ← ★ Reputation & Recognition (LOCKED)
  ├── SPRINT_F2_14_ACHIEVEMENT_LEGACY.md     ← ★ Achievement, Legacy & Journey (LOCKED)
  ├── SPRINT_F2_15_EVENTS_SEASONAL.md        ← ★ Events & Seasonal (LOCKED)
  ├── SPRINT_F2_16_PREMIUM_MEMBERSHIP.md     ← ★ Premium & Membership ethics (LOCKED)
  ├── SPRINT_F2_17_TRUST_SAFETY_GOVERNANCE.md ← ★ Trust, Safety & Governance (LOCKED)
  ├── SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md ← ★ Accessibility & Global Experience (LOCKED)
  ├── SPRINT_F2_19_INTELLIGENCE_AI_RECOMMENDATION.md ← ★ Intelligence, AI & Recommendation (LOCKED)
  ├── SPRINT_F2_20_SETTINGS_PERSONALIZATION.md ← ★ Settings, Personalization & User Control (LOCKED)
  ├── SPRINT_F2_21_EXTERNAL_INTEGRATIONS_ECOSYSTEM.md ← ★ External Integrations & Ecosystem (LOCKED)
  ├── SPRINT_F2_22_PLATFORM_INTELLIGENCE_OPERATIONS.md ← ★ Platform Intelligence & Ops Excellence (LOCKED)
  ├── SPRINT_F2_23_ANALYTICS_INSIGHTS_PRODUCT_INTELLIGENCE.md ← ★ Analytics, Insights & Product Intelligence (LOCKED)
  ├── SPRINT_F2_24_ENTERPRISE_STUDIO_ORGANIZATION.md ← ★ Enterprise, Studio & Organization (LOCKED)
  ├── SPRINT_F2_25_GROWTH_ADOPTION_ECOSYSTEM_EXPANSION.md ← ★ Growth, Adoption & Ecosystem Expansion (LOCKED)
  ├── SPRINT_F2_26_MONETIZATION_COMMERCE_SUSTAINABLE_ECONOMY.md ← ★ Monetization, Commerce & Sustainable Economy (LOCKED)
  ├── SPRINT_F2_27_SECURITY_PRIVACY_DATA_GOVERNANCE.md ← ★ Security, Privacy & Data Governance (LOCKED)
  ├── SPRINT_F2_28_DEVELOPER_PLATFORM_API_EXTENSIBILITY.md ← ★ Developer Platform, API & Extensibility (LOCKED)
  ├── SPRINT_F2_29_PRODUCT_CONSTITUTION_GOVERNANCE_EVOLUTION.md ← ★ Final Product Constitution · F2 CLOSE (LOCKED)
03_UX/
  ├── F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md ← ★ UX Constitution (LOCKED)
  ├── F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md ← ★ Navigation Experience (LOCKED)
  ├── F3_3_VISUAL_HIERARCHY_LAYOUT_SYSTEM.md ← ★ Visual Hierarchy & Layout (LOCKED)
  ├── F3_4_INTERACTION_MICROINTERACTION_PHILOSOPHY.md ← ★ Interaction & Microinteraction (LOCKED)
  ├── F3_5_MOTION_ANIMATION_PHILOSOPHY.md ← ★ Motion & Animation Philosophy (LOCKED)
  ├── F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md ← ★ Components, Forms, States & Search (LOCKED)
  ├── F3_7_PROFILE_IDENTITY_LIBRARY_EXPERIENCE.md ← ★ Profile, Identity & Library Experience (LOCKED)
  ├── F3_8_HOME_DISCOVER_GAME_EXPERIENCE.md ← ★ Home, Discover & Game Experience (LOCKED)
  ├── F3_9_COMMUNITY_CREATOR_SOCIAL_EXPERIENCE.md ← ★ Community, Creator & Social Experience (LOCKED)
  ├── F3_10_RESPONSIVE_DESKTOP_CROSS_PLATFORM_EXPERIENCE.md ← ★ Responsive & Cross-Platform (LOCKED)
  ├── F3_11_UX_WRITING_VOICE_LANGUAGE_LOCALIZATION.md ← ★ UX Writing, Voice & Localization (LOCKED)
  ├── F3_12_UX_GOVERNANCE_EXPERIENCE_AUDIT_FINAL_CONSTITUTION.md ← ★ UX Governance · F3 CLOSE (LOCKED)
  ├── INTERACTION_GUIDELINES.md
  ├── NAVIGATION_SPECIFICATION.md
  ├── USER_JOURNEYS.md
  ├── WIREFRAMES.md
  └── INFORMATION_ARCHITECTURE.md
04_UI/
  ├── F4_1_UI_FOUNDATION_VISUAL_DESIGN_PHILOSOPHY.md ← ★ UI Foundation · Visual Philosophy (LOCKED)
  ├── F4_2_COLOR_PHILOSOPHY_SEMANTIC_COLOR_SYSTEM.md ← ★ Color Philosophy & Semantic Color (LOCKED)
  ├── F4_3_TYPOGRAPHY_PHILOSOPHY_TYPE_SYSTEM.md ← ★ Typography Philosophy & Type System (LOCKED)
  ├── F4_4_GRID_LAYOUT_SPACING_SYSTEM.md ← ★ Grid, Layout & Spacing System (LOCKED)
  ├── F4_5_SURFACE_ELEVATION_LAYERING_SYSTEM.md ← ★ Surface, Elevation & Layering (LOCKED)
  ├── F4_6_ICONOGRAPHY_ILLUSTRATION_VISUAL_SYMBOL_LANGUAGE.md ← ★ Iconography & Visual Symbols (LOCKED)
  ├── F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md ← ★ Interaction Components Philosophy (LOCKED)
  ├── F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md ← ★ Component Design System Constitution (LOCKED)
  ├── F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md ← ★ Motion Language & Transition System (LOCKED)
  ├── F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md ← ★ Design Token Architecture (LOCKED)
  ├── F4_11_RESPONSIVE_UI_ADAPTIVE_LAYOUT_CONSTITUTION.md ← ★ Responsive UI & Adaptive Layout (LOCKED)
  ├── F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md ← ★ Design System Governance & Evolution (LOCKED)
  └── F4_13_UI_CONSTITUTION_FINALIZATION_PHASE_CLOSURE.md ← ★ UI Constitution · F4 CLOSE (LOCKED)
05_PRODUCT_ARCHITECTURE/
  ├── F5_1_INFORMATION_ARCHITECTURE_NAVIGATION_SPECIFICATION.md ← ★ Product IA & Nav Spec (DRAFT)
  ├── F5_2_HOME_FEED_PRODUCT_ARCHITECTURE_SPECIFICATION.md ← ★ Home Feed Product Architecture (DRAFT)
  ├── F5_3_SCREEN_SPECIFICATIONS.md ← ★ Screen Specifications (DRAFT)
  ├── F5_4_INTERACTION_COMPONENT_BEHAVIOR_SPECIFICATION.md ← ★ Interaction & Component Behavior (DRAFT)
  └── F5_5_DESIGN_SYSTEM_IMPLEMENTATION_RULES.md ← ★ Design System & Implementation Rules (DRAFT · F5 close)
02_DESIGN (cont.)
  ├── DESIGN_TOKENS.md      ← visual primitives (subordinate to F4)
  ├── DESIGN_SYSTEM.md      ← patterns (subordinate)
  ├── COMPONENT_LIBRARY.md  ← component specs (subordinate)
  ├── MOTION_GUIDELINES.md  ← animation rules
  └── SCREEN_SPECIFICATIONS.md

04_COMPONENTS/
  └── README.md             ← you are here (index only)
```

---

## Implementation Packages

| Package / app | Role |
|---------------|------|
| `packages/ui` | Shared cross-platform primitives |
| `packages/design-tokens` | Token values consumed by components |
| `apps/mobile` | NativeWind + feature components |
| `apps/web` | shadcn/ui + Tailwind compositions |

Import aliases: `@gmrlog/ui`, `@gmrlog/design-tokens` per [MONOREPO_STRUCTURE.md](../00_PROJECT/MONOREPO_STRUCTURE.md).

---

## Usage Rules

1. **Compose, don't duplicate** — Screens must use library components.
2. **No undocumented variants** — New variants require `COMPONENT_LIBRARY.md` update first.
3. **Design tokens only** — No hardcoded colors, spacing, or typography.
4. **Accessibility** — Follow [SPRINT_F2_18](../02_DESIGN/SPRINT_F2_18_ACCESSIBILITY_GLOBAL_EXPERIENCE.md) (constitution) and [ACCESSIBILITY.md](../02_DESIGN/ACCESSIBILITY.md) detail + per-component a11y notes.
5. **Motion** — Follow [MOTION_GUIDELINES.md](../02_DESIGN/MOTION_GUIDELINES.md).

---

## Related Documents

| Document | Topic |
|----------|-------|
| [MASTER_PRODUCT_AND_DESIGN_DIRECTION.md](../02_DESIGN/MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) | ★ SSOT — product & design direction |
| [SPRINT_F1_FOUNDATION.md](../02_DESIGN/SPRINT_F1_FOUNDATION.md) | ★ F1 foundation & signature components |
| [COMPONENT_LIBRARY.md](../02_DESIGN/COMPONENT_LIBRARY.md) | Full component catalog |
| [DESIGN_SYSTEM.md](../02_DESIGN/DESIGN_SYSTEM.md) | Design patterns (subordinate) |
| [DESIGN_TOKENS.md](../02_DESIGN/DESIGN_TOKENS.md) | Colors, type, spacing |
| [FRONTEND_ARCHITECTURE.md](../05_FRONTEND/FRONTEND_ARCHITECTURE.md) | Component architecture layers |
| [FIGMA_CONVENTIONS.md](../02_DESIGN/FIGMA_CONVENTIONS.md) | Design ↔ code alignment |

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial index |
