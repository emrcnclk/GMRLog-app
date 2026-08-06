import type { UserStatisticsResponse } from '@gmrlog/types';
import { MetricStrip, SCREEN_GUTTER, Skeleton, StatTile, useTheme } from '@gmrlog/ui';
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
 * §6's metric strip — "Games / Platinum / Followers / Following, each tappable".
 *
 * Recomposed from the six-tile wrapping grid 2.1 left behind: `MetricStrip` is a
 * single row by definition, so this is four cells with hairline verticals
 * between them and a hairline above and below, not six tiles that wrap. The two
 * figures the sixth-tile grid carried and this strip cannot — Backlog and
 * Reviews — are picked up by the record card's own three-stat row above, so
 * nothing is lost off the screen.
 *
 * **Platinum has no field behind it.** No per-entry completion percent exists
 * anywhere in the schema and the closed `LibraryStatusValue` vocabulary carries
 * a single completion signal. The cell shows `gamesCompleted` under its real
 * name instead — the same "use the field you have, under the name it has" call
 * 3.5 made for the collection footer's follower count. Backend follow-up in
 * TASKS.md.
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
          gap: theme.space('space.2'),
          paddingHorizontal: theme.space(SCREEN_GUTTER),
        }}
      >
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton
            key={`stat-skeleton-${String(index)}`}
            shape="rect"
            height={theme.space('space.16')}
            style={{ flex: 1 }}
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
      key: 'games',
      value: String(statistics.gamesLogged),
      label: 'Games',
      onPress: onPressLibrary,
    },
    {
      key: 'completed',
      value: String(statistics.gamesCompleted),
      label: 'Completed',
      onPress: onPressLibrary,
    },
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
    <MetricStrip
      accessibilityLabel="Profile statistics"
      style={{ marginHorizontal: theme.space(SCREEN_GUTTER) }}
    >
      {tiles.map((tile) => (
        <StatTile key={tile.key} value={tile.value} label={tile.label} onPress={tile.onPress} />
      ))}
    </MetricStrip>
  );
}

export const ProfileStatsGrid = memo(ProfileStatsGridComponent);
