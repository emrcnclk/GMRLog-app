# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/00_PROJECT/RELEASE_PROCESS.md`

**Status:** Approved

**Owner:** Release Engineering

**Classification:** Internal Engineering Documentation

---

# Release Process

## Purpose

This document defines how GMRLOG ships software: semantic versioning, changelog discipline, deployment gates, and rollback procedures across mobile, web, and backend.

---

## Release Types

| Type | Version bump | Example | Channel |
|------|--------------|---------|---------|
| Major | `X.0.0` | Breaking API, schema migration | Planned GA |
| Minor | `0.X.0` | New features, backward compatible | Monthly cadence |
| Patch | `0.0.X` | Bug fixes, security patches | As needed |
| Pre-release | suffix | `1.3.0-beta.1` | Alpha, Beta, RC |

All packages and apps share the **platform version** for user-facing releases. Internal packages may patch independently only for non-user-facing fixes.

---

## Semantic Versioning Policy

Follow [SemVer 2.0.0](https://semver.org/).

### Major (breaking)

- Removing or renaming public API endpoints
- Incompatible database migrations without dual-write period
- Removing feature flags that exposed user-facing behavior
- Mobile minimum OS version increase

### Minor (compatible)

- New API endpoints and optional fields
- New features behind default-on flags after beta
- Deprecations announced (still functional)

### Patch (fix)

- Bug fixes
- Security patches
- Performance improvements
- Documentation corrections (no version bump for docs-only repo commits unless tagged)

See [VERSIONING.md](VERSIONING.md) for API and schema specifics.

---

## Release Cadence

| Phase | Cadence | Audience |
|-------|---------|----------|
| Alpha | Continuous staging | Internal team |
| Beta | Bi-weekly RC | Closed testers |
| V1+ GA | Monthly minor | Public |
| Hotfix | Within 24h of P0 | Production |

---

## Roles

| Role | Responsibility |
|------|----------------|
| Release captain | Owns checklist, go/no-go decision |
| QA lead | Sign-off on test matrix |
| Backend on-call | Migration execution, smoke tests |
| Mobile lead | App store / OTA submission |
| DevOps | Deploy orchestration, monitoring |
| Product | Release notes user-facing copy |

---

## Release Workflow

```text
┌─────────────────────────────────────────────────────────────┐
│ 1. FREEZE (T-5 days)                                        │
│    - Feature flags for next release locked                   │
│    - Only fix/ docs commits on release branch                │
├─────────────────────────────────────────────────────────────┤
│ 2. CUT RELEASE BRANCH                                        │
│    - release/v{X}.{Y}.x from main                            │
│    - Bump version in package.json files                      │
├─────────────────────────────────────────────────────────────┤
│ 3. STABILIZE (T-5 → T-1)                                     │
│    - QA full regression                                      │
│    - RC tags: v{X}.{Y}.0-rc.N                                │
│    - Staging deploy per RC                                   │
├─────────────────────────────────────────────────────────────┤
│ 4. GO / NO-GO (T-0)                                          │
│    - Deploy gates (below)                                    │
│    - Release captain approves                                │
├─────────────────────────────────────────────────────────────┤
│ 5. PRODUCTION DEPLOY                                         │
│    - Tag v{X}.{Y}.0                                            │
│    - Backend → Web → Mobile OTA → Store (if native change)   │
├─────────────────────────────────────────────────────────────┤
│ 6. POST-RELEASE                                              │
│    - Monitor 2h elevated                                     │
│    - Publish changelog                                       │
│    - Merge release branch fixes back to main                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Deploy Gates

All gates must pass for production promotion.

### Automated gates (CI)

| Gate | Command / check |
|------|-----------------|
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Unit tests | `pnpm test` |
| Integration tests | `pnpm test:integration` |
| Build | `pnpm build` |
| OpenAPI bundle | `python docs/08_API/bundle_openapi.py` |
| Security scan | Dependabot + Trivy image scan |
| Secret scan | Gitleaks |
| Migration dry-run | `prisma migrate deploy` on staging clone |

### Manual gates

| Gate | Owner | Criteria |
|------|-------|----------|
| QA regression | QA lead | Test matrix 100% P0/P1 pass |
| Migration review | Backend | Rollback script verified |
| Performance | DevOps | Staging p95 within SLO |
| Accessibility spot check | Design | Critical flows WCAG AA |
| Legal / privacy | Product | Changelog reviewed if data handling changes |
| Release notes | Product | User-facing notes approved |

### Go / no-go criteria

**Go** if: all automated green, zero open P0 bugs, ≤ 2 known P1 with documented workarounds.

**No-go** if: any P0, failed migration dry-run, security CVE unresolved, or SLO breach on staging > 30 min.

---

## Changelog

### Location

`CHANGELOG.md` at repository root.

### Format

[Keep a Changelog](https://keepachangelog.com/) 1.1.0.

```markdown
## [1.2.0] - 2026-08-15

### Added
- Offline write queue for mobile reviews and posts
- AI review spellcheck in composer

### Changed
- Feed cache stale time reduced to 30s

### Fixed
- Token refresh race on Android reconnect

### Security
- Rate limit on password reset endpoint
```

### Categories

`Added` | `Changed` | `Deprecated` | `Removed` | `Fixed` | `Security`

### Automation

PRs with `feat` or `fix` commits should update `CHANGELOG.md` under `[Unreleased]`. Release captain moves section to versioned heading on cut.

---

## Deployment Order

Production deploys are sequential to manage dependencies:

```text
1. Database migrations (backward compatible)
2. Backend API (rolling, zero-downtime)
3. BullMQ workers
4. Web (Next.js)
5. Mobile OTA (Expo Updates) — JS bundle only
6. Mobile store submission — native binary changes only
7. Admin dashboard
```

### Zero-downtime rules

- Migrations must be expand-only during deploy window (add column → deploy code → remove old)
- Feature flags default off until all services updated
- WebSocket gateway drains connections gracefully (30s)

See [DEPLOYMENT.md](../10_DEVOPS/DEPLOYMENT.md).

---

## Mobile Release Specifics

| Change type | Delivery |
|-------------|----------|
| JS/TS only | Expo OTA to channel `production` |
| Native module / SDK | App Store + Play Store submission |
| Runtime version bump | New store build required |

OTA rollback: promote previous bundle on Expo dashboard within 15 minutes.

---

## Rollback Procedure

| Layer | Rollback method | RTO target |
|-------|-----------------|------------|
| Backend | Redeploy previous Docker tag | 10 min |
| Web | Redeploy previous Vercel/hosting build | 5 min |
| Database | Forward-fix only; no destructive rollback | 30 min |
| Mobile OTA | Revert Expo update channel | 15 min |
| Mobile store | Cannot rollback; forward-fix hotfix | 24h |

Incident commander triggers rollback; postmortem within 48h for P0.

---

## Communication

| Audience | Channel | Timing |
|----------|---------|--------|
| Engineering | `#releases` Slack | RC through GA |
| Beta users | In-app banner | 24h before |
| Public | Status page + blog | At GA |
| App stores | Release notes | With submission |

---

## Artifacts

Each GA release publishes:

- Git tag `v{X}.{Y}.{Z}`
- `CHANGELOG.md` entry
- GitHub Release with binaries / migration notes
- Sentry release marker
- PostHog `release` property update

---

## Acceptance Criteria

- No production deploy without all deploy gates documented.
- Every GA tag has a corresponding changelog section.
- Rollback procedure is tested quarterly on staging.
- Mobile OTA and store paths are chosen correctly per change type.

---

## Related Documents

- [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)
- [VERSIONING.md](VERSIONING.md)
- [CI_CD.md](../10_DEVOPS/CI_CD.md)
- [DEPLOYMENT.md](../10_DEVOPS/DEPLOYMENT.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
