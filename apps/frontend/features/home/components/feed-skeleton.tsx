import { SCREEN_GUTTER, Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

/** Single activity row shimmer — matches `ActivityCard`'s attribution-row shape. */
export function ActivitySkeleton() {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.space('space.3'),
        paddingHorizontal: theme.space(SCREEN_GUTTER),
        paddingVertical: theme.space('space.4'),
      }}
    >
      <Skeleton shape="circle" width={theme.space('space.8')} height={theme.space('space.8')} />
      <View style={{ flex: 1, gap: theme.space('space.2') }}>
        <Skeleton shape="line" width="40%" />
        <Skeleton shape="line" width="75%" />
      </View>
      <Skeleton shape="circle" width={theme.space('space.8')} height={theme.space('space.8')} />
    </View>
  );
}

/** Feed list shimmer stack. */
export function FeedSkeleton({ rows = 6 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space('space.1') }}>
      {Array.from({ length: rows }, (_, index) => (
        <ActivitySkeleton key={`activity-skeleton-${String(index)}`} />
      ))}
    </View>
  );
}

/**
 * Full Home loading chrome — just the feed skeleton. `HomeHeader` (wordmark,
 * search/bell, the filter tabs) already renders unconditionally above this in
 * `HomeScreen` regardless of feed status, so a second, duplicate header-bones
 * bar here would sit underneath the real, already-interactive one — restyled
 * away rather than kept, since it was never visible content, only dead weight
 * the new tab row would have made more obviously mismatched.
 */
export function HomeSkeleton() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.color('color.background.primary') }}>
      <FeedSkeleton />
    </View>
  );
}
