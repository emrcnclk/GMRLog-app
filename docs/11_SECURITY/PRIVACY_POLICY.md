# GMRLOG OS — Privacy Policy (Engineering Summary)

**Version:** 1.1.0  
**Document:** `docs/11_SECURITY/PRIVACY_POLICY.md`  
**Status:** Approved  
**Owner:** Legal & Security Team

---

## Purpose

Engineering summary of privacy principles governing data collection, processing, and user rights. This is not the public-facing legal text: the actual Privacy Policy and Aydınlatma Metni are served in-app (`GET /api/v1/legal/:document`, rendered at `app/legal/[document].tsx`), in `en` and `tr`, and are the documents a player actually accepts or is informed by. There is no separate publication of legal text on gmrlog.com — that line in the previous revision of this document named a page nothing in this repo serves, and it produced a real bug (`about-model.ts`'s two `placeholder: false` rows pointing at `https://gmrlog.com/privacy` and `/terms`, both 404s) before it was corrected in Phase 12.

---

## Data We Collect

| Category | Examples | Purpose |
|----------|----------|---------|
| Account | email, username, birth date, country, preferred language | Authentication, profile, the 13-year age floor |
| Gaming activity | game logs, reviews, playtime | Core product |
| Social | follows, messages metadata | Social features |
| Technical | app version | Support |
| Optional | avatar, bio, connected accounts, first/last name | Personalization |

Birth date, country and preferred language are collected at registration (`sessionRegisterSchema`) — birth date enforces the 13-year floor the Terms have claimed since they were drafted; country is player-chosen, never inferred from an IP; language is bound to the locale of the legal texts accepted. Device type, IP address and other technical/analytics fields are **not** collected — `Session` carries only `expiresAt`/`revokedAt`, and CLAUDE.md forbids analytics outright. We do not sell personal data.

---

## User Rights

- **Access and export** — self-serve, `POST /me/export`. GDPR Art. 15/20, KVKK Art. 11. Rate-limited to once per 24 hours. Returns a portable, machine-readable snapshot across the five categories above; soft-deleted content and computed signals (archetype scores, DNA similarity) are excluded — see the data-export note below.
- **Correction** via profile settings.
- **Deletion** — self-serve, `POST /me/account/deletion` (`GET` to check status, `DELETE` to cancel). 30-day grace period, cancellable any time before it takes effect. There is no scheduled sweep job yet: enforcement happens lazily, checked on every credential issuance (login, register, refresh, OAuth) via `SessionsService.issueCredentialPair`. An account that never returns after its grace period ends is not yet swept by anything else — a known gap, not a silent one. On erasure: content the account authored (posts, reviews, comments, messages) is anonymised, not deleted, so it does not orphan another player's own conversation; `private`-visibility content is the one exception and is soft-deleted outright; a community the account solely owns is archived, following the same path `CommunitiesService.leaveCommunity` already forces on any owner; auth credentials, connected accounts and sessions are deleted/revoked outright.
- **Opt-out of marketing notifications.**

---

## Engineering Controls

- Encryption in transit (TLS 1.3) and at rest (AES-256)
- PII redaction in logs — see `LOGGING.md`
- Retention schedules — see `DATA_RETENTION.md`
- Regional data residency: single region today. There is no EU-region deployment, planned or otherwise, and no target version for one — the prior "v2" line named a commitment nothing in this codebase or its roadmap backs.

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
| 1.1.0 | 2026-08-23 | Reconciled with what shipped in Phase 12 (12.7): real route names for export (`POST /me/export`) and deletion (`POST/GET/DELETE /me/account/deletion`); removed the unbuilt-then, real-now claims that predated any of it; corrected the data-collected table to match `schema.prisma` (birth date/country/language now real, device type never was); removed the "public text on gmrlog.com/privacy" claim that caused a real 404 before Phase 12 fixed it; removed the unbacked "EU region (v2)" residency claim. |
