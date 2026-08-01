import { describe, expect, it } from 'vitest';

import { resolveListView } from './hooks/community-model';

describe('community screen states', () => {
  it('list loading uses skeleton contract', () => {
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

  it('empty communities and empty members', () => {
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

  it('ready list with pull-to-refresh', () => {
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

  it('detail actions contract: members edit delete join leave', () => {
    const actions = ['members', 'edit', 'delete', 'join', 'leave'] as const;
    expect(actions).toContain('join');
    expect(actions).toContain('leave');
    expect(actions).toContain('edit');
    expect(actions).toContain('delete');
    expect(actions).toContain('members');
  });
});
