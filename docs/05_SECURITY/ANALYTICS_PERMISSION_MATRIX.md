# Analytics Permission Matrix

**Document:** `docs/05_SECURITY/ANALYTICS_PERMISSION_MATRIX.md`  
**Status:** **Frozen — Analytics Platform Freeze v1.0** (Sprint 14.0)  
**AuthN:** Bearer JWT (same Auth issuer)  
**AuthZ model:** JWT SoT = `PlatformRole`

---

## Roles

| Role | Runtime mapping |
|------|-----------------|
| `ANON` | Unauthenticated |
| `USER` | Authenticated non-staff |
| `MODERATOR` | `PlatformRole=MODERATOR` |
| `SENIOR_MODERATOR` | Process title — same JWT as `MODERATOR` |
| `ADMIN` | `PlatformRole=ADMIN` |
| `SYSTEM` | Internal workers / aggregation jobs |

Guards: staff Analytics HTTP uses Admin-compatible staff gates (`MODERATOR` / `ADMIN`) unless row says Admin-only.

---

## Analytics endpoints (Module 14 V1)

| Action / surface | ANON | USER | MODERATOR | ADMIN | SYSTEM |
|------------------|------|------|-----------|-------|--------|
| Event consumer / aggregation jobs | — | — | — | — | ✅ |
| Read platform KPI dashboard (Analytics port) | — | — | ✅ | ✅ | — |
| `adminGetAnalyticsDashboard` `platform` | — | — | ✅ limited / ✅ | ✅ | — |
| `adminGetAnalyticsDashboard` `moderation` volume | — | — | ✅ | ✅ | — |
| `adminGetAnalyticsDashboard` `ai` / `releases` | — | — | — | — | — (deferred) |
| Client batch ingest SDK | — | — | — | — | — (deferred) |
| Export raw `AnalyticsEvent` dump | — | — | — | ✅ rate-limited Phase 2 | — |
| Mutate domain entities via Analytics | — | — | — | — | — (**forbidden**) |

“Limited” Moderator view: aggregate counts only — no user-level drilldown PII (Visibility Matrix).

---

## Admin dashboard compose

| Action | MODERATOR | ADMIN | Notes |
|--------|-----------|-------|-------|
| Admin shell `GET /admin/dashboard` | ✅ | ✅ | Admin Freeze — domain stats ports |
| Embed Analytics platform KPIs | ✅ | ✅ | Compose Analytics read port |
| Write Analytics tables from Admin services | — | — | **Forbidden** |

---

## Future BI endpoints

| Action | USER | MODERATOR | ADMIN | Phase |
|--------|------|-----------|-------|-------|
| Studio / B2B Analytics Products | — | — | — | Monetization / Future |
| Warehouse / BI tool OAuth | — | — | ✅ (ops) | Phase 3+ |
| Player-facing “your year in gaming” advanced | ✅ own data only | — | — | Deferred product |

---

## Explicit denials

| Action | All roles |
|--------|-----------|
| Anonymous access to staff analytics | **Denied** |
| USER access to platform KPI staff APIs | **Denied** |
| Analytics service calling Users/Games mutation APIs to “fix” metrics | **Denied** |
| Using `UserAdminRole` without `PlatformRole` | **Denied** (Admin Freeze) |

---

## Related

- Freeze: [`ANALYTICS_PLATFORM_FREEZE_v1.md`](../00_PROJECT/ANALYTICS_PLATFORM_FREEZE_v1.md)  
- Admin permissions: [`ADMIN_PERMISSION_MATRIX.md`](./ADMIN_PERMISSION_MATRIX.md)
