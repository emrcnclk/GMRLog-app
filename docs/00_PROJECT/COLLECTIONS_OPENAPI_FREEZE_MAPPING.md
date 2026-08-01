# Collections — OpenAPI ↔ Database Freeze Mapping

**Updated:** 2026-07-16 (Database Freeze v1.0.3 Collections Patch / rev 1.1.3)  
**Contracts:** `COLLECTION_API.yaml` + frozen `collections` table

---

## Core Collection fields

| OpenAPI (`Collection`) | Prisma / DB | Notes |
|------------------------|-------------|--------|
| `id` | `id` | UUID |
| `owner` | `user` + `profiles` | Embedded UserPublicProfile |
| `name` | `title` | Persistable |
| `slug` | `slug` | Nullable unique; generated/optional explicit (v1.0.3) |
| `description` | `description` | |
| `coverImage` | `cover_url` | |
| `visibility` | `visibility` | PUBLIC / FOLLOWERS / PRIVATE |
| `collaborative` | `is_collaborative` | Default false (v1.0.3) |
| `gameCount` | `game_count` | Denormalized |
| `followerCount` | `follower_count` | Denormalized |
| `likeCount` | `like_count` | Denormalized |
| `createdAt` / `updatedAt` | `created_at` / `updated_at` | |
| *(soft delete)* | `deleted_at` | Not exposed on OpenAPI Collection |

---

## Remaining gaps (not in Freeze patch)

| OpenAPI | Status |
|---------|--------|
| `bannerImage` | Freeze gap — omit from responses |
| `icon` | Freeze gap — omit |
| `featured` | Freeze gap — omit |
| `verified` (collection-level) | Freeze gap — omit (owner.verified is profile) |

---

## Create / Update request mapping

| OpenAPI request | Persistence |
|-----------------|-------------|
| `name` | `title` |
| `description` | `description` |
| `visibility` | `visibility` |
| `collaborative` | `is_collaborative` |
| `slug` (optional create; OpenAPI extension via DTO) | `slug` — generated if omitted |

Slug is **immutable after create** unless actor has `ADMIN` role.
