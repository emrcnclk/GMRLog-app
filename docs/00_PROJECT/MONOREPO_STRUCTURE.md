# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/00_PROJECT/MONOREPO_STRUCTURE.md`

**Status:** Approved

**Owner:** Platform Team

**Classification:** Internal Engineering Documentation

---

# Monorepo Structure

## Purpose

This document defines the official repository architecture of GMRLOG.

The project is built as a **pnpm Workspace + Turborepo Monorepo** to enable scalable development, code sharing, faster builds, and independent deployment of applications and packages.

The repository must remain organized, modular, and easy to maintain as the engineering team grows.

---

# Monorepo Goals

The monorepo must provide:

* Shared code between Mobile, Web, and Backend
* Unified dependency management
* Incremental builds
* Shared TypeScript types
* Shared Design System
* Shared API client
* Shared ESLint & Prettier configuration
* Shared Environment configuration
* Faster CI/CD
* Easier onboarding

---

# Technology Stack

Package Manager

```text
pnpm
```

Monorepo Engine

```text
Turborepo
```

Runtime

```text
Node.js 22 LTS
```

Language

```text
TypeScript
```

---

# Repository Structure

```text
gmrlog/

├── apps/
│
│   ├── mobile/
│   ├── web/
│   ├── backend/
│   ├── admin/
│   └── docs/
│
├── packages/
│
│   ├── ui/
│   ├── design-tokens/
│   ├── api/
│   ├── auth/
│   ├── database/
│   ├── websocket/
│   ├── analytics/
│   ├── storage/
│   ├── config/
│   ├── eslint-config/
│   ├── prettier-config/
│   ├── tsconfig/
│   ├── types/
│   ├── utils/
│   ├── constants/
│   ├── hooks/
│   ├── validators/
│   ├── localization/
│   ├── icons/
│   └── testing/
│
├── infrastructure/
│
│   ├── docker/
│   ├── nginx/
│   ├── kubernetes/
│   ├── terraform/
│   └── monitoring/
│
├── scripts/
│
├── docs/
│
├── .github/
│
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── README.md
└── .env.example
```

---

# Applications

## apps/mobile

React Native

Expo

Primary platform.

---

## apps/web

Next.js

Marketing Website

Future Web Client

SEO Pages

Landing Page

---

## apps/backend

NestJS

REST API

Socket.IO

BullMQ

Prisma

---

## apps/admin

Internal moderation dashboard.

Admin only.

---

## apps/docs

Documentation website.

Generated using Docusaurus.

---

# Shared Packages

## ui

Contains:

Reusable Components

Buttons

Cards

Inputs

Dialogs

Sheets

Navigation

Icons

Animations

---

## design-tokens

Contains:

Colors

Typography

Spacing

Elevation

Motion

Radius

Opacity

---

## api

Shared API SDK.

Generated from OpenAPI.

Shared between:

Mobile

Web

Admin

---

## auth

Authentication logic.

JWT

OAuth

Session Helpers

Token Refresh

Permission Helpers

---

## database

Prisma

Generated Types

Repositories

Database Utilities

---

## websocket

Socket Events

Realtime Hooks

Connection Helpers

Presence

---

## analytics

Analytics SDK

Events

Tracking

Experiments

Feature Flags

---

## storage

File Upload

S3 Helpers

Image Compression

CDN Helpers

---

## config

Environment Loader

Runtime Config

Feature Flags

Build Config

---

## types

Shared TypeScript types.

No business logic.

---

## validators

Zod Schemas

DTO Validation

Reusable Validators

---

## hooks

Shared React Hooks.

---

## utils

Pure helper functions.

---

## constants

Application constants.

Enums.

Route names.

Feature IDs.

---

## localization

Translations.

Date formatting.

Localization helpers.

---

## icons

Lucide

Custom SVGs

Brand Icons

Game Platform Icons

---

## testing

Testing utilities.

Mock Server.

Fixtures.

Factories.

---

# Dependency Rules

Applications may depend on packages.

Packages may depend on lower-level packages.

Packages must never depend on applications.

Example

```text
apps/mobile

↓

packages/ui

↓

packages/design-tokens

↓

packages/types
```

Valid.

---

Invalid

```text
packages/ui

↓

apps/mobile
```

Never allowed.

---

# Import Rules

Always use aliases.

Example

```text
@gmrlog/ui

@gmrlog/types

@gmrlog/api

@gmrlog/utils
```

Never use long relative imports.

---

# Build Pipeline

```text
Lint

↓

Type Check

↓

Unit Tests

↓

Build Packages

↓

Build Applications

↓

Integration Tests

↓

Deployment
```

---

# Turbo Pipeline

Tasks

lint

typecheck

test

build

dev

format

storybook

docs

Depends On

Previous package builds.

Incremental cache enabled.

---

# Environment Variables

Global

```text
NODE_ENV

APP_ENV

LOG_LEVEL
```

Backend

```text
DATABASE_URL

JWT_SECRET

REDIS_URL

S3_BUCKET
```

Frontend

```text
EXPO_PUBLIC_API_URL

EXPO_PUBLIC_SOCKET_URL

EXPO_PUBLIC_ANALYTICS_KEY
```

---

# Shared Configuration

ESLint

Shared

Prettier

Shared

TypeScript

Shared

Commitlint

Shared

Husky

Shared

---

# Branch Strategy

```text
main

develop

feature/*

release/*

hotfix/*
```

---

# Versioning

Semantic Versioning

Major

Minor

Patch

Packages released independently when required.

---

# CI/CD Integration

Turborepo Remote Cache

Parallel Builds

Incremental Builds

GitHub Actions

Docker Images

Preview Deployments

---

# Docker Structure

```text
docker/

backend/

postgres/

redis/

nginx/

monitoring/
```

---

# Code Ownership

Frontend Team

apps/mobile

apps/web

packages/ui

Backend Team

apps/backend

packages/database

packages/auth

Platform Team

Infrastructure

CI/CD

DevOps

Documentation

---

# Testing Strategy

Each package owns its tests.

Applications own integration tests.

Shared testing utilities reside in:

```text
packages/testing
```

---

# Performance Targets

Cold Build

<5 Minutes

Incremental Build

<30 Seconds

Lint

<20 Seconds

Type Check

<40 Seconds

Unit Tests

<2 Minutes

---

# Scalability

Supports future applications:

Desktop

CLI

Public SDK

Browser Extension

Apple Vision Pro

watchOS

WearOS

Console Companion

---

# Acceptance Criteria

This document is complete when:

* Repository structure is standardized.
* Shared packages are defined.
* Dependency rules are documented.
* Import conventions are established.
* Build pipeline is documented.
* CI/CD integration is specified.

---

# Dependencies

* FRONTEND_ARCHITECTURE.md
* BACKEND_ARCHITECTURE.md
* SYSTEM_ARCHITECTURE.md

---

# Related Documents

* CODING_STANDARDS.md
* CI_CD.md
* DEPLOYMENT.md
* CONTRIBUTING.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
