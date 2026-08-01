import type { PlayerArchetypeKey, PlayerArchetypeResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { ARCHETYPE_CATALOG, archetypeRarity, resolveArchetypePair } from './archetype-catalog';

/** The twelve keys locked by docs/07_SOCIAL/PLAYER_ARCHETYPES.md. */
const LOCKED_KEYS: PlayerArchetypeKey[] = [
  'collector',
  'completionist',
  'tryhard',
  'explorer',
  'reviewer',
  'speedrunner',
  'backlog_hoarder',
  'competitive',
  'story_lover',
  'indie_hunter',
  'achievement_hunter',
  'social_gamer',
];

function archetype(key: PlayerArchetypeKey, score: number): PlayerArchetypeResponse {
  return { key, score, awardedAt: '2026-01-01T00:00:00.000Z' };
}

describe('ARCHETYPE_CATALOG', () => {
  it('covers every locked key and introduces none of its own', () => {
    expect(Object.keys(ARCHETYPE_CATALOG).sort()).toEqual([...LOCKED_KEYS].sort());
  });

  it('gives every archetype an explanation, strengths and weaknesses', () => {
    for (const key of LOCKED_KEYS) {
      const profile = ARCHETYPE_CATALOG[key];
      expect(profile.title.length).toBeGreaterThan(0);
      expect(profile.explanation.length).toBeGreaterThan(0);
      expect(profile.strengths.length).toBeGreaterThan(0);
      expect(profile.weaknesses.length).toBeGreaterThan(0);
    }
  });
});

describe('archetypeRarity', () => {
  it('bands scores from common to legendary', () => {
    expect(archetypeRarity(0)).toBe('common');
    expect(archetypeRarity(34)).toBe('common');
    expect(archetypeRarity(35)).toBe('uncommon');
    expect(archetypeRarity(55)).toBe('rare');
    expect(archetypeRarity(75)).toBe('epic');
    expect(archetypeRarity(90)).toBe('legendary');
    expect(archetypeRarity(100)).toBe('legendary');
  });
});

describe('resolveArchetypePair', () => {
  it('returns empty slots when the engine awarded nothing', () => {
    const pair = resolveArchetypePair([]);
    expect(pair.primary).toBeNull();
    expect(pair.secondary).toBeNull();
    expect(pair.others).toEqual([]);
  });

  it('picks the two highest scores as primary and secondary', () => {
    const pair = resolveArchetypePair([
      archetype('collector', 40),
      archetype('reviewer', 95),
      archetype('explorer', 70),
    ]);
    expect(pair.primary?.profile.key).toBe('reviewer');
    expect(pair.secondary?.profile.key).toBe('explorer');
    expect(pair.others.map((item) => item.profile.key)).toEqual(['collector']);
  });

  it('leaves secondary empty when only one badge is awarded', () => {
    const pair = resolveArchetypePair([archetype('tryhard', 80)]);
    expect(pair.primary?.profile.key).toBe('tryhard');
    expect(pair.secondary).toBeNull();
  });

  it('breaks score ties deterministically by key', () => {
    const first = resolveArchetypePair([archetype('reviewer', 50), archetype('collector', 50)]);
    const second = resolveArchetypePair([archetype('collector', 50), archetype('reviewer', 50)]);
    expect(first.primary?.profile.key).toBe('collector');
    expect(second.primary?.profile.key).toBe('collector');
  });

  it('skips keys the client has no copy for rather than rendering a blank card', () => {
    const pair = resolveArchetypePair([
      { key: 'not_a_real_key' as PlayerArchetypeKey, score: 99, awardedAt: '2026-01-01' },
      archetype('collector', 10),
    ]);
    expect(pair.primary?.profile.key).toBe('collector');
  });

  it('attaches the rarity band to each resolved archetype', () => {
    const pair = resolveArchetypePair([archetype('reviewer', 92)]);
    expect(pair.primary?.rarity).toBe('legendary');
  });
});
