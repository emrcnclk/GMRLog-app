# Specification Gap Report — Closed Enums (D2.1 Audit)

**Status:** OPEN — blocks enum promotion, does not block D2.2
**Authority checked:** F5.1–F5.5 · F6.1–F6.10 · Phase S (S1–S4) · legacy `07_DATABASE` inputs
**Rule applied:** S2 §14 — closed sets are product-governed; members are **never invented** by implementation.

---

## 1. Audit method

Every `String` column in `packages/database/prisma/schema.prisma` that represents a closed vocabulary was compared against the constitutional documents (F5, F6, Phase S). A field is promoted to a Prisma enum **only** if its member set is concretely enumerated somewhere in that authority chain. Legacy `07_DATABASE` documents name enum types (`ReactionType`, `NotificationType`, `ReportReason`, …) but enumerate **no members**, so they cannot source a promotion either.

## 2. Resolved in this audit — promoted to Prisma enum

| Field | Enum | Members | Source of vocabulary |
|-------|------|---------|----------------------|
| `UserSettings.theme` | `ThemePreference` | `light` · `dark` · `system` | F4 Master Design Direction (Light/Dark/System) · D1.3 `@gmrlog/ui` `ThemePreference` token type |

The `0_init` migration was regenerated in place (permitted pre-release, see `MIGRATION_VERIFICATION_POLICY.md`).

## 3. Blocked enums — specification gap (DO NOT implement without amendment)

| # | Field | Intended enum | What S2/S1 say | What is missing |
|---|-------|---------------|----------------|-----------------|
| 1 | `Reaction.kind` | `ReactionKind` | "closed product reaction set" (S2 §8, S1) | No document enumerates the reaction members |
| 2 | `Notification.kind` | `NotificationKind` | "closed notification taxonomy" | No document enumerates the notification kinds |
| 3 | `Report.reason` | `ReportReason` | "closed moderation set" | No document enumerates the report reasons |
| 4 | `NotificationPreference.category` | `NotificationCategory` | closed preference categories | No document enumerates the categories (depends on gap #2) |
| 5 | `AdminActionRecord.action` | `AdminAction` | closed administrative action set | No document enumerates the admin actions |

## 4. Fields audited and intentionally NOT closed enums

| Field | Reason |
|-------|--------|
| `UserSettings.locale` | Supported-locale set is not constitutionally defined (localization foundation is a stub); open vocabulary for now |
| `AuditLog.action` · `AuditLog.entityType` | S2 §10.11 defines them without an enum marker; audit records may reference vocabulary beyond `ObjectType` |
| `AuthCredential.providerRef`, storage keys, slugs, handles, external refs | Free-form identifiers, not closed vocabularies |

## 5. Safest temporary state (current implementation)

- Blocked fields remain `String` in Prisma — the database stays permissive so **no invented member can ossify into law**.
- Integrity ownership for these sets sits with product law + `@gmrlog/validators` (S2 §12: the database is the last line of integrity, not the only one).
- Each blocked column carries a schema comment pointing to this report.

## 6. Unblocking procedure

1. The member set is specified by amendment in the owning constitutional document (F5 product law or an S2 amendment).
2. The `String` column is promoted to a Prisma enum with exactly the specified lowercase members.
3. A migration is added (append-only after first deployment) and verified per `MIGRATION_VERIFICATION_POLICY.md`.
4. The corresponding row is removed from §3 of this report; the report closes when §3 is empty.

---

## 7. D3.21 Social Platform Core — documented amendments (2026-07-29)

Additive Prisma enums / members (not invented silently — owned by `docs/07_SOCIAL/*`):

| Amendment | Members / change | Doc owner |
|-----------|------------------|-----------|
| `LibraryStatus` + `dropped` | shelf for abandoned games | FRIEND_SYSTEM / profile stats |
| `CommentHostType` + `collection` · `tier_list` | comment hosts | TIMELINE_EVENTS |
| `ReactionTargetType` + `collection` · `tier_list` | like targets | TIMELINE_EVENTS |
| `ActivityKind` + `like` · `comment` · `wishlist` · `profile_pin` · `milestone` | timeline | TIMELINE_EVENTS |
| New `FriendRequestStatus` | pending · accepted · rejected · cancelled | FRIEND_SYSTEM |
| New `PresenceStatus` | online · away · offline · invisible | FRIEND_SYSTEM |
| New `ProfilePinKind` | game · review · collection | PLAYER_ARCHETYPES / profiles |

Notification `kind` strings remain product-governed `String` values; D3.21 matrix lives in `docs/07_SOCIAL/NOTIFICATION_MATRIX.md` (still not a Prisma enum until §3#2 is formally closed).

Reaction kind `like` is the D3.21 product primary reaction; still not promoted to `ReactionKind` enum (§3#1).

---

## 8. D3.22 Collections & Discovery Engine — documented amendments (2026-07-29)

Additive Prisma enums / members (owned by `docs/09_DISCOVERY/*`):

| Amendment | Members / change | Doc owner |
|-----------|------------------|-----------|
| New `CollectionType` | `manual` · `dynamic` · `curated` · `official` | COLLECTION_TYPES.md |
| New `WishlistPriority` | `low` · `medium` · `high` · `must_play` | WISHLIST_METADATA.md |
| New `WishlistWaitStatus` | `none` · `waiting_sale` · `waiting_dlc` · `waiting_translation` · `waiting_release` | WISHLIST_METADATA.md |
| Collection columns | `type` · `ruleKey` · `bannerKey` · `coverKey` · `color` · `tags` | COLLECTION_TYPES.md |
| Tables | `discovery_scores` · `game_similarity` · `user_similarity` · `collection_followers` · `wishlist_metadata` · `recommendation_rules` | DISCOVERY_SCORES / SIMILARITY / RECOMMENDATION_RULES |

Dynamic `ruleKey` values are a closed product catalog in COLLECTION_TYPES.md (String column — not Prisma enum until catalog freezes further).

---

## 9. D3.23 Platform Integrations & Library Sync — documented amendments (2026-07-30)


Additive Prisma enums / members (owned by `docs/10_INTEGRATIONS/*`):

| Amendment | Members / change | Doc owner |
|-----------|------------------|-----------|
| New `IntegrationProvider` | `steam` · `xbox` · `playstation` · `epic` · `nintendo` · `csv` | STEAM_IMPORT.md |
| New `IntegrationSyncType` | `manual` · `daily` · `weekly` · `monthly` · `automatic` | SYNC_ENGINE.md |
| New `SyncConflictResolution` | `keep_local` · `keep_steam` · `newest_wins` · `ask_user` | CONFLICT_RESOLUTION.md |
| New `SyncJobStatus` | `pending` · `processing` · `completed` · `failed` · `cancelled` | SYNC_ENGINE.md |
| `ActivityKind` additives | `library_synced` · `achievement_synced` · `playtime_updated` · `integration_connected` · `integration_disconnected` | API.md |
| Tables | `user_integrations` · `external_profiles` · `external_games` · `external_achievements` · `sync_jobs` · `sync_history` · `sync_conflicts` | this report |

`ConnectedProvider` remains S1 OAuth set (`steam` · `discord`) — not forked.

---

## 10. D3.24 Social Feed, Communities & Events — documented amendments (2026-07-30)

Additive Prisma enums / members (owned by `docs/07_SOCIAL/*`):

| Amendment | Members / change | Doc owner |
|-----------|------------------|-----------|
| `ContentVisibility` | `community` | FEED_ENGINE_V2.md |
| `CommunityRole` | `admin` | COMMUNITIES_2.md |
| New `CommunityJoinType` | `public` · `private` · `invite_only` | COMMUNITIES_2.md |
| `EventKind` | `lan` · `watch_party` · `coop_session` · `raid` · `release_countdown` · `release` · `community_night` · `speedrun` | EVENTS_V2.md |
| `EventParticipationState` | `looking_for_team` · `need_players` · `hosting` | EVENTS_V2.md |
| New `QuoteTargetType` | post · review · collection · guide · achievement · screenshot · tier_list | SOCIAL_ACTIONS.md |
| New `PostKind` | text · screenshot · video · poll · guide · news · quote | SOCIAL_POSTS_V2.md |
| New `FeedItemKind` | post_item · activity_item · recommendation_item · advertisement_item | FEED_ITEM_TYPES.md |
| New `ReputationBadge` | helpful_reviewer · strategy_expert · lore_master · achievement_hunter · community_leader | REPUTATION.md |
| New `CommunityBadgeKind` | founder · moderator · top_contributor · verified_creator | COMMUNITIES_2.md |
| Tables | mutes · post_media · post_bookmarks · reposts · quotes · polls · poll_votes · user_reputations · community_wiki_pages · community_pins · community_member_badges · event_invites | D3.24 SSOT |

Migration: `20260730190000_d3_24_social_feed_communities_events`.
