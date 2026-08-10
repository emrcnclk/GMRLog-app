import type { ConnectedAccount, User, UserSettings } from '@gmrlog/database';
import type {
  ConnectedAccountResponse,
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
