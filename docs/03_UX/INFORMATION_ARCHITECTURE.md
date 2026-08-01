# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/03_UX/INFORMATION_ARCHITECTURE.md`

**Status:** Approved

**Owner:** UX Team

**Classification:** Internal UX Documentation

> **Structure SSOT:** [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](../02_DESIGN/SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) (**LOCKED**).  
> **Navigation experience:** [`F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md`](./F3_2_INFORMATION_ARCHITECTURE_NAVIGATION_EXPERIENCE.md) (**LOCKED**). On conflict, F2.1 (structure) wins.

---

# Information Architecture

## Purpose

This document defines the complete structural organization of the GMRLOG platform.

It specifies how every piece of information is organized, connected, discovered, and navigated.

Unlike wireframes or UI specifications, this document focuses exclusively on **information hierarchy**, **navigation**, and **relationships between product domains**.

The Information Architecture serves as the blueprint for every future screen, API endpoint, navigation flow, and database relationship.

---

# IA Principles

The architecture follows six guiding principles.

### 1. Identity First

Everything begins with the player.

Every action ultimately enriches the user's gaming identity.

---

### 2. Games Are the Center

Games are the primary content object.

Nearly every entity relates to a game.

---

### 3. Social Is Everywhere

Every page should expose opportunities to interact.

Users should never reach a dead end.

---

### 4. Progressive Disclosure

Simple interactions remain simple.

Advanced functionality is revealed only when needed.

---

### 5. Consistent Navigation

Users should never wonder:

> "Where am I?"

Navigation must remain predictable.

---

### 6. Infinite Discoverability

Every page should naturally lead to another page.

The product should continuously encourage exploration.

---

# Primary Navigation

Bottom Navigation (Mobile)

```text
Home

Discover

+

Notifications

Profile
```

The **+** button opens the global creation sheet.

---

# Home

Purpose

Social activity.

Contains:

* Following Feed
* Recommended Feed
* Trending Feed
* Friends Activity
* Developer Announcements

Primary CTA

Create Post

---

# Discover

Purpose

Find games, players, developers and communities.

Contains

* Search
* Trending Games
* Upcoming Releases
* Hidden Gems
* Popular Developers
* Genres
* Franchises
* Curated Lists
* Personalized Recommendations

---

# Global Create Sheet

The center button opens:

* New Post
* Review
* Log Game
* Tier List
* Collection
* Poll
* Developer Update (Verified)
* Studio Announcement (Verified)

---

# Notifications

Contains

Friend Requests

Mentions

Likes

Comments

Replies

Developer Updates

Achievements

Moderation Messages

System Notifications

---

# Profile

Contains

Profile Header

Gaming Stats

Recent Activity

Favorite Games

Reviews

Collections

Tier Lists

Followers

Following

Friends

Settings Shortcut

---

# Secondary Navigation

Every major entity contains its own contextual navigation.

---

## Game Page

Tabs

Overview

Reviews

Logs

Screenshots

Videos

DLC

Achievements

Discussions

Similar Games

---

## User Profile

Tabs

Activity

Reviews

Logs

Tier Lists

Collections

Favorites

Statistics

Media

About

---

## Developer Profile

Tabs

Games

Posts

Patch Notes

Roadmap

Events

Media

Followers

Analytics (Private)

---

## Studio Profile

Tabs

Games

Developers

Announcements

Roadmaps

Hiring

Media

Community

---

# Global Search Architecture

Search supports multiple entity types.

Results are grouped.

```text
Games

Users

Developers

Studios

Collections

Tier Lists

Reviews

Posts

Hashtags
```

Search should never require users to specify categories manually.

---

# Primary Content Objects

The platform revolves around these core entities.

## User

Relationships

Friends

Followers

Reviews

Logs

Collections

Messages

Notifications

Posts

Tier Lists

Achievements

---

## Game

Relationships

Developer

Studio

Publisher

Genres

Platforms

Reviews

Logs

Collections

Posts

Events

DLC

---

## Review

Relationships

Game

Author

Comments

Likes

Bookmarks

Developer Replies

---

## Log

Relationships

User

Game

Platform

Completion Status

Play Session

---

## Collection

Relationships

Owner

Games

Followers

Comments

Likes

---

## Tier List

Relationships

Games

Author

Comments

Votes

Templates

---

## Post

Relationships

Author

Game (Optional)

Media

Replies

Quotes

Likes

Bookmarks

---

## Notification

Relationships

Actor

Recipient

Entity

Action

Timestamp

Read Status

---

# Information Hierarchy

```text
User
│
├── Feed
├── Profile
├── Discover
├── Notifications
├── Messages
└── Settings
```

---

Game hierarchy

```text
Game

Overview

Reviews

Logs

Media

Community

Developer

Studio

Related Games
```

---

Profile hierarchy

```text
Profile

Header

Statistics

Activity

Reviews

Logs

Collections

Tier Lists

Media

About
```

---

# Cross Navigation Rules

Every page should provide onward navigation.

Example:

Game

↓

Developer

↓

Studio

↓

Other Games

↓

Collections

↓

Users

↓

Reviews

↓

Recommendations

No screen should terminate the user's journey.

---

# Navigation Depth

Maximum recommended depth

Mobile

3 levels

Example

Home

↓

Game

↓

Review

Never exceed three navigation layers unless absolutely necessary.

---

# Content Relationships

The architecture forms a graph rather than a tree.

Example

```text
User
 │
 ├── Reviews
 │      │
 │      └── Game
 │              │
 │              ├── Developer
 │              ├── Genre
 │              ├── Similar Games
 │              └── Collections
 │
 └── Friends
```

This interconnected structure maximizes discovery and engagement.

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

 /developer/{slug}

 /studio/{slug}

 /review/{id}

 /collection/{slug}

 /tierlist/{slug}

 /settings
```

URLs must remain human-readable, SEO-friendly, and permanent.

---

# Breadcrumb Strategy

Desktop and Web include breadcrumbs for deep navigation.

Mobile relies on contextual back navigation.

---

# Navigation Design Principles

Navigation should be:

Predictable

Consistent

Gesture-friendly

Thumb-friendly

Minimal

Never hide essential actions behind complex gestures.

---

# Future IA Expansion

Future entities include:

Community Hubs

Guilds

Events

Esports Teams

Mods

Marketplace Integrations

Public API Explorer

These should integrate into the existing graph without restructuring current navigation.

---

# Acceptance Criteria

This document is complete when:

* Every primary entity is defined.
* Navigation hierarchy is documented.
* Relationships between entities are established.
* URL conventions are standardized.
* Future features can integrate without major IA changes.

---

# Dependencies

* PRODUCT_VISION.md
* PRODUCT_PRINCIPLES.md
* FEATURE_MATRIX.md
* ROADMAP.md

---

# Related Documents

* USER_JOURNEYS.md
* DESIGN_SYSTEM.md
* WIREFRAMES.md
* NAVIGATION_SPECIFICATION.md
* DATABASE_SPECIFICATION.md
* API_SPECIFICATION.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
