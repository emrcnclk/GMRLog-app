import { SCREEN_GUTTER, Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function CreatorHubSkeleton() {
  const theme = useTheme();

  return (
    <View accessibilityLabel="Loading creator hub">
      <Skeleton shape="rect" height={132} style={{ borderRadius: 0 }} />
      <View style={{ padding: theme.space(SCREEN_GUTTER), gap: theme.space('space.3') }}>
        <Skeleton shape="circle" width={theme.space('space.16')} height={theme.space('space.16')} />
        <Skeleton shape="line" width="45%" height={theme.space('space.5')} />
        <Skeleton shape="line" width="30%" />
        <Skeleton shape="rect" height={theme.space('space.12')} />
        <Skeleton shape="rect" height={theme.space('space.24')} />
      </View>
    </View>
  );
}
