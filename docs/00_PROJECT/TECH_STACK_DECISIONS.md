# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/00_PROJECT/TECH_STACK_DECISIONS.md`

**Status:** Approved

**Owner:** Architecture Team

**Classification:** Internal Engineering Documentation

---

# Technical Stack Decisions

## Purpose

This document defines the official technology stack for the GMRLOG platform.

Every repository, package, service, API, mobile application, web application, and infrastructure component must follow this specification.

Technology choices may only change through an approved Architecture Decision Record (ADR).

---

# Engineering Philosophy

Technology is selected based on five priorities.

1. Scalability
2. Developer Experience
3. Performance
4. Maintainability
5. Long-Term Stability

New technologies should never be adopted because they are trending.

Every dependency must solve a measurable engineering problem.

---

# High-Level Architecture

```text
                     Cloudflare
                          │
                 Load Balancer / CDN
                          │
                  ┌───────────────┐
                  │ API Gateway   │
                  └───────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     Auth Service    Core API      Realtime Gateway
          │               │               │
          └───────────────┼───────────────┘
                          │
                    PostgreSQL
                          │
               Redis + BullMQ + Cache
                          │
            Object Storage (Cloudflare R2/S3)
```

---

# Monorepo

Repository Strategy

**pnpm Workspace + Turborepo**

Reasons

* Fast builds
* Shared packages
* Shared types
* Shared UI
* Shared ESLint
* Shared Config
* Better CI/CD
* Easier versioning

Repository Layout

```text
apps/
packages/
docs/
scripts/
docker/
.cursor/
.github/
```

---

# Mobile Application

Framework

**Expo SDK (Latest Stable)**

Reasons

* OTA Updates
* Mature ecosystem
* Excellent DX
* Native APIs
* Expo Router
* Easier deployment

Language

TypeScript

Navigation

Expo Router

Animations

React Native Reanimated

Gestures

Gesture Handler

Lists

FlashList

Image Handling

Expo Image

Graphics

React Native Skia

Storage

MMKV

Data Fetching

TanStack Query

Forms

React Hook Form

Validation

Zod

Global State

Zustand

Styling

NativeWind v5

Icons

Lucide Icons

---

# Web Application

Framework

Next.js (Latest)

Reasons

* App Router
* SSR
* SEO
* React Server Components
* Excellent performance

Language

TypeScript

Styling

Tailwind CSS

Component Library

shadcn/ui

State

Zustand

Data

TanStack Query

Forms

React Hook Form

Validation

Zod

---

# Backend

Framework

NestJS

HTTP Engine

Fastify

Reasons

* Modular architecture
* Excellent dependency injection
* Enterprise scalability
* Swagger integration
* Validation pipeline
* Guards
* Interceptors
* WebSocket support

---

# ORM

Prisma

Reasons

* Type Safety
* Excellent migrations
* Generated client
* Strong PostgreSQL support
* Great DX

---

# Database

Primary

PostgreSQL

Reasons

* ACID compliance
* Powerful indexing
* JSON support
* Full-text search
* Partitioning
* Extensions
* Mature ecosystem

Future Scaling

Read Replicas

Partitioning

Connection Pooling

Logical Replication

---

# Cache

Redis

Uses

Authentication

Sessions

Feed Cache

Trending Cache

Recommendations

Rate Limiting

Notifications

Realtime Presence

---

# Queue

BullMQ

Uses

Push Notifications

Email Jobs

Image Processing

Recommendation Updates

Feed Fanout

Background Tasks

Analytics

Scheduled Jobs

---

# Object Storage

Production

Cloudflare R2

Fallback

AWS S3

Development

MinIO

Stored Objects

Game Covers

Avatars

Banners

Videos

Screenshots

Attachments

Developer Assets

---

# Search

Meilisearch

Indexes

Games

Users

Developers

Studios

Reviews

Posts

Collections

Tier Lists

Reasons

* Extremely fast
* Typo tolerance
* Easy indexing
* Lightweight

---

# Authentication

JWT Access Token

JWT Refresh Token

OAuth Providers

Google

Steam

Discord

Apple

Email

Future

Passkeys

Magic Links

Two Factor Authentication

---

# Real-Time

Socket.IO

Responsible For

Messaging

Typing Indicators

Notifications

Presence

Feed Updates

Friend Requests

Live Comments

---

# Notifications

Push

Expo Push

Firebase Cloud Messaging

Apple Push Notification Service

In-App

Database-driven notification center

Email

Resend

---

# API

Architecture

REST

Documentation

OpenAPI

Swagger

Versioning

/api/v1

Future

GraphQL Gateway

---

# Validation

Library

Zod

Backend

Nest Validation Pipe

Frontend

Shared validation schemas

---

# Shared Packages

packages/ui

Reusable UI components

packages/types

Shared interfaces

packages/api

Generated API client

packages/database

Prisma

packages/config

Shared configs

packages/utils

Utilities

packages/design-tokens

Colors

Typography

Spacing

Radius

Shadows

---

# Analytics

PostHog

Internal Dashboard

Custom Analytics Service

Tracked Events

Authentication

Feed

Reviews

Messages

Discovery

Search

Notifications

Premium

---

# Crash Reporting

Sentry

Tracks

Frontend

Backend

Performance

Errors

Releases

---

# Monitoring

Prometheus

Grafana

Loki

Health Checks

Metrics

Logging

Tracing

---

# Infrastructure

Containerization

Docker

Orchestration

Docker Compose (Development)

Kubernetes (Future)

Reverse Proxy

Nginx

CDN

Cloudflare

DNS

Cloudflare

SSL

Cloudflare

---

# CI/CD

GitHub Actions

Pipelines

Lint

Tests

Build

Docker

Preview Deployments

Production Deployments

Database Migrations

---

# Code Quality

ESLint

Prettier

Husky

lint-staged

Commitlint

Conventional Commits

---

# Testing

Unit

Vitest

Backend

Jest

Mobile

React Native Testing Library

Web

Testing Library

E2E

Playwright

API

Supertest

Performance

k6

---

# Security

Helmet

Rate Limiting

CORS

CSRF Protection

Secure Cookies

HTTPOnly Cookies

Input Sanitization

SQL Injection Protection

XSS Protection

CSP Headers

Encrypted Secrets

Environment Isolation

Audit Logs

---

# Localization

Default Language

English

Supported Languages (Launch)

English

Turkish

Spanish

German

French

Japanese

Korean

Portuguese

Future

Community Translation Platform

---

# Accessibility

WCAG AA Compliance

Screen Reader Support

Keyboard Navigation (Web)

Reduced Motion

Dynamic Font Scaling

Color Contrast Validation

Accessible Forms

---

# Versioning Policy

Node.js LTS only

Latest stable Expo SDK

Latest stable Next.js

Latest stable NestJS

Quarterly dependency review

Major upgrades require ADR approval

---

# Technology Adoption Policy

Before adding a new dependency, answer:

* Does it solve a real problem?
* Is it actively maintained?
* Does it reduce complexity?
* Can existing tools solve the same problem?
* Is the community mature?
* Does it improve developer experience?

If the answer is "No" to any of these, do not adopt the dependency.

---

# Acceptance Criteria

This document is complete when:

* Every layer of the architecture has an approved technology.
* Every dependency has a documented purpose.
* Every future engineer can bootstrap the project using this document alone.
* Technology decisions remain consistent across all repositories.

---

# Related Documents

* README.md
* PROJECT_CHARTER.md
* PROJECT_SCOPE.md
* SYSTEM_ARCHITECTURE.md
* DATABASE_SPECIFICATION.md
* FRONTEND_ARCHITECTURE.md
* BACKEND_ARCHITECTURE.md
* DEVOPS_ARCHITECTURE.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
