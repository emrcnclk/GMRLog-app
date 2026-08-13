import type { PlayerArchetypeResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { buildDnaTraits } from './dna-traits';

function archetype(key: PlayerArchetypeResponse['key'], score: number): PlayerArchetypeResponse {
  return { key, score, awardedAt: '2026-01-01T00:00:00.000Z' };
}

describe('buildDnaTraits', () => {
  it('derives labels only from archetypes both sides share, ranked by combined score', () => {
    const viewer = [
      archetype('collector', 60),
      archetype('explorer', 90),
      archetype('tryhard', 50),
    ];
    const target = [
      archetype('collector', 80),
      archetype('reviewer', 70),
      archetype('tryhard', 45),
    ];

    // shared: collector (60+80=140), tryhard (50+45=95) — explorer/reviewer are one-sided
    expect(buildDnaTraits(viewer, target)).toEqual(['Collector', 'Tryhard']);
  });

  it('caps at 3 labels even when more than 3 archetypes are shared', () => {
    const viewer = [
      archetype('collector', 90),
      archetype('explorer', 80),
      archetype('reviewer', 70),
      archetype('tryhard', 60),
      archetype('social_gamer', 50),
    ];
    const target = [
      archetype('collector', 90),
      archetype('explorer', 80),
      archetype('reviewer', 70),
      archetype('tryhard', 60),
      archetype('social_gamer', 50),
    ];

    const traits = buildDnaTraits(viewer, target);
    expect(traits).toHaveLength(3);
    expect(traits).toEqual(['Collector', 'Explorer', 'Reviewer']);
  });

  it('returns [] rather than padding when nothing is shared', () => {
    const viewer = [archetype('collector', 90)];
    const target = [archetype('explorer', 90)];
    expect(buildDnaTraits(viewer, target)).toEqual([]);
  });

  it('returns [] when either side has no awarded archetypes at all', () => {
    expect(buildDnaTraits([], [archetype('collector', 90)])).toEqual([]);
    expect(buildDnaTraits([archetype('collector', 90)], [])).toEqual([]);
  });

  it('breaks ties deterministically by key when combined scores are equal', () => {
    const viewer = [archetype('tryhard', 50), archetype('collector', 50)];
    const target = [archetype('tryhard', 50), archetype('collector', 50)];
    // equal combined scores (100 each) — alphabetical key order wins the tie
    expect(buildDnaTraits(viewer, target)).toEqual(['Collector', 'Tryhard']);
  });
});
