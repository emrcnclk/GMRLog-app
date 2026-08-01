# Platform Visibility Matrix

**Document:** `docs/05_SECURITY/PLATFORM_VISIBILITY_MATRIX.md`  
**Status:** **Frozen — Platform Infrastructure Freeze v1.0** (Sprint 15.1)  
**Rule:** Infrastructure must not leak business PII or secrets

---

## Principles

1. Health payloads expose **component status**, not connection strings or credentials.  
2. Logs redact secrets (tokens, passwords, SMTP passwords, JWT material).  
3. Rate-limit responses must not reveal whether an email/username exists beyond existing Auth behavior.  
4. Mail transport must not log message bodies or full recipient lists in clear text.  
5. Storage errors may include object **key prefixes**, not signed URL secrets.

---

## Audience visibility

| Data | ANON | USER | STAFF | SYSTEM / Ops logs |
|------|------|------|-------|-------------------|
| Liveness (process up) | ✅ | ✅ | ✅ | ✅ |
| Readiness (DB/Redis/storage booleans) | ✅ | ✅ | ✅ | ✅ |
| Detailed infra error stacks | — | — | — | ✅ (restricted) |
| Rate-limit remaining headers | ✅ | ✅ | ✅ | ✅ |
| SMTP password / JWT secret | — | — | — | — (**never**) |
| Business entity dumps via health | — | — | — | — (**forbidden**) |
| Analytics KPIs | — | — | via Analytics/Admin | — |
| Feature flag values Admin UI | — | — | Phase 2 | — |

---

## GDPR / privacy

| Concern | Behavior |
|---------|----------|
| Mail | Transport may handle PII addresses; retention = mail provider + Auth logs policy — no Platform durable mail store in V1 |
| Rate-limit keys | Prefer hashed IP / user id; TTL-bound |
| Logs | Align existing Pino redact; extend for SMTP fields when wired |
| Account deletion | Platform does not own identity unlink; Users/Auth/Analytics hooks remain SoT |

---

## Related

- Permissions: [`PLATFORM_PERMISSION_MATRIX.md`](./PLATFORM_PERMISSION_MATRIX.md)  
- Freeze: [`PLATFORM_INFRASTRUCTURE_FREEZE_v1.md`](../00_PROJECT/PLATFORM_INFRASTRUCTURE_FREEZE_v1.md)
