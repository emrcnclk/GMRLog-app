import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function DiscoverHubSkeleton() {
  const theme = useTheme();
  return (
    <View style={{ padding: theme.space('space.4'), gap: theme.space('space.3') }}>
      <Skeleton shape="line" width="40%" height={theme.space('space.5')} />
      <Skeleton shape="rect" height={theme.space('space.16')} />
      <Skeleton shape="rect" height={theme.space('space.16')} />
      <Skeleton shape="rect" height={theme.space('space.16')} />
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
