# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/07_DATABASE/DATABASE_SPECIFICATION.md`

**Status:** Approved

**Owner:** Backend Team

**Classification:** Internal Engineering Documentation

---

# Database Specification

## Purpose

This document defines the complete database architecture for GMRLOG.

The platform uses **PostgreSQL** as the primary relational database and **Prisma ORM** as the data access layer.

The schema is designed to support millions of users, billions of game logs, and real-time social interactions while remaining highly maintainable.

---

# Technology Stack

## Database

* PostgreSQL 17+
* UTF-8
* UUID Primary Keys
* JSONB Support
* Full Text Search
* Trigram Search
* Row Level Security Ready

---

## ORM

Prisma ORM

Migration Driven Development

Strict Type Safety

Automatic Type Generation

---

## Database Principles

The schema follows these principles:

* Normalize by default
* Denormalize only for performance
* UUID everywhere
* Soft delete whenever possible
* Audit important changes
* Never duplicate relationships
* Every foreign key indexed
* Every table timestamps

---

# Naming Convention

Tables

snake_case

Examples

```text
users

games

reviews

game_logs

notifications
```

Columns

snake_case

Examples

```text
created_at

updated_at

display_name

is_verified
```

Prisma Models

PascalCase

```text
User

Game

Review

Notification
```

---

# ID Strategy

Every table uses UUID.

Example

```sql
id UUID PRIMARY KEY
```

Reasons

Globally unique

Merge friendly

Secure

Supports distributed systems

---

# Timestamp Convention

Every table includes

```text
created_at

updated_at
```

Optional

```text
deleted_at
```

Soft delete preferred.

---

# Core Database Domains

The platform consists of the following domains.

Authentication

Users

Social

Games

Reviews

Logs

Collections

Tier Lists

Messaging

Notifications

Developers

Studios

Analytics

Moderation

Administration

---

# Authentication Domain

Tables

users

accounts

sessions

refresh_tokens

oauth_accounts

verification_tokens

password_resets

login_history

device_sessions

---

# Users Domain

Tables

profiles

user_settings

privacy_settings

blocked_users

muted_users

friend_requests

friends

followers

user_badges

user_roles

user_preferences

favorite_games

favorite_genres

favorite_platforms

---

# Games Domain

Tables

games

game_images

game_videos

game_platforms

game_genres

game_tags

game_developers

game_publishers

game_studios

game_franchises

game_dlc

game_news

game_statistics

---

# Social Domain

Tables

posts

post_media

comments

comment_replies

likes

bookmarks

hashtags

mentions

follows

activity_feed

---

# Reviews Domain

Tables

reviews

review_votes

review_media

review_reports

review_reactions

review_drafts

---

# Game Logs

Tables

game_logs

play_sessions

completion_status

log_notes

game_progress

---

# Collections

Tables

collections

collection_games

collection_followers

collection_likes

collection_comments

---

# Tier Lists

Tables

tier_lists

tier_rows

tier_items

tier_templates

tier_votes

tier_comments

---

# Messaging

Tables

conversations

conversation_members

messages

message_reads

message_attachments

typing_status

---

# Notifications

Tables

notifications

notification_preferences

push_tokens

notification_queue

---

# Developers

Tables

developers

developer_profiles

developer_posts

patch_notes

roadmaps

developer_followers

---

# Studios

Tables

studios

studio_profiles

studio_members

studio_posts

studio_followers

---

# Moderation

Tables

reports

report_reasons

moderation_actions

audit_logs

appeals

---

# Analytics

Tables

events

screen_views

search_events

game_views

review_views

daily_metrics

retention_metrics

---

# Relationships

```text
User
 │
 ├── Reviews
 ├── Game Logs
 ├── Posts
 ├── Collections
 ├── Tier Lists
 ├── Messages
 ├── Notifications
 └── Friends
```

---

```text
Game
 │
 ├── Reviews
 ├── Logs
 ├── Developers
 ├── Studio
 ├── Genres
 ├── Platforms
 ├── Collections
 └── Tier Lists
```

---

# Index Strategy

Every table includes:

Primary Key Index

Foreign Key Index

Created Date Index

Updated Date Index

---

Additional indexes

User Search

Username

Email

Game Slug

Developer Slug

Studio Slug

Review Popularity

Trending Feed

Notification Queue

---

# Full Text Search

Enabled for

Games

Reviews

Posts

Collections

Tier Lists

Developers

Studios

Uses PostgreSQL

TSVector

GIN Index

Trigram

---

# Soft Delete Policy

Supported on

Users

Reviews

Collections

Posts

Messages

Tier Lists

Comments

Soft deleted data remains recoverable.

---

# Cascade Rules

Delete User

↓

Anonymize Content

Delete Game

↓

Restricted

Delete Review

↓

Delete Votes

Delete Messages

↓

Soft Delete

Delete Studio

↓

Restricted

---

# Database Constraints

Every table should include

NOT NULL

Foreign Keys

Unique Constraints

Check Constraints

Default Values

---

# Performance Targets

Read Queries

<50ms

Write Queries

<100ms

Feed Queries

<150ms

Search

<200ms

Notifications

<50ms

---

# Partitioning Strategy

Future partitioning

Events

Notifications

Messages

Game Logs

Analytics

Partition by month.

---

# Backup Strategy

Daily Full Backup

Hourly Incremental Backup

Point-in-Time Recovery

Geo-redundant Storage

Retention

90 Days

---

# Security

Encryption At Rest

TLS In Transit

Hashed Passwords

Secrets Manager

Least Privilege

Audit Logging

---

# Prisma Standards

One model per table.

Explicit relations.

No implicit many-to-many.

Enum types for statuses.

Use Decimal for ratings.

Avoid JSON unless necessary.

---

# Future Expansion

Planned database additions

Achievements

Guilds

Communities

Events

Marketplace

Mods

Streaming

Public API

AI Recommendations

Console Sync

---

# Acceptance Criteria

This document is complete when:

* Every domain is identified.
* Table naming conventions are standardized.
* Relationships are documented.
* Indexing strategy is defined.
* Security and backup policies are established.
* Prisma architecture is aligned with PostgreSQL.

---

# Dependencies

* SYSTEM_ARCHITECTURE.md
* API_SPECIFICATION.md
* INFORMATION_ARCHITECTURE.md

---

# Related Documents

* PRISMA_SCHEMA.md
* DATABASE_MIGRATIONS.md
* BACKEND_ARCHITECTURE.md
* API_SPECIFICATION.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
