# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/16_CURSOR/CURSOR_INTEGRATION.md`

**Status:** Approved

**Owner:** Engineering Team

**Classification:** Internal Engineering Documentation

---

# Cursor Integration

## Purpose

This document describes how Cursor AI assistants integrate with the GMRLOG monorepo: documentation hierarchy, rules, workflows, and quality expectations.

Every engineer—and every AI session—must treat `/docs` as the **single source of truth**.

---

## Core Principle

```text
Documentation > Code

If implementation contradicts /docs, the implementation is wrong
unless an approved ADR and doc update precede the change.
```

---

## Documentation Hierarchy

Before generating or modifying code, read documents in this order:

| Order | Document | Why |
|-------|----------|-----|
| 1 | [README.md](../../README.md) | Product vision, pillars, doc map |
| 2 | [MONOREPO_STRUCTURE.md](../00_PROJECT/MONOREPO_STRUCTURE.md) | Repo layout, `@gmrlog/*` aliases |
| 3 | [CODING_STANDARDS.md](../00_PROJECT/CODING_STANDARDS.md) | TypeScript, naming, layers |
| 4 | Task-matching `docs/` folders | Domain-specific specs |
| 5 | `.cursor/rules/` | Always-applied and scoped rules |

### Discipline folders

```text
00_PROJECT   Engineering standards, versioning, contributing
01_PRODUCT   Vision, roadmap, features
02_DESIGN    Design system, components, tokens
03_UX        Journeys, navigation, IA
04_COMPONENTS Index → COMPONENT_LIBRARY.md
05_FRONTEND  Mobile/web architecture, state, offline
06_BACKEND   Services, events, cache, realtime
07_DATABASE  Schema, Prisma, migrations
08_API       OpenAPI modules, error codes
09_AI        AI architecture, moderation, prompts
10_DEVOPS    CI/CD, deployment, infrastructure
11_SECURITY  Auth, RBAC, security policy
12_TESTING   Test strategy
13_ANALYTICS Event specs
14_MONETIZATION Premium product model
15_ADMIN     Admin app architecture
16_CURSOR    This document
```

Use [DOCS_INDEX.md](../DOCS_INDEX.md) for navigation and coverage status.

---

## Cursor Rules (`.cursor/rules/`)

Rules are MDC files with YAML frontmatter. They inject persistent instructions into AI sessions.

### Always-applied rules

| File | Scope |
|------|-------|
| `project-context.mdc` | Docs-first, no invented APIs, Turkish user communication |
| `naming.mdc` | kebab-case files, strict TS, boolean prefixes |

### Scoped rules (applied by glob or description)

| File | Domain |
|------|--------|
| `frontend.mdc` | React Native, Expo, Next.js |
| `backend.mdc` | NestJS, Prisma, services |
| `api.mdc` | OpenAPI, REST conventions |
| `database.mdc` | Migrations, schema |
| `design.mdc` | Tokens, components |
| `animation.mdc` | Reanimated, motion |
| `performance.mdc` | Latency budgets |
| `security.mdc` | Auth, validation |

### Rule authoring

New rules follow [create-rule skill](https://cursor.com/docs) conventions:

- One concern per rule file
- Under 500 lines
- Concrete examples, not vague guidance
- Point to canonical docs, don't duplicate entire specs

---

## Recommended Workflows

### Feature implementation

```text
1. User describes feature
2. Agent reads FEATURE_MATRIX + domain docs + API YAML
3. Agent confirms scope (asks user if doc gap exists)
4. Agent implements in correct app/package per MONOREPO_STRUCTURE
5. Agent runs lint + typecheck on affected packages
6. Agent updates docs if behavior changed
```

### API change

```text
1. Edit module in docs/08_API/*.yaml
2. python docs/08_API/bundle_openapi.py
3. pnpm --filter @gmrlog/api generate
4. Implement backend handler
5. Update consumer hooks in packages/state
6. Verify API_ARCHITECTURE ownership table
```

### Bug fix

```text
1. Reproduce with test or clear steps
2. Read relevant architecture doc
3. Minimal fix — no drive-by refactors
4. Add regression test if non-trivial
```

### Documentation task

```text
1. Match existing doc header format (Version, Status, Owner)
2. Cross-link related documents
3. No TODO or placeholder sections
4. Update DOCS_INDEX if adding new files
```

---

## What Cursor Must Not Do

| Forbidden | Reason |
|-----------|--------|
| Invent undocumented API endpoints | API_ARCHITECTURE ownership |
| Add Prisma models not in PRISMA_SCHEMA.md | Schema is spec-first |
| Use `any` in TypeScript | CODING_STANDARDS |
| Duplicate UI components | COMPONENT_LIBRARY |
| Skip docs when changing behavior | Single source of truth |
| Commit without user request | Git safety protocol |
| Assume payment/billing APIs | Not yet specified |
| Create ADMIN_API paths | ADMIN_API.yaml pending |

When documentation is insufficient, **ask the user**—do not guess.

---

## Communication

| Audience | Language |
|----------|----------|
| User messages | Turkish |
| Code, identifiers, commits | English |
| Documentation | English |

Technical terms (`TanStack Query`, `JWT`, `OpenAPI`) remain English in Turkish prose.

---

## Monorepo Commands Reference

```bash
# Install
pnpm install

# Dev (filter by app)
pnpm --filter mobile dev
pnpm --filter web dev
pnpm --filter backend dev

# Quality (affected since main)
pnpm turbo run lint typecheck test --filter=...[origin/main]

# OpenAPI
python docs/08_API/bundle_openapi.py
pnpm --filter @gmrlog/api generate

# Database
pnpm --filter @gmrlog/database prisma migrate dev
```

---

## Agent Skills (Optional)

Cursor skills in `~/.cursor/skills-cursor/` extend agent behavior for specialized tasks:

| Skill | Use when |
|-------|----------|
| `create-rule` | Adding `.cursor/rules/` |
| `create-skill` | Authoring new skills |
| `review-bugbot` | PR review via Bugbot subagent |
| `review-security` | Security review subagent |
| `split-to-prs` | Splitting large changes |

Skills are invoked by task relevance—not loaded on every session.

---

## Subagents

For broad exploration, parent agents may delegate to `explore` subagents. Subagents inherit the same docs-first rules.

Subagents must not spawn further subagents unless explicitly instructed.

---

## Quality Checklist (Agent Self-Review)

Before completing a task:

- [ ] Read relevant `/docs` files
- [ ] Code matches CODING_STANDARDS and naming rules
- [ ] No `any`; strict TypeScript
- [ ] Uses `@gmrlog/*` imports correctly
- [ ] Reuses existing components and services
- [ ] API changes reflected in OpenAPI YAML
- [ ] Docs updated if spec changed
- [ ] Lint/typecheck considered for touched packages
- [ ] User communicated in Turkish

---

## Keeping Docs and Cursor Aligned

When architecture changes:

1. Update the canonical doc first (or in the same PR as code)
2. Update `.cursor/rules/` if persistent agent behavior should change
3. Update `DOCS_INDEX.md` coverage table if files added/removed
4. Reference new docs in README documentation structure

---

## Acceptance Criteria

- Any engineer can onboard Cursor using this doc + README alone.
- Rules and docs never contradict on core principles.
- AI sessions reference specific doc paths when making decisions.
- Doc gaps result in user questions, not silent invention.

---

## Related Documents

- [README.md](../../README.md)
- [DOCS_INDEX.md](../DOCS_INDEX.md)
- [CONTRIBUTING.md](../00_PROJECT/CONTRIBUTING.md)
- [CODING_STANDARDS.md](../00_PROJECT/CODING_STANDARDS.md)
- `.cursor/rules/project-context.mdc`

---

## Revision History

| Version | Date | Change |
|---------|------|--------|
| 1.0.0 Alpha | 2026-07-10 | Initial release |
