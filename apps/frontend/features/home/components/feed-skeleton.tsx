import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

/** Single activity row shimmer. */
export function ActivitySkeleton() {
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
      <Skeleton shape="circle" width={theme.space('space.10')} height={theme.space('space.10')} />
      <View style={{ flex: 1, gap: theme.space('space.2') }}>
        <Skeleton shape="line" width="40%" />
        <Skeleton shape="line" width="75%" />
      </View>
      <Skeleton shape="rect" width={theme.space('space.10')} height={theme.space('space.10')} />
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

/** Full Home loading chrome — header bones + feed skeleton. */
export function HomeSkeleton() {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: theme.color('color.background.primary') }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.space('space.4'),
          paddingVertical: theme.space('space.3'),
          borderBottomWidth: 1,
          borderBottomColor: theme.color('color.border.default'),
        }}
      >
        <Skeleton shape="line" width={96} height={theme.space('space.5')} />
        <View style={{ flexDirection: 'row', gap: theme.space('space.3') }}>
          <Skeleton
            shape="circle"
            width={theme.space('space.10')}
            height={theme.space('space.10')}
          />
          <Skeleton
            shape="circle"
            width={theme.space('space.10')}
            height={theme.space('space.10')}
          />
        </View>
      </View>
      <FeedSkeleton />
    </View>
  );
}
