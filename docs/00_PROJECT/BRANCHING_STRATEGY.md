# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/00_PROJECT/BRANCHING_STRATEGY.md`

**Status:** Approved

**Owner:** Platform Team

**Classification:** Internal Engineering Documentation

---

# Branching Strategy

## Purpose

This document defines GMRLOG's Git branching model: trunk-based development with short-lived feature branches and explicit release branches for production cuts.

The strategy optimizes for continuous integration, fast reviews, and predictable releases.

---

## Model Overview

GMRLOG uses **trunk-based development** with **`main` as the single integration trunk**.

```text
main ─────●─────●─────●─────●─────●─────●─────►  (always deployable to staging)
           \   /       \   /
            ● ●         ● ●                        (short-lived feature branches)
            
release/v1.2.x ───●─────●─────►                  (production stabilization)
                   \   /
                    ● ●                            (cherry-pick hotfixes only)
```

`develop` branch exists for legacy compatibility during Alpha but is **deprecated**—all new work branches from `main`.

---

## Permanent Branches

| Branch | Purpose | Protection |
|--------|---------|------------|
| `main` | Integration trunk; staging deploys | Required PR, CI, 1+ approval |
| `release/v{major}.{minor}.x` | Production stabilization | Required PR, 2 approvals, release captain |

No long-lived `develop` integration branch for new work.

---

## Short-Lived Branches

### Feature branches

```text
feature/{ticket}-{description}
```

- Branch from: `main`
- Merge to: `main`
- Max lifetime: 3 days (soft target), 7 days (hard limit)
- Rebase on `main` daily if open > 1 day

### Fix branches

```text
fix/{ticket}-{description}
```

- Branch from: `main` (or `release/*` if production-only fix)
- Merge to: same source branch + cherry-pick to `release/*` if needed

### Chore / docs

```text
chore/{description}
docs/{description}
```

- Low ceremony; 1 approval sufficient for docs-only

---

## Release Branches

Created from a tagged commit on `main` when entering release stabilization.

```text
release/v1.2.x
```

### Release branch rules

- **Only** bug fixes, changelog, version bumps, and release config
- No new features
- Every commit must cherry-pick back to `main` or be merged forward after release
- Naming: `release/v{major}.{minor}.x` (patch increments on branch via tags)

### Creating a release branch

```bash
git checkout main
git pull
git checkout -b release/v1.2.x
git push -u origin release/v1.2.x
```

Release captain owns the branch until GA tag.

---

## Hotfix Branches

For production incidents when `main` has diverged with unreleased features.

```text
hotfix/{ticket}-{description}
```

```text
1. Branch from: release/v1.2.x (current production)
2. Fix + test
3. Merge to release/v1.2.x
4. Tag patch: v1.2.1
5. Cherry-pick to main (mandatory)
```

Hotfix bypasses normal feature freeze with incident commander approval.

---

## Trunk-Based Practices

### Integrate frequently

- Merge at least once per day per active contributor
- Use feature flags for incomplete features ([FEATURE_MATRIX.md](../01_PRODUCT/FEATURE_MATRIX.md))
- Prefer small PRs (< 400 LOC) over week-long branches

### Feature flags

Incomplete features merge to `main` behind flags:

```typescript
if (featureFlags.isEnabled('offline_write_queue')) { ... }
```

Flags defined in backend config; admin UI pending `ADMIN_API.yaml`.

### No merge commits on feature branches

Authors rebase on `main` before merge:

```bash
git fetch origin
git rebase origin/main
```

PR merge strategy: **Squash merge** to `main` (default).

Release branches use **merge commit** to preserve cherry-pick history.

---

## Branch Protection Rules

### `main`

| Rule | Setting |
|------|---------|
| Require PR | Yes |
| Required checks | lint, typecheck, test, build |
| Approvals | 1 minimum |
| Dismiss stale reviews | Yes |
| Force push | Disabled |
| Delete head branch | Enabled |

### `release/*`

| Rule | Setting |
|------|---------|
| Approvals | 2 minimum |
| Release captain review | Required |
| Force push | Disabled |

---

## Version Tags

Semantic versioning on release branches:

```text
v{major}.{minor}.{patch}
```

Tags are created on `release/*` merges to production, not on every `main` commit.

Pre-release tags on `main`:

```text
v1.3.0-alpha.1
v1.3.0-beta.2
v1.3.0-rc.1
```

See [VERSIONING.md](VERSIONING.md) and [RELEASE_PROCESS.md](RELEASE_PROCESS.md).

---

## Environment Mapping

| Branch / tag | Environment |
|--------------|-------------|
| `main` (HEAD) | Staging (auto deploy) |
| `release/v*` RC tags | Staging validation |
| `v*` GA tags | Production |
| PR branches | Preview (ephemeral) |

---

## Fork and External Contributors

External forks use the same branch naming. PRs target `main` only. Release and hotfix branches are maintainers-only.

---

## Anti-Patterns

| Avoid | Instead |
|-------|---------|
| Week-long feature branches | Split into incremental PRs |
| Merging `main` into release with features | Cherry-pick fixes only |
| Direct push to `main` | Always PR |
| Parallel long-lived integration branches | Trunk on `main` |
| Hotfix without main cherry-pick | Always dual-merge |

---

## Acceptance Criteria

- `main` is always green on CI and deployable to staging.
- Release branches contain only stabilization commits.
- Every hotfix appears on both `release/*` and `main`.
- Feature branch lifetime averages < 3 days.

---

## Related Documents

- [CONTRIBUTING.md](CONTRIBUTING.md)
- [RELEASE_PROCESS.md](RELEASE_PROCESS.md)
- [VERSIONING.md](VERSIONING.md)
- [CI_CD.md](../10_DEVOPS/CI_CD.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release; develop deprecated |
