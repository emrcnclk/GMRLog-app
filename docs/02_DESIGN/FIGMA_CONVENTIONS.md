# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/02_DESIGN/FIGMA_CONVENTIONS.md`

**Status:** Approved (subordinate)

**Owner:** Design System Team

**Classification:** Internal Design Documentation

> **SSOT:** [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) (**LOCKED**). Figma must reflect Master identity. On conflict, Master wins.

---

# Figma Conventions

## Purpose

This document defines the official conventions for organizing all Figma files, pages, variables, components, design tokens, prototypes, and developer handoff materials used in GMRLOG.

Every designer must follow these conventions to ensure scalability, consistency, and seamless collaboration with engineering.

---

# Design Philosophy

The Figma workspace is treated as the visual source of truth.

Every component, token, and screen in Figma must have a one-to-one mapping with the implementation in code.

No "design-only" components should exist.

---

# Workspace Structure

```text
📁 GMRLOG Design System

├── 00_Cover
├── 01_Foundations
├── 02_Design Tokens
├── 03_Components
├── 04_Patterns
├── 05_Templates
├── 06_Screens
├── 07_Prototype
├── 08_Handoff
└── 09_Archive
```

---

# Page Structure

## 00_Cover

Project metadata

Version

Owner

Last Update

Changelog

---

## 01_Foundations

Colors

Typography

Spacing

Grid

Icons

Radius

Elevation

Motion Tokens

---

## 02_Design Tokens

Primitive Tokens

Semantic Tokens

Component Tokens

Theme Tokens

---

## 03_Components

Atoms

Molecules

Organisms

Variants

States

Responsive Versions

---

## 04_Patterns

Authentication

Feed

Game Pages

Profile

Messaging

Navigation

Settings

Tier Lists

Collections

Developer Dashboard

Studio Dashboard

---

## 05_Templates

Mobile

Tablet

Desktop

Responsive

---

## 06_Screens

Every production screen.

One frame per state.

Loading

Success

Error

Empty

Offline

---

## 07_Prototype

Complete navigation flow.

Interactive prototype.

Animation references.

Gesture demonstrations.

---

## 08_Handoff

Developer notes

Measurements

Responsive rules

API notes

Assets

---

## 09_Archive

Deprecated screens.

Old explorations.

Experimental concepts.

---

# Naming Convention

Frames

```text
DOMAIN / SCREEN / STATE
```

Examples

```text
AUTH / LOGIN / DEFAULT

FEED / HOME / LOADED

GAME / DETAIL / LOADING

PROFILE / HOME / EMPTY
```

---

# Component Naming

```text
Category / Component / Variant / State
```

Examples

```text
Button / Primary / Filled / Default

Button / Primary / Filled / Hover

Avatar / XL / Verified

GameCard / Featured / Expanded
```

---

# Variables

Variable Collections

Colors

Spacing

Radius

Typography

Elevation

Motion

Opacity

Grid

---

# Auto Layout Rules

Every frame uses Auto Layout.

Never use manual positioning unless absolutely required.

Use constraints consistently.

Support responsive resizing.

---

# Grid System

Mobile

4 Columns

Tablet

8 Columns

Desktop

12 Columns

Ultra Wide

16 Columns

---

# Component Variants

Every component defines:

Default

Hover

Pressed

Focused

Disabled

Loading

Selected

Error

Success

---

# Responsive Design

Each major screen must include:

Mobile

Tablet

Desktop

Landscape

Foldable (where applicable)

---

# Prototyping Rules

Navigation animations must match Motion Guidelines.

Prototype every major journey.

Avoid disconnected prototype flows.

---

# Asset Management

Icons

SVG

Illustrations

Vector

Game Covers

External Assets

Logos

SVG

Images

Optimized PNG/WebP

---

# Handoff Rules

Every production screen includes:

Spacing

Typography

Colors

Component references

Interaction notes

Responsive behavior

Accessibility notes

API mapping reference

---

# Developer Notes

Each frame includes:

Screen ID

Feature ID

API Endpoint

Component Tree

Navigation Source

Navigation Destination

Analytics Event

---

# Versioning

Naming

```text
vMajor.Minor.Patch
```

Examples

```text
v1.0.0

v1.1.0

v2.0.0
```

---

# Review Checklist

Before approval verify:

✓ Auto Layout

✓ Variables

✓ Components

✓ Naming

✓ Responsive

✓ Accessibility

✓ Motion

✓ Handoff

✓ Tokens

✓ No Detached Components

---

# Plugins

Approved plugins:

* Iconify
* Tokens Studio
* Autoflow
* Content Reel
* Stark
* Figmotion
* Autoflow
* Figma Export

No unapproved plugins should modify the design system.

---

# Acceptance Criteria

This document is complete when:

* Figma file organization is standardized.
* Component naming is documented.
* Auto Layout usage is mandatory.
* Responsive behavior is defined.
* Developer handoff requirements are documented.
* Versioning and review processes are established.

---

# Dependencies

* DESIGN_SYSTEM.md
* DESIGN_TOKENS.md
* COMPONENT_LIBRARY.md
* MOTION_GUIDELINES.md

---

# Related Documents

* STORYBOOK_GUIDE.md
* SCREEN_SPECIFICATIONS.md
* ACCESSIBILITY.md
* FRONTEND_ARCHITECTURE.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
