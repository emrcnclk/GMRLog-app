import { describe, expect, it } from 'vitest';

import { resolveListView } from './hooks/messaging-model';

describe('messaging screen states', () => {
  it('loading uses skeleton contract', () => {
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

  it('empty inbox and empty thread', () => {
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

  it('ready list with refresh flag', () => {
    const view = resolveListView({
      isPending: false,
      isError: false,
      error: null,
      items: [{ id: 'c1' }],
      isRefreshing: true,
    });
    expect(view.status).toBe('ready');
    expect(view.isRefreshing).toBe(true);
  });
});
