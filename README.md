# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** README.md

**Status:** Draft

**Owner:** GMRLOG Core Team

**Classification:** Internal Engineering Documentation

---

# Permanent direction

**North Star (LOCKED):** [`docs/00_PROJECT/NORTH_STAR.md`](docs/00_PROJECT/NORTH_STAR.md)

Roadmaps and tech may change. The North Star does not. Every feature must pass the North Star Question before it is built.

---

# GMRLOG Operating Specification (GMRLOG OS)

> **Every Game Has A Story. Every Player Has A Journey.**

GMRLOG is a premium gaming-focused social platform designed to become the definitive home for gamers worldwide.

It combines the best concepts of social networking, game discovery, personal game tracking, community discussion, and developer interaction into one ecosystem.

Unlike existing platforms, GMRLOG is not a launcher, not a marketplace, and not merely another review website.

Its primary purpose is to become every player's gaming identity.

---

# Vision

Create the world's most beautiful and engaging social platform dedicated exclusively to video games.

When someone wants to share what they are playing, discover new games, discuss a recent release, publish a review, build a tier list, or simply express their gaming identity, GMRLOG should be the first application they open.

---

# Mission

Build a platform where every game becomes a conversation and every player has a place to belong.

---

# Product Philosophy

Games are not products.

Games are experiences.

GMRLOG exists to preserve those experiences.

Instead of simply showing ratings or reviews, GMRLOG captures an individual's complete gaming journey.

The platform should encourage thoughtful discussion, creativity, community participation, discovery, and long-term engagement.

---

# Product Pillars

## Gaming Identity

Profiles should represent who someone is as a gamer rather than acting as a simple social media account.

Profiles must communicate:

- Gaming taste
- Favorite genres
- Favorite franchises
- Completed games
- Current games
- Gaming history
- Platforms
- Achievements
- Collections
- Tier Lists
- Reviews
- Friends
- Community reputation

A profile should immediately answer one question:

> "What kind of gamer is this person?"

---

## Discovery

Users should constantly discover:

- New games
- Hidden gems
- Indie games
- Friends
- Communities
- Reviews
- Collections
- Developers
- Events
- Demos
- Gaming discussions

Discovery should happen naturally without requiring active searching.

---

## Community

Every feature must encourage interaction.

The platform should reward quality discussions rather than low-effort engagement.

Communities should form around games rather than trends.

---

## Creativity

Users should have many ways to express themselves.

Examples include:

- Reviews
- Gaming Logs
- Screenshots
- Clips
- Tier Lists
- Collections
- Custom Lists
- Game Diaries
- Polls
- Long-form Articles

---

## Trust

Every important system should prioritize authenticity.

Examples:

Verified Developers

Verified Critics

Verified Creators

Verified Studios

Verified Events

Spam-resistant reputation system

Transparent moderation

---

# Target Audience

Primary Audience

18–35-year-old gamers who actively engage with gaming communities.

Secondary Audience

Indie game developers and studios seeking direct communication with players.

Tertiary Audience

Content creators, journalists, reviewers, esports enthusiasts, collectors, achievement hunters, speedrunners, and gaming clubs.

---

# Product Positioning

GMRLOG is **not** competing with Steam.

GMRLOG is **not** competing with Discord.

GMRLOG is **not** competing with Reddit.

GMRLOG is **not** competing with Letterboxd.

Instead, GMRLOG connects the strengths of these platforms into a unified ecosystem centered on player identity and meaningful interaction.

---

# Core Experience

Every action on GMRLOG should answer one of four questions:

## What am I playing?

Current Games

Recently Played

Play Sessions

Gaming Calendar

---

## What do I think?

Reviews

Ratings

Logs

Journal Entries

Tier Lists

Articles

---

## What should I play next?

Recommendations

Friends

Trending Games

Upcoming Releases

Developer Highlights

Community Lists

---

## Who am I as a gamer?

Gaming DNA

Statistics

Favorite Games

Favorite Genres

Achievements

Collections

Gaming Timeline

Profile Reputation

---

# Design Philosophy

The interface must feel:

Premium

Modern

Elegant

Responsive

Minimal without being empty

Expressive without being overwhelming

Motion-rich without distracting the user

Every animation should have purpose.

Every interaction should provide feedback.

Every screen should feel alive.

---

# Design Inspirations

The visual language should take inspiration from:

- Apple Human Interface Guidelines
- PlayStation 5 UI
- Steam Deck UI
- Arc Browser
- Linear
- Riot Games
- Nothing OS
- Supercell
- Nintendo Switch
- Spotify

The final product must establish its own recognizable visual identity.

---

# Technical Philosophy

The codebase must prioritize:

Scalability

Maintainability

Performance

Developer Experience

Accessibility

Testability

Consistency

Modularity

Reusability

Security

No implementation decision should optimize for short-term speed at the cost of long-term maintainability.

---

# Engineering Principles

Every feature should satisfy the following requirements:

- Fully typed
- Production ready
- Documented
- Tested
- Accessible
- Responsive
- Reusable
- Performant
- Observable
- Secure

---

# Single Source of Truth

All engineering decisions originate from the documentation contained in the `/docs` directory.

Generated code must never contradict documented specifications.

If a conflict exists:

Documentation takes priority.

---

# Documentation Structure

The repository is divided into independent documentation domains.

```text
docs/

00_PROJECT/

01_PRODUCT/

02_DESIGN/   ← UI/UX/frontend SSOT: MASTER_PRODUCT_AND_DESIGN_DIRECTION.md (LOCKED)

03_UX/

04_COMPONENTS/

05_FRONTEND/

06_BACKEND/

07_DATABASE/

08_API/

09_AI/

10_DEVOPS/

11_SECURITY/

12_TESTING/

13_ANALYTICS/

14_MONETIZATION/

15_ADMIN/

16_CURSOR/
```

Each directory represents a major engineering discipline.

---

# Documentation Standards

Every document must contain:

- Purpose
- Scope
- Definitions
- Goals
- Requirements
- Dependencies
- Technical Decisions
- UX Decisions
- Edge Cases
- Accessibility
- Security
- Performance
- Acceptance Criteria
- Future Considerations
- Related Documents
- Revision History

No document should rely on undocumented assumptions.

---

# Cursor Integration

Cursor is expected to consume the documentation as the authoritative specification.

Before generating code, Cursor must:

1. Read all related documentation.
2. Follow the documented architecture.
3. Reuse documented components.
4. Respect naming conventions.
5. Respect design tokens.
6. Never invent undocumented APIs.
7. Never invent undocumented database tables.
8. Never violate architectural boundaries.
9. Generate production-ready code only.
10. Prefer composition over duplication.

---

# Repository Structure

D1.1.1 repository bootstrap + D1.2 backend + D1.3 frontend foundation (current):

```text
gmrlog/
├── apps/
│   ├── frontend/          # @gmrlog/frontend — Expo Router shell (D1.3)
│   └── backend/           # @gmrlog/backend — NestJS + Fastify (D1.2)
├── packages/
│   ├── api-sdk/           # @gmrlog/api-sdk
│   ├── ui/                # @gmrlog/ui (ThemeProvider + semantic tokens)
│   ├── types/             # @gmrlog/types
│   ├── validators/        # @gmrlog/validators
│   ├── config/            # @gmrlog/config
│   └── database/          # @gmrlog/database (Prisma bootstrap)
├── tooling/
│   ├── typescript-config/
│   ├── eslint-config/
│   └── prettier-config/
├── docs/
├── .github/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

Import aliases use the `@gmrlog/*` scope. Full long-term inventory remains documented in [`docs/00_PROJECT/MONOREPO_STRUCTURE.md`](docs/00_PROJECT/MONOREPO_STRUCTURE.md); packages and apps beyond this skeleton arrive in later D1 tasks. Route groups follow F6.2 / S3 (`(gate)` · `(tabs)` · `(shared)` · …), not informal aliases.

---

# Getting Started (engineering)

Requirements: **Node.js 22 LTS**, **pnpm 9**.

```bash
pnpm install
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

Copy `.env.example` to `.env` for local shared runtime keys. App-specific examples live under `apps/*/.env.example`.

---

# Development Workflow

Every feature follows the same lifecycle:

1. Product Requirement
2. UX Specification
3. UI Specification
4. Component Design
5. Database Design
6. API Design
7. Backend Implementation
8. Frontend Implementation
9. Testing
10. QA
11. Release
12. Monitoring
13. Iteration

No implementation begins without documentation approval.

---

# Quality Standards

Every feature must satisfy:

- Functional correctness
- Visual consistency
- Accessibility compliance
- Responsive behavior
- Offline resilience
- Error recovery
- Performance targets
- Security review
- Analytics instrumentation

---

# Long-Term Vision

GMRLOG is designed as a multi-year platform.

Every architectural decision should support:

- Millions of users
- Hundreds of millions of game logs
- Large-scale social graphs
- Real-time messaging
- Rich media
- AI-powered recommendations
- Cross-platform experiences
- Community moderation
- Global expansion

---

# Guiding Principle

> Every player deserves a place where their gaming story can be remembered, shared, and celebrated.

GMRLOG exists to become that place.

---

# Related Documents

- [docs/DOCS_INDEX.md](docs/DOCS_INDEX.md) — Full documentation registry
- `docs/00_PROJECT/PROJECT_CHARTER.md`
- `docs/00_PROJECT/PROJECT_SCOPE.md`
- `docs/00_PROJECT/SUCCESS_METRICS.md`
- `docs/00_PROJECT/TECH_STACK_DECISIONS.md`
- `docs/01_PRODUCT/PRODUCT_VISION.md`

---

# Document Status

**Status:** Active

**Version:** 1.0.0 Alpha

This document is the entry point to the complete GMRLOG Operating Specification and must be read before any implementation work begins.
