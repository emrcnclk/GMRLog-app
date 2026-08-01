# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/02_DESIGN/DESIGN_TOKENS.md`

**Status:** Approved (subordinate)

**Owner:** Design System Team

**Classification:** Internal Design Documentation

> **SSOT:** [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) (**LOCKED**).  
> **Foundation detail:** [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) (**LOCKED**).  
> **Token architecture:** [`F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md`](../04_UI/F4_10_DESIGN_TOKEN_ARCHITECTURE_SEMANTIC_FOUNDATION.md) (**LOCKED**).  
> **Design System governance:** [`F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md`](../04_UI/F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md) (**LOCKED**).  
> Token tables here must match F1 + Master + F4.10. On conflict, Master → F1 → F4.10 → F4.12 → this file.

---

# Design Tokens

## Purpose

Design Tokens are the implementation source of truth for visual values inside GMRLOG (under Master Direction authority).

Every platform must consume the same token definitions.

Platforms include:

* React Native
* Expo
* Web
* Storybook
* Figma
* Future Desktop Clients

No component may use hardcoded values.

---

# Token Hierarchy

```text
Primitive Tokens
        ↓
Semantic Tokens
        ↓
Component Tokens
        ↓
Theme Tokens
        ↓
Screen Tokens
```

---

# Color Tokens

## Primitive Colors

These represent raw color values.

```text
Gray 50
Gray 100
Gray 200
Gray 300
Gray 400
Gray 500
Gray 600
Gray 700
Gray 800
Gray 900
Gray 950

Blue
Green
Purple
Orange
Red
Yellow
Pink
Cyan
```

Primitive colors should never be referenced directly by components.

---

## Semantic Colors

### Background

* background.primary
* background.secondary
* background.tertiary
* background.elevated

---

### Surface

* surface.primary
* surface.secondary
* surface.card
* surface.dialog
* surface.tooltip

---

### Text

* text.primary
* text.secondary
* text.tertiary
* text.disabled
* text.inverse

---

### Border

* border.default
* border.focus
* border.active
* border.disabled
* border.error

---

### Status

Success

Warning

Error

Info

Verified

Premium

Developer

---

### Interactive

Primary Button

Secondary Button

Hover

Pressed

Focus

Disabled

---

# Spacing Tokens

The entire UI follows an 8pt grid.

```text
space.0

space.1

space.2

space.3

space.4

space.5

space.6

space.8

space.10

space.12

space.16

space.20

space.24
```

---

# Radius Tokens

```text
radius.none

radius.sm

radius.md

radius.lg

radius.xl

radius.2xl

radius.full
```

---

# Shadow Tokens

```text
shadow.none

shadow.sm

shadow.md

shadow.lg

shadow.xl
```

Applied consistently across every platform.

---

# Blur Tokens

```text
blur.none

blur.sm

blur.md

blur.lg

blur.xl
```

Used primarily for:

Glassmorphism

Dialogs

Bottom Sheets

Navigation

---

# Typography Tokens

## Font Families

Primary

Secondary

Monospace

---

## Font Sizes

```text
display-xl

display-lg

heading-xl

heading-lg

heading-md

heading-sm

title-lg

title-md

title-sm

body-lg

body-md

body-sm

caption

label

overline
```

---

## Font Weights

```text
thin

light

regular

medium

semibold

bold

extrabold
```

---

## Line Heights

Each typography token defines:

Font Size

Weight

Letter Spacing

Line Height

Paragraph Spacing

---

# Icon Tokens

Supported sizes:

```text
12

16

20

24

28

32

40

48
```

Icon stroke width remains constant.

---

# Avatar Tokens

Sizes

```text
xs

sm

md

lg

xl

2xl
```

Each avatar automatically maps to typography and badge sizing.

---

# Motion Tokens

## Durations

```text
instant

fast

normal

slow

verySlow
```

---

## Easings

```text
standard

accelerate

decelerate

emphasized

bounce
```

---

## Springs

Soft

Medium

Stiff

Interactive

---

# Z-Index Tokens

```text
base

dropdown

sticky

overlay

modal

toast

tooltip
```

---

# Opacity Tokens

```text
0%

5%

10%

20%

40%

60%

80%

100%
```

---

# Grid Tokens

Columns

4

8

12

16

Margins

Small

Medium

Large

Responsive gutters adapt automatically.

---

# Breakpoints

```text
Mobile

Tablet

Desktop

UltraWide
```

Layouts respond using tokens rather than fixed pixels.

---

# Animation Tokens

Shared transitions

Fade

Scale

Slide

Shared Element

Page Push

Bottom Sheet

Dialog

Navigation

---

# Theme Tokens

Dark

Light

Future Themes

Cyber

Retro CRT

OLED

Console

Neon

Seasonal

Changing a theme should require changing only token values.

---

# Accessibility Tokens

High Contrast

Reduced Motion

Large Text

Focus Ring

Error Contrast

Accessible Shadows

These tokens override default values when accessibility settings are enabled.

---

# Naming Convention

```text
category.property.variant
```

Examples

```text
color.background.primary

space.6

radius.lg

shadow.md

font.body.md

motion.fast

icon.24
```

---

# Synchronization

Tokens originate in Figma.

They are exported automatically to:

React Native

TypeScript

CSS Variables

Storybook

Documentation

No manual duplication is allowed.

---

# Acceptance Criteria

This document is complete when:

* Every visual primitive is tokenized.
* Components consume only semantic tokens.
* Themes are fully interchangeable.
* Accessibility overrides are supported.
* Tokens can be exported automatically.

---

# Dependencies

* DESIGN_SYSTEM.md
* COMPONENT_LIBRARY.md

---

# Related Documents

* MOTION_GUIDELINES.md
* ACCESSIBILITY.md
* FIGMA_CONVENTIONS.md
* STORYBOOK_GUIDE.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
