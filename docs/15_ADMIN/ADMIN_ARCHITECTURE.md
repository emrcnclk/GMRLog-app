# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/15_ADMIN/ADMIN_ARCHITECTURE.md`

**Status:** Approved

**Owner:** Platform Team

**Classification:** Internal Engineering Documentation

---

# Admin Architecture

## Purpose

This document defines the GMRLOG admin application (`apps/admin`): moderation dashboard, content management system (CMS), operational tooling, audit logging, and integration boundaries.

Admin is an internal-facing surface for Moderator and Admin roles—not a player product.

API contract: [`ADMIN_API.yaml`](../08_API/ADMIN_API.yaml) — validated in the unified OpenAPI bundle.

---

## High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    apps/admin (Next.js)                      │
│  Moderation │ CMS │ Users │ Jobs │ Analytics │ Feature Flags │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS + Bearer JWT (Admin/Moderator)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│              API Gateway /api/v1/admin/*                     │
│              (ADMIN_API.yaml)                              │
└────────────────────────────┬────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                    ▼
  ModerationService    CmsService          AuditService
        │                    │                    │
        ▼                    ▼                    ▼
  PostgreSQL           PostgreSQL + R2      audit_log table
  Redis (queue)        BullMQ               (append-only)
```

---

## Application Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) |
| Auth | Same JWT as platform; role gate `Moderator` \| `Admin` |
| UI | shadcn/ui + Tailwind |
| Data | TanStack Query + `@gmrlog/api` (admin client gen) |
| Deploy | Internal network / VPN; separate subdomain `admin.gmrlog.com` |

---

## Role Access Matrix

From [SECURITY.md](../11_SECURITY/SECURITY.md):

| Capability | Moderator | Admin |
|------------|-----------|-------|
| Moderation queue | Read, act | Full |
| User warn / suspend | Yes | Yes |
| User ban | No | Yes |
| CMS content edit | No | Yes |
| Feature flags | No | Yes |
| Job replay / cancel | No | Yes |
| Audit log export | Own actions | Full |
| Analytics dashboards | Moderation metrics | All |
| System config | No | Yes |

---

## Module 1 — Moderation Dashboard

Implements workflows from [AI_MODERATION.md](../09_AI/AI_MODERATION.md).

### Views

| View | Description |
|------|-------------|
| Queue | Filterable list by priority, SLA, entity type |
| Item detail | Content snapshot, AI scores, reporter history, author profile |
| Author history | Prior strikes, appeals, account age |
| Bulk actions | Selected approve/reject (Admin only > 50 items) |

### Endpoints (ADMIN_API.yaml)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/admin/moderation/queue` | Paginated queue items |
| `GET` | `/admin/moderation/queue/{id}` | Item detail |
| `POST` | `/admin/moderation/queue/{id}/resolve` | Approve, reject, edit, warn |
| `GET` | `/admin/moderation/stats` | SLA, volume, category breakdown |
| `POST` | `/admin/moderation/batch-scan` | Trigger AI backfill job |

### Resolve action payload

```typescript
interface ModerationResolveRequest {
  action: 'APPROVE' | 'REJECT' | 'EDIT_APPROVE' | 'WARN' | 'SUSPEND' | 'BAN';
  reasonCode: string;
  internalNote?: string;
  editedContent?: string;       // EDIT_APPROVE only
  suspensionDays?: number;      // SUSPEND only
}
```

Every resolve writes to `audit_log` and emits `moderation.resolved.v1` domain event.

---

## Module 2 — CMS

Manages platform-curated content—not user UGC.

### Content types

| Type | Examples |
|------|----------|
| Announcements | Maintenance, feature launches |
| Editorial collections | "Best of 2026" featured rows |
| Discover config | Homepage hero, themed rails |
| Legal pages | Terms, privacy (linked from apps) |
| Help articles | Support center content |

### Workflow

```text
Draft → Review (second Admin) → Scheduled → Published → Archived
```

### Endpoints (ADMIN_API.yaml)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/admin/cms/{type}` | List content by type |
| `POST` | `/admin/cms/{type}` | Create draft |
| `PATCH` | `/admin/cms/{type}/{id}` | Update |
| `POST` | `/admin/cms/{type}/{id}/publish` | Publish or schedule |
| `DELETE` | `/admin/cms/{type}/{id}` | Archive |

CMS media uploads use same R2 pipeline as user uploads with `cms/` prefix per [STORAGE_ARCHITECTURE.md](../06_BACKEND/STORAGE_ARCHITECTURE.md).

---

## Module 3 — User Administration

| Action | Moderator | Admin |
|--------|-----------|-------|
| Search users | Yes | Yes |
| View profile (including private) | Yes | Yes |
| Assign/remove roles | No | Yes |
| Force password reset | No | Yes |
| Revoke all sessions | No | Yes |
| Grant Premium (manual) | No | Yes |
| GDPR export trigger | No | Yes |

Target: `GET /admin/users`, `PATCH /admin/users/{id}/roles`, `POST /admin/users/{id}/sessions/revoke` — see `ADMIN_API.yaml`.

---

## Module 4 — Background Jobs

Operational visibility into BullMQ queues per [EVENT_ARCHITECTURE.md](../06_BACKEND/EVENT_ARCHITECTURE.md).

| View | Data |
|------|------|
| Queue health | Depth, processing rate, failed count |
| Failed jobs | Payload summary (PII redacted), stack trace |
| Actions | Retry, discard (Admin), pause queue (Admin) |

Queues: `notifications`, `search`, `ai`, `moderation`, `email`, `analytics`.

Target: `GET /admin/jobs/queues`, `POST /admin/jobs/{queue}/{jobId}/retry`.

---

## Module 5 — Analytics (Internal)

Moderation and platform health dashboards—distinct from player-facing analytics.

| Dashboard | Metrics |
|-----------|---------|
| Moderation | Queue depth, SLA compliance, appeal rate |
| Platform | DAU, signups, error rate, API latency |
| AI | Token spend, moderation flag rate |
| Releases | Deploy history, feature flag states |

Data sources: PostHog API, Prometheus/Grafana embed, internal `analytics` schema.

Target: `GET /admin/analytics/{dashboard}`.

---

## Module 6 — Feature Flags

Toggle incomplete features per [BRANCHING_STRATEGY.md](../00_PROJECT/BRANCHING_STRATEGY.md).

```typescript
interface AdminFeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  environments: ('development' | 'staging' | 'production')[];
  rolloutPercentage?: number;
  minClientVersion?: string;
}
```

Target: `GET /admin/feature-flags`, `PATCH /admin/feature-flags/{key}`.

Changes audit-logged; production toggles require two Admin approvals (four-eyes).

---

## Audit System

### Principles

- **Append-only** — no updates or deletes to audit records
- **Tamper-evident** — hash chain optional in V2
- **Complete** — every privileged action logged

### Audit record

```typescript
interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;           // e.g. moderation.resolve, cms.publish
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  ipAddress: string;        // hashed
  createdAt: string;
}
```

Retention: 3 years per [AI_MODERATION.md](../09_AI/AI_MODERATION.md).

Target: `GET /admin/audit` with filters; `GET /admin/audit/export` (Admin, rate limited).

---

## Security

| Control | Implementation |
|---------|----------------|
| Network | VPN / IP allowlist for production admin |
| Auth | JWT with `Admin` or `Moderator` role |
| MFA | Required for all Admin accounts (V1.5) |
| Session | 8-hour max; re-auth for destructive actions |
| CSRF | SameSite + CSRF tokens on mutations |
| CSP | Strict; no third-party scripts |
| Logging | All pages access-logged |

Admin must never share authentication with player apps on the same browser profile in production.

---

## Folder Structure

```text
apps/admin/
├── app/
│   ├── (auth)/
│   ├── moderation/
│   ├── cms/
│   ├── users/
│   ├── jobs/
│   ├── analytics/
│   ├── feature-flags/
│   └── audit/
├── components/
├── features/
├── lib/
└── middleware.ts           # role gate
```

---

## Implementation Phases

| Phase | Deliverable |
|-------|-------------|
| Alpha | Internal moderation queue (service calls, no ADMIN_API) |
| Beta | `ADMIN_API.yaml` v1 + moderation + audit |
| V1 | CMS, user admin, job viewer |
| V1.5 | Feature flags, analytics embeds, MFA enforcement |

---

## Acceptance Criteria

- Moderator and Admin permissions are strictly separated.
- Every privileged action produces an audit log entry.
- Admin app is not accessible without appropriate role.
- API surface documented in `ADMIN_API.yaml` and validated via `bundle_openapi.py`.
- CMS and moderation workflows align with AI_MODERATION and STORAGE docs.

---

## Related Documents

- [AI_MODERATION.md](../09_AI/AI_MODERATION.md)
- [API_ARCHITECTURE.md](../08_API/API_ARCHITECTURE.md)
- [SECURITY.md](../11_SECURITY/SECURITY.md)
- [AUTHENTICATION.md](../11_SECURITY/AUTHENTICATION.md)
- [EVENT_ARCHITECTURE.md](../06_BACKEND/EVENT_ARCHITECTURE.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
