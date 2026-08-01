# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/08_API/ERROR_CODES.md`

**Status:** Approved

**Owner:** Backend Team

**Classification:** Internal Engineering Documentation

---

# Error Codes Specification

## Purpose

This document defines the standardized error handling strategy for every API endpoint in GMRLOG.

Every backend service, mobile application, web application, and admin panel must interpret errors according to this specification.

The goals are:

* Consistency
* Predictability
* Localization
* Developer Experience
* Client-side automation

---

# Error Philosophy

Errors should be:

* Predictable
* Actionable
* Machine-readable
* Human-readable
* Localizable

An error must never expose internal implementation details.

---

# Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_TOKEN",
    "message": "The provided access token is invalid.",
    "status": 401,
    "requestId": "req_abc123",
    "timestamp": "2026-07-06T12:30:00Z"
  }
}
```

---

# Error Structure

Every error contains:

```text
success

error.code

error.message

error.status

requestId

timestamp
```

Optional

```text
details

fieldErrors

retryAfter

documentation
```

---

# HTTP Status Mapping

| Status | Meaning                |
| ------ | ---------------------- |
| 200    | Success                |
| 201    | Created                |
| 204    | No Content             |
| 400    | Bad Request            |
| 401    | Unauthorized           |
| 403    | Forbidden              |
| 404    | Not Found              |
| 409    | Conflict               |
| 410    | Gone                   |
| 413    | Payload Too Large      |
| 415    | Unsupported Media Type |
| 422    | Validation Failed      |
| 429    | Too Many Requests      |
| 500    | Internal Server Error  |
| 503    | Service Unavailable    |

---

# Authentication Errors

```text
AUTH_INVALID_TOKEN

AUTH_EXPIRED_TOKEN

AUTH_REFRESH_EXPIRED

AUTH_UNAUTHORIZED

AUTH_INVALID_CREDENTIALS

AUTH_ACCOUNT_DISABLED

AUTH_ACCOUNT_LOCKED

AUTH_EMAIL_NOT_VERIFIED

AUTH_ALREADY_VERIFIED

AUTH_OAUTH_FAILED

AUTH_PROVIDER_NOT_SUPPORTED

AUTH_SESSION_EXPIRED

AUTH_TOO_MANY_ATTEMPTS
```

---

# User Errors

```text
USER_NOT_FOUND

USER_ALREADY_EXISTS

USERNAME_TAKEN

EMAIL_ALREADY_EXISTS

PROFILE_PRIVATE

USER_BLOCKED

USER_MUTED

USER_BANNED

USER_SUSPENDED

INVALID_USERNAME
```

---

# Friend Errors

```text
FRIEND_REQUEST_EXISTS

FRIEND_REQUEST_NOT_FOUND

ALREADY_FRIENDS

CANNOT_ADD_SELF

USER_BLOCKED_REQUEST

FRIEND_LIMIT_REACHED
```

---

# Game Errors

```text
GAME_NOT_FOUND

GAME_ALREADY_EXISTS

GAME_ARCHIVED

INVALID_GAME_PLATFORM

INVALID_RELEASE_DATE

UNSUPPORTED_GAME
```

---

# Review Errors

```text
REVIEW_NOT_FOUND

REVIEW_ALREADY_EXISTS

REVIEW_LOCKED

REVIEW_DELETED

REVIEW_TOO_LONG

INVALID_RATING

SPOILER_REQUIRED
```

---

# Game Log Errors

```text
LOG_NOT_FOUND

LOG_ALREADY_EXISTS

INVALID_PLAYTIME

INVALID_STATUS

INVALID_COMPLETION
```

---

# Collection Errors

```text
COLLECTION_NOT_FOUND

COLLECTION_PRIVATE

COLLECTION_LIMIT_REACHED

GAME_ALREADY_IN_COLLECTION

COLLECTION_LOCKED
```

---

# Tier List Errors

```text
TIERLIST_NOT_FOUND

INVALID_TIER

INVALID_TEMPLATE

DUPLICATE_GAME

TIER_LIMIT_REACHED
```

---

# Messaging Errors

```text
MESSAGE_NOT_FOUND

CONVERSATION_NOT_FOUND

MESSAGE_TOO_LONG

ATTACHMENT_TOO_LARGE

UNSUPPORTED_ATTACHMENT

USER_OFFLINE
```

---

# Notification Errors

```text
NOTIFICATION_NOT_FOUND

NOTIFICATION_ALREADY_READ

INVALID_PUSH_TOKEN
```

---

# File Upload Errors

```text
FILE_TOO_LARGE

FILE_CORRUPTED

INVALID_FILE_TYPE

UPLOAD_FAILED

IMAGE_PROCESSING_FAILED

VIRUS_DETECTED
```

---

# Search Errors

```text
SEARCH_QUERY_EMPTY

SEARCH_LIMIT_EXCEEDED

INVALID_FILTER

INVALID_SORT
```

---

# Validation Errors

Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Validation failed."
  },
  "fieldErrors": [
    {
      "field": "email",
      "message": "Invalid email address."
    },
    {
      "field": "password",
      "message": "Password must contain at least 12 characters."
    }
  ]
}
```

---

# Permission Errors

```text
FORBIDDEN

INSUFFICIENT_PERMISSIONS

ADMIN_ONLY

DEVELOPER_ONLY

STUDIO_ONLY

PREMIUM_REQUIRED
```

---

# Rate Limit Errors

```text
RATE_LIMIT_EXCEEDED

TOO_MANY_REQUESTS

UPLOAD_LIMIT_REACHED
```

Response may include

```text
Retry-After
```

header.

---

# Server Errors

```text
INTERNAL_SERVER_ERROR

DATABASE_ERROR

CACHE_ERROR

QUEUE_ERROR

SERVICE_UNAVAILABLE

DEPENDENCY_TIMEOUT

UNKNOWN_ERROR
```

These must never expose implementation details.

---

# Localization

The backend returns stable error codes.

Clients are responsible for translating messages based on locale.

Example

```text
AUTH_INVALID_TOKEN
```

↓

English

"Your session has expired."

↓

Turkish

"Oturumunuzun süresi doldu."

↓

German

"Ihre Sitzung ist abgelaufen."

---

# Client Handling Rules

Clients should:

401

Redirect to Login

403

Show Permission Screen

404

Show Not Found Screen

409

Offer Resolution

422

Highlight Invalid Fields

429

Show Retry Timer

500

Display Generic Error Screen

503

Offer Retry

---

# Logging

Every error log must include:

Request ID

User ID (if available)

Endpoint

HTTP Method

Status Code

Error Code

Timestamp

Latency

---

# Monitoring

Critical errors trigger alerts:

AUTH failures

DATABASE errors

QUEUE failures

SERVICE_UNAVAILABLE

Repeated 500 responses

Crash loops

---

# Future Error Categories

* AI Errors
* Recommendation Errors
* Marketplace Errors
* Achievement Errors
* Guild Errors
* Live Event Errors
* Streaming Errors
* Public API Errors

---

# Acceptance Criteria

This document is complete when:

* Every API domain has standardized error codes.
* HTTP status mappings are documented.
* Validation response format is defined.
* Localization strategy is established.
* Client behavior is standardized.
* Monitoring requirements are specified.

---

# Dependencies

* API_SPECIFICATION.md
* SECURITY.md
* BACKEND_ARCHITECTURE.md

---

# Related Documents

* openapi/bundle.yaml
* AUTHENTICATION.md
* CODING_STANDARDS.md
* SYSTEM_ARCHITECTURE.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
