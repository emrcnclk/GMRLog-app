import type {
  ApiEnvelope,
  ApiErrorEnvelope,
  AchievementResponse,
  ActivityItemResponse,
  FeedItemResponse,
  CollectionResponse,
  CommentResponse,
  CommunityKindValue,
  CommunityLeaderboardResponse,
  CommunityLeaderboardWindowValue,
  CommunityMemberResponse,
  CommunityResponse,
  ConnectedAccountResponse,
  CreatorProfileResponse,
  ContentVisibilityValue,
  ConversationResponse,
  CsvImportPreviewResponse,
  DiscoverHubResponse,
  DnaMatchResponse,
  BlockResponse,
  EventResponse,
  FollowResponse,
  FriendRequestResponse,
  FriendshipResponse,
  BookmarkResponse,
  GameCardResponse,
  GameHubCollectionSummaryResponse,
  GameHubCommunitySummaryResponse,
  GameHubPlayerResponse,
  GameHubResponse,
  GameMediaResponse,
  GameMetadataStatusResponse,
  GameRelatedGameResponse,
  GameResponse,
  ProfileHeroResponse,
  ProfilePinKindValue,
  ProfilePinResponse,
  ProfileThemeResponse,
  IntegrationProviderInfo,
  LegalConsentDecisionValue,
  LegalConsentStateResponse,
  LegalDocumentId,
  LegalDocumentResponse,
  LegalDocumentSummaryResponse,
  LegalLocale,
  LibraryEntryResponse,
  LibraryHubResponse,
  LibraryStatusValue,
  MessageResponse,
  NotificationResponse,
  OnlineFriendResponse,
  PlayerArchetypeResponse,
  PostResponse,
  MuteResponse,
  PresenceResponse,
  ReactionResponse,
  RecommendedGameResponse,
  ReportReasonValue,
  ReportResponse,
  ReviewResponse,
  SearchHit,
  SettingsResponse,
  SignInMethodsResponse,
  StatisticsHistoryResponse,
  SimilarGameResponse,
  SimilarUserResponse,
  SteamProfileResponse,
  SteamStatusResponse,
  SyncHistoryResponse,
  SyncJobResponse,
  TierListResponse,
  TrendingWindowValue,
  UploadGrantResponse,
  UploadResponse,
  UserIntegrationResponse,
  UserPublicResponse,
  UserRelationshipResponse,
  UserSelfResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import type { PostCreateInput, ProfileThemePatchInput, QuoteCreateInput } from '@gmrlog/validators';
import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface AxiosApiClientConfig {
  baseUrl: string;
  getAccessToken: () => string | null | Promise<string | null>;
  getRefreshToken: () => string | null | Promise<string | null>;
  onSessionRefreshed: (tokens: { accessToken: string; refreshToken: string }) => Promise<void>;
  onSessionCleared: () => Promise<void>;
  createRequestId?: () => string;
  /** Max network retries for idempotent GETs (default 1). */
  maxRetries?: number;
  /** Optional offline probe — when false, fail fast without hitting the network. */
  isOnline?: () => boolean;
}

export interface ApiRequestOptions {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  /** S1 §11 — Idempotency-Key for listed POST creates. */
  idempotencyKey?: string;
  signal?: AbortSignal;
  skipUnauthorizedRecovery?: boolean;
}

export class FrontendApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly envelope: ApiErrorEnvelope | null,
    readonly requestId: string,
  ) {
    super(message);
    this.name = 'FrontendApiError';
  }
}

function defaultRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

type RetriableConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
  _skipUnauthorizedRecovery?: boolean;
};

/**
 * Axios HTTP client for the Expo app (D3.1).
 * Consumes S1 envelopes · attaches JWT · request id · Idempotency-Key · refresh on 401.
 */
export class AxiosApiClient {
  private readonly http: AxiosInstance;
  private refreshPromise: Promise<boolean> | null = null;
  private readonly maxRetries: number;

  constructor(private readonly config: AxiosApiClientConfig) {
    this.maxRetries = config.maxRetries ?? 1;
    this.http = axios.create({
      baseURL: config.baseUrl.replace(/\/$/, ''),
      timeout: 30_000,
      headers: { Accept: 'application/json' },
    });

    this.http.interceptors.request.use(async (request) => {
      if (this.config.isOnline && !this.config.isOnline()) {
        throw new FrontendApiError('You are offline', 0, null, defaultRequestId());
      }
      const requestId = this.config.createRequestId?.() ?? defaultRequestId();
      request.headers.set('X-Gmrlog-Request-Id', requestId);
      const token = await this.config.getAccessToken();
      if (token) {
        request.headers.set('Authorization', `Bearer ${token}`);
      }
      return request;
    });

    this.http.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        if (!axios.isAxiosError(error) || !error.config) {
          throw error;
        }
        const original = error.config as RetriableConfig;
        const status = error.response?.status;

        if (status === 401 && !original._skipUnauthorizedRecovery) {
          const recovered = await this.refreshSessionInterceptor();
          if (recovered) {
            original._skipUnauthorizedRecovery = true;
            return this.http.request(original);
          }
          await this.config.onSessionCleared();
        }

        if (
          status === undefined &&
          (original.method ?? 'get').toLowerCase() === 'get' &&
          (original._retryCount ?? 0) < this.maxRetries &&
          !isNonRetryableNetworkCode(error.code)
        ) {
          original._retryCount = (original._retryCount ?? 0) + 1;
          await delay(backoffMs(original._retryCount));
          return this.http.request(original);
        }

        throw this.toApiError(error);
      },
    );
  }

  async request<T>(options: ApiRequestOptions): Promise<ApiEnvelope<T>> {
    const headers: Record<string, string> = { ...options.headers };
    if (options.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    try {
      const response = await this.http.request<unknown>({
        method: options.method ?? 'GET',
        url: options.path.startsWith('/') ? options.path : `/${options.path}`,
        params: options.query,
        data: options.body,
        headers,
        signal: options.signal,
        // Custom flags for interceptors
        ...({
          _skipUnauthorizedRecovery: options.skipUnauthorizedRecovery,
        } as object),
      });
      const requestId =
        (response.headers['x-gmrlog-request-id'] as string | undefined) ?? defaultRequestId();
      const parsed = response.data;

      if (parsed !== null && typeof parsed === 'object' && 'data' in parsed && 'meta' in parsed) {
        return parsed as ApiEnvelope<T>;
      }

      return {
        data: parsed as T,
        meta: { requestId },
      };
    } catch (error) {
      if (error instanceof FrontendApiError) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
          throw error;
        }
        throw this.toApiError(error);
      }
      throw error;
    }
  }

  get<T>(
    path: string,
    query?: ApiRequestOptions['query'],
    signal?: AbortSignal,
  ): Promise<ApiEnvelope<T>> {
    return this.request<T>({ method: 'GET', path, query, signal });
  }

  post<T>(path: string, body?: unknown, idempotencyKey?: string): Promise<ApiEnvelope<T>> {
    return this.request<T>({ method: 'POST', path, body, idempotencyKey });
  }

  put<T>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
    return this.request<T>({ method: 'PUT', path, body });
  }

  patch<T>(path: string, body?: unknown): Promise<ApiEnvelope<T>> {
    return this.request<T>({ method: 'PATCH', path, body });
  }

  delete<T>(path: string, query?: ApiRequestOptions['query']): Promise<ApiEnvelope<T>> {
    return this.request<T>({ method: 'DELETE', path, query });
  }

  /** Typed resource helpers — DTOs from `@gmrlog/types` only. */
  me(): Promise<ApiEnvelope<UserSelfResponse>> {
    return this.get<UserSelfResponse>('/me');
  }

  /** `PATCH /me` — self profile patch (S1 §13.3 · §14.5). */
  patchMe(body: {
    displayName?: string;
    bio?: string | null;
    avatarUploadId?: string;
    bannerUploadId?: string;
  }): Promise<ApiEnvelope<UserSelfResponse>> {
    return this.patch<UserSelfResponse>('/me', body);
  }

  /** `GET /library` — shelf hub counts (S1 §13.9). */
  getLibrary(): Promise<ApiEnvelope<LibraryHubResponse>> {
    return this.get<LibraryHubResponse>('/library');
  }

  /** `GET /library/entries` — own entries · optional status filter. */
  listLibraryEntries(query?: {
    status?: LibraryStatusValue;
  }): Promise<ApiEnvelope<LibraryEntryResponse[]>> {
    return this.get<LibraryEntryResponse[]>(
      '/library/entries',
      query?.status !== undefined ? { 'filter[status]': query.status } : undefined,
    );
  }

  /** `GET /collections` — own collections index (S1 §13.8). */
  listCollections(query?: { ownerId?: string }): Promise<ApiEnvelope<CollectionResponse[]>> {
    return this.get<CollectionResponse[]>('/collections', query);
  }

  /** `POST /collections` — create collection. */
  createCollection(body: {
    title: string;
    description?: string | null;
    visibility?: ContentVisibilityValue;
  }): Promise<ApiEnvelope<CollectionResponse>> {
    return this.post<CollectionResponse>('/collections', body);
  }

  /** `GET /collections/{id}` — detail (entries embedded). */
  getCollection(id: string): Promise<ApiEnvelope<CollectionResponse>> {
    return this.get<CollectionResponse>(`/collections/${id}`);
  }

  /** `PATCH /collections/{id}` — update collection. */
  patchCollection(
    id: string,
    body: {
      title?: string;
      description?: string | null;
      visibility?: ContentVisibilityValue;
    },
  ): Promise<ApiEnvelope<CollectionResponse>> {
    return this.patch<CollectionResponse>(`/collections/${id}`, body);
  }

  /** `DELETE /collections/{id}` — soft-delete (204). */
  deleteCollection(id: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/collections/${id}`);
  }

  /**
   * `PUT /collections/{id}/entries` — whole-board replace (array order = position).
   * No incremental add/remove · no separate GET entries (entries on detail).
   */
  replaceCollectionEntries(
    id: string,
    body: { entries: { gameId: string; note?: string | null }[] },
  ): Promise<ApiEnvelope<CollectionResponse>> {
    return this.put<CollectionResponse>(`/collections/${id}/entries`, body);
  }

  /** `GET /tier-lists` — own tier lists index (S1 §13.8). */
  listTierLists(): Promise<ApiEnvelope<TierListResponse[]>> {
    return this.get<TierListResponse[]>('/tier-lists');
  }

  /** `POST /tier-lists` — create tier list. */
  createTierList(body: {
    title: string;
    visibility?: ContentVisibilityValue;
  }): Promise<ApiEnvelope<TierListResponse>> {
    return this.post<TierListResponse>('/tier-lists', body);
  }

  /** `GET /tier-lists/{id}` — detail (slots embedded). */
  getTierList(id: string): Promise<ApiEnvelope<TierListResponse>> {
    return this.get<TierListResponse>(`/tier-lists/${id}`);
  }

  /** `PATCH /tier-lists/{id}` — update title/visibility. */
  patchTierList(
    id: string,
    body: {
      title?: string;
      visibility?: ContentVisibilityValue;
    },
  ): Promise<ApiEnvelope<TierListResponse>> {
    return this.patch<TierListResponse>(`/tier-lists/${id}`, body);
  }

  /** `DELETE /tier-lists/{id}` — soft-delete (204). */
  deleteTierList(id: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/tier-lists/${id}`);
  }

  /**
   * `PUT /tier-lists/{id}/slots` — whole-board replace.
   * Array order = slot position · gameIds order = in-slot position.
   */
  replaceTierListSlots(
    id: string,
    body: { slots: { label: string; gameIds: string[] }[] },
  ): Promise<ApiEnvelope<TierListResponse>> {
    return this.put<TierListResponse>(`/tier-lists/${id}/slots`, body);
  }

  /** `GET /reviews/{id}` — review detail (S1 §13.6). */
  getReview(id: string): Promise<ApiEnvelope<ReviewResponse>> {
    return this.get<ReviewResponse>(`/reviews/${id}`);
  }

  /** `POST /reviews` — create review (idempotent). */
  createReview(
    body: {
      gameId: string;
      rating: number;
      body?: string | null;
      containsSpoilers?: boolean;
      visibility?: ContentVisibilityValue;
    },
    idempotencyKey: string,
  ): Promise<ApiEnvelope<ReviewResponse>> {
    return this.post<ReviewResponse>('/reviews', body, idempotencyKey);
  }

  /** `PATCH /reviews/{id}` — update review. */
  patchReview(
    id: string,
    body: {
      rating?: number;
      body?: string | null;
      containsSpoilers?: boolean;
      visibility?: ContentVisibilityValue;
    },
  ): Promise<ApiEnvelope<ReviewResponse>> {
    return this.patch<ReviewResponse>(`/reviews/${id}`, body);
  }

  /** `DELETE /reviews/{id}` — soft-delete review. */
  deleteReview(id: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/reviews/${id}`);
  }

  /** `GET /games/{id}/reviews` — game review list (array · no cursor). */
  listGameReviews(gameId: string): Promise<ApiEnvelope<ReviewResponse[]>> {
    return this.get<ReviewResponse[]>(`/games/${gameId}/reviews`);
  }

  /** `GET /games/{id}` — S1 §13.6 catalog detail, enriched by D3.25 metadata. */
  getGame(gameId: string): Promise<ApiEnvelope<GameResponse>> {
    return this.get<GameResponse>(`/games/${gameId}`);
  }

  /** `GET /games/{id}/media` — D3.25 mirrored catalog artwork (screenshots · video · artwork). */
  listGameMedia(gameId: string): Promise<ApiEnvelope<GameMediaResponse[]>> {
    return this.get<GameMediaResponse[]>(`/games/${gameId}/media`);
  }

  /** `GET /games/{id}/similar` — D3.25 provider-declared related games. */
  listGameRelated(gameId: string): Promise<ApiEnvelope<GameRelatedGameResponse[]>> {
    return this.get<GameRelatedGameResponse[]>(`/games/${gameId}/similar`);
  }

  /** `GET /games/{id}/metadata` — D3.25 enrichment status + attribution. */
  getGameMetadataStatus(gameId: string): Promise<ApiEnvelope<GameMetadataStatusResponse>> {
    return this.get<GameMetadataStatusResponse>(`/games/${gameId}/metadata`);
  }

  /** `GET /games/{id}/hub` — D3.24 Game Hub summary + tab counts. */
  getGameHub(gameId: string): Promise<ApiEnvelope<GameHubResponse>> {
    return this.get<GameHubResponse>(`/games/${gameId}/hub`);
  }

  /** `GET /games/{id}/feed` — Game Hub hybrid timeline (cursor). */
  listGameFeed(
    gameId: string,
    query?: { cursor?: string; limit?: number },
  ): Promise<ApiEnvelope<FeedItemResponse[]>> {
    return this.get<FeedItemResponse[]>(`/games/${gameId}/feed`, query);
  }

  /** `GET /games/{id}/guides` — guide posts for Game Hub. */
  listGameGuides(gameId: string): Promise<ApiEnvelope<PostResponse[]>> {
    return this.get<PostResponse[]>(`/games/${gameId}/guides`);
  }

  /** `GET /games/{id}/screenshots` — screenshot posts for Game Hub. */
  listGameScreenshots(gameId: string): Promise<ApiEnvelope<PostResponse[]>> {
    return this.get<PostResponse[]>(`/games/${gameId}/screenshots`);
  }

  /** `GET /games/{id}/collections` — collections mentioning the game. */
  listGameCollections(gameId: string): Promise<ApiEnvelope<GameHubCollectionSummaryResponse[]>> {
    return this.get<GameHubCollectionSummaryResponse[]>(`/games/${gameId}/collections`);
  }

  /** `GET /games/{id}/events` — events linked to a game. */
  listGameEvents(gameId: string): Promise<ApiEnvelope<EventResponse[]>> {
    return this.get<EventResponse[]>(`/games/${gameId}/events`);
  }

  /** `GET /games/{id}/communities` — communities linked to a game. */
  listGameCommunities(gameId: string): Promise<ApiEnvelope<GameHubCommunitySummaryResponse[]>> {
    return this.get<GameHubCommunitySummaryResponse[]>(`/games/${gameId}/communities`);
  }

  /** `GET /games/{id}/players` — players with the game in library. */
  listGamePlayers(gameId: string): Promise<ApiEnvelope<GameHubPlayerResponse[]>> {
    return this.get<GameHubPlayerResponse[]>(`/games/${gameId}/players`);
  }

  /** `GET /users/{id}/hero` — D3.24 Profile Hero. */
  getProfileHero(userId: string): Promise<ApiEnvelope<ProfileHeroResponse>> {
    return this.get<ProfileHeroResponse>(`/users/${userId}/hero`);
  }

  /** `GET /discover/because-you-played` — D3.24 discovery module. */
  getBecauseYouPlayed(query?: {
    seedGameId?: string;
    cursor?: string;
  }): Promise<ApiEnvelope<import('@gmrlog/types').BecauseYouPlayedResponse>> {
    return this.get('/discover/because-you-played', query);
  }

  /** `GET /posts/{id}` — post detail (S1 §13.6). */
  getPost(id: string): Promise<ApiEnvelope<PostResponse>> {
    return this.get<PostResponse>(`/posts/${id}`);
  }

  /** `POST /posts` — create post (idempotent · D3.24 poll attach). */
  createPost(body: PostCreateInput, idempotencyKey: string): Promise<ApiEnvelope<PostResponse>> {
    return this.post<PostResponse>('/posts', body, idempotencyKey);
  }

  /** `PATCH /posts/{id}` — update post. */
  patchPost(
    id: string,
    body: {
      body?: string;
      gameId?: string | null;
      communityId?: string | null;
      mediaUploadIds?: string[];
      visibility?: ContentVisibilityValue;
    },
  ): Promise<ApiEnvelope<PostResponse>> {
    return this.patch<PostResponse>(`/posts/${id}`, body);
  }

  /** `DELETE /posts/{id}` — soft-delete post. */
  deletePost(id: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/posts/${id}`);
  }

  /** `GET /games/{id}/posts` — game post list (array · no cursor). */
  listGamePosts(gameId: string): Promise<ApiEnvelope<PostResponse[]>> {
    return this.get<PostResponse[]>(`/games/${gameId}/posts`);
  }

  /** `GET /conversations` — inbox (S1 §13.12 · array · no cursor). */
  listConversations(): Promise<ApiEnvelope<ConversationResponse[]>> {
    return this.get<ConversationResponse[]>('/conversations');
  }

  /** `POST /conversations` — create conversation. */
  createConversation(body: {
    participantUserIds: string[];
  }): Promise<ApiEnvelope<ConversationResponse>> {
    return this.post<ConversationResponse>('/conversations', body);
  }

  /** `GET /conversations/{id}` — conversation detail. */
  getConversation(id: string): Promise<ApiEnvelope<ConversationResponse>> {
    return this.get<ConversationResponse>(`/conversations/${id}`);
  }

  /** `GET /conversations/{id}/messages` — message history (oldest → newest). */
  listMessages(conversationId: string): Promise<ApiEnvelope<MessageResponse[]>> {
    return this.get<MessageResponse[]>(`/conversations/${conversationId}/messages`);
  }

  /** `POST /conversations/{id}/messages` — send message (idempotent · returns conversation). */
  sendMessage(
    conversationId: string,
    body: { body: string; mediaUploadIds?: string[] },
    idempotencyKey: string,
  ): Promise<ApiEnvelope<ConversationResponse>> {
    return this.post<ConversationResponse>(
      `/conversations/${conversationId}/messages`,
      body,
      idempotencyKey,
    );
  }

  /** `GET /communities` — community directory (cursor-paginated, S1 §5). */
  listCommunities(query?: {
    cursor?: string;
    limit?: number;
    /** 3b.1e — §13's filter pills. Omitted means every kind. */
    kind?: CommunityKindValue;
  }): Promise<ApiEnvelope<CommunityResponse[]>> {
    return this.get<CommunityResponse[]>('/communities', query);
  }

  /** `POST /communities` — create community. */
  createCommunity(body: {
    name: string;
    slug: string;
    description?: string | null;
    visibility: ContentVisibilityValue;
  }): Promise<ApiEnvelope<CommunityResponse>> {
    return this.post<CommunityResponse>('/communities', body);
  }

  /** `GET /communities/{id}` — community detail. */
  getCommunity(id: string): Promise<ApiEnvelope<CommunityResponse>> {
    return this.get<CommunityResponse>(`/communities/${id}`);
  }

  /** `PATCH /communities/{id}` — update community (owner). */
  patchCommunity(
    id: string,
    body: {
      name?: string;
      description?: string | null;
      visibility?: ContentVisibilityValue;
    },
  ): Promise<ApiEnvelope<CommunityResponse>> {
    return this.patch<CommunityResponse>(`/communities/${id}`, body);
  }

  /** `DELETE /communities/{id}` — soft-delete (owner). */
  deleteCommunity(id: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/communities/${id}`);
  }

  /** `GET /communities/{id}/feed` — §14's Feed tab (cursor-paginated). */
  listCommunityFeed(
    id: string,
    query?: { cursor?: string; limit?: number },
  ): Promise<ApiEnvelope<FeedItemResponse[]>> {
    return this.get<FeedItemResponse[]>(`/communities/${id}/feed`, query);
  }

  /** `GET /communities/{id}/members` — members (oldest → newest). */
  listCommunityMembers(id: string): Promise<ApiEnvelope<CommunityMemberResponse[]>> {
    return this.get<CommunityMemberResponse[]>(`/communities/${id}/members`);
  }

  /** `GET /communities/{id}/events` — §14's Events tab (cursor-paginated, 3b.2a). */
  listCommunityEvents(
    id: string,
    query?: { cursor?: string; limit?: number },
  ): Promise<ApiEnvelope<EventResponse[]>> {
    return this.get<EventResponse[]>(`/communities/${id}/events`, query);
  }

  /** `GET /communities/{id}/leaderboard` — 7.1, ranked contribution points. */
  getCommunityLeaderboard(
    id: string,
    query?: { window?: CommunityLeaderboardWindowValue; limit?: number },
  ): Promise<ApiEnvelope<CommunityLeaderboardResponse>> {
    return this.get<CommunityLeaderboardResponse>(`/communities/${id}/leaderboard`, query);
  }

  /** `POST /communities/{id}/membership` — join (204). */
  joinCommunity(id: string): Promise<ApiEnvelope<null>> {
    return this.post<null>(`/communities/${id}/membership`);
  }

  /** `DELETE /communities/{id}/membership` — leave (204). */
  leaveCommunity(id: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/communities/${id}/membership`);
  }

  settings(): Promise<ApiEnvelope<SettingsResponse>> {
    return this.get<SettingsResponse>('/settings');
  }

  /** `PATCH /settings/appearance` — theme · locale. */
  patchSettingsAppearance(body: {
    theme?: 'light' | 'dark' | 'system' | null;
    locale?: string | null;
  }): Promise<ApiEnvelope<SettingsResponse>> {
    return this.patch<SettingsResponse>('/settings/appearance', body);
  }

  /** `PATCH /settings/accessibility` — reduceMotion. */
  patchSettingsAccessibility(body: {
    reduceMotion?: boolean;
  }): Promise<ApiEnvelope<SettingsResponse>> {
    return this.patch<SettingsResponse>('/settings/accessibility', body);
  }

  /** `GET /me/profile-theme` — D3.29 synced profile customization (owner view). */
  getProfileTheme(): Promise<ApiEnvelope<ProfileThemeResponse>> {
    return this.get<ProfileThemeResponse>('/me/profile-theme');
  }

  /** `PATCH /me/profile-theme` — D3.29 partial update. */
  patchProfileTheme(body: ProfileThemePatchInput): Promise<ApiEnvelope<ProfileThemeResponse>> {
    return this.patch<ProfileThemeResponse>('/me/profile-theme', body);
  }

  /** `GET /connected-accounts` — linked providers (no secrets). */
  listConnectedAccounts(): Promise<ApiEnvelope<ConnectedAccountResponse[]>> {
    return this.get<ConnectedAccountResponse[]>('/connected-accounts');
  }

  // ---------------------------------------------------------------------------
  // D3.23 — Platform Integrations (docs/10_INTEGRATIONS/API.md)
  // ---------------------------------------------------------------------------

  /** `GET /integrations/providers` — connectable provider catalog. */
  listIntegrationProviders(): Promise<ApiEnvelope<IntegrationProviderInfo[]>> {
    return this.get<IntegrationProviderInfo[]>('/integrations/providers');
  }

  /** `GET /integrations` — player connected integrations. */
  listIntegrations(): Promise<ApiEnvelope<UserIntegrationResponse[]>> {
    return this.get<UserIntegrationResponse[]>('/integrations');
  }

  /** `POST /integrations/steam/connect` — SteamID64 / vanity / profile URL. */
  connectSteam(body: { steamIdOrUrl: string }): Promise<ApiEnvelope<UserIntegrationResponse>> {
    return this.post<UserIntegrationResponse>('/integrations/steam/connect', body);
  }

  /** `POST /integrations/steam/disconnect` — soft disconnect Steam. */
  disconnectSteam(): Promise<ApiEnvelope<null>> {
    return this.post<null>('/integrations/steam/disconnect');
  }

  /** `GET /integrations/steam/status` — connection + last sync. */
  getSteamStatus(): Promise<ApiEnvelope<SteamStatusResponse>> {
    return this.get<SteamStatusResponse>('/integrations/steam/status');
  }

  /** `GET /integrations/steam/profile` — external profile projection. */
  getSteamProfile(): Promise<ApiEnvelope<SteamProfileResponse>> {
    return this.get<SteamProfileResponse>('/integrations/steam/profile');
  }

  /**
   * `POST /auth/connect/steam/start` — OpenID 2.0 connect entry (D4.5).
   * Authenticated (attaches to the signed-in player), unlike `/auth/oauth/*`
   * — Steam is a connect surface, never a login one (OAUTH.md §1).
   */
  steamConnectStart(body: {
    returnTo: string;
  }): Promise<ApiEnvelope<{ authorizeUrl: string; state: string }>> {
    return this.post<{ authorizeUrl: string; state: string }>('/auth/connect/steam/start', body);
  }

  /**
   * `POST /auth/connect/steam/callback` — the full querystring Steam
   * redirected back with, forwarded verbatim (D4.5). No `code`/`state` pair
   * to pick apart client-side the way OAuth2 has — see the backend's own
   * doc comment on `steamConnectCallbackSchema`.
   */
  steamConnectCallback(body: {
    query: Record<string, string>;
  }): Promise<ApiEnvelope<UserIntegrationResponse>> {
    return this.post<UserIntegrationResponse>('/auth/connect/steam/callback', body);
  }

  /** `POST /integrations/:id/sync` — trigger sync job. */
  syncIntegration(
    id: string,
    body: { syncType?: UserIntegrationResponse['syncType'] } = {},
  ): Promise<ApiEnvelope<SyncJobResponse>> {
    return this.post<SyncJobResponse>(`/integrations/${id}/sync`, body);
  }

  /** `GET /integrations/history` — sync history for the player. */
  listIntegrationHistory(query?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<SyncHistoryResponse[]>> {
    return this.get<SyncHistoryResponse[]>('/integrations/history', query);
  }

  /** `POST /integrations/import/csv` — CSV import wizard entry. */
  importCsv(body: {
    format?: 'steamdb' | 'backloggd' | 'backloggery' | 'rawg' | 'ign' | 'generic';
    csv: string;
    conflictResolution?: 'keep_local' | 'keep_steam' | 'newest_wins' | 'ask_user';
  }): Promise<ApiEnvelope<SyncJobResponse>> {
    return this.post<SyncJobResponse>('/integrations/import/csv', body);
  }

  /** `POST /integrations/import/csv/preview` — parse CSV without enqueueing import. */
  previewCsv(body: {
    format?: 'steamdb' | 'backloggd' | 'backloggery' | 'rawg' | 'ign' | 'generic';
    csv: string;
  }): Promise<ApiEnvelope<CsvImportPreviewResponse>> {
    return this.post<CsvImportPreviewResponse>('/integrations/import/csv/preview', body);
  }

  /** `GET /activity` — activity center (S1 §13.11 · cursor pagination). */
  listActivity(query?: {
    cursor?: string;
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<ApiEnvelope<ActivityItemResponse[]>> {
    return this.get<ActivityItemResponse[]>('/activity', query);
  }

  /** `GET /feed` — D3.24 hybrid home feed. */
  listHomeFeed(query?: {
    cursor?: string;
    limit?: number;
    filter?: 'for_you' | 'following' | 'games' | 'reviews' | 'media' | 'communities' | 'events';
    from?: string;
    to?: string;
  }): Promise<ApiEnvelope<FeedItemResponse[]>> {
    return this.get<FeedItemResponse[]>('/feed', query);
  }

  /** `GET /feed/reviews` — D3.24 review feed slices. */
  listReviewFeed(query?: {
    cursor?: string;
    limit?: number;
    slice?: 'latest' | 'friends' | 'popular' | 'negative' | 'hidden_gems';
  }): Promise<ApiEnvelope<FeedItemResponse[]>> {
    return this.get<FeedItemResponse[]>('/feed/reviews', query);
  }

  /** `GET /bookmarks` — private bookmarks. */
  listBookmarks(query?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<BookmarkResponse[]>> {
    return this.get<BookmarkResponse[]>('/bookmarks', query);
  }

  /** `POST /posts/:id/repost` */
  repostPost(postId: string): Promise<ApiEnvelope<unknown>> {
    return this.post(`/posts/${postId}/repost`);
  }

  /** `DELETE /posts/:id/repost` */
  undoRepost(postId: string): Promise<ApiEnvelope<null>> {
    return this.delete(`/posts/${postId}/repost`);
  }

  /** `POST /posts/:id/bookmark` */
  bookmarkPost(
    postId: string,
  ): Promise<ApiEnvelope<{ id: string; postId: string; createdAt: string }>> {
    return this.post(`/posts/${postId}/bookmark`);
  }

  /** `DELETE /posts/:id/bookmark` */
  unbookmarkPost(postId: string): Promise<ApiEnvelope<null>> {
    return this.delete(`/posts/${postId}/bookmark`);
  }

  /** `POST /quotes` — Quote System v2. */
  createQuote(body: QuoteCreateInput): Promise<ApiEnvelope<import('@gmrlog/types').QuoteResponse>> {
    return this.post('/quotes', body);
  }

  /** `POST /posts/:id/poll/vote` */
  votePostPoll(
    postId: string,
    optionIndex: number,
  ): Promise<ApiEnvelope<import('@gmrlog/types').PollResponse>> {
    return this.post(`/posts/${postId}/poll/vote`, { optionIndex });
  }

  /** `POST /posts/:id/poll/close` */
  closePostPoll(postId: string): Promise<ApiEnvelope<import('@gmrlog/types').PollResponse>> {
    return this.post(`/posts/${postId}/poll/close`);
  }

  /** `GET /posts/:id/poll` */
  getPostPoll(postId: string): Promise<ApiEnvelope<import('@gmrlog/types').PollResponse>> {
    return this.get(`/posts/${postId}/poll`);
  }

  /** `POST /events/:id/rsvp` — D3.24 LFG RSVP. */
  rsvpEvent(
    eventId: string,
    body: { state: import('@gmrlog/types').EventParticipationStateValue },
  ): Promise<ApiEnvelope<EventResponse>> {
    return this.post<EventResponse>(`/events/${eventId}/rsvp`, body);
  }

  /** `POST /events/:id/invite` */
  inviteToEvent(eventId: string, userIds: string[]): Promise<ApiEnvelope<null>> {
    return this.post(`/events/${eventId}/invite`, { userIds });
  }

  /** `GET /notifications` — attention desk (S1 §13.11 · cursor pagination). */
  listNotifications(query?: {
    cursor?: string;
    limit?: number;
    from?: string;
    to?: string;
  }): Promise<ApiEnvelope<NotificationResponse[]>> {
    return this.get<NotificationResponse[]>('/notifications', query);
  }

  /** `POST /notifications/read` — mark ids or all (204). */
  markNotificationsRead(body: { ids?: string[]; all?: boolean }): Promise<ApiEnvelope<null>> {
    return this.post<null>('/notifications/read', body);
  }

  /** `GET /discover` — hub module registry (S1 §13.5). */
  getDiscoverHub(): Promise<ApiEnvelope<DiscoverHubResponse>> {
    return this.get<DiscoverHubResponse>('/discover');
  }

  /** `GET /discover/games` — games catalog (S1.2). */
  listDiscoverGames(query?: {
    cursor?: string;
    limit?: number;
    sort?: 'popular' | 'recent' | 'featured';
    genreId?: string;
    platformId?: string;
    franchiseId?: string;
  }): Promise<ApiEnvelope<GameCardResponse[]>> {
    return this.get<GameCardResponse[]>('/discover/games', query);
  }

  /** `GET /discover/communities` — communities hub. */
  listDiscoverCommunities(query?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<CommunityResponse[]>> {
    return this.get<CommunityResponse[]>('/discover/communities', query);
  }

  /** `GET /discover/events` — events hub. */
  listDiscoverEvents(query?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<EventResponse[]>> {
    return this.get<EventResponse[]>('/discover/events', query);
  }

  /** `GET /discover/trending` — D3.22 trending window. */
  listDiscoverTrending(query?: {
    window?: TrendingWindowValue;
    entity?: 'games' | 'reviews' | 'collections' | 'users' | 'communities';
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<GameCardResponse[]>> {
    return this.get<GameCardResponse[]>('/discover/trending', query);
  }

  /** `GET /discover/popular` — D3.22 popular sort alias. */
  listDiscoverPopular(query?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<GameCardResponse[]>> {
    return this.get<GameCardResponse[]>('/discover/popular', query);
  }

  /** `GET /discover/hidden-gems` — high review · low popularity. */
  listDiscoverHiddenGems(query?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<GameCardResponse[]>> {
    return this.get<GameCardResponse[]>('/discover/hidden-gems', query);
  }

  /** `GET /discover/recommended` — rule + formula blend. */
  listDiscoverRecommended(query?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<RecommendedGameResponse[]>> {
    return this.get<RecommendedGameResponse[]>('/discover/recommended', query);
  }

  /** `GET /discover/collections` — public collections discovery. */
  listDiscoverCollections(query?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<CollectionResponse[]>> {
    return this.get<CollectionResponse[]>('/discover/collections', query);
  }

  /** `GET /discover/similar-games/:id` — top-N similar games. */
  listSimilarGames(
    gameId: string,
    query?: { limit?: number },
  ): Promise<ApiEnvelope<SimilarGameResponse[]>> {
    return this.get<SimilarGameResponse[]>(`/discover/similar-games/${gameId}`, query);
  }

  /** `GET /discover/similar-users/:id` — top-N similar users. */
  listSimilarUsers(
    userId: string,
    query?: { limit?: number },
  ): Promise<ApiEnvelope<SimilarUserResponse[]>> {
    return this.get<SimilarUserResponse[]>(`/discover/similar-users/${userId}`, query);
  }

  /** `GET /events/{id}` — event detail. */
  getEvent(id: string): Promise<ApiEnvelope<EventResponse>> {
    return this.get<EventResponse>(`/events/${id}`);
  }

  /** `POST /events/{id}/participation` — join as going (204 · empty body). */
  joinEvent(id: string): Promise<ApiEnvelope<null>> {
    return this.post<null>(`/events/${id}/participation`, {});
  }

  /** `DELETE /events/{id}/participation` — leave (204). */
  leaveEvent(id: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/events/${id}/participation`);
  }

  /** `POST /uploads/grants` — short-lived upload grant. */
  createUploadGrant(body: {
    purpose: 'avatar' | 'banner' | 'post_media' | 'message_media' | 'community_banner';
    contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
    byteSize: number;
  }): Promise<ApiEnvelope<UploadGrantResponse>> {
    return this.post<UploadGrantResponse>('/uploads/grants', body);
  }

  /** `POST /uploads/confirmations` — confirm granted upload. */
  confirmUpload(body: {
    grantId: string;
    storageKey: string;
  }): Promise<ApiEnvelope<UploadResponse>> {
    return this.post<UploadResponse>('/uploads/confirmations', body);
  }

  /** `GET /search` — mixed SearchHit list (S1 §13.5 · §15.15). */
  search(
    query: { q: string; cursor?: string; limit?: number },
    signal?: AbortSignal,
  ): Promise<ApiEnvelope<SearchHit[]>> {
    return this.get<SearchHit[]>('/search', query, signal);
  }

  // ---------------------------------------------------------------------------
  // D3.21 — Social Platform Core (friends · presence · stats · reactions)
  // ---------------------------------------------------------------------------

  /** `GET /friends` — accepted friendships (cursor optional). */
  listFriends(query?: {
    cursor?: string;
    limit?: number;
    q?: string;
  }): Promise<ApiEnvelope<FriendshipResponse[]>> {
    return this.get<FriendshipResponse[]>('/friends', query);
  }

  /** `GET /users/friend-requests` — incoming pending requests. */
  listFriendRequests(query?: {
    cursor?: string;
    limit?: number;
  }): Promise<ApiEnvelope<FriendRequestResponse[]>> {
    return this.get<FriendRequestResponse[]>('/users/friend-requests', query);
  }

  /** `POST /users/{userId}/friend-request` — send request (idempotent). */
  sendFriendRequest(
    userId: string,
    body: { message?: string } = {},
    idempotencyKey: string,
  ): Promise<ApiEnvelope<FriendRequestResponse>> {
    return this.post<FriendRequestResponse>(
      `/users/${userId}/friend-request`,
      body,
      idempotencyKey,
    );
  }

  /** `POST /users/friend-requests/{requestId}/accept`. */
  acceptFriendRequest(
    requestId: string,
    idempotencyKey: string,
  ): Promise<ApiEnvelope<FriendRequestResponse>> {
    return this.post<FriendRequestResponse>(
      `/users/friend-requests/${requestId}/accept`,
      {},
      idempotencyKey,
    );
  }

  /** `POST /users/friend-requests/{requestId}/reject` — 204. */
  rejectFriendRequest(requestId: string): Promise<ApiEnvelope<null>> {
    return this.post<null>(`/users/friend-requests/${requestId}/reject`);
  }

  /** `DELETE /users/friend-requests/{requestId}` — cancel own outgoing (204). */
  cancelFriendRequest(requestId: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/users/friend-requests/${requestId}`);
  }

  /** `DELETE /users/{userId}/friend` — remove friendship (204). */
  removeFriend(userId: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/users/${userId}/friend`);
  }

  /** `GET /users/{userId}/relationship` — follow + friend + block + mutual. */
  getRelationship(userId: string): Promise<ApiEnvelope<UserRelationshipResponse>> {
    return this.get<UserRelationshipResponse>(`/users/${userId}/relationship`);
  }

  /** `GET /me/followers` — the viewer's followers (§15, 3b.3). Not paginated. */
  listMyFollowers(): Promise<ApiEnvelope<UserPublicResponse[]>> {
    return this.get<UserPublicResponse[]>('/me/followers');
  }

  /** `GET /me/following` — who the viewer follows (§15, 3b.3). Not paginated. */
  listMyFollowing(): Promise<ApiEnvelope<UserPublicResponse[]>> {
    return this.get<UserPublicResponse[]>('/me/following');
  }

  /** `POST /follows` — follow a user (idempotent). */
  followUser(userId: string, idempotencyKey: string): Promise<ApiEnvelope<FollowResponse>> {
    return this.post<FollowResponse>('/follows', { userId }, idempotencyKey);
  }

  /** `DELETE /follows/{userId}` — unfollow (204). */
  unfollowUser(userId: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/follows/${userId}`);
  }

  /** `POST /mutes` — mute a user (idempotent). */
  muteUser(userId: string, idempotencyKey: string): Promise<ApiEnvelope<MuteResponse>> {
    return this.post<MuteResponse>('/mutes', { userId }, idempotencyKey);
  }

  /** `POST /blocks` — block a user (idempotent). */
  blockUser(userId: string, idempotencyKey: string): Promise<ApiEnvelope<BlockResponse>> {
    return this.post<BlockResponse>('/blocks', { userId }, idempotencyKey);
  }

  /** `GET /blocks` — the viewer's blocked users (§15, 3b.3a). Cursor-paginated. */
  listBlocks(query?: { cursor?: string; limit?: number }): Promise<ApiEnvelope<BlockResponse[]>> {
    return this.get<BlockResponse[]>('/blocks', query);
  }

  /** `DELETE /blocks/{userId}` — unblock (204). */
  unblockUser(userId: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/blocks/${userId}`);
  }

  /** `POST /reports` — report a user (idempotent). §15's row overflow "Report". */
  reportUser(
    userId: string,
    reason: ReportReasonValue,
    idempotencyKey: string,
  ): Promise<ApiEnvelope<ReportResponse>> {
    return this.post<ReportResponse>(
      '/reports',
      { targetType: 'user', targetId: userId, reason },
      idempotencyKey,
    );
  }

  /** `GET /friends/online` — online/away friends, each with their presence. */
  listOnlineFriends(): Promise<ApiEnvelope<OnlineFriendResponse[]>> {
    return this.get<OnlineFriendResponse[]>('/friends/online');
  }

  /** `GET /presence` — self presence stub. */
  getMyPresence(): Promise<ApiEnvelope<PresenceResponse>> {
    return this.get<PresenceResponse>('/presence');
  }

  /** `PATCH /presence` — update self presence stub. */
  updatePresence(body: {
    status: PresenceResponse['status'];
  }): Promise<ApiEnvelope<PresenceResponse>> {
    return this.patch<PresenceResponse>('/presence', body);
  }

  /** `GET /users/{userId}/presence` — another user's presence stub. */
  getUserPresence(userId: string): Promise<ApiEnvelope<PresenceResponse>> {
    return this.get<PresenceResponse>(`/users/${userId}/presence`);
  }

  /** `GET /me/statistics` — self lifetime stats (may 404 until backend mounts). */
  getMeStatistics(query?: {
    period?: UserStatisticsResponse['period'];
  }): Promise<ApiEnvelope<UserStatisticsResponse>> {
    return this.get<UserStatisticsResponse>('/me/statistics', query);
  }

  /** `GET /me/statistics/history` — bucketed series behind the profile heatmap. */
  getMeStatisticsHistory(query?: {
    period?: StatisticsHistoryResponse['period'];
  }): Promise<ApiEnvelope<StatisticsHistoryResponse>> {
    return this.get<StatisticsHistoryResponse>('/me/statistics/history', query);
  }

  /** `GET /users/{userId}/statistics` — public/self-visible stats. */
  getUserStatistics(
    userId: string,
    query?: { period?: UserStatisticsResponse['period'] },
  ): Promise<ApiEnvelope<UserStatisticsResponse>> {
    return this.get<UserStatisticsResponse>(`/users/${userId}/statistics`, query);
  }

  /** `GET /me/achievements` — self achievement index. */
  getMeAchievements(): Promise<ApiEnvelope<AchievementResponse[]>> {
    return this.get<AchievementResponse[]>('/me/achievements');
  }

  /** `GET /users/{userId}/achievements` — user achievement index. */
  getUserAchievements(userId: string): Promise<ApiEnvelope<AchievementResponse[]>> {
    return this.get<AchievementResponse[]>(`/users/${userId}/achievements`);
  }

  /** `GET /achievements/{id}` — achievement definition detail. */
  getAchievement(id: string): Promise<ApiEnvelope<AchievementResponse>> {
    return this.get<AchievementResponse>(`/achievements/${id}`);
  }

  /** `GET /me/archetypes` — self player archetype badges. */
  getMeArchetypes(): Promise<ApiEnvelope<PlayerArchetypeResponse[]>> {
    return this.get<PlayerArchetypeResponse[]>('/me/archetypes');
  }

  /** `GET /users/{userId}/archetypes` — user archetype badges. */
  getUserArchetypes(userId: string): Promise<ApiEnvelope<PlayerArchetypeResponse[]>> {
    return this.get<PlayerArchetypeResponse[]>(`/users/${userId}/archetypes`);
  }

  /** `GET /me/pins` — self profile showcase pins (9.5d: includes equipped badges). */
  getMyPins(): Promise<ApiEnvelope<ProfilePinResponse[]>> {
    return this.get<ProfilePinResponse[]>('/me/pins');
  }

  /** `GET /users/{userId}/pins` — the public read side of a profile's pins. */
  getUserPins(userId: string): Promise<ApiEnvelope<ProfilePinResponse[]>> {
    return this.get<ProfilePinResponse[]>(`/users/${userId}/pins`);
  }

  /** `PUT /me/pins` — equip/reposition a pin. */
  putMyPin(body: {
    kind: ProfilePinKindValue;
    objectId: string;
    position?: number;
  }): Promise<ApiEnvelope<ProfilePinResponse>> {
    return this.put<ProfilePinResponse>('/me/pins', body);
  }

  /** `DELETE /me/pins` — unequip a pin. */
  deleteMyPin(kind: ProfilePinKindValue, objectId: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>('/me/pins', { kind, objectId });
  }

  /** `POST /reactions` — create reaction / like (idempotent). */
  createReaction(
    body: {
      targetType: ReactionResponse['targetType'];
      targetId: string;
      kind: string;
    },
    idempotencyKey: string,
  ): Promise<ApiEnvelope<ReactionResponse>> {
    return this.post<ReactionResponse>('/reactions', body, idempotencyKey);
  }

  /** `DELETE /reactions/{id}` — remove reaction (204). */
  deleteReaction(id: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/reactions/${id}`);
  }

  /** `POST /comments` — create comment (idempotent). */
  createComment(
    body: {
      hostType: CommentResponse['hostType'];
      hostId: string;
      body: string;
      parentCommentId?: string;
    },
    idempotencyKey: string,
  ): Promise<ApiEnvelope<CommentResponse>> {
    return this.post<CommentResponse>('/comments', body, idempotencyKey);
  }

  /** `PATCH /comments/{id}` — edit own comment body. */
  patchComment(id: string, body: { body: string }): Promise<ApiEnvelope<CommentResponse>> {
    return this.patch<CommentResponse>(`/comments/${id}`, body);
  }

  /** `DELETE /comments/{id}` — soft-delete own comment (204). */
  deleteComment(id: string): Promise<ApiEnvelope<null>> {
    return this.delete<null>(`/comments/${id}`);
  }

  /** `GET /posts/{id}/comments` — flat comment thread. */
  listPostComments(postId: string): Promise<ApiEnvelope<CommentResponse[]>> {
    return this.get<CommentResponse[]>(`/posts/${postId}/comments`);
  }

  /** `GET /reviews/{id}/comments` — flat comment thread. */
  listReviewComments(reviewId: string): Promise<ApiEnvelope<CommentResponse[]>> {
    return this.get<CommentResponse[]>(`/reviews/${reviewId}/comments`);
  }

  /** `GET /users/{userId}` — public profile card. */
  getUserPublic(userId: string): Promise<ApiEnvelope<UserPublicResponse>> {
    return this.get<UserPublicResponse>(`/users/${userId}`);
  }

  /** `GET /users/{userId}/creator` — Creator Profile surface (D3.24). */
  getCreatorProfile(userId: string): Promise<ApiEnvelope<CreatorProfileResponse>> {
    return this.get<CreatorProfileResponse>(`/users/${userId}/creator`);
  }

  /** `GET /users/{userId}/dna-match` — the DNA match panel (5.4). */
  getDnaMatch(userId: string): Promise<ApiEnvelope<DnaMatchResponse>> {
    return this.get<DnaMatchResponse>(`/users/${userId}/dna-match`);
  }

  /** `POST /auth/oauth/{provider}/start` — OAuth flow entry (D4.3 / D4.4 / OAUTH.md §2 step 1). */
  oauthStart(
    provider: 'google' | 'discord',
    body: { redirectUri: string },
  ): Promise<ApiEnvelope<{ authorizeUrl: string; state: string }>> {
    return this.request<{ authorizeUrl: string; state: string }>({
      method: 'POST',
      path: `/auth/oauth/${provider}/start`,
      body,
      skipUnauthorizedRecovery: true,
    });
  }

  /** `POST /auth/oauth/{provider}/callback` — server-side code exchange (D4.3 / D4.4 / OAUTH.md §2 steps 3-4). */
  oauthCallback(
    provider: 'google' | 'discord',
    body: { state: string; code: string },
  ): Promise<ApiEnvelope<{ accessToken: string; refreshToken: string }>> {
    return this.request<{ accessToken: string; refreshToken: string }>({
      method: 'POST',
      path: `/auth/oauth/${provider}/callback`,
      body,
      skipUnauthorizedRecovery: true,
    });
  }

  /**
   * `POST /auth/oauth/{provider}/connect/start` — Settings "Connect" entry
   * (task 4.7 / OAUTH.md §5), authenticated unlike `oauthStart` above.
   */
  oauthConnectStart(
    provider: 'google' | 'discord',
    body: { redirectUri: string },
  ): Promise<ApiEnvelope<{ authorizeUrl: string; state: string }>> {
    return this.request<{ authorizeUrl: string; state: string }>({
      method: 'POST',
      path: `/auth/oauth/${provider}/connect/start`,
      body,
    });
  }

  /** `POST /auth/oauth/{provider}/connect/callback` — completes a Settings "Connect" attempt. */
  oauthConnectCallback(
    provider: 'google' | 'discord',
    body: { state: string; code: string },
  ): Promise<ApiEnvelope<{ connected: true }>> {
    return this.request<{ connected: true }>({
      method: 'POST',
      path: `/auth/oauth/${provider}/connect/callback`,
      body,
      skipUnauthorizedRecovery: true,
    });
  }

  /** `POST /auth/oauth/{provider}/disconnect` — guarded by the last-sign-in-method rule (task 4.7). */
  disconnectOauthProvider(
    provider: 'google' | 'discord',
  ): Promise<ApiEnvelope<{ disconnected: true }>> {
    return this.post<{ disconnected: true }>(`/auth/oauth/${provider}/disconnect`);
  }

  /** `GET /auth/sign-in-methods` — task 4.7's Settings read model. */
  getSignInMethods(): Promise<ApiEnvelope<SignInMethodsResponse>> {
    return this.get<SignInMethodsResponse>('/auth/sign-in-methods');
  }

  /** `POST /auth/password` — sets a password for an oauth-only account (task 4.7's escape hatch). */
  setPassword(body: { email?: string; password: string }): Promise<ApiEnvelope<null>> {
    return this.post<null>('/auth/password', body);
  }

  /** `POST /sessions` — login (S1 §13.1). */
  login(body: {
    email: string;
    password: string;
  }): Promise<ApiEnvelope<{ accessToken: string; refreshToken: string }>> {
    return this.request<{ accessToken: string; refreshToken: string }>({
      method: 'POST',
      path: '/sessions',
      body,
      skipUnauthorizedRecovery: true,
    });
  }

  /**
   * `POST /sessions/register` — register (S1 §14.2).
   *
   * 12.4 — the legal fields are required, not optional. The caller sends the
   * versions it actually displayed so the server can refuse a stale submission:
   * a player who left the sign-up screen open across a deploy read a document
   * that is no longer current, and recording that as agreement to the new one
   * would be a false statement in the evidence.
   *
   * 12.4a — `shownLegalDocuments` lists everything displayed and `termsAccepted`
   * carries the tick. Only the Terms are accepted; the notices are acknowledged,
   * and the server derives which is which from the document itself, so a client
   * cannot mislabel a privacy notice as consent.
   */
  register(body: {
    email: string;
    password: string;
    displayName: string;
    handle: string;
    /** 12.4c — `YYYY-MM-DD`. A date, not an age. */
    birthDate: string;
    /** 12.4c — ISO 3166-1 alpha-2, chosen by the player, never from an IP. */
    countryCode: string;
    /** 12.4c — also the language of the Terms presented for acceptance. */
    locale: LegalLocale;
    firstName?: string;
    lastName?: string;
    shownLegalDocuments: {
      documentId: LegalDocumentId;
      version: string;
      locale: LegalLocale;
    }[];
    termsAccepted: true;
  }): Promise<ApiEnvelope<{ accessToken: string; refreshToken: string }>> {
    return this.request<{ accessToken: string; refreshToken: string }>({
      method: 'POST',
      path: '/sessions/register',
      body,
      skipUnauthorizedRecovery: true,
    });
  }

  /** `POST /sessions/refresh` — refresh (S1 §13.1). */
  refreshSession(
    refreshToken: string,
  ): Promise<ApiEnvelope<{ accessToken: string; refreshToken: string }>> {
    return this.request<{ accessToken: string; refreshToken: string }>({
      method: 'POST',
      path: '/sessions/refresh',
      body: { refreshToken },
      skipUnauthorizedRecovery: true,
    });
  }

  /** `DELETE /sessions/current` — logout (S1 §13.1). */
  logoutSession(): Promise<ApiEnvelope<null>> {
    return this.delete<null>('/sessions/current');
  }

  /**
   * `GET /legal` — every legal document's current version, no bodies (12.2).
   *
   * Public: the route takes no token, and the reader has to work for a visitor
   * standing on the sign-in screen who does not have one yet. The request
   * interceptor only attaches `Authorization` when a token exists, so this
   * needs no special casing — but it does mean a 401 can never be the reason
   * this call fails, which the error mapping downstream relies on.
   */
  listLegalDocuments(query?: {
    locale?: LegalLocale;
  }): Promise<ApiEnvelope<LegalDocumentSummaryResponse[]>> {
    return this.get<LegalDocumentSummaryResponse[]>('/legal', query);
  }

  /** `GET /legal/{document}` — one document, Markdown body included (12.2). */
  getLegalDocument(
    document: LegalDocumentId,
    query?: { locale?: LegalLocale },
  ): Promise<ApiEnvelope<LegalDocumentResponse>> {
    return this.get<LegalDocumentResponse>(`/legal/${document}`, query);
  }

  /** `GET /me/legal-consents` — this player's consent record (12.4). */
  getLegalConsents(query?: {
    locale?: LegalLocale;
  }): Promise<ApiEnvelope<LegalConsentStateResponse>> {
    return this.get<LegalConsentStateResponse>('/me/legal-consents', query);
  }

  /** `POST /me/legal-consents` — accept, decline or withdraw (12.4). */
  recordLegalConsents(body: {
    decisions: {
      documentId: LegalDocumentId;
      version: string;
      locale: LegalLocale;
      decision: LegalConsentDecisionValue;
    }[];
  }): Promise<ApiEnvelope<LegalConsentStateResponse>> {
    return this.post<LegalConsentStateResponse>('/me/legal-consents', body);
  }

  /**
   * `POST /me/legal-consents/acknowledgements` — record that a notice was
   * displayed, not agreed to (12.4b).
   *
   * The gap 12.4a left open: `register` records a notice shown at sign-up, but
   * nothing recorded one shown afterwards — an OAuth account seeing the
   * Privacy Policy for the first time, or any account whose notices moved to a
   * new version. No `decision` field: there is nothing to decide, and the
   * server refuses a document that requires acceptance rather than accept one
   * through the wrong door.
   */
  acknowledgeLegalDocuments(body: {
    documents: { documentId: LegalDocumentId; version: string; locale: LegalLocale }[];
  }): Promise<ApiEnvelope<LegalConsentStateResponse>> {
    return this.post<LegalConsentStateResponse>('/me/legal-consents/acknowledgements', body);
  }

  private async refreshSessionInterceptor(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const refreshToken = await this.config.getRefreshToken();
      if (!refreshToken) {
        return false;
      }
      try {
        const response = await this.http.post<
          ApiEnvelope<{ accessToken: string; refreshToken: string }>
        >('/sessions/refresh', { refreshToken }, { headers: { Authorization: undefined } });
        const tokens = response.data.data;
        if (tokens.accessToken.length === 0 || tokens.refreshToken.length === 0) {
          return false;
        }
        await this.config.onSessionRefreshed(tokens);
        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private toApiError(error: unknown): FrontendApiError {
    if (!axios.isAxiosError(error)) {
      return new FrontendApiError('Unexpected network error', 0, null, defaultRequestId());
    }
    if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return new FrontendApiError('Request cancelled', 0, null, defaultRequestId());
    }
    if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
      return new FrontendApiError('Request timed out', 0, null, defaultRequestId());
    }
    if (error.code === 'ERR_NETWORK' || error.message.toLowerCase().includes('network')) {
      return new FrontendApiError('Network unavailable', 0, null, defaultRequestId());
    }
    const status = error.response?.status ?? 0;
    const responseHeaders: unknown = error.response?.headers;
    const configHeaders: unknown = error.config?.headers;
    const requestId =
      readHeader(responseHeaders, 'x-gmrlog-request-id') ??
      readHeader(configHeaders, 'X-Gmrlog-Request-Id') ??
      defaultRequestId();
    const parsed: unknown = error.response?.data;
    const envelope =
      parsed !== null && typeof parsed === 'object' && 'error' in parsed
        ? (parsed as ApiErrorEnvelope)
        : null;
    return new FrontendApiError(
      envelope?.error.message ?? error.message,
      status,
      envelope,
      requestId,
    );
  }
}

function readHeader(headers: unknown, name: string): string | undefined {
  if (headers === null || typeof headers !== 'object') {
    return undefined;
  }
  const value = (headers as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : undefined;
}

function isNonRetryableNetworkCode(code: string | undefined): boolean {
  return code === 'ERR_CANCELED' || code === 'ECONNABORTED';
}

function backoffMs(attempt: number): number {
  return Math.min(1_000 * 2 ** (attempt - 1), 4_000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createAxiosApiClient(config: AxiosApiClientConfig): AxiosApiClient {
  return new AxiosApiClient(config);
}
