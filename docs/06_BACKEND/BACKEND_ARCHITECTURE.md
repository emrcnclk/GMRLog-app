# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/06_BACKEND/BACKEND_ARCHITECTURE.md`

**Status:** Approved

**Owner:** Backend Team

**Classification:** Internal Engineering Documentation

---

# Backend Architecture

## Purpose

This document defines the backend architecture of GMRLOG.

It describes the overall server-side system, coding standards, infrastructure, scalability strategy, communication patterns, and service boundaries.

The backend is designed to support millions of users, high traffic, real-time communication, and future microservice migration without requiring major architectural changes.

---

# Technology Stack

## Runtime

Node.js 22 LTS

---

## Language

TypeScript

Strict Mode Enabled

---

## Framework

NestJS

Modular Architecture

Dependency Injection

Decorator-based Routing

---

## Database

PostgreSQL 17

Prisma ORM

Redis Cache

---

## Storage

AWS S3

Cloudflare R2 (Alternative)

Image Optimization Service

---

## Authentication

JWT

OAuth2

Google OAuth

Steam OAuth

Discord OAuth

Apple Sign In

Refresh Tokens

---

## Realtime

Socket.IO

Redis Adapter

WebSockets

---

## Search

PostgreSQL Full Text Search

Trigram Search

Future Elasticsearch Support

---

## Queue

BullMQ

Redis

Background Jobs

---

## Monitoring

OpenTelemetry

Prometheus

Grafana

Sentry

---

# Architecture Philosophy

The backend follows:

* Domain Driven Design (DDD)
* Clean Architecture
* SOLID Principles
* Repository Pattern
* Dependency Injection
* Event Driven Communication

Business logic must never exist inside controllers.

---

# High-Level Architecture

```text
                        Clients
                           │
          ┌────────────────────────────────┐
          │                                │
   Mobile App                      Web Application
          │                                │
          └──────────────┬─────────────────┘
                         │
                   API Gateway
                         │
──────────────────────────────────────────────────
                         │
              Authentication Middleware
                         │
──────────────────────────────────────────────────
                         │
                Route Controllers
                         │
──────────────────────────────────────────────────
                         │
                    Services Layer
                         │
──────────────────────────────────────────────────
                         │
                Domain Layer (DDD)
                         │
──────────────────────────────────────────────────
                         │
              Repository Layer (Prisma)
                         │
──────────────────────────────────────────────────
                         │
                  PostgreSQL Database
```

---

# Folder Structure

```text
backend/

src/

├── app/

├── auth/

├── users/

├── games/

├── reviews/

├── logs/

├── posts/

├── comments/

├── collections/

├── tierlists/

├── developers/

├── studios/

├── messages/

├── notifications/

├── search/

├── analytics/

├── moderation/

├── admin/

├── shared/

├── config/

├── websocket/

├── middleware/

├── guards/

├── interceptors/

├── decorators/

├── filters/

├── cache/

├── queue/

├── storage/

└── utils/
```

---

# Module Structure

Each feature follows identical architecture.

```text
games/

controllers/

services/

repositories/

dto/

entities/

interfaces/

types/

validators/

events/

jobs/

tests/

games.module.ts
```

Every domain is completely isolated.

---

# Request Lifecycle

```text
Client

↓

Load Balancer

↓

API Gateway

↓

Rate Limiter

↓

Authentication

↓

Authorization

↓

Validation

↓

Controller

↓

Service

↓

Repository

↓

Prisma

↓

Database

↓

Response Mapper

↓

Client
```

---

# Layer Responsibilities

## Controller

Responsibilities

* Receive request
* Validate request
* Call service
* Return response

Controllers never contain business logic.

---

## Service

Responsibilities

Business Rules

Permission Checks

Transaction Handling

Domain Events

Cache Management

---

## Repository

Responsibilities

Database Queries

Pagination

Filtering

Sorting

Mapping

Repositories never contain business rules.

---

## DTO Layer

Handles

Validation

Transformation

Serialization

Swagger Types

---

## Entity Layer

Represents business models.

Never expose database models directly.

---

# Authentication Flow

```text
User Login

↓

OAuth / Email

↓

JWT Generated

↓

Refresh Token Stored

↓

Access Token Returned

↓

Authenticated Requests

↓

Token Refresh

↓

Logout
```

---

# Authorization

Supported Roles

Guest

User

Premium

Developer

Verified Studio

Moderator

Administrator

Super Admin

Role Guards protect all restricted endpoints.

---

# Event System

Domain events include:

UserRegistered

GameLogged

ReviewCreated

PostPublished

CommentCreated

FriendAccepted

NotificationCreated

AchievementUnlocked

Events trigger asynchronous processing.

---

# Background Jobs

BullMQ Workers handle:

Email Sending

Push Notifications

Image Processing

Thumbnail Generation

Recommendation Updates

Trending Calculation

Search Index Updates

Analytics Aggregation

Weekly Reports

Database Cleanup

---

# Caching Strategy

Redis caches:

Trending Games

Popular Reviews

Home Feed

User Profiles

Developer Profiles

Studio Profiles

Collections

Tier Lists

Search Suggestions

TTL varies by resource.

---

# Storage Strategy

Images

AWS S3

Game Covers

Cloud Storage

Review Images

Cloud Storage

Avatars

Cloud Storage

Videos

External CDN

Future

Cloudflare Images

---

# API Validation

Validation handled using:

Class Validator

Class Transformer

Global Validation Pipe

Unknown fields rejected.

---

# Error Handling

Global Exception Filter

Standardized API Errors

Structured Logging

Request IDs

Stack traces hidden in production.

---

# Security

Helmet

CORS

Rate Limiting

Input Sanitization

Output Escaping

SQL Injection Protection

XSS Protection

CSRF (Web)

JWT Rotation

Refresh Token Rotation

Secret Rotation

Environment Encryption

---

# Logging

Every request logs:

Request ID

User ID

IP Address

Device

Latency

Status Code

Route

Logs are structured JSON.

---

# Realtime Architecture

Socket.IO

Namespaces

Presence

Typing Indicators

Live Notifications

Live Feed Updates

Friend Status

Message Delivery

Read Receipts

---

# File Upload Pipeline

```text
Client

↓

Validation

↓

Virus Scan

↓

Compression

↓

Optimization

↓

Cloud Upload

↓

CDN

↓

Database
```

Supported formats

JPEG

PNG

WEBP

GIF

MP4

Maximum size controlled per endpoint.

---

# Search Architecture

Search supports:

Games

Users

Posts

Reviews

Collections

Tier Lists

Developers

Studios

Tags

Future:

Semantic Search

AI Recommendations

---

# Analytics Pipeline

Events

↓

Queue

↓

Aggregation

↓

Metrics Database

↓

Dashboards

↓

Business Intelligence

Analytics never block user requests.

---

# Scalability Strategy

Horizontal Scaling

Stateless API Servers

Redis Shared Cache

CDN

Database Read Replicas

Connection Pooling

Queue Workers

Future Microservices

---

# Testing Strategy

Unit Tests

Integration Tests

API Tests

Repository Tests

Load Tests

Security Tests

Contract Tests

End-to-End Tests

Target Coverage

90%+

---

# CI/CD Integration

Every Pull Request triggers:

Lint

Type Check

Unit Tests

Integration Tests

Build

Docker Image

Security Scan

Deployment Preview

---

# Performance Targets

Authentication

<100ms

Feed

<150ms

Search

<200ms

Game Detail

<120ms

Notifications

<80ms

Message Delivery

<100ms

---

# Coding Standards

Use dependency injection.

Never access Prisma directly from controllers.

Avoid business logic inside repositories.

Never expose internal errors.

Always use DTOs.

Always paginate collections.

Never use any.

Strict TypeScript only.

---

# Future Migration

Architecture supports migration to:

Microservices

Kubernetes

Event Streaming

Kafka

gRPC

GraphQL Federation

Public API Gateway

AI Services

No major refactoring should be required.

---

# Acceptance Criteria

This document is complete when:

* Backend architecture is fully documented.
* Layer responsibilities are defined.
* Folder structure is standardized.
* Security practices are documented.
* Scalability strategy is established.
* Performance targets are defined.

---

# Dependencies

* DATABASE_SPECIFICATION.md
* PRISMA_SCHEMA.md
* API_SPECIFICATION.md
* SYSTEM_ARCHITECTURE.md

---

# Related Documents

* FRONTEND_ARCHITECTURE.md
* SECURITY.md
* CI_CD.md
* DEPLOYMENT.md
* CODING_STANDARDS.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
