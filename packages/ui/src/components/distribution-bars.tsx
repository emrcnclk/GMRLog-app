import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { ProgressBar } from './progress-bar';
import { Text } from './text';

export interface DistributionRow {
  /** Left-hand label, e.g. "5★". */
  label: string;
  count: number;
}

export interface DistributionBarsProps {
  rows: readonly DistributionRow[];
  /** Shown when every count is zero. */
  emptyLabel?: string;
  /** Bar track height, px. Default 8 — Game hub's reviews ramp wants 3. */
  barHeight?: number;
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Horizontal histogram — rating distribution on a profile, score spread on a game.
 * Bars are scaled against the largest bucket, not the total, so a lopsided
 * distribution still shows shape instead of one bar and four slivers.
 */
export function DistributionBars({
  rows,
  emptyLabel = 'No ratings yet',
  barHeight = 8,
  accessibilityLabel,
  style,
}: DistributionBarsProps) {
  const theme = useTheme();
  const peak = rows.reduce((max, row) => Math.max(max, row.count), 0);
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  if (total === 0) {
    return (
      <View style={style}>
        <Text role="body" color="color.text.tertiary">
          {emptyLabel}
        </Text>
      </View>
    );
  }

  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}
      style={[{ gap: theme.space('space.2') }, style]}
    >
      {rows.map((row) => (
        <View
          key={row.label}
          style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space('space.3') }}
        >
          <Text
            role="meta"
            color="color.text.secondary"
            numberOfLines={1}
            style={{ width: theme.space('space.12'), textAlign: 'right' }}
          >
            {row.label}
          </Text>
          <ProgressBar
            value={row.count}
            target={peak}
            height={barHeight}
            accessibilityLabel={`${row.label}: ${String(row.count)} of ${String(total)}`}
            style={{ flex: 1 }}
          />
          <Text
            role="meta"
            color="color.text.tertiary"
            style={{ width: theme.space('space.10'), textAlign: 'right' }}
          >
            {String(row.count)}
          </Text>
        </View>
      ))}
    </View>
  );
}
