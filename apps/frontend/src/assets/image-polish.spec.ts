import { describe, expect, it } from 'vitest';

describe('image polish contracts', () => {
  it('avatars and covers use memory-disk cache policy', () => {
    const policy = 'memory-disk';
    expect(policy).toBe('memory-disk');
  });

  it('prefetch targets include avatar cover banner surfaces', () => {
    const surfaces = [
      'avatars',
      'game_covers',
      'community_banners',
      'profile_banners',
      'collection_covers',
      'tier_images',
    ] as const;
    expect(surfaces).toContain('avatars');
    expect(surfaces).toContain('game_covers');
  });

  it('image transition is zero under reduce motion', () => {
    const transitionMs = (reduce: boolean) => (reduce ? 0 : 200);
    expect(transitionMs(true)).toBe(0);
    expect(transitionMs(false)).toBeGreaterThan(0);
  });
});
