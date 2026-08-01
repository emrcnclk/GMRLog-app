import type { EventResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  eventKindLabel,
  formatEventStartsAt,
  isViewerGoing,
  optimisticJoin,
  optimisticLeave,
  patchEventInDiscoverPages,
  resolveEventsView,
} from './event-model';

function event(partial: Partial<EventResponse> = {}): EventResponse {
  return {
    id: 'e1',
    title: 'Season Finale',
    kind: 'game',
    startsAt: '2026-07-28T18:00:00.000Z',
    endsAt: null,
    viewerParticipation: null,
    ...partial,
  };
}

describe('event-model', () => {
  it('resolves loading empty error ready', () => {
    expect(
      resolveEventsView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('loading');
    expect(
      resolveEventsView({
        isPending: false,
        isError: true,
        error: new Error('x'),
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('error');
    expect(
      resolveEventsView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('empty');
    expect(
      resolveEventsView({
        isPending: false,
        isError: false,
        error: null,
        items: [event()],
        isRefreshing: true,
        isFetchingNextPage: false,
        hasNextPage: true,
      }).status,
    ).toBe('ready');
  });

  it('formats startsAt relative labels', () => {
    const now = Date.parse('2026-07-28T12:00:00.000Z');
    expect(formatEventStartsAt('2026-07-28T18:00:00.000Z', now)).toBe('Starts today');
    expect(formatEventStartsAt('2026-07-29T18:00:00.000Z', now)).toBe('Starts tomorrow');
  });

  it('optimistic join and leave flip viewerParticipation', () => {
    const base = event();
    const joined = optimisticJoin(base);
    expect(isViewerGoing(joined)).toBe(true);
    expect(joined.viewerParticipation?.state).toBe('going');
    expect(isViewerGoing(optimisticLeave(joined))).toBe(false);
  });

  it('patches event inside discover infinite pages', () => {
    const pages = [{ data: [event(), event({ id: 'e2', title: 'Other' })], meta: {} }];
    const next = optimisticJoin(event());
    const patched = patchEventInDiscoverPages(pages, next);
    expect(patched?.[0]?.data[0]?.viewerParticipation?.state).toBe('going');
    expect(patched?.[0]?.data[1]?.viewerParticipation).toBeNull();
  });

  it('labels event kinds for UI', () => {
    expect(eventKindLabel('community')).toBe('community');
  });
});
