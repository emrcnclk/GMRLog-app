import type { StatisticsHistoryResponse, UserStatisticsResponse } from '@gmrlog/types';
import {
  ActivityHeatmap,
  Chip,
  DistributionBars,
  SCREEN_GUTTER,
  SectionKicker,
  StatTile,
  useTheme,
} from '@gmrlog/ui';
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
  const genreCounts = statistics?.favoriteGenreCounts ?? [];

  if (insights.length === 0 && genres.length === 0) {
    return null;
  }

  return (
    <View style={{ gap: theme.space('space.5') }}>
      {insights.length > 0 ? (
        <View
          style={{ gap: theme.space('space.3'), paddingHorizontal: theme.space(SCREEN_GUTTER) }}
        >
          <SectionKicker title="Gaming insights" />
          {/* A wrapping grid, not a strip: it takes the bounding hairlines above
              and below and **no** vertical dividers. A vertical rule that stops
              at a wrap point claims a column that does not continue, which is
              exactly the lie `MetricStrip` (single row by definition) avoids. */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingVertical: theme.space('space.1'),
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: theme.color('color.border.default'),
            }}
          >
            {insights.map((insight) => (
              <StatTile
                key={insight.key}
                value={insight.value}
                label={insight.label}
                caption={insight.caption}
                style={{ flexBasis: '50%', flexGrow: 0 }}
              />
            ))}
          </View>
        </View>
      ) : null}

      {genreCounts.length > 0 ? (
        <View
          style={{ paddingHorizontal: theme.space(SCREEN_GUTTER), gap: theme.space('space.3') }}
        >
          {/* §6's "Genre DNA bars" (9.5a) — `favoriteGenreCounts` carries the
              weights `genreCounts` always had server-side; the bar widths come
              from `DistributionBars` scaling each count against the peak, the
              same relative-length rule the Reviews rating histogram already
              uses, not a percentage the client invents. */}
          <SectionKicker title="Genre DNA" counter={String(genreCounts.length)} />
          <DistributionBars
            rows={genreCounts.map((entry) => ({ label: entry.genre, count: entry.count }))}
            accessibilityLabel="Favourite genres by play count"
          />
        </View>
      ) : genres.length > 0 ? (
        <View
          style={{ paddingHorizontal: theme.space(SCREEN_GUTTER), gap: theme.space('space.3') }}
        >
          {/* Fallback for a cached response from before 9.5a — no counts, so a
              plain list stands in for the bars rather than fabricating widths. */}
          <SectionKicker title="Genre DNA" counter={String(genres.length)} />
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
    <View style={{ gap: theme.space('space.3'), paddingHorizontal: theme.space(SCREEN_GUTTER) }}>
      {/* §6's play history. The kicker carries the window; the counter carries
          the fact the old two-line heading spelled out beneath it. */}
      <SectionKicker
        title="Play activity · 26 weeks"
        counter={
          mostActiveYear === null
            ? `${String(total)} events`
            : `${String(total)} · ${mostActiveYear.year}`
        }
      />

      <ActivityHeatmap
        days={days}
        weeks={26}
        accessibilityLabel={`Activity heatmap: ${String(total)} events over the last 26 weeks`}
      />
    </View>
  );
}

export const GamingInsights = memo(GamingInsightsComponent);
export const ActivityHeatmapSection = memo(ActivityHeatmapSectionComponent);
