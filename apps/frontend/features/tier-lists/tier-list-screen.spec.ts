import { describe, expect, it } from 'vitest';

import { resolveListView } from './hooks/tier-list-model';

describe('tier lists screen states', () => {
  it('loading empty ready', () => {
    expect(
      resolveListView({
        isPending: true,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('loading');
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: [],
        isRefreshing: false,
      }).status,
    ).toBe('empty');
    expect(
      resolveListView({
        isPending: false,
        isError: false,
        error: null,
        items: [{ id: 't1' }],
        isRefreshing: false,
      }).status,
    ).toBe('ready');
  });
});
