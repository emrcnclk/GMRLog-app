# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/07_DATABASE/PRISMA_SCHEMA.md`

**Status:** Approved

**Owner:** Backend Team

**Classification:** Internal Engineering Documentation

---

# Prisma Schema Specification

## Purpose

> **D3.25 note:** the game catalog domain (`Game` metadata columns, `Tag`,
> `Company`, `GameSeries`, `GameRelatedGame`, `GameMetadataRun`, extended
> `GameMedia`) is documented in detail in
> `docs/18_CATALOG/GAME_METADATA_ARCHITECTURE.md` §3 rather than duplicated
> here — that document stays the single source of truth for the catalog
> schema as it evolves.

This document defines the Prisma architecture for GMRLOG.

It standardizes:

* Model organization
* Relationships
* Naming conventions
* Enums
* Indexes
* Cascading rules
* Prisma Client generation
* Migration strategy
* Performance optimizations

This document serves as the blueprint for the final `schema.prisma`.

---

# Technology

ORM

Prisma ORM

Database

PostgreSQL 17+

Language

TypeScript

---

# Folder Structure

```text
backend/

├── prisma/
│
├── schema.prisma
│
├── migrations/
│
├── seed/
│
├── generators/
│
└── partials/
```

Future schemas may be split into partials during development but merged into a single production schema.

---

# Prisma Generator

Requirements

Provider

```text
prisma-client-js
```

Output

Generated automatically

Preview Features

Only stable Prisma features are permitted in production.

---

# Datasource

Provider

PostgreSQL

Connection

Environment Variables

```text
DATABASE_URL

DIRECT_URL
```

Production credentials must never be committed.

---

# Naming Convention

Models

PascalCase

```text
User

Game

Review

Notification
```

---

Fields

camelCase

```text
createdAt

updatedAt

displayName

profileImage
```

---

Database Tables

Mapped using

```text
@@map()
```

Example

```text
User

↓

users
```

---

Columns

Mapped using

```text
@map()
```

Example

```text
createdAt

↓

created_at
```

---

# Base Model Convention

Every entity includes:

```text
id

createdAt

updatedAt

deletedAt (optional)
```

No duplicated timestamp definitions.

---

# User Model

Contains

Authentication

Profile

Privacy

Settings

Relationships

Gaming statistics

OAuth identities

Roles

Badges

Verification

---

Relationships

```text
User

↓

Profile

↓

Posts

↓

Reviews

↓

Logs

↓

Collections

↓

Tier Lists

↓

Notifications

↓

Messages
```

---

# Profile Model

Contains

Username

Display Name

Bio

Avatar

Banner

Country

Timezone

Pronouns

Website

Social Links

Favorite Games

Gaming Platforms

Genres

---

# Authentication Models

User

OAuthAccount

Session

RefreshToken

PasswordReset

VerificationToken

LoginHistory

DeviceSession

---

# Game Model

Contains

IGDB ID

Steam ID

RAWG ID

Slug

Title

Summary

Release Date

Genres

Platforms

Developers

Publishers

Studios

Screenshots

Videos

Cover

Banner

Rating

Popularity

---

Relationships

```text
Game

↓

Reviews

↓

Logs

↓

Collections

↓

Tier Lists

↓

Developers

↓

Studio
```

---

# Review Model

Contains

Rating

Title

Body

Spoiler

Helpful Count

Like Count

Comment Count

Visibility

Draft Status

Published At

---

# GameLog Model

Contains

Status

Platform

Started At

Finished At

Hours Played

Completion Percentage

Notes

Rating

---

# Post Model

Supports

Text

Image

GIF

Video

Poll

Game Reference

Developer Update

Studio Announcement

Tier List Share

Collection Share

Review Share

---

# Tier List Models

TierList

TierRow

TierItem

TierTemplate

TierVote

TierComment

---

# Collection Models

## Collection

| Field | Type | Notes |
|-------|------|--------|
| id | UUID | PK |
| userId | UUID | Owner |
| title | String | OpenAPI `name` |
| slug | String? | OpenAPI `slug`; **nullable unique** (Freeze v1.0.3 / rev 1.1.3) |
| description | String? | |
| coverUrl | String? | OpenAPI `coverImage` |
| visibility | Visibility | PUBLIC / FOLLOWERS / PRIVATE |
| isCollaborative | Boolean | OpenAPI `collaborative`; default false (Freeze v1.0.3) |
| gameCount / followerCount / likeCount | Int | Denormalized |
| createdAt / updatedAt / deletedAt | DateTime | Soft delete |

CollectionGame

CollectionFollower

CollectionComment

CollectionLike

---

# Messaging Models

Conversation

ConversationMember

Message

MessageRead

Attachment

TypingStatus

---

# Notification Models

Notification

PushToken

NotificationPreference

NotificationQueue

---

# Developer Models

Developer

DeveloperProfile

DeveloperPost

PatchNote

Roadmap

DeveloperFollower

Verification

---

# Studio Models

Studio

StudioProfile

StudioMember

StudioFollower

StudioAnnouncement

HiringPost

---

# Moderation Models

Report

ReportReason

ModerationAction

Appeal

AuditLog

ModeratorNote

---

# Analytics Models

Event

ScreenView

SearchEvent

RetentionMetric

GameMetric

ReviewMetric

FeedMetric

SessionMetric

CrashReport

---

# Enum Standards

All repeated values become enums.

Examples

```text
UserRole

NotificationType

Visibility

GameStatus

Platform

Theme

Language

ReportReason

ReactionType

FriendStatus

MessageType
```

Avoid string literals throughout the application.

---

# Relations

Explicit relations only.

Never rely on implicit many-to-many relationships.

Every join table becomes its own model.

Example

```text
User

↓

FavoriteGame

↓

Game
```

instead of an implicit relation.

---

# Index Strategy

Every model includes

Primary Key

Foreign Keys

CreatedAt

UpdatedAt

Additional indexes

Slug

Username

Email

Popularity

Search

Trending Score

Published Date

Notification Status

---

# Unique Constraints

Examples

Email

Username

OAuth Provider ID

Game Slug

Developer Slug

Studio Slug

Notification Token

---

# Composite Indexes

Examples

```text
userId + gameId

userId + friendId

collectionId + gameId

reviewId + userId

tierListId + gameId
```

---

# Cascade Rules

Delete User

↓

Soft Delete

Delete Game

↓

Restricted

Delete Review

↓

Cascade Likes

Cascade Comments

Delete Collection

↓

Cascade Collection Items

Delete Tier List

↓

Cascade Tier Items

---

# Soft Delete Strategy

Supported models

User

Post

Review

Collection

TierList

Message

Comment

DeveloperPost

StudioAnnouncement

Uses

```text
deletedAt
```

Queries exclude deleted records by default.

---

# Prisma Client Rules

Use

```text
select
```

instead of returning entire models.

Always paginate.

Never use

```text
findMany()
```

without

take

or

cursor.

---

# Pagination

Cursor Pagination

Preferred

Offset Pagination

Only for admin panels.

---

# Transactions

Use Prisma transactions for

Creating Reviews

Game Logging

Friend Requests

Purchases

Premium Features

Notification Creation

---

# Migration Strategy

Every schema change requires

Migration

Review

Testing

Rollback Plan

Production Validation

No manual database edits.

---

# Seed Strategy

Initial seed includes

Genres

Platforms

Studios

Developers

Admin User

System Roles

Badges

Achievement Types

Notification Types

---

# Performance Rules

Avoid N+1 queries.

Use relation loading wisely.

Prefer select over include.

Cache expensive queries.

Use Redis for feed generation.

Use materialized views for analytics.

---

# Future Models

Planned additions

Achievements

Guilds

Communities

Events

Marketplace

Streaming

Public API Keys

AI Recommendations

Console Synchronization

Mod Support

---

# Acceptance Criteria

This document is complete when:

* Every Prisma model is categorized.
* Naming conventions are standardized.
* Relations are explicitly defined.
* Enums replace repeated strings.
* Migration strategy is documented.
* Performance guidelines are established.

---

# Dependencies

* DATABASE_SPECIFICATION.md
* SYSTEM_ARCHITECTURE.md
* API_SPECIFICATION.md

---

# Related Documents

* SCHEMA.prisma
* MIGRATION_GUIDE.md
* BACKEND_ARCHITECTURE.md
* CODING_STANDARDS.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
| 1.0.3 / 1.1.3 | 2026-07-16 | Collections Freeze Patch — `collections.slug`, `collections.is_collaborative` |
