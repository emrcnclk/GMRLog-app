# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/02_DESIGN/COMPONENT_LIBRARY.md`

**Status:** Approved (subordinate)

**Owner:** Design System Team

**Classification:** Internal Design Documentation

> **SSOT:** [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) (**LOCKED**).  
> **Foundation detail:** [`SPRINT_F1_FOUNDATION.md`](./SPRINT_F1_FOUNDATION.md) (**LOCKED**).  
> **Behavior constitution:** [`F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md`](../03_UX/F3_6_COMPONENTS_FORMS_STATES_SEARCH_EXPERIENCE.md) (**LOCKED**).  
> **Object citizenship:** [`F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md`](../04_UI/F4_7_INTERACTION_COMPONENTS_PHILOSOPHY.md) (**LOCKED**).  
> **Design System law:** [`F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md`](../04_UI/F4_8_COMPONENT_DESIGN_SYSTEM_CONSTITUTION.md) (**LOCKED**).  
> **Design System governance:** [`F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md`](../04_UI/F4_12_DESIGN_SYSTEM_GOVERNANCE_EVOLUTION_CONSTITUTION.md) (**LOCKED**).  
> Signature specs and F1 catalog win over older brief entries. On conflict, Master → F1 → F3.6 → F4.7 → F4.8 → F4.12 → this file.

---

# Component Library

## Purpose

This document defines every reusable UI component within GMRLOG.

Every screen must be composed from these components.

No screen-specific component should exist unless explicitly approved.

The Component Library ensures:

* Visual consistency
* Faster development
* Easier maintenance
* Better accessibility
* Predictable UX
* Scalable architecture

---

# Component Philosophy

Components are built using Atomic Design principles.

```text
Design Tokens
        ↓
Atoms
        ↓
Molecules
        ↓
Organisms
        ↓
Templates
        ↓
Pages
```

Each component has:

* Props
* Variants
* States
* Accessibility behavior
* Motion behavior
* Responsive behavior

---

# Component Categories

The library contains nine categories.

1. Foundations
2. Inputs
3. Buttons
4. Navigation
5. Cards
6. Social
7. Gaming
8. Feedback
9. Layout

---

# Foundations

## Avatar

Variants

* XS
* SM
* MD
* LG
* XL

States

* Default
* Online
* Offline
* Away
* Verified
* Developer

Supports:

* Image
* Initials
* Gradient Placeholder

---

## Badge

Variants

* Verified
* Developer
* Studio
* Premium
* Moderator
* Founder
* Early Supporter
* Beta Tester

---

## Chip

Variants

* Genre
* Platform
* Status
* Filter
* Tag

---

# Buttons

## Primary Button

Usage

Primary actions.

States

Default

Hover

Pressed

Focused

Disabled

Loading

---

## Secondary Button

Used for supporting actions.

---

## Ghost Button

Transparent background.

Low emphasis.

---

## Icon Button

Sizes

40

48

56

Supports badges.

---

## Floating Action Button

Used only for global creation.

Always positioned above Bottom Navigation.

---

# Inputs

## TextField

Supports

* Prefix
* Suffix
* Helper Text
* Error
* Success
* Character Counter
* Clear Button

---

## Search Bar

Features

Recent searches

Suggestions

Voice Search

Filter Button

Search History

---

## Rating Picker

Supports

Half ratings.

Whole ratings.

10-point mode.

5-star mode.

---

# Navigation

## Bottom Navigation

Items

Home

Discover

Create

Notifications

Profile

Persistent across application.

---

## Top App Bar

Supports

Back

Search

Actions

Title

Transparent Mode

Collapsed Mode

---

## Tab Bar

Scrollable.

Fixed.

Animated Indicator.

Badge Support.

---

## Side Drawer (Tablet/Web)

Contains

Navigation

Collections

Recent Games

Settings

Profile Shortcut

---

# Cards

## Game Card

Variants

Compact

Standard

Featured

Hero

Horizontal

Grid

Content

Cover

Title

Developer

Genres

Rating

Release Date

Friend Activity

Quick Actions

---

## Review Card

Contains

Reviewer

Rating

Spoiler Badge

Review Preview

Likes

Comments

Helpful Count

Game Reference

---

## User Card

Contains

Avatar

Username

Bio

Followers

Mutual Friends

Follow Button

---

## Developer Card

Contains

Logo

Name

Verified Badge

Followers

Games

Follow

---

## Studio Card

Contains

Logo

Games

Developers

Followers

---

# Gaming Components

## Game Status Selector

Statuses

Playing

Completed

Wishlist

Backlog

Paused

Dropped

Replay

Animated state transitions.

---

## Achievement Card

Contains

Icon

Progress

Description

Completion Date

---

## Tier List Board

Supports

Drag & Drop

Keyboard Accessibility

Custom Labels

Infinite Rows

Templates

Export

---

## Collection Card

Contains

Cover Mosaic

Title

Owner

Games Count

Likes

Followers

---

# Feed Components

## Feed Card

Supports

Text

Image

GIF

Video

Poll

Game Reference

Collection

Tier List

Review

Developer Update

---

## Composer

Supports

Text

Media

Game Mention

Emoji

Markdown

Poll

Preview

Scheduling

---

## Reaction Bar

Buttons

Like

Comment

Repost

Quote

Bookmark

Share

Animated counters.

---

# Messaging Components

Conversation Tile

Typing Indicator

Voice Bubble

Image Bubble

Date Divider

Unread Badge

Message Composer

Online Indicator

---

# Discover Components

Trending Carousel

Genre Grid

Platform Selector

Recommendation Carousel

Upcoming Releases

Featured Developer

Trending Tags

---

# Notification Components

Notification Card

Grouped Notifications

Friend Request Card

Mention Card

Developer Update Card

Achievement Notification

---

# Feedback Components

Snackbar

Toast

Alert

Banner

Bottom Sheet

Dialog

Confirmation Modal

Loading Overlay

---

# Empty States

Every major screen has a custom illustration.

Examples

No Friends

No Reviews

No Notifications

No Games

No Collections

No Messages

Each empty state includes:

Illustration

Primary CTA

Secondary CTA

Helpful Text

---

# Loading States

Skeleton components exist for:

Game Card

Review Card

Feed

Profile

Collection

Tier List

Messages

Developer Page

Search Results

---

# Accessibility Requirements

Every component supports:

Screen Readers

Focus Ring

Keyboard Navigation

High Contrast

Reduced Motion

Dynamic Type

RTL Layout

---

# Motion Specification

Every component defines:

Entrance Animation

Exit Animation

Pressed State

Hover State

Focus State

Loading State

Disabled State

Transition Duration

Easing Curve

---

# Component Naming

```text
Component

Component.Header

Component.Body

Component.Footer

Component.Actions
```

Example

```text
GameCard

GameCard.Header

GameCard.Footer

GameCard.Actions
```

---

# Figma Organization

```text
📁 Foundations

📁 Components

📁 Patterns

📁 Templates

📁 Screens

📁 Prototypes
```

---

# Development Mapping

Every Figma component has a matching implementation.

Example

```text
Figma

↓

React Component

↓

Storybook

↓

Expo

↓

Production
```

Naming remains identical across all layers.

---

# Acceptance Criteria

This document is complete when:

* Every reusable UI element is documented.
* Components follow Atomic Design.
* Accessibility is specified.
* Motion behavior is defined.
* Naming conventions are standardized.
* Figma and code remain synchronized.

---

# Dependencies

* DESIGN_SYSTEM.md
* INFORMATION_ARCHITECTURE.md
* USER_JOURNEYS.md

---

# Related Documents

* DESIGN_TOKENS.md
* SCREEN_SPECIFICATIONS.md
* MOTION_GUIDELINES.md
* ACCESSIBILITY.md
* STORYBOOK_GUIDE.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
