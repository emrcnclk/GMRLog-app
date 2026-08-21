/**
 * Shared type surface for the GMRLOG monorepo.
 * Domain types are added in later foundation phases — not here.
 */
export type WorkspacePackageName =
  'types' | 'validators' | 'config' | 'api-sdk' | 'ui' | 'frontend' | 'backend';

export type AppEnvironment = 'development' | 'staging' | 'production';

export type NodeEnvironment = 'development' | 'test' | 'production';

/**
 * S1 §4.1 — global success envelope. Every JSON success response uses this shape.
 */
export interface ApiEnvelopeMeta {
  requestId: string;
  freshness?: 'live' | 'cached' | 'stale';
  cursor?: { next: string | null; prev?: string | null };
  hasMore?: boolean;
  limit?: number;
  total?: number;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: ApiEnvelopeMeta;
}

/**
 * S1 §7 — error catalogue dialect.
 */
export type ApiErrorCategory =
  'validation' | 'authn' | 'authz' | 'not_found' | 'conflict' | 'rate' | 'unavailable' | 'internal';

export interface ApiErrorField {
  path: string;
  code: string;
  message: string;
}

export interface ApiErrorBody {
  category: ApiErrorCategory;
  code: string;
  message: string;
  requestId: string;
  retryable: boolean;
  fields?: ApiErrorField[];
}

export interface ApiErrorEnvelope {
  error: ApiErrorBody;
}

/**
 * F6.7 §7–§8 — architectural session states shared across frontend and backend.
 * `unknown` = not yet hydrated/resolved · `guest` = anonymous guest ·
 * `authenticated` = platform-confirmed player. Staff class arrives with its own domain.
 */
export type SessionState = 'unknown' | 'guest' | 'authenticated';

/**
 * Session credential pair returned by `POST /sessions` and `POST /sessions/refresh`
 * (Bearer mobile policy · AUTHENTICATION.md AuthResponse token fields).
 * S1 §15.1 SessionResponse also carries `user` / `expiresAt` when mounted —
 * clients always re-fetch `GET /me` as the self-view authority.
 */
export interface SessionCredentialResponse {
  accessToken: string;
  refreshToken: string;
}

/** F6.7 §7 / S1 §9.1 — identity classes attached at the platform edge. */
export type IdentityClass = 'guest' | 'player';

/**
 * S1 §15 — user-domain response contracts (D2.2 scope).
 */

/** S2 §14 / S1 §15.11 — connected account provider (closed set). */
export type ConnectedProviderKind = 'steam' | 'discord';

/**
 * D4.1 / OAUTH.md §1 — login-capable OAuth provider (closed set). Distinct
 * from `ConnectedProviderKind`: Google and Discord issue a verifiable email
 * and back an `auth_credentials` row, Steam does not and stays connection-only.
 */
export type OAuthProviderKind = 'google' | 'discord';

/** D4.3 / OAUTH.md §2 — `POST /auth/oauth/:provider/start` response. */
export interface OAuthStartResponse {
  authorizeUrl: string;
  state: string;
}

/** D4.3 / OAUTH.md §4 — machine-readable rejection reasons `/callback` can return. */
export type OAuthCallbackErrorCode =
  | 'OAUTH_STATE_INVALID'
  | 'OAUTH_PROVIDER_UNAVAILABLE'
  | 'OAUTH_EMAIL_CONFLICT'
  | 'OAUTH_ACCOUNT_UNAVAILABLE';

/**
 * D4.5 — `POST /auth/connect/steam/start` response. Steam is a *connect*
 * surface (attaches a verified SteamID to an already-authenticated user),
 * never a login provider — see `OAuthProviderKind` above and `steam-connect.
 * controller.ts`'s own doc comment for why it doesn't share `OAuthController`.
 */
export interface SteamConnectStartResponse {
  authorizeUrl: string;
  state: string;
}

/** D4.5 — machine-readable rejection reasons `/auth/connect/steam/callback` can return. */
export type SteamConnectErrorCode =
  | 'STEAM_CONNECT_PROVIDER_UNAVAILABLE'
  | 'STEAM_CONNECT_STATE_INVALID'
  | 'STEAM_CONNECT_VERIFICATION_FAILED'
  | 'STEAM_CONNECT_ALREADY_LINKED';

/**
 * D4.7 / OAUTH.md §5 — `GET /auth/sign-in-methods` response. The Settings
 * connect/disconnect surface's read model: `usableCount` is exactly what
 * `OAuthService.disconnectLogin`'s last-method guard checks against, so the
 * UI can disable a Disconnect control in front of the same count the backend
 * will refuse behind, without re-implementing the counting rule itself.
 */
export interface SignInMethodsResponse {
  password: { usable: boolean };
  google: { connected: boolean };
  discord: { connected: boolean };
  usableCount: number;
}

/** D4.7 — machine-readable rejection reasons `POST /auth/oauth/:provider/disconnect` can return. */
export type OAuthDisconnectErrorCode = 'LAST_SIGN_IN_METHOD';

/** D4.7 — machine-readable rejection reasons `POST /auth/oauth/:provider/connect/callback` can return. */
export type OAuthConnectErrorCode =
  | 'OAUTH_STATE_INVALID'
  | 'OAUTH_PROVIDER_UNAVAILABLE'
  | 'OAUTH_IDENTITY_ALREADY_LINKED'
  | 'OAUTH_ACCOUNT_UNAVAILABLE';

/** D4.7 — machine-readable rejection reasons `POST /auth/password` can return. */
export type SetPasswordErrorCode =
  'PASSWORD_ALREADY_SET' | 'EMAIL_REQUIRED' | 'EMAIL_ALREADY_REGISTERED';

/** S1 §15.11 — connected account link status (closed set). */
export type ConnectedAccountLinkStatus = 'connected' | 'disconnected' | 'expired';

/** S1 §15.11 ConnectedAccountResponse — honest link state, never secrets. */
export interface ConnectedAccountResponse {
  provider: ConnectedProviderKind;
  status: ConnectedAccountLinkStatus;
  linkedAt: string | null;
  scopes: string[];
}

/**
 * S1 §15.2 UserResponse — self view. The `privacy` object is deferred until
 * the privacy section is specified (S2 gap: no Privacy entity exists yet).
 */
export interface UserSelfResponse {
  id: string;
  handle: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  createdAt: string;
  connectedProviders: ConnectedProviderKind[];
}

/** F4 / S2 §14 — appearance theme vocabulary (mirrors the DB ThemePreference enum). */
export type ThemePreferenceValue = 'light' | 'dark' | 'system';

/** S1 §15.16 SettingsResponse — appearance section. */
export interface AppearanceSettings {
  theme: ThemePreferenceValue;
  locale: string | null;
}

/** S1 §15.16 SettingsResponse — accessibility section. */
export interface AccessibilitySettings {
  reduceMotion: boolean;
}

/**
 * S1 §15.16 SettingsResponse — nested objects matching settings sections.
 * Account · privacy · notification sections arrive with their own domains.
 */
export interface SettingsResponse {
  appearance: AppearanceSettings;
  accessibility: AccessibilitySettings;
}

/**
 * S1 §14 / S2 §14 — closed LibraryStatus vocabulary (shelves).
 */
export type LibraryStatusValue =
  'owned' | 'playing' | 'completed' | 'wishlist' | 'backlog' | 'hidden' | 'dropped';

/** S1 §14.9 / S2 §14 — closed LibrarySource vocabulary. */
export type LibrarySourceValue = 'manual' | 'steam_import';

/** S2 §14 — GameLogKind closed set (MVP foundation). */
export type GameLogKindValue = 'status_change' | 'session' | 'note';

/**
 * Nested game summary for LibraryEntryResponse (S1 §15.7 → §15.3 fields
 * that do not recurse into `library`). Platforms/stats arrive with catalog domain.
 */
export interface LibraryGameSummary {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
}

/** S1 §15.7 LibraryEntryResponse. */
export interface LibraryEntryResponse {
  gameId: string;
  game: LibraryGameSummary;
  status: LibraryStatusValue;
  source: LibrarySourceValue;
  updatedAt: string;
  /** D3.22 Wishlist++ — present when metadata row exists. */
  wishlist?: WishlistMetadataResponse | null;
}

/**
 * S1 §13.9 GET `/library` — hub summary. No dedicated §15 DTO exists; counts
 * are projected from the closed LibraryStatus vocabulary only (no invented shelves).
 */
export interface LibraryHubResponse {
  counts: Readonly<Record<LibraryStatusValue, number>>;
  total: number;
}

/** GameLog foundation projection — lifecycle events under an entry. */
export interface GameLogResponse {
  id: string;
  libraryEntryId: string;
  kind: GameLogKindValue;
  occurredAt: string;
}

/** S2 §14 / S1 §15.4 — closed ContentVisibility vocabulary. */
export type ContentVisibilityValue = 'public' | 'followers' | 'private' | 'community';

/** D3.24 FeedItem taxonomy — advertisement_item reserved, never emitted. */
export type FeedItemKindValue =
  'post_item' | 'activity_item' | 'recommendation_item' | 'advertisement_item';

export type FeedContentClassValue = 'user_generated' | 'game_activity';

export type PostKindValue = 'text' | 'screenshot' | 'video' | 'poll' | 'guide' | 'news' | 'quote';

export type QuoteTargetTypeValue =
  'post' | 'review' | 'collection' | 'guide' | 'achievement' | 'screenshot' | 'tier_list';

export type ReputationBadgeValue =
  | 'helpful_reviewer'
  | 'strategy_expert'
  | 'lore_master'
  | 'achievement_hunter'
  | 'community_leader';

export type CommunityBadgeKindValue =
  'founder' | 'moderator' | 'top_contributor' | 'verified_creator';

export type CommunityJoinTypeValue = 'public' | 'private' | 'invite_only';

export type FeedFilterValue =
  'for_you' | 'following' | 'games' | 'reviews' | 'media' | 'communities' | 'events';

/**
 * S1 §15.2 UserPublicResponse — fields safe for nested author projections.
 * Privacy/banner/connectedProviders remain self-only.
 */
export interface UserPublicResponse {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

/**
 * S1 §15.4 PostResponse. `reactionSummary` / `viewerState` deferred.
 * `community` summary deferred until Communities domain — `communityId` is
 * projected honestly from S2 when present.
 */
export interface PostResponse {
  id: string;
  author: UserPublicResponse;
  body: string;
  createdAt: string;
  updatedAt: string;
  visibility: ContentVisibilityValue;
  gameId: string | null;
  communityId: string | null;
  game?: LibraryGameSummary;
  /** D3.24 */
  postKind?: PostKindValue;
  containsSpoilers?: boolean;
  pinnedAt?: string | null;
  /** D3.24 Composer++ — present only when `postKind === 'poll'`; aggregated on read. */
  poll?: PollResponse;
}

/**
 * S1 §15.4 ReviewResponse. `reactionSummary` and `viewerState` remain deferred
 * until a later projection/aggregation phase — not invented on Review here.
 */
export interface ReviewResponse {
  id: string;
  author: UserPublicResponse;
  body: string | null;
  createdAt: string;
  updatedAt: string;
  visibility: ContentVisibilityValue;
  rating: number;
  containsSpoilers: boolean;
  gameId: string;
  game?: LibraryGameSummary;
}

/** S2 §14 / S1 §14.8 — closed CommentHostType vocabulary (D3.21: +collection · tier_list). */
export type CommentHostTypeValue = 'post' | 'review' | 'collection' | 'tier_list';

/**
 * S1 §15.4 CommentResponse. Comments have no visibility column (S2);
 * `reactionSummary` / `viewerState` deferred with Reactions.
 */
export interface CommentResponse {
  id: string;
  author: UserPublicResponse;
  body: string;
  createdAt: string;
  updatedAt: string;
  hostType: CommentHostTypeValue;
  hostId: string;
  parentCommentId: string | null;
}

/** S2 §14 / S1 §14.19 — closed ReactionTargetType vocabulary (D3.21: +collection · tier_list). */
export type ReactionTargetTypeValue = 'post' | 'review' | 'comment' | 'collection' | 'tier_list';

/**
 * Reaction create/delete foundation response. S1 §15 has no dedicated
 * ReactionResponse catalog entry; fields mirror S2 `Reaction` (+ nested
 * `actor` as UserPublic for consistency with other shared-object projections).
 * `kind` remains an opaque string until ReactionKind members are amended.
 */
export interface ReactionResponse {
  id: string;
  actor: UserPublicResponse;
  targetType: ReactionTargetTypeValue;
  targetId: string;
  kind: string;
  createdAt: string;
}

/** Ordered game row inside CollectionResponse (S1 §15.8 entries). */
export interface CollectionEntryResponse {
  gameId: string;
  position: number;
  note: string | null;
  game?: LibraryGameSummary;
}

/**
 * S1 §15.8 CollectionResponse. `description` projected from S2; reaction /
 * collaboration / share fields are not invented.
 * D3.22 Collection++ additive presentation fields.
 */
export interface CollectionResponse {
  id: string;
  title: string;
  description: string | null;
  owner: UserPublicResponse;
  visibility: ContentVisibilityValue;
  type: CollectionTypeValue;
  ruleKey: string | null;
  bannerUrl: string | null;
  coverUrl: string | null;
  color: string | null;
  tags: string[];
  followerCount: number;
  entries: CollectionEntryResponse[];
  updatedAt: string;
}

/** Ordered game inside a tier slot (S1 §15.8 slots). */
export interface TierSlotGameResponse {
  gameId: string;
  position: number;
  game?: LibraryGameSummary;
}

/** Labeled tier row inside TierListResponse. */
export interface TierSlotResponse {
  label: string;
  position: number;
  games: TierSlotGameResponse[];
}

/**
 * S1 §15.8 TierListResponse. Voting / templates / collaboration are not
 * invented.
 */
export interface TierListResponse {
  id: string;
  title: string;
  owner: UserPublicResponse;
  visibility: ContentVisibilityValue;
  slots: TierSlotResponse[];
  updatedAt: string;
}

/** S2 §14 / S1 §15.9 — closed ObjectType vocabulary. */
export type ObjectTypeValue =
  | 'game'
  | 'post'
  | 'review'
  | 'comment'
  | 'collection'
  | 'tier_list'
  | 'user'
  | 'community'
  | 'event'
  | 'achievement';

export interface NotificationObjectRef {
  type: ObjectTypeValue;
  id: string;
}

/**
 * S1 §15.9 NotificationResponse.
 * S2 Notification has no `actorId` — `actor` is projected as `null` until product
 * amends the model. `kind` / `messageKey` remain opaque until NotificationKind
 * members are specified (`messageKey` mirrors `kind` as the localization key).
 */
export interface NotificationResponse {
  id: string;
  kind: string;
  createdAt: string;
  readAt: string | null;
  actor: UserPublicResponse | null;
  objectRef: NotificationObjectRef;
  messageKey: string;
}

/** S2 §14 / F5.2 — closed ActivityKind vocabulary. */
export type ActivityKindValue =
  | 'review'
  | 'post'
  | 'collection'
  | 'game_log'
  | 'tier_list'
  | 'friend'
  | 'recommendation_slot'
  | 'community'
  | 'event'
  | 'achievement'
  | 'library_import'
  | 'like'
  | 'comment'
  | 'wishlist'
  | 'profile_pin'
  | 'milestone'
  | 'library_synced'
  | 'achievement_synced'
  | 'playtime_updated'
  | 'integration_connected'
  | 'integration_disconnected';

/**
 * S1 §15.9 ActivityItemResponse.
 * S2 ActivityItem has no `readAt` — projected as `null`. `messageKey` mirrors
 * `kind` as the localization key until ActivityKind members are amended.
 */
export interface ActivityItemResponse {
  id: string;
  kind: ActivityKindValue;
  createdAt: string;
  readAt: string | null;
  actor: UserPublicResponse | null;
  objectRef: NotificationObjectRef;
  messageKey: string;
}

/** S1 §13.11 GET `/activity` — paginated activity center list item. */
export type ActivityResponse = ActivityItemResponse;

/** S1 §15.5 FeedItemResponse — home and community feed rows. D3.24 hybrid. */
export interface FeedItemResponse {
  id: string;
  kind: ActivityKindValue;
  occurredAt: string;
  actor: UserPublicResponse | null;
  object: NotificationObjectRef;
  projection: null;
  /** D3.24 FeedItem taxonomy */
  feedItemKind?: FeedItemKindValue;
  contentClass?: FeedContentClassValue;
  score?: number;
}

/**
 * S1 follow mutation outcome. No dedicated §15 FollowResponse catalog entry;
 * projects the directed edge + nested public users.
 */
export interface FollowResponse {
  follower: UserPublicResponse;
  followee: UserPublicResponse;
  createdAt: string;
}

/**
 * S1 §13.13 block mutation outcome. No dedicated §15 BlockResponse catalog entry;
 * projects the directed edge + nested public users (mirrors FollowResponse).
 */
export interface BlockResponse {
  blocker: UserPublicResponse;
  blocked: UserPublicResponse;
  createdAt: string;
}

/** S2 CommunityRole — MVP roles only. */
export type CommunityRoleValue = 'member' | 'moderator' | 'owner' | 'admin';

/** 3b.1e — BACKEND_CHANGES.md §6. One value per circle, the prototype's own four. */
export type CommunityKindValue = 'games' | 'board_games' | 'cosplay' | 'live_events';

/** S1 §15.6 — viewer membership when authenticated and a member. */
export interface CommunityMembershipSummary {
  role: CommunityRoleValue;
  joinedAt: string;
}

/** S1 §15.6 — community aggregate counts (MVP: members only). */
export interface CommunityCounts {
  members: number;
}

/**
 * S1 §15.6 CommunityResponse.
 */
export interface CommunityResponse {
  id: string;
  name: string;
  description: string | null;
  avatarUrl: string | null;
  bannerUrl: string | null;
  viewerMembership: CommunityMembershipSummary | null;
  counts: CommunityCounts;
  /**
   * 3b.1b — how many of the viewer's friends are members, behind §13's
   * "3 friends here" line on a suggested circle.
   *
   * Additive and optional: absent for a guest, and absent from every endpoint
   * that does not compute it, so existing consumers keep working. It is
   * viewer-relative, which is why it sits beside `viewerMembership` rather than
   * inside `counts` — two viewers see different numbers for the same circle.
   */
  viewerFriendCount?: number;
  /**
   * 3b.1e — BACKEND_CHANGES.md §6. Optional per CLAUDE.md's additive-DTO rule;
   * every endpoint that projects a `Community` now computes all three, but the
   * field stays optional so a caller that does not is still a valid response.
   */
  kind?: CommunityKindValue;
  /** Post-kind activity items since the current UTC day's start. */
  postsToday?: number;
  /** At least one post-kind activity item in the last 3 hours. */
  activeNow?: boolean;
}

/** Community members list — user projection + role for a11y (S3 SHCM-03). */
export interface CommunityMemberResponse {
  user: UserPublicResponse;
  role: CommunityRoleValue;
  joinedAt: string;
  /** D3.24 community flair badges (founder · moderator · top_contributor · verified_creator). */
  badges: CommunityMemberBadgeResponse[];
  /**
   * 7.1 — BACKEND_CHANGES.md §5. Derived from the leaderboard window, not a
   * role: top-N by contribution points. A real `true`/`false` wherever the
   * endpoint computes it (every `listMembers` row); optional per CLAUDE.md's
   * additive-DTO rule only because a handful of member-shaped responses
   * (e.g. a role-patch reply) don't recompute the whole leaderboard just to
   * answer — those omit the field rather than guessing at `false`.
   */
  isContributor?: boolean;
}

/** 7.1 — BACKEND_CHANGES.md §5. The only window the endpoint accepts today. */
export type CommunityLeaderboardWindowValue = '7d' | '30d' | '90d';

/** 7.1 — one ranked row of `GET /communities/:id/leaderboard`. */
export interface CommunityLeaderboardEntry {
  rank: number;
  user: UserPublicResponse;
  points: number;
}

/** 7.1 — BACKEND_CHANGES.md §5 `GET /communities/:id/leaderboard?window=90d`. */
export interface CommunityLeaderboardResponse {
  window: CommunityLeaderboardWindowValue;
  entries: CommunityLeaderboardEntry[];
}

/** S1 §13.5 Discover Hub — module registry (no ranking payloads). */
export type DiscoverHubModuleId =
  | 'games'
  | 'communities'
  | 'events'
  | 'trending'
  | 'popular'
  | 'hidden-gems'
  | 'recommended'
  | 'collections'
  | 'because-you-played';

export interface DiscoverHubModule {
  id: DiscoverHubModuleId;
  href: string;
}

export interface DiscoverHubResponse {
  modules: DiscoverHubModule[];
}

export type OwnershipIndicatorValue = 'none' | 'manual' | 'imported' | 'manual_and_imported';

export interface GameLibraryProjection {
  status: LibraryStatusValue;
  source: 'manual' | 'steam_import';
  ownershipIndicator: OwnershipIndicatorValue;
}

export interface GameStatsProjection {
  ratingAverage: number | null;
  ratingCount: number;
  libraryCount: number;
}

export interface GamePlatformSummary {
  id: string;
  name: string;
  slug: string;
}

/**
 * D3.26 — responsive image projection (docs/18_CATALOG/MEDIA_INGESTION.md).
 * `url` is the `standard` WebP variant; `thumbUrl`/`heroUrl` may be null for
 * media ingested before the pipeline existed. `blurHash` renders as a
 * placeholder while the real image loads, holding layout at `width`/`height`
 * so first paint never shifts (CLS = 0).
 */
export interface ResponsiveImage {
  url: string;
  thumbUrl: string | null;
  heroUrl: string | null;
  blurHash: string | null;
  width: number | null;
  height: number | null;
}

/** S1 §15.3 GameResponse — extended by D3.25 catalog metadata. */
export interface GameResponse {
  id: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  /** D3.26 — responsive projection of `coverUrl`; null until processed. */
  coverImage: ResponsiveImage | null;
  platforms: GamePlatformSummary[];
  library: GameLibraryProjection | null;
  stats: GameStatsProjection | null;
  /** D3.25 — additive catalog metadata (docs/18_CATALOG/). */
  heroUrl: string | null;
  /** D3.26 — responsive projection of `heroUrl`; null until processed. */
  heroImage: ResponsiveImage | null;
  summary: string | null;
  description: string | null;
  trailerUrl: string | null;
  externalRating: number | null;
  externalRatingCount: number | null;
  releaseDate: string | null;
  genres: GameCardGenreSummary[];
  tags: GameTagSummary[];
  developers: GameCompanySummary[];
  publishers: GameCompanySummary[];
  franchise: GameFranchiseSummary | null;
  series: GameSeriesSummary | null;
  screenshots: GameMediaResponse[];
  metadata: GameMetadataProjection;
}

/** S1.2 §15 — GameCardResponse for Discover games list. */
export interface GameCardGenreSummary {
  id: string;
  name: string;
  slug: string;
}

export interface GameCardPlatformSummary {
  id: string;
  name: string;
  slug: string;
}

export interface GameRatingSummary {
  average: number | null;
  count: number;
}

export interface GameCardResponse {
  id: string;
  slug: string;
  title: string;
  coverImageUrl: string | null;
  /** D3.26 — responsive projection of `coverImageUrl`; null until processed. */
  coverImage: ResponsiveImage | null;
  /** D3.25 — catalog metadata (docs/18_CATALOG/). */
  heroImageUrl: string | null;
  /** D3.26 — responsive projection of `heroImageUrl`; null until processed. */
  heroImage: ResponsiveImage | null;
  summary: string | null;
  releaseDate: string | null;
  genres: GameCardGenreSummary[];
  platforms: GameCardPlatformSummary[];
  ratingSummary: GameRatingSummary;
  libraryCount: number;
}

/** D3.25 — catalog reference projections. */
export interface GameTagSummary {
  id: string;
  name: string;
  slug: string;
  kind: 'theme' | 'mode' | 'perspective' | 'keyword';
}

export interface GameCompanySummary {
  id: string;
  name: string;
  slug: string;
}

export interface GameSeriesSummary {
  id: string;
  name: string;
  slug: string;
}

export interface GameFranchiseSummary {
  id: string;
  name: string;
  slug: string;
}

export type GameMediaKindValue =
  'screenshot' | 'cover' | 'banner' | 'video' | 'hero' | 'artwork' | 'logo' | 'trailer';

export interface GameMediaResponse {
  id: string;
  kind: GameMediaKindValue;
  url: string | null;
  /** D3.26 — responsive projection of `url`; null until processed. */
  image: ResponsiveImage | null;
  width: number | null;
  height: number | null;
  sortOrder: number;
}

export type GameMetadataStatusValue =
  'pending' | 'enriching' | 'complete' | 'partial' | 'failed' | 'stale';

export interface GameMetadataProjection {
  status: GameMetadataStatusValue;
  provider: 'igdb' | 'steam' | 'rawg' | 'manual' | null;
  refreshedAt: string | null;
  attribution: string | null;
}

/** D3.25 — provider-declared related game, resolved to a catalog row when known. */
export interface GameRelatedGameResponse {
  gameId: string | null;
  title: string | null;
  slug: string | null;
  coverImageUrl: string | null;
  kind: 'similar' | 'dlc' | 'expansion' | 'remake' | 'remaster' | 'prequel' | 'sequel';
}

export interface GameMetadataStatusResponse {
  gameId: string;
  metadata: GameMetadataProjection;
}

/** S1 §15.6 EventResponse — Shared Event detail / discover projection. */
export type EventKindValue =
  | 'game'
  | 'community'
  | 'tournament'
  | 'seasonal'
  | 'lan'
  | 'watch_party'
  | 'coop_session'
  | 'raid'
  | 'release_countdown'
  | 'release'
  | 'community_night'
  | 'speedrun';

/** S2 EventParticipationState — closed vocabulary (+ D3.24 LFG). */
export type EventParticipationStateValue =
  'interested' | 'going' | 'not_going' | 'looking_for_team' | 'need_players' | 'hosting';

/** S1 §15.6 — viewer participation when authenticated and participating. */
export interface EventParticipationSummary {
  state: EventParticipationStateValue;
  createdAt: string;
}

/**
 * Event participation row projection (membership dialect).
 * No S1 list-participants route — used for typed ownership of participation meaning.
 */
export interface EventParticipationResponse {
  user: UserPublicResponse;
  state: EventParticipationStateValue;
  createdAt: string;
}

export interface EventResponse {
  id: string;
  title: string;
  kind: EventKindValue;
  startsAt: string;
  endsAt: string | null;
  viewerParticipation: EventParticipationSummary | null;
  gameId?: string;
  communityId?: string;
  /** 9.4 — denormalized so §21's row doesn't need a second fetch. Absent when `communityId` is absent. */
  communityName?: string | null;
  /** 9.4 — count of `going`/`hosting` participants. Server-derived only. */
  attendeeCount?: number;
}

/** S1 §15.15 — search hit type vocabulary (closed set). D3.22 Search++ additives. */
export type SearchHitType =
  | 'game'
  | 'user'
  | 'review'
  | 'post'
  | 'collection'
  | 'tier-list'
  | 'community'
  | 'event'
  | 'achievement'
  | 'tag';

export interface SearchGameHitSummary {
  title: string;
  slug: string;
  /** D3.25 — catalog enrichment surfaced in search results. */
  coverImageUrl: string | null;
  summary: string | null;
  genres: string[];
}

export interface SearchUserHitSummary {
  handle: string;
  displayName: string;
}

export interface SearchReviewHitSummary {
  excerpt: string;
  gameTitle: string;
}

export interface SearchPostHitSummary {
  excerpt: string;
}

export interface SearchCollectionHitSummary {
  title: string;
}

export interface SearchTierListHitSummary {
  title: string;
}

export interface SearchCommunityHitSummary {
  name: string;
}

export interface SearchEventHitSummary {
  title: string;
  kind: EventKindValue;
}

export interface SearchAchievementHitSummary {
  name: string;
  category: string;
}

export interface SearchTagHitSummary {
  name: string;
  slug: string;
}

export interface SearchGameHit {
  type: 'game';
  id: string;
  summary: SearchGameHitSummary;
}

export interface SearchUserHit {
  type: 'user';
  id: string;
  summary: SearchUserHitSummary;
}

export interface SearchReviewHit {
  type: 'review';
  id: string;
  summary: SearchReviewHitSummary;
}

export interface SearchPostHit {
  type: 'post';
  id: string;
  summary: SearchPostHitSummary;
}

export interface SearchCollectionHit {
  type: 'collection';
  id: string;
  summary: SearchCollectionHitSummary;
}

export interface SearchTierListHit {
  type: 'tier-list';
  id: string;
  summary: SearchTierListHitSummary;
}

export interface SearchCommunityHit {
  type: 'community';
  id: string;
  summary: SearchCommunityHitSummary;
}

export interface SearchEventHit {
  type: 'event';
  id: string;
  summary: SearchEventHitSummary;
}

export interface SearchAchievementHit {
  type: 'achievement';
  id: string;
  summary: SearchAchievementHitSummary;
}

export interface SearchTagHit {
  type: 'tag';
  id: string;
  summary: SearchTagHitSummary;
}

/** S1 §15.15 SearchResponse — discriminated hits only (no ranking metadata). */
export type SearchHit =
  | SearchGameHit
  | SearchUserHit
  | SearchReviewHit
  | SearchPostHit
  | SearchCollectionHit
  | SearchTierListHit
  | SearchCommunityHit
  | SearchEventHit
  | SearchAchievementHit
  | SearchTagHit;

/** S1 §13.5 GET `/search` — paginated list of hits. */
export type SearchResponse = SearchHit[];

/** Nested last message on S1 §15.10 ConversationResponse. */
export interface MessageSummary {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

/**
 * S1 §15.10 ConversationResponse.
 * `unreadCount` is viewer-relative — the count of the requesting participant's own
 * `ConversationParticipant.lastReadAt` against messages from everyone else (9.2).
 */
export interface ConversationResponse {
  id: string;
  participants: UserPublicResponse[];
  lastMessage: MessageSummary | null;
  updatedAt: string;
  unreadCount: number;
}

/**
 * S1 §15.10 MessageResponse. `media` is `null` until message media projection mounts.
 */
export interface MessageResponse {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
  media: null;
}

/** S2 UploadPurpose — closed vocabulary (S1 §14.24). */
export type UploadPurposeValue =
  'avatar' | 'banner' | 'post_media' | 'message_media' | 'community_banner';

/** S2 UploadStatus — closed vocabulary. */
export type UploadStatusValue = 'granted' | 'uploaded' | 'confirmed' | 'expired';

/** S1 §15.13 UploadGrantResponse. */
export interface UploadGrantResponse {
  grantId: string;
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
  headers: Record<string, string>;
}

/**
 * Confirmed upload projection — media id usable in create DTOs (S1 §16).
 * Not a separate §15 catalog row; projects the authoritative Upload after confirm.
 */
export interface UploadResponse {
  id: string;
  purpose: UploadPurposeValue;
  status: UploadStatusValue;
  storageKey: string;
  createdAt: string;
  updatedAt: string;
}

/** S1 §14.17 / S2 ReportTargetType. */
export type ReportTargetTypeValue =
  'user' | 'post' | 'review' | 'comment' | 'community' | 'event' | 'message';

/** Soft closed moderation reason set (S1 §14.17 — members product-governed). */
export type ReportReasonValue =
  | 'spam'
  | 'harassment'
  | 'hate_speech'
  | 'misinformation'
  | 'spoiler'
  | 'nsfw'
  | 'copyright'
  | 'other';

/** S2 ReportStatus. */
export type ReportStatusValue = 'open' | 'in_review' | 'resolved' | 'dismissed';

/** S2 ModerationStatus. */
export type ModerationStatusValue = 'open' | 'assigned' | 'actioned' | 'closed';

/**
 * Player-safe report acknowledgment (S1 §13.13 POST `/reports`).
 * Staff-only fields (§15.18) are never projected on the player API.
 */
export interface ReportResponse {
  id: string;
  targetType: ReportTargetTypeValue;
  targetId: string;
  reason: ReportReasonValue;
  status: ReportStatusValue;
  createdAt: string;
}

/** Moderation workflow case (S2 §10.11) — created with player reports when mappable. */
export interface ModerationCaseResponse {
  id: string;
  reportId: string | null;
  subjectType: ObjectTypeValue;
  subjectId: string;
  status: ModerationStatusValue;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Operational health report (liveness). Not a product surface.
 */
export interface HealthReport {
  status: 'ok';
  timestamp: string;
  uptimeMs: number;
  version: string;
  environment: AppEnvironment;
}

// ---------------------------------------------------------------------------
// D3.21 — Social Platform Core (SOCIAL_API · USER_API · docs/07_SOCIAL)
// ---------------------------------------------------------------------------

export type FriendRequestStatusValue = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export type PresenceStatusValue = 'online' | 'away' | 'offline' | 'invisible';

export type ProfilePinKindValue = 'game' | 'review' | 'collection' | 'achievement';

export type PlayerArchetypeKey =
  | 'collector'
  | 'completionist'
  | 'tryhard'
  | 'explorer'
  | 'reviewer'
  | 'speedrunner'
  | 'backlog_hoarder'
  | 'competitive'
  | 'story_lover'
  | 'indie_hunter'
  | 'achievement_hunter'
  | 'social_gamer';

export type AchievementCategoryValue =
  | 'logging'
  | 'reviewing'
  | 'friends'
  | 'collections'
  | 'tier_lists'
  | 'communities'
  | 'playtime'
  | 'consistency'
  | 'milestones'
  | 'rare'
  | 'hidden';

export type AchievementStateValue = 'locked' | 'in_progress' | 'awarded';

export interface FriendRequestResponse {
  id: string;
  status: FriendRequestStatusValue;
  message: string | null;
  sender: UserPublicResponse;
  receiver: UserPublicResponse;
  createdAt: string;
  respondedAt: string | null;
}

export interface FriendshipResponse {
  user: UserPublicResponse;
  friendsSince: string;
  mutualFriendsCount: number;
}

export interface UserRelationshipResponse {
  isFollowing: boolean;
  followsYou: boolean;
  isFriend: boolean;
  requestSent: boolean;
  requestReceived: boolean;
  isBlocked: boolean;
  blockedBy: boolean;
  mutualFriends: number;
}

export interface PresenceResponse {
  userId: string;
  status: PresenceStatusValue;
  lastSeenAt: string;
}

/** SOCIAL_API OnlineFriend — friend + last-known presence. */
export interface OnlineFriendResponse {
  user: UserPublicResponse;
  presence: PresenceResponse;
}

export interface PlayerArchetypeResponse {
  key: PlayerArchetypeKey;
  score: number;
  awardedAt: string;
}

export interface ProfilePinResponse {
  id: string;
  kind: ProfilePinKindValue;
  objectId: string;
  position: number;
}

// ---------------------------------------------------------------------------
// D3.29 — Profile Theme (docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md "Backend
// follow-ups"). Wire shape matches the client's ProfileCustomization exactly
// so promoting device-local storage to sync is a persistence-adapter swap.
// ---------------------------------------------------------------------------

/** Mirrors `@gmrlog/ui` `AccentKey` — duplicated here so the backend never
 *  depends on the UI package; kept in lockstep by `profile-theme.spec.ts`. */
export type ProfileAccentValue =
  'neutral' | 'ember' | 'plasma' | 'toxic' | 'cobalt' | 'magma' | 'orchid' | 'gold';

export type ProfileCardStyleValue = 'elevated' | 'flat' | 'outlined';

export type ProfileBannerStyleValue = 'artwork' | 'gradient' | 'solid';

export type ConsoleGenerationValue =
  'retro' | 'gen6' | 'gen7' | 'gen8' | 'gen9' | 'pc' | 'handheld';

export interface ProfileThemeResponse {
  accent: ProfileAccentValue;
  cardStyle: ProfileCardStyleValue;
  bannerStyle: ProfileBannerStyleValue;
  favoritePlatform: string | null;
  consoleGeneration: ConsoleGenerationValue | null;
  widgetOrder: string[];
  pinnedWidgets: string[];
  hiddenWidgets: string[];
  /** Owner-only visibility control; omitted from the public projection. */
  profileVisibility?: ContentVisibilityValue;
}

export interface AchievementProgressSummary {
  current: number;
  target: number;
  state: AchievementStateValue;
}

export interface AchievementResponse {
  id: string;
  key: string;
  title: string;
  description: string;
  category: AchievementCategoryValue;
  isHidden: boolean;
  isRare: boolean;
  progress: AchievementProgressSummary;
  awardedAt: string | null;
  /**
   * 9.3 — share of eligible players (individual, active, with library
   * activity) who hold this achievement, one decimal, server-rounded.
   * Optional per CLAUDE.md's additive-DTO rule. `null`/omitted when the
   * denominator is unavailable or the row is redacted.
   */
  holderPercent?: number | null;
}

export interface FavoriteGenreCount {
  genre: string;
  count: number;
}

export interface UserStatisticsResponse {
  gamesLogged: number;
  gamesPlayed: number;
  gamesCompleted: number;
  gamesDropped: number;
  backlogSize: number;
  wishlistSize: number;
  hoursPlayed: number;
  averageRating: number | null;
  completionPercent: number;
  reviewCount: number;
  postCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  friendCount: number;
  communityCount: number;
  collectionCount: number;
  tierListCount: number;
  achievementCount: number;
  favoriteGenres: string[];
  favoriteGenreCounts?: FavoriteGenreCount[];
  favoritePlatform: string | null;
  favoriteDeveloper: string | null;
  favoritePublisher: string | null;
  profileCompletionPercent: number;
  period: 'lifetime' | 'daily' | 'weekly' | 'monthly';
  joinedAt: string;
}

export interface StatisticsSeriesPoint {
  date: string;
  value: number;
}

export interface StatisticsHistoryResponse {
  period: 'daily' | 'weekly' | 'monthly' | 'lifetime';
  completions: StatisticsSeriesPoint[];
  ratings: StatisticsSeriesPoint[];
  collectionGrowth: StatisticsSeriesPoint[];
  reviewGrowth: StatisticsSeriesPoint[];
}

// ---------------------------------------------------------------------------
// D3.22 — Collections & Discovery Engine (docs/09_DISCOVERY)
// ---------------------------------------------------------------------------

export type CollectionTypeValue = 'manual' | 'dynamic' | 'curated' | 'official';

export type WishlistPriorityValue = 'low' | 'medium' | 'high' | 'must_play';

export type WishlistWaitStatusValue =
  'none' | 'waiting_sale' | 'waiting_dlc' | 'waiting_translation' | 'waiting_release';

export type TrendingWindowValue = '24h' | '7d' | '30d';

export type TrendingEntityValue = 'games' | 'reviews' | 'collections' | 'users' | 'communities';

export interface WishlistMetadataResponse {
  priority: WishlistPriorityValue;
  waitStatus: WishlistWaitStatusValue;
  notes: string | null;
}

export interface DiscoveryScoreResponse {
  gameId: string;
  trendingScore: number;
  popularityScore: number;
  reviewScore: number;
  wishlistScore: number;
  completionScore: number;
  freshnessScore: number;
  discoveryScore: number;
  computedAt: string;
}

export interface SimilarGameResponse {
  game: GameCardResponse;
  score: number;
}

export type DnaBand = 'near-identical' | 'strong' | 'partial' | 'different';

export interface DnaDimension {
  key: 'library' | 'genre' | 'reviewRating' | 'wishlist' | 'completion';
  score: number; // 0-100, rounded
}

export interface DnaMatch {
  percent: number; // 0-100, rounded — what the UI shows
  band: DnaBand;
  dimensions: DnaDimension[];
}

export interface SimilarUserResponse {
  user: UserPublicResponse;
  score: number; // unchanged — 0-1, existing consumers keep working
  match?: DnaMatch; // NEW, optional so nothing breaks
}

/** 5.4 — `GET /users/:id/dna-match` (`BACKEND_CHANGES.md` §4). */
export interface DnaMatchResponse {
  user: UserPublicResponse;
  applicable: boolean; // false for organisation / studio accounts
  percent: number;
  band: DnaBand;
  dimensions: DnaDimension[];
  verdict: string; // one sentence
  traits: string[]; // 2-3 short labels
  sharedGames: GameCardResponse[]; // cap at 8
}

export interface RecommendedGameResponse {
  game: GameCardResponse;
  score: number;
  reasonKey: string;
}

export interface TrendingGamesResponse {
  window: TrendingWindowValue;
  items: GameCardResponse[];
}

// ---------------------------------------------------------------------------
// D3.23 — Platform Integrations & Library Sync (docs/10_INTEGRATIONS)
// ---------------------------------------------------------------------------

export type IntegrationProviderValue =
  'steam' | 'xbox' | 'playstation' | 'epic' | 'nintendo' | 'csv';

export type IntegrationSyncTypeValue = 'manual' | 'daily' | 'weekly' | 'monthly' | 'automatic';

export type SyncJobStatusValue = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type SyncConflictResolutionValue = 'keep_local' | 'keep_steam' | 'newest_wins' | 'ask_user';

export interface IntegrationProviderInfo {
  id: IntegrationProviderValue;
  label: string;
  connectable: boolean;
}

export interface UserIntegrationResponse {
  id: string;
  provider: IntegrationProviderValue;
  externalRef: string;
  displayName: string | null;
  status: string;
  syncType: IntegrationSyncTypeValue;
  lastSyncAt: string | null;
  connectedAt: string;
  gamesImported: number;
  achievementsSynced: number;
  /**
   * Task 4.5a — durable in the data, not just in whether an
   * `AccountLink(purpose: 'connect')` row happens to exist. `true` only for
   * a Steam connection proven via OpenID `check_authentication`
   * (`SteamConnectService.connectVerified`); `false` for the self-reported
   * `POST /integrations/steam/connect` path and for providers with no
   * verification concept. Optional so pre-4.5a consumers keep working.
   */
  verified?: boolean;
}

export interface SteamStatusResponse {
  connected: boolean;
  integration: UserIntegrationResponse | null;
}

export interface SteamProfileResponse {
  steamId: string;
  vanityUrl: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  profileUrl: string | null;
}

export interface SyncHistoryResponse {
  id: string;
  provider: IntegrationProviderValue;
  syncType: IntegrationSyncTypeValue;
  status: SyncJobStatusValue;
  startedAt: string;
  finishedAt: string | null;
  durationMs: number | null;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  warningCount: number;
}

export interface SyncJobResponse {
  id: string;
  provider: IntegrationProviderValue;
  syncType: IntegrationSyncTypeValue;
  status: SyncJobStatusValue;
  startedAt: string | null;
  finishedAt: string | null;
  errorCode: string | null;
}

export interface SyncConflictResponse {
  id: string;
  kind: string;
  externalGameId: string | null;
  internalGameId: string | null;
  resolution: SyncConflictResolutionValue | null;
  resolvedAt: string | null;
}

export interface CsvImportPreviewResponse {
  format: string;
  rowCount: number;
  sample: Record<string, string>[];
  columns: string[];
}

/** D3.24 — MuteResponse */
export interface MuteResponse {
  muter: UserPublicResponse;
  muted: UserPublicResponse;
  createdAt: string;
}

/** D3.24 — QuoteResponse */
export interface QuoteResponse {
  id: string;
  author: UserPublicResponse;
  targetType: QuoteTargetTypeValue;
  targetId: string;
  body: string;
  visibility: ContentVisibilityValue;
  createdAt: string;
}

/** D3.24 — RepostResponse */
export interface RepostResponse {
  id: string;
  actor: UserPublicResponse;
  originalPostId: string;
  createdAt: string;
}

/** D3.24 — BookmarkResponse */
export interface BookmarkResponse {
  id: string;
  postId: string;
  createdAt: string;
}

/** D3.24 — Profile Hero */
export interface ProfileHeroResponse {
  steamLevel: number | null;
  completionPercent: number | null;
  currentlyPlayingGameId: string | null;
  favoriteGameIds: string[];
  pinnedCollectionId: string | null;
  archetypeKeys: string[];
  memberSince: string;
  topGenre: string | null;
  totalHours: number | null;
  reputationBadges: ReputationBadgeValue[];
  creatorBadge: boolean;
  /**
   * 9.5b — the profile card's serial (§6's "№ 0042"), zero-padded to 4
   * digits server-side and never reformatted on the client. Additive:
   * absent on a pre-9.5b cached response, degrading to the card's prior
   * "Since <date>" slot.
   */
  cardNumber?: string;
}

/** D3.24 — Game Hub summary */
export interface GameHubResponse {
  gameId: string;
  title: string;
  tabCounts: {
    reviews: number;
    screenshots: number;
    guides: number;
    collections: number;
    tierLists: number;
    events: number;
    communities: number;
    players: number;
  };
}

/** D3.24 Game Hub — Players tab row (privacy-aware; block pairs excluded). */
export interface GameHubPlayerResponse {
  user: UserPublicResponse;
  status: LibraryStatusValue;
}

/** D3.24 Game Hub — Collections tab row (lightweight card, not the full CollectionResponse). */
export interface GameHubCollectionSummaryResponse {
  id: string;
  title: string;
  owner: UserPublicResponse;
  coverUrl: string | null;
  updatedAt: string;
}

/** D3.24 Game Hub — Tier Lists tab row (lightweight card, not the full TierListResponse). */
export interface GameHubTierListSummaryResponse {
  id: string;
  title: string;
  owner: UserPublicResponse;
  updatedAt: string;
}

/** D3.24 Game Hub — Communities tab row (name/tag heuristic or community posts about the game). */
export interface GameHubCommunitySummaryResponse {
  id: string;
  name: string;
  avatarUrl: string | null;
  memberCount: number;
}

/** D3.24 Composer++ — PollResponse (attached to a post, one vote per user). */
export interface PollOptionResponse {
  index: number;
  label: string;
  voteCount: number;
}

export interface PollResponse {
  id: string;
  postId: string;
  question: string;
  options: PollOptionResponse[];
  endsAt: string | null;
  viewerVoteIndex: number | null;
  totalVotes: number;
}

/** D3.24 community wiki page (COMMUNITIES_2.md). */
export interface CommunityWikiPageResponse {
  id: string;
  communityId: string;
  slug: string;
  title: string;
  body: string;
  updatedBy: UserPublicResponse;
  version: number;
  updatedAt: string;
}

/** D3.24 community-scoped pin. */
export interface CommunityPinResponse {
  id: string;
  communityId: string;
  objectType: string;
  objectId: string;
  position: number;
  createdAt: string;
}

/** D3.24 community member badge (founder / moderator / top_contributor / verified_creator). */
export interface CommunityMemberBadgeResponse {
  memberId: string;
  kind: CommunityBadgeKindValue;
  createdAt: string;
}

/** D3.24 LFG — outstanding event invite. */
export interface EventInviteResponse {
  id: string;
  eventId: string;
  inviter: UserPublicResponse;
  invitee: UserPublicResponse;
  createdAt: string;
}

/** D3.24 — behavior-derived reputation award (never purchasable). */
export interface UserReputationResponse {
  badge: ReputationBadgeValue;
  awardedAt: string;
}

/**
 * D3.24 Discover — Because You Played module sections
 * (docs/09_DISCOVERY/BECAUSE_YOU_PLAYED.md). Deterministic, explainable.
 */
export interface BecauseYouPlayedResponse {
  sourceGameId: string;
  sourceGameTitle: string;
  reasonKey: 'because_you_played';
  recommended: GameCardResponse[];
  relatedReviews: ReviewResponse[];
  collections: CollectionResponse[];
  communities: CommunityResponse[];
  events: EventResponse[];
  guides: PostResponse[];
  nextCursor: string | null;
}

/**
 * D3.24 Creator Profile — additive surface (CREATOR_PROFILE.md).
 * Deterministic eligibility only; no purchase path.
 */
export interface CreatorProfileResponse {
  eligible: boolean;
  creatorBadge: boolean;
  followerCount: number;
  featuredPosts: PostResponse[];
  guides: PostResponse[];
  collections: CollectionResponse[];
}

/**
 * 12.1 — Legal document identity. Three documents, not two: KVKK requires an
 * Aydınlatma Metni (disclosure notice) distinct from the privacy policy, and
 * treats explicit consent as a separate act from that disclosure.
 *
 * The id is stable, kebab-case and URL-safe because it is also the path
 * segment 12.2 serves (`GET /api/v1/legal/:document`).
 */
export type LegalDocumentId = 'terms-of-service' | 'privacy-policy' | 'disclosure-notice';

export const LEGAL_DOCUMENT_IDS = [
  'terms-of-service',
  'privacy-policy',
  'disclosure-notice',
] as const satisfies readonly LegalDocumentId[];

/** 12.1 — the two audiences the jurisdiction decision commits to. */
export type LegalLocale = 'en' | 'tr';

export const LEGAL_LOCALES = ['en', 'tr'] as const satisfies readonly LegalLocale[];

/**
 * 12.1 — the versioning rule, stated once so 12.4 does not have to invent it:
 * `major.minor.patch`, and **a major or minor bump requires re-consent while a
 * patch does not**. A patch is reserved for changes that cannot alter what a
 * reader agreed to — typography, a broken link, a translation fix. Anything
 * that changes a right, a purpose, a retention period or a recipient is at
 * least a minor bump, which means every existing acceptance goes stale.
 */
export interface LegalDocumentVersion {
  major: number;
  minor: number;
  patch: number;
}

/** 12.1 — `1.0.0`. The wire format for {@link LegalDocumentVersion}. */
export type LegalDocumentVersionString = string;

/**
 * 12.1 — what 12.4 persists per acceptance: `"privacy-policy@1.0.0"`. One
 * opaque string rather than two columns, so a consent row cannot drift into a
 * document/version pair that never existed.
 */
export type LegalConsentKey = string;

/** 12.1 — metadata without the body. The listing 12.2 serves for drift checks. */
export interface LegalDocumentSummaryResponse {
  id: LegalDocumentId;
  locale: LegalLocale;
  version: LegalDocumentVersionString;
  effectiveDate: string;
  title: string;
  requiresAcceptance: boolean;
}

/** 12.1 — the full document. `body` is Markdown. */
export interface LegalDocumentResponse extends LegalDocumentSummaryResponse {
  body: string;
}

/** 12.4 — a recorded decision. Not a boolean; see `UserConsent.decision`. */
export type LegalConsentDecisionValue = 'accepted' | 'declined' | 'withdrawn';

/** 12.4 — one decision on record, for one document at one version. */
export interface LegalConsentRecordResponse {
  documentId: LegalDocumentId;
  version: LegalDocumentVersionString;
  locale: LegalLocale;
  decision: LegalConsentDecisionValue;
  decidedAt: string;
}

/**
 * 12.4 — where a player stands against the documents that require acceptance.
 *
 * `outstanding` and `satisfied` are separate on purpose, and the gap between
 * them is the whole point. A player who **declined** the current version is not
 * satisfied, but they are also not outstanding: they were asked and they
 * answered. Collapsing the two into one boolean leaves the app no way to tell
 * "has not been asked" from "said no", and the only behaviour available then is
 * to ask again on every launch — which is precisely the dark pattern F2.27 §7
 * forbids.
 */
export interface LegalConsentStateResponse {
  /** Every decision on record, newest first. History, not just the current state. */
  decisions: LegalConsentRecordResponse[];
  /** Required documents whose current version carries no decision at all. Ask about these. */
  outstanding: LegalDocumentSummaryResponse[];
  /** True only when every required document is `accepted` at its current version. */
  satisfied: boolean;
}
