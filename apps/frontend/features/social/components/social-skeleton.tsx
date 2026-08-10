import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function SocialSkeleton({ rows = 8 }: { rows?: number }) {
  const theme = useTheme();
  return (
    <View accessibilityLabel="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <View
          key={`social-skel-${String(index)}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space('space.3'),
            paddingHorizontal: theme.space('space.4'),
            paddingVertical: theme.space('space.3'),
          }}
        >
          <Skeleton shape="circle" width={44} height={44} />
          <View style={{ flex: 1, gap: theme.space('space.2') }}>
            <Skeleton shape="line" width="45%" />
            <Skeleton shape="line" width="30%" />
          </View>
        </View>
      ))}
    </View>
  );
}
