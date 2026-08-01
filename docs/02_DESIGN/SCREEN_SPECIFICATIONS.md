# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/02_DESIGN/SCREEN_SPECIFICATIONS.md`

**Status:** Approved (subordinate)

**Owner:** UX Team

**Classification:** Internal Design Documentation

> **SSOT:** [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) (**LOCKED**) — Screen Inventory §11 and pillar/IA rules.  
> **Nav / IA freeze:** [`SPRINT_F2_1_INFORMATION_ARCHITECTURE.md`](./SPRINT_F2_1_INFORMATION_ARCHITECTURE.md) (**LOCKED**). On conflict, Master → F2.1 → this file.

---

# Screen Specifications

## Purpose

This document defines every screen in GMRLOG.

Every production screen must reference this specification before implementation.

Each screen contains:

* Purpose
* User Goal
* Entry Points
* Exit Points
* Required Components
* API Dependencies
* Loading States
* Empty States
* Error States
* Accessibility Notes
* Analytics Events

No production screen should exist without documentation.

---

# Screen Naming Convention

Every screen follows:

```text
Domain / Feature / Screen
```

Examples

```text
Auth/Login

Game/GameDetail

Profile/ProfileHome

Feed/HomeFeed

Review/CreateReview
```

---

# Navigation Structure

```text
Launch

↓

Authentication

↓

Onboarding

↓

Home

↓

Discover

↓

Game

↓

Review

↓

Profile

↓

Settings
```

---

# Total Screen Inventory

The first production release contains approximately **95 screens**.

Grouped by domain:

| Domain         | Screens |
| -------------- | ------: |
| Authentication |       8 |
| Onboarding     |       7 |
| Feed           |      10 |
| Discover       |       9 |
| Game           |      12 |
| Reviews        |       8 |
| Collections    |       5 |
| Tier Lists     |       6 |
| Messaging      |       7 |
| Notifications  |       3 |
| Profile        |      10 |
| Developer      |       4 |
| Studio         |       3 |
| Settings       |       8 |

---

# AUTHENTICATION

---

## AUTH-001 Login

### Purpose

Authenticate existing users.

---

### Components

* Logo
* Welcome Text
* Google Login
* Steam Login
* Discord Login
* Apple Login
* Email Login
* Terms
* Privacy Links

---

### Entry

Launch Screen

---

### Exit

Home Feed

---

### API

POST /auth/login

POST /auth/oauth/google

POST /auth/oauth/steam

POST /auth/oauth/discord

POST /auth/oauth/apple

---

### Analytics

login_started

login_completed

oauth_selected

---

### Accessibility

Supports autofill.

Supports password managers.

Supports screen readers.

---

## AUTH-002 Register

Components

Username

Email

Password

Avatar

Continue Button

---

## AUTH-003 Forgot Password

---

## AUTH-004 Email Verification

---

## AUTH-005 Two Factor

---

## AUTH-006 Terms

---

## AUTH-007 Privacy

---

## AUTH-008 Welcome

---

# ONBOARDING

---

## ONBOARD-001 Welcome

Animated introduction.

---

## ONBOARD-002 Favorite Games

Grid

Infinite Search

Popular Games

Trending

---

## ONBOARD-003 Favorite Genres

---

## ONBOARD-004 Platforms

---

## ONBOARD-005 Suggested Friends

---

## ONBOARD-006 Suggested Developers

---

## ONBOARD-007 Finish

Personalized Feed Generation

---

# HOME FEED

---

## FEED-001 Home Feed

Purpose

Main social experience.

---

Sections

Stories (Future)

Following

Recommended

Trending

Developer Updates

Friend Activity

---

Components

Feed Composer

Feed Card

Reaction Bar

Floating Action Button

Bottom Navigation

Top Search

---

Loading

Skeleton Feed

---

Empty State

Find gamers to follow.

---

Analytics

feed_opened

feed_refresh

feed_scroll

feed_post_clicked

---

## FEED-002 Feed Detail

---

## FEED-003 Post Composer

---

## FEED-004 Media Viewer

---

## FEED-005 Hashtag

---

## FEED-006 Trending

---

## FEED-007 Following Feed

---

## FEED-008 Bookmarks

---

## FEED-009 Saved Drafts

---

## FEED-010 Search Feed

---

# DISCOVER

---

## DISCOVER-001 Discover Home

Contains

Trending Games

Hidden Gems

Upcoming Releases

Genres

Platforms

Curated Lists

Featured Developers

Community Picks

---

## DISCOVER-002 Search

Supports

Games

Players

Developers

Studios

Reviews

Posts

Collections

Tier Lists

---

## DISCOVER-003 Genre Page

---

## DISCOVER-004 Platform Page

---

## DISCOVER-005 Franchise

---

## DISCOVER-006 Recommendation Feed

---

## DISCOVER-007 Upcoming Games

---

## DISCOVER-008 Popular Developers

---

## DISCOVER-009 Search Results

---

# GAME

---

## GAME-001 Game Detail

Purpose

Primary game information hub.

---

Header

Cover Art

Title

Developer

Studio

Release Date

Platforms

Genres

Community Rating

Friend Activity

---

Tabs

Overview

Reviews

Logs

Media

Developer

Studio

Similar Games

---

Quick Actions

Log

Review

Wishlist

Share

Favorite

---

API

GET /games/:id

GET /reviews/game/:id

GET /logs/game/:id

---

## GAME-002 Screenshots

---

## GAME-003 Videos

---

## GAME-004 Reviews

---

## GAME-005 Logs

---

## GAME-006 Similar Games

---

## GAME-007 DLC

---

## GAME-008 Achievements

---

## GAME-009 Community

---

## GAME-010 News

---

## GAME-011 Developer

---

## GAME-012 Studio

---

# REVIEWS

---

## REVIEW-001 Create Review

Rich Text

Markdown

Spoilers

Autosave

Media

Rating

Preview

Publish

---

## REVIEW-002 Review Detail

---

## REVIEW-003 Edit Review

---

## REVIEW-004 Draft Reviews

---

## REVIEW-005 My Reviews

---

## REVIEW-006 Community Reviews

---

## REVIEW-007 Spoiler View

---

## REVIEW-008 Helpful Reviews

---

# TIER LISTS

---

## TIER-001 My Tier Lists

---

## TIER-002 Builder

Supports

Drag & Drop

Templates

Import

Export

Save Draft

Publish

---

## TIER-003 Public Tier List

---

## TIER-004 Community Templates

---

## TIER-005 Edit Tier List

---

## TIER-006 Tier List Explorer

---

# COLLECTIONS

---

## COLLECTION-001 Collections

---

## COLLECTION-002 Create Collection

---

## COLLECTION-003 Collection Detail

---

## COLLECTION-004 Edit Collection

---

## COLLECTION-005 Shared Collection

---

# MESSAGING

---

## MESSAGE-001 Inbox

---

## MESSAGE-002 Conversation

---

## MESSAGE-003 New Message

---

## MESSAGE-004 Friend Requests

---

## MESSAGE-005 Shared Media

---

## MESSAGE-006 Search Messages

---

## MESSAGE-007 Blocked Users

---

# NOTIFICATIONS

---

## NOTIFICATION-001 Notification Center

---

## NOTIFICATION-002 Notification Settings

---

## NOTIFICATION-003 Activity History

---

# PROFILE

---

## PROFILE-001 Profile

Header

Banner

Avatar

Stats

Gaming DNA

Recent Activity

Favorite Games

Collections

Tier Lists

Reviews

Friends

Followers

Following

---

## PROFILE-002 Edit Profile

---

## PROFILE-003 Followers

---

## PROFILE-004 Following

---

## PROFILE-005 Friends

---

## PROFILE-006 Gaming Stats

---

## PROFILE-007 Activity History

---

## PROFILE-008 Badges

---

## PROFILE-009 Settings Shortcut

---

## PROFILE-010 Public Profile

---

# DEVELOPER

---

## DEV-001 Developer Profile

---

## DEV-002 Developer Games

---

## DEV-003 Patch Notes

---

## DEV-004 Roadmap

---

# STUDIO

---

## STUDIO-001 Studio Profile

---

## STUDIO-002 Studio Games

---

## STUDIO-003 Hiring

---

# SETTINGS

---

## SETTINGS-001 General

---

## SETTINGS-002 Account

---

## SETTINGS-003 Appearance

---

## SETTINGS-004 Notifications

---

## SETTINGS-005 Privacy

---

## SETTINGS-006 Security

---

## SETTINGS-007 Accessibility

---

## SETTINGS-008 About

---

# Universal Screen Requirements

Every screen must define:

* Loading State
* Error State
* Empty State
* Offline State
* Pull to Refresh (where applicable)
* Deep Link Support
* Analytics Events
* Accessibility Labels
* Motion Specification
* Responsive Behavior
* Theme Support

---

# Screen Lifecycle

```text
Open
    ↓
Loading
    ↓
Content
    ↓
Interaction
    ↓
Background
    ↓
Resume
    ↓
Close
```

Every screen must preserve state during lifecycle changes where practical.

---

# Acceptance Criteria

This document is complete when:

* Every production screen has a unique identifier.
* Navigation entry and exit points are defined.
* Required components are listed.
* API dependencies are documented.
* Universal states are specified.
* Accessibility and analytics are included.

---

# Dependencies

* INFORMATION_ARCHITECTURE.md
* USER_JOURNEYS.md
* DESIGN_SYSTEM.md
* COMPONENT_LIBRARY.md

---

# Related Documents

* NAVIGATION_SPECIFICATION.md
* API_SPECIFICATION.md
* DATABASE_SPECIFICATION.md
* FIGMA_CONVENTIONS.md
* WIREFRAMES.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
