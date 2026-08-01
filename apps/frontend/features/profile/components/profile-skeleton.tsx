import { Skeleton, useTheme } from '@gmrlog/ui';
import { View } from 'react-native';

export function ProfileSkeleton() {
  const theme = useTheme();
  const avatar = theme.space('space.16');

  return (
    <View
      accessibilityLabel="Loading profile"
      style={{
        padding: theme.space('space.4'),
        gap: theme.space('space.4'),
      }}
    >
      <Skeleton shape="circle" width={avatar} height={avatar} />
      <Skeleton shape="line" width="45%" height={theme.space('space.5')} />
      <Skeleton shape="line" width="30%" />
      <Skeleton shape="line" width="80%" />
      <View
        style={{
          flexDirection: 'row',
          gap: theme.space('space.3'),
          marginTop: theme.space('space.2'),
        }}
      >
        <Skeleton shape="rect" height={theme.space('space.12')} style={{ flex: 1 }} />
        <Skeleton shape="rect" height={theme.space('space.12')} style={{ flex: 1 }} />
        <Skeleton shape="rect" height={theme.space('space.12')} style={{ flex: 1 }} />
        <Skeleton shape="rect" height={theme.space('space.12')} style={{ flex: 1 }} />
      </View>
      <Skeleton shape="line" width="100%" height={theme.space('space.10')} />
      <Skeleton shape="rect" height={theme.space('space.20')} />
      <Skeleton shape="rect" height={theme.space('space.20')} />
    </View>
  );
}
