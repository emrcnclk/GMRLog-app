# GMRLOG OS

**Version:** 1.0.0 Alpha

**Document:** `docs/06_BACKEND/STORAGE_ARCHITECTURE.md`

**Status:** Approved

**Owner:** Backend Team

**Classification:** Internal Engineering Documentation

---

# Storage Architecture

## Purpose

This document defines the storage architecture used throughout GMRLOG.

The storage layer is responsible for handling all user-generated media, static assets, developer content, backups, and future large-scale content distribution.

The architecture is designed for high availability, scalability, durability, security, and low latency.

---

# Objectives

The storage system must provide:

* High durability
* Global accessibility
* CDN delivery
* Automatic optimization
* Secure uploads
* Versioning
* Backup support
* Lifecycle management
* Cost optimization

---

# Technology Stack

## Primary Object Storage

AWS S3

---

## Alternative Provider

Cloudflare R2

---

## CDN

Cloudflare CDN

---

## Image Processing

Sharp

---

## Video Processing

FFmpeg

---

## Virus Scanning

ClamAV

---

## Backup Storage

AWS Glacier

---

# High-Level Architecture

```text
              Client
                 │
                 ▼
          Upload Endpoint
                 │
                 ▼
       Upload Validation
                 │
                 ▼
          Virus Scanner
                 │
                 ▼
      Image / Video Processor
                 │
                 ▼
         Object Storage
                 │
                 ▼
          Cloudflare CDN
                 │
                 ▼
              End User
```

---

# Storage Buckets

## Public Bucket

Contains:

Game Covers

Developer Logos

Studio Logos

Platform Icons

Genre Icons

System Assets

---

## User Bucket

Contains:

Profile Photos

Banner Images

Collection Covers

Tier List Covers

Review Images

Post Images

---

## Developer Bucket

Contains:

Trailers

Screenshots

Developer Blogs

Marketing Assets

Press Kits

---

## Temporary Bucket

Contains:

Pending Uploads

Draft Media

Temporary Images

Upload Chunks

Automatically cleaned every 24 hours.

---

## Backup Bucket

Contains:

Database Backups

Media Snapshots

Configuration Backups

Encrypted Archives

---

# File Categories

Supported Media

Images

Videos

Documents

Animated GIFs

Future:

3D Assets

AR Assets

Audio Clips

---

# Image Formats

Supported

JPEG

PNG

WEBP

GIF

Future

AVIF

---

# Video Formats

Supported

MP4

WEBM

MOV

Maximum duration configurable.

---

# Maximum File Sizes

Avatar

10 MB

---

Banner

20 MB

---

Post Image

25 MB

---

Review Image

25 MB

---

Developer Screenshot

50 MB

---

Video

500 MB

---

Backup Archive

Unlimited

---

# Upload Pipeline

```text
Select File

↓

Upload Request

↓

Authentication

↓

Permission Check

↓

Virus Scan

↓

Metadata Extraction

↓

Compression

↓

Optimization

↓

Thumbnail Generation

↓

Object Storage

↓

CDN Invalidation

↓

Response
```

---

# Image Optimization

Automatically generated:

Thumbnail

256 px

---

Small

512 px

---

Medium

1024 px

---

Large

2048 px

---

Original

Preserved

---

# Naming Convention

Files use UUID.

Example

```text
avatar/

7e5f2c54-91bd.webp
```

Never use user-provided filenames.

---

# Metadata

Stored Metadata

Owner ID

Upload Date

Checksum

Dimensions

Mime Type

Storage Bucket

File Size

Visibility

Version

---

# Access Levels

Public

Authenticated

Private

Moderator Only

Administrator Only

Developer Only

Studio Only

---

# Signed URLs

Private media uses signed URLs.

Default expiration

15 Minutes

Renewable on demand.

---

# Versioning

Every uploaded asset supports version history.

Old versions remain recoverable.

---

# Lifecycle Policies

Temporary Bucket

24 Hours

---

Deleted Media

30 Days

---

Inactive Assets

180 Days

---

Backups

365 Days

---

Glacier Archive

After 1 Year

---

# CDN Strategy

Cloudflare caches:

Game Covers

Avatars

Screenshots

Developer Logos

Studio Logos

Static Assets

Automatic cache invalidation after updates.

---

# Compression

Images

Lossless when possible

Maximum quality target

90%

---

Videos

H.264

Future

H.265

AV1

---

# Security

Every upload passes:

Authentication

Authorization

Mime Validation

Extension Validation

Magic Number Validation

Virus Scan

File Size Validation

Rate Limiting

---

Forbidden File Types

Executable Files

Shell Scripts

DLL Files

APK Files

IPA Files

Java Archives

Unknown Binary Formats

---

# Backup Strategy

Daily Incremental Backup

Weekly Full Backup

Monthly Snapshot

Encrypted Archives

Cross-region Replication

---

# Disaster Recovery

Recovery Time Objective (RTO)

< 2 Hours

Recovery Point Objective (RPO)

< 15 Minutes

---

# Monitoring

Metrics

Upload Success Rate

Average Upload Time

Storage Usage

CDN Hit Ratio

Image Processing Time

Video Processing Time

Virus Detection Count

Bandwidth Usage

---

# Cost Optimization

Unused assets cleaned automatically.

Duplicate uploads detected by checksum.

Large media compressed before storage.

Archive policy minimizes long-term costs.

---

# Future Features

AI Image Tagging

Automatic NSFW Detection

Duplicate Image Detection

Background Removal

Video Preview Generation

360° Images

HDR Support

Cloudflare Images Integration

---

# Acceptance Criteria

This document is complete when:

* Storage providers are defined.
* Upload pipeline is documented.
* Security policies are established.
* Lifecycle rules are documented.
* Backup strategy is specified.
* CDN architecture is defined.

---

# Dependencies

* BACKEND_ARCHITECTURE.md
* CACHE_STRATEGY.md
* SECURITY.md

---

# Related Documents

* REALTIME_ARCHITECTURE.md
* SYSTEM_ARCHITECTURE.md
* ENVIRONMENT_VARIABLES.md
* API_SPECIFICATION.md

---

# Revision History

| Version     | Date            | Status   |
| ----------- | --------------- | -------- |
| 1.0.0 Alpha | Initial Release | Approved |
