import { describe, expect, it } from 'vitest';

import {
  isProfileTabId,
  resolveListView,
  resolveProfileView,
  resolveReviewsView,
} from './hooks/profile-model';

describe('profile screen states', () => {
  it('loading uses skeleton path (no spinner contract)', () => {
    expect(
      resolveProfileView({
        isPending: true,
        isError: false,
        error: null,
        user: null,
        isRefreshing: false,
      }).status,
    ).toBe('loading');
  });

  it('empty library / collections / tier lists', () => {
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

  it('reviews empty when list endpoint unavailable', () => {
    const reviews = resolveReviewsView();
    expect(reviews.status).toBe('empty');
    expect(reviews.listUnavailable).toBe(true);
    expect(reviews.isFetchingNextPage).toBe(false);
  });

  it('refresh flag surfaces while refetching ready data', () => {
    const user = {
      id: 'u1',
      handle: 'p',
      displayName: 'P',
      bio: null,
      avatarUrl: null,
      bannerUrl: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      connectedProviders: [] as const,
    };
    const view = resolveProfileView({
      isPending: false,
      isError: false,
      error: null,
      user,
      isRefreshing: true,
    });
    expect(view.status).toBe('ready');
    expect(view.isRefreshing).toBe(true);
  });

  it('keeps friends off profile tabs (overview entry only)', () => {
    expect(isProfileTabId('friends')).toBe(false);
    expect(isProfileTabId('overview')).toBe(true);
  });
});
