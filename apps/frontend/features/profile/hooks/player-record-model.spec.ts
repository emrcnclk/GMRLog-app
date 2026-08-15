import type {
  AchievementResponse,
  LibraryEntryResponse,
  LibraryStatusValue,
  PlayerArchetypeKey,
  PlayerArchetypeResponse,
  ProfilePinResponse,
  UserStatisticsResponse,
} from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import {
  buildRecordStats,
  buildRecordTraits,
  formatRecordHeaderSlot,
  formatRecordSince,
  rarityRank,
  selectCompletedCase,
  selectRarestUnlocks,
  selectRecordBadges,
} from './player-record-model';

function achievement(overrides: Partial<AchievementResponse> = {}): AchievementResponse {
  return {
    id: overrides.id ?? 'a1',
    key: overrides.key ?? 'first_log',
    title: overrides.title ?? 'First log',
    description: overrides.description ?? 'Log your first game.',
    category: overrides.category ?? 'logging',
    isHidden: overrides.isHidden ?? false,
    isRare: overrides.isRare ?? false,
    progress: overrides.progress ?? { current: 1, target: 1, state: 'awarded' },
    awardedAt: overrides.awardedAt ?? '2026-01-01T00:00:00.000Z',
  };
}

function archetype(key: PlayerArchetypeKey, score: number): PlayerArchetypeResponse {
  return { key, score, awardedAt: '2026-01-01T00:00:00.000Z' };
}

function pin(overrides: Partial<ProfilePinResponse> = {}): ProfilePinResponse {
  return {
    id: overrides.id ?? 'pin-1',
    kind: overrides.kind ?? 'achievement',
    objectId: overrides.objectId ?? 'a1',
    position: overrides.position ?? 0,
  };
}

function entry(
  gameId: string,
  status: LibraryStatusValue,
  updatedAt: string,
): LibraryEntryResponse {
  return {
    gameId,
    game: { id: gameId, title: `Game ${gameId}`, slug: gameId, coverUrl: null },
    status,
    source: 'manual',
    updatedAt,
  };
}

function statistics(overrides: Partial<UserStatisticsResponse> = {}): UserStatisticsResponse {
  return {
    gamesLogged: 40,
    gamesPlayed: 20,
    gamesCompleted: 10,
    gamesDropped: 1,
    backlogSize: 0,
    wishlistSize: 0,
    hoursPlayed: 0,
    averageRating: null,
    completionPercent: 25,
    reviewCount: 0,
    postCount: 0,
    commentCount: 0,
    followerCount: 0,
    followingCount: 0,
    friendCount: 0,
    communityCount: 0,
    collectionCount: 0,
    tierListCount: 0,
    achievementCount: 0,
    favoriteGenres: [],
    favoritePlatform: null,
    favoriteDeveloper: null,
    favoritePublisher: null,
    profileCompletionPercent: 0,
    period: 'lifetime',
    joinedAt: '2025-03-04T00:00:00.000Z',
    ...overrides,
  };
}

describe('rarityRank', () => {
  it('ranks the locked ramp ascending', () => {
    expect(rarityRank('common')).toBeLessThan(rarityRank('uncommon'));
    expect(rarityRank('uncommon')).toBeLessThan(rarityRank('rare'));
    expect(rarityRank('rare')).toBeLessThan(rarityRank('epic'));
    expect(rarityRank('epic')).toBeLessThan(rarityRank('legendary'));
  });
});

describe('buildRecordTraits', () => {
  it('excludes the primary archetype and keeps the engine score verbatim', () => {
    const traits = buildRecordTraits([
      archetype('completionist', 94),
      archetype('explorer', 71),
      archetype('reviewer', 55),
    ]);

    expect(traits.map((trait) => trait.key)).toEqual(['explorer', 'reviewer']);
    expect(traits[0]).toEqual({ key: 'explorer', label: 'Explorer', value: '71' });
  });

  it('caps at the slot limit', () => {
    const traits = buildRecordTraits([
      archetype('completionist', 94),
      archetype('explorer', 71),
      archetype('reviewer', 55),
      archetype('collector', 44),
      archetype('tryhard', 40),
    ]);

    expect(traits).toHaveLength(3);
  });

  it('returns nothing when only the primary was awarded', () => {
    expect(buildRecordTraits([archetype('completionist', 94)])).toEqual([]);
  });
});

describe('selectRecordBadges', () => {
  it('takes the strongest awarded badges, rarest first', () => {
    const badges = selectRecordBadges([
      achievement({ id: 'common', progress: { current: 1, target: 1, state: 'awarded' } }),
      achievement({ id: 'legendary', isRare: true, isHidden: true }),
      achievement({ id: 'epic', isRare: true }),
      achievement({ id: 'rare', progress: { current: 100, target: 100, state: 'awarded' } }),
    ]);

    expect(badges.map((badge) => badge.achievement.id)).toEqual(['legendary', 'epic', 'rare']);
  });

  it('never shows a locked badge', () => {
    const badges = selectRecordBadges([
      achievement({
        id: 'locked',
        isRare: true,
        progress: { current: 0, target: 1, state: 'locked' },
      }),
      achievement({ id: 'awarded' }),
    ]);

    expect(badges.map((badge) => badge.achievement.id)).toEqual(['awarded']);
  });

  it('breaks a rarity tie on the most recent unlock', () => {
    const badges = selectRecordBadges([
      achievement({ id: 'older', awardedAt: '2025-01-01T00:00:00.000Z' }),
      achievement({ id: 'newer', awardedAt: '2026-06-01T00:00:00.000Z' }),
    ]);

    expect(badges.map((badge) => badge.achievement.id)).toEqual(['newer', 'older']);
  });

  it('9.5d — an equipped pin set overrides the rarity auto-selection, in the player’s own slot order', () => {
    const achievements = [
      achievement({ id: 'legendary', isRare: true, isHidden: true }),
      achievement({ id: 'common' }),
      achievement({ id: 'epic', isRare: true }),
    ];
    const pins = [
      pin({ id: 'p1', objectId: 'common', position: 0 }),
      pin({ id: 'p2', objectId: 'legendary', position: 1 }),
    ];

    const badges = selectRecordBadges(achievements, pins);

    // Equipped order (common, legendary) wins over rarity order
    // (legendary would otherwise lead) — the player's own choice, not a
    // re-derived ranking.
    expect(badges.map((badge) => badge.achievement.id)).toEqual(['common', 'legendary']);
  });

  it('9.5d — falls back to rarity auto-selection when nothing is equipped', () => {
    const achievements = [achievement({ id: 'common' }), achievement({ id: 'epic', isRare: true })];

    expect(selectRecordBadges(achievements, []).map((badge) => badge.achievement.id)).toEqual(
      selectRecordBadges(achievements).map((badge) => badge.achievement.id),
    );
  });

  it('9.5d — drops an equipped pin whose achievement is missing or not awarded, without falling back', () => {
    const achievements = [
      achievement({ id: 'awarded-1' }),
      achievement({ id: 'locked', progress: { current: 0, target: 1, state: 'locked' } }),
    ];
    const pins = [
      pin({ id: 'p1', objectId: 'awarded-1', position: 0 }),
      pin({ id: 'p2', objectId: 'locked', position: 1 }),
      pin({ id: 'p3', objectId: 'does-not-exist', position: 2 }),
    ];

    const badges = selectRecordBadges(achievements, pins);

    expect(badges.map((badge) => badge.achievement.id)).toEqual(['awarded-1']);
  });

  it('9.5d — ignores pins of other kinds and caps the equipped set at the slot limit', () => {
    const achievements = [
      achievement({ id: 'a' }),
      achievement({ id: 'b' }),
      achievement({ id: 'c' }),
      achievement({ id: 'd' }),
    ];
    const pins = [
      pin({ kind: 'game', objectId: 'a', position: 0 }),
      pin({ objectId: 'a', position: 1 }),
      pin({ objectId: 'b', position: 2 }),
      pin({ objectId: 'c', position: 3 }),
      pin({ objectId: 'd', position: 4 }),
    ];

    const badges = selectRecordBadges(achievements, pins);

    expect(badges.map((badge) => badge.achievement.id)).toEqual(['a', 'b', 'c']);
  });
});

describe('selectRarestUnlocks', () => {
  it('agrees with the card slots about which badge is best', () => {
    const items = [
      achievement({ id: 'a', isRare: true }),
      achievement({ id: 'b' }),
      achievement({ id: 'c', isRare: true, isHidden: true }),
    ];

    expect(selectRarestUnlocks(items).map((item) => item.id)).toEqual(
      selectRecordBadges(items).map((badge) => badge.achievement.id),
    );
  });
});

describe('buildRecordStats', () => {
  it('drops figures with no data rather than showing a dash', () => {
    const stats = buildRecordStats(statistics());

    expect(stats.map((stat) => stat.key)).toEqual(['completion', 'logged']);
  });

  it('fills all three slots once the figures are real', () => {
    const stats = buildRecordStats(
      statistics({ hoursPlayed: 892.4, reviewCount: 12, backlogSize: 30 }),
    );

    expect(stats).toEqual([
      { key: 'hours', label: 'Hours', value: '892h' },
      { key: 'completion', label: 'Completion', value: '25%' },
      { key: 'reviews', label: 'Reviews', value: '12' },
    ]);
  });

  it('returns nothing without statistics', () => {
    expect(buildRecordStats(null)).toEqual([]);
  });
});

describe('selectCompletedCase', () => {
  it('keeps only completed entries, most recent first', () => {
    const items = selectCompletedCase([
      entry('a', 'completed', '2025-01-01T00:00:00.000Z'),
      entry('b', 'playing', '2026-01-01T00:00:00.000Z'),
      entry('c', 'completed', '2026-06-01T00:00:00.000Z'),
    ]);

    expect(items.map((item) => item.gameId)).toEqual(['c', 'a']);
  });

  it('caps the case', () => {
    const items = Array.from({ length: 20 }, (_, index) =>
      entry(`g${String(index)}`, 'completed', '2026-01-01T00:00:00.000Z'),
    );

    expect(selectCompletedCase(items)).toHaveLength(12);
  });
});

describe('formatRecordSince', () => {
  it('returns null for a missing or unparsable date', () => {
    expect(formatRecordSince(null)).toBeNull();
    expect(formatRecordSince(undefined)).toBeNull();
    expect(formatRecordSince('not a date')).toBeNull();
  });

  it('formats a real timestamp', () => {
    expect(formatRecordSince('2025-03-04T00:00:00.000Z')).not.toBeNull();
  });
});

describe('formatRecordHeaderSlot', () => {
  it('prefers the card serial when present, over a real tenure fact', () => {
    expect(formatRecordHeaderSlot('0042', 'Mar 2025')).toBe('№ 0042');
  });

  it('falls back to the tenure fact when cardNumber is absent (pre-9.5b cache)', () => {
    expect(formatRecordHeaderSlot(undefined, 'Mar 2025')).toBe('Since Mar 2025');
    expect(formatRecordHeaderSlot(null, 'Mar 2025')).toBe('Since Mar 2025');
  });

  it('renders nothing when neither fact is available', () => {
    expect(formatRecordHeaderSlot(undefined, null)).toBeNull();
  });
});
