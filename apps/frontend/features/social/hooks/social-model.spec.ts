import type { UserPublicResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  filterSocialRows,
  followingIdSet,
  isFollowingUser,
  REPORT_REASON_LABELS,
  resolveListView,
  SOCIAL_TABS,
} from './social-model';

function user(id: string, displayName: string, handle: string): UserPublicResponse {
  return { id, displayName, handle, avatarUrl: null };
}

describe('social model (§15, 3b.3)', () => {
  describe('follow-state merge', () => {
    // `GET /me/followers` carries no per-row relationship flag — the
    // Followers tab's Follow/Following state is a client-side join against
    // `/me/following`, not a fabricated field.
    it('reads follow state from the following id set, not the row itself', () => {
      const following = followingIdSet([user('a', 'Ada', 'ada'), user('b', 'Bo', 'bo')]);
      expect(isFollowingUser(following, 'a')).toBe(true);
      expect(isFollowingUser(following, 'c')).toBe(false);
    });

    it('produces an empty set for an empty following list', () => {
      expect(followingIdSet([]).size).toBe(0);
    });
  });

  describe('search filter', () => {
    const rows = [
      user('1', 'Ada Lovelace', 'ada'),
      user('2', 'Grace Hopper', 'ghopper'),
      user('3', 'Bo Diaz', 'bodiaz'),
    ];

    it('returns everything for an empty query', () => {
      expect(filterSocialRows(rows, '')).toHaveLength(3);
      expect(filterSocialRows(rows, '   ')).toHaveLength(3);
    });

    it('matches on display name, case-insensitively', () => {
      expect(filterSocialRows(rows, 'ada l').map((u) => u.id)).toEqual(['1']);
      expect(filterSocialRows(rows, 'GRACE').map((u) => u.id)).toEqual(['2']);
    });

    it('matches on handle', () => {
      expect(filterSocialRows(rows, 'bodiaz').map((u) => u.id)).toEqual(['3']);
    });

    it('returns nothing for no match', () => {
      expect(filterSocialRows(rows, 'zzz')).toEqual([]);
    });
  });

  describe('list view status', () => {
    it('is loading only while pending with nothing cached yet', () => {
      expect(
        resolveListView({
          isPending: true,
          isError: false,
          error: null,
          items: [],
          isRefreshing: false,
        }).status,
      ).toBe('loading');
    });

    it('prefers stale data over an error screen', () => {
      const view = resolveListView({
        isPending: false,
        isError: true,
        error: new Error('boom'),
        items: [user('1', 'Ada', 'ada')],
        isRefreshing: false,
      });
      expect(view.status).toBe('ready');
    });

    it('is empty, not an error, once pending resolves to nothing', () => {
      expect(
        resolveListView({
          isPending: false,
          isError: false,
          error: null,
          items: [],
          isRefreshing: false,
        }).status,
      ).toBe('empty');
    });
  });

  it('offers §15’s three tabs, Blocked last', () => {
    expect(SOCIAL_TABS.map((t) => t.id)).toEqual(['followers', 'following', 'blocked']);
  });

  it('labels every REPORT_REASONS value — none silently falls back', () => {
    // `reportCreateSchema`'s reason is a closed enum; a label map missing a
    // value would read `undefined` in the UI rather than failing typecheck.
    const reasons: (keyof typeof REPORT_REASON_LABELS)[] = [
      'spam',
      'harassment',
      'hate_speech',
      'misinformation',
      'spoiler',
      'nsfw',
      'copyright',
      'other',
    ];
    for (const reason of reasons) {
      expect(REPORT_REASON_LABELS[reason]).toEqual(expect.any(String));
      expect(REPORT_REASON_LABELS[reason].length).toBeGreaterThan(0);
    }
  });
});
