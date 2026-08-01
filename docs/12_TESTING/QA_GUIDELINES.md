# GMRLOG OS — QA Guidelines

**Version:** 1.0.0  
**Document:** `docs/12_TESTING/QA_GUIDELINES.md`  
**Status:** Approved  
**Owner:** QA Team

---

## Purpose

Manual and exploratory QA procedures complementing automated tests in `TESTING_STRATEGY.md`.

---

## Test Environments

| Env | URL | Data |
|-----|-----|------|
| Local | localhost | Seed fixtures |
| Staging | staging.gmrlog.com | Anonymized prod snapshot weekly |
| Production | gmrlog.com | Smoke only |

---

## Release QA Checklist

- [ ] Auth: register, login, OAuth, logout, MFA
- [ ] Profile: edit, avatar upload, privacy settings
- [ ] Social: follow, block, feed pagination
- [ ] Review: create, edit, spoiler tag, delete
- [ ] Game log: add session, complete game
- [ ] Notifications: receive, mark read, preferences
- [ ] Search: global search, autocomplete
- [ ] Mobile: offline queue, push notification tap-through
- [ ] Accessibility: VoiceOver/TalkBack smoke on P0 screens

---

## Bug Severity

| Severity | Definition | SLA |
|----------|------------|-----|
| P0 | Data loss, security, auth broken | Fix before release |
| P1 | Core feature unusable | 24h |
| P2 | Degraded UX, workaround exists | Sprint |
| P3 | Cosmetic | Backlog |

---

## Related Documents

- [TESTING_STRATEGY.md](TESTING_STRATEGY.md)
- [RELEASE_PROCESS.md](../00_PROJECT/RELEASE_PROCESS.md)
- [ACCESSIBILITY.md](../02_DESIGN/ACCESSIBILITY.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 | 2026-07-10 | Initial QA guidelines |
