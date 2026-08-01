import type { UserStatisticsResponse } from '@gmrlog/types';
import { Skeleton, StatTile, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

export interface ProfileStatsGridProps {
  statistics: UserStatisticsResponse | null;
  isPending: boolean;
  onPressFollowers?: () => void;
  onPressFollowing?: () => void;
  onPressLibrary?: () => void;
}

/**
 * D3.27 Phase 2 — the six headline statistics from PROFILE_V2.md, laid out as a
 * wrapping grid so three-up on a phone becomes six-up on a tablet without a
 * breakpoint table.
 */
function ProfileStatsGridComponent({
  statistics,
  isPending,
  onPressFollowers,
  onPressFollowing,
  onPressLibrary,
}: ProfileStatsGridProps) {
  const theme = useTheme();

  if (isPending && statistics === null) {
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: theme.space('space.2'),
          paddingHorizontal: theme.space('space.4'),
        }}
      >
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton
            key={`stat-skeleton-${String(index)}`}
            shape="rect"
            height={theme.space('space.16')}
            width="31%"
          />
        ))}
      </View>
    );
  }

  if (statistics === null) {
    return null;
  }

  const tiles = [
    {
      key: 'played',
      value: String(statistics.gamesPlayed),
      label: 'Games played',
      onPress: onPressLibrary,
    },
    {
      key: 'completed',
      value: String(statistics.gamesCompleted),
      label: 'Completed',
      onPress: onPressLibrary,
    },
    {
      key: 'backlog',
      value: String(statistics.backlogSize),
      label: 'Backlog',
      onPress: onPressLibrary,
    },
    { key: 'reviews', value: String(statistics.reviewCount), label: 'Reviews' },
    {
      key: 'followers',
      value: String(statistics.followerCount),
      label: 'Followers',
      onPress: onPressFollowers,
    },
    {
      key: 'following',
      value: String(statistics.followingCount),
      label: 'Following',
      onPress: onPressFollowing,
    },
  ];

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel="Profile statistics"
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.space('space.2'),
        paddingHorizontal: theme.space('space.4'),
      }}
    >
      {tiles.map((tile) => (
        <StatTile
          key={tile.key}
          value={tile.value}
          label={tile.label}
          onPress={tile.onPress}
          // Three per row on a phone; the flex floor lets tablets fit more.
          style={{ flexBasis: '31%' }}
        />
      ))}
    </View>
  );
}

export const ProfileStatsGrid = memo(ProfileStatsGridComponent);
