import { describe, expect, it } from 'vitest';

import { RSVP_STATES, resolveEventsView } from './hooks/event-model';

describe('event screens', () => {
  it('list loading uses skeleton contract', () => {
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
  });

  it('empty and ready with pull-to-refresh', () => {
    expect(
      resolveEventsView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: true,
        isFetchingNextPage: false,
        hasNextPage: false,
      }).status,
    ).toBe('empty');
    const ready = resolveEventsView({
      isPending: false,
      isError: false,
      error: null,
      items: [{ id: 'e1' }],
      isRefreshing: true,
      isFetchingNextPage: false,
      hasNextPage: false,
    });
    expect(ready.status).toBe('ready');
    expect(ready.isRefreshing).toBe(true);
  });

  it('detail actions contract: RSVP states + refresh', () => {
    expect(RSVP_STATES).toContain('going');
    expect(RSVP_STATES).toContain('interested');
    expect(RSVP_STATES).toContain('hosting');
  });

  it('offline retry contract', () => {
    const view = resolveEventsView({
      isPending: false,
      isError: true,
      error: new Error('offline'),
      items: [],
      isRefreshing: false,
      isFetchingNextPage: false,
      hasNextPage: false,
    });
    expect(view.status).toBe('error');
  });
});
