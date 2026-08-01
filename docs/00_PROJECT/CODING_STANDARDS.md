# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/00_PROJECT/CODING_STANDARDS.md`

**Status:** Approved

**Owner:** Engineering Team

**Classification:** Internal Engineering Documentation

---

# Coding Standards

## Purpose

This document defines the official engineering standards for every line of code written in the GMRLOG project.

Its purpose is to ensure that all applications, packages, and services remain consistent, readable, scalable, maintainable, and production-ready.

Every contributor, including AI coding assistants (Cursor, Claude Code, GitHub Copilot, Gemini, etc.), must strictly follow these standards.

---

# Engineering Philosophy

Code should prioritize:

* Readability over cleverness
* Simplicity over complexity
* Composition over inheritance
* Explicitness over magic
* Type safety over flexibility
* Maintainability over short-term speed

If a piece of code requires explanation, it should probably be rewritten.

---

# General Principles

Every piece of code must follow:

* SOLID Principles
* DRY (Don't Repeat Yourself)
* KISS (Keep It Simple)
* YAGNI (You Aren't Gonna Need It)
* Clean Code
* Clean Architecture
* Domain Driven Design (DDD)

---

# Language Standards

Backend

TypeScript

Frontend

TypeScript

Strict Mode

Enabled

JavaScript files are not allowed.

---

# TypeScript Rules

Always

```typescript
strict: true
```

Enabled.

Never use

```typescript
any
```

Instead use

* unknown
* generics
* interfaces
* union types

---

Prefer

```typescript
interface
```

over

```typescript
type
```

unless union types are required.

---

# File Naming

Use:

```text
kebab-case.ts
```

Examples

```text
game-card.tsx

feed-service.ts

review.repository.ts

notification.dto.ts
```

---

# Folder Naming

Always

```text
kebab-case
```

Examples

```text
game-details

review-editor

developer-dashboard
```

---

# Component Naming

React Components

PascalCase

```text
GameCard

ProfileHeader

ReviewEditor

TierListBuilder
```

---

# Variable Naming

camelCase

Good

```typescript
const currentUser
const currentGame
const reviewCount
```

Bad

```typescript
const data
const item
const temp
const test
```

Variable names must describe intent.

---

# Constants

SCREAMING_SNAKE_CASE

```typescript
MAX_REVIEW_LENGTH

DEFAULT_PAGE_SIZE

CACHE_DURATION
```

---

# Boolean Naming

Always begin with

is

has

can

should

Examples

```typescript
isLoggedIn

hasPremium

canComment

shouldRefresh
```

---

# Function Naming

Verb First

Examples

```typescript
createReview()

fetchGames()

updateProfile()

deleteCollection()

calculateScore()

sendNotification()
```

Avoid

```typescript
doStuff()

run()

execute()

process()
```

---

# React Standards

Components must be:

Small

Reusable

Pure whenever possible

One responsibility

No business logic inside UI.

---

Maximum component length

250 lines

Split if exceeded.

---

# Hook Standards

Custom hooks begin with

```text
use
```

Examples

```typescript
useFeed()

useAuthentication()

useInfiniteGames()

useFriendRequests()
```

---

# Props

Always use interfaces.

Example

```typescript
interface GameCardProps {

game: Game

onPress(): void

}
```

---

# State Management

Server State

TanStack Query

Global State

Zustand

Component State

useState

Never duplicate server state.

---

# API Calls

Components never call Axios.

Flow

```text
Component

↓

Hook

↓

API Service

↓

Axios

↓

Backend
```

---

# Backend Standards

Controllers

↓

Services

↓

Repositories

↓

Prisma

Never bypass layers.

---

Controllers

Only:

Validation

Routing

Authentication

Response

---

Services

Contain

Business Logic

Permissions

Transactions

Events

---

Repositories

Only database operations.

---

# DTO Rules

Every endpoint has

Request DTO

Response DTO

Validation

Swagger Types

---

# Validation

Frontend

Zod

Backend

class-validator

Never trust client input.

---

# Error Handling

Never expose

Database errors

Stack traces

Internal exceptions

Always return standardized API errors.

---

# Logging

Use structured logs.

Every log contains

Timestamp

Request ID

User ID

Route

Latency

Log Levels

TRACE

DEBUG

INFO

WARN

ERROR

FATAL

Never use console.log() in production.

---

# Comments

Avoid unnecessary comments.

Good code should explain itself.

Comment only:

Complex algorithms

Business rules

Security decisions

Performance optimizations

---

# Imports

Import order

1 External libraries

2 Internal packages

3 Components

4 Hooks

5 Utils

6 Types

7 Styles

---

No circular imports.

---

# Formatting

ESLint

Prettier

Husky

Lint-Staged

Required.

---

# Git Commits

Conventional Commits

Examples

```text
feat:

fix:

refactor:

perf:

style:

docs:

test:

build:

ci:

chore:
```

---

# Branch Naming

```text
feature/feed

feature/profile

fix/login

hotfix/oauth

release/v1.0
```

---

# Pull Requests

Every PR requires

Passing CI

Description

Screenshots (UI)

Linked Issue

Reviewer Approval

---

# Testing

Required

Unit Tests

Integration Tests

E2E Tests

Accessibility Tests

Visual Regression

Target coverage

90%

---

# Security Rules

Never hardcode

Passwords

Secrets

Tokens

Keys

Environment variables only.

---

# Performance

Avoid unnecessary renders.

Use memoization only when needed.

Lazy load heavy components.

Paginate all large datasets.

Never fetch unnecessary fields.

---

# Accessibility

Every interactive component must support

Keyboard

Screen Readers

Focus States

Reduced Motion

High Contrast

Semantic Labels

---

# Documentation

Every exported function requires JSDoc.

Public APIs must be documented.

Architecture changes require documentation updates.

---

# AI Coding Rules

When AI tools generate code they must

Follow folder structure

Respect architecture

Use existing design system

Avoid duplicate components

Reuse shared packages

Generate tests

Generate types

Generate documentation

Never invent APIs not defined in API_SPECIFICATION.md.

---

# Forbidden Practices

❌ any

❌ console.log in production

❌ Business logic in components

❌ Direct database access from controllers

❌ Copy-paste implementations

❌ Inline styles

❌ Magic numbers

❌ Circular dependencies

❌ Hardcoded URLs

❌ Hardcoded colors

❌ Hardcoded spacing

❌ Ignoring TypeScript errors

---

# Code Review Checklist

Before merge verify

✓ Naming conventions

✓ Tests pass

✓ Lint passes

✓ Types pass

✓ Documentation updated

✓ No duplicated logic

✓ Accessibility verified

✓ Performance acceptable

✓ Security reviewed

---

# Acceptance Criteria

This document is complete when:

* Engineering principles are defined.
* TypeScript standards are documented.
* Frontend and backend rules are standardized.
* Git workflow is established.
* Testing requirements are defined.
* AI code generation rules are documented.

---

# Dependencies

* FRONTEND_ARCHITECTURE.md
* BACKEND_ARCHITECTURE.md
* API_SPECIFICATION.md

---

# Related Documents

* CONTRIBUTING.md
* CI_CD.md
* MONOREPO_STRUCTURE.md
* SECURITY.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
