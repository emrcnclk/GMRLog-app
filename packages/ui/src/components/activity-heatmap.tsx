import { useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';

import { useTheme } from '../theme/theme-provider';

import { Text } from './text';

export interface HeatmapDay {
  /** ISO `YYYY-MM-DD`. */
  date: string;
  value: number;
}

export interface ActivityHeatmapProps {
  days: readonly HeatmapDay[];
  /** Number of trailing weeks to render. */
  weeks?: number;
  /** Last day of the range; defaults to the most recent supplied day. */
  endDate?: string;
  cellSize?: number;
  cellGap?: number;
  /** Announced summary; a per-cell grid would be unusable with a screen reader. */
  accessibilityLabel?: string;
  style?: ViewStyle | ViewStyle[];
}

const DAYS_PER_WEEK = 7;
const MS_PER_DAY = 86_400_000;

interface HeatmapCell {
  key: string;
  value: number;
  future: boolean;
}

interface HeatmapColumn {
  key: string;
  cells: HeatmapCell[];
}

function toIsoDay(time: number): string {
  return new Date(time).toISOString().slice(0, 10);
}

/** Parse `YYYY-MM-DD` as UTC midnight so local timezone can never shift a column. */
function parseIsoDay(iso: string): number {
  return Date.parse(`${iso.slice(0, 10)}T00:00:00.000Z`);
}

/**
 * GitHub-style contribution grid: one column per week, one cell per day, oldest
 * on the left. Intensity is bucketed against the busiest day in range, so a
 * casual player and a daily logger both get a readable spread.
 */
export function ActivityHeatmap({
  days,
  weeks = 26,
  endDate,
  cellSize = 11,
  cellGap = 3,
  accessibilityLabel,
  style,
}: ActivityHeatmapProps) {
  const theme = useTheme();

  const { columns, peak, total } = useMemo(() => {
    const byDate = new Map<string, number>();
    for (const day of days) {
      const key = day.date.slice(0, 10);
      byDate.set(key, (byDate.get(key) ?? 0) + day.value);
    }

    const explicitEnd = endDate ?? [...byDate.keys()].sort().at(-1);
    const endTime = explicitEnd === undefined ? Date.now() : parseIsoDay(explicitEnd);
    // Wind forward to the end of that week so the final column is never clipped.
    const endDayOfWeek = new Date(endTime).getUTCDay();
    const gridEnd = endTime + (DAYS_PER_WEEK - 1 - endDayOfWeek) * MS_PER_DAY;
    const cellCount = weeks * DAYS_PER_WEEK;
    const gridStart = gridEnd - (cellCount - 1) * MS_PER_DAY;

    const grid: HeatmapColumn[] = [];
    let max = 0;
    let sum = 0;

    for (let week = 0; week < weeks; week += 1) {
      const cells: HeatmapCell[] = [];
      for (let day = 0; day < DAYS_PER_WEEK; day += 1) {
        const time = gridStart + (week * DAYS_PER_WEEK + day) * MS_PER_DAY;
        const iso = toIsoDay(time);
        const value = byDate.get(iso) ?? 0;
        max = Math.max(max, value);
        sum += value;
        cells.push({ key: iso, value, future: time > endTime });
      }
      grid.push({ key: toIsoDay(gridStart + week * DAYS_PER_WEEK * MS_PER_DAY), cells });
    }

    return { columns: grid, peak: max, total: sum };
  }, [days, endDate, weeks]);

  const empty = theme.color('color.background.tertiary');
  const accent = theme.color('color.accent.default');

  // Four filled buckets above zero, matching the familiar contribution ramp.
  const levelOpacity = [0, 0.28, 0.5, 0.74, 1] as const;

  const resolveCell = (
    value: number,
    future: boolean,
  ): { backgroundColor: string; opacity: number } => {
    if (future) {
      return { backgroundColor: empty, opacity: 0.4 };
    }
    if (value <= 0 || peak <= 0) {
      return { backgroundColor: empty, opacity: 1 };
    }
    const bucket = Math.min(4, Math.max(1, Math.ceil((value / peak) * 4))) as 1 | 2 | 3 | 4;
    return { backgroundColor: accent, opacity: levelOpacity[bucket] };
  };

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={
        accessibilityLabel ??
        `Activity heatmap: ${String(total)} logged across the last ${String(weeks)} weeks`
      }
      style={style}
    >
      <View style={{ flexDirection: 'row', gap: cellGap }}>
        {columns.map((column) => (
          <View key={column.key} style={{ gap: cellGap }}>
            {column.cells.map((cell) => {
              const resolved = resolveCell(cell.value, cell.future);
              return (
                <View
                  key={cell.key}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    borderRadius: theme.radius('radius.sm'),
                    backgroundColor: resolved.backgroundColor,
                    opacity: resolved.opacity,
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: cellGap,
          marginTop: theme.space('space.2'),
        }}
      >
        <Text role="meta" color="color.text.tertiary">
          Less
        </Text>
        {levelOpacity.map((opacity, index) => (
          <View
            key={`legend-${String(index)}`}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: theme.radius('radius.sm'),
              backgroundColor: index === 0 ? empty : accent,
              opacity: index === 0 ? 1 : opacity,
            }}
          />
        ))}
        <Text role="meta" color="color.text.tertiary">
          More
        </Text>
      </View>
    </View>
  );
}
