# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/06_BACKEND/CACHE_STRATEGY.md`

**Status:** Approved

**Owner:** Backend Team

**Classification:** Internal Engineering Documentation

---

# Cache Strategy

## Purpose

This document defines the caching architecture used throughout GMRLOG.

The objective is to reduce API latency, minimize database load, improve scalability, and provide a consistently fast user experience while maintaining data consistency.

The cache layer is considered a first-class component of the backend architecture.

---

# Goals

The caching system must provide:

* Ultra-fast response times
* Reduced PostgreSQL load
* Horizontal scalability
* High cache hit ratio
* Predictable invalidation
* Distributed synchronization
* Fault tolerance
* Cache observability

---

# Technology Stack

## Primary Cache

Redis 8

---

## ORM

Prisma

---

## Serialization

JSON

MessagePack (Future)

---

## Compression

Gzip

LZ4 (Future)

---

## Cache Pattern

Cache Aside

(Read Through)

---

# High-Level Architecture

```text
                Client
                   │
                   ▼
             API Gateway
                   │
                   ▼
              Service Layer
         ┌─────────┴─────────┐
         │                   │
    Cache Hit           Cache Miss
         │                   │
         ▼                   ▼
      Redis             PostgreSQL
         │                   │
         └─────────┬─────────┘
                   ▼
             Cache Update
                   │
                   ▼
                Response
```

---

# Cache Levels

## Level 1

Application Memory

Used only for:

* Configuration
* Feature Flags
* Static Metadata

Lifetime

Process Lifetime

---

## Level 2

Redis

Used for:

* API responses
* User sessions
* Feed
* Trending
* Search
* Notifications
* Presence
* Counters

---

## Level 3

CDN Cache

Cloudflare

Used for:

* Images
* Videos
* Static Assets
* Game Covers
* Avatars
* JavaScript Bundles
* CSS

---

# Cache Policy

Every cacheable resource must define:

* Cache Key
* TTL
* Invalidation Strategy
* Refresh Strategy
* Owner

---

# Cache Key Naming

Pattern

```text
domain:resource:id
```

Examples

```text
user:42

game:1742

review:992

collection:12

tierlist:8

feed:user:42

notification:user:42

profile:username:emircan

search:elden-ring

developer:supergiant-games

studio:cd-projekt-red
```

---

# Cache TTL

## Authentication

Access Token Validation

5 Minutes

Refresh Token

Database Only

---

## User Profile

TTL

10 Minutes

---

## Feed

TTL

60 Seconds

---

## Trending Feed

TTL

30 Seconds

---

## Game Details

TTL

24 Hours

---

## Game Metadata

TTL

7 Days

---

## Reviews

| Key | TTL | Invalidation | Owner |
|-----|-----|--------------|-------|
| `review:{reviewId}` | 3600s (`REVIEW_DETAIL_CACHE_TTL_SECONDS`) | create / update / delete / hide / restore / spoiler flag | `ReviewCacheService` |
| `gameReviews:{gameId}` | 600s (`REVIEW_LIST_CACHE_TTL_SECONDS`) | same + anonymous PUBLIC first page only | `ReviewCacheService` |
| `userReviews:{userId}` | 600s | same; anonymous PUBLIC first page only | `ReviewCacheService` |
| `review:engagement:{reviewId}` | 600s (`REVIEW_ENGAGEMENT_CACHE_TTL_SECONDS`) | like / reaction / comment count change | `ReviewEngagementCacheService` |
| `comments:review:{reviewId}` | 600s (`COMMENT_LIST_CACHE_TTL_SECONDS`) | comment create / update / delete | `CommentCacheService` |

**Notes**

* Detail cache stores **PUBLIC** reviews only (PRIVATE / FOLLOWERS never written).
* List caches are anonymous PUBLIC snapshots; authenticated viewers (FOLLOWERS graph) always hit Postgres.
* Env overrides allowed for all TTLs above.

---

## Game Logs

| Key | TTL | Invalidation | Owner |
|-----|-----|--------------|-------|
| `gamelog:{logId}` | 3600s (`GAME_LOG_DETAIL_CACHE_TTL_SECONDS`) | create / update / delete | `GameLogCacheService` |
| `userGameLogs:{userId}` | 600s (`GAME_LOG_LIST_CACHE_TTL_SECONDS`) | same; public first page only | `GameLogCacheService` |
| `gameLogs:{gameId}` | 600s | same; public first page only | `GameLogCacheService` |

**Notes**

* Detail cache stores **public** logs only (`isPrivate=false` / `isPublic=true`).
* Owner private lists always hit Postgres.

---

## Collections

TTL

10 Minutes

---

## Tier Lists

TTL

10 Minutes

---

## Notifications

TTL

30 Seconds

---

## Friends

TTL

5 Minutes

---

## Search Suggestions

TTL

1 Hour

---

## Search Results

TTL

10 Minutes

---

## Developer Profiles

TTL

30 Minutes

---

## Studio Profiles

TTL

30 Minutes

---

## Analytics

TTL

15 Minutes

---

# Cache Aside Flow

```text
Client

↓

API

↓

Redis Lookup

↓

Cache Hit?

↓

YES

↓

Return Cached Response

↓

NO

↓

Query PostgreSQL

↓

Serialize Response

↓

Store in Redis

↓

Return Response
```

---

# Cache Invalidation

Invalidate immediately after:

* User updates profile
* Review created
* Review edited
* Review deleted
* Game logged
* Collection updated
* Tier List updated
* Friend accepted
* Notification read
* Post published
* Developer announcement
* Studio update

---

# Cache Warming

Automatically warm:

Trending Games

Popular Reviews

Top Developers

Featured Studios

Landing Feed

Genre Lists

Platform Lists

Search Suggestions

Popular Collections

Featured Tier Lists

---

# Write Strategy

Database

↓

Successful Transaction

↓

Invalidate Cache

↓

Background Refresh

Never update cache before database commit.

---

# Distributed Cache

Redis Cluster

Supports:

Horizontal Scaling

Replication

Automatic Failover

Sharding

---

# Serialization Rules

Allowed

JSON

Future

MessagePack

Forbidden

Native Object Serialization

---

# Compression Policy

Compress payloads larger than:

64 KB

Never compress:

JWT

Small Responses

IDs

---

# Cache Monitoring

Metrics:

Cache Hit Ratio

Cache Miss Ratio

Average Lookup Time

Redis Memory Usage

Evictions

Expired Keys

Slow Queries

Serialization Time

Compression Ratio

---

# Performance Targets

Cache Lookup

<5 ms

Redis Response

<10 ms

Cache Hit Ratio

> 90%

Memory Usage

<80%

---

# Cache Tags

Supported Tags

```text
user

game

feed

review

collection

tierlist

developer

studio

search

notification
```

Allows bulk invalidation.

---

# Background Refresh

Frequently accessed resources refresh automatically before TTL expiration.

Supported:

Feed

Trending

Popular Games

Developer Pages

Studio Pages

Search Cache

---

# Failure Strategy

If Redis is unavailable:

* Continue using PostgreSQL
* Log cache failure
* Trigger monitoring alert
* Retry connection
* Do not interrupt user requests

The cache is an optimization layer, never a source of truth.

---

# Security

Never cache:

Passwords

JWT Secrets

OAuth Secrets

Payment Data

Private Messages (Future encrypted cache optional)

Sensitive Admin Data

Personal Access Tokens

---

# Future Improvements

Redis Streams

Edge Caching

Predictive Cache Warming

Geo-distributed Cache

AI Cache Prediction

Read Replica Cache

Multi-CDN Support

---

# Acceptance Criteria

This document is complete when:

* Cache hierarchy is defined.
* TTL policies are documented.
* Cache invalidation rules are established.
* Monitoring metrics are defined.
* Failure strategy is documented.
* Security rules are specified.

---

# Dependencies

* BACKEND_ARCHITECTURE.md
* DATABASE_SPECIFICATION.md
* SYSTEM_ARCHITECTURE.md

---

# Related Documents

* STORAGE_ARCHITECTURE.md
* REALTIME_ARCHITECTURE.md
* API_SPECIFICATION.md
* PERFORMANCE_GUIDE.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
