import { Skeleton, SkeletonBlock, useTheme } from '@gmrlog/ui';
import { memo } from 'react';
import { View } from 'react-native';

function SettingsSkeletonComponent() {
  const theme = useTheme();
  return (
    <SkeletonBlock
      accessibilityLabel="Loading settings"
      style={{ gap: theme.space('space.3'), padding: theme.space('space.4') }}
    >
      {[0, 1, 2, 3, 4, 5].map((key) => (
        <View key={key} style={{ gap: theme.space('space.2') }}>
          <Skeleton shape="line" width="40%" height={16} />
          <Skeleton shape="rect" height={40} />
        </View>
      ))}
    </SkeletonBlock>
  );
}

export const SettingsSkeleton = memo(SettingsSkeletonComponent);
