# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/02_DESIGN/DESIGN_SYSTEM.md`

**Status:** Approved (subordinate)

**Owner:** Design Team

**Classification:** Internal Design Documentation

> **SSOT:** Product & visual identity direction lives in  
> [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) (**LOCKED**).  
> This file implements patterns under that authority. On conflict, the Master Direction wins.

---

# Design System

## Purpose

The GMRLOG Design System establishes implementation patterns for every visual and interactive element across the platform. It is **not** the product/design SSOT — see Master Direction.

Its objectives are to:

* Maintain consistency.
* Increase development speed.
* Reduce design debt.
* Improve accessibility.
* Enable scalable component development.
* Support future white-label themes.

The design language should communicate one idea above all else:

> **Premium Gaming Social Platform**

---

# Design Philosophy

GMRLOG is **not** designed like a typical productivity application.

It is also **not** designed like a gaming launcher.

Instead, it combines the elegance of Letterboxd, the liveliness of X (Twitter), the depth of Steam, and the premium aesthetics of modern gaming hardware interfaces.

The experience should feel:

* Modern
* Elegant
* Premium
* Responsive
* Minimal without being empty
* Expressive without being overwhelming
* Motion-rich without distracting the user

---

# Design Principles

Every screen in GMRLOG must satisfy the following principles.

## 1. Premium First

Every interaction should feel polished.

No placeholder-like UI.

No inconsistent spacing.

No abrupt transitions.

Every animation should communicate quality.

---

## 2. Gamer Identity

Profiles should feel collectible.

Users should enjoy customizing their gaming identity.

The profile is not merely an account page—it is the user's digital gaming résumé.

---

## 3. Content Over Chrome

UI should never compete with content.

Games, reviews, screenshots, and people are always the focus.

Navigation should disappear into the background.

---

## 4. Motion with Purpose

Animations exist to:

* Explain navigation.
* Confirm actions.
* Preserve spatial awareness.
* Delight without distraction.

Animation should never delay interaction.

---

## 5. Accessibility by Default

Accessibility is part of the design process—not a post-launch improvement.

Every color, component, animation, and interaction must satisfy accessibility requirements before implementation.

---

# Visual Language

The overall visual identity should be described as:

**Neo Gaming Minimalism**

Characteristics:

* Large game artwork
* Rich imagery
* Soft shadows
* Glass surfaces
* Vibrant accents
* Clean typography
* Rounded geometry
* Spacious layouts
* Smooth gradients
* Premium depth

---

# Color Philosophy

The interface uses a predominantly dark appearance.

Dark mode is the default experience.

Light mode is fully supported.

Colors should emphasize games rather than overpower them.

---

# Semantic Color Tokens

## Primary

Brand Accent

Primary Button

Interactive Links

Selected Tabs

Highlights

---

## Secondary

Supporting Actions

Secondary Buttons

Information Cards

---

## Success

Completed Games

Verified Actions

Positive Feedback

Achievements

---

## Warning

Spoilers

Pending Actions

Beta Features

---

## Error

Reports

Validation Errors

Critical Actions

Failed Uploads

---

## Neutral

Background

Surface

Cards

Borders

Typography

Disabled Components

---

# Theme Architecture

Themes use design tokens instead of hardcoded values.

```text
Primitive Tokens
        ↓
Semantic Tokens
        ↓
Component Tokens
        ↓
Theme
        ↓
Screen
```

This allows unlimited future themes without redesigning components.

---

# Spacing System

Use an 8-point spacing grid.

Available spacing tokens:

```text
4

8

12

16

20

24

32

40

48

64

80

96
```

No arbitrary spacing values should be introduced.

---

# Border Radius

```text
Small      8

Medium    12

Large     16

XL        24

Round     9999
```

Rounded corners reinforce the approachable gaming aesthetic.

---

# Elevation System

Four elevation levels:

Level 0

Flat

Level 1

Cards

Level 2

Dialogs

Floating Components

Level 3

Bottom Sheets

FAB

Level 4

Modal Windows

Critical Alerts

Elevation should rely primarily on shadow and blur rather than excessive borders.

---

# Typography

Typeface Requirements

Modern

Readable

Friendly

Supports multilingual text

Supports variable weights

Supports accessibility scaling

---

## Typography Scale

```text
Display XL

Display L

Heading XL

Heading L

Heading M

Heading S

Title L

Title M

Title S

Body L

Body M

Body S

Caption

Label

Overline
```

Typography establishes hierarchy before color.

---

# Iconography

Icons should use a consistent stroke weight.

Characteristics:

Rounded

Simple

Recognizable

Filled variants for active states

Outlined variants for inactive states

Suggested icon families:

* Lucide
* Phosphor
* Material Symbols Rounded

---

# Imagery

Game artwork is the dominant visual element.

Priority order:

Cover Art

Hero Image

Screenshots

Developer Logos

Studio Logos

User Avatars

Images should use rounded corners consistent with the spacing system.

---

# Component Categories

The design system includes the following component groups.

## Foundations

* Colors
* Typography
* Spacing
* Radius
* Shadows
* Motion
* Icons

---

## Inputs

* Text Field
* Password Field
* Search
* Dropdown
* Checkbox
* Radio
* Switch
* Slider
* Rating Input

---

## Navigation

* Bottom Navigation
* Top App Bar
* Navigation Rail
* Tabs
* Breadcrumbs
* Side Drawer

---

## Buttons

* Primary
* Secondary
* Ghost
* Text
* Icon
* FAB
* Split Button
* Loading Button

---

## Data Display

* Cards
* Badges
* Chips
* Tags
* Avatars
* Progress
* Rating Stars
* Game Cards

---

## Feedback

* Snackbar
* Toast
* Dialog
* Alert
* Empty State
* Skeleton
* Progress Indicators

---

## Social Components

* Feed Card
* Comment
* Reply
* Reaction Bar
* Follow Button
* Friend Button
* Developer Badge
* Verified Badge

---

## Gaming Components

* Game Card
* Log Card
* Review Card
* Tier List Card
* Collection Card
* Achievement Card
* Studio Card
* Developer Card
* Platform Badge

---

# Motion System

Animation categories:

Entrance

Exit

Shared Element

Page Transition

Micro Interaction

Feedback

Gesture

Loading

Target frame rate:

60 FPS minimum

120 FPS where supported.

---

# Gesture Guidelines

Swipe

Pull to Refresh

Long Press

Drag & Drop

Pinch

Double Tap

Haptic Feedback

Every gesture should have a visible alternative for accessibility.

---

# Haptic Feedback

Use subtle haptics for:

Like

Follow

Game Logged

Review Published

Tier Placement

Achievement Earned

Navigation Confirmation

Avoid excessive vibration.

---

# Responsive Design

Supported breakpoints:

Mobile

Tablet

Desktop

Large Desktop

Foldables

Layouts should adapt fluidly without changing interaction patterns.

---

# Accessibility Standards

Minimum touch target:

48 × 48 dp

Minimum contrast:

WCAG AA

Preferred:

WCAG AAA where practical.

Support:

Screen readers

Reduced motion

High contrast

Keyboard navigation

Dynamic text scaling

Color blindness considerations

---

# Component Naming Convention

Every component follows:

```text
Category / Variant / State
```

Examples:

```text
Button / Primary / Default

Button / Primary / Loading

GameCard / Featured / Hover

Avatar / Large / Online

ReviewCard / Compact / Expanded
```

---

# Design QA Checklist

Before approving any screen:

* Grid aligned
* Consistent spacing
* Accessible colors
* Correct typography
* Reusable components only
* Proper interaction states
* Responsive layout verified
* Motion guidelines respected
* Performance considered
* Empty states designed
* Error states designed

---

# Design Deliverables

The Design Team is responsible for producing:

* Figma Library
* Design Tokens
* Component Library
* Icon Library
* Motion Guidelines
* Screen Specifications
* Prototype Flows
* Accessibility Documentation

---

# Acceptance Criteria

This document is complete when:

* Visual language is defined.
* Component taxonomy is established.
* Design tokens are standardized.
* Accessibility standards are documented.
* Motion principles are specified.
* Responsive behaviors are defined.

---

# Dependencies

* PRODUCT_VISION.md
* PRODUCT_PRINCIPLES.md
* INFORMATION_ARCHITECTURE.md
* USER_JOURNEYS.md

---

# Related Documents

* DESIGN_TOKENS.md
* COMPONENT_LIBRARY.md
* SCREEN_SPECIFICATIONS.md
* MOTION_GUIDELINES.md
* ACCESSIBILITY.md
* FIGMA_CONVENTIONS.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
