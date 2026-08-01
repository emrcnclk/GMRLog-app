import { describe, expect, it } from 'vitest';

describe('content navigation contracts', () => {
  it('routes game → reviews → create review', () => {
    const gameId = 'game-1';
    expect(`/(app)/game/${gameId}/reviews`).toBe('/(app)/game/game-1/reviews');
    expect({ pathname: '/(app)/review/create', params: { gameId } }).toEqual({
      pathname: '/(app)/review/create',
      params: { gameId: 'game-1' },
    });
  });

  it('routes game → posts → create post', () => {
    const gameId = 'game-1';
    expect(`/(app)/game/${gameId}/posts`).toBe('/(app)/game/game-1/posts');
    expect({ pathname: '/(app)/post/create', params: { gameId } }).toEqual({
      pathname: '/(app)/post/create',
      params: { gameId: 'game-1' },
    });
  });

  it('routes review/post tap to detail placeholders and edit modals', () => {
    expect(`/(app)/review/r1`).toBe('/(app)/review/r1');
    expect(`/(app)/review/r1/edit`).toBe('/(app)/review/r1/edit');
    expect(`/(app)/post/p1`).toBe('/(app)/post/p1');
    expect(`/(app)/post/p1/edit`).toBe('/(app)/post/p1/edit');
  });
});
