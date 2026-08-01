# GMRLOG OS — Privacy Policy (Engineering Summary)

**Version:** 1.0.0  
**Document:** `docs/11_SECURITY/PRIVACY_POLICY.md`  
**Status:** Approved  
**Owner:** Legal & Security Team

---

## Purpose

Engineering summary of privacy principles governing data collection, processing, and user rights. Public-facing legal text is published separately on gmrlog.com/privacy.

---

## Data We Collect

| Category | Examples | Purpose |
|----------|----------|---------|
| Account | email, username, birth date | Authentication, profile |
| Gaming activity | game logs, reviews, playtime | Core product |
| Social | follows, messages metadata | Social features |
| Technical | device type, app version | Support, analytics |
| Optional | avatar, bio, connected accounts | Personalization |

We do not sell personal data.

---

## User Rights

- Access and export (`AUTH_API` export endpoint)
- Correction via profile settings
- Deletion with 30-day grace period
- Opt-out of marketing notifications

---

## Engineering Controls

- Encryption in transit (TLS 1.3) and at rest (AES-256)
- PII redaction in logs — see `LOGGING.md`
- Retention schedules — see `DATA_RETENTION.md`
- Regional data residency: EU users → EU region (v2)

---

## Related Documents

- [SECURITY.md](SECURITY.md)
- [AUTHENTICATION.md](AUTHENTICATION.md)
- [DATA_RETENTION.md](../13_ANALYTICS/DATA_RETENTION.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial engineering privacy summary |
