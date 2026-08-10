import type { ReportReasonValue, UserPublicResponse } from '@gmrlog/types';

/**
 * `SCREEN_REDESIGNS_2.md` §15 — Followers & following.
 *
 * Pure functions, kept out of the screen so tab shaping and the follow-state
 * merge are testable without React Native in the module graph (mirrors
 * `community-directory-model.ts`'s split from its screen).
 */

export type ListViewStatus = 'loading' | 'error' | 'empty' | 'ready';

export interface ListViewModel<T> {
  status: ListViewStatus;
  items: T[];
  error: unknown;
  isRefreshing: boolean;
}

export function resolveListView<T>(input: {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  items: T[];
  isRefreshing: boolean;
}): ListViewModel<T> {
  if (input.isPending && input.items.length === 0) {
    return { status: 'loading', items: [], error: null, isRefreshing: false };
  }
  if (input.isError && input.items.length === 0) {
    return { status: 'error', items: [], error: input.error, isRefreshing: input.isRefreshing };
  }
  if (input.items.length === 0) {
    return { status: 'empty', items: [], error: null, isRefreshing: input.isRefreshing };
  }
  return {
    status: 'ready',
    items: input.items,
    error: input.error,
    isRefreshing: input.isRefreshing,
  };
}

export type SocialTabId = 'followers' | 'following' | 'blocked';

/**
 * §15's three underlined tabs. Labels only — each tab's count is attached at
 * the screen, since it comes from a different query per tab.
 */
export const SOCIAL_TABS: readonly { id: SocialTabId; label: string }[] = [
  { id: 'followers', label: 'Followers' },
  { id: 'following', label: 'Following' },
  { id: 'blocked', label: 'Blocked' },
] as const;

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return (parts[0] ?? '?').slice(0, 2).toUpperCase();
  }
  return `${(parts[0] ?? '').slice(0, 1)}${(parts[1] ?? '').slice(0, 1)}`.toUpperCase();
}

/**
 * §15's Followers-tab action button reads Follow or Following depending on
 * whether the viewer already follows that row — `GET /me/followers` carries no
 * per-row relationship flag (S1 §15.2's `UserPublicResponse` is name/handle/
 * avatar only), so the state is a client-side join against the viewer's own
 * `/me/following` list rather than a fabricated field or N relationship calls.
 */
export function isFollowingUser(followingIds: ReadonlySet<string>, userId: string): boolean {
  return followingIds.has(userId);
}

export function followingIdSet(following: readonly UserPublicResponse[]): Set<string> {
  return new Set(following.map((user) => user.id));
}

/**
 * §15's search field, filtering the already-fetched tab locally — there is no
 * search endpoint for this domain, and both lists are small unpaginated
 * arrays (see `use-social.ts`'s own note on `GET /me/followers`), so a
 * server round trip would be work the client already has the data for.
 */
export function filterSocialRows(
  users: readonly UserPublicResponse[],
  query: string,
): UserPublicResponse[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length === 0) {
    return [...users];
  }
  return users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(normalized) ||
      user.handle.toLowerCase().includes(normalized),
  );
}

/**
 * Player-facing labels for `REPORT_REASONS` (`@gmrlog/validators`). No report
 * UI exists anywhere else in the app yet — §15 is the first screen to need
 * one — so these labels have no precedent to match, only the reason
 * vocabulary itself to stay honest to.
 */
export function createIdempotencyKey(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

export const REPORT_REASON_LABELS: Record<ReportReasonValue, string> = {
  spam: 'Spam',
  harassment: 'Harassment',
  hate_speech: 'Hate speech',
  misinformation: 'Misinformation',
  spoiler: 'Spoiler',
  nsfw: 'Adult content',
  copyright: 'Copyright',
  other: 'Other',
};
