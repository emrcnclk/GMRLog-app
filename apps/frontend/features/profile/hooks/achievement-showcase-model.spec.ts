import type { AchievementCategoryValue, AchievementResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  achievementRarity,
  achievementTotals,
  buildShowcaseGroups,
  formatHolderPercent,
  presentAchievement,
  showcaseGroupForCategory,
} from './achievement-showcase-model';

function achievement(overrides: Partial<AchievementResponse> = {}): AchievementResponse {
  return {
    id: overrides.id ?? 'a1',
    key: overrides.key ?? 'first_log',
    title: overrides.title ?? 'First log',
    description: overrides.description ?? 'Log your first game.',
    category: overrides.category ?? 'logging',
    isHidden: overrides.isHidden ?? false,
    isRare: overrides.isRare ?? false,
    progress: overrides.progress ?? { current: 0, target: 1, state: 'locked' },
    awardedAt: overrides.awardedAt ?? null,
  };
}

const ALL_CATEGORIES: AchievementCategoryValue[] = [
  'logging',
  'reviewing',
  'friends',
  'collections',
  'tier_lists',
  'communities',
  'playtime',
  'consistency',
  'milestones',
  'rare',
  'hidden',
];

describe('showcaseGroupForCategory', () => {
  it('maps every locked category to a showcase group', () => {
    for (const category of ALL_CATEGORIES) {
      expect(showcaseGroupForCategory(category)).toBeDefined();
    }
  });

  it('folds rare and hidden into the legendary group', () => {
    expect(showcaseGroupForCategory('rare')).toBe('legendary');
    expect(showcaseGroupForCategory('hidden')).toBe('legendary');
  });
});

describe('achievementRarity', () => {
  it('treats rare + hidden as legendary', () => {
    expect(achievementRarity(achievement({ isRare: true, isHidden: true }))).toBe('legendary');
  });

  it('treats either emphasis flag as epic', () => {
    expect(achievementRarity(achievement({ isRare: true }))).toBe('epic');
    expect(achievementRarity(achievement({ category: 'hidden' }))).toBe('epic');
  });

  it('grades remaining badges by how demanding the target is', () => {
    expect(
      achievementRarity(achievement({ progress: { current: 0, target: 250, state: 'locked' } })),
    ).toBe('rare');
    expect(
      achievementRarity(achievement({ progress: { current: 0, target: 30, state: 'locked' } })),
    ).toBe('uncommon');
    expect(
      achievementRarity(achievement({ progress: { current: 0, target: 1, state: 'locked' } })),
    ).toBe('common');
  });
});

describe('presentAchievement', () => {
  it('redacts hidden achievements while locked', () => {
    const redacted = presentAchievement(
      achievement({ isHidden: true, title: 'Secret', description: 'Spoiler' }),
    );
    expect(redacted.title).toBe('Hidden achievement');
    expect(redacted.description).not.toBe('Spoiler');
  });

  it('reveals hidden achievements once awarded', () => {
    const revealed = presentAchievement(
      achievement({
        isHidden: true,
        title: 'Secret',
        progress: { current: 1, target: 1, state: 'awarded' },
      }),
    );
    expect(revealed.title).toBe('Secret');
  });

  it('leaves visible achievements untouched', () => {
    const input = achievement({ title: 'Plain' });
    expect(presentAchievement(input)).toBe(input);
  });
});

describe('buildShowcaseGroups', () => {
  it('returns no groups for an empty index', () => {
    expect(buildShowcaseGroups([])).toEqual([]);
  });

  it('drops groups that have no achievements', () => {
    const groups = buildShowcaseGroups([achievement({ category: 'logging' })]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe('completion');
  });

  it('sorts awarded badges ahead of locked ones', () => {
    const groups = buildShowcaseGroups([
      achievement({ id: 'locked', progress: { current: 0, target: 10, state: 'locked' } }),
      achievement({
        id: 'awarded',
        progress: { current: 10, target: 10, state: 'awarded' },
        awardedAt: '2026-01-01T00:00:00.000Z',
      }),
    ]);
    expect(groups[0]?.achievements[0]?.id).toBe('awarded');
    expect(groups[0]?.awardedCount).toBe(1);
  });

  it('puts the closest locked badge first among locked ones', () => {
    const groups = buildShowcaseGroups([
      achievement({ id: 'far', progress: { current: 1, target: 100, state: 'in_progress' } }),
      achievement({ id: 'near', progress: { current: 9, target: 10, state: 'in_progress' } }),
    ]);
    expect(groups[0]?.achievements[0]?.id).toBe('near');
  });
});

describe('formatHolderPercent (9.3)', () => {
  it('returns null for the fallback row (field absent)', () => {
    expect(formatHolderPercent(undefined)).toBeNull();
  });

  it('returns null when the server sends null (redacted or no denominator)', () => {
    expect(formatHolderPercent(null)).toBeNull();
  });

  it('formats a 0-holder achievement', () => {
    expect(formatHolderPercent(0)).toBe('0.0% of players');
  });

  it('formats a 100%-holder achievement', () => {
    expect(formatHolderPercent(100)).toBe('100.0% of players');
  });

  it('does not re-round a server rounding boundary value', () => {
    expect(formatHolderPercent(6.3)).toBe('6.3% of players');
  });
});

describe('achievementTotals', () => {
  it('handles an empty index without dividing by zero', () => {
    expect(achievementTotals([])).toEqual({ awarded: 0, total: 0, percent: 0 });
  });

  it('counts awarded badges and rounds the percentage', () => {
    const totals = achievementTotals([
      achievement({ id: '1', progress: { current: 1, target: 1, state: 'awarded' } }),
      achievement({ id: '2', progress: { current: 0, target: 1, state: 'locked' } }),
      achievement({ id: '3', progress: { current: 0, target: 1, state: 'locked' } }),
    ]);
    expect(totals).toEqual({ awarded: 1, total: 3, percent: 33 });
  });
});
