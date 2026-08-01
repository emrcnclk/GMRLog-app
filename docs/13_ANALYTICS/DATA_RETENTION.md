# GMRLOG OS — Data Retention Policy

**Version:** 1.0.0  
**Document:** `docs/13_ANALYTICS/DATA_RETENTION.md`  
**Status:** Approved  
**Owner:** Legal & Engineering

---

## Purpose

Define retention periods for user data, analytics events, logs, and backups. Supports GDPR/CCPA compliance and storage cost control.

---

## Retention Schedule

| Data class | Retention | Deletion method |
|------------|-----------|-----------------|
| User account (active) | Until deletion requested | Soft delete 30d → hard delete |
| Game logs | Indefinite (user-owned) | Deleted with account |
| Reviews | Indefinite or user delete | Soft delete, anonymize author optional |
| Analytics events | 24 months | Partition drop |
| Application logs | 30 days hot, 90 days cold | Index lifecycle |
| Audit logs (admin) | 7 years | Archive to cold storage |
| Push tokens | Until revoked or 90d inactive | Cron cleanup |
| AI request logs | 90 days | No prompt content after 30d |
| Session tokens | Refresh expiry + 7d | Redis TTL |

---

## User Deletion (GDPR)

1. User requests deletion via `AUTH_API` deletion flow.
2. 30-day grace period (`DeletionStatus`).
3. Workers purge: PII fields, media, tokens, analytics identify unlink.
4. UGC may be anonymized (`[deleted]`) where legally required to preserve thread integrity.

---

## Related Documents

- [SECURITY.md](../11_SECURITY/SECURITY.md)
- [AUTHENTICATION.md](../11_SECURITY/AUTHENTICATION.md)
- [BACKUP_STRATEGY.md](../10_DEVOPS/BACKUP_STRATEGY.md)
- [ANALYTICS_ARCHITECTURE.md](ANALYTICS_ARCHITECTURE.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial data retention policy |
