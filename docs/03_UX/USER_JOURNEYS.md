# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/03_UX/USER_JOURNEYS.md`

**Status:** Approved

**Owner:** UX Team

**Classification:** Internal UX Documentation

---

# User Journeys

## Purpose

This document defines the primary user journeys within GMRLOG.

Unlike the Information Architecture, which explains **where information lives**, this document explains **how users move through the platform** to accomplish meaningful goals.

Every screen, animation, interaction, API endpoint, and navigation pattern should support one or more user journeys defined here.

---

# UX Philosophy

The best user journey is one that feels invisible.

Users should never think about navigation.

They should think only about games.

Every journey should minimize friction while maximizing delight.

---

# Journey Principles

Every journey follows these principles:

* Minimum number of steps
* Clear next actions
* Immediate feedback
* Progressive disclosure
* Easy recovery from mistakes
* Smooth animations
* Context preservation
* No dead ends

---

# Journey Categories

The platform supports eight primary journeys.

1. New User Onboarding
2. Discovering a Game
3. Logging a Game
4. Writing a Review
5. Creating a Tier List
6. Social Interaction
7. Following a Developer
8. Managing a Profile

---

# Journey 01 — New User Onboarding

## Goal

Create a personalized account in under three minutes.

---

## Entry Points

* Google
* Steam
* Discord
* Apple
* Email

---

## Flow

```text
Launch App
        ↓
Welcome Screen
        ↓
Authentication
        ↓
Username Selection
        ↓
Choose Favorite Games
        ↓
Choose Favorite Genres
        ↓
Choose Platforms
        ↓
Follow Suggested Friends
        ↓
Follow Suggested Developers
        ↓
Generate Personalized Feed
        ↓
Home Feed
```

---

## UX Notes

The onboarding should feel playful rather than procedural.

Users should immediately see recognizable games and franchises.

No step should feel mandatory except account creation.

---

## Success Metric

Time to first meaningful action:

Target: < 180 seconds

---

# Journey 02 — Discovering a Game

## Goal

Help the player find a game they'll love.

---

## Entry Points

* Search
* Discover
* Feed
* Friend Activity
* Collection
* Recommendation

---

## Flow

```text
Discover
      ↓
Search or Browse
      ↓
Game Card
      ↓
Game Detail
      ↓
Reviews
      ↓
Developer
      ↓
Wishlist / Log / Review
```

---

## UX Notes

Game pages should answer:

* What is it?
* Why should I play it?
* What do my friends think?
* Is it worth my time?

---

# Journey 03 — Logging a Game

## Goal

Allow players to record progress instantly.

---

## Flow

```text
Game Page
      ↓
Log Game
      ↓
Status

Playing

Completed

Backlog

Wishlist

Dropped

Replay
      ↓
Optional Rating
      ↓
Optional Notes
      ↓
Save
      ↓
Feed Update
```

---

## UX Notes

Logging should take less than 15 seconds.

Writing a review should remain optional.

---

# Journey 04 — Writing a Review

## Goal

Capture meaningful opinions.

---

## Flow

```text
Game Page
      ↓
Write Review
      ↓
Rating
      ↓
Spoiler Toggle
      ↓
Rich Text Editor
      ↓
Preview
      ↓
Publish
      ↓
Feed
```

---

## Features

Rich formatting

Markdown

Spoiler blocks

Autosave

Drafts

Media

Game tags

---

## Success Metric

Review completion rate >70%

---

# Journey 05 — Creating a Tier List

## Goal

Allow players to visually rank games.

---

## Flow

```text
Create
      ↓
Tier List
      ↓
Select Template
      ↓
Choose Games
      ↓
Drag & Drop
      ↓
Customize Labels
      ↓
Preview
      ↓
Publish
```

---

## UX Notes

The editor should feel playful.

Dragging games should be fluid at 60fps.

Exporting as an image should require one tap.

---

# Journey 06 — Social Interaction

## Goal

Enable meaningful conversations.

---

## Flow

```text
Feed
      ↓
Open Post
      ↓
Like

Comment

Reply

Quote

Share

Bookmark
      ↓
Notification
      ↓
Conversation
```

---

## UX Notes

Comments should encourage discussion rather than reaction farming.

Nested replies should remain readable.

---

# Journey 07 — Following a Developer

## Goal

Connect players with creators.

---

## Flow

```text
Game
     ↓
Developer
     ↓
Profile
     ↓
Follow
     ↓
Receive Updates
```

---

## Notifications

New Patch

Roadmap Updates

Blog Posts

Events

Betas

Announcements

---

# Journey 08 — Managing Your Profile

## Goal

Allow players to shape their gaming identity.

---

## Flow

```text
Profile
      ↓
Edit
      ↓
Avatar

Banner

Bio

Favorite Games

Genres

Platforms

Links

Privacy
      ↓
Save
```

---

## UX Notes

Profile editing should feel creative.

Live preview should update instantly.

---

# Supporting Journeys

Additional journeys include:

* Friend Requests
* Blocking Users
* Reporting Content
* Searching Users
* Creating Collections
* Sharing Reviews
* Receiving Notifications
* Messaging Friends
* Joining Events
* Viewing Analytics

---

# Empty State Journeys

Every empty state should encourage action.

Examples

No Reviews

→ Write your first review.

No Friends

→ Discover gamers with similar tastes.

No Logs

→ Start building your gaming history.

No Collections

→ Organize your favorite games.

---

# Error Recovery

Users should never lose work.

Requirements

Draft recovery

Offline support

Retry actions

Undo destructive actions

Clear error messages

Graceful degradation

---

# Notification Journey

```text
Action
    ↓
Server Event
    ↓
Notification Created
    ↓
Push Notification
    ↓
Notification Center
    ↓
Relevant Screen
```

Notifications should always deep-link to the originating content.

---

# Multi-Device Journey

```text
Mobile
      ↓
Continue on Web
      ↓
Continue on Desktop
      ↓
Continue on Mobile
```

User context should synchronize seamlessly across devices.

---

# Cross-Journey Principles

Every journey should:

Preserve user context.

Support back navigation.

Be interruptible.

Be resumable.

Provide instant feedback.

Avoid unnecessary loading.

---

# Journey Performance Targets

| Journey           | Target Time |
| ----------------- | ----------: |
| Sign Up           |     < 3 min |
| Log Game          |    < 15 sec |
| Review Submission |     < 2 min |
| Search to Game    |    < 10 sec |
| Create Tier List  |     < 5 min |
| Follow Developer  |     < 5 sec |
| Edit Profile      |     < 1 min |

---

# Accessibility Considerations

All journeys must support:

Screen readers

Keyboard navigation (Web)

Large text

Reduced motion

High contrast

VoiceOver / TalkBack

Color-independent feedback

---

# UX Success Metrics

Track:

* Journey completion rate
* Drop-off rate
* Time on task
* Error frequency
* Rage taps
* Back navigation frequency
* Session continuation
* User satisfaction
* Feature adoption

---

# Acceptance Criteria

This document is complete when:

* Every primary user goal has a documented journey.
* Entry points and exit points are defined.
* UX principles are consistently applied.
* Performance expectations are measurable.
* Accessibility requirements are integrated into every journey.

---

# Dependencies

* PRODUCT_VISION.md
* PRODUCT_PRINCIPLES.md
* PERSONAS.md
* INFORMATION_ARCHITECTURE.md

---

# Related Documents

* DESIGN_SYSTEM.md
* WIREFRAMES.md
* NAVIGATION_SPECIFICATION.md
* COMPONENT_LIBRARY.md
* INTERACTION_GUIDELINES.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
