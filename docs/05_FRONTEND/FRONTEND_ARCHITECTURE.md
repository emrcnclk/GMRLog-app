# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/05_FRONTEND/FRONTEND_ARCHITECTURE.md`

**Status:** Approved

**Owner:** Frontend Team

**Classification:** Internal Engineering Documentation

---

# Frontend Architecture

## Purpose

This document defines the frontend architecture of GMRLOG across Mobile, Tablet, Desktop, and Web.

The frontend is built to deliver a premium, high-performance social gaming experience with scalable architecture, maintainable code, and a consistent design language.

---

# Technology Stack

## Framework

React Native (Expo)

Expo SDK (Latest Stable)

Expo Router

React Native Reanimated

React Native Gesture Handler

React Native Skia (future)

---

## Language

TypeScript

Strict Mode Enabled

---

## State Management

TanStack Query

Zustand

React Context (UI Only)

---

## Networking

Axios

TanStack Query

WebSocket Client

---

## Forms

React Hook Form

Zod Validation

---

## UI

NativeWind

Gluestack UI

Custom Design System

Lucide Icons

Lottie

---

## Navigation

Expo Router

Deep Linking

Universal Links

Bottom Tabs

Native Stack

Modal Navigation

---

# Architecture Principles

Feature-first organization

Atomic Design

Component-driven development

Single Responsibility Principle

Composition over inheritance

Strict typing

Reusable UI

---

# Folder Structure

```text
app/

components/

features/

hooks/

services/

store/

providers/

constants/

types/

utils/

theme/

assets/

locales/

config/

navigation/

api/

lib/

styles/

tests/
```

---

# Feature Structure

```text
features/

feed/

components/

hooks/

services/

types/

api/

store/

utils/

screens/

constants/
```

Each feature is completely isolated.

---

# Routing

Expo Router File Structure

```text
app/

(auth)/

(tabs)/

feed/

discover/

notifications/

messages/

profile/

game/

review/

collection/

tierlist/

developer/

studio/

settings/
```

---

# Screen Lifecycle

```text
Open Screen

↓

Load Cached Data

↓

Show Skeleton

↓

Fetch API

↓

Update Cache

↓

Render UI

↓

Realtime Updates
```

---

# State Management

## Server State

TanStack Query

Used for:

Games

Feed

Reviews

Notifications

Search

Messages

Developer Pages

Studio Pages

---

## Global State

Zustand

Authentication

Theme

Language

Settings

Current User

Realtime Status

Player Preferences

---

## Local State

React State

Component Visibility

Forms

Bottom Sheets

Animation State

Selections

---

# Component Architecture

Atoms

Buttons

Icons

Typography

Avatar

Badge

Divider

---

Molecules

Review Card

Feed Card

Notification Card

Game Card

Comment Card

Search Item

Message Bubble

---

Organisms

Feed

Game Header

Profile Header

Developer Profile

Tier Builder

Collection Grid

Navigation

---

Templates

Authentication

Home

Game Detail

Profile

Messaging

Settings

Developer Dashboard

Studio Dashboard

---

Pages

Complete screens only.

---

# API Layer

Every feature owns its API client.

Example

```text
features/feed/api/

feed.api.ts

feed.types.ts

feed.mapper.ts
```

No feature directly calls Axios.

---

# Query Keys

```text
feed

games

reviews

users

collections

tierlists

notifications

messages

developers

studios
```

---

# Cache Strategy

TanStack Query

Stale Time

30 Seconds

Cache Time

5 Minutes

Optimistic Updates

Enabled

Infinite Queries

Feed

Notifications

Messages

Search

---

# Authentication Flow

```text
Splash

↓

Check Token

↓

Refresh Token

↓

Authenticated

↓

Load User

↓

Open Tabs
```

Guest users are redirected to authentication.

---

# Offline Strategy

Offline cache

Retry Queue

Optimistic Updates

Image Cache

Draft Persistence

Queued Uploads

Reconnect Sync

---

# Error Handling

Global Error Boundary

API Error Handler

Retry Mechanism

Fallback Screens

Offline State

---

# Theme System

Dark Theme

Default

Light Theme

Optional

OLED Theme

Future

Dynamic Accent Colors

Premium Feature (Future)

---

# Design Tokens

Colors

Typography

Spacing

Elevation

Radius

Opacity

Motion

Shadows

All values come from the Design System.

---

# Responsive Design

Mobile

Primary Platform

Tablet

Adaptive Layout

Desktop

Responsive Layout

Web

Responsive + Keyboard Navigation

---

# Accessibility

VoiceOver

TalkBack

Keyboard Navigation

Dynamic Text

Reduced Motion

High Contrast

Screen Reader Labels

---

# Animations

React Native Reanimated

Gesture Handler

Shared Elements

Lottie

60–120 FPS Target

Motion follows MOTION_GUIDELINES.md.

---

# Image Strategy

Progressive Loading

BlurHash

Lazy Loading

CDN Delivery

Responsive Sizes

Automatic Compression

---

# File Upload Flow

Pick File

↓

Compress

↓

Preview

↓

Upload

↓

Progress

↓

Success

↓

Invalidate Cache

---

# Push Notifications

Expo Notifications

Firebase Cloud Messaging

Apple Push Notification Service

Deep Link Support

---

# WebSocket Integration

Realtime Feed

Realtime Chat

Typing Indicator

Presence

Notifications

Friend Requests

Review Likes

---

# Performance Targets

Initial Launch

<2 Seconds

Feed Load

<1 Second

Navigation

<300ms

Game Detail

<500ms

Search

<300ms

Message Send

<100ms

---

# Testing Strategy

Unit Tests

Component Tests

Integration Tests

Snapshot Tests

Accessibility Tests

E2E Tests

Visual Regression

---

# Code Standards

Strict TypeScript

ESLint

Prettier

Husky

Conventional Commits

Feature Isolation

No Business Logic in Components

---

# Future Features

Desktop Client

PWA

Widgets

Apple Vision Pro

WearOS Companion

watchOS Companion

AI UI Assistant

---

# Acceptance Criteria

* Feature-based architecture is defined.
* State management strategy is documented.
* Folder structure is standardized.
* Performance targets are established.
* Responsive behavior is specified.
* Offline support is documented.

---

# Dependencies

* DESIGN_SYSTEM.md
* COMPONENT_LIBRARY.md
* API_SPECIFICATION.md
* BACKEND_ARCHITECTURE.md

---

# Related Documents

* SYSTEM_ARCHITECTURE.md
* MOTION_GUIDELINES.md
* CODING_STANDARDS.md
* ACCESSIBILITY.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
