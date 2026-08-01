import { ASPECT, Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

import { POSTER_WIDTH } from './game-poster-card';

/**
 * Discover's loading state is shaped like Discover.
 *
 * A skeleton that does not match the layout it precedes causes the reflow it
 * was meant to prevent, so this mirrors the real thing exactly: three rails,
 * each a title, a subtitle, and a row of poster-sized tiles at the same width
 * and aspect ratio the cards will occupy.
 */
export function DiscoverHubSkeleton({ rails = 3 }: { rails?: number }) {
  const theme = useTheme();
  const posterHeight = Math.round(POSTER_WIDTH / ASPECT.cover);

  return (
    <View style={{ paddingVertical: theme.space('space.4'), gap: theme.space('space.6') }}>
      {Array.from({ length: rails }, (_, railIndex) => (
        <View key={`rail-skeleton-${String(railIndex)}`} style={{ gap: theme.space('space.3') }}>
          <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.1') }}>
            <Skeleton shape="line" width="45%" height={theme.space('space.5')} />
            <Skeleton shape="line" width="30%" />
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: theme.space('space.3'),
              paddingHorizontal: theme.space('space.4'),
            }}
          >
            {Array.from({ length: 3 }, (_, tileIndex) => (
              <View
                key={`tile-skeleton-${String(tileIndex)}`}
                style={{ width: POSTER_WIDTH, gap: theme.space('space.2') }}
              >
                <Skeleton shape="rect" height={posterHeight} />
                <Skeleton shape="line" width="80%" />
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export function DiscoverCardSkeleton() {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
        paddingVertical: theme.space('space.3'),
      }}
    >
      <Skeleton shape="rect" width={theme.space('space.16')} height={theme.space('space.16')} />
      <View style={{ flex: 1, gap: theme.space('space.2') }}>
        <Skeleton shape="line" width="70%" />
        <Skeleton shape="line" width="45%" />
        <Skeleton shape="line" width="30%" />
      </View>
    </View>
  );
}

export function DiscoverListSkeleton({ rows = 6 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space('space.1') }}>
      {Array.from({ length: rows }, (_, index) => (
        <DiscoverCardSkeleton key={`discover-skeleton-${String(index)}`} />
      ))}
    </View>
  );
}

/**
 * Poster-grid loading state — mirrors the two-column browse layout so the
 * skeleton occupies exactly the space the cards will.
 */
export function DiscoverGridSkeleton({ rows = 3 }: { rows?: number }) {
  const theme = useTheme();
  const posterHeight = Math.round(POSTER_WIDTH / ASPECT.cover);

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space('space.4'),
      }}
    >
      {Array.from({ length: rows * 2 }, (_, index) => (
        <View
          key={`grid-skeleton-${String(index)}`}
          style={{ width: POSTER_WIDTH, gap: theme.space('space.2') }}
        >
          <Skeleton shape="rect" height={posterHeight} />
          <Skeleton shape="line" width="80%" />
        </View>
      ))}
    </View>
  );
}
