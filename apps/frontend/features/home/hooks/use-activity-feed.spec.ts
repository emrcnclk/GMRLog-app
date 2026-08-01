import type { ActivityItemResponse, ActivityKindValue } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { getNextPageParam } from '../../../src/query/query-client';

import {
  ACTIVITY_KIND_MESSAGE,
  activityKindIconName,
  formatActivityTime,
  resolveActivityMessage,
  resolveHomeFeedView,
} from './activity-feed-model';

function makeItem(overrides: Partial<ActivityItemResponse> = {}): ActivityItemResponse {
  return {
    id: 'activity-1',
    kind: 'review',
    createdAt: '2026-07-27T12:00:00.000Z',
    readAt: null,
    actor: {
      id: 'user-1',
      handle: 'player',
      displayName: 'Player One',
      avatarUrl: null,
    },
    objectRef: { type: 'review', id: 'review-1' },
    messageKey: 'review',
    ...overrides,
  };
}

describe('resolveHomeFeedView', () => {
  it('returns loading when pending with no items', () => {
    expect(
      resolveHomeFeedView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('loading');
  });

  it('returns error when failed with no items', () => {
    expect(
      resolveHomeFeedView({
        isPending: false,
        isError: true,
        error: new Error('boom'),
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('error');
  });

  it('returns empty when settled with no items', () => {
    expect(
      resolveHomeFeedView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('empty');
  });

  it('returns feed when items exist', () => {
    const items = [makeItem()];
    const view = resolveHomeFeedView({
      isPending: false,
      isError: false,
      error: null,
      items,
      isRefreshing: true,
      isFetchingNextPage: false,
      hasNextPage: true,
    });
    expect(view.status).toBe('feed');
    expect(view.items).toHaveLength(1);
    expect(view.hasNextPage).toBe(true);
  });
});

describe('activity copy + icons', () => {
  it('covers every ActivityKind message', () => {
    const kinds = Object.keys(ACTIVITY_KIND_MESSAGE) as ActivityKindValue[];
    expect(kinds.length).toBe(21);
    for (const kind of kinds) {
      expect(resolveActivityMessage(makeItem({ kind, messageKey: kind })).length).toBeGreaterThan(
        0,
      );
      expect(activityKindIconName(kind).length).toBeGreaterThan(0);
    }
  });
});

describe('formatActivityTime', () => {
  it('formats relative buckets', () => {
    const now = Date.parse('2026-07-27T12:00:00.000Z');
    expect(formatActivityTime('2026-07-27T11:59:30.000Z', now)).toBe('Just now');
    expect(formatActivityTime('2026-07-27T11:45:00.000Z', now)).toBe('15m');
    expect(formatActivityTime('2026-07-27T09:00:00.000Z', now)).toBe('3h');
  });
});

describe('cursor pagination helper', () => {
  it('reads next cursor from envelope meta', () => {
    expect(getNextPageParam({ cursor: { next: 'cursor-2' }, hasMore: true })).toBe('cursor-2');
    expect(getNextPageParam({ cursor: { next: 'cursor-2' }, hasMore: false })).toBeUndefined();
    expect(getNextPageParam({ cursor: { next: null }, hasMore: true })).toBeUndefined();
  });
});
