import type { WorkspacePackageName } from '@gmrlog/types';
import { z } from 'zod';

export const workspacePackageNameSchema = z.enum([
  'types',
  'validators',
  'config',
  'api-sdk',
  'ui',
  'frontend',
  'backend',
]);

export type ValidatedWorkspacePackageName = z.infer<typeof workspacePackageNameSchema> &
  WorkspacePackageName;

// ---------------------------------------------------------------------------
// User domain (D2.2) — S1 request DTO catalog. Single source of validation:
// backend DTOs and future SDK inputs consume these schemas, never duplicates.
// ---------------------------------------------------------------------------

/** S1 §14.1 / §14.2 — email (valid · max 320). */
export const emailSchema = z
  .string()
  .trim()
  .email('Enter a valid email address, for example player@example.com')
  .max(320, 'Email must be 320 characters or fewer');

/**
 * Security policy password (AUTHENTICATION.md · min 12).
 * Used by register / password-change surfaces — not login emptiness alone.
 */
export const passwordPolicySchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be 128 characters or fewer');

/** S1 §14.2 — displayName rules (1–40 · trimmed); reused by §14.5 MePatch. */
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Display name is required')
  .max(40, 'Display name must be 40 characters or fewer');

/** S1 §14.1 SessionCreateRequest — login (email · password required). */
export const sessionCreateSchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1).max(128),
  })
  .strict();

export type SessionCreateInput = z.infer<typeof sessionCreateSchema>;

/** S1 §14.2 handle — unique · allowlisted charset (lowercase alnum + underscore). */
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,24}$/, 'Handle must be 3–24 characters: a-z, 0-9, underscore');

/** S1 §14.2 SessionRegisterRequest. */
export const sessionRegisterSchema = z
  .object({
    email: emailSchema,
    password: passwordPolicySchema,
    displayName: displayNameSchema,
    handle: handleSchema,
  })
  .strict();

export type SessionRegisterInput = z.infer<typeof sessionRegisterSchema>;

/** S1 §13.1 refresh body — opaque refresh credential. */
export const sessionRefreshSchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();

export type SessionRefreshInput = z.infer<typeof sessionRefreshSchema>;

/** S1 — password forgot request (email only). */
export const passwordForgotSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

export type PasswordForgotInput = z.infer<typeof passwordForgotSchema>;

/** S1 — password reset request (token + new password). */
export const passwordResetSchema = z
  .object({
    token: z.string().trim().min(1),
    password: passwordPolicySchema,
  })
  .strict();

export type PasswordResetInput = z.infer<typeof passwordResetSchema>;

/** D4.3 / OAUTH.md §2 step 1 — `POST /auth/oauth/:provider/start` body. */
export const oauthStartSchema = z
  .object({
    redirectUri: z.string().trim().url().max(2048),
  })
  .strict();

export type OAuthStartInput = z.infer<typeof oauthStartSchema>;

/** D4.3 / OAUTH.md §2 step 3 — `POST /auth/oauth/:provider/callback` body. */
export const oauthCallbackSchema = z
  .object({
    state: z.string().trim().min(1).max(512),
    code: z.string().trim().min(1).max(2048),
  })
  .strict();

export type OAuthCallbackInput = z.infer<typeof oauthCallbackSchema>;

/** D4.5 / OAUTH.md — `POST /auth/connect/steam/start` body. */
export const steamConnectStartSchema = z
  .object({
    returnTo: z.string().trim().url().max(2048),
  })
  .strict();

export type SteamConnectStartInput = z.infer<typeof steamConnectStartSchema>;

/**
 * D4.5 — `POST /auth/connect/steam/callback` body. Steam's OpenID 2.0 return
 * carries no `code`/`state` pair the way OAuth2 does — everything (including
 * the `state` this app minted at `/start`) rides on the querystring of the
 * `return_to` URL Steam redirects back to, so the client forwards that
 * querystring verbatim rather than picking fields out of it itself.
 */
export const steamConnectCallbackSchema = z
  .object({
    query: z.record(z.string()),
  })
  .strict();

export type SteamConnectCallbackInput = z.infer<typeof steamConnectCallbackSchema>;

/**
 * D4.7 / OAUTH.md §5 — `POST /auth/password` body. `email` is required only
 * when the caller has no existing `type=password` row at all (an
 * unverified-email OAuth signup never got the `secretHash: null` claim
 * placeholder `OAuthService` plants for a verified one) — `SessionsService.
 * setPassword` is what decides whether it's needed.
 */
export const setPasswordSchema = z
  .object({
    email: emailSchema.optional(),
    password: passwordPolicySchema,
  })
  .strict();

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

/** D4.7 / OAUTH.md §2 step 1 — `POST /auth/oauth/:provider/connect/start` body. */
export const oauthConnectStartSchema = oauthStartSchema;

export type OAuthConnectStartInput = z.infer<typeof oauthConnectStartSchema>;

/** D4.7 / OAUTH.md §2 step 3 — `POST /auth/oauth/:provider/connect/callback` body. */
export const oauthConnectCallbackSchema = oauthCallbackSchema;

export type OAuthConnectCallbackInput = z.infer<typeof oauthConnectCallbackSchema>;

/** S1 §14.18 BlockCreateRequest. */
export const blockCreateSchema = z
  .object({
    userId: z.string().min(1),
  })
  .strict();

export type BlockCreateInput = z.infer<typeof blockCreateSchema>;

/** S1 §14.5 — bio: max 500 · null clears. */
export const bioSchema = z.string().max(500).nullable();

/** S1 §14.5 MePatchRequest — allowlisted fields only. */
export const mePatchSchema = z
  .object({
    displayName: displayNameSchema.optional(),
    bio: bioSchema.optional(),
    avatarUploadId: z.string().min(1).optional(),
    bannerUploadId: z.string().min(1).optional(),
  })
  .strict();

export type MePatchInput = z.infer<typeof mePatchSchema>;

/** F4 / S2 §14 — closed appearance theme vocabulary. */
export const themePreferenceSchema = z.enum(['light', 'dark', 'system']);

/** S1 §14.23 — appearance patch: enums + locale string only · null clears. */
export const settingsAppearancePatchSchema = z
  .object({
    theme: themePreferenceSchema.nullable().optional(),
    locale: z.string().trim().min(2).max(35).nullable().optional(),
  })
  .strict();

export type SettingsAppearancePatchInput = z.infer<typeof settingsAppearancePatchSchema>;

/** S1 §14.23 — accessibility patch: booleans only. */
export const settingsAccessibilityPatchSchema = z
  .object({
    reduceMotion: z.boolean().optional(),
  })
  .strict();

export type SettingsAccessibilityPatchInput = z.infer<typeof settingsAccessibilityPatchSchema>;

// ---------------------------------------------------------------------------
// Library domain (D2.3) — S1 §14.9 request catalog + list filter dialect.
// ---------------------------------------------------------------------------

/** S2 §14 / S1 §14.9 — closed LibraryStatus vocabulary. */
export const libraryStatusSchema = z.enum([
  'owned',
  'playing',
  'completed',
  'wishlist',
  'backlog',
  'hidden',
  'dropped',
]);

/** S2 §14 / S1 §14.9 — closed LibrarySource vocabulary. */
export const librarySourceSchema = z.enum(['manual', 'steam_import']);

/** S1 §14.9 LibraryEntryUpsertRequest — allowlisted fields only. */
export const libraryEntryUpsertSchema = z
  .object({
    status: libraryStatusSchema,
    platformId: z.string().min(1).optional(),
    note: z.string().max(2000).nullable().optional(),
    source: librarySourceSchema.optional(),
  })
  .strict();

export type LibraryEntryUpsertInput = z.infer<typeof libraryEntryUpsertSchema>;

/**
 * S1 §6 / §13.9 — `filter[status]` query dialect for shelf lists.
 * Fastify's default querystring parser keeps bracket keys flat
 * (`filter[status]`); nested `{ filter: { status } }` is also accepted.
 */
export const libraryEntriesQuerySchema = z.preprocess(
  (raw) => {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      return raw;
    }
    const record = raw as Record<string, unknown>;
    if (record.filter !== undefined) {
      return { filter: record.filter };
    }
    if (record['filter[status]'] !== undefined) {
      return { filter: { status: record['filter[status]'] } };
    }
    return {};
  },
  z
    .object({
      filter: z
        .object({
          status: libraryStatusSchema.optional(),
        })
        .strict()
        .optional(),
    })
    .strict(),
);

export interface LibraryEntriesQueryInput {
  filter?: {
    status?: z.infer<typeof libraryStatusSchema>;
  };
}

/** Path `gameId` for `/library/entries/{gameId}`. */
export const libraryEntryGameIdParamSchema = z
  .object({
    gameId: z.string().min(1),
  })
  .strict();

export type LibraryEntryGameIdParam = z.infer<typeof libraryEntryGameIdParamSchema>;

// ---------------------------------------------------------------------------
// Review domain (D2.4) — S1 §14.7 request catalog + ContentVisibility.
// ---------------------------------------------------------------------------

/**
 * Closed product rating scale (integer). Fits S2 `Review.rating` Int and the
 * product-documented 1–10 bound (`docs/01_PRODUCT/RECOMMENDATION_ENGINE.md`).
 * Half-star / weighted systems are out of constitutional scope.
 */
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 10;
/** D3.24 Review Feed — ratings at or below this count as negative (1–10 scale). */
export const REVIEW_NEGATIVE_RATING_MAX = 4;
/** D3.24 Hidden Gems — games with popularity at or below this are eligible. */
export const REVIEW_HIDDEN_GEM_MAX_POPULARITY = 100;

export const reviewRatingSchema = z.number().int().min(REVIEW_RATING_MIN).max(REVIEW_RATING_MAX);

/** S2 §14 / S1 §14.6 — closed ContentVisibility vocabulary. */
export const contentVisibilitySchema = z.enum(['public', 'followers', 'private', 'community']);

/** S1 §14.7 ReviewCreateRequest — allowlisted fields only. */
export const reviewCreateSchema = z
  .object({
    gameId: z.string().min(1),
    rating: reviewRatingSchema,
    body: z.string().max(10_000).nullable().optional(),
    containsSpoilers: z.boolean().optional(),
    /** S2 field · §15.4 response; default applied by the domain when omitted. */
    visibility: contentVisibilitySchema.optional(),
  })
  .strict();

export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

/**
 * PATCH /reviews/{id} — editable subset of create fields (gameId immutable).
 * No dedicated §14 patch catalog; allowlist mirrors create without gameId.
 */
export const reviewPatchSchema = z
  .object({
    rating: reviewRatingSchema.optional(),
    body: z.string().max(10_000).nullable().optional(),
    containsSpoilers: z.boolean().optional(),
    visibility: contentVisibilitySchema.optional(),
  })
  .strict();

export type ReviewPatchInput = z.infer<typeof reviewPatchSchema>;

export const reviewIdParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export type ReviewIdParam = z.infer<typeof reviewIdParamSchema>;

export const gameIdParamSchema = z
  .object({
    id: z.string().min(1),
  })
  .strict();

export type GameIdParam = z.infer<typeof gameIdParamSchema>;

// ---------------------------------------------------------------------------
// Comment domain (D2.5) — S1 §14.8 request catalog.
// ---------------------------------------------------------------------------

/** S2 §14 / S1 §14.8 — closed CommentHostType vocabulary. */
export const commentHostTypeSchema = z.enum(['post', 'review', 'collection', 'tier_list']);

/** Opaque id (cuid class) — not UUID; platform ids are OpaqueId per S1. */
export const opaqueIdSchema = z.string().trim().min(1).max(64);

export const COMMENT_BODY_MAX = 5_000;

/** Non-empty trimmed body — rejects whitespace-only. */
export const commentBodySchema = z.string().trim().min(1).max(COMMENT_BODY_MAX);

/** S1 §14.8 CommentCreateRequest — allowlisted fields only. */
export const commentCreateSchema = z
  .object({
    hostType: commentHostTypeSchema,
    hostId: opaqueIdSchema,
    body: commentBodySchema,
    parentCommentId: opaqueIdSchema.optional(),
  })
  .strict();

export type CommentCreateInput = z.infer<typeof commentCreateSchema>;

export const commentIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type CommentIdParam = z.infer<typeof commentIdParamSchema>;

/** Path `{id}` for `/posts/{id}/comments` and `/reviews/{id}/comments`. */
export const commentHostIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type CommentHostIdParam = z.infer<typeof commentHostIdParamSchema>;

// ---------------------------------------------------------------------------
// Reaction domain (D2.6) — S1 §14.19 request catalog.
// ---------------------------------------------------------------------------

/** S2 §14 / S1 §14.19 — closed ReactionTargetType vocabulary. */
export const reactionTargetTypeSchema = z.enum([
  'post',
  'review',
  'comment',
  'collection',
  'tier_list',
]);

/** D3.21 product like — primary reaction kind (documented in ACHIEVEMENT/SOCIAL docs). */
export const REACTION_KIND_LIKE = 'like' as const;

/**
 * Constitutional placeholder for ReactionKind.
 *
 * S1/S2 require a closed product reaction set but enumerate no members
 * (`docs/07_DATABASE/S2_CLOSED_ENUM_GAP_REPORT.md` §3). Validators therefore
 * accept a non-empty trimmed string and do **not** invent enum members.
 * Promote to `z.enum([...])` only after a product/S2 amendment.
 */
export const REACTION_KIND_MAX = 64;
export const reactionKindSchema = z.string().trim().min(1).max(REACTION_KIND_MAX);

/** S1 §14.19 ReactionCreateRequest — allowlisted fields only. */
export const reactionCreateSchema = z
  .object({
    targetType: reactionTargetTypeSchema,
    targetId: opaqueIdSchema,
    kind: reactionKindSchema,
  })
  .strict();

export type ReactionCreateInput = z.infer<typeof reactionCreateSchema>;

export const reactionIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type ReactionIdParam = z.infer<typeof reactionIdParamSchema>;

// ---------------------------------------------------------------------------
// Post domain (D2.7) — S1 §14.6 request catalog.
// ---------------------------------------------------------------------------

export const POST_BODY_MAX = 5_000;

/** Non-empty trimmed body — rejects whitespace-only. Max per product (5000). */
export const postBodySchema = z.string().trim().min(1).max(POST_BODY_MAX);

/** S1 §14.6 PostCreateRequest — allowlisted fields only. */
export const postCreateSchema = z
  .object({
    body: postBodySchema,
    gameId: opaqueIdSchema.optional(),
    communityId: opaqueIdSchema.optional(),
    mediaUploadIds: z.array(opaqueIdSchema).optional(),
    visibility: contentVisibilitySchema.optional(),
    postKind: z.enum(['text', 'screenshot', 'video', 'poll', 'guide', 'news', 'quote']).optional(),
    containsSpoilers: z.boolean().optional(),
    poll: z
      .object({
        question: z.string().trim().min(1).max(280),
        options: z.array(z.string().trim().min(1).max(100)).min(2).max(6),
        endsAt: z.string().datetime().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();

export type PostCreateInput = z.infer<typeof postCreateSchema>;

/**
 * PATCH /posts/{id} — editable subset of create fields.
 * No dedicated §14 patch catalog; allowlist mirrors create.
 * `gameId` / `communityId` may clear with null.
 */
export const postPatchSchema = z
  .object({
    body: postBodySchema.optional(),
    gameId: opaqueIdSchema.nullable().optional(),
    communityId: opaqueIdSchema.nullable().optional(),
    mediaUploadIds: z.array(opaqueIdSchema).optional(),
    visibility: contentVisibilitySchema.optional(),
  })
  .strict();

export type PostPatchInput = z.infer<typeof postPatchSchema>;

export const postIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type PostIdParam = z.infer<typeof postIdParamSchema>;

// ---------------------------------------------------------------------------
// Collection domain (D2.8) — S1 §14.10–14.11 request catalog.
// ---------------------------------------------------------------------------

export const COLLECTION_TITLE_MAX = 100;
export const COLLECTION_DESCRIPTION_MAX = 2_000;
export const COLLECTION_ENTRY_NOTE_MAX = 2_000;

export const collectionTitleSchema = z.string().trim().min(1).max(COLLECTION_TITLE_MAX);

export const collectionDescriptionSchema = z
  .string()
  .trim()
  .max(COLLECTION_DESCRIPTION_MAX)
  .nullable();

/** S1 §14.10 CollectionCreateRequest. D3.22 Collection++ additives. */
export const collectionTypeSchema = z.enum(['manual', 'dynamic', 'curated', 'official']);

export const collectionCreateSchema = z
  .object({
    title: collectionTitleSchema,
    description: collectionDescriptionSchema.optional(),
    visibility: contentVisibilitySchema.optional(),
    type: collectionTypeSchema.optional(),
    ruleKey: z.string().trim().min(1).max(64).nullable().optional(),
    color: z.string().trim().min(1).max(32).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(32)).max(20).optional(),
  })
  .strict();

export type CollectionCreateInput = z.infer<typeof collectionCreateSchema>;

/** S1 §14.10 CollectionPatchRequest — allowlisted fields only. */
export const collectionPatchSchema = z
  .object({
    title: collectionTitleSchema.optional(),
    description: collectionDescriptionSchema.optional(),
    visibility: contentVisibilitySchema.optional(),
    type: collectionTypeSchema.optional(),
    ruleKey: z.string().trim().min(1).max(64).nullable().optional(),
    color: z.string().trim().min(1).max(32).nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(32)).max(20).optional(),
  })
  .strict();

export type CollectionPatchInput = z.infer<typeof collectionPatchSchema>;

export const collectionIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type CollectionIdParam = z.infer<typeof collectionIdParamSchema>;

/**
 * S1 §13.8 — `GET /collections` query. Optional `ownerId` for another player's
 * public collections when product allows.
 */
export const collectionsQuerySchema = z
  .object({
    ownerId: opaqueIdSchema.optional(),
  })
  .strict();

export type CollectionsQueryInput = z.infer<typeof collectionsQuerySchema>;

const collectionEntryPutItemSchema = z
  .object({
    gameId: opaqueIdSchema,
    note: z.string().trim().max(COLLECTION_ENTRY_NOTE_MAX).nullable().optional(),
  })
  .strict();

/** S1 §14.11 CollectionEntriesPutRequest — array order = position. */
export const collectionEntriesPutSchema = z
  .object({
    entries: z.array(collectionEntryPutItemSchema),
  })
  .strict();

export type CollectionEntriesPutInput = z.infer<typeof collectionEntriesPutSchema>;

// ---------------------------------------------------------------------------
// Tier list domain (D2.9) — S1 §14.12 request catalog.
// ---------------------------------------------------------------------------

export const TIER_LIST_TITLE_MAX = 100;
export const TIER_SLOT_LABEL_MAX = 40;

export const tierListTitleSchema = z.string().trim().min(1).max(TIER_LIST_TITLE_MAX);

export const tierSlotLabelSchema = z.string().trim().min(1).max(TIER_SLOT_LABEL_MAX);

/** S1 §14.12 TierListCreateRequest (+ visibility from S2 ContentVisibility). */
export const tierListCreateSchema = z
  .object({
    title: tierListTitleSchema,
    visibility: contentVisibilitySchema.optional(),
  })
  .strict();

export type TierListCreateInput = z.infer<typeof tierListCreateSchema>;

/** PATCH /tier-lists/{id} — editable subset (title · visibility). */
export const tierListPatchSchema = z
  .object({
    title: tierListTitleSchema.optional(),
    visibility: contentVisibilitySchema.optional(),
  })
  .strict();

export type TierListPatchInput = z.infer<typeof tierListPatchSchema>;

export const tierListIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type TierListIdParam = z.infer<typeof tierListIdParamSchema>;

const tierSlotPutItemSchema = z
  .object({
    label: tierSlotLabelSchema,
    gameIds: z.array(opaqueIdSchema),
  })
  .strict();

/** S1 §14.12 slots Put — array order = slot position; gameIds order = in-slot position. */
export const tierListSlotsPutSchema = z
  .object({
    slots: z.array(tierSlotPutItemSchema),
  })
  .strict();

export type TierListSlotsPutInput = z.infer<typeof tierListSlotsPutSchema>;

// ---------------------------------------------------------------------------
// Notification domain (D2.10) — S1 §14.22 + §5 pagination.
// ---------------------------------------------------------------------------

export const NOTIFICATION_LIST_DEFAULT_LIMIT = 20;
export const NOTIFICATION_LIST_MAX_LIMIT = 50;

/** S2 §14 ObjectType closed vocabulary. */
export const objectTypeSchema = z.enum([
  'game',
  'post',
  'review',
  'comment',
  'collection',
  'tier_list',
  'user',
  'community',
  'event',
  'achievement',
]);

/**
 * Constitutional placeholder for NotificationKind.
 * Members are not enumerated (`S2_CLOSED_ENUM_GAP_REPORT.md`) — no invented enum.
 */
export const notificationKindSchema = z.string().trim().min(1).max(64);

/** S1 §5 — cursor + limit for product lists. */
export const notificationListQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(NOTIFICATION_LIST_MAX_LIMIT).optional(),
    from: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid ISO datetime' })
      .optional(),
    to: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid ISO datetime' })
      .optional(),
  })
  .strict();

export type NotificationListQueryInput = z.infer<typeof notificationListQuerySchema>;

/**
 * S1 §14.22 NotificationsReadRequest — `ids` required unless `all` is true.
 */
export const notificationsReadSchema = z
  .object({
    ids: z.array(opaqueIdSchema).optional(),
    all: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.all === true) {
      return;
    }
    if (value.ids !== undefined && value.ids.length > 0) {
      return;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Provide non-empty ids or all=true',
      path: ['ids'],
    });
  });

export type NotificationsReadInput = z.infer<typeof notificationsReadSchema>;

export const notificationIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type NotificationIdParam = z.infer<typeof notificationIdParamSchema>;

// ---------------------------------------------------------------------------
// Activity domain (D2.16) — S1 §13.11 GET `/activity` · §5 cursor pagination.
// ---------------------------------------------------------------------------

export const ACTIVITY_LIST_DEFAULT_LIMIT = 20;
export const ACTIVITY_LIST_MAX_LIMIT = 50;

export const activityQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(ACTIVITY_LIST_MAX_LIMIT).optional(),
    from: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid ISO datetime' })
      .optional(),
    to: z
      .string()
      .trim()
      .min(1)
      .refine((value) => !Number.isNaN(Date.parse(value)), { message: 'Invalid ISO datetime' })
      .optional(),
  })
  .strict();

export type ActivityQueryInput = z.infer<typeof activityQuerySchema>;

// ---------------------------------------------------------------------------
// Follow domain (D2.11) — S1 §14.20 request catalog.
// ---------------------------------------------------------------------------

/** S1 §14.20 FollowCreateRequest. */
export const followCreateSchema = z
  .object({
    userId: opaqueIdSchema,
  })
  .strict();

export type FollowCreateInput = z.infer<typeof followCreateSchema>;

/** Path `{userId}` for `DELETE /follows/{userId}`. */
export const followUserIdParamSchema = z
  .object({
    userId: opaqueIdSchema,
  })
  .strict();

export type FollowUserIdParam = z.infer<typeof followUserIdParamSchema>;

/** Path `{id}` for `/users/{id}/followers` and `/users/{id}/following`. */
export const followSubjectUserIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type FollowSubjectUserIdParam = z.infer<typeof followSubjectUserIdParamSchema>;

/** Path `{userId}` for `DELETE /blocks/{userId}` (S1 §13.13). */
export const blockUserIdParamSchema = z
  .object({
    userId: opaqueIdSchema,
  })
  .strict();

export type BlockUserIdParam = z.infer<typeof blockUserIdParamSchema>;

// ---------------------------------------------------------------------------
// Discover domain (D2.14) — S1 §13.5 · §5 cursor pagination.
// ---------------------------------------------------------------------------

export const DISCOVER_LIST_DEFAULT_LIMIT = 20;
export const DISCOVER_LIST_MAX_LIMIT = 50;

export const discoverListQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(DISCOVER_LIST_MAX_LIMIT).optional(),
  })
  .strict();

export type DiscoverListQueryInput = z.infer<typeof discoverListQuerySchema>;

/**
 * `GET /blocks` cursor pagination (3b.3a). Same cursor/limit shape as
 * `GET /communities/{id}/events` — the app's one cursor-pagination dialect,
 * not a second one invented for this list.
 */
export const blocksListQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(DISCOVER_LIST_MAX_LIMIT).optional(),
  })
  .strict();

export type BlocksListQueryInput = z.infer<typeof blocksListQuerySchema>;

export const discoverGamesSortSchema = z.enum([
  'popular',
  'recent',
  'featured',
  'top_rated',
  'most_reviewed',
  'most_wishlisted',
  'hidden_gems',
  'discovery',
]);

export const discoverGamesListQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(DISCOVER_LIST_MAX_LIMIT).optional(),
    sort: discoverGamesSortSchema.optional(),
    genreId: opaqueIdSchema.optional(),
    platformId: opaqueIdSchema.optional(),
    franchiseId: opaqueIdSchema.optional(),
    releaseYear: z.coerce.number().int().min(1970).max(2100).optional(),
    tag: z.string().trim().min(1).max(64).optional(),
  })
  .strict();

export type DiscoverGamesListQueryInput = z.infer<typeof discoverGamesListQuerySchema>;

export const trendingWindowSchema = z.enum(['24h', '7d', '30d']);
export const trendingEntitySchema = z.enum([
  'games',
  'reviews',
  'collections',
  'users',
  'communities',
]);

export const discoverTrendingQuerySchema = z
  .object({
    window: trendingWindowSchema.optional(),
    entity: trendingEntitySchema.optional(),
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(DISCOVER_LIST_MAX_LIMIT).optional(),
  })
  .strict();

export type DiscoverTrendingQueryInput = z.infer<typeof discoverTrendingQuerySchema>;

export const wishlistPrioritySchema = z.enum(['low', 'medium', 'high', 'must_play']);
export const wishlistWaitStatusSchema = z.enum([
  'none',
  'waiting_sale',
  'waiting_dlc',
  'waiting_translation',
  'waiting_release',
]);

export const wishlistMetadataPatchSchema = z
  .object({
    priority: wishlistPrioritySchema.optional(),
    waitStatus: wishlistWaitStatusSchema.optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
  })
  .strict();

export type WishlistMetadataPatchInput = z.infer<typeof wishlistMetadataPatchSchema>;

// ---------------------------------------------------------------------------
// Search domain (D2.15) — S1 §13.5 GET `/search` · §5 cursor pagination.
// ---------------------------------------------------------------------------

export const SEARCH_QUERY_MAX = 100;
export const SEARCH_LIST_DEFAULT_LIMIT = 20;
export const SEARCH_LIST_MAX_LIMIT = 50;

export const searchHitTypeSchema = z.enum([
  'game',
  'user',
  'review',
  'post',
  'collection',
  'tier-list',
  'community',
  'event',
  'achievement',
  'tag',
]);

export const searchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(SEARCH_QUERY_MAX),
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(SEARCH_LIST_MAX_LIMIT).optional(),
    types: z
      .union([searchHitTypeSchema, z.array(searchHitTypeSchema)])
      .optional()
      .transform((value) => {
        if (value === undefined) {
          return undefined;
        }
        return Array.isArray(value) ? value : [value];
      }),
  })
  .strict();

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

// ---------------------------------------------------------------------------
// Community domain (D2.12 / S1.1) — S1 §13.10 + Community Management amendment.
// ---------------------------------------------------------------------------

export const COMMUNITY_NAME_MAX = 80;
export const COMMUNITY_SLUG_MAX = 64;

export const communityNameSchema = z.string().trim().min(1).max(COMMUNITY_NAME_MAX);

/** Lowercase slug — unique per S2 `Community.slug`. */
export const communitySlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(COMMUNITY_SLUG_MAX)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** S1.1 CommunityCreateRequest. */
export const communityCreateSchema = z
  .object({
    name: communityNameSchema,
    slug: communitySlugSchema,
    description: z.string().trim().max(10_000).nullable().optional(),
    visibility: contentVisibilitySchema,
  })
  .strict();

export type CommunityCreateInput = z.infer<typeof communityCreateSchema>;

/** S1.1 CommunityPatchRequest (+ D3.24 joinType). */
export const communityJoinTypeSchema = z.enum(['public', 'private', 'invite_only']);

export const communityPatchSchema = z
  .object({
    name: communityNameSchema.optional(),
    description: z.string().trim().max(10_000).nullable().optional(),
    visibility: contentVisibilitySchema.optional(),
    joinType: communityJoinTypeSchema.optional(),
  })
  .strict();

export type CommunityPatchInput = z.infer<typeof communityPatchSchema>;

/** Path `{id}` for `/communities/{id}` and child routes. */
export const communityIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type CommunityIdParam = z.infer<typeof communityIdParamSchema>;

// ---------------------------------------------------------------------------
// Event domain (D2.17) — S1 §13.10 · §14.16 Participation.
// No create/patch/list DTOs — S1 defines only detail + participation on `/events`.
// ---------------------------------------------------------------------------

/** Path `{id}` for `/events/{id}` and `/events/{id}/participation`. */
export const eventIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type EventIdParam = z.infer<typeof eventIdParamSchema>;

/**
 * S1 §14.16 Membership / Participation — empty body objects allowed;
 * presence of POST/DELETE is the contract.
 */
export const participationSchema = z.object({}).strict();

export type ParticipationInput = z.infer<typeof participationSchema>;

// ---------------------------------------------------------------------------
// Messaging domain (D2.13) — S1 §14.21 request catalog.
// ---------------------------------------------------------------------------

export const MESSAGE_BODY_MAX = 5_000;

export const messageBodySchema = z.string().trim().min(1).max(MESSAGE_BODY_MAX);

/** S1 §14.21 ConversationCreateRequest. */
export const conversationCreateSchema = z
  .object({
    participantUserIds: z.array(opaqueIdSchema).min(1),
  })
  .strict();

export type ConversationCreateInput = z.infer<typeof conversationCreateSchema>;

/** S1 §14.21 MessageCreateRequest. */
export const messageCreateSchema = z
  .object({
    body: messageBodySchema,
    mediaUploadIds: z.array(opaqueIdSchema).optional(),
  })
  .strict();

export type MessageCreateInput = z.infer<typeof messageCreateSchema>;

/** Path `{id}` for `/conversations/{id}` and child routes. */
export const conversationIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type ConversationIdParam = z.infer<typeof conversationIdParamSchema>;

export const MESSAGE_LIST_DEFAULT_LIMIT = 50;
export const MESSAGE_LIST_MAX_LIMIT = 100;

/** S1 §5 — cursor + limit for conversation message lists. */
export const messageListQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(MESSAGE_LIST_MAX_LIMIT).optional(),
  })
  .strict();

export type MessageListQueryInput = z.infer<typeof messageListQuerySchema>;

// ---------------------------------------------------------------------------
// Uploads domain (D2.18) — S1 §13.14 · §14.24 · §14.25 · §15.13 · §16.
// Soft MIME / byte-size allowlists — S1 requires allowlist without enumerating values.
// ---------------------------------------------------------------------------

export const uploadPurposeSchema = z.enum([
  'avatar',
  'banner',
  'post_media',
  'message_media',
  'community_banner',
]);

export type UploadPurposeInput = z.infer<typeof uploadPurposeSchema>;

/** Soft MIME allowlist for MVP image grants (S1 §14.24 contentType). */
export const UPLOAD_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;

export const uploadContentTypeSchema = z.enum(UPLOAD_CONTENT_TYPES);

/** Soft max bytes per purpose (S1 §14.24 byteSize — max per purpose). */
export const UPLOAD_MAX_BYTES_BY_PURPOSE: Record<UploadPurposeInput, number> = {
  avatar: 5 * 1024 * 1024,
  banner: 10 * 1024 * 1024,
  post_media: 15 * 1024 * 1024,
  message_media: 15 * 1024 * 1024,
  community_banner: 10 * 1024 * 1024,
};

/** Grant TTL used by service for expiresAt / soft expiry (not persisted). */
export const UPLOAD_GRANT_TTL_MS = 15 * 60 * 1000;

/** S1 §14.24 UploadGrantRequest. */
export const uploadGrantSchema = z
  .object({
    purpose: uploadPurposeSchema,
    contentType: uploadContentTypeSchema,
    byteSize: z.coerce.number().int().positive(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const max = UPLOAD_MAX_BYTES_BY_PURPOSE[value.purpose];
    if (value.byteSize > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `byteSize exceeds max for purpose (${String(max)})`,
        path: ['byteSize'],
      });
    }
  });

export type UploadGrantInput = z.infer<typeof uploadGrantSchema>;

/** S1 §14.25 UploadConfirmRequest. */
export const uploadConfirmSchema = z
  .object({
    grantId: opaqueIdSchema,
    storageKey: z.string().trim().min(1).max(512),
  })
  .strict();

export type UploadConfirmInput = z.infer<typeof uploadConfirmSchema>;

// ---------------------------------------------------------------------------
// Moderation domain (D2.19) — S1 §13.13 POST `/reports` · §14.17.
// Soft reason allowlist — S1 requires closed set without enumerating members.
// ---------------------------------------------------------------------------

export const reportTargetTypeSchema = z.enum([
  'user',
  'post',
  'review',
  'comment',
  'community',
  'event',
  'message',
]);

export type ReportTargetTypeInput = z.infer<typeof reportTargetTypeSchema>;

/** Soft closed moderation reasons (S1 §14.17 — product-governed vocabulary). */
export const REPORT_REASONS = [
  'spam',
  'harassment',
  'hate_speech',
  'misinformation',
  'spoiler',
  'nsfw',
  'copyright',
  'other',
] as const;

export const reportReasonSchema = z.enum(REPORT_REASONS);

export type ReportReasonInput = z.infer<typeof reportReasonSchema>;

export const REPORT_DETAILS_MAX = 2_000;

/** S1 §14.17 ReportCreateRequest. `details` accepted; S2 Report has no details column. */
export const reportCreateSchema = z
  .object({
    targetType: reportTargetTypeSchema,
    targetId: opaqueIdSchema,
    reason: reportReasonSchema,
    details: z.string().trim().min(1).max(REPORT_DETAILS_MAX).optional(),
  })
  .strict();

export type ReportCreateInput = z.infer<typeof reportCreateSchema>;

// ---------------------------------------------------------------------------
// D3.21 — Social Platform Core validators (SOCIAL_API / USER_API)
// ---------------------------------------------------------------------------

export const friendRequestStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'cancelled']);

export const presenceStatusSchema = z.enum(['online', 'away', 'offline', 'invisible']);

export const profilePinKindSchema = z.enum(['game', 'review', 'collection', 'achievement']);

export const FRIEND_REQUEST_MESSAGE_MAX = 280;

export const friendRequestCreateSchema = z
  .object({
    message: z.string().trim().min(1).max(FRIEND_REQUEST_MESSAGE_MAX).optional(),
  })
  .strict()
  .default({});

export type FriendRequestCreateInput = z.infer<typeof friendRequestCreateSchema>;

export const friendRequestIdParamSchema = z
  .object({
    requestId: opaqueIdSchema,
  })
  .strict();

export type FriendRequestIdParam = z.infer<typeof friendRequestIdParamSchema>;

/** Path `{userId}` for friend / relationship / presence user-scoped routes. */
export const friendUserIdParamSchema = z
  .object({
    userId: opaqueIdSchema,
  })
  .strict();

export type FriendUserIdParam = z.infer<typeof friendUserIdParamSchema>;

export const FRIENDS_LIST_DEFAULT_LIMIT = 20;
export const FRIENDS_LIST_MAX_LIMIT = 50;

/** S1 §5 — cursor + limit (+ optional `q` search) for friends lists. */
export const friendsListQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(FRIENDS_LIST_MAX_LIMIT).optional(),
    q: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export type FriendsListQueryInput = z.infer<typeof friendsListQuerySchema>;

export const friendsSearchQuerySchema = z
  .object({
    q: z.string().trim().min(1).max(100),
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(FRIENDS_LIST_MAX_LIMIT).optional(),
  })
  .strict();

export type FriendsSearchQueryInput = z.infer<typeof friendsSearchQuerySchema>;

export const presenceUpdateSchema = z
  .object({
    status: presenceStatusSchema,
  })
  .strict();

export type PresenceUpdateInput = z.infer<typeof presenceUpdateSchema>;

export const profilePinUpsertSchema = z
  .object({
    kind: profilePinKindSchema,
    objectId: opaqueIdSchema,
    position: z.number().int().min(0).max(20).optional(),
  })
  .strict();

export type ProfilePinUpsertInput = z.infer<typeof profilePinUpsertSchema>;

export const profilePinDeleteSchema = z
  .object({
    kind: profilePinKindSchema,
    objectId: opaqueIdSchema,
  })
  .strict();

export type ProfilePinDeleteInput = z.infer<typeof profilePinDeleteSchema>;

// ---------------------------------------------------------------------------
// D3.29 — Profile Theme (docs/07_SOCIAL/PROFILE_CUSTOMIZATION.md). Closed sets
// mirror the client's profile-customization-model.ts exactly; an unknown
// widget id is rejected here rather than silently dropped, since the client
// already normalizes before it ever reaches the wire.
// ---------------------------------------------------------------------------

export const profileAccentSchema = z.enum([
  'neutral',
  'ember',
  'plasma',
  'toxic',
  'cobalt',
  'magma',
  'orchid',
  'gold',
]);

export const profileCardStyleSchema = z.enum(['elevated', 'flat', 'outlined']);

export const profileBannerStyleSchema = z.enum(['artwork', 'gradient', 'solid']);

export const consoleGenerationSchema = z.enum([
  'retro',
  'gen6',
  'gen7',
  'gen8',
  'gen9',
  'pc',
  'handheld',
]);

export const profileWidgetIdSchema = z.enum([
  'archetypes',
  'insights',
  'heatmap',
  'achievements',
  'currently-playing',
  'recently-finished',
  'wishlist',
  'backlog',
  'collections',
  'activity',
]);

const profileWidgetIdListSchema = z.array(profileWidgetIdSchema).max(20);

/** S1-style patch — every field optional, `null` clears where nullable. */
export const profileThemePatchSchema = z
  .object({
    accent: profileAccentSchema.optional(),
    cardStyle: profileCardStyleSchema.optional(),
    bannerStyle: profileBannerStyleSchema.optional(),
    favoritePlatform: z.string().trim().min(1).max(40).nullable().optional(),
    consoleGeneration: consoleGenerationSchema.nullable().optional(),
    widgetOrder: profileWidgetIdListSchema.optional(),
    pinnedWidgets: profileWidgetIdListSchema.optional(),
    hiddenWidgets: profileWidgetIdListSchema.optional(),
    profileVisibility: contentVisibilitySchema.optional(),
  })
  .strict();

export type ProfileThemePatchInput = z.infer<typeof profileThemePatchSchema>;

export const achievementIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type AchievementIdParam = z.infer<typeof achievementIdParamSchema>;

export const commentPatchSchema = z
  .object({
    body: commentBodySchema,
  })
  .strict();

export type CommentPatchInput = z.infer<typeof commentPatchSchema>;

export const statisticsPeriodSchema = z.enum(['daily', 'weekly', 'monthly', 'lifetime']);

export type StatisticsPeriodInput = z.infer<typeof statisticsPeriodSchema>;

export const statisticsQuerySchema = z
  .object({
    period: statisticsPeriodSchema.optional(),
  })
  .strict();

export type StatisticsQueryInput = z.infer<typeof statisticsQuerySchema>;

// ---------------------------------------------------------------------------
// D3.23 — Platform Integrations (docs/10_INTEGRATIONS)
// ---------------------------------------------------------------------------

export const integrationProviderSchema = z.enum([
  'steam',
  'xbox',
  'playstation',
  'epic',
  'nintendo',
  'csv',
]);

export const integrationSyncTypeSchema = z.enum([
  'manual',
  'daily',
  'weekly',
  'monthly',
  'automatic',
]);

export const syncConflictResolutionSchema = z.enum([
  'keep_local',
  'keep_steam',
  'newest_wins',
  'ask_user',
]);

export const steamConnectSchema = z
  .object({
    steamIdOrUrl: z.string().trim().min(1).max(256),
  })
  .strict();

export type SteamConnectInput = z.infer<typeof steamConnectSchema>;

export const integrationCreateSchema = z
  .object({
    provider: integrationProviderSchema,
    externalRef: z.string().trim().min(1).max(256),
    displayName: z.string().trim().min(1).max(128).optional(),
    syncType: integrationSyncTypeSchema.optional(),
  })
  .strict();

export type IntegrationCreateInput = z.infer<typeof integrationCreateSchema>;

export const integrationSyncSchema = z
  .object({
    syncType: integrationSyncTypeSchema.optional(),
  })
  .strict();

export type IntegrationSyncInput = z.infer<typeof integrationSyncSchema>;

export const integrationIdParamSchema = z
  .object({
    id: opaqueIdSchema,
  })
  .strict();

export type IntegrationIdParam = z.infer<typeof integrationIdParamSchema>;

export const csvImportFormatSchema = z.enum([
  'steamdb',
  'backloggd',
  'backloggery',
  'rawg',
  'ign',
  'generic',
]);

export const csvImportSchema = z
  .object({
    format: csvImportFormatSchema.optional(),
    csv: z.string().min(1).max(2_000_000),
    conflictResolution: syncConflictResolutionSchema.optional(),
  })
  .strict();

export type CsvImportInput = z.infer<typeof csvImportSchema>;

export const syncConflictResolveSchema = z
  .object({
    resolution: syncConflictResolutionSchema,
  })
  .strict();

export type SyncConflictResolveInput = z.infer<typeof syncConflictResolveSchema>;

// ---------------------------------------------------------------------------
// D3.24 Social Feed · Quotes · Mute · Feed filters
// ---------------------------------------------------------------------------

export const feedFilterSchema = z.enum([
  'for_you',
  'following',
  'games',
  'reviews',
  'media',
  'communities',
  'events',
]);

export const feedQuerySchema = activityQuerySchema
  .extend({
    filter: feedFilterSchema.optional(),
    before: z.string().trim().min(1).optional(),
    after: z.string().trim().min(1).optional(),
    take: z.coerce.number().int().min(1).max(ACTIVITY_LIST_MAX_LIMIT).optional(),
    direction: z.enum(['forward', 'backward']).optional(),
  })
  .strict();

export type FeedQueryInput = z.infer<typeof feedQuerySchema>;

export const quoteTargetTypeSchema = z.enum([
  'post',
  'review',
  'collection',
  'guide',
  'achievement',
  'screenshot',
  'tier_list',
]);

export const quoteCreateSchema = z
  .object({
    targetType: quoteTargetTypeSchema,
    targetId: opaqueIdSchema,
    body: z.string().trim().min(1).max(POST_BODY_MAX),
    visibility: contentVisibilitySchema.optional(),
  })
  .strict();

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;

export const muteCreateSchema = z
  .object({
    userId: opaqueIdSchema,
  })
  .strict();

export type MuteCreateInput = z.infer<typeof muteCreateSchema>;

export const muteUserIdParamSchema = z
  .object({
    userId: opaqueIdSchema,
  })
  .strict();

export type MuteUserIdParam = z.infer<typeof muteUserIdParamSchema>;

export const postKindSchema = z.enum([
  'text',
  'screenshot',
  'video',
  'poll',
  'guide',
  'news',
  'quote',
]);

export const pollCreateSchema = z
  .object({
    question: z.string().trim().min(1).max(280),
    options: z.array(z.string().trim().min(1).max(100)).min(2).max(6),
    endsAt: z.string().datetime().optional(),
  })
  .strict();

export type PollCreateInput = z.infer<typeof pollCreateSchema>;

export const eventParticipationStateSchema = z.enum([
  'interested',
  'going',
  'not_going',
  'looking_for_team',
  'need_players',
  'hosting',
]);

export const eventRsvpSchema = z
  .object({
    state: eventParticipationStateSchema,
  })
  .strict();

export type EventRsvpInput = z.infer<typeof eventRsvpSchema>;

export const eventInviteSchema = z
  .object({
    userIds: z.array(opaqueIdSchema).min(1).max(20),
  })
  .strict();

export type EventInviteInput = z.infer<typeof eventInviteSchema>;

/** D3.24 EVENTS_V2 — event kinds (retained S2 kinds + new social-play kinds). */
export const eventKindSchema = z.enum([
  'game',
  'community',
  'tournament',
  'seasonal',
  'lan',
  'watch_party',
  'coop_session',
  'raid',
  'release_countdown',
  'release',
  'community_night',
  'speedrun',
]);

/** D3.24 EVENTS_V2 — `POST /events` create body. */
export const eventCreateSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    kind: eventKindSchema,
    description: z.string().trim().max(10_000).optional(),
    startsAt: z.string().datetime(),
    endsAt: z.string().datetime().optional(),
    gameId: opaqueIdSchema.optional(),
    communityId: opaqueIdSchema.optional(),
  })
  .strict()
  .refine((value) => value.endsAt === undefined || value.endsAt > value.startsAt, {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  });

export type EventCreateInput = z.infer<typeof eventCreateSchema>;

export const communityWikiUpsertSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(50_000),
  })
  .strict();

export type CommunityWikiUpsertInput = z.infer<typeof communityWikiUpsertSchema>;

export const reviewFeedSliceSchema = z.enum([
  'latest',
  'friends',
  'popular',
  'negative',
  'hidden_gems',
]);

export const reviewFeedQuerySchema = activityQuerySchema
  .extend({
    slice: reviewFeedSliceSchema.optional(),
  })
  .strict();

export type ReviewFeedQueryInput = z.infer<typeof reviewFeedQuerySchema>;

export const bookmarkCreateSchema = z
  .object({
    postId: opaqueIdSchema,
  })
  .strict();

export type BookmarkCreateInput = z.infer<typeof bookmarkCreateSchema>;

export const BOOKMARK_LIST_DEFAULT_LIMIT = 20;
export const BOOKMARK_LIST_MAX_LIMIT = 50;

/** D3.24 SOCIAL_ACTIONS — `GET /bookmarks` cursor + limit (private, viewer-owned). */
export const bookmarkListQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(BOOKMARK_LIST_MAX_LIMIT).optional(),
  })
  .strict();

export type BookmarkListQueryInput = z.infer<typeof bookmarkListQuerySchema>;

export const repostCreateSchema = z
  .object({
    postId: opaqueIdSchema,
  })
  .strict();

export type RepostCreateInput = z.infer<typeof repostCreateSchema>;

export const pollVoteSchema = z
  .object({
    optionIndex: z.number().int().min(0),
  })
  .strict();

export type PollVoteInput = z.infer<typeof pollVoteSchema>;

export const communityPinObjectTypeSchema = z.enum(['post', 'review', 'event', 'wiki_page']);

export const communityPinCreateSchema = z
  .object({
    objectType: communityPinObjectTypeSchema,
    objectId: opaqueIdSchema,
  })
  .strict();

export type CommunityPinCreateInput = z.infer<typeof communityPinCreateSchema>;

export const communityWikiSlugParamSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9-]+$/, 'slug must be lowercase kebab-case'),
  })
  .strict();

export type CommunityWikiSlugParam = z.infer<typeof communityWikiSlugParamSchema>;

/** Path `{id}` + `{slug}` for wiki page routes. */
export const communityWikiPageParamSchema = communityIdParamSchema
  .merge(communityWikiSlugParamSchema)
  .strict();

export type CommunityWikiPageParam = z.infer<typeof communityWikiPageParamSchema>;

/** Path `{id}` + `{pinId}` for pin delete. */
export const communityPinIdParamSchema = z
  .object({
    id: opaqueIdSchema,
    pinId: opaqueIdSchema,
  })
  .strict();

export type CommunityPinIdParam = z.infer<typeof communityPinIdParamSchema>;

/** Path `{id}` + `{userId}` for member role patch. */
export const communityMemberUserParamSchema = z
  .object({
    id: opaqueIdSchema,
    userId: opaqueIdSchema,
  })
  .strict();

export type CommunityMemberUserParam = z.infer<typeof communityMemberUserParamSchema>;

/** Assignable community roles (owner is not assignable via patch). */
export const communityAssignableRoleSchema = z.enum(['member', 'moderator', 'admin']);

export const communityMemberRolePatchSchema = z
  .object({
    role: communityAssignableRoleSchema,
  })
  .strict();

export type CommunityMemberRolePatchInput = z.infer<typeof communityMemberRolePatchSchema>;

/** D3.24 community feed tab filter (COMMUNITIES_2.md). */
export const communityFeedTabSchema = z.enum([
  'posts',
  'reviews',
  'collections',
  'guides',
  'events',
  'pinned',
]);

export const communityFeedQuerySchema = activityQuerySchema
  .extend({
    tab: communityFeedTabSchema.optional(),
  })
  .strict();

export type CommunityFeedQueryInput = z.infer<typeof communityFeedQuerySchema>;

/**
 * `GET /communities/{id}/events` cursor pagination (3b.2a).
 *
 * Same cursor/limit shape as `GET /discover/events` — the events resource's
 * own dialect, not a new one, just scoped to one community.
 */
export const communityEventsQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(DISCOVER_LIST_MAX_LIMIT).optional(),
  })
  .strict();

export type CommunityEventsQueryInput = z.infer<typeof communityEventsQuerySchema>;

/**
 * `GET /communities` cursor pagination (S1 §5).
 *
 * The directory used to return every discoverable community in one array. That
 * is unbounded by construction: measured at 111,603 ms against 100,009 rows,
 * four times the client's own 30s timeout, so the screen could never load. The
 * limits mirror the discover lists rather than inventing a second dialect.
 */
export const COMMUNITY_LIST_DEFAULT_LIMIT = 20;
export const COMMUNITY_LIST_MAX_LIMIT = 50;

/** 3b.1e — BACKEND_CHANGES.md §6. The prototype's own four, no fifth catch-all. */
export const COMMUNITY_KIND_VALUES = ['games', 'board_games', 'cosplay', 'live_events'] as const;

export const communityListQuerySchema = z
  .object({
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(COMMUNITY_LIST_MAX_LIMIT).optional(),
    /** §13's filter pills — omitted means every kind, not a fifth "all" enum value. */
    kind: z.enum(COMMUNITY_KIND_VALUES).optional(),
  })
  .strict();

export type CommunityListQueryInput = z.infer<typeof communityListQuerySchema>;

/** Product caps (COMMUNITIES_2.md). */
export const COMMUNITY_PIN_CAP = 10;
export const COMMUNITY_TOP_CONTRIBUTOR_MIN_SCORE = 3;

/**
 * 7.1 — BACKEND_CHANGES.md §5 `GET /communities/:id/leaderboard?window=90d`.
 * Only the window §5 names as its own example, plus the two other common
 * report windows.
 */
export const COMMUNITY_LEADERBOARD_WINDOW_VALUES = ['7d', '30d', '90d'] as const;
export const COMMUNITY_LEADERBOARD_DEFAULT_WINDOW = '90d';
export const COMMUNITY_LEADERBOARD_DEFAULT_LIMIT = 20;
export const COMMUNITY_LEADERBOARD_MAX_LIMIT = 50;

export const communityLeaderboardQuerySchema = z
  .object({
    window: z.enum(COMMUNITY_LEADERBOARD_WINDOW_VALUES).optional(),
    limit: z.coerce.number().int().min(1).max(COMMUNITY_LEADERBOARD_MAX_LIMIT).optional(),
  })
  .strict();

export type CommunityLeaderboardQueryInput = z.infer<typeof communityLeaderboardQuerySchema>;

// ---------------------------------------------------------------------------
// D3.24 — Collection Hub (COLLECTION_HUB.md) · GET /collections/discover
// ---------------------------------------------------------------------------

export const collectionDiscoverSortSchema = z.enum(['top', 'newest', 'trending', 'following']);

export const collectionsDiscoverQuerySchema = z
  .object({
    sort: collectionDiscoverSortSchema.optional(),
    tag: z.string().trim().min(1).max(64).optional(),
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(DISCOVER_LIST_MAX_LIMIT).optional(),
  })
  .strict();

export type CollectionsDiscoverQueryInput = z.infer<typeof collectionsDiscoverQuerySchema>;

// ---------------------------------------------------------------------------
// D3.24 — Because You Played (BECAUSE_YOU_PLAYED.md) · GET /discover/because-you-played
// ---------------------------------------------------------------------------

export const becauseYouPlayedQuerySchema = z
  .object({
    seedGameId: opaqueIdSchema.optional(),
    cursor: z.string().trim().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(DISCOVER_LIST_MAX_LIMIT).optional(),
  })
  .strict();

export type BecauseYouPlayedQueryInput = z.infer<typeof becauseYouPlayedQuerySchema>;

// ---------------------------------------------------------------------------
// D3.24 — Game Hub (GAME_HUB.md) · GET /games/:id/hub · /feed · sub-tabs
// ---------------------------------------------------------------------------

/** `GET /games/:id/feed` — hybrid timeline, cursor pagination only (no tab filter). */
export const gameHubFeedQuerySchema = activityQuerySchema;

export type GameHubFeedQueryInput = z.infer<typeof gameHubFeedQuerySchema>;
