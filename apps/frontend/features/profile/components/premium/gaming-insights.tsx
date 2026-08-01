import type { StatisticsHistoryResponse, UserStatisticsResponse } from '@gmrlog/types';
import { ActivityHeatmap, Chip, StatTile, Text, useTheme } from '@gmrlog/ui';
import { memo, useMemo } from 'react';
import { View } from 'react-native';

import {
  buildGamingInsights,
  buildHeatmapDays,
  findMostActiveYear,
} from '../../hooks/profile-insights-model';

export interface GamingInsightsProps {
  statistics: UserStatisticsResponse | null;
}

/**
 * D3.27 Phase 2 — Gaming Insights.
 *
 * Completion rate · average rating · hours · favourite platform / studio /
 * genres. Every tile is dropped when its source value is absent, so the section
 * is either full of real numbers or not rendered at all.
 */
function GamingInsightsComponent({ statistics }: GamingInsightsProps) {
  const theme = useTheme();
  const insights = useMemo(() => buildGamingInsights(statistics), [statistics]);
  const genres = statistics?.favoriteGenres ?? [];

  if (insights.length === 0 && genres.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: theme.space('space.3') }}>
      <View style={{ paddingHorizontal: theme.space('space.4') }}>
        <Text role="title">Gaming insights</Text>
      </View>

      {insights.length > 0 ? (
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: theme.space('space.2'),
            paddingHorizontal: theme.space('space.4'),
          }}
        >
          {insights.map((insight) => (
            <StatTile
              key={insight.key}
              value={insight.value}
              label={insight.label}
              caption={insight.caption}
              style={{ flexBasis: '47%' }}
            />
          ))}
        </View>
      ) : null}

      {genres.length > 0 ? (
        <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}>
          <Text role="label" color="color.text.secondary">
            Favourite genres
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space('space.2') }}>
            {genres.slice(0, 8).map((genre) => (
              <Chip key={genre} interactive={false}>
                {genre}
              </Chip>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export interface ActivityHeatmapSectionProps {
  history: StatisticsHistoryResponse | null;
}

/**
 * GitHub-style activity grid, fed by `GET /me/statistics/history`. Completions,
 * reviews and collection growth are summed per day — the deliberate acts, not
 * passive playtime.
 */
function ActivityHeatmapSectionComponent({ history }: ActivityHeatmapSectionProps) {
  const theme = useTheme();
  const days = useMemo(() => buildHeatmapDays(history), [history]);
  const mostActiveYear = useMemo(() => findMostActiveYear(history), [history]);
  const total = useMemo(() => days.reduce((sum, day) => sum + day.value, 0), [days]);

  if (days.length === 0 || total === 0) {
    return null;
  }

  return (
    <View style={{ gap: theme.space('space.3') }}>
      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.1') }}>
        <Text role="title">Activity</Text>
        <Text role="meta" color="color.text.tertiary">
          {mostActiveYear === null
            ? `${String(total)} logged events`
            : `${String(total)} logged events · busiest year ${mostActiveYear.year}`}
        </Text>
      </View>

      <View style={{ paddingHorizontal: theme.space('space.4') }}>
        <ActivityHeatmap
          days={days}
          weeks={26}
          accessibilityLabel={`Activity heatmap: ${String(total)} events over the last 26 weeks`}
        />
      </View>
    </View>
  );
}

export const GamingInsights = memo(GamingInsightsComponent);
export const ActivityHeatmapSection = memo(ActivityHeatmapSectionComponent);
