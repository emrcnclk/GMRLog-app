# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/08_API/API_SPECIFICATION.md`

**Status:** Approved

**Owner:** Backend Team

**Classification:** Internal Engineering Documentation

---

# API Specification

## Purpose

This document defines the REST API architecture for GMRLOG.

It standardizes:

* Endpoint naming
* Authentication
* Request/Response formats
* Error handling
* Pagination
* Filtering
* Sorting
* Rate limiting
* Versioning
* WebSocket events

Every endpoint implemented in production must conform to this specification.

---

# API Style

Architecture

REST API

Realtime

WebSocket

Future

GraphQL Gateway

Public API

Read-only

Internal APIs

REST

---

# Base URL

Production

```text
https://api.gmrlog.com/v1
```

Development

```text
http://localhost:4000/api/v1
```

---

# Versioning

```text
/v1
/v2
```

Breaking changes require a new API version.

---

# Authentication

Supported methods

* JWT Access Token
* Refresh Token
* OAuth 2.0
* Google
* Steam
* Discord
* Apple

Authorization Header

```text
Authorization: Bearer <access_token>
```

---

# Standard Response

Success

```json
{
  "success": true,
  "data": {},
  "meta": {},
  "pagination": {}
}
```

Error

```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User could not be found."
  }
}
```

---

# Pagination

Cursor Pagination

Default

```text
?cursor=
&limit=20
```

Maximum

100

---

# Sorting

```text
sort=createdAt

sort=rating

sort=popularity

sort=followers

sort=releaseDate
```

---

# Filtering

Examples

```text
genre=

platform=

developer=

studio=

year=

rating=

status=

language=
```

---

# AUTH ENDPOINTS

POST

```text
/auth/register
```

POST

```text
/auth/login
```

POST

```text
/auth/logout
```

POST

```text
/auth/refresh
```

POST

```text
/auth/google
```

POST

```text
/auth/steam
```

POST

```text
/auth/discord
```

POST

```text
/auth/apple
```

POST

```text
/auth/forgot-password
```

POST

```text
/auth/reset-password
```

GET

```text
/auth/me
```

PATCH

```text
/auth/change-password
```

DELETE

```text
/auth/sessions
```

---

# USER ENDPOINTS

GET

```text
/users/me
```

PATCH

```text
/users/me
```

GET

```text
/users/{username}
```

GET

```text
/users/{id}/activity
```

GET

```text
/users/{id}/followers
```

GET

```text
/users/{id}/following
```

GET

```text
/users/{id}/friends
```

POST

```text
/users/{id}/follow
```

DELETE

```text
/users/{id}/follow
```

POST

```text
/users/{id}/friend-request
```

POST

```text
/users/{id}/block
```

POST

```text
/users/{id}/mute
```

GET

```text
/users/search
```

---

# GAME ENDPOINTS

GET

```text
/games
```

GET

```text
/games/{id}
```

GET

```text
/games/search
```

GET

```text
/games/trending
```

GET

```text
/games/upcoming
```

GET

```text
/games/popular
```

GET

```text
/games/{id}/reviews
```

GET

```text
/games/{id}/logs
```

GET

```text
/games/{id}/screenshots
```

GET

```text
/games/{id}/videos
```

GET

```text
/games/{id}/similar
```

GET

```text
/games/{id}/developers
```

GET

```text
/games/{id}/studio
```

---

# REVIEW ENDPOINTS

POST

```text
/reviews
```

GET

```text
/reviews/{id}
```

PATCH

```text
/reviews/{id}
```

DELETE

```text
/reviews/{id}
```

POST

```text
/reviews/{id}/like
```

POST

```text
/reviews/{id}/bookmark
```

POST

```text
/reviews/{id}/report
```

GET

```text
/reviews/user/{id}
```

---

# GAME LOGS

POST

```text
/logs
```

PATCH

```text
/logs/{id}
```

DELETE

```text
/logs/{id}
```

GET

```text
/logs/game/{id}
```

GET

```text
/logs/user/{id}
```

---

# POSTS

GET

```text
/feed
```

POST

```text
/posts
```

PATCH

```text
/posts/{id}
```

DELETE

```text
/posts/{id}
```

POST

```text
/posts/{id}/like
```

POST

```text
/posts/{id}/bookmark
```

POST

```text
/posts/{id}/repost
```

POST

```text
/posts/{id}/quote
```

POST

```text
/posts/{id}/comment
```

GET

```text
/posts/{id}
```

---

# COMMENTS

POST

```text
/comments
```

PATCH

```text
/comments/{id}
```

DELETE

```text
/comments/{id}
```

POST

```text
/comments/{id}/like
```

POST

```text
/comments/{id}/reply
```

---

# COLLECTIONS

GET

```text
/collections
```

POST

```text
/collections
```

PATCH

```text
/collections/{id}
```

DELETE

```text
/collections/{id}
```

POST

```text
/collections/{id}/games
```

DELETE

```text
/collections/{id}/games/{gameId}
```

POST

```text
/collections/{id}/follow
```

---

# TIER LISTS

GET

```text
/tierlists
```

POST

```text
/tierlists
```

PATCH

```text
/tierlists/{id}
```

DELETE

```text
/tierlists/{id}
```

POST

```text
/tierlists/{id}/vote
```

POST

```text
/tierlists/{id}/comment
```

GET

```text
/tierlists/templates
```

---

# DEVELOPER

GET

```text
/developers
```

GET

```text
/developers/{id}
```

GET

```text
/developers/{id}/games
```

GET

```text
/developers/{id}/posts
```

POST

```text
/developers/{id}/follow
```

---

# STUDIOS

GET

```text
/studios
```

GET

```text
/studios/{id}
```

GET

```text
/studios/{id}/games
```

GET

```text
/studios/{id}/posts
```

POST

```text
/studios/{id}/follow
```

---

# MESSAGING

GET

```text
/messages
```

POST

```text
/messages
```

GET

```text
/messages/{conversationId}
```

DELETE

```text
/messages/{id}
```

POST

```text
/messages/read
```

POST

```text
/messages/upload
```

---

# NOTIFICATIONS

GET

```text
/notifications
```

PATCH

```text
/notifications/read
```

DELETE

```text
/notifications/{id}
```

PATCH

```text
/notifications/preferences
```

---

# SEARCH

GET

```text
/search
```

Supports:

Games

Users

Posts

Reviews

Collections

Tier Lists

Developers

Studios

Tags

---

# ADMIN

GET

```text
/admin/users
```

GET

```text
/admin/reports
```

PATCH

```text
/admin/reports/{id}
```

DELETE

```text
/admin/posts/{id}
```

PATCH

```text
/admin/users/{id}
```

---

# WebSocket Events

Client → Server

```text
message:send

typing:start

typing:stop

notification:read

presence:update
```

Server → Client

```text
message:new

notification:new

friend:accepted

post:liked

review:liked

feed:update

user:online

user:offline
```

---

# Rate Limits

| Endpoint |   Limit |
| -------- | ------: |
| Login    |  10/min |
| Register |  5/hour |
| Search   | 120/min |
| Feed     | 300/min |
| Reviews  |  60/min |
| Messages | 120/min |
| Uploads  |  30/min |

---

# HTTP Status Codes

200 OK

201 Created

204 No Content

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

422 Validation Error

429 Too Many Requests

500 Internal Server Error

503 Service Unavailable

---

# Error Codes

AUTH_INVALID_TOKEN

AUTH_EXPIRED

USER_NOT_FOUND

GAME_NOT_FOUND

POST_NOT_FOUND

REVIEW_NOT_FOUND

MESSAGE_NOT_FOUND

COLLECTION_NOT_FOUND

TIERLIST_NOT_FOUND

RATE_LIMIT_EXCEEDED

VALIDATION_FAILED

UNKNOWN_ERROR

---

# API Security

* HTTPS Only
* JWT Authentication
* Refresh Token Rotation
* OAuth PKCE
* CSRF Protection (Web)
* Input Validation
* Output Sanitization
* File Scanning
* Rate Limiting
* IP Reputation
* Audit Logging

---

# Future APIs

* Public Read API
* GraphQL Gateway
* AI Recommendation API
* Steam Sync API
* PlayStation Sync API
* Xbox Sync API
* Nintendo Sync API
* Public SDK
* Webhooks

---

# Acceptance Criteria

This document is complete when:

* Every API domain is documented.
* Naming conventions are standardized.
* Authentication is defined.
* Error handling is specified.
* WebSocket events are documented.
* Rate limits and security rules are established.

---

# Dependencies

* DATABASE_SPECIFICATION.md
* PRISMA_SCHEMA.md
* BACKEND_ARCHITECTURE.md

---

# Related Documents

* openapi/bundle.yaml (run `python docs/08_API/bundle_openapi.py`)
* AUTHENTICATION.md
* SYSTEM_ARCHITECTURE.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
