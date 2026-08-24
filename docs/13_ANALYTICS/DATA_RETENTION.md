# GMRLOG OS — Data Retention Policy

**Version:** 1.1.0  
**Document:** `docs/13_ANALYTICS/DATA_RETENTION.md`  
**Status:** Approved  
**Owner:** Legal & Engineering

---

## Purpose

Define retention periods for user data, logs and backups. Supports GDPR/KVKK compliance and storage cost control.

**This document describes what the system actually does.** Version 1.0.0 was written on 2026-07-10 against a design, and by the time deletion was built (12.6) most of it was wrong in both directions: it named a deletion flow and a worker pipeline that were never built, and it scheduled three classes of data GMRLog does not hold. Anything below that is *not* implemented says so in its own row rather than reading as policy. A retention schedule that overstates what is purged is the same class of defect as a privacy policy that overstates a right — it is just the one nobody thinks to check.

---

## Retention Schedule

| Data class | Retention | Deletion method |
|------------|-----------|-----------------|
| Account (`users` row) | Until deletion is requested, then a 30-day grace period | **Anonymised in place, not dropped.** Erasure scrubs every PII column, sets `handle` to `deleted-<id>` and `displayName` to `Deleted user`, and stamps `deletedAt`. The row survives so that no foreign key is left pointing at nothing. |
| Auth credentials, connected accounts, sessions | Deleted at erasure | Hard `deleteMany`. An email/password hash and an OAuth token have no reason to outlive the account for anyone else's sake. |
| Authored content others can see (posts, reviews, comments, quotes, messages) | Indefinite | **Kept, author anonymised.** Deleting an account removes its identity from a conversation rather than destroying another person's record of their own. |
| Authored content nobody else can see (`private` visibility) | Deleted at erasure | Soft delete (`deletedAt`). Anonymising it would serve no one — it would be personal data sitting unread. |
| Communities the account solely owns | Archived at erasure | Soft delete (`deletedAt`), the same path `leaveCommunity` already forces a departing owner down. There is no ownership-transfer primitive in this codebase. |
| Library entries / game logs | Indefinite | **Not deleted with the account.** They stay attached to the anonymised account row. |
| Sessions (routine, no deletion involved) | Revoked at expiry; rows removed on the next sweep | `maintenance.session.cleanup`, daily at 03:00 — revokes expired sessions, then deletes revoked/expired rows. Postgres rows, not a Redis TTL. |
| Unconfirmed upload grants | 15 minutes (`UPLOAD_GRANT_TTL_MS`) | `maintenance.upload.cleanup`, hourly — expires the grant and deletes the orphaned object. |
| Read notifications | 90 days | `maintenance.notification.cleanup`, daily at 04:00. |
| Audit logs (`audit_logs`) | Indefinite today | **No automated expiry or archival exists.** The 7-year archive-to-cold-storage schedule 1.0.0 described was never built; the rows simply accumulate. |
| Application logs | Whatever the host keeps | **No rotation or lifecycle policy exists in this repo.** The backend writes through pino to `LOG_FILE`; retention is the deployment's to set. |
| Backups (Postgres, Redis, MinIO) | `BACKUP_RETENTION_DAYS`, default **14 days** | `infrastructure/deploy/scripts/backup.sh` prunes local archives past the window; the offsite copy follows the bucket's own lifecycle. |

**Removed in 1.1.0, because the data does not exist.** 1.0.0 scheduled *analytics events* (24 months, partition drop), *push tokens* (90 days inactive, cron cleanup) and *AI request logs* (90 days). There is no analytics event store — CLAUDE.md forbids analytics outright — no push-token table, and no AI subsystem. Scheduling the purge of data that is never collected reads as a control and is not one.

Two older documents still cite the 24-month analytics figure — [`ANALYTICS_PLATFORM_FREEZE_v1.md`](../00_PROJECT/ANALYTICS_PLATFORM_FREEZE_v1.md) and [`SPRINT_14_4_IMPLEMENTATION_REPORT.md`](../00_PROJECT/SPRINT_14_4_IMPLEMENTATION_REPORT.md), the latter naming an `ANALYTICS_EVENT_RETENTION_MONTHS` constant. Neither the constant nor any analytics event store is in this codebase; both describe a platform that was planned and not built. They are left as the historical records they are, and are noted here so the row is not restored on the strength of a link pointing back at it.

---

## User Deletion (GDPR Art. 17 · KVKK Art. 7)

1. The player requests deletion from **Settings › Account › Delete account** (`POST /me/account/deletion`). Self-serve; no email, no ticket.
2. A **30-day grace period** starts (`AccountDeletionRequest.deletesAt`). It is cancellable for its whole length (`DELETE /me/account/deletion`), and `GET` reports the pending state.
3. After `deletesAt`, erasure runs. **Two things trigger it, and both are needed:** `AccountDeletionService.enforceGracePeriod`, called before every token issuance, catches the account the moment it tries to come back; and `maintenance.account-deletion.sweep`, daily at 03:30, catches the account that never does. Without the second, the 30-day promise would be conditional on the player returning to collect it.
4. Erasure applies the table above in one transaction per account: scrub the account row, hard-delete credentials/connected accounts/sessions, soft-delete private content, archive solely-owned communities, and leave everything else attached to the now-anonymous account.

Erasure is irreversible and the request row records `erasedAt`. A credential request from an erased account is refused with `ACCOUNT_DELETED`.

**Not `[deleted]`.** 1.0.0 said anonymised content would be attributed to `[deleted]`; the implementation uses `Deleted user`, and the account keeps a real row rather than being replaced by a sentinel.

---

## Related Documents

- [SECURITY.md](../11_SECURITY/SECURITY.md)
- [AUTHENTICATION.md](../11_SECURITY/AUTHENTICATION.md)
- [PRIVACY_POLICY.md](../11_SECURITY/PRIVACY_POLICY.md)
- [BACKUP_STRATEGY.md](../10_DEVOPS/BACKUP_STRATEGY.md)
- [ANALYTICS_ARCHITECTURE.md](ANALYTICS_ARCHITECTURE.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial data retention policy |
| 1.1.0 | 2026-08-24 | Reconciled with what 12.6 and its sweep actually implement. Corrected the account row (anonymise in place, not hard delete), reviews (anonymise is the rule, not an option), game logs (not deleted with the account) and sessions (Postgres rows on a daily sweep, not a Redis TTL). Replaced the `AUTH_API` / "workers purge" / `[deleted]` deletion flow with the real routes and the two enforcement points. Dropped the analytics-event, push-token and AI-request rows — none of that data exists. Added uploads, notifications, audit logs, application logs and backups, which were held and unscheduled. |
