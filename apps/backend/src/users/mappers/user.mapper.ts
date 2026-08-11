import type { ConnectedAccount, User, UserSettings } from '@gmrlog/database';
import type {
  ConnectedAccountResponse,
  ProfileThemeResponse,
  SettingsResponse,
  UserPublicResponse,
  UserSelfResponse,
} from '@gmrlog/types';

import { resolveMediaUrl } from '../../infrastructure/media/resolve-media-url';

/**
 * Persistence → S1 §15 response projections. Mapping only — no business
 * decisions, no persistence access (F6.3 layer law).
 */

export { resolveMediaUrl };

export function toUserPublicResponse(user: User): UserPublicResponse {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: resolveMediaUrl(user.avatarKey),
  };
}

export function toUserSelfResponse(
  user: User,
  connectedAccounts: ConnectedAccount[],
): UserSelfResponse {
  return {
    id: user.id,
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: resolveMediaUrl(user.avatarKey),
    bannerUrl: resolveMediaUrl(user.bannerKey),
    createdAt: user.createdAt.toISOString(),
    // S1 §15.2 — providers only, never tokens; only live links count.
    connectedProviders: connectedAccounts
      .filter((account) => account.status === 'connected')
      .map((account) => account.provider),
  };
}

export function toConnectedAccountResponse(account: ConnectedAccount): ConnectedAccountResponse {
  return {
    provider: account.provider,
    status: account.status,
    linkedAt: account.linkedAt ? account.linkedAt.toISOString() : null,
    scopes: account.scopes,
  };
}

/**
 * S1 §15.16 — nested objects matching settings sections. A missing row maps to
 * the constitutional defaults: `system` theme (F4 master direction) · no
 * locale preference · motion not reduced.
 */
export function toSettingsResponse(settings: UserSettings | null): SettingsResponse {
  return {
    appearance: {
      theme: settings?.theme ?? 'system',
      locale: settings?.locale ?? null,
    },
    accessibility: {
      reduceMotion: settings?.reduceMotion ?? false,
    },
  };
}

/**
 * D3.29 — mirrors the client's `DEFAULT_WIDGET_ORDER`
 * (profile-customization-model.ts). A row with an empty `widgetOrder` (never
 * customized) resolves to this rather than an empty list.
 */
const DEFAULT_PROFILE_WIDGET_ORDER = [
  'archetypes',
  'currently-playing',
  'insights',
  'achievements',
  'recently-finished',
  'heatmap',
  'collections',
  'wishlist',
  'backlog',
  'activity',
];

/**
 * S1-style — `profileVisibility` is owner-only (`includeVisibility=false` for
 * the public projection, matching how `/users/{id}/profile-theme` never
 * exposes it to visitors).
 */
export function toProfileThemeResponse(
  settings: UserSettings | null,
  includeVisibility: boolean,
): ProfileThemeResponse {
  const response: ProfileThemeResponse = {
    accent: settings?.accent ?? 'neutral',
    cardStyle: settings?.cardStyle ?? 'elevated',
    bannerStyle: settings?.bannerStyle ?? 'artwork',
    favoritePlatform: settings?.favoritePlatform ?? null,
    consoleGeneration: settings?.consoleGeneration ?? null,
    widgetOrder:
      settings != null && settings.widgetOrder.length > 0
        ? settings.widgetOrder
        : DEFAULT_PROFILE_WIDGET_ORDER,
    pinnedWidgets: settings?.pinnedWidgets ?? [],
    hiddenWidgets: settings?.hiddenWidgets ?? [],
  };
  if (includeVisibility) {
    response.profileVisibility = settings?.profileVisibility ?? 'public';
  }
  return response;
}

/**
 * D3.29 visibility gate — same shape as `canViewerReadCollection`
 * (collections/mappers/collection.mapper.ts): public always passes, private
 * requires ownership, followers requires an authenticated follower.
 */
export function canViewerReadProfileTheme(
  visibility: UserSettings['profileVisibility'] | undefined,
  ownerId: string,
  viewerId: string | null,
  viewerFollowsOwner = false,
): boolean {
  const effective = visibility ?? 'public';
  if (effective === 'public') {
    return true;
  }
  if (viewerId === null) {
    return false;
  }
  if (viewerId === ownerId) {
    return true;
  }
  return effective === 'followers' && viewerFollowsOwner;
}
