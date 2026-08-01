# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/00_PROJECT/VERSIONING.md`

**Status:** Approved

**Owner:** Architecture Team

**Classification:** Internal Engineering Documentation

---

# Versioning

## Purpose

This document defines versioning policies for GMRLOG: platform releases, REST API, database schema, domain events, and client compatibility.

Consistent versioning enables safe parallel development, predictable upgrades, and clear communication of breaking changes.

---

## Platform Version

The user-facing GMRLOG version follows SemVer:

```text
v{major}.{minor}.{patch}[-{prerelease}]
```

Managed in root `package.json` and mirrored in:

- Mobile app config (`apps/mobile/app.config.ts`)
- Web metadata
- `GET /health` response `version` field
- Sentry release tags

Platform version bumps follow [RELEASE_PROCESS.md](RELEASE_PROCESS.md).

---

## API Versioning

### URL versioning

All public REST endpoints are prefixed:

```text
https://api.gmrlog.com/api/v1/...
```

Defined in every OpenAPI `servers` block and `API_ARCHITECTURE.md`.

### Current version

**v1** — Freeze v1 per `API_ARCHITECTURE.md` and `API_SPECIFICATION.md`.

### Breaking change definition

A change is **breaking** if it:

- Removes an endpoint or HTTP method
- Removes a response field clients rely on
- Changes field type or enum values (narrowing)
- Changes authentication requirements
- Changes pagination contract (cursor → offset removal)
- Returns a different HTTP status for the same client request

### Non-breaking changes

- Adding optional request fields
- Adding response fields
- Adding new endpoints
- Adding new enum values (with client ignore-unknown policy)
- Deprecation headers without removal

### Deprecation policy

```http
Deprecation: true
Sunset: Sat, 01 Mar 2027 00:00:00 GMT
Link: </api/v2/resource>; rel="successor-version"
```

Minimum 90-day deprecation window before removal in a major version.

### v2 planning

v2 will introduce:

- GraphQL gateway (optional) per TECH_STACK_DECISIONS
- Consolidated error envelope (already `ProblemDetails` in v1)
- Webhook subscriptions

v1 maintained minimum 12 months after v2 GA.

---

## OpenAPI Document Version

Each module YAML carries:

```yaml
info:
  version: 1.0.0
```

| Bump | When |
|------|------|
| Patch | Documentation fixes, example updates |
| Minor | Additive endpoints and schemas |
| Major | Breaking contract within module |

`bundle.yaml` version tracks the highest module major. Run `bundle_openapi.py` on every API doc change.

---

## Database Schema Versioning

### Prisma migrations

```text
packages/database/prisma/migrations/
  20260710120000_add_review_version/
    migration.sql
```

| Rule | Detail |
|------|--------|
| Naming | Timestamp + descriptive slug |
| Expand-contract | Add → migrate data → remove old |
| Breaking | Requires ADR + release notes |
| Rollback | Forward-fix preferred; down migrations for dev only |

### Schema version metadata

```sql
-- schema_migrations table (Prisma _prisma_migrations + custom)
SELECT version FROM app_metadata WHERE key = 'schema_version';
```

Exposed internally for support diagnostics—not public API.

### Entity version field

Syncable entities include monotonic `version: number` for optimistic concurrency:

| Entity | Field | Increment on |
|--------|-------|--------------|
| Review | `version` | Content edit, publish |
| Collection | `version` | Metadata or membership change |
| TierList | `version` | Structure change |
| User profile | `version` | Profile field update |

Clients send `If-Match: {version}` per [SYNC_STRATEGY.md](../05_FRONTEND/SYNC_STRATEGY.md).

---

## Domain Event Versioning

Events follow naming from [EVENT_ARCHITECTURE.md](../06_BACKEND/EVENT_ARCHITECTURE.md):

```text
{context}.{aggregate}.{action}.v{major}
```

Examples:

- `review.review.created.v1`
- `social.follow.created.v1`

### Version rules

| Change | Action |
|--------|--------|
| Add optional payload field | Same version |
| Remove payload field | New major `v2` |
| Change field semantics | New major |
| Rename event | New major; dual-publish during migration |

### Payload schema version

```typescript
interface DomainEvent<T> {
  schemaVersion: 1;  // increments on breaking payload change
  type: string;      // includes .v{major} suffix
  payload: T;
}
```

Consumers must ignore unknown payload fields.

### Dual consumption period

When introducing `v2`:

1. Publish both `v1` and `v2` for 30 days
2. Migrate consumers
3. Stop `v1` emission with feature flag
4. Archive `v1` handlers after 7 days

---

## Client Compatibility Matrix

### Mobile (Expo)

| Concept | Versioning |
|---------|------------|
| OTA bundle | Tied to platform `runtimeVersion` |
| Minimum API | App sends `X-Client-Version` header |
| Forced update | When API returns `426 Upgrade Required` |

```http
X-Client-Version: 1.2.0
X-Client-Platform: ios
X-Runtime-Version: 1.2.0
```

Backend maintains compatibility back **2 minor versions** for mobile.

### Web (Next.js)

Deployed with backend; no version header required. Breaking API changes deploy same release window.

### Generated API client (`@gmrlog/api`)

Regenerated on OpenAPI change. Package version:

- Patch: regen only
- Minor: new endpoints
- Major: breaking type changes

---

## Error Code Versioning

Error codes in [ERROR_CODES.md](../08_API/ERROR_CODES.md) are stable identifiers:

```json
{
  "type": "https://api.gmrlog.com/problems/validation-error",
  "code": "VALIDATION_ERROR",
  "status": 400
}
```

Codes are never reused with different semantics. New codes are additive.

---

## Feature Flag Versioning

```typescript
interface FeatureFlag {
  key: string;
  introducedIn: string;   // platform version
  defaultEnabled: boolean;
  minClientVersion?: string;
}
```

Flags removed only after 2 releases with default-on.

---

## AI and Search Versioning

| Asset | Version tag |
|-------|-------------|
| Embedding model | `embed-v1`, `embed-v2` |
| Prompt templates | Semver per template id |
| Moderation thresholds | Config version in audit log |

See [VECTOR_SEARCH.md](../09_AI/VECTOR_SEARCH.md) and [PROMPT_LIBRARY.md](../09_AI/PROMPT_LIBRARY.md).

---

## Documentation Versioning

Each doc header includes:

```markdown
**Version:** 1.0.0 Alpha
**Status:** Approved | Draft | Deprecated
```

Documentation freeze tags (e.g. `Documentation Freeze v1`) align with API freeze milestones in `DOCS_INDEX.md`.

---

## Compatibility Testing

Before major bumps:

| Test | Requirement |
|------|-------------|
| Contract tests | OpenAPI diff review |
| Mobile N-2 | Smoke suite against staging |
| Migration | Staging clone dry-run |
| Event consumers | Replay sample v1/v2 payloads |

---

## Version Communication

| Change | Notify |
|--------|--------|
| API deprecation | Changelog + `Deprecation` header |
| Breaking migration | Release notes + in-app banner |
| Event v2 | `#backend` + consumer team tickets |
| Forced mobile update | Store + OTA block |

---

## Acceptance Criteria

- All public endpoints live under `/api/v1` until v2 launch.
- Breaking changes never ship without major version bump and migration plan.
- Events carry explicit major version in `type` suffix.
- Database migrations follow expand-contract on production path.

---

## Related Documents

- [RELEASE_PROCESS.md](RELEASE_PROCESS.md)
- [API_ARCHITECTURE.md](../08_API/API_ARCHITECTURE.md)
- [EVENT_ARCHITECTURE.md](../06_BACKEND/EVENT_ARCHITECTURE.md)
- [PRISMA_SCHEMA.md](../07_DATABASE/PRISMA_SCHEMA.md)
- [SYNC_STRATEGY.md](../05_FRONTEND/SYNC_STRATEGY.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
