# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/00_PROJECT/CONTRIBUTING.md`

**Status:** Approved

**Owner:** Engineering Team

**Classification:** Internal Engineering Documentation

---

# Contributing

## Purpose

This document defines how engineers contribute code to GMRLOG: pull request workflow, code review standards, conventions, and quality gates.

All contributors—human and AI-assisted—must follow this process.

---

## Prerequisites

Before your first PR:

1. Read [README.md](../../README.md) and [MONOREPO_STRUCTURE.md](MONOREPO_STRUCTURE.md)
2. Complete local setup per `apps/*/README.md`
3. Configure git hooks: `pnpm prepare` (Husky + lint-staged)
4. Sign the contributor license acknowledgment (internal)

---

## Branch Naming

See [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md).

```text
feature/{ticket-id}-{short-description}
fix/{ticket-id}-{short-description}
chore/{short-description}
docs/{short-description}
```

Example: `feature/GMR-142-offline-write-queue`

---

## Commit Messages

[Conventional Commits](https://www.conventionalcommits.org/) enforced by Commitlint.

```text
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### Types

| Type | Use |
|------|-----|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change without feat/fix |
| `perf` | Performance improvement |
| `test` | Tests |
| `chore` | Tooling, deps |
| `ci` | CI/CD changes |

### Scopes

Align with monorepo packages: `mobile`, `web`, `backend`, `api`, `ui`, `database`, `docs`.

### Examples

```text
feat(mobile): add offline write queue persistence
fix(backend): honor idempotency key on review create
docs(ai): document vector search migration path
```

---

## Pull Request Process

```text
1. Create branch from main (or develop per branching doc)
2. Implement change — smallest reviewable unit
3. Run local checks (see below)
4. Push and open PR
5. CI must pass
6. Obtain required approvals
7. Squash merge (default) or merge commit (release branches)
8. Delete branch after merge
```

### PR title

Same format as commit message. Squash merge uses PR title as commit.

### PR description template

```markdown
## Summary
- What changed and why (1-3 bullets)

## Related
- Ticket: GMR-XXX
- Docs: docs/path/if.updated.md

## Test plan
- [ ] Unit tests added/updated
- [ ] Manual verification steps
- [ ] No docs contradiction

## Screenshots / recordings
(if UI change)
```

---

## Local Quality Checks

Run before every push:

```bash
pnpm lint
pnpm typecheck
pnpm test --filter <affected-packages>
```

Affected package detection:

```bash
pnpm turbo run lint typecheck test --filter=...[origin/main]
```

For documentation-only changes:

```bash
# Validate OpenAPI if API docs touched
python docs/08_API/bundle_openapi.py
```

---

## Code Review

### Requirements

| Change type | Approvals required |
|-------------|-------------------|
| Default | 1 engineer |
| `packages/database`, auth, security | 2 engineers + security reviewer |
| OpenAPI contract change | 1 backend + 1 consumer (mobile/web) |
| Breaking API change | Tech lead + documented in VERSIONING.md |
| Dependency major bump | 2 engineers + ADR reference |

### Reviewer responsibilities

- Verify alignment with `/docs` (single source of truth)
- Check types, tests, error handling, accessibility
- Confirm no secrets, `any`, or undocumented APIs
- Validate naming per [CODING_STANDARDS.md](CODING_STANDARDS.md)
- Request changes rather than drive-by scope expansion

### Author responsibilities

- Keep PRs under 400 lines changed when possible
- Respond to feedback within 1 business day
- Re-request review after addressing comments
- Do not merge with failing CI or unresolved blocking threads

### Review SLA

| Priority | First review |
|----------|--------------|
| Hotfix | 2 hours |
| Normal | 1 business day |
| Large refactor | 2 business days (schedule review) |

---

## Coding Conventions

Full reference: [CODING_STANDARDS.md](CODING_STANDARDS.md).

### Quick reference

| Area | Rule |
|------|------|
| TypeScript | `strict: true`, never `any` |
| Files | `kebab-case.ts` |
| Components | `PascalCase` |
| Hooks | `use` prefix |
| Booleans | `is/has/can/should` prefix |
| Imports | `@gmrlog/*` aliases per MONOREPO_STRUCTURE |
| API | OpenAPI is contract; no undocumented endpoints |
| UI | Compose from [COMPONENT_LIBRARY.md](../02_DESIGN/COMPONENT_LIBRARY.md) |
| Tests | Vitest (unit), Jest (backend), Playwright (E2E web) |

### Layer rules

```text
apps/mobile|web:
  screens → features → hooks → services → @gmrlog/api

apps/backend:
  controller → service → repository → Prisma
  No business logic in controllers
  No Prisma in controllers
```

---

## Documentation Changes

When code changes behavior:

- Update the relevant `docs/` file in the same PR
- Update `DOCS_INDEX.md` only if adding/removing documents
- Never add TODO placeholders to docs—write complete specs or file a ticket

AI assistants (Cursor) must read affected docs before generating code ([CURSOR_INTEGRATION.md](../16_CURSOR/CURSOR_INTEGRATION.md)).

---

## Database Changes

1. Prisma migration in `packages/database`
2. Update [PRISMA_SCHEMA.md](../07_DATABASE/PRISMA_SCHEMA.md) if conceptual change
3. Migration review by 2 engineers
4. Rollback plan in PR description
5. No destructive migrations without ADR and scheduled maintenance

---

## API Changes

1. Edit module YAML in `docs/08_API/`
2. Run `python docs/08_API/bundle_openapi.py`
3. Regenerate client: `pnpm --filter @gmrlog/api generate`
4. Update [API_ARCHITECTURE.md](../08_API/API_ARCHITECTURE.md) if ownership shifts
5. Version per [VERSIONING.md](VERSIONING.md)

---

## Dependency Policy

New dependencies require justification in PR:

- Problem solved
- Alternatives considered
- Bundle size impact (frontend)
- License compatibility

See [TECH_STACK_DECISIONS.md](TECH_STACK_DECISIONS.md) adoption policy.

---

## Security

- Never commit `.env`, keys, tokens, or credentials
- Report vulnerabilities to security@gmrlog.com (internal)
- Follow [SECURITY.md](../11_SECURITY/SECURITY.md)
- Dependabot PRs: merge within 7 days for critical CVEs

---

## AI-Assisted Contributions

Allowed when:

- Output reviewed by a human engineer
- Docs referenced in session (Cursor rules)
- No invented APIs or schema
- PR discloses AI assistance if substantial

The human author owns the merge and production outcome.

---

## Getting Help

| Channel | Purpose |
|---------|---------|
| `#engineering` Slack | General questions |
| `#architecture` Slack | Design decisions |
| Weekly eng office hours | Blockers, RFC discussion |
| `docs/16_CURSOR/` | AI tooling workflow |

---

## Acceptance Criteria

- Every merged PR has passed CI, has required approvals, and links a ticket or docs rationale.
- Conventional commits on main history.
- No merge with known docs/code contradiction.

---

## Related Documents

- [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md)
- [RELEASE_PROCESS.md](RELEASE_PROCESS.md)
- [CODING_STANDARDS.md](CODING_STANDARDS.md)
- [CI_CD.md](../10_DEVOPS/CI_CD.md)

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
