import type { EventResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  eventDatePlateDay,
  eventDatePlateMonth,
  eventKindLabel,
  eventRowMeta,
  eventRowTime,
  filterEventsByKind,
  formatEventStartsAt,
  groupEventsByWhen,
  isEventLive,
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

  it('filters events by the §21 filter-pill kinds', () => {
    const events = [
      event({ id: 't1', kind: 'tournament' }),
      event({ id: 'w1', kind: 'watch_party' }),
      event({ id: 'r1', kind: 'release_countdown' }),
      event({ id: 'r2', kind: 'release' }),
      event({ id: 'g1', kind: 'game' }),
    ];
    expect(filterEventsByKind(events, 'all')).toHaveLength(5);
    expect(filterEventsByKind(events, 'tournaments').map((e) => e.id)).toEqual(['t1']);
    expect(filterEventsByKind(events, 'watch_parties').map((e) => e.id)).toEqual(['w1']);
    expect(filterEventsByKind(events, 'launches').map((e) => e.id)).toEqual(['r1', 'r2']);
  });

  it('groups events into This week / Later by startsAt', () => {
    const now = Date.parse('2026-07-28T12:00:00.000Z');
    const events = [
      event({ id: 'today', startsAt: '2026-07-28T18:00:00.000Z' }),
      event({ id: 'in6days', startsAt: '2026-08-03T18:00:00.000Z' }),
      event({ id: 'in7days', startsAt: '2026-08-04T18:00:00.000Z' }),
      event({ id: 'far', startsAt: '2026-09-01T18:00:00.000Z' }),
    ];
    const grouped = groupEventsByWhen(events, now);
    expect(grouped.thisWeek.map((e) => e.id)).toEqual(['today', 'in6days']);
    expect(grouped.later.map((e) => e.id)).toEqual(['in7days', 'far']);
  });

  it('derives live state only from a real startsAt/endsAt window', () => {
    const now = Date.parse('2026-07-28T18:30:00.000Z');
    expect(
      isEventLive(
        event({ startsAt: '2026-07-28T18:00:00.000Z', endsAt: '2026-07-28T20:00:00.000Z' }),
        now,
      ),
    ).toBe(true);
    expect(
      isEventLive(
        event({ startsAt: '2026-07-28T18:00:00.000Z', endsAt: '2026-07-28T18:15:00.000Z' }),
        now,
      ),
    ).toBe(false);
    // No endsAt — no real signal the event hasn't ended, so never live.
    expect(isEventLive(event({ startsAt: '2026-07-28T18:00:00.000Z', endsAt: null }), now)).toBe(
      false,
    );
  });

  it('reads the date-plate day and month from a real startsAt', () => {
    expect(eventDatePlateDay('2026-08-03T18:00:00.000Z')).toBe(
      String(new Date('2026-08-03T18:00:00.000Z').getDate()),
    );
    expect(eventDatePlateMonth('2026-08-03T18:00:00.000Z')).toBe('AUG');
  });

  it('formats the row time', () => {
    expect(eventRowTime('2026-07-28T18:00:00.000Z')).toBe(
      new Date('2026-07-28T18:00:00.000Z').toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }),
    );
  });

  it('9.4 — degrades to time-only when attendeeCount is absent (pre-9.4 response)', () => {
    const withoutField = event();
    expect('attendeeCount' in withoutField).toBe(false);
    expect(eventRowMeta(withoutField)).toBe(eventRowTime(withoutField.startsAt));
  });

  it('9.4 — appends the attendee count, including zero, once present', () => {
    expect(eventRowMeta(event({ attendeeCount: 0 }))).toBe(
      `${eventRowTime('2026-07-28T18:00:00.000Z')} · 0 attending`,
    );
    expect(eventRowMeta(event({ attendeeCount: 12 }))).toBe(
      `${eventRowTime('2026-07-28T18:00:00.000Z')} · 12 attending`,
    );
  });
});
