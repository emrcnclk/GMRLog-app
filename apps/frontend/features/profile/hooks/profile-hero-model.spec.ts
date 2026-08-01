import { describe, expect, it } from 'vitest';

import type { ProfileHeroResponse } from '@gmrlog/types';

import {
  formatCompletionPercent,
  formatHeroArchetypes,
  formatMemberSince,
  formatSteamLevel,
  hasHeroContent,
  reputationBadgeLabel,
} from './profile-hero-model';

describe('profile hero model', () => {
  it('formats hero metrics', () => {
    expect(formatSteamLevel(12)).toBe('12');
    expect(formatSteamLevel(null)).toBe('—');
    expect(formatCompletionPercent(67.4)).toBe('67%');
    expect(formatMemberSince('2024-03-01T00:00:00.000Z')).toMatch(/2024/);
    expect(reputationBadgeLabel('helpful_reviewer')).toBe('Helpful Reviewer');
    expect(formatHeroArchetypes(['explorer', 'unknown_kind'])).toEqual([
      'Explorer',
      'unknown kind',
    ]);
  });

  it('detects empty vs populated hero payloads', () => {
    const empty: ProfileHeroResponse = {
      steamLevel: null,
      completionPercent: null,
      currentlyPlayingGameId: null,
      favoriteGameIds: [],
      pinnedCollectionId: null,
      archetypeKeys: [],
      memberSince: '2024-01-01T00:00:00.000Z',
      topGenre: null,
      totalHours: null,
      reputationBadges: [],
      creatorBadge: false,
    };
    expect(hasHeroContent(empty)).toBe(false);
    expect(hasHeroContent({ ...empty, creatorBadge: true })).toBe(true);
  });
});
