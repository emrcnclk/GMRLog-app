import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function ComposerSkeleton() {
  const theme = useTheme();

  return (
    <View
      accessibilityLabel="Loading composer"
      style={{
        padding: theme.space('space.4'),
        gap: theme.space('space.4'),
      }}
    >
      <Skeleton shape="line" width="40%" height={theme.space('space.5')} />
      <Skeleton shape="rect" height={theme.space('space.12')} />
      <Skeleton shape="rect" height={theme.space('space.24')} />
      <Skeleton shape="line" width="50%" />
      <Skeleton shape="rect" height={theme.space('space.12')} />
    </View>
  );
}
