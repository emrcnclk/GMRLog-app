# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/06_BACKEND/REALTIME_ARCHITECTURE.md`

**Status:** Approved

**Owner:** Backend Team

**Classification:** Internal Engineering Documentation

---

# Realtime Architecture

## Purpose

This document defines the realtime infrastructure used throughout GMRLOG.

Realtime communication is responsible for creating a responsive and engaging social platform where users immediately see updates without refreshing the application.

The architecture is designed to support millions of concurrent WebSocket connections while remaining horizontally scalable.

---

# Objectives

The realtime layer provides:

* Instant messaging
* Live notifications
* Friend presence
* Typing indicators
* Live feed updates
* Live reactions
* Live comments
* Live review interactions
* Developer announcements
* Studio broadcasts
* Future live events

---

# Technology Stack

## WebSocket Engine

Socket.IO

---

## Runtime

NestJS Gateway

---

## Adapter

Redis Adapter

---

## Queue

BullMQ

Redis

---

## Transport

WebSocket

HTTP Long Polling (Fallback)

---

# High-Level Architecture

```text
                  Mobile App
                       │
                  Web Client
                       │
               Load Balancer
                       │
          Socket.IO Gateway Cluster
         ┌──────────┴──────────┐
         │                     │
   Gateway Instance 1   Gateway Instance 2
         │                     │
         └──────────┬──────────┘
                    │
              Redis Pub/Sub
                    │
              Background Jobs
                    │
               PostgreSQL
```

---

# Connection Lifecycle

```text
Application Launch

↓

JWT Authentication

↓

Socket Connection

↓

User Presence Registered

↓

Room Subscription

↓

Realtime Events

↓

Heartbeat

↓

Disconnect

↓

Presence Cleanup
```

---

# Authentication

Every socket connection requires a valid JWT.

Unauthenticated users may only receive:

* Public announcements
* Public developer broadcasts
* Public trending updates

All private events require authentication.

---

# Namespaces

## Global

```text
/
```

General application events.

---

## Feed

```text
/feed
```

Feed updates.

---

## Messages

```text
/messages
```

Private conversations.

---

## Notifications

```text
/notifications
```

Realtime notifications.

---

## Developers

```text
/developers
```

Verified developer events.

---

## Admin

```text
/admin
```

Moderation dashboard.

---

# Rooms

Users automatically join:

```text
user:{id}
```

Friend rooms:

```text
friends:{id}
```

Conversation:

```text
conversation:{id}
```

Game:

```text
game:{id}
```

Developer:

```text
developer:{id}
```

Studio:

```text
studio:{id}
```

Tier List:

```text
tierlist:{id}
```

Collection:

```text
collection:{id}
```

---

# Presence System

Tracks:

Online

Offline

Last Seen

Active Device

Current Platform

Presence updates automatically propagate to friends.

---

# Typing Indicators

Supported in:

Private Messages

Group Chats (Future)

Indicators automatically expire after timeout.

---

# Notification Events

Realtime notifications include:

Friend Request

Friend Accepted

New Message

Review Like

Review Comment

Post Like

Post Comment

Collection Follow

Tier List Vote

Developer Announcement

Studio Update

System Notification

---

# Feed Events

Feed updates include:

New Post

Post Edited

Post Deleted

Review Published

Game Logged

Collection Created

Tier List Published

Developer Post

Studio News

---

# Messaging Events

Supported events:

Message Sent

Message Delivered

Message Read

Typing Started

Typing Stopped

Conversation Updated

Attachment Uploaded

Reaction Added

---

# Review Events

Realtime updates:

Review Created

Review Updated

Review Deleted

Review Liked

Review Commented

Spoiler Flag Updated

---

# Friend Events

Friend Request Sent

Friend Accepted

Friend Removed

Friend Blocked

Friend Online

Friend Offline

---

# WebSocket Event Naming

Use:

```text
domain:event
```

Examples

```text
message:new

message:read

message:typing

feed:update

notification:new

review:created

friend:online
```

---

# Payload Structure

Every event contains:

```json
{
  "event": "",
  "timestamp": "",
  "payload": {}
}
```

---

# Rate Limits

Connection attempts

20/minute

Messages

120/minute

Typing events

60/minute

Notifications

Unlimited (Server Only)

Presence

30/minute

---

# Heartbeat

Heartbeat interval

30 seconds

Timeout

90 seconds

Disconnected users are automatically cleaned up.

---

# Reconnection Strategy

Automatic exponential backoff

Retry intervals:

1 second

2 seconds

5 seconds

10 seconds

30 seconds

Maximum retries configurable.

---

# Scaling Strategy

Socket.IO instances remain stateless.

Redis Pub/Sub synchronizes:

Presence

Messages

Notifications

Feed Events

Typing

Friend Status

Allows unlimited horizontal scaling.

---

# Security

JWT Authentication

Room Authorization

Rate Limiting

Origin Validation

Event Validation

Input Sanitization

Payload Size Limits

Replay Protection

Connection Logging

---

# Monitoring

Metrics collected:

Concurrent Connections

Messages per Minute

Notification Throughput

Reconnect Rate

Disconnect Rate

Average Latency

Dropped Events

Queue Delay

Redis Latency

---

# Future Features

* Voice Channels
* Live Game Rooms
* Watch Parties
* Livestream Notifications
* Community Events
* Live Polls
* Collaborative Tier Lists
* Shared Collection Editing

---

# Acceptance Criteria

This document is complete when:

* Connection lifecycle is documented.
* Authentication strategy is defined.
* Event naming conventions are established.
* Presence system is specified.
* Scaling strategy is documented.
* Security requirements are defined.

---

# Dependencies

* BACKEND_ARCHITECTURE.md
* API_SPECIFICATION.md
* SECURITY.md

---

# Related Documents

* CACHE_STRATEGY.md
* STORAGE_ARCHITECTURE.md
* SYSTEM_ARCHITECTURE.md
* openapi/bundle.yaml

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
