import { Text, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import type { ProfileStatsModel } from '../hooks/profile-model';

export interface ProfileStatsProps {
  stats: ProfileStatsModel;
}

interface StatCellProps {
  label: string;
  value: string;
}

function StatCell({ label, value }: StatCellProps) {
  const theme = useTheme();
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${value}`}
      style={{
        flex: 1,
        alignItems: 'center',
        gap: theme.space('space.1'),
        minHeight: theme.space('space.12'),
        justifyContent: 'center',
      }}
    >
      <Text role="title" color="color.text.primary">
        {value}
      </Text>
      <Text role="caption" color="color.text.secondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/**
 * Restrained two-row identity composition — games, completion, friends, reviews.
 * Prefer `/me/statistics`; hub fallback keeps the same layout.
 */
export function ProfileStats({ stats }: ProfileStatsProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        marginHorizontal: theme.space('space.4'),
        marginBottom: theme.space('space.3'),
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: theme.color('color.border.default'),
        backgroundColor: theme.color('color.background.primary'),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: theme.space('space.3'),
        }}
      >
        <StatCell label="Games" value={String(stats.games)} />
        <StatCell label="Done" value={String(stats.completed)} />
        <StatCell label="Complete" value={`${String(stats.completionPercent)}%`} />
        <StatCell label="Friends" value={String(stats.friends)} />
      </View>
      <View
        style={{
          flexDirection: 'row',
          paddingVertical: theme.space('space.3'),
          borderTopWidth: 1,
          borderTopColor: theme.color('color.border.default'),
        }}
      >
        <StatCell label="Playing" value={String(stats.playing)} />
        <StatCell label="Reviews" value={String(stats.reviews)} />
        <StatCell label="Lists" value={String(stats.lists)} />
        <View style={{ flex: 1 }} />
      </View>
    </View>
  );
}
