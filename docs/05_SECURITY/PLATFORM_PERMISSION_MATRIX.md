# Platform Permission Matrix

**Document:** `docs/05_SECURITY/PLATFORM_PERMISSION_MATRIX.md`  
**Status:** **Frozen — Platform Infrastructure Freeze v1.0** (Sprint 15.1)  
**AuthN:** Bearer JWT where applicable (same Auth issuer)  
**AuthZ model:** `PlatformRole` for staff; public for health liveness only

---

## Roles

| Role | Meaning |
|------|---------|
| `ANON` | Unauthenticated |
| `USER` | Authenticated non-staff |
| `MODERATOR` / `ADMIN` | Staff (`PlatformRole`) |
| `SYSTEM` | Cron / workers / internal jobs |

---

## Platform surfaces (Module 15 V1)

| Action / surface | ANON | USER | STAFF | SYSTEM |
|------------------|------|------|-------|--------|
| `GET /health` / `/health/live` | ✅ | ✅ | ✅ | ✅ |
| `GET /health/ready` | ✅ | ✅ | ✅ | ✅ |
| Admin module health compose (`/admin/health`) | — | — | ✅ | — |
| Configure rate-limit policy in code/env | — | — | — | ✅ (deploy) |
| Bypass rate limits | — | — | — | — (**forbidden** except documented test hooks) |
| Read raw SMTP credentials via API | — | — | — | — (**forbidden**) |
| Mutate business entities via Platform | — | — | — | — (**forbidden**) |
| FeatureFlag Admin CRUD | — | — | — | — (Admin Phase 2) |
| Jobs console / queue retry Admin API | — | — | — | — (Admin Phase 2) |
| Run scheduled Platform-hosted jobs | — | — | — | ✅ |

Staff = Moderator+ via existing Admin guards where Admin owns the route.

---

## Cross-cutting rules

1. Rate limiting applies **before** or **with** AuthZ — being Admin does not imply unlimited abuse capacity unless Freeze later defines staff bypass.  
2. Mail transport has **no** public HTTP API in V1.  
3. Storage put/delete is invoked by domain services under their AuthZ — Platform does not expose a public “upload anything” API in V1.  
4. SYSTEM jobs must not elevate to mutate foreign aggregates beyond the BC port they call.

---

## Related

- Visibility: [`PLATFORM_VISIBILITY_MATRIX.md`](./PLATFORM_VISIBILITY_MATRIX.md)  
- Admin permissions: Admin Freeze matrices (unchanged)
