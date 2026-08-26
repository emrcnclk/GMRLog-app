// @vitest-environment happy-dom
import type { UserStatisticsResponse } from '@gmrlog/types';
import { describe, expect, it } from 'vitest';

import { renderWithTheme, screen } from '../../../../test-support/render';

import { ProfileStatsGrid } from './profile-stats-grid';

/**
 * §6's metric strip — "Games / Platinum / Followers / Following". The Platinum
 * cell had no field behind it until 13.1 and showed `gamesCompleted` under its
 * own name instead; now it has one, and the fallback has to survive, because
 * `platinumCount` is an additive optional field and a client can be holding a
 * cached response written before it existed.
 *
 * The fallback is the half worth a render test: a missing optional number that
 * reads as a confident `0` is the failure mode, and it looks identical to
 * working code from the outside.
 */
function statistics(overrides: Partial<UserStatisticsResponse> = {}): UserStatisticsResponse {
  return {
    gamesLogged: 40,
    gamesPlayed: 30,
    gamesCompleted: 12,
    gamesDropped: 2,
    backlogSize: 5,
    wishlistSize: 3,
    hoursPlayed: 100,
    averageRating: 4,
    completionPercent: 30,
    reviewCount: 4,
    postCount: 2,
    commentCount: 1,
    followerCount: 20,
    followingCount: 10,
    friendCount: 6,
    communityCount: 1,
    collectionCount: 1,
    tierListCount: 0,
    achievementCount: 8,
    favoriteGenres: [],
    ...overrides,
  } as UserStatisticsResponse;
}

describe('ProfileStatsGrid', () => {
  it('shows the Platinum cell once the server sends the count', () => {
    renderWithTheme(
      <ProfileStatsGrid statistics={statistics({ platinumCount: 3 })} isPending={false} />,
    );

    expect(screen.getByText('Platinum')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  // Never a zero it cannot justify: an older server sends no `platinumCount`,
  // and the honest cell is the completed shelf under its own name.
  it('falls back to Completed rather than inventing a zero', () => {
    renderWithTheme(<ProfileStatsGrid statistics={statistics()} isPending={false} />);

    expect(screen.getByText('Completed')).toBeTruthy();
    expect(screen.queryByText('Platinum')).toBeNull();
    expect(screen.getByText('12')).toBeTruthy();
  });

  it('reports a real zero when the server sends one', () => {
    renderWithTheme(
      <ProfileStatsGrid statistics={statistics({ platinumCount: 0 })} isPending={false} />,
    );

    expect(screen.getByText('Platinum')).toBeTruthy();
    expect(screen.getByText('0')).toBeTruthy();
  });

  // CLAUDE.md: counts are monospace `meta`, never body prose.
  it('draws the labels as metadata', () => {
    renderWithTheme(
      <ProfileStatsGrid statistics={statistics({ platinumCount: 3 })} isPending={false} />,
    );

    expect(getComputedStyle(screen.getByText('Platinum')).textTransform).toBe('uppercase');
  });

  it('keeps the loading state it always had', () => {
    renderWithTheme(<ProfileStatsGrid statistics={null} isPending />);

    expect(screen.queryByText('Platinum')).toBeNull();
    expect(screen.queryByText('Completed')).toBeNull();
  });
});
