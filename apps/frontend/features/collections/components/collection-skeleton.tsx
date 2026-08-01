import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function CollectionSkeleton({ rows = 4 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading collections" style={{ gap: theme.space('space.3') }}>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={`collection-skel-${String(index)}`}
          style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}
        >
          <Skeleton shape="rect" height={theme.space('space.16')} />
          <Skeleton shape="line" width="55%" />
          <Skeleton shape="line" width="80%" />
        </View>
      ))}
    </View>
  );
}

export function CollectionDetailSkeleton() {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading collection" style={{ gap: theme.space('space.4') }}>
      <Skeleton shape="rect" height={theme.space('space.24')} />
      <View style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.3') }}>
        <Skeleton shape="line" width="60%" height={theme.space('space.5')} />
        <Skeleton shape="line" width="90%" />
        <Skeleton shape="rect" height={theme.space('space.12')} />
      </View>
    </View>
  );
}
