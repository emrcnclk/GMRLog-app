# GMRLOG OS

**Version:** 1.0.0

**Document:** `docs/02_DESIGN/MOTION_GUIDELINES.md`

**Status:** Approved (subordinate)

**Owner:** Design Team

**Classification:** Internal

> **Motion constitution:** [`F3_5_MOTION_ANIMATION_PHILOSOPHY.md`](../03_UX/F3_5_MOTION_ANIMATION_PHILOSOPHY.md) (**LOCKED**).  
> **UI motion language:** [`F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md`](../04_UI/F4_9_MOTION_LANGUAGE_TRANSITION_SYSTEM.md) (**LOCKED**).  
> **SSOT brand/motion role:** [`MASTER_PRODUCT_AND_DESIGN_DIRECTION.md`](./MASTER_PRODUCT_AND_DESIGN_DIRECTION.md) (**LOCKED**) — Motion §6.
> On conflict, F3.5 · F3.4 · F2.18 · Master win. This file is subordinate detail.

---

# Motion Guidelines

## Purpose

Motion is a first-class design element in GMRLOG.

Animations communicate hierarchy, continuity, causality, feedback, and delight.

Every animation must improve usability—not distract from it.

The visual language should feel like a premium gaming platform, combining the polish of Steam, Discord, Apple Music, Linear, Arc Browser, and modern AAA launcher interfaces.

---

# Motion Philosophy

Motion should always feel:

* Fast
* Smooth
* Intentional
* Responsive
* Premium
* Physical
* Predictable

Animations should never delay the user.

---

# Motion Principles

Every animation must satisfy at least one of the following:

* Explain a relationship
* Preserve spatial context
* Confirm an action
* Direct attention
* Reduce cognitive load
* Provide feedback

If an animation does not satisfy one of these goals, it should not exist.

---

# Performance Targets

Target FPS

120 FPS (supported devices)

Minimum FPS

60 FPS

Frame Budget

16ms

Maximum UI Animation Duration

500ms

Maximum Page Transition

400ms

Maximum Micro Interaction

200ms

---

# Animation Categories

The application uses six motion categories.

## 1. Navigation Motion

Screen Push

Screen Pop

Tab Switch

Modal Presentation

Bottom Sheet

Shared Element Transition

---

## 2. Feedback Motion

Like Animation

Follow Animation

Bookmark

Save

Success

Failure

Validation

Achievement Unlock

---

## 3. Content Motion

Card Expansion

Image Preview

Gallery

Review Expansion

Tier List Rearrangement

Collection Editing

---

## 4. Loading Motion

Skeletons

Progress Indicators

Image Fade-In

Lazy Loading

Infinite Feed

---

## 5. System Motion

Theme Switching

Orientation Changes

Keyboard Appearance

Toast

Snackbars

Notifications

---

## 6. Ambient Motion

Background Particles (optional)

Gradient Movement

Live Wallpapers (future)

Dynamic Accent Glow

Animated Hero Sections

Ambient motion must remain subtle and disable automatically when Reduced Motion is enabled.

---

# Duration Tokens

| Token      | Duration |
| ---------- | -------: |
| Instant    |      0ms |
| Ultra Fast |     80ms |
| Fast       |    150ms |
| Normal     |    220ms |
| Medium     |    300ms |
| Slow       |    400ms |
| Extra Slow |    500ms |

---

# Easing Curves

Supported curves:

Standard

Ease Out

Ease In

Ease In Out

Spring Soft

Spring Medium

Spring Stiff

Overshoot (rare)

Bounce (very rare)

Elastic animations should never be used for navigation.

---

# Navigation Motion

## Push

Slide Left

Fade

Shared Elements

Duration

300ms

---

## Pop

Reverse Push

250ms

---

## Modal

Fade Backdrop

Slide Up

Scale Content

280ms

---

## Bottom Sheet

Spring Animation

Velocity Aware

Interactive Drag

Snap Positions

25%

50%

75%

100%

---

# Shared Element Transitions

Supported Components

Game Cover

Avatar

Developer Logo

Studio Logo

Profile Banner

Collection Cover

Tier List

Media Viewer

The destination element should visually inherit the origin element.

---

# Feed Motion

Feed updates never refresh abruptly.

Supported transitions

Insert

Fade + Slide

Delete

Collapse

Update

Crossfade

Sort

Animated Reorder

Like

Scale + Pop

Comment

Slide

Quote

Fade

Bookmark

Ribbon Animation

---

# Button Motion

Primary Button

Hover

Elevation Increase

Pressed

Scale 0.97

Released

Spring Back

Loading

Spinner Morph

Success

Checkmark Morph

---

# Card Motion

Hover

Lift

Glow

Shadow Increase

Pressed

Scale

Selected

Border Accent

Background Tint

Drag

Shadow Increase

Rotation 2°

---

# Game Card Motion

Hover

Cover Zoom

Gradient Expansion

Metadata Fade-In

Click

Shared Transition

Loading

Skeleton

Loaded

Crossfade

---

# Tier List Motion

Drag & Drop

Physics Based

Magnetic Snapping

Row Highlight

Auto Scroll

Animated Placement

Invalid Drop

Shake Animation

---

# Profile Motion

Avatar Expansion

Banner Collapse

Stats Counter Animation

Badge Reveal

Achievement Unlock

Profile Completion Progress

---

# Notification Motion

Toast

Slide Down

Snackbar

Slide Up

Badge

Scale Pop

Unread Dot

Fade

Notification Card

Slide + Fade

---

# Messaging Motion

Typing Indicator

Animated Dots

Message Arrival

Slide

Read Receipt

Fade

Image Upload

Progress Circle

Reaction Picker

Scale

---

# Loading Motion

Preferred

Skeleton Screens

Progressive Image Loading

Shimmer

Optimistic UI

Avoid

Long Spinners

Blocking Dialogs

Blank Screens

---

# Gesture Motion

Supported

Swipe

Edge Swipe

Drag

Pinch

Long Press

Double Tap

Pull To Refresh

Each gesture includes

Visual Feedback

Haptic Feedback

Accessible Alternative

---

# Haptic Feedback

Light

Like

Bookmark

Tab

Medium

Friend Accepted

Review Published

Game Logged

Heavy

Delete

Achievement

Premium Purchase

---

# Scroll Behavior

Large Header

Collapse

Bottom Navigation

Hide on Scroll

Return on Scroll Up

FAB

Hide While Reading

Restore Automatically

Infinite Feed

Continuous

No Jumping

---

# Accessibility

Reduced Motion disables

Parallax

Large Scale Animations

Background Motion

Animated Gradients

Particles

Complex Shared Elements

Animations become

Fade

Opacity

Small Translation

---

# Animation Tokens

Motion tokens are centralized inside the Design Token System.

Examples

```text
motion.duration.fast

motion.duration.normal

motion.easing.standard

motion.spring.soft

motion.spring.medium

motion.spring.stiff
```

No component should hardcode animation durations.

---

# Engineering Requirements

Animations must

Be interruptible

Run on UI Thread

Support 60 FPS minimum

Support React Native Reanimated

Be deterministic

Support reduced motion

Avoid layout recalculations

Avoid unnecessary rerenders

---

# QA Checklist

Before release verify

✓ Smooth at 60 FPS

✓ No dropped frames

✓ No layout shifts

✓ Correct easing

✓ Correct duration

✓ Reduced Motion support

✓ Haptic synchronization

✓ Accessibility compliance

✓ Cross-platform consistency

✓ Shared element continuity

---

# Future Motion Roadmap

Future enhancements include

* Animated profile themes
* Dynamic weather backgrounds
* Seasonal UI effects
* Live game artwork
* Achievement celebration sequences
* Animated onboarding cinematics
* AI-generated adaptive motion
* OLED-exclusive visual effects

---

# Acceptance Criteria

This document is complete when:

* Motion philosophy is defined.
* Every animation category is documented.
* Navigation transitions are standardized.
* Accessibility requirements are specified.
* Engineering implementation rules are established.
* Motion tokens integrate with the Design System.

---

# Dependencies

* DESIGN_SYSTEM.md
* DESIGN_TOKENS.md
* COMPONENT_LIBRARY.md
* ACCESSIBILITY.md

---

# Related Documents

* FIGMA_CONVENTIONS.md
* SCREEN_SPECIFICATIONS.md
* FRONTEND_ARCHITECTURE.md
* STORYBOOK_GUIDE.md

---

# Revision History

| Version | Date            | Status   |
| ------- | --------------- | -------- |
| 1.0.0   | Initial Release | Approved |
