import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function TierSkeleton({ rows = 4 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading tier lists">
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={`tier-skel-${String(index)}`}
          style={{
            paddingHorizontal: theme.space('space.4'),
            paddingVertical: theme.space('space.3'),
            gap: theme.space('space.2'),
          }}
        >
          <Skeleton shape="line" width="50%" />
          <Skeleton shape="line" width="70%" />
        </View>
      ))}
    </View>
  );
}

export function TierDetailSkeleton() {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading tier list" style={{ gap: theme.space('space.3') }}>
      <Skeleton shape="rect" height={theme.space('space.16')} />
      {Array.from({ length: 6 }, (_, index) => (
        <View
          key={`tier-row-skel-${String(index)}`}
          style={{ paddingHorizontal: theme.space('space.4'), gap: theme.space('space.2') }}
        >
          <Skeleton shape="line" width="20%" />
          <Skeleton shape="rect" height={theme.space('space.12')} />
        </View>
      ))}
    </View>
  );
}
