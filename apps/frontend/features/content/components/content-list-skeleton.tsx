import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function ContentListSkeleton({ rows = 6 }: { rows?: number }) {
  const theme = useTheme();

  return (
    <View accessibilityLabel="Loading content" style={{ gap: theme.space('space.1') }}>
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={`content-skel-${String(index)}`}
          style={{
            paddingHorizontal: theme.space('space.4'),
            paddingVertical: theme.space('space.3'),
            gap: theme.space('space.2'),
          }}
        >
          <Skeleton shape="line" width="55%" />
          <Skeleton shape="line" width="90%" />
          <Skeleton shape="line" width="70%" />
        </View>
      ))}
    </View>
  );
}
