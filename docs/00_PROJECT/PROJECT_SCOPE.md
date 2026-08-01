# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/00_PROJECT/PROJECT_SCOPE.md`

**Status:** Active Draft

**Owner:** GMRLOG Core Team

**Classification:** Internal Engineering Documentation

---

# Project Scope

## Purpose

This document defines the boundaries of the GMRLOG platform.

It specifies exactly what the product is responsible for, what it intentionally excludes, and how future development phases are organized.

Its purpose is to eliminate scope creep and ensure every engineering decision aligns with the long-term vision.

---

# Product Definition

GMRLOG is a **social platform centered around video games**.

It enables players to build a lifelong gaming identity through reviews, logs, collections, social interactions, and discovery while providing verified developers with modern community management tools.

The platform is **not** designed to replace existing game launchers or storefronts.

Instead, it complements them by becoming the social layer of gaming.

---

# Core Domains

The platform is divided into twelve major product domains.

## 1. Identity

Responsible for everything related to user identity.

Includes:

* User Accounts
* Gamer Profiles
* Gamer Level
* Badges
* Reputation
* Connected Platforms
* Gaming DNA
* Privacy Settings
* Profile Themes
* Public URLs

---

## 2. Social Network

Responsible for all user-to-user interaction.

Includes:

* Following
* Followers
* Friends
* Friend Requests
* Blocks
* Mutes
* Mentions
* Replies
* Quotes
* Reposts
* Likes
* Bookmarks
* Activity Feed

---

## 3. Game Database

Responsible for game information.

Includes:

* Games
* DLC
* Franchises
* Genres
* Platforms
* Publishers
* Developers
* Studios
* Game Covers
* Screenshots
* Trailers
* Release History
* Editions

---

## 4. Reviews

Responsible for written opinions.

Includes:

* Ratings
* Long Reviews
* Spoiler Controls
* Draft Reviews
* Review Editing
* Review Likes
* Featured Reviews
* Critic Reviews
* Developer Responses

---

## 5. Game Logging

Responsible for tracking player history.

Includes:

* Started Playing
* Finished Playing
* Replayed
* Abandoned
* Playing Now
* Play Sessions
* Hours Played
* Difficulty
* Platform Played
* Completion Status

---

## 6. Discovery

Responsible for personalized recommendations.

Includes:

* Discover Feed
* Trending
* New Releases
* Upcoming Games
* Hidden Gems
* Friend Recommendations
* AI Suggestions
* Similar Games
* Similar Players

---

## 7. Community

Responsible for user-generated content.

Includes:

* Posts
* Polls
* Media
* Screenshots
* Videos
* GIFs
* Discussions
* Comments
* Hashtags

---

## 8. Tier Lists

Responsible for ranking content.

Includes:

* Personal Tier Lists
* Collaborative Tier Lists
* Community Voting
* Templates
* Exports
* Sharing
* Comments

---

## 9. Collections

Responsible for organizing games.

Includes:

* Wishlists
* Backlogs
* Favorites
* Custom Collections
* Physical Collection
* Collector Editions
* Completed Games
* Platinum Collection

---

## 10. Messaging

Responsible for private communication.

Includes:

* Direct Messages
* Group Chats
* Attachments
* Read Receipts
* Typing Indicators
* Presence
* Notifications

---

## 11. Developer Platform

Responsible for verified studios.

Includes:

* Studio Profiles
* Team Members
* Dev Blogs
* Patch Notes
* Roadmaps
* Events
* Giveaways
* Beta Registrations
* Analytics
* Sponsored Posts

---

## 12. Administration

Responsible for moderation.

Includes:

* Reports
* Moderation Queue
* User Management
* Content Review
* Analytics
* Audit Logs
* Feature Flags
* System Health

---

# Phase One Scope (MVP+)

The first public release includes:

### Authentication

* Google Login
* Discord Login
* Steam Login
* Apple Login
* Email Authentication
* Password Recovery

---

### User Profiles

* Profile Creation
* Banner
* Avatar
* Bio
* Favorite Games
* Favorite Genres
* Gaming Statistics
* Connected Accounts

---

### Feed

* Home Feed
* Following Feed
* Trending Feed
* Recommended Feed

---

### Games

* Complete Game Database
* Game Detail Pages
* Ratings
* Reviews
* Screenshots
* Videos
* Similar Games

---

### Reviews

* Review Creation
* Ratings
* Likes
* Comments
* Spoiler Toggle
* Editing

---

### Logging

* Playing
* Completed
* Dropped
* Backlog
* Wishlist
* Replay

---

### Social

* Follow
* Friends
* Comments
* Likes
* Bookmarks
* Mentions

---

### Discover

* Search
* Genres
* Developers
* Studios
* Trending
* Upcoming Releases

---

### Tier Lists

* Create
* Edit
* Share
* Export
* Comment

---

### Messaging

* One-to-One Chat
* Presence
* Typing Indicator
* Read Receipts

---

### Notifications

* Push Notifications
* In-App Notifications
* Activity Center

---

# Phase Two

After launch the platform expands with:

* Clubs
* Events
* Voice Rooms
* Gaming Calendar
* Steam Wrapped-style reports
* AI Review Assistant
* AI Game Discovery
* Community Challenges
* Live Activities
* Creator Monetization

---

# Phase Three

Enterprise scale expansion.

Includes:

* Public API
* Third-party integrations
* Plugin ecosystem
* Tournament support
* Guild System
* Marketplace integrations
* Localization platform
* Creator Studio
* Analytics Suite

---

# Explicitly Out of Scope

The following are intentionally excluded.

## Marketplace

No direct game purchasing.

---

## Game Launcher

No launcher functionality.

---

## DRM

No DRM management.

---

## Cloud Gaming

No streaming infrastructure.

---

## Voice Streaming

No Discord competitor.

---

## Video Streaming

No Twitch competitor.

---

## News Publishing

Gaming journalism is not a core objective.

---

## File Hosting

Media uploads only support content directly related to GMRLOG.

---

# Supported Platforms

Version One

* iOS
* Android
* Web

Future

* Windows
* macOS
* Steam Deck
* Linux

---

# Performance Targets

Application launch:

Less than 2 seconds.

Feed load:

Less than 800ms.

Profile load:

Less than 500ms.

Game page:

Less than 700ms.

Message delivery:

Under 200ms.

Notification delivery:

Under 2 seconds.

Search suggestions:

Under 150ms.

---

# Scalability Targets

Architecture should support:

* 10 million registered users
* 2 million monthly active users
* 500,000 daily active users
* 100 million game logs
* 1 billion feed events
* 500 million reviews
* 10 billion reactions

without requiring architectural redesign.

---

# Success Criteria

Version One is considered successful when users can:

* Build a complete gaming profile.
* Track every game they play.
* Discover new games.
* Review games.
* Connect with friends.
* Follow developers.
* Create tier lists.
* Participate in discussions.
* Receive meaningful recommendations.

---

# Constraints

The project must remain:

* Mobile-first
* API-first
* Documentation-first
* Accessibility-first
* Secure by default
* Modular
* Scalable
* Fully typed
* Fully testable

---

# Dependencies

This document depends on:

* README.md
* PROJECT_CHARTER.md

The following documents depend on this scope:

* PRODUCT_VISION.md
* INFORMATION_ARCHITECTURE.md
* FEATURE_MATRIX.md
* DATABASE_SPECIFICATION.md
* API_SPECIFICATION.md
* DESIGN_SYSTEM.md

---

# Acceptance Criteria

This document is complete when:

* Product boundaries are clearly defined.
* MVP scope is finalized.
* Future roadmap is documented.
* Out-of-scope items are explicitly listed.
* Every future engineering document can reference these boundaries without ambiguity.

---

# Revision History

| Version     | Date          | Status |
| ----------- | ------------- | ------ |
| 1.0.0 Alpha | Initial Draft | Active |
