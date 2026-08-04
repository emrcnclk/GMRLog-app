import { SCREEN_GUTTER, Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function NotificationSkeleton({ rows = 8 }: { rows?: number }) {
  const theme = useTheme();

  return (
    <View accessibilityLabel="Loading notifications">
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={`notification-skel-${String(index)}`}
          style={{
            flexDirection: 'row',
            gap: theme.space('space.3'),
            paddingHorizontal: theme.space(SCREEN_GUTTER),
            paddingVertical: theme.space('space.3'),
          }}
        >
          <Skeleton shape="circle" width={theme.space('space.8')} height={theme.space('space.8')} />
          <View style={{ flex: 1, gap: theme.space('space.2') }}>
            <Skeleton shape="line" width="40%" />
            <Skeleton shape="line" width="85%" />
          </View>
        </View>
      ))}
    </View>
  );
}
