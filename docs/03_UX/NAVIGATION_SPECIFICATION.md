# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/03_UX/NAVIGATION_SPECIFICATION.md`

**Status:** Approved

**Owner:** UX Team

**Classification:** Internal UX Documentation

> **UX Constitution:** [`F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md`](./F3_1_UX_FOUNDATION_INTERACTION_PRINCIPLES.md) (**LOCKED**).  
> **Navigation Experience:** [`F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md`](./F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) (**LOCKED**).  
> IA freeze: [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md). On conflict, F3.2 (experience) · F2.1 (structure) · F3.1 · Master win.

---

# Navigation Specification

## Purpose

This document defines the complete navigation system of GMRLOG across Mobile, Tablet, Desktop, and Web.

It specifies:

* Navigation hierarchy
* Navigation behaviors
* Screen transitions
* Deep linking
* Route naming
* Gesture interactions
* Modal navigation
* Back navigation rules
* URL conventions
* Navigation analytics

Every screen transition in GMRLOG must conform to this specification.

---

# Navigation Philosophy

Navigation should feel invisible.

Users should always know:

* Where they are
* Where they came from
* Where they can go next

No user should ever become "lost."

---

# Navigation Principles

Every navigation action must satisfy:

* Predictability
* Speed
* Accessibility
* Consistency
* Context Preservation

---

# Primary Navigation (Mobile)

Bottom Navigation remains visible across the application.

```text
┌──────────────────────────┐
│          HOME            │
│                        │
│      DISCOVER          │
│                        │
│          +             │
│                        │
│   NOTIFICATIONS        │
│                        │
│        PROFILE         │
└──────────────────────────┘
```

---

## Home

Purpose

Primary social feed.

Entry Routes

* Launch
* Notifications
* Search
* Profile

---

## Discover

Purpose

Find games and people.

---

## Create

Opens Global Create Sheet.

Does not navigate.

Appears as Bottom Sheet.

---

## Notifications

Notification Center.

Unread Counter.

Grouped Notifications.

---

## Profile

Current User Profile.

Quick access to Settings.

---

# Secondary Navigation

Every major object contains internal tabs.

---

## Game

```text
Overview

Reviews

Logs

Media

Developer

Studio

Similar Games

Discussions
```

---

## Profile

```text
Activity

Reviews

Collections

Tier Lists

Favorites

Stats

Media

About
```

---

## Developer

```text
Games

Posts

Roadmap

Patch Notes

Events
```

---

## Studio

```text
Games

Developers

Community

Hiring

Media
```

---

# Navigation Graph

```text
Launch
    ↓
Authentication
    ↓
Onboarding
    ↓
Home
     ├──── Discover
     ├──── Notifications
     ├──── Profile
     ├──── Search
     ├──── Messages
     └──── Game
                    ├──── Review
                    ├──── Developer
                    ├──── Studio
                    ├──── Logs
                    └──── Similar Games
```

Navigation forms a graph rather than a linear hierarchy.

---

# Global Search Navigation

Search is accessible from:

Home

Discover

Game Pages

Profile

Developer

Studio

Messages

Search opens as a dedicated page.

---

# Modal Navigation

Presented as Bottom Sheets:

Create Post

Create Review

Game Log

Filters

Comments

Share

Settings Shortcuts

Media Picker

Emoji Picker

---

# Full Screen Modals

Image Viewer

Video Player

Authentication

QR Scanner

Developer Verification

---

# Navigation Stack Rules

Maximum stack depth:

Mobile

5 Screens

After exceeding depth:

Replace previous screens where appropriate.

---

# Back Navigation

Hardware Back (Android)

Supported.

Gesture Back (iOS)

Supported.

Browser Back (Web)

Supported.

Back navigation always restores:

Scroll Position

Search State

Filters

Selected Tabs

Draft Content

---

# Deep Linking

Supported examples:

```text
gmrlog://game/elden-ring

gmrlog://profile/emircan

gmrlog://review/82743

gmrlog://tierlist/ultimate-rpg

gmrlog://collection/my-indie-gems
```

---

# URL Structure (Web)

```text
/

/home

/discover

/search

/messages

/notifications

/profile/{username}

/game/{slug}

/review/{id}

/collection/{slug}

/tierlist/{slug}

/developer/{slug}

/studio/{slug}

/settings
```

URLs must remain stable.

---

# Route Naming Convention

```text
domain.feature.screen
```

Examples:

```text
feed.home

game.detail

game.reviews

profile.home

profile.edit

review.create

tier.builder

settings.notifications
```

---

# Navigation Animations

Push

Slide Left

Pop

Slide Right

Modal

Bottom Up

Dialog

Scale + Fade

Shared Elements

Enabled for:

Game Covers

Avatars

Collections

Tier Lists

Developer Logos

Studio Logos

---

# Gesture Navigation

Supported gestures:

Swipe Back

Swipe Down to Dismiss

Pull to Refresh

Long Press Context Menu

Double Tap Like

Drag & Drop Tier Lists

Edge Swipe

---

# Context Menus

Long press opens contextual actions.

Example:

Feed Card

Like

Bookmark

Share

Report

Mute User

Block User

Copy Link

---

# Notification Navigation

Every notification deep-links directly to its origin.

Examples:

Friend Request

↓

Friend Request Screen

Review Like

↓

Review Detail

Developer Post

↓

Developer Profile

Comment Reply

↓

Comment Thread

---

# Error Navigation

Broken Deep Link

↓

Fallback Screen

↓

Search Suggestions

Deleted Content

↓

Content Unavailable

↓

Related Content

Offline

↓

Offline Cache

↓

Retry

---

# Authentication Guards

Protected routes:

Messages

Settings

Create

Friends

Developer Dashboard

Studio Dashboard

Guests attempting access are redirected to Login.

---

# Role-Based Navigation

Guest

Limited Navigation

User

Full Social Features

Developer

Developer Dashboard

Verified Studio

Studio Dashboard

Moderator

Moderation Center

Administrator

Admin Console

---

# Multi-Platform Navigation

Mobile

Bottom Navigation

Tablet

Navigation Rail

Desktop

Sidebar

Web

Responsive Sidebar

Navigation logic remains identical.

---

# Navigation Analytics

Track:

Screen Open

Screen Close

Back Navigation

Deep Link Open

Navigation Errors

Search Entry

Tab Switching

Average Navigation Time

Drop-off Points

---

# Accessibility

Navigation supports:

VoiceOver

TalkBack

Keyboard

Large Text

Reduced Motion

Focus Order

Screen Reader Labels

Every destination must have an accessible name.

---

# QA Checklist

Before release verify:

✓ Deep Links

✓ Back Navigation

✓ Route Guards

✓ Navigation State

✓ Scroll Restoration

✓ Shared Elements

✓ Keyboard Support

✓ Screen Reader Labels

✓ Offline Navigation

✓ Error Recovery

---

# Acceptance Criteria

This document is complete when:

* Every navigation path is documented.
* Deep linking is standardized.
* Route naming is defined.
* Gesture behavior is specified.
* Navigation analytics are included.
* Accessibility requirements are satisfied.

---

# Dependencies

* INFORMATION_ARCHITECTURE.md
* USER_JOURNEYS.md
* SCREEN_SPECIFICATIONS.md

---

# Related Documents

* API_SPECIFICATION.md
* DATABASE_SPECIFICATION.md
* FRONTEND_ARCHITECTURE.md
* DESIGN_SYSTEM.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
