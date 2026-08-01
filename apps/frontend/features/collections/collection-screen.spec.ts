import { describe, expect, it } from 'vitest';

import { resolveListView } from './hooks/collection-model';

describe('collections screen states', () => {
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
        items: [{ id: 'c1' }],
        isRefreshing: true,
      }).status,
    ).toBe('ready');
  });
});
